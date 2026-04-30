import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

const OWNER_ROLE = 'owner';

@Injectable()
export class ContactsService {
  constructor(private readonly db: DatabaseService) {}

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

  private async validateLeadForContact(leadId: string, contactTeamId: string, userId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id, team_id, created_by FROM leads WHERE id = $1`,
      [leadId],
    );
    if (rows.length === 0) {
      throw new BadRequestException('Lead not found');
    }
    const lead = rows[0];
    const sameTeam = lead.team_id && lead.team_id === contactTeamId;
    const createdByUser = lead.created_by === userId;
    if (!sameTeam && !createdByUser) {
      throw new BadRequestException('Lead must belong to the same team as the contact or be created by you');
    }
  }

  private selectColumns =
    'id, team_id AS "teamId", created_by AS "createdBy", name, email, phone, lead_id AS "leadId", notes, created_at AS "createdAt", updated_at AS "updatedAt"';

  async findAll(
    userId: string,
    userTeamId: string | null,
    role: string,
    queryTeamId?: string,
  ): Promise<any[]> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) {
      throw new ForbiddenException('User must be part of a team to manage contacts');
    }

    let teamIds: string[];
    if (queryTeamId) {
      await this.ensureCanAccessTeam(queryTeamId, accessible);
      teamIds = [queryTeamId];
    } else {
      teamIds = accessible;
    }

    const placeholders = teamIds.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `SELECT c.id, c.team_id AS "teamId", c.created_by AS "createdBy", c.name, c.email, c.phone, c.lead_id AS "leadId", c.notes, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
      l.name AS "leadName"
      FROM contacts c
      LEFT JOIN leads l ON l.id = c.lead_id
      WHERE c.team_id IN (${placeholders})
      ORDER BY c.created_at DESC`;
    const { rows } = await this.db.query(sql, teamIds);
    return rows;
  }

  async findOne(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) throw new ForbiddenException('User must be part of a team to manage contacts');

    const placeholders = accessible.map((_, i) => `$${i + 2}`).join(', ');
    const { rows } = await this.db.query(
      `SELECT c.id, c.team_id AS "teamId", c.created_by AS "createdBy", c.name, c.email, c.phone, c.lead_id AS "leadId", c.notes, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        l.name AS "leadName"
       FROM contacts c
       LEFT JOIN leads l ON l.id = c.lead_id
       WHERE c.id = $1 AND c.team_id IN (${placeholders})`,
      [id, ...accessible],
    );
    if (rows.length === 0) throw new NotFoundException('Contact not found');
    return rows[0];
  }

  async create(dto: CreateContactDto, userId: string, userTeamId: string | null, role: string): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (accessible.length === 0) {
      throw new ForbiddenException('User must be part of a team to create contacts');
    }

    const teamId = dto.teamId && accessible.includes(dto.teamId) ? dto.teamId : userTeamId || accessible[0];
    await this.ensureCanAccessTeam(teamId, accessible);

    if (dto.leadId) await this.validateLeadForContact(dto.leadId, teamId, userId);

    const { rows } = await this.db.query(
      `INSERT INTO contacts (team_id, created_by, name, email, phone, lead_id, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING ${this.selectColumns}`,
      [
        teamId,
        userId,
        dto.name.trim(),
        dto.email?.trim() || null,
        dto.phone?.trim() || null,
        dto.leadId || null,
        dto.notes?.trim() || null,
      ],
    );
    return rows[0];
  }

  async update(
    id: string,
    dto: UpdateContactDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    const contact = await this.findOne(id, userId, userTeamId, role);
    const teamId = contact.teamId;

    if (dto.leadId !== undefined && dto.leadId != null) {
      await this.validateLeadForContact(dto.leadId, teamId, userId);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name.trim());
    }
    if (dto.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(dto.email?.trim() || null);
    }
    if (dto.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(dto.phone?.trim() || null);
    }
    if (dto.leadId !== undefined) {
      updates.push(`lead_id = $${paramIndex++}`);
      values.push(dto.leadId);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes?.trim() || null);
    }
    if (updates.length === 0) return this.findOne(id, userId, userTeamId, role);
    updates.push(`updated_at = NOW()`);
    values.push(id, teamId);
    const idParam = values.length - 1;
    const teamParam = values.length;
    const { rows } = await this.db.query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${idParam} AND team_id = $${teamParam}
       RETURNING ${this.selectColumns}`,
      values,
    );
    return rows[0];
  }

  async remove(id: string, userId: string, userTeamId: string | null, role: string): Promise<void> {
    const contact = await this.findOne(id, userId, userTeamId, role);
    await this.db.query('DELETE FROM contacts WHERE id = $1 AND team_id = $2', [id, contact.teamId]);
  }
}
