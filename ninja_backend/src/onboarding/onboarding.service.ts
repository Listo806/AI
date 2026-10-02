import { BadRequestException, ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WorkspaceEntitlementsService } from '../workspaces/workspace-entitlements.service';
import { getSeatLimit } from '../plans/plan-config';
import {
  WORKSPACE_CATALOG,
  getWorkspace,
} from '../workspaces/workspace-registry';

// Post-activation onboarding (verified email -> workspace selection -> CRM).
//
// The workspace a customer picks is persisted the same way the sidebar's
// "Add to My Plan" does it: a plan-included workspace_entitlements row linked to
// the team's active CRM subscription (one Workspace is included with the plan).
// On top of that the user row records that onboarding was completed, which
// workspace was chosen and the questionnaire answers, so the page can send a
// returning customer straight to their workspace on any device.

// Workspaces offered in onboarding. Lead Generator is a separate add-on, not a
// workspace a customer runs their CRM in, so it is not offered here.
const NOT_SELECTABLE = new Set(['lead-generator']);

export const ONBOARDING_WORKSPACES = WORKSPACE_CATALOG.filter(
  (w) => !NOT_SELECTABLE.has(w.id),
);

// Business-type values sent by the old questionnaire build, mapped to workspaces.
const LEGACY_BUSINESS_TYPES: Record<string, string> = {
  real_estate: 'real-estate',
  agency: 'marketing',
  solo: 'business',
};

