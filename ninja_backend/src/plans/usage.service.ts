import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  PlanFeatures,
  PlanId,
  getPlan,
  normalizePlanId,
} from './plan-config';
import { PlanOverridesService } from './plan-overrides.service';

// Meters the Free-plan usage caps and enforces them at the point of use.
//
// SAFETY CONTRACT:
//  - Paid plans are unlimited (their limits are null), so this service NEVER
//    restricts a paying customer.
//  - Free caps apply ONLY to a genuine, unpaid Free account, so no active/paid
//    or legacy customer is ever caught even if their stored plan string is odd.
//  - Every path FAILS OPEN: any resolution/count error resolves to "allowed", so
//    a metering bug can never block a real user or drop an inbound lead.
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly overrides: PlanOverridesService,
  ) {}

  // Resolve the team owner's effective plan and whether the Free caps apply.
  // Free caps apply only when the normalized plan is 'free' AND the account has
  // never paid (payment_status not active/paid, checkout not paid). This is what
  // guarantees a paid or legacy customer is never capped: they either hold a paid
  // tier or carry a paid payment/checkout status, so isFree is false for them.
  async resolveTeamPlan(
    teamId?: string | null,
  ): Promise<{ planId: PlanId; isFree: boolean; paid: boolean }> {
    if (!teamId) return { planId: 'free', isFree: false, paid: false };
    try {
      const { rows } = await this.db.query(
        `SELECT u.plan, u.selected_plan, u.payment_status, u.checkout_status
           FROM teams t
           JOIN users u ON u.id = t.owner_id
          WHERE t.id = $1
          LIMIT 1`,
        [teamId],
      );
      const r = rows[0];
      if (!r) return { planId: 'free', isFree: false, paid: false };
      const planId = normalizePlanId(r.selected_plan || r.plan);
      const pay = String(r.payment_status || '').toLowerCase();
      const checkout = String(r.checkout_status || '').toLowerCase();
      const paid = pay === 'active' || pay === 'paid' || checkout === 'paid';
      return { planId, isFree: planId === 'free' && !paid, paid };
    } catch (err: any) {
      this.logger.error(`resolveTeamPlan failed: ${err?.message}`);
      return { planId: 'free', isFree: false, paid: false };
    }
  }

  // ---- counters -------------------------------------------------------------

  // One "AI conversation" = one WhatsApp conversation thread opened this calendar
  // month. Counted per-thread (not per-message) so a back-and-forth in the same
  // thread never consumes more than one. Both WhatsApp stacks are summed (Twilio
  // `conversations` + QR `whatsapp_qr_conversations`) so Limited AI is metered
  // across the whole product. Each source is counted independently and fails open
  // to 0, so a schema/query issue can only UNDER-count (never wrongly block).
  async countConversationsThisMonth(teamId: string): Promise<number> {
    const [twilio, qr] = await Promise.all([
      this.countTwilioConversationsThisMonth(teamId),
      this.countQrConversationsThisMonth(teamId),
    ]);
    return twilio + qr;
  }

  private async countTwilioConversationsThisMonth(teamId: string): Promise<number> {
    try {
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM conversations c
           JOIN leads l ON l.id = c.lead_id
          WHERE l.team_id = $1
            AND c.created_at >= date_trunc('month', NOW())`,
        [teamId],
      );
      return rows[0]?.n ?? 0;
    } catch (err: any) {
      this.logger.error(`countTwilioConversationsThisMonth failed: ${err?.message}`);
      return 0;
    }
  }

  private async countQrConversationsThisMonth(teamId: string): Promise<number> {
    try {
      const { rows } = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM whatsapp_qr_conversations
          WHERE team_id = $1
            AND created_at >= date_trunc('month', NOW())`,
        [teamId],
      );
      return rows[0]?.n ?? 0;
    } catch (err: any) {
      // Table may not exist in every environment — treat as zero, never throw.
      this.logger.warn(`countQrConversationsThisMonth failed: ${err?.message}`);
      return 0;
    }
  }

  // Count the team's connected WhatsApp numbers across both stacks (Twilio
  // agent-owned numbers + QR sessions). "Team users" = members whose team_id is
  // this team, plus the team owner (owners often carry team_id = null).
  async countWhatsappConnections(
    teamId: string,
    excludeUserId?: string,
  ): Promise<number> {
    try {
      const params: any[] = [teamId];
      let exclude = '';
      if (excludeUserId) {
        params.push(excludeUserId);
        exclude = ` AND tu.id <> $2`;
      }
      const { rows } = await this.db.query(
        `WITH tu AS (
           SELECT id FROM users WHERE team_id = $1
           UNION
           SELECT owner_id AS id FROM teams WHERE id = $1
         )
         SELECT
           (SELECT COUNT(*)::int FROM agent_whatsapp_connections a
             JOIN tu ON tu.id = a.agent_id
            WHERE a.status = 'connected'${exclude})
           +
           (SELECT COUNT(*)::int FROM whatsapp_qr_sessions s
             JOIN tu ON tu.id = s.user_id
            WHERE s.status = 'connected'${exclude})
           AS n`,
        params,
      );
      return rows[0]?.n ?? 0;
    } catch (err: any) {
      this.logger.warn(`countWhatsappConnections failed: ${err?.message}`);
      return 0;
    }
  }

  async countConnectedIntegrations(
    teamId: string,
    excludeKey?: string,
  ): Promise<number> {
    try {
      const params: any[] = [teamId];
      let sql = `SELECT COUNT(*)::int AS n FROM integrations
                  WHERE team_id = $1 AND status = 'connected'`;
      if (excludeKey) {
        params.push(excludeKey);
        sql += ` AND key <> $2`;
      }
      const { rows } = await this.db.query(sql, params);
      return rows[0]?.n ?? 0;
    } catch (err: any) {
      this.logger.error(`countConnectedIntegrations failed: ${err?.message}`);
      return 0;
    }
  }

  // ---- enforcement ----------------------------------------------------------

  // Whether a NEW conversation for this team may have the AI enabled. Free plans
  // get 50 AI conversations/month; beyond that the lead is still captured but the
  // AI stays off (graceful degrade — we never drop or block an inbound lead).
  async aiConversationAllowed(teamId?: string | null): Promise<boolean> {
    if (!teamId) return true;
    const { isFree } = await this.resolveTeamPlan(teamId);
    if (!isFree) return true;
    const limit = await this.overrides.getLimit('free', 'aiConversationsPerMonth');
    if (limit == null) return true;
    const used = await this.countConversationsThisMonth(teamId);
    return used < limit;
  }

  // Block connecting more integrations than the plan allows. This is a
  // user-initiated action, so a hard 403 with the 🔒 upgrade prefix (which the
  // frontend surfaces verbatim) is the right behavior.
  async assertCanConnectIntegration(teamId: string, key: string): Promise<void> {
    const { isFree } = await this.resolveTeamPlan(teamId);
    if (!isFree) return;
    const limit = await this.overrides.getLimit('free', 'integrations');
    if (limit == null) return;
    // Re-connecting an already-connected integration must never be blocked.
    const others = await this.countConnectedIntegrations(teamId, key);
    if (others >= limit) {
      const label = limit === 1 ? '1 integration' : `${limit} integrations`;
      throw new ForbiddenException(
        `🔒 The Free plan includes ${label}. Upgrade to connect more.`,
      );
    }
  }

  // Resolve the team a user belongs to (member via users.team_id, else the team
  // they own). Owners frequently carry team_id = null, so both are checked.
  private async resolveTeamIdForUser(userId?: string): Promise<string | null> {
    if (!userId) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT team_id FROM users WHERE id = $1 LIMIT 1`,
        [userId],
      );
      if (rows[0]?.team_id) return rows[0].team_id;
      const { rows: owned } = await this.db.query(
        `SELECT id FROM teams WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );
      return owned[0]?.id ?? null;
    } catch (err: any) {
      this.logger.warn(`resolveTeamIdForUser failed: ${err?.message}`);
      return null;
    }
  }

  // Block connecting more WhatsApp numbers than the plan allows (Free = 1). The
  // connecting user is excluded from the count so re-connecting their own number
  // is always allowed; only adding a number beyond the cap is blocked. When no
  // teamId is passed it is resolved from the connecting user.
  async assertCanConnectWhatsapp(
    teamId?: string | null,
    connectingUserId?: string,
  ): Promise<void> {
    const tid = teamId || (await this.resolveTeamIdForUser(connectingUserId));
    if (!tid) return;
    const { isFree } = await this.resolveTeamPlan(tid);
    if (!isFree) return;
    const limit = await this.overrides.getLimit('free', 'whatsappConnections');
    if (limit == null) return;
    const others = await this.countWhatsappConnections(tid, connectingUserId);
    if (others >= limit) {
      const label =
        limit === 1 ? '1 WhatsApp connection' : `${limit} WhatsApp connections`;
      throw new ForbiddenException(
        `🔒 The Free plan includes ${label}. Upgrade to connect more.`,
      );
    }
  }

  // ---- feature access -------------------------------------------------------

  // Whether the team may use a given feature.
  //
  // GRANDFATHERING: any paid or legacy account keeps FULL access (returns true)
  // regardless of tier. The old paid plans were feature-identical, so gating an
  // existing paying customer by the new per-tier feature set would REMOVE access
  // they already have. Only a genuine Free account is gated, by the Free plan's
  // feature set. (Per-tier differentiation between paid plans is intentionally
  // deferred until the grandfathering policy for existing customers is decided.)
  async featureAllowed(
    teamId: string | null | undefined,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    const { isFree } = await this.resolveTeamPlan(teamId);
    if (!isFree) return true;
    return this.overrides.hasFeature('free', feature);
  }

  // Effective feature access for this account, matching featureAllowed(): a
  // genuine Free account gets the (override-aware) Free feature set; any
  // paid/legacy account is grandfathered to full access. Single source of truth
  // the frontend reads so its lock UI can never disagree with enforcement.
  private async effectiveFeatures(isFree: boolean): Promise<PlanFeatures> {
    const free = await this.overrides.getFeatures('free');
    const out = {} as PlanFeatures;
    for (const key of Object.keys(free) as (keyof PlanFeatures)[]) {
      out[key] = isFree ? free[key] : true;
    }
    return out;
  }

  // Read-only snapshot for the dashboard: current plan, whether Free caps apply,
  // the (override-aware) plan limits, the effective feature access, and current
  // usage. Paid plans report unlimited (null limits) and full feature access.
  async getUsageSummary(teamId?: string | null) {
    const { planId, isFree } = await this.resolveTeamPlan(teamId);
    const cfg = getPlan(planId);
    const [limits, features] = await Promise.all([
      this.overrides.getLimits(planId),
      this.effectiveFeatures(isFree),
    ]);
    const [conversations, integrations] = teamId
      ? await Promise.all([
          this.countConversationsThisMonth(teamId),
          this.countConnectedIntegrations(teamId),
        ])
      : [0, 0];
    return {
      plan: planId,
      planLabel: cfg.label,
      isFree,
      limits,
      features,
      usage: {
        aiConversationsThisMonth: conversations,
        integrationsConnected: integrations,
      },
    };
  }
}
