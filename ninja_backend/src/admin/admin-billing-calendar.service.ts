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

  private actionTableReady = false;

  /**
   * This is an audit/activity log only. It is NOT a second billing source of truth.
   * Paddle remains authoritative for subscription schedules and transaction status.
   */
  private async ensureActionTable(): Promise<void> {
    if (this.actionTableReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS billing_calendar_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action_type VARCHAR(40) NOT NULL,
        subscription_id UUID,
        paddle_subscription_id VARCHAR(255),
        customer_id UUID,
        transaction_id VARCHAR(255),
        from_billed_at TIMESTAMPTZ,
        to_billed_at TIMESTAMPTZ,
        status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_billing_calendar_actions_created ON billing_calendar_actions(created_at DESC)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_billing_calendar_actions_subscription ON billing_calendar_actions(subscription_id, created_at DESC)`);
    this.actionTableReady = true;
  }

  private async recordAction(opts: {
    actionType: string;
    local?: any;
    transactionId?: string | null;
    fromBilledAt?: string | Date | null;
    toBilledAt?: string | Date | null;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.ensureActionTable();
      await this.db.query(
        `INSERT INTO billing_calendar_actions
          (action_type, subscription_id, paddle_subscription_id, customer_id, transaction_id,
           from_billed_at, to_billed_at, status, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,NOW())`,
        [
          opts.actionType,
          opts.local?.id || null,
          opts.local?.paddle_subscription_id || null,
          opts.local?.user_id || null,
          opts.transactionId || null,
          opts.fromBilledAt || null,
          opts.toBilledAt || null,
          opts.status || 'confirmed',
          JSON.stringify(opts.metadata || {}),
        ],
      );
    } catch (error: any) {
      this.logger.warn(`Billing calendar audit log failed: ${error?.message}`);
    }
  }

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

  private amountForPlan(plan: string | null | undefined, billingCycle?: string | null): number {
    const p = String(plan || '').toLowerCase();
    const annual = String(billingCycle || '').toLowerCase() === 'annual';
    if (annual) {
      if (['team', 'business'].includes(p)) return 3331.2;
      if (['growth', 'scale'].includes(p)) return 4771.2;
      if (p === 'solo') return 1891.2;
    }
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
    const amount = this.amountForPlan(plan, billingCycle);
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
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 3331.20
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 4771.20
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 1891.20
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 347
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 497
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 197
                  ELSE 0 END),0)::float AS value
           FROM subscriptions s
           LEFT JOIN LATERAL (
             SELECT selected_plan, plan, billing_cycle
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
    await this.ensureActionTable();
    const { start, end } = this.parseMonth(month);
    const { rows } = await this.db.query(
      `WITH scheduled AS (
         SELECT s.current_period_end::date AS day,
                COUNT(*)::int AS customer_count,
                COALESCE(SUM(CASE
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 3331.20
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 4771.20
                  WHEN LOWER(COALESCE(u.billing_cycle,'')) = 'annual' AND LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 1891.20
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('business','team') THEN 347
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) IN ('scale','growth') THEN 497
                  WHEN LOWER(COALESCE(u.selected_plan,u.plan,'')) = 'solo' THEN 197
                  ELSE 0 END),0)::float AS expected_amount
           FROM subscriptions s
           LEFT JOIN LATERAL (
             SELECT selected_plan, plan, billing_cycle
               FROM users ux
              WHERE ux.paddle_subscription_id = s.paddle_subscription_id
                 OR (s.team_id IS NOT NULL AND ux.team_id = s.team_id)
              ORDER BY CASE WHEN ux.paddle_subscription_id = s.paddle_subscription_id THEN 0 ELSE 1 END,
                       CASE WHEN ux.role = 'owner' THEN 0 ELSE 1 END
              LIMIT 1
           ) u ON TRUE
          WHERE s.provider = 'paddle'
            AND s.status IN ('active','trialing','past_due')
            AND s.current_period_end >= $1::timestamptz
            AND s.current_period_end < $2::timestamptz
          GROUP BY 1
       ), payment_statuses AS (
         SELECT p.payment_date::date AS day,
                ARRAY_AGG(DISTINCT CASE
                  WHEN p.status IN ('succeeded','paid','completed') THEN 'paid'
                  WHEN p.status IN ('past_due') THEN 'past_due'
                  ELSE 'failed' END) AS statuses,
                COUNT(DISTINCT p.subscription_id)::int AS customer_count,
                COALESCE(SUM(p.amount),0)::float AS amount
           FROM payments p
          WHERE p.payment_date >= $1::timestamptz
            AND p.payment_date < $2::timestamptz
            AND p.status IN ('succeeded','paid','completed','failed','declined','past_due')
          GROUP BY 1
       ), rescheduled AS (
         SELECT to_billed_at::date AS day, TRUE AS present
           FROM billing_calendar_actions
          WHERE action_type = 'rescheduled'
            AND status = 'confirmed'
            AND to_billed_at >= $1::timestamptz
            AND to_billed_at < $2::timestamptz
          GROUP BY 1
       ), canceled AS (
         SELECT updated_at::date AS day, TRUE AS present
           FROM subscriptions
          WHERE provider='paddle' AND status='canceled'
            AND updated_at >= $1::timestamptz AND updated_at < $2::timestamptz
          GROUP BY 1
       ), all_days AS (
         SELECT day FROM scheduled UNION SELECT day FROM payment_statuses UNION SELECT day FROM rescheduled UNION SELECT day FROM canceled
       )
       SELECT d.day::text AS date,
              COALESCE(s.customer_count,p.customer_count,0)::int AS "customerCount",
              COALESCE(s.expected_amount,p.amount,0)::float AS "expectedAmount",
              ARRAY_REMOVE(ARRAY[
                CASE WHEN s.day IS NOT NULL THEN 'scheduled' END,
                CASE WHEN p.statuses @> ARRAY['paid']::text[] THEN 'paid' END,
                CASE WHEN p.statuses @> ARRAY['failed']::text[] THEN 'failed' END,
                CASE WHEN p.statuses @> ARRAY['past_due']::text[] THEN 'past_due' END,
                CASE WHEN r.present THEN 'rescheduled' END,
                CASE WHEN c.present THEN 'canceled' END
              ], NULL) AS statuses,
              'USD'::text AS currency
         FROM all_days d
         LEFT JOIN scheduled s ON s.day=d.day
         LEFT JOIN payment_statuses p ON p.day=d.day
         LEFT JOIN rescheduled r ON r.day=d.day
         LEFT JOIN canceled c ON c.day=d.day
        ORDER BY d.day`,
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
               dp.paddle_transaction_id,
               dp.payment_id,
               dp.payment_amount,
               dp.payment_currency,
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
          LEFT JOIN LATERAL (
            SELECT px.id::text AS payment_id, px.paddle_transaction_id,
                   px.amount::float AS payment_amount, px.currency AS payment_currency
              FROM payments px
             WHERE px.subscription_id = s.id
               AND px.payment_date::date = $1::date
             ORDER BY px.payment_date DESC NULLS LAST, px.created_at DESC
             LIMIT 1
          ) dp ON TRUE
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
                  WHEN LOWER(COALESCE(billing_cycle,''))='annual' AND LOWER(COALESCE(plan,'')) IN ('business','team') THEN 3331.20
                  WHEN LOWER(COALESCE(billing_cycle,''))='annual' AND LOWER(COALESCE(plan,'')) IN ('scale','growth') THEN 4771.20
                  WHEN LOWER(COALESCE(billing_cycle,''))='annual' AND LOWER(COALESCE(plan,''))='solo' THEN 1891.20
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
      const amount = this.amountForPlan(r.plan, r.billing_cycle);
      const billingAt = r.current_period_end ? new Date(r.current_period_end) : null;
      return {
        subscriptionId: r.subscription_id,
        paddleSubscriptionId: r.paddle_subscription_id,
        customerId: r.customer_id,
        customerName: r.customer_name,
        initials: String(r.customer_name || '?').split(/\s+/).filter(Boolean).slice(0,2).map((x: string) => x[0]).join('').toUpperCase(),
        planName: this.planLabel(r.plan),
        planPriceLabel: this.planPriceLabel(r.plan, r.billing_cycle),
        billingAt: billingAt ? billingAt.toISOString() : null,
        billingTime: billingAt ? billingAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        status: r.billing_status,
        paymentId: r.payment_id || null,
        paddleTransactionId: r.paddle_transaction_id || null,
        currency: r.payment_currency || 'USD',
        dueToday: Number(r.day_amount || amount || 0),
        dueTodayDifferent: Number(r.day_amount || 0) > 0 && amount > 0 && Math.abs(Number(r.day_amount) - amount) > 0.01,
        refundEligible: r.billing_status === 'paid' && !!r.paddle_transaction_id,
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
           SELECT selected_plan, plan, billing_cycle FROM users ux
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

  private timeAgo(value: any): string {
    const when = new Date(value);
    const diff = Math.max(0, Date.now() - when.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  }

  private webhookActivityMeta(row: any) {
    const eventType = String(row.event_type || '');
    const dataStatus = String(row.data_status || '').toLowerCase();
    const action = String(row.adjustment_action || '').toLowerCase();
    const adjustmentStatus = String(row.adjustment_status || '').toLowerCase();
    if (eventType === 'transaction.completed' || eventType === 'transaction.paid') {
      return { kind: row.data_subscription_id ? 'renewed' : 'payment_success', title: row.data_subscription_id ? 'Subscription renewed' : 'Payment successful' };
    }
    if (eventType === 'transaction.payment_failed' || eventType === 'transaction.past_due') {
      return { kind: 'payment_failed', title: 'Payment failed' };
    }
    if (eventType === 'subscription.past_due' || dataStatus === 'past_due') {
      return { kind: 'past_due', title: 'Subscription past due' };
    }
    if (eventType === 'subscription.canceled' || dataStatus === 'canceled') {
      return { kind: 'canceled', title: 'Subscription canceled' };
    }
    if (dataStatus === 'paused') return { kind: 'paused', title: 'Subscription paused' };
    if ((eventType === 'adjustment.created' || eventType === 'adjustment.updated') && action === 'refund') {
      return {
        kind: adjustmentStatus === 'pending_approval' ? 'refund_pending' : 'refund',
        title: adjustmentStatus === 'pending_approval' ? 'Refund pending' : 'Refund processed',
      };
    }
    if (eventType === 'subscription.updated' && row.next_billed_at) {
      return { kind: 'billing_date_updated', title: 'Billing date updated' };
    }
    return null;
  }

  async getActivity(limit = 5) {
    await this.ensureActionTable();
    const safeLimit = Math.min(100, Math.max(1, Number(limit || 5)));
    const [actionsRes, eventsRes] = await Promise.all([
      this.db.query(
        `SELECT a.id::text AS id, a.action_type, a.status, a.created_at AS happened_at,
                a.subscription_id::text AS subscription_id, a.paddle_subscription_id,
                a.customer_id::text AS customer_id, a.transaction_id,
                a.from_billed_at, a.to_billed_at, a.metadata,
                COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name
           FROM billing_calendar_actions a
           LEFT JOIN users u ON u.id=a.customer_id
          ORDER BY a.created_at DESC LIMIT $1`,
        [safeLimit * 2],
      ),
      this.db.query(
        `SELECT w.id::text AS id, w.event_type, COALESCE(w.processed_at,w.created_at) AS happened_at,
                w.payload#>>'{data,id}' AS data_id,
                w.payload#>>'{data,status}' AS data_status,
                w.payload#>>'{data,subscription_id}' AS data_subscription_id,
                w.payload#>>'{data,customer_id}' AS data_customer_id,
                w.payload#>>'{data,next_billed_at}' AS next_billed_at,
                w.payload#>>'{data,action}' AS adjustment_action,
                w.payload#>>'{data,transaction_id}' AS adjustment_transaction_id,
                w.payload#>>'{data,status}' AS adjustment_status,
                COALESCE(p.paddle_transaction_id,
                         CASE WHEN w.event_type LIKE 'transaction.%' THEN w.payload#>>'{data,id}' END,
                         w.payload#>>'{data,transaction_id}') AS transaction_id,
                p.amount::float AS amount, p.currency,
                COALESCE(s.id::text, ps.id::text) AS subscription_id,
                COALESCE(s.paddle_subscription_id, ps.paddle_subscription_id,
                         w.payload#>>'{data,subscription_id}',
                         CASE WHEN w.event_type LIKE 'subscription.%' THEN w.payload#>>'{data,id}' END) AS paddle_subscription_id,
                COALESCE(u.id::text, uc.id::text) AS customer_id,
                COALESCE(NULLIF(u.name,''),NULLIF(uc.name,''),u.email,uc.email,'Customer') AS customer_name
           FROM webhook_events w
           LEFT JOIN payments p ON p.paddle_transaction_id = CASE WHEN w.event_type LIKE 'transaction.%' THEN w.payload#>>'{data,id}' ELSE w.payload#>>'{data,transaction_id}' END
           LEFT JOIN subscriptions s ON s.id=p.subscription_id
           LEFT JOIN subscriptions ps ON ps.paddle_subscription_id = COALESCE(
                w.payload#>>'{data,subscription_id}',
                CASE WHEN w.event_type LIKE 'subscription.%' THEN w.payload#>>'{data,id}' END)
           LEFT JOIN LATERAL (
             SELECT ux.id,ux.name,ux.email FROM users ux
              WHERE (s.team_id IS NOT NULL AND ux.team_id=s.team_id)
                 OR ux.paddle_subscription_id=s.paddle_subscription_id
              ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1
           ) u ON TRUE
           LEFT JOIN LATERAL (
             SELECT ux.id,ux.name,ux.email FROM users ux
              WHERE ux.paddle_customer_id=w.payload#>>'{data,customer_id}'
                 OR ux.paddle_subscription_id=COALESCE(w.payload#>>'{data,subscription_id}',CASE WHEN w.event_type LIKE 'subscription.%' THEN w.payload#>>'{data,id}' END)
              ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1
           ) uc ON TRUE
          WHERE w.provider='paddle'
            AND w.event_type IN ('transaction.completed','transaction.paid','transaction.payment_failed','transaction.past_due',
                                 'subscription.updated','subscription.past_due','subscription.canceled',
                                 'adjustment.created','adjustment.updated')
          ORDER BY COALESCE(w.processed_at,w.created_at) DESC LIMIT $1`,
        [safeLimit * 4],
      ),
    ]);

    const actionMap: Record<string, { kind: string; title: string }> = {
      rescheduled: { kind: 'billing_date_updated', title: 'Billing date updated' },
      paused: { kind: 'paused', title: 'Subscription paused' },
      canceled: { kind: 'canceled', title: 'Subscription canceled' },
      reminder_sent: { kind: 'reminder', title: 'Billing reminder sent' },
      refund_requested: { kind: 'refund_pending', title: 'Refund requested' },
    };
    const actionRows = actionsRes.rows.map((r: any) => {
      const meta = actionMap[r.action_type] || { kind: r.action_type, title: r.action_type };
      return {
        id: `action:${r.id}`, source: 'cortexa', ...meta,
        customerId: r.customer_id || null, customerName: r.customer_name,
        subscriptionId: r.subscription_id || null, paddleSubscriptionId: r.paddle_subscription_id || null,
        transactionId: r.transaction_id || null, happenedAt: r.happened_at,
        timeAgo: this.timeAgo(r.happened_at), amountLabel: '',
        fromBilledAt: r.from_billed_at || null, toBilledAt: r.to_billed_at || null,
        metadata: r.metadata || {},
      };
    });
    const webhookRows = eventsRes.rows
      .map((r: any) => {
        const meta = this.webhookActivityMeta(r);
        if (!meta) return null;
        const amount = Number(r.amount || 0);
        return {
          id: `webhook:${r.id}`, source: 'paddle', ...meta,
          eventType: r.event_type, customerId: r.customer_id || null,
          customerName: r.customer_name, subscriptionId: r.subscription_id || null,
          paddleSubscriptionId: r.paddle_subscription_id || null,
          transactionId: r.transaction_id || null, happenedAt: r.happened_at,
          timeAgo: this.timeAgo(r.happened_at),
          amountLabel: amount ? `${meta.kind === 'payment_success' || meta.kind === 'renewed' ? '+' : ''}$${amount.toFixed(2)}` : '',
          currency: r.currency || 'USD', nextBilledAt: r.next_billed_at || null,
        };
      })
      .filter(Boolean);

    return [...actionRows, ...webhookRows]
      .sort((a: any, b: any) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
      .slice(0, safeLimit);
  }

  async getExceptions() {
    await this.ensureActionTable();
    const { rows } = await this.db.query(
      `SELECT
         (SELECT COUNT(DISTINCT subscription_id) FROM payments WHERE status IN ('failed','declined','past_due') AND created_at >= NOW()-INTERVAL '30 days')::int AS failed_payments,
         (SELECT COUNT(*) FROM subscriptions WHERE provider='paddle' AND status='past_due')::int AS past_due,
         (SELECT COUNT(*) FROM billing_calendar_actions WHERE action_type='rescheduled' AND status='confirmed' AND created_at >= NOW()-INTERVAL '30 days')::int AS rescheduled,
         (SELECT COUNT(*) FROM subscriptions WHERE provider='paddle' AND (paddle_subscription_id IS NULL OR current_period_end IS NULL OR status IS NULL))::int AS needs_review,
         (SELECT COUNT(*) FROM webhook_events WHERE provider='paddle' AND event_type IN ('adjustment.created','adjustment.updated')
             AND payload#>>'{data,action}'='refund' AND payload#>>'{data,status}'='pending_approval')::int AS refund_pending`,
    );
    const r = rows[0] || {};
    return {
      failedPayments: Number(r.failed_payments || 0),
      pastDue: Number(r.past_due || 0),
      rescheduled: Number(r.rescheduled || 0),
      needsReview: Number(r.needs_review || 0),
      refundPending: Number(r.refund_pending || 0),
    };
  }

  async getExceptionRecords(type = 'all', limit = 100) {
    await this.ensureActionTable();
    const safeLimit = Math.min(500, Math.max(1, Number(limit || 100)));
    const key = String(type || 'all').toLowerCase();
    const result: any[] = [];

    if (key === 'all' || key === 'failed_payments') {
      const { rows } = await this.db.query(
        `SELECT DISTINCT ON (p.subscription_id)
                'failed_payments'::text AS exception_type, p.id::text AS record_id,
                s.id::text AS subscription_id, s.paddle_subscription_id,
                u.id::text AS customer_id, COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name,
                p.paddle_transaction_id AS transaction_id, p.amount::float AS amount, p.currency,
                COALESCE(p.payment_date,p.created_at) AS occurred_at, p.status
           FROM payments p JOIN subscriptions s ON s.id=p.subscription_id
           LEFT JOIN LATERAL (SELECT ux.* FROM users ux WHERE ux.paddle_subscription_id=s.paddle_subscription_id OR ux.team_id=s.team_id ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1) u ON TRUE
          WHERE p.status IN ('failed','declined','past_due') AND p.created_at>=NOW()-INTERVAL '30 days'
          ORDER BY p.subscription_id, COALESCE(p.payment_date,p.created_at) DESC LIMIT $1`, [safeLimit]);
      result.push(...rows);
    }
    if (key === 'all' || key === 'past_due') {
      const { rows } = await this.db.query(
        `SELECT 'past_due'::text AS exception_type, s.id::text AS record_id, s.id::text AS subscription_id,
                s.paddle_subscription_id, u.id::text AS customer_id, COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name,
                NULL::text AS transaction_id, NULL::float AS amount, 'USD'::text AS currency,
                COALESCE(s.current_period_end,s.updated_at) AS occurred_at, s.status
           FROM subscriptions s
           LEFT JOIN LATERAL (SELECT ux.* FROM users ux WHERE ux.paddle_subscription_id=s.paddle_subscription_id OR ux.team_id=s.team_id ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1) u ON TRUE
          WHERE s.provider='paddle' AND s.status='past_due'
          ORDER BY COALESCE(s.current_period_end,s.updated_at) DESC LIMIT $1`, [safeLimit]);
      result.push(...rows);
    }
    if (key === 'all' || key === 'rescheduled') {
      const { rows } = await this.db.query(
        `SELECT 'rescheduled'::text AS exception_type, a.id::text AS record_id, a.subscription_id::text AS subscription_id,
                a.paddle_subscription_id, a.customer_id::text AS customer_id,
                COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name, a.transaction_id,
                NULL::float AS amount, 'USD'::text AS currency, a.created_at AS occurred_at, a.status,
                a.from_billed_at, a.to_billed_at
           FROM billing_calendar_actions a LEFT JOIN users u ON u.id=a.customer_id
          WHERE a.action_type='rescheduled' AND a.status='confirmed' AND a.created_at>=NOW()-INTERVAL '30 days'
          ORDER BY a.created_at DESC LIMIT $1`, [safeLimit]);
      result.push(...rows);
    }
    if (key === 'all' || key === 'needs_review') {
      const { rows } = await this.db.query(
        `SELECT 'needs_review'::text AS exception_type, s.id::text AS record_id, s.id::text AS subscription_id,
                s.paddle_subscription_id, u.id::text AS customer_id, COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name,
                NULL::text AS transaction_id, NULL::float AS amount, 'USD'::text AS currency,
                s.updated_at AS occurred_at, COALESCE(s.status,'unknown') AS status
           FROM subscriptions s
           LEFT JOIN LATERAL (SELECT ux.* FROM users ux WHERE ux.paddle_subscription_id=s.paddle_subscription_id OR ux.team_id=s.team_id ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1) u ON TRUE
          WHERE s.provider='paddle' AND (s.paddle_subscription_id IS NULL OR s.current_period_end IS NULL OR s.status IS NULL)
          ORDER BY s.updated_at DESC LIMIT $1`, [safeLimit]);
      result.push(...rows);
    }
    if (key === 'all' || key === 'refund_pending') {
      const { rows } = await this.db.query(
        `SELECT 'refund_pending'::text AS exception_type, w.id::text AS record_id,
                s.id::text AS subscription_id, s.paddle_subscription_id,
                u.id::text AS customer_id, COALESCE(NULLIF(u.name,''),u.email,'Customer') AS customer_name,
                w.payload#>>'{data,transaction_id}' AS transaction_id, NULL::float AS amount, 'USD'::text AS currency,
                COALESCE(w.processed_at,w.created_at) AS occurred_at, w.payload#>>'{data,status}' AS status
           FROM webhook_events w
           LEFT JOIN subscriptions s ON s.paddle_subscription_id=w.payload#>>'{data,subscription_id}'
           LEFT JOIN LATERAL (SELECT ux.* FROM users ux WHERE ux.paddle_subscription_id=s.paddle_subscription_id OR ux.team_id=s.team_id ORDER BY CASE WHEN ux.role='owner' THEN 0 ELSE 1 END LIMIT 1) u ON TRUE
          WHERE w.provider='paddle' AND w.event_type IN ('adjustment.created','adjustment.updated')
            AND w.payload#>>'{data,action}'='refund' AND w.payload#>>'{data,status}'='pending_approval'
          ORDER BY COALESCE(w.processed_at,w.created_at) DESC LIMIT $1`, [safeLimit]);
      result.push(...rows);
    }

    return {
      type: key,
      total: result.length,
      data: result
        .sort((a: any,b: any)=>new Date(b.occurred_at).getTime()-new Date(a.occurred_at).getTime())
        .slice(0,safeLimit)
        .map((r: any)=>({
          exceptionType:r.exception_type, recordId:r.record_id, subscriptionId:r.subscription_id,
          paddleSubscriptionId:r.paddle_subscription_id, customerId:r.customer_id, customerName:r.customer_name,
          transactionId:r.transaction_id, amount:r.amount==null?null:Number(r.amount), currency:r.currency||'USD',
          occurredAt:r.occurred_at, status:r.status, fromBilledAt:r.from_billed_at||null, toBilledAt:r.to_billed_at||null,
        })),
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
    const previousBilledAt = local.current_period_end || null;
    const nextBilledAt = this.buildNextBilledAt(body || {});
    const updated = await this.paddle.changeNextBillingDate(
      local.paddle_subscription_id,
      nextBilledAt,
      body?.prorationBillingMode || 'prorated_next_billing_period',
    );
    // Paddle succeeded first. Only now mirror the confirmed result locally.
    await this.syncConfirmedPaddleSubscription(local, updated);
    await this.recordAction({ actionType: 'rescheduled', local, fromBilledAt: previousBilledAt, toBilledAt: nextBilledAt, metadata: { prorationBillingMode: body?.prorationBillingMode || 'prorated_next_billing_period' } });
    return { success: true, subscriptionId: local.id, paddleSubscriptionId: local.paddle_subscription_id, previousBilledAt, nextBilledAt, subscription: updated };
  }

  async bulkReschedule(body: any) {
    const ids: string[] = Array.from(new Set<string>((body.subscriptionIds || []).map((x: any) => String(x)).filter((x: string) => Boolean(x))));
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
    await this.recordAction({ actionType: 'paused', local, metadata: { immediately: !!body?.immediately, resumeAt: body?.resumeAt || null } });
    return { success: true, subscription: updated };
  }

  async cancel(subscriptionId: string, body: { immediately?: boolean }) {
    const local = await this.getLocalSubscription(subscriptionId);
    await this.paddle.cancelSubscription(local.paddle_subscription_id, !!body?.immediately);
    // Read back from Paddle after the mutation, then mirror only confirmed state.
    const updated = await this.paddle.getSubscription(local.paddle_subscription_id);
    await this.syncConfirmedPaddleSubscription(local, updated);
    await this.recordAction({ actionType: 'canceled', local, metadata: { immediately: !!body?.immediately } });
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

  async getTransaction(transactionId: string) {
    if (!transactionId || !transactionId.startsWith('txn_')) {
      throw new BadRequestException('A valid Paddle transaction id is required');
    }
    return this.paddle.getTransaction(transactionId);
  }

  async refund(subscriptionId: string, body: { transactionId?: string; type?: 'full'|'partial'; reason?: string; itemId?: string; amount?: string }) {
    const local = await this.getLocalSubscription(subscriptionId);
    const transactionId = String(body?.transactionId || '').trim();
    if (!transactionId) throw new BadRequestException('transactionId is required');
    const type = body?.type === 'partial' ? 'partial' : 'full';
    if (type === 'partial' && (!body?.itemId || !body?.amount)) {
      throw new BadRequestException('itemId and amount are required for a partial refund');
    }
    const adjustment = await this.paddle.refundTransaction(transactionId, {
      type,
      reason: String(body?.reason || 'requested_by_admin').trim() || 'requested_by_admin',
      itemId: body?.itemId,
      amount: body?.amount,
    });
    const status = String(adjustment?.status ?? adjustment?.data?.status ?? 'pending_approval');
    await this.recordAction({ actionType: 'refund_requested', local, transactionId, status, metadata: { type, reason: body?.reason || 'requested_by_admin', adjustmentId: adjustment?.id ?? adjustment?.data?.id ?? null } });
    return { success: true, status, adjustment };
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
