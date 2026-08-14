import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateInsurancePolicyDto } from './dto/create-insurance-policy.dto';
import { UpdateInsurancePolicyDto } from './dto/update-insurance-policy.dto';

const OWNER_ROLE = 'owner';

// Insurance Workspace backend. Policies (and later claims/quotes/renewals/etc.)
// all reuse the existing Cortexa tenant model: the customer account boundary is
// the TEAM, so every row carries team_id and every query is scoped to the teams
// the caller can access. Contacts, leads, users are reused, never duplicated.
@Injectable()
export class InsuranceService {
  constructor(private readonly db: DatabaseService) {}

  private schemaReady = false;

  // Columns returned for a policy, joined to the reused contact / carrier / agent
  // so the workspace can render real names without a second round-trip.
  private readonly policySelect = `
    p.id,
    p.team_id AS "teamId",
    p.created_by AS "createdBy",
    p.policy_number AS "policyNumber",
    p.contact_id AS "contactId",
    ct.name AS "contactName",
    p.lead_id AS "leadId",
    p.holder_name AS "holderName",
    p.carrier_id AS "carrierId",
    cr.name AS "carrierName",
    cr.carrier_mark AS "carrierMark",
    p.policy_type AS "policyType",
    p.coverage_start AS "coverageStart",
    p.coverage_end AS "coverageEnd",
    p.premium,
    p.billing_frequency AS "billingFrequency",
    p.next_billing AS "nextBilling",
    p.status,
    p.assigned_to AS "assignedTo",
    au.name AS "agentName",
    p.notes,
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt"
  `;

  private readonly policyJoins = `
    FROM insurance_policies p
    LEFT JOIN contacts ct ON ct.id = p.contact_id AND ct.team_id = p.team_id
    LEFT JOIN insurance_carriers cr ON cr.id = p.carrier_id AND cr.team_id = p.team_id
    LEFT JOIN users au ON au.id = p.assigned_to
  `;

