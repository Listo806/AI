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
      `SELECT id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
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

  /** Soft delete: set is_active = false and invalidate tokens */
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
}
