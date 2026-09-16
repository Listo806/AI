# Nuvei and Datafast integration, status and evidence

Last updated 16 September 2026.

Start here:

- [TEST_RESULTS.md](TEST_RESULTS.md) — every component, its state, what is still needed from Nuvei, and what is not yet tested with the reason.
- [ADMIN_ACCESS_VERIFICATION.md](ADMIN_ACCESS_VERIFICATION.md) — the admin access check on support@cortexaaicrm.com, point by point, on the live site.

## Evidence

Subscription activated on the approved checkout:

![Subscription activated](screenshots/subscription-activated.png)

Checkout in English, Spanish and Portuguese. The card fields come from Nuvei's tokenization iframe, which supports English and Spanish only:

![English](screenshots/checkout-english.png)
![Spanish](screenshots/checkout-spanish.png)
![Portuguese](screenshots/checkout-portuguese.png)

A gateway refusal is shown as a processing problem, never as a card decline, and grants no access:

![Gateway error handled](screenshots/gateway-error-handled.png)

A refunded customer keeps their login on the free tier and can subscribe again:

![Refunded customer keeps access](screenshots/refunded-customer-keeps-access.png)

A card payment entered and submitted on Nuvei's own hosted Checkout page:

![Nuvei hosted checkout](screenshots/nuvei-hosted-checkout-payment.png)

The Link to Pay link Nuvei returns currently opens a 404 page on Nuvei's own site, because the Link to Pay application is not activated:

![Link to Pay 404](screenshots/link-to-pay-404.png)

Admin area working for support@cortexaaicrm.com, before and after signing out and back in:

![Admin area](screenshots/admin-area-working.png)
![Admin after re-login](screenshots/admin-after-relogin.png)

## What we need from Nuvei

1. Register the callback URL on the merchant application: `https://backend.cortexaaicrm.com/api/nuvei/callback`
2. Activate the Link to Pay application. The credentials supplied, FFWSTG-EC-SERVER, are rejected with "Application not found", and links created under the cards application return 404.
3. Enable 3D Secure on the staging application, or provide a 3DS enrolled card, plus a Diners card that asks for a one time password.
4. Switch the card form labels to English if preferred. They are set on the merchant account.
5. Production credentials and production approval before any real card is charged.
