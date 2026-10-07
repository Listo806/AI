import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import type { PoolClient } from 'pg';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import { NuveiClientService, NuveiUser } from './nuvei-client.service';
import { RenewalReportingService } from './renewal-reporting.service';
import { decryptToken, encryptToken, tokenFingerprint } from './nuvei-crypto.util';
import { PLANS, PlanId, getSeatLimit, normalizePlanId } from '../plans/plan-config';
import { ensureAcquisitionColumns, landingSlug } from '../common/acquisition.util';
import { cleanGaClientId, ga4Settings, sendGa4Event } from '../common/ga4-measurement.util';
import { WorkspaceEntitlementsService } from '../workspaces/workspace-entitlements.service';
import { getWorkspace, WorkspaceDef } from '../workspaces/workspace-registry';

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

type NuveiPlanKey = 'solo' | 'business' | 'scale' | 'ecommerce';

interface NuveiPlan {
  key: NuveiPlanKey;
  provisionPlan: PlanId | 'ecommerce'; // Agentic plan id, or the standalone E-Commerce product
  label: string;
  activation: number; // customer-present charge today (USD)
  monthly: number; // recurring charge (USD)
  trialDays: number; // days until the first monthly charge
  grantsIncludedWorkspace?: boolean;
}

export type SubStatus =
  | 'pending_activation'
  | 'verification_pending'
  | 'trialing'
  | 'active'
  | 'payment_failed'
  | 'past_due'
  | 'canceled'
  | 'suspended'
  | 'refunded';

const APPROVED_STATUS_DETAIL = 3;

// Paid Workspace add-on: each additional Workspace is $97/month, billed as its
// own Nuvei add-on (nuvei_workspace_addons), never through nuvei_subscriptions
// (that table holds exactly one base CRM plan per customer). Server-side
// price; NUVEI_WORKSPACE_ADDON_CENTS can override it per environment.
const WORKSPACE_ADDON_MONTHLY_CENTS = 9700;

export type AddonStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'canceled'
  | 'refunded'
  | 'payment_failed';