  // Create the insurance tables on first use so the workspace works as soon as
  // the code deploys, even before `npm run migration:run` applies 103/104. Same
  // belt-and-suspenders pattern as platform-mailer.ensureSchema. Idempotent.
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_carriers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        name TEXT NOT NULL,
        carrier_mark TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_carriers_team ON insurance_carriers(team_id)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        policy_number TEXT,
        contact_id UUID,
        lead_id UUID,
        holder_name TEXT,
        carrier_id UUID,
        policy_type TEXT,
        coverage_start DATE,
        coverage_end DATE,
        premium NUMERIC(12,2),
        billing_frequency TEXT,
        next_billing DATE,
        status TEXT NOT NULL DEFAULT 'Pending',
        assigned_to UUID,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_policies_team ON insurance_policies(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact ON insurance_policies(contact_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_policies_carrier ON insurance_policies(carrier_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_policies_next_billing ON insurance_policies(next_billing)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        claim_number TEXT,
        policy_id UUID,
        contact_id UUID,
        claim_type TEXT,
        description TEXT,
        incident_date DATE,
        filed_date DATE,
        amount_claimed NUMERIC(12,2),
        amount_approved NUMERIC(12,2),
        amount_paid NUMERIC(12,2),
        status TEXT NOT NULL DEFAULT 'New',
        assigned_to UUID,
        resolved_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_claims_team ON insurance_claims(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON insurance_claims(policy_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        quote_number TEXT,
        contact_id UUID,
        holder_name TEXT,
        carrier_id UUID,
        policy_type TEXT,
        quoted_premium NUMERIC(12,2),
        coverage_start DATE,
        coverage_end DATE,
        billing_frequency TEXT,
        valid_until DATE,
        status TEXT NOT NULL DEFAULT 'Draft',
        assigned_to UUID,
        notes TEXT,
        converted_policy_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_quotes_team ON insurance_quotes(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_quotes_contact ON insurance_quotes(contact_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_quotes_status ON insurance_quotes(status)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_renewals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        policy_id UUID,
        contact_id UUID,
        carrier_id UUID,
        policy_type TEXT,
        holder_name TEXT,
        billing_frequency TEXT,
        current_expiration DATE,
        renewal_date DATE,
        current_premium NUMERIC(12,2),
        renewal_premium NUMERIC(12,2),
        status TEXT NOT NULL DEFAULT 'Upcoming',
        assigned_to UUID,
        notes TEXT,
        renewed_policy_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_renewals_team ON insurance_renewals(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_renewals_policy ON insurance_renewals(policy_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_renewals_status ON insurance_renewals(status)`,
    );
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS insurance_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        policy_id UUID,
        contact_id UUID,
        agent_id UUID,
        rate NUMERIC(5,2),
        amount NUMERIC(12,2),
        status TEXT NOT NULL DEFAULT 'Pending',
        period TEXT,
        earned_date DATE,
        due_date DATE,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_commissions_team ON insurance_commissions(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_commissions_policy ON insurance_commissions(policy_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_insurance_commissions_status ON insurance_commissions(status)`,
    );
    this.schemaReady = true;
  }

  // The set of team ids this caller may read/write, identical to the CRM rule so
  // insurance and CRM never disagree on what an account can see.
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

  // Search the account's EXISTING Cortexa contacts to attach one to a policy.
  // Reads the shared `contacts` table (reuse, not a second customer database),
  // scoped to the caller's teams.
  async searchContacts(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    // Scope to the SAME single team a new policy would save into (see
    // resolveTeamId), so the picker never offers a contact the save-validation
    // would then reject.
    const teamId =
      userTeamId && accessible.includes(userTeamId) ? userTeamId : accessible[0];

    const values: any[] = [teamId];
    let where = 'team_id = $1';
    if (search && search.trim()) {
      where += ` AND (
        LOWER(COALESCE(name, '')) LIKE LOWER($2)
        OR LOWER(COALESCE(email, '')) LIKE LOWER($2)
        OR LOWER(COALESCE(phone, '')) LIKE LOWER($2)
      )`;
      values.push(`%${search.trim()}%`);
    }

    const { rows } = await this.db.query(
      `SELECT id, name, email, phone
         FROM contacts
        WHERE ${where}
        ORDER BY name ASC NULLS LAST
        LIMIT 20`,
      values,
    );
    return rows;
  }

  // A linked contact must belong to the same account (team) as the policy, so a
  // policy can never point at another customer's contact.
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

  // A linked carrier must belong to the same account as the policy.
  private async assertCarrierInTeam(
    carrierId: string,
    teamId: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM insurance_carriers WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [carrierId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected carrier is not in this account');
    }
  }

  async findAllPolicies(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['p.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;

    if (query.search) {
      where.push(`(
        LOWER(COALESCE(p.policy_number, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(p.holder_name, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(ct.name, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(p.policy_type, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(cr.name, '')) LIKE LOWER($${param})
      )`);
      values.push(`%${query.search}%`);
      param++;
    }
    if (query.status) {
      where.push(`p.status = $${param}`);
      values.push(query.status);
      param++;
    }
    if (query.policyType) {
      where.push(`p.policy_type = $${param}`);
      values.push(query.policyType);
      param++;
    }
    if (query.carrierId) {
      where.push(`p.carrier_id = $${param}`);
      values.push(query.carrierId);
      param++;
    }

    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total ${this.policyJoins} WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.policySelect} ${this.policyJoins}
        WHERE ${whereSql}
        ORDER BY p.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );

    return { data: rows, total, page, limit };
  }

  async findOnePolicy(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Policy not found');

    const { rows } = await this.db.query(
      `SELECT ${this.policySelect} ${this.policyJoins}
        WHERE p.id = $1 AND p.team_id = ANY($2)`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Policy not found');
    return rows[0];
  }

  // Resolve which team a new policy belongs to: honor a client-supplied team_id
  // ONLY if the caller can access it, else fall back to their own team. Blocks
  // any attempt to write into another account.
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

  // Human-readable per-account policy number (POL-<year>-<seq>) when the caller
  // does not supply one. Sequence is per team so numbers don't leak account size.
  private async generatePolicyNumber(teamId: string): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM insurance_policies WHERE team_id = $1`,
      [teamId],
    );
    const year = new Date().getFullYear();
    const seq = 1000 + (rows[0]?.n || 0) + 1;
    return `POL-${year}-${seq}`;
  }

  async createPolicy(
    dto: CreateInsurancePolicyDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException(
        'You must belong to a team to create policies',
      );
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, teamId);
    }
    if (dto.carrierId) {
      await this.assertCarrierInTeam(dto.carrierId, teamId);
    }

    const policyNumber =
      (dto.policyNumber && String(dto.policyNumber).trim()) ||
      (await this.generatePolicyNumber(teamId));

    const { rows } = await this.db.query(
      `INSERT INTO insurance_policies (
         team_id, created_by, policy_number, contact_id, lead_id, holder_name,
         carrier_id, policy_type, coverage_start, coverage_end, premium,
         billing_frequency, next_billing, status, assigned_to, notes, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW()
       ) RETURNING id`,
      [
        teamId,
        userId,
        policyNumber,
        dto.contactId || null,
        dto.leadId || null,
        dto.holderName || null,
        dto.carrierId || null,
        dto.policyType || null,
        dto.coverageStart || null,
        dto.coverageEnd || null,
        dto.premium ?? null,
        dto.billingFrequency || null,
        dto.nextBilling || null,
        dto.status || 'Pending',
        dto.assignedTo || null,
        dto.notes || null,
      ],
    );

    return this.findOnePolicy(rows[0].id, userId, userTeamId, role);
  }

  async updatePolicy(
    id: string,
    dto: UpdateInsurancePolicyDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    // Access check: throws NotFound if the policy is not in the caller's teams.
    const existing = await this.findOnePolicy(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, existing.teamId);
    }
    if (dto.carrierId) {
      await this.assertCarrierInTeam(dto.carrierId, existing.teamId);
    }

    const columnByField: Array<[string, any]> = [
      ['policy_number', dto.policyNumber],
      ['contact_id', dto.contactId],
      ['lead_id', dto.leadId],
      ['holder_name', dto.holderName],
      ['carrier_id', dto.carrierId],
      ['policy_type', dto.policyType],
      ['coverage_start', dto.coverageStart],
      ['coverage_end', dto.coverageEnd],
      ['premium', dto.premium],
      ['billing_frequency', dto.billingFrequency],
      ['next_billing', dto.nextBilling],
      ['status', dto.status],
      ['assigned_to', dto.assignedTo],
      ['notes', dto.notes],
    ];

    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    for (const [col, val] of columnByField) {
      if (val !== undefined) {
        sets.push(`${col} = $${param}`);
        values.push(val === '' ? null : val);
        param++;
      }
    }
    if (!sets.length) return this.findOnePolicy(id, userId, userTeamId, role);

    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;

    await this.db.query(
      `UPDATE insurance_policies SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
    );

    return this.findOnePolicy(id, userId, userTeamId, role);
  }

  async removePolicy(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    // Access check first: cannot delete another account's policy.
    await this.findOnePolicy(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    await this.db.query(
      `DELETE FROM insurance_policies WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }

  // ─── Claims ────────────────────────────────────────────────────────────────

  private readonly claimSelect = `
    c.id,
    c.team_id AS "teamId",
    c.created_by AS "createdBy",
    c.claim_number AS "claimNumber",
    c.policy_id AS "policyId",
    p.policy_number AS "policyNumber",
    p.holder_name AS "policyHolder",
    c.contact_id AS "contactId",
    ct.name AS "contactName",
    c.claim_type AS "claimType",
    c.description,
    c.incident_date AS "incidentDate",
    c.filed_date AS "filedDate",
    c.amount_claimed AS "amountClaimed",
    c.amount_approved AS "amountApproved",
    c.amount_paid AS "amountPaid",
    c.status,
    c.assigned_to AS "assignedTo",
    au.name AS "agentName",
    c.resolved_date AS "resolvedDate",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
  `;

  private readonly claimJoins = `
    FROM insurance_claims c
    LEFT JOIN insurance_policies p ON p.id = c.policy_id AND p.team_id = c.team_id
    LEFT JOIN contacts ct ON ct.id = c.contact_id AND ct.team_id = c.team_id
    LEFT JOIN users au ON au.id = c.assigned_to
  `;

  // A claim's policy must belong to the same account. Returns the policy row so
  // the claim can inherit its contact, keeping claim -> policy -> customer linked.
  private async assertPolicyInTeam(
    policyId: string,
    teamId: string,
  ): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, contact_id FROM insurance_policies WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [policyId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected policy is not in this account');
    }
    return rows[0];
  }

  // Claim amounts are validated server-side (client rule): never negative.
  private validateClaimAmounts(dto: {
    amountClaimed?: number;
    amountApproved?: number;
    amountPaid?: number;
  }): void {
    for (const v of [dto.amountClaimed, dto.amountApproved, dto.amountPaid]) {
      if (v != null && (isNaN(Number(v)) || Number(v) < 0)) {
        throw new BadRequestException('Claim amounts must be zero or greater');
      }
    }
  }

  private async generateClaimNumber(teamId: string): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM insurance_claims WHERE team_id = $1`,
      [teamId],
    );
    const year = new Date().getFullYear();
    const seq = 1000 + (rows[0]?.n || 0) + 1;
    return `CLM-${year}-${seq}`;
  }

  async findAllClaims(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['c.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;

    if (query.search) {
      where.push(`(
        LOWER(COALESCE(c.claim_number, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(p.policy_number, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(c.claim_type, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(ct.name, '')) LIKE LOWER($${param})
      )`);
      values.push(`%${String(query.search).trim()}%`);
      param++;
    }
    if (query.status) {
      where.push(`c.status = $${param}`);
      values.push(query.status);
      param++;
    }
    if (query.policyId) {
      where.push(`c.policy_id = $${param}`);
      values.push(query.policyId);
      param++;
    }

    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total ${this.claimJoins} WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.claimSelect} ${this.claimJoins}
        WHERE ${whereSql}
        ORDER BY c.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );

    return { data: rows, total, page, limit };
  }

  async findOneClaim(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Claim not found');

    const { rows } = await this.db.query(
      `SELECT ${this.claimSelect} ${this.claimJoins}
        WHERE c.id = $1 AND c.team_id = ANY($2)`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Claim not found');
    return rows[0];
  }

  async createClaim(
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You must belong to a team to create claims');
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

    if (!dto.policyId) {
      throw new BadRequestException('A claim must be linked to a policy');
    }
    const policy = await this.assertPolicyInTeam(dto.policyId, teamId);
    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, teamId);
    }
    this.validateClaimAmounts(dto);

    const contactId = dto.contactId || policy.contact_id || null;
    const claimNumber =
      (dto.claimNumber && String(dto.claimNumber).trim()) ||
      (await this.generateClaimNumber(teamId));
    const claimStatus = dto.status || 'New';
    // Stamp the settlement date when a claim starts life as Paid, so the
    // "paid this month" metric counts by when it was actually paid.
    const resolvedDate =
      dto.resolvedDate ||
      (claimStatus === 'Paid' ? this.toIsoDate(new Date()) : null);

    const { rows } = await this.db.query(
      `INSERT INTO insurance_claims (
         team_id, created_by, claim_number, policy_id, contact_id, claim_type,
         description, incident_date, filed_date, amount_claimed, amount_approved,
         amount_paid, status, assigned_to, resolved_date, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
       ) RETURNING id`,
      [
        teamId,
        userId,
        claimNumber,
        dto.policyId,
        contactId,
        dto.claimType || null,
        dto.description || null,
        dto.incidentDate || null,
        dto.filedDate || null,
        dto.amountClaimed ?? null,
        dto.amountApproved ?? null,
        dto.amountPaid ?? null,
        claimStatus,
        dto.assignedTo || null,
        resolvedDate,
      ],
    );

    return this.findOneClaim(rows[0].id, userId, userTeamId, role);
  }

  async updateClaim(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const existing = await this.findOneClaim(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    // A claim must always stay linked to a policy: allow moving it to another
    // in-account policy, but never disconnect it (explicit null).
    if (dto.policyId === null) {
      throw new BadRequestException('A claim must stay linked to a policy');
    }
    if (dto.policyId) {
      await this.assertPolicyInTeam(dto.policyId, existing.teamId);
    }
    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, existing.teamId);
    }
    this.validateClaimAmounts(dto);

    // Stamp the settlement date the first time a claim is marked Paid.
    if (
      dto.status === 'Paid' &&
      dto.resolvedDate === undefined &&
      !existing.resolvedDate
    ) {
      dto.resolvedDate = this.toIsoDate(new Date());
    }

    const columnByField: Array<[string, any]> = [
      ['claim_number', dto.claimNumber],
      ['policy_id', dto.policyId],
      ['contact_id', dto.contactId],
      ['claim_type', dto.claimType],
      ['description', dto.description],
      ['incident_date', dto.incidentDate],
      ['filed_date', dto.filedDate],
      ['amount_claimed', dto.amountClaimed],
      ['amount_approved', dto.amountApproved],
      ['amount_paid', dto.amountPaid],
      ['status', dto.status],
      ['assigned_to', dto.assignedTo],
      ['resolved_date', dto.resolvedDate],
    ];

    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    for (const [col, val] of columnByField) {
      if (val !== undefined) {
        sets.push(`${col} = $${param}`);
        values.push(val === '' ? null : val);
        param++;
      }
    }
    if (!sets.length) return this.findOneClaim(id, userId, userTeamId, role);

    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;

    await this.db.query(
      `UPDATE insurance_claims SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
    );

    return this.findOneClaim(id, userId, userTeamId, role);
  }

  async removeClaim(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    await this.findOneClaim(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    await this.db.query(
      `DELETE FROM insurance_claims WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }

  // ─── Quotes ────────────────────────────────────────────────────────────────

  private readonly quoteSelect = `
    q.id,
    q.team_id AS "teamId",
    q.created_by AS "createdBy",
    q.quote_number AS "quoteNumber",
    q.contact_id AS "contactId",
    ct.name AS "contactName",
    q.holder_name AS "holderName",
    q.carrier_id AS "carrierId",
    cr.name AS "carrierName",
    q.policy_type AS "policyType",
    q.quoted_premium AS "quotedPremium",
    q.coverage_start AS "coverageStart",
    q.coverage_end AS "coverageEnd",
    q.billing_frequency AS "billingFrequency",
    q.valid_until AS "validUntil",
    q.status,
    q.assigned_to AS "assignedTo",
    au.name AS "agentName",
    q.notes,
    q.converted_policy_id AS "convertedPolicyId",
    cp.policy_number AS "convertedPolicyNumber",
    q.created_at AS "createdAt",
    q.updated_at AS "updatedAt"
  `;

  private readonly quoteJoins = `
    FROM insurance_quotes q
    LEFT JOIN contacts ct ON ct.id = q.contact_id AND ct.team_id = q.team_id
    LEFT JOIN insurance_carriers cr ON cr.id = q.carrier_id AND cr.team_id = q.team_id
    LEFT JOIN users au ON au.id = q.assigned_to
    LEFT JOIN insurance_policies cp ON cp.id = q.converted_policy_id AND cp.team_id = q.team_id
  `;

  private validateQuotePremium(dto: { quotedPremium?: number }): void {
    if (
      dto.quotedPremium != null &&
      (isNaN(Number(dto.quotedPremium)) || Number(dto.quotedPremium) < 0)
    ) {
      throw new BadRequestException('Quoted premium must be zero or greater');
    }
  }

  private async generateQuoteNumber(teamId: string): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM insurance_quotes WHERE team_id = $1`,
      [teamId],
    );
    const year = new Date().getFullYear();
    const seq = 1000 + (rows[0]?.n || 0) + 1;
    return `QTE-${year}-${seq}`;
  }

  async findAllQuotes(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['q.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;

    if (query.search) {
      where.push(`(
        LOWER(COALESCE(q.quote_number, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(q.holder_name, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(ct.name, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(q.policy_type, '')) LIKE LOWER($${param})
      )`);
      values.push(`%${String(query.search).trim()}%`);
      param++;
    }
    if (query.status) {
      where.push(`q.status = $${param}`);
      values.push(query.status);
      param++;
    }

    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total ${this.quoteJoins} WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.quoteSelect} ${this.quoteJoins}
        WHERE ${whereSql}
        ORDER BY q.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );

    return { data: rows, total, page, limit };
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
      `SELECT ${this.quoteSelect} ${this.quoteJoins}
        WHERE q.id = $1 AND q.team_id = ANY($2)`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Quote not found');
    return rows[0];
  }

  async createQuote(
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You must belong to a team to create quotes');
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, teamId);
    }
    this.validateQuotePremium(dto);

    const quoteNumber =
      (dto.quoteNumber && String(dto.quoteNumber).trim()) ||
      (await this.generateQuoteNumber(teamId));

    const { rows } = await this.db.query(
      `INSERT INTO insurance_quotes (
         team_id, created_by, quote_number, contact_id, holder_name, carrier_id,
         policy_type, quoted_premium, coverage_start, coverage_end,
         billing_frequency, valid_until, status, assigned_to, notes, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
       ) RETURNING id`,
      [
        teamId,
        userId,
        quoteNumber,
        dto.contactId || null,
        dto.holderName || null,
        dto.carrierId || null,
        dto.policyType || null,
        dto.quotedPremium ?? null,
        dto.coverageStart || null,
        dto.coverageEnd || null,
        dto.billingFrequency || null,
        dto.validUntil || null,
        dto.status || 'Draft',
        dto.assignedTo || null,
        dto.notes || null,
      ],
    );

    return this.findOneQuote(rows[0].id, userId, userTeamId, role);
  }

  async updateQuote(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const existing = await this.findOneQuote(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    if (dto.contactId) {
      await this.assertContactInTeam(dto.contactId, existing.teamId);
    }
    this.validateQuotePremium(dto);

    const columnByField: Array<[string, any]> = [
      ['quote_number', dto.quoteNumber],
      ['contact_id', dto.contactId],
      ['holder_name', dto.holderName],
      ['carrier_id', dto.carrierId],
      ['policy_type', dto.policyType],
      ['quoted_premium', dto.quotedPremium],
      ['coverage_start', dto.coverageStart],
      ['coverage_end', dto.coverageEnd],
      ['billing_frequency', dto.billingFrequency],
      ['valid_until', dto.validUntil],
      ['status', dto.status],
      ['assigned_to', dto.assignedTo],
      ['notes', dto.notes],
    ];

    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    for (const [col, val] of columnByField) {
      if (val !== undefined) {
        sets.push(`${col} = $${param}`);
        values.push(val === '' ? null : val);
        param++;
      }
    }
    if (!sets.length) return this.findOneQuote(id, userId, userTeamId, role);

    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;

    await this.db.query(
      `UPDATE insurance_quotes SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
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
    await this.findOneQuote(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    await this.db.query(
      `DELETE FROM insurance_quotes WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }

  // Normalize a DB DATE (pg returns a local-midnight JS Date) to a 'YYYY-MM-DD'
  // string, so carrying a date forward is timezone-independent (never shifts a
  // day like a raw Date re-serialized under a different session TZ would).
  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Convert an accepted quote into a policy, carrying forward the customer,
  // coverage, premium and notes so nothing is re-entered. Idempotent: if the
  // quote is already converted (and that policy still exists), returns it
  // instead of a duplicate. The attach is a guarded UPDATE (only when the link
  // is still unset), so a concurrent/retried convert can't leave two policies:
  // the loser deletes its just-created duplicate and returns the winner's.
  async convertQuoteToPolicy(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const quote = await this.findOneQuote(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    // Already converted and the policy still exists -> return it. If the policy
    // was deleted, allow re-conversion (overwriting the now-stale link).
    let stalePolicyId: string | null = null;
    if (quote.convertedPolicyId) {
      try {
        return await this.findOnePolicy(
          quote.convertedPolicyId,
          userId,
          userTeamId,
          role,
        );
      } catch {
        stalePolicyId = quote.convertedPolicyId;
      }
    }

    const policy = await this.createPolicy(
      {
        teamId: quote.teamId,
        contactId: quote.contactId || undefined,
        holderName: quote.holderName || undefined,
        carrierId: quote.carrierId || undefined,
        policyType: quote.policyType || undefined,
        premium:
          quote.quotedPremium != null ? Number(quote.quotedPremium) : undefined,
        coverageStart: this.toIsoDate(quote.coverageStart),
        coverageEnd: this.toIsoDate(quote.coverageEnd),
        billingFrequency: quote.billingFrequency || undefined,
        assignedTo: quote.assignedTo || undefined,
        notes: quote.notes || undefined,
        status: 'Pending',
      } as any,
      userId,
      userTeamId,
      role,
    );

    // Attach only if the link is still unset (or still the stale id we replace),
    // so exactly one convert wins.
    const guard = stalePolicyId
      ? 'AND (converted_policy_id IS NULL OR converted_policy_id = $4)'
      : 'AND converted_policy_id IS NULL';
    const params = stalePolicyId
      ? [policy.id, id, accessible, stalePolicyId]
      : [policy.id, id, accessible];
    const upd = await this.db.query(
      `UPDATE insurance_quotes
          SET status = 'Accepted', converted_policy_id = $1, updated_at = NOW()
        WHERE id = $2 AND team_id = ANY($3) ${guard}`,
      params,
    );

    if (upd.rowCount === 0) {
      // Another convert won the race: drop our duplicate, return the winner.
      await this.db.query(
        `DELETE FROM insurance_policies WHERE id = $1 AND team_id = ANY($2)`,
        [policy.id, accessible],
      );
      const fresh = await this.findOneQuote(id, userId, userTeamId, role);
      if (fresh.convertedPolicyId) {
        try {
          return await this.findOnePolicy(
            fresh.convertedPolicyId,
            userId,
            userTeamId,
            role,
          );
        } catch {
          /* fall through */
        }
      }
      throw new BadRequestException(
        'Could not convert the quote, please try again',
      );
    }

    return policy;
  }

  // ─── Renewals ──────────────────────────────────────────────────────────────

  private readonly renewalSelect = `
    r.id,
    r.team_id AS "teamId",
    r.created_by AS "createdBy",
    r.policy_id AS "policyId",
    p.policy_number AS "policyNumber",
    p.holder_name AS "policyHolder",
    r.contact_id AS "contactId",
    ct.name AS "contactName",
    r.carrier_id AS "carrierId",
    cr.name AS "carrierName",
    r.policy_type AS "snapshotPolicyType",
    r.holder_name AS "snapshotHolderName",
    r.billing_frequency AS "snapshotBillingFrequency",
    r.current_expiration AS "currentExpiration",
    r.renewal_date AS "renewalDate",
    r.current_premium AS "currentPremium",
    r.renewal_premium AS "renewalPremium",
    r.status,
    r.assigned_to AS "assignedTo",
    au.name AS "agentName",
    r.notes,
    r.renewed_policy_id AS "renewedPolicyId",
    rp.policy_number AS "renewedPolicyNumber",
    r.created_at AS "createdAt",
    r.updated_at AS "updatedAt"
  `;

  private readonly renewalJoins = `
    FROM insurance_renewals r
    LEFT JOIN insurance_policies p ON p.id = r.policy_id AND p.team_id = r.team_id
    LEFT JOIN contacts ct ON ct.id = r.contact_id AND ct.team_id = r.team_id
    LEFT JOIN insurance_carriers cr ON cr.id = r.carrier_id AND cr.team_id = r.team_id
    LEFT JOIN users au ON au.id = r.assigned_to
    LEFT JOIN insurance_policies rp ON rp.id = r.renewed_policy_id AND rp.team_id = r.team_id
  `;

  // Fetch an in-team policy with the fields a renewal snapshots / carries forward.
  private async getPolicyForRenewal(
    policyId: string,
    teamId: string,
  ): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, contact_id, carrier_id, coverage_end, premium, policy_type,
              holder_name, billing_frequency, assigned_to
         FROM insurance_policies WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [policyId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected policy is not in this account');
    }
    return rows[0];
  }

  private validateRenewalPremium(dto: { renewalPremium?: number }): void {
    if (
      dto.renewalPremium != null &&
      (isNaN(Number(dto.renewalPremium)) || Number(dto.renewalPremium) < 0)
    ) {
      throw new BadRequestException('Renewal premium must be zero or greater');
    }
  }

  private addYearsIso(value: any, years: number): string | undefined {
    const iso = this.toIsoDate(value);
    if (!iso) return undefined;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y + years, m - 1, d);
    // Clamp a Feb-29 source that overflowed into March back to the last day of
    // the intended month.
    if (dt.getMonth() !== (m - 1) % 12) dt.setDate(0);
    return this.toIsoDate(dt);
  }

  async findAllRenewals(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['r.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;

    if (query.search) {
      where.push(`(
        LOWER(COALESCE(p.policy_number, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(p.holder_name, '')) LIKE LOWER($${param})
        OR LOWER(COALESCE(ct.name, '')) LIKE LOWER($${param})
      )`);
      values.push(`%${String(query.search).trim()}%`);
      param++;
    }
    if (query.status) {
      where.push(`r.status = $${param}`);
      values.push(query.status);
      param++;
    }

    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total ${this.renewalJoins} WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.renewalSelect} ${this.renewalJoins}
        WHERE ${whereSql}
        ORDER BY r.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );

    return { data: rows, total, page, limit };
  }

  async findOneRenewal(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Renewal not found');

    const { rows } = await this.db.query(
      `SELECT ${this.renewalSelect} ${this.renewalJoins}
        WHERE r.id = $1 AND r.team_id = ANY($2)`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Renewal not found');
    return rows[0];
  }

  async createRenewal(
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException(
        'You must belong to a team to create renewals',
      );
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

    if (!dto.policyId) {
      throw new BadRequestException('A renewal must be linked to a policy');
    }
    const policy = await this.getPolicyForRenewal(dto.policyId, teamId);
    this.validateRenewalPremium(dto);

    const { rows } = await this.db.query(
      `INSERT INTO insurance_renewals (
         team_id, created_by, policy_id, contact_id, carrier_id,
         policy_type, holder_name, billing_frequency,
         current_expiration, renewal_date, current_premium, renewal_premium,
         status, assigned_to, notes, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
       ) RETURNING id`,
      [
        teamId,
        userId,
        dto.policyId,
        policy.contact_id || null,
        policy.carrier_id || null,
        policy.policy_type || null,
        policy.holder_name || null,
        policy.billing_frequency || null,
        this.toIsoDate(policy.coverage_end) || null,
        dto.renewalDate || null,
        policy.premium ?? null,
        dto.renewalPremium ?? null,
        dto.status || 'Upcoming',
        dto.assignedTo || null,
        dto.notes || null,
      ],
    );

    return this.findOneRenewal(rows[0].id, userId, userTeamId, role);
  }

  async updateRenewal(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    await this.findOneRenewal(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    this.validateRenewalPremium(dto);

    const columnByField: Array<[string, any]> = [
      ['renewal_date', dto.renewalDate],
      ['renewal_premium', dto.renewalPremium],
      ['status', dto.status],
      ['assigned_to', dto.assignedTo],
      ['notes', dto.notes],
    ];

    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    for (const [col, val] of columnByField) {
      if (val !== undefined) {
        sets.push(`${col} = $${param}`);
        values.push(val === '' ? null : val);
        param++;
      }
    }
    if (!sets.length) return this.findOneRenewal(id, userId, userTeamId, role);

    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;

    await this.db.query(
      `UPDATE insurance_renewals SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
    );

    return this.findOneRenewal(id, userId, userTeamId, role);
  }

  async removeRenewal(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    await this.findOneRenewal(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    await this.db.query(
      `DELETE FROM insurance_renewals WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }

  // Create the renewed policy term from a renewal, carrying forward the original
  // policy's details with the new premium and coverage period. The ORIGINAL
  // policy is left intact (history preserved). Same atomic guarded attach as
  // quote conversion so a retry can't create two renewed policies.
  async renewPolicy(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const renewal = await this.findOneRenewal(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    let stalePolicyId: string | null = null;
    if (renewal.renewedPolicyId) {
      try {
        return await this.findOnePolicy(
          renewal.renewedPolicyId,
          userId,
          userTeamId,
          role,
        );
      } catch {
        stalePolicyId = renewal.renewedPolicyId;
      }
    }

    // Prefer the live original policy's current details, but fall back to the
    // snapshot taken at renewal time so a renewal still works if the original
    // policy was deleted (history preserved on the renewal row).
    let orig: any = {};
    try {
      orig = await this.getPolicyForRenewal(renewal.policyId, renewal.teamId);
    } catch {
      orig = {};
    }
    const start =
      this.toIsoDate(renewal.renewalDate) ||
      this.toIsoDate(renewal.currentExpiration);
    const end = this.addYearsIso(
      renewal.renewalDate || renewal.currentExpiration,
      1,
    );

    const newPolicy = await this.createPolicy(
      {
        teamId: renewal.teamId,
        contactId: renewal.contactId || orig.contact_id || undefined,
        holderName: orig.holder_name || renewal.snapshotHolderName || undefined,
        carrierId: renewal.carrierId || orig.carrier_id || undefined,
        policyType: orig.policy_type || renewal.snapshotPolicyType || undefined,
        premium:
          renewal.renewalPremium != null
            ? Number(renewal.renewalPremium)
            : orig.premium != null
              ? Number(orig.premium)
              : renewal.currentPremium != null
                ? Number(renewal.currentPremium)
                : undefined,
        coverageStart: start,
        coverageEnd: end,
        billingFrequency:
          orig.billing_frequency || renewal.snapshotBillingFrequency || undefined,
        assignedTo: renewal.assignedTo || orig.assigned_to || undefined,
        status: 'Active',
      } as any,
      userId,
      userTeamId,
      role,
    );

    const guard = stalePolicyId
      ? 'AND (renewed_policy_id IS NULL OR renewed_policy_id = $4)'
      : 'AND renewed_policy_id IS NULL';
    const params = stalePolicyId
      ? [newPolicy.id, id, accessible, stalePolicyId]
      : [newPolicy.id, id, accessible];
    const upd = await this.db.query(
      `UPDATE insurance_renewals
          SET status = 'Renewed', renewed_policy_id = $1, updated_at = NOW()
        WHERE id = $2 AND team_id = ANY($3) ${guard}`,
      params,
    );

    if (upd.rowCount === 0) {
      await this.db.query(
        `DELETE FROM insurance_policies WHERE id = $1 AND team_id = ANY($2)`,
        [newPolicy.id, accessible],
      );
      const fresh = await this.findOneRenewal(id, userId, userTeamId, role);
      if (fresh.renewedPolicyId) {
        try {
          return await this.findOnePolicy(
            fresh.renewedPolicyId,
            userId,
            userTeamId,
            role,
          );
        } catch {
          /* fall through */
        }
      }
      throw new BadRequestException(
        'Could not create the renewed policy, please try again',
      );
    }

    return newPolicy;
  }

  // ─── Dashboard stats ─────────────────────────────────────────────────────

  // All KPI cards, the policies-by-type breakdown, upcoming renewals and a
  // recent-activity feed, computed server-side and team-scoped in one call.
  async getStats(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    const zero = {
      kpis: {
        activePolicies: { count: 0, totalPremium: 0 },
        expiring30: { count: 0, premiumAtRisk: 0 },
        openClaims: { count: 0, totalClaimed: 0 },
        claimsPaidThisMonth: { count: 0, totalPaid: 0 },
        commissionsDue: { amount: 0, count: 0 },
        renewalRate: { percent: 0 },
      },
      totalPolicies: 0,
      policiesByType: [],
      upcomingRenewals: [],
      recentActivity: [],
    };
    if (!accessible.length) return zero;

    const num = (v: any) => Number(v) || 0;

    const [activeP, exp, openC, paidC, ren, byType, upcoming, activity] =
      await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int AS count, COALESCE(SUM(premium),0) AS premium
             FROM insurance_policies WHERE team_id = ANY($1) AND status = 'Active'`,
          [accessible],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS count, COALESCE(SUM(premium),0) AS premium
             FROM insurance_policies
            WHERE team_id = ANY($1) AND coverage_end IS NOT NULL
              AND coverage_end >= CURRENT_DATE
              AND coverage_end <= CURRENT_DATE + INTERVAL '30 days'
              AND status NOT IN ('Cancelled','Expired','Lapsed')`,
          [accessible],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_claimed),0) AS amount
             FROM insurance_claims WHERE team_id = ANY($1)
              AND status NOT IN ('Paid','Denied','Closed')`,
          [accessible],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_paid),0) AS amount
             FROM insurance_claims WHERE team_id = ANY($1) AND status = 'Paid'
              AND resolved_date IS NOT NULL
              AND date_trunc('month', resolved_date) = date_trunc('month', CURRENT_DATE)`,
          [accessible],
        ),
        this.db.query(
          `SELECT
              COUNT(*) FILTER (WHERE status = 'Renewed')::int AS renewed,
              COUNT(*) FILTER (WHERE status IN ('Renewed','Lapsed','Declined'))::int AS terminal
             FROM insurance_renewals WHERE team_id = ANY($1)`,
          [accessible],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(policy_type), ''), 'Other') AS type,
                  COUNT(*)::int AS count
             FROM insurance_policies WHERE team_id = ANY($1)
            GROUP BY 1 ORDER BY count DESC`,
          [accessible],
        ),
        this.db.query(
          `SELECT p.id AS "id", p.policy_number AS "policyNumber",
                  p.policy_type AS "policyType",
                  COALESCE(ct.name, p.holder_name) AS "customer",
                  p.coverage_end AS "date", p.premium AS "premium",
                  (p.coverage_end - CURRENT_DATE)::int AS "daysLeft"
             FROM insurance_policies p
             LEFT JOIN contacts ct ON ct.id = p.contact_id AND ct.team_id = p.team_id
            WHERE p.team_id = ANY($1) AND p.coverage_end IS NOT NULL
              AND p.coverage_end >= CURRENT_DATE
              AND p.coverage_end <= CURRENT_DATE + INTERVAL '30 days'
              AND p.status NOT IN ('Cancelled','Expired','Lapsed')
            ORDER BY p.coverage_end ASC LIMIT 8`,
          [accessible],
        ),
        this.db.query(
          `SELECT kind, ref, name, status, created_at, updated_at FROM (
              SELECT 'Policy' AS kind, policy_number AS ref, holder_name AS name,
                     status, created_at, updated_at
                FROM insurance_policies WHERE team_id = ANY($1)
              UNION ALL SELECT 'Claim', claim_number, NULL, status, created_at, updated_at
                FROM insurance_claims WHERE team_id = ANY($1)
              UNION ALL SELECT 'Quote', quote_number, holder_name, status, created_at, updated_at
                FROM insurance_quotes WHERE team_id = ANY($1)
              UNION ALL SELECT 'Renewal', NULL, holder_name, status, created_at, updated_at
                FROM insurance_renewals WHERE team_id = ANY($1)
           ) t ORDER BY updated_at DESC LIMIT 6`,
          [accessible],
        ),
      ]);

    // Commissions table may not exist yet (built in a later phase).
    let commissionsDue = { amount: 0, count: 0 };
    try {
      const com = await this.db.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS amount
           FROM insurance_commissions WHERE team_id = ANY($1)
            AND status IN ('Pending','Due','Earned')`,
        [accessible],
      );
      commissionsDue = {
        amount: num(com.rows[0]?.amount),
        count: com.rows[0]?.count || 0,
      };
    } catch {
      /* commissions not built yet */
    }

    const totalPolicies = byType.rows.reduce(
      (s: number, r: any) => s + r.count,
      0,
    );
    const renewed = ren.rows[0]?.renewed || 0;
    const terminal = ren.rows[0]?.terminal || 0;

    const recentActivity = activity.rows.map((r: any) => {
      const created = new Date(r.created_at).getTime();
      const updated = new Date(r.updated_at).getTime();
      const isNew = updated - created < 3000;
      const ref = r.ref ? ` ${r.ref}` : '';
      const title = isNew
        ? `${r.kind}${ref} created`
        : `${r.kind}${ref} updated to ${r.status}`;
      return { title, subtitle: r.name || '', when: r.updated_at, kind: r.kind };
    });

    return {
      kpis: {
        activePolicies: {
          count: activeP.rows[0].count,
          totalPremium: num(activeP.rows[0].premium),
        },
        expiring30: {
          count: exp.rows[0].count,
          premiumAtRisk: num(exp.rows[0].premium),
        },
        openClaims: {
          count: openC.rows[0].count,
          totalClaimed: num(openC.rows[0].amount),
        },
        claimsPaidThisMonth: {
          count: paidC.rows[0].count,
          totalPaid: num(paidC.rows[0].amount),
        },
        commissionsDue,
        renewalRate: {
          percent: terminal ? Math.round((renewed / terminal) * 100) : 0,
        },
      },
      totalPolicies,
      policiesByType: byType.rows.map((r: any) => ({
        type: r.type,
        count: r.count,
        percent: totalPolicies ? Math.round((r.count / totalPolicies) * 100) : 0,
      })),
      upcomingRenewals: upcoming.rows.map((r: any) => ({
        ...r,
        premium: num(r.premium),
      })),
      recentActivity,
    };
  }

  // ─── Carriers ──────────────────────────────────────────────────────────────

  private readonly carrierSelect = `
    c.id,
    c.team_id AS "teamId",
    c.created_by AS "createdBy",
    c.name,
    c.carrier_mark AS "carrierMark",
    c.contact_email AS "contactEmail",
    c.contact_phone AS "contactPhone",
    c.status,
    c.notes,
    (SELECT COUNT(*)::int FROM insurance_policies p
       WHERE p.carrier_id = c.id AND p.team_id = c.team_id) AS "policyCount",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
  `;

  async searchCarriers(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    const teamId =
      userTeamId && accessible.includes(userTeamId) ? userTeamId : accessible[0];

    const values: any[] = [teamId];
    let where = 'team_id = $1';
    if (search && search.trim()) {
      where += ` AND LOWER(COALESCE(name, '')) LIKE LOWER($2)`;
      values.push(`%${String(search).trim()}%`);
    }
    const { rows } = await this.db.query(
      `SELECT id, name, carrier_mark AS "carrierMark"
         FROM insurance_carriers WHERE ${where} ORDER BY name ASC LIMIT 20`,
      values,
    );
    return rows;
  }

  async findAllCarriers(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['c.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;
    if (query.search) {
      where.push(
        `(LOWER(COALESCE(c.name,'')) LIKE LOWER($${param})
          OR LOWER(COALESCE(c.contact_email,'')) LIKE LOWER($${param}))`,
      );
      values.push(`%${String(query.search).trim()}%`);
      param++;
    }
    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM insurance_carriers c WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.carrierSelect} FROM insurance_carriers c
        WHERE ${whereSql} ORDER BY c.name ASC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );
    return { data: rows, total, page, limit };
  }

  async findOneCarrier(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Carrier not found');
    const { rows } = await this.db.query(
      `SELECT ${this.carrierSelect} FROM insurance_carriers c
        WHERE c.id = $1 AND c.team_id = ANY($2)`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Carrier not found');
    return rows[0];
  }

  async createCarrier(
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You must belong to a team to add carriers');
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

    const { rows } = await this.db.query(
      `INSERT INTO insurance_carriers (
         team_id, created_by, name, carrier_mark, contact_email, contact_phone,
         status, notes, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING id`,
      [
        teamId,
        userId,
        (dto.name || '').trim() || 'Carrier',
        dto.carrierMark || null,
        dto.contactEmail || null,
        dto.contactPhone || null,
        dto.status || 'active',
        dto.notes || null,
      ],
    );
    return this.findOneCarrier(rows[0].id, userId, userTeamId, role);
  }

  async updateCarrier(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    await this.findOneCarrier(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    const columnByField: Array<[string, any]> = [
      ['name', dto.name],
      ['carrier_mark', dto.carrierMark],
      ['contact_email', dto.contactEmail],
      ['contact_phone', dto.contactPhone],
      ['status', dto.status],
      ['notes', dto.notes],
    ];
    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    for (const [col, val] of columnByField) {
      if (val === undefined) continue;
      // name and status are NOT NULL: never write them blank.
      if ((col === 'name' || col === 'status') && String(val).trim() === '') {
        continue;
      }
      sets.push(`${col} = $${param}`);
      values.push(val === '' ? null : val);
      param++;
    }
    if (!sets.length) return this.findOneCarrier(id, userId, userTeamId, role);
    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;
    await this.db.query(
      `UPDATE insurance_carriers SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
    );
    return this.findOneCarrier(id, userId, userTeamId, role);
  }

  async removeCarrier(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    await this.findOneCarrier(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    await this.db.query(
      `DELETE FROM insurance_carriers WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }

  // ─── Commissions ───────────────────────────────────────────────────────────

  private readonly commissionSelect = `
    cm.id,
    cm.team_id AS "teamId",
    cm.created_by AS "createdBy",
    cm.policy_id AS "policyId",
    p.policy_number AS "policyNumber",
    p.holder_name AS "policyHolder",
    cm.contact_id AS "contactId",
    ct.name AS "contactName",
    cm.agent_id AS "agentId",
    au.name AS "agentName",
    cm.rate,
    cm.amount,
    cm.status,
    cm.period,
    cm.earned_date AS "earnedDate",
    cm.due_date AS "dueDate",
    cm.paid_date AS "paidDate",
    cm.notes,
    cm.created_at AS "createdAt",
    cm.updated_at AS "updatedAt"
  `;

  private readonly commissionJoins = `
    FROM insurance_commissions cm
    LEFT JOIN insurance_policies p ON p.id = cm.policy_id AND p.team_id = cm.team_id
    LEFT JOIN contacts ct ON ct.id = cm.contact_id AND ct.team_id = cm.team_id
    LEFT JOIN users au ON au.id = cm.agent_id
  `;

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  // Commission amount is authoritative from premium x rate when a rate is given;
  // otherwise a directly-entered amount is accepted (validated). Never trusts a
  // client-provided total when a rate is present.
  private resolveCommissionAmount(
    dto: { rate?: number; amount?: number },
    premium: any,
  ): number | null {
    if (dto.rate != null) {
      if (Number(dto.rate) < 0) {
        throw new BadRequestException('Commission rate must be zero or greater');
      }
      return this.round2(((Number(premium) || 0) * Number(dto.rate)) / 100);
    }
    if (dto.amount != null) {
      if (Number(dto.amount) < 0) {
        throw new BadRequestException(
          'Commission amount must be zero or greater',
        );
      }
      return this.round2(Number(dto.amount));
    }
    return null;
  }

  async findAllCommissions(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    const pageNum = Number(query.page);
    const page = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
    const limitNum = Number(query.limit);
    const limit = Number.isFinite(limitNum)
      ? Math.min(200, Math.max(1, Math.trunc(limitNum)))
      : 20;

    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['cm.team_id = ANY($1)'];
    const values: any[] = [accessible];
    let param = 2;
    if (query.search) {
      where.push(`(
        LOWER(COALESCE(p.policy_number,'')) LIKE LOWER($${param})
        OR LOWER(COALESCE(p.holder_name,'')) LIKE LOWER($${param})
        OR LOWER(COALESCE(ct.name,'')) LIKE LOWER($${param})
      )`);
      values.push(`%${String(query.search).trim()}%`);
      param++;
    }
    if (query.status) {
      where.push(`cm.status = $${param}`);
      values.push(query.status);
      param++;
    }
    const whereSql = where.join(' AND ');

    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total ${this.commissionJoins} WHERE ${whereSql}`,
      values,
    );
    const total = countRes.rows[0]?.total || 0;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = values.length;
    values.push(offset);
    const offsetParam = values.length;

    const { rows } = await this.db.query(
      `SELECT ${this.commissionSelect} ${this.commissionJoins}
        WHERE ${whereSql} ORDER BY cm.created_at DESC
        LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );
    return { data: rows, total, page, limit };
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
      `SELECT ${this.commissionSelect} ${this.commissionJoins}
        WHERE cm.id = $1 AND cm.team_id = ANY($2)`,
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
      throw new ForbiddenException(
        'You must belong to a team to create commissions',
      );
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    if (!dto.policyId) {
      throw new BadRequestException('A commission must be linked to a policy');
    }
    const policy = await this.getPolicyForRenewal(dto.policyId, teamId);
    if (dto.agentId) {
      // agent is an in-account user; the users join is not team-pinned, so we
      // fall back to the policy's agent when none is supplied.
    }
    const amount = this.resolveCommissionAmount(dto, policy.premium);
    const status = dto.status || 'Pending';
    const paidDate = status === 'Paid' ? this.toIsoDate(new Date()) : null;

    const { rows } = await this.db.query(
      `INSERT INTO insurance_commissions (
         team_id, created_by, policy_id, contact_id, agent_id, rate, amount,
         status, period, earned_date, due_date, paid_date, notes, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING id`,
      [
        teamId,
        userId,
        dto.policyId,
        policy.contact_id || null,
        dto.agentId || policy.assigned_to || null,
        dto.rate ?? null,
        amount,
        status,
        dto.period || null,
        dto.earnedDate || null,
        dto.dueDate || null,
        paidDate,
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
    const existing = await this.findOneCommission(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

    // Recompute the amount when the rate changes (from the policy's premium), or
    // when an amount is entered directly. undefined => leave the amount as-is.
    let amountChange: number | null | undefined;
    if (dto.rate != null) {
      if (Number(dto.rate) < 0) {
        throw new BadRequestException('Commission rate must be zero or greater');
      }
      let policyGone = false;
      let premium: any = null;
      try {
        const pol = await this.getPolicyForRenewal(
          existing.policyId,
          existing.teamId,
        );
        premium = pol.premium;
      } catch {
        policyGone = true;
      }
      if (!policyGone) {
        // Rate is authoritative: derive from premium (NULL premium -> 0). Never
        // let a client-supplied amount win when a rate is present.
        amountChange = this.round2(((Number(premium) || 0) * Number(dto.rate)) / 100);
      } else if (dto.amount != null) {
        if (Number(dto.amount) < 0) {
          throw new BadRequestException(
            'Commission amount must be zero or greater',
          );
        }
        amountChange = this.round2(Number(dto.amount));
      }
    } else if (dto.amount !== undefined) {
      if (dto.amount != null && Number(dto.amount) < 0) {
        throw new BadRequestException(
          'Commission amount must be zero or greater',
        );
      }
      amountChange = dto.amount == null ? null : this.round2(Number(dto.amount));
    }

    const sets: string[] = [];
    const values: any[] = [];
    let param = 1;
    const push = (col: string, val: any) => {
      sets.push(`${col} = $${param}`);
      values.push(val);
      param++;
    };

    const map: Array<[string, any]> = [
      ['agent_id', dto.agentId],
      ['rate', dto.rate],
      ['status', dto.status],
      ['period', dto.period],
      ['earned_date', dto.earnedDate],
      ['due_date', dto.dueDate],
      ['notes', dto.notes],
    ];
    for (const [col, val] of map) {
      if (val === undefined) continue;
      // status is NOT NULL: never write it blank.
      if (col === 'status' && String(val).trim() === '') continue;
      push(col, val === '' ? null : val);
    }
    if (amountChange !== undefined) push('amount', amountChange);
    if (dto.status === 'Paid' && !existing.paidDate) {
      push('paid_date', this.toIsoDate(new Date()));
    }
    // Clear the paid date if the commission moves back out of Paid.
    if (dto.status !== undefined && dto.status !== 'Paid' && existing.paidDate) {
      push('paid_date', null);
    }

    if (!sets.length) {
      return this.findOneCommission(id, userId, userTeamId, role);
    }
    sets.push('updated_at = NOW()');
    values.push(id);
    const idParam = param;
    param++;
    values.push(accessible);
    const teamParam = param;
    await this.db.query(
      `UPDATE insurance_commissions SET ${sets.join(', ')}
        WHERE id = $${idParam} AND team_id = ANY($${teamParam})`,
      values,
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
    await this.findOneCommission(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    await this.db.query(
      `DELETE FROM insurance_commissions WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    return { success: true };
  }
}
