import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { publicPlansConfig } from './plan-config';
import { UsageService } from './usage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Public: the pricing page, exit popup, and lock/upgrade screens read the plan
// catalog (labels, prices, limits, features) from here so the frontend and
// backend always agree on what each plan costs and unlocks. No secrets are
// exposed (Paddle price ids stay in env). The usage endpoint is auth-gated and
// returns the caller's team plan + current usage against the Free limits.
@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly usage: UsageService) {}

  @Get('config')
  @ApiOperation({ summary: 'Public plan catalog: prices, limits, features' })
  getConfig() {
    return publicPlansConfig();
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Current team's plan limits and usage" })
  getUsage(@CurrentUser() user: any) {
    return this.usage.getUsageSummary(user?.teamId || user?.team_id || null);
  }
}
