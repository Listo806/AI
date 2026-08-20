import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../integrations/storage/storage.service';

const OWNER_ROLE = 'owner';

// Financial Services Workspace backend. Reuses the Cortexa tenant model: the
// account boundary is the TEAM, so every row carries team_id and every query is
// scoped to the teams the caller can access. Contacts/users are reused, never
// duplicated. This is a CRM/tracking system — never a bank/broker/custodian; AUM
// and balances are recorded figures, not live custodial data.
@Injectable()
export class FinancialService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {}

  // A well-formed UUID. Used to reject malformed ids with a 400 before Postgres
  // raises a 22P02 (invalid uuid) that would otherwise surface as a 500.
  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private assertUuidOrBlank(value: string | undefined | null, label: string): void {
    if (value && !FinancialService.UUID_RE.test(String(value))) {
      throw new BadRequestException(`Invalid ${label} reference`);
    }
  }

  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        client_number TEXT,
        contact_id UUID,
        client_name TEXT,
        kind TEXT,
        client_type TEXT,
        advisor_id UUID,
        advisor_name TEXT,
        account_type TEXT,
        aum NUMERIC(16,2),
        risk_level TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        last_activity_at TIMESTAMP,
        next_review_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_clients_team ON financial_clients(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_clients_status ON financial_clients(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_clients_contact ON financial_clients(contact_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_clients_review ON financial_clients(next_review_date)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        application_number TEXT,
        client_id UUID,
        account_id UUID,
        client_name TEXT,
        application_type TEXT,
        advisor_name TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        submitted_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_applications_team ON financial_applications(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_applications_status ON financial_applications(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_applications_client ON financial_applications(client_id)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        account_number TEXT,
        client_id UUID,
        application_id UUID,
        client_name TEXT,
        account_type TEXT,
        advisor_name TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        balance NUMERIC(16,2),
        opened_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_accounts_team ON financial_accounts(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_accounts_status ON financial_accounts(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_accounts_client ON financial_accounts(client_id)`,
    );
    // Transactions: CRM tracking records of money movement (never execution).
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        transaction_number TEXT,
        account_id UUID,
        client_id UUID,
        transaction_type TEXT,
        amount NUMERIC(16,2),
        status TEXT NOT NULL DEFAULT 'Completed',
        transaction_date DATE,
        description TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_transactions_team ON financial_transactions(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_transactions_account ON financial_transactions(account_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_transactions_client ON financial_transactions(client_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date)`,
    );
    // Investments: CRM records of holdings; recorded value only (no live prices).
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_investments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        investment_number TEXT,
        account_id UUID,
        client_id UUID,
        name TEXT,
        category TEXT,
        amount NUMERIC(16,2),
        units NUMERIC(18,4),
        status TEXT NOT NULL DEFAULT 'Active',
        as_of_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_investments_team ON financial_investments(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_investments_status ON financial_investments(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_investments_account ON financial_investments(account_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_investments_client ON financial_investments(client_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_investments_category ON financial_investments(category)`,
    );
    // Documents: metadata for private S3 objects (bytes never leave the bucket).
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        stored_file_id UUID NOT NULL,
        title TEXT,
        doc_type TEXT,
        client_id UUID,
        account_id UUID,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_documents_team ON financial_documents(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_documents_client ON financial_documents(client_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_documents_account ON financial_documents(account_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_documents_file ON financial_documents(stored_file_id)`,
    );
    // Commissions: recorded fee revenue (kept separate from AUM and balances).
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS financial_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        commission_number TEXT,
        client_id UUID,
        account_id UUID,
        advisor_name TEXT,
        amount NUMERIC(16,2),
        rate NUMERIC(6,3),
        status TEXT NOT NULL DEFAULT 'Pending',
        commission_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_commissions_team ON financial_commissions(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_commissions_status ON financial_commissions(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_commissions_client ON financial_commissions(client_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_commissions_account ON financial_commissions(account_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_financial_commissions_date ON financial_commissions(commission_date)`,
    );
    this.schemaReady = true;
  }

  private async assertClientInTeam(clientId: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM financial_clients WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [clientId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected client is not in this account');
    }
  }

  private async assertApplicationInTeam(applicationId: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM financial_applications WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [applicationId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected application is not in this account');
    }
  }

  private async assertAccountInTeam(accountId: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM financial_accounts WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [accountId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected account is not in this account');
    }
  }

  /** Search financial clients (for a client picker), team-scoped. */
  async searchClients(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    const term = (search || '').trim();
    const params: any[] = [accessible];
    let where = 'fc.team_id = ANY($1)';
    if (term) {
      params.push(`%${term}%`);
      where += ` AND (fc.client_name ILIKE $2 OR fc.client_number ILIKE $2 OR ct.name ILIKE $2)`;
    }
    const { rows } = await this.db.query(
      `SELECT fc.id,
              COALESCE(NULLIF(TRIM(fc.client_name), ''), ct.name) AS name,
              fc.client_number AS "clientNumber"
         FROM financial_clients fc ${this.clientJoins}
        WHERE ${where} ORDER BY fc.created_at DESC LIMIT 20`,
      params,
    );
    return rows;
  }

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

  async searchContacts(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
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
        WHERE ${where} ORDER BY name ASC NULLS LAST LIMIT 20`,
      params,
    );
    return rows;
  }

  private async generateClientNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_clients
        WHERE team_id = $1 AND client_number LIKE $2`,
      [teamId, `CL-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `CL-${year}-${String(seq).padStart(4, '0')}`;
  }

  private readonly clientSelect = `
    fc.id,
    fc.team_id AS "teamId",
    fc.client_number AS "clientNumber",
    fc.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(fc.client_name), ''), ct.name) AS "clientName",
    fc.kind,
    fc.client_type AS "clientType",
    fc.advisor_id AS "advisorId",
    fc.advisor_name AS "advisorName",
    fc.account_type AS "accountType",
    fc.aum,
    fc.risk_level AS "riskLevel",
    fc.status,
    fc.last_activity_at AS "lastActivityAt",
    fc.next_review_date AS "nextReviewDate",
    fc.notes,
    fc.created_at AS "createdAt",
    fc.updated_at AS "updatedAt"
  `;
  private readonly clientJoins = `
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = fc.team_id
  `;

  async findAllClients(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: {
      search?: string;
      status?: string;
      clientType?: string;
      riskLevel?: string;
      page?: string;
      limit?: string;
    },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['fc.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`fc.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.clientType && params.clientType.trim()) {
      where.push(`fc.client_type = $${i++}`);
      vals.push(params.clientType.trim());
    }
    if (params.riskLevel && params.riskLevel.trim()) {
      where.push(`fc.risk_level = $${i++}`);
      vals.push(params.riskLevel.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(fc.client_number ILIKE $${i} OR fc.client_name ILIKE $${i} OR fc.advisor_name ILIKE $${i} OR fc.account_type ILIKE $${i} OR ct.name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_clients fc ${this.clientJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.clientSelect} FROM financial_clients fc ${this.clientJoins}
        WHERE ${whereSql} ORDER BY fc.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneClient(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Client not found');
    const { rows } = await this.db.query(
      `SELECT ${this.clientSelect} FROM financial_clients fc ${this.clientJoins}
        WHERE fc.id = $1 AND fc.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Client not found');
    return rows[0];
  }

  async createClient(
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
    const clientNumber =
      (dto.clientNumber && dto.clientNumber.trim()) ||
      (await this.generateClientNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_clients
         (team_id, created_by, client_number, contact_id, client_name, kind,
          client_type, advisor_name, account_type, aum, risk_level, status,
          last_activity_at, next_review_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        teamId,
        userId,
        clientNumber,
        dto.contactId || null,
        dto.clientName || null,
        dto.kind || null,
        dto.clientType || null,
        dto.advisorName || null,
        dto.accountType || null,
        dto.aum ?? null,
        dto.riskLevel || null,
        (dto.status && dto.status.trim()) || 'Active',
        dto.lastActivityAt || null,
        dto.nextReviewDate || null,
        dto.notes || null,
      ],
    );
    return this.findOneClient(rows[0].id, userId, userTeamId, role);
  }

  async updateClient(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Client not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_clients WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Client not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    const colFor: Record<string, string> = {
      clientNumber: 'client_number',
      contactId: 'contact_id',
      clientName: 'client_name',
      kind: 'kind',
      clientType: 'client_type',
      advisorName: 'advisor_name',
      accountType: 'account_type',
      aum: 'aum',
      riskLevel: 'risk_level',
      status: 'status',
      lastActivityAt: 'last_activity_at',
      nextReviewDate: 'next_review_date',
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
    if (!sets.length) return this.findOneClient(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_clients SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneClient(id, userId, userTeamId, role);
  }

  async removeClient(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Client not found');
    const res = await this.db.query(
      `DELETE FROM financial_clients WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Client not found');
    return { success: true };
  }

  // ─── Applications ──────────────────────────────────────────────────────────

  private readonly appSelect = `
    a.id,
    a.team_id AS "teamId",
    a.application_number AS "applicationNumber",
    a.client_id AS "clientId",
    a.account_id AS "accountId",
    COALESCE(NULLIF(TRIM(a.client_name), ''), fc.client_name, ct.name) AS "clientName",
    a.application_type AS "applicationType",
    a.advisor_name AS "advisorName",
    a.status,
    a.submitted_date AS "submittedDate",
    a.notes,
    a.created_at AS "createdAt",
    a.updated_at AS "updatedAt"
  `;
  private readonly appJoins = `
    LEFT JOIN financial_clients fc ON fc.id = a.client_id AND fc.team_id = a.team_id
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = a.team_id
  `;

  private async generateApplicationNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_applications
        WHERE team_id = $1 AND application_number LIKE $2`,
      [teamId, `APP-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `APP-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllApplications(
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

    const where: string[] = ['a.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`a.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(a.application_number ILIKE $${i} OR a.client_name ILIKE $${i} OR a.application_type ILIKE $${i} OR a.advisor_name ILIKE $${i} OR fc.client_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_applications a ${this.appJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.appSelect} FROM financial_applications a ${this.appJoins}
        WHERE ${whereSql} ORDER BY a.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneApplication(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Application not found');
    const { rows } = await this.db.query(
      `SELECT ${this.appSelect} FROM financial_applications a ${this.appJoins}
        WHERE a.id = $1 AND a.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Application not found');
    return rows[0];
  }

  async createApplication(
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
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    const applicationNumber =
      (dto.applicationNumber && dto.applicationNumber.trim()) ||
      (await this.generateApplicationNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_applications
         (team_id, created_by, application_number, client_id, account_id,
          client_name, application_type, advisor_name, status, submitted_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        teamId,
        userId,
        applicationNumber,
        dto.clientId || null,
        dto.accountId || null,
        dto.clientName || null,
        dto.applicationType || null,
        dto.advisorName || null,
        (dto.status && dto.status.trim()) || 'Draft',
        dto.submittedDate || null,
        dto.notes || null,
      ],
    );
    return this.findOneApplication(rows[0].id, userId, userTeamId, role);
  }

  async updateApplication(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Application not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_applications WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Application not found');
    const teamId = existing.rows[0].team_id;
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    const colFor: Record<string, string> = {
      applicationNumber: 'application_number',
      clientId: 'client_id',
      accountId: 'account_id',
      clientName: 'client_name',
      applicationType: 'application_type',
      advisorName: 'advisor_name',
      status: 'status',
      submittedDate: 'submitted_date',
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
    if (!sets.length) return this.findOneApplication(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_applications SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneApplication(id, userId, userTeamId, role);
  }

  async removeApplication(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Application not found');
    const res = await this.db.query(
      `DELETE FROM financial_applications WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Application not found');
    return { success: true };
  }

  // ─── Accounts ──────────────────────────────────────────────────────────────

  private readonly acctSelect = `
    ac.id,
    ac.team_id AS "teamId",
    ac.account_number AS "accountNumber",
    ac.client_id AS "clientId",
    ac.application_id AS "applicationId",
    COALESCE(NULLIF(TRIM(ac.client_name), ''), fc.client_name, ct.name) AS "clientName",
    ac.account_type AS "accountType",
    ac.advisor_name AS "advisorName",
    ac.status,
    ac.balance,
    ac.opened_date AS "openedDate",
    ac.notes,
    ac.created_at AS "createdAt",
    ac.updated_at AS "updatedAt"
  `;
  private readonly acctJoins = `
    LEFT JOIN financial_clients fc ON fc.id = ac.client_id AND fc.team_id = ac.team_id
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = ac.team_id
  `;

  private async generateAccountNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_accounts
        WHERE team_id = $1 AND account_number LIKE $2`,
      [teamId, `ACC-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `ACC-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllAccounts(
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

    const where: string[] = ['ac.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`ac.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(ac.account_number ILIKE $${i} OR ac.client_name ILIKE $${i} OR ac.account_type ILIKE $${i} OR ac.advisor_name ILIKE $${i} OR fc.client_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_accounts ac ${this.acctJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.acctSelect} FROM financial_accounts ac ${this.acctJoins}
        WHERE ${whereSql} ORDER BY ac.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneAccount(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Account not found');
    const { rows } = await this.db.query(
      `SELECT ${this.acctSelect} FROM financial_accounts ac ${this.acctJoins}
        WHERE ac.id = $1 AND ac.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Account not found');
    return rows[0];
  }

  async createAccount(
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
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.applicationId) await this.assertApplicationInTeam(dto.applicationId, teamId);
    const accountNumber =
      (dto.accountNumber && dto.accountNumber.trim()) ||
      (await this.generateAccountNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_accounts
         (team_id, created_by, account_number, client_id, application_id,
          client_name, account_type, advisor_name, status, balance, opened_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        teamId,
        userId,
        accountNumber,
        dto.clientId || null,
        dto.applicationId || null,
        dto.clientName || null,
        dto.accountType || null,
        dto.advisorName || null,
        (dto.status && dto.status.trim()) || 'Active',
        dto.balance ?? null,
        dto.openedDate || null,
        dto.notes || null,
      ],
    );
    return this.findOneAccount(rows[0].id, userId, userTeamId, role);
  }

  async updateAccount(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Account not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_accounts WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Account not found');
    const teamId = existing.rows[0].team_id;
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.applicationId) await this.assertApplicationInTeam(dto.applicationId, teamId);
    const colFor: Record<string, string> = {
      accountNumber: 'account_number',
      clientId: 'client_id',
      applicationId: 'application_id',
      clientName: 'client_name',
      accountType: 'account_type',
      advisorName: 'advisor_name',
      status: 'status',
      balance: 'balance',
      openedDate: 'opened_date',
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
    if (!sets.length) return this.findOneAccount(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_accounts SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneAccount(id, userId, userTeamId, role);
  }

  async removeAccount(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Account not found');
    const res = await this.db.query(
      `DELETE FROM financial_accounts WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Account not found');
    return { success: true };
  }

  // ─── Transactions ────────────────────────────────────────────────────────────
  //
  // A transaction is a CRM TRACKING record of money movement on an account. Cortexa
  // never executes/settles/custodies funds — amounts are recorded figures only.

  private readonly txnSelect = `
    t.id,
    t.team_id AS "teamId",
    t.transaction_number AS "transactionNumber",
    t.account_id AS "accountId",
    t.client_id AS "clientId",
    COALESCE(NULLIF(TRIM(fc.client_name), ''), ac.client_name, ct.name) AS "clientName",
    ac.account_number AS "accountNumber",
    t.transaction_type AS "transactionType",
    t.amount,
    t.status,
    t.transaction_date AS "transactionDate",
    t.description,
    t.notes,
    t.created_at AS "createdAt",
    t.updated_at AS "updatedAt"
  `;
  private readonly txnJoins = `
    LEFT JOIN financial_clients fc ON fc.id = t.client_id AND fc.team_id = t.team_id
    LEFT JOIN financial_accounts ac ON ac.id = t.account_id AND ac.team_id = t.team_id
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = t.team_id
  `;

  private async generateTransactionNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_transactions
        WHERE team_id = $1 AND transaction_number LIKE $2`,
      [teamId, `TXN-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `TXN-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllTransactions(
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

    const where: string[] = ['t.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`t.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(t.transaction_number ILIKE $${i} OR t.transaction_type ILIKE $${i} OR t.description ILIKE $${i} OR ac.account_number ILIKE $${i} OR fc.client_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_transactions t ${this.txnJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.txnSelect} FROM financial_transactions t ${this.txnJoins}
        WHERE ${whereSql} ORDER BY COALESCE(t.transaction_date, t.created_at::date) DESC, t.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneTransaction(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Transaction not found');
    const { rows } = await this.db.query(
      `SELECT ${this.txnSelect} FROM financial_transactions t ${this.txnJoins}
        WHERE t.id = $1 AND t.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Transaction not found');
    return rows[0];
  }

  async createTransaction(
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
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    const transactionNumber =
      (dto.transactionNumber && dto.transactionNumber.trim()) ||
      (await this.generateTransactionNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_transactions
         (team_id, created_by, transaction_number, account_id, client_id,
          transaction_type, amount, status, transaction_date, description, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        teamId,
        userId,
        transactionNumber,
        dto.accountId || null,
        dto.clientId || null,
        dto.transactionType || null,
        dto.amount ?? null,
        (dto.status && dto.status.trim()) || 'Completed',
        dto.transactionDate || null,
        dto.description || null,
        dto.notes || null,
      ],
    );
    return this.findOneTransaction(rows[0].id, userId, userTeamId, role);
  }

  async updateTransaction(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Transaction not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_transactions WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Transaction not found');
    const teamId = existing.rows[0].team_id;
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    const colFor: Record<string, string> = {
      transactionNumber: 'transaction_number',
      accountId: 'account_id',
      clientId: 'client_id',
      transactionType: 'transaction_type',
      amount: 'amount',
      status: 'status',
      transactionDate: 'transaction_date',
      description: 'description',
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
    if (!sets.length) return this.findOneTransaction(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_transactions SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneTransaction(id, userId, userTeamId, role);
  }

  async removeTransaction(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Transaction not found');
    const res = await this.db.query(
      `DELETE FROM financial_transactions WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Transaction not found');
    return { success: true };
  }

  // ─── Investments ─────────────────────────────────────────────────────────────
  //
  // An investment is a CRM record of a holding. "amount" is a RECORDED value the
  // advisor maintains — Cortexa never fetches live market prices nor fabricates
  // valuations. Active holdings feed the Portfolio Allocation breakdown.

  private readonly invSelect = `
    iv.id,
    iv.team_id AS "teamId",
    iv.investment_number AS "investmentNumber",
    iv.account_id AS "accountId",
    iv.client_id AS "clientId",
    COALESCE(NULLIF(TRIM(fc.client_name), ''), ac.client_name, ct.name) AS "clientName",
    ac.account_number AS "accountNumber",
    iv.name,
    iv.category,
    iv.amount,
    iv.units,
    iv.status,
    iv.as_of_date AS "asOfDate",
    iv.notes,
    iv.created_at AS "createdAt",
    iv.updated_at AS "updatedAt"
  `;
  private readonly invJoins = `
    LEFT JOIN financial_clients fc ON fc.id = iv.client_id AND fc.team_id = iv.team_id
    LEFT JOIN financial_accounts ac ON ac.id = iv.account_id AND ac.team_id = iv.team_id
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = iv.team_id
  `;

  private async generateInvestmentNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_investments
        WHERE team_id = $1 AND investment_number LIKE $2`,
      [teamId, `INV-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `INV-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllInvestments(
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

    const where: string[] = ['iv.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`iv.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(iv.investment_number ILIKE $${i} OR iv.name ILIKE $${i} OR iv.category ILIKE $${i} OR ac.account_number ILIKE $${i} OR fc.client_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_investments iv ${this.invJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.invSelect} FROM financial_investments iv ${this.invJoins}
        WHERE ${whereSql} ORDER BY iv.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneInvestment(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Investment not found');
    const { rows } = await this.db.query(
      `SELECT ${this.invSelect} FROM financial_investments iv ${this.invJoins}
        WHERE iv.id = $1 AND iv.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Investment not found');
    return rows[0];
  }

  async createInvestment(
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
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    const investmentNumber =
      (dto.investmentNumber && dto.investmentNumber.trim()) ||
      (await this.generateInvestmentNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_investments
         (team_id, created_by, investment_number, account_id, client_id,
          name, category, amount, units, status, as_of_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        teamId,
        userId,
        investmentNumber,
        dto.accountId || null,
        dto.clientId || null,
        dto.name || null,
        dto.category || null,
        dto.amount ?? null,
        dto.units ?? null,
        (dto.status && dto.status.trim()) || 'Active',
        dto.asOfDate || null,
        dto.notes || null,
      ],
    );
    return this.findOneInvestment(rows[0].id, userId, userTeamId, role);
  }

  async updateInvestment(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Investment not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_investments WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Investment not found');
    const teamId = existing.rows[0].team_id;
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    const colFor: Record<string, string> = {
      investmentNumber: 'investment_number',
      accountId: 'account_id',
      clientId: 'client_id',
      name: 'name',
      category: 'category',
      amount: 'amount',
      units: 'units',
      status: 'status',
      asOfDate: 'as_of_date',
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
    if (!sets.length) return this.findOneInvestment(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_investments SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneInvestment(id, userId, userTeamId, role);
  }

  async removeInvestment(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Investment not found');
    const res = await this.db.query(
      `DELETE FROM financial_investments WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Investment not found');
    return { success: true };
  }

  // ─── Commissions ─────────────────────────────────────────────────────────────
  //
  // A commission is a recorded fee-revenue record tied to a client and optional
  // account. Commissions drive the Revenue figure (Approved + Paid within a period).
  // Revenue is kept strictly separate from AUM and account balances.

  private readonly comSelect = `
    cm.id,
    cm.team_id AS "teamId",
    cm.commission_number AS "commissionNumber",
    cm.client_id AS "clientId",
    cm.account_id AS "accountId",
    COALESCE(NULLIF(TRIM(fc.client_name), ''), ac.client_name, ct.name) AS "clientName",
    ac.account_number AS "accountNumber",
    cm.advisor_name AS "advisorName",
    cm.amount,
    cm.rate,
    cm.status,
    cm.commission_date AS "commissionDate",
    cm.notes,
    cm.created_at AS "createdAt",
    cm.updated_at AS "updatedAt"
  `;
  private readonly comJoins = `
    LEFT JOIN financial_clients fc ON fc.id = cm.client_id AND fc.team_id = cm.team_id
    LEFT JOIN financial_accounts ac ON ac.id = cm.account_id AND ac.team_id = cm.team_id
    LEFT JOIN contacts ct ON ct.id = fc.contact_id AND ct.team_id = cm.team_id
  `;

  private async generateCommissionNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM financial_commissions
        WHERE team_id = $1 AND commission_number LIKE $2`,
      [teamId, `COM-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `COM-${year}-${String(seq).padStart(4, '0')}`;
  }

  async findAllCommissions(
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

    const where: string[] = ['cm.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`cm.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(cm.commission_number ILIKE $${i} OR cm.advisor_name ILIKE $${i} OR ac.account_number ILIKE $${i} OR fc.client_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM financial_commissions cm ${this.comJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.comSelect} FROM financial_commissions cm ${this.comJoins}
        WHERE ${whereSql} ORDER BY COALESCE(cm.commission_date, cm.created_at::date) DESC, cm.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneCommission(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Commission not found');
    const { rows } = await this.db.query(
      `SELECT ${this.comSelect} FROM financial_commissions cm ${this.comJoins}
        WHERE cm.id = $1 AND cm.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Commission not found');
    return rows[0];
  }

  async createCommission(
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
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    const commissionNumber =
      (dto.commissionNumber && dto.commissionNumber.trim()) ||
      (await this.generateCommissionNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO financial_commissions
         (team_id, created_by, commission_number, client_id, account_id,
          advisor_name, amount, rate, status, commission_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        teamId,
        userId,
        commissionNumber,
        dto.clientId || null,
        dto.accountId || null,
        dto.advisorName || null,
        dto.amount ?? null,
        dto.rate ?? null,
        (dto.status && dto.status.trim()) || 'Pending',
        dto.commissionDate || null,
        dto.notes || null,
      ],
    );
    return this.findOneCommission(rows[0].id, userId, userTeamId, role);
  }

  async updateCommission(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Commission not found');
    const existing = await this.db.query(
      `SELECT team_id FROM financial_commissions WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Commission not found');
    const teamId = existing.rows[0].team_id;
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);
    const colFor: Record<string, string> = {
      commissionNumber: 'commission_number',
      clientId: 'client_id',
      accountId: 'account_id',
      advisorName: 'advisor_name',
      amount: 'amount',
      rate: 'rate',
      status: 'status',
      commissionDate: 'commission_date',
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
    if (!sets.length) return this.findOneCommission(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE financial_commissions SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneCommission(id, userId, userTeamId, role);
  }

  async removeCommission(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Commission not found');
    const res = await this.db.query(
      `DELETE FROM financial_commissions WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Commission not found');
    return { success: true };
  }

  // ─── Documents ───────────────────────────────────────────────────────────────
  //
  // A document is a stored_files S3 object plus financial context, team-scoped. The
  // bytes never leave a private S3 bucket: downloads are served only through
  // short-lived signed URLs (getSignedUrl), so a document is unreachable without a
  // signature. The raw S3 url is never returned to the client. Reuses the shared
  // StorageService (no duplicate storage system). Mirrors the Insurance design.

  async listDocuments(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: { page?: number; limit?: number; clientId?: string; accountId?: string; search?: string },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    this.assertUuidOrBlank(params.clientId, 'client');
    this.assertUuidOrBlank(params.accountId, 'account');
    const where: string[] = ['d.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.clientId) {
      where.push(`d.client_id = $${i++}`);
      vals.push(params.clientId);
    }
    if (params.accountId) {
      where.push(`d.account_id = $${i++}`);
      vals.push(params.accountId);
    }
    if (params.search && params.search.trim()) {
      where.push(`(d.title ILIKE $${i} OR f.original_name ILIKE $${i})`);
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total
         FROM financial_documents d
         LEFT JOIN stored_files f ON f.id = d.stored_file_id
        WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await this.db.query(
      `SELECT d.id, d.title, d.doc_type AS "docType", d.client_id AS "clientId",
              d.account_id AS "accountId", d.notes,
              d.stored_file_id AS "storedFileId",
              f.original_name AS "fileName", f.mime_type AS "mimeType", f.size,
              fc.client_name AS "clientName",
              ac.account_number AS "accountNumber",
              d.created_at AS "createdAt"
         FROM financial_documents d
         LEFT JOIN stored_files f ON f.id = d.stored_file_id
         LEFT JOIN financial_clients fc ON fc.id = d.client_id AND fc.team_id = d.team_id
         LEFT JOIN financial_accounts ac ON ac.id = d.account_id AND ac.team_id = d.team_id
        WHERE ${whereSql}
        ORDER BY d.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async createDocument(
    userId: string,
    userTeamId: string | null,
    role: string,
    file: Express.Multer.File,
    dto: {
      title?: string;
      docType?: string;
      clientId?: string;
      accountId?: string;
      notes?: string;
    },
  ): Promise<any> {
    await this.ensureSchema();
    if (!file) throw new BadRequestException('No file provided');
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You do not have access to this account');
    }
    const teamId = this.resolveTeamId(undefined, userTeamId, accessible);

    // Reject malformed ids with 400 before any DB/S3 work.
    this.assertUuidOrBlank(dto.clientId, 'client');
    this.assertUuidOrBlank(dto.accountId, 'account');

    // Any optional link must belong to the same account.
    if (dto.clientId) await this.assertClientInTeam(dto.clientId, teamId);
    if (dto.accountId) await this.assertAccountInTeam(dto.accountId, teamId);

    // Upload to S3 first; only record the document if the bytes landed.
    const stored = await this.storage.uploadDocument({
      file,
      folder: `financial/${teamId}`,
      userId,
      teamId,
    });

    const title = (dto.title && dto.title.trim()) || file.originalname;
    let rows: any[];
    try {
      const res = await this.db.query(
        `INSERT INTO financial_documents
           (team_id, created_by, stored_file_id, title, doc_type, client_id, account_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title, doc_type AS "docType", client_id AS "clientId",
                   account_id AS "accountId", notes,
                   stored_file_id AS "storedFileId", created_at AS "createdAt"`,
        [
          teamId,
          userId,
          stored.id,
          title,
          dto.docType || null,
          dto.clientId || null,
          dto.accountId || null,
          dto.notes || null,
        ],
      );
      rows = res.rows;
    } catch (err) {
      // The bytes landed but the index row did not: remove the orphaned S3 object
      // + stored_files row so a failed upload never leaks storage.
      await this.storage.deleteStoredFileById(stored.id).catch(() => undefined);
      throw err;
    }
    return {
      ...rows[0],
      fileName: stored.originalName,
      mimeType: stored.mimeType,
      size: stored.size,
    };
  }

  // A short-lived signed URL to download a document. Team-authorized here, then
  // re-checked at the storage layer (we pass the document's own team so the storage
  // tenant check is consistent for multi-team owners).
  async getDocumentDownloadUrl(
    userId: string,
    userTeamId: string | null,
    role: string,
    docId: string,
  ): Promise<{ url: string; expiresIn: number }> {
    await this.ensureSchema();
    // Malformed id -> 400, never a Postgres 22P02 -> 500 (client requirement).
    this.assertUuidOrBlank(docId, 'document');
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Document not found');
    const { rows } = await this.db.query(
      `SELECT stored_file_id, team_id FROM financial_documents
        WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [docId, accessible],
    );
    if (!rows.length) throw new NotFoundException('Document not found');
    const expiresIn = 3600;
    const url = await this.storage.getSignedUrl(rows[0].stored_file_id, expiresIn, {
      userId,
      teamId: rows[0].team_id,
      role,
    });
    return { url, expiresIn };
  }

  async removeDocument(
    userId: string,
    userTeamId: string | null,
    role: string,
    docId: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    // Malformed id -> 400, never a Postgres 22P02 -> 500 (client requirement).
    this.assertUuidOrBlank(docId, 'document');
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Document not found');
    const { rows } = await this.db.query(
      `SELECT stored_file_id FROM financial_documents
        WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [docId, accessible],
    );
    if (!rows.length) throw new NotFoundException('Document not found');
    await this.db.query(
      `DELETE FROM financial_documents WHERE id = $1 AND team_id = ANY($2)`,
      [docId, accessible],
    );
    await this.storage.deleteStoredFileById(rows[0].stored_file_id);
    return { success: true };
  }

  // Overview KPIs. Every figure is computed from real account data; a KPI is 0
  // until its tab has data. Three money figures are kept strictly separate and are
  // never mixed: AUM = sum of RECORDED balances of ACTIVE accounts; Portfolio
  // Allocation = ACTIVE investment holdings grouped by category (recorded values);
  // Revenue (this month) = Approved + Paid commissions dated in the current month.
  // None are live custodial/market data.
  async getStats(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    const zero = {
      totalClients: { count: 0, active: 0 },
      applicationsInProgress: { count: 0 },
      accountsUnderManagement: { count: 0 },
      assetsUnderManagement: { amount: 0 },
      revenueThisMonth: { amount: 0 },
      conversionRate: { percent: 0 },
      applicationsByStatus: [],
      portfolioAllocation: [],
      recentActivity: [],
      upcomingReviews: [],
    };
    if (!accessible.length) return zero;
    const num = (v: any) => Number(v) || 0;

    const IN_PROGRESS = ['Draft', 'In Progress', 'Under Review', 'Pending Documents'];
    const [
      clientsAgg,
      upcoming,
      activity,
      appsAgg,
      appsByStatus,
      acctAgg,
      revAgg,
      portfolio,
    ] = await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int AS count,
                  COUNT(*) FILTER (WHERE status = 'Active')::int AS active
             FROM financial_clients WHERE team_id = ANY($1)`,
          [accessible],
        ),
        this.db.query(
          `SELECT id, client_number AS "clientNumber",
                  COALESCE(NULLIF(TRIM(client_name), ''), '') AS "clientName",
                  next_review_date AS "nextReviewDate"
             FROM financial_clients
            WHERE team_id = ANY($1) AND next_review_date IS NOT NULL
              AND next_review_date >= CURRENT_DATE
              AND next_review_date <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY next_review_date ASC LIMIT 6`,
          [accessible],
        ),
        this.db.query(
          `SELECT 'Client' AS kind, client_number AS ref, client_name AS name, status, updated_at
             FROM financial_clients WHERE team_id = ANY($1)
            ORDER BY updated_at DESC LIMIT 6`,
          [accessible],
        ),
        // Applications: in-progress count + approved/closed for conversion rate.
        this.db.query(
          `SELECT
              COUNT(*) FILTER (WHERE status IN ('Draft','In Progress','Under Review','Pending Documents'))::int AS in_progress,
              COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved,
              COUNT(*) FILTER (WHERE status IN ('Approved','Declined','Cancelled'))::int AS closed
             FROM financial_applications WHERE team_id = ANY($1)`,
          [accessible],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(status), ''), 'Unknown') AS status, COUNT(*)::int AS count
             FROM financial_applications WHERE team_id = ANY($1)
            GROUP BY 1 ORDER BY count DESC`,
          [accessible],
        ),
        // Accounts under management + AUM from active accounts' recorded balances.
        this.db.query(
          `SELECT COUNT(*) FILTER (WHERE status = 'Active')::int AS active,
                  COALESCE(SUM(balance) FILTER (WHERE status = 'Active'),0) AS aum
             FROM financial_accounts WHERE team_id = ANY($1)`,
          [accessible],
        ),
        // Revenue this month: Approved + Paid commissions dated in the current month.
        this.db.query(
          `SELECT COALESCE(SUM(amount),0) AS amount
             FROM financial_commissions
            WHERE team_id = ANY($1)
              AND status IN ('Approved','Paid')
              AND commission_date >= date_trunc('month', CURRENT_DATE)
              AND commission_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
          [accessible],
        ),
        // Portfolio allocation: active investment holdings grouped by category.
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category,
                  COALESCE(SUM(amount),0) AS amount
             FROM financial_investments
            WHERE team_id = ANY($1) AND status = 'Active'
            GROUP BY 1 ORDER BY amount DESC`,
          [accessible],
        ),
      ]);

    const appClosed = num(appsAgg.rows[0].closed);
    return {
      ...zero,
      totalClients: {
        count: num(clientsAgg.rows[0].count),
        active: num(clientsAgg.rows[0].active),
      },
      applicationsInProgress: { count: num(appsAgg.rows[0].in_progress) },
      accountsUnderManagement: { count: num(acctAgg.rows[0].active) },
      assetsUnderManagement: { amount: num(acctAgg.rows[0].aum) },
      revenueThisMonth: { amount: num(revAgg.rows[0].amount) },
      conversionRate: {
        percent: appClosed
          ? Math.round((num(appsAgg.rows[0].approved) / appClosed) * 100)
          : 0,
      },
      applicationsByStatus: appsByStatus.rows.map((r: any) => ({
        status: r.status,
        count: num(r.count),
      })),
      portfolioAllocation: portfolio.rows.map((r: any) => ({
        category: r.category,
        amount: num(r.amount),
      })),
      upcomingReviews: upcoming.rows.map((r: any) => ({
        clientName: r.clientName || r.clientNumber,
        nextReviewDate: r.nextReviewDate,
      })),
      recentActivity: activity.rows.map((a: any) => ({
        title: `${a.kind} ${a.ref || ''}`.trim(),
        subtitle: [a.name, a.status].filter(Boolean).join(' · '),
        at: a.updated_at,
      })),
    };
  }


  /**
   * Tablet/mobile Financial Actions + AI Assistant summary.
   * All metrics are computed from the current account's real financial records.
   * No placeholder/demo values are returned.
   */
  async getMobileHub(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    const empty = {
      applicationsNeedAttention: 0,
      reviewsThisWeek: 0,
      accountsLowActivity: 0,
      revenueThisMonth: 0,
    };
    if (!accessible.length) return empty;

    const num = (v: any) => Number(v) || 0;

    const [applications, reviews, accounts, revenue] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS count
           FROM financial_applications
          WHERE team_id = ANY($1)
            AND status IN ('Draft','In Progress','Under Review','Pending Documents')`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS count
           FROM financial_clients
          WHERE team_id = ANY($1)
            AND next_review_date >= CURRENT_DATE
            AND next_review_date < CURRENT_DATE + INTERVAL '7 days'`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS count
           FROM financial_accounts
          WHERE team_id = ANY($1)
            AND status = 'Active'
            AND COALESCE(updated_at, created_at) < NOW() - INTERVAL '30 days'`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(SUM(amount),0) AS amount
           FROM financial_commissions
          WHERE team_id = ANY($1)
            AND status IN ('Approved','Paid')
            AND commission_date >= date_trunc('month', CURRENT_DATE)
            AND commission_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [accessible],
      ),
    ]);

    return {
      applicationsNeedAttention: num(applications.rows[0]?.count),
      reviewsThisWeek: num(reviews.rows[0]?.count),
      accountsLowActivity: num(accounts.rows[0]?.count),
      revenueThisMonth: num(revenue.rows[0]?.amount),
    };
  }

  // Reports tab analytics, all team-scoped and computed server-side. Each money
  // figure keeps its own meaning and is never blended: AUM (recorded account
  // balances), Portfolio (recorded holding values), Revenue (commission fees),
  // Net flow (contributions minus withdrawals). Individual sections degrade to zero
  // if their table is unavailable so one lagging query never breaks the report.
  async getReports(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    const empty = {
      clientsByStatus: [],
      clientsByType: [],
      clientsByRisk: [],
      applicationsByStatus: [],
      accountsByType: [],
      totalAum: 0,
      activeAccounts: 0,
      portfolioByCategory: [],
      portfolioTotal: 0,
      transactions: {
        total: 0,
        contributions: 0,
        withdrawals: 0,
        netFlow: 0,
        byType: [],
      },
      commissions: {
        pendingCount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        totalAmount: 0,
        revenueThisMonth: 0,
      },
    };
    if (!accessible.length) return empty;

    const num = (v: any) => Number(v) || 0;
    const mapCount = (rows: any[]) =>
      rows.map((r: any) => ({ label: r.label, count: num(r.count) }));

    const [
      cliByStatus,
      cliByType,
      cliByRisk,
      appByStatus,
      acctByType,
      acctAgg,
    ] = await Promise.all([
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(status), ''), 'Unknown') AS label, COUNT(*)::int AS count
           FROM financial_clients WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(client_type), ''), 'Unspecified') AS label, COUNT(*)::int AS count
           FROM financial_clients WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(risk_level), ''), 'Unspecified') AS label, COUNT(*)::int AS count
           FROM financial_clients WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(status), ''), 'Unknown') AS label, COUNT(*)::int AS count
           FROM financial_applications WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(account_type), ''), 'Unspecified') AS label,
                COUNT(*)::int AS count, COALESCE(SUM(balance),0) AS amount
           FROM financial_accounts WHERE team_id = ANY($1) AND status = 'Active'
          GROUP BY 1 ORDER BY amount DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'Active')::int AS active,
                COALESCE(SUM(balance) FILTER (WHERE status = 'Active'),0) AS aum
           FROM financial_accounts WHERE team_id = ANY($1)`,
        [accessible],
      ),
    ]);

    // Portfolio (investments) — degrade to empty if unavailable.
    let portfolioByCategory: any[] = [];
    let portfolioTotal = 0;
    try {
      const port = await this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS label,
                COALESCE(SUM(amount),0) AS amount, COUNT(*)::int AS count
           FROM financial_investments WHERE team_id = ANY($1) AND status = 'Active'
          GROUP BY 1 ORDER BY amount DESC`,
        [accessible],
      );
      portfolioByCategory = port.rows.map((r: any) => ({
        label: r.label,
        amount: num(r.amount),
        count: num(r.count),
      }));
      portfolioTotal = portfolioByCategory.reduce((s, r) => s + r.amount, 0);
    } catch {
      /* investments not available; leave zeros */
    }

    // Transactions — degrade to empty if unavailable.
    let transactions = empty.transactions;
    try {
      const [txnAgg, txnByType] = await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int AS total,
                  COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Contribution'),0) AS contributions,
                  COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'Withdrawal'),0) AS withdrawals
             FROM financial_transactions
            WHERE team_id = ANY($1) AND status = 'Completed'`,
          [accessible],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(transaction_type), ''), 'Other') AS label,
                  COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS amount
             FROM financial_transactions WHERE team_id = ANY($1)
            GROUP BY 1 ORDER BY amount DESC`,
          [accessible],
        ),
      ]);
      const t = txnAgg.rows[0];
      const contributions = num(t.contributions);
      const withdrawals = num(t.withdrawals);
      transactions = {
        total: num(t.total),
        contributions,
        withdrawals,
        netFlow: contributions - withdrawals,
        byType: txnByType.rows.map((r: any) => ({
          label: r.label,
          count: num(r.count),
          amount: num(r.amount),
        })),
      };
    } catch {
      /* transactions not available; leave zeros */
    }

    // Commissions — degrade to empty if unavailable.
    let commissions = empty.commissions;
    try {
      const commAgg = await this.db.query(
        `SELECT
            COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_count,
            COALESCE(SUM(amount) FILTER (WHERE status = 'Pending'),0) AS pending_amount,
            COALESCE(SUM(amount) FILTER (WHERE status = 'Approved'),0) AS approved_amount,
            COUNT(*) FILTER (WHERE status = 'Paid')::int AS paid_count,
            COALESCE(SUM(amount) FILTER (WHERE status = 'Paid'),0) AS paid_amount,
            COALESCE(SUM(amount),0) AS total_amount,
            COALESCE(SUM(amount) FILTER (
              WHERE status IN ('Approved','Paid')
                AND commission_date >= date_trunc('month', CURRENT_DATE)
                AND commission_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            ),0) AS revenue_this_month
           FROM financial_commissions WHERE team_id = ANY($1)`,
        [accessible],
      );
      const c = commAgg.rows[0];
      commissions = {
        pendingCount: num(c.pending_count),
        pendingAmount: num(c.pending_amount),
        approvedAmount: num(c.approved_amount),
        paidCount: num(c.paid_count),
        paidAmount: num(c.paid_amount),
        totalAmount: num(c.total_amount),
        revenueThisMonth: num(c.revenue_this_month),
      };
    } catch {
      /* commissions not available; leave zeros */
    }

    return {
      clientsByStatus: mapCount(cliByStatus.rows),
      clientsByType: mapCount(cliByType.rows),
      clientsByRisk: mapCount(cliByRisk.rows),
      applicationsByStatus: mapCount(appByStatus.rows),
      accountsByType: acctByType.rows.map((r: any) => ({
        label: r.label,
        count: num(r.count),
        amount: num(r.amount),
      })),
      totalAum: num(acctAgg.rows[0].aum),
      activeAccounts: num(acctAgg.rows[0].active),
      portfolioByCategory,
      portfolioTotal,
      transactions,
      commissions,
    };
  }
}
