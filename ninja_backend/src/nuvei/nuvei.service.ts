import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import { NuveiClientService, NuveiUser } from './nuvei-client.service';
import { decryptToken, encryptToken, tokenFingerprint } from './nuvei-crypto.util';
import { PLANS, PlanId, getSeatLimit, normalizePlanId } from '../plans/plan-config';

/**
 * Nuvei / Datafast (Paymentez) subscription engine.
 *
 * Owns the full lifecycle the client specified: customer-present activation
 * (3DS), card tokenization, a stored-token recurring charge 14 days later (no
 * 3DS), the verified-callback confirmation, refunds, the subscription state
 * machine, and per-transaction confirmation emails. It also creates Link-to-Pay
 * orders for one-off Web Solutions quotations.
 *
 * Safety posture: the entire engine is DORMANT unless NUVEI_ENABLED=true, so it
 * ships alongside the live Paddle path and moves no money until the switch is
 * flipped in the testing environment. A charge is only ever treated as approved
 * when status === 'success' AND status_detail === 3.
 */

type NuveiPlanKey = 'solo' | 'business' | 'scale' | 'business_promo_257';

interface NuveiPlan {
  key: NuveiPlanKey;
  provisionPlan: PlanId; // what the account's `plan` becomes
  label: string;
  activation: number; // customer-present charge today (USD)
  monthly: number; // recurring charge (USD)
  trialDays: number; // days until the first monthly charge
  grantsIncludedWorkspace?: boolean;
}

export type SubStatus =
  | 'pending_activation'
  | 'trialing'
  | 'active'
  | 'payment_failed'
  | 'past_due'
  | 'canceled'
  | 'suspended'
  | 'refunded';

const APPROVED_STATUS_DETAIL = 3;

