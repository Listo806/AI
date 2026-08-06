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

  async list(
    kind: 'signups' | 'customers',
    limit?: number | string,
    offset?: number | string,
    q?: string,
  ) {
    await this.mailer.ensureSchema();
    const base =
      kind === 'customers'
        ? `(payment_status = 'active' OR checkout_status = 'paid')`
        : `role = 'owner'`;
    const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const off = Math.max(Number(offset) || 0, 0);

    const params: any[] = [];
    let search = '';
    if (q && String(q).trim()) {
      params.push(`%${String(q).trim()}%`);
      search = `AND (email ILIKE $1 OR name ILIKE $1)`;
    }

    const listParams = params.slice();
    listParams.push(lim, off);
    const { rows } = await this.db.query(
      `SELECT ${this.cols}
         FROM users
        WHERE ${base} ${search}
        ORDER BY created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${base} ${search}`,
      params,
    );
    return { data: rows, total: cnt[0]?.n ?? 0, limit: lim, offset: off };
  }

  async detail(id: string) {
    await this.mailer.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [id],
    );
    const { rows: emails } = await this.db.query(
      `SELECT template, language, status, subject, scheduled_at, sent_at,
              opened_at, clicked_at, created_at
         FROM email_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50`,
      [id],
    );
    return { user: rows[0] || null, emails };
  }
}
