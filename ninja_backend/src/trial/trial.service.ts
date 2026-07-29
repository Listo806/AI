import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TrialService {
  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async startTrial(dto: any) {
    try {
      console.log('DTO:', dto);

      const { password, name, phone, role } = dto;
      // Normalize the email so it matches at login regardless of casing/spaces.
      const email = (dto.email || '').trim().toLowerCase();

      const { rows: existing } = await this.db.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
        [email],
      );

      if (existing.length > 0) {
        throw new ConflictException('Email already exists');
      }

      const hashed = await bcrypt.hash(password, 10);

      /*
      |--------------------------------------------------------------------------
      | CREATE DEFAULT TEAM
      |--------------------------------------------------------------------------
      */

      const teamName =
        name
          ? `${name.split(' ')[0]}'s Team`
          : 'My Team';

      const { rows: teamRows } = await this.db.query(
        `
        INSERT INTO teams
        (
          name,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          NOW(),
          NOW()
        )
        RETURNING id
        `,
        [teamName],
      );

      const teamId = teamRows[0].id;

      /*
      |--------------------------------------------------------------------------
      | CREATE USER
      |--------------------------------------------------------------------------
      */

      const { rows } = await this.db.query(
        `
        INSERT INTO users
        (
          email,
          password,
          name,
          phone,
          role,
          plan,
          selected_plan,
          is_active,
          payment_status,
          team_id,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          'TRIAL',
          $6,
          true,
          'trial',
          $7,
          NOW(),
          NOW()
        )
        RETURNING id
        `,
        [
          email,
          hashed,
          name || null,
          phone || null,
          role || 'owner',
          dto.plan || null,
          teamId,
        ],
      );

      console.log('INSERTED USER:', rows);

      const newUserId = rows[0].id;

      // Make the trial user the OWNER of their team and an active member. The
      // raw team INSERT above does not set owner_id (unlike teamsService.create),
      // and without this the owner could not invite members and plan-based seat
      // limits (which resolve the tier from the team owner) would not work.
      await this.db.query(
        `UPDATE teams SET owner_id = $1, updated_at = NOW() WHERE id = $2`,
        [newUserId, teamId],
      );
      await this.db.query(
        `INSERT INTO team_members (team_id, user_id, role, status, created_at, updated_at)
         VALUES ($1, $2, 'owner', 'active', NOW(), NOW())
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teamId, newUserId],
      );

      const session = await this.authService.loginById(newUserId);

      return {
        success: true,
        userId: newUserId,
        teamId,
        ...session,
      };
    } catch (err) {
      console.error('🔥 TRIAL ERROR:', err);
      throw err;
    }
  }
}