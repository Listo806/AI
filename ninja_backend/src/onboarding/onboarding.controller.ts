import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';

// Post-activation onboarding. Identity always comes from the JWT (never a user id
// in the URL/body). JwtAuthGuard keeps paid-but-unverified accounts out (403
// EMAIL_VERIFICATION_REQUIRED) until the email link has been clicked.
@ApiTags('onboarding')
@ApiBearerAuth('JWT-auth')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('state')
  @ApiOperation({ summary: "The signed-in user's onboarding state and selectable workspaces" })
  state(@CurrentUser() user: any) {
    return this.onboarding.getState(user);
  }

  @Post()
  @ApiOperation({ summary: 'Complete onboarding: select the workspace and save the answers' })
  complete(
    @CurrentUser() user: any,
    @Body() body: { workspaceId?: string; businessType?: string; leadSources?: string[]; mainGoal?: string },
  ) {
    return this.onboarding.complete(user, body || {});
  }
}
