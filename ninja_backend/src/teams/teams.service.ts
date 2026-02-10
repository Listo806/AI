import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Team, CreateTeamDto, UpdateTeamDto } from './entities/team.entity';
import { UsersService } from '../users/users.service';
import { EventLoggerService } from '../analytics/events/event-logger.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
    private readonly eventLogger: EventLoggerService,
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

    // Set creating owner as a member of the new team (owner is always in the team they create)
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

  /** Ensure user can access team: must be owner or a member. Owner can manage only their own teams. */
  async ensureCanAccessTeam(teamId: string, userId: string): Promise<Team> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    const isOwner = team.ownerId === userId;
    const { rows: memberCheck } = await this.db.query(
      'SELECT id FROM users WHERE id = $1 AND team_id = $2',
      [userId, teamId],
    );
    const isMember = memberCheck.length > 0;
    if (!isOwner && !isMember) {
      throw new ForbiddenException('You can only access your own teams or teams you are a member of');
    }
    return team;
  }

  /** Teams the user owns (owner_id = userId) OR the single team they are a member of (team_id). One owner can have multiple teams. */
  async findByUserId(userId: string): Promise<Team[]> {
    const { rows } = await this.db.query(
      `SELECT t.id, t.name, t.owner_id as "ownerId", t.seat_limit as "seatLimit", t.created_at as "createdAt", t.updated_at as "updatedAt"
       FROM teams t
       WHERE t.owner_id = $1
          OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)
       ORDER BY t.created_at DESC`,
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
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Lock team row
      const { rows: teamRows } = await client.query(
        `SELECT seat_limit, token_version FROM teams WHERE id = $1 FOR UPDATE`,
        [teamId],
      );

      if (teamRows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const seatLimit = teamRows[0].seat_limit;
      const limit = seatLimit - 1; // -1 for owner

      // Get active members (excluding owner) ordered by creation date
      const { rows } = await client.query(
        `SELECT id FROM users
         WHERE team_id = $1 AND is_active = true AND role != 'owner'
         ORDER BY created_at ASC`,
        [teamId],
      );

      const activeMembers = rows;

      if (activeMembers.length > limit) {
        const toDeactivate = activeMembers.slice(limit);
        const ids = toDeactivate.map((m: any) => m.id);

        if (ids.length > 0) {
          // Deactivate excess members
          await client.query(
            `UPDATE users SET is_active = false, updated_at = NOW() 
             WHERE id = ANY($1::uuid[])`,
            [ids],
          );

          // Increment team token version to invalidate tokens for deactivated users
          await client.query(
            `UPDATE teams 
             SET token_version = token_version + 1, updated_at = NOW()
             WHERE id = $1`,
            [teamId],
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addMember(teamId: string, userId: string, requestingUserId: string): Promise<void> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Lock team row to prevent concurrent modifications (row-level locking)
      const { rows: teamRows } = await client.query(
        `SELECT id, owner_id, seat_limit, token_version
         FROM teams WHERE id = $1 FOR UPDATE`,
        [teamId],
      );

      if (teamRows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('Team not found');
      }

      const team = teamRows[0];

      // Only owner can add members
      if (team.owner_id !== requestingUserId) {
        await client.query('ROLLBACK');
        throw new ForbiddenException('Only team owner can add members');
      }

      // Get current active seat count (excluding owner)
      const { rows: seatCountRows } = await client.query(
        `SELECT COUNT(*) as count
         FROM users
         WHERE team_id = $1 AND is_active = true AND role != 'owner'`,
        [teamId],
      );

      const currentSeats = parseInt(seatCountRows[0].count, 10);
      const availableSeats = team.seat_limit - 1 - currentSeats; // -1 for owner

      if (availableSeats <= 0) {
        await client.query('ROLLBACK');
        throw new BadRequestException('No available seats in this team');
      }

      // Atomically add user to team and activate
      await client.query(
        `UPDATE users 
         SET team_id = $1, is_active = true, updated_at = NOW()
         WHERE id = $2`,
        [teamId, userId],
      );

      // Increment team token version to invalidate existing tokens
      await client.query(
        `UPDATE teams 
         SET token_version = token_version + 1, updated_at = NOW()
         WHERE id = $1`,
        [teamId],
      );

      await client.query('COMMIT');

      // Log event after successful commit
      await this.eventLogger.logTeamMemberAdded(teamId, requestingUserId, userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

    // Log event
    await this.eventLogger.logTeamMemberRemoved(teamId, requestingUserId, userId);
  }

  /** List members of a team. Caller must be team owner or a member. */
  async getMembers(teamId: string, requestingUserId: string): Promise<any[]> {
    const team = await this.ensureCanAccessTeam(teamId, requestingUserId);
    const { rows } = await this.db.query(
      `SELECT id, email, role, is_active as "isActive"
       FROM users WHERE team_id = $1 ORDER BY (id = $2) DESC`,
      [teamId, team.ownerId],
    );
    return rows.map((m: any) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      isActive: m.isActive,
      isOwner: m.id === team.ownerId,
    }));
  }

  /** Add a member to the team by email (owner only). */
  async addMemberByEmail(teamId: string, email: string, requestingUserId: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }
    await this.addMember(teamId, user.id, requestingUserId);
  }

  /** Delete a team (owner only). Unlinks all members, then deletes the team. Owner can only delete their own teams. */
  async remove(teamId: string, userId: string): Promise<{ deleted: boolean }> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    if (team.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own teams');
    }
    await this.db.query(
      `UPDATE users SET team_id = NULL, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE team_id = $1`,
      [teamId],
    );
    await this.db.query('DELETE FROM teams WHERE id = $1', [teamId]);
    return { deleted: true };
  }
}

