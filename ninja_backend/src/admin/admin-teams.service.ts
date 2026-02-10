import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAdminTeamDto } from './dto/create-admin-team.dto';
import { UpdateAdminTeamDto } from './dto/update-admin-team.dto';

@Injectable()
export class AdminTeamsService {
  constructor(private readonly db: DatabaseService) {}

  private mapTeam(row: any) {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.ownerId ?? row.owner_id,
      seatLimit: row.seatLimit ?? row.seat_limit,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
      ownerEmail: row.ownerEmail ?? row.owner_email,
      memberCount: row.member_count != null ? parseInt(String(row.member_count), 10) : undefined,
    };
  }

  async findAll(): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT t.id, t.name, t.owner_id as "ownerId", t.seat_limit as "seatLimit",
              t.created_at as "createdAt", t.updated_at as "updatedAt",
              u.email as "ownerEmail",
              (SELECT COUNT(*) FROM users u2 WHERE u2.team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN users u ON u.id = t.owner_id
       ORDER BY t.created_at DESC`,
    );
    return rows.map((r) => this.mapTeam(r));
  }

  async findOne(id: string): Promise<any> {
    const { rows: teamRows } = await this.db.query(
      `SELECT t.id, t.name, t.owner_id as "ownerId", t.seat_limit as "seatLimit",
              t.created_at as "createdAt", t.updated_at as "updatedAt",
              u.email as "ownerEmail"
       FROM teams t
       LEFT JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1`,
      [id],
    );
    if (!teamRows.length) {
      throw new NotFoundException('Team not found');
    }
    const team = this.mapTeam(teamRows[0]);
    const ownerId = team.ownerId;

    const { rows: memberRows } = await this.db.query(
      `SELECT id, email, role, is_active as "isActive", created_at as "createdAt"
       FROM users WHERE team_id = $1 ORDER BY (id = $2) DESC, created_at ASC`,
      [id, ownerId],
    );
    const members = memberRows.map((m: any) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      isActive: m.isActive,
      createdAt: m.createdAt,
      isOwner: m.id === ownerId,
    }));

    return { ...team, members };
  }

  async create(dto: CreateAdminTeamDto): Promise<any> {
    const ownerId = dto.ownerId;
    const { rows: userRows } = await this.db.query(
      'SELECT id FROM users WHERE id = $1',
      [ownerId],
    );
    if (!userRows.length) {
      throw new BadRequestException('Owner user not found');
    }

    const seatLimit = dto.seatLimit ?? 1;

    const { rows } = await this.db.query(
      `INSERT INTO teams (name, owner_id, seat_limit, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [dto.name, ownerId, seatLimit],
    );
    const team = rows[0];

    await this.db.query(
      `UPDATE users SET team_id = $1, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $2`,
      [team.id, ownerId],
    );

    return this.findOne(team.id);
  }

  async update(id: string, dto: UpdateAdminTeamDto): Promise<any> {
    const existing = await this.db.query(
      'SELECT id, owner_id FROM teams WHERE id = $1',
      [id],
    );
    if (!existing.rows.length) {
      throw new NotFoundException('Team not found');
    }
    const currentOwnerId = existing.rows[0].owner_id;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(dto.name);
    }
    if (dto.seatLimit !== undefined) {
      if (dto.seatLimit < 1) {
        throw new BadRequestException('Seat limit must be at least 1');
      }
      updates.push(`seat_limit = $${paramCount++}`);
      values.push(dto.seatLimit);
    }
    if (dto.ownerId !== undefined && dto.ownerId !== currentOwnerId) {
      const { rows: ownerCheck } = await this.db.query(
        'SELECT id FROM users WHERE id = $1',
        [dto.ownerId],
      );
      if (!ownerCheck.length) {
        throw new BadRequestException('New owner user not found');
      }
      updates.push(`owner_id = $${paramCount++}`);
      values.push(dto.ownerId);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(id);
      await this.db.query(
        `UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values,
      );

      if (dto.ownerId !== undefined && dto.ownerId !== currentOwnerId) {
        await this.db.query(
          `UPDATE users SET team_id = NULL, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $1`,
          [currentOwnerId],
        );
        await this.db.query(
          `UPDATE users SET team_id = $1, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $2`,
          [id, dto.ownerId],
        );
        await this.db.query(
          `UPDATE teams SET token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $1`,
          [id],
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const existing = await this.db.query('SELECT id FROM teams WHERE id = $1', [id]);
    if (!existing.rows.length) {
      throw new NotFoundException('Team not found');
    }

    await this.db.query(
      `UPDATE users SET team_id = NULL, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE team_id = $1`,
      [id],
    );
    await this.db.query('DELETE FROM teams WHERE id = $1', [id]);

    return { deleted: true };
  }

  async getSeatCount(teamId: string): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*) as c FROM users WHERE team_id = $1 AND is_active = true`,
      [teamId],
    );
    return parseInt(rows[0]?.c ?? '0', 10);
  }

  async addMember(teamId: string, userId: string): Promise<any> {
    const { rows: teamRows } = await this.db.query(
      'SELECT id, seat_limit FROM teams WHERE id = $1',
      [teamId],
    );
    if (!teamRows.length) {
      throw new NotFoundException('Team not found');
    }
    const seatLimit = teamRows[0].seat_limit;
    const currentCount = await this.getSeatCount(teamId);
    if (currentCount >= seatLimit) {
      throw new BadRequestException('Team has no available seats');
    }

    const { rows: userRows } = await this.db.query(
      'SELECT id FROM users WHERE id = $1',
      [userId],
    );
    if (!userRows.length) {
      throw new NotFoundException('User not found');
    }

    await this.db.query(
      `UPDATE users SET team_id = $1, is_active = true, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $2`,
      [teamId, userId],
    );
    await this.db.query(
      `UPDATE teams SET token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $1`,
      [teamId],
    );

    return this.findOne(teamId);
  }

  async removeMember(teamId: string, userId: string): Promise<any> {
    const { rows: teamRows } = await this.db.query(
      'SELECT id, owner_id FROM teams WHERE id = $1',
      [teamId],
    );
    if (!teamRows.length) {
      throw new NotFoundException('Team not found');
    }
    if (teamRows[0].owner_id === userId) {
      throw new BadRequestException('Cannot remove team owner from the team. Change owner first or delete the team.');
    }

    const { rowCount } = await this.db.query(
      `UPDATE users SET team_id = NULL, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $1 AND team_id = $2`,
      [userId, teamId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('User is not a member of this team');
    }

    await this.db.query(
      `UPDATE teams SET token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE id = $1`,
      [teamId],
    );

    return this.findOne(teamId);
  }
}
