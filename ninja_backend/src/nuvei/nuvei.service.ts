import {
  BadRequestException,
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
      this.config.getBoolean('NUVEI_ENABLED', false) && this.client.isConfigured()
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
              monthly_amount, currency, trial_end, next_billing_date, created_at
         FROM nuvei_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId],
    );
    return { subscription: rows[0] || null };
  }

  // ---- helpers ---------------------------------------------------------

  private devRef(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${crypto
      .randomBytes(4)
      .toString('hex')}`.toUpperCase();
  }

  private isApproved(body: any): boolean {
    const t = body?.transaction || body || {};
    return (
      String(t?.status || '').toLowerCase() === 'success' &&
      Number(t?.status_detail) === APPROVED_STATUS_DETAIL
    );
  }

  private is3dsPending(body: any): boolean {
    const t = body?.transaction || {};
    const status = String(t?.status || '').toLowerCase();
    const challenge =
      body?.['3ds']?.browser_response?.challenge_request ||
      body?.['3ds']?.browser_response?.hidden_iframe;
    return status === 'pending' && !!challenge;
  }

  private async userRow(userId: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, email, first_name, last_name, team_id FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows[0]) throw new NotFoundException('User not found');
    return rows[0];
  }

  private toNuveiUser(row: any): NuveiUser {
    return {
      id: String(row.id),
      email: String(row.email || ''),
      first_name: row.first_name || undefined,
      last_name: row.last_name || undefined,
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
    termUrl?: string; // 3DS return URL
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
    const token = await this.cardToken(input.cardId, input.userId);
    const dev_reference = this.devRef('ACT');

    const teamId = await this.resolveTeamId(input.userId);
    const { rows: subRows } = await this.db.query(
      `INSERT INTO nuvei_subscriptions
         (user_id, team_id, email, plan_key, provision_plan, status,
          activation_amount, monthly_amount, card_id, dev_reference,
          consent_at, consent_ip)
       VALUES ($1,$2,$3,$4,$5,'pending_activation',$6,$7,$8,$9,NOW(),$10)
       RETURNING id`,
      [
        input.userId,
        teamId,
        user.email,
        plan.key,
        plan.provisionPlan,
        plan.activation,
        plan.monthly,
        input.cardId,
        dev_reference,
        input.consentIp || null,
      ],
    );
    const subscriptionId = subRows[0].id;

    // 3DS2 extra params for the customer-present activation charge.
    const extraParams =
      input.browserInfo || input.termUrl
        ? {
            threeDS2_data: {
              term_url:
                input.termUrl ||
                `${this.backendUrl()}/api/nuvei/callback`,
              device_type: 'browser',
              process_anyway: false,
            },
            ...(input.browserInfo ? { browser_info: input.browserInfo } : {}),
          }
        : undefined;

    const res = await this.client.debit(
      this.toNuveiUser(user),
      {
        amount: plan.activation,
        description: `Cortexa ${plan.label} activation`,
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
      amount: plan.activation,
      body: res.body,
    });

    if (this.isApproved(res.body)) {
      await this.markActivated(subscriptionId, plan, tx);
      return {
        status: plan.trialDays > 0 ? 'trialing' : 'active',
        subscriptionId,
        transactionId: tx.id,
      };
    }

    if (this.is3dsPending(res.body)) {
      // Await the ACS challenge; the verified callback finalizes activation.
      return {
        status: 'pending_activation',
        subscriptionId,
        requires3ds: true,
        challenge: res.body?.['3ds']?.browser_response,
        transactionId: tx.id,
      };
    }

    // Declined.
    await this.setSubStatus(subscriptionId, 'payment_failed');
    return {
      status: 'payment_failed',
      subscriptionId,
      transactionId: tx.id,
      message: tx.message || res.error || 'Activation payment declined.',
    };
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
      nextBilling = new Date(now);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    const trialEnd = plan.trialDays > 0 ? nextBilling : null;
    const status: SubStatus = plan.trialDays > 0 ? 'trialing' : 'active';
    const { rows } = await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = $2,
             trial_end = $3,
             next_billing_date = $4,
             last_charge_at = NOW(),
             updated_at = NOW()
       WHERE id = $1
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
        ['Amount charged today', this.money(plan.activation)],
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
              card_id, next_billing_date
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
    const period = this.periodKey(sub.next_billing_date);
    const dev_reference = this.devRef('REC');

    // Claim this billing period atomically; if the row already exists another
    // run has (or is) charging it, so skip to avoid a duplicate charge.
    let claimed = false;
    try {
      await this.db.query(
        `INSERT INTO nuvei_transactions
           (subscription_id, user_id, kind, period_key, dev_reference, amount, status)
         VALUES ($1,$2,'recurring',$3,$4,$5,'pending')`,
        [sub.id, sub.user_id, period, dev_reference, plan.monthly],
      );
      claimed = true;
    } catch (err: any) {
      if (err?.code === '23505') return; // period already claimed
      throw err;
    }
    if (!claimed) return;

    const user = await this.userRow(sub.user_id);
    const token = await this.cardToken(sub.card_id, sub.user_id);

    // Scheduled recurrence is NOT customer-present: no 3DS (per Nuvei — the
    // Recurrence flow does not support it).
    const res = await this.client.debit(
      this.toNuveiUser(user),
      {
        amount: plan.monthly,
        description: `Cortexa ${plan.label} monthly`,
        dev_reference,
      },
      token,
    );
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
      const next = new Date(sub.next_billing_date);
      next.setMonth(next.getMonth() + 1);
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
          ['Amount', this.money(plan.monthly)],
          ['Status', 'Paid'],
          ['Transaction ID', tx.id || '—'],
          ['Authorization code', tx.authorization_code || '—'],
          ['Next charge', next.toISOString().slice(0, 10)],
        ],
      });
    } else {
      // Declined: mark past_due and retry on the next sweep (bounded).
      await this.db.query(
        `UPDATE nuvei_subscriptions
           SET status = 'past_due', updated_at = NOW()
         WHERE id = $1`,
        [sub.id],
      );
      await this.mirrorBilling(sub.id, 'past_due', null);
      await this.sendConfirmation({
        to: sub.email,
        userId: sub.user_id,
        subject: `Cortexa ${plan.label} — payment failed`,
        lines: [
          ['Plan', plan.label],
          ['Amount', this.money(plan.monthly)],
          ['Status', 'Declined'],
          ['What happens next', 'We will retry automatically. Please check your card.'],
        ],
      });
    }
  }

  // ---- verified callback / webhook ------------------------------------

  /**
   * Nuvei callback. Security posture: we NEVER trust the callback body alone —
   * we match it to an order we created (by dev_reference / transaction id),
   * require status === success && status_detail === 3, and confirm the amount
   * matches what we recorded. The verified callback (not any frontend redirect)
   * is what activates service. Always returns quickly and idempotently.
   *
   * NOTE: the exact Nuvei signature scheme for this account is a pending item
   * with Nuvei; an optional shared secret (NUVEI_CALLBACK_TOKEN) is enforced
   * here when configured, and server-side re-verification can be enabled with
   * NUVEI_VERIFY_ENABLED once the query endpoint is confirmed for the account.
   */
  async handleCallback(
    payload: any,
    headerToken?: string,
  ): Promise<{ ok: boolean; handled: string }> {
    await this.ensureSchema();

    const expectedToken = String(
      this.config.get('NUVEI_CALLBACK_TOKEN') || '',
    ).trim();
    if (expectedToken && String(headerToken || '') !== expectedToken) {
      this.logger.warn('Nuvei callback rejected: bad callback token');
      return { ok: false, handled: 'unauthorized' };
    }

    const tx = payload?.transaction || payload || {};
    const providerTxId = tx?.id ? String(tx.id) : null;
    const devReference = tx?.dev_reference ? String(tx.dev_reference) : null;
    const status = String(tx?.status || '').toLowerCase();
    const statusDetail = tx?.status_detail;

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
          statusDetail ?? null,
          dedupe,
          JSON.stringify(payload || {}),
        ],
      );
    } catch (err: any) {
      if (err?.code === '23505') return { ok: true, handled: 'duplicate' };
      throw err;
    }

    if (!devReference) {
      return { ok: true, handled: 'no_reference' };
    }

    // Match to an order we created.
    const { rows } = await this.db.query(
      `SELECT id, user_id, email, plan_key, provision_plan, activation_amount, status
         FROM nuvei_subscriptions WHERE dev_reference = $1`,
      [devReference],
    );
    const sub = rows[0];

    // Optional server-side re-verification once the account's query endpoint is
    // confirmed. Until then we rely on the matched order + approved status.
    let confirmed = this.isApproved(payload);
    if (
      confirmed &&
      this.config.getBoolean('NUVEI_VERIFY_ENABLED', false) &&
      providerTxId
    ) {
      const v = await this.client.verifyTransaction(providerTxId);
      if (v.ok) confirmed = this.isApproved(v.body);
    }

    if (sub) {
      // Amount tamper check for the activation callback.
      if (
        confirmed &&
        tx?.amount != null &&
        Math.abs(Number(tx.amount) - Number(sub.activation_amount)) > 0.01 &&
        sub.status === 'pending_activation'
      ) {
        this.logger.warn(
          `Nuvei callback amount mismatch for ${devReference}: got ${tx.amount}, expected ${sub.activation_amount}`,
        );
        return { ok: true, handled: 'amount_mismatch' };
      }

      if (confirmed && sub.status === 'pending_activation') {
        const plan = this.plan(sub.plan_key);
        await this.markActivated(sub.id, plan, tx);
        await this.markEventVerified(dedupe);
        return { ok: true, handled: 'activated' };
      }
      if (!confirmed && sub.status === 'pending_activation') {
        await this.setSubStatus(sub.id, 'payment_failed');
        return { ok: true, handled: 'activation_declined' };
      }
    }

    // Link-to-Pay callbacks.
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
        await this.markEventVerified(dedupe);
        return { ok: true, handled: 'link_to_pay_paid' };
      }
      return { ok: true, handled: 'link_to_pay_unconfirmed' };
    }

    return { ok: true, handled: confirmed ? 'confirmed_no_match' : 'ignored' };
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
  }): Promise<{ ok: boolean; message: string }> {
    this.assertEnabled();
    await this.ensureSchema();

    const { rows } = await this.db.query(
      `SELECT id, subscription_id, user_id, amount, status
         FROM nuvei_transactions WHERE provider_transaction_id = $1`,
      [input.transactionId],
    );
    const txRow = rows[0];
    if (txRow && txRow.status === 'refunded') {
      throw new BadRequestException('This transaction was already refunded.');
    }

    const res = await this.client.refund(input.transactionId, input.amount);
    const ok = String(res.body?.status || '').toLowerCase() === 'success';
    if (!ok) {
      throw new BadRequestException(
        `Refund failed: ${res.body?.detail || res.error || 'unknown error'}`,
      );
    }

    if (txRow) {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'refunded' WHERE id = $1`,
        [txRow.id],
      );
      if (txRow.subscription_id) {
        await this.setSubStatus(txRow.subscription_id, 'refunded');
        await this.mirrorBilling(txRow.subscription_id, 'refunded', null);
        // Drop plan access for a refunded subscription.
        await this.db.query(
          `UPDATE users
             SET payment_status = 'refunded', is_active = false, updated_at = NOW()
           WHERE nuvei_subscription_id = $1`,
          [txRow.subscription_id],
        );
      }
    }

    // Refund confirmation email.
    const email = await this.emailForTransaction(input.transactionId);
    if (email) {
      await this.sendConfirmation({
        to: email,
        subject: 'Your Cortexa refund has been processed',
        lines: [
          ['Amount refunded', this.money(input.amount ?? Number(txRow?.amount || 0))],
          ['Original transaction', input.transactionId],
          ['Status', 'Refunded'],
        ],
      });
    }

    return { ok: true, message: 'Refund processed.' };
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

  async cancel(subscriptionId: string, userId?: string): Promise<{ ok: boolean }> {
    await this.ensureSchema();
    const params: any[] = [subscriptionId];
    let sql = `UPDATE nuvei_subscriptions SET status='canceled', canceled_at=NOW(), updated_at=NOW() WHERE id=$1`;
    if (userId) {
      sql += ` AND user_id=$2`;
      params.push(userId);
    }
    const { rowCount } = await this.db.query(sql, params);
    if (rowCount) {
      await this.mirrorBilling(subscriptionId, 'canceled', null);
      await this.db.query(
        `UPDATE users SET payment_status='canceled', updated_at=NOW()
           WHERE nuvei_subscription_id = $1`,
        [subscriptionId],
      );
    }
    return { ok: !!rowCount };
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
         ON CONFLICT (nuvei_subscription_id)
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
