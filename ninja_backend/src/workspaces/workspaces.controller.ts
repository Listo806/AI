import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DatabaseService } from '../database/database.service';
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';
import {
  WORKSPACE_CATALOG,
  getWorkspace,
  getLockedWorkspaceIds,
  isWorkspaceLocked,
} from './workspace-registry';

// Workspace access endpoints. Customer-facing workspace selection is now attached
// directly to the customer's active CRM subscription. Existing Paddle-backed
// entitlement rows remain supported for legacy customers, but selecting the one
// Workspace included with the CRM plan never opens a separate checkout.
@ApiTags('workspaces')
@ApiBearerAuth('JWT-auth')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly entitlements: WorkspaceEntitlementsService,
    private readonly db: DatabaseService,
  ) {}

  // Workspace-plan changes are restricted to the account owner/admin roles.
  private assertBillingAdmin(user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Only account admins can manage workspace add-ons');
    }
  }

  private async getActiveCrmSubscription(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", plan_id AS "planId", status, provider
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

  @Get('catalog')
  @ApiOperation({ summary: 'List Workspaces available for the CRM plan' })
  async getCatalog() {
    return {
      includedWithPlan: true,
      includedWorkspaceLimit: 1,
      available: true,
      workspaces: WORKSPACE_CATALOG.map((w) => ({
        id: w.id,
        name: w.name,
        route: w.route,
      })),
    };
  }

  @Get('entitlements')
  @ApiOperation({ summary: "The current team's Workspace entitlements" })
  async getEntitlements(@CurrentUser() user: any) {
    const teamId = await this.entitlements.resolveTeamId(user);
    const [rows, activeWorkspaceIds] = await Promise.all([
      this.entitlements.listForTeam(teamId),
      this.entitlements.listActiveWorkspaceIds(teamId),
    ]);
    return { entitlements: rows, activeWorkspaceIds };
  }

  @Get('access')
  @ApiOperation({
    summary: 'Per-workspace lock + entitlement state for the current team',
  })
  async getAccess(@CurrentUser() user: any) {
    const teamId = await this.entitlements.resolveTeamId(user);
    const instances = await this.entitlements.listActiveWorkspaceInstances(teamId);
    const instanceByWorkspace = new Map(
      instances.map((row) => [row.workspace_id, row]),
    );
    const isSupport = String(user?.role || '').toLowerCase() === 'super_admin';

    return {
      workspaces: WORKSPACE_CATALOG.map((w) => {
        const locked = isWorkspaceLocked(w.id);
        const instance = instanceByWorkspace.get(w.id);
        const entitled = !!instance;
        return {
          id: w.id,
          name: w.name,
          route: w.route,
          locked,
          entitled,
          accessible: !locked || entitled || isSupport,
          workspaceInstanceId: instance?.id || null,
          planSubscriptionId: instance?.plan_subscription_id || null,
          planId: instance?.plan_id || null,
          source: instance?.source || null,
        };
      }),
    };
  }

  // Admin-only pre-lock review: which accounts are actively using a workspace (so
  // the client can handle the few dev-period accounts before a lock is enabled).
  // Only Insurance has a real backend today, so usage there means "has insurance
  // records"; the other workspaces are demo UI with no stored data.
  @Get('usage-report')
  @ApiOperation({ summary: 'Platform support: accounts with workspace activity (pre-lock review)' })
  async usageReport(@CurrentUser() user: any) {
    // This report aggregates EVERY tenant's usage (team names + record counts), so
    // it is platform-support only. 'owner'/'admin' are per-account roles (any
    // signup can be an owner) and must never see cross-tenant data.
    if (String(user?.role || '').toLowerCase() !== 'super_admin') {
      throw new ForbiddenException('Platform support only');
    }

    // Teams with any insurance data, with a name and the row counts + an active
    // entitlement flag so the reviewer can see who would be locked out. Guarded so
    // a not-yet-created table in some environment returns an empty report, not 500.
    let rows: any[] = [];
    try {
      const res = await this.db.query(
        `WITH usage AS (
           SELECT team_id, COUNT(*)::int AS n FROM insurance_policies GROUP BY team_id
           UNION ALL SELECT team_id, COUNT(*)::int FROM insurance_claims GROUP BY team_id
           UNION ALL SELECT team_id, COUNT(*)::int FROM insurance_quotes GROUP BY team_id
         )
         SELECT u.team_id AS "teamId",
                t.name AS "teamName",
                SUM(u.n)::int AS "recordCount",
                EXISTS (
                  SELECT 1 FROM workspace_entitlements we
                   WHERE we.team_id = u.team_id
                     AND we.workspace_id = 'insurance'
                     AND we.status = 'active'
                ) AS "hasEntitlement"
           FROM usage u
           LEFT JOIN teams t ON t.id = u.team_id
          GROUP BY u.team_id, t.name
          ORDER BY "recordCount" DESC`,
      );
      rows = res.rows;
    } catch {
      rows = [];
    }

    return {
      workspace: 'insurance',
      lockedWorkspaces: getLockedWorkspaceIds(),
      accountsUsingInsurance: rows,
      note:
        'Accounts here have Insurance data. Any without an active entitlement would lose access when the Insurance lock is enabled.',
    };
  }

  // One-time LEGACY WORKSPACE ACCESS CLEANUP (platform support only).
  //
  // Every paid Workspace is now LOCKED by default and access is enforced server-side
  // by WorkspaceLockGuard, so any account WITHOUT a verified active entitlement is
  // already locked out at the data layer — no per-account reset is needed for that.
  // This endpoint (a) reports the exact numbers, and (b) revokes any ACTIVE
  // entitlement row that is improper. Plan-linked rows are valid even though they do
  // not have a Paddle workspace subscription; they are linked to the customer's base
  // CRM subscription through plan_subscription_id. CRM data/accounts are untouched.
  @Post('legacy-audit')
  @ApiOperation({ summary: 'Platform support: one-time legacy Workspace access lockdown + report' })
  async legacyAudit(@CurrentUser() user: any) {
    if (String(user?.role || '').toLowerCase() !== 'super_admin') {
      throw new ForbiddenException('Platform support only');
    }

    // Guarantee the entitlements table exists before we query it.
    await this.entitlements
      .listActiveWorkspaceIds('00000000-0000-0000-0000-000000000000')
      .catch(() => []);

    const validIds = WORKSPACE_CATALOG.map((w) => w.id);

    const [teamsRes, beforeRes, byWsRes] = await Promise.all([
      this.db.query(`SELECT COUNT(*)::int AS n FROM teams`),
      this.db.query(
        `SELECT COUNT(*)::int AS rows, COUNT(DISTINCT team_id)::int AS teams
           FROM workspace_entitlements WHERE status = 'active'`,
      ),
      this.db.query(
        `SELECT workspace_id AS "workspaceId", COUNT(*)::int AS n
           FROM workspace_entitlements WHERE status = 'active'
          GROUP BY workspace_id ORDER BY n DESC`,
      ),
    ]);

    // Revoke improper active grants: unknown workspace id, or no real subscription.
    const revokedRes = await this.db.query(
      `UPDATE workspace_entitlements
          SET status = 'canceled', revoked_at = NOW(), updated_at = NOW()
        WHERE status = 'active'
          AND (
            workspace_id <> ALL($1::text[])
            OR (
              COALESCE(source, 'paddle') = 'paddle'
              AND (paddle_subscription_id IS NULL OR btrim(paddle_subscription_id) = '')
            )
            OR (
              source = 'plan_included'
              AND plan_subscription_id IS NULL
            )
          )
        RETURNING id, team_id AS "teamId", workspace_id AS "workspaceId"`,
      [validIds],
    );

    const afterRes = await this.db.query(
      `SELECT COUNT(*)::int AS rows, COUNT(DISTINCT team_id)::int AS teams
         FROM workspace_entitlements WHERE status = 'active'`,
    );

    const totalTeams = teamsRes.rows[0]?.n || 0;
    const teamsKeepingAccess = afterRes.rows[0]?.teams || 0;

    return {
      enforcement: 'Workspaces are locked by default; customer access requires an active entitlement linked to the CRM plan (or a preserved legacy paid entitlement).',
      lockedWorkspaces: getLockedWorkspaceIds(),
      totals: {
        totalTeams,
        // Every team without a verified entitlement is now locked out of every paid
        // workspace by the server-side guard.
        teamsLockedOut: Math.max(0, totalTeams - teamsKeepingAccess),
        teamsKeepingWorkspaceAccess: teamsKeepingAccess,
      },
      entitlements: {
        activeBefore: beforeRes.rows[0]?.rows || 0,
        activeAfter: afterRes.rows[0]?.rows || 0,
        byWorkspace: byWsRes.rows,
      },
      revoked: {
        count: revokedRes.rowCount || 0,
        rows: revokedRes.rows,
      },
      note:
        'Revoked entries were improper grants only. Valid plan-linked Workspace instances and existing CRM/customer data were preserved.',
    };
  }

  @Post(':workspaceId/activate')
  @ApiOperation({
    summary: 'Attach the selected Workspace directly to the active CRM plan',
  })
  async activate(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    this.assertBillingAdmin(user);

    const workspace = getWorkspace(workspaceId);
    if (!workspace) {
      throw new BadRequestException(`Unknown workspace: ${workspaceId}`);
    }

    const teamId = await this.entitlements.resolveTeamId(user);
    if (!teamId) {
      throw new BadRequestException('A CRM team/account is required to activate a workspace.');
    }

    const activeSubscription = await this.getActiveCrmSubscription(teamId);
    if (!activeSubscription) {
      throw new BadRequestException(
        'An active CRM plan is required before a workspace can be added.',
      );
    }

    const result = await this.entitlements.activateForPlan({
      teamId,
      workspaceId: workspace.id,
      planSubscriptionId: activeSubscription.id,
      planId: activeSubscription.planId || null,
      userId: user?.id || null,
    });

    if (!result.activated) {
      if (result.reason === 'already_has_plan_workspace') {
        throw new BadRequestException(
          'This CRM plan already has its included Workspace selected. Open the active Workspace or contact support to change the selection.',
        );
      }
      throw new BadRequestException('The workspace could not be activated for this CRM plan.');
    }

    return {
      success: true,
      activated: true,
      alreadyEntitled: !!result.alreadyEntitled,
      workspaceId: workspace.id,
      workspaceInstanceId: result.workspaceInstanceId,
      planSubscriptionId: result.planSubscriptionId,
      planId: result.planId,
      route: workspace.route,
      source: 'plan_included',
      paymentRequired: false,
    };
  }

  // Backwards-compatible alias for older frontend builds. It intentionally performs
  // the same no-payment plan activation and never returns Paddle checkout data.
  @Post(':workspaceId/purchase')
  @ApiOperation({ summary: 'Deprecated alias: activate Workspace on CRM plan' })
  async purchase(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.activate(workspaceId, user);
  }

}
