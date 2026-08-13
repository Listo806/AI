import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TrialService } from './trial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  countryFromHeaders,
  clientIpFromHeaders,
} from '../common/signup-geo.util';

@Controller('trial')
export class TrialController {
  constructor(private trialService: TrialService) {}

  @Post('start-trial')
  startTrial(@Body() dto: any, @Req() req: any) {
    // Registration country: Cloudflare's country header first, IP as the fallback.
    return this.trialService.startTrial(dto, {
      country: countryFromHeaders(req?.headers),
      ip: clientIpFromHeaders(req?.headers, req),
    });
  }

  // Set the plan on the logged-in account after Create Account -> Pricing picks a
  // plan on the pricing page). Auth-gated so it only updates the caller's own
  // account. Never creates a second account.
  @Post('select-plan')
  @UseGuards(JwtAuthGuard)
  selectPlan(@CurrentUser() user: any, @Body() dto: any) {
    return this.trialService.selectPlan(user?.id, dto);
  }

  // PUBLIC: the recovery-email CTA. The single-use token in the body is the auth,
  // so no JwtAuthGuard. Activates Free Forever on the existing account only if it
  // still has no plan (never overwrites a paid plan), then returns a normal
  // session so the frontend can drop the user straight into the dashboard.
  @Post('recover-free')
  recoverFree(@Body() body: any) {
    return this.trialService.recoverFreePlan(body?.token);
  }
}