@Injectable()
export class NuveiService {
  private readonly logger = new Logger(NuveiService.name);
  private schemaReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
    private readonly client: NuveiClientService,
  ) {}

  // ---- feature flags ---------------------------------------------------

  enabled(): boolean {
    return (
      this.config.getBoolean('NUVEI_ENABLED', false) &&
      this.client.isConfigured() &&
      // Card tokens are sealed with this key before they touch the database;
      // without it no card can be saved or charged, so the engine is off.
      !!String(this.config.get('NUVEI_TOKEN_ENC_KEY') || '').trim()
    );
  }

  private recurringEnabled(): boolean {
    // Recurring runs only when the engine is on AND not explicitly paused.
    return this.enabled() && this.config.getBoolean('NUVEI_RECURRING_ENABLED', true);
  }

  private assertEnabled() {
    if (!this.enabled()) {
      throw new BadRequestException(
        'Nuvei is not enabled. Set NUVEI_ENABLED=true and the NUVEI_SERVER_APP_CODE / NUVEI_SERVER_APP_KEY credentials.',
      );
    }
  }

  // ---- plan catalog (server-authoritative; client can never set amounts) --

  private plan(key: string): NuveiPlan {
    const k = String(key || '').trim().toLowerCase() as NuveiPlanKey;
    if (k === 'business_promo_257') {
      return {
        key: k,
        provisionPlan: 'business',
        label: 'Business (25% off promo)',
        activation: 257,
        monthly: 257,
        trialDays: 0, // charged $257 immediately, then $257/mo — no trial
        grantsIncludedWorkspace: true,
      };
    }
    if (k === 'solo' || k === 'business' || k === 'scale') {
      const p = PLANS[k];
      return {
        key: k,
        provisionPlan: k,
        label: p.label,
        activation: p.pricing.introCents / 100,
        monthly: p.pricing.monthlyCents / 100,
        trialDays: 14,
      };
    }
    throw new BadRequestException(`Unknown Nuvei plan: ${key}`);
  }

  // ---- schema ----------------------------------------------------------

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        email TEXT,
        token_enc TEXT NOT NULL,
        token_fp VARCHAR(64) NOT NULL,
        bin VARCHAR(6),
        last4 VARCHAR(4),
        brand VARCHAR(12),
        holder_name TEXT,
        expiry_month VARCHAR(2),
        expiry_year VARCHAR(4),
        status VARCHAR(16) NOT NULL DEFAULT 'valid',
        transaction_reference TEXT,
        is_default BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS nuvei_cards_user_fp_uidx ON nuvei_cards (user_id, token_fp)`,
    );

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        team_id UUID,
        email TEXT,
        plan_key VARCHAR(32) NOT NULL,
        provision_plan VARCHAR(32) NOT NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'pending_activation',
        activation_amount NUMERIC(12,2) NOT NULL,
        monthly_amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        card_id UUID,
        dev_reference TEXT UNIQUE,
        trial_end TIMESTAMPTZ,
        next_billing_date TIMESTAMPTZ,
        last_charge_at TIMESTAMPTZ,
        consent_at TIMESTAMPTZ,
        consent_ip TEXT,
        canceled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID,
        user_id UUID,
        kind VARCHAR(16) NOT NULL,
        period_key VARCHAR(32),
        provider_transaction_id TEXT,
        authorization_code TEXT,
        dev_reference TEXT,
        amount NUMERIC(12,2),
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        status VARCHAR(16),
        status_detail INTEGER,
        current_status TEXT,
        message TEXT,
        raw JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Idempotency: one recurring charge per subscription per billing period.
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS nuvei_tx_recurring_period_uidx
         ON nuvei_transactions (subscription_id, kind, period_key)
         WHERE period_key IS NOT NULL`,
    );
    // Idempotency: a provider transaction id is recorded at most once.
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS nuvei_tx_provider_id_uidx
         ON nuvei_transactions (provider_transaction_id)
         WHERE provider_transaction_id IS NOT NULL`,
    );

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_transaction_id TEXT,
        dev_reference TEXT,
        status VARCHAR(16),
        status_detail INTEGER,
        dedupe_key TEXT UNIQUE,
        verified BOOLEAN NOT NULL DEFAULT false,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_link_to_pay (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference TEXT UNIQUE NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        description TEXT,
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        provider_transaction_id TEXT,
        authorization_code TEXT,
        pay_url TEXT,
        created_by UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        paid_at TIMESTAMPTZ
      )
    `);

    // Account-level activation column (mirrors the Paddle pattern so the
    // effective-plan resolver and admin views need no change).
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS nuvei_subscription_id UUID`,
    );

    // Cancel keeps access until the paid period ends; the sweep finalizes it.
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false`,
    );
    // Where the browser lands after a 3DS challenge (our checkout page).
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS return_url TEXT`,
    );
    // Running total of partial refunds on a charge.
    await this.db.query(
      `ALTER TABLE nuvei_transactions ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0`,
    );

    this.schemaReady = true;
  }

  // ---- public config ---------------------------------------------------

  publicConfig() {
    return {
      enabled: this.enabled(),
      ...this.client.publicConfig(),
      plans: (['solo', 'business', 'scale', 'business_promo_257'] as NuveiPlanKey[]).map(
        (k) => {
          const p = this.plan(k);
          return {
            key: p.key,
            label: p.label,
            activation: p.activation,
            monthly: p.monthly,
            trialDays: p.trialDays,
          };
        },
      ),
    };
  }

  /** The signed-in user's latest Nuvei subscription snapshot (account page). */
  async getUserSubscription(userId: string) {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, plan_key, provision_plan, status, activation_amount,
              monthly_amount, currency, trial_end, next_billing_date,
              cancel_at_period_end, canceled_at, created_at
         FROM nuvei_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId],
    );
    let sub = rows[0] || null;
    // The checkout polls this while a 3DS challenge / bank review is pending.
    // Ask Nuvei for the transaction's current status so the customer is not
    // left waiting on a callback that may take minutes to arrive.
    if (sub && sub.status === 'pending_activation') {
      try {
        const st = await this.reconcilePendingActivation(sub.id);
        if (st && st !== sub.status) sub = { ...sub, status: st };
      } catch (err: any) {
        this.logger.warn(`pending activation reconcile failed: ${err?.message}`);
      }
    }
    return { subscription: sub };
  }

  /**
   * For a subscription still awaiting activation, look up its activation
   * transaction at Nuvei ("Transaction Info") and finalize: approved ->
   * activate, definitive failure -> payment_failed, otherwise leave pending.
   * Returns the (possibly new) subscription status.
   */
  private async reconcilePendingActivation(subscriptionId: string): Promise<SubStatus | null> {
    const { rows } = await this.db.query(
      `SELECT s.id, s.status, s.plan_key, s.activation_amount,
              t.provider_transaction_id
         FROM nuvei_subscriptions s
         LEFT JOIN nuvei_transactions t
           ON t.subscription_id = s.id AND t.kind = 'activation'
        WHERE s.id = $1
        ORDER BY t.created_at DESC
        LIMIT 1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) return null;
    if (sub.status !== 'pending_activation') return sub.status;
    if (!sub.provider_transaction_id) return sub.status;

    const info = await this.client.verifyTransaction(sub.provider_transaction_id);
    if (!info.ok || !info.body?.transaction) return sub.status;
    const tx = info.body.transaction;

    if (this.isApproved(info.body)) {
      if (
        tx.amount != null &&
        Math.abs(Number(tx.amount) - Number(sub.activation_amount)) > 0.01
      ) {
        this.logger.warn(
          `Nuvei activation amount mismatch for sub ${sub.id}: got ${tx.amount}, expected ${sub.activation_amount}`,
        );
        return sub.status;
      }
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = $2, status_detail = $3, authorization_code = COALESCE($4, authorization_code),
                current_status = $5, message = $6
          WHERE provider_transaction_id = $1`,
        [
          sub.provider_transaction_id,
          String(tx.status || ''),
          tx.status_detail ?? null,
          tx.authorization_code || null,
          tx.current_status || null,
          tx.message || null,
        ],
      );
      const plan = this.plan(sub.plan_key);
      await this.markActivated(sub.id, plan, tx);
      return plan.trialDays > 0 ? 'trialing' : 'active';
    }
    if (this.isDefinitiveFailure(info.body)) {
      await this.setSubStatus(sub.id, 'payment_failed');
      await this.db.query(
        `UPDATE nuvei_transactions SET status = $2, status_detail = $3, message = $4
          WHERE provider_transaction_id = $1`,
        [sub.provider_transaction_id, String(tx.status || 'failure'), tx.status_detail ?? null, tx.message || null],
      );
      return 'payment_failed';
    }
    return sub.status;
  }

  // ---- test / audit hooks ---------------------------------------------

  /**
   * Full audit view of one subscription: the stored card (last4/brand), every
   * transaction with its provider transaction_ID + authorization_code, and the
   * confirmation-email log. Owners may view only their own subscription.
   */
  async subscriptionDetails(
    subscriptionId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT s.id, s.user_id, s.email, s.plan_key, s.provision_plan, s.status,
              s.activation_amount, s.monthly_amount, s.currency, s.card_id,
              s.trial_end, s.next_billing_date, s.last_charge_at, s.canceled_at,
              s.cancel_at_period_end, s.created_at, c.last4, c.brand, c.bin
         FROM nuvei_subscriptions s
         LEFT JOIN nuvei_cards c ON c.id = s.card_id
        WHERE s.id = $1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!isAdmin && String(sub.user_id) !== String(userId)) {
      throw new ForbiddenException();
    }
    const tx = await this.db.query(
      `SELECT kind, period_key, provider_transaction_id, authorization_code,
              dev_reference, amount, refunded_amount, currency, status, status_detail, message, created_at
         FROM nuvei_transactions
        WHERE subscription_id = $1
        ORDER BY created_at ASC`,
      [subscriptionId],
    );
    let emails: any[] = [];
    try {
      const e = await this.db.query(
        `SELECT subject, status, provider, error, sent_at
           FROM email_log WHERE user_id = $1
          ORDER BY sent_at DESC NULLS LAST LIMIT 10`,
        [sub.user_id],
      );
      emails = e.rows;
    } catch {
      /* email_log may not exist in a fresh env */
    }
    const { last4, brand, bin, ...subscription } = sub;
    return { subscription, card: { last4, brand, bin }, transactions: tx.rows, emails };
  }

  /**
   * STAGING-ONLY test hook: fast-forward a subscription's trial so the next
   * monthly charge is due now, then run the recurring sweep once. Calling it a
   * second time on the same day exercises duplicate-charge prevention (the
   * period is already claimed, so no second debit is sent). Refuses to run
   * unless NUVEI_ENVIRONMENT is staging.
   */
  async simulateTrialEnd(
    subscriptionId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    if (this.client.environment() !== 'staging') {
      throw new ForbiddenException('Trial simulation is only available in staging.');
    }
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, user_id, status FROM nuvei_subscriptions WHERE id = $1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!isAdmin && String(sub.user_id) !== String(userId)) {
      throw new ForbiddenException();
    }
    if (!['trialing', 'active', 'past_due'].includes(sub.status)) {
      throw new BadRequestException(
        `Subscription is ${sub.status}; recurring billing does not apply.`,
      );
    }
    await this.db.query(
      `UPDATE nuvei_subscriptions
         SET next_billing_date = NOW() - interval '1 minute', updated_at = NOW()
       WHERE id = $1`,
      [subscriptionId],
    );
    await this.debitDue();
    return this.subscriptionDetails(subscriptionId, userId, isAdmin);
  }

  // ---- helpers ---------------------------------------------------------

  private devRef(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${crypto
      .randomBytes(4)
      .toString('hex')}`.toUpperCase();
  }

  /**
   * Approved ONLY when status is success AND status_detail is 3 (Paid).
   * The API answers with the word "success"; the webhook sends the numeric
   * status "1" (Approved) for the same thing — both are accepted here.
   */
  private isApproved(body: any): boolean {
    const t = body?.transaction || body || {};
    const status = String(t?.status ?? '').toLowerCase();
    return (
      (status === 'success' || status === '1') &&
      Number(t?.status_detail) === APPROVED_STATUS_DETAIL
    );
  }

  /** A final decline / rejection (never a pending or review state). */
  private isDefinitiveFailure(body: any): boolean {
    const t = body?.transaction || body || {};
    const status = String(t?.status ?? '').toLowerCase();
    return ['failure', 'rejected', 'expired', '4', '5'].includes(status);
  }

  /**
   * A reversal of an approved charge (refund / chargeback / annulment) as sent
   * by the webhook (status "2" = Cancelled) or the API ("canceled").
   */
  private isReversal(body: any): boolean {
    const t = body?.transaction || body || {};
    const status = String(t?.status ?? '').toLowerCase();
    const detail = Number(t?.status_detail);
    return (
      status === '2' ||
      status === 'canceled' ||
      status === 'cancelled' ||
      [7, 8, 29].includes(detail)
    );
  }

  private threeDsBrowserResponse(body: any): { challenge_request?: string; hidden_iframe?: string } | null {
    const br = body?.['3ds']?.browser_response || body?.browser_response;
    if (!br) return null;
    const challenge_request = String(br.challenge_request || '').trim();
    const hidden_iframe = String(br.hidden_iframe || '').trim();
    if (!challenge_request && !hidden_iframe) return null;
    return {
      ...(challenge_request ? { challenge_request } : {}),
      ...(hidden_iframe ? { hidden_iframe } : {}),
    };
  }

  /**
   * The issuer wants the cardholder to authenticate: status_detail 35 (3DS
   * method requested, waiting to continue) or 36 (challenge requested, waiting
   * CRes), or any pending answer that carries browser 3DS content.
   */
  private is3dsPending(body: any): boolean {
    const t = body?.transaction || {};
    const status = String(t?.status || '').toLowerCase();
    const detail = Number(t?.status_detail);
    if (status !== 'pending') return false;
    return detail === 35 || detail === 36 || !!this.threeDsBrowserResponse(body);
  }

  private async userRow(userId: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, email, name, team_id FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows[0]) throw new NotFoundException('User not found');
    return rows[0];
  }

  private toNuveiUser(row: any): NuveiUser {
    // The users table stores a single `name`; split it into first/last for
    // Nuvei (both optional on the debit/tokenize calls).
    const parts = String(row.name || '').trim().split(/\s+/).filter(Boolean);
    return {
      id: String(row.id),
      email: String(row.email || ''),
      first_name: parts[0] || undefined,
      last_name: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
    };
  }

  // ---- card tokenization ----------------------------------------------

  /**
   * Persist a card token (obtained from the browser SDK, or from a server-side
   * Add Card) encrypted at rest. The PAN/CVV are never received or stored here.
   */
  private async saveCard(input: {
    userId: string;
    email: string;
    token: string;
    bin?: string;
    last4?: string;
    brand?: string;
    holderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    status?: string;
    transactionReference?: string;
  }): Promise<string> {
    const enc = encryptToken(input.token, this.config.get('NUVEI_TOKEN_ENC_KEY'));
    const fp = tokenFingerprint(input.token);
    const { rows } = await this.db.query(
      `INSERT INTO nuvei_cards
         (user_id, email, token_enc, token_fp, bin, last4, brand, holder_name,
          expiry_month, expiry_year, status, transaction_reference)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id, token_fp)
       DO UPDATE SET token_enc = EXCLUDED.token_enc,
                     status = EXCLUDED.status,
                     updated_at = NOW()
       RETURNING id`,
      [
        input.userId,
        input.email,
        enc,
        fp,
        input.bin || null,
        input.last4 || null,
        input.brand || null,
        input.holderName || null,
        input.expiryMonth || null,
        input.expiryYear || null,
        input.status || 'valid',
        input.transactionReference || null,
      ],
    );
    return rows[0].id;
  }

  /**
   * Server-side Add Card (used by QA with the staging test cards, and by any
   * flow that cannot tokenize in the browser). Returns the saved card id.
   */
  async addCard(input: {
    userId: string;
    number: string;
    holderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    type?: string;
  }): Promise<{ cardId: string; status: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const user = await this.userRow(input.userId);
    const res = await this.client.addCard(this.toNuveiUser(user), {
      number: input.number,
      holder_name: input.holderName,
      expiry_month: input.expiryMonth,
      expiry_year: input.expiryYear,
      cvc: input.cvc,
      type: input.type,
    });
    const card = res.body?.card;
    if (!res.ok || !card?.token || card?.status === 'rejected') {
      throw new BadRequestException(
        `Card could not be tokenized: ${card?.message || res.error || 'rejected'}`,
      );
    }
    const cardId = await this.saveCard({
      userId: input.userId,
      email: user.email,
      token: String(card.token),
      bin: card.bin,
      last4: card.number,
      brand: card.type,
      holderName: input.holderName,
      expiryMonth: String(card.expiry_month || input.expiryMonth),
      expiryYear: String(card.expiry_year || input.expiryYear),
      status: card.status,
      transactionReference: card.transaction_reference,
    });
    return { cardId, status: String(card.status) };
  }

  /**
   * Store a token produced by the Paymentez BROWSER SDK (generate_tokenize).
   * This is the PCI-safe primary path: the PAN is entered in Nuvei's iframe and
   * only the resulting token reaches us. Returns the saved card id.
   */
  async saveClientToken(input: {
    userId: string;
    token: string;
    bin?: string;
    last4?: string;
    brand?: string;
    holderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    status?: string;
    transactionReference?: string;
  }): Promise<{ cardId: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const token = String(input.token || '').trim();
    if (!token) throw new BadRequestException('A card token is required.');
    const user = await this.userRow(input.userId);
    const cardId = await this.saveCard({
      userId: input.userId,
      email: user.email,
      token,
      bin: input.bin,
      last4: input.last4,
      brand: input.brand,
      holderName: input.holderName,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      status: input.status,
      transactionReference: input.transactionReference,
    });
    return { cardId };
  }

  /**
   * The user's saved cards (id + last4/brand only; never the token). First
   * syncs from Nuvei's card list so a card tokenized in the browser whose
   * save-token call was lost (expired session, network) is still usable —
   * Nuvei answers "Card already added" if the customer types it again.
   */
  async listSavedCards(userId: string): Promise<{
    cards: Array<{ id: string; last4: string | null; brand: string | null; bin: string | null; createdAt: string }>;
  }> {
    this.assertEnabled();
    await this.ensureSchema();
    const user = await this.userRow(userId);
    try {
      const res = await this.client.listCards(String(userId));
      const list: any[] = Array.isArray(res.body?.cards) ? res.body.cards : [];
      for (const c of list) {
        if (!c?.token || String(c?.status || '').toLowerCase() === 'rejected') continue;
        await this.saveCard({
          userId,
          email: user.email,
          token: String(c.token),
          bin: c.bin,
          last4: c.number,
          brand: c.type,
          holderName: c.holder_name,
          expiryMonth: c.expiry_month != null ? String(c.expiry_month) : undefined,
          expiryYear: c.expiry_year != null ? String(c.expiry_year) : undefined,
          status: c.status,
          transactionReference: c.transaction_reference,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Nuvei card list sync failed for ${userId}: ${err?.message}`);
    }
    const { rows } = await this.db.query(
      `SELECT id, last4, brand, bin, created_at
         FROM nuvei_cards
        WHERE user_id = $1 AND status <> 'rejected'
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 10`,
      [userId],
    );
    return {
      cards: rows.map((r: any) => ({
        id: r.id,
        last4: r.last4,
        brand: r.brand,
        bin: r.bin,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    };
  }

  private async cardToken(cardId: string, userId: string): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT token_enc FROM nuvei_cards WHERE id = $1 AND user_id = $2`,
      [cardId, userId],
    );
    if (!rows[0]) throw new NotFoundException('Saved card not found');
    return decryptToken(rows[0].token_enc, this.config.get('NUVEI_TOKEN_ENC_KEY'));
  }

  // ---- activation (customer-present, 3DS) ------------------------------

  /**
   * Begin a subscription: record consent, charge the activation fee on the
   * stored card with 3DS, and — on approval — start the 14-day trial and
   * provision the plan. If the issuer returns a 3DS challenge, the subscription
   * stays `pending_activation` and is finalized by the verified callback.
   *
   * `cardId` refers to a token already saved via addCard / the browser SDK.
   */
  async startActivation(input: {
    userId: string;
    planKey: string;
    cardId: string;
    consentIp?: string;
    browserInfo?: any; // for 3DS2
    termUrl?: string; // where the browser lands after a 3DS challenge
    testScenario?: string; // STAGING ONLY: '3ds_challenge' | '3ds_frictionless'
  }): Promise<{
    status: SubStatus;
    subscriptionId: string;
    requires3ds?: boolean;
    challenge?: any;
    transactionId?: string;
    message?: string;
  }> {
    this.assertEnabled();
    await this.ensureSchema();
    const plan = this.plan(input.planKey);
    const user = await this.userRow(input.userId);

    // Nuvei's documented staging cards for 3DS require a specific order
    // description + amount ("3DS Challenge" 151 / "3DS FrictionLess" >=150).
    // Honored ONLY on the staging gateway so the challenge screen can be tested.
    let activationAmount = plan.activation;
    let activationDescription = `Cortexa ${plan.label} activation`;
    const scenario = String(input.testScenario || '').trim().toLowerCase();
    if (scenario && this.client.environment() === 'staging') {
      if (scenario === '3ds_challenge') {
        activationAmount = 151;
        activationDescription = '3DS Challenge';
      } else if (scenario === '3ds_frictionless') {
        activationAmount = 150;
        activationDescription = '3DS FrictionLess';
      }
    }

    // A saved card id is required and must be a UUID (otherwise the lookup
    // below would surface a raw database error as a 500).
    const cardId = String(input.cardId || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardId)) {
      throw new BadRequestException('A saved card is required.');
    }

    // One live subscription per account. Without this, paying again created a
    // second subscription (double monthly billing) and overwrote the plan.
    const { rows: live } = await this.db.query(
      `SELECT id, plan_key, status FROM nuvei_subscriptions
        WHERE user_id = $1 AND status IN ('trialing','active','past_due')
        ORDER BY created_at DESC LIMIT 1`,
      [input.userId],
    );
    if (live[0]) {
      const current = this.plan(live[0].plan_key).label;
      throw new BadRequestException(
        `You already have an active ${current} subscription. To change plans, please contact support.`,
      );
    }

    // A previous attempt that is still awaiting a bank answer (3DS challenge
    // in progress / anti-fraud review) must not be charged a second time.
    const { rows: pendingRows } = await this.db.query(
      `SELECT s.id FROM nuvei_subscriptions s
        WHERE s.user_id = $1 AND s.status = 'pending_activation'
          AND s.created_at > NOW() - interval '30 minutes'
          AND EXISTS (SELECT 1 FROM nuvei_transactions t
                       WHERE t.subscription_id = s.id AND t.kind = 'activation'
                         AND t.provider_transaction_id IS NOT NULL
                         AND t.status = 'pending')
        ORDER BY s.created_at DESC LIMIT 1`,
      [input.userId],
    );
    if (pendingRows[0]) {
      const st = await this.reconcilePendingActivation(pendingRows[0].id);
      if (st === 'trialing' || st === 'active') {
        throw new BadRequestException(
          `You already have an active ${plan.label} subscription. To change plans, please contact support.`,
        );
      }
      if (st === 'pending_activation') {
        return {
          status: 'pending_activation',
          subscriptionId: pendingRows[0].id,
          message: 'Your previous payment is still being verified. Your account will activate automatically once confirmed.',
        };
      }
    }

    const token = await this.cardToken(cardId, input.userId);
    const dev_reference = this.devRef('ACT');

    const teamId = await this.resolveTeamId(input.userId);
    const returnUrl = this.safeReturnUrl(input.termUrl, plan.key);
    const { rows: subRows } = await this.db.query(
      `INSERT INTO nuvei_subscriptions
         (user_id, team_id, email, plan_key, provision_plan, status,
          activation_amount, monthly_amount, card_id, dev_reference,
          consent_at, consent_ip, return_url)
       VALUES ($1,$2,$3,$4,$5,'pending_activation',$6,$7,$8,$9,NOW(),$10,$11)
       RETURNING id`,
      [
        input.userId,
        teamId,
        user.email,
        plan.key,
        plan.provisionPlan,
        activationAmount,
        plan.monthly,
        cardId,
        dev_reference,
        input.consentIp || null,
        returnUrl,
      ],
    );
    const subscriptionId = subRows[0].id;

    // 3DS2 for the customer-present activation charge. term_url is OUR server:
    // the ACS posts the challenge result (CRes) there via the browser, we hand
    // it to Nuvei (auth_verify), then send the browser back to the checkout.
    const browserInfo = input.browserInfo && typeof input.browserInfo === 'object'
      ? { ...input.browserInfo }
      : null;
    if (browserInfo && !browserInfo.ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(String(input.consentIp || ''))) {
      browserInfo.ip = input.consentIp;
    }
    const extraParams = {
      threeDS2_data: {
        term_url: `${this.backendUrl()}/api/nuvei/3ds/return/${subscriptionId}`,
        device_type: 'browser',
        process_anyway: false,
      },
      ...(browserInfo ? { browser_info: browserInfo } : {}),
    };

    const res = await this.client.debit(
      this.toNuveiUser(user),
      {
        amount: activationAmount,
        description: activationDescription,
        dev_reference,
      },
      token,
      extraParams,
    );

    const tx = res.body?.transaction || {};
    await this.recordTransaction({
      subscriptionId,
      userId: input.userId,
      kind: 'activation',
      dev_reference,
      amount: activationAmount,
      body: res.body,
    });

    // No answer at all (timeout / network): the charge may or may not have
    // reached the bank. Leave it awaiting confirmation — never call it
    // declined (a retry could double charge) and never activate unpaid.
    if (res.httpStatus === 0 || !res.body) {
      this.logger.error(
        `Nuvei activation unconfirmed for sub ${subscriptionId}: ${res.error || 'no response'}`,
      );
      return {
        status: 'pending_activation',
        subscriptionId,
        message: 'We could not confirm the payment yet. Your account will activate automatically once it is confirmed.',
      };
    }

    if (this.isApproved(res.body)) {
      await this.markActivated(subscriptionId, plan, tx);
      return {
        status: plan.trialDays > 0 ? 'trialing' : 'active',
        subscriptionId,
        transactionId: tx.id,
      };
    }

    if (this.is3dsPending(res.body)) {
      // The bank wants the cardholder to authenticate. The browser renders the
      // 3DS content; the activation is finalized by our 3DS return handler,
      // the verified callback, or the pending-activation reconcile.
      return {
        status: 'pending_activation',
        subscriptionId,
        requires3ds: true,
        challenge: this.threeDsBrowserResponse(res.body) || {},
        transactionId: tx.id,
      };
    }

    // Pending WITHOUT 3DS content (anti-fraud / bank review): the verified
    // callback or the reconcile will finalize it. Leave the subscription
    // awaiting activation rather than marking it failed.
    if (String(tx?.status || '').toLowerCase() === 'pending') {
      return {
        status: 'pending_activation',
        subscriptionId,
        transactionId: tx.id,
        message: 'Your payment is being verified. Your account will activate automatically once confirmed.',
      };
    }

    // A gateway / integration error (bad credentials, invalid order data,
    // Nuvei 5xx) is NOT a card decline: say so, and log the real reason.
    if (!res.ok && !tx?.status) {
      await this.setSubStatus(subscriptionId, 'payment_failed');
      this.logger.error(
        `Nuvei activation gateway error for sub ${subscriptionId}: HTTP ${res.httpStatus} ${JSON.stringify(res.body).slice(0, 400)}`,
      );
      return {
        status: 'payment_failed',
        subscriptionId,
        message: 'The payment could not be processed right now. Please try again in a moment.',
      };
    }

    // Declined by the issuer. Never surface a raw provider string.
    await this.setSubStatus(subscriptionId, 'payment_failed');
    this.logger.warn(
      `Nuvei activation declined for sub ${subscriptionId}: ${tx.message || res.error || 'no message'}`,
    );
    return {
      status: 'payment_failed',
      subscriptionId,
      transactionId: tx.id,
      message: 'The payment could not be completed. Please try another card.',
    };
  }

  /**
   * Only ever send the browser back to our own checkout after 3DS: accept the
   * page's URL when it is on the configured frontend origin, otherwise build
   * the checkout URL for the plan ourselves (no open redirect).
   */
  private safeReturnUrl(candidate: string | undefined, planKey: NuveiPlanKey): string {
    const checkoutKey =
      planKey === 'business' || planKey === 'business_promo_257'
        ? 'team'
        : planKey === 'scale'
          ? 'growth'
          : 'solo';
    const fallback = `${this.frontendUrl()}/checkout?plan=${checkoutKey}&threeds=return`;
    const raw = String(candidate || '').trim();
    if (!raw) return fallback;
    try {
      const u = new URL(raw);
      const allowed = new Set(
        [this.frontendUrl(), 'https://www.cortexaaicrm.com', 'https://cortexaaicrm.com']
          .map((s) => {
            try {
              return new URL(s).origin;
            } catch {
              return '';
            }
          })
          .filter(Boolean),
      );
      if (u.protocol !== 'https:' && u.hostname !== 'localhost') return fallback;
      if (!allowed.has(u.origin) && u.hostname !== 'localhost') return fallback;
      if (!u.searchParams.has('threeds')) u.searchParams.set('threeds', 'return');
      return u.toString();
    } catch {
      return fallback;
    }
  }

  private frontendUrl(): string {
    return String(
      this.config.get('FRONTEND_URL') ||
        this.config.get('PUBLIC_FRONTEND_URL') ||
        'https://www.cortexaaicrm.com',
    ).replace(/\/+$/, '');
  }

  /**
   * Browser step after the 3DS "method" iframe was rendered (~5s): continue
   * the authentication with Nuvei. Answers either with a challenge to render
   * or with the final activation outcome.
   */
  async threeDsContinue(subscriptionId: string, userId: string): Promise<{
    status: SubStatus;
    subscriptionId: string;
    requires3ds?: boolean;
    challenge?: any;
    message?: string;
  }> {
    this.assertEnabled();
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT s.id, s.user_id, s.status, t.provider_transaction_id
         FROM nuvei_subscriptions s
         LEFT JOIN nuvei_transactions t
           ON t.subscription_id = s.id AND t.kind = 'activation'
        WHERE s.id = $1
        ORDER BY t.created_at DESC LIMIT 1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) throw new NotFoundException('Subscription not found');
    if (String(sub.user_id) !== String(userId)) throw new ForbiddenException();
    if (sub.status !== 'pending_activation') {
      return { status: sub.status, subscriptionId };
    }
    if (sub.provider_transaction_id) {
      const res = await this.client.threeDsContinue(sub.provider_transaction_id);
      const br = this.threeDsBrowserResponse(res.body);
      if (br?.challenge_request) {
        return { status: 'pending_activation', subscriptionId, requires3ds: true, challenge: br };
      }
    }
    const st = (await this.reconcilePendingActivation(subscriptionId)) || 'pending_activation';
    return {
      status: st,
      subscriptionId,
      message:
        st === 'payment_failed'
          ? 'The payment could not be completed. Please try another card.'
          : st === 'pending_activation'
            ? 'Your payment is being verified. Your account will activate automatically once confirmed.'
            : undefined,
    };
  }

  /**
   * term_url handler: the ACS posts the challenge result (CRes) here through
   * the customer's browser. Hand it to Nuvei (auth_verify), finalize from the
   * transaction's real status, and tell the controller where to send the
   * browser (our checkout, which polls until the account is live).
   */
  async threeDsReturn(subscriptionId: string, form: any): Promise<{ redirect: string }> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT s.id, s.status, s.plan_key, s.return_url, t.provider_transaction_id
         FROM nuvei_subscriptions s
         LEFT JOIN nuvei_transactions t
           ON t.subscription_id = s.id AND t.kind = 'activation'
        WHERE s.id = $1
        ORDER BY t.created_at DESC LIMIT 1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) return { redirect: `${this.frontendUrl()}/checkout?plan=solo&threeds=return` };
    const redirect =
      sub.return_url || this.safeReturnUrl(undefined, sub.plan_key);
    if (sub.status !== 'pending_activation') return { redirect };

    const cres = String(form?.cres || form?.CRes || form?.CRES || '').trim();
    if (sub.provider_transaction_id && cres) {
      const v = await this.client.threeDsVerify(sub.provider_transaction_id, cres);
      this.logger.log(
        `Nuvei 3DS auth_verify for sub ${sub.id}: HTTP ${v.httpStatus} auth=${JSON.stringify(v.body?.authentication || {}).slice(0, 200)}`,
      );
    } else {
      this.logger.warn(`Nuvei 3DS return for sub ${sub.id} without a CRes (keys: ${Object.keys(form || {}).join(',')})`);
    }
    try {
      await this.reconcilePendingActivation(sub.id);
    } catch (err: any) {
      this.logger.warn(`3DS return reconcile failed for sub ${sub.id}: ${err?.message}`);
    }
    return { redirect };
  }

  /** Add calendar months without day overflow (Jan 31 + 1 -> Feb 28/29). */
  private addMonths(d: Date, months: number): Date {
    const r = new Date(d);
    const day = r.getDate();
    r.setDate(1);
    r.setMonth(r.getMonth() + months);
    const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, last));
    return r;
  }

  /** Flip a subscription to trialing/active and grant plan access + email. */
  private async markActivated(
    subscriptionId: string,
    plan: NuveiPlan,
    tx: any,
  ): Promise<void> {
    const now = new Date();
    // With a trial, the first monthly charge lands at the end of the trial and
    // the activation fee is separate. With NO trial (e.g. the $257 promo), the
    // activation charge IS the first month, so the next charge is one month out.
    let nextBilling: Date;
    if (plan.trialDays > 0) {
      nextBilling = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
    } else {
      nextBilling = this.addMonths(now, 1);
    }
    const trialEnd = plan.trialDays > 0 ? nextBilling : null;
    const status: SubStatus = plan.trialDays > 0 ? 'trialing' : 'active';
    // Atomic: only a subscription still awaiting activation flips. A callback
    // and the pending reconcile racing each other can activate (and email)
    // the customer exactly once.
    const { rows } = await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = $2,
             trial_end = $3,
             next_billing_date = $4,
             last_charge_at = NOW(),
             updated_at = NOW()
       WHERE id = $1 AND status = 'pending_activation'
       RETURNING user_id, email, plan_key, provision_plan, activation_amount, monthly_amount`,
      [subscriptionId, status, trialEnd, nextBilling],
    );
    const sub = rows[0];
    if (!sub) return;

    await this.provisionAccount({
      userId: sub.user_id,
      subscriptionId,
      plan: sub.provision_plan,
      paymentStatus: plan.trialDays > 0 ? 'trialing' : 'active',
      trialEnd: plan.trialDays > 0 ? nextBilling : null,
    });
    await this.mirrorBilling(subscriptionId, 'active', nextBilling);

    await this.sendConfirmation({
      to: sub.email,
      userId: sub.user_id,
      subject: `Your Cortexa ${plan.label} plan is active`,
      lines: [
        ['Plan', plan.label],
        ['Amount charged today', this.money(Number(tx?.amount ?? sub.activation_amount ?? plan.activation))],
        plan.trialDays > 0
          ? ['Trial', `${plan.trialDays} days`]
          : ['Billing', 'Monthly'],
        ['First monthly charge', nextBilling.toISOString().slice(0, 10)],
        ['Monthly price', this.money(plan.monthly)],
        ['Transaction ID', tx?.id || '—'],
        ['Authorization code', tx?.authorization_code || '—'],
      ],
      note:
        'Your card is securely stored with Nuvei for automatic monthly billing. You can cancel anytime.',
    });
  }

  // ---- recurring billing ----------------------------------------------

  /**
   * Daily sweep: charge every subscription whose next monthly payment is due.
   * Idempotent per (subscription, billing period). Never charges a canceled,
   * suspended, or refunded subscription (those states are excluded by the WHERE).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async debitDue(): Promise<void> {
    if (!this.recurringEnabled()) return;
    await this.ensureSchema();

    const { rows } = await this.db.query(
      `SELECT id, user_id, email, plan_key, provision_plan, monthly_amount,
              card_id, next_billing_date, cancel_at_period_end
         FROM nuvei_subscriptions
        WHERE status IN ('trialing','active','past_due')
          AND next_billing_date IS NOT NULL
          AND next_billing_date <= NOW()
        ORDER BY next_billing_date ASC
        LIMIT 100`,
    );

    for (const sub of rows) {
      try {
        await this.chargeRecurring(sub);
      } catch (err: any) {
        this.logger.error(
          `Recurring charge failed for subscription ${sub.id}: ${err?.message}`,
        );
      }
    }
  }

  private periodKey(d: Date | string): string {
    return new Date(d).toISOString().slice(0, 10);
  }

  private async chargeRecurring(sub: any): Promise<void> {
    const plan = this.plan(sub.plan_key);
    // Charge the price the customer consented to at checkout, never a later
    // catalog change.
    const monthly = Number(sub.monthly_amount) > 0 ? Number(sub.monthly_amount) : plan.monthly;
    const period = this.periodKey(sub.next_billing_date);
    const dev_reference = this.devRef('REC');

    // A cancellation takes effect at the end of the paid period: no charge,
    // the subscription closes and paid access ends now.
    if (sub.cancel_at_period_end) {
      await this.finalizeCancellation(sub.id);
      return;
    }

    // Claim this billing period atomically; if the row already exists another
    // run has (or is) charging it, so skip to avoid a duplicate charge.
    let claimed = false;
    try {
      await this.db.query(
        `INSERT INTO nuvei_transactions
           (subscription_id, user_id, kind, period_key, dev_reference, amount, status)
         VALUES ($1,$2,'recurring',$3,$4,$5,'pending')`,
        [sub.id, sub.user_id, period, dev_reference, monthly],
      );
      claimed = true;
    } catch (err: any) {
      if (err?.code !== '23505') throw err;
      // Period already claimed. Self-heal instead of stalling: if that attempt
      // succeeded, move the next charge a month out; if it failed, retry
      // tomorrow; if it is still in flight, leave it alone.
      const { rows: prev } = await this.db.query(
        `SELECT status, created_at FROM nuvei_transactions
          WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $2`,
        [sub.id, period],
      );
      const prevStatus = String(prev[0]?.status || '');
      const ageMs = Date.now() - new Date(prev[0]?.created_at || Date.now()).getTime();
      if (prevStatus === 'pending') {
        if (ageMs < 2 * 60 * 60 * 1000) return; // another run is charging it
        // A claim older than 2h with no outcome: the process died mid-charge.
        // Flag it for review and try again tomorrow (a fresh period key).
        this.logger.error(
          `Nuvei recurring claim for sub ${sub.id} period ${period} has no outcome after 2h; marking error and retrying tomorrow`,
        );
        await this.db.query(
          `UPDATE nuvei_transactions SET status = 'error', message = 'no outcome recorded (process interrupted)'
            WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $2 AND status = 'pending'`,
          [sub.id, period],
        );
      }
      if (prevStatus === 'unconfirmed') {
        // The gateway never answered. Nuvei's callback for that dev_reference
        // settles it (see handleCallback); only after 24h of silence is the
        // charge attempted again.
        if (ageMs < 24 * 60 * 60 * 1000) return;
        this.logger.error(
          `Nuvei recurring charge for sub ${sub.id} period ${period} unconfirmed for 24h; retrying tomorrow`,
        );
      }
      const wasSuccess = prevStatus === 'success';
      const base = new Date(sub.next_billing_date);
      const nextDate = wasSuccess
        ? this.addMonths(base, 1)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.db.query(
        `UPDATE nuvei_subscriptions SET next_billing_date = $2, updated_at = NOW() WHERE id = $1`,
        [sub.id, nextDate],
      );
      return;
    }
    if (!claimed) return;

    let res: any;
    try {
      const user = await this.userRow(sub.user_id);
      const token = await this.cardToken(sub.card_id, sub.user_id);

      // Scheduled recurrence is NOT customer-present: no 3DS (per Nuvei — the
      // Recurrence flow does not support it).
      res = await this.client.debit(
        this.toNuveiUser(user),
        {
          amount: monthly,
          description: `Cortexa ${plan.label} monthly`,
          dev_reference,
        },
        token,
      );
    } catch (err: any) {
      // Nothing was sent to the bank: release the claim so the customer is
      // retried tomorrow instead of being stuck behind a dead period key.
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'error', message = $3
          WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $2 AND status = 'pending'`,
        [sub.id, period, String(err?.message || 'error before charge').slice(0, 500)],
      );
      await this.db.query(
        `UPDATE nuvei_subscriptions SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
        [sub.id],
      );
      throw err;
    }
    if (res.httpStatus === 0 || !res.body) {
      // No answer from the gateway: the charge may or may not have gone
      // through. Keep the claim (so nothing is re-sent blindly) and wait for
      // Nuvei's callback for this dev_reference; the claim handler above
      // only retries after 24h without an outcome.
      this.logger.error(
        `Nuvei recurring charge unconfirmed for sub ${sub.id} period ${period}: ${res.error || 'no response'}`,
      );
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'unconfirmed', message = $3
          WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $2`,
        [sub.id, period, String(res.error || 'no response from gateway').slice(0, 500)],
      );
      return;
    }
    const tx = res.body?.transaction || {};

    await this.db.query(
      `UPDATE nuvei_transactions
         SET provider_transaction_id = $2,
             authorization_code = $3,
             status = $4,
             status_detail = $5,
             current_status = $6,
             message = $7,
             raw = $8
       WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $9`,
      [
        sub.id,
        tx.id || null,
        tx.authorization_code || null,
        String(tx.status || 'failure'),
        tx.status_detail ?? null,
        tx.current_status || null,
        tx.message || res.error || null,
        JSON.stringify(res.body || {}),
        period,
      ],
    );

    if (this.isApproved(res.body)) {
      await this.applyRecurringSuccess(sub, tx, monthly);
    } else {
      await this.applyRecurringDecline(sub, tx, monthly, tx.message || res.error || 'no message');
    }
  }

  /**
   * A monthly charge was declined: pause paid access (past_due), retry daily
   * with a fresh period key, and suspend after 5 failures in 30 days.
   */
  private async applyRecurringDecline(sub: any, tx: any, amount: number, reason: string): Promise<void> {
    const plan = this.plan(sub.plan_key);
    const { rows: fails } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'recurring'
          AND status NOT IN ('success','pending','unconfirmed') AND created_at > NOW() - interval '30 days'`,
      [sub.id],
    );
    const failures = Number(fails[0]?.n || 0);
    const suspend = failures >= 5;
    await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = $2,
             next_billing_date = CASE WHEN $3::boolean THEN NULL ELSE NOW() + interval '1 day' END,
             updated_at = NOW()
       WHERE id = $1`,
      [sub.id, suspend ? 'suspended' : 'past_due', suspend],
    );
    // Paid access pauses while past due (resolveEffectivePlan drops past_due /
    // suspended to Free); a later successful retry restores 'active'.
    await this.db.query(
      `UPDATE users SET payment_status = $2, updated_at = NOW() WHERE nuvei_subscription_id = $1`,
      [sub.id, suspend ? 'suspended' : 'past_due'],
    );
    this.logger.warn(
      `Recurring charge declined for sub ${sub.id} (${failures} failure(s) in 30d${suspend ? ', SUSPENDED' : ', retry tomorrow'}): ${reason}`,
    );
    await this.mirrorBilling(sub.id, suspend ? 'suspended' : 'past_due', null);
    await this.sendConfirmation({
      to: sub.email,
      userId: sub.user_id,
      subject: `Cortexa ${plan.label} — payment failed`,
      lines: [
        ['Plan', plan.label],
        ['Amount', this.money(amount)],
        ['Status', 'Declined'],
        ['What happens next', suspend
          ? 'Your subscription has been suspended after repeated failed payments. Please update your card to restore access.'
          : 'We will retry automatically tomorrow. Please check your card or update it to keep your access.'],
      ],
    });
  }

  /**
   * A monthly charge was approved: move the next charge one month out, keep
   * (or restore) paid access, mirror billing, and confirm by email. Used by
   * the sweep and by a late callback for an unconfirmed charge.
   */
  private async applyRecurringSuccess(sub: any, tx: any, amount: number): Promise<void> {
    const plan = this.plan(sub.plan_key);
    const next = this.addMonths(new Date(sub.next_billing_date), 1);
    await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = 'active', next_billing_date = $2, last_charge_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [sub.id, next],
    );
    await this.provisionAccount({
      userId: sub.user_id,
      subscriptionId: sub.id,
      plan: sub.provision_plan,
      paymentStatus: 'active',
      trialEnd: null,
    });
    await this.mirrorBilling(sub.id, 'active', next);
    await this.sendConfirmation({
      to: sub.email,
      userId: sub.user_id,
      subject: `Cortexa ${plan.label} — payment received`,
      lines: [
        ['Plan', plan.label],
        ['Amount', this.money(amount)],
        ['Status', 'Paid'],
        ['Transaction ID', tx?.id || '—'],
        ['Authorization code', tx?.authorization_code || '—'],
        ['Next charge', next.toISOString().slice(0, 10)],
      ],
    });
  }

  /**
   * Close a subscription whose cancellation was scheduled for period end:
   * status canceled, paid access ends, no further charges.
   */
  private async finalizeCancellation(subscriptionId: string): Promise<void> {
    const { rows } = await this.db.query(
      `UPDATE nuvei_subscriptions
          SET status = 'canceled', next_billing_date = NULL,
              canceled_at = COALESCE(canceled_at, NOW()), updated_at = NOW()
        WHERE id = $1 AND status IN ('trialing','active','past_due')
        RETURNING user_id, email, plan_key`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) return;
    await this.db.query(
      `UPDATE users SET payment_status = 'canceled', updated_at = NOW()
        WHERE nuvei_subscription_id = $1`,
      [subscriptionId],
    );
    await this.mirrorBilling(subscriptionId, 'canceled', null);
    const plan = this.plan(sub.plan_key);
    await this.sendConfirmation({
      to: sub.email,
      userId: sub.user_id,
      subject: `Your Cortexa ${plan.label} subscription has ended`,
      lines: [
        ['Plan', plan.label],
        ['Status', 'Canceled'],
        ['Charges', 'No further charges will be made.'],
      ],
      note: 'You can subscribe again at any time from the pricing page.',
    });
  }

  // ---- verified callback / webhook ------------------------------------

  /**
   * Nuvei callback (webhook). Security posture: we NEVER trust the body alone.
   * 1. Authenticity: the `stoken` Nuvei signs every callback with
   *    (md5 of transaction_id_application_code_user_id_app_key) must match, or
   *    the shared NUVEI_CALLBACK_TOKEN header must match. No signature = rejected
   *    with HTTP 203 (Nuvei's documented "token error" answer).
   * 2. Matching: the event must belong to an order WE created (dev_reference /
   *    transaction id), and an activation's amount must equal what we recorded.
   * 3. Approval only when status is Approved (webhook "1" / API "success") AND
   *    status_detail is 3. Reversals (status 2: refund / chargeback) revoke.
   * 4. Idempotent: each event is recorded once; a processing failure releases
   *    the record and answers 409 so Nuvei retries it.
   */
  async handleCallback(
    payload: any,
    headerToken?: string,
  ): Promise<{ ok: boolean; handled: string; httpStatus?: number }> {
    await this.ensureSchema();

    const tx = payload?.transaction || payload || {};
    const providerTxId = tx?.id ? String(tx.id) : null;
    const devReference = tx?.dev_reference ? String(tx.dev_reference) : null;
    const status = String(tx?.status ?? '').toLowerCase();
    const statusDetail = tx?.status_detail;

    if (!this.callbackIsAuthentic(payload, headerToken)) {
      this.logger.warn(
        `Nuvei callback rejected: missing/bad signature (tx ${providerTxId || '-'}, ref ${devReference || '-'})`,
      );
      return { ok: false, handled: 'unauthorized', httpStatus: 203 };
    }

    // Idempotent event record.
    const dedupe = crypto
      .createHash('sha256')
      .update(`${providerTxId}|${status}|${statusDetail}|${devReference}`)
      .digest('hex');
    try {
      await this.db.query(
        `INSERT INTO nuvei_webhook_events
           (provider_transaction_id, dev_reference, status, status_detail, dedupe_key, payload)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          providerTxId,
          devReference,
          status,
          Number.isFinite(Number(statusDetail)) ? Number(statusDetail) : null,
          dedupe,
          JSON.stringify(payload || {}),
        ],
      );
    } catch (err: any) {
      if (err?.code === '23505') return { ok: true, handled: 'duplicate' };
      throw err;
    }

    try {
      const handled = await this.processCallback(payload, tx, providerTxId, devReference);
      if (handled.verified) await this.markEventVerified(dedupe);
      return { ok: true, handled: handled.handled };
    } catch (err: any) {
      // Release the event so Nuvei's retry (any non-200 below 500) is processed.
      this.logger.error(`Nuvei callback processing failed (ref ${devReference || '-'}): ${err?.message}`);
      await this.db
        .query(`DELETE FROM nuvei_webhook_events WHERE dedupe_key = $1 AND verified = false`, [dedupe])
        .catch(() => undefined);
      return { ok: false, handled: 'error', httpStatus: 409 };
    }
  }

  /** stoken / shared-token check. Fails closed. */
  private callbackIsAuthentic(payload: any, headerToken?: string): boolean {
    const expectedToken = String(this.config.get('NUVEI_CALLBACK_TOKEN') || '').trim();
    const given = String(headerToken || '').trim();
    if (expectedToken && given && this.safeEqual(given, expectedToken)) return true;

    const tx = payload?.transaction || {};
    const stoken = String(tx?.stoken || '').trim().toLowerCase();
    const txId = String(tx?.id ?? '').trim();
    const userId = String(payload?.user?.id ?? '').trim();
    const appCode = String(tx?.application_code || '').trim();
    if (!stoken || !txId) return false;

    const serverCode = this.client.serverAppCode();
    const clientCode = String(this.config.get('NUVEI_CLIENT_APP_CODE') || '').trim();
    const pairs: Array<[string, string | null]> = [];
    if (appCode) pairs.push([appCode, this.client.appKeyFor(appCode)]);
    pairs.push([serverCode, this.client.appKeyFor(serverCode)]);
    if (clientCode) pairs.push([clientCode, this.client.appKeyFor(clientCode)]);
    for (const [code, key] of pairs) {
      if (!code || !key) continue;
      const h = crypto
        .createHash('md5')
        .update(`${txId}_${code}_${userId}_${key}`)
        .digest('hex');
      if (this.safeEqual(h, stoken)) return true;
    }
    return false;
  }

  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  }

  private async processCallback(
    payload: any,
    tx: any,
    providerTxId: string | null,
    devReference: string | null,
  ): Promise<{ handled: string; verified: boolean }> {
    if (!devReference && !providerTxId) return { handled: 'no_reference', verified: false };

    // Match to an order we created: the activation (subscription dev_reference)
    // or any charge row (activation / recurring) by dev_reference or tx id.
    const txRowRes = await this.db.query(
      `SELECT id, subscription_id, user_id, kind, period_key, amount, status,
              provider_transaction_id, dev_reference
         FROM nuvei_transactions
        WHERE ($1::text IS NOT NULL AND dev_reference = $1)
           OR ($2::text IS NOT NULL AND provider_transaction_id = $2)
        ORDER BY created_at DESC LIMIT 1`,
      [devReference, providerTxId],
    );
    const txRow = txRowRes.rows[0] || null;
    const subRes = await this.db.query(
      `SELECT id, user_id, email, plan_key, provision_plan, activation_amount,
              monthly_amount, status, dev_reference, next_billing_date
         FROM nuvei_subscriptions
        WHERE ($1::text IS NOT NULL AND dev_reference = $1)
           OR ($2::uuid IS NOT NULL AND id = $2)
        LIMIT 1`,
      [devReference, txRow?.subscription_id || null],
    );
    const sub = subRes.rows[0] || null;

    const approved = this.isApproved(payload);
    const failed = this.isDefinitiveFailure(payload);
    const reversal = this.isReversal(payload);

    // Optional server-side re-verification (Transaction Info) before acting.
    let confirmed = approved;
    if (confirmed && this.config.getBoolean('NUVEI_VERIFY_ENABLED', false) && providerTxId) {
      const v = await this.client.verifyTransaction(providerTxId);
      if (v.ok && v.body?.transaction) confirmed = this.isApproved(v.body);
    }

    // Keep the charge row's provider fields current (idempotent).
    if (txRow && providerTxId) {
      await this.db
        .query(
          `UPDATE nuvei_transactions
              SET provider_transaction_id = COALESCE(provider_transaction_id, $2),
                  authorization_code = COALESCE($3, authorization_code)
            WHERE id = $1`,
          [txRow.id, providerTxId, tx?.authorization_code || null],
        )
        .catch(() => undefined);
    }

    if (sub) {
      const isActivation = !!devReference && devReference === sub.dev_reference;

      if (isActivation) {
        if (confirmed && sub.status === 'pending_activation') {
          if (
            tx?.amount != null &&
            Math.abs(Number(tx.amount) - Number(sub.activation_amount)) > 0.01
          ) {
            this.logger.warn(
              `Nuvei callback amount mismatch for ${devReference}: got ${tx.amount}, expected ${sub.activation_amount}`,
            );
            return { handled: 'amount_mismatch', verified: false };
          }
          if (txRow) {
            await this.db.query(
              `UPDATE nuvei_transactions SET status = 'success', status_detail = 3 WHERE id = $1`,
              [txRow.id],
            );
          }
          await this.markActivated(sub.id, this.plan(sub.plan_key), tx);
          return { handled: 'activated', verified: true };
        }
        if (failed && sub.status === 'pending_activation') {
          await this.setSubStatus(sub.id, 'payment_failed');
          if (txRow) {
            await this.db.query(
              `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message) WHERE id = $1`,
              [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
            );
          }
          return { handled: 'activation_declined', verified: true };
        }
        if (reversal) {
          return this.applyReversal(sub, txRow, tx);
        }
        return { handled: confirmed ? 'already_processed' : 'ignored', verified: false };
      }

      if (txRow && txRow.kind === 'recurring') {
        if (confirmed && ['pending', 'unconfirmed', 'error', 'failure'].includes(String(txRow.status))) {
          // A charge the gateway never answered (or a late approval) is now
          // confirmed by Nuvei: settle it exactly like a successful sweep.
          if (
            tx?.amount != null &&
            Math.abs(Number(tx.amount) - Number(txRow.amount)) > 0.01
          ) {
            this.logger.warn(
              `Nuvei recurring callback amount mismatch for ${devReference}: got ${tx.amount}, expected ${txRow.amount}`,
            );
            return { handled: 'amount_mismatch', verified: false };
          }
          await this.db.query(
            `UPDATE nuvei_transactions
                SET status = 'success', status_detail = 3,
                    authorization_code = COALESCE($2, authorization_code),
                    message = COALESCE($3, message)
              WHERE id = $1`,
            [txRow.id, tx?.authorization_code || null, tx?.message || null],
          );
          if (['trialing', 'active', 'past_due', 'suspended'].includes(sub.status)) {
            const base = sub.next_billing_date || new Date();
            await this.applyRecurringSuccess(
              { ...sub, next_billing_date: base },
              tx,
              Number(txRow.amount),
            );
          }
          return { handled: 'recurring_confirmed', verified: true };
        }
        if (failed && ['pending', 'unconfirmed'].includes(String(txRow.status))) {
          await this.db.query(
            `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message) WHERE id = $1`,
            [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
          );
          if (['trialing', 'active', 'past_due'].includes(sub.status)) {
            await this.applyRecurringDecline(sub, tx, Number(txRow.amount), tx?.message || 'declined (callback)');
          }
          return { handled: 'recurring_declined', verified: true };
        }
        if (reversal && String(txRow.status) === 'success') {
          return this.applyReversal(sub, txRow, tx);
        }
        return { handled: confirmed ? 'already_processed' : 'ignored', verified: false };
      }
    }

    // Link-to-Pay callbacks.
    if (devReference) {
      const ltp = await this.db.query(
        `SELECT id FROM nuvei_link_to_pay WHERE reference = $1`,
        [devReference],
      );
      if (ltp.rows[0]) {
        if (confirmed) {
          await this.db.query(
            `UPDATE nuvei_link_to_pay
               SET status = 'paid', provider_transaction_id = $2,
                   authorization_code = $3, paid_at = NOW()
             WHERE id = $1`,
            [ltp.rows[0].id, providerTxId, tx?.authorization_code || null],
          );
          return { handled: 'link_to_pay_paid', verified: true };
        }
        return { handled: 'link_to_pay_unconfirmed', verified: false };
      }
    }

    return { handled: confirmed ? 'confirmed_no_match' : 'ignored', verified: false };
  }

  /**
   * Nuvei reported a refund / chargeback / annulment of a charge (status 2).
   * A full reversal ends the subscription and its paid access; a partial
   * refund (status_detail 34) only annotates the charge.
   */
  private async applyReversal(sub: any, txRow: any, tx: any): Promise<{ handled: string; verified: boolean }> {
    const detail = Number(tx?.status_detail);
    if (detail === 34) {
      if (txRow) {
        await this.db.query(
          `UPDATE nuvei_transactions SET status = 'partially_refunded' WHERE id = $1 AND status <> 'refunded'`,
          [txRow.id],
        );
      }
      return { handled: 'partial_refund_noted', verified: true };
    }
    if (txRow) {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount WHERE id = $1`,
        [txRow.id],
      );
    }
    if (['trialing', 'active', 'past_due', 'suspended', 'pending_activation'].includes(sub.status)) {
      await this.revokeForRefund(sub.id);
      const plan = this.plan(sub.plan_key);
      await this.sendConfirmation({
        to: sub.email,
        userId: sub.user_id,
        subject: 'Your Cortexa refund has been processed',
        lines: [
          ['Plan', plan.label],
          ['Amount refunded', this.money(Number(tx?.amount ?? txRow?.amount ?? 0))],
          ['Original transaction', String(tx?.id || txRow?.provider_transaction_id || '—')],
          ['Status', 'Refunded'],
        ],
      });
      return { handled: 'reversed', verified: true };
    }
    return { handled: 'reversal_noted', verified: true };
  }

  /** Refund / chargeback: the subscription ends and paid access is revoked;
   * the login itself stays active (the customer can re-subscribe). */
  private async revokeForRefund(subscriptionId: string): Promise<void> {
    await this.db.query(
      `UPDATE nuvei_subscriptions
          SET status = 'refunded', next_billing_date = NULL, updated_at = NOW()
        WHERE id = $1`,
      [subscriptionId],
    );
    await this.mirrorBilling(subscriptionId, 'refunded', null);
    await this.db.query(
      `UPDATE users SET payment_status = 'refunded', updated_at = NOW()
        WHERE nuvei_subscription_id = $1`,
      [subscriptionId],
    );
  }

  private async markEventVerified(dedupe: string): Promise<void> {
    await this.db.query(
      `UPDATE nuvei_webhook_events SET verified = true WHERE dedupe_key = $1`,
      [dedupe],
    );
  }

  // ---- refunds ---------------------------------------------------------

  /**
   * Refund a Nuvei transaction (full or partial). Duplicate refunds are
   * prevented by a guard on the stored transaction row.
   */
  async refund(input: {
    transactionId: string;
    amount?: number;
    adminId?: string;
  }): Promise<{ ok: boolean; message: string; refundedAmount: number; full: boolean }> {
    this.assertEnabled();
    await this.ensureSchema();
    const transactionId = String(input.transactionId || '').trim();
    if (!transactionId) throw new BadRequestException('A transaction id is required.');

    const { rows } = await this.db.query(
      `SELECT id, subscription_id, user_id, amount, status, refunded_amount
         FROM nuvei_transactions WHERE provider_transaction_id = $1`,
      [transactionId],
    );
    const txRow = rows[0];
    if (!txRow) {
      throw new NotFoundException('Transaction not found in Cortexa records.');
    }
    if (txRow.status === 'refunded') {
      throw new BadRequestException('This transaction was already refunded.');
    }
    if (txRow.status !== 'success' && txRow.status !== 'partially_refunded') {
      throw new BadRequestException(
        `Only an approved charge can be refunded (this one is "${txRow.status}").`,
      );
    }

    // Amount: omitted = the remaining balance (full refund). A given amount
    // must be a positive number no larger than what is left; anything else is
    // rejected — it must never silently become a full refund.
    const charged = Number(txRow.amount);
    const already = Number(txRow.refunded_amount || 0);
    const remaining = Number((charged - already).toFixed(2));
    let amount = remaining;
    if (input.amount !== undefined && input.amount !== null) {
      const a = Number(input.amount);
      if (!Number.isFinite(a) || a <= 0) {
        throw new BadRequestException('Refund amount must be a positive number.');
      }
      if (a > remaining + 0.001) {
        throw new BadRequestException(
          `Refund amount exceeds the refundable balance of ${this.money(remaining)}.`,
        );
      }
      amount = Number(a.toFixed(2));
    }
    if (!(amount > 0)) throw new BadRequestException('Nothing left to refund.');
    const full = Math.abs(amount - remaining) < 0.005;

    const res = await this.client.refund(transactionId, full && already === 0 ? undefined : amount);
    const ok = String(res.body?.status || '').toLowerCase() === 'success';
    if (!ok) {
      throw new BadRequestException(
        `Refund failed: ${res.body?.detail || res.body?.error?.description || res.body?.error?.type || res.error || 'unknown error'}`,
      );
    }

    const newRefunded = Number((already + amount).toFixed(2));
    await this.db.query(
      `UPDATE nuvei_transactions
          SET refunded_amount = $2, status = $3
        WHERE id = $1`,
      [txRow.id, newRefunded, full ? 'refunded' : 'partially_refunded'],
    );
    // Only a FULL refund of a charge ends the subscription; a partial refund
    // (goodwill credit) keeps the customer's plan.
    if (full && txRow.subscription_id) {
      await this.revokeForRefund(txRow.subscription_id);
    }

    // Refund confirmation email.
    const email = await this.emailForTransaction(transactionId);
    if (email) {
      await this.sendConfirmation({
        to: email,
        userId: txRow?.user_id || undefined,
        subject: 'Your Cortexa refund has been processed',
        lines: [
          ['Amount refunded', this.money(amount)],
          ['Original transaction', transactionId],
          ['Status', full ? 'Refunded' : 'Partially refunded'],
        ],
        note: full
          ? 'Your subscription has ended and no further charges will be made.'
          : 'Your subscription continues; this is a partial refund of the charge above.',
      });
    }

    return {
      ok: true,
      message: full ? 'Refund processed.' : 'Partial refund processed.',
      refundedAmount: amount,
      full,
    };
  }

  private async emailForTransaction(providerTxId: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT s.email
         FROM nuvei_transactions t
         LEFT JOIN nuvei_subscriptions s ON s.id = t.subscription_id
        WHERE t.provider_transaction_id = $1
        LIMIT 1`,
      [providerTxId],
    );
    return rows[0]?.email || null;
  }

  // ---- cancellation ----------------------------------------------------

  /**
   * Cancel a subscription. Default: at the end of the period already paid
   * (trial end / next billing date) — access continues until then and no
   * further charge is made. `immediately` (or a subscription that has nothing
   * paid ahead: pending / failed / past_due / suspended) ends it right now.
   */
  async cancel(
    subscriptionId: string,
    userId?: string,
    immediately = false,
  ): Promise<{ ok: boolean; endsAt: string | null; immediate: boolean }> {
    await this.ensureSchema();
    const params: any[] = [subscriptionId];
    let where = `id = $1`;
    if (userId) {
      where += ` AND user_id = $2`;
      params.push(userId);
    }
    const { rows } = await this.db.query(
      `SELECT id, user_id, email, plan_key, status, next_billing_date, cancel_at_period_end
         FROM nuvei_subscriptions WHERE ${where}`,
      params,
    );
    const sub = rows[0];
    if (!sub) return { ok: false, endsAt: null, immediate: false };
    if (['canceled', 'refunded'].includes(sub.status)) {
      return { ok: true, endsAt: null, immediate: true };
    }

    const paidAhead =
      ['trialing', 'active'].includes(sub.status) &&
      sub.next_billing_date &&
      new Date(sub.next_billing_date).getTime() > Date.now();

    if (!immediately && paidAhead) {
      if (!sub.cancel_at_period_end) {
        await this.db.query(
          `UPDATE nuvei_subscriptions
              SET cancel_at_period_end = true, canceled_at = NOW(), updated_at = NOW()
            WHERE id = $1`,
          [sub.id],
        );
        const plan = this.plan(sub.plan_key);
        const endsAt = new Date(sub.next_billing_date).toISOString().slice(0, 10);
        await this.sendConfirmation({
          to: sub.email,
          userId: sub.user_id,
          subject: `Your Cortexa ${plan.label} cancellation is scheduled`,
          lines: [
            ['Plan', plan.label],
            ['Access until', endsAt],
            ['Charges', 'No further charges will be made.'],
          ],
          note: 'Your plan stays active until the date above, then your account moves to the Free tier.',
        });
      }
      return {
        ok: true,
        endsAt: new Date(sub.next_billing_date).toISOString(),
        immediate: false,
      };
    }

    // Immediate: end access now.
    await this.db.query(
      `UPDATE nuvei_subscriptions
          SET status = 'canceled', next_billing_date = NULL,
              canceled_at = COALESCE(canceled_at, NOW()), updated_at = NOW()
        WHERE id = $1`,
      [sub.id],
    );
    await this.mirrorBilling(sub.id, 'canceled', null);
    await this.db.query(
      `UPDATE users SET payment_status = 'canceled', updated_at = NOW()
        WHERE nuvei_subscription_id = $1`,
      [sub.id],
    );
    const plan = this.plan(sub.plan_key);
    await this.sendConfirmation({
      to: sub.email,
      userId: sub.user_id,
      subject: `Your Cortexa ${plan.label} subscription has been canceled`,
      lines: [
        ['Plan', plan.label],
        ['Status', 'Canceled'],
        ['Charges', 'No further charges will be made.'],
      ],
    });
    return { ok: true, endsAt: new Date().toISOString(), immediate: true };
  }

  // ---- Link to Pay (custom Web Solutions quotations) -------------------

  /**
   * Create a Nuvei Link-to-Pay for a manually-quoted amount. No fixed catalog:
   * the admin enters the approved amount and we generate a payment link.
   */
  async createLinkToPay(input: {
    amount: number;
    customerName: string;
    customerEmail: string;
    description: string;
    reference?: string;
    adminId?: string;
  }): Promise<{ reference: string; payUrl: string | null; status: string }> {
    this.assertEnabled();
    await this.ensureSchema();

    const amount = Number(input.amount);
    if (!(amount > 0)) throw new BadRequestException('A positive amount is required.');
    if (!/^\S+@\S+\.\S+$/.test(String(input.customerEmail || ''))) {
      throw new BadRequestException('A valid customer email is required.');
    }
    const reference = String(input.reference || '').trim() || this.devRef('WS');

    const res = await this.client.createLinkToPay({
      user: {
        id: `ws-${crypto.randomBytes(4).toString('hex')}`,
        email: input.customerEmail,
      },
      order: {
        amount,
        description: input.description || 'Cortexa Web Solutions',
        dev_reference: reference,
        currency: 'USD',
      },
    });

    const payUrl =
      res.body?.data?.payment?.payment_url ||
      res.body?.payment?.payment_url ||
      res.body?.payment_url ||
      null;

    await this.db.query(
      `INSERT INTO nuvei_link_to_pay
         (reference, customer_name, customer_email, description, amount, status, pay_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (reference)
       DO UPDATE SET pay_url = EXCLUDED.pay_url`,
      [
        reference,
        input.customerName || null,
        input.customerEmail,
        input.description || null,
        amount,
        payUrl ? 'pending' : 'error',
        payUrl,
        input.adminId || null,
      ],
    );

    if (!payUrl) {
      throw new BadRequestException(
        `Nuvei did not return a payment link: ${res.body?.detail || res.error || 'unknown error'}`,
      );
    }
    return { reference, payUrl, status: 'pending' };
  }

  // ---- provisioning (account access + admin billing mirror) ------------

  /** Write the account's plan access exactly like the Paddle path does. */
  private async provisionAccount(input: {
    userId: string;
    subscriptionId: string;
    plan: string;
    paymentStatus: 'trialing' | 'active';
    trialEnd: Date | null;
  }): Promise<void> {
    const planId = normalizePlanId(input.plan);
    await this.db.query(
      `UPDATE users
         SET payment_status = $2,
             is_active = true,
             plan = $3,
             checkout_status = 'paid',
             nuvei_subscription_id = $4,
             trial_ends_at = CASE WHEN $5::timestamptz IS NOT NULL THEN $5::timestamptz ELSE trial_ends_at END,
             updated_at = NOW()
       WHERE id = $1`,
      [input.userId, input.paymentStatus, planId, input.subscriptionId, input.trialEnd],
    );
  }

  /** Best-effort mirror into the team-scoped subscriptions/payments tables so
   * the admin Next-Billing / LTV views stay populated. Never throws. */
  private async mirrorBilling(
    subscriptionId: string,
    status: string,
    nextBilling: Date | null,
  ): Promise<void> {
    try {
      const { rows } = await this.db.query(
        `SELECT team_id, provision_plan, monthly_amount FROM nuvei_subscriptions WHERE id = $1`,
        [subscriptionId],
      );
      const sub = rows[0];
      if (!sub?.team_id) return;
      const seat = getSeatLimit(sub.provision_plan);
      // Map to the subscriptions.status CHECK domain (which has no 'refunded').
      const mapped =
        status === 'refunded'
          ? 'canceled'
          : ['active', 'past_due', 'canceled', 'suspended', 'trialing'].includes(
                status,
              )
            ? status
            : 'inactive';
      await this.db.query(
        `INSERT INTO subscriptions
           (team_id, provider, status, seat_limit, nuvei_subscription_id, current_period_end, created_at, updated_at)
         VALUES ($1,'nuvei',$2,$3,$4,$5,NOW(),NOW())
         ON CONFLICT (nuvei_subscription_id) WHERE nuvei_subscription_id IS NOT NULL
         DO UPDATE SET status = EXCLUDED.status,
                       seat_limit = EXCLUDED.seat_limit,
                       current_period_end = EXCLUDED.current_period_end,
                       updated_at = NOW()`,
        [sub.team_id, mapped, seat, subscriptionId, nextBilling],
      );
    } catch (err: any) {
      this.logger.warn(`nuvei billing mirror skipped: ${err?.message}`);
    }
  }

  private async resolveTeamId(userId: string): Promise<string | null> {
    try {
      const { rows } = await this.db.query(
        `SELECT COALESCE(u.team_id, (SELECT t.id FROM teams t WHERE t.owner_id = u.id LIMIT 1)) AS team_id
           FROM users u WHERE u.id = $1 LIMIT 1`,
        [userId],
      );
      return rows[0]?.team_id || null;
    } catch {
      return null;
    }
  }

  // ---- small helpers ---------------------------------------------------

  private async setSubStatus(id: string, status: SubStatus): Promise<void> {
    await this.db.query(
      `UPDATE nuvei_subscriptions SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, status],
    );
  }

  private async recordTransaction(input: {
    subscriptionId?: string;
    userId?: string;
    kind: string;
    dev_reference: string;
    amount: number;
    body: any;
  }): Promise<void> {
    const tx = input.body?.transaction || {};
    try {
      await this.db.query(
        `INSERT INTO nuvei_transactions
           (subscription_id, user_id, kind, dev_reference, provider_transaction_id,
            authorization_code, amount, status, status_detail, current_status, message, raw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          input.subscriptionId || null,
          input.userId || null,
          input.kind,
          input.dev_reference,
          tx.id || null,
          tx.authorization_code || null,
          input.amount,
          String(tx.status || 'failure'),
          tx.status_detail ?? null,
          tx.current_status || null,
          tx.message || input.body?.error || null,
          JSON.stringify(input.body || {}),
        ],
      );
    } catch (err: any) {
      if (err?.code !== '23505') {
        this.logger.warn(`recordTransaction failed: ${err?.message}`);
      }
    }
  }

  private money(n: number): string {
    return `$${Number(n).toFixed(2)}`;
  }

  private backendUrl(): string {
    return String(
      this.config.get('BACKEND_URL') ||
        this.config.get('PUBLIC_BACKEND_URL') ||
        'https://backend.cortexaaicrm.com',
    ).replace(/\/+$/, '');
  }

  /** Branded transactional email (activation / recurring / refund / failure). */
  private async sendConfirmation(input: {
    to: string;
    userId?: string;
    subject: string;
    lines: Array<[string, string]>;
    note?: string;
  }): Promise<void> {
    if (!input.to) return;
    const rows = input.lines
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;">${this.esc(
            k,
          )}</td><td style="padding:6px 12px;color:#111827;font-size:13px;font-weight:600;">${this.esc(
            v,
          )}</td></tr>`,
      )
      .join('');
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#111827;font-size:18px;margin:0 0 4px;">${this.esc(input.subject)}</h2>
        <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Cortexa AI CRM payment confirmation</p>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:10px;">${rows}</table>
        ${input.note ? `<p style="color:#6b7280;font-size:12px;margin:16px 0 0;">${this.esc(input.note)}</p>` : ''}
      </div>`;
    try {
      await this.mailer.sendCustomEmail({
        to: input.to,
        userId: input.userId || null,
        subject: input.subject,
        html,
      });
    } catch (err: any) {
      this.logger.warn(`Nuvei confirmation email failed: ${err?.message}`);
    }
  }

  private esc(s: string): string {
    return String(s ?? '').replace(/[&<>"]/g, (c) =>
      c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
    );
  }
}
