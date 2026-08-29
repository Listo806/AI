import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import {
  getPlan,
  normalizePlanId,
  publicPlansConfig,
  resolveEffectivePlan,
} from '../plans/plan-config';

/**
 * Customer-facing E-Commerce Workspace data layer.
 *
 * IMPORTANT:
 * - Uses the SAME canonical account/billing tables as Admin Customers:
 *   users, teams, team_members, subscriptions, payments, customer_notes.
 * - Does NOT create/read/write ecommerce_* customer/subscription tables.
 * - ecommerce_workspace_id on users is only a scope/link column; it is not a
 *   second customer/subscription store.
 * - Every operation verifies the authenticated workspace before reading/writing.
 */
@Injectable()
export class EcommerceWorkspaceService {
  private readonly logger = new Logger(EcommerceWorkspaceService.name);
  private schemaReady = false;

  private readonly MEMBER_ROLES = ['admin', 'manager', 'agent', 'viewer'];

  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
  ) {}

  private async workspaceId(user: any): Promise<string> {
    if (!user?.id) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    const fromToken = user.teamId || user.team_id;
    if (fromToken) return String(fromToken);

    const { rows } = await this.db.query(
      `SELECT team_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id],
    );

    if (!rows[0]?.team_id) {
      throw new ForbiddenException('This account does not have an active workspace.');
    }

    return String(rows[0].team_id);
  }

  /**
   * Only adds the scope column/index to the canonical users table and makes sure
   * customer_notes exists. It NEVER creates ecommerce_* tables.
   */
  private async ready(): Promise<void> {
    if (this.schemaReady) return;

    try {
      await this.mailer.ensureSchema();

      await this.db.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS ecommerce_workspace_id UUID
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_users_ecommerce_workspace
        ON users(ecommerce_workspace_id, created_at DESC)
        WHERE deleted_at IS NULL
      `);

      await this.db.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS signup_country VARCHAR(2)
      `);

      await this.db.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS customer_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          author_id UUID,
          author_name TEXT,
          note TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_customer_notes_user
        ON customer_notes(user_id)
      `);

      this.schemaReady = true;
    } catch (err: any) {
      this.logger.error(`E-Commerce canonical schema setup failed: ${err?.message}`);
      throw err;
    }
  }

  private readonly cols = `
    id, email, name, phone, COALESCE(preferred_language, 'en') AS language,
    offer_used, checkout_status, payment_status, plan, selected_plan,
    billing_cycle, plan_status, paddle_customer_id, paddle_subscription_id,
    signup_source, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    gclid, landing_page, signup_country, trial_ends_at,
    created_at, registered_at, upgraded_at, last_seen_at,
    team_id, ecommerce_workspace_id, is_active, deleted_at,
    (SELECT COUNT(*)::int
       FROM team_members tm
      WHERE tm.team_id = users.team_id
        AND tm.status = 'active') AS seat_count,
    (SELECT COALESCE(SUM(p.amount), 0)::float
       FROM payments p
       JOIN subscriptions s ON s.id = p.subscription_id
      WHERE s.team_id = users.team_id
        AND p.status = 'succeeded') AS ltv,
    (SELECT s.current_period_end
       FROM subscriptions s
      WHERE s.team_id = users.team_id
      ORDER BY s.created_at DESC
      LIMIT 1) AS next_billing
  `;

  private readonly sourceExpr = `
    CASE
      WHEN COALESCE(gclid,'') <> '' THEN 'Google Ads'
      WHEN LOWER(COALESCE(utm_source,'')) LIKE '%google%' THEN 'Google Ads'
      WHEN LOWER(COALESCE(signup_source,'')) = 'exit_popup' THEN 'Exit Popup'
      WHEN LOWER(COALESCE(utm_medium,'')) LIKE '%referr%'
        OR LOWER(COALESCE(utm_source,'')) LIKE '%referr%' THEN 'Referral'
      WHEN COALESCE(signup_source,'') = '' AND COALESCE(utm_source,'') = ''
        THEN 'Direct / Organic'
      ELSE COALESCE(NULLIF(signup_source,''), 'Other')
    END
  `;

  private deriveStatus(row: any): string {
    if (row?.is_active === false) return 'canceled';

    const ps = String(row?.payment_status || '').toLowerCase();
    const cs = String(row?.checkout_status || '').toLowerCase();

    if (ps === 'failed') return 'failed';
    if (ps === 'past_due') return 'past_due';
    if (['canceled', 'cancelled', 'suspended', 'refunded', 'expired'].includes(ps)) {
      return 'canceled';
    }
    if (ps === 'trialing') return 'trialing';
    if (ps === 'active' || cs === 'paid') return 'active';
    if (ps === 'trial' || ps === 'pending') return 'registered';
    if (ps === 'free') return 'free';
    return 'registered';
  }

  private enrich(row: any) {
    if (!row) return row;

    const status = this.deriveStatus(row);
    const effective = resolveEffectivePlan(row);
    const cfg = getPlan(effective.planId);
    const cycle =
      row.billing_cycle === 'annual'
        ? 'annual'
        : row.billing_cycle === 'monthly'
          ? 'monthly'
          : null;

    if (!effective.isFree) {
      const recurringCents =
        cycle === 'annual'
          ? cfg.pricing.annualCents
          : cfg.pricing.monthlyCents;

      return {
        ...row,
        status,
        plan_id: effective.planId,
        selected_plan: effective.planId,
        plan_label: cfg.label,
        billing: cycle || 'monthly',
        intro_amount: cfg.pricing.introCents / 100,
        recurring_amount: recurringCents / 100,
        seats_limit: cfg.seats,
        country: row.signup_country || null,
        source_label: row.source_label || 'Direct / Organic',
        next_billing: row.next_billing || null,
        ltv: Number(row.ltv || 0),
        seat_count: Number(row.seat_count || 0),
      };
    }

    const pickedPaid =
      !!row.selected_plan && normalizePlanId(row.selected_plan) !== 'free';
    const choseFree =
      String(row.payment_status || '').toLowerCase() === 'free' ||
      (!!row.selected_plan && normalizePlanId(row.selected_plan) === 'free');

    return {
      ...row,
      status,
      plan_id: pickedPaid ? 'registered' : choseFree ? 'free' : 'unselected',
      selected_plan: pickedPaid ? 'registered' : choseFree ? 'free' : 'unselected',
      plan_label: pickedPaid ? 'Registered' : choseFree ? 'Free' : 'Not selected',
      billing: 'free',
      intro_amount: 0,
      recurring_amount: 0,
      seats_limit: 1,
      country: row.signup_country || null,
      source_label: row.source_label || 'Direct / Organic',
      next_billing: row.next_billing || null,
      ltv: Number(row.ltv || 0),
      seat_count: Number(row.seat_count || 0),
    };
  }

  private tabClause(tab?: string): string | null {
    switch (String(tab || 'all').toLowerCase()) {
      case 'registered':
        return `(COALESCE(payment_status,'') IN ('', 'registered', 'trial', 'pending') AND COALESCE(checkout_status,'') <> 'paid')`;
      case 'free':
        return `payment_status = 'free'`;
      case 'trialing':
        return `payment_status = 'trialing'`;
      case 'active':
        return `(payment_status = 'active' OR (checkout_status = 'paid' AND LOWER(COALESCE(payment_status,'')) NOT IN ('canceled','cancelled','suspended','past_due','refunded','expired','failed')))`;
      case 'past_due':
        return `payment_status = 'past_due'`;
      case 'canceled':
        return `(is_active = false OR payment_status IN ('canceled','cancelled','suspended','refunded','expired'))`;
      default:
        return null;
    }
  }

  private buildWhere(workspaceId: string, opts: any = {}) {
    const clauses: string[] = [
      `role = 'owner'`,
      `deleted_at IS NULL`,
      `ecommerce_workspace_id = $1`,
    ];
    const params: any[] = [workspaceId];

    const push = (sql: string, value: any) => {
      params.push(value);
      clauses.push(sql.replace(/\?/g, `$${params.length}`));
    };

    const tab = this.tabClause(opts.tab);
    if (tab) clauses.push(tab);

    if (opts.q && String(opts.q).trim()) {
      params.push(`%${String(opts.q).trim()}%`);
      const p = `$${params.length}`;
      clauses.push(`(email ILIKE ${p} OR name ILIKE ${p} OR phone ILIKE ${p})`);
    }

    if (opts.plan && opts.plan !== 'all') {
      const key = normalizePlanId(opts.plan);
      if (String(opts.plan).toLowerCase() === 'registered') {
        clauses.push(`COALESCE(payment_status,'') IN ('', 'registered', 'trial', 'pending')`);
      } else if (key === 'business') {
        clauses.push(`LOWER(COALESCE(selected_plan, plan, '')) IN ('business','team')`);
      } else if (key === 'scale') {
        clauses.push(`LOWER(COALESCE(selected_plan, plan, '')) IN ('scale','growth')`);
      } else if (key === 'solo') {
        clauses.push(`LOWER(COALESCE(selected_plan, plan, '')) IN ('solo','pro')`);
      } else if (key === 'free') {
        clauses.push(`(LOWER(COALESCE(selected_plan, plan, '')) = 'free' OR payment_status = 'free')`);
      }
    }

    if (opts.billing && opts.billing !== 'all') {
      push(`LOWER(COALESCE(billing_cycle,'')) = LOWER(?)`, opts.billing);
    }
    if (opts.paymentStatus && opts.paymentStatus !== 'all') {
      const ps = String(opts.paymentStatus).toLowerCase();
      if (ps === 'trial') {
        clauses.push(`payment_status = 'trialing'`);
      } else {
        push(`LOWER(COALESCE(payment_status,'')) = LOWER(?)`, ps);
      }
    }
    if (opts.source && opts.source !== 'all') {
      push(`${this.sourceExpr} = ?`, opts.source);
    }
    if (opts.language && opts.language !== 'all') {
      push(`LOWER(COALESCE(preferred_language,'en')) = LOWER(?)`, opts.language);
    }
    if (opts.country && opts.country !== 'all') {
      push(`UPPER(COALESCE(signup_country,'')) = UPPER(?)`, opts.country);
    }
    if (opts.from) push(`created_at >= ?::date`, opts.from);
    if (opts.to) push(`created_at < (?::date + INTERVAL '1 day')`, opts.to);

    if (opts.usersRole && opts.usersRole !== 'all') {
      const r = String(opts.usersRole).toLowerCase();
      if (r === 'owner') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role = 'owner')`);
      } else if (r === 'admin') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role = 'admin' AND tm.status = 'active')`);
      } else if (r === 'agent') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role IN ('agent','user','viewer','manager') AND tm.status = 'active')`);
      }
    }

    return { where: clauses.join(' AND '), params };
  }

  private async customerRow(workspaceId: string, id: string) {
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, ${this.sourceExpr} AS source_label
         FROM users
        WHERE id = $1
          AND ecommerce_workspace_id = $2
          AND role = 'owner'
          AND deleted_at IS NULL
        LIMIT 1`,
      [id, workspaceId],
    );

    if (!rows[0]) {
      throw new NotFoundException('E-Commerce customer not found in this workspace.');
    }

    return rows[0];
  }

  async list(user: any, query: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const limit = Math.max(1, Math.min(1000, Number(query?.limit) || 10));
    const offset = Math.max(0, Number(query?.offset) || 0);
    const { where, params } = this.buildWhere(workspaceId, query);

    const listParams = [...params, limit, offset];
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, ${this.sourceExpr} AS source_label
         FROM users
        WHERE ${where}
        ORDER BY registered_at DESC NULLS LAST, created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );

    const { rows: countRows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${where}`,
      params,
    );

    return {
      data: rows.map((r) => this.enrich(r)),
      total: Number(countRows[0]?.n || 0),
      limit,
      offset,
    };
  }

  async summary(user: any, query: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const { where, params } = this.buildWhere(workspaceId, { ...query, tab: 'all' });

    const { rows } = await this.db.query(
      `SELECT ${this.cols}, ${this.sourceExpr} AS source_label
         FROM users WHERE ${where}`,
      params,
    );

    const data = rows.map((r) => this.enrich(r));
    const total = data.length;
    const weekAgo = Date.now() - 7 * 86400000;
    const activeCustomers = data.filter((r) => r.status === 'active').length;
    const freeAccounts = data.filter((r) => r.status === 'free').length;

    const mrr = data
      .filter((r) => r.status === 'active')
      .reduce((sum, r) => {
        const amount = Number(r.recurring_amount || 0);
        return sum + (r.billing === 'annual' ? amount / 12 : amount);
      }, 0);

    const group = (fn: (r: any) => string) => {
      const map = new Map<string, number>();
      data.forEach((r) => {
        const key = fn(r) || 'Unknown';
        map.set(key, (map.get(key) || 0) + 1);
      });
      return [...map.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    const planRows = ['free', 'registered', 'solo', 'business', 'scale'].map((id) => {
      const count =
        id === 'registered'
          ? data.filter((r) => r.status === 'registered').length
          : data.filter((r) => r.plan_id === id).length;
      const label =
        id === 'registered'
          ? 'Registered - No Plan'
          : id === 'free'
            ? 'Free ($0)'
            : id === 'solo'
              ? 'Solo ($197)'
              : id === 'business'
                ? 'Business ($347)'
                : 'Scale ($497)';
      return { id, key: label, count };
    });


    // Analytics row requested by the E-commerce Subscriptions Admin.
    // These are calculated from the SAME filtered customer population as every
    // other summary metric; no demo/static numbers are returned.
    const paidPlanSelected = (r: any) => {
      const selected = String(r?.selected_plan || r?.plan || '').trim().toLowerCase();
      return ['solo', 'pro', 'business', 'team', 'scale', 'growth'].includes(selected);
    };

    const customerStatusRows = [
      {
        id: 'free',
        key: 'Free',
        count: data.filter((r) =>
          String(r?.payment_status || '').toLowerCase() === 'free' ||
          String(r?.status || '').toLowerCase() === 'free',
        ).length,
      },
      {
        id: 'checkout_pending',
        key: 'Checkout Pending',
        count: data.filter((r) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          const paid = ps === 'active' || cs === 'paid';
          return paidPlanSelected(r) && !paid;
        }).length,
      },
      {
        id: 'registered',
        key: 'Registered / No Plan',
        count: data.filter((r) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          const isFree = ps === 'free' || String(r?.status || '').toLowerCase() === 'free';
          const paid = ps === 'active' || cs === 'paid';
          return !isFree && !paidPlanSelected(r) && !paid;
        }).length,
      },
      {
        id: 'paid',
        key: 'Paid',
        count: data.filter((r) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          return ps === 'active' || cs === 'paid';
        }).length,
      },
    ];

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTs = startOfToday.getTime();
    const sevenDaysAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;
    const seenAt = (r: any) => {
      const ts = r?.last_seen_at ? new Date(r.last_seen_at).getTime() : NaN;
      return Number.isFinite(ts) ? ts : null;
    };

    const customerActivityRows = [
      {
        id: 'today',
        key: 'Active Today',
        count: data.filter((r) => {
          const ts = seenAt(r);
          return ts != null && ts >= todayTs;
        }).length,
      },
      {
        id: 'last_7_days',
        key: 'Active Last 7 Days',
        count: data.filter((r) => {
          const ts = seenAt(r);
          return ts != null && ts >= sevenDaysAgo && ts < todayTs;
        }).length,
      },
      {
        id: 'inactive_7_30',
        key: 'Inactive 7–30 Days',
        count: data.filter((r) => {
          const ts = seenAt(r);
          return ts != null && ts >= thirtyDaysAgo && ts < sevenDaysAgo;
        }).length,
      },
      {
        id: 'inactive_30_plus',
        key: 'Inactive 30+ Days',
        count: data.filter((r) => {
          const ts = seenAt(r);
          return ts == null || ts < thirtyDaysAgo;
        }).length,
      },
    ];

    // Workspace Opportunity is based on verified workspace entitlement records.
    // Active entitlements are paid Workspaces. Transient past_due/suspended rows
    // are shown as Trial/Pending. Customers with a team but no paid entitlement
    // are "Has Workspace"; customers without a team are "No Workspace".
    const entitlementByTeam = new Map<string, Set<string>>();
    try {
      const teamIds = [...new Set(
        data.map((r) => String(r?.team_id || '')).filter(Boolean),
      )];
      if (teamIds.length) {
        const entitlementRes = await this.db.query(
          `SELECT team_id::text AS team_id, status
             FROM workspace_entitlements
            WHERE team_id = ANY($1::uuid[])
              AND status IN ('active','past_due','suspended')`,
          [teamIds],
        );
        entitlementRes.rows.forEach((row: any) => {
          const id = String(row.team_id || '');
          if (!entitlementByTeam.has(id)) entitlementByTeam.set(id, new Set());
          entitlementByTeam.get(id)!.add(String(row.status || '').toLowerCase());
        });
      }
    } catch (error: any) {
      // Environments that have not applied the workspace-entitlements migration
      // still get a valid summary; teams simply remain in the non-paid buckets.
      this.logger.warn(`Workspace opportunity summary unavailable: ${error?.message || error}`);
    }

    const workspaceBucket = (r: any) => {
      const teamId = String(r?.team_id || '');
      if (!teamId) return 'none';
      const statuses = entitlementByTeam.get(teamId);
      if (statuses?.has('active')) return 'paid_workspace';
      if (statuses?.has('past_due') || statuses?.has('suspended')) return 'trial_pending';
      return 'has_workspace';
    };

    const workspaceOpportunityRows = [
      { id: 'none', key: 'No Workspace', count: data.filter((r) => workspaceBucket(r) === 'none').length },
      { id: 'has_workspace', key: 'Has Workspace', count: data.filter((r) => workspaceBucket(r) === 'has_workspace').length },
      { id: 'trial_pending', key: 'Workspace Trial / Pending', count: data.filter((r) => workspaceBucket(r) === 'trial_pending').length },
      { id: 'paid_workspace', key: 'Paid Workspace', count: data.filter((r) => workspaceBucket(r) === 'paid_workspace').length },
    ];

    return {
      kpis: {
        totalRegistered: total,
        newThisWeek: data.filter((r) =>
          new Date(r.registered_at || r.created_at).getTime() >= weekAgo,
        ).length,
        activeCustomers,
        activePctOfTotal: total ? Math.round((activeCustomers / total) * 1000) / 10 : 0,
        mrr,
        arr: mrr * 12,
        conversionRate: total ? Math.round((activeCustomers / total) * 1000) / 10 : 0,
        freeAccounts,
        freePctOfTotal: total ? Math.round((freeAccounts / total) * 1000) / 10 : 0,
      },
      tabs: {
        all: total,
        registered: data.filter((r) => r.status === 'registered').length,
        free: freeAccounts,
        trialing: data.filter((r) => r.status === 'trialing').length,
        active: activeCustomers,
        past_due: data.filter((r) => r.status === 'past_due').length,
        canceled: data.filter((r) => r.status === 'canceled').length,
      },
      breakdowns: {
        source: group((r) => r.source_label),
        plan: planRows,
        language: group((r) => r.language || 'en'),
        country: group((r) => r.country || 'Unknown'),
        customerStatus: customerStatusRows,
        customerActivity: customerActivityRows,
        workspaceOpportunity: workspaceOpportunityRows,
      },
    };
  }

  private async subscription(row: any) {
    const effective = resolveEffectivePlan(row);
    const cfg = getPlan(effective.planId);
    const cycle = row.billing_cycle === 'annual' ? 'annual' : 'monthly';
    let nextBillingDate = row.next_billing || null;
    let startDate = row.registered_at || row.created_at;

    if (row.team_id) {
      const { rows } = await this.db.query(
        `SELECT current_period_start, current_period_end
           FROM subscriptions
          WHERE team_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [row.team_id],
      );
      startDate = rows[0]?.current_period_start || startDate;
      nextBillingDate = rows[0]?.current_period_end || nextBillingDate;
    }

    return {
      plan: cfg.label,
      planId: effective.planId,
      recurringAmount: cfg.isFree
        ? 0
        : (cycle === 'annual' ? cfg.pricing.annualCents : cfg.pricing.monthlyCents) / 100,
      introAmount: cfg.pricing.introCents / 100,
      billingCycle: cfg.isFree ? null : cycle,
      seatsLimit: cfg.seats,
      isFree: cfg.isFree,
      startDate,
      nextBillingDate,
      paddleCustomerId: row.paddle_customer_id || null,
      paddleSubscriptionId: row.paddle_subscription_id || null,
    };
  }

  private async payments(teamId?: string | null) {
    if (!teamId) return [];
    const { rows } = await this.db.query(
      `SELECT p.id, p.amount::float AS amount, p.currency, p.status,
              COALESCE(p.paddle_transaction_id, p.stripe_payment_intent_id) AS transaction_id,
              p.payment_date, p.created_at
         FROM payments p
         JOIN subscriptions s ON s.id = p.subscription_id
        WHERE s.team_id = $1
        ORDER BY p.payment_date DESC NULLS LAST, p.created_at DESC
        LIMIT 100`,
      [teamId],
    );
    return rows;
  }

  private async activity(id: string, row: any) {
    const events: Array<{ type: string; title: string; details?: string; created_at: any }> = [];
    const push = (type: string, title: string, at: any, details?: string) => {
      if (at) events.push({ type, title, details, created_at: at });
    };

    push('account_created', 'Account created', row.registered_at || row.created_at);
    push('plan_changed', 'Plan changed / upgraded', row.upgraded_at);

    try {
      const { rows: emails } = await this.db.query(
        `SELECT template, subject, status, sent_at, created_at
           FROM email_log
          WHERE user_id = $1
          ORDER BY COALESCE(sent_at, created_at) DESC
          LIMIT 30`,
        [id],
      );
      emails.forEach((e) =>
        push(
          'email',
          e.template === 'admin_custom' ? 'Email sent' : `Email: ${e.template}`,
          e.sent_at || e.created_at,
          e.subject || e.status || undefined,
        ),
      );
    } catch {
      // email_log is optional
    }

    const pays = await this.payments(row.team_id);
    pays.forEach((p) =>
      push(
        'payment',
        `Payment ${p.status}`,
        p.payment_date || p.created_at,
        `$${p.amount} ${p.currency || 'USD'}`,
      ),
    );

    return events.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  async detail(user: any, id: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const row = await this.customerRow(workspaceId, id);
    const customer = this.enrich(row);

    const [subscription, payments, notes, activity] = await Promise.all([
      this.subscription(row),
      this.payments(row.team_id),
      this.listNotes(user, id),
      this.activity(id, row),
    ]);

    return {
      customer,
      subscription,
      payments,
      notes,
      activity,
      usage: {
        limits: { aiConversationsPerMonth: null, integrations: null },
        usage: { aiConversationsThisMonth: 0, integrationsConnected: 0 },
      },
    };
  }

  private async createCanonicalAccount(
    workspaceId: string,
    email: string,
    opts: {
      name?: string | null;
      phone?: string | null;
      planId?: string | null;
      language?: string | null;
      source?: string | null;
      country?: string | null;
      billingCycle?: string | null;
    },
  ): Promise<{ id: string; teamId: string }> {
    const planId = opts.planId ? normalizePlanId(opts.planId) : null;
    const isFree = planId === 'free';
    const knownPaid = !!planId && !isFree;
    const selectedPlan = planId
      ? isFree
        ? 'free'
        : planId === 'business'
          ? 'team'
          : planId === 'scale'
            ? 'growth'
            : 'solo'
      : null;

    const paymentStatus = isFree ? 'free' : 'registered';
    const checkoutStatus = isFree ? 'free' : 'registered';
    const billingCycle = knownPaid
      ? opts.billingCycle === 'annual'
        ? 'annual'
        : 'monthly'
      : null;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const teamName = opts.name
        ? `${String(opts.name).split(' ')[0]}'s Team`
        : 'New Team';
      const { rows: teams } = await client.query(
        `INSERT INTO teams (name, created_at, updated_at)
         VALUES ($1, NOW(), NOW())
         RETURNING id`,
        [teamName],
      );
      const teamId = teams[0].id;
      const password = await bcrypt.hash(randomUUID(), 10);

      const { rows: users } = await client.query(
        `INSERT INTO users
          (email, password, name, phone, role, plan, selected_plan, is_active,
           payment_status, billing_cycle, checkout_status, team_id,
           preferred_language, signup_source, signup_country, offer_used,
           ecommerce_workspace_id, registered_at, created_at, updated_at)
         VALUES
          ($1,$2,$3,$4,'owner','TRIAL',$5,true,$6,$7,$8,$9,$10,$11,$12,
           'standard',$13,NOW(),NOW(),NOW())
         RETURNING id`,
        [
          email,
          password,
          opts.name || null,
          opts.phone || null,
          selectedPlan,
          paymentStatus,
          billingCycle,
          checkoutStatus,
          teamId,
          opts.language || 'en',
          opts.source || 'ecommerce_workspace',
          opts.country || null,
          workspaceId,
        ],
      );

      const userId = users[0].id;
      await client.query(
        `UPDATE teams SET owner_id = $1, updated_at = NOW() WHERE id = $2`,
        [userId, teamId],
      );
      await client.query(
        `INSERT INTO team_members
          (team_id, user_id, role, status, joined_at, created_at, updated_at)
         VALUES ($1,$2,'owner','active',NOW(),NOW(),NOW())
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teamId, userId],
      );

      await client.query('COMMIT');
      return { id: userId, teamId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async createCustomer(user: any, dto: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const email = String(dto?.email || '').trim().toLowerCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required.');
    }

    const { rows: existing } = await this.db.query(
      `SELECT id, ecommerce_workspace_id
         FROM users
        WHERE LOWER(email) = LOWER($1)
          AND deleted_at IS NULL
        LIMIT 1`,
      [email],
    );

    if (existing[0]) {
      if (String(existing[0].ecommerce_workspace_id || '') !== workspaceId) {
        throw new BadRequestException(
          'An account with this email already exists outside this E-Commerce workspace.',
        );
      }
      return this.updateCustomer(user, existing[0].id, dto);
    }

    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : 'en';

    const { id } = await this.createCanonicalAccount(workspaceId, email, {
      name: dto?.name ? String(dto.name).slice(0, 200) : null,
      phone: dto?.phone ? String(dto.phone).slice(0, 40) : null,
      planId: dto?.plan || null,
      language,
      source: dto?.source ? String(dto.source).slice(0, 64) : 'ecommerce_workspace',
      country: dto?.country ? String(dto.country).slice(0, 2).toUpperCase() : null,
      billingCycle: dto?.billingCycle || null,
    });

    const row = await this.customerRow(workspaceId, id);
    return { success: true, customer: this.enrich(row) };
  }

  async updateCustomer(user: any, id: string, dto: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : null;

    await this.db.query(
      `UPDATE users
          SET name = COALESCE(NULLIF($2,''), name),
              phone = COALESCE(NULLIF($3,''), phone),
              preferred_language = COALESCE($4, preferred_language),
              updated_at = NOW()
        WHERE id = $1 AND ecommerce_workspace_id = $5 AND deleted_at IS NULL`,
      [
        id,
        dto?.name != null ? String(dto.name).slice(0, 200) : null,
        dto?.phone != null ? String(dto.phone).slice(0, 40) : null,
        language,
        workspaceId,
      ],
    );

    const row = await this.customerRow(workspaceId, id);
    return { success: true, customer: this.enrich(row) };
  }

  async changePlan(user: any, id: string, dto: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const planId = normalizePlanId(dto?.plan);
    const isFree = planId === 'free';
    const cycle = ['monthly', 'annual'].includes(String(dto?.billingCycle))
      ? String(dto.billingCycle)
      : isFree
        ? null
        : 'monthly';

    if (isFree) {
      await this.db.query(
        `UPDATE users
            SET selected_plan = 'free', billing_cycle = NULL,
                payment_status = 'free', checkout_status = 'free',
                plan_status = 'active', upgraded_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND ecommerce_workspace_id = $2`,
        [id, workspaceId],
      );
    } else {
      const legacyKey =
        planId === 'business' ? 'team' : planId === 'scale' ? 'growth' : 'solo';
      await this.db.query(
        `UPDATE users
            SET selected_plan = $3,
                billing_cycle = $4,
                plan_status = 'active',
                upgraded_at = NOW(),
                updated_at = NOW()
          WHERE id = $1 AND ecommerce_workspace_id = $2`,
        [id, workspaceId, legacyKey, cycle],
      );
    }

    const row = await this.customerRow(workspaceId, id);
    return { success: true, customer: this.enrich(row) };
  }

  async deactivate(user: any, id: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const { rowCount } = await this.db.query(
      `UPDATE users
          SET is_active = false,
              token_version = COALESCE(token_version, 0) + 1,
              updated_at = NOW()
        WHERE id = $1 AND ecommerce_workspace_id = $2 AND deleted_at IS NULL`,
      [id, workspaceId],
    );

    return { deactivated: (rowCount ?? 0) > 0 };
  }

  async remove(user: any, id: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const { rowCount } = await this.db.query(
      `UPDATE users
          SET deleted_at = NOW(),
              is_active = false,
              token_version = COALESCE(token_version, 0) + 1,
              updated_at = NOW()
        WHERE id = $1 AND ecommerce_workspace_id = $2 AND deleted_at IS NULL`,
      [id, workspaceId],
    );

    return { deleted: (rowCount ?? 0) > 0 };
  }

  async listNotes(user: any, id: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const { rows } = await this.db.query(
      `SELECT id, author_id, author_name, note, created_at
         FROM customer_notes
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [id],
    );
    return rows;
  }

  async addNote(user: any, id: string, note: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const text = String(note || '').trim();
    if (!text) throw new BadRequestException('Note text is required.');

    const { rows } = await this.db.query(
      `INSERT INTO customer_notes (user_id, author_id, author_name, note)
       VALUES ($1,$2,$3,$4)
       RETURNING id, author_id, author_name, note, created_at`,
      [id, user?.id || null, user?.name || user?.email || null, text],
    );
    return rows[0];
  }

  async deleteNote(user: any, id: string, noteId: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    await this.customerRow(workspaceId, id);

    const { rowCount } = await this.db.query(
      `DELETE FROM customer_notes WHERE id = $1 AND user_id = $2`,
      [noteId, id],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  async sendCustomerEmail(user: any, id: string, subject: string, message: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const customer = await this.customerRow(workspaceId, id);

    const subj = String(subject || '').trim();
    const msg = String(message || '').trim();
    if (!subj || !msg) {
      throw new BadRequestException('Subject and message are required.');
    }

    const escaped = msg
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br>');

    const res = await this.mailer.sendCustomEmail({
      to: customer.email,
      userId: customer.id,
      subject: subj,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6">${escaped}</div>`,
    });

    if (res.status === 'error' || res.status === 'skipped') {
      throw new BadRequestException(res.reason || 'Email could not be sent.');
    }

    return { success: true, to: customer.email };
  }

  private seatLimitFor(owner: any): number {
    return getPlan(resolveEffectivePlan(owner).planId).seats;
  }

  private async ownerTeam(workspaceId: string, customerId: string) {
    const owner = await this.customerRow(workspaceId, customerId);
    if (!owner.team_id) {
      throw new BadRequestException('This customer has no team yet.');
    }
    return owner;
  }

  async teamAndSeats(user: any, id: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);
    const seatLimit = this.seatLimitFor(owner);

    const { rows: members } = await this.db.query(
      `SELECT tm.user_id AS id, tm.role, tm.status, tm.joined_at,
              u.name, u.email, u.last_seen_at
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1
          AND tm.status <> 'removed'
        ORDER BY (tm.role = 'owner') DESC, tm.joined_at ASC NULLS LAST`,
      [owner.team_id],
    );

    const used = members.filter((m) => m.status === 'active').length;
    return {
      ownerId: owner.id,
      teamId: owner.team_id,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.id === owner.id ? 'owner' : m.role,
        status: m.status,
        seatAssigned: m.status === 'active',
        isOwner: m.id === owner.id || m.role === 'owner',
        joinedAt: m.joined_at,
        lastActive: m.last_seen_at,
      })),
      seats: {
        limit: seatLimit,
        used,
        available: Math.max(0, seatLimit - used),
      },
    };
  }

  async addMember(user: any, id: string, dto: any) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);

    const email = String(dto?.email || '').trim().toLowerCase();
    const name = String(dto?.name || '').trim();
    const role = this.MEMBER_ROLES.includes(String(dto?.role || '').toLowerCase())
      ? String(dto.role).toLowerCase()
      : 'agent';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }

    const seatLimit = this.seatLimitFor(owner);
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n
         FROM team_members
        WHERE team_id = $1 AND status = 'active'`,
      [owner.team_id],
    );

    if ((cnt[0]?.n ?? 0) >= seatLimit) {
      throw new BadRequestException(
        `This account's plan includes ${seatLimit} seat${seatLimit > 1 ? 's' : ''}.`,
      );
    }

    const { rows: existing } = await this.db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );

    let userId = existing[0]?.id;
    if (!userId) {
      const password = await bcrypt.hash(randomUUID(), 10);
      const { rows } = await this.db.query(
        `INSERT INTO users
          (email, password, name, role, team_id, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,'agent',$4,true,NOW(),NOW())
         RETURNING id`,
        [email, password, name || null, owner.team_id],
      );
      userId = rows[0].id;
    } else {
      await this.db.query(
        `UPDATE users SET team_id = $2, updated_at = NOW() WHERE id = $1`,
        [userId, owner.team_id],
      );
    }

    await this.db.query(
      `INSERT INTO team_members
        (team_id, user_id, role, status, joined_at, created_at, updated_at)
       VALUES ($1,$2,$3,'active',NOW(),NOW(),NOW())
       ON CONFLICT (team_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = NOW()`,
      [owner.team_id, userId, role],
    );

    return { success: true };
  }

  async memberRole(user: any, id: string, memberId: string, roleRaw: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);

    if (memberId === owner.id) {
      throw new BadRequestException('The owner role is managed by ownership transfer.');
    }

    const role = this.MEMBER_ROLES.includes(String(roleRaw || '').toLowerCase())
      ? String(roleRaw).toLowerCase()
      : null;
    if (!role) throw new BadRequestException('Invalid role.');

    const { rowCount } = await this.db.query(
      `UPDATE team_members
          SET role = $3, updated_at = NOW()
        WHERE team_id = $1 AND user_id = $2 AND status <> 'removed'`,
      [owner.team_id, memberId, role],
    );

    if (!(rowCount ?? 0)) throw new NotFoundException('Member not found.');
    return { success: true };
  }

  async memberSeat(user: any, id: string, memberId: string, assigned: boolean) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);

    if (memberId === owner.id) {
      throw new BadRequestException('The owner always holds a seat.');
    }

    if (assigned) {
      const seatLimit = this.seatLimitFor(owner);
      const { rows: cnt } = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM team_members
          WHERE team_id = $1
            AND status = 'active'
            AND user_id <> $2`,
        [owner.team_id, memberId],
      );
      if ((cnt[0]?.n ?? 0) >= seatLimit) {
        throw new BadRequestException(`All ${seatLimit} seats are in use.`);
      }
    }

    const { rowCount } = await this.db.query(
      `UPDATE team_members
          SET status = $3, updated_at = NOW()
        WHERE team_id = $1 AND user_id = $2 AND status <> 'removed'`,
      [owner.team_id, memberId, assigned ? 'active' : 'inactive'],
    );

    if (!(rowCount ?? 0)) throw new NotFoundException('Member not found.');
    return { success: true };
  }

  async removeMember(user: any, id: string, memberId: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);

    if (memberId === owner.id) {
      throw new BadRequestException('You cannot remove the account owner.');
    }

    const { rowCount } = await this.db.query(
      `UPDATE team_members
          SET status = 'removed', updated_at = NOW()
        WHERE team_id = $1 AND user_id = $2`,
      [owner.team_id, memberId],
    );

    return { removed: (rowCount ?? 0) > 0 };
  }

  async transferOwnership(user: any, id: string, newOwnerId: string) {
    await this.ready();
    const workspaceId = await this.workspaceId(user);
    const owner = await this.ownerTeam(workspaceId, id);

    if (!newOwnerId || newOwnerId === owner.id) {
      throw new BadRequestException('Choose a different team member.');
    }

    const { rows } = await this.db.query(
      `SELECT user_id
         FROM team_members
        WHERE team_id = $1
          AND user_id = $2
          AND status <> 'removed'
        LIMIT 1`,
      [owner.team_id, newOwnerId],
    );
    if (!rows.length) {
      throw new BadRequestException('The new owner must be an existing member.');
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE teams SET owner_id = $2, updated_at = NOW() WHERE id = $1`,
        [owner.team_id, newOwnerId],
      );
      await client.query(
        `UPDATE team_members
            SET role = 'owner', status = 'active', updated_at = NOW()
          WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, newOwnerId],
      );
      await client.query(
        `UPDATE team_members
            SET role = 'admin', updated_at = NOW()
          WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, owner.id],
      );
      await client.query(
        `UPDATE users
            SET role = 'owner',
                ecommerce_workspace_id = $2,
                updated_at = NOW()
          WHERE id = $1`,
        [newOwnerId, workspaceId],
      );
      await client.query(
        `UPDATE users
            SET role = 'admin', updated_at = NOW()
          WHERE id = $1`,
        [owner.id],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { success: true, newOwnerId };
  }

  async importCustomers(user: any, customers: any[]) {
    await this.ready();
    const rows = Array.isArray(customers) ? customers.slice(0, 2000) : [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const raw of rows) {
      const email = String(raw?.email || '').trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        skipped += 1;
        continue;
      }

      try {
        const workspaceId = await this.workspaceId(user);
        const { rows: existing } = await this.db.query(
          `SELECT id, ecommerce_workspace_id
             FROM users
            WHERE LOWER(email) = LOWER($1)
              AND deleted_at IS NULL
            LIMIT 1`,
          [email],
        );

        if (existing[0]) {
          if (String(existing[0].ecommerce_workspace_id || '') !== workspaceId) {
            throw new BadRequestException('Email belongs to another workspace/account.');
          }
          await this.updateCustomer(user, existing[0].id, raw);
          if (raw?.plan) {
            await this.changePlan(user, existing[0].id, {
              plan: raw.plan,
              billingCycle: raw.billingCycle || raw.billing,
            });
          }
          updated += 1;
        } else {
          await this.createCustomer(user, raw);
          created += 1;
        }
      } catch (err: any) {
        skipped += 1;
        errors.push(`${email}: ${err?.message || 'Import failed'}`);
      }
    }

    return { created, updated, skipped, errors: errors.slice(0, 20) };
  }

  async exportRows(user: any, query: any) {
    const result = await this.list(user, { ...query, limit: 1000, offset: 0 });
    return result.data;
  }

  plansCatalog() {
    return publicPlansConfig();
  }

  /**
   * Shared read-only catalog. Global plan override writes belong to Admin Customers.
   * This prevents a customer workspace from changing platform-wide plan rules.
   */
  planConfig() {
    return publicPlansConfig();
  }

  async setPlanConfig() {
    throw new ForbiddenException(
      'Plan configuration is managed from Admin Customers. E-Commerce Workspace uses the shared plan configuration.',
    );
  }

  async resetPlanConfig() {
    throw new ForbiddenException(
      'Plan configuration is managed from Admin Customers. E-Commerce Workspace uses the shared plan configuration.',
    );
  }
}
