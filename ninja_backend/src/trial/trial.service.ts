import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TrialService {
  private signupColsReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  // Self-healing: the sign-up attribution columns ship in migration 102 but
  // migrations are not auto-run here, so ensure they exist before we write them.
  private async ensureSignupColumns(): Promise<void> {
    if (this.signupColsReady) return;
    const cols = [
      `preferred_language VARCHAR(5) DEFAULT 'en'`,
      `registered_at TIMESTAMPTZ DEFAULT NOW()`,
      `landing_page TEXT`,
      `utm_source TEXT`,
      `utm_medium TEXT`,
      `utm_campaign TEXT`,
      `utm_term TEXT`,
      `utm_content TEXT`,
      `gclid TEXT`,
      `offer_used VARCHAR(32)`,
      `checkout_status VARCHAR(24) DEFAULT 'registered'`,
      `abandoned_stage SMALLINT NOT NULL DEFAULT 0`,
      `welcome_email_sent_at TIMESTAMPTZ`,
    ];
    for (const c of cols) {
      await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c}`);
    }
    this.signupColsReady = true;
  }

  async startTrial(dto: any) {
    try {
      console.log('DTO:', dto);

      // SECURITY: never read `role` from the signup payload. A public trial
      // signup must always create a plain team OWNER. Trusting a client-supplied
      // role let anyone POST role:"super_admin" and self-grant platform admin.
      const { password, name, phone } = dto;
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

      // Capture the sign-up attribution passed by the front end, so an abandoned
      // registration is a complete, permanently-kept record even before payment.
      await this.ensureSignupColumns();
      const lang = ['en', 'es', 'pt'].includes(String(dto.language))
        ? dto.language
        : 'en';
      const utm = dto.utm || {};
      const offerUsed = dto.offer === 'exit7' ? 'exit7' : 'standard';

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
          preferred_language,
          landing_page,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,
          gclid,
          offer_used,
          checkout_status,
          registered_at,
          created_at,
          updated_at
        )
        VALUES
        (
          $1, $2, $3, $4, $5, 'TRIAL', $6, true, 'trial', $7,
          $8, $9, $10, $11, $12, $13, $14, $15, $16, 'registered', NOW(),
          NOW(), NOW()
        )
        RETURNING id
        `,
        [
          email,
          hashed,
          name || null,
          phone || null,
          'owner',
          dto.plan || null,
          teamId,
          lang,
          dto.landingPage || null,
          utm.source || dto.utmSource || null,
          utm.medium || dto.utmMedium || null,
          utm.campaign || dto.utmCampaign || null,
          utm.term || dto.utmTerm || null,
          utm.content || dto.utmContent || null,
          dto.gclid || null,
          offerUsed,
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