import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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

  async findAllPolicies(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
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
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException(
        'You must belong to a team to create policies',
      );
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);

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
    await this.findOnePolicy(id, userId, userTeamId, role);
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);

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
}
