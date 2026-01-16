import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';

/**
 * Guard that requires an active subscription
 * Returns 403 FORBIDDEN if team doesn't have active subscription
 * Use this for features that require any subscription (not specific features)
 */
@Injectable()
export class SubscriptionRequiredGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkActiveSubscription(user.teamId);

    return true;
  }
}
