import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import { normalizePlanId } from '../plans/plan-config';
import { captureSignupCountry } from '../common/signup-geo.util';

@Injectable()
export class TrialService {
  private signupColsReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly authService: AuthService,
    private readonly mailer: PlatformMailerService,
  ) {}

  // Resolve the site language the customer actually registered in. Primary source
  // is the value the front end sends (derived from the URL/i18n at submit).
  // Fallback: infer es/pt from the landing-page URL version so campaign traffic
  // (Spanish/Portuguese landing pages) is captured even if the client value is
  // missing. Never silently default everything to 'en'.
  private resolveLanguage(dto: any): string {
    const supported = ['en', 'es', 'pt'];
    const direct = String(dto?.language || '').trim().toLowerCase();
    if (supported.includes(direct)) return direct;
    const landing = String(dto?.landingPage || '');
    const m = landing.match(/\/(es|pt)(?:[/?#]|$)/i);
    if (m) return m[1].toLowerCase();
    return 'en';
  }

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
      `billing_cycle VARCHAR(10)`,
      `plan_status VARCHAR(24) DEFAULT 'active'`,
      `signup_source VARCHAR(32)`,
      `signup_country VARCHAR(2)`,
    ];
    for (const c of cols) {
      await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c}`);
    }
    this.signupColsReady = true;
  }

  async startTrial(
    dto: any,
    geo?: { country?: string | null; ip?: string | null },
  ) {
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
      const lang = this.resolveLanguage(dto);
      const utm = dto.utm || {};
      const offerUsed = dto.offer === 'exit7' ? 'exit7' : 'standard';

      // Plan may be unknown at signup: Create Account creates the account first
      // and the plan is chosen on the next (pricing) step. Free is created active
      // and enters the CRM; a paid tier stays 'trial' until payment; a no-plan
      // popup signup is 'registered' (a saved lead) until they pick a plan.
      const rawPlan = String(dto.plan || '').trim().toLowerCase();
      const isFree = rawPlan === 'free';
      const knownPaid = ['solo', 'business', 'scale', 'team', 'growth'].includes(
        rawPlan,
      );
      const noPlan = !isFree && !knownPaid;
      const selectedPlan = isFree || knownPaid ? dto.plan : null;
      const source = dto.source ? String(dto.source).slice(0, 32) : 'organic';
      const billingCycle = ['monthly', 'annual'].includes(
        String(dto.billingCycle),
      )
        ? dto.billingCycle
        : isFree || noPlan
          ? null
          : 'monthly';
      const paymentStatus = isFree ? 'free' : noPlan ? 'registered' : 'trial';
      const checkoutStatus = isFree ? 'free' : noPlan ? 'registered' : 'registered';

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
          billing_cycle,
          checkout_status,
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
          signup_source,
          registered_at,
          created_at,
          updated_at
        )
        VALUES
        (
          $1, $2, $3, $4, $5, 'TRIAL', $6, true, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          NOW(), NOW(), NOW()
        )
        RETURNING id
        `,
        [
          email,
          hashed,
          name || null,
          phone || null,
          'owner',
          selectedPlan,
          paymentStatus,
          billingCycle,
          checkoutStatus,
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
          source,
        ],
      );

      console.log('INSERTED USER:', rows);

      const newUserId = rows[0].id;

      // Best-effort, non-blocking: resolve and store the registration country
      // (Cloudflare country header first, IP fallback). Fire-and-forget so it never
      // delays or fails the signup; a missing result shows as "Unknown" in admin.
      if (newUserId) {
        void captureSignupCountry(this.db, newUserId, geo || {});
      }

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

      // Lifecycle email at signup, by state. A PAID-tier signup that has not
      // checked out yet gets the abandoned-checkout sequence; a NO-PLAN signup
      // (account created but no plan chosen) gets the single Free-plan recovery
      // email. Free accounts are already active and get neither. Both are
      // best-effort, gated by their own enable flags, and canceled the moment the
      // account activates a plan.
      if (knownPaid) {
        try {
          await this.mailer.scheduleAbandonedSequence(newUserId, email, lang);
        } catch (_e) {
          /* non-fatal */
        }
      } else if (noPlan) {
        try {
          await this.mailer.scheduleRecoveryEmail(newUserId, email, lang);
        } catch (_e) {
          /* non-fatal */
        }
      }

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

  // Set the plan on an already-registered (logged-in) account — used after the
  // account-first signup, when the user picks a plan on the pricing page. Never
  // creates a second account. Free activates immediately (no Paddle); a paid
  // plan is recorded and stays unpaid until Paddle confirms at checkout.
  async selectPlan(userId: string, dto: any) {
    if (!userId) throw new ConflictException('Not authenticated');
    await this.ensureSignupColumns();
    const planId = normalizePlanId(dto?.plan);
    const isFree = planId === 'free';
    const billingCycle = ['monthly', 'annual'].includes(String(dto?.billingCycle))
      ? dto.billingCycle
      : isFree
        ? null
        : 'monthly';

    if (isFree) {
      await this.db.query(
        `UPDATE users
            SET selected_plan = 'free', billing_cycle = NULL,
                payment_status = 'free', checkout_status = 'free',
                plan_status = 'active', updated_at = NOW()
          WHERE id = $1`,
        [userId],
      );
      try {
        await this.mailer.cancelScheduled(userId);
      } catch (_e) {
        /* non-fatal */
      }
      return { success: true, plan: 'free', free: true };
    }

    // Store the chosen plan using the vocabulary the live checkout expects
    // (solo / team / growth), mapping the new tier names onto it.
    const legacyKey =
      planId === 'business' ? 'team' : planId === 'scale' ? 'growth' : 'solo';
    await this.db.query(
      `UPDATE users
          SET selected_plan = $2, billing_cycle = $3,
              checkout_status = 'registered', plan_status = 'active',
              updated_at = NOW()
        WHERE id = $1`,
      [userId, legacyKey, billingCycle],
    );
    return { success: true, plan: legacyKey, billingCycle, free: false };
  }

  // Validate a single-use recovery token and, only if the EXISTING account still
  // has no plan, activate Free Forever on it. Never overwrites an active/paid (or
  // already-Free) plan — in that case it just returns the account so the caller can
  // sign the user in and send them to the dashboard. The token is hashed in the DB,
  // time-limited, and consumed on first use (single-purpose).
  async recoverFreePlan(rawToken: string): Promise<any> {
    const raw = String(rawToken || '').trim();
    if (!raw) {
      throw new BadRequestException('This activation link is invalid or has expired.');
    }
    // Guarantees the recovery_* columns exist before we read them.
    await this.mailer.ensureSchema();

    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    // Atomically validate AND consume the token in ONE statement, so the link is
    // truly single-use even under concurrent clicks: only the first request clears
    // the token and gets the row; any replay (or a second simultaneous click)
    // matches nothing and is rejected.
    const { rows } = await this.db.query(
      `UPDATE users
          SET recovery_token = NULL, recovery_token_expires = NULL, updated_at = NOW()
        WHERE recovery_token = $1
          AND recovery_token_expires IS NOT NULL
          AND recovery_token_expires > NOW()
          AND deleted_at IS NULL
        RETURNING id, payment_status, checkout_status, selected_plan`,
      [hash],
    );
    const user = rows[0];
    if (!user) {
      throw new BadRequestException('This activation link is invalid or has expired.');
    }

    const ps = String(user.payment_status || '').toLowerCase();
    const cs = String(user.checkout_status || '').toLowerCase();
    // "Has a plan" — matches the recovery worker's cancel guard exactly, so a
    // chosen plan (even a paid one selected but not yet paid) is never silently
    // overwritten to Free. The legitimate recovery target has selected_plan = NULL.
    const alreadyHadPlan =
      ps === 'free' ||
      ps === 'active' ||
      ps === 'paid' ||
      cs === 'free' ||
      cs === 'paid' ||
      !!String(user.selected_plan || '').trim();

    // SAFETY: never overwrite an existing plan (Free or paid).
    if (!alreadyHadPlan) {
      // Still no plan → activate Free Forever on the existing account.
      await this.db.query(
        `UPDATE users
            SET selected_plan = 'free', billing_cycle = NULL,
                payment_status = 'free', checkout_status = 'free',
                plan_status = 'active',
                recovery_activated_at = NOW(),
                recovery_source = 'free_plan_recovery_email',
                updated_at = NOW()
          WHERE id = $1`,
        [user.id],
      );
      // Void any still-pending lifecycle emails for this now-Free account.
      try {
        await this.mailer.cancelScheduled(user.id);
      } catch (_e) {
        /* non-fatal */
      }
    }

    // Sign the user in through the normal session flow (same as signup).
    const session = await this.authService.loginById(user.id);
    return {
      success: true,
      userId: user.id,
      activated: !alreadyHadPlan,
      alreadyHadPlan,
      redirect: '/dashboard',
      ...session,
    };
  }
}