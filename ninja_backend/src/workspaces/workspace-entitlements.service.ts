import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { normalizeWorkspaceId } from './workspace-registry';

// Statuses we persist for a workspace entitlement. `active` is the only state that
// grants access; `past_due` / `suspended` are transient loss-of-access; `canceled`
// and `refunded` are terminal. Enforcement (Slice 2) reads `active` only.
export type WorkspaceEntitlementStatus =
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'canceled'
  | 'refunded';

export interface WorkspaceEntitlementRow {
  id: string;
  team_id: string;
  workspace_id: string;
  paddle_subscription_id: string;
  paddle_price_id: string | null;
  status: WorkspaceEntitlementStatus;
  activated_at: string | null;
  revoked_at: string | null;
}

/**
 * Grant/revoke plumbing for paid Workspace add-ons.
 *
 * A paid Workspace is its OWN Paddle subscription, separate from the base plan and
 * from every other Workspace. The Paddle webhook is the single writer here: it
 * grants on first payment and revokes on cancel/past-due/refund, always scoped by
 * the workspace subscription's own id. Nothing in this service ever touches the
 * user's base plan, is_active, or payment_status.
 */
@Injectable()
export class WorkspaceEntitlementsService {
  private readonly logger = new Logger(WorkspaceEntitlementsService.name);
  private schemaReady = false;
  private creditsSchemaReady = false;

  constructor(private readonly db: DatabaseService) {}

