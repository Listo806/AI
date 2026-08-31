import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SuperAdminBootstrapService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {}

  private async ensureInternalAccess(userId: string) {
    try {
      await this.db.query(
        `INSERT INTO internal_user_access
          (user_id, internal_role, status, permissions, granted_by, granted_at, deactivated_at, updated_at)
         VALUES ($1, 'super_admin', 'active', '["*"]'::jsonb, NULL, NOW(), NULL, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET internal_role = 'super_admin',
             status = 'active',
             permissions = '["*"]'::jsonb,
             deactivated_at = NULL,
             updated_at = NOW()`,
        [userId],
      );
    } catch (err: any) {
      // Migration may intentionally be run immediately after the first deploy.
      // Do not prevent the app from booting if the new table is not present yet.
      if (err?.code === '42P01') {
        console.warn('[SuperAdminBootstrap] internal_user_access table not found; run the internal-access migration');
        return;
      }
      throw err;
    }
  }

  async onModuleInit() {
    const email = this.config.get('SUPER_ADMIN_EMAIL');
    const password = this.config.get('SUPER_ADMIN_PASSWORD');
    if (!email || !password) return;

    try {
      const { rows } = await this.db.query(
        `SELECT id, role FROM users WHERE email = $1`,
        [email],
      );

      if (rows.length > 0) {
        const existing = rows[0];
        if (existing.role !== UserRole.SUPER_ADMIN) {
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
          console.log(`[SuperAdminBootstrap] Promoted existing user ${email} to super_admin`);
        } else {
          console.log(`[SuperAdminBootstrap] ${email} is already super_admin`);
        }

        await this.ensureInternalAccess(existing.id);
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const { rows: inserted } = await this.db.query(
        `INSERT INTO users (email, password, role, team_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, true, NOW(), NOW())
         RETURNING id`,
        [email, hashedPassword, UserRole.SUPER_ADMIN],
      );
      await this.ensureInternalAccess(inserted[0].id);
      console.log(`[SuperAdminBootstrap] Created super_admin: ${email}`);
    } catch (err: any) {
      console.error(`[SuperAdminBootstrap] Failed: ${err?.message}`);
    }
  }
}
