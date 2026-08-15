import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const OWNER_ROLE = 'owner';

// Financial Services Workspace backend. Reuses the Cortexa tenant model: the
// account boundary is the TEAM, so every row carries team_id and every query is
// scoped to the teams the caller can access. Contacts/users are reused, never
// duplicated. This is a CRM/tracking system — never a bank/broker/custodian; AUM
// and balances are recorded figures, not live custodial data.
@Injectable()
export class FinancialService {
  constructor(private readonly db: DatabaseService) {}

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
    this.schemaReady = true;
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

  // Overview KPIs. Every figure is computed from real account data; a KPI is 0
  // until its tab has data. AUM is the sum of RECORDED client balances (documented
  // manual figures), not live custodial data. Applications/Accounts/Revenue land
  // as their tabs are built.
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

    const [clientsAgg, upcoming, activity] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS count,
                COUNT(*) FILTER (WHERE status = 'Active')::int AS active,
                COALESCE(SUM(aum) FILTER (WHERE status = 'Active'),0) AS aum
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
    ]);

    return {
      ...zero,
      totalClients: {
        count: num(clientsAgg.rows[0].count),
        active: num(clientsAgg.rows[0].active),
      },
      assetsUnderManagement: { amount: num(clientsAgg.rows[0].aum) },
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
}
