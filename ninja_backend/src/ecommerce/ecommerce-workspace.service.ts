import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from './platform-mailer.service';

/**
 * Tenant-isolated data layer for the customer-facing E-Commerce Workspace.
 *
 * IMPORTANT:
 * - Never reads Cortexa Admin Customers as workspace data.
 * - Never reads another tenant's E-Commerce records.
 * - Every read/write resolves tenant_id from the authenticated user.
 * - tenant_id supplied by the browser is ignored.
 *
 * The UI intentionally mirrors AdminCustomers, but the underlying records live
 * in dedicated ecommerce_* tables.
 */
@Injectable()
export class EcommerceWorkspaceService {
  private readonly logger = new Logger(EcommerceWorkspaceService.name);
  private schemaReady = false;

  private readonly planCatalog = {
    free: { id: 'free', label: 'Free', monthly: 0, seats: 1 },
    solo: { id: 'solo', label: 'Solo', monthly: 197, seats: 1 },
    business: { id: 'business', label: 'Business', monthly: 347, seats: 3 },
    scale: { id: 'scale', label: 'Scale', monthly: 497, seats: 5 },
  } as const;

  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
  ) {}

  private normalizePlan(raw: any): keyof typeof this.planCatalog {
    const v = String(raw || 'free').trim().toLowerCase();
    if (v === 'team') return 'business';
    if (v === 'growth') return 'scale';
    if (v in this.planCatalog) return v as keyof typeof this.planCatalog;
    return 'free';
  }

  /**
   * Team/workspace id is the tenant boundary. If a legacy account has no team,
   * fall back to the authenticated user id so it still gets an isolated workspace.
   */
  private async tenantId(user: any): Promise<string> {
    if (!user?.id) throw new ForbiddenException('Authenticated user is required.');

    const fromToken = user.teamId || user.team_id;
    if (fromToken) return String(fromToken);

    const { rows } = await this.db.query(
      `SELECT team_id FROM users WHERE id = $1 LIMIT 1`,
      [user.id],
    );
    return String(rows[0]?.team_id || user.id);
  }

  private async ready(): Promise<void> {
    if (this.schemaReady) return;

    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ecommerce_customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          email TEXT NOT NULL,
          name TEXT,
          phone TEXT,
          language VARCHAR(8) NOT NULL DEFAULT 'en',
          plan_id VARCHAR(32) NOT NULL DEFAULT 'free',
          billing_cycle VARCHAR(16),
          payment_status VARCHAR(32) NOT NULL DEFAULT 'free',
          source TEXT,
          country VARCHAR(2),
          seats_limit INT NOT NULL DEFAULT 1,
          next_billing_at TIMESTAMPTZ,
          ltv NUMERIC(14,2) NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen_at TIMESTAMPTZ,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMPTZ
        )
      `);

      await this.db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_ecommerce_customer_tenant_email
        ON ecommerce_customers(tenant_id, LOWER(email))
        WHERE deleted_at IS NULL
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ecommerce_customer_tenant
        ON ecommerce_customers(tenant_id, created_at DESC)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ecommerce_customer_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NOT NULL REFERENCES ecommerce_customers(id) ON DELETE CASCADE,
          author_id UUID,
          author_name TEXT,
          note TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ecommerce_notes_tenant_customer
        ON ecommerce_customer_notes(tenant_id, customer_id, created_at DESC)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ecommerce_customer_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NOT NULL REFERENCES ecommerce_customers(id) ON DELETE CASCADE,
          amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          status VARCHAR(32) NOT NULL DEFAULT 'succeeded',
          provider TEXT,
          external_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ecommerce_payments_tenant_customer
        ON ecommerce_customer_payments(tenant_id, customer_id, created_at DESC)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ecommerce_customer_activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NOT NULL REFERENCES ecommerce_customers(id) ON DELETE CASCADE,
          type VARCHAR(64) NOT NULL,
          title TEXT NOT NULL,
          details TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ecommerce_activity_tenant_customer
        ON ecommerce_customer_activity(tenant_id, customer_id, created_at DESC)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ecommerce_customer_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id UUID NOT NULL,
          customer_id UUID NOT NULL REFERENCES ecommerce_customers(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          name TEXT,
          role VARCHAR(32) NOT NULL DEFAULT 'user',
          seat_assigned BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_ecommerce_member_customer_email
        ON ecommerce_customer_members(tenant_id, customer_id, LOWER(email))
      `);

      this.schemaReady = true;
    } catch (err: any) {
      this.logger.error(`E-Commerce schema setup failed: ${err?.message}`);
      throw err;
    }
  }

  private sourceLabel(row: any): string {
    return String(row?.source || '').trim() || 'Direct / Organic';
  }

  private statusOf(row: any): string {
    if (!row?.is_active) return 'canceled';
    const p = this.normalizePlan(row?.plan_id);
    const pay = String(row?.payment_status || '').toLowerCase();

    if (pay === 'past_due') return 'past_due';
    if (pay === 'trialing' || pay === 'trial') return 'trialing';
    if (pay === 'active' || pay === 'paid' || pay === 'succeeded') return 'active';
    if (pay === 'registered') return 'registered';
    if (p === 'free' || pay === 'free') return 'free';
    return pay || 'registered';
  }

  private enrich(row: any) {
    if (!row) return null;
    const planId = this.normalizePlan(row.plan_id);
    const plan = this.planCatalog[planId];
    const status = this.statusOf(row);

    return {
      ...row,
      selected_plan: planId,
      plan_id: planId,
      plan_label: plan.label,
      recurring_amount: plan.monthly,
      intro_amount: 0,
      billing: planId === 'free' ? 'free' : row.billing_cycle || 'monthly',
      status,
      source_label: this.sourceLabel(row),
      seat_count: Number(row.seat_count || 0),
      seats_limit: Number(row.seats_limit || plan.seats),
      ltv: Number(row.ltv || 0),
      next_billing: row.next_billing_at,
    };
  }

  private buildWhere(
    tenantId: string,
    q: any = {},
    opts: { includeDeleted?: boolean } = {},
  ) {
    const where: string[] = ['c.tenant_id = $1'];
    const params: any[] = [tenantId];
    const add = (sql: string, value: any) => {
      params.push(value);
      where.push(sql.replace('?', `$${params.length}`));
    };

    if (!opts.includeDeleted) where.push('c.deleted_at IS NULL');

    const tab = String(q.tab || 'all');
    if (tab === 'registered') where.push(`LOWER(c.payment_status) = 'registered'`);
    if (tab === 'free') where.push(`LOWER(c.plan_id) = 'free'`);
    if (tab === 'trialing') where.push(`LOWER(c.payment_status) IN ('trial','trialing')`);
    if (tab === 'active') where.push(`LOWER(c.payment_status) IN ('active','paid','succeeded')`);
    if (tab === 'past_due') where.push(`LOWER(c.payment_status) = 'past_due'`);
    if (tab === 'canceled') where.push(`c.is_active = false`);

    if (q.q) {
      add(
        `(LOWER(c.email) LIKE LOWER(?) OR LOWER(COALESCE(c.name,'')) LIKE LOWER($${params.length + 1}) OR LOWER(COALESCE(c.phone,'')) LIKE LOWER($${params.length + 1}))`,
        `%${String(q.q).trim()}%`,
      );
    }

    if (q.plan && q.plan !== 'all') {
      if (q.plan === 'registered') {
        where.push(`LOWER(c.payment_status) = 'registered'`);
      } else {
        add(`LOWER(c.plan_id) = LOWER(?)`, this.normalizePlan(q.plan));
      }
    }

    if (q.billing && q.billing !== 'all') add(`LOWER(COALESCE(c.billing_cycle,'')) = LOWER(?)`, q.billing);
    if (q.paymentStatus && q.paymentStatus !== 'all') {
      const ps = q.paymentStatus === 'trial' ? 'trialing' : q.paymentStatus;
      if (ps === 'trialing') where.push(`LOWER(c.payment_status) IN ('trial','trialing')`);
      else add(`LOWER(c.payment_status) = LOWER(?)`, ps);
    }
    if (q.source && q.source !== 'all') add(`LOWER(COALESCE(c.source,'')) = LOWER(?)`, q.source);
    if (q.language && q.language !== 'all') add(`LOWER(COALESCE(c.language,'en')) = LOWER(?)`, q.language);
    if (q.country && q.country !== 'all') add(`UPPER(COALESCE(c.country,'')) = UPPER(?)`, q.country);
    if (q.from) add(`c.registered_at >= ?::date`, q.from);
    if (q.to) add(`c.registered_at < (?::date + INTERVAL '1 day')`, q.to);

    return { where: where.join(' AND '), params };
  }

  async list(user: any, query: any) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const limit = Math.max(1, Math.min(1000, Number(query?.limit) || 10));
    const offset = Math.max(0, Number(query?.offset) || 0);
    const { where, params } = this.buildWhere(tenantId, query);

    const { rows: countRows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM ecommerce_customers c WHERE ${where}`,
      params,
    );

    const { rows } = await this.db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int
                 FROM ecommerce_customer_members m
                WHERE m.tenant_id = c.tenant_id AND m.customer_id = c.id AND m.seat_assigned = true
              ) AS seat_count
         FROM ecommerce_customers c
        WHERE ${where}
        ORDER BY c.registered_at DESC, c.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
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
    const tenantId = await this.tenantId(user);
    const { where, params } = this.buildWhere(tenantId, { ...query, tab: 'all' });

    const { rows } = await this.db.query(
      `SELECT c.* FROM ecommerce_customers c WHERE ${where}`,
      params,
    );

    const data = rows.map((r) => this.enrich(r));
    const total = data.length;
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;

    const activeCustomers = data.filter((r) => r.status === 'active').length;
    const freeAccounts = data.filter((r) => r.plan_id === 'free').length;

    const monthlyRecurring = data
      .filter((r) => r.status === 'active')
      .reduce((sum, r) => sum + Number(r.recurring_amount || 0), 0);

    const group = (fn: (r: any) => string) => {
      const map = new Map<string, number>();
      for (const r of data) {
        const key = fn(r) || 'Unknown';
        map.set(key, (map.get(key) || 0) + 1);
      }
      return [...map.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    const planRows = ['free', 'registered', 'solo', 'business', 'scale'].map((id) => {
      let count = 0;
      if (id === 'registered') {
        count = data.filter((r) => r.status === 'registered').length;
      } else {
        count = data.filter((r) => r.plan_id === id).length;
      }
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

    return {
      kpis: {
        totalRegistered: total,
        newThisWeek: data.filter((r) => new Date(r.registered_at || r.created_at).getTime() >= weekAgo).length,
        activeCustomers,
        activePctOfTotal: total ? Math.round((activeCustomers / total) * 1000) / 10 : 0,
        mrr: monthlyRecurring,
        arr: monthlyRecurring * 12,
        conversionRate: total ? Math.round((activeCustomers / total) * 1000) / 10 : 0,
        freeAccounts,
        freePctOfTotal: total ? Math.round((freeAccounts / total) * 1000) / 10 : 0,
      },
      tabs: {
        all: total,
        registered: data.filter((r) => r.status === 'registered').length,
        free: data.filter((r) => r.status === 'free').length,
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
      },
    };
  }

  private async customerRow(tenantId: string, id: string) {
    const { rows } = await this.db.query(
      `SELECT c.*,
              (SELECT COUNT(*)::int
                 FROM ecommerce_customer_members m
                WHERE m.tenant_id = c.tenant_id AND m.customer_id = c.id AND m.seat_assigned = true
              ) AS seat_count
         FROM ecommerce_customers c
        WHERE c.id = $1 AND c.tenant_id = $2 AND c.deleted_at IS NULL
        LIMIT 1`,
      [id, tenantId],
    );
    if (!rows[0]) throw new NotFoundException('E-Commerce customer not found.');
    return rows[0];
  }

  async detail(user: any, id: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const row = await this.customerRow(tenantId, id);
    const customer = this.enrich(row);
    const plan = this.planCatalog[this.normalizePlan(row.plan_id)];

    const [{ rows: payments }, { rows: notes }, { rows: activity }] = await Promise.all([
      this.db.query(
        `SELECT id, amount::float, currency, status, provider, external_id, created_at
           FROM ecommerce_customer_payments
          WHERE tenant_id = $1 AND customer_id = $2
          ORDER BY created_at DESC LIMIT 50`,
        [tenantId, id],
      ),
      this.db.query(
        `SELECT id, author_id, author_name, note, created_at
           FROM ecommerce_customer_notes
          WHERE tenant_id = $1 AND customer_id = $2
          ORDER BY created_at DESC LIMIT 100`,
        [tenantId, id],
      ),
      this.db.query(
        `SELECT id, type, title, details, created_at
           FROM ecommerce_customer_activity
          WHERE tenant_id = $1 AND customer_id = $2
          ORDER BY created_at DESC LIMIT 100`,
        [tenantId, id],
      ),
    ]);

    return {
      customer,
      subscription: {
        plan: plan.label,
        planId: plan.id,
        recurringAmount: plan.monthly,
        billingCycle: plan.id === 'free' ? null : row.billing_cycle || 'monthly',
        seatsLimit: Number(row.seats_limit || plan.seats),
        isFree: plan.id === 'free',
        startDate: row.registered_at || row.created_at,
        nextBillingDate: row.next_billing_at,
      },
      payments,
      notes,
      activity,
      usage: {
        limits: { aiConversationsPerMonth: null, integrations: null },
        usage: { aiConversationsThisMonth: 0, integrationsConnected: 0 },
      },
    };
  }

  async createCustomer(user: any, dto: any) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const email = String(dto?.email || '').trim().toLowerCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required.');
    }

    const planId = this.normalizePlan(dto?.plan);
    const plan = this.planCatalog[planId];
    const language = ['en', 'es', 'pt'].includes(String(dto?.language || '').toLowerCase())
      ? String(dto.language).toLowerCase()
      : 'en';

    const { rows } = await this.db.query(
      `INSERT INTO ecommerce_customers
         (tenant_id, email, name, phone, language, plan_id, billing_cycle,
          payment_status, source, country, seats_limit, registered_at, created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW(),NOW())
       ON CONFLICT (tenant_id, (LOWER(email))) WHERE deleted_at IS NULL
       DO UPDATE SET
         name = COALESCE(NULLIF(EXCLUDED.name,''), ecommerce_customers.name),
         phone = COALESCE(NULLIF(EXCLUDED.phone,''), ecommerce_customers.phone),
         language = EXCLUDED.language,
         updated_at = NOW()
       RETURNING *`,
      [
        tenantId,
        email,
        dto?.name ? String(dto.name).slice(0, 200) : null,
        dto?.phone ? String(dto.phone).slice(0, 40) : null,
        language,
        planId,
        planId === 'free' ? null : String(dto?.billingCycle || 'monthly'),
        planId === 'free' ? 'free' : String(dto?.paymentStatus || 'registered'),
        dto?.source ? String(dto.source).slice(0, 100) : 'Direct / Organic',
        dto?.country ? String(dto.country).slice(0, 2).toUpperCase() : null,
        plan.seats,
      ],
    );

    await this.db.query(
      `INSERT INTO ecommerce_customer_activity
         (tenant_id, customer_id, type, title, details)
       VALUES ($1,$2,'customer_created','Customer created',$3)`,
      [tenantId, rows[0].id, `Created by ${user?.email || user?.id || 'workspace user'}`],
    );

    return { success: true, customer: this.enrich(rows[0]) };
  }

  async updateCustomer(user: any, id: string, dto: any) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    await this.customerRow(tenantId, id);

    const language = ['en', 'es', 'pt'].includes(String(dto?.language || '').toLowerCase())
      ? String(dto.language).toLowerCase()
      : null;

    const { rows } = await this.db.query(
      `UPDATE ecommerce_customers
          SET name = COALESCE(NULLIF($3,''), name),
              phone = COALESCE(NULLIF($4,''), phone),
              language = COALESCE($5, language),
              updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
        RETURNING *`,
      [
        id,
        tenantId,
        dto?.name != null ? String(dto.name).slice(0, 200) : null,
        dto?.phone != null ? String(dto.phone).slice(0, 40) : null,
        language,
      ],
    );

    return { success: true, customer: this.enrich(rows[0]) };
  }

  async changePlan(user: any, id: string, dto: any) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    await this.customerRow(tenantId, id);

    const planId = this.normalizePlan(dto?.plan);
    const plan = this.planCatalog[planId];
    const billingCycle =
      planId === 'free'
        ? null
        : ['monthly', 'annual'].includes(String(dto?.billingCycle))
          ? String(dto.billingCycle)
          : 'monthly';

    const { rows } = await this.db.query(
      `UPDATE ecommerce_customers
          SET plan_id = $3,
              billing_cycle = $4,
              seats_limit = $5,
              payment_status = CASE WHEN $3 = 'free' THEN 'free' ELSE payment_status END,
              updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
        RETURNING *`,
      [id, tenantId, planId, billingCycle, plan.seats],
    );

    return { success: true, customer: this.enrich(rows[0]) };
  }

  async deactivate(user: any, id: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const { rowCount } = await this.db.query(
      `UPDATE ecommerce_customers
          SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId],
    );
    return { deactivated: (rowCount ?? 0) > 0 };
  }

  async remove(user: any, id: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const { rowCount } = await this.db.query(
      `UPDATE ecommerce_customers
          SET deleted_at = NOW(), is_active = false, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  async listNotes(user: any, id: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    await this.customerRow(tenantId, id);
    const { rows } = await this.db.query(
      `SELECT id, author_id, author_name, note, created_at
         FROM ecommerce_customer_notes
        WHERE tenant_id = $1 AND customer_id = $2
        ORDER BY created_at DESC`,
      [tenantId, id],
    );
    return rows;
  }

  async addNote(user: any, id: string, note: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    await this.customerRow(tenantId, id);
    const text = String(note || '').trim();
    if (!text) throw new BadRequestException('Note text is required.');

    const { rows } = await this.db.query(
      `INSERT INTO ecommerce_customer_notes
         (tenant_id, customer_id, author_id, author_name, note)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, author_id, author_name, note, created_at`,
      [tenantId, id, user?.id || null, user?.name || user?.email || null, text],
    );
    return rows[0];
  }

  async deleteNote(user: any, id: string, noteId: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const { rowCount } = await this.db.query(
      `DELETE FROM ecommerce_customer_notes
        WHERE id = $1 AND customer_id = $2 AND tenant_id = $3`,
      [noteId, id, tenantId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  async sendCustomerEmail(user: any, id: string, subject: string, message: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const customer = this.enrich(await this.customerRow(tenantId, id));
    const subj = String(subject || '').trim();
    const msg = String(message || '').trim();

    if (!subj || !msg) throw new BadRequestException('Subject and message are required.');

    const escaped = msg
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r?\n/g, '<br>');

    const res = await this.mailer.sendCustomEmail({
      to: customer.email,
      userId: user?.id || null,
      subject: subj,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6">${escaped}</div>`,
    });

    if (res.status === 'error' || res.status === 'skipped') {
      throw new BadRequestException(res.reason || 'Email could not be sent.');
    }

    return { success: true, to: customer.email };
  }

  async teamAndSeats(user: any, id: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const customer = this.enrich(await this.customerRow(tenantId, id));
    const { rows } = await this.db.query(
      `SELECT id, email, name, role, seat_assigned, created_at, updated_at
         FROM ecommerce_customer_members
        WHERE tenant_id = $1 AND customer_id = $2
        ORDER BY created_at ASC`,
      [tenantId, id],
    );
    const used = rows.filter((r) => r.seat_assigned).length;
    return {
      ownerId: null,
      teamId: null,
      members: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        status: r.seat_assigned ? 'active' : 'inactive',
        seatAssigned: r.seat_assigned,
        isOwner: false,
        joinedAt: r.created_at,
        lastActive: r.updated_at,
      })),
      seats: {
        limit: customer.seats_limit,
        used,
        available: Math.max(0, customer.seats_limit - used),
      },
    };
  }

  async addMember(user: any, id: string, dto: any) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const customer = this.enrich(await this.customerRow(tenantId, id));
    const email = String(dto?.email || '').trim().toLowerCase();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required.');
    }

    const { rows: current } = await this.db.query(
      `SELECT COUNT(*)::int AS n
         FROM ecommerce_customer_members
        WHERE tenant_id = $1 AND customer_id = $2 AND seat_assigned = true`,
      [tenantId, id],
    );
    if (Number(current[0]?.n || 0) >= Number(customer.seats_limit || 1)) {
      throw new BadRequestException('All seats are currently in use.');
    }

    const { rows } = await this.db.query(
      `INSERT INTO ecommerce_customer_members
         (tenant_id, customer_id, email, name, role, seat_assigned)
       VALUES ($1,$2,$3,$4,$5,true)
       ON CONFLICT (tenant_id, customer_id, LOWER(email))
       DO UPDATE SET
         name = COALESCE(NULLIF(EXCLUDED.name,''), ecommerce_customer_members.name),
         role = EXCLUDED.role,
         seat_assigned = true,
         updated_at = NOW()
       RETURNING *`,
      [
        tenantId,
        id,
        email,
        dto?.name ? String(dto.name).slice(0, 200) : null,
        String(dto?.role || 'user').toLowerCase(),
      ],
    );
    return { success: true, member: rows[0] };
  }

  async memberRole(user: any, id: string, memberId: string, role: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const { rowCount } = await this.db.query(
      `UPDATE ecommerce_customer_members
          SET role = $4, updated_at = NOW()
        WHERE id = $1 AND customer_id = $2 AND tenant_id = $3`,
      [memberId, id, tenantId, String(role || 'user').toLowerCase()],
    );
    if (!(rowCount ?? 0)) throw new NotFoundException('Member not found.');
    return { success: true };
  }

  async memberSeat(user: any, id: string, memberId: string, assigned: boolean) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    if (assigned) {
      const customer = this.enrich(await this.customerRow(tenantId, id));
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM ecommerce_customer_members
          WHERE tenant_id = $1 AND customer_id = $2 AND seat_assigned = true AND id <> $3`,
        [tenantId, id, memberId],
      );
      if (Number(rows[0]?.n || 0) >= Number(customer.seats_limit || 1)) {
        throw new BadRequestException('All seats are currently in use.');
      }
    }

    const { rowCount } = await this.db.query(
      `UPDATE ecommerce_customer_members
          SET seat_assigned = $4, updated_at = NOW()
        WHERE id = $1 AND customer_id = $2 AND tenant_id = $3`,
      [memberId, id, tenantId, assigned],
    );
    if (!(rowCount ?? 0)) throw new NotFoundException('Member not found.');
    return { success: true };
  }

  async removeMember(user: any, id: string, memberId: string) {
    await this.ready();
    const tenantId = await this.tenantId(user);
    const { rowCount } = await this.db.query(
      `DELETE FROM ecommerce_customer_members
        WHERE id = $1 AND customer_id = $2 AND tenant_id = $3`,
      [memberId, id, tenantId],
    );
    return { removed: (rowCount ?? 0) > 0 };
  }

  async transferOwnership(_user: any, _id: string, _newOwnerId: string) {
    // The E-Commerce customer/member model is not the Cortexa account team.
    // Keep the endpoint shape for UI compatibility but do not mutate Cortexa teams.
    return { success: true };
  }

  async importCustomers(user: any, customers: any[]) {
    const rows = Array.isArray(customers) ? customers.slice(0, 5000) : [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      try {
        const tenantId = await this.tenantId(user);
        const email = String(rows[i]?.email || '').trim().toLowerCase();
        if (!email) {
          skipped += 1;
          continue;
        }
        const { rows: existing } = await this.db.query(
          `SELECT id FROM ecommerce_customers
            WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND deleted_at IS NULL
            LIMIT 1`,
          [tenantId, email],
        );
        await this.createCustomer(user, rows[i]);
        if (existing[0]) updated += 1;
        else created += 1;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err?.message || 'Import failed' });
      }
    }

    return { created, updated, skipped, errors };
  }

  async exportRows(user: any, query: any) {
    const result = await this.list(user, { ...query, limit: 1000, offset: 0 });
    return result.data;
  }

  async plansCatalog() {
    return Object.values(this.planCatalog);
  }

  async planConfig() {
    return {
      plans: Object.values(this.planCatalog).map((p) => ({
        id: p.id,
        name: p.label,
        monthlyPrice: p.monthly,
        limits: { seats: p.seats },
      })),
      enforcedPlanIds: [],
    };
  }

  async setPlanConfig() {
    throw new BadRequestException(
      'E-Commerce workspace plan configuration is not connected to the Cortexa Admin plan configuration.',
    );
  }

  async resetPlanConfig() {
    throw new BadRequestException(
      'E-Commerce workspace plan configuration is not connected to the Cortexa Admin plan configuration.',
    );
  }
}