const BILLING_ADMIN_ROLES = ['admin', 'super_admin', 'owner', 'developer'];

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly entitlements: WorkspaceEntitlementsService,
  ) {}

  // Runtime ensure (migrations are not auto-run in every environment); the same
  // columns are created by migration 175_user_onboarding_workspace.sql.
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ`,
    );
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_workspace_id VARCHAR(64)`,
    );
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_answers JSONB`,
    );
    this.schemaReady = true;
  }

  private workspaceList() {
    return ONBOARDING_WORKSPACES.map((w) => ({ id: w.id, name: w.name, route: w.route }));
  }

  private async activeCrmSubscription(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT id, plan_id AS "planId"
         FROM subscriptions
        WHERE team_id = $1
          AND LOWER(status::text) IN ('active', 'trialing')
        ORDER BY CASE WHEN LOWER(status::text) = 'active' THEN 0 ELSE 1 END,
                 updated_at DESC, created_at DESC
        LIMIT 1`,
      [teamId],
    );
    return rows[0] || null;
  }

  /** Repair legacy/self-signup customers created before /auth/signup provisioned
   * a tenant. This creates tenant identity only; it never fabricates payment.
   * A CRM subscription is mirrored only from a confirmed active/trialing Nuvei
   * subscription belonging to this exact user. */
  private async repairMissingTeam(user: any): Promise<string | null> {
    if (!user?.id) return null;

    // Idempotency/race safety: another request may already have repaired it.
    const existing = await this.db.query(
      `SELECT COALESCE(
          (SELECT u.team_id FROM users u WHERE u.id = $1),
          (SELECT t.id FROM teams t WHERE t.owner_id = $1 ORDER BY t.created_at LIMIT 1),
          (SELECT tm.team_id FROM team_members tm
            WHERE tm.user_id = $1 AND COALESCE(tm.status, 'active') = 'active'
            ORDER BY tm.created_at LIMIT 1)
        ) AS team_id`,
      [user.id],
    );
    let teamId = existing.rows[0]?.team_id || null;

    if (!teamId) {
      const emailRow = await this.db.query(`SELECT email FROM users WHERE id = $1 LIMIT 1`, [user.id]);
      const email = String(emailRow.rows[0]?.email || 'My');
      const teamName = `${email.split('@')[0] || 'My'}'s Team`;

      teamId = await this.db.transaction(async (client) => {
        // Serialize repair attempts for this user and re-check after locking.
        const locked = await client.query(`SELECT team_id FROM users WHERE id = $1 FOR UPDATE`, [user.id]);
        if (!locked.rows[0]) throw new Error('user_not_found');
        if (locked.rows[0].team_id) return locked.rows[0].team_id;

        const owned = await client.query(
          `SELECT id FROM teams WHERE owner_id = $1 ORDER BY created_at LIMIT 1`,
          [user.id],
        );
        let id = owned.rows[0]?.id || null;
        if (!id) {
          const created = await client.query(
            `INSERT INTO teams (name, owner_id, seat_limit, created_at, updated_at)
             VALUES ($1, $2, 1, NOW(), NOW()) RETURNING id`,
            [teamName, user.id],
          );
          id = created.rows[0].id;
        }

        await client.query(
          `INSERT INTO team_members (team_id, user_id, role, status, created_at, updated_at)
           VALUES ($1, $2, 'admin', 'active', NOW(), NOW())
           ON CONFLICT (team_id, user_id)
           DO UPDATE SET status = 'active', updated_at = NOW()`,
          [id, user.id],
        );
        await client.query(`UPDATE users SET team_id = $2, updated_at = NOW() WHERE id = $1`, [user.id, id]);
        return id;
      });
    } else {
      await this.db.query(`UPDATE users SET team_id = $2, updated_at = NOW() WHERE id = $1 AND team_id IS NULL`, [user.id, teamId]);
    }

    // Payment is the authority. Attach only this user's already-confirmed Nuvei
    // subscription, then rebuild the shared team-scoped subscription mirror that
    // could not be created when payment happened while team_id was NULL.
    const paid = await this.db.query(
      `SELECT id, provision_plan, status, next_billing_date
         FROM nuvei_subscriptions
        WHERE user_id = $1
          AND LOWER(status::text) IN ('active', 'trialing')
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1`,
      [user.id],
    );
    const nuvei = paid.rows[0] || null;
    if (nuvei) {
      const seatLimit = getSeatLimit(nuvei.provision_plan);
      await this.db.transaction(async (client) => {
        await client.query(
          `UPDATE nuvei_subscriptions SET team_id = $2, updated_at = NOW() WHERE id = $1`,
          [nuvei.id, teamId],
        );
        await client.query(
          `UPDATE teams SET seat_limit = GREATEST(COALESCE(seat_limit, 1), $2), updated_at = NOW() WHERE id = $1`,
          [teamId, seatLimit],
        );
        await client.query(
          `INSERT INTO subscriptions
             (team_id, provider, status, seat_limit, nuvei_subscription_id, current_period_end, created_at, updated_at)
           VALUES ($1, 'nuvei', $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (nuvei_subscription_id) WHERE nuvei_subscription_id IS NOT NULL
           DO UPDATE SET team_id = EXCLUDED.team_id,
                         status = EXCLUDED.status,
                         seat_limit = EXCLUDED.seat_limit,
                         current_period_end = EXCLUDED.current_period_end,
                         updated_at = NOW()`,
          [teamId, String(nuvei.status).toLowerCase(), seatLimit, nuvei.id, nuvei.next_billing_date],
        );
      });
    }

    this.logger.log(`onboarding: repaired missing team for owner ${user.id} -> ${teamId}`);
    return teamId;
  }

  /** The workspace this team already runs in: the plan-included selection first,
   *  otherwise any other active workspace entitlement (e.g. a legacy paid one). */
  private async currentTeamWorkspace(teamId: string | null): Promise<string | null> {
    if (!teamId) return null;
    try {
      const rows = await this.entitlements.listActiveWorkspaceInstances(teamId);
      const selectable = rows.filter((r) => !NOT_SELECTABLE.has(r.workspace_id));
      const planIncluded = selectable.find((r) => (r as any).source === 'plan_included');
      return (planIncluded || selectable[0])?.workspace_id || null;
    } catch (err: any) {
      this.logger.warn(`workspace lookup failed: ${err?.message}`);
      return null;
    }
  }

  async getState(user: any) {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT onboarding_completed_at, onboarding_workspace_id
         FROM users WHERE id = $1 LIMIT 1`,
      [user.id],
    );
    const row = rows[0] || {};
    const teamId = await this.entitlements.resolveTeamId(user);
    const teamWorkspace = await this.currentTeamWorkspace(teamId);

    // A team that already has its workspace (chosen here, from the sidebar, or a
    // legacy entitlement) is done: the page sends it straight there.
    // Without an active workspace (e.g. the plan was not active yet when the
    // answers were saved) a completed onboarding lands on the CRM home instead.
    // Access is entitlement-backed. A stale onboarding_completed_at flag must never
    // skip Workspace Selection when the entitlement is missing/revoked.
    const completed = !!teamWorkspace;
    const teamWs = teamWorkspace ? getWorkspace(teamWorkspace) : null;
    const savedWs = row.onboarding_workspace_id ? getWorkspace(row.onboarding_workspace_id) : null;

    return {
      completed,
      workspaceId: teamWs?.id || savedWs?.id || null,
      route: teamWs?.route || null,
      canSelectWorkspace: BILLING_ADMIN_ROLES.includes(String(user?.role || '').toLowerCase()),
      workspaces: this.workspaceList(),
    };
  }

  async complete(
    user: any,
    body: { workspaceId?: string; businessType?: string; leadSources?: unknown; mainGoal?: unknown },
  ) {
    await this.ensureSchema();
    const raw = String(body?.workspaceId || body?.businessType || '').trim().toLowerCase();
    const requested = getWorkspace(LEGACY_BUSINESS_TYPES[raw] || raw);
    if (!requested || NOT_SELECTABLE.has(requested.id)) {
      throw new BadRequestException('Please choose a workspace.');
    }

    const leadSources = Array.isArray(body?.leadSources)
      ? body.leadSources.map((s) => String(s).slice(0, 40)).slice(0, 20)
      : [];
    const mainGoal = String(body?.mainGoal ?? '').trim().slice(0, 500);

    let teamId = await this.entitlements.resolveTeamId(user);
    if (!teamId) {
      try {
        teamId = await this.repairMissingTeam(user);
      } catch (err: any) {
        this.logger.error(`onboarding: team recovery failed for ${user.id}: ${err?.message}`);
        throw new ServiceUnavailableException('Your account workspace could not be prepared. Please retry.');
      }
    }
    let workspaceId = requested.id;
    let activated = false;
    let activationNote: string | null = null;

    const existing = await this.currentTeamWorkspace(teamId);
    if (existing) {
      // The team already has its included workspace: never add a second one.
      workspaceId = existing;
      activated = true;
      if (existing !== requested.id) activationNote = 'workspace_already_selected';
    } else if (!teamId) {
      activationNote = 'no_team';
    } else if (!BILLING_ADMIN_ROLES.includes(String(user?.role || '').toLowerCase())) {
      activationNote = 'not_account_admin';
    } else {
      const sub = await this.activeCrmSubscription(teamId);
      if (!sub) {
        activationNote = 'no_active_plan';
      } else {
        const result = await this.entitlements.activateForPlan({
          teamId,
          workspaceId: requested.id,
          planSubscriptionId: sub.id,
          planId: sub.planId || null,
          userId: user?.id || null,
        });
        if (result.activated) {
          activated = true;
        } else if (result.reason === 'already_has_plan_workspace' && result.workspaceId) {
          workspaceId = result.workspaceId;
          activated = true;
          activationNote = 'workspace_already_selected';
        } else {
          activationNote = 'activation_failed';
        }
      }
    }

    if (!activated) {
      this.logger.warn(
        `onboarding: refused completion for workspace '${requested.id}' user ${user.id} (${activationNote || 'activation_failed'})`,
      );
      if (activationNote === 'not_account_admin') {
        throw new ForbiddenException('Only an account owner or authorized administrator can select the included workspace.');
      }
      if (activationNote === 'no_team') {
        throw new ServiceUnavailableException('Your account is not attached to a workspace team yet. Please retry or contact support.');
      }
      if (activationNote === 'no_active_plan') {
        throw new ForbiddenException('An active CRM plan is required before selecting a workspace.');
      }
      throw new ServiceUnavailableException('Workspace activation could not be completed. Please retry.');
    }

    // Mark onboarding complete only after the entitlement exists. This prevents a
    // failed activation from becoming a permanent "completed" browser/account state.
    await this.db.query(
      `UPDATE users
          SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
              onboarding_workspace_id = $2,
              onboarding_answers = $3::jsonb,
              updated_at = NOW()
        WHERE id = $1`,
      [
        user.id,
        workspaceId,
        JSON.stringify({ workspaceId: requested.id, leadSources, mainGoal }),
      ],
    );

    const ws = getWorkspace(workspaceId)!;
    // Only send the customer into a workspace they can open; if activation could
    // not happen (no active plan yet, invited member), fall back to the CRM home.
    return {
      success: true,
      completed: true,
      workspaceId: ws.id,
      activated: true,
      note: activationNote,
      route: ws.route,
    };
  }
}
