import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that requires an active subscription
 * Returns 403 FORBIDDEN if team doesn't have active subscription
 * Use this for features that require any subscription (not specific features)
 * 
 * NOTE: VA users bypass subscription checks (they can access listings without subscription)
 */
@Injectable()
export class SubscriptionRequiredGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // VA users bypass subscription requirements
    if (user && user.role === UserRole.VA) {
      return true;
    }

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkActiveSubscription(user.teamId);

    return true;
  }
}
