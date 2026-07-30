import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../users/entities/user.entity';

/**
 * Bootstrap Super Admin from env vars if configured.
 * Env: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
 * Creates user with role=super_admin if not exists.
 */
@Injectable()
export class SuperAdminBootstrapService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {}

  async onModuleInit() {
    const email = this.config.get('SUPER_ADMIN_EMAIL');
    const password = this.config.get('SUPER_ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    try {
      const { rows } = await this.db.query(
        `SELECT id FROM users WHERE email = $1`,
        [email],
      );

      if (rows.length > 0) {
        const existing = rows[0];
        const { rows: roleRows } = await this.db.query(
          `SELECT role FROM users WHERE id = $1`,
          [existing.id],
        );
        // Already a super_admin: leave the account (and its password) untouched
        // so a redeploy never clobbers a password the admin changed in-app. To
        // rotate the admin password later, use the in-app change-password flow,
        // not this env var.
        if (roleRows[0]?.role === UserRole.SUPER_ADMIN) {
          console.log(`[SuperAdminBootstrap] ${email} is already super_admin — no change`);
          return;
        }
        // The email exists but is not yet an admin (e.g. it was registered once
        // as an ordinary account). Promote it AND set the configured password,
        // so SUPER_ADMIN_PASSWORD always logs in even when the address existed
        // before. Without this, the old password would win and the configured
        // one would silently fail. Bump token_version to drop any stale sessions.
        const hashedExisting = await bcrypt.hash(password, 10);
        await this.db.query(
          `UPDATE users
             SET role = $1,
                 password = $2,
                 is_active = true,
                 token_version = COALESCE(token_version, 1) + 1,
                 updated_at = NOW()
           WHERE id = $3`,
          [UserRole.SUPER_ADMIN, hashedExisting, existing.id],
        );
        console.log(`[SuperAdminBootstrap] Promoted existing user ${email} to super_admin and set the configured password`);
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await this.db.query(
        `INSERT INTO users (email, password, role, team_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, true, NOW(), NOW())`,
        [email, hashedPassword, UserRole.SUPER_ADMIN],
      );
      console.log(`[SuperAdminBootstrap] Created super_admin: ${email}`);
    } catch (err: any) {
      console.error(`[SuperAdminBootstrap] Failed: ${err?.message}`);
    }
  }
}
