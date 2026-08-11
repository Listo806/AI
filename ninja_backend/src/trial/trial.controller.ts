import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TrialService } from './trial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('trial')
export class TrialController {
  constructor(private trialService: TrialService) {}

  @Post('start-trial')
  startTrial(@Body() dto: any) {
    return this.trialService.startTrial(dto);
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