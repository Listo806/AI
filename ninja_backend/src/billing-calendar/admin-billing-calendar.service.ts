import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaddleService } from '../payments/paddle.service';

type DayQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

@Injectable()
export class AdminBillingCalendarService {
  private readonly logger = new Logger(AdminBillingCalendarService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly paddle: PaddleService,
  ) {}

  private parseMonth(month?: string): { start: string; end: string } {
    const value = String(month || '').trim();
    if (value && !/^\d{4}-\d{2}$/.test(value)) {
      throw new BadRequestException('month must be YYYY-MM');
    }
    const base = value ? `${value}-01T00:00:00.000Z` : new Date().toISOString();
    const d = new Date(base);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid month');
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    return { start: start.toISOString(), end: end.toISOString() };
  }

  private assertDate(date: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const d = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
    return date;
  }

  private amountForPlan(plan: string | null | undefined): number {
    const p = String(plan || '').toLowerCase();
    if (['team', 'business'].includes(p)) return 347;
    if (['growth', 'scale'].includes(p)) return 497;
    if (p === 'solo') return 197;
    return 0;
  }

  private planLabel(plan: string | null | undefined): string {
    const p = String(plan || '').toLowerCase();
    if (['team', 'business'].includes(p)) return 'Business Plan';
    if (['growth', 'scale'].includes(p)) return 'Scale Plan';
    if (p === 'solo') return 'Solo Plan';
    return plan ? String(plan) : 'Subscription';
  }

  private planPriceLabel(plan: string | null | undefined, billingCycle?: string | null): string {
    const p = String(plan || '').toLowerCase();
    const annual = String(billingCycle || '').toLowerCase() === 'annual';
    if (annual) {
      if (['team', 'business'].includes(p)) return '$3,331.20 / year';
      if (['growth', 'scale'].includes(p)) return '$4,771.20 / year';
      if (p === 'solo') return '$1,891.20 / year';
    }
    const amount = this.amountForPlan(plan);
    return amount ? `$${amount} / month` : '—';
  }

