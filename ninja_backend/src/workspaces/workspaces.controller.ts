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

// Read + purchase-intent endpoints for the paid Workspace add-ons. The actual
// grant/revoke of access happens in the signature-verified Paddle webhook; these
// endpoints only expose the catalog, the team's current entitlements, and the
// parameters the frontend needs to open the $97/month Paddle checkout.
@ApiTags('workspaces')
@ApiBearerAuth('JWT-auth')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly entitlements: WorkspaceEntitlementsService,
    private readonly db: DatabaseService,
  ) {}

  // Billing actions are restricted to account owners/admins, matching the seat and
  // lead-generator add-on purchase endpoints.
  private assertBillingAdmin(user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (!['admin', 'super_admin', 'owner', 'developer'].includes(role)) {
      throw new ForbiddenException('Only account admins can manage workspace add-ons');
    }
  }

  @Get('catalog')
  @ApiOperation({ summary: 'List the paid Workspace add-ons and their price' })
  async getCatalog() {
    const available = !!process.env.PADDLE_PRICE_WORKSPACE;
    return {
      monthlyPrice: 97,
      available,
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
    const activeIds = await this.entitlements.listActiveWorkspaceIds(teamId);
    const isSupport = String(user?.role || '').toLowerCase() === 'super_admin';
    return {
      workspaces: WORKSPACE_CATALOG.map((w) => {
        const locked = isWorkspaceLocked(w.id);
        const entitled = activeIds.includes(w.id);
        return {
          id: w.id,
          name: w.name,
          route: w.route,
          locked,
          entitled,
          // Open when the lock is off, the team is entitled, or the caller is
          // platform support.
          accessible: !locked || entitled || isSupport,
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
  // entitlement row that is improper: an unknown/legacy workspace id, or one with no
  // real Paddle subscription id (i.e. never a verified $97 purchase). Legitimately
  // purchased entitlements (valid workspace id + real subscription id) are preserved,
  // and CRM data / accounts / ids are never touched.
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
            OR paddle_subscription_id IS NULL
            OR btrim(paddle_subscription_id) = ''
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
      enforcement: 'All paid Workspaces are locked by default; access requires a verified $97 entitlement (or super_admin). Plans never include a Workspace.',
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
        'Revoked entries were improper grants (unknown workspace id or no real Paddle subscription). CRM data, accounts, and ids were not modified.',
    };
  }

  @Post(':workspaceId/purchase')
  @ApiOperation({
    summary: 'Get the Paddle checkout parameters to buy a Workspace add-on',
  })
  async purchase(
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
      throw new BadRequestException('A team is required to purchase a workspace add-on.');
    }

    // Per-workspace Paddle price so the checkout shows the SPECIFIC workspace name
    // (e.g. "Sales Workspace Add-On"). Set PADDLE_PRICE_WORKSPACE_<ID> (id upper-cased,
    // hyphens -> underscores, e.g. PADDLE_PRICE_WORKSPACE_SALES,
    // PADDLE_PRICE_WORKSPACE_FINANCIAL_SERVICES, PADDLE_PRICE_WORKSPACE_LEAD_GENERATOR).
    // Falls back to the shared generic price when a specific one is not configured, so
    // nothing breaks before the named prices exist. The workspace name is always in
    // custom_data below, so metadata/webhook/admin are workspace-specific regardless.
    const specificEnvKey = `PADDLE_PRICE_WORKSPACE_${workspace.id
      .toUpperCase()
      .replace(/-/g, '_')}`;
    const priceId = process.env[specificEnvKey] || process.env.PADDLE_PRICE_WORKSPACE;
    if (!priceId) {
      throw new BadRequestException(
        'PADDLE_PRICE_WORKSPACE is not configured yet. Add the $97 Workspace Paddle price id to enable purchases.',
      );
    }

    // Idempotent: if the team already holds this workspace, say so instead of
    // opening a second $97 subscription for the same access.
    const already = await this.entitlements.hasActiveEntitlement(teamId, workspace.id);
    if (already) {
      return { alreadyEntitled: true, workspaceId: workspace.id };
    }

    // The webhook re-derives team authoritatively from userId and re-validates the
    // workspace id, so these values only prefill the checkout; they are not trusted
    // on their own for granting access.
    return {
      alreadyEntitled: false,
      priceId,
      environment:
        process.env.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      customData: {
        userId: user?.id || null,
        teamId,
        addon: 'workspace',
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        // Exact checkout/billing descriptor for this purchase, e.g.
        // "Sales Workspace Add-On" — recorded so Admin/billing always shows which
        // workspace the $97 recurring charge belongs to.
        addonLabel: `${workspace.name} Add-On`,
      },
      email: user?.email || null,
    };
  }
}
