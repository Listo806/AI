import { Controller, Get, Patch, Body, Param, UseGuards, ForbiddenException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiUnitsService } from './ai-units.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES = ['admin', 'super_admin'];

@ApiTags('ai-units')
@ApiBearerAuth('JWT-auth')
@Controller('ai-units')
@UseGuards(JwtAuthGuard)
export class AiUnitsController {
  constructor(private readonly aiUnits: AiUnitsService) {}

  /** The single balance the sidebar meter, desktop HUD and mobile HUD all read. */
  @Get('balance')
  getBalance(@CurrentUser() user: any) {
    return this.aiUnits.getBalance(user);
  }

  /** Paddle checkout params for a one-time AI-Unit pack (boost/plus/max). */
  @Get('checkout/:packageId')
  getCheckout(@CurrentUser() user: any, @Param('packageId') packageId: string) {
    return this.aiUnits.getCheckout(user, packageId);
  }

  /** Public-facing config: allowance, action costs, packages, thresholds. */
  @Get('config')
  async getConfig() {
    const cfg = await this.aiUnits.getConfig();
    return {
      freeAllowance: cfg.freeAllowance,
      actionCosts: cfg.actionCosts,
      packages: cfg.packages,
      thresholds: cfg.thresholds,
      lowThreshold: cfg.lowThreshold,
      soloPrice: cfg.soloPrice,
    };
  }

  /** Admin: adjust configuration without a frontend rebuild. */
  @Patch('config')
  setConfig(@CurrentUser() user: any, @Body() body: any) {
    if (!ADMIN_ROLES.includes(user?.role)) {
      throw new ForbiddenException('Admin only');
    }
    return this.aiUnits.setConfig(body);
  }

  /** Admin: AI-Units snapshot resolved from a customer's (owner) user id. */
  @Get('admin/by-user/:userId')
  adminViewByUser(@CurrentUser() user: any, @Param('userId', ParseUUIDPipe) userId: string) {
    if (!ADMIN_ROLES.includes(user?.role)) {
      throw new ForbiddenException('Admin only');
    }
    return this.aiUnits.getAdminViewByUser(userId);
  }

  /** Admin: full AI-Units snapshot for a team (customer support). */
  @Get('admin/:teamId')
  adminView(@CurrentUser() user: any, @Param('teamId', ParseUUIDPipe) teamId: string) {
    if (!ADMIN_ROLES.includes(user?.role)) {
      throw new ForbiddenException('Admin only');
    }
    return this.aiUnits.getAdminView(teamId);
  }
}