  private async getLocalSubscription(subscriptionId: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT s.*,
              COALESCE(u.selected_plan, u.plan) AS user_plan,
              u.billing_cycle,
              u.id AS user_id,
              u.name AS user_name,
              u.email AS user_email
         FROM subscriptions s
         LEFT JOIN LATERAL (
           SELECT ux.*
             FROM users ux
            WHERE ux.paddle_subscription_id = s.paddle_subscription_id
               OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
            ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                     CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END,
                     ux.created_at ASC
            LIMIT 1
         ) u ON TRUE
        WHERE s.id::text = $1 OR s.paddle_subscription_id = $1
        ORDER BY s.created_at DESC
        LIMIT 1`,
      [subscriptionId],
    );
    if (!rows[0]) throw new NotFoundException('Subscription not found');
    if (!rows[0].paddle_subscription_id) {
      throw new BadRequestException('This subscription is not connected to Paddle');
    }
    return rows[0];
  }

  private async syncConfirmedPaddleSubscription(local: any, paddleSub: any): Promise<void> {
    const nextBilledAt =
      paddleSub?.nextBilledAt ?? paddleSub?.next_billed_at ?? paddleSub?.data?.nextBilledAt ?? paddleSub?.data?.next_billed_at ?? null;
    const status = paddleSub?.status ?? paddleSub?.data?.status ?? null;
    const customerId =
      paddleSub?.customerId ?? paddleSub?.customer_id ?? paddleSub?.data?.customerId ?? paddleSub?.data?.customer_id ?? null;

    await this.db.query(
      `UPDATE subscriptions
          SET current_period_end = COALESCE($1::timestamptz, current_period_end),
              status = COALESCE($2, status),
              paddle_customer_id = COALESCE($3, paddle_customer_id),
              updated_at = NOW()
        WHERE id = $4`,
      [nextBilledAt, status, customerId, local.id],
    );
  }

  async getOverview(month?: string) {
    const { start, end } = this.parseMonth(month);
    const [revenue, active, forecast, failed, churn, sync] = await Promise.all([
      this.db.query(
        `SELECT COALESCE(SUM(p.amount), 0)::float AS value
           FROM payments p
          WHERE p.status IN ('succeeded','paid','completed')
            AND p.payment_date >= $1::timestamptz
            AND p.payment_date < $2::timestamptz`,
        [start, end],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS value
           FROM subscriptions
          WHERE provider = 'paddle' AND status IN ('active','trialing')`,
      ),
      this.db.query(
        `SELECT COALESCE(SUM(CASE
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 347
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 497
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 197
                  ELSE 0 END),0)::float AS value
           FROM subscriptions s
           LEFT JOIN LATERAL (
             SELECT selected_plan, plan
               FROM users ux
              WHERE ux.paddle_subscription_id = s.paddle_subscription_id
                 OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
              ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                       CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END
              LIMIT 1
           ) u ON TRUE
          WHERE s.provider = 'paddle'
            AND s.status IN ('active','trialing')
            AND s.current_period_end >= NOW()
            AND s.current_period_end < NOW() + INTERVAL '30 days'`,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS value
           FROM payments
          WHERE status IN ('failed','declined','past_due')
            AND created_at >= $1::timestamptz
            AND created_at < $2::timestamptz`,
        [start, end],
      ),
      this.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'canceled' AND updated_at >= $1::timestamptz AND updated_at < $2::timestamptz)::int AS canceled,
           COUNT(*) FILTER (WHERE created_at < $2::timestamptz)::int AS base
         FROM subscriptions
         WHERE provider = 'paddle'`,
        [start, end],
      ),
      this.db.query(`SELECT MAX(updated_at) AS value FROM subscriptions WHERE provider = 'paddle'`),
    ]);

    const canceled = Number(churn.rows[0]?.canceled || 0);
    const base = Number(churn.rows[0]?.base || 0);
    return {
      monthlyRevenue: Number(revenue.rows[0]?.value || 0),
      activeSubscriptions: Number(active.rows[0]?.value || 0),
      mrrForecast: Number(forecast.rows[0]?.value || 0),
      failedPayments: Number(failed.rows[0]?.value || 0),
      churnRate: base > 0 ? (canceled / base) * 100 : 0,
      lastSyncAt: sync.rows[0]?.value || null,
      lastSyncLabel: sync.rows[0]?.value ? new Date(sync.rows[0].value).toLocaleString() : '—',
    };
  }

  async getMonth(month?: string) {
    const { start, end } = this.parseMonth(month);
    const { rows } = await this.db.query(
      `WITH events AS (
         SELECT s.current_period_end::date AS day,
                'scheduled'::text AS status,
                COUNT(*)::int AS count,
                COALESCE(SUM(CASE
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 347
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 497
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 197
                  ELSE 0 END),0)::float AS amount
           FROM subscriptions s
           LEFT JOIN LATERAL (
             SELECT selected_plan, plan
               FROM users ux
              WHERE ux.paddle_subscription_id = s.paddle_subscription_id
                 OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
              ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                       CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END
              LIMIT 1
           ) u ON TRUE
          WHERE s.provider = 'paddle'
            AND s.status IN ('active','trialing')
            AND s.current_period_end >= $1::timestamptz
            AND s.current_period_end < $2::timestamptz
          GROUP BY 1
         UNION ALL
         SELECT p.payment_date::date,
                CASE WHEN p.status IN ('succeeded','paid','completed') THEN 'paid' ELSE 'failed' END,
                COUNT(*)::int,
                COALESCE(SUM(p.amount),0)::float
           FROM payments p
          WHERE p.payment_date >= $1::timestamptz
            AND p.payment_date < $2::timestamptz
            AND p.status IN ('succeeded','paid','completed','failed','declined','past_due')
          GROUP BY 1,2
       )
       SELECT day::text AS date,
              COALESCE(SUM(count),0)::int AS "customerCount",
              COALESCE(SUM(amount),0)::float AS "expectedAmount",
              jsonb_object_agg(status, jsonb_build_object('count',count,'amount',amount)) AS statuses
         FROM events
        WHERE day IS NOT NULL
        GROUP BY day
        ORDER BY day`,
      [start, end],
    );
    return { days: rows };
  }

  async getDay(date: string, query: DayQuery = {}) {
    this.assertDate(date);
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 7)));
    const offset = (page - 1) * limit;
    const status = String(query.status || '').trim().toLowerCase();
    const search = String(query.search || '').trim();

    const baseSql = `
      WITH day_rows AS (
        SELECT s.id::text AS subscription_id,
               s.paddle_subscription_id,
               s.current_period_end,
               s.status AS subscription_status,
               u.id::text AS customer_id,
               COALESCE(NULLIF(u.name,''), u.email, 'Customer') AS customer_name,
               u.email,
               COALESCE(u.selected_plan,u.plan) AS plan,
               u.billing_cycle,
               CASE
                 WHEN s.status = 'past_due' THEN 'past_due'
                 WHEN EXISTS (
                   SELECT 1 FROM payments px
                    WHERE px.subscription_id = s.id
                      AND px.payment_date::date = $1::date
                      AND px.status IN ('failed','declined','past_due')
                 ) THEN 'failed'
                 WHEN EXISTS (
                   SELECT 1 FROM payments px
                    WHERE px.subscription_id = s.id
                      AND px.payment_date::date = $1::date
                      AND px.status IN ('succeeded','paid','completed')
                 ) THEN 'paid'
                 ELSE 'scheduled'
               END AS billing_status,
               COALESCE((
                 SELECT SUM(px.amount)::float FROM payments px
                  WHERE px.subscription_id = s.id
                    AND px.payment_date::date = $1::date
                    AND px.status IN ('succeeded','paid','completed','failed','declined','past_due')
               ),0)::float AS day_amount
          FROM subscriptions s
          LEFT JOIN LATERAL (
            SELECT ux.* FROM users ux
             WHERE ux.paddle_subscription_id = s.paddle_subscription_id
                OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
             ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                      CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END,
                      ux.created_at ASC
             LIMIT 1
          ) u ON TRUE
         WHERE s.provider = 'paddle'
           AND (
             s.current_period_end::date = $1::date
             OR EXISTS (SELECT 1 FROM payments pp WHERE pp.subscription_id = s.id AND pp.payment_date::date = $1::date)
             OR (s.status = 'past_due' AND s.current_period_end::date <= $1::date)
           )
      )`;

    const params: any[] = [date];
    const where: string[] = [];
    if (status) {
      params.push(status);
      where.push(`billing_status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(customer_name ILIKE $${params.length} OR email ILIKE $${params.length} OR customer_id ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await this.db.query(
      `${baseSql} SELECT COUNT(*)::int AS total FROM day_rows ${whereSql}`,
      params,
    );

    const summaryRes = await this.db.query(
      `${baseSql}
       SELECT billing_status AS status,
              COUNT(*)::int AS count,
              COALESCE(SUM(CASE WHEN day_amount > 0 THEN day_amount ELSE
                CASE
                  WHEN LOWER(COALESCE(plan,'')) IN ('business','team') THEN 347
                  WHEN LOWER(COALESCE(plan,'')) IN ('scale','growth') THEN 497
                  WHEN LOWER(COALESCE(plan,'')) = 'solo' THEN 197
                  ELSE 0 END END),0)::float AS amount
         FROM day_rows
        GROUP BY billing_status`,
      [date],
    );

    const listParams = [...params, limit, offset];
    const listRes = await this.db.query(
      `${baseSql}
       SELECT * FROM day_rows
       ${whereSql}
       ORDER BY current_period_end ASC NULLS LAST, customer_name ASC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    const summary: any = {
      scheduled: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      past_due: { count: 0, amount: 0 },
    };
    for (const row of summaryRes.rows) {
      if (summary[row.status]) summary[row.status] = { count: Number(row.count || 0), amount: Number(row.amount || 0) };
    }

    const customers = listRes.rows.map((r: any) => {
      const amount = this.amountForPlan(r.plan);
      const billingAt = r.current_period_end ? new Date(r.current_period_end) : null;
      return {
        subscriptionId: r.subscription_id,
        paddleSubscriptionId: r.paddle_subscription_id,
        customerId: r.customer_id,
        customerName: r.customer_name,
        initials: String(r.customer_name || '?').split(/\s+/).filter(Boolean).slice(0,2).map((x: string) => x[0]).join('').toUpperCase(),
        planName: this.planLabel(r.plan),
        planPriceLabel: this.planPriceLabel(r.plan, r.billing_cycle),
        billingTime: billingAt ? billingAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        status: r.billing_status,
        currency: 'USD',
        dueToday: Number(r.day_amount || amount || 0),
        dueTodayDifferent: Number(r.day_amount || 0) > 0 && amount > 0 && Math.abs(Number(r.day_amount) - amount) > 0.01,
        refundEligible: r.billing_status === 'paid',
        retryEligible: ['failed','past_due'].includes(r.billing_status),
      };
    });

    const total = Number(countRes.rows[0]?.total || 0);
    return { summary, customers, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getUpcoming(limit = 5) {
    const safeLimit = Math.min(31, Math.max(1, Number(limit || 5)));
    const { rows } = await this.db.query(
      `SELECT s.current_period_end::date::text AS date,
              COUNT(*)::int AS "customerCount",
              COALESCE(SUM(CASE
                WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 347
                WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 497
                WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 197
                ELSE 0 END),0)::float AS "expectedAmount"
         FROM subscriptions s
         LEFT JOIN LATERAL (
           SELECT selected_plan, plan FROM users ux
            WHERE ux.paddle_subscription_id = s.paddle_subscription_id
               OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
            ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                     CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END
            LIMIT 1
         ) u ON TRUE
        WHERE s.provider = 'paddle'
          AND s.status IN ('active','trialing')
          AND s.current_period_end >= NOW()
        GROUP BY 1
        ORDER BY 1
        LIMIT $1`,
      [safeLimit],
    );
    return rows.map((r: any) => ({
      ...r,
      label: new Date(`${r.date}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      currency: 'USD',
    }));
  }

  async getActivity(limit = 5) {
    const safeLimit = Math.min(50, Math.max(1, Number(limit || 5)));
    const { rows } = await this.db.query(
      `SELECT p.id::text AS id,
              p.status,
              p.amount::float AS amount,
              p.currency,
              COALESCE(p.payment_date,p.created_at) AS happened_at,
              COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name
         FROM payments p
         JOIN subscriptions s ON s.id = p.subscription_id
         LEFT JOIN LATERAL (
           SELECT ux.name, ux.email FROM users ux
            WHERE ux.paddle_subscription_id = s.paddle_subscription_id
               OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
            ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                     CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END
            LIMIT 1
         ) u ON TRUE
        ORDER BY COALESCE(p.payment_date,p.created_at) DESC
        LIMIT $1`,
      [safeLimit],
    );
    return rows.map((r: any) => {
      const ok = ['succeeded','paid','completed'].includes(String(r.status).toLowerCase());
      const when = new Date(r.happened_at);
      const diff = Math.max(0, Date.now() - when.getTime());
      const mins = Math.floor(diff / 60000);
      const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
      return {
        id: r.id,
        title: ok ? 'Payment received' : 'Payment needs attention',
        customerName: r.customer_name,
        timeAgo,
        amountLabel: `${ok ? '+' : ''}$${Number(r.amount || 0).toFixed(2)}`,
        status: r.status,
      };
    });
  }

  async getExceptions() {
    const { rows } = await this.db.query(
      `SELECT
         (SELECT COUNT(*) FROM payments WHERE status IN ('failed','declined') AND created_at >= NOW() - INTERVAL '30 days')::int AS failed_payments,
         (SELECT COUNT(*) FROM subscriptions WHERE provider='paddle' AND status='past_due')::int AS past_due,
         (SELECT COUNT(*) FROM subscriptions WHERE provider='paddle' AND status IN ('active','trialing') AND current_period_end IS NULL)::int AS needs_review,
         (SELECT COUNT(*) FROM payments WHERE status IN ('refund_pending','pending_refund'))::int AS refund_pending`,
    );
    const r = rows[0] || {};
    return {
      failedPayments: Number(r.failed_payments || 0),
      pastDue: Number(r.past_due || 0),
      // Historical reschedule events are not stored in the current schema; do not invent a number.
      rescheduled: 0,
      needsReview: Number(r.needs_review || 0),
      refundPending: Number(r.refund_pending || 0),
    };
  }

  private buildNextBilledAt(body: { date?: string; time?: string; nextBilledAt?: string }): string {
    if (body.nextBilledAt) {
      const d = new Date(body.nextBilledAt);
      if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid nextBilledAt');
      return d.toISOString();
    }
    if (!body.date) throw new BadRequestException('date is required');
    this.assertDate(body.date);
    const time = /^\d{2}:\d{2}$/.test(String(body.time || '')) ? body.time : '12:00';
    const d = new Date(`${body.date}T${time}:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid billing date/time');
    if (d.getTime() <= Date.now()) throw new BadRequestException('New billing date must be in the future');
    return d.toISOString();
  }

  async reschedule(subscriptionId: string, body: any) {
    const local = await this.getLocalSubscription(subscriptionId);
    const nextBilledAt = this.buildNextBilledAt(body || {});
    const updated = await this.paddle.changeNextBillingDate(
      local.paddle_subscription_id,
      nextBilledAt,
      body?.prorationBillingMode || 'prorated_next_billing_period',
    );
    // Paddle succeeded first. Only now mirror the confirmed result locally.
    await this.syncConfirmedPaddleSubscription(local, updated);
    return { success: true, subscriptionId: local.id, paddleSubscriptionId: local.paddle_subscription_id, nextBilledAt, subscription: updated };
  }

  async bulkReschedule(body: any) {
    const ids = [...new Set((body.subscriptionIds || []).map((x: any) => String(x)).filter(Boolean))];
    if (!ids.length) throw new BadRequestException('subscriptionIds is required');
    if (ids.length > 100) throw new BadRequestException('Maximum 100 subscriptions per bulk action');
    const results: any[] = [];
    for (const id of ids) {
      try {
        const result = await this.reschedule(id, body);
        results.push({ subscriptionId: id, success: true, nextBilledAt: result.nextBilledAt });
      } catch (error: any) {
        this.logger.warn(`Bulk reschedule failed for ${id}: ${error?.message}`);
        results.push({ subscriptionId: id, success: false, error: error?.message || 'Failed' });
      }
    }
    return {
      success: results.every((x) => x.success),
      succeeded: results.filter((x) => x.success).length,
      failed: results.filter((x) => !x.success).length,
      results,
    };
  }

  async pause(subscriptionId: string, body: { immediately?: boolean; resumeAt?: string }) {
    const local = await this.getLocalSubscription(subscriptionId);
    const updated = await this.paddle.pauseSubscription(
      local.paddle_subscription_id,
      !!body?.immediately,
      body?.resumeAt,
    );
    await this.syncConfirmedPaddleSubscription(local, updated);
    return { success: true, subscription: updated };
  }

  async cancel(subscriptionId: string, body: { immediately?: boolean }) {
    const local = await this.getLocalSubscription(subscriptionId);
    await this.paddle.cancelSubscription(local.paddle_subscription_id, !!body?.immediately);
    // Read back from Paddle after the mutation, then mirror only confirmed state.
    const updated = await this.paddle.getSubscription(local.paddle_subscription_id);
    await this.syncConfirmedPaddleSubscription(local, updated);
    return { success: true, subscription: updated };
  }

  async getReminderTarget(subscriptionId: string) {
    const local = await this.getLocalSubscription(subscriptionId);
    const subscription: any = await this.paddle.getSubscription(local.paddle_subscription_id);
    const url =
      subscription?.managementUrls?.updatePaymentMethod ??
      subscription?.management_urls?.update_payment_method ??
      subscription?.data?.managementUrls?.updatePaymentMethod ??
      subscription?.data?.management_urls?.update_payment_method ??
      null;
    return {
      success: true,
      customerId: local.user_id || null,
      customerName: local.user_name || local.user_email || null,
      email: local.user_email || null,
      updatePaymentMethodUrl: url,
      message: url
        ? 'Use this Paddle-authenticated URL in the existing mail/reminder workflow.'
        : 'Paddle did not return an update-payment-method URL for this subscription.',
    };
  }

  async retryPayment(subscriptionId: string) {
    const local = await this.getLocalSubscription(subscriptionId);
    const subscription: any = await this.paddle.getSubscription(local.paddle_subscription_id);
    const status = String(subscription?.status ?? subscription?.data?.status ?? '').toLowerCase();
    if (status !== 'past_due') {
      throw new BadRequestException('Retry Payment is only available for a past-due Paddle subscription');
    }
    // Paddle Billing controls automatic dunning/retries. The current integration has
    // no safe API operation that can arbitrarily force the same failed renewal again.
    // Return the secure payment-method URL instead of creating a duplicate transaction.
    const url =
      subscription?.managementUrls?.updatePaymentMethod ??
      subscription?.management_urls?.update_payment_method ??
      subscription?.data?.managementUrls?.updatePaymentMethod ??
      subscription?.data?.management_urls?.update_payment_method ??
      null;
    return {
      success: false,
      automaticRetryManagedByPaddle: true,
      updatePaymentMethodUrl: url,
      message: 'Paddle manages renewal retry/dunning. No duplicate transaction was created.',
    };
  }
}
