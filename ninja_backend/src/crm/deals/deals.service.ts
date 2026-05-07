import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
const OWNER_ROLE = 'owner';

@Injectable()
export class DealsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Team IDs the user can access: for owner = teams they own + team they're member of; for agent/va = [user.teamId].
   */
  private async getAccessibleTeamIds(userId: string, userTeamId: string | null, role: string): Promise<string[]> {
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

  private async ensureCanAccessTeam(teamId: string, accessibleIds: string[]): Promise<void> {
    if (!accessibleIds.includes(teamId)) {
      throw new ForbiddenException('You do not have access to this team');
    }
  }

  private async validateLeadForDeal(leadId: string, dealTeamId: string, userId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id, team_id, created_by FROM leads WHERE id = $1`,
      [leadId],
    );
    if (rows.length === 0) {
      throw new BadRequestException('Lead not found');
    }
    const lead = rows[0];
    const sameTeam = lead.team_id && lead.team_id === dealTeamId;
    const createdByUser = lead.created_by === userId;
    if (!sameTeam && !createdByUser) {
      throw new BadRequestException('Lead must belong to the same team as the deal or be created by you');
    }
  }

  private async ensureAssignedToIsTeamMember(assignedTo: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT 1 FROM users WHERE id = $1 AND (team_id = $2 OR id = (SELECT owner_id FROM teams WHERE id = $2))`,
      [assignedTo, teamId],
    );
    if (rows.length === 0) {
      throw new BadRequestException('Assigned user must be a member of the team or the team owner');
    }
  }

  private selectColumns = `id, team_id AS "teamId", name, value, stage, position, lead_id AS "leadId",
    created_by AS "createdBy", assigned_to AS "assignedTo", notes, created_at AS "createdAt", updated_at AS "updatedAt"`;

  async findAll(
    userId: string,
    userTeamId: string | null,
    role: string,
    queryTeamId?: string,
    assignedToMe?: boolean,
  ): Promise<any[]> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) {
      return [];
      //throw new ForbiddenException('User must be part of a team to manage deals');
    }

    let teamIds: string[];
    if (queryTeamId) {
      await this.ensureCanAccessTeam(queryTeamId, accessible);
      teamIds = [queryTeamId];
    } else {
      teamIds = accessible;
    }

    const placeholders = teamIds.map((_, i) => `$${i + 1}`).join(', ');
    let sql = `SELECT ${this.selectColumns} FROM deals WHERE team_id IN (${placeholders})`;
    const params: any[] = [...teamIds];
    if (assignedToMe) {
      params.push(userId);
      sql += ` AND assigned_to = $${params.length}`;
    }
    sql += ` ORDER BY stage, position ASC, created_at ASC`;

    const { rows } = await this.db.query(sql, params);
    return rows;
  }

  async findOne(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) return null; //throw new ForbiddenException('User must be part of a team to manage deals');

    const placeholders = accessible.map((_, i) => `$${i + 2}`).join(', ');
    const { rows } = await this.db.query(
      `SELECT ${this.selectColumns} FROM deals WHERE id = $1 AND team_id IN (${placeholders})`,
      [id, ...accessible],
    );
    if (rows.length === 0) throw new NotFoundException('Deal not found');
    return rows[0];
  }

  async create(dto: CreateDealDto, userId: string, userTeamId: string | null, role: string): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) {
      throw new ForbiddenException('User must be part of a team to create deals');
    }

    const teamId = dto.teamId && accessible.includes(dto.teamId) ? dto.teamId : userTeamId || accessible[0];
    await this.ensureCanAccessTeam(teamId, accessible);

    if (dto.leadId) await this.validateLeadForDeal(dto.leadId, teamId, userId);
    if (dto.assignedTo) await this.ensureAssignedToIsTeamMember(dto.assignedTo, teamId);

    const stage = dto.stage && STAGES.includes(dto.stage as any) ? dto.stage : 'new';
    const position = typeof dto.position === 'number' && dto.position >= 0 ? dto.position : 0;
    const value = typeof dto.value === 'number' && dto.value >= 0 ? dto.value : 0;

    const { rows } = await this.db.query(
      `INSERT INTO deals (team_id, name, value, stage, position, lead_id, created_by, assigned_to, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING ${this.selectColumns}`,
      [
        teamId,
        dto.name,
        value,
        stage,
        position,
        dto.leadId || null,
        userId,
        dto.assignedTo || null,
        dto.notes || null,
      ],
    );
    return rows[0];
  }

  async update(
    id: string,
    dto: UpdateDealDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    const deal = await this.findOne(id, userId, userTeamId, role);
    const teamId = deal.teamId;

    if (dto.leadId !== undefined && dto.leadId != null) {
      await this.validateLeadForDeal(dto.leadId, teamId, userId);
    }
    if (dto.assignedTo !== undefined && dto.assignedTo != null) {
      await this.ensureAssignedToIsTeamMember(dto.assignedTo, teamId);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.value !== undefined) {
      updates.push(`value = $${paramIndex++}`);
      values.push(dto.value);
    }
    if (dto.stage !== undefined && STAGES.includes(dto.stage as any)) {
      updates.push(`stage = $${paramIndex++}`);
      values.push(dto.stage);
    }
    if (dto.position !== undefined && dto.position >= 0) {
      updates.push(`position = $${paramIndex++}`);
      values.push(dto.position);
    }
    if (dto.leadId !== undefined) {
      updates.push(`lead_id = $${paramIndex++}`);
      values.push(dto.leadId);
    }
    if (dto.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(dto.assignedTo);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes);
    }
    if (updates.length === 0) return this.findOne(id, userId, userTeamId, role);
    updates.push(`updated_at = NOW()`);
    values.push(id, teamId);
    const idParam = values.length - 1;
    const teamParam = values.length;
    const { rows } = await this.db.query(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = $${idParam} AND team_id = $${teamParam}
       RETURNING ${this.selectColumns}`,
      values,
    );
    return rows[0];
  }

  async updateStage(
    id: string,
    stage: string,
    position: number,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    if (!STAGES.includes(stage as any)) {
      throw new ForbiddenException(`Invalid stage. Must be one of: ${STAGES.join(', ')}`);
    }
    return this.update(id, { stage: stage as typeof STAGES[number], position: position ?? 0 }, userId, userTeamId, role);
  }

  async remove(id: string, userId: string, userTeamId: string | null, role: string): Promise<void> {
    const deal = await this.findOne(id, userId, userTeamId, role);
    await this.db.query('DELETE FROM deals WHERE id = $1 AND team_id = $2', [id, deal.teamId]);
  }
}
