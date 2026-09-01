import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type ResourceKey =
  | 'followUps'
  | 'workItems'
  | 'estimates'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'products'
  | 'services'
  | 'priceLists'
  | 'categories'
  | 'companies'
  | 'customerGroups'
  | 'segments';

type ResourceConfig = {
  table: string;
  orderBy: string;
  search: string[];
  writable: string[];
};

const RESOURCES: Record<ResourceKey, ResourceConfig> = {
  followUps: {
    table: 'business_follow_ups',
    orderBy: 'due_at ASC NULLS LAST, created_at DESC',
    search: ['title', 'notes', 'status'],
    writable: ['contact_id', 'title', 'notes', 'status', 'priority', 'due_at', 'assigned_to'],
  },
  workItems: {
    table: 'business_work_items',
    orderBy: 'created_at DESC',
    search: ['title', 'description', 'status'],
    writable: ['title', 'description', 'status', 'priority', 'assigned_to', 'due_at'],
  },
  estimates: {
    table: 'business_estimates',
    orderBy: 'created_at DESC',
    search: ['estimate_number', 'customer_name', 'status'],
    writable: ['contact_id', 'customer_name', 'status', 'valid_until', 'notes', 'currency', 'subtotal', 'tax_amount', 'discount_amount', 'total'],
  },
  invoices: {
    table: 'business_invoices',
    orderBy: 'created_at DESC',
    search: ['invoice_number', 'customer_name', 'status'],
    writable: ['estimate_id', 'contact_id', 'customer_name', 'status', 'issue_date', 'due_date', 'notes', 'currency', 'subtotal', 'tax_amount', 'discount_amount', 'total'],
  },
  payments: {
    table: 'business_invoice_payments',
    orderBy: 'paid_at DESC NULLS LAST, created_at DESC',
    search: ['reference', 'method', 'status'],
    writable: ['invoice_id', 'amount', 'currency', 'method', 'reference', 'status', 'paid_at', 'notes'],
  },
  expenses: {
    table: 'business_expenses',
    orderBy: 'expense_date DESC NULLS LAST, created_at DESC',
    search: ['vendor', 'description', 'category', 'status'],
    writable: ['vendor', 'description', 'category', 'amount', 'currency', 'expense_date', 'status', 'notes'],
  },
  products: {
    table: 'business_products',
    orderBy: 'created_at DESC',
    search: ['name', 'sku', 'description'],
    writable: ['category_id', 'name', 'sku', 'description', 'unit_price', 'currency', 'taxable', 'active'],
  },
  services: {
    table: 'business_services',
    orderBy: 'created_at DESC',
    search: ['name', 'code', 'description'],
    writable: ['category_id', 'name', 'code', 'description', 'unit_price', 'currency', 'taxable', 'active'],
  },
  priceLists: {
    table: 'business_price_lists',
    orderBy: 'created_at DESC',
    search: ['name', 'description'],
    writable: ['name', 'description', 'currency', 'active'],
  },
  categories: {
    table: 'business_categories',
    orderBy: 'name ASC',
    search: ['name', 'description'],
    writable: ['name', 'description', 'active'],
  },
  companies: {
    table: 'business_companies',
    orderBy: 'name ASC',
    search: ['name', 'email', 'phone', 'website'],
    writable: ['name', 'email', 'phone', 'website', 'notes', 'active'],
  },
  customerGroups: {
    table: 'business_customer_groups',
    orderBy: 'name ASC',
    search: ['name', 'description'],
    writable: ['name', 'description', 'active'],
  },
  segments: {
    table: 'business_segments',
    orderBy: 'name ASC',
    search: ['name', 'description'],
    writable: ['name', 'description', 'active'],
  },
};

@Injectable()
export class BusinessSuiteService {
  constructor(private readonly db: DatabaseService) {}

  private schemaReady = false;
  private schemaInit: Promise<void> | null = null;

  private async ensureSchema() {
    if (this.schemaReady) return;
    if (!this.schemaInit) {
      this.schemaInit = this.initSchema().then(
        () => {
          this.schemaReady = true;
        },
        (error) => {
          this.schemaInit = null;
          throw error;
        },
      );
    }
    await this.schemaInit;
  }

