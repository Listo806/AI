import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from './platform-mailer.service';
import { UsageService } from '../plans/usage.service';
import {
  PLAN_ORDER,
  getPlan,
  normalizePlanId,
  publicPlansConfig,
} from '../plans/plan-config';

// The master Customers admin data layer. One record per account (a team OWNER
// row on `users`), covering the whole lifecycle: registered, free, trialing,
// active paid, past due, canceled. Amounts come from the canonical plan-config;
// the `users` table is the reliably-populated source the app itself uses.
@Injectable()
export class CustomersAdminService {
  private readonly logger = new Logger(CustomersAdminService.name);
  private notesReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
    private readonly usage: UsageService,
  ) {}

  // Self-healing internal-notes table (migrations are not auto-run here).
  private async ensureNotes(): Promise<void> {
    if (this.notesReady) return;
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS customer_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          author_id UUID,
          author_name TEXT,
          note TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id)`,
      );
      this.notesReady = true;
    } catch (err: any) {
      this.logger.error(`ensureNotes failed: ${err?.message}`);
    }
  }

  private async ready(): Promise<void> {
    await this.mailer.ensureSchema();
    await this.ensureNotes();
  }

  private readonly cols = `
    id, email, name, phone, COALESCE(preferred_language, 'en') AS language,
    offer_used, checkout_status, payment_status, plan, selected_plan,
    billing_cycle, plan_status, paddle_customer_id, paddle_subscription_id,
    signup_source, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    gclid, landing_page, created_at, registered_at, upgraded_at, last_seen_at,
    team_id,
    (SELECT COUNT(*)::int FROM team_members tm WHERE tm.team_id = users.team_id) AS seat_count,
    (SELECT COALESCE(SUM(p.amount), 0)::float
       FROM payments p JOIN subscriptions s ON s.id = p.subscription_id
      WHERE s.team_id = users.team_id AND p.status = 'succeeded') AS ltv,
    (SELECT s.current_period_end FROM subscriptions s
      WHERE s.team_id = users.team_id
      ORDER BY s.created_at DESC LIMIT 1) AS next_billing`;

  // Friendly, normalized acquisition source used by both the filter and the
  // breakdown so they always agree.
  private readonly sourceExpr = `
    CASE
      WHEN COALESCE(gclid,'') <> '' THEN 'Google Ads'
      WHEN LOWER(COALESCE(utm_source,'')) LIKE '%google%' THEN 'Google Ads'
      WHEN LOWER(COALESCE(signup_source,'')) = 'exit_popup' THEN 'Exit Popup'
      WHEN LOWER(COALESCE(utm_medium,'')) LIKE '%referr%'
        OR LOWER(COALESCE(utm_source,'')) LIKE '%referr%' THEN 'Referral'
      WHEN COALESCE(signup_source,'') = '' AND COALESCE(utm_source,'') = ''
        THEN 'Direct / Organic'
      ELSE 'Other'
    END`;

  // Normalized lifecycle status the tabs and badges use.
  private deriveStatus(row: any): string {
    const ps = String(row.payment_status || '').toLowerCase();
    const cs = String(row.checkout_status || '').toLowerCase();
    if (ps === 'active' || cs === 'paid') return 'active';
    if (ps === 'failed') return 'failed';
    if (ps === 'past_due') return 'past_due';
    if (ps === 'canceled' || ps === 'suspended') return 'canceled';
    if (ps === 'trial' || ps === 'pending') return 'trialing';
    if (ps === 'free') return 'free';
    return 'registered';
  }

  private enrich(row: any) {
    if (!row) return row;
    const notChosen =
      !row.selected_plan && String(row.payment_status || '') === 'registered';
    const planId = normalizePlanId(row.selected_plan || row.plan);
    const cfg = getPlan(planId);
    const cycle =
      row.billing_cycle === 'annual'
        ? 'annual'
        : row.billing_cycle === 'monthly'
          ? 'monthly'
          : null;
    const recurringCents = cfg.isFree
      ? 0
      : cycle === 'annual'
        ? cfg.pricing.annualCents
        : cfg.pricing.monthlyCents;
    return {
      ...row,
      status: this.deriveStatus(row),
      plan_id: notChosen ? 'unselected' : planId,
      plan_label: notChosen ? 'Not selected' : cfg.label,
      billing: cfg.isFree ? 'free' : cycle || 'monthly',
      intro_amount: cfg.pricing.introCents / 100,
      recurring_amount: recurringCents / 100,
      seats_limit: cfg.seats,
    };
  }

  // WHERE clause for a status tab.
  private tabClause(tab?: string): string | null {
    switch ((tab || 'all').toLowerCase()) {
      case 'registered':
        return `(COALESCE(payment_status,'') IN ('', 'registered') AND COALESCE(checkout_status,'') <> 'paid')`;
      case 'free':
        return `payment_status = 'free'`;
      case 'trialing':
        return `payment_status IN ('trial', 'pending')`;
      case 'active':
        return `(payment_status = 'active' OR checkout_status = 'paid')`;
      case 'past_due':
        return `payment_status = 'past_due'`;
      case 'canceled':
        return `payment_status IN ('canceled', 'suspended')`;
      default:
        return null;
    }
  }

  private planClause(plan: string, params: any[]): string | null {
    const key = String(plan || '').toLowerCase();
    const eff = `LOWER(COALESCE(selected_plan, plan, ''))`;
    if (key === 'free') return `(${eff} = 'free' OR payment_status = 'free')`;
    if (key === 'solo') return `${eff} IN ('solo', 'pro')`;
    if (key === 'business') return `${eff} IN ('team', 'business')`;
    if (key === 'scale') return `${eff} IN ('growth', 'scale')`;
    return null;
  }

  private buildWhere(opts: any): { where: string; params: any[] } {
    const clauses: string[] = [`role = 'owner'`, `deleted_at IS NULL`];
    const params: any[] = [];

    const tab = this.tabClause(opts.tab);
    if (tab) clauses.push(tab);

    if (opts.q && String(opts.q).trim()) {
      params.push(`%${String(opts.q).trim()}%`);
      clauses.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`);
    }
    if (opts.plan && opts.plan !== 'all') {
      const pc = this.planClause(opts.plan, params);
      if (pc) clauses.push(pc);
    }
    if (opts.billing && opts.billing !== 'all') {
      params.push(String(opts.billing).toLowerCase());
      clauses.push(`LOWER(COALESCE(billing_cycle,'')) = $${params.length}`);
    }
    if (opts.paymentStatus && opts.paymentStatus !== 'all') {
      params.push(String(opts.paymentStatus).toLowerCase());
      clauses.push(`LOWER(COALESCE(payment_status,'')) = $${params.length}`);
    }
    if (opts.source && opts.source !== 'all') {
      params.push(opts.source);
      clauses.push(`${this.sourceExpr} = $${params.length}`);
    }
    if (opts.language && opts.language !== 'all') {
      params.push(String(opts.language).toLowerCase());
      clauses.push(`LOWER(COALESCE(preferred_language,'en')) = $${params.length}`);
    }
    if (opts.from) {
      params.push(opts.from);
      clauses.push(`created_at >= $${params.length}`);
    }
    if (opts.to) {
      params.push(opts.to);
      clauses.push(`created_at <= $${params.length}`);
    }
    return { where: clauses.join(' AND '), params };
  }

  async list(opts: any = {}) {
    await this.ready();
    const lim = Math.min(Math.max(Number(opts.limit) || 25, 1), 200);
    const off = Math.max(Number(opts.offset) || 0, 0);
    const { where, params } = this.buildWhere(opts);

    const listParams = params.slice();
    listParams.push(lim, off);
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${where}`,
      params,
    );
    return {
      data: rows.map((r) => this.enrich(r)),
      total: cnt[0]?.n ?? 0,
      limit: lim,
      offset: off,
    };
  }

  async exportRows(opts: any = {}) {
    await this.ready();
    const { where, params } = this.buildWhere({ ...opts, tab: opts.tab });
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, ${this.sourceExpr} AS source_label
         FROM users WHERE ${where} ORDER BY created_at DESC LIMIT 5000`,
      params,
    );
    return rows.map((r) => ({ ...this.enrich(r), source_label: r.source_label }));
  }

  // KPI cards + tab counts + source/offer/language breakdowns + funnel, all
  // respecting the shared filters (date range, plan, source, language, search).
  async summary(opts: any = {}) {
    await this.ready();
    // Filters minus the status tab (KPIs/breakdowns span all statuses).
    const { where, params } = this.buildWhere({ ...opts, tab: 'all' });

    const { rows: k } = await this.db.query(
      `SELECT
         COUNT(*)::int AS total_registered,
         COUNT(*) FILTER (WHERE payment_status = 'active' OR checkout_status = 'paid')::int AS active_paid,
         COUNT(*) FILTER (WHERE payment_status = 'free')::int AS free_accounts,
         COUNT(*) FILTER (WHERE payment_status IN ('trial','pending'))::int AS trialing,
         COUNT(*) FILTER (WHERE payment_status = 'past_due')::int AS past_due,
         COUNT(*) FILTER (WHERE payment_status IN ('canceled','suspended'))::int AS canceled,
         COUNT(*) FILTER (WHERE COALESCE(payment_status,'') IN ('', 'registered') AND COALESCE(checkout_status,'') <> 'paid')::int AS registered,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_this_week
       FROM users WHERE ${where}`,
      params,
    );
    const c = k[0] || {};
    const totalRegistered = c.total_registered ?? 0;
    const activePaid = c.active_paid ?? 0;

    // MRR from active accounts, mapped to plan-config amounts (annual -> /12).
    const { rows: activeRows } = await this.db.query(
      `SELECT selected_plan, plan, billing_cycle FROM users
        WHERE ${where} AND (payment_status = 'active' OR checkout_status = 'paid')`,
      params,
    );
    let mrrCents = 0;
    for (const r of activeRows) {
      const cfg = getPlan(normalizePlanId(r.selected_plan || r.plan));
      if (cfg.isFree) continue;
      mrrCents +=
        r.billing_cycle === 'annual'
          ? Math.round(cfg.pricing.annualCents / 12)
          : cfg.pricing.monthlyCents;
    }
    const mrr = mrrCents / 100;
    const arr = mrr * 12;

    // Breakdowns
    const breakdown = async (expr: string) => {
      const { rows } = await this.db.query(
        `SELECT ${expr} AS key, COUNT(*)::int AS count
           FROM users WHERE ${where}
          GROUP BY 1 ORDER BY count DESC LIMIT 20`,
        params,
      );
      return rows;
    };
    const bySource = await breakdown(this.sourceExpr);
    const byLanguage = await breakdown(`COALESCE(preferred_language, 'en')`);
    const byPlanRaw = await breakdown(
      `CASE
         WHEN payment_status = 'free' OR LOWER(COALESCE(selected_plan,plan,'')) = 'free' THEN 'free'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('solo','pro') THEN 'solo'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('team','business') THEN 'business'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('growth','scale') THEN 'scale'
         ELSE 'unselected'
       END`,
    );
    const planLabels: Record<string, string> = {
      free: 'Free ($0)',
      solo: 'Solo ($197)',
      business: 'Business ($347)',
      scale: 'Scale ($497)',
      unselected: 'Not selected',
    };
    const byPlan = byPlanRaw.map((r: any) => ({
      key: planLabels[r.key] || r.key,
      count: r.count,
    }));

    // Funnel (respects the same filters): registered -> plan selected ->
    // checkout started -> payment completed.
    const { rows: f } = await this.db.query(
      `SELECT
         COUNT(*)::int AS registered,
         COUNT(*) FILTER (WHERE selected_plan IS NOT NULL)::int AS plan_selected,
         COUNT(*) FILTER (WHERE payment_status IN ('trial','pending','active','past_due','canceled') OR checkout_status = 'paid')::int AS checkout_started,
         COUNT(*) FILTER (WHERE payment_status = 'active' OR checkout_status = 'paid')::int AS payment_completed
       FROM users WHERE ${where}`,
      params,
    );
    const fr = f[0] || {};

    return {
      kpis: {
        totalRegistered,
        activeCustomers: activePaid,
        mrr,
        arr,
        conversionRate:
          totalRegistered > 0
            ? Math.round((activePaid / totalRegistered) * 1000) / 10
            : 0,
        freeAccounts: c.free_accounts ?? 0,
        newThisWeek: c.new_this_week ?? 0,
        activePctOfTotal:
          totalRegistered > 0
            ? Math.round((activePaid / totalRegistered) * 1000) / 10
            : 0,
        freePctOfTotal:
          totalRegistered > 0
            ? Math.round(((c.free_accounts ?? 0) / totalRegistered) * 1000) / 10
            : 0,
      },
      tabs: {
        all: totalRegistered,
        registered: c.registered ?? 0,
        free: c.free_accounts ?? 0,
        trialing: c.trialing ?? 0,
        active: activePaid,
        past_due: c.past_due ?? 0,
        canceled: c.canceled ?? 0,
      },
      funnel: {
        registered: fr.registered ?? 0,
        planSelected: fr.plan_selected ?? 0,
        checkoutStarted: fr.checkout_started ?? 0,
        paymentCompleted: fr.payment_completed ?? 0,
      },
      breakdowns: { source: bySource, plan: byPlan, language: byLanguage },
    };
  }

  // ---- detail ---------------------------------------------------------------

  async detail(id: string) {
    await this.ready();
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, is_active, ${this.sourceExpr} AS source_label
         FROM users WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) return { customer: null };
    const customer = { ...this.enrich(row), source_label: row.source_label };

    const [subscription, payments, notes, activity, usage] = await Promise.all([
      this.subscription(row),
      this.payments(row.team_id),
      this.listNotes(id),
      this.activity(id, row),
      this.usageFor(row.team_id),
    ]);

    return { customer, subscription, payments, notes, activity, usage };
  }

  private async subscription(row: any) {
    const planId = normalizePlanId(row.selected_plan || row.plan);
    const cfg = getPlan(planId);
    const cycle = row.billing_cycle === 'annual' ? 'annual' : 'monthly';
    let nextBilling: any = null;
    let periodStart: any = null;
    if (row.team_id) {
      try {
        const { rows } = await this.db.query(
          `SELECT current_period_end, current_period_start, status
             FROM subscriptions WHERE team_id = $1
            ORDER BY created_at DESC LIMIT 1`,
          [row.team_id],
        );
        nextBilling = rows[0]?.current_period_end ?? null;
        periodStart = rows[0]?.current_period_start ?? null;
      } catch {
        /* subscriptions row may not exist */
      }
    }
    return {
      plan: cfg.label,
      planId,
      isFree: cfg.isFree,
      status: this.deriveStatus(row),
      billingCycle: cfg.isFree ? null : cycle,
      seatsLimit: cfg.seats,
      introAmount: cfg.pricing.introCents / 100,
      recurringAmount: cfg.isFree
        ? 0
        : (cycle === 'annual'
            ? cfg.pricing.annualCents
            : cfg.pricing.monthlyCents) / 100,
      startDate: periodStart || row.registered_at || row.created_at,
      nextBillingDate: nextBilling,
      paddleCustomerId: row.paddle_customer_id || null,
      paddleSubscriptionId: row.paddle_subscription_id || null,
    };
  }

  // Real payment history from the payments table (joined via the team's
  // subscription). Never invented — empty when there are no recorded payments.
  private async payments(teamId?: string | null) {
    if (!teamId) return [];
    try {
      const { rows } = await this.db.query(
        `SELECT p.id, p.amount, p.currency, p.status,
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
    } catch (err: any) {
      this.logger.error(`payments lookup failed: ${err?.message}`);
      return [];
    }
  }

  // Activity timeline assembled from real timestamps we already store. No new
  // tracking, no fabrication.
  private async activity(id: string, row: any) {
    const events: Array<{ type: string; label: string; at: any }> = [];
    const push = (type: string, label: string, at: any) => {
      if (at) events.push({ type, label, at });
    };
    push('account_created', 'Account created', row.registered_at || row.created_at);
    push('plan_changed', 'Plan changed / upgraded', row.upgraded_at);
    push('email_welcome', 'Welcome email sent', row.welcome_email_sent_at);
    if (row.deleted_at) push('deleted', 'Account removed', row.deleted_at);

    try {
      const { rows: emails } = await this.db.query(
        `SELECT template, status, sent_at, opened_at, clicked_at, created_at
           FROM email_log WHERE user_id = $1
          ORDER BY COALESCE(sent_at, created_at) DESC LIMIT 30`,
        [id],
      );
      for (const e of emails) {
        push('email', `Email: ${e.template} (${e.status || 'queued'})`, e.sent_at || e.created_at);
      }
    } catch {
      /* email_log optional */
    }

    const pays = await this.payments(row.team_id);
    for (const p of pays) {
      push(
        'payment',
        `Payment ${p.status}: $${p.amount} ${p.currency || 'USD'}`,
        p.payment_date || p.created_at,
      );
    }

    events.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return events;
  }

  private async usageFor(teamId?: string | null) {
    try {
      return await this.usage.getUsageSummary(teamId || null);
    } catch {
      return null;
    }
  }

  // ---- notes ----------------------------------------------------------------

  async listNotes(userId: string) {
    await this.ensureNotes();
    try {
      const { rows } = await this.db.query(
        `SELECT id, author_id, author_name, note, created_at
           FROM customer_notes WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return rows;
    } catch {
      return [];
    }
  }

  async addNote(userId: string, note: string, author?: any) {
    await this.ensureNotes();
    const text = String(note || '').trim();
    if (!text) throw new BadRequestException('Note text is required');
    const { rows } = await this.db.query(
      `INSERT INTO customer_notes (user_id, author_id, author_name, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, author_id, author_name, note, created_at`,
      [userId, author?.id || null, author?.name || author?.email || null, text],
    );
    return rows[0];
  }

  async deleteNote(userId: string, noteId: string) {
    await this.ensureNotes();
    const { rowCount } = await this.db.query(
      `DELETE FROM customer_notes WHERE id = $1 AND user_id = $2`,
      [noteId, userId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  // ---- lifecycle actions ----------------------------------------------------

  // Move a customer between plans. Updates the real account configuration the
  // app reads (access, limits, display). NOTE: for a customer with a live Paddle
  // subscription this does not itself reprice Paddle — that billing swap is the
  // separate lifecycle step (needs a live Paddle change + verification).
  async changePlan(userId: string, dto: any) {
    await this.ready();
    const planId = normalizePlanId(dto?.plan);
    const isFree = planId === 'free';
    const cycle = ['monthly', 'annual'].includes(String(dto?.billingCycle))
      ? dto.billingCycle
      : isFree
        ? null
        : 'monthly';
    if (isFree) {
      await this.db.query(
        `UPDATE users
            SET selected_plan = 'free', billing_cycle = NULL,
                payment_status = 'free', checkout_status = 'free',
                plan_status = 'active', upgraded_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [userId],
      );
    } else {
      const legacyKey =
        planId === 'business' ? 'team' : planId === 'scale' ? 'growth' : 'solo';
      await this.db.query(
        `UPDATE users
            SET selected_plan = $2, billing_cycle = $3,
                plan_status = 'active', upgraded_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [userId, legacyKey, cycle],
      );
    }
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [userId],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Edit basic contact fields (name, phone, language). Never blanks existing
  // values with empty input.
  async updateCustomer(userId: string, dto: any) {
    await this.ready();
    const name = dto?.name != null ? String(dto.name).slice(0, 200) : null;
    const phone = dto?.phone != null ? String(dto.phone).slice(0, 40) : null;
    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : null;
    await this.db.query(
      `UPDATE users SET
         name = COALESCE(NULLIF($2, ''), name),
         phone = COALESCE(NULLIF($3, ''), phone),
         preferred_language = COALESCE($4, preferred_language),
         updated_at = NOW()
       WHERE id = $1`,
      [userId, name, phone, language],
    );
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [userId],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Deactivate: block access, keep the account and history.
  async deactivate(userId: string) {
    await this.ready();
    const { rowCount } = await this.db.query(
      `UPDATE users SET is_active = false,
              token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
        WHERE id = $1`,
      [userId],
    );
    return { deactivated: (rowCount ?? 0) > 0 };
  }

  // Delete (soft): hide from the list + block access. Financial records in the
  // payments table are deliberately left untouched.
  async remove(userId: string) {
    await this.ready();
    const { rowCount } = await this.db.query(
      `UPDATE users SET deleted_at = NOW(), is_active = false,
              token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  // Create a proper account (team + owner user + owner membership) with a random
  // password. Shared by import and the admin "Add Customer" action. Caller must
  // have already checked the email does not exist.
  private async createAccount(
    email: string,
    opts: {
      name?: string | null;
      phone?: string | null;
      planId?: string | null;
      language?: string | null;
      source?: string | null;
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
    const billingCycle = knownPaid ? 'monthly' : null;

    const teamName = opts.name
      ? `${String(opts.name).split(' ')[0]}'s Team`
      : 'New Team';
    const { rows: t } = await this.db.query(
      `INSERT INTO teams (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id`,
      [teamName],
    );
    const teamId = t[0].id;
    const password = await bcrypt.hash(randomUUID(), 10);
    const { rows: u } = await this.db.query(
      `INSERT INTO users
         (email, password, name, phone, role, plan, selected_plan, is_active,
          payment_status, billing_cycle, checkout_status, team_id,
          preferred_language, signup_source, offer_used, registered_at,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,'owner','TRIAL',$5,true,$6,$7,$8,$9,$10,$11,'standard',NOW(),NOW(),NOW())
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
        opts.source || 'admin',
      ],
    );
    const uid = u[0].id;
    await this.db.query(
      `UPDATE teams SET owner_id = $1, updated_at = NOW() WHERE id = $2`,
      [uid, teamId],
    );
    await this.db.query(
      `INSERT INTO team_members (team_id, user_id, role, status, created_at, updated_at)
       VALUES ($1, $2, 'owner', 'active', NOW(), NOW())
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [teamId, uid],
    );
    return { id: uid, teamId };
  }

  // Admin "Add Customer": create one account. Rejects duplicate emails.
  async createCustomer(dto: any) {
    await this.ready();
    const email = String(dto?.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required');
    }
    const { rows: existing } = await this.db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (existing[0]) {
      throw new BadRequestException('An account with this email already exists');
    }
    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : 'en';
    const { id } = await this.createAccount(email, {
      name: dto?.name ? String(dto.name).slice(0, 200) : null,
      phone: dto?.phone ? String(dto.phone).slice(0, 40) : null,
      planId: dto?.plan ? normalizePlanId(dto.plan) : null,
      language,
      source: dto?.source ? String(dto.source).slice(0, 64) : 'admin',
    });
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [id],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Bulk import customers from parsed CSV rows. Upserts by email: existing
  // accounts get their attributes updated (never overwritten with blanks); new
  // emails get a proper account created (team + owner membership + random
  // password). Capped and best-effort per row so one bad row can't abort the run.
  async importCustomers(rows: any[]) {
    await this.ready();
    const list = Array.isArray(rows) ? rows.slice(0, 2000) : [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const raw of list) {
      const email = String(raw?.email || '').trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        skipped += 1;
        continue;
      }
      const name = raw?.name ? String(raw.name).slice(0, 200) : null;
      const phone = raw?.phone ? String(raw.phone).slice(0, 40) : null;
      const language = ['en', 'es', 'pt'].includes(
        String(raw?.language || '').toLowerCase(),
      )
        ? String(raw.language).toLowerCase()
        : null;
      const source = raw?.source ? String(raw.source).slice(0, 64) : 'import';
      const planId = raw?.plan ? normalizePlanId(raw.plan) : null;

      try {
        const { rows: existing } = await this.db.query(
          `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email],
        );
        if (existing[0]) {
          await this.db.query(
            `UPDATE users SET
               name = COALESCE($2, name),
               phone = COALESCE($3, phone),
               preferred_language = COALESCE($4, preferred_language),
               signup_source = COALESCE(NULLIF($5, ''), signup_source),
               updated_at = NOW()
             WHERE id = $1`,
            [existing[0].id, name, phone, language, source],
          );
          if (planId) await this.changePlan(existing[0].id, { plan: planId });
          updated += 1;
          continue;
        }

        await this.createAccount(email, { name, phone, planId, language, source });
        created += 1;
      } catch (err: any) {
        errors.push(`${email}: ${err?.message}`);
        skipped += 1;
      }
    }
    return { created, updated, skipped, errors: errors.slice(0, 20) };
  }

  // Read-only plan catalog for the plan filter + Change Plan UI.
  plansCatalog() {
    return publicPlansConfig();
  }

  planKeys() {
    return PLAN_ORDER;
  }
}
