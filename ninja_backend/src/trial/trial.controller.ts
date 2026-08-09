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
}