# Nuvei / Datafast (Paymentez) integration

This adds a full Nuvei/Datafast card-payment engine **alongside** the existing
Paddle path. It is **dormant** until `NUVEI_ENABLED=true`, so the live Paddle
billing is untouched while Nuvei is validated in the testing environment.

Paddle is intentionally **not removed yet**. The client's own plan is: build in
staging → submit to Nuvei → get production credentials → written production
approval before real cards. Removing Paddle before Nuvei passes production
validation would leave production with no working billing. The Paddle teardown is
the final **cutover** step (checklist at the bottom).

Docs used: https://developers.dev.paymentez.com/api/

---

## What was built

**Backend (`ninja_backend/src/nuvei/`)**
- `nuvei-client.service.ts` — Paymentez HTTP client: `Auth-Token` builder
  (`base64(APP_CODE;ts;sha256(APP_KEY+ts))`), Add Card, Debit with token, Debit
  with 3DS, Refund, transaction verify, Link to Pay. Staging/production base URLs.
- `nuvei.service.ts` — the engine: subscription **state machine**
  (`pending_activation → trialing → active → payment_failed → past_due →
  canceled → suspended → refunded`), activation charge with 3DS, encrypted card
  tokenization, hourly **recurring debit** (idempotent per billing period, no 3DS
  per Nuvei's Recurrence rule, never charges canceled/suspended/refunded),
  **verified callback** handling, refunds (duplicate-guarded), Link to Pay, and a
  **confirmation email** after every transaction.
- `nuvei-crypto.util.ts` — AES-256-GCM encryption of the stored card token.
- `nuvei.controller.ts` — routes under `/api/nuvei/*`.
- Migration `162_nuvei_payments.sql` (also self-healed at runtime).

**Frontend (`AI-Listo/src`)**
- `pages/checkout/NuveiCheckout.jsx` (`/nuvei-checkout?plan=business`) — checkout
  with every required disclosure (activation fee, trial, monthly price, first
  billing date, auto-renewal, cancellation), an explicit consent checkbox, the
  PCI-safe card form, and 3DS redirect handling.
- `pages/checkout/nuveiSdk.js` — loads Nuvei's browser tokenization SDK
  (`payment_sdk_stable.min.js`) and wraps `PaymentGateway.generate_tokenize`.
- `pages/admin/NuveiLinkToPay.jsx` (`/admin/nuvei-payments`) — generate a
  Link-to-Pay for a custom Web Solutions quotation (no fixed prices).
- `api/nuveiApi.js` — API helpers.

**Approved only when** `status === "success"` **and** `status_detail === 3`.

### Card entry is PCI-safe (verified against staging)

The card is tokenized **in the browser** with Nuvei's SDK, so the PAN/CVV never
reach our servers. This was confirmed live: the backend's server-side Add Card
with a raw card number returns `401 "Application is not PCI"` on the staging app,
while the same `Auth-Token` succeeds on non-PCI endpoints (`GET /v2/card/list`
returned `200`). So:
- **Primary path:** browser SDK tokenizes → `POST /api/nuvei/save-token` stores
  the token → `POST /api/nuvei/activate` charges it (server-to-server, 3DS).
- `POST /api/nuvei/card` (server-side Add Card with a PAN) is kept for a
  PCI-certified environment only; it will 401 until Nuvei enables PCI on the app.

The `Auth-Token` algorithm, request shapes, and base URLs are all verified
correct against `ccapi-stg.paymentez.com`.

---

## Environment variables

```
# --- turn the engine on (default OFF) ---
NUVEI_ENABLED=false
NUVEI_RECURRING_ENABLED=true       # allow the hourly recurring sweep when enabled
NUVEI_ENVIRONMENT=staging          # staging | production

# --- SERVER credentials (backend only — never expose) ---
NUVEI_SERVER_APP_CODE=
NUVEI_SERVER_APP_KEY=

# --- CLIENT credentials (publishable, for a future browser SDK) ---
NUVEI_CLIENT_APP_CODE=
NUVEI_CLIENT_APP_KEY=

# --- token encryption (required before any card is stored) ---
NUVEI_TOKEN_ENC_KEY=               # 64 hex chars, or 32-byte base64, or a strong passphrase

# --- callback ---
NUVEI_CALLBACK_URL=https://backend.cortexaaicrm.com/api/nuvei/callback
NUVEI_CALLBACK_TOKEN=              # optional shared secret checked on the callback (recommended)
NUVEI_VERIFY_ENABLED=false         # re-query Nuvei server-side to confirm a callback (see pending items)
```

Staging development credentials supplied by the client go in
`NUVEI_SERVER_APP_CODE/KEY` and `NUVEI_CLIENT_APP_CODE/KEY`. Keep the SERVER
values backend-only; they never appear in frontend code, logs, or Git.

Staging base URLs used automatically: `https://ccapi-stg.paymentez.com` (cards)
and `https://noccapi-stg.paymentez.com` (Link to Pay).

Test cards (staging): `4111 1111 1111 1111` = SUCCESS, `4242 4242 4242 4242` =
FAILURE, exp `11/27`, CVV `634`.

---

## Endpoints (`/api` prefix)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/nuvei/config` | public | enabled flag, environment, client app code, plans |
| POST | `/api/nuvei/save-token` | user | store a browser-tokenized card (primary path) |
| POST | `/api/nuvei/card` | user | server-side Add Card (PCI-certified apps only) |
| POST | `/api/nuvei/activate` | user | charge activation (3DS) + start trial + provision |
| POST | `/api/nuvei/cancel` | user | cancel own subscription |
| POST | `/api/nuvei/callback` | public | **verified** Nuvei webhook — activates service |
| POST | `/api/nuvei/refund` | admin | refund a transaction |
| POST | `/api/nuvei/link-to-pay` | admin | custom Web Solutions payment link |

---

## Required test checklist (staging, with `NUVEI_ENABLED=true`)

- [ ] Successful activation payment (test card `4111…`)
- [ ] Failed activation payment (test card `4242…`)
- [ ] 3DS success / failure / customer abandonment
- [ ] Successful and failed tokenization (Add Card)
- [ ] Web debit with token using 3DS
- [ ] First recurring charge after a simulated 14-day trial
- [ ] Scheduled recurrence works **without** 3DS
- [ ] Failed recurring charge → `past_due`, retried
- [ ] Cancellation before the first monthly charge (no charge)
- [ ] Duplicate-charge prevention (same period never charged twice)
- [ ] Valid / invalid / duplicate / delayed callbacks
- [ ] Successful and failed refunds
- [ ] Confirmation emails sent (needs `SENDGRID_*` set)
- [ ] `transaction_ID` and `authorization_code` stored (see `nuvei_transactions`)

To simulate the 14-day trial without waiting, set a subscription's
`next_billing_date` to a past timestamp in `nuvei_subscriptions` and let the
hourly sweep run.

---

## Pending confirmation from Nuvei (gates go-live — not code)

These are on the client's own list; the exact behaviour is account-specific and
the integration exposes config points for each:

1. Whether Add Card + the activation payment happen in one request or two.
2. Whether the activation must use Checkout first, then Add Card.
3. Whether the same token can be charged after 14 days and monthly thereafter.
4. Whether recurring charges are configured as merchant-initiated transactions.
5. Whether a separate EntityId / recurring-authorization credential is required.
6. The exact **webhook signature/verification** scheme for this merchant
   (`NUVEI_CALLBACK_TOKEN` + `NUVEI_VERIFY_ENABLED` are the hooks for it).
7. Whether production credentials enable Checkout, Add Card, Debit with Token,
   Recurrence, Refund, Callback, and 3DS.

Until #6 is confirmed, the callback is validated by matching the order we
created (`dev_reference`), requiring `status=success` + `status_detail=3`, and
checking the amount — plus the optional `NUVEI_CALLBACK_TOKEN`.

---

## Cutover checklist (remove Paddle — do only after Nuvei production approval)

1. Nuvei staging tests all pass and Nuvei approves the integration for production.
2. Obtain production SERVER + CLIENT credentials; set `NUVEI_ENVIRONMENT=production`.
3. Point the pricing/checkout UI at `/nuvei-checkout` (flip the provider switch).
4. Disable new Paddle checkouts; keep the Paddle webhook running only long enough
   to finish any in-flight subscriptions.
5. Remove Paddle SDK/UI/env/branding: `payments/paddle.*`, `paddleCheckout.js`,
   Paddle.js include, `PADDLE_*` env, "powered by Paddle" copy in `en/es/pt.json`
   and the legal pages.
6. **Preserve** historical Paddle records (`subscriptions`, `payments`,
   `webhook_events`, `paddle_subscription_id`) for accounting/audit — do not drop.
7. Do **not** reuse Paddle tokens — customers re-register cards through Nuvei.
