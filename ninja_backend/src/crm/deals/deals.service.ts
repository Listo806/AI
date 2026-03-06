import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

@Injectable()
export class DealsService {
  constructor(private readonly db: DatabaseService) {}

  private async ensureTeamAccess(teamId: string | null): Promise<void> {
    if (!teamId) {
      throw new ForbiddenException('User must be part of a team to manage deals');
    }
  }

  async findAll(teamId: string | null): Promise<any[]> {
    await this.ensureTeamAccess(teamId);
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", name, value, stage, position, lead_id AS "leadId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM deals
       WHERE team_id = $1
       ORDER BY stage, position ASC, created_at ASC`,
      [teamId],
    );
    return rows;
  }

  async findOne(id: string, teamId: string | null): Promise<any> {
    await this.ensureTeamAccess(teamId);
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", name, value, stage, position, lead_id AS "leadId", notes, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM deals WHERE id = $1 AND team_id = $2`,
      [id, teamId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Deal not found');
    }
    return rows[0];
  }

  async create(dto: CreateDealDto, teamId: string | null): Promise<any> {
    await this.ensureTeamAccess(teamId);
    const stage = dto.stage && STAGES.includes(dto.stage as any) ? dto.stage : 'new';
    const position = typeof dto.position === 'number' && dto.position >= 0 ? dto.position : 0;
    const value = typeof dto.value === 'number' && dto.value >= 0 ? dto.value : 0;
    const { rows } = await this.db.query(
      `INSERT INTO deals (team_id, name, value, stage, position, lead_id, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, team_id AS "teamId", name, value, stage, position, lead_id AS "leadId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [teamId, dto.name, value, stage, position, dto.leadId || null, dto.notes || null],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateDealDto, teamId: string | null): Promise<any> {
    await this.findOne(id, teamId);
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
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes);
    }
    if (updates.length === 0) {
      return this.findOne(id, teamId);
    }
    updates.push(`updated_at = NOW()`);
    values.push(id, teamId);
    const idParam = values.length - 1;
    const teamParam = values.length;
    const { rows } = await this.db.query(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = $${idParam} AND team_id = $${teamParam}
       RETURNING id, team_id AS "teamId", name, value, stage, position, lead_id AS "leadId", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
      values,
    );
    return rows[0];
  }

  async updateStage(id: string, stage: string, position: number, teamId: string | null): Promise<any> {
    if (!STAGES.includes(stage as any)) {
      throw new ForbiddenException(`Invalid stage. Must be one of: ${STAGES.join(', ')}`);
    }
    return this.update(id, { stage: stage as typeof STAGES[number], position: position ?? 0 }, teamId);
  }

  async remove(id: string, teamId: string | null): Promise<void> {
    await this.findOne(id, teamId);
    await this.db.query('DELETE FROM deals WHERE id = $1 AND team_id = $2', [id, teamId]);
  }
}
