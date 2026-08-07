import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from './platform-mailer.service';

// Admin data for the Sign-ups and Customers sections. Sign-ups = everyone who
// submitted the registration form (a plain team owner). Customers = the subset
// who completed payment. Same underlying record; a customer is a paid sign-up.
@Injectable()
export class SignupsAdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
  ) {}

  private readonly cols = `
    id, email, name, phone, COALESCE(preferred_language, 'en') AS language,
    offer_used, checkout_status, payment_status, plan, selected_plan,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid,
    landing_page, abandoned_stage, welcome_email_sent_at, created_at, registered_at`;

  // Build the WHERE clause + params for a sign-ups/customers query with optional
  // search (q), payment-status filter, and offer filter.
  private buildWhere(
    kind: 'signups' | 'customers',
    q?: string,
    paymentStatus?: string,
    offer?: string,
  ): { where: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    clauses.push(
      kind === 'customers'
        ? `(payment_status = 'active' OR checkout_status = 'paid')`
        : `role = 'owner'`,
    );
    if (q && String(q).trim()) {
      params.push(`%${String(q).trim()}%`);
      clauses.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      if (paymentStatus === 'paid') {
        clauses.push(`(payment_status = 'active' OR checkout_status = 'paid')`);
      } else if (paymentStatus === 'unpaid') {
        clauses.push(
          `COALESCE(payment_status, '') <> 'active' AND COALESCE(checkout_status, '') <> 'paid'`,
        );
      } else {
        params.push(paymentStatus);
        clauses.push(`payment_status = $${params.length}`);
      }
    }
    if (offer && offer !== 'all') {
      params.push(offer);
      clauses.push(`offer_used = $${params.length}`);
    }
    return { where: clauses.join(' AND '), params };
  }

  async list(
    kind: 'signups' | 'customers',
    opts: {
      limit?: number | string;
      offset?: number | string;
      q?: string;
      paymentStatus?: string;
      offer?: string;
    } = {},
  ) {
    await this.mailer.ensureSchema();
    const lim = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
    const off = Math.max(Number(opts.offset) || 0, 0);
    const { where, params } = this.buildWhere(
      kind,
      opts.q,
      opts.paymentStatus,
      opts.offer,
    );

    const listParams = params.slice();
    listParams.push(lim, off);
    const { rows } = await this.db.query(
      `SELECT ${this.cols}
         FROM users
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${where}`,
      params,
    );
    return { data: rows, total: cnt[0]?.n ?? 0, limit: lim, offset: off };
  }

  // All matching rows (no pagination) for CSV export.
  async exportRows(
    kind: 'signups' | 'customers',
    opts: { q?: string; paymentStatus?: string; offer?: string } = {},
  ) {
    await this.mailer.ensureSchema();
    const { where, params } = this.buildWhere(
      kind,
      opts.q,
      opts.paymentStatus,
      opts.offer,
    );
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE ${where} ORDER BY created_at DESC LIMIT 5000`,
      params,
    );
    return rows;
  }

  // Funnel totals for the admin: how many people signed up vs how many paid,
  // over an optional date range, optionally broken down by a dimension we store
  // (campaign, offer, language, landing page). Upper-funnel stages (popup views,
  // begin checkout) live in GA4; this is the DB-backed sign-up -> purchase view.
  async funnel(
    opts: { from?: string; to?: string; groupBy?: string } = {},
  ) {
    await this.mailer.ensureSchema();
    const params: any[] = [];
    const dateClauses: string[] = [];
    if (opts.from) {
      params.push(opts.from);
      dateClauses.push(`created_at >= $${params.length}`);
    }
    if (opts.to) {
      params.push(opts.to);
      dateClauses.push(`created_at <= $${params.length}`);
    }
    const dateWhere = dateClauses.length
      ? ' AND ' + dateClauses.join(' AND ')
      : '';
    const paidExpr = `(payment_status = 'active' OR checkout_status = 'paid')`;

    const { rows: t } = await this.db.query(
      `SELECT
          COUNT(*) FILTER (WHERE role = 'owner')::int AS signups,
          COUNT(*) FILTER (WHERE role = 'owner' AND ${paidExpr})::int AS purchases
         FROM users
        WHERE 1=1 ${dateWhere}`,
      params,
    );
    const signups = t[0]?.signups ?? 0;
    const purchases = t[0]?.purchases ?? 0;

    const groupCols: Record<string, string> = {
      campaign: `COALESCE(NULLIF(utm_campaign, ''), '(none)')`,
      offer: `COALESCE(NULLIF(offer_used, ''), 'standard')`,
      language: `COALESCE(NULLIF(preferred_language, ''), 'en')`,
      landing_page: `COALESCE(NULLIF(landing_page, ''), '(none)')`,
    };
    const gb =
      opts.groupBy && groupCols[opts.groupBy] ? groupCols[opts.groupBy] : null;
    let breakdown: any[] = [];
    if (gb) {
      const { rows } = await this.db.query(
        `SELECT ${gb} AS key,
                COUNT(*)::int AS signups,
                COUNT(*) FILTER (WHERE ${paidExpr})::int AS purchases
           FROM users
          WHERE role = 'owner' ${dateWhere}
          GROUP BY 1
          ORDER BY signups DESC
          LIMIT 100`,
        params,
      );
      breakdown = rows;
    }

    return {
      signups,
      purchases,
      conversionRate: signups
        ? Math.round((purchases / signups) * 1000) / 10
        : 0,
      groupBy: opts.groupBy || null,
      breakdown,
    };
  }

  async detail(id: string) {
    await this.mailer.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [id],
    );
    const { rows: emails } = await this.db.query(
      `SELECT template, language, status, subject, scheduled_at, sent_at,
              delivered_at, opened_at, clicked_at, created_at
         FROM email_log
        WHERE user_id = $1
        ORDER BY COALESCE(scheduled_at, created_at) DESC
        LIMIT 50`,
      [id],
    );
    return { user: rows[0] || null, emails };
  }
}
