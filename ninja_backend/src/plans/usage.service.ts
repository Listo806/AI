import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PlanId, getLimit, getPlan, normalizePlanId } from './plan-config';

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

  constructor(private readonly db: DatabaseService) {}

  // Resolve the team owner's effective plan and whether the Free caps apply.
  // Free caps apply only when the normalized plan is 'free' AND the account has
  // never paid (payment_status not active/paid, checkout not paid). This is what
  // guarantees a paid or legacy customer is never capped: they either hold a paid
  // tier or carry a paid payment/checkout status, so isFree is false for them.
  async resolveTeamPlan(
    teamId?: string | null,
  ): Promise<{ planId: PlanId; isFree: boolean }> {
    if (!teamId) return { planId: 'free', isFree: false };
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
      if (!r) return { planId: 'free', isFree: false };
      const planId = normalizePlanId(r.selected_plan || r.plan);
      const pay = String(r.payment_status || '').toLowerCase();
      const checkout = String(r.checkout_status || '').toLowerCase();
      const paid = pay === 'active' || pay === 'paid' || checkout === 'paid';
      return { planId, isFree: planId === 'free' && !paid };
    } catch (err: any) {
      this.logger.error(`resolveTeamPlan failed: ${err?.message}`);
      return { planId: 'free', isFree: false };
    }
  }

  // ---- counters -------------------------------------------------------------

  async countConversationsThisMonth(teamId: string): Promise<number> {
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
      this.logger.error(`countConversationsThisMonth failed: ${err?.message}`);
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
    const limit = getLimit('free', 'aiConversationsPerMonth');
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
    const limit = getLimit('free', 'integrations');
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

  // Read-only snapshot for the dashboard: current plan, whether Free caps apply,
  // the plan limits, and current usage. Paid plans report unlimited (null limits).
  async getUsageSummary(teamId?: string | null) {
    const { planId, isFree } = await this.resolveTeamPlan(teamId);
    const cfg = getPlan(planId);
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
      limits: cfg.limits,
      usage: {
        aiConversationsThisMonth: conversations,
        integrationsConnected: integrations,
      },
    };
  }
}
