import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Team, CreateTeamDto, UpdateTeamDto } from './entities/team.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTeamDto: CreateTeamDto, ownerId: string): Promise<Team> {
    const seatLimit = createTeamDto.seatLimit || 1;

    const { rows } = await this.db.query(
      `INSERT INTO teams (name, owner_id, seat_limit, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [createTeamDto.name, ownerId, seatLimit],
    );

    const team = rows[0];

    // Update owner's team_id
    await this.usersService.update(ownerId, { teamId: team.id } as any);

    return team;
  }

  async findById(id: string): Promise<Team | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Team[]> {
    const { rows } = await this.db.query(
      `SELECT t.id, t.name, t.owner_id as "ownerId", t.seat_limit as "seatLimit", t.created_at as "createdAt", t.updated_at as "updatedAt"
       FROM teams t
       JOIN users u ON u.team_id = t.id
       WHERE u.id = $1`,
      [userId],
    );
    return rows;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string): Promise<Team> {
    const team = await this.findById(id);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Only owner can update team
    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can update the team');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateTeamDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateTeamDto.name);
    }

    if (updateTeamDto.seatLimit !== undefined) {
      if (updateTeamDto.seatLimit < 1) {
        throw new BadRequestException('Seat limit must be at least 1');
      }
      updates.push(`seat_limit = $${paramCount++}`);
      values.push(updateTeamDto.seatLimit);
    }

    if (updates.length === 0) {
      return team;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    const updatedTeam = rows[0];

    // Enforce seat limits if seat limit was changed
    if (updateTeamDto.seatLimit !== undefined) {
      await this.enforceSeatLimits(id);
    }

    return updatedTeam;
  }

  async getSeatCount(teamId: string): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT COUNT(*) as count
       FROM users
       WHERE team_id = $1 AND is_active = true`,
      [teamId],
    );
    return parseInt(rows[0].count, 10);
  }

  async getAvailableSeats(teamId: string): Promise<number> {
    const team = await this.findById(teamId);
    if (!team) {
      return 0;
    }
    const currentSeats = await this.getSeatCount(teamId);
    return Math.max(0, team.seatLimit - currentSeats);
  }

  async canAddMember(teamId: string): Promise<boolean> {
    const availableSeats = await this.getAvailableSeats(teamId);
    return availableSeats > 0;
  }

  async enforceSeatLimits(teamId: string): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      return;
    }

    const { rows } = await this.db.query(
      `SELECT id FROM users
       WHERE team_id = $1 AND is_active = true AND role != 'owner'
       ORDER BY created_at ASC`,
      [teamId],
    );

    const activeMembers = rows;
    const limit = team.seatLimit - 1; // -1 for owner

    if (activeMembers.length > limit) {
      const toDeactivate = activeMembers.slice(limit);
      const ids = toDeactivate.map((m: any) => m.id);

      if (ids.length > 0) {
        await this.db.query(
          `UPDATE users SET is_active = false WHERE id = ANY($1::uuid[])`,
          [ids],
        );
      }
    }
  }

  async addMember(teamId: string, userId: string, requestingUserId: string): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Only owner can add members
    if (team.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only team owner can add members');
    }

    // Check if seats are available
    if (!(await this.canAddMember(teamId))) {
      throw new BadRequestException('No available seats in this team');
    }

    // Add user to team
    await this.usersService.update(userId, { teamId, isActive: true } as any);

    // Enforce seat limits
    await this.enforceSeatLimits(teamId);
  }

  async removeMember(teamId: string, userId: string, requestingUserId: string): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Only owner can remove members (and can't remove themselves)
    if (team.ownerId !== requestingUserId) {
      throw new ForbiddenException('Only team owner can remove members');
    }

    if (userId === team.ownerId) {
      throw new BadRequestException('Cannot remove team owner');
    }

    // Remove user from team
    await this.usersService.update(userId, { teamId: null } as any);
  }
}

