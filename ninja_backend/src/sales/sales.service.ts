import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSalesQuoteDto } from './dto/create-sales-quote.dto';
import { UpdateSalesQuoteDto } from './dto/update-sales-quote.dto';

const OWNER_ROLE = 'owner';

// Sales Workspace backend. Reuses the Cortexa tenant model: the account boundary
// is the TEAM, so every row carries team_id and every query is scoped to the
// teams the caller can access. Contacts/leads/pipeline/users are reused, never
// duplicated.
@Injectable()
export class SalesService {
  constructor(private readonly db: DatabaseService) {}

  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sales_quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        quote_number TEXT,
        contact_id UUID,
        customer_name TEXT,
        segment TEXT,
        contact_name TEXT,
        contact_role TEXT,
        deal_id UUID,
        deal_name TEXT,
        stage TEXT,
        value NUMERIC(14,2),
        status TEXT NOT NULL DEFAULT 'Draft',
        valid_until DATE,
        owner_id UUID,
        owner_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_quotes_team ON sales_quotes(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_quotes_contact ON sales_quotes(contact_id)`,
    );
    this.schemaReady = true;
  }

  // The set of team ids this caller may read/write, identical to the CRM/Insurance
  // rule so the workspaces never disagree on what an account can see.
  private async getAccessibleTeamIds(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<string[]> {
    if (role === OWNER_ROLE) {
      const { rows } = await this.db.query(
        `SELECT t.id FROM teams t
          WHERE t.owner_id = $1
             OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)`,
        [userId],
      );
      return rows.map((r: { id: string }) => r.id);
    }
    if (userTeamId) return [userTeamId];
    return [];
  }

  private resolveTeamId(
    dtoTeamId: string | undefined,
    userTeamId: string | null,
    accessible: string[],
  ): string {
    const candidate =
      dtoTeamId && accessible.includes(dtoTeamId)
        ? dtoTeamId
        : userTeamId && accessible.includes(userTeamId)
          ? userTeamId
          : accessible[0];
    if (!candidate || !accessible.includes(candidate)) {
      throw new ForbiddenException('You do not have access to this team');
    }
    return candidate;
  }

  // Validate a linked contact belongs to the same account (reuse the shared
  // contacts table; never link across tenants).
  private async assertContactInTeam(
    contactId: string,
    teamId: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM contacts WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [contactId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected contact is not in this account');
    }
  }

  // Search the account's EXISTING Cortexa contacts to attach one to a quote.
  async searchContacts(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    // Scope to the single team a new quote would save into, so the picker never
    // offers a contact that createQuote's in-team check would then reject.
    const teamId = this.resolveTeamId(undefined, userTeamId, accessible);
    const term = (search || '').trim();
    const params: any[] = [teamId];
    let where = 'team_id = $1';
    if (term) {
      params.push(`%${term}%`);
      where += ` AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`;
    }
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone FROM contacts
        WHERE ${where}
        ORDER BY name ASC NULLS LAST
        LIMIT 20`,
      params,
    );
    return rows;
  }

  // Q-YYYY-NNNN, sequential per team per year. Concurrency caveat (same as the
  // Insurance number generators) is acceptable for V1.
  private async generateQuoteNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM sales_quotes
        WHERE team_id = $1 AND quote_number LIKE $2`,
      [teamId, `Q-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `Q-${year}-${String(seq).padStart(4, '0')}`;
  }

  private readonly quoteSelect = `
    q.id,
    q.team_id AS "teamId",
    q.created_by AS "createdBy",
    q.quote_number AS "quoteNumber",
    q.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(q.customer_name), ''), ct.name) AS "customerName",
    q.segment,
    COALESCE(NULLIF(TRIM(q.contact_name), ''), ct.name) AS "contactName",
    q.contact_role AS "contactRole",
    q.deal_id AS "dealId",
    q.deal_name AS "dealName",
    q.stage,
    q.value,
    q.status,
    q.valid_until AS "validUntil",
    q.owner_id AS "ownerId",
    q.owner_name AS "ownerName",
    q.notes,
    q.created_at AS "createdAt",
    q.updated_at AS "updatedAt"
  `;

  private readonly quoteJoins = `
    LEFT JOIN contacts ct ON ct.id = q.contact_id AND ct.team_id = q.team_id
  `;

  async findAllQuotes(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: { search?: string; status?: string; page?: string; limit?: string },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['q.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`q.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(q.quote_number ILIKE $${i} OR q.customer_name ILIKE $${i} OR q.contact_name ILIKE $${i} OR q.deal_name ILIKE $${i} OR q.owner_name ILIKE $${i} OR ct.name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM sales_quotes q ${this.quoteJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.db.query(
      `SELECT ${this.quoteSelect} FROM sales_quotes q ${this.quoteJoins}
        WHERE ${whereSql}
        ORDER BY q.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneQuote(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Quote not found');
    const { rows } = await this.db.query(
      `SELECT ${this.quoteSelect} FROM sales_quotes q ${this.quoteJoins}
        WHERE q.id = $1 AND q.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Quote not found');
    return rows[0];
  }

  async createQuote(
    dto: CreateSalesQuoteDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You do not have access to this account');
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);

    const quoteNumber =
      (dto.quoteNumber && dto.quoteNumber.trim()) ||
      (await this.generateQuoteNumber(teamId));

    const { rows } = await this.db.query(
      `INSERT INTO sales_quotes
         (team_id, created_by, quote_number, contact_id, customer_name, segment,
          contact_name, contact_role, deal_id, deal_name, stage, value, status,
          valid_until, owner_id, owner_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        teamId,
        userId,
        quoteNumber,
        dto.contactId || null,
        dto.customerName || null,
        dto.segment || null,
        dto.contactName || null,
        dto.contactRole || null,
        dto.dealId || null,
        dto.dealName || null,
        dto.stage || null,
        dto.value ?? null,
        (dto.status && dto.status.trim()) || 'Draft',
        dto.validUntil || null,
        dto.ownerId || null,
        dto.ownerName || null,
        dto.notes || null,
      ],
    );
    return this.findOneQuote(rows[0].id, userId, userTeamId, role);
  }

  async updateQuote(
    id: string,
    dto: UpdateSalesQuoteDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Quote not found');

    // Confirm the quote is in the caller's account before any write.
    const existing = await this.db.query(
      `SELECT team_id FROM sales_quotes WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Quote not found');
    const teamId = existing.rows[0].team_id;

    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);

    // Map dto keys -> columns; a key present (even null) updates, absent is left.
    const colFor: Record<string, string> = {
      quoteNumber: 'quote_number',
      contactId: 'contact_id',
      customerName: 'customer_name',
      segment: 'segment',
      contactName: 'contact_name',
      contactRole: 'contact_role',
      dealId: 'deal_id',
      dealName: 'deal_name',
      stage: 'stage',
      value: 'value',
      status: 'status',
      validUntil: 'valid_until',
      ownerId: 'owner_id',
      ownerName: 'owner_name',
      notes: 'notes',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(colFor)) {
      if ((dto as any)[key] !== undefined) {
        sets.push(`${col} = $${i++}`);
        vals.push((dto as any)[key]);
      }
    }
    if (!sets.length) {
      return this.findOneQuote(id, userId, userTeamId, role);
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE sales_quotes SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneQuote(id, userId, userTeamId, role);
  }

  async removeQuote(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Quote not found');
    const res = await this.db.query(
      `DELETE FROM sales_quotes WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Quote not found');
    return { success: true };
  }

  // Overview KPIs. In this first slice only Quotes exist, so quote-derived KPIs
  // are real and the rest report a neutral zero until their tabs are wired (no
  // invented numbers). Later slices expand this as each entity lands.
  async getStats(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    const zero = {
      openQuotes: { count: 0, value: 0 },
      openProposals: { count: 0, value: 0 },
      ordersThisMonth: { count: 0, value: 0 },
      outstandingInvoices: { count: 0, value: 0 },
      commissionsDue: { count: 0, amount: 0 },
      conversionRate: { percent: 0 },
      pipeline: [],
      recentActivity: [],
      topReps: [],
    };
    if (!accessible.length) return zero;
    const num = (v: any) => Number(v) || 0;

    const openQ = await this.db.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(value),0) AS value
         FROM sales_quotes
        WHERE team_id = ANY($1) AND status IN ('Draft','Sent','Viewed')`,
      [accessible],
    );

    return {
      ...zero,
      openQuotes: {
        count: openQ.rows[0].count,
        value: num(openQ.rows[0].value),
      },
    };
  }
}
