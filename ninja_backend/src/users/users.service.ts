import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    email: string;
    password: string;
    role: UserRole;
    teamId?: string | null;
  }): Promise<User> {
    const { rows } = await this.db.query(
      `INSERT INTO users (email, password, role, team_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [data.email, data.password, data.role, data.teamId || null],
    );
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query(
      `SELECT id, email, password, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.db.query(
      `SELECT id, email, password, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.password !== undefined) {
      updates.push(`password = $${paramCount++}`);
      values.push(data.password);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(data.role);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );
    return rows[0];
  }
}

