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
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sales_proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        proposal_number TEXT,
        quote_id UUID,
        contact_id UUID,
        customer_name TEXT,
        segment TEXT,
        contact_name TEXT,
        contact_role TEXT,
        deal_name TEXT,
        value NUMERIC(14,2),
        status TEXT NOT NULL DEFAULT 'Draft',
        valid_until DATE,
        owner_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_proposals_team ON sales_proposals(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_proposals_quote ON sales_proposals(quote_id)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        order_number TEXT,
        quote_id UUID,
        proposal_id UUID,
        contact_id UUID,
        customer_name TEXT,
        segment TEXT,
        contact_name TEXT,
        contact_role TEXT,
        deal_name TEXT,
        value NUMERIC(14,2),
        status TEXT NOT NULL DEFAULT 'Pending',
        owner_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_orders_team ON sales_orders(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_orders_contact ON sales_orders(contact_id)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sales_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        contract_number TEXT,
        proposal_id UUID,
        order_id UUID,
        contact_id UUID,
        customer_name TEXT,
        segment TEXT,
        contact_name TEXT,
        contact_role TEXT,
        deal_name TEXT,
        value NUMERIC(14,2),
        status TEXT NOT NULL DEFAULT 'Draft',
        start_date DATE,
        end_date DATE,
        owner_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_contracts_team ON sales_contracts(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON sales_contracts(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_contracts_contact ON sales_contracts(contact_id)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS sales_returns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        return_number TEXT,
        order_id UUID,
        contact_id UUID,
        customer_name TEXT,
        segment TEXT,
        contact_name TEXT,
        contact_role TEXT,
        reason TEXT,
        value NUMERIC(14,2),
        status TEXT NOT NULL DEFAULT 'Requested',
        completed_date DATE,
        owner_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_returns_team ON sales_returns(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_sales_returns_order ON sales_returns(order_id)`,
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

  // Does an id still exist in this team? Used by the convert flows to drop a
  // carried-forward link whose referent was since deleted, rather than aborting an
  // otherwise-valid conversion. The table name is a fixed internal literal.
  private async refExists(
    table: 'contacts' | 'sales_quotes' | 'sales_proposals',
    id: string | null | undefined,
    teamId: string,
  ): Promise<boolean> {
    if (!id) return false;
    const { rows } = await this.db.query(
      `SELECT 1 FROM ${table} WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    return rows.length > 0;
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

  // ─── Proposals ───────────────────────────────────────────────────────────

  private readonly proposalSelect = `
    p.id,
    p.team_id AS "teamId",
    p.proposal_number AS "proposalNumber",
    p.quote_id AS "quoteId",
    q.quote_number AS "quoteNumber",
    p.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(p.customer_name), ''), ct.name) AS "customerName",
    p.segment,
    COALESCE(NULLIF(TRIM(p.contact_name), ''), ct.name) AS "contactName",
    p.contact_role AS "contactRole",
    p.deal_name AS "dealName",
    p.value,
    p.status,
    p.valid_until AS "validUntil",
    p.owner_name AS "ownerName",
    p.notes,
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
  `;
  private readonly proposalJoins = `
    LEFT JOIN contacts ct ON ct.id = p.contact_id AND ct.team_id = p.team_id
    LEFT JOIN sales_quotes q ON q.id = p.quote_id AND q.team_id = p.team_id
  `;

  private async generateProposalNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM sales_proposals
        WHERE team_id = $1 AND proposal_number LIKE $2`,
      [teamId, `PROP-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `PROP-${year}-${String(seq).padStart(4, '0')}`;
  }

  private async assertQuoteInTeam(quoteId: string, teamId: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT * FROM sales_quotes WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [quoteId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected quote is not in this account');
    }
    return rows[0];
  }

  async findAllProposals(
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

    const where: string[] = ['p.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`p.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(p.proposal_number ILIKE $${i} OR p.customer_name ILIKE $${i} OR p.contact_name ILIKE $${i} OR p.deal_name ILIKE $${i} OR p.owner_name ILIKE $${i} OR ct.name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM sales_proposals p ${this.proposalJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.proposalSelect} FROM sales_proposals p ${this.proposalJoins}
        WHERE ${whereSql} ORDER BY p.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneProposal(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Proposal not found');
    const { rows } = await this.db.query(
      `SELECT ${this.proposalSelect} FROM sales_proposals p ${this.proposalJoins}
        WHERE p.id = $1 AND p.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Proposal not found');
    return rows[0];
  }

  async createProposal(
    dto: any,
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
    if (dto.quoteId) await this.assertQuoteInTeam(dto.quoteId, teamId);
    const proposalNumber =
      (dto.proposalNumber && dto.proposalNumber.trim()) ||
      (await this.generateProposalNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO sales_proposals
         (team_id, created_by, proposal_number, quote_id, contact_id, customer_name,
          segment, contact_name, contact_role, deal_name, value, status, valid_until,
          owner_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        teamId,
        userId,
        proposalNumber,
        dto.quoteId || null,
        dto.contactId || null,
        dto.customerName || null,
        dto.segment || null,
        dto.contactName || null,
        dto.contactRole || null,
        dto.dealName || null,
        dto.value ?? null,
        (dto.status && dto.status.trim()) || 'Draft',
        dto.validUntil || null,
        dto.ownerName || null,
        dto.notes || null,
      ],
    );
    return this.findOneProposal(rows[0].id, userId, userTeamId, role);
  }

  async updateProposal(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Proposal not found');
    const existing = await this.db.query(
      `SELECT team_id FROM sales_proposals WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Proposal not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    if (dto.quoteId) await this.assertQuoteInTeam(dto.quoteId, teamId);
    const colFor: Record<string, string> = {
      proposalNumber: 'proposal_number',
      quoteId: 'quote_id',
      contactId: 'contact_id',
      customerName: 'customer_name',
      segment: 'segment',
      contactName: 'contact_name',
      contactRole: 'contact_role',
      dealName: 'deal_name',
      value: 'value',
      status: 'status',
      validUntil: 'valid_until',
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
    if (!sets.length) return this.findOneProposal(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE sales_proposals SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneProposal(id, userId, userTeamId, role);
  }

  async removeProposal(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Proposal not found');
    const res = await this.db.query(
      `DELETE FROM sales_proposals WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Proposal not found');
    return { success: true };
  }

  // Create a proposal from an existing quote, carrying the customer/contact/deal/
  // value forward and keeping the quote_id link.
  async convertQuoteToProposal(
    quoteId: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Quote not found');
    const q = await this.db.query(
      `SELECT * FROM sales_quotes WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [quoteId, accessible],
    );
    if (!q.rows.length) throw new NotFoundException('Quote not found');
    const quote = q.rows[0];
    // Drop a carried-forward contact link if it was since deleted (the quote id
    // itself is valid — we just loaded it), so a stale link can't block the convert.
    const contactId = (await this.refExists('contacts', quote.contact_id, quote.team_id))
      ? quote.contact_id
      : undefined;
    return this.createProposal(
      {
        quoteId,
        contactId,
        customerName: quote.customer_name || undefined,
        segment: quote.segment || undefined,
        contactName: quote.contact_name || undefined,
        contactRole: quote.contact_role || undefined,
        dealName: quote.deal_name || undefined,
        value: quote.value != null ? Number(quote.value) : undefined,
        ownerName: quote.owner_name || undefined,
        status: 'Draft',
        teamId: quote.team_id,
      },
      userId,
      userTeamId,
      role,
    );
  }

  // ─── Orders ──────────────────────────────────────────────────────────────

  private readonly orderSelect = `
    o.id,
    o.team_id AS "teamId",
    o.order_number AS "orderNumber",
    o.quote_id AS "quoteId",
    o.proposal_id AS "proposalId",
    o.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(o.customer_name), ''), ct.name) AS "customerName",
    o.segment,
    COALESCE(NULLIF(TRIM(o.contact_name), ''), ct.name) AS "contactName",
    o.contact_role AS "contactRole",
    o.deal_name AS "dealName",
    o.value,
    o.status,
    o.owner_name AS "ownerName",
    o.notes,
    o.created_at AS "createdAt",
    o.updated_at AS "updatedAt"
  `;
  private readonly orderJoins = `
    LEFT JOIN contacts ct ON ct.id = o.contact_id AND ct.team_id = o.team_id
  `;

  private async generateOrderNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM sales_orders
        WHERE team_id = $1 AND order_number LIKE $2`,
      [teamId, `SO-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `SO-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllOrders(
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

    const where: string[] = ['o.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`o.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(o.order_number ILIKE $${i} OR o.customer_name ILIKE $${i} OR o.contact_name ILIKE $${i} OR o.deal_name ILIKE $${i} OR o.owner_name ILIKE $${i} OR ct.name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM sales_orders o ${this.orderJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.orderSelect} FROM sales_orders o ${this.orderJoins}
        WHERE ${whereSql} ORDER BY o.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneOrder(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Order not found');
    const { rows } = await this.db.query(
      `SELECT ${this.orderSelect} FROM sales_orders o ${this.orderJoins}
        WHERE o.id = $1 AND o.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Order not found');
    return rows[0];
  }

  async createOrder(
    dto: any,
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
    if (dto.quoteId) await this.assertQuoteInTeam(dto.quoteId, teamId);
    if (dto.proposalId) await this.assertProposalInTeam(dto.proposalId, teamId);
    const orderNumber =
      (dto.orderNumber && dto.orderNumber.trim()) ||
      (await this.generateOrderNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO sales_orders
         (team_id, created_by, order_number, quote_id, proposal_id, contact_id,
          customer_name, segment, contact_name, contact_role, deal_name, value,
          status, owner_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        teamId,
        userId,
        orderNumber,
        dto.quoteId || null,
        dto.proposalId || null,
        dto.contactId || null,
        dto.customerName || null,
        dto.segment || null,
        dto.contactName || null,
        dto.contactRole || null,
        dto.dealName || null,
        dto.value ?? null,
        (dto.status && dto.status.trim()) || 'Pending',
        dto.ownerName || null,
        dto.notes || null,
      ],
    );
    return this.findOneOrder(rows[0].id, userId, userTeamId, role);
  }

  private async assertProposalInTeam(
    proposalId: string,
    teamId: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM sales_proposals WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [proposalId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected proposal is not in this account');
    }
  }

  async updateOrder(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Order not found');
    const existing = await this.db.query(
      `SELECT team_id FROM sales_orders WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Order not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    if (dto.quoteId) await this.assertQuoteInTeam(dto.quoteId, teamId);
    if (dto.proposalId) await this.assertProposalInTeam(dto.proposalId, teamId);
    const colFor: Record<string, string> = {
      orderNumber: 'order_number',
      quoteId: 'quote_id',
      proposalId: 'proposal_id',
      contactId: 'contact_id',
      customerName: 'customer_name',
      segment: 'segment',
      contactName: 'contact_name',
      contactRole: 'contact_role',
      dealName: 'deal_name',
      value: 'value',
      status: 'status',
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
    if (!sets.length) return this.findOneOrder(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE sales_orders SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneOrder(id, userId, userTeamId, role);
  }

  async removeOrder(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Order not found');
    const res = await this.db.query(
      `DELETE FROM sales_orders WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Order not found');
    return { success: true };
  }

  // Create an order from an accepted proposal, carrying fields forward and keeping
  // the quote_id + proposal_id links.
  async convertProposalToOrder(
    proposalId: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Proposal not found');
    const p = await this.db.query(
      `SELECT * FROM sales_proposals WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [proposalId, accessible],
    );
    if (!p.rows.length) throw new NotFoundException('Proposal not found');
    const prop = p.rows[0];
    // Drop any carried-forward link (quote/contact) that was since deleted so a
    // stale reference can't block converting an otherwise-valid proposal.
    const quoteId = (await this.refExists('sales_quotes', prop.quote_id, prop.team_id))
      ? prop.quote_id
      : undefined;
    const contactId = (await this.refExists('contacts', prop.contact_id, prop.team_id))
      ? prop.contact_id
      : undefined;
    return this.createOrder(
      {
        proposalId,
        quoteId,
        contactId,
        customerName: prop.customer_name || undefined,
        segment: prop.segment || undefined,
        contactName: prop.contact_name || undefined,
        contactRole: prop.contact_role || undefined,
        dealName: prop.deal_name || undefined,
        value: prop.value != null ? Number(prop.value) : undefined,
        ownerName: prop.owner_name || undefined,
        status: 'Pending',
        teamId: prop.team_id,
      },
      userId,
      userTeamId,
      role,
    );
  }

  private async assertOrderInTeam(orderId: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM sales_orders WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [orderId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected order is not in this account');
    }
  }

  // ─── Contracts ───────────────────────────────────────────────────────────

  private readonly contractSelect = `
    c.id,
    c.team_id AS "teamId",
    c.contract_number AS "contractNumber",
    c.proposal_id AS "proposalId",
    c.order_id AS "orderId",
    c.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(c.customer_name), ''), ct.name) AS "customerName",
    c.segment,
    COALESCE(NULLIF(TRIM(c.contact_name), ''), ct.name) AS "contactName",
    c.contact_role AS "contactRole",
    c.deal_name AS "dealName",
    c.value,
    c.status,
    c.start_date AS "startDate",
    c.end_date AS "endDate",
    c.owner_name AS "ownerName",
    c.notes,
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
  `;
  private readonly contractJoins = `
    LEFT JOIN contacts ct ON ct.id = c.contact_id AND ct.team_id = c.team_id
  `;

  private async generateContractNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM sales_contracts
        WHERE team_id = $1 AND contract_number LIKE $2`,
      [teamId, `CON-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `CON-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllContracts(
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

    const where: string[] = ['c.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`c.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(c.contract_number ILIKE $${i} OR c.customer_name ILIKE $${i} OR c.contact_name ILIKE $${i} OR c.deal_name ILIKE $${i} OR c.owner_name ILIKE $${i} OR ct.name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM sales_contracts c ${this.contractJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.contractSelect} FROM sales_contracts c ${this.contractJoins}
        WHERE ${whereSql} ORDER BY c.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneContract(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Contract not found');
    const { rows } = await this.db.query(
      `SELECT ${this.contractSelect} FROM sales_contracts c ${this.contractJoins}
        WHERE c.id = $1 AND c.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Contract not found');
    return rows[0];
  }

  async createContract(
    dto: any,
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
    if (dto.proposalId) await this.assertProposalInTeam(dto.proposalId, teamId);
    if (dto.orderId) await this.assertOrderInTeam(dto.orderId, teamId);
    const contractNumber =
      (dto.contractNumber && dto.contractNumber.trim()) ||
      (await this.generateContractNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO sales_contracts
         (team_id, created_by, contract_number, proposal_id, order_id, contact_id,
          customer_name, segment, contact_name, contact_role, deal_name, value,
          status, start_date, end_date, owner_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        teamId,
        userId,
        contractNumber,
        dto.proposalId || null,
        dto.orderId || null,
        dto.contactId || null,
        dto.customerName || null,
        dto.segment || null,
        dto.contactName || null,
        dto.contactRole || null,
        dto.dealName || null,
        dto.value ?? null,
        (dto.status && dto.status.trim()) || 'Draft',
        dto.startDate || null,
        dto.endDate || null,
        dto.ownerName || null,
        dto.notes || null,
      ],
    );
    return this.findOneContract(rows[0].id, userId, userTeamId, role);
  }

  async updateContract(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Contract not found');
    const existing = await this.db.query(
      `SELECT team_id FROM sales_contracts WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Contract not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    if (dto.proposalId) await this.assertProposalInTeam(dto.proposalId, teamId);
    if (dto.orderId) await this.assertOrderInTeam(dto.orderId, teamId);
    const colFor: Record<string, string> = {
      contractNumber: 'contract_number',
      proposalId: 'proposal_id',
      orderId: 'order_id',
      contactId: 'contact_id',
      customerName: 'customer_name',
      segment: 'segment',
      contactName: 'contact_name',
      contactRole: 'contact_role',
      dealName: 'deal_name',
      value: 'value',
      status: 'status',
      startDate: 'start_date',
      endDate: 'end_date',
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
    if (!sets.length) return this.findOneContract(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE sales_contracts SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneContract(id, userId, userTeamId, role);
  }

  async removeContract(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Contract not found');
    const res = await this.db.query(
      `DELETE FROM sales_contracts WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Contract not found');
    return { success: true };
  }

  // ─── Returns ─────────────────────────────────────────────────────────────

  private readonly returnSelect = `
    r.id,
    r.team_id AS "teamId",
    r.return_number AS "returnNumber",
    r.order_id AS "orderId",
    o.order_number AS "orderNumber",
    r.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(r.customer_name), ''), ct.name) AS "customerName",
    r.segment,
    COALESCE(NULLIF(TRIM(r.contact_name), ''), ct.name) AS "contactName",
    r.contact_role AS "contactRole",
    r.reason,
    r.value,
    r.status,
    r.completed_date AS "completedDate",
    r.owner_name AS "ownerName",
    r.notes,
    r.created_at AS "createdAt",
    r.updated_at AS "updatedAt"
  `;
  private readonly returnJoins = `
    LEFT JOIN contacts ct ON ct.id = r.contact_id AND ct.team_id = r.team_id
    LEFT JOIN sales_orders o ON o.id = r.order_id AND o.team_id = r.team_id
  `;

  private async generateReturnNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM sales_returns
        WHERE team_id = $1 AND return_number LIKE $2`,
      [teamId, `RET-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `RET-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllReturns(
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

    const where: string[] = ['r.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`r.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(r.return_number ILIKE $${i} OR r.customer_name ILIKE $${i} OR r.contact_name ILIKE $${i} OR r.owner_name ILIKE $${i} OR ct.name ILIKE $${i} OR o.order_number ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM sales_returns r ${this.returnJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.returnSelect} FROM sales_returns r ${this.returnJoins}
        WHERE ${whereSql} ORDER BY r.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneReturn(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Return not found');
    const { rows } = await this.db.query(
      `SELECT ${this.returnSelect} FROM sales_returns r ${this.returnJoins}
        WHERE r.id = $1 AND r.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Return not found');
    return rows[0];
  }

  async createReturn(
    dto: any,
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
    if (dto.orderId) await this.assertOrderInTeam(dto.orderId, teamId);
    const returnNumber =
      (dto.returnNumber && dto.returnNumber.trim()) ||
      (await this.generateReturnNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO sales_returns
         (team_id, created_by, return_number, order_id, contact_id, customer_name,
          segment, contact_name, contact_role, reason, value, status, completed_date,
          owner_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        teamId,
        userId,
        returnNumber,
        dto.orderId || null,
        dto.contactId || null,
        dto.customerName || null,
        dto.segment || null,
        dto.contactName || null,
        dto.contactRole || null,
        dto.reason || null,
        dto.value ?? null,
        (dto.status && dto.status.trim()) || 'Requested',
        dto.completedDate || null,
        dto.ownerName || null,
        dto.notes || null,
      ],
    );
    return this.findOneReturn(rows[0].id, userId, userTeamId, role);
  }

  async updateReturn(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Return not found');
    const existing = await this.db.query(
      `SELECT team_id FROM sales_returns WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Return not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    if (dto.orderId) await this.assertOrderInTeam(dto.orderId, teamId);
    const colFor: Record<string, string> = {
      returnNumber: 'return_number',
      orderId: 'order_id',
      contactId: 'contact_id',
      customerName: 'customer_name',
      segment: 'segment',
      contactName: 'contact_name',
      contactRole: 'contact_role',
      reason: 'reason',
      value: 'value',
      status: 'status',
      completedDate: 'completed_date',
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
    if (!sets.length) return this.findOneReturn(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE sales_returns SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneReturn(id, userId, userTeamId, role);
  }

  async removeReturn(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Return not found');
    const res = await this.db.query(
      `DELETE FROM sales_returns WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Return not found');
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

    const [openQ, openP, ordersM] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(value),0) AS value
           FROM sales_quotes
          WHERE team_id = ANY($1) AND status IN ('Draft','Sent','Viewed')`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(value),0) AS value
           FROM sales_proposals
          WHERE team_id = ANY($1) AND status IN ('Draft','Sent','Viewed')`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(value),0) AS value
           FROM sales_orders
          WHERE team_id = ANY($1)
            AND status NOT IN ('Cancelled')
            AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
        [accessible],
      ),
    ]);

    return {
      ...zero,
      openQuotes: {
        count: openQ.rows[0].count,
        value: num(openQ.rows[0].value),
      },
      openProposals: {
        count: openP.rows[0].count,
        value: num(openP.rows[0].value),
      },
      ordersThisMonth: {
        count: ordersM.rows[0].count,
        value: num(ordersM.rows[0].value),
      },
    };
  }
}