  private async initSchema() {
    const client = await this.db.getClient();
    try {
      await client.query('SELECT pg_advisory_lock($1)', [981244]);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS business_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          description TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          sku TEXT,
          description TEXT,
          unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          taxable BOOLEAN NOT NULL DEFAULT TRUE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          category_id UUID REFERENCES business_categories(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          code TEXT,
          description TEXT,
          unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          taxable BOOLEAN NOT NULL DEFAULT TRUE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_price_lists (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          description TEXT,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_price_list_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          price_list_id UUID NOT NULL REFERENCES business_price_lists(id) ON DELETE CASCADE,
          item_type VARCHAR(20) NOT NULL,
          item_id UUID NOT NULL,
          unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(price_list_id, item_type, item_id)
        );

        CREATE TABLE IF NOT EXISTS business_estimates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          estimate_number TEXT NOT NULL,
          contact_id UUID,
          customer_name TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'draft',
          valid_until DATE,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
          tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          total NUMERIC(14,2) NOT NULL DEFAULT 0,
          notes TEXT,
          sent_at TIMESTAMPTZ,
          accepted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_estimate_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          estimate_id UUID NOT NULL REFERENCES business_estimates(id) ON DELETE CASCADE,
          item_type VARCHAR(20),
          item_id UUID,
          description TEXT NOT NULL,
          quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
          unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
          tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
          line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS business_invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          estimate_id UUID REFERENCES business_estimates(id) ON DELETE SET NULL,
          invoice_number TEXT NOT NULL,
          contact_id UUID,
          customer_name TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'draft',
          issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
          due_date DATE,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
          tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          total NUMERIC(14,2) NOT NULL DEFAULT 0,
          amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
          outstanding NUMERIC(14,2) NOT NULL DEFAULT 0,
          notes TEXT,
          paid_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_invoice_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          invoice_id UUID NOT NULL REFERENCES business_invoices(id) ON DELETE CASCADE,
          item_type VARCHAR(20),
          item_id UUID,
          description TEXT NOT NULL,
          quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
          unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
          tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
          line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS business_invoice_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          invoice_id UUID NOT NULL REFERENCES business_invoices(id) ON DELETE CASCADE,
          amount NUMERIC(14,2) NOT NULL,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          method TEXT,
          reference TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'succeeded',
          paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_expenses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          vendor TEXT,
          description TEXT NOT NULL,
          category TEXT,
          amount NUMERIC(14,2) NOT NULL DEFAULT 0,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
          status VARCHAR(30) NOT NULL DEFAULT 'recorded',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_follow_ups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          contact_id UUID,
          title TEXT NOT NULL,
          notes TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'open',
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          due_at TIMESTAMPTZ,
          assigned_to UUID,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_work_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          title TEXT NOT NULL,
          description TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'open',
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          assigned_to UUID,
          due_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          website TEXT,
          notes TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_customer_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          description TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_segments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          created_by UUID,
          name TEXT NOT NULL,
          description TEXT,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_activity (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID,
          action VARCHAR(50) NOT NULL,
          title TEXT NOT NULL,
          details TEXT,
          amount NUMERIC(14,2),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS business_settings (
          team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
          currency VARCHAR(8) NOT NULL DEFAULT 'USD',
          invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV',
          estimate_prefix VARCHAR(20) NOT NULL DEFAULT 'EST',
          payment_terms_days INT NOT NULL DEFAULT 30,
          tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,
          updated_by UUID,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_business_estimates_team ON business_estimates(team_id);
        CREATE INDEX IF NOT EXISTS idx_business_invoices_team ON business_invoices(team_id);
        CREATE INDEX IF NOT EXISTS idx_business_payments_team ON business_invoice_payments(team_id);
        CREATE INDEX IF NOT EXISTS idx_business_products_team ON business_products(team_id);
        CREATE INDEX IF NOT EXISTS idx_business_services_team ON business_services(team_id);
        CREATE INDEX IF NOT EXISTS idx_business_activity_team_created ON business_activity(team_id, created_at DESC);
      `);
    } finally {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [981244]);
      } finally {
        client.release();
      }
    }
  }

  private async accessibleTeamIds(user: any): Promise<string[]> {
    if (!user?.id) throw new ForbiddenException('Missing authenticated user');
    if (String(user.role || '').toLowerCase() === 'owner') {
      const { rows } = await this.db.query(
        `SELECT t.id
           FROM teams t
          WHERE t.owner_id = $1
             OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)`,
        [user.id],
      );
      return rows.map((r: any) => r.id);
    }
    return user.teamId ? [user.teamId] : [];
  }

  private async oneTeam(user: any, requested?: string | null): Promise<string> {
    const ids = await this.accessibleTeamIds(user);
    const teamId = requested && ids.includes(requested) ? requested : user.teamId && ids.includes(user.teamId) ? user.teamId : ids[0];
    if (!teamId) throw new ForbiddenException('You do not have access to a Business Suite team');
    return teamId;
  }

  private async assertContact(teamId: string, contactId?: string | null) {
    if (!contactId) return;
    const { rows } = await this.db.query(
      `SELECT id FROM contacts WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [contactId, teamId],
    );
    if (!rows.length) throw new BadRequestException('Selected contact is outside this workspace');
  }

  private async log(teamId: string, userId: string, entityType: string, entityId: string | null, action: string, title: string, details?: string | null, amount?: number | null) {
    await this.db.query(
      `INSERT INTO business_activity
        (team_id, user_id, entity_type, entity_id, action, title, details, amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [teamId, userId, entityType, entityId, action, title, details ?? null, amount ?? null],
    );
  }

  private page(query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    return { page, limit, offset: (page - 1) * limit };
  }

  private dbField(key: string) {
    return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  }

  private pickWritable(body: any, allowed: string[]) {
    const entries = Object.entries(body || {}).filter(([k, v]) => allowed.includes(this.dbField(k)) && v !== undefined);
    return entries.map(([k, v]) => [this.dbField(k), v] as [string, any]);
  }

  async listResource(user: any, key: ResourceKey, query: any = {}) {
    await this.ensureSchema();
    const ids = await this.accessibleTeamIds(user);
    const cfg = RESOURCES[key];
    if (!ids.length) return { data: [], total: 0, page: 1, limit: 20 };

    const { page, limit, offset } = this.page(query);
    const params: any[] = [ids];
    let where = `team_id = ANY($1::uuid[])`;

    if (query.search) {
      const qIndex = params.push(`%${String(query.search).trim()}%`);
      where += ` AND (${cfg.search.map((f) => `COALESCE(${f}::text,'') ILIKE $${qIndex}`).join(' OR ')})`;
    }
    if (query.status) {
      const sIndex = params.push(query.status);
      where += ` AND status = $${sIndex}`;
    }

    const count = await this.db.query(`SELECT COUNT(*)::int AS count FROM ${cfg.table} WHERE ${where}`, params);
    const dataParams = [...params, limit, offset];
    const rows = await this.db.query(
      `SELECT * FROM ${cfg.table}
       WHERE ${where}
       ORDER BY ${cfg.orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams,
    );

    return { data: rows.rows, total: count.rows[0]?.count ?? 0, page, limit };
  }

  async createResource(user: any, key: ResourceKey, body: any) {
    await this.ensureSchema();
    const cfg = RESOURCES[key];
    const teamId = await this.oneTeam(user, body?.teamId);
    if ('contact_id' in Object.fromEntries(this.pickWritable(body, cfg.writable))) {
      await this.assertContact(teamId, body.contactId ?? body.contact_id);
    }
    const fields = this.pickWritable(body, cfg.writable);
    if (!fields.length) throw new BadRequestException('No supported fields provided');

    const cols = ['team_id', 'created_by', ...fields.map(([k]) => k)];
    const values = [teamId, user.id, ...fields.map(([, v]) => v)];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');

    const { rows } = await this.db.query(
      `INSERT INTO ${cfg.table} (${cols.join(',')})
       VALUES (${placeholders})
       RETURNING *`,
      values,
    );
    const row = rows[0];
    await this.log(teamId, user.id, key, row.id, 'created', `${key} created`, row.title || row.name || row.description || null, Number(row.amount || row.total || 0) || null);
    return row;
  }

  async updateResource(user: any, key: ResourceKey, id: string, body: any) {
    await this.ensureSchema();
    const cfg = RESOURCES[key];
    const ids = await this.accessibleTeamIds(user);
    const fields = this.pickWritable(body, cfg.writable);
    if (!fields.length) throw new BadRequestException('No supported fields provided');

    const existing = await this.db.query(`SELECT * FROM ${cfg.table} WHERE id = $1 AND team_id = ANY($2::uuid[])`, [id, ids]);
    if (!existing.rows.length) throw new NotFoundException('Record not found');
    const teamId = existing.rows[0].team_id;
    if (body.contactId || body.contact_id) await this.assertContact(teamId, body.contactId ?? body.contact_id);

    const values = fields.map(([, v]) => v);
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ');
    values.push(id, ids);

    const { rows } = await this.db.query(
      `UPDATE ${cfg.table}
          SET ${set}, updated_at = NOW()
        WHERE id = $${values.length - 1}
          AND team_id = ANY($${values.length}::uuid[])
        RETURNING *`,
      values,
    );
    if (!rows.length) throw new NotFoundException('Record not found');
    await this.log(teamId, user.id, key, id, 'updated', `${key} updated`);
    return rows[0];
  }

  async deleteResource(user: any, key: ResourceKey, id: string) {
    await this.ensureSchema();
    const cfg = RESOURCES[key];
    const ids = await this.accessibleTeamIds(user);
    const { rows } = await this.db.query(
      `DELETE FROM ${cfg.table}
        WHERE id = $1 AND team_id = ANY($2::uuid[])
        RETURNING id, team_id`,
      [id, ids],
    );
    if (!rows.length) throw new NotFoundException('Record not found');
    await this.log(rows[0].team_id, user.id, key, id, 'deleted', `${key} deleted`);
    return { success: true };
  }

  async listTasks(user: any, query: any = {}) {
    await this.ensureSchema();
    const ids = await this.accessibleTeamIds(user);
    const { page, limit, offset } = this.page(query);
    if (!ids.length) return { data: [], total: 0, page, limit };
    const params: any[] = [ids];
    let where = `tt.team_id = ANY($1::uuid[]) AND ('business-suite' = ANY(tt.labels) OR tt.task_type = 'business')`;
    if (query.search) {
      params.push(`%${String(query.search).trim()}%`);
      where += ` AND (tt.title ILIKE $${params.length} OR COALESCE(tt.description,'') ILIKE $${params.length})`;
    }
    if (query.status) {
      params.push(query.status);
      where += ` AND tt.status = $${params.length}`;
    }
    const count = await this.db.query(`SELECT COUNT(*)::int AS count FROM team_tasks tt WHERE ${where}`, params);
    const { rows } = await this.db.query(
      `SELECT tt.*, u.name AS assignee_name
         FROM team_tasks tt
         LEFT JOIN users u ON u.id = tt.assigned_to
        WHERE ${where}
        ORDER BY tt.due_date ASC NULLS LAST, tt.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return { data: rows, total: count.rows[0]?.count ?? 0, page, limit };
  }

  async createTask(user: any, body: any) {
    await this.ensureSchema();
    const teamId = await this.oneTeam(user, body?.teamId);
    const labels = Array.from(new Set([...(Array.isArray(body?.labels) ? body.labels : []), 'business-suite']));
    const { rows } = await this.db.query(
      `INSERT INTO team_tasks
        (team_id,title,description,status,priority,task_type,assigned_to,created_by,due_date,progress,labels)
       VALUES ($1,$2,$3,$4,$5,'business',$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        teamId,
        body?.title,
        body?.description ?? null,
        body?.status ?? 'pending',
        body?.priority ?? 'medium',
        body?.assignedTo ?? null,
        user.id,
        body?.dueDate ?? null,
        Number(body?.progress) || 0,
        labels,
      ],
    );
    if (!body?.title) throw new BadRequestException('title is required');
    await this.log(teamId, user.id, 'task', rows[0].id, 'created', `Task: ${rows[0].title}`);
    return rows[0];
  }

  async updateTask(user: any, id: string, body: any) {
    const ids = await this.accessibleTeamIds(user);
    const fields: [string, any][] = [];
    const map: Record<string, string> = {
      title: 'title', description: 'description', status: 'status', priority: 'priority',
      assignedTo: 'assigned_to', dueDate: 'due_date', progress: 'progress',
    };
    for (const [client, db] of Object.entries(map)) if (body?.[client] !== undefined) fields.push([db, body[client]]);
    if (!fields.length) throw new BadRequestException('No supported fields provided');
    const values = fields.map(([,v]) => v);
    const set = fields.map(([k],i) => `${k} = $${i+1}`).join(', ');
    values.push(id, ids);
    const { rows } = await this.db.query(
      `UPDATE team_tasks
          SET ${set}, updated_at = NOW(),
              completed_at = CASE WHEN COALESCE(${
                fields.findIndex(([k]) => k === 'status') >= 0
                  ? '$' + (fields.findIndex(([k]) => k === 'status') + 1)
                  : 'status'
              }, status) = 'completed' THEN COALESCE(completed_at,NOW()) ELSE completed_at END
        WHERE id = $${values.length-1}
          AND team_id = ANY($${values.length}::uuid[])
          AND ('business-suite' = ANY(labels) OR task_type='business')
        RETURNING *`,
      values,
    );
    if (!rows.length) throw new NotFoundException('Task not found');
    await this.log(rows[0].team_id, user.id, 'task', id, 'updated', `Task: ${rows[0].title}`);
    return rows[0];
  }

  async deleteTask(user: any, id: string) {
    const ids = await this.accessibleTeamIds(user);
    const { rows } = await this.db.query(
      `DELETE FROM team_tasks
        WHERE id=$1 AND team_id=ANY($2::uuid[])
          AND ('business-suite'=ANY(labels) OR task_type='business')
        RETURNING id,team_id,title`,
      [id, ids],
    );
    if (!rows.length) throw new NotFoundException('Task not found');
    await this.log(rows[0].team_id, user.id, 'task', id, 'deleted', `Task: ${rows[0].title}`);
    return { success: true };
  }

  async listDocuments(user: any, query: any = {}) {
    const ids = await this.accessibleTeamIds(user);
    const { page, limit, offset } = this.page(query);
    if (!ids.length) return { data: [], total: 0, page, limit };
    const params: any[] = [ids];
    let where = `team_id = ANY($1::uuid[]) AND (folder = 'business-suite' OR folder LIKE 'business-suite/%')`;
    if (query.search) {
      params.push(`%${String(query.search).trim()}%`);
      where += ` AND original_name ILIKE $${params.length}`;
    }
    const count = await this.db.query(`SELECT COUNT(*)::int AS count FROM stored_files WHERE ${where}`, params);
    const { rows } = await this.db.query(
      `SELECT * FROM stored_files WHERE ${where}
       ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset],
    );
    return { data: rows, total: count.rows[0]?.count ?? 0, page, limit };
  }

  private totalsFromItems(items: any[]) {
    const normalized = (Array.isArray(items) ? items : []).map((item, index) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const unitPrice = Math.max(0, Number(item.unitPrice ?? item.unit_price) || 0);
      const taxRate = Math.max(0, Number(item.taxRate ?? item.tax_rate) || 0);
      const base = quantity * unitPrice;
      const lineTotal = base + base * taxRate;
      return {
        item_type: item.itemType ?? item.item_type ?? null,
        item_id: item.itemId ?? item.item_id ?? null,
        description: item.description || item.name || 'Item',
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        line_total: lineTotal,
        sort_order: index,
      };
    });
    const subtotal = normalized.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const tax = normalized.reduce((s, i) => s + (i.quantity * i.unit_price * i.tax_rate), 0);
    return { items: normalized, subtotal, tax };
  }

  async createEstimate(user: any, body: any) {
    await this.ensureSchema();
    const teamId = await this.oneTeam(user, body?.teamId);
    await this.assertContact(teamId, body?.contactId);
    const t = this.totalsFromItems(body?.items);
    const discount = Math.max(0, Number(body?.discountAmount) || 0);
    const total = Math.max(0, t.subtotal + t.tax - discount);
    const number = body?.estimateNumber || `EST-${Date.now().toString().slice(-8)}`;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      const est = await client.query(
        `INSERT INTO business_estimates
          (team_id,created_by,estimate_number,contact_id,customer_name,status,valid_until,currency,subtotal,tax_amount,discount_amount,total,notes,sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [teamId,user.id,number,body?.contactId??null,body?.customerName??null,body?.status??'draft',body?.validUntil??null,body?.currency??'USD',t.subtotal,t.tax,discount,total,body?.notes??null,(body?.status==='sent'?new Date():null)],
      );
      for (const item of t.items) {
        await client.query(
          `INSERT INTO business_estimate_items
            (team_id,estimate_id,item_type,item_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [teamId,est.rows[0].id,item.item_type,item.item_id,item.description,item.quantity,item.unit_price,item.tax_rate,item.line_total,item.sort_order],
        );
      }
      await client.query('COMMIT');
      await this.log(teamId,user.id,'estimate',est.rows[0].id,'created',`Estimate ${number}`,null,total);
      return est.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateEstimate(user: any, id: string, body: any) {
    // Header-only edits use generic update. Items are replaced when supplied.
    const row = await this.updateResource(user, 'estimates', id, body);
    if (Array.isArray(body?.items)) {
      const t = this.totalsFromItems(body.items);
      const discount = Math.max(0, Number(body?.discountAmount ?? row.discount_amount) || 0);
      const total = Math.max(0, t.subtotal + t.tax - discount);
      const client = await this.db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM business_estimate_items WHERE estimate_id=$1 AND team_id=$2`, [id,row.team_id]);
        for (const item of t.items) {
          await client.query(
            `INSERT INTO business_estimate_items
              (team_id,estimate_id,item_type,item_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [row.team_id,id,item.item_type,item.item_id,item.description,item.quantity,item.unit_price,item.tax_rate,item.line_total,item.sort_order],
          );
        }
        await client.query(
          `UPDATE business_estimates SET subtotal=$1,tax_amount=$2,discount_amount=$3,total=$4,updated_at=NOW() WHERE id=$5 AND team_id=$6`,
          [t.subtotal,t.tax,discount,total,id,row.team_id],
        );
        await client.query('COMMIT');
        return { ...row, subtotal:t.subtotal, tax_amount:t.tax, discount_amount:discount, total };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    return row;
  }

  async createInvoice(user: any, body: any) {
    await this.ensureSchema();
    const teamId = await this.oneTeam(user, body?.teamId);
    await this.assertContact(teamId, body?.contactId);
    const t = this.totalsFromItems(body?.items);
    const discount = Math.max(0, Number(body?.discountAmount) || 0);
    const total = Math.max(0, t.subtotal + t.tax - discount);
    const number = body?.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      const inv = await client.query(
        `INSERT INTO business_invoices
          (team_id,created_by,estimate_id,invoice_number,contact_id,customer_name,status,issue_date,due_date,currency,subtotal,tax_amount,discount_amount,total,amount_paid,outstanding,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,CURRENT_DATE),$9,$10,$11,$12,$13,$14,0,$14,$15)
         RETURNING *`,
        [teamId,user.id,body?.estimateId??null,number,body?.contactId??null,body?.customerName??null,body?.status??'open',body?.issueDate??null,body?.dueDate??null,body?.currency??'USD',t.subtotal,t.tax,discount,total,body?.notes??null],
      );
      for (const item of t.items) {
        await client.query(
          `INSERT INTO business_invoice_items
            (team_id,invoice_id,item_type,item_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [teamId,inv.rows[0].id,item.item_type,item.item_id,item.description,item.quantity,item.unit_price,item.tax_rate,item.line_total,item.sort_order],
        );
      }
      await client.query('COMMIT');
      await this.log(teamId,user.id,'invoice',inv.rows[0].id,'created',`Invoice ${number}`,null,total);
      return inv.rows[0];
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateInvoice(user: any, id: string, body: any) {
    const row = await this.updateResource(user, 'invoices', id, body);
    if (Array.isArray(body?.items)) {
      const t = this.totalsFromItems(body.items);
      const discount = Math.max(0, Number(body?.discountAmount ?? row.discount_amount) || 0);
      const total = Math.max(0, t.subtotal + t.tax - discount);
      const client = await this.db.getClient();
      try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM business_invoice_items WHERE invoice_id=$1 AND team_id=$2`, [id,row.team_id]);
        for (const item of t.items) {
          await client.query(
            `INSERT INTO business_invoice_items
              (team_id,invoice_id,item_type,item_id,description,quantity,unit_price,tax_rate,line_total,sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [row.team_id,id,item.item_type,item.item_id,item.description,item.quantity,item.unit_price,item.tax_rate,item.line_total,item.sort_order],
          );
        }
        await client.query(
          `UPDATE business_invoices
              SET subtotal=$1,tax_amount=$2,discount_amount=$3,total=$4,
                  outstanding=GREATEST($4-amount_paid,0),
                  status=CASE WHEN amount_paid >= $4 AND $4 > 0 THEN 'paid' ELSE status END,
                  updated_at=NOW()
            WHERE id=$5 AND team_id=$6`,
          [t.subtotal,t.tax,discount,total,id,row.team_id],
        );
        await client.query('COMMIT');
        return (await this.db.query(`SELECT * FROM business_invoices WHERE id=$1`,[id])).rows[0];
      } catch(e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    return row;
  }

  async convertEstimateToInvoice(user: any, id: string) {
    await this.ensureSchema();
    const ids = await this.accessibleTeamIds(user);
    const est = await this.db.query(`SELECT * FROM business_estimates WHERE id=$1 AND team_id=ANY($2::uuid[])`,[id,ids]);
    if (!est.rows.length) throw new NotFoundException('Estimate not found');
    const items = await this.db.query(
      `SELECT item_type AS "itemType", item_id AS "itemId", description, quantity,
              unit_price AS "unitPrice", tax_rate AS "taxRate"
         FROM business_estimate_items WHERE estimate_id=$1 AND team_id=$2 ORDER BY sort_order`,
      [id,est.rows[0].team_id],
    );
    const invoice = await this.createInvoice(user,{
      teamId:est.rows[0].team_id,
      estimateId:id,
      contactId:est.rows[0].contact_id,
      customerName:est.rows[0].customer_name,
      currency:est.rows[0].currency,
      discountAmount:est.rows[0].discount_amount,
      notes:est.rows[0].notes,
      status:'open',
      items:items.rows,
    });
    await this.db.query(`UPDATE business_estimates SET status='converted',updated_at=NOW() WHERE id=$1 AND team_id=$2`,[id,est.rows[0].team_id]);
    return invoice;
  }

  private async recalcInvoice(teamId: string, invoiceId: string) {
    const p = await this.db.query(
      `SELECT COALESCE(SUM(amount),0)::numeric AS paid
         FROM business_invoice_payments
        WHERE team_id=$1 AND invoice_id=$2 AND status='succeeded'`,
      [teamId,invoiceId],
    );
    const paid = Number(p.rows[0]?.paid || 0);
    const { rows } = await this.db.query(
      `UPDATE business_invoices
          SET amount_paid=$1,
              outstanding=GREATEST(total-$1,0),
              status=CASE
                WHEN total > 0 AND $1 >= total THEN 'paid'
                WHEN $1 > 0 THEN 'partial'
                WHEN status='paid' THEN 'open'
                ELSE status
              END,
              paid_at=CASE WHEN total > 0 AND $1 >= total THEN COALESCE(paid_at,NOW()) ELSE NULL END,
              updated_at=NOW()
        WHERE team_id=$2 AND id=$3
        RETURNING *`,
      [paid,teamId,invoiceId],
    );
    return rows[0];
  }

  async createPayment(user: any, body: any) {
    if (!body?.invoiceId && !body?.invoice_id) throw new BadRequestException('invoiceId is required');
    const ids = await this.accessibleTeamIds(user);
    const invoiceId = body.invoiceId ?? body.invoice_id;
    const inv = await this.db.query(`SELECT * FROM business_invoices WHERE id=$1 AND team_id=ANY($2::uuid[])`,[invoiceId,ids]);
    if (!inv.rows.length) throw new NotFoundException('Invoice not found');
    const teamId=inv.rows[0].team_id;
    const amount=Number(body?.amount)||0;
    if (amount <= 0) throw new BadRequestException('Payment amount must be greater than zero');
    const { rows }=await this.db.query(
      `INSERT INTO business_invoice_payments
       (team_id,created_by,invoice_id,amount,currency,method,reference,status,paid_at,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()),$10)
       RETURNING *`,
      [teamId,user.id,invoiceId,amount,body?.currency??inv.rows[0].currency??'USD',body?.method??null,body?.reference??null,body?.status??'succeeded',body?.paidAt??null,body?.notes??null],
    );
    const invoice=await this.recalcInvoice(teamId,invoiceId);
    await this.log(teamId,user.id,'payment',rows[0].id,'created',`Payment for ${inv.rows[0].invoice_number}`,body?.method??null,amount);
    return { payment:rows[0],invoice };
  }

  async updatePayment(user: any,id:string,body:any) {
    const row=await this.updateResource(user,'payments',id,body);
    const invoice=await this.recalcInvoice(row.team_id,row.invoice_id);
    return { payment:row,invoice };
  }

  async deletePayment(user:any,id:string) {
    await this.ensureSchema();
    const ids=await this.accessibleTeamIds(user);
    const { rows }=await this.db.query(
      `DELETE FROM business_invoice_payments WHERE id=$1 AND team_id=ANY($2::uuid[]) RETURNING *`,
      [id,ids],
    );
    if(!rows.length) throw new NotFoundException('Payment not found');
    const invoice=await this.recalcInvoice(rows[0].team_id,rows[0].invoice_id);
    await this.log(rows[0].team_id,user.id,'payment',id,'deleted','Payment deleted');
    return { success:true,invoice };
  }


  async listCustomers(user: any, query: any = {}) {
    await this.ensureSchema();
    const ids = await this.accessibleTeamIds(user);
    const { page, limit, offset } = this.page(query);
    if (!ids.length) return { data: [], total: 0, page, limit };
    const params: any[] = [ids];
    let where = `team_id = ANY($1::uuid[])`;
    if (query.search) {
      params.push(`%${String(query.search).trim()}%`);
      where += ` AND (name ILIKE $${params.length} OR COALESCE(email,'') ILIKE $${params.length} OR COALESCE(phone,'') ILIKE $${params.length})`;
    }
    const count = await this.db.query(`SELECT COUNT(*)::int AS count FROM contacts WHERE ${where}`, params);
    const rows = await this.db.query(
      `SELECT id,team_id,name,email,phone,status,type,source,tags,created_at,updated_at
         FROM contacts WHERE ${where}
         ORDER BY updated_at DESC NULLS LAST, created_at DESC
         LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset],
    );
    return { data: rows.rows, total: count.rows[0]?.count ?? 0, page, limit };
  }

  async getCustomersSummary(user: any) {
    await this.ensureSchema();
    const ids = await this.accessibleTeamIds(user);
    if (!ids.length) return { allCustomers:0, companies:0, contacts:0, customerGroups:0, segments:0 };
    const [contacts, companies, groups, segments] = await Promise.all([
      this.db.query(`SELECT COUNT(*)::int AS count FROM contacts WHERE team_id=ANY($1::uuid[])`, [ids]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM business_companies WHERE team_id=ANY($1::uuid[]) AND active=TRUE`, [ids]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM business_customer_groups WHERE team_id=ANY($1::uuid[]) AND active=TRUE`, [ids]),
      this.db.query(`SELECT COUNT(*)::int AS count FROM business_segments WHERE team_id=ANY($1::uuid[]) AND active=TRUE`, [ids]),
    ]);
    const contactCount = Number(contacts.rows[0]?.count || 0);
    const companyCount = Number(companies.rows[0]?.count || 0);
    return {
      allCustomers: contactCount + companyCount,
      companies: companyCount,
      contacts: contactCount,
      customerGroups: Number(groups.rows[0]?.count || 0),
      segments: Number(segments.rows[0]?.count || 0),
    };
  }

  async getOverview(user:any) {
    await this.ensureSchema();
    const ids=await this.accessibleTeamIds(user);
    if(!ids.length) return this.emptyOverview();

    const [invoiceKpi,taskKpi,estimateKpi,ops,billing,catalog,activity]=await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS total_invoices,
                COALESCE(SUM(amount_paid),0)::numeric AS paid_amount,
                COALESCE(SUM(outstanding),0)::numeric AS outstanding,
                COUNT(*) FILTER (WHERE outstanding > 0)::int AS outstanding_invoices
           FROM business_invoices WHERE team_id=ANY($1::uuid[])`,
        [ids],
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled'))::int AS open_tasks,
                COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled') AND due_date < NOW())::int AS overdue_tasks
           FROM team_tasks
          WHERE team_id=ANY($1::uuid[]) AND ('business-suite'=ANY(labels) OR task_type='business')`,
        [ids],
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE status IN ('sent','accepted','converted'))::int AS estimates_sent,
                COALESCE(SUM(total) FILTER (WHERE status IN ('sent','accepted','converted')),0)::numeric AS estimates_amount
           FROM business_estimates WHERE team_id=ANY($1::uuid[])`,
        [ids],
      ),
      this.db.query(
        `SELECT
          (SELECT COUNT(*) FROM team_tasks WHERE team_id=ANY($1::uuid[]) AND ('business-suite'=ANY(labels) OR task_type='business') AND status NOT IN ('completed','cancelled'))::int AS tasks,
          (SELECT COUNT(*) FROM business_follow_ups WHERE team_id=ANY($1::uuid[]) AND status NOT IN ('completed','cancelled'))::int AS follow_ups,
          (SELECT COUNT(*) FROM stored_files WHERE team_id=ANY($1::uuid[]) AND (folder='business-suite' OR folder LIKE 'business-suite/%'))::int AS documents,
          (SELECT COUNT(*) FROM business_work_items WHERE team_id=ANY($1::uuid[]) AND status NOT IN ('completed','cancelled'))::int AS work_items`,
        [ids],
      ),
      this.db.query(
        `SELECT
          (SELECT COUNT(*) FROM business_estimates WHERE team_id=ANY($1::uuid[]))::int AS estimates,
          (SELECT COUNT(*) FROM business_invoices WHERE team_id=ANY($1::uuid[]))::int AS invoices,
          (SELECT COUNT(*) FROM business_invoice_payments WHERE team_id=ANY($1::uuid[]) AND status='succeeded')::int AS payments,
          (SELECT COUNT(*) FROM business_expenses WHERE team_id=ANY($1::uuid[]))::int AS expenses`,
        [ids],
      ),
      this.db.query(
        `SELECT
          (SELECT COUNT(*) FROM business_products WHERE team_id=ANY($1::uuid[]) AND active=TRUE)::int AS products,
          (SELECT COUNT(*) FROM business_services WHERE team_id=ANY($1::uuid[]) AND active=TRUE)::int AS services,
          (SELECT COUNT(*) FROM business_price_lists WHERE team_id=ANY($1::uuid[]) AND active=TRUE)::int AS price_lists,
          (SELECT COUNT(*) FROM business_categories WHERE team_id=ANY($1::uuid[]) AND active=TRUE)::int AS categories`,
        [ids],
      ),
      this.db.query(
        `SELECT * FROM business_activity WHERE team_id=ANY($1::uuid[]) ORDER BY created_at DESC LIMIT 12`,
        [ids],
      ),
    ]);

    const i=invoiceKpi.rows[0]||{}, t=taskKpi.rows[0]||{}, e=estimateKpi.rows[0]||{};
    return {
      kpis:{
        totalInvoices:Number(i.total_invoices||0),
        paidAmount:Number(i.paid_amount||0),
        outstandingAmount:Number(i.outstanding||0),
        outstandingInvoices:Number(i.outstanding_invoices||0),
        openTasks:Number(t.open_tasks||0),
        overdueTasks:Number(t.overdue_tasks||0),
        estimatesSent:Number(e.estimates_sent||0),
        estimatesAmount:Number(e.estimates_amount||0),
      },
      operations:{
        tasks:Number(ops.rows[0]?.tasks||0),
        followUps:Number(ops.rows[0]?.follow_ups||0),
        documents:Number(ops.rows[0]?.documents||0),
        workItems:Number(ops.rows[0]?.work_items||0),
      },
      billing:{
        estimates:Number(billing.rows[0]?.estimates||0),
        invoices:Number(billing.rows[0]?.invoices||0),
        payments:Number(billing.rows[0]?.payments||0),
        expenses:Number(billing.rows[0]?.expenses||0),
      },
      catalog:{
        products:Number(catalog.rows[0]?.products||0),
        services:Number(catalog.rows[0]?.services||0),
        priceLists:Number(catalog.rows[0]?.price_lists||0),
        categories:Number(catalog.rows[0]?.categories||0),
      },
      recentActivity:activity.rows,
    };
  }

  private emptyOverview() {
    return {
      kpis:{totalInvoices:0,paidAmount:0,outstandingAmount:0,outstandingInvoices:0,openTasks:0,overdueTasks:0,estimatesSent:0,estimatesAmount:0},
      operations:{tasks:0,followUps:0,documents:0,workItems:0},
      billing:{estimates:0,invoices:0,payments:0,expenses:0},
      catalog:{products:0,services:0,priceLists:0,categories:0},
      recentActivity:[],
    };
  }

  async listActivity(user:any,limitRaw?:string) {
    await this.ensureSchema();
    const ids=await this.accessibleTeamIds(user);
    const limit=Math.min(100,Math.max(1,Number(limitRaw)||30));
    if(!ids.length) return [];
    return (await this.db.query(
      `SELECT * FROM business_activity WHERE team_id=ANY($1::uuid[]) ORDER BY created_at DESC LIMIT $2`,
      [ids,limit],
    )).rows;
  }

  async getReports(user:any,query:any={}) {
    await this.ensureSchema();
    const ids=await this.accessibleTeamIds(user);
    if(!ids.length) return { revenue:[], expenses:[], invoiceStatus:[] };
    const months=Math.min(24,Math.max(1,Number(query.months)||12));
    const [revenue,expenses,status]=await Promise.all([
      this.db.query(
        `SELECT date_trunc('month',paid_at)::date AS month,COALESCE(SUM(amount),0)::numeric AS amount
           FROM business_invoice_payments
          WHERE team_id=ANY($1::uuid[]) AND status='succeeded' AND paid_at >= NOW()-($2||' months')::interval
          GROUP BY 1 ORDER BY 1`,
        [ids,months],
      ),
      this.db.query(
        `SELECT date_trunc('month',expense_date)::date AS month,COALESCE(SUM(amount),0)::numeric AS amount
           FROM business_expenses
          WHERE team_id=ANY($1::uuid[]) AND expense_date >= CURRENT_DATE-($2||' months')::interval
          GROUP BY 1 ORDER BY 1`,
        [ids,months],
      ),
      this.db.query(
        `SELECT status,COUNT(*)::int AS count,COALESCE(SUM(total),0)::numeric AS amount
           FROM business_invoices WHERE team_id=ANY($1::uuid[]) GROUP BY status ORDER BY count DESC`,
        [ids],
      ),
    ]);
    return { revenue:revenue.rows,expenses:expenses.rows,invoiceStatus:status.rows };
  }

  async getSettings(user:any) {
    await this.ensureSchema();
    const teamId=await this.oneTeam(user);
    await this.db.query(`INSERT INTO business_settings(team_id) VALUES($1) ON CONFLICT(team_id) DO NOTHING`,[teamId]);
    return (await this.db.query(`SELECT * FROM business_settings WHERE team_id=$1`,[teamId])).rows[0];
  }

  async updateSettings(user:any,body:any) {
    await this.ensureSchema();
    const teamId=await this.oneTeam(user,body?.teamId);
    const currency=String(body?.currency||'USD').slice(0,8).toUpperCase();
    const invoicePrefix=String(body?.invoicePrefix||'INV').slice(0,20);
    const estimatePrefix=String(body?.estimatePrefix||'EST').slice(0,20);
    const terms=Math.max(0,Number(body?.paymentTermsDays)||0);
    const tax=Math.max(0,Number(body?.taxRate)||0);
    const { rows }=await this.db.query(
      `INSERT INTO business_settings(team_id,currency,invoice_prefix,estimate_prefix,payment_terms_days,tax_rate,updated_by)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(team_id) DO UPDATE SET
         currency=EXCLUDED.currency,invoice_prefix=EXCLUDED.invoice_prefix,
         estimate_prefix=EXCLUDED.estimate_prefix,payment_terms_days=EXCLUDED.payment_terms_days,
         tax_rate=EXCLUDED.tax_rate,updated_by=EXCLUDED.updated_by,updated_at=NOW()
       RETURNING *`,
      [teamId,currency,invoicePrefix,estimatePrefix,terms,tax,user.id],
    );
    await this.log(teamId,user.id,'settings',null,'updated','Business Suite settings updated');
    return rows[0];
  }
}
