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
    const teamId = user?.teamId;
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
    const teamId = user?.teamId;
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

    const teamId = user?.teamId;
    if (!teamId) {
      throw new BadRequestException('A team is required to purchase a workspace add-on.');
    }

    const priceId = process.env.PADDLE_PRICE_WORKSPACE;
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
      },
      email: user?.email || null,
    };
  }
}
