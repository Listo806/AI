import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';

/**
 * Guard that enforces AI features access
 * Returns 403 FORBIDDEN if team doesn't have AI features
 */
@Injectable()
export class AiFeaturesGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkAiFeatures(user.teamId);

    return true;
  }
}
