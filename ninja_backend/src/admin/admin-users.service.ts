import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../database/database.service';
import {
  CreateAdminUserDto,
  InternalUserRole,
  InternalUserStatus,
} from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

const SALT_ROUNDS = 10;

const ROLE_PERMISSIONS: Record<InternalUserRole, string[]> = {
  super_admin: ['*'],
  admin: ['admin:read', 'admin:write', 'internal_users:manage'],
  developer: ['admin:read', 'developer:tools'],
  support: ['admin:read', 'support:customers'],
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: DatabaseService) {}

  private normalizePermissions(role: InternalUserRole, permissions?: string[]) {
    const raw = Array.isArray(permissions) && permissions.length
      ? permissions
      : ROLE_PERMISSIONS[role];
    return [...new Set(raw.map((x) => String(x).trim()).filter(Boolean))];
  }

  private async writeAudit(
    actorUserId: string | null | undefined,
    targetUserId: string | null | undefined,
    internalAccessId: string | null | undefined,
    action: string,
    beforeData?: any,
    afterData?: any,
    metadata: any = {},
    client?: any,
  ) {
    const executor = client ?? this.db;
    await executor.query(
      `INSERT INTO internal_access_audit
        (actor_user_id, target_user_id, internal_access_id, action, before_data, after_data, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW())`,
      [
        actorUserId ?? null,
        targetUserId ?? null,
        internalAccessId ?? null,
        action,
        beforeData == null ? null : JSON.stringify(beforeData),
        afterData == null ? null : JSON.stringify(afterData),
        JSON.stringify(metadata ?? {}),
      ],
    );
  }

  private async assertNotLastActiveSuperAdmin(
    targetUserId: string,
    nextRole?: InternalUserRole,
    nextStatus?: InternalUserStatus,
    client?: any,
  ) {
    const executor = client ?? this.db;
    const { rows } = await executor.query(
      `SELECT internal_role as "role", status
         FROM internal_user_access
        WHERE user_id = $1`,
      [targetUserId],
    );
    const current = rows[0];
    if (!current) return;

    const removingSuperAdmin =
      current.role === 'super_admin' &&
      ((nextRole !== undefined && nextRole !== 'super_admin') ||
        (nextStatus !== undefined && nextStatus !== 'active'));

    if (!removingSuperAdmin) return;

    const { rows: countRows } = await executor.query(
      `SELECT COUNT(*)::int AS count
         FROM internal_user_access
        WHERE internal_role = 'super_admin'
          AND status = 'active'
          AND user_id <> $1`,
      [targetUserId],
    );

    if ((countRows[0]?.count ?? 0) < 1) {
      throw new BadRequestException(
        'This is the last active Super Admin. Grant Super Admin access to another internal user before changing or deactivating this account.',
      );
    }
  }

  private selectSql(where = '') {
    return `
      SELECT
        u.id,
        u.email,
        u.name,
        u.team_id as "teamId",
        u.is_active as "identityActive",
        u.created_at as "identityCreatedAt",
        u.updated_at as "identityUpdatedAt",
        u.last_seen_at as "lastActive",
        ia.id as "internalAccessId",
        ia.internal_role as role,
        ia.status,
        (ia.status = 'active') as "isActive",
        ia.permissions,
        ia.granted_by as "grantedBy",
        ia.granted_at as "createdAt",
        ia.updated_at as "updatedAt",
        ia.deactivated_at as "deactivatedAt",
        EXISTS (SELECT 1 FROM teams t WHERE t.owner_id = u.id) as "ownsWorkspace",
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id) as "isTeamMember"
      FROM internal_user_access ia
      JOIN users u ON u.id = ia.user_id
      ${where}
    `;
  }

  async findAll(
    role?: string,
    status?: string,
    q?: string,
  ): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (role) {
      params.push(role);
      conditions.push(`ia.internal_role = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`ia.status = $${params.length}`);
    }
    if (q?.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(
        `(COALESCE(u.name, '') ILIKE $${params.length} OR u.email ILIKE $${params.length})`,
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.db.query(
      `${this.selectSql(where)} ORDER BY ia.granted_at DESC, u.created_at DESC`,
      params,
    );
    return rows;
  }

  async findOne(id: string): Promise<any> {
    const { rows } = await this.db.query(
      `${this.selectSql('WHERE u.id = $1 OR ia.id = $1')} LIMIT 1`,
      [id],
    );
    if (!rows.length) {
      throw new NotFoundException('Internal user not found');
    }

    const user = rows[0];
    const { rows: auditRows } = await this.db.query(
      `SELECT id, action, actor_user_id as "actorUserId", before_data as "beforeData",
              after_data as "afterData", metadata, created_at as "createdAt"
         FROM internal_access_audit
        WHERE target_user_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [user.id],
    );

    return { ...user, audit: auditRows };
  }

  async create(dto: CreateAdminUserDto, actorUserId?: string): Promise<any> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      const email = dto.email.trim().toLowerCase();
      const name = dto.name.trim();
      const status: InternalUserStatus = dto.status ?? 'active';
      const permissions = this.normalizePermissions(dto.role, dto.permissions);

      const { rows: existingUsers } = await client.query(
        `SELECT id, email, name, role, team_id as "teamId", is_active as "isActive"
           FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1`,
        [email],
      );

      let userId: string;
      let identityCreated = false;

      if (existingUsers.length) {
        userId = existingUsers[0].id;
        const { rows: existingAccess } = await client.query(
          `SELECT id FROM internal_user_access WHERE user_id = $1`,
          [userId],
        );
        if (existingAccess.length) {
          throw new ConflictException('This account already has internal access');
        }

        await client.query(
          `UPDATE users
              SET name = CASE WHEN $1 <> '' THEN $1 ELSE name END,
                  updated_at = NOW()
            WHERE id = $2`,
          [name, userId],
        );
      } else {
        const randomPassword = randomBytes(48).toString('base64url');
        const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);
        const compatibilityRole =
          dto.role === 'support' ? 'user' : dto.role;
        const { rows: inserted } = await client.query(
          `INSERT INTO users
            (email, name, password, role, team_id, is_active, created_at, updated_at, token_version)
           VALUES ($1, $2, $3, $4, NULL, true, NOW(), NOW(), 1)
           RETURNING id`,
          [email, name, hashedPassword, compatibilityRole],
        );
        userId = inserted[0].id;
        identityCreated = true;
      }

      const { rows: accessRows } = await client.query(
        `INSERT INTO internal_user_access
          (user_id, internal_role, status, permissions, granted_by, granted_at, deactivated_at, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, NOW(),
                 CASE WHEN $3 = 'inactive' THEN NOW() ELSE NULL END,
                 NOW())
         RETURNING id`,
        [userId, dto.role, status, JSON.stringify(permissions), actorUserId ?? null],
      );

      await client.query(
        `UPDATE users
            SET token_version = COALESCE(token_version, 1) + 1,
                updated_at = NOW()
          WHERE id = $1`,
        [userId],
      );

      await this.writeAudit(
        actorUserId,
        userId,
        accessRows[0].id,
        'internal_user_created',
        null,
        { name, email, role: dto.role, status, permissions },
        { identityCreated },
        client,
      );

      await client.query('COMMIT');
      return this.findOne(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
    actorUserId?: string,
  ): Promise<any> {
    const current = await this.findOne(id);
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      await this.assertNotLastActiveSuperAdmin(
        current.id,
        dto.role,
        dto.status,
        client,
      );

      if (dto.email !== undefined) {
        const email = dto.email.trim().toLowerCase();
        const { rows } = await client.query(
          `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2`,
          [email, current.id],
        );
        if (rows.length) {
          throw new ConflictException('Another account already uses this email');
        }
        await client.query(
          `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
          [email, current.id],
        );
      }

      if (dto.name !== undefined) {
        await client.query(
          `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
          [dto.name.trim() || null, current.id],
        );
      }

      const nextRole = (dto.role ?? current.role) as InternalUserRole;
      const nextStatus = (dto.status ?? current.status) as InternalUserStatus;
      const nextPermissions = dto.permissions !== undefined
        ? this.normalizePermissions(nextRole, dto.permissions)
        : dto.role !== undefined && dto.role !== current.role
          ? this.normalizePermissions(nextRole)
          : current.permissions ?? this.normalizePermissions(nextRole);

      await client.query(
        `UPDATE internal_user_access
            SET internal_role = $1,
                status = $2,
                permissions = $3::jsonb,
                deactivated_at = CASE
                  WHEN $2 = 'inactive' AND status <> 'inactive' THEN NOW()
                  WHEN $2 = 'active' THEN NULL
                  ELSE deactivated_at
                END,
                updated_at = NOW()
          WHERE user_id = $4`,
        [nextRole, nextStatus, JSON.stringify(nextPermissions), current.id],
      );

      await client.query(
        `UPDATE users
            SET token_version = COALESCE(token_version, 1) + 1,
                updated_at = NOW()
          WHERE id = $1`,
        [current.id],
      );

      await this.writeAudit(
        actorUserId,
        current.id,
        current.internalAccessId,
        'internal_access_updated',
        {
          name: current.name,
          email: current.email,
          role: current.role,
          status: current.status,
          permissions: current.permissions,
        },
        {
          name: dto.name ?? current.name,
          email: dto.email ?? current.email,
          role: nextRole,
          status: nextStatus,
          permissions: nextPermissions,
        },
        {},
        client,
      );

      await client.query('COMMIT');
      return this.findOne(current.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRole(
    id: string,
    role: InternalUserRole,
    actorUserId?: string,
  ): Promise<any> {
    return this.update(id, { role }, actorUserId);
  }

  async deactivate(id: string, actorUserId?: string) {
    const current = await this.findOne(id);
    await this.assertNotLastActiveSuperAdmin(current.id, undefined, 'inactive');
    if (current.status === 'inactive') {
      return { deactivated: true };
    }

    await this.db.query(
      `UPDATE internal_user_access
          SET status = 'inactive', deactivated_at = NOW(), updated_at = NOW()
        WHERE user_id = $1`,
      [current.id],
    );
    await this.db.query(
      `UPDATE users
          SET token_version = COALESCE(token_version, 1) + 1, updated_at = NOW()
        WHERE id = $1`,
      [current.id],
    );
    await this.writeAudit(
      actorUserId,
      current.id,
      current.internalAccessId,
      'internal_user_deactivated',
      { status: current.status },
      { status: 'inactive' },
    );
    return { deactivated: true };
  }

  async reactivate(id: string, actorUserId?: string) {
    const current = await this.findOne(id);
    await this.db.query(
      `UPDATE internal_user_access
          SET status = 'active', deactivated_at = NULL, updated_at = NOW()
        WHERE user_id = $1`,
      [current.id],
    );
    await this.db.query(
      `UPDATE users
          SET token_version = COALESCE(token_version, 1) + 1, updated_at = NOW()
        WHERE id = $1`,
      [current.id],
    );
    await this.writeAudit(
      actorUserId,
      current.id,
      current.internalAccessId,
      'internal_user_reactivated',
      { status: current.status },
      { status: 'active' },
    );
    return { reactivated: true };
  }

  async resetPassword(
    id: string,
    newPassword: string,
    actorUserId?: string,
  ) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    const current = await this.findOne(id);
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.db.query(
      `UPDATE users
          SET password = $1,
              token_version = COALESCE(token_version, 1) + 1,
              updated_at = NOW()
        WHERE id = $2`,
      [hashed, current.id],
    );
    await this.writeAudit(
      actorUserId,
      current.id,
      current.internalAccessId,
      'internal_user_password_reset',
      null,
      null,
    );
    return { reset: true };
  }

  /**
   * Deletes INTERNAL ACCESS only. The users identity is intentionally preserved
   * so customer authentication, teams, subscriptions, billing and history cannot
   * be destroyed from the Internal Users page.
   */
  async hardRemove(id: string, actorUserId?: string): Promise<{ deleted: boolean; identityPreserved: boolean }> {
    const current = await this.findOne(id);
    await this.assertNotLastActiveSuperAdmin(current.id, undefined, 'inactive');

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await this.writeAudit(
        actorUserId,
        current.id,
        current.internalAccessId,
        'internal_user_deleted',
        {
          role: current.role,
          status: current.status,
          permissions: current.permissions,
        },
        null,
        { identityPreserved: true },
        client,
      );
      const result = await client.query(
        `DELETE FROM internal_user_access WHERE user_id = $1`,
        [current.id],
      );
      await client.query(
        `UPDATE users
            SET token_version = COALESCE(token_version, 1) + 1,
                updated_at = NOW()
          WHERE id = $1`,
        [current.id],
      );
      await client.query('COMMIT');
      return {
        deleted: (result.rowCount ?? 0) > 0,
        identityPreserved: true,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Backward-compatible alias for the old DELETE /admin/users/:id endpoint.
  async remove(id: string, actorUserId?: string) {
    return this.deactivate(id, actorUserId);
  }
}
