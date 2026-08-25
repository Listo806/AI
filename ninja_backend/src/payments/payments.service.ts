import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PayPalService } from './paypal.service';
import { PaddleService } from './paddle.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import { normalizePlanId, getPlan } from '../plans/plan-config';
import { WorkspaceEntitlementsService } from '../workspaces/workspace-entitlements.service';
import { AiUnitsService } from '../ai-units/ai-units.service';
import { isValidWorkspaceId, normalizeWorkspaceId } from '../workspaces/workspace-registry';

// Seat allowance per normalized plan, mirrored from plan-config so a Paddle
// activation can stamp the subscription row's seat_limit without a plan lookup.
const SEATS_BY_PLAN: Record<string, number> = {
  free: 1,
  solo: 1,
  business: 3,
  scale: 5,
};

@Injectable()
export class PaymentsService {
  private webhookTableReady = false;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly paypalService: PayPalService,
    private readonly mailer: PlatformMailerService,
    private readonly workspaceEntitlements: WorkspaceEntitlementsService,
    private readonly aiUnits: AiUnitsService,
    private readonly paddle: PaddleService,
  ) {}

  // Fire the once-only welcome email after a confirmed payment. Best-effort:
  // the claim + send are guarded and logged inside the mailer, and any failure
  // here must never break webhook processing (Paddle would otherwise retry).
  private async fireWelcomeEmail(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<void> {
    try {
      if (opts.userId) {
        await this.mailer.sendWelcomeOnceByUserId(opts.userId);
      } else if (opts.subId) {
        await this.mailer.sendWelcomeOnceBySubscription(opts.subId);
      }
    } catch (err: any) {
      this.logger.error(`welcome email hook failed: ${err?.message}`);
    }
  }

  // Fire the once-only getting-started email, right after the welcome. Same
  // best-effort contract: never break webhook processing.
  private async fireGettingStartedEmail(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<void> {
    try {
      await this.mailer.sendGettingStartedOnce(opts);
    } catch (err: any) {
      this.logger.error(`getting-started email hook failed: ${err?.message}`);
    }
  }

  // Fire the payment-failed email when a charge or renewal fails. Best-effort.
  private async firePaymentFailedEmail(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<void> {
    try {
      await this.mailer.sendPaymentFailed(opts);
    } catch (err: any) {
      this.logger.error(`payment-failed email hook failed: ${err?.message}`);
    }
  }

  // Fire the subscription-canceled email once a cancellation is confirmed.
  private async fireSubscriptionCanceledEmail(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<void> {
    try {
      await this.mailer.sendSubscriptionCanceled(opts);
    } catch (err: any) {
      this.logger.error(`cancellation email hook failed: ${err?.message}`);
    }
  }

  // Move the existing sign-up record to checkout_status='paid' on the confirmed
  // payment. Best-effort + self-healing; never creates a new record.
  private async markCheckoutPaid(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<void> {
    try {
      await this.db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS checkout_status VARCHAR(24) DEFAULT 'registered'`,
      );
      if (opts.userId) {
        await this.db.query(
          `UPDATE users SET checkout_status = 'paid', updated_at = NOW() WHERE id = $1`,
          [opts.userId],
        );
      } else if (opts.subId) {
        await this.db.query(
          `UPDATE users SET checkout_status = 'paid', updated_at = NOW() WHERE paddle_subscription_id = $1`,
          [opts.subId],
        );
      }
    } catch (err: any) {
      this.logger.error(`checkout_status update failed: ${err?.message}`);
    }
  }

  async createCheckout(userId: string) {
    const { rows } = await this.db.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId],
    );

    const user = rows[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users
       SET payment_status = 'pending', updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    return {
      success: true,
      checkoutUrl: `/payment-success?userId=${userId}`,
    };
  }

  // Activate the account after a PayPal subscription is approved. Stores the
  // PayPal subscription id and the selected plan.
  async activateSubscription(
    userId: string,
    subscriptionId: string,
    plan: string,
  ) {
    // Make sure the column exists (safe no-op after the first time).
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT`,
    );

    const { rows } = await this.db.query(`SELECT id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!rows[0]) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users
       SET payment_status = 'active',
           is_active = true,
           plan = $2,
           paypal_subscription_id = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, plan, subscriptionId],
    );

    return { success: true };
  }

  // --- Paddle activation + webhook processing ---

  private paddleColumnReady = false;
  private async ensurePaddleColumn(): Promise<void> {
    if (this.paddleColumnReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT`,
    );
    // Trial end / first recurring charge date, captured from the Paddle
    // subscription (next_billed_at) while the subscription is trialing.
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`,
    );
    this.paddleColumnReady = true;
  }

  // Activate the account after a Paddle subscription is confirmed. Stores the
  // Paddle subscription id and the selected plan.
  async activatePaddleSubscription(
    userId: string,
    subscriptionId: string,
    plan: string,
    billingCycle?: string,
    // Paddle subscription status ('trialing' | 'active' | ...) and the next
    // billing date, so a real 14-day trial is recorded as trialing (with its
    // trial-end date) rather than active. Optional: absent = treat as active.
    subStatus?: string | null,
    nextBilledAt?: string | null,
  ) {
    await this.ensurePaddleColumn();
    const { rows } = await this.db.query(`SELECT id FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!rows[0]) {
      throw new NotFoundException('User not found');
    }
    // Record the chosen billing cycle when the checkout reported one (annual vs
    // monthly), so the admin + account reflect what the customer actually bought.
    const cycle = billingCycle === 'annual' ? 'annual' : billingCycle === 'monthly' ? 'monthly' : null;
    const isTrialing = String(subStatus || '').toLowerCase() === 'trialing';
    // Trialing keeps full access (is_active=true) but revenue does not begin until
    // the first recurring payment flips the subscription to 'active'.
    const ps = isTrialing ? 'trialing' : 'active';
    const trialEnd = isTrialing && nextBilledAt ? new Date(nextBilledAt) : null;
    await this.db.query(
      `UPDATE users
       SET payment_status = $5,
           is_active = true,
           plan = $2,
           paddle_subscription_id = $3,
           billing_cycle = COALESCE($4, billing_cycle),
           trial_ends_at = CASE WHEN $6::timestamptz IS NOT NULL THEN $6::timestamptz ELSE trial_ends_at END,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, plan || 'pro', subscriptionId, cycle, ps, trialEnd],
    );
    return { success: true };
  }

  // --- One-time Purchase-conversion guard ---
  // The Google Ads Purchase conversion must fire exactly once, only after the
  // signature-verified webhook has activated the account, and never again on a
  // Thank You page refresh. The frontend polls claimPurchaseConversion after
  // checkout; the atomic conditional UPDATE below returns fire:true a single
  // time per user, then false forever after (immune to reloads / concurrency).
  private purchaseFlagReady = false;
  private async ensurePurchaseFlagColumn(): Promise<void> {
    if (this.purchaseFlagReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS purchase_conversion_reported BOOLEAN NOT NULL DEFAULT false`,
    );
    this.purchaseFlagReady = true;
  }

  async claimPurchaseConversion(userId: string): Promise<{
    fire: boolean;
    value: number;
    currency: string;
    offer: string;
    plan: string | null;
    transactionId: string | null;
  }> {
    const result = {
      fire: false,
      value: 0,
      currency: 'USD',
      offer: '',
      plan: null as string | null,
      transactionId: null as string | null,
    };
    if (!userId) return result;
    await this.ensurePurchaseFlagColumn();
    // Only the first call for an active, not-yet-reported user flips the flag
    // and returns a row; every later call (including a page refresh) gets none.
    // Return the attribution needed for an accurate Purchase conversion.
    // The starting charge is derived from the underlying plan so $7/$14/$21
    // never become recurring subscription values.
    const { rows } = await this.db.query(
      `UPDATE users
          SET purchase_conversion_reported = true,
              updated_at = NOW()
        WHERE id = $1
          AND payment_status IN ('active', 'paid', 'trialing')
          AND purchase_conversion_reported = false
        RETURNING id, COALESCE(selected_plan, plan) AS plan,
                  paddle_subscription_id`,
      [userId],
    );
    if (rows.length > 0) {
      const r = rows[0];
      const normalizedPlan = String(r.plan || '').toLowerCase();

      // The authoritative starting charge is derived from the selected underlying
      // subscription plan. This keeps attribution aligned with the new offers:
      // solo -> $7, team/Business -> $14, growth/Scale -> $21.
      const startingChargeByPlan: Record<string, number> = {
        solo: 7,
        team: 14,
        growth: 21,
      };

      const startingCharge = startingChargeByPlan[normalizedPlan] || 0;

      result.fire = true;
      result.value = startingCharge;
      result.offer = startingCharge ? `$${startingCharge}` : '';
      result.plan = normalizedPlan || null;
      result.transactionId = r.paddle_subscription_id || userId;
    }
    return result;
  }

  private async setUserStatusByPaddleSub(
    subscriptionId: string | null,
    fields: {
      payment_status?: string;
      is_active?: boolean;
      trial_ends_at?: string | null;
    },
  ): Promise<boolean> {
    if (!subscriptionId) return false;
    await this.ensurePaddleColumn();
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (fields.payment_status !== undefined) {
      sets.push(`payment_status = $${i++}`);
      vals.push(fields.payment_status);
    }
    if (fields.is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      vals.push(fields.is_active);
    }
    if (fields.trial_ends_at !== undefined) {
      sets.push(`trial_ends_at = $${i++}`);
      vals.push(fields.trial_ends_at ? new Date(fields.trial_ends_at) : null);
    }
    if (!sets.length) return false;
    sets.push(`updated_at = NOW()`);
    vals.push(subscriptionId);
    const res = await this.db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE paddle_subscription_id = $${i}`,
      vals,
    );
    return (res.rowCount || 0) > 0;
  }

  // Idempotently process a signature-verified Paddle webhook. Activation happens
  // here: the checkout passes custom_data.userId, so subscription.activated/
  // created links the Paddle subscription to our user; later events map by the
  // stored paddle_subscription_id. Duplicate deliveries are ignored via
  // webhook_events. A status event that matches no user yet throws, so the caller
  // returns 5xx and Paddle retries until checkout has linked the subscription.
  async processPaddleWebhook(body: any): Promise<{
    status: string;
    idempotent?: boolean;
    matched?: boolean;
    eventType?: string;
  }> {
    const eventId = body?.event_id || body?.notification_id;
    const eventType = body?.event_type;
    const data = body?.data;
    if (!eventId || !eventType) return { status: 'ignored' };

    await this.ensureWebhookTable();

    const existing = await this.db.query(
      `SELECT id FROM webhook_events WHERE provider = 'paddle' AND event_id = $1`,
      [eventId],
    );
    if (existing.rows.length > 0) {
      return { status: 'success', idempotent: true, eventType };
    }

    // subscription.* events carry the subscription id in data.id; transaction.*
    // and adjustment.* carry it in data.subscription_id.
    const subId: string | null = eventType.startsWith('subscription.')
      ? data?.id || null
      : data?.subscription_id || null;
    const customUserId: string | null =
      data?.custom_data?.userId || data?.custom_data?.user_id || null;
    const customPlan: string | null = data?.custom_data?.plan || null;
    const customCycle: string | null =
      data?.custom_data?.billingCycle || data?.custom_data?.billing_cycle || null;

    // --- Promotional Business $257/mo offer (recognized by its own price id) ---
    // This one specific promo price ALWAYS provisions the Business plan (3 seats,
    // unlimited AI), regardless of what custom_data.plan says — so the offer can
    // never be mis-provisioned even if custom_data is missing or wrong. It is a
    // normal recurring subscription (no trial, charged immediately), so it flows
    // through the standard base-plan switch below with the plan forced to 'team'.
    const promoBusiness257PriceId = (
      process.env.PADDLE_PRICE_BUSINESS_PROMO257 ||
      'pri_01m0v8vg783g3f1xfvdkeqb15w'
    ).trim();
    const isBusinessPromo257 =
      !!promoBusiness257PriceId &&
      this.extractPaddlePriceIds(data).includes(promoBusiness257PriceId);
    // Plan used for activation: the promo price forces Business ('team'); otherwise
    // the client-supplied plan is used as before.
    const effectivePlan: string | null = isBusinessPromo257 ? 'team' : customPlan;

    // --- AI Unit refill packs (one-time purchase) ---
    // Detect by the ACTUAL purchased Paddle price id (server-side env), never
    // trusting client-supplied unit counts. Credits AI Units exactly once
    // (idempotent on the Paddle transaction id). Never throws, so it cannot
    // trigger a base-plan retry. Dormant until the three price ids are set.
    if (eventType === 'transaction.completed' || eventType === 'transaction.paid') {
      const pack = await this.resolveAiUnitsPack(data);
      if (pack && customUserId) {
        let credited = false;
        try {
          const { rows } = await this.db.query(
            `SELECT COALESCE(u.team_id, (SELECT id FROM teams WHERE owner_id = u.id LIMIT 1)) AS team_id
               FROM users u WHERE u.id = $1`,
            [customUserId],
          );
          const teamId = rows[0]?.team_id;
          if (teamId) {
            const amount = Number(data?.details?.totals?.grand_total ?? 0) / 100;
            const r = await this.aiUnits.creditPurchase(
              teamId,
              pack.packageId,
              pack.units,
              String(data?.id || ''),
              amount,
              data?.currency_code || 'USD',
            );
            credited = r.credited;
          }
        } catch (err: any) {
          this.logger.error(`ai-units credit failed (recorded, no retry): ${err?.message}`);
        }
        await this.db.query(
          `INSERT INTO webhook_events (provider, event_id, event_type, payload)
           VALUES ('paddle', $1, $2, $3::jsonb)
           ON CONFLICT (provider, event_id) DO NOTHING`,
          [eventId, eventType, JSON.stringify(body)],
        );
        return { status: 'success', matched: credited, eventType };
      }
    }

    // --- Workspace add-on (its OWN separate Paddle subscription) ---
    // A paid Workspace is billed as an independent $97/month Paddle subscription,
    // separate from the base plan and from every other Workspace. Detect and fully
    // handle it here, BEFORE the base-plan switch, so it never activates or relabels
    // the base plan, links its subscription id onto the user, writes plan billing
    // rows, or fires plan emails. It only grants/revokes its own entitlement row,
    // scoped by its own subscription id. This branch never throws (it records the
    // event and returns) so a workspace event can never trigger a base-plan retry.
    if (await this.isWorkspaceAddonEvent(data, subId)) {
      let wsMatched = false;
      // Never let a workspace-handling error escape: if it did, the event would go
      // unrecorded and Paddle would retry it forever. Record + return regardless.
      try {
        wsMatched = await this.handleWorkspaceAddonEvent(
          eventType,
          data,
          subId,
          customUserId,
        );
      } catch (err: any) {
        this.logger.error(
          `workspace add-on ${eventType} for ${subId || 'unknown'} failed (recorded, no retry): ${err?.message}`,
        );
      }
      await this.db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, payload)
         VALUES ('paddle', $1, $2, $3::jsonb)
         ON CONFLICT (provider, event_id) DO NOTHING`,
        [eventId, eventType, JSON.stringify(body)],
      );
      return { status: 'success', matched: wsMatched, eventType };
    }

    // --- Unlimited AI add-on ($147/month, its OWN separate Paddle subscription) ---
    // Handled fully here, BEFORE the base-plan switch, so it never activates or
    // relabels the base plan. It only grants/renews (or lets lapse) the account's
    // Unlimited-AI window on ai_unit_accounts. Isolated + never throws.
    if (await this.isUnlimitedAiEvent(data, subId)) {
      let uaMatched = false;
      try {
        uaMatched = await this.handleUnlimitedAiEvent(
          eventType,
          data,
          subId,
          customUserId,
        );
      } catch (err: any) {
        this.logger.error(
          `unlimited-AI ${eventType} for ${subId || 'unknown'} failed (recorded, no retry): ${err?.message}`,
        );
      }
      await this.db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, payload)
         VALUES ('paddle', $1, $2, $3::jsonb)
         ON CONFLICT (provider, event_id) DO NOTHING`,
        [eventId, eventType, JSON.stringify(body)],
      );
      return { status: 'success', matched: uaMatched, eventType };
    }

    let handled = false;
    let matched = false;
    // First-payment events only — a subscription.updated->active is a renewal /
    // plan change and must not trigger a "welcome". The once-only claim in the
    // mailer is the ultimate guard, but scoping here avoids emailing long-standing
    // customers who were never marked welcomed.
    let isActivation = false;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.created': {
        handled = true;
        // A real 14-day trial arrives as subscription.created with status
        // 'trialing'; the trial->paid conversion arrives as subscription.activated
        // with status 'active'. Only a genuine activation (not a trial start) is a
        // "first payment", so the welcome/activation side-effects fire on active.
        const subStatus = String(data?.status || '').toLowerCase();
        const isTrialing = subStatus === 'trialing';
        isActivation = !isTrialing;
        const nextBilled =
          data?.next_billed_at || data?.current_billing_period?.ends_at || null;
        if (customUserId && subId) {
          await this.activatePaddleSubscription(
            customUserId,
            subId,
            effectivePlan || 'pro',
            customCycle || 'monthly',
            subStatus,
            nextBilled,
          );
          matched = true;
        } else {
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: isTrialing ? 'trialing' : 'active',
            is_active: true,
            trial_ends_at: isTrialing ? nextBilled : undefined,
          });
        }
        break;
      }
      case 'transaction.completed':
      case 'transaction.paid':
        handled = true;
        isActivation = true;
        // Checkout passes custom_data.userId, so activate our user directly
        // instead of depending on the subscription id being linked first. This
        // stops redundant transaction events (e.g. a one-time setup-fee charge
        // with no subscription_id, or one arriving before subscription.created)
        // from failing and retrying. Never overwrite the plan (subscription
        // events own that) or an already-linked subscription id.
        // A transaction records real money (the day-0 activation fee, and the
        // recurring charges). It grants access, but it must NOT flip a trialing
        // customer to 'active' — the day-0 $7 fee arrives while the subscription
        // is still trialing, and revenue/active begins only when the subscription
        // itself activates (subscription.activated). So preserve 'trialing'.
        if (customUserId) {
          await this.ensurePaddleColumn();
          const res = await this.db.query(
            subId
              ? `UPDATE users
                    SET payment_status = CASE WHEN payment_status = 'trialing' THEN 'trialing' ELSE 'active' END,
                        is_active = true,
                        paddle_subscription_id = COALESCE(paddle_subscription_id, $2),
                        updated_at = NOW()
                  WHERE id = $1`
              : `UPDATE users
                    SET payment_status = CASE WHEN payment_status = 'trialing' THEN 'trialing' ELSE 'active' END,
                        is_active = true,
                        updated_at = NOW()
                  WHERE id = $1`,
            subId ? [customUserId, subId] : [customUserId],
          );
          matched = (res.rowCount || 0) > 0;
        } else if (subId) {
          await this.ensurePaddleColumn();
          const res = await this.db.query(
            `UPDATE users
                SET payment_status = CASE WHEN payment_status = 'trialing' THEN 'trialing' ELSE 'active' END,
                    is_active = true,
                    updated_at = NOW()
              WHERE paddle_subscription_id = $1`,
            [subId],
          );
          matched = (res.rowCount || 0) > 0;
        }
        break;
      case 'subscription.updated': {
        const status = data?.status;
        if (status === 'active') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'active',
            is_active: true,
          });
        } else if (status === 'trialing') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'trialing',
            is_active: true,
            trial_ends_at:
              data?.next_billed_at ||
              data?.current_billing_period?.ends_at ||
              null,
          });
        } else if (status === 'past_due') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'past_due',
          });
        } else if (status === 'paused') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'suspended',
            is_active: false,
          });
        } else if (status === 'canceled') {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'canceled',
            is_active: false,
          });
        }
        break;
      }
      case 'subscription.past_due':
        handled = true;
        matched = await this.setUserStatusByPaddleSub(subId, {
          payment_status: 'past_due',
        });
        break;
      case 'subscription.canceled':
        handled = true;
        matched = await this.setUserStatusByPaddleSub(subId, {
          payment_status: 'canceled',
          is_active: false,
        });
        break;
      case 'adjustment.created':
      case 'adjustment.updated':
        // Treat a full/partial refund adjustment as loss of access.
        if (data?.action === 'refund' && subId) {
          handled = true;
          matched = await this.setUserStatusByPaddleSub(subId, {
            payment_status: 'refunded',
            is_active: false,
          });
        }
        break;
      default:
        break;
    }

    if (handled && !matched) {
      throw new Error(
        `Paddle ${eventType} for ${subId || 'unknown'} matched no user yet; will retry`,
      );
    }

    await this.db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload)
       VALUES ('paddle', $1, $2, $3::jsonb)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(body)],
    );

    // Beyond activating the user (which grants access), mirror the confirmed
    // billing into the team-scoped subscriptions + payments tables so the admin's
    // Next Billing (subscriptions.current_period_end) and LTV (SUM of succeeded
    // payments) populate. Best-effort and self-contained: a failure here is logged
    // but never blocks activation or triggers a Paddle retry.
    await this.persistPaddleBilling(eventType, data, customUserId, subId);

    // Server-side Google Ads conversions (Paid Subscription + Renewal) via GA4
    // Measurement Protocol. Default-off until GA4_MP_API_SECRET is set; best-effort
    // and self-contained, so it never blocks activation or triggers a Paddle retry.
    await this.reportPaddleConversions(eventType, data, customUserId, subId);

    // First confirmed payment: move the SAME sign-up record to paid (never a new
    // account) and fire the once-only welcome + getting-started emails.
    if (isActivation && matched) {
      await this.markCheckoutPaid({ userId: customUserId, subId });
      await this.fireWelcomeEmail({ userId: customUserId, subId });
      await this.fireGettingStartedEmail({ userId: customUserId, subId });
    }

    // Billing-lifecycle emails. These are event-driven (each Paddle event id is
    // recorded above, so a duplicate delivery never re-sends) and best-effort.
    if (eventType === 'transaction.payment_failed') {
      await this.firePaymentFailedEmail({ userId: customUserId, subId });
    }
    if (eventType === 'subscription.canceled' && matched) {
      await this.fireSubscriptionCanceledEmail({ subId });
    }

    return { status: 'success', matched, eventType };
  }

  // --- Workspace add-on webhook handling ---
  //
  // Everything below keeps a paid Workspace's billing lifecycle entirely separate
  // from the base plan. A Workspace is its own Paddle subscription, so these events
  // must never flow into base-plan activation.

  // Collect every Paddle price id referenced by an event's line items. Covers the
  // shapes used by subscription.* (data.items[].price.id) and transaction.*
  // (data.items[].price.id or data.details.line_items[].price_id).
  private extractPaddlePriceIds(data: any): string[] {
    const ids = new Set<string>();
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const it of items) {
      const pid = it?.price?.id || it?.price_id || it?.priceId;
      if (pid) ids.add(String(pid));
    }
    const lineItems = data?.details?.line_items;
    if (Array.isArray(lineItems)) {
      for (const li of lineItems) {
        const pid = li?.price_id || li?.price?.id;
        if (pid) ids.add(String(pid));
      }
    }
    return Array.from(ids);
  }

  // Match a webhook's purchased price ids against the configured AI-Unit packs.
  // Units are derived from the price id (server authority), not client data.
  private async resolveAiUnitsPack(
    data: any,
  ): Promise<{ units: number; packageId: string; priceId: string } | null> {
    // The three configured one-time AI-credit price ids (any env slot).
    const configured = [
      process.env.PADDLE_PRICE_AI_UNITS_100,
      process.env.PADDLE_PRICE_AI_UNITS_200,
      process.env.PADDLE_PRICE_AI_UNITS_400,
    ]
      .map((v) => (v || '').trim())
      .filter(Boolean);
    if (!configured.length) return null;
    const purchased = this.extractPaddlePriceIds(data).find((id) =>
      configured.includes(id),
    );
    if (!purchased) return null;

    // Credit count from the price's REAL Paddle amount (VERIFIED, never guessed
    // from env order): $47->100, $67->200, $97->400. Server-authoritative — never
    // trusts client-supplied unit counts.
    const AMOUNT_UNITS: Array<[number, number]> = [
      [47, 100],
      [67, 200],
      [97, 400],
    ];
    const amount = await this.paddle.getPriceAmount(purchased);
    let units = 0;
    if (amount != null) {
      const m = AMOUNT_UNITS.find(([p]) => Math.abs(p - amount) < 0.5);
      if (m) units = m[1];
    }
    if (!units) {
      // Fallback to the env-slot mapping if Paddle couldn't confirm the amount.
      const slot: Record<string, number> = {};
      const put = (env: string, u: number) => {
        const v = (process.env[env] || '').trim();
        if (v) slot[v] = u;
      };
      put('PADDLE_PRICE_AI_UNITS_100', 100);
      put('PADDLE_PRICE_AI_UNITS_200', 200);
      put('PADDLE_PRICE_AI_UNITS_400', 400);
      units = slot[purchased] || 0;
    }
    if (!units) return null;
    return { units, packageId: `p${units}`, priceId: purchased };
  }

  // Is this Paddle event about a Workspace add-on subscription? True when the
  // checkout tagged it (custom_data.addon === 'workspace'), when it carries the
  // configured $97 Workspace price id, or when its subscription id is one we have
  // already recorded as a workspace entitlement (so later cancel/past-due events —
  // which may not repeat custom_data — are still routed here and never fall through
  // to the base-plan handler).
  private async isWorkspaceAddonEvent(
    data: any,
    subId: string | null,
  ): Promise<boolean> {
    const addonTag = String(
      data?.custom_data?.addon || data?.custom_data?.add_on || '',
    ).toLowerCase();
    if (addonTag === 'workspace') return true;

    // A workspaceId in custom_data is exclusive to workspace checkouts (base-plan
    // checkouts never carry one), so it is a safe secondary signal that catches
    // subscription.* lifecycle events even if the addon tag were ever dropped.
    if (data?.custom_data?.workspaceId || data?.custom_data?.workspace_id) {
      return true;
    }

    const workspacePriceId = process.env.PADDLE_PRICE_WORKSPACE;
    if (workspacePriceId && this.extractPaddlePriceIds(data).includes(workspacePriceId)) {
      return true;
    }

    if (subId) {
      try {
        if (await this.workspaceEntitlements.isKnownSubscription(subId)) return true;
      } catch (err: any) {
        this.logger.warn(
          `workspace add-on lookup failed for ${subId}: ${err?.message}`,
        );
      }
    }
    return false;
  }

  // Apply a Workspace add-on event to its entitlement row. Grants on first payment,
  // revokes on cancel/refund, and marks transient loss of access on past-due/pause.
  // Returns whether a row was affected; the caller records the event regardless, so
  // an unmappable event never retries. Never throws for control flow.
  private async handleWorkspaceAddonEvent(
    eventType: string,
    data: any,
    subId: string | null,
    customUserId: string | null,
  ): Promise<boolean> {
    // No subscription id means we cannot key the entitlement (e.g. an early
    // one-off transaction). The subscription.created/activated event carries the id
    // and performs the grant, so this is safely a no-op.
    if (!subId) return false;

    const status = data?.status;
    const isGrant =
      eventType === 'subscription.activated' ||
      eventType === 'subscription.created' ||
      eventType === 'transaction.completed' ||
      eventType === 'transaction.paid' ||
      (eventType === 'subscription.updated' && status === 'active');
    const isCancel =
      eventType === 'subscription.canceled' ||
      (eventType === 'subscription.updated' && status === 'canceled');
    const isRefund =
      (eventType === 'adjustment.created' || eventType === 'adjustment.updated') &&
      data?.action === 'refund';
    const isPastDue =
      eventType === 'subscription.past_due' ||
      (eventType === 'subscription.updated' && status === 'past_due');
    const isPaused =
      eventType === 'subscription.updated' && status === 'paused';

    if (isGrant) {
      const workspaceId = normalizeWorkspaceId(
        data?.custom_data?.workspaceId || data?.custom_data?.workspace_id,
      );
      if (!isValidWorkspaceId(workspaceId)) {
        // A reactivation event (e.g. updated->active after past_due) may not echo
        // the workspaceId. If we already know this subscription, restore its
        // existing entitlement instead of skipping.
        if (await this.workspaceEntitlements.reactivate(subId)) return true;
        this.logger.warn(
          `Workspace add-on ${eventType} for subscription ${subId} has no valid workspaceId; skipping grant`,
        );
        return false;
      }
      // Resolve the team authoritatively from the paying user. Never trust
      // custom_data.teamId, so a tampered checkout cannot grant another team access.
      let teamId: string | null = null;
      if (customUserId) {
        try {
          // Owner-aware: owners often have users.team_id = NULL and own the team via
          // teams.owner_id, so a paid owner must still be granted the entitlement.
          const u = await this.db.query(
            `SELECT COALESCE(u.team_id, t.id) AS team_id
               FROM users u
               LEFT JOIN teams t ON t.owner_id = u.id
              WHERE u.id = $1
              LIMIT 1`,
            [customUserId],
          );
          teamId = u.rows[0]?.team_id || null;
        } catch (err: any) {
          this.logger.warn(
            `Workspace add-on ${eventType} for ${subId}: team lookup failed: ${err?.message}`,
          );
        }
      }
      if (!teamId) {
        this.logger.warn(
          `Workspace add-on ${eventType} for ${subId}: could not resolve team from user ${customUserId || 'unknown'}; skipping grant`,
        );
        return false;
      }
      const priceId =
        this.extractPaddlePriceIds(data)[0] ||
        process.env.PADDLE_PRICE_WORKSPACE ||
        null;
      return this.workspaceEntitlements.grant({
        subscriptionId: subId,
        workspaceId,
        teamId,
        priceId,
        userId: customUserId,
      });
    }

    if (isCancel) return this.workspaceEntitlements.revoke(subId, 'canceled');
    if (isRefund) return this.workspaceEntitlements.revoke(subId, 'refunded');
    if (isPastDue) return this.workspaceEntitlements.setStatus(subId, 'past_due');
    if (isPaused) return this.workspaceEntitlements.setStatus(subId, 'suspended');

    // Any other event for a known workspace subscription is acknowledged (recorded
    // by the caller) but needs no state change.
    return false;
  }

  // Is this Paddle event about the Unlimited AI add-on subscription? True when the
  // checkout tagged it (custom_data.product === 'unlimited_ai'), it carries the
  // configured $147 Unlimited price id, or its subscription id is one we already
  // recorded as an Unlimited-AI subscription (so later lifecycle events match).
  private async isUnlimitedAiEvent(
    data: any,
    subId: string | null,
  ): Promise<boolean> {
    const product = String(data?.custom_data?.product || '').toLowerCase();
    if (product === 'unlimited_ai') return true;
    const priceId = (process.env.PADDLE_PRICE_AI_UNLIMITED || '').trim();
    if (priceId && this.extractPaddlePriceIds(data).includes(priceId)) return true;
    if (subId) {
      try {
        if (await this.aiUnits.isKnownUnlimitedSub(subId)) return true;
      } catch (err: any) {
        this.logger.warn(
          `unlimited-AI lookup failed for ${subId}: ${err?.message}`,
        );
      }
    }
    return false;
  }

  // Apply an Unlimited-AI event. Grants/renews the account's unlimited window to
  // the current period end on each successful payment; a cancel simply stops the
  // renewal so it lapses at the paid-through date (purchased credits are always
  // preserved). Returns whether a row was affected. Never throws for control flow.
  private async handleUnlimitedAiEvent(
    eventType: string,
    data: any,
    subId: string | null,
    customUserId: string | null,
  ): Promise<boolean> {
    if (!subId) return false;
    const status = String(data?.status || '').toLowerCase();
    const isGrant =
      eventType === 'subscription.activated' ||
      eventType === 'subscription.created' ||
      eventType === 'transaction.completed' ||
      eventType === 'transaction.paid' ||
      (eventType === 'subscription.updated' && status === 'active');
    const isRefund =
      (eventType === 'adjustment.created' ||
        eventType === 'adjustment.updated') &&
      data?.action === 'refund';

    if (isGrant) {
      // Resolve the team authoritatively from the paying user (owner-aware), or
      // from a subscription we already know.
      let teamId: string | null = null;
      if (customUserId) {
        try {
          const u = await this.db.query(
            `SELECT COALESCE(u.team_id, t.id) AS team_id
               FROM users u LEFT JOIN teams t ON t.owner_id = u.id
              WHERE u.id = $1 LIMIT 1`,
            [customUserId],
          );
          teamId = u.rows[0]?.team_id || null;
        } catch {
          /* fall through to sub lookup */
        }
      }
      if (!teamId) {
        try {
          const r = await this.db.query(
            `SELECT team_id FROM ai_unit_accounts WHERE unlimited_ai_sub_id = $1 LIMIT 1`,
            [subId],
          );
          teamId = r.rows[0]?.team_id || null;
        } catch {
          /* ignore */
        }
      }
      if (!teamId) {
        this.logger.warn(
          `unlimited-AI ${eventType} for ${subId}: could not resolve team; skipping grant`,
        );
        return false;
      }
      // Unlimited stays active until the current period end; each renewal pushes
      // it forward. If Paddle gives no period end, hold a safe 35-day buffer so a
      // renewal event can extend it before it lapses.
      const until =
        data?.next_billed_at ||
        data?.current_billing_period?.ends_at ||
        new Date(Date.now() + 35 * 86400000).toISOString();
      await this.aiUnits.setUnlimitedAi(teamId, until, subId);
      return true;
    }

    if (isRefund) {
      await this.aiUnits.revokeUnlimitedAiBySub(subId);
      return true;
    }

    // cancel / past_due / paused / anything else: no extension — the unlimited
    // window lapses on its own at the paid-through date. Purchased credits remain.
    return false;
  }

  // --- Paddle subscriptions + payments persistence ---
  //
  // The user-table activation above grants access and drives the plan label. This
  // block additionally keeps the team-scoped `subscriptions` and `payments` tables
  // in sync so the admin Customers view can derive Next Billing (from
  // subscriptions.current_period_end) and LTV (from SUM of succeeded payments).
  // Everything here is best-effort: reporting must never block account access.

  // Map a Paddle event to the subscription status we should persist, or null when
  // the event should not touch the subscription/payment tables.
  private paddleBillingStatus(eventType: string, data: any): string | null {
    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.created':
      case 'transaction.completed':
      case 'transaction.paid':
        return 'active';
      case 'subscription.past_due':
        return 'past_due';
      case 'subscription.canceled':
        return 'canceled';
      case 'subscription.updated': {
        const s = String(data?.status || '').toLowerCase();
        if (s === 'active') return 'active';
        if (s === 'past_due') return 'past_due';
        if (s === 'paused') return 'suspended';
        if (s === 'canceled') return 'canceled';
        return null;
      }
      default:
        return null;
    }
  }

  private async resolveTeamIdForPaddle(
    userId: string | null,
    subId: string | null,
  ): Promise<string | null> {
    try {
      if (userId) {
        const { rows } = await this.db.query(
          `SELECT team_id FROM users WHERE id = $1 LIMIT 1`,
          [userId],
        );
        if (rows[0]?.team_id) return rows[0].team_id;
      }
      if (subId) {
        const { rows } = await this.db.query(
          `SELECT team_id FROM users WHERE paddle_subscription_id = $1 LIMIT 1`,
          [subId],
        );
        if (rows[0]?.team_id) return rows[0].team_id;
      }
    } catch (err: any) {
      this.logger.error(`resolveTeamIdForPaddle failed: ${err?.message}`);
    }
    return null;
  }

  private async lookupUserPlan(
    userId: string | null,
    subId: string | null,
  ): Promise<string | null> {
    try {
      const where = userId ? 'id = $1' : 'paddle_subscription_id = $1';
      const key = userId || subId;
      if (!key) return null;
      const { rows } = await this.db.query(
        `SELECT selected_plan, plan FROM users WHERE ${where} LIMIT 1`,
        [key],
      );
      return rows[0]?.selected_plan || rows[0]?.plan || null;
    } catch {
      return null;
    }
  }

  // Insert or update the single subscriptions row for this Paddle subscription.
  // Keyed on the unique paddle_subscription_id, so repeated deliveries just refresh
  // the status and billing period. Returns the row id for the payment FK.
  private async upsertPaddleSubscription(opts: {
    teamId: string;
    paddleSubId: string;
    paddleCustomerId: string | null;
    seatLimit: number;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
  }): Promise<string | null> {
    const { rows } = await this.db.query(
      `INSERT INTO subscriptions
         (team_id, provider, status, seat_limit, paddle_subscription_id,
          paddle_customer_id, current_period_start, current_period_end,
          created_at, updated_at)
       VALUES ($1, 'paddle', $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (paddle_subscription_id) DO UPDATE SET
         status = EXCLUDED.status,
         seat_limit = EXCLUDED.seat_limit,
         paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, subscriptions.paddle_customer_id),
         current_period_start = COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start),
         current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
         updated_at = NOW()
       RETURNING id`,
      [
        opts.teamId,
        opts.status,
        opts.seatLimit,
        opts.paddleSubId,
        opts.paddleCustomerId,
        opts.periodStart,
        opts.periodEnd,
      ],
    );
    return rows[0]?.id || null;
  }

  // The most recent Paddle subscription row for a team — used to attach a
  // one-time charge (e.g. the $7 activation) that arrives without a subscription id.
  private async latestTeamPaddleSubscription(
    teamId: string,
  ): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT id FROM subscriptions
        WHERE team_id = $1 AND provider = 'paddle'
        ORDER BY created_at DESC LIMIT 1`,
      [teamId],
    );
    return rows[0]?.id || null;
  }

  private async recordPaddlePayment(opts: {
    subscriptionRowId: string;
    paddleTxnId: string;
    amount: number;
    currency: string;
    status: string;
    paymentDate: string | null;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO payments
         (subscription_id, paddle_transaction_id, amount, currency, status,
          payment_date, created_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), NOW())
       ON CONFLICT (paddle_transaction_id) DO UPDATE SET
         status = EXCLUDED.status,
         amount = EXCLUDED.amount`,
      [
        opts.subscriptionRowId,
        opts.paddleTxnId,
        opts.amount,
        opts.currency,
        opts.status,
        opts.paymentDate,
      ],
    );
  }

  // Mirror a confirmed Paddle event into subscriptions + payments. Best-effort:
  // any failure is logged and swallowed so account access is never affected.
  private async persistPaddleBilling(
    eventType: string,
    data: any,
    customUserId: string | null,
    subId: string | null,
  ): Promise<void> {
    try {
      const status = this.paddleBillingStatus(eventType, data);
      if (!status) return;

      const teamId = await this.resolveTeamIdForPaddle(customUserId, subId);
      if (!teamId) return;

      // Billing period → the admin's Next Billing. Subscription events carry
      // current_billing_period; transaction events carry billing_period; fall back
      // to next_billed_at.
      const periodStart =
        data?.current_billing_period?.starts_at ||
        data?.billing_period?.starts_at ||
        null;
      const periodEnd =
        data?.current_billing_period?.ends_at ||
        data?.billing_period?.ends_at ||
        data?.next_billed_at ||
        null;
      const paddleCustomerId = data?.customer_id || null;
      const planKey = normalizePlanId(
        data?.custom_data?.plan ||
          (await this.lookupUserPlan(customUserId, subId)),
      );
      const seatLimit = SEATS_BY_PLAN[planKey] ?? 1;

      // Resolve the subscriptions row to write against. With a subscription id we
      // upsert it; without one (a standalone $7 charge) we attach to the team's
      // existing Paddle subscription row so LTV still counts it.
      let subRowId: string | null = null;
      if (subId) {
        subRowId = await this.upsertPaddleSubscription({
          teamId,
          paddleSubId: subId,
          paddleCustomerId,
          seatLimit,
          status,
          periodStart,
          periodEnd,
        });
      } else {
        subRowId = await this.latestTeamPaddleSubscription(teamId);
      }

      if (eventType.startsWith('transaction.') && subRowId) {
        const txnId = data?.id || null;
        const totals = data?.details?.totals || data?.totals || {};
        const rawAmount =
          totals.grand_total ?? totals.total ?? data?.amount ?? null;
        // Paddle Billing amounts are minor units (cents) as strings.
        const amount = rawAmount != null ? Number(rawAmount) / 100 : null;
        const currency = data?.currency_code || data?.currency || 'USD';
        const paymentDate = data?.billed_at || data?.created_at || null;
        if (txnId && amount != null && Number.isFinite(amount)) {
          await this.recordPaddlePayment({
            subscriptionRowId: subRowId,
            paddleTxnId: txnId,
            amount,
            currency,
            status: 'succeeded',
            paymentDate,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(
        `persistPaddleBilling(${eventType}) failed (non-fatal): ${err?.message}`,
      );
    }
  }

  // --- Server-side Paid Subscription + Renewal conversions (GA4 Measurement
  //     Protocol -> the linked Google Ads account) ---
  //
  // These fire from the confirmed Paddle payment because there is no browser open
  // at renewal time. Default-off: a complete no-op unless GA4_MP_API_SECRET is set
  // (the client creates it in GA4 Admin > Data streams > Measurement Protocol API
  // secrets), so this cannot touch the live payment flow until it is switched on.
  // Once on, GA4 receives `paid_subscription` / `subscription_renewal`; marking
  // those as Key events in GA4 imports them as conversions into the linked Ads acct.

  private paidSubFlagReady = false;
  private async ensurePaidSubFlagColumn(): Promise<void> {
    if (this.paidSubFlagReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_sub_conversion_reported BOOLEAN NOT NULL DEFAULT false`,
    );
    this.paidSubFlagReady = true;
  }

  // Deterministic GA4-style client_id so a given user maps to one client across
  // renewals. This is not the browser's real client_id (we do not store that yet),
  // so these server conversions are counted and revenue-valued but not stitched to
  // the original web session — good enough for counting paid subscriptions and
  // renewals, and upgradeable later by capturing the real client_id at checkout.
  private ga4ClientIdFor(userId: string): string {
    let h = 0;
    const s = String(userId);
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return `${h}.${1000000000 + (h % 1000000000)}`;
  }

  private async resolveUserIdForConversion(
    customUserId: string | null,
    subId: string | null,
  ): Promise<string | null> {
    if (customUserId) return customUserId;
    if (!subId) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT id FROM users WHERE paddle_subscription_id = $1 LIMIT 1`,
        [subId],
      );
      return rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  // POST a GA4 Measurement Protocol event. No-op unless GA4_MP_API_SECRET is set.
  // Best-effort with a short timeout: never throws, never blocks the webhook.
  private async sendGa4ServerEvent(
    eventName: string,
    params: Record<string, any>,
    clientId: string,
    userId?: string | null,
  ): Promise<void> {
    const secret = process.env.GA4_MP_API_SECRET;
    const measurementId = process.env.GA4_MEASUREMENT_ID || 'G-WTDN8QJ9CM';
    if (!secret) return;
    try {
      const url =
        `https://www.google-analytics.com/mp/collect` +
        `?measurement_id=${encodeURIComponent(measurementId)}` +
        `&api_secret=${encodeURIComponent(secret)}`;
      const body: any = {
        client_id: clientId,
        events: [{ name: eventName, params }],
      };
      if (userId) body.user_id = String(userId);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (err: any) {
      this.logger.error(
        `GA4 MP event ${eventName} failed (non-fatal): ${err?.message}`,
      );
    }
  }

  // Fire the Paid Subscription (first confirmed payment, once per account) and
  // Renewal (every later charge) conversions. Triggered only by transaction.completed
  // — Paddle's canonical "payment completed" event — which is deduped upstream by
  // webhook_events, so each real charge reaches here exactly once. Best-effort.
  private async reportPaddleConversions(
    eventType: string,
    data: any,
    customUserId: string | null,
    subId: string | null,
  ): Promise<void> {
    // Off unless configured: skipping here means the DB claim and lookups below
    // never run, so the whole feature is a no-op until the client sets the secret.
    if (!process.env.GA4_MP_API_SECRET) return;
    if (eventType !== 'transaction.completed') return;
    try {
      await this.ensurePaidSubFlagColumn();

      const userId = await this.resolveUserIdForConversion(customUserId, subId);
      if (!userId) return;

      const planKey = normalizePlanId(
        data?.custom_data?.plan ||
          (await this.lookupUserPlan(customUserId, subId)),
      );
      const recurring = getPlan(planKey).pricing.monthlyCents / 100;

      // Actual amount charged (Paddle minor units) for the renewal value.
      const totals = data?.details?.totals || data?.totals || {};
      const rawAmount =
        totals.grand_total ?? totals.total ?? data?.amount ?? null;
      const charged = rawAmount != null ? Number(rawAmount) / 100 : null;
      const currency = data?.currency_code || data?.currency || 'USD';
      const txnId = data?.id || subId || userId;

      // Atomically claim the once-only paid-subscription conversion. The first
      // confirmed payment wins; every later charge is a renewal.
      const claim = await this.db.query(
        `UPDATE users
            SET paid_sub_conversion_reported = true, updated_at = NOW()
          WHERE id = $1 AND paid_sub_conversion_reported = false
          RETURNING id`,
        [userId],
      );
      const isFirstPayment = (claim.rowCount || 0) > 0;
      const clientId = this.ga4ClientIdFor(userId);

      // Renewal is valued at the amount actually charged; the paid-subscription
      // conversion is valued at the plan's recurring price, falling back to the
      // charged amount if the plan could not be resolved (never a 0-value event).
      const chargedValue =
        charged != null && Number.isFinite(charged) ? charged : null;
      const renewalValue = chargedValue != null ? chargedValue : recurring;
      const subValue = recurring > 0 ? recurring : chargedValue != null ? chargedValue : 0;

      if (isFirstPayment) {
        await this.sendGa4ServerEvent(
          'paid_subscription',
          { value: subValue, currency, plan: planKey, transaction_id: txnId },
          clientId,
          userId,
        );
      } else {
        await this.sendGa4ServerEvent(
          'subscription_renewal',
          { value: renewalValue, currency, plan: planKey, transaction_id: txnId },
          clientId,
          userId,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `reportPaddleConversions(${eventType}) failed (non-fatal): ${err?.message}`,
      );
    }
  }

  // --- PayPal webhook processing (keeps the users table in sync with PayPal) ---

  // Update a user's payment status by their PayPal subscription id.
  private async setUserStatusBySubscription(
    subscriptionId: string | null,
    fields: { payment_status?: string; is_active?: boolean },
  ): Promise<boolean> {
    if (!subscriptionId) return false;
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (fields.payment_status !== undefined) {
      sets.push(`payment_status = $${i++}`);
      vals.push(fields.payment_status);
    }
    if (fields.is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      vals.push(fields.is_active);
    }
    if (!sets.length) return false;
    sets.push(`updated_at = NOW()`);
    vals.push(subscriptionId);
    const res = await this.db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE paypal_subscription_id = $${i}`,
      vals,
    );
    return (res.rowCount || 0) > 0;
  }

  // The subscription id lives in resource.id for subscription events and in
  // resource.billing_agreement_id for the payment/refund/reversal events.
  private extractSubscriptionId(eventType: string, resource: any): string | null {
    if (!resource) return null;
    if (eventType.startsWith('BILLING.SUBSCRIPTION.')) return resource.id || null;
    return resource.billing_agreement_id || null;
  }

  // Idempotently process a verified PayPal webhook event and update the user's
  // subscription status. Duplicate deliveries are ignored via webhook_events.
  async processPayPalWebhook(body: any): Promise<{
    status: string;
    idempotent?: boolean;
    matched?: boolean;
    eventType?: string;
  }> {
    const eventId = body?.id;
    const eventType = body?.event_type;
    const resource = body?.resource;
    if (!eventId || !eventType) return { status: 'ignored' };

    await this.ensureWebhookTable();

    // Skip if we have already processed this event (idempotency).
    const existing = await this.db.query(
      `SELECT id FROM webhook_events WHERE provider = 'paypal' AND event_id = $1`,
      [eventId],
    );
    if (existing.rows.length > 0) {
      return { status: 'success', idempotent: true, eventType };
    }

    const subId = this.extractSubscriptionId(eventType, resource);
    let matched = false;
    let handled = false; // true when this event type should change a user's status

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'PAYMENT.SALE.COMPLETED':
      case 'PAYMENT.CAPTURE.COMPLETED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'active',
          is_active: true,
        });
        break;
      case 'BILLING.SUBSCRIPTION.UPDATED':
        if (resource?.status === 'ACTIVE') {
          handled = true;
          matched = await this.setUserStatusBySubscription(subId, {
            payment_status: 'active',
            is_active: true,
          });
        }
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      case 'PAYMENT.SALE.DENIED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'past_due',
        });
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'canceled',
          is_active: false,
        });
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'suspended',
          is_active: false,
        });
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        handled = true;
        matched = await this.setUserStatusBySubscription(subId, {
          payment_status: 'expired',
          is_active: false,
        });
        break;
      case 'PAYMENT.SALE.REFUNDED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        handled = true;
        matched = await this.setUserStatusBySubscription(
          await this.resolveRefundSubscriptionId(resource),
          { payment_status: 'refunded', is_active: false },
        );
        break;
      case 'PAYMENT.SALE.REVERSED':
      case 'PAYMENT.CAPTURE.REVERSED':
        handled = true;
        matched = await this.setUserStatusBySubscription(
          await this.resolveRefundSubscriptionId(resource),
          { payment_status: 'reversed', is_active: false },
        );
        break;
      default:
        // No status change for other event types.
        break;
    }

    // A status-changing event that matched no user is most likely arriving
    // before checkout finished linking the subscription. Do NOT record it; throw
    // so PayPal retries and it self-heals once the link exists.
    if (handled && !matched) {
      throw new Error(
        `PayPal ${eventType} for ${subId || 'unknown'} matched no user yet; will retry`,
      );
    }

    // Record only after successful processing so a mid-way failure can retry.
    await this.db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload)
       VALUES ('paypal', $1, $2, $3::jsonb)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(body)],
    );

    return { status: 'success', matched, eventType };
  }

  // Ensure the idempotency table exists (once per process). It is also created
  // by migration 004; this guards environments where migrations have not run.
  private async ensureWebhookTable(): Promise<void> {
    if (this.webhookTableReady) return;
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS webhook_events (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         provider VARCHAR(50) NOT NULL,
         event_id VARCHAR(255) NOT NULL,
         event_type VARCHAR(100),
         processed_at TIMESTAMP DEFAULT NOW(),
         subscription_id UUID,
         payload JSONB,
         created_at TIMESTAMP DEFAULT NOW(),
         UNIQUE(provider, event_id)
       )`,
    );
    this.webhookTableReady = true;
  }

  // Refund/reversal resources do not carry the subscription id. Resolve it from
  // billing_agreement_id if present, otherwise look up the referenced sale.
  private async resolveRefundSubscriptionId(
    resource: any,
  ): Promise<string | null> {
    if (!resource) return null;
    if (resource.billing_agreement_id) return resource.billing_agreement_id;
    if (resource.sale_id) {
      return this.paypalService.getSaleBillingAgreementId(resource.sale_id);
    }
    return null;
  }
}