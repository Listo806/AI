import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private lifecycleColsReady = false;

  constructor(private readonly db: DatabaseService) {}

  // Self-healing: the email/language columns ship in migration 101 but migrations
  // are not auto-run here, so ensure they exist before we write to them.
  private async ensureLifecycleColumns(): Promise<void> {
    if (this.lifecycleColsReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en'`,
    );
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ`,
    );
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS abandoned_email_sent_at TIMESTAMPTZ`,
    );
    this.lifecycleColsReady = true;
  }

  async create(data: {
    email: string;
    password: string;
    role: UserRole;
    teamId?: string | null;
    preferredLanguage?: string | null;
  }): Promise<User> {
    await this.ensureLifecycleColumns();
    const lang = ['en', 'es', 'pt'].includes(String(data.preferredLanguage))
      ? data.preferredLanguage
      : 'en';
    const { rows } = await this.db.query(
      `INSERT INTO users (email, password, role, team_id, preferred_language, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, email, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      [data.email, data.password, data.role, data.teamId || null, lang],
    );
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    // Case-insensitive so a capitalized-at-signup email still matches a
    // lowercase login (mobile keyboards auto-capitalize email fields).
    const { rows } = await this.db.query(
      `SELECT id, email, name, phone, password, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", payment_status as "paymentStatus", plan, selected_plan as "selectedPlan"
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    return rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.db.query(
      `SELECT id, email, name, phone, password, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt", payment_status as "paymentStatus", plan, selected_plan as "selectedPlan"
       FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async update(id: string, data: Partial<User & { teamId: string | null; isActive: boolean }>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    let shouldInvalidateTokens = false;

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
      shouldInvalidateTokens = true; // Role change invalidates tokens
    }
    if (data.teamId !== undefined) {
      updates.push(`team_id = $${paramCount++}`);
      values.push(data.teamId);
      shouldInvalidateTokens = true; // Team change invalidates tokens
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
      shouldInvalidateTokens = true; // Active status change invalidates tokens
    }

    if (updates.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    // Increment token_version to invalidate existing tokens when critical changes occur
    if (shouldInvalidateTokens) {
      updates.push(`token_version = token_version + 1`);
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

  /**
   * Update current user's profile (name, phone only). Used by PATCH /users/me.
   */
  async updateProfile(
    userId: string,
    dto: { name?: string | null; phone?: string | null },
  ): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(dto.name || null);
    }
    if (dto.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(dto.phone || null);
    }

    if (updates.length === 0) {
      return this.findById(userId) as Promise<User>;
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const { rows } = await this.db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, email, name, phone, role, team_id as "teamId", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );
    return rows[0];
  }

  
}