/** Transaction kinds of a Workspace add-on charge (nuvei_transactions.kind ≤ 16). */
const ADDON_KINDS = ['addon', 'addon_renewal'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What the Workspace add-on endpoints answer (the gate UI reads `status`). */
export interface WorkspaceAddonResult {
  // 'confirm' = quote only (nothing charged); 'card_required' = no saved card.
  status: AddonStatus | 'confirm' | 'card_required';
  workspaceId: string;
  workspaceRoute: string;
  amount: number;
  currency: string;
  addonId?: string;
  alreadyEntitled?: boolean;
  comped?: boolean;
  supportAccess?: boolean;
  requires3ds?: boolean;
  challenge?: any;
  transactionId?: string;
  card?: { id: string; last4: string | null; brand: string | null } | null;
  code?: string;
  message?: string;
  nextBillingDate?: string | null;
  cancelAtPeriodEnd?: boolean;
}

@Injectable()
export class NuveiService {
  private readonly logger = new Logger(NuveiService.name);
  private schemaReady = false;
  private addonSchemaReady = false;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
    private readonly client: NuveiClientService,
    private readonly renewalReporting: RenewalReportingService,
    private readonly workspaceEntitlements: WorkspaceEntitlementsService,
  ) {
    // Email verification is the final activation boundary for paid Nuvei accounts.
    // Register the promotion hook here so verification and subscription activation
    // commit atomically on the same PostgreSQL connection.
    this.mailer.registerPaidActivationHandler({
      activate: (client, userId) => this.activateAfterEmailVerification(client, userId),
      afterCommit: (result) =>
        this.mirrorBilling(result.subscriptionId, result.paymentStatus, result.nextBilling),
    });
  }

  // ---- feature flags ---------------------------------------------------

  enabled(): boolean {
    return (
      this.config.getBoolean('NUVEI_ENABLED', false) &&
      this.client.isConfigured() &&
      // Card tokens are sealed with this key before they touch the database;
      // without it no card can be saved or charged, so the engine is off.
      !!String(this.config.get('NUVEI_TOKEN_ENC_KEY') || '').trim() &&
      // The gateway environment must be chosen on purpose: an unset value
      // must never quietly run a production site against the test gateway.
      ['staging', 'production', 'prod'].includes(
        String(this.config.get('NUVEI_ENVIRONMENT') || '').trim().toLowerCase(),
      )
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
    if (k === 'solo' || k === 'business' || k === 'scale') {
      const p = PLANS[k];
      return { key: k, provisionPlan: k, label: p.label, activation: p.pricing.introCents / 100, monthly: p.pricing.monthlyCents / 100, trialDays: 14 };
    }
    // Runtime fallback only. E-Commerce checkout itself always loads the existing
    // Admin Plans row with ecommercePlan() before any amount is charged.
    if (k === 'ecommerce') {
      return { key: 'ecommerce', provisionPlan: 'ecommerce', label: 'E-Commerce CRM', activation: 397, monthly: 397, trialDays: 0 };
    }
    throw new BadRequestException(`Unknown Nuvei plan: ${key}`);
  }

  /** Reuse the existing Admin Plans record for E-Commerce; never creates a plan. */
  private async ecommercePlan(): Promise<NuveiPlan> {
    const { rows } = await this.db.query(
      `SELECT name, price
         FROM subscription_plans
        WHERE is_active = TRUE AND deleted_at IS NULL
          AND price = 397
          AND (LOWER(name) LIKE '%e-commerce%' OR LOWER(name) LIKE '%ecommerce%'
               OR LOWER(COALESCE(plan_category,'')) IN ('ecommerce','e-commerce'))
        ORDER BY CASE WHEN LOWER(name) LIKE '%e-commerce%' OR LOWER(name) LIKE '%ecommerce%' THEN 0 ELSE 1 END, created_at ASC
        LIMIT 1`,
    );
    if (!rows[0]) {
      throw new BadRequestException('The existing $397/month E-Commerce plan is not active in Admin Plans.');
    }
    const monthly = Number(rows[0].price);
    if (monthly !== 397) throw new BadRequestException('The E-Commerce Admin Plan must be $397/month.');
    return { key: 'ecommerce', provisionPlan: 'ecommerce', label: rows[0].name || 'E-Commerce CRM', activation: monthly, monthly, trialDays: 0 };
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
        product_key VARCHAR(32) NOT NULL DEFAULT 'agentic',
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
        -- Where this particular purchase came from, copied from the customer
        -- at the moment they paid. Kept here as well as on the customer so a
        -- revenue report by campaign reads one row and cannot be changed by a
        -- later visit through another channel.
        acquisition JSONB,
        canceled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.db.query(`
      ALTER TABLE nuvei_subscriptions
        ADD COLUMN IF NOT EXISTS product_key VARCHAR(32) NOT NULL DEFAULT 'agentic'
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

    // One LIVE subscription per customer, enforced by the database: two
    // activations approved at the same instant cannot both become live.
    // Any pre-existing duplicate (from before this rule) is retired first,
    // keeping the one the account actually points at, otherwise the newest.
    try {
      const { rows: dupes } = await this.db.query(
        `UPDATE nuvei_subscriptions s
            SET status = 'canceled', next_billing_date = NULL,
                canceled_at = COALESCE(canceled_at, NOW()), updated_at = NOW()
          WHERE s.status IN ('verification_pending','trialing','active')
            AND EXISTS (
              SELECT 1 FROM nuvei_subscriptions o
               WHERE o.user_id = s.user_id AND o.id <> s.id
                 AND o.status IN ('verification_pending','trialing','active')
                 AND (o.id = (SELECT u.nuvei_subscription_id FROM users u WHERE u.id = s.user_id)
                      OR (s.id <> (SELECT u.nuvei_subscription_id FROM users u WHERE u.id = s.user_id) IS NOT FALSE
                          AND (o.created_at, o.id::text) > (s.created_at, s.id::text))))
          RETURNING s.id, s.user_id`,
      );
      if (dupes.length) {
        this.logger.warn(
          `retired ${dupes.length} duplicate live Nuvei subscription(s): ${dupes.map((d: any) => d.id).join(', ')}`,
        );
      }
      await this.db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS nuvei_sub_one_live_uidx
           ON nuvei_subscriptions (user_id)
           WHERE status IN ('verification_pending','trialing','active')`,
      );
    } catch (err: any) {
      // Never block startup on this hardening step.
      this.logger.warn(`one-live-subscription index not created: ${err?.message}`);
    }
    // Cancel keeps access until the paid period ends; the sweep finalizes it.
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false`,
    );
    // Where the browser lands after a 3DS challenge (our checkout page).
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS return_url TEXT`,
    );
    // What brought the customer, copied onto the purchase itself.
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS acquisition JSONB`,
    );
    // Stamped once the activation payment was reported to GA4 (migration 173).
    await this.db.query(
      `ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS analytics_activation_reported_at TIMESTAMPTZ`,
    );
    // Nuvei's own Link-to-Pay order id, returned as data.order.id.
    await this.db.query(
      `ALTER TABLE nuvei_link_to_pay ADD COLUMN IF NOT EXISTS ltp_id TEXT`,
    );
    // Running total of partial refunds on a charge.
    await this.db.query(
      `ALTER TABLE nuvei_transactions ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0`,
    );
    // Statuses such as 'partially_refunded' / 'refund_pending' need more than
    // the original VARCHAR(16).
    await this.db.query(`
      DO $$
      BEGIN
        IF (SELECT character_maximum_length FROM information_schema.columns
             WHERE table_name = 'nuvei_transactions' AND column_name = 'status') < 32 THEN
          ALTER TABLE nuvei_transactions ALTER COLUMN status TYPE VARCHAR(32);
        END IF;
        IF (SELECT character_maximum_length FROM information_schema.columns
             WHERE table_name = 'nuvei_webhook_events' AND column_name = 'status') < 32 THEN
          ALTER TABLE nuvei_webhook_events ALTER COLUMN status TYPE VARCHAR(32);
        END IF;
        IF (SELECT character_maximum_length FROM information_schema.columns
             WHERE table_name = 'nuvei_transactions' AND column_name = 'period_key') < 64 THEN
          ALTER TABLE nuvei_transactions ALTER COLUMN period_key TYPE VARCHAR(64);
        END IF;
      END $$;
    `);
    // The shared billing tables the mirror writes to (migration 162) — self-heal
    // so the admin Next-Billing / LTV views work without a manual migration.
    await this.db.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS nuvei_subscription_id UUID`);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_nuvei_sub_uidx
         ON subscriptions (nuvei_subscription_id) WHERE nuvei_subscription_id IS NOT NULL`,
    );

    this.schemaReady = true;
  }

  // ---- public config ---------------------------------------------------

  publicConfig() {
    return {
      enabled: this.enabled(),
      ...this.client.publicConfig(),
      plans: (['solo', 'business', 'scale'] as NuveiPlanKey[]).map(
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
  async getUserSubscription(userId: string, productKey?: string) {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT s.id, s.plan_key, s.provision_plan, s.status, s.activation_amount,
              s.monthly_amount, s.currency, s.trial_end, s.next_billing_date,
              s.cancel_at_period_end, s.canceled_at, s.created_at,
              (SELECT t.provider_transaction_id FROM nuvei_transactions t
                WHERE t.subscription_id = s.id AND t.kind = 'activation'
                ORDER BY t.created_at DESC LIMIT 1) AS activation_transaction_id
         FROM nuvei_subscriptions s
        WHERE s.user_id = $1
          AND ($2::text IS NULL OR s.product_key = $2)
        ORDER BY (s.status IN ('verification_pending','trialing','active')) DESC,
                 (s.status = 'pending_activation' AND s.created_at > NOW() - interval '48 hours') DESC,
                 s.created_at DESC
        LIMIT 1`,
      [userId, productKey ? String(productKey).toLowerCase() : null],
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
      `SELECT s.id, s.user_id, s.email, s.status, s.plan_key, s.activation_amount,
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
    if (!sub.provider_transaction_id) {
      // Nothing to verify. After Nuvei's 48h callback window nothing can
      // confirm it any more: close it (a later callback still activates or
      // refunds through the payment_failed path).
      const { rowCount } = await this.db.query(
        `UPDATE nuvei_subscriptions SET status = 'payment_failed', updated_at = NOW()
          WHERE id = $1 AND status = 'pending_activation' AND created_at < NOW() - interval '48 hours'`,
        [sub.id],
      );
      return rowCount ? 'payment_failed' : sub.status;
    }

    const info = await this.client.verifyTransaction(sub.provider_transaction_id);
    if (!info.ok || !info.body?.transaction) return sub.status;
    const tx = info.body.transaction;

    if (this.isApproved(info.body)) {
      if (!this.amountMatches(tx.amount, sub.activation_amount)) {
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
      const outcome = await this.activateLate(sub, plan, tx);
      if (outcome === 'verification_pending' || outcome === 'active') return outcome;
      return outcome === 'duplicate_refunded' ? 'refunded' : 'payment_failed';
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
    await this.debitDue(subscriptionId);
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

  /**
   * Amount tamper check that fails CLOSED: a missing amount is accepted (not
   * every callback carries it) but a non-numeric or different one is not.
   */
  private amountMatches(got: any, expected: any): boolean {
    if (got === undefined || got === null || got === '') return true;
    const g = Number(got);
    const e = Number(expected);
    if (!Number.isFinite(g) || !Number.isFinite(e)) return false;
    return Math.abs(g - e) <= 0.01;
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
      [7, 8, 29, 34].includes(detail)
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
                     status = COALESCE(EXCLUDED.status, nuvei_cards.status),
                     bin = COALESCE(EXCLUDED.bin, nuvei_cards.bin),
                     last4 = COALESCE(EXCLUDED.last4, nuvei_cards.last4),
                     brand = COALESCE(EXCLUDED.brand, nuvei_cards.brand),
                     holder_name = COALESCE(EXCLUDED.holder_name, nuvei_cards.holder_name),
                     expiry_month = COALESCE(EXCLUDED.expiry_month, nuvei_cards.expiry_month),
                     expiry_year = COALESCE(EXCLUDED.expiry_year, nuvei_cards.expiry_year),
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
    let details: any = {};
    if (!input.last4 || !input.bin) {
      // The SDK's "already added" answer carries only the token: look the
      // card up at Nuvei so last4 / brand / expiry are stored correctly.
      try {
        const res = await this.client.listCards(String(input.userId));
        const list: any[] = Array.isArray(res.body?.cards) ? res.body.cards : [];
        details = list.find((c) => String(c?.token || '') === token) || {};
      } catch (err: any) {
        this.logger.warn(`Nuvei card lookup failed for ${input.userId}: ${err?.message}`);
      }
    }
    const cardId = await this.saveCard({
      userId: input.userId,
      email: user.email,
      token,
      bin: input.bin || details.bin,
      last4: input.last4 || details.number,
      brand: input.brand || details.type,
      holderName: input.holderName || details.holder_name,
      expiryMonth: input.expiryMonth || (details.expiry_month != null ? String(details.expiry_month) : undefined),
      expiryYear: input.expiryYear || (details.expiry_year != null ? String(details.expiry_year) : undefined),
      status: input.status || details.status,
      transactionReference: input.transactionReference || details.transaction_reference,
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
    gaClientId?: string; // the browser's GA4 client id (analytics only)
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
    const requestedKey = String(input.planKey || '').trim().toLowerCase();
    const plan = requestedKey === 'ecommerce' ? await this.ecommercePlan() : this.plan(requestedKey);
    const productKey = plan.key === 'ecommerce' ? 'ecommerce' : 'agentic';
    const user = await this.userRow(input.userId);

    // Nuvei's documented staging cards for 3DS require a specific order
    // description + amount ("3DS Challenge" 151 / "3DS FrictionLess" >=150).
    // Honored ONLY on the staging gateway so the challenge screen can be tested.
    let activationAmount = plan.activation;
    let activationDescription = plan.key === 'ecommerce' ? `Cortexa ${plan.label} monthly subscription` : `Cortexa ${plan.label} activation`;
    const scenario = String(input.testScenario || '').trim().toLowerCase();
    if (scenario && this.client.environment() === 'staging') {
      if (scenario === '3ds_challenge') {
        activationAmount = 151;
        activationDescription = '3DS Challenge';
      } else if (scenario === '3ds_frictionless') {
        activationAmount = 150;
        activationDescription = '3DS FrictionLess';
      } else if (scenario === 'review') {
        // Nuvei staging: this description answers status=pending, detail=1
        // (bank/anti-fraud review) — exercises the pending -> callback path.
        activationDescription = 'Reviewed transaction';
      } else if (scenario === 'denied') {
        activationDescription = 'Denied transaction';
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
        WHERE user_id = $1 AND product_key = $2 AND status IN ('verification_pending','trialing','active')
        ORDER BY created_at DESC LIMIT 1`,
      [input.userId, productKey],
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
      `SELECT s.id, t.status AS tx_status, t.status_detail, t.created_at AS tx_at
         FROM nuvei_subscriptions s
         JOIN nuvei_transactions t
           ON t.subscription_id = s.id AND t.kind = 'activation'
        WHERE s.user_id = $1 AND s.product_key = $2 AND s.status = 'pending_activation'
          AND s.created_at > NOW() - interval '2 hours'
          AND t.status IN ('pending','unconfirmed')
        ORDER BY s.created_at DESC LIMIT 1`,
      [input.userId, productKey],
    );
    if (pendingRows[0]) {
      const p = pendingRows[0];
      const st = await this.reconcilePendingActivation(p.id);
      if (st === 'trialing' || st === 'active') {
        // The earlier attempt just got confirmed: that IS the customer's
        // activation, not an error.
        return { status: st, subscriptionId: p.id };
      }
      if (st === 'pending_activation') {
        const ageMs = Date.now() - new Date(p.tx_at || Date.now()).getTime();
        const detail = Number(p.status_detail);
        // An abandoned 3DS challenge (customer pressed Back, OTP never came)
        // times out within minutes at the bank: let them try again after 3
        // minutes instead of locking them out. A charge the gateway never
        // answered gets 15 minutes for the callback; anything a late
        // approval could still confirm is refunded as a duplicate
        // (activateLate), so waiting longer protects nobody.
        const threeDs = detail === 35 || detail === 36;
        const limitMs = threeDs ? 3 * 60_000 : String(p.tx_status) === 'unconfirmed' ? 15 * 60_000 : 2 * 60 * 60_000;
        if (ageMs < limitMs) {
          return {
            status: 'pending_activation',
            subscriptionId: p.id,
            message: 'Your previous payment is still being verified. Your account will activate automatically once confirmed.',
          };
        }
        this.logger.warn(`Nuvei activation ${p.id} abandoned (${threeDs ? '3DS' : p.tx_status}, ${Math.round(ageMs / 1000)}s); allowing a new attempt`);
        await this.db.query(
          `UPDATE nuvei_subscriptions SET status = 'payment_failed', updated_at = NOW()
            WHERE id = $1 AND status = 'pending_activation'`,
          [p.id],
        );
      }
    }

    const token = await this.cardToken(cardId, input.userId);
    const dev_reference = this.devRef('ACT');

    const teamId = await this.resolveTeamId(input.userId);
    const returnUrl = this.safeReturnUrl(input.termUrl, plan.key);
    let subscriptionId: string;
    try {
      const { rows: subRows } = await this.db.query(
      `INSERT INTO nuvei_subscriptions
         (user_id, team_id, email, plan_key, product_key, provision_plan, status,
          activation_amount, monthly_amount, card_id, dev_reference,
          consent_at, consent_ip, return_url, acquisition)
       VALUES ($1,$2,$3,$4,$5,$6,'pending_activation',$7,$8,$9,$10,NOW(),$11,$12,$13)
       RETURNING id`,
      [
        input.userId,
        teamId,
        user.email,
        plan.key,
        productKey,
        plan.provisionPlan,
        activationAmount,
        plan.monthly,
        cardId,
        dev_reference,
        input.consentIp || null,
        returnUrl,
        JSON.stringify({
          ...(await this.acquisitionSnapshot(input.userId)),
          // The paying browser's GA4 client id, so the server-side
          // payment_confirmed_backend event joins the visitor's GA4 user.
          ga_client_id: cleanGaClientId(input.gaClientId),
        }),
      ],
    );
      subscriptionId = subRows[0].id;
    } catch (err: any) {
      // Final concurrency guard: two tabs can both pass the earlier SELECTs
      // before either INSERT is visible. The partial unique index lets only
      // one open/payable subscription exist for this customer.
      if (String(err?.code || '') === '23505' && String(err?.constraint || '').includes('nuvei_one_open_subscription_per_user')) {
        const { rows } = await this.db.query(
          `SELECT id, status FROM nuvei_subscriptions
            WHERE user_id = $1 AND product_key = $2
              AND status IN ('pending_activation','verification_pending','trialing','active')
            ORDER BY created_at DESC LIMIT 1`,
          [input.userId, productKey],
        );
        const existing = rows[0];
        if (existing) {
          return {
            status: existing.status,
            subscriptionId: existing.id,
            message: existing.status === 'pending_activation'
              ? 'Your payment is already being verified. Please wait for confirmation before trying again.'
              : 'Your account already has a confirmed activation.',
          };
        }
      }
      throw err;
    }

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

    // The charge row exists BEFORE the bank is asked, so a second click or
    // second tab during the (up to 45s) call sees an in-flight attempt.
    await this.db.query(
      `INSERT INTO nuvei_transactions
         (subscription_id, user_id, kind, dev_reference, amount, status, message)
       VALUES ($1,$2,'activation',$3,$4,'pending','charge in progress')`,
      [subscriptionId, input.userId, dev_reference, activationAmount],
    );

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
    // No answer (timeout / network) or a gateway-side 5xx: the charge may or
    // may not have reached the bank. Leave it awaiting confirmation — never
    // call it declined (a retry could double charge), never activate unpaid.
    const unconfirmed = res.httpStatus === 0 || !res.body || (res.httpStatus >= 500 && !tx?.status);
    await this.recordTransaction({
      subscriptionId,
      userId: input.userId,
      kind: 'activation',
      dev_reference,
      amount: activationAmount,
      body: res.body,
      statusOverride: unconfirmed ? 'unconfirmed' : undefined,
    });

    if (unconfirmed) {
      this.logger.error(
        `Nuvei activation unconfirmed for sub ${subscriptionId}: HTTP ${res.httpStatus} ${res.error || JSON.stringify(res.body || {}).slice(0, 200)}`,
      );
      return {
        status: 'pending_activation',
        subscriptionId,
        message: 'We could not confirm the payment yet. Your account will activate automatically once it is confirmed.',
      };
    }

    if (this.isApproved(res.body)) {
      const outcome = await this.activateLate(
        { id: subscriptionId, user_id: input.userId, email: user.email, plan_key: plan.key, activation_amount: activationAmount },
        plan,
        tx,
      );
      if (outcome === 'active') {
        return { status: 'active', subscriptionId, transactionId: tx.id, message: 'Payment received. Your E-Commerce CRM is active.' };
      }
      if (outcome !== 'verification_pending') {
        return {
          status: outcome === 'duplicate_refunded' ? 'refunded' : 'payment_failed',
          subscriptionId, transactionId: tx.id,
          message: `You already have an active ${plan.label} subscription. This payment has been ${outcome === 'duplicate_refunded' ? 'refunded' : 'flagged for refund'}.`,
        };
      }
      return { status: 'verification_pending', subscriptionId, transactionId: tx.id, message: 'Payment received. Verify your email to activate your account.' };
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
      planKey === 'business'
        ? 'team'
        : planKey === 'scale'
          ? 'growth'
          : 'solo';
    const fallback = planKey === 'ecommerce'
      ? `${this.frontendUrl()}/e-commerce/checkout?billing=monthly&threeds=return`
      : `${this.frontendUrl()}/checkout?plan=${checkoutKey}&threeds=return`;
    const raw = String(candidate || '').trim();
    if (!raw) return fallback;
    try {
      const u = new URL(raw);
      const allowed = new Set(this.frontendOrigins());
      if (!allowed.has(u.origin)) return fallback;
      if (!u.searchParams.has('threeds')) u.searchParams.set('threeds', 'return');
      return u.toString();
    } catch {
      return fallback;
    }
  }

  /** FRONTEND_URL may be a comma-separated CORS list; every entry is a
   * trusted origin, the first public https one is the canonical site. */
  private frontendOrigins(): string[] {
    const raw = String(
      this.config.get('FRONTEND_URL') || this.config.get('PUBLIC_FRONTEND_URL') || '',
    );
    const out: string[] = [];
    for (const part of raw.split(',')) {
      const v = part.trim().replace(/\/+$/, '');
      if (!v) continue;
      try {
        out.push(new URL(v).origin);
      } catch {
        /* ignore malformed entries */
      }
    }
    for (const o of ['https://www.cortexaaicrm.com', 'https://cortexaaicrm.com']) {
      if (!out.includes(o)) out.push(o);
    }
    return out;
  }

  private frontendUrl(): string {
    const origins = this.frontendOrigins();
    return (
      origins.find((o) => o.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(o)) ||
      origins[0] ||
      'https://www.cortexaaicrm.com'
    );
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
      const res = await this.client.threeDsContinue(
        sub.user_id,
        sub.provider_transaction_id,
      );
      this.logger.log(
        `Nuvei 3DS continue for sub ${sub.id}: HTTP ${res.httpStatus} ` +
          `status ${res.body?.transaction?.status ?? '-'}/${res.body?.transaction?.status_detail ?? '-'}`,
      );
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
      `SELECT s.id, s.user_id, s.status, s.plan_key, s.return_url, t.provider_transaction_id
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
      const v = await this.client.threeDsVerify(
        sub.user_id,
        sub.provider_transaction_id,
        cres,
      );
      this.logger.log(
        `Nuvei 3DS challenge result for sub ${sub.id}: HTTP ${v.httpStatus} ` +
          `status ${v.body?.transaction?.status ?? '-'}/${v.body?.transaction?.status_detail ?? '-'}`,
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
    // UTC throughout: period keys are UTC dates, so the stepped calendar day
    // and the key always agree regardless of the server's timezone.
    const r = new Date(d);
    const day = r.getUTCDate();
    r.setUTCDate(1);
    r.setUTCMonth(r.getUTCMonth() + months);
    const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
    r.setUTCDate(Math.min(day, last));
    return r;
  }

  /** Flip a subscription to trialing/active and grant plan access + email. */
  private async markActivated(
    subscriptionId: string,
    plan: NuveiPlan,
    tx: any,
  ): Promise<void> {
    // Nuvei approval proves payment, not account activation. Hold the paid
    // subscription until email verification; do not start the trial/billing
    // clock or grant CRM/workspace access here.
    let userId: string | null = null;

    // E-Commerce has no Agentic activation fee or 14-day trial. Its first
    // $397 monthly payment is the first paid month, so access starts as soon as
    // Nuvei confirms the charge. The saved token is then reused by the same
    // recurring engine one month later.
    if (plan.key === 'ecommerce') {
      const now = new Date();
      const next = this.addMonths(now, 1);
      const { rows } = await this.db.query(
        `UPDATE nuvei_subscriptions
            SET status='active', trial_end=NULL, next_billing_date=$2,
                last_charge_at=NOW(), updated_at=NOW()
          WHERE id=$1 AND status IN ('pending_activation','payment_failed')
          RETURNING user_id,email`,
        [subscriptionId, next],
      );
      const sub = rows[0];
      if (!sub) return;
      await this.provisionAccount({ userId: sub.user_id, subscriptionId, plan: 'ecommerce', paymentStatus: 'active', trialEnd: null });
      await this.sendConfirmation({
        to: sub.email, userId: sub.user_id,
        subject: 'Cortexa E-Commerce CRM — payment received',
        lines: [
          ['Plan', plan.label], ['Amount', this.money(Number(tx?.amount ?? plan.monthly))],
          ['Status', 'Paid'], ['Transaction ID', tx?.id || '—'],
          ['Authorization code', tx?.authorization_code || '—'],
          ['Next charge', next.toISOString().slice(0, 10)],
        ],
      });
      return;
    }

    await this.db.transaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE nuvei_subscriptions
            SET status='verification_pending',
                trial_end=NULL, next_billing_date=NULL,
                last_charge_at=NOW(), updated_at=NOW()
          WHERE id=$1 AND status IN ('pending_activation','payment_failed')
          RETURNING user_id,email,plan_key,provision_plan,activation_amount`,
        [subscriptionId],
      );
      const sub = rows[0];
      if (!sub) return;
      userId = String(sub.user_id);

      await client.query(
        `UPDATE users
            SET plan=$2, checkout_status='paid', nuvei_subscription_id=$3, updated_at=NOW()
          WHERE id=$1`,
        [sub.user_id, normalizePlanId(sub.provision_plan), subscriptionId],
      );
    });

    if (!userId) return;
    // Server-side confirmation of the activation payment to GA4 (never to
    // Google Ads). Fire-and-forget: analytics can never delay activation.
    void this.reportActivationConfirmed(subscriptionId, plan, tx, userId);
    const finalStatus: 'trialing' | 'active' = plan.trialDays > 0 ? 'trialing' : 'active';
    // Idempotent initial-email claim inside PlatformMailerService. A crash here
    // is recoverable: a duplicate callback sees verification_pending and calls
    // this method below again through the callback branch.
    await this.mailer.beginPaidEmailVerification(userId, finalStatus);
  }

  /**
   * payment_confirmed_backend: the activation payment, as confirmed by this
   * server (Nuvei approval: status success + status_detail 3), sent to GA4 via
   * the Measurement Protocol. Off unless GA4_MEASUREMENT_ID + GA4_API_SECRET
   * are set. Sent once per subscription's activation transaction: the
   * subscription row is claimed (analytics_activation_reported_at) before
   * sending and released again if GA4 does not accept it. GA4 only; never
   * Google Ads (the browser reports the Ads purchase conversion).
   */
  private async reportActivationConfirmed(
    subscriptionId: string,
    plan: NuveiPlan,
    tx: any,
    userId: string,
  ): Promise<void> {
    try {
      if (!ga4Settings(this.config)) return;
      const { rows } = await this.db.query(
        `UPDATE nuvei_subscriptions
            SET analytics_activation_reported_at = NOW()
          WHERE id = $1 AND analytics_activation_reported_at IS NULL
          RETURNING activation_amount, acquisition`,
        [subscriptionId],
      );
      if (!rows[0]) return; // already reported
      const acq = rows[0].acquisition || {};
      const ft = acq.first_touch || {};
      const lt = acq.last_touch || {};
      let transactionId: string | null = tx?.id ? String(tx.id) : null;
      if (!transactionId) {
        const found = await this.db.query(
          `SELECT provider_transaction_id FROM nuvei_transactions
            WHERE subscription_id = $1 AND kind = 'activation'
              AND provider_transaction_id IS NOT NULL
            ORDER BY created_at DESC LIMIT 1`,
          [subscriptionId],
        );
        transactionId = found.rows[0]?.provider_transaction_id || subscriptionId;
      }
      const value = Number(tx?.amount ?? rows[0].activation_amount ?? plan.activation) || 0;
      const ok = await sendGa4Event(
        this.config,
        {
          // The paying browser's GA4 client id when the checkout sent one;
          // otherwise a stable synthetic id (ours, not personal data).
          clientId: acq.ga_client_id || `server.${userId}`,
          userId,
          name: 'payment_confirmed_backend',
          params: {
            transaction_id: String(transactionId),
            value: Number(value.toFixed(2)),
            currency: 'USD',
            plan: plan.key,
            language: acq.language || ft.language || undefined,
            first_touch_campaign: ft.campaign,
            first_touch_source: ft.source,
            first_touch_medium: ft.medium,
            first_touch_ad_group: ft.ad_group,
            last_touch_campaign: lt.campaign,
            last_touch_source: lt.source,
            last_touch_medium: lt.medium,
            last_touch_ad_group: lt.ad_group,
            device: lt.device || ft.device,
            country: acq.country,
          },
        },
        (m) => this.logger.log(`${m} (sub ${subscriptionId})`),
      );
      if (!ok) {
        // Let a later confirmation path (a duplicate callback) try again.
        await this.db.query(
          `UPDATE nuvei_subscriptions SET analytics_activation_reported_at = NULL WHERE id = $1`,
          [subscriptionId],
        );
      }
    } catch (err: any) {
      this.logger.warn(`payment_confirmed_backend skipped: ${err?.message || 'error'}`);
    }
  }

  /**
   * A LATE confirmation (callback / Transaction Info) of an activation charge.
   * If the customer meanwhile paid again and already holds a live
   * subscription, this charge is a duplicate: refund it at Nuvei right away
   * instead of creating a second subscription that would bill twice. If the
   * refund call fails the charge is left visible for an admin refund.
   */
  private async activateLate(
    sub: any,
    plan: NuveiPlan,
    tx: any,
  ): Promise<'verification_pending' | 'active' | 'duplicate_refunded' | 'duplicate_needs_refund'> {
    const { rows: live } = await this.db.query(
      `SELECT id FROM nuvei_subscriptions
        WHERE user_id = $1 AND id <> $2 AND product_key = $3
          AND status IN ('verification_pending','trialing','active','past_due')
        LIMIT 1`,
      [sub.user_id, sub.id, plan.key === 'ecommerce' ? 'ecommerce' : 'agentic'],
    );
    if (!live[0]) {
      try {
        await this.markActivated(sub.id, plan, tx);
        return plan.key === 'ecommerce' ? 'active' : 'verification_pending';
      } catch (err: any) {
        // The database refused a second live subscription (a concurrent
        // activation won the race): fall through and refund this charge.
        if (err?.code !== '23505') throw err;
        this.logger.warn(`concurrent activation lost the race for user ${sub.user_id}; refunding this charge`);
      }
    }
    const txId = tx?.id ? String(tx.id) : null;
    let refunded = false;
    if (txId) {
      try {
        const r = await this.client.refund(txId);
        refunded = String(r.body?.status || '').toLowerCase() === 'success';
      } catch (err: any) {
        this.logger.error(`duplicate activation refund call failed for ${txId}: ${err?.message}`);
      }
    }
    await this.db.query(
      `UPDATE nuvei_subscriptions SET status = $2, next_billing_date = NULL, updated_at = NOW() WHERE id = $1`,
      [sub.id, refunded ? 'refunded' : 'payment_failed'],
    );
    if (txId) {
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = CASE WHEN $2::boolean THEN 'refunded' ELSE status END,
                refunded_amount = CASE WHEN $2::boolean THEN amount ELSE refunded_amount END,
                message = $3
          WHERE provider_transaction_id = $1`,
        [txId, refunded, refunded ? 'duplicate activation — refunded automatically' : 'DUPLICATE ACTIVATION — REFUND REQUIRED'],
      );
    }
    this.logger.error(
      `Nuvei duplicate activation for user ${sub.user_id} (sub ${sub.id}, tx ${txId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
    );
    if (refunded) {
      await this.sendConfirmation({
        to: sub.email,
        userId: sub.user_id,
        subject: 'Duplicate payment refunded',
        lines: [
          ['Plan', plan.label],
          ['Amount refunded', this.money(Number(tx?.amount ?? sub.activation_amount ?? 0))],
          ['Transaction', txId || '—'],
          ['Status', 'Refunded'],
        ],
        note: 'A second activation payment was received for an account that is already active. It has been refunded; your existing subscription is unchanged.',
      });
    }
    return refunded ? 'duplicate_refunded' : 'duplicate_needs_refund';
  }

  // ---- recurring billing ----------------------------------------------

  private sweeping = false;

  /**
   * Hourly sweep: charge every subscription whose next monthly payment is due.
   * Idempotent per (subscription, billing period). Never charges a canceled,
   * suspended, or refunded subscription (those states are excluded by the
   * WHERE), and skips rows whose current period already has an open claim
   * (in flight / awaiting Nuvei's answer) so they cannot starve the batch.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async debitDue(subscriptionId?: string): Promise<void> {
    if (!this.enabled()) return;
    await this.ensureSchema();
    // Scheduled cancellations close on their date even while charging is
    // paused (NUVEI_RECURRING_ENABLED=false must never keep access open).
    try {
      const { rows: ending } = await this.db.query(
        `SELECT id FROM nuvei_subscriptions
          WHERE cancel_at_period_end = true
            AND status IN ('trialing','active','past_due')
            AND next_billing_date IS NOT NULL AND next_billing_date <= NOW()
            ${subscriptionId ? 'AND id = $1' : ''}
          LIMIT 200`,
        subscriptionId ? [subscriptionId] : [],
      );
      for (const row of ending) await this.finalizeCancellation(row.id);
    } catch (err: any) {
      this.logger.error(`scheduled cancellation pass failed: ${err?.message}`);
    }
    if (!this.recurringEnabled()) return;
    // A targeted run (one subscription) never waits on the hourly sweep; the
    // per-period claim keeps the two from charging twice.
    if (!subscriptionId) {
      if (this.sweeping) return; // a slow previous run is still going
      this.sweeping = true;
    }
    try {
      const params: any[] = [];
      let only = '';
      if (subscriptionId) {
        params.push(subscriptionId);
        only = ` AND s.id = $1`;
      }
      const { rows } = await this.db.query(
        `SELECT s.id, s.user_id, s.team_id, s.email, s.plan_key, s.provision_plan, s.monthly_amount,
                s.card_id, s.next_billing_date, s.cancel_at_period_end, s.status
           FROM nuvei_subscriptions s
          WHERE s.status IN ('trialing','active','past_due')
            AND s.next_billing_date IS NOT NULL
            AND s.next_billing_date <= NOW()${only}
            AND NOT EXISTS (
              SELECT 1 FROM nuvei_transactions t
               WHERE t.subscription_id = s.id AND t.kind = 'recurring'
                 AND t.period_key = to_char(s.next_billing_date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                 AND t.status IN ('pending','unconfirmed')
                 AND t.provider_transaction_id IS NULL
                 AND t.created_at > NOW() - interval '48 hours')
          ORDER BY s.next_billing_date ASC
          LIMIT 200`,
        params,
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
    } finally {
      if (!subscriptionId) this.sweeping = false;
    }
  }

  private periodKey(d: Date | string): string {
    return new Date(d).toISOString().slice(0, 10);
  }

  /** Active paid team seats are billed by Nuvei together with the base plan.
   * The base plan amount remains immutable; each active seat history row adds
   * exactly $97 to the next recurring debit. */
  private async recurringSeatAddonAmount(teamId: string | null): Promise<number> {
    if (!teamId) return 0;
    try {
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS n FROM team_addon_history
          WHERE team_id = $1 AND addon_key = 'seat' AND disabled_at IS NULL`,
        [teamId],
      );
      return Number(rows[0]?.n || 0) * 97;
    } catch {
      return 0;
    }
  }

  private async chargeRecurring(snapshot: any): Promise<void> {
    // Re-read right before acting: the batch snapshot may be minutes old and
    // the customer may have canceled / been refunded meanwhile.
    const { rows: fresh } = await this.db.query(
      `SELECT id, user_id, team_id, email, plan_key, provision_plan, monthly_amount,
              card_id, next_billing_date, cancel_at_period_end, status
         FROM nuvei_subscriptions WHERE id = $1`,
      [snapshot.id],
    );
    const sub = fresh[0];
    if (!sub) return;
    if (!['trialing', 'active', 'past_due'].includes(sub.status)) return;
    if (!sub.next_billing_date || new Date(sub.next_billing_date).getTime() > Date.now()) return;

    let plan: NuveiPlan;
    try {
      plan = this.plan(sub.plan_key);
    } catch (err: any) {
      // Unknown catalog key: never charge, never loop every hour on it.
      this.logger.error(`Recurring: unknown plan_key '${sub.plan_key}' on sub ${sub.id}; deferring one day`);
      await this.db.query(
        `UPDATE nuvei_subscriptions SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
        [sub.id],
      );
      return;
    }
    // Charge the price the customer consented to at checkout, never a later
    // catalog change.
    const baseMonthly = Number(sub.monthly_amount) > 0 ? Number(sub.monthly_amount) : plan.monthly;
    const seatAddonMonthly = String(sub.plan_key) === 'ecommerce' ? 0 : await this.recurringSeatAddonAmount(sub.team_id || null);
    const monthly = Number((baseMonthly + seatAddonMonthly).toFixed(2));
    const period = this.periodKey(sub.next_billing_date);
    const dev_reference = this.devRef('REC');

    // A cancellation takes effect at the end of the paid period: no charge,
    // the subscription closes and paid access ends now.
    if (sub.cancel_at_period_end) {
      await this.finalizeCancellation(sub.id);
      return;
    }

    // Claim this billing period atomically; if the row already exists another
    // run has (or is) charging it, so settle from that row instead of sending
    // a second debit.
    let claimed = false;
    try {
      await this.db.query(
        `INSERT INTO nuvei_transactions
           (subscription_id, user_id, kind, period_key, dev_reference, amount, status, message)
         VALUES ($1,$2,'recurring',$3,$4,$5,'pending','charge in progress')`,
        [sub.id, sub.user_id, period, dev_reference, monthly],
      );
      claimed = true;
    } catch (err: any) {
      if (err?.code !== '23505') throw err;
      await this.settleClaimedPeriod(sub, period, monthly);
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
          description: seatAddonMonthly > 0 ? `Cortexa ${plan.label} monthly + team seats` : `Cortexa ${plan.label} monthly`,
          dev_reference,
        },
        token,
      );
    } catch (err: any) {
      // Nothing was sent to the bank (no card row, undecryptable token, user
      // gone): release the claim and retry tomorrow; after repeated errors
      // treat it like a decline so paid access does not continue unpaid.
      await this.markClaim(sub.id, period, 'error', String(err?.message || 'error before charge'));
      await this.escalateBillingErrors(sub, monthly, String(err?.message || 'error before charge'));
      throw err;
    }

    const tx = res.body?.transaction || {};
    const gatewayError = !res.ok && !tx?.status;
    if (res.httpStatus === 0 || !res.body || (gatewayError && res.httpStatus >= 500)) {
      // No usable answer: the charge may or may not have gone through. Keep
      // the claim (nothing is re-sent blindly); Nuvei's callback for this
      // dev_reference settles it, see settleClaimedPeriod for the silence rule.
      this.logger.error(
        `Nuvei recurring charge unconfirmed for sub ${sub.id} period ${period}: HTTP ${res.httpStatus} ${res.error || JSON.stringify(res.body || {}).slice(0, 200)}`,
      );
      await this.markClaim(sub.id, period, 'unconfirmed', String(res.error || `HTTP ${res.httpStatus}`).slice(0, 500), res.body);
      return;
    }
    if (gatewayError) {
      // 4xx from the gateway (credentials, validation): an integration
      // problem, not the customer's card. Retry tomorrow; escalate if it keeps
      // happening.
      const detail = JSON.stringify(res.body?.error || res.body || {}).slice(0, 500);
      this.logger.error(`Nuvei recurring gateway error for sub ${sub.id} period ${period}: HTTP ${res.httpStatus} ${detail}`);
      await this.markClaim(sub.id, period, 'error', `HTTP ${res.httpStatus} ${detail}`, res.body);
      await this.escalateBillingErrors(sub, monthly, `HTTP ${res.httpStatus}`);
      return;
    }

    const { rowCount: settledHere } = await this.db.query(
      `UPDATE nuvei_transactions
         SET provider_transaction_id = $2,
             authorization_code = $3,
             status = $4,
             status_detail = $5,
             current_status = $6,
             message = $7,
             raw = $8
       WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $9
         AND status = 'pending'`,
      [
        sub.id,
        tx.id || null,
        tx.authorization_code || null,
        String(tx.status || 'failure'),
        Number.isFinite(Number(tx.status_detail)) ? Number(tx.status_detail) : null,
        tx.current_status || null,
        tx.message || res.error || null,
        JSON.stringify(res.body || {}),
        period,
      ],
    );
    // Nuvei's callback can land before this response is processed; whichever
    // side writes the outcome first applies it, the other side stops here.
    if (!settledHere) return;

    if (this.isApproved(res.body)) {
      await this.applyRecurringSuccess(sub, tx, monthly);
    } else if (String(tx.status || '').toLowerCase() === 'pending') {
      // Bank / anti-fraud review of a recurring charge: not a decline. The
      // claim stays 'pending'; the callback or the next sweep's verification
      // (settleClaimedPeriod) finishes it.
      this.logger.warn(`Nuvei recurring charge pending review for sub ${sub.id} period ${period} (tx ${tx.id || '-'})`);
    } else {
      await this.applyRecurringDecline(sub, tx, monthly, tx.message || res.error || 'no message');
    }
  }

  /** The charge row for a settled renewal, so it is reported exactly once. */
  private async recurringRowId(subscriptionId: string, providerTxId?: string | null): Promise<string | null> {
    try {
      const { rows } = await this.db.query(
        `SELECT id FROM nuvei_transactions
          WHERE subscription_id = $1 AND kind = 'recurring'
            AND ($2::text IS NULL OR provider_transaction_id = $2)
          ORDER BY created_at DESC LIMIT 1`,
        [subscriptionId, providerTxId || null],
      );
      return rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  private async markClaim(
    subscriptionId: string,
    period: string,
    status: string,
    message: string,
    raw?: any,
    kind: 'recurring' | 'addon_renewal' = 'recurring',
  ): Promise<void> {
    // Only an open claim (pending / unconfirmed) is ever re-marked: a callback
    // that already recorded the real outcome (e.g. 'success') is never
    // downgraded by a late timeout or error write. Every normal transition
    // (pending -> unconfirmed / error, unconfirmed -> error) is unchanged.
    await this.db.query(
      `UPDATE nuvei_transactions
          SET status = $3, message = $4, raw = COALESCE($5::jsonb, raw)
        WHERE subscription_id = $1 AND kind = $6 AND period_key = $2
          AND status IN ('pending','unconfirmed')`,
      [subscriptionId, period, status, String(message || '').slice(0, 500), raw ? JSON.stringify(raw) : null, kind],
    );
  }

  /**
   * Repeated integration errors (no card row, bad credentials, validation)
   * must not leave a customer on a paid plan without paying: retry tomorrow
   * with a fresh period key, and after 3 errors in 7 days treat it like a
   * decline (past_due + "update your card" email + daily retries).
   */
  private async escalateBillingErrors(sub: any, monthly: number, reason: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'recurring' AND status = 'error'
          AND created_at > NOW() - interval '7 days'`,
      [sub.id],
    );
    if (Number(rows[0]?.n || 0) >= 3) {
      await this.applyRecurringDecline(sub, {}, monthly, `billing error: ${reason}`);
      return;
    }
    await this.db.query(
      `UPDATE nuvei_subscriptions SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
      [sub.id],
    );
  }

  /**
   * The current period already has a claim row. Settle from what we know:
   *  - success recorded -> make sure the subscription reflects it
   *  - a provider id is known -> ask Nuvei (Transaction Info) for the outcome
   *  - in flight (< 2h, no id) -> leave it alone
   *  - unconfirmed with no id -> wait for the callback up to 48h (Nuvei's own
   *    retry horizon), then retry with a fresh period key
   *  - failure / error -> retry tomorrow (fresh period key)
   */
  private async settleClaimedPeriod(sub: any, period: string, monthly: number): Promise<void> {
    const { rows: prev } = await this.db.query(
      `SELECT id, status, provider_transaction_id, authorization_code, created_at
         FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'recurring' AND period_key = $2`,
      [sub.id, period],
    );
    const row = prev[0];
    if (!row) return;
    const status = String(row.status || '');
    const ageMs = Date.now() - new Date(row.created_at || Date.now()).getTime();
    const tomorrow = async () =>
      this.db.query(
        `UPDATE nuvei_subscriptions SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
        [sub.id],
      );

    if (status === 'success') {
      if (sub.status !== 'active') {
        // The charge went through but the subscription was never updated
        // (interrupted run): finish the job now.
        await this.applyRecurringSuccess(
          sub,
          { id: row.provider_transaction_id, authorization_code: row.authorization_code },
          monthly,
        );
      } else {
        await this.db.query(
          `UPDATE nuvei_subscriptions SET next_billing_date = $2, updated_at = NOW() WHERE id = $1`,
          [sub.id, this.addMonths(new Date(sub.next_billing_date), 1)],
        );
      }
      return;
    }

    if ((status === 'pending' || status === 'unconfirmed') && row.provider_transaction_id) {
      const info = await this.client.verifyTransaction(row.provider_transaction_id);
      if (info.ok && info.body?.transaction) {
        const t = info.body.transaction;
        if (this.isApproved(info.body)) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'success', status_detail = 3,
                    authorization_code = COALESCE($2, authorization_code), message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [row.id, t.authorization_code || null, t.message || null],
          );
          if (rowCount) await this.applyRecurringSuccess(sub, t, monthly); // else the callback settled it
          return;
        }
        if (this.isDefinitiveFailure(info.body)) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [row.id, Number.isFinite(Number(t.status_detail)) ? Number(t.status_detail) : null, t.message || null],
          );
          if (rowCount) await this.applyRecurringDecline(sub, t, monthly, t.message || 'declined');
          return;
        }
      }
      // Still pending at Nuvei (or could not verify): wait.
      return;
    }

    if (status === 'pending') {
      if (ageMs < 2 * 60 * 60 * 1000) return; // another run is charging it
      // The process died after the claim: the debit may or may not have been
      // sent. Treat it exactly like an unanswered charge (wait for Nuvei's
      // callback for its full 48h retry window before trying again).
      if (ageMs < 48 * 60 * 60 * 1000) {
        if (ageMs < 2 * 60 * 60 * 1000 + 60 * 60 * 1000) {
          this.logger.error(
            `Nuvei recurring claim for sub ${sub.id} period ${period} has no outcome after 2h; holding for Nuvei's callback`,
          );
          await this.markClaim(sub.id, period, 'unconfirmed', 'no outcome recorded (process interrupted)');
        }
        return;
      }
      await this.markClaim(sub.id, period, 'error', 'no outcome recorded (process interrupted), no callback in 48h');
      await tomorrow();
      return;
    }

    if (status === 'unconfirmed') {
      if (ageMs < 48 * 60 * 60 * 1000) return; // Nuvei's callback may still arrive
      this.logger.error(
        `Nuvei recurring charge for sub ${sub.id} period ${period} unconfirmed for 48h with no callback; retrying tomorrow`,
      );
      await this.markClaim(sub.id, period, 'error', 'unconfirmed for 48h, no callback received');
      await tomorrow();
      return;
    }

    // failure / error / anything else: retry with a fresh period key tomorrow.
    await tomorrow();
  }

  /**
   * A monthly charge was declined: pause paid access (past_due), retry daily
   * with a fresh period key, and suspend after 5 real declines in 30 days.
   */
  private async applyRecurringDecline(sub: any, tx: any, amount: number, reason: string): Promise<void> {
    const plan = this.plan(sub.plan_key);
    const { rows: fails } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'recurring'
          AND status IN ('failure','error') AND created_at > NOW() - interval '30 days'`,
      [sub.id],
    );
    const failures = Math.max(1, Number(fails[0]?.n || 0));
    const suspend = failures >= 5;
    const { rowCount } = await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = $2,
             next_billing_date = CASE WHEN $3::boolean THEN NULL ELSE NOW() + interval '1 day' END,
             updated_at = NOW()
       WHERE id = $1 AND status IN ('trialing','active','past_due')`,
      [sub.id, suspend ? 'suspended' : 'past_due', suspend],
    );
    if (!rowCount) return; // already canceled / refunded meanwhile
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
    // Normally the anniversary advances one month. After a long lapse (billing
    // paused, outage) the paid month starts today instead, so the customer is
    // never charged for several missed months in consecutive hourly runs.
    const scheduled = new Date(sub.next_billing_date || Date.now());
    const base = scheduled.getTime() < Date.now() - 15 * 24 * 60 * 60 * 1000 ? new Date() : scheduled;
    const next = this.addMonths(base, 1);
    const { rowCount } = await this.db.query(
      `UPDATE nuvei_subscriptions
         SET status = 'active', next_billing_date = $2, last_charge_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status IN ('trialing','active','past_due','suspended')`,
      [sub.id, next],
    );
    if (!rowCount) {
      // The subscription ended (canceled / refunded) while this charge was in
      // flight: the money must go back, never a resurrected subscription.
      const txId = tx?.id ? String(tx.id) : null;
      let refunded = false;
      if (txId) {
        try {
          const r = await this.client.refund(txId);
          refunded = String(r.body?.status || '').toLowerCase() === 'success';
          if (refunded) {
            await this.db.query(
              `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount, message = 'charged after cancellation — refunded automatically' WHERE provider_transaction_id = $1`,
              [txId],
            );
          }
        } catch (err: any) {
          this.logger.error(`refund of post-cancellation charge ${txId} failed: ${err?.message}`);
        }
      }
      this.logger.error(
        `Nuvei recurring charge landed on a non-live sub ${sub.id} (tx ${txId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
      );
      return;
    }
    await this.provisionAccount({
      userId: sub.user_id,
      subscriptionId: sub.id,
      plan: sub.provision_plan,
      paymentStatus: 'active',
      trialEnd: null,
    });
    await this.mirrorBilling(sub.id, 'active', next);

    // A renewal is charged by the scheduler with no browser present, so the
    // analytics account can only hear about it from here. Fire and forget, and
    // silent unless analytics is configured.
    void this.renewalReporting.reportRenewal({
      transactionRowId: await this.recurringRowId(sub.id, tx?.id),
      providerTransactionId: tx?.id || null,
      userId: sub.user_id,
      subscriptionId: sub.id,
      amount,
      currency: sub.currency || 'USD',
      planKey: sub.plan_key,
    });

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
    try {
      return await this.handleCallbackInner(payload, headerToken);
    } catch (err: any) {
      // Nuvei retries any non-200 below 500 for 48h; a 500 would stop retries.
      this.logger.error(`Nuvei callback failed before processing: ${err?.message}`);
      return { ok: false, handled: 'error', httpStatus: 409 };
    }
  }

  private async handleCallbackInner(
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
      // Which application signed it, and which fields were present, so a
      // registration or signing mismatch can be diagnosed with Nuvei. None of
      // these values is secret.
      this.logger.warn(
        `Nuvei callback rejected: missing/bad signature (tx ${providerTxId || '-'}, ref ${devReference || '-'}, ` +
          `app ${String(tx?.application_code || '-')}, user ${payload?.user?.id ? 'present' : 'missing'}, ` +
          `stoken ${tx?.stoken ? 'present' : 'missing'}, expected app ${this.client.serverAppCode() || '-'}, ` +
          `key for that app ${tx?.application_code && this.client.appKeyFor(String(tx.application_code)) ? 'configured' : 'not configured'})`,
      );
      return { ok: false, handled: 'unauthorized', httpStatus: 203 };
    }

    // Idempotent event record.
    const dedupe = crypto
      .createHash('sha256')
      .update(`${providerTxId}|${status}|${statusDetail}|${devReference}|${tx?.amount ?? ''}`)
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
      if (handled.handled === 'amount_mismatch') {
        // A rejected event must not shadow a genuine one for the same order.
        await this.db
          .query(`DELETE FROM nuvei_webhook_events WHERE dedupe_key = $1 AND verified = false`, [dedupe])
          .catch(() => undefined);
      }
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

  /**
   * What brought this customer, as it stands at the moment of purchase: the
   * first visit that ever reached us, the visit that brought them back, the
   * plan they chose and where they were. Copied onto the subscription so
   * revenue can be reported by campaign, landing page, country or language
   * without depending on values that keep changing on the customer record.
   * Never blocks a payment: an empty snapshot is perfectly acceptable.
   */
  private async acquisitionSnapshot(userId: string): Promise<Record<string, any>> {
    try {
      // The ad group / device columns (migration 173) may not exist yet where
      // migrations are not auto-run; without them the SELECT would fail and
      // the whole snapshot would be lost.
      await ensureAcquisitionColumns(this.db);
      const { rows } = await this.db.query(
        `SELECT first_touch_source, first_touch_medium, first_touch_campaign,
                first_touch_landing_route, first_touch_landing_page,
                first_touch_channel, first_touch_keyword_theme,
                first_touch_campaign_cluster, first_touch_language, first_visit_at,
                last_touch_source, last_touch_medium, last_touch_campaign,
                last_touch_landing_route, last_touch_landing_page,
                last_touch_channel, last_touch_keyword_theme,
                last_touch_campaign_cluster, last_touch_referrer_host,
                last_touch_language, last_visit_at,
                first_touch_ad_group, first_touch_device,
                last_touch_ad_group, last_touch_device,
                first_touch_intent, first_touch_competitor,
                last_touch_intent, last_touch_competitor,
                landing_page, utm_source, utm_medium, utm_campaign, utm_term,
                utm_content, gclid, signup_country, signup_region, signup_city,
                preferred_language, signup_source
           FROM users WHERE id = $1 LIMIT 1`,
        [userId],
      );
      const u = rows[0] || {};
      const snapshot: Record<string, any> = {
        captured_at: new Date().toISOString(),
        first_touch: {
          source: u.first_touch_source || u.utm_source || null,
          medium: u.first_touch_medium || u.utm_medium || null,
          campaign: u.first_touch_campaign || u.utm_campaign || null,
          landing_route: u.first_touch_landing_route || null,
          landing_page: u.first_touch_landing_page || u.landing_page || null,
          channel: u.first_touch_channel || null,
          keyword_theme: u.first_touch_keyword_theme || u.utm_term || null,
          campaign_cluster: u.first_touch_campaign_cluster || null,
          language: u.first_touch_language || null,
          ad_group: u.first_touch_ad_group || null,
          device: u.first_touch_device || null,
          // Derived from the landing page, never captured separately.
          source_slug: landingSlug(
            u.first_touch_landing_route || u.first_touch_landing_page || u.landing_page,
          ),
          // Only what the campaign link declared; null means unknown.
          intent: u.first_touch_intent || null,
          competitor: u.first_touch_competitor || null,
          at: u.first_visit_at || null,
        },
        last_touch: {
          source: u.last_touch_source || null,
          medium: u.last_touch_medium || null,
          campaign: u.last_touch_campaign || null,
          landing_route: u.last_touch_landing_route || null,
          landing_page: u.last_touch_landing_page || null,
          channel: u.last_touch_channel || null,
          keyword_theme: u.last_touch_keyword_theme || null,
          campaign_cluster: u.last_touch_campaign_cluster || null,
          referrer_host: u.last_touch_referrer_host || null,
          language: u.last_touch_language || null,
          ad_group: u.last_touch_ad_group || null,
          device: u.last_touch_device || null,
          source_slug: landingSlug(u.last_touch_landing_route || u.last_touch_landing_page),
          intent: u.last_touch_intent || null,
          competitor: u.last_touch_competitor || null,
          at: u.last_visit_at || null,
        },
        gclid: u.gclid || null,
        signup_source: u.signup_source || null,
        country: u.signup_country || null,
        region: u.signup_region || null,
        city: u.signup_city || null,
        language: u.preferred_language || null,
      };
      return snapshot;
    } catch {
      // A purchase is never held up by a reporting field.
      return {};
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

    // Only the SERVER application (the one that moves money) can sign a
    // callback we act on. The CLIENT app key is published to the browser SDK,
    // so a signature with it proves nothing.
    // Only an application that can move money may sign a callback we act on:
    // the cards SERVER application, or the separate Link-to-Pay application.
    // Never the CLIENT application, whose key is published to the browser.
    const codes = [this.client.serverAppCode(), this.client.linkToPayAppCode()]
      .filter(Boolean)
      .filter((c, i, a) => a.indexOf(c) === i);
    for (const code of codes) {
      if (appCode && appCode !== code) continue;
      const key = this.client.appKeyFor(code);
      if (!key) continue;
      // Nuvei signs callbacks with HMAC-SHA256, keyed with the application key,
      // over "transaction_id_application_code_user_id" (confirmed by Nuvei,
      // 2026-09-29). The older documented form, an MD5 of the same fields
      // followed by the key, is still accepted.
      const hmac = crypto
        .createHmac('sha256', key)
        .update(`${txId}_${code}_${userId}`)
        .digest('hex');
      if (this.safeEqual(hmac, stoken)) return true;
      const md5 = crypto
        .createHash('md5')
        .update(`${txId}_${code}_${userId}_${key}`)
        .digest('hex');
      if (this.safeEqual(md5, stoken)) return true;
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
      `SELECT id, subscription_id, user_id, kind, period_key, amount, currency, status, message,
              provider_transaction_id, dev_reference
         FROM nuvei_transactions
        WHERE ($1::text IS NOT NULL AND dev_reference = $1)
           OR ($2::text IS NOT NULL AND provider_transaction_id = $2)
        ORDER BY created_at DESC LIMIT 1`,
      [devReference, providerTxId],
    );
    const txRow = txRowRes.rows[0] || null;

    // Workspace add-on charges ($97/month) belong to nuvei_workspace_addons,
    // never to a plan subscription: settle them before any plan logic runs.
    // (An unknown reference falls through and is acknowledged as no-match.)
    if (txRow && ADDON_KINDS.includes(String(txRow.kind))) {
      return this.processAddonCallback(payload, tx, txRow, providerTxId);
    }
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

    // A one-time payment (hosted Checkout) or a Link-to-Pay order has no
    // subscription; it is settled from its own transaction row below.
    if (!sub && txRow && ['checkout', 'link_to_pay'].includes(String(txRow.kind))) {
      return this.settleStandaloneCharge(txRow, tx, providerTxId);
    }

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
      const isActivation =
        (!!devReference && devReference === sub.dev_reference) ||
        (!!txRow && String(txRow.kind) === 'activation');

      if (isActivation) {
        if (confirmed && ['canceled', 'refunded'].includes(sub.status)) {
          // Approved after the subscription ended: money without service.
          return this.refundStrayCharge(sub, txRow, providerTxId, 'activation approved after the subscription ended');
        }
        if (confirmed && ['pending_activation', 'payment_failed'].includes(sub.status)) {
          if (!this.amountMatches(tx?.amount, sub.activation_amount)) {
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
          const outcome = await this.activateLate(sub, this.plan(sub.plan_key), tx);
          return { handled: outcome, verified: true };
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
          if (txRow && ['success', 'partially_refunded', 'refund_pending'].includes(String(txRow.status))) {
            return this.applyReversal(sub, txRow, tx);
          }
          // Nothing was captured (abandoned 3DS / annulled authorization):
          // note it, never "refund" money the customer never paid.
          if (txRow) {
            await this.db.query(
              `UPDATE nuvei_transactions SET message = COALESCE($2, message) WHERE id = $1 AND status <> 'success'`,
              [txRow.id, tx?.message || 'annulled by Nuvei'],
            );
          }
          if (sub.status === 'pending_activation') await this.setSubStatus(sub.id, 'payment_failed');
          return { handled: 'reversal_noted', verified: true };
        }
        if (confirmed && sub.status === 'verification_pending') {
          // Idempotent recovery: if the first callback committed payment but
          // crashed before the initial verification email, this call claims it.
          const p = this.plan(sub.plan_key);
          await this.mailer.beginPaidEmailVerification(
            sub.user_id,
            p.trialDays > 0 ? 'trialing' : 'active',
          );
          return { handled: 'verification_pending', verified: true };
        }
        if (confirmed && ['trialing', 'active'].includes(sub.status)) {
          // Already activated; a retry after a half-done activation must still
          // leave the account provisioned (provisionAccount is idempotent).
          await this.provisionAccount({
            userId: sub.user_id,
            subscriptionId: sub.id,
            plan: sub.provision_plan,
            paymentStatus: sub.status,
            trialEnd: null,
          });
          return { handled: 'already_processed', verified: true };
        }
        return { handled: 'ignored', verified: false };
      }

      if (txRow && txRow.kind === 'checkout') {
        if (confirmed && ['pending', 'unconfirmed'].includes(String(txRow.status))) {
          if (!this.amountMatches(tx?.amount, txRow.amount)) {
            return { handled: 'amount_mismatch', verified: false };
          }
          await this.db.query(
            `UPDATE nuvei_transactions
                SET status = 'success', status_detail = 3,
                    provider_transaction_id = COALESCE($2, provider_transaction_id),
                    authorization_code = COALESCE($3, authorization_code)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [txRow.id, providerTxId, tx?.authorization_code || null],
          );
          const email = await this.emailForUser(txRow.user_id);
          if (email) {
            await this.sendConfirmation({
              to: email,
              userId: txRow.user_id,
              subject: 'Your Cortexa payment has been received',
              lines: [
                ['Description', txRow.message || 'Cortexa payment'],
                ['Amount', this.money(Number(txRow.amount), txRow.currency)],
                ['Transaction ID', providerTxId || '—'],
                ['Authorization code', tx?.authorization_code || '—'],
                ['Status', 'Paid'],
              ],
            });
          }
          return { handled: 'checkout_paid', verified: true };
        }
        if (failed && ['pending', 'unconfirmed'].includes(String(txRow.status))) {
          await this.db.query(
            `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2 WHERE id = $1`,
            [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null],
          );
          return { handled: 'checkout_declined', verified: true };
        }
        if (reversal && String(txRow.status) === 'success') {
          await this.db.query(
            `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount WHERE id = $1`,
            [txRow.id],
          );
          return { handled: 'checkout_reversed', verified: true };
        }
        return { handled: 'already_processed', verified: false };
      }

      if (txRow && txRow.kind === 'recurring') {
        if (confirmed && ['pending', 'unconfirmed', 'error', 'failure'].includes(String(txRow.status))) {
          // A charge the gateway never answered (or a late approval) is now
          // confirmed by Nuvei: settle it exactly like a successful sweep.
          if (!this.amountMatches(tx?.amount, txRow.amount)) {
            this.logger.warn(
              `Nuvei recurring callback amount mismatch for ${devReference}: got ${tx.amount}, expected ${txRow.amount}`,
            );
            return { handled: 'amount_mismatch', verified: false };
          }
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions
                SET status = 'success', status_detail = 3,
                    authorization_code = COALESCE($2, authorization_code),
                    message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed','error','failure')`,
            [txRow.id, tx?.authorization_code || null, tx?.message || null],
          );
          if (!rowCount) return { handled: 'already_processed', verified: true }; // the sweep settled it first
          // If a LATER monthly charge already succeeded (the period was retried
          // after Nuvei stayed silent), this late confirmation is a duplicate
          // payment for the same month: refund it, do not credit a month.
          const { rows: later } = await this.db.query(
            `SELECT id FROM nuvei_transactions
              WHERE subscription_id = $1 AND kind = 'recurring' AND status = 'success'
                AND id <> $2 AND created_at > (SELECT created_at FROM nuvei_transactions WHERE id = $2)
              LIMIT 1`,
            [sub.id, txRow.id],
          );
          if (later[0]) {
            let refunded = false;
            if (providerTxId) {
              try {
                const r = await this.client.refund(providerTxId);
                refunded = String(r.body?.status || '').toLowerCase() === 'success';
              } catch (err: any) {
                this.logger.error(`duplicate recurring refund call failed for ${providerTxId}: ${err?.message}`);
              }
            }
            await this.db.query(
              `UPDATE nuvei_transactions
                  SET status = CASE WHEN $2::boolean THEN 'refunded' ELSE status END,
                      refunded_amount = CASE WHEN $2::boolean THEN amount ELSE refunded_amount END,
                      message = $3
                WHERE id = $1`,
              [txRow.id, refunded, refunded ? 'duplicate monthly charge — refunded automatically' : 'DUPLICATE MONTHLY CHARGE — REFUND REQUIRED'],
            );
            this.logger.error(
              `Nuvei duplicate monthly charge on sub ${sub.id} (tx ${providerTxId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
            );
            if (refunded) {
              await this.sendConfirmation({
                to: sub.email,
                userId: sub.user_id,
                subject: 'Duplicate payment refunded',
                lines: [
                  ['Amount refunded', this.money(Number(txRow.amount))],
                  ['Transaction', providerTxId || '—'],
                  ['Status', 'Refunded'],
                ],
                note: 'A monthly payment was confirmed twice for the same period. The duplicate has been refunded; your subscription is unchanged.',
              });
            }
            return { handled: refunded ? 'duplicate_refunded' : 'duplicate_needs_refund', verified: true };
          }
          if (['trialing', 'active', 'past_due', 'suspended'].includes(sub.status)) {
            const base = sub.next_billing_date || new Date();
            await this.applyRecurringSuccess(
              { ...sub, next_billing_date: base },
              tx,
              Number(txRow.amount),
            );
            return { handled: 'recurring_confirmed', verified: true };
          }
          // Approved after the subscription ended: refund, never keep it.
          return this.refundStrayCharge(sub, txRow, providerTxId, 'monthly charge approved after the subscription ended');
        }
        if (failed && ['pending', 'unconfirmed'].includes(String(txRow.status))) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
          );
          if (!rowCount) return { handled: 'already_processed', verified: true };
          if (['trialing', 'active', 'past_due'].includes(sub.status)) {
            await this.applyRecurringDecline(sub, tx, Number(txRow.amount), tx?.message || 'declined (callback)');
          }
          return { handled: 'recurring_declined', verified: true };
        }
        if (reversal && ['success', 'partially_refunded', 'refund_pending'].includes(String(txRow.status))) {
          return this.applyReversal(sub, txRow, tx);
        }
        return { handled: confirmed ? 'already_processed' : 'ignored', verified: false };
      }
    }

    // Link-to-Pay callbacks.
    if (devReference) {
      const ltp = await this.db.query(
        `SELECT id, amount, currency, description, customer_email, customer_name, status
           FROM nuvei_link_to_pay WHERE reference = $1`,
        [devReference],
      );
      if (ltp.rows[0]) {
        if (reversal) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_link_to_pay SET status = 'refunded' WHERE id = $1 AND status = 'paid'`,
            [ltp.rows[0].id],
          );
          await this.db.query(
            `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount
              WHERE dev_reference = $1 AND kind = 'link_to_pay' AND status <> 'refunded'`,
            [devReference],
          );
          if (rowCount) {
            await this.sendConfirmation({
              to: ltp.rows[0].customer_email,
              subject: 'Your Cortexa refund has been processed',
              lines: [
                ['Description', ltp.rows[0].description || 'Cortexa Web Solutions'],
                ['Amount refunded', this.money(Number(ltp.rows[0].amount), ltp.rows[0].currency)],
                ['Reference', devReference || '—'],
                ['Status', 'Refunded'],
              ],
            });
          }
          return { handled: 'link_to_pay_reversed', verified: true };
        }
        if (confirmed) {
          const row = ltp.rows[0];
          if (!this.amountMatches(tx?.amount, row.amount)) {
            this.logger.warn(
              `Nuvei Link-to-Pay amount mismatch for ${devReference}: got ${tx?.amount}, expected ${row.amount}`,
            );
            return { handled: 'amount_mismatch', verified: false };
          }
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_link_to_pay
               SET status = 'paid', provider_transaction_id = $2,
                   authorization_code = $3, paid_at = NOW()
             WHERE id = $1 AND status <> 'paid'`,
            [row.id, providerTxId, tx?.authorization_code || null],
          );
          if (!rowCount) return { handled: 'already_processed', verified: true };
          // Record it as a transaction so the mandatory Refund method can be
          // used on a Link-to-Pay payment exactly like any card charge.
          await this.db
            .query(
              `INSERT INTO nuvei_transactions
                 (subscription_id, user_id, kind, dev_reference, provider_transaction_id,
                  authorization_code, amount, currency, status, status_detail, message)
               VALUES (NULL, NULL, 'link_to_pay', $1, $2, $3, $4, $5, 'success', 3, $6)`,
              [
                devReference,
                providerTxId,
                tx?.authorization_code || null,
                row.amount,
                row.currency || 'USD',
                row.description || 'Link to Pay',
              ],
            )
            .catch((err: any) => {
              if (err?.code !== '23505') this.logger.warn(`link-to-pay transaction row failed: ${err?.message}`);
            });
          // Payment confirmation email, as Nuvei requires after every payment.
          await this.sendConfirmation({
            to: row.customer_email,
            subject: 'Your Cortexa payment has been received',
            lines: [
              ['Description', row.description || 'Cortexa Web Solutions'],
              ['Amount', this.money(Number(row.amount), row.currency)],
              ['Reference', devReference || '—'],
              ['Transaction ID', providerTxId || '—'],
              ['Authorization code', tx?.authorization_code || '—'],
              ['Status', 'Paid'],
            ],
          });
          return { handled: 'link_to_pay_paid', verified: true };
        }
        return { handled: 'link_to_pay_unconfirmed', verified: false };
      }
    }

    return { handled: confirmed ? 'confirmed_no_match' : 'ignored', verified: false };
  }

  /**
   * A charge Nuvei confirmed for a subscription that no longer exists (ended
   * before the late confirmation arrived): refund it at Nuvei and record it.
   */
  private async refundStrayCharge(
    sub: any,
    txRow: any,
    providerTxId: string | null,
    reason: string,
  ): Promise<{ handled: string; verified: boolean }> {
    // Money already returned (admin refund / earlier reversal): nothing to do.
    if (txRow && ['refunded', 'partially_refunded', 'refund_pending'].includes(String(txRow.status))) {
      return { handled: 'already_processed', verified: true };
    }
    let refunded = false;
    if (providerTxId) {
      try {
        const r = await this.client.refund(providerTxId);
        refunded = String(r.body?.status || '').toLowerCase() === 'success';
      } catch (err: any) {
        this.logger.error(`stray charge refund call failed for ${providerTxId}: ${err?.message}`);
      }
    }
    if (txRow) {
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = CASE WHEN $2::boolean THEN 'refunded' ELSE 'success' END,
                refunded_amount = CASE WHEN $2::boolean THEN amount ELSE refunded_amount END,
                message = $3
          WHERE id = $1`,
        [txRow.id, refunded, refunded ? `${reason} — refunded automatically` : `${reason.toUpperCase()} — REFUND REQUIRED`],
      );
    }
    this.logger.error(
      `Nuvei stray charge on sub ${sub.id} (tx ${providerTxId || '-'}): ${reason}: ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
    );
    if (refunded) {
      await this.sendConfirmation({
        to: sub.email,
        userId: sub.user_id,
        subject: 'Payment refunded',
        lines: [
          ['Amount refunded', this.money(Number(txRow?.amount ?? 0))],
          ['Transaction', providerTxId || '—'],
          ['Status', 'Refunded'],
        ],
        note: 'This payment was confirmed after your subscription had already ended, so it has been refunded.',
      });
    }
    return { handled: refunded ? 'stray_refunded' : 'stray_needs_refund', verified: true };
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
      // Do not overwrite a refund we already recorded (an admin refund, or an
      // earlier reversal): keep the original amounts and message.
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = 'refunded',
                refunded_amount = GREATEST(refunded_amount, amount),
                message = COALESCE(message, 'refunded by Nuvei')
          WHERE id = $1 AND status <> 'refunded'`,
        [txRow.id],
      );
    }
    if (['verification_pending', 'trialing', 'active', 'past_due', 'suspended', 'pending_activation'].includes(sub.status)) {
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
    // A reversal before email verification must also revoke the pending
    // activation credential. Keep payment_confirmed_at as immutable audit
    // evidence, but make the account non-activatable and invalidate every
    // outstanding verification link.
    const { rows: affectedUsers } = await this.db.query(
      `UPDATE users
          SET payment_status = 'refunded',
              pending_payment_status = NULL,
              account_status = CASE
                WHEN email_verified_at IS NULL THEN 'payment_refunded'
                ELSE account_status
              END,
              updated_at = NOW()
        WHERE nuvei_subscription_id = $1
        RETURNING id`,
      [subscriptionId],
    );
    for (const u of affectedUsers) {
      await this.db.query(
        `UPDATE email_verification_tokens
            SET invalidated_at = COALESCE(invalidated_at, NOW())
          WHERE user_id = $1
            AND used_at IS NULL
            AND invalidated_at IS NULL`,
        [u.id],
      ).catch(() => undefined);
    }
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
      `SELECT id, subscription_id, user_id, kind, amount, status, refunded_amount
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

    // Claim the refund atomically BEFORE asking Nuvei so two admins (or an
    // admin and a reversal callback) can never refund the same money twice.
    const { rows: claimed } = await this.db.query(
      `UPDATE nuvei_transactions
          SET refunded_amount = refunded_amount + $2,
              status = CASE WHEN refunded_amount + $2 >= amount - 0.005 THEN 'refunded' ELSE 'partially_refunded' END,
              message = 'refund in progress'
        WHERE id = $1
          AND status IN ('success','partially_refunded')
          AND refunded_amount + $2 <= amount + 0.005
        RETURNING refunded_amount, status`,
      [txRow.id, amount],
    );
    if (!claimed[0]) {
      throw new BadRequestException('This transaction is already being refunded or has nothing left to refund.');
    }

    // A Link to Pay payment belongs to the Link to Pay application once Nuvei
    // activates a separate one; links created before that belong to the cards
    // application. Try the likely owner first and, only if Nuvei rejects the
    // request outright (4xx, nothing refunded), the other one.
    const refundAmount = full && already === 0 ? undefined : amount;
    const apps: Array<'server' | 'linktopay'> =
      txRow.kind === 'link_to_pay' && this.client.hasSeparateLinkToPayApp()
        ? ['linktopay', 'server']
        : ['server'];
    let res = await this.client.refund(transactionId, refundAmount, apps[0]);
    if (
      apps[1] &&
      String(res.body?.status || '').toLowerCase() !== 'success' &&
      res.httpStatus >= 400 &&
      res.httpStatus < 500
    ) {
      res = await this.client.refund(transactionId, refundAmount, apps[1]);
    }
    const ok = String(res.body?.status || '').toLowerCase() === 'success';
    if (!ok) {
      if (res.httpStatus === 0 || !res.body) {
        // Unknown outcome: keep the claim so nobody retries blindly; an admin
        // must check the Nuvei console (the reversal callback will settle it).
        await this.db.query(
          `UPDATE nuvei_transactions SET status = 'refund_pending', message = 'REFUND UNCONFIRMED — verify in the Nuvei console before retrying' WHERE id = $1`,
          [txRow.id],
        );
        throw new BadRequestException(
          'The refund result is unknown (no answer from Nuvei). Please verify it in the Nuvei console before retrying.',
        );
      }
      // Nuvei refused: release the claim.
      await this.db.query(
        `UPDATE nuvei_transactions
            SET refunded_amount = GREATEST(0, refunded_amount - $2),
                status = CASE WHEN refunded_amount - $2 > 0.005 THEN 'partially_refunded' ELSE 'success' END,
                message = $3
          WHERE id = $1`,
        [txRow.id, amount, String(res.body?.detail || res.body?.error?.description || res.body?.error?.type || res.error || 'refund refused').slice(0, 300)],
      );
      throw new BadRequestException(
        `Refund failed: ${res.body?.detail || res.body?.error?.description || res.body?.error?.type || res.error || 'unknown error'}`,
      );
    }
    await this.db.query(
      `UPDATE nuvei_transactions SET message = $2 WHERE id = $1`,
      [txRow.id, full ? 'refunded' : `partially refunded ${this.money(Number(claimed[0].refunded_amount))}`],
    );
    // Only a FULL refund of a charge ends the subscription; a partial refund
    // (goodwill credit) keeps the customer's plan. A Workspace add-on charge
    // ends that add-on (and locks its Workspace), never the base plan.
    const isAddonCharge = ADDON_KINDS.includes(String(txRow.kind));
    if (full && txRow.subscription_id && isAddonCharge) {
      await this.revokeAddonForRefund(txRow.subscription_id);
    } else if (full && txRow.subscription_id) {
      await this.revokeForRefund(txRow.subscription_id);
    }
    if (full && !txRow.subscription_id) {
      await this.db
        .query(
          `UPDATE nuvei_link_to_pay SET status = 'refunded'
            WHERE provider_transaction_id = $1 AND status = 'paid'`,
          [transactionId],
        )
        .catch(() => undefined);
    }

    // Refund confirmation email. Add-on charges have no plan subscription row,
    // so their address comes from the paying user.
    const email =
      (await this.emailForTransaction(transactionId)) ||
      (isAddonCharge ? await this.emailForUser(txRow.user_id) : null);
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
        note: isAddonCharge
          ? full
            ? 'Your workspace add-on has ended and no further charges will be made for it. Your CRM plan is not affected.'
            : 'Your workspace add-on continues; this is a partial refund of the charge above.'
          : full
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

  private async emailForUser(userId: string | null): Promise<string | null> {
    if (!userId) return null;
    try {
      const { rows } = await this.db.query(`SELECT email FROM users WHERE id = $1`, [userId]);
      return rows[0]?.email || null;
    } catch {
      return null;
    }
  }

  /**
   * Settle a charge that belongs to no subscription (hosted Checkout or a
   * Link-to-Pay order matched by transaction id rather than reference).
   */
  private async settleStandaloneCharge(
    txRow: any,
    tx: any,
    providerTxId: string | null,
  ): Promise<{ handled: string; verified: boolean }> {
    const approved = this.isApproved({ transaction: tx });
    const failed = this.isDefinitiveFailure({ transaction: tx });
    const reversal = this.isReversal({ transaction: tx });
    const open = ['pending', 'unconfirmed'].includes(String(txRow.status));

    if (approved && open) {
      if (!this.amountMatches(tx?.amount, txRow.amount)) {
        this.logger.warn(
          `Nuvei ${txRow.kind} amount mismatch for ${txRow.dev_reference}: got ${tx?.amount}, expected ${txRow.amount}`,
        );
        return { handled: 'amount_mismatch', verified: false };
      }
      const { rowCount } = await this.db.query(
        `UPDATE nuvei_transactions
            SET status = 'success', status_detail = 3,
                provider_transaction_id = COALESCE($2, provider_transaction_id),
                authorization_code = COALESCE($3, authorization_code)
          WHERE id = $1 AND status IN ('pending','unconfirmed')`,
        [txRow.id, providerTxId, tx?.authorization_code || null],
      );
      if (!rowCount) return { handled: 'already_processed', verified: true };
      // Nuvei requires a payment confirmation email after EVERY successful
      // transaction, one-time payments included.
      const email = await this.emailForUser(txRow.user_id);
      if (email) {
        await this.sendConfirmation({
          to: email,
          userId: txRow.user_id,
          subject: 'Your Cortexa payment has been received',
          lines: [
            ['Description', txRow.message || 'Cortexa payment'],
            ['Amount', this.money(Number(txRow.amount), txRow.currency)],
            ['Transaction ID', providerTxId || '—'],
            ['Authorization code', tx?.authorization_code || '—'],
            ['Status', 'Paid'],
          ],
        });
      }
      return { handled: txRow.kind === 'checkout' ? 'checkout_paid' : 'standalone_paid', verified: true };
    }
    if (failed && open) {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
          WHERE id = $1 AND status IN ('pending','unconfirmed')`,
        [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
      );
      return { handled: 'checkout_declined', verified: true };
    }
    if (reversal && String(txRow.status) === 'success') {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount WHERE id = $1`,
        [txRow.id],
      );
      return { handled: 'checkout_reversed', verified: true };
    }
    return { handled: 'already_processed', verified: false };
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
    // A charge that is still being confirmed (3DS / bank review / no answer
    // yet) must settle first, or an approval could land on a canceled
    // subscription: money taken, no service.
    const { rows: inflight } = await this.db.query(
      `SELECT 1 FROM nuvei_transactions
        WHERE subscription_id = $1 AND status IN ('pending','unconfirmed')
          AND created_at > NOW() - interval '48 hours'
        LIMIT 1`,
      [sub.id],
    );
    if (inflight[0]) {
      throw new BadRequestException(
        'A payment on this subscription is still being confirmed. Please try again in a few minutes.',
      );
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

  /**
   * Replace the card a subscription is billed to (e.g. after a decline). The
   * card must belong to the same customer. A past_due / suspended subscription
   * is retried right away with the new card so access is restored on success.
   */
  async updateCard(
    subscriptionId: string,
    userId: string,
    cardId: string,
    isAdmin: boolean,
  ): Promise<{ ok: boolean; status: SubStatus; message?: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, user_id, status FROM nuvei_subscriptions WHERE id = $1`,
      [subscriptionId],
    );
    const sub = rows[0];
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!isAdmin && String(sub.user_id) !== String(userId)) throw new ForbiddenException();
    if (!['trialing', 'active', 'past_due', 'suspended'].includes(sub.status)) {
      throw new BadRequestException(`Subscription is ${sub.status}; its card cannot be changed.`);
    }
    const { rows: card } = await this.db.query(
      `SELECT id FROM nuvei_cards WHERE id = $1 AND user_id = $2 AND status <> 'rejected'`,
      [cardId, sub.user_id],
    );
    if (!card[0]) throw new BadRequestException('A saved card of this customer is required.');

    const retryNow = sub.status === 'past_due' || sub.status === 'suspended';
    await this.db.query(
      `UPDATE nuvei_subscriptions
          SET card_id = $2,
              status = CASE WHEN status = 'suspended' THEN 'past_due' ELSE status END,
              next_billing_date = CASE WHEN $3::boolean THEN NOW() ELSE next_billing_date END,
              updated_at = NOW()
        WHERE id = $1`,
      [sub.id, cardId, retryNow],
    );
    if (retryNow) {
      // Today's period may already hold the declined attempt; move that claim
      // aside (history kept) so the new card is tried right now.
      await this.db.query(
        `UPDATE nuvei_transactions
            SET period_key = period_key || '#' || left(id::text, 8)
          WHERE subscription_id = $1 AND kind = 'recurring'
            AND period_key = $2 AND status IN ('failure','error')`,
        [sub.id, this.periodKey(new Date())],
      );
      await this.debitDue(sub.id);
    }
    const { rows: after } = await this.db.query(
      `SELECT status FROM nuvei_subscriptions WHERE id = $1`,
      [sub.id],
    );
    const status = after[0]?.status as SubStatus;
    return {
      ok: true,
      status,
      message:
        status === 'active'
          ? 'Payment received. Your access has been restored.'
          : status === 'past_due'
            ? 'The new card was saved but the payment did not go through yet. We will retry automatically.'
            : undefined,
    };
  }

  /**
   * Nuvei's MANDATORY verification method (POST /v2/transaction/verify), used
   * when the issuer asks for an extra check before a charge can be approved:
   * a one-time password (Diners group in Ecuador, status_detail 31), an
   * authorization code, or a deposited amount.
   *
   * On success the activation is finalized from the transaction's real status,
   * so the customer ends up activated exactly as in the normal flow.
   */
  async verifyPayment(input: {
    subscriptionId: string;
    userId: string;
    isAdmin: boolean;
    type: string;
    value: string;
  }): Promise<{ status: SubStatus; subscriptionId: string; message?: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const type = String(input.type || 'BY_OTP').trim().toUpperCase();
    if (!['BY_OTP', 'BY_AUTH_CODE', 'BY_AMOUNT'].includes(type)) {
      throw new BadRequestException('Unsupported verification type.');
    }
    const value = String(input.value || '').trim();
    if (!value) throw new BadRequestException('A verification value is required.');

    const { rows } = await this.db.query(
      `SELECT s.id, s.user_id, s.status, t.provider_transaction_id
         FROM nuvei_subscriptions s
         LEFT JOIN nuvei_transactions t
           ON t.subscription_id = s.id AND t.kind = 'activation'
        WHERE s.id = $1
        ORDER BY t.created_at DESC LIMIT 1`,
      [input.subscriptionId],
    );
    const sub = rows[0];
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!input.isAdmin && String(sub.user_id) !== String(input.userId)) {
      throw new ForbiddenException();
    }
    if (!sub.provider_transaction_id) {
      throw new BadRequestException('This payment has no transaction to verify yet.');
    }

    const res = await this.client.verifyWithValue(
      String(sub.user_id),
      String(sub.provider_transaction_id),
      type,
      value,
    );
    if (!res.ok) {
      const why = res.body?.error?.description || res.body?.error?.type || res.body?.detail || res.error;
      this.logger.warn(`Nuvei verify failed for sub ${sub.id}: HTTP ${res.httpStatus} ${JSON.stringify(why || {}).slice(0, 200)}`);
      throw new BadRequestException(
        'The code could not be verified. Please check it and try again.',
      );
    }
    const status = (await this.reconcilePendingActivation(sub.id)) || sub.status;
    return {
      status,
      subscriptionId: sub.id,
      message:
        status === 'payment_failed'
          ? 'The payment could not be completed. Please try another card.'
          : status === 'pending_activation'
            ? 'Your payment is still being verified. Your account will activate automatically once confirmed.'
            : undefined,
    };
  }

  /**
   * Forget a stored card at Nuvei and locally (Nuvei's Delete Card method). A
   * card a live subscription bills to cannot be removed, or its recurring
   * charge would be orphaned.
   */
  async deleteSavedCard(cardId: string, userId: string): Promise<{ ok: boolean; message: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, token_enc FROM nuvei_cards WHERE id = $1 AND user_id = $2`,
      [cardId, userId],
    );
    if (!rows[0]) throw new NotFoundException('Saved card not found');
    const { rows: inUse } = await this.db.query(
      `SELECT id FROM nuvei_subscriptions
        WHERE card_id = $1 AND status IN ('trialing','active','past_due')
        LIMIT 1`,
      [cardId],
    );
    if (inUse[0]) {
      throw new BadRequestException(
        'This card pays for an active subscription. Add another card first, or cancel the subscription.',
      );
    }
    // Same for a Workspace add-on's monthly renewal.
    await this.ensureAddonSchema();
    const { rows: addonInUse } = await this.db.query(
      `SELECT id FROM nuvei_workspace_addons
        WHERE card_id = $1 AND status IN ('active','past_due')
        LIMIT 1`,
      [cardId],
    );
    if (addonInUse[0]) {
      throw new BadRequestException(
        'This card pays for an active workspace add-on. Cancel the add-on first, or keep this card.',
      );
    }
    const token = decryptToken(rows[0].token_enc, this.config.get('NUVEI_TOKEN_ENC_KEY'));
    const res = await this.client.deleteCard(String(userId), token);
    const ok = res.ok || res.body?.message === 'card deleted' || res.httpStatus === 404;
    if (!ok) {
      throw new BadRequestException(
        `The card could not be removed: ${res.body?.error?.description || res.body?.detail || res.error || 'unknown error'}`,
      );
    }
    await this.db.query(`DELETE FROM nuvei_cards WHERE id = $1 AND user_id = $2`, [cardId, userId]);
    return { ok: true, message: 'Card removed.' };
  }

  /**
   * Nuvei's hosted Checkout for a ONE-TIME payment: creates a reference and
   * returns the checkout URL to send the customer to. The verified callback
   * confirms it, exactly like every other charge.
   */
  async createCheckoutReference(input: {
    userId: string;
    amount: number;
    description: string;
    locale?: string;
  }): Promise<{ reference: string; checkoutUrl: string | null; transactionId?: string }> {
    this.assertEnabled();
    await this.ensureSchema();
    const amount = Number(input.amount);
    if (!(amount > 0)) throw new BadRequestException('A positive amount is required.');
    const user = await this.userRow(input.userId);
    const reference = this.devRef('CHK');

    await this.db.query(
      `INSERT INTO nuvei_transactions
         (subscription_id, user_id, kind, dev_reference, amount, status, message)
       VALUES (NULL,$1,'checkout',$2,$3,'pending',$4)`,
      [input.userId, reference, amount, input.description || 'Cortexa payment'],
    );

    const res = await this.client.initReference({
      user: this.toNuveiUser(user),
      order: {
        amount,
        description: input.description || 'Cortexa payment',
        dev_reference: reference,
        currency: 'USD',
      },
      // Nuvei's hosted Checkout takes the page language; send only a code it
      // knows, defaulting to English.
      locale: ['en', 'es', 'pt'].includes(String(input.locale || '').toLowerCase())
        ? String(input.locale).toLowerCase()
        : 'en',
    });
    const checkoutUrl =
      res.body?.checkout_url || res.body?.data?.checkout_url || res.body?.payment?.checkout_url || null;
    if (!checkoutUrl) {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'error', message = $2 WHERE dev_reference = $1`,
        [reference, String(res.body?.error?.description || res.error || 'no checkout url').slice(0, 300)],
      );
      this.logger.error(`Nuvei Checkout init_reference failed: HTTP ${res.httpStatus} ${JSON.stringify(res.body || {}).slice(0, 300)}`);
      throw new BadRequestException(
        `Nuvei did not return a checkout link: ${res.body?.error?.description || res.body?.detail || res.error || 'unknown error'}`,
      );
    }
    return { reference, checkoutUrl, transactionId: res.body?.reference || undefined };
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
    locale?: string;
  }): Promise<{ reference: string; payUrl: string | null; status: string }> {
    this.assertEnabled();
    await this.ensureSchema();

    const amount = Number(input.amount);
    if (!(amount > 0)) throw new BadRequestException('A positive amount is required.');
    if (!/^\S+@\S+\.\S+$/.test(String(input.customerEmail || ''))) {
      throw new BadRequestException('A valid customer email is required.');
    }
    const reference = String(input.reference || '').trim() || this.devRef('WS');

    const nameParts = String(input.customerName || '').trim().split(/\s+/).filter(Boolean);
    const site = this.frontendUrl();
    const res = await this.client.createLinkToPay({
      user: {
        id: `ws-${crypto.randomBytes(4).toString('hex')}`,
        email: input.customerEmail,
        name: nameParts[0] || 'Customer',
        last_name: nameParts.slice(1).join(' ') || '-',
      },
      order: {
        amount,
        description: input.description || 'Cortexa Web Solutions',
        dev_reference: reference,
        currency: 'USD',
      },
      locale: input.locale,
      configuration: {
        success_url: `${site}/?payment=success&ref=${encodeURIComponent(reference)}`,
        failure_url: `${site}/?payment=failure&ref=${encodeURIComponent(reference)}`,
        pending_url: `${site}/?payment=pending&ref=${encodeURIComponent(reference)}`,
        review_url: `${site}/?payment=review&ref=${encodeURIComponent(reference)}`,
      },
    });

    const payUrl =
      res.body?.data?.payment?.payment_url ||
      res.body?.payment?.payment_url ||
      res.body?.payment_url ||
      null;
    if (!payUrl) {
      this.logger.error(`Nuvei Link-to-Pay failed: HTTP ${res.httpStatus} ${JSON.stringify(res.body || res.error || {}).slice(0, 500)}`);
    }

    await this.db.query(
      `INSERT INTO nuvei_link_to_pay
         (reference, customer_name, customer_email, description, amount, currency, status, pay_url, created_by, ltp_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (reference)
       DO UPDATE SET pay_url = EXCLUDED.pay_url, ltp_id = EXCLUDED.ltp_id`,
      [
        reference,
        input.customerName || null,
        input.customerEmail,
        input.description || null,
        amount,
        'USD',
        payUrl ? 'pending' : 'error',
        payUrl,
        input.adminId || null,
        res.body?.data?.order?.id || null,
      ],
    );

    if (!payUrl) {
      const why = res.body?.detail || res.body?.error?.description || res.body?.error?.type || res.error;
      throw new BadRequestException(
        `Nuvei did not return a payment link: ${typeof why === 'string' ? why : JSON.stringify(why || 'unknown error').slice(0, 300)}`,
      );
    }
    return { reference, payUrl, status: 'pending' };
  }

  /** Promote a payment-confirmed Nuvei subscription only after the email token
   * has passed validation. Runs inside PlatformMailerService's verification
   * transaction, so the subscription and user activation cannot split-brain. */
  private async activateAfterEmailVerification(client: PoolClient, userId: string): Promise<{
    subscriptionId: string;
    plan: string;
    paymentStatus: 'trialing' | 'active';
    trialEnd: Date | null;
    nextBilling: Date | null;
  } | null> {
    const { rows } = await client.query(
      `SELECT id, plan_key, provision_plan, status
         FROM nuvei_subscriptions
        WHERE user_id=$1 AND status='verification_pending'
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [userId],
    );
    const sub = rows[0];
    if (!sub) return null;

    const plan = this.plan(sub.plan_key);
    const now = new Date();
    const paymentStatus: 'trialing' | 'active' = plan.trialDays > 0 ? 'trialing' : 'active';
    const trialEnd = plan.trialDays > 0
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;
    const nextBilling = trialEnd || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()));

    const promoted = await client.query(
      `UPDATE nuvei_subscriptions
          SET status=$2, trial_end=$3, next_billing_date=$4, updated_at=NOW()
        WHERE id=$1 AND status='verification_pending'
        RETURNING id`,
      [sub.id, paymentStatus, trialEnd, nextBilling],
    );
    if (!promoted.rows.length) return null;

    return {
      subscriptionId: String(sub.id),
      plan: normalizePlanId(sub.provision_plan),
      paymentStatus,
      trialEnd,
      nextBilling,
    };
  }

  // ---- workspace add-ons ($97/month per additional Workspace) ----------
  //
  // Each additional Workspace is its OWN Nuvei add-on: a customer-present first
  // charge (3DS) on the purchasing user's saved card, then a monthly stored-
  // token renewal (no 3DS) by its own hourly sweep. Access is granted ONLY by a
  // workspace_entitlements row (source 'nuvei_addon', key 'nuvei:<add-on id>')
  // once Nuvei confirms the payment, so it is computed server-side and survives
  // logout/login, and a failed payment never unlocks anything. Add-ons never
  // touch nuvei_subscriptions, provisionAccount or mirrorBilling: nothing that
  // happens to an add-on changes the customer's base CRM plan.

  private async ensureAddonSchema(): Promise<void> {
    if (this.addonSchemaReady) return;
    await this.ensureSchema();
    // Mirrors migration 182 so the add-on works before it is applied.
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS nuvei_workspace_addons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        team_id UUID NOT NULL,
        workspace_id VARCHAR(64) NOT NULL,
        email TEXT,
        card_id UUID,
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'USD',
        status VARCHAR(24) NOT NULL DEFAULT 'pending',
        dev_reference TEXT UNIQUE,
        return_url TEXT,
        next_billing_date TIMESTAMPTZ,
        last_charge_at TIMESTAMPTZ,
        activated_at TIMESTAMPTZ,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        canceled_at TIMESTAMPTZ,
        consent_at TIMESTAMPTZ,
        consent_ip TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // One open (payable) add-on per account and Workspace, enforced by the
    // database: two tabs can never start two $97 subscriptions for it.
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS nuvei_ws_addon_one_open_uidx
         ON nuvei_workspace_addons (team_id, workspace_id)
         WHERE status IN ('pending','active','past_due')`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS nuvei_ws_addon_team_idx ON nuvei_workspace_addons (team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS nuvei_ws_addon_due_idx
         ON nuvei_workspace_addons (next_billing_date)
         WHERE status IN ('active','past_due')`,
    );
    this.addonSchemaReady = true;
  }

  /** The add-on's monthly price in USD (server-authoritative, never the client's). */
  private addonAmount(): number {
    const raw = Number(String(this.config.get('NUVEI_WORKSPACE_ADDON_CENTS') || '').trim());
    const cents = Number.isInteger(raw) && raw > 0 ? raw : WORKSPACE_ADDON_MONTHLY_CENTS;
    return Number((cents / 100).toFixed(2));
  }

  /** workspace_entitlements key of an add-on. Non-blank, so legacy-audit keeps it. */
  private addonKey(addonId: string): string {
    return `nuvei:${addonId}`;
  }

  private addonLabel(addon: any): string {
    return getWorkspace(addon?.workspace_id)?.name || 'Workspace';
  }

  private addonBase(ws: WorkspaceDef | null, workspaceId: string, amount: number) {
    return {
      workspaceId: ws?.id || workspaceId,
      workspaceRoute: ws?.route || '/dashboard',
      amount,
      currency: 'USD',
    };
  }

  /**
   * Where the browser lands after a 3DS challenge: the page the customer was
   * on (our own frontend only), else the Workspace's route. No open redirect.
   */
  private safeAddonReturnUrl(candidate: string | undefined, route: string): string {
    const fallback = `${this.frontendUrl()}${route}`;
    const raw = String(candidate || '').trim();
    if (!raw) return fallback;
    try {
      const u = new URL(raw);
      if (!new Set(this.frontendOrigins()).has(u.origin)) return fallback;
      u.searchParams.delete('threeds');
      u.searchParams.delete('addon');
      u.hash = '';
      return u.toString();
    } catch {
      return fallback;
    }
  }

  /** The return URL plus the markers the gate polls with. */
  private addonRedirect(addon: any): string {
    const route = getWorkspace(addon?.workspace_id)?.route || '/dashboard';
    try {
      const u = new URL(addon?.return_url || `${this.frontendUrl()}${route}`);
      u.searchParams.set('threeds', 'return');
      if (addon?.id) u.searchParams.set('addon', String(addon.id));
      return u.toString();
    } catch {
      return `${this.frontendUrl()}${route}`;
    }
  }

  /**
   * The saved card an add-on is charged to: the one the customer picked (it
   * must be theirs), else the card their live plan bills to, else their most
   * recent card. Nuvei binds a token to the user who tokenized it, so this is
   * always the purchasing user's OWN card.
   */
  private async addonCard(
    userId: string,
    cardId?: string,
  ): Promise<{ id: string; last4: string | null; brand: string | null } | null> {
    const wanted = String(cardId || '').trim();
    if (wanted) {
      if (!UUID_RE.test(wanted)) throw new BadRequestException('A saved card is required.');
      const { rows } = await this.db.query(
        `SELECT id, last4, brand FROM nuvei_cards
          WHERE id = $1 AND user_id = $2 AND status <> 'rejected'`,
        [wanted, userId],
      );
      if (!rows[0]) throw new BadRequestException('A saved card of this account is required.');
      return rows[0];
    }
    const { rows } = await this.db.query(
      `SELECT c.id, c.last4, c.brand
         FROM nuvei_cards c
        WHERE c.user_id = $1 AND c.status <> 'rejected'
        ORDER BY (c.id = (SELECT s.card_id FROM nuvei_subscriptions s
                           WHERE s.user_id = $1
                             AND s.status IN ('verification_pending','trialing','active','past_due')
                           ORDER BY s.created_at DESC LIMIT 1)) DESC NULLS LAST,
                 c.updated_at DESC, c.created_at DESC
        LIMIT 1`,
      [userId],
    );
    return rows[0] || null;
  }

  /** A charge on this add-on is still awaiting the bank (3DS / review / no answer). */
  private async addonHasInflightCharge(addonId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT 1 FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind IN ('addon','addon_renewal')
          AND status IN ('pending','unconfirmed')
          AND created_at > NOW() - interval '48 hours'
        LIMIT 1`,
      [addonId],
    );
    return rows.length > 0;
  }

  /** pending -> payment_failed only: never overwrites an approved add-on. */
  private async failPendingAddon(addonId: string): Promise<void> {
    await this.db.query(
      `UPDATE nuvei_workspace_addons SET status = 'payment_failed', updated_at = NOW()
        WHERE id = $1 AND status = 'pending'`,
      [addonId],
    );
  }

  /** Grant (idempotently) the Workspace a paid add-on unlocks. */
  private async grantAddonEntitlement(addon: any): Promise<void> {
    const ok = await this.workspaceEntitlements.grant({
      subscriptionId: this.addonKey(addon.id),
      workspaceId: addon.workspace_id,
      teamId: addon.team_id,
      userId: addon.user_id,
      source: 'nuvei_addon',
    });
    if (!ok) {
      this.logger.error(`workspace add-on ${addon.id}: entitlement could not be granted (team ${addon.team_id}, workspace ${addon.workspace_id})`);
    }
  }

  /**
   * Close an add-on (canceled / refunded) from one of `from` and revoke its
   * Workspace. Returns the closed row, or null if it was not in `from`.
   */
  private async closeAddon(
    addonId: string,
    status: 'canceled' | 'refunded',
    from: AddonStatus[],
  ): Promise<any | null> {
    const { rows } = await this.db.query(
      `UPDATE nuvei_workspace_addons
          SET status = $2::varchar,
              next_billing_date = NULL,
              canceled_at = CASE WHEN $2::varchar = 'canceled' THEN COALESCE(canceled_at, NOW()) ELSE canceled_at END,
              updated_at = NOW()
        WHERE id = $1 AND status = ANY($3::text[])
        RETURNING *`,
      [addonId, status, from],
    );
    if (!rows[0]) return null;
    await this.workspaceEntitlements.revoke(this.addonKey(addonId), status);
    return rows[0];
  }

  /**
   * Buy an additional Workspace ($97/month) on the purchasing user's saved
   * card, with 3DS. With `quote: true` it only validates and answers what would
   * be charged and to which card (status 'confirm'); nothing is charged.
   *
   * Order of checks mirrors WorkspacesController.purchase: platform support
   * never pays; only an account admin with an active CRM plan can buy; an
   * already-entitled account is never charged; a promotional included-workspace
   * credit comps it for free. Only then is the card charged.
   */
  async startWorkspaceAddon(input: {
    user: any;
    workspaceId: string;
    cardId?: string;
    quote?: boolean;
    browserInfo?: any;
    termUrl?: string;
    consentIp?: string;
    testScenario?: string; // STAGING ONLY, same scenarios as the plan activation
  }): Promise<WorkspaceAddonResult> {
    this.assertEnabled();
    await this.ensureAddonSchema();
    const ws = getWorkspace(input.workspaceId);
    if (!ws) throw new BadRequestException(`Unknown workspace: ${input.workspaceId}`);
    const amount = this.addonAmount();
    const base = this.addonBase(ws, ws.id, amount);
    const user = input.user;
    if (!user?.id) throw new ForbiddenException();

    // Platform support never pays and never creates customer billing records.
    if (String(user.role || '').toLowerCase() === 'super_admin') {
      return { ...base, status: 'active', alreadyEntitled: true, supportAccess: true };
    }

    const teamId = await this.workspaceEntitlements.resolveTeamId(user);
    if (!teamId) {
      throw new BadRequestException('A CRM team/account is required to add a workspace.');
    }
    if (!(await this.workspaceEntitlements.canManageWorkspaceBilling(user, teamId))) {
      throw new ForbiddenException('Only an account admin can add workspace add-ons');
    }
    const crmSub = await this.workspaceEntitlements.getActiveCrmSubscription(teamId);
    if (!crmSub) {
      throw new BadRequestException(
        'An active CRM plan is required before a workspace add-on can be purchased.',
      );
    }
    if (await this.workspaceEntitlements.hasActiveEntitlement(teamId, ws.id)) {
      return { ...base, status: 'active', alreadyEntitled: true };
    }
    // Every CRM plan includes ONE Workspace. If this account has not used it
    // yet (same rule as onboarding: any active Workspace other than a paid
    // Nuvei add-on counts as the included one; Lead Generator is never the
    // included one), this Workspace becomes the included one: no charge.
    if (ws.id !== 'lead-generator') {
      const held = await this.workspaceEntitlements.listActiveWorkspaceInstances(teamId);
      const includedUsed = held.some(
        (r) => r.source !== 'nuvei_addon' && r.workspace_id !== 'lead-generator',
      );
      if (!includedUsed) {
        const res = await this.workspaceEntitlements.activateForPlan({
          teamId,
          workspaceId: ws.id,
          planSubscriptionId: crmSub.id,
          planId: crmSub.planId || null,
          userId: user.id,
        });
        if (res.activated) {
          this.logger.log(`workspace '${ws.id}' unlocked as the plan's included workspace for team ${teamId} (no charge)`);
          return { ...base, status: 'active', comped: true, alreadyEntitled: !!res.alreadyEntitled };
        }
      }
    }
    // A promotional plan's included-workspace credit unlocks it for free.
    const included = await this.workspaceEntitlements.claimIncludedWorkspace({
      teamId,
      workspaceId: ws.id,
      userId: user.id,
    });
    if (included.comped) return { ...base, status: 'active', comped: true };

    // An add-on for this Workspace that is still open.
    const { rows: openRows } = await this.db.query(
      `SELECT * FROM nuvei_workspace_addons
        WHERE team_id = $1 AND workspace_id = $2 AND status IN ('pending','active','past_due')
        ORDER BY created_at DESC LIMIT 1`,
      [teamId, ws.id],
    );
    const open = openRows[0] || null;
    if (open?.status === 'active') {
      // Paid, but its entitlement is missing (an interrupted grant): repair it.
      await this.grantAddonEntitlement(open);
      return { ...base, status: 'active', alreadyEntitled: true, addonId: open.id };
    }
    if (open?.status === 'pending') {
      const st = await this.reconcilePendingAddon(open.id);
      if (st === 'active') return { ...base, status: 'active', addonId: open.id };
      if (st === 'pending') {
        // Same windows as the plan activation: an abandoned 3DS challenge may
        // be retried after 3 minutes, an unanswered charge after 15 minutes,
        // a bank review after 2 hours. A late approval of the abandoned one is
        // refunded as a duplicate (activateAddon), so waiting longer protects
        // nobody.
        const { rows: txr } = await this.db.query(
          `SELECT status, status_detail, provider_transaction_id, created_at FROM nuvei_transactions
            WHERE subscription_id = $1 AND kind = 'addon'
            ORDER BY created_at DESC LIMIT 1`,
          [open.id],
        );
        const t = txr[0];
        const ageMs = Date.now() - new Date(t?.created_at || open.created_at || Date.now()).getTime();
        const detail = Number(t?.status_detail);
        const threeDs = detail === 35 || detail === 36;
        // A charge Nuvei never answered (no transaction id) may still have
        // gone through: nothing can be verified, so a new charge is blocked
        // until its callback settles it or Nuvei's 48h callback window ends
        // (reconcilePendingAddon then closes it).
        const unknownOutcome =
          !t?.provider_transaction_id && ['pending', 'unconfirmed'].includes(String(t?.status || ''));
        const limitMs = unknownOutcome
          ? 48 * 60 * 60_000
          : threeDs
            ? 3 * 60_000
            : 2 * 60 * 60_000;
        if (ageMs < limitMs) {
          return {
            ...base,
            status: 'pending',
            addonId: open.id,
            message: 'A payment for this workspace is still being verified. It will unlock automatically once confirmed.',
          };
        }
        if (!input.quote) {
          this.logger.warn(`workspace add-on ${open.id} abandoned (${threeDs ? '3DS' : t?.status || 'no charge'}, ${Math.round(ageMs / 1000)}s); allowing a new attempt`);
          await this.failPendingAddon(open.id);
        }
      }
    }
    if (open?.status === 'past_due' && (await this.addonHasInflightCharge(open.id))) {
      return {
        ...base,
        status: 'pending',
        addonId: open.id,
        message: 'A payment for this workspace is still being confirmed. Please try again in a few minutes.',
      };
    }

    const card = await this.addonCard(user.id, input.cardId);
    if (input.quote) {
      return {
        ...base,
        status: 'confirm',
        card: card ? { id: card.id, last4: card.last4, brand: card.brand } : null,
      };
    }
    if (!card) {
      return {
        ...base,
        status: 'card_required',
        code: 'card_required',
        message: 'Add a card to buy this workspace add-on.',
      };
    }

    if (open?.status === 'past_due') {
      // Paying again replaces the unpaid add-on (nothing was paid for its
      // current period, so nothing is owed back); the new one starts a fresh
      // monthly cycle today.
      await this.closeAddon(open.id, 'canceled', ['past_due']);
      this.logger.log(`workspace add-on ${open.id} (past due) replaced by a new purchase`);
    }

    const userRow = await this.userRow(user.id);
    const token = await this.cardToken(card.id, user.id);

    // Nuvei's documented staging 3DS cards need a specific description and
    // amount; honored ONLY on the staging gateway (as in startActivation).
    let chargeAmount = amount;
    let description = `Cortexa ${ws.name} add-on`;
    const scenario = String(input.testScenario || '').trim().toLowerCase();
    if (scenario && this.client.environment() === 'staging') {
      if (scenario === '3ds_challenge') {
        chargeAmount = 151;
        description = '3DS Challenge';
      } else if (scenario === '3ds_frictionless') {
        chargeAmount = 150;
        description = '3DS FrictionLess';
      } else if (scenario === 'review') {
        description = 'Reviewed transaction';
      } else if (scenario === 'denied') {
        description = 'Denied transaction';
      }
    }

    const dev_reference = this.devRef('WSA');
    let addonId: string;
    try {
      const { rows } = await this.db.query(
        `INSERT INTO nuvei_workspace_addons
           (user_id, team_id, workspace_id, email, card_id, amount, currency, status,
            dev_reference, return_url, consent_at, consent_ip)
         VALUES ($1,$2,$3,$4,$5,$6,'USD','pending',$7,$8,NOW(),$9)
         RETURNING id`,
        [
          user.id,
          teamId,
          ws.id,
          userRow.email,
          card.id,
          amount,
          dev_reference,
          this.safeAddonReturnUrl(input.termUrl, ws.route),
          input.consentIp || null,
        ],
      );
      addonId = rows[0].id;
    } catch (err: any) {
      // Another tab / click opened an add-on for this Workspace first.
      if (String(err?.code || '') !== '23505') throw err;
      const { rows } = await this.db.query(
        `SELECT id, status FROM nuvei_workspace_addons
          WHERE team_id = $1 AND workspace_id = $2 AND status IN ('pending','active','past_due')
          ORDER BY created_at DESC LIMIT 1`,
        [teamId, ws.id],
      );
      const other = rows[0];
      if (other?.status === 'active') {
        return { ...base, status: 'active', alreadyEntitled: true, addonId: other.id };
      }
      return {
        ...base,
        status: 'pending',
        addonId: other?.id,
        message: 'A payment for this workspace is already being verified. It will unlock automatically once confirmed.',
      };
    }

    // 3DS2 for the customer-present charge; the ACS posts the CRes to OUR
    // server, which sends the browser back to the Workspace page.
    const browserInfo =
      input.browserInfo && typeof input.browserInfo === 'object' ? { ...input.browserInfo } : null;
    if (browserInfo && !browserInfo.ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(String(input.consentIp || ''))) {
      browserInfo.ip = input.consentIp;
    }
    const extraParams = {
      threeDS2_data: {
        term_url: `${this.backendUrl()}/api/nuvei/workspace-addons/3ds/return/${addonId}`,
        device_type: 'browser',
        process_anyway: false,
      },
      ...(browserInfo ? { browser_info: browserInfo } : {}),
    };

    // The charge row exists BEFORE the bank is asked (in-flight marker).
    await this.db.query(
      `INSERT INTO nuvei_transactions
         (subscription_id, user_id, kind, dev_reference, amount, status, message)
       VALUES ($1,$2,'addon',$3,$4,'pending','charge in progress')`,
      [addonId, user.id, dev_reference, chargeAmount],
    );

    const res = await this.client.debit(
      this.toNuveiUser(userRow),
      { amount: chargeAmount, description, dev_reference },
      token,
      extraParams,
    );
    const tx = res.body?.transaction || {};
    // No answer / gateway 5xx: the charge may or may not have reached the
    // bank. Never call it declined (a retry could double charge) and never
    // unlock unpaid: the callback or the status poll settles it.
    const unconfirmed = res.httpStatus === 0 || !res.body || (res.httpStatus >= 500 && !tx?.status);
    await this.recordTransaction({
      subscriptionId: addonId,
      userId: user.id,
      kind: 'addon',
      dev_reference,
      amount: chargeAmount,
      body: res.body,
      statusOverride: unconfirmed ? 'unconfirmed' : undefined,
    });
    const out = { ...base, addonId };

    if (unconfirmed) {
      this.logger.error(
        `Nuvei workspace add-on charge unconfirmed for ${addonId}: HTTP ${res.httpStatus} ${res.error || JSON.stringify(res.body || {}).slice(0, 200)}`,
      );
      return {
        ...out,
        status: 'pending',
        message: 'We could not confirm the payment yet. The workspace will unlock automatically once it is confirmed.',
      };
    }

    if (this.isApproved(res.body)) {
      const st = await this.activateAddon(addonId, tx);
      if (st === 'active') {
        return { ...out, status: 'active', transactionId: tx.id, message: 'Payment received. Your workspace is unlocked.' };
      }
      // A duplicate: the account already holds this Workspace (the UI opens it).
      return {
        ...out,
        status: st,
        alreadyEntitled: await this.workspaceEntitlements.hasActiveEntitlement(teamId, ws.id),
        transactionId: tx.id,
        message: `This workspace is already active on your account. This payment has been ${st === 'refunded' ? 'refunded' : 'flagged for refund'}.`,
      };
    }

    if (this.is3dsPending(res.body)) {
      return {
        ...out,
        status: 'pending',
        requires3ds: true,
        challenge: this.threeDsBrowserResponse(res.body) || {},
        transactionId: tx.id,
      };
    }

    // Pending WITHOUT 3DS content (anti-fraud / bank review).
    if (String(tx?.status || '').toLowerCase() === 'pending') {
      return {
        ...out,
        status: 'pending',
        transactionId: tx.id,
        message: 'Your payment is being verified. The workspace will unlock automatically once confirmed.',
      };
    }

    // A gateway / integration error is not a card decline.
    if (!res.ok && !tx?.status) {
      await this.failPendingAddon(addonId);
      this.logger.error(
        `Nuvei workspace add-on gateway error for ${addonId}: HTTP ${res.httpStatus} ${JSON.stringify(res.body).slice(0, 400)}`,
      );
      return {
        ...out,
        status: 'payment_failed',
        message: 'The payment could not be processed right now. Please try again in a moment.',
      };
    }

    // Declined by the issuer: stays locked. Never surface a raw provider string.
    await this.failPendingAddon(addonId);
    this.logger.warn(
      `Nuvei workspace add-on declined for ${addonId}: ${tx.message || res.error || 'no message'}`,
    );
    return {
      ...out,
      status: 'payment_failed',
      transactionId: tx.id,
      message: 'The payment could not be completed. Please try another card.',
    };
  }

  /**
   * The first payment of an add-on was approved: start its monthly cycle,
   * grant the Workspace and send the receipt. Idempotent (browser result,
   * 3DS return, poll and callback can all arrive). A charge for a Workspace the
   * account meanwhile got another way is a duplicate and is refunded.
   * Returns the add-on's resulting status.
   */
  private async activateAddon(addonId: string, tx: any): Promise<AddonStatus> {
    const { rows } = await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [addonId]);
    const addon = rows[0];
    if (!addon) return 'payment_failed';
    if (addon.status === 'active') {
      await this.grantAddonEntitlement(addon);
      return 'active';
    }
    if (!['pending', 'payment_failed'].includes(addon.status)) return addon.status;

    // Duplicate = the account holds this Workspace through ANOTHER entitlement
    // (never this add-on's own 'nuvei:<id>' row, which a concurrent settle of
    // the same payment may already have granted).
    if (
      await this.workspaceEntitlements.hasActiveEntitlementExcept(
        addon.team_id,
        addon.workspace_id,
        this.addonKey(addon.id),
      )
    ) {
      return this.refundDuplicateAddon(addon, tx);
    }

    // The browser result, the 3DS return, the status poll and the callback can
    // all settle the same payment at once: serialize the transition on the
    // add-on row, so exactly one of them activates it and the others see
    // 'active'.
    const next = this.addMonths(new Date(), 1);
    let updated: any = null;
    let current: any = null;
    try {
      await this.db.transaction(async (client) => {
        const { rows: locked } = await client.query(
          `SELECT * FROM nuvei_workspace_addons WHERE id = $1 FOR UPDATE`,
          [addonId],
        );
        current = locked[0] || null;
        if (!current || !['pending', 'payment_failed'].includes(current.status)) return;
        const r = await client.query(
          `UPDATE nuvei_workspace_addons
              SET status = 'active', next_billing_date = $2, last_charge_at = NOW(),
                  activated_at = COALESCE(activated_at, NOW()), updated_at = NOW()
            WHERE id = $1
            RETURNING *`,
          [addonId, next],
        );
        updated = r.rows[0] || null;
      });
    } catch (err: any) {
      // The database refused a second open add-on for this Workspace (a newer
      // purchase won): this late approval is a duplicate payment.
      if (String(err?.code || '') !== '23505') throw err;
      return this.refundDuplicateAddon(addon, tx);
    }
    if (!updated) {
      // Settled concurrently (browser result vs. callback): report it as is.
      if (current?.status === 'active') {
        await this.grantAddonEntitlement(current);
        return 'active';
      }
      return (current?.status || 'payment_failed') as AddonStatus;
    }

    await this.grantAddonEntitlement(updated);
    this.logger.log(
      `Workspace add-on ${addonId} active: '${updated.workspace_id}' unlocked for team ${updated.team_id}`,
    );
    const label = this.addonLabel(updated);
    await this.sendConfirmation({
      to: updated.email || (await this.emailForUser(updated.user_id)) || '',
      userId: updated.user_id,
      subject: `Cortexa ${label} add-on — payment received`,
      lines: [
        ['Workspace', label],
        ['Amount', this.money(Number(tx?.amount ?? updated.amount))],
        ['Billing', `${this.money(Number(updated.amount))} / month`],
        ['Status', 'Paid'],
        ['Transaction ID', tx?.id || '—'],
        ['Authorization code', tx?.authorization_code || '—'],
        ['Next charge', next.toISOString().slice(0, 10)],
      ],
      note: 'The workspace is now unlocked for your whole account. You can cancel the add-on anytime from Billing.',
    });
    return 'active';
  }

  /**
   * Refund an add-on's approved first charge that duplicates access the
   * account already has. The add-on row is CLAIMED first (pending /
   * payment_failed -> refunded), so concurrent settles can never refund twice
   * and an add-on that another settle just activated is never refunded.
   */
  private async refundDuplicateAddon(addon: any, tx: any): Promise<AddonStatus> {
    const { rows: claimed } = await this.db.query(
      `UPDATE nuvei_workspace_addons SET status = 'refunded', next_billing_date = NULL, updated_at = NOW()
        WHERE id = $1 AND status IN ('pending','payment_failed')
        RETURNING id`,
      [addon.id],
    );
    if (!claimed[0]) {
      const { rows: now } = await this.db.query(`SELECT status FROM nuvei_workspace_addons WHERE id = $1`, [addon.id]);
      return (now[0]?.status || 'payment_failed') as AddonStatus;
    }
    const txId = tx?.id ? String(tx.id) : null;
    let refunded = false;
    if (txId) {
      try {
        const r = await this.client.refund(txId);
        refunded = String(r.body?.status || '').toLowerCase() === 'success';
      } catch (err: any) {
        this.logger.error(`duplicate workspace add-on refund call failed for ${txId}: ${err?.message}`);
      }
    }
    const status: AddonStatus = refunded ? 'refunded' : 'payment_failed';
    if (!refunded) {
      // Not refunded at Nuvei: release the claim (flagged for an admin refund
      // below); a later settle of the same payment may try again.
      await this.db.query(
        `UPDATE nuvei_workspace_addons SET status = 'payment_failed', updated_at = NOW()
          WHERE id = $1 AND status = 'refunded'`,
        [addon.id],
      );
    }
    if (txId) {
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = CASE WHEN $2::boolean THEN 'refunded' ELSE status END,
                refunded_amount = CASE WHEN $2::boolean THEN amount ELSE refunded_amount END,
                message = $3
          WHERE provider_transaction_id = $1`,
        [txId, refunded, refunded ? 'duplicate workspace add-on — refunded automatically' : 'DUPLICATE WORKSPACE ADD-ON — REFUND REQUIRED'],
      );
    }
    this.logger.error(
      `Nuvei duplicate workspace add-on ${addon.id} (team ${addon.team_id}, '${addon.workspace_id}', tx ${txId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
    );
    if (refunded) {
      await this.sendConfirmation({
        to: addon.email || (await this.emailForUser(addon.user_id)) || '',
        userId: addon.user_id,
        subject: 'Duplicate payment refunded',
        lines: [
          ['Workspace', this.addonLabel(addon)],
          ['Amount refunded', this.money(Number(tx?.amount ?? addon.amount ?? 0))],
          ['Transaction', txId || '—'],
          ['Status', 'Refunded'],
        ],
        note: 'This workspace was already active on your account, so this payment has been refunded. Your access is unchanged.',
      });
    }
    return status;
  }

  /**
   * For an add-on still awaiting its first payment, ask Nuvei for the charge's
   * real status and finalize: approved -> active, definitive failure ->
   * payment_failed, otherwise still pending.
   */
  private async reconcilePendingAddon(addonId: string): Promise<AddonStatus | null> {
    const { rows } = await this.db.query(
      `SELECT a.id, a.status, a.created_at, t.provider_transaction_id, t.amount AS tx_amount
         FROM nuvei_workspace_addons a
         LEFT JOIN nuvei_transactions t ON t.subscription_id = a.id AND t.kind = 'addon'
        WHERE a.id = $1
        ORDER BY t.created_at DESC
        LIMIT 1`,
      [addonId],
    );
    const a = rows[0];
    if (!a) return null;
    if (a.status !== 'pending') return a.status;
    if (!a.provider_transaction_id) {
      // Nothing to verify; after Nuvei's 48h callback window nothing can
      // confirm it any more (a later callback still settles it).
      const { rowCount } = await this.db.query(
        `UPDATE nuvei_workspace_addons SET status = 'payment_failed', updated_at = NOW()
          WHERE id = $1 AND status = 'pending' AND created_at < NOW() - interval '48 hours'`,
        [a.id],
      );
      return rowCount ? 'payment_failed' : 'pending';
    }
    const info = await this.client.verifyTransaction(a.provider_transaction_id);
    if (!info.ok || !info.body?.transaction) return 'pending';
    const tx = info.body.transaction;
    if (this.isApproved(info.body)) {
      if (!this.amountMatches(tx.amount, a.tx_amount)) {
        this.logger.warn(`Nuvei workspace add-on amount mismatch for ${a.id}: got ${tx.amount}, expected ${a.tx_amount}`);
        return 'pending';
      }
      await this.db.query(
        `UPDATE nuvei_transactions
            SET status = 'success', status_detail = 3, authorization_code = COALESCE($2, authorization_code),
                current_status = $3, message = $4
          WHERE provider_transaction_id = $1`,
        [a.provider_transaction_id, tx.authorization_code || null, tx.current_status || null, tx.message || null],
      );
      return this.activateAddon(a.id, tx);
    }
    if (this.isDefinitiveFailure(info.body)) {
      await this.failPendingAddon(a.id);
      await this.db.query(
        `UPDATE nuvei_transactions SET status = $2, status_detail = $3, message = $4
          WHERE provider_transaction_id = $1`,
        [a.provider_transaction_id, String(tx.status || 'failure'), tx.status_detail ?? null, tx.message || null],
      );
      return 'payment_failed';
    }
    return 'pending';
  }

  /** Browser step after the 3DS "method" iframe: continue the authentication. */
  async workspaceAddonThreeDsContinue(addonId: string, userId: string): Promise<WorkspaceAddonResult> {
    this.assertEnabled();
    await this.ensureAddonSchema();
    const { rows } = await this.db.query(
      `SELECT a.id, a.user_id, a.status, a.workspace_id, a.amount, t.provider_transaction_id
         FROM nuvei_workspace_addons a
         LEFT JOIN nuvei_transactions t ON t.subscription_id = a.id AND t.kind = 'addon'
        WHERE a.id = $1
        ORDER BY t.created_at DESC LIMIT 1`,
      [addonId],
    );
    const a = rows[0];
    if (!a) throw new NotFoundException('Workspace add-on not found');
    if (String(a.user_id) !== String(userId)) throw new ForbiddenException();
    const base = { ...this.addonBase(getWorkspace(a.workspace_id), a.workspace_id, Number(a.amount)), addonId };
    if (a.status !== 'pending') return { ...base, status: a.status };
    if (a.provider_transaction_id) {
      const res = await this.client.threeDsContinue(a.user_id, a.provider_transaction_id);
      this.logger.log(
        `Nuvei 3DS continue for workspace add-on ${a.id}: HTTP ${res.httpStatus} ` +
          `status ${res.body?.transaction?.status ?? '-'}/${res.body?.transaction?.status_detail ?? '-'}`,
      );
      const br = this.threeDsBrowserResponse(res.body);
      if (br?.challenge_request) return { ...base, status: 'pending', requires3ds: true, challenge: br };
    }
    const st = (await this.reconcilePendingAddon(addonId)) || 'pending';
    return {
      ...base,
      status: st,
      message:
        st === 'payment_failed'
          ? 'The payment could not be completed. Please try another card.'
          : st === 'pending'
            ? 'Your payment is being verified. The workspace will unlock automatically once confirmed.'
            : undefined,
    };
  }

  /**
   * 3DS term_url of an add-on charge: hand the CRes to Nuvei, finalize from
   * the charge's real status, and send the browser back to the Workspace page
   * (which polls the add-on's status).
   */
  async workspaceAddonThreeDsReturn(addonId: string, form: any): Promise<{ redirect: string }> {
    await this.ensureAddonSchema();
    const id = String(addonId || '').trim();
    if (!UUID_RE.test(id)) return { redirect: `${this.frontendUrl()}/dashboard` };
    const { rows } = await this.db.query(
      `SELECT a.*, t.provider_transaction_id
         FROM nuvei_workspace_addons a
         LEFT JOIN nuvei_transactions t ON t.subscription_id = a.id AND t.kind = 'addon'
        WHERE a.id = $1
        ORDER BY t.created_at DESC LIMIT 1`,
      [id],
    );
    const a = rows[0];
    if (!a) return { redirect: `${this.frontendUrl()}/dashboard` };
    const redirect = this.addonRedirect(a);
    if (a.status !== 'pending') return { redirect };
    const cres = String(form?.cres || form?.CRes || form?.CRES || '').trim();
    if (a.provider_transaction_id && cres) {
      const v = await this.client.threeDsVerify(a.user_id, a.provider_transaction_id, cres);
      this.logger.log(
        `Nuvei 3DS challenge result for workspace add-on ${a.id}: HTTP ${v.httpStatus} ` +
          `status ${v.body?.transaction?.status ?? '-'}/${v.body?.transaction?.status_detail ?? '-'}`,
      );
    } else {
      this.logger.warn(`Nuvei 3DS return for workspace add-on ${a.id} without a CRes (keys: ${Object.keys(form || {}).join(',')})`);
    }
    try {
      await this.reconcilePendingAddon(a.id);
    } catch (err: any) {
      this.logger.warn(`3DS return reconcile failed for workspace add-on ${a.id}: ${err?.message}`);
    }
    return { redirect };
  }

  /**
   * Who may read / cancel an add-on: the paying user (their card is charged,
   * even if they have since left the team), a billing admin of the add-on's
   * account, or platform support / developers (canManageWorkspaceBilling).
   * A customer's users.role 'admin' alone is NOT enough.
   */
  private async canManageAddon(user: any, a: any): Promise<boolean> {
    if (!user?.id || !a) return false;
    if (String(a.user_id) === String(user.id)) return true;
    return this.workspaceEntitlements.canManageWorkspaceBilling(user, a.team_id);
  }

  /** True once the add-on table exists (no DDL; used while Nuvei is off). */
  private async addonTableExists(): Promise<boolean> {
    if (this.addonSchemaReady) return true;
    try {
      const { rows } = await this.db.query(`SELECT to_regclass('nuvei_workspace_addons') AS t`);
      return !!rows[0]?.t;
    } catch {
      return false;
    }
  }

  /**
   * One add-on's status (the gate polls it after 3DS / a bank review). The
   * paying user, an admin of that account, or platform support may read it.
   */
  async getWorkspaceAddon(addonId: string, user: any): Promise<WorkspaceAddonResult> {
    await this.ensureAddonSchema();
    const { rows } = await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [addonId]);
    let a = rows[0];
    if (!a) throw new NotFoundException('Workspace add-on not found');
    if (!(await this.canManageAddon(user, a))) throw new ForbiddenException();
    if (a.status === 'pending' && this.enabled()) {
      try {
        await this.reconcilePendingAddon(a.id);
      } catch (err: any) {
        this.logger.warn(`workspace add-on reconcile failed for ${a.id}: ${err?.message}`);
      }
      a = (await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [addonId])).rows[0] || a;
    }
    if (a.status === 'active' && !(await this.workspaceEntitlements.hasActiveEntitlement(a.team_id, a.workspace_id))) {
      await this.grantAddonEntitlement(a); // repair an interrupted grant
    }
    return {
      ...this.addonBase(getWorkspace(a.workspace_id), a.workspace_id, Number(a.amount)),
      addonId: a.id,
      status: a.status,
      nextBillingDate: a.next_billing_date ? new Date(a.next_billing_date).toISOString() : null,
      cancelAtPeriodEnd: !!a.cancel_at_period_end,
      message:
        a.status === 'payment_failed'
          ? 'The payment could not be completed. Please try another card.'
          : a.status === 'pending'
            ? 'Your payment is being verified. The workspace will unlock automatically once confirmed.'
            : undefined,
    };
  }

  /**
   * The account's open Workspace add-ons, plus any add-on this user pays for on
   * another account (e.g. a former admin whose card is still charged), so the
   * payer can always see and stop it (Billing page).
   */
  async listWorkspaceAddons(user: any): Promise<{ canManage: boolean; addons: any[] }> {
    if (!user?.id) return { canManage: false, addons: [] };
    // No DDL on a Billing page load while Nuvei is off: list only if the
    // table already exists (add-ons bought before a switch-off stay visible).
    if (this.enabled()) await this.ensureAddonSchema();
    else if (!(await this.addonTableExists())) return { canManage: false, addons: [] };
    const teamId = await this.workspaceEntitlements.resolveTeamId(user);
    const { rows } = await this.db.query(
      `SELECT id, user_id, team_id, workspace_id, status, amount, currency, next_billing_date,
              cancel_at_period_end, activated_at, created_at
         FROM nuvei_workspace_addons
        WHERE (team_id = $1 OR user_id = $2)
          AND status IN ('pending','active','past_due','suspended')
        ORDER BY created_at DESC
        LIMIT 50`,
      [teamId, user.id],
    );
    const canManageTeam = teamId
      ? await this.workspaceEntitlements.canManageWorkspaceBilling(user, teamId)
      : false;
    const addons: any[] = [];
    for (const r of rows) {
      const canCancel =
        String(r.user_id) === String(user.id) ||
        (String(r.team_id) === String(teamId) ? canManageTeam : await this.canManageAddon(user, r));
      addons.push({
        id: r.id,
        workspaceId: r.workspace_id,
        workspaceName: this.addonLabel(r),
        workspaceRoute: getWorkspace(r.workspace_id)?.route || null,
        status: r.status,
        amount: Number(r.amount),
        currency: r.currency || 'USD',
        nextBillingDate: r.next_billing_date ? new Date(r.next_billing_date).toISOString() : null,
        cancelAtPeriodEnd: !!r.cancel_at_period_end,
        activatedAt: r.activated_at ? new Date(r.activated_at).toISOString() : null,
        canCancel,
      });
    }
    return { canManage: canManageTeam, addons };
  }

  /**
   * Cancel an add-on (the paying user or an account admin). A paid-ahead
   * add-on stays unlocked until its next billing date, then the sweep closes
   * it and locks the Workspace; one with nothing paid ahead (past due /
   * suspended) ends now.
   */
  async cancelWorkspaceAddon(
    addonId: string,
    user: any,
  ): Promise<{ ok: boolean; status: string; endsAt: string | null; immediate: boolean }> {
    await this.ensureAddonSchema();
    const { rows } = await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [addonId]);
    const a = rows[0];
    if (!a) throw new NotFoundException('Workspace add-on not found');
    if (!(await this.canManageAddon(user, a))) {
      throw new ForbiddenException('Only an account admin can manage workspace add-ons');
    }
    if (['canceled', 'refunded', 'payment_failed'].includes(a.status)) {
      return { ok: true, status: a.status, endsAt: null, immediate: true };
    }
    // A charge still being confirmed must settle first, or an approval could
    // land on a canceled add-on: money taken, no service.
    if (await this.addonHasInflightCharge(a.id)) {
      throw new BadRequestException(
        'A payment on this workspace add-on is still being confirmed. Please try again in a few minutes.',
      );
    }
    const label = this.addonLabel(a);
    const to = a.email || (await this.emailForUser(a.user_id)) || '';
    const paidAhead =
      a.status === 'active' && a.next_billing_date && new Date(a.next_billing_date).getTime() > Date.now();
    if (paidAhead) {
      if (!a.cancel_at_period_end) {
        await this.db.query(
          `UPDATE nuvei_workspace_addons
              SET cancel_at_period_end = true, canceled_at = NOW(), updated_at = NOW()
            WHERE id = $1`,
          [a.id],
        );
        await this.sendConfirmation({
          to,
          userId: a.user_id,
          subject: `Your Cortexa ${label} add-on cancellation is scheduled`,
          lines: [
            ['Workspace', label],
            ['Access until', new Date(a.next_billing_date).toISOString().slice(0, 10)],
            ['Charges', 'No further charges will be made for this add-on.'],
          ],
          note: 'The workspace stays unlocked until the date above. Your CRM plan is not affected.',
        });
      }
      return { ok: true, status: 'active', endsAt: new Date(a.next_billing_date).toISOString(), immediate: false };
    }
    const closed = await this.closeAddon(a.id, 'canceled', ['pending', 'active', 'past_due', 'suspended']);
    if (closed) {
      await this.sendConfirmation({
        to,
        userId: a.user_id,
        subject: `Your Cortexa ${label} add-on has been canceled`,
        lines: [
          ['Workspace', label],
          ['Status', 'Canceled'],
          ['Charges', 'No further charges will be made for this add-on.'],
        ],
      });
    }
    return { ok: true, status: 'canceled', endsAt: new Date().toISOString(), immediate: true };
  }

  /** A scheduled cancellation reached its date: close it and lock the Workspace. */
  private async finalizeAddonCancellation(addonId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM nuvei_workspace_addons WHERE id = $1 AND cancel_at_period_end = true`,
      [addonId],
    );
    if (!rows[0]) return;
    const a = await this.closeAddon(addonId, 'canceled', ['active', 'past_due']);
    if (!a) return;
    const label = this.addonLabel(a);
    await this.sendConfirmation({
      to: a.email || (await this.emailForUser(a.user_id)) || '',
      userId: a.user_id,
      subject: `Your Cortexa ${label} add-on has ended`,
      lines: [
        ['Workspace', label],
        ['Status', 'Canceled'],
        ['Charges', 'No further charges will be made for this add-on.'],
      ],
      note: 'You can add the workspace again at any time. Your CRM plan is not affected.',
    });
  }

  /** Full refund / chargeback of an add-on charge: the add-on ends, its Workspace locks. */
  private async revokeAddonForRefund(addonId: string): Promise<void> {
    await this.ensureAddonSchema();
    const closed = await this.closeAddon(addonId, 'refunded', [
      'pending',
      'active',
      'past_due',
      'suspended',
      'canceled',
      'payment_failed',
    ]);
    if (!closed) {
      // Already refunded: keep the entitlement revoked all the same.
      await this.workspaceEntitlements.revoke(this.addonKey(addonId), 'refunded');
    }
  }

  // ---- workspace add-on renewals (stored token, no 3DS) -----------------

  private sweepingAddons = false;

  /**
   * Hourly sweep of Workspace add-on renewals, separate from the plan sweep.
   * Idempotent per (add-on, billing period) through the nuvei_transactions
   * period claim. Never charges a canceled / refunded / suspended add-on.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async debitDueWorkspaceAddons(addonId?: string): Promise<void> {
    // Scheduled cancellations close on their date even while charging is
    // paused or Nuvei is switched off (NUVEI_ENABLED / NUVEI_RECURRING_ENABLED
    // =false must never keep a canceled Workspace unlocked). With Nuvei off no
    // DDL runs: nothing to close if the table was never created.
    const on = this.enabled();
    if (on) await this.ensureAddonSchema();
    else if (!(await this.addonTableExists())) return;
    try {
      const { rows: ending } = await this.db.query(
        `SELECT id FROM nuvei_workspace_addons
          WHERE cancel_at_period_end = true
            AND status IN ('active','past_due')
            AND next_billing_date IS NOT NULL AND next_billing_date <= NOW()
            ${addonId ? 'AND id = $1' : ''}
          LIMIT 200`,
        addonId ? [addonId] : [],
      );
      for (const row of ending) await this.finalizeAddonCancellation(row.id);
    } catch (err: any) {
      this.logger.error(`workspace add-on cancellation pass failed: ${err?.message}`);
    }
    if (!on || !this.recurringEnabled()) return;
    if (!addonId) {
      if (this.sweepingAddons) return;
      this.sweepingAddons = true;
    }
    try {
      const params: any[] = [];
      let only = '';
      if (addonId) {
        params.push(addonId);
        only = ` AND a.id = $1`;
      }
      const { rows } = await this.db.query(
        `SELECT a.id
           FROM nuvei_workspace_addons a
          WHERE a.status IN ('active','past_due')
            AND a.cancel_at_period_end = false
            AND a.next_billing_date IS NOT NULL
            AND a.next_billing_date <= NOW()${only}
            AND NOT EXISTS (
              SELECT 1 FROM nuvei_transactions t
               WHERE t.subscription_id = a.id AND t.kind = 'addon_renewal'
                 AND t.period_key = to_char(a.next_billing_date AT TIME ZONE 'UTC', 'YYYY-MM-DD')
                 AND t.status IN ('pending','unconfirmed')
                 AND t.provider_transaction_id IS NULL
                 AND t.created_at > NOW() - interval '48 hours')
          ORDER BY a.next_billing_date ASC
          LIMIT 200`,
        params,
      );
      for (const row of rows) {
        try {
          await this.chargeAddonRenewal(row.id);
        } catch (err: any) {
          this.logger.error(`Workspace add-on renewal failed for ${row.id}: ${err?.message}`);
        }
      }
    } finally {
      if (!addonId) this.sweepingAddons = false;
    }
  }

  private async chargeAddonRenewal(addonId: string): Promise<void> {
    // Re-read right before acting (the customer may have canceled meanwhile).
    const { rows } = await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [addonId]);
    const addon = rows[0];
    if (!addon || !['active', 'past_due'].includes(addon.status)) return;
    if (!addon.next_billing_date || new Date(addon.next_billing_date).getTime() > Date.now()) return;
    if (addon.cancel_at_period_end) {
      await this.finalizeAddonCancellation(addon.id);
      return;
    }
    // Charge the price the customer agreed to, never a later config change.
    const amount = Number(addon.amount) > 0 ? Number(addon.amount) : this.addonAmount();
    const period = this.periodKey(addon.next_billing_date);
    const dev_reference = this.devRef('WSR');

    // Claim this billing period atomically; an existing claim is settled from
    // its row instead of sending a second debit.
    try {
      await this.db.query(
        `INSERT INTO nuvei_transactions
           (subscription_id, user_id, kind, period_key, dev_reference, amount, status, message)
         VALUES ($1,$2,'addon_renewal',$3,$4,$5,'pending','charge in progress')`,
        [addon.id, addon.user_id, period, dev_reference, amount],
      );
    } catch (err: any) {
      if (err?.code !== '23505') throw err;
      await this.settleAddonClaimedPeriod(addon, period, amount);
      return;
    }

    let res: any;
    try {
      const user = await this.userRow(addon.user_id);
      const token = await this.cardToken(addon.card_id, addon.user_id);
      // Not customer-present: no 3DS (the Recurrence flow does not support it).
      res = await this.client.debit(
        this.toNuveiUser(user),
        { amount, description: `Cortexa ${this.addonLabel(addon)} add-on monthly`, dev_reference },
        token,
      );
    } catch (err: any) {
      // Nothing reached the bank (card removed, token unreadable, user gone).
      const why = String(err?.message || 'error before charge');
      await this.markClaim(addon.id, period, 'error', why, undefined, 'addon_renewal');
      await this.escalateAddonBillingErrors(addon, amount, why);
      throw err;
    }

    const tx = res.body?.transaction || {};
    const gatewayError = !res.ok && !tx?.status;
    if (res.httpStatus === 0 || !res.body || (gatewayError && res.httpStatus >= 500)) {
      // No usable answer: keep the claim; the callback (or the 48h rule in
      // settleAddonClaimedPeriod) settles it. Nothing is re-sent blindly.
      this.logger.error(
        `Nuvei workspace add-on renewal unconfirmed for ${addon.id} period ${period}: HTTP ${res.httpStatus} ${res.error || JSON.stringify(res.body || {}).slice(0, 200)}`,
      );
      await this.markClaim(addon.id, period, 'unconfirmed', String(res.error || `HTTP ${res.httpStatus}`).slice(0, 500), res.body, 'addon_renewal');
      return;
    }
    if (gatewayError) {
      const detail = JSON.stringify(res.body?.error || res.body || {}).slice(0, 500);
      this.logger.error(`Nuvei workspace add-on renewal gateway error for ${addon.id} period ${period}: HTTP ${res.httpStatus} ${detail}`);
      await this.markClaim(addon.id, period, 'error', `HTTP ${res.httpStatus} ${detail}`, res.body, 'addon_renewal');
      await this.escalateAddonBillingErrors(addon, amount, `HTTP ${res.httpStatus}`);
      return;
    }

    const { rowCount: settledHere } = await this.db.query(
      `UPDATE nuvei_transactions
         SET provider_transaction_id = $2, authorization_code = $3, status = $4,
             status_detail = $5, current_status = $6, message = $7, raw = $8
       WHERE subscription_id = $1 AND kind = 'addon_renewal' AND period_key = $9
         AND status = 'pending'`,
      [
        addon.id,
        tx.id || null,
        tx.authorization_code || null,
        String(tx.status || 'failure'),
        Number.isFinite(Number(tx.status_detail)) ? Number(tx.status_detail) : null,
        tx.current_status || null,
        tx.message || res.error || null,
        JSON.stringify(res.body || {}),
        period,
      ],
    );
    // The callback may have written the outcome first; it applies it then.
    if (!settledHere) return;

    if (this.isApproved(res.body)) {
      await this.applyAddonRenewalSuccess(addon, tx, amount);
    } else if (String(tx.status || '').toLowerCase() === 'pending') {
      this.logger.warn(`Nuvei workspace add-on renewal pending review for ${addon.id} period ${period} (tx ${tx.id || '-'})`);
    } else {
      await this.applyAddonRenewalDecline(addon, tx, amount, tx.message || res.error || 'no message');
    }
  }

  /** Repeated integration errors: retry tomorrow; after 3 in 7 days, treat as a decline. */
  private async escalateAddonBillingErrors(addon: any, amount: number, reason: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'addon_renewal' AND status = 'error'
          AND created_at > NOW() - interval '7 days'`,
      [addon.id],
    );
    if (Number(rows[0]?.n || 0) >= 3) {
      await this.applyAddonRenewalDecline(addon, {}, amount, `billing error: ${reason}`);
      return;
    }
    await this.db.query(
      `UPDATE nuvei_workspace_addons SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
      [addon.id],
    );
  }

  /** The renewal period already has a claim row: settle from it (see settleClaimedPeriod). */
  private async settleAddonClaimedPeriod(addon: any, period: string, amount: number): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id, status, provider_transaction_id, authorization_code, created_at
         FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'addon_renewal' AND period_key = $2`,
      [addon.id, period],
    );
    const row = rows[0];
    if (!row) return;
    const status = String(row.status || '');
    const ageMs = Date.now() - new Date(row.created_at || Date.now()).getTime();
    const tomorrow = async () =>
      this.db.query(
        `UPDATE nuvei_workspace_addons SET next_billing_date = NOW() + interval '1 day', updated_at = NOW() WHERE id = $1`,
        [addon.id],
      );

    if (status === 'success') {
      if (addon.status !== 'active') {
        await this.applyAddonRenewalSuccess(
          addon,
          { id: row.provider_transaction_id, authorization_code: row.authorization_code },
          amount,
        );
      } else {
        await this.db.query(
          `UPDATE nuvei_workspace_addons SET next_billing_date = $2, updated_at = NOW() WHERE id = $1`,
          [addon.id, this.addMonths(new Date(addon.next_billing_date), 1)],
        );
      }
      return;
    }
    if ((status === 'pending' || status === 'unconfirmed') && row.provider_transaction_id) {
      const info = await this.client.verifyTransaction(row.provider_transaction_id);
      if (info.ok && info.body?.transaction) {
        const t = info.body.transaction;
        if (this.isApproved(info.body)) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'success', status_detail = 3,
                    authorization_code = COALESCE($2, authorization_code), message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [row.id, t.authorization_code || null, t.message || null],
          );
          if (rowCount) await this.applyAddonRenewalSuccess(addon, t, amount);
          return;
        }
        if (this.isDefinitiveFailure(info.body)) {
          const { rowCount } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
              WHERE id = $1 AND status IN ('pending','unconfirmed')`,
            [row.id, Number.isFinite(Number(t.status_detail)) ? Number(t.status_detail) : null, t.message || null],
          );
          if (rowCount) await this.applyAddonRenewalDecline(addon, t, amount, t.message || 'declined');
          return;
        }
      }
      return; // still pending at Nuvei (or could not verify): wait
    }
    if (status === 'pending') {
      if (ageMs < 2 * 60 * 60 * 1000) return; // another run is charging it
      if (ageMs < 48 * 60 * 60 * 1000) {
        if (ageMs < 3 * 60 * 60 * 1000) {
          this.logger.error(`Nuvei workspace add-on renewal claim for ${addon.id} period ${period} has no outcome after 2h; holding for Nuvei's callback`);
          await this.markClaim(addon.id, period, 'unconfirmed', 'no outcome recorded (process interrupted)', undefined, 'addon_renewal');
        }
        return;
      }
      await this.markClaim(addon.id, period, 'error', 'no outcome recorded (process interrupted), no callback in 48h', undefined, 'addon_renewal');
      await tomorrow();
      return;
    }
    if (status === 'unconfirmed') {
      if (ageMs < 48 * 60 * 60 * 1000) return; // Nuvei's callback may still arrive
      this.logger.error(`Nuvei workspace add-on renewal for ${addon.id} period ${period} unconfirmed for 48h; retrying tomorrow`);
      await this.markClaim(addon.id, period, 'error', 'unconfirmed for 48h, no callback received', undefined, 'addon_renewal');
      await tomorrow();
      return;
    }
    // failure / error: retry with a fresh period key tomorrow.
    await tomorrow();
  }

  /**
   * A renewal was declined: lock the Workspace (past_due), retry daily with a
   * fresh period key, and suspend after 5 real declines in 30 days.
   */
  private async applyAddonRenewalDecline(addon: any, tx: any, amount: number, reason: string): Promise<void> {
    const { rows: fails } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM nuvei_transactions
        WHERE subscription_id = $1 AND kind = 'addon_renewal'
          AND status IN ('failure','error') AND created_at > NOW() - interval '30 days'`,
      [addon.id],
    );
    const failures = Math.max(1, Number(fails[0]?.n || 0));
    const suspend = failures >= 5;
    const { rowCount } = await this.db.query(
      `UPDATE nuvei_workspace_addons
          SET status = $2,
              next_billing_date = CASE WHEN $3::boolean THEN NULL ELSE NOW() + interval '1 day' END,
              updated_at = NOW()
        WHERE id = $1 AND status IN ('active','past_due')`,
      [addon.id, suspend ? 'suspended' : 'past_due', suspend],
    );
    if (!rowCount) return; // canceled / refunded meanwhile
    await this.workspaceEntitlements.setStatus(this.addonKey(addon.id), suspend ? 'suspended' : 'past_due');
    this.logger.warn(
      `Workspace add-on renewal declined for ${addon.id} (${failures} failure(s) in 30d${suspend ? ', SUSPENDED' : ', retry tomorrow'}): ${reason}`,
    );
    const label = this.addonLabel(addon);
    await this.sendConfirmation({
      to: addon.email || (await this.emailForUser(addon.user_id)) || '',
      userId: addon.user_id,
      subject: `Cortexa ${label} add-on — payment failed`,
      lines: [
        ['Workspace', label],
        ['Amount', this.money(amount)],
        ['Status', 'Declined'],
        ['What happens next', suspend
          ? 'The add-on has been suspended after repeated failed payments and the workspace is locked. You can add it again with another card.'
          : 'The workspace is locked until the payment goes through. We will retry automatically tomorrow.'],
      ],
    });
  }

  /** A renewal was approved: next charge one month out, Workspace (re)unlocked, receipt. */
  private async applyAddonRenewalSuccess(addon: any, tx: any, amount: number): Promise<void> {
    // After a long lapse the paid month starts today (never several months
    // charged in consecutive hourly runs).
    const scheduled = new Date(addon.next_billing_date || Date.now());
    const base = scheduled.getTime() < Date.now() - 15 * 24 * 60 * 60 * 1000 ? new Date() : scheduled;
    const next = this.addMonths(base, 1);
    let rowCount = 0;
    try {
      const r = await this.db.query(
        `UPDATE nuvei_workspace_addons
            SET status = 'active', next_billing_date = $2, last_charge_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND status IN ('active','past_due','suspended')`,
        [addon.id, next],
      );
      rowCount = r.rowCount || 0;
    } catch (err: any) {
      // A suspended add-on whose Workspace was meanwhile bought again (a new
      // open add-on): it cannot come back, so this late payment is refunded
      // below instead of failing (and retrying) forever.
      if (String(err?.code || '') !== '23505') throw err;
      rowCount = 0;
    }
    if (!rowCount) {
      // The add-on ended while this charge was in flight: return the money.
      const txId = tx?.id ? String(tx.id) : null;
      let refunded = false;
      if (txId) {
        try {
          const r = await this.client.refund(txId);
          refunded = String(r.body?.status || '').toLowerCase() === 'success';
          if (refunded) {
            await this.db.query(
              `UPDATE nuvei_transactions SET status = 'refunded', refunded_amount = amount, message = 'charged after the add-on ended — refunded automatically' WHERE provider_transaction_id = $1`,
              [txId],
            );
          }
        } catch (err: any) {
          this.logger.error(`refund of post-cancellation add-on charge ${txId} failed: ${err?.message}`);
        }
        if (!refunded) {
          await this.db
            .query(
              `UPDATE nuvei_transactions SET message = 'CHARGED AFTER THE ADD-ON ENDED — REFUND REQUIRED' WHERE provider_transaction_id = $1`,
              [txId],
            )
            .catch(() => undefined);
        }
      }
      this.logger.error(
        `Nuvei workspace add-on renewal landed on a closed add-on ${addon.id} (tx ${txId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`,
      );
      return;
    }
    if (!(await this.workspaceEntitlements.reactivate(this.addonKey(addon.id)))) {
      await this.grantAddonEntitlement(addon);
    }
    const label = this.addonLabel(addon);
    await this.sendConfirmation({
      to: addon.email || (await this.emailForUser(addon.user_id)) || '',
      userId: addon.user_id,
      subject: `Cortexa ${label} add-on — payment received`,
      lines: [
        ['Workspace', label],
        ['Amount', this.money(amount)],
        ['Status', 'Paid'],
        ['Transaction ID', tx?.id || '—'],
        ['Authorization code', tx?.authorization_code || '—'],
        ['Next charge', next.toISOString().slice(0, 10)],
      ],
    });
  }

  /**
   * STAGING-ONLY test hook: make an add-on's renewal due now and run its
   * sweep once (exercises renewal, decline -> past_due and duplicate-charge
   * prevention). Refused unless NUVEI_ENVIRONMENT is staging.
   */
  async simulateWorkspaceAddonRenewal(addonId: string, user: any): Promise<WorkspaceAddonResult> {
    if (this.client.environment() !== 'staging') {
      throw new ForbiddenException('Renewal simulation is only available in staging.');
    }
    await this.ensureAddonSchema();
    const { rows } = await this.db.query(
      `SELECT id, user_id, team_id, status FROM nuvei_workspace_addons WHERE id = $1`,
      [addonId],
    );
    const a = rows[0];
    if (!a) throw new NotFoundException('Workspace add-on not found');
    if (!(await this.canManageAddon(user, a))) throw new ForbiddenException();
    // Move the due date only while no renewal is in flight; otherwise the
    // sweep and this run could charge two different billing periods.
    const { rowCount } = await this.db.query(
      `UPDATE nuvei_workspace_addons
          SET next_billing_date = NOW() - interval '1 minute', updated_at = NOW()
        WHERE id = $1 AND status IN ('active','past_due')
          AND NOT EXISTS (
            SELECT 1 FROM nuvei_transactions t
             WHERE t.subscription_id = $1 AND t.kind IN ('addon','addon_renewal')
               AND t.status IN ('pending','unconfirmed'))`,
      [addonId],
    );
    if (!rowCount) {
      throw new BadRequestException(
        !['active', 'past_due'].includes(a.status)
          ? `Workspace add-on is ${a.status}; renewal does not apply.`
          : 'A payment on this workspace add-on is still being confirmed. Try again once it settles.',
      );
    }
    await this.debitDueWorkspaceAddons(addonId);
    return this.getWorkspaceAddon(addonId, user);
  }

  /**
   * Verified callback for a Workspace add-on charge (first payment or
   * renewal). Same rules as the plan: approval only on success + detail 3 with
   * the recorded amount; a decline of the first payment leaves it locked; a
   * full reversal ends the add-on and locks the Workspace. Idempotent.
   */
  private async processAddonCallback(
    payload: any,
    tx: any,
    txRow: any,
    providerTxId: string | null,
  ): Promise<{ handled: string; verified: boolean }> {
    await this.ensureAddonSchema();
    const approved = this.isApproved(payload);
    const failed = this.isDefinitiveFailure(payload);
    const reversal = this.isReversal(payload);
    let confirmed = approved;
    if (confirmed && this.config.getBoolean('NUVEI_VERIFY_ENABLED', false) && providerTxId) {
      const v = await this.client.verifyTransaction(providerTxId);
      if (v.ok && v.body?.transaction) confirmed = this.isApproved(v.body);
    }
    if (providerTxId) {
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

    const { rows } = await this.db.query(`SELECT * FROM nuvei_workspace_addons WHERE id = $1`, [txRow.subscription_id]);
    const addon = rows[0];
    if (!addon) {
      this.logger.warn(`Nuvei callback for a workspace add-on charge with no add-on (tx row ${txRow.id})`);
      return { handled: 'addon_unknown', verified: false };
    }
    const txStatus = String(txRow.status || '');
    const open = ['pending', 'unconfirmed'].includes(txStatus);
    const charged = ['success', 'partially_refunded', 'refund_pending'].includes(txStatus);
    const asSub = { id: addon.id, user_id: addon.user_id, email: addon.email || (await this.emailForUser(addon.user_id)) };

    if (String(txRow.kind) === 'addon') {
      if (confirmed) {
        if (!this.amountMatches(tx?.amount, txRow.amount)) {
          this.logger.warn(`Nuvei add-on callback amount mismatch for ${txRow.dev_reference}: got ${tx?.amount}, expected ${txRow.amount}`);
          return { handled: 'amount_mismatch', verified: false };
        }
        if (['canceled', 'refunded'].includes(addon.status)) {
          // Money without service. Claim the still-open charge row first, so
          // only one settle of this payment ever asks Nuvei for the refund (a
          // duplicate refund already in progress has marked it 'success').
          const { rows: claim } = await this.db.query(
            `UPDATE nuvei_transactions SET status = 'success', status_detail = 3
              WHERE id = $1 AND status IN ('pending','unconfirmed','failure','error')
              RETURNING id`,
            [txRow.id],
          );
          if (!claim[0]) return { handled: 'already_processed', verified: true };
          return this.refundStrayCharge(
            asSub,
            { ...txRow, status: 'success' },
            providerTxId,
            'workspace add-on payment approved after the add-on ended',
          );
        }
        if (!charged) {
          await this.db.query(
            `UPDATE nuvei_transactions SET status = 'success', status_detail = 3 WHERE id = $1`,
            [txRow.id],
          );
        }
        if (['pending', 'payment_failed', 'active'].includes(addon.status)) {
          const st = await this.activateAddon(addon.id, tx);
          return { handled: st === 'active' ? 'addon_active' : `addon_${st}`, verified: true };
        }
        return { handled: 'already_processed', verified: true };
      }
      if (failed && open) {
        await this.db.query(
          `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
            WHERE id = $1 AND status IN ('pending','unconfirmed')`,
          [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
        );
        await this.failPendingAddon(addon.id);
        return { handled: 'addon_declined', verified: true };
      }
    } else {
      // addon_renewal
      if (confirmed) {
        if (charged || txStatus === 'refunded') return { handled: 'already_processed', verified: true };
        if (!this.amountMatches(tx?.amount, txRow.amount)) {
          this.logger.warn(`Nuvei add-on renewal callback amount mismatch for ${txRow.dev_reference}: got ${tx?.amount}, expected ${txRow.amount}`);
          return { handled: 'amount_mismatch', verified: false };
        }
        const { rowCount } = await this.db.query(
          `UPDATE nuvei_transactions
              SET status = 'success', status_detail = 3,
                  authorization_code = COALESCE($2, authorization_code),
                  message = COALESCE($3, message)
            WHERE id = $1 AND status IN ('pending','unconfirmed','error','failure')`,
          [txRow.id, tx?.authorization_code || null, tx?.message || null],
        );
        if (!rowCount) return { handled: 'already_processed', verified: true };
        // A LATER renewal already succeeded (the period was retried after
        // Nuvei stayed silent): this is a second payment for the same month.
        const { rows: later } = await this.db.query(
          `SELECT id FROM nuvei_transactions
            WHERE subscription_id = $1 AND kind = 'addon_renewal' AND status = 'success'
              AND id <> $2 AND created_at > (SELECT created_at FROM nuvei_transactions WHERE id = $2)
            LIMIT 1`,
          [addon.id, txRow.id],
        );
        if (later[0]) {
          let refunded = false;
          if (providerTxId) {
            try {
              const r = await this.client.refund(providerTxId);
              refunded = String(r.body?.status || '').toLowerCase() === 'success';
            } catch (err: any) {
              this.logger.error(`duplicate add-on renewal refund call failed for ${providerTxId}: ${err?.message}`);
            }
          }
          await this.db.query(
            `UPDATE nuvei_transactions
                SET status = CASE WHEN $2::boolean THEN 'refunded' ELSE status END,
                    refunded_amount = CASE WHEN $2::boolean THEN amount ELSE refunded_amount END,
                    message = $3
              WHERE id = $1`,
            [txRow.id, refunded, refunded ? 'duplicate add-on renewal — refunded automatically' : 'DUPLICATE ADD-ON RENEWAL — REFUND REQUIRED'],
          );
          this.logger.error(`Nuvei duplicate add-on renewal on ${addon.id} (tx ${providerTxId || '-'}): ${refunded ? 'refunded automatically' : 'REFUND REQUIRED'}`);
          return { handled: refunded ? 'duplicate_refunded' : 'duplicate_needs_refund', verified: true };
        }
        if (['active', 'past_due', 'suspended'].includes(addon.status)) {
          await this.applyAddonRenewalSuccess(
            { ...addon, next_billing_date: addon.next_billing_date || new Date() },
            tx,
            Number(txRow.amount),
          );
          return { handled: 'addon_renewal_confirmed', verified: true };
        }
        return this.refundStrayCharge(asSub, txRow, providerTxId, 'workspace add-on renewal approved after the add-on ended');
      }
      if (failed && open) {
        const { rowCount } = await this.db.query(
          `UPDATE nuvei_transactions SET status = 'failure', status_detail = $2, message = COALESCE($3, message)
            WHERE id = $1 AND status IN ('pending','unconfirmed')`,
          [txRow.id, Number.isFinite(Number(tx?.status_detail)) ? Number(tx.status_detail) : null, tx?.message || null],
        );
        if (!rowCount) return { handled: 'already_processed', verified: true };
        if (['active', 'past_due'].includes(addon.status)) {
          await this.applyAddonRenewalDecline(addon, tx, Number(txRow.amount), tx?.message || 'declined (callback)');
        }
        return { handled: 'addon_renewal_declined', verified: true };
      }
    }

    if (reversal) {
      if (charged) return this.applyAddonReversal(addon, txRow, tx);
      // Nothing was captured (abandoned 3DS / annulled authorization): note
      // it, never "refund" money the customer never paid.
      await this.db.query(
        `UPDATE nuvei_transactions SET message = COALESCE($2, message)
          WHERE id = $1 AND status IN ('pending','unconfirmed','failure','error')`,
        [txRow.id, tx?.message || 'annulled by Nuvei'],
      );
      if (String(txRow.kind) === 'addon') await this.failPendingAddon(addon.id);
      return { handled: 'reversal_noted', verified: true };
    }
    return { handled: confirmed ? 'already_processed' : 'ignored', verified: false };
  }

  /** Nuvei reported a refund / chargeback of an add-on charge (status 2). */
  private async applyAddonReversal(addon: any, txRow: any, tx: any): Promise<{ handled: string; verified: boolean }> {
    if (Number(tx?.status_detail) === 34) {
      await this.db.query(
        `UPDATE nuvei_transactions SET status = 'partially_refunded' WHERE id = $1 AND status <> 'refunded'`,
        [txRow.id],
      );
      return { handled: 'partial_refund_noted', verified: true };
    }
    await this.db.query(
      `UPDATE nuvei_transactions
          SET status = 'refunded',
              refunded_amount = GREATEST(refunded_amount, amount),
              message = COALESCE(message, 'refunded by Nuvei')
        WHERE id = $1 AND status <> 'refunded'`,
      [txRow.id],
    );
    const wasRefunded = addon.status === 'refunded';
    await this.revokeAddonForRefund(addon.id);
    if (!wasRefunded) {
      const label = this.addonLabel(addon);
      await this.sendConfirmation({
        to: addon.email || (await this.emailForUser(addon.user_id)) || '',
        userId: addon.user_id,
        subject: 'Your Cortexa refund has been processed',
        lines: [
          ['Workspace', label],
          ['Amount refunded', this.money(Number(tx?.amount ?? txRow?.amount ?? 0))],
          ['Original transaction', String(tx?.id || txRow?.provider_transaction_id || '—')],
          ['Status', 'Refunded'],
        ],
        note: 'The workspace add-on has ended and the workspace is locked. Your CRM plan is not affected.',
      });
      return { handled: 'addon_reversed', verified: true };
    }
    return { handled: 'reversal_noted', verified: true };
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
    if (String(input.plan).toLowerCase() === 'ecommerce') {
      await this.db.query(
        `UPDATE users
           SET payment_status=$2, is_active=true, checkout_status='paid',
               nuvei_subscription_id=$3, updated_at=NOW()
         WHERE id=$1`,
        [input.userId, input.paymentStatus, input.subscriptionId],
      );
      return;
    }
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
      const baseSeats = String(sub.provision_plan) === 'ecommerce' ? 1 : getSeatLimit(sub.provision_plan);
      const { rows: extraSeatRows } = await this.db.query(
        `SELECT COUNT(*)::int AS n FROM team_addon_history
          WHERE team_id = $1 AND addon_key = 'seat' AND disabled_at IS NULL`,
        [sub.team_id],
      );
      const seat = baseSeats + Number(extraSeatRows[0]?.n || 0);
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
    statusOverride?: string;
  }): Promise<void> {
    const tx = input.body?.transaction || {};
    const status = input.statusOverride || String(tx.status || 'failure');
    const detail = Number.isFinite(Number(tx.status_detail)) ? Number(tx.status_detail) : null;
    const message = tx.message || input.body?.error?.description || input.body?.error?.type || input.body?.error || null;
    // An override ('unconfirmed' after a timeout) is OUR guess, not Nuvei's
    // answer: it may only replace the in-flight 'pending' marker, never an
    // outcome the callback already recorded meanwhile (e.g. 'success').
    const onlyPending = !!input.statusOverride;
    try {
      // The row may already exist as an in-flight claim (written before the
      // charge was sent): complete it instead of inserting a second one.
      const { rowCount } = await this.db.query(
        `UPDATE nuvei_transactions
            SET provider_transaction_id = COALESCE($2, provider_transaction_id),
                authorization_code = COALESCE($3, authorization_code),
                status = $4, status_detail = $5, current_status = $6,
                message = $7, raw = $8
          WHERE dev_reference = $1 AND kind = $9
            ${onlyPending ? `AND status = 'pending'` : ''}`,
        [
          input.dev_reference,
          tx.id || null,
          tx.authorization_code || null,
          status,
          detail,
          tx.current_status || null,
          typeof message === 'string' ? message : JSON.stringify(message),
          JSON.stringify(input.body || {}),
          input.kind,
        ],
      );
      if (rowCount) return;
      if (onlyPending) {
        // The row exists but is already settled: keep the real outcome.
        const { rows: existing } = await this.db.query(
          `SELECT 1 FROM nuvei_transactions WHERE dev_reference = $1 AND kind = $2 LIMIT 1`,
          [input.dev_reference, input.kind],
        );
        if (existing[0]) return;
      }
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
          status,
          detail,
          tx.current_status || null,
          typeof message === 'string' ? message : JSON.stringify(message),
          JSON.stringify(input.body || {}),
        ],
      );
    } catch (err: any) {
      if (err?.code !== '23505') {
        this.logger.warn(`recordTransaction failed: ${err?.message}`);
      }
    }
  }

  private money(n: number, currency = 'USD'): string {
    return `$${Number(n).toFixed(2)} ${String(currency || 'USD').toUpperCase()}`;
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
        <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Cortexa Agentic CRM payment confirmation</p>
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
