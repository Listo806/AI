import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../users/entities/user.entity';

const VALID_ROLES = [
  'owner', 'agent', 'developer', 'admin',
  'wholesaler', 'investor', 'va',
  'super_admin', 'va_uploader', 'user',
];

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
      `SELECT id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       ${where}
       ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }

  async updateRole(id: string, role: string): Promise<any> {
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const { rows } = await this.db.query(
      `UPDATE users SET role = $1, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive"`,
      [role, id],
    );

    if (!rows.length) {
      throw new NotFoundException('User not found');
    }

    return rows[0];
  }
}
