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
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';
import { WORKSPACE_CATALOG, getWorkspace } from './workspace-registry';

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
