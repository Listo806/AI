import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../users/entities/user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

const VALID_ROLES = [
  'owner', 'agent', 'developer', 'admin',
  'wholesaler', 'investor', 'va',
  'super_admin', 'va_uploader', 'user',
];

const SALT_ROUNDS = 10;

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(role?: string): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    if (role) {
      conditions.push('role = $1');
      params.push(role);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await this.db.query(
      `SELECT id, email, name, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       ${where}
       ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }

  async findOne(id: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException('User not found');
    }
    return rows[0];
  }

  async create(dto: CreateAdminUserDto): Promise<any> {
    const existing = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email],
    );
    if (existing.rows.length) {
      throw new ConflictException('User with this email already exists');
    }
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super Admin cannot be created via admin panel');
    }
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const isActive = dto.isActive !== false;
    const { rows } = await this.db.query(
      `INSERT INTO users (email, password, role, team_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [dto.email, hashedPassword, dto.role, dto.teamId ?? null, isActive],
    );
    return rows[0];
  }

  async update(id: string, dto: UpdateAdminUserDto): Promise<any> {
    const user = await this.findOne(id);
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.email !== undefined) {
      const { rows } = await this.db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [dto.email, id]);
      if (rows.length) {
        throw new ConflictException('Another user already has this email');
      }
      updates.push(`email = $${paramCount++}`);
      values.push(dto.email);
    }
    if (dto.password !== undefined && dto.password.length >= 6) {
      const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
      updates.push(`password = $${paramCount++}`);
      values.push(hashed);
    }
    if (dto.role !== undefined) {
      if (!VALID_ROLES.includes(dto.role)) {
        throw new BadRequestException(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      }
      updates.push(`role = $${paramCount++}`);
      values.push(dto.role);
    }
    if (dto.teamId !== undefined) {
      updates.push(`team_id = $${paramCount++}`);
      values.push(dto.teamId);
    }
    if (dto.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(dto.isActive);
    }

    if (updates.length === 0) {
      return user;
    }

    updates.push('token_version = COALESCE(token_version, 0) + 1');
    updates.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );
    return rows[0];
  }

  async updateRole(id: string, role: string): Promise<any> {
    return this.update(id, { role: role as UserRole });
  }

  /** Soft delete (Deactivate): set is_active = false and invalidate tokens.
   * Keeps the account and all data, only blocks access. */
  async remove(id: string): Promise<{ deleted: boolean }> {
    const { rowCount } = await this.db.query(
      `UPDATE users SET is_active = false, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
    if (rowCount === 0) {
      throw new NotFoundException('User not found');
    }
    return { deleted: true };
  }

  /**
   * Hard delete (permanent): removes the user account for good, inside a single
   * transaction so it either fully succeeds or changes nothing.
   *
   * SAFETY:
   *  - Super Admins and the caller's own account cannot be deleted.
   *  - If the user OWNS a workspace that still has other ACTIVE members, deletion
   *    is blocked (409) — ownership must be transferred first, so shared CRM data
   *    belonging to other active users is never destroyed by accident.
   *  - When safe, the user's own solo workspace(s) and their data are removed via
   *    the schema's ON DELETE CASCADE, after first clearing the few FK references
   *    that would otherwise RESTRICT the delete (team invitations/notifications
   *    and the "invited_by" audit link).
   */
  async hardRemove(
    id: string,
    currentUserId?: string,
  ): Promise<{ deleted: boolean }> {
    const { rows: urows } = await this.db.query(
      `SELECT id, role FROM users WHERE id = $1`,
      [id],
    );
    const target = urows[0];
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (String(target.role) === 'super_admin') {
      throw new BadRequestException('Super Admin accounts cannot be deleted');
    }
    if (currentUserId && String(currentUserId) === String(id)) {
      throw new BadRequestException('You cannot delete your own account');
    }

    // Workspaces this user owns.
    const { rows: teamRows } = await this.db.query(
      `SELECT id FROM teams WHERE owner_id = $1`,
      [id],
    );
    const ownedTeamIds: string[] = teamRows.map((r) => r.id);

    // Ownership safety: block if any owned workspace still has OTHER active
    // members. Their shared data must not be deleted — transfer ownership first.
    if (ownedTeamIds.length) {
      const { rows: cnt } = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM team_members
          WHERE team_id = ANY($1::uuid[])
            AND user_id <> $2
            AND status = 'active'`,
        [ownedTeamIds, id],
      );
      const others = cnt[0]?.n ?? 0;
      if (others > 0) {
        // BadRequest (400) rather than Conflict (409): the shared API client
        // rewrites 409 into a signup-specific message, but passes 400 messages
        // through unchanged so the admin sees the real reason.
        throw new BadRequestException(
          `This user owns a workspace with ${others} other active member(s). ` +
            `Transfer workspace ownership to another user before deleting this account.`,
        );
      }
    }

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      // Clear the FK references that RESTRICT the team/user delete.
      await client.query(
        `DELETE FROM team_notifications
          WHERE team_id = ANY($1::uuid[]) OR user_id = $2 OR actor_user_id = $2`,
        [ownedTeamIds, id],
      );
      await client.query(
        `DELETE FROM team_invitations
          WHERE team_id = ANY($1::uuid[]) OR invited_by = $2`,
        [ownedTeamIds, id],
      );
      // "invited_by" on memberships in OTHER teams points at this user (RESTRICT);
      // null it so the membership record stays but no longer blocks the delete.
      await client.query(
        `UPDATE team_members SET invited_by = NULL WHERE invited_by = $1`,
        [id],
      );

      // Delete the owned workspace(s): cascades leads, contacts, deals,
      // subscriptions, memberships, ai_* config, etc., and detaches members
      // (users.team_id -> NULL), which also releases teams.owner_id.
      if (ownedTeamIds.length) {
        await client.query(`DELETE FROM teams WHERE id = ANY($1::uuid[])`, [
          ownedTeamIds,
        ]);
      }

      // Finally the user (cascades their memberships and the records they
      // authored via ON DELETE CASCADE / SET NULL).
      const del = await client.query(`DELETE FROM users WHERE id = $1`, [id]);

      await client.query('COMMIT');

      // Best-effort, non-blocking cleanup of rows with no FK (never fail the
      // delete over these): the sign-up email history.
      try {
        await this.db.query(`DELETE FROM email_log WHERE user_id = $1`, [id]);
      } catch {
        /* email_log may not exist in some environments — ignore */
      }

      return { deleted: (del.rowCount ?? 0) > 0 };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