  // Lazily ensure the table exists so the engine works even before migration 109
  // has been applied in an environment (mirrors the platform-mailer/webhook_events
  // pattern). Idempotent and cheap after the first call.
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS workspace_entitlements (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         team_id UUID NOT NULL,
         workspace_id VARCHAR(64) NOT NULL,
         paddle_subscription_id VARCHAR(255) NOT NULL,
         paddle_price_id VARCHAR(255),
         status VARCHAR(32) NOT NULL DEFAULT 'active',
         created_by UUID,
         activated_at TIMESTAMP,
         revoked_at TIMESTAMP,
         created_at TIMESTAMP DEFAULT NOW(),
         updated_at TIMESTAMP DEFAULT NOW(),
         CONSTRAINT uq_workspace_entitlements_sub UNIQUE (paddle_subscription_id)
       )`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team
         ON workspace_entitlements(team_id)`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_workspace_entitlements_team_ws
         ON workspace_entitlements(team_id, workspace_id, status)`,
    );
    this.schemaReady = true;
  }

  /** True if this Paddle subscription id already maps to a workspace entitlement. */
  async isKnownSubscription(paddleSubscriptionId: string): Promise<boolean> {
    if (!paddleSubscriptionId) return false;
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT 1 FROM workspace_entitlements
        WHERE paddle_subscription_id = $1 LIMIT 1`,
      [paddleSubscriptionId],
    );
    return rows.length > 0;
  }

  /**
   * Grant (or re-activate) a workspace entitlement for a confirmed payment. Keyed
   * by the Paddle subscription id, so duplicate/out-of-order webhook deliveries
   * converge on one active row. Never trusts a client-supplied team id: the caller
   * resolves the team authoritatively from the paying user before calling this.
   */
  async grant(params: {
    subscriptionId: string;
    workspaceId: string;
    teamId: string;
    priceId?: string | null;
    userId?: string | null;
  }): Promise<boolean> {
    const workspaceId = normalizeWorkspaceId(params.workspaceId);
    if (!params.subscriptionId || !workspaceId || !params.teamId) {
      return false;
    }
    await this.ensureSchema();
    const res = await this.db.query(
      `INSERT INTO workspace_entitlements
         (team_id, workspace_id, paddle_subscription_id, paddle_price_id,
          status, created_by, activated_at, revoked_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, NOW(), NULL, NOW(), NOW())
       ON CONFLICT (paddle_subscription_id) DO UPDATE SET
         status = 'active',
         team_id = EXCLUDED.team_id,
         workspace_id = EXCLUDED.workspace_id,
         paddle_price_id = COALESCE(EXCLUDED.paddle_price_id, workspace_entitlements.paddle_price_id),
         activated_at = COALESCE(workspace_entitlements.activated_at, NOW()),
         revoked_at = NULL,
         updated_at = NOW()`,
      [
        params.teamId,
        workspaceId,
        params.subscriptionId,
        params.priceId || null,
        params.userId || null,
      ],
    );
    this.logger.log(
      `Granted workspace '${workspaceId}' to team ${params.teamId} via subscription ${params.subscriptionId}`,
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Terminal revoke (cancel/refund): mark the entitlement for that subscription id
   * revoked and stamp revoked_at. Returns false if no such subscription is known
   * (nothing to revoke) so the caller can log without forcing a webhook retry.
   */
  async revoke(
    paddleSubscriptionId: string,
    status: Extract<WorkspaceEntitlementStatus, 'canceled' | 'refunded'>,
  ): Promise<boolean> {
    if (!paddleSubscriptionId) return false;
    await this.ensureSchema();
    const res = await this.db.query(
      `UPDATE workspace_entitlements
          SET status = $2, revoked_at = NOW(), updated_at = NOW()
        WHERE paddle_subscription_id = $1`,
      [paddleSubscriptionId, status],
    );
    const changed = (res.rowCount || 0) > 0;
    if (changed) {
      this.logger.log(
        `Revoked workspace entitlement (${status}) for subscription ${paddleSubscriptionId}`,
      );
    }
    return changed;
  }

  /**
   * Restore an existing entitlement to active (e.g. a subscription.updated->active
   * recovery after past_due) reusing its stored workspace_id, without needing the
   * checkout custom_data again. No-op if the subscription is unknown.
   */
  async reactivate(paddleSubscriptionId: string): Promise<boolean> {
    if (!paddleSubscriptionId) return false;
    await this.ensureSchema();
    const res = await this.db.query(
      `UPDATE workspace_entitlements
          SET status = 'active',
              revoked_at = NULL,
              activated_at = COALESCE(activated_at, NOW()),
              updated_at = NOW()
        WHERE paddle_subscription_id = $1`,
      [paddleSubscriptionId],
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Transient status change (past_due/suspended): loses access but is not a
   * terminal revoke, so revoked_at is left untouched and access can be restored by
   * a later active event.
   */
  async setStatus(
    paddleSubscriptionId: string,
    status: Extract<WorkspaceEntitlementStatus, 'past_due' | 'suspended'>,
  ): Promise<boolean> {
    if (!paddleSubscriptionId) return false;
    await this.ensureSchema();
    const res = await this.db.query(
      `UPDATE workspace_entitlements
          SET status = $2, updated_at = NOW()
        WHERE paddle_subscription_id = $1`,
      [paddleSubscriptionId, status],
    );
    return (res.rowCount || 0) > 0;
  }

  /** Active workspace ids for a team (the enforcement-relevant set). */
  async listActiveWorkspaceIds(teamId: string): Promise<string[]> {
    if (!teamId) return [];
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT DISTINCT workspace_id
         FROM workspace_entitlements
        WHERE team_id = $1 AND status = 'active'`,
      [teamId],
    );
    return rows.map((r: any) => r.workspace_id);
  }

  /**
   * Resolve the account's team id from a JWT user. Owners frequently have
   * users.team_id = NULL and own their team via teams.owner_id, so fall back to
   * that (mirrors crm-access/subscription guards). Never blocks: returns null when
   * no team can be resolved, and the caller decides.
   */
  async resolveTeamId(user: any): Promise<string | null> {
    if (user?.teamId) return user.teamId;
    if (!user?.id) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT id FROM teams WHERE owner_id = $1 LIMIT 1`,
        [user.id],
      );
      return rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  /** True if the team currently holds an active entitlement for the workspace. */
  async hasActiveEntitlement(
    teamId: string,
    workspaceId: string,
  ): Promise<boolean> {
    if (!teamId) return false;
    const id = normalizeWorkspaceId(workspaceId);
    if (!id) return false;
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT 1 FROM workspace_entitlements
        WHERE team_id = $1 AND workspace_id = $2 AND status = 'active'
        LIMIT 1`,
      [teamId, id],
    );
    return rows.length > 0;
  }

  // ── Included-workspace credits (promotional "1 workspace of your choice") ──
  //
  // A promotional base plan (e.g. the $257 Business promo) can include ONE Team
  // Workspace of the customer's choice. That is modelled as a CREDIT the account
  // holds; the customer later CHOOSES which workspace, which comps exactly one
  // workspace entitlement (no Paddle subscription, no $97 charge) and consumes the
  // credit. Any additional workspace beyond the included one stays on the paid path.
  private async ensureCreditsSchema(): Promise<void> {
    if (this.creditsSchemaReady) return;
    await this.ensureSchema();
    // Mark comped rows so they are self-describing (and distinguishable from paid
    // $97 rows). Defaults to 'paddle' for every existing/normal row.
    await this.db
      .query(
        `ALTER TABLE workspace_entitlements
           ADD COLUMN IF NOT EXISTS source VARCHAR(32) NOT NULL DEFAULT 'paddle'`,
      )
      .catch((e: any) =>
        this.logger.error(`add source column failed: ${e?.message}`),
      );
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS workspace_credits (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         team_id UUID NOT NULL,
         source VARCHAR(48) NOT NULL DEFAULT 'promo',
         paddle_subscription_id VARCHAR(255),
         total INT NOT NULL DEFAULT 1,
         used INT NOT NULL DEFAULT 0,
         created_at TIMESTAMP DEFAULT NOW(),
         updated_at TIMESTAMP DEFAULT NOW()
       )`,
    );
    // One credit row per granting (base) subscription id → idempotent grant.
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_credits_sub
         ON workspace_credits(paddle_subscription_id)
        WHERE paddle_subscription_id IS NOT NULL`,
    );
    await this.db.query(
      `CREATE INDEX IF NOT EXISTS idx_workspace_credits_team
         ON workspace_credits(team_id)`,
    );
    this.creditsSchemaReady = true;
  }

  /**
   * Grant included-workspace credit(s) to a team. Idempotent per granting
   * subscription id: the same base subscription (its created + activated events and
   * every renewal) can never stack more than one grant.
   */
  async grantIncludedWorkspaceCredit(params: {
    teamId: string;
    source: string;
    subscriptionId?: string | null;
    total?: number;
  }): Promise<boolean> {
    if (!params.teamId) return false;
    await this.ensureCreditsSchema();
    const total = params.total && params.total > 0 ? params.total : 1;
    if (params.subscriptionId) {
      const res = await this.db.query(
        `INSERT INTO workspace_credits (team_id, source, paddle_subscription_id, total, used)
         VALUES ($1, $2, $3, $4, 0)
         ON CONFLICT (paddle_subscription_id) DO NOTHING`,
        [params.teamId, params.source, params.subscriptionId, total],
      );
      const granted = (res.rowCount || 0) > 0;
      if (granted) {
        this.logger.log(
          `Granted ${total} included-workspace credit(s) to team ${params.teamId} (${params.source}) via ${params.subscriptionId}`,
        );
      }
      return granted;
    }
    const res = await this.db.query(
      `INSERT INTO workspace_credits (team_id, source, total, used) VALUES ($1, $2, $3, 0)`,
      [params.teamId, params.source, total],
    );
    return (res.rowCount || 0) > 0;
  }

  /** How many included-workspace credits the team has left to use. */
  async availableIncludedCredits(teamId: string): Promise<number> {
    if (!teamId) return 0;
    await this.ensureCreditsSchema();
    const { rows } = await this.db.query(
      `SELECT COALESCE(SUM(total - used), 0)::int AS n
         FROM workspace_credits WHERE team_id = $1`,
      [teamId],
    );
    return Number(rows[0]?.n) || 0;
  }

  /**
   * Consume one included credit to COMP a chosen workspace: grant an active
   * entitlement with NO Paddle subscription and NO $97 charge. Atomic and
   * idempotent — it never over-consumes credits and never double-grants a workspace.
   * Returns { comped:false, reason } when there is nothing to do so the caller can
   * fall through to the normal paid ($97) purchase path.
   */
  async claimIncludedWorkspace(params: {
    teamId: string;
    workspaceId: string;
    userId?: string | null;
  }): Promise<{ comped: boolean; reason?: string }> {
    const workspaceId = normalizeWorkspaceId(params.workspaceId);
    if (!params.teamId || !workspaceId) return { comped: false, reason: 'invalid' };
    await this.ensureCreditsSchema();

    // Already entitled (paid or comped): don't consume a credit.
    if (await this.hasActiveEntitlement(params.teamId, workspaceId)) {
      return { comped: false, reason: 'already_entitled' };
    }

    // Atomically claim ONE available credit (returns a row only if one was free).
    const claim = await this.db.query(
      `UPDATE workspace_credits
          SET used = used + 1, updated_at = NOW()
        WHERE id = (
          SELECT id FROM workspace_credits
           WHERE team_id = $1 AND used < total
           ORDER BY created_at ASC LIMIT 1
        )
        -- Re-check on the target row so two concurrent claims on the same single
        -- credit can never both succeed (the loser sees used = total and matches 0).
        AND used < total
        RETURNING id`,
      [params.teamId],
    );
    if (!claim.rows.length) return { comped: false, reason: 'no_credit' };
    const creditId = claim.rows[0].id;

    // Comped entitlement: a sentinel subscription id keeps the UNIQUE/idempotency
    // contract (and keeps it non-blank, so the legacy-audit never revokes it) while
    // recording that this row is included, not a $97 purchase.
    const sentinel = `comp:${params.teamId}:${workspaceId}`;
    try {
      const ins = await this.db.query(
        `INSERT INTO workspace_entitlements
           (team_id, workspace_id, paddle_subscription_id, paddle_price_id,
            status, source, created_by, activated_at, revoked_at, created_at, updated_at)
         VALUES ($1, $2, $3, NULL, 'active', 'included_promo', $4, NOW(), NULL, NOW(), NOW())
         ON CONFLICT (paddle_subscription_id) DO NOTHING`,
        [params.teamId, workspaceId, sentinel, params.userId || null],
      );
      if ((ins.rowCount || 0) === 0) {
        // A comped row for this workspace already existed — refund the credit.
        await this.db
          .query(
            `UPDATE workspace_credits SET used = used - 1, updated_at = NOW() WHERE id = $1`,
            [creditId],
          )
          .catch(() => {});
        return { comped: false, reason: 'already_entitled' };
      }
    } catch (e: any) {
      await this.db
        .query(
          `UPDATE workspace_credits SET used = used - 1, updated_at = NOW() WHERE id = $1`,
          [creditId],
        )
        .catch(() => {});
      this.logger.error(`claimIncludedWorkspace failed: ${e?.message}`);
      return { comped: false, reason: 'error' };
    }
    this.logger.log(
      `Comped workspace '${workspaceId}' for team ${params.teamId} using an included credit`,
    );
    return { comped: true };
  }

  /** Full entitlement rows for a team (all statuses), newest first. */
  async listForTeam(teamId: string): Promise<WorkspaceEntitlementRow[]> {
    if (!teamId) return [];
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, team_id, workspace_id, paddle_subscription_id, paddle_price_id,
              status, activated_at, revoked_at
         FROM workspace_entitlements
        WHERE team_id = $1
        ORDER BY updated_at DESC`,
      [teamId],
    );
    return rows as WorkspaceEntitlementRow[];
  }
}
