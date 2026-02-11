import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that enforces listing creation limits
 * Returns 403 FORBIDDEN if listing limit is reached
 *
 * NOTE: VA and OWNER users bypass listing limits (they can create unlimited listings)
 */
@Injectable()
export class ListingLimitGuard implements CanActivate {
  constructor(
    private readonly enforcementService: SubscriptionEnforcementService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const enforcementDisabled =
      (this.configService.get('SUBSCRIPTION_ENFORCEMENT_DISABLED') ?? 'false') === 'true';

    // VA and OWNER users bypass listing limits
    if (user && (user.role === UserRole.VA || user.role === UserRole.OWNER)) {
      return true;
    }

    if (enforcementDisabled) {
      return true;
    }

    let teamIdForLimit = user.teamId;
    if (!teamIdForLimit && request.method === 'POST' && request.body && request.body.teamId) {
      teamIdForLimit = request.body.teamId;
    }
    if (!user || !teamIdForLimit) {
      throw new ForbiddenException('User must be part of a team');
    }

    // Hard block if limit reached
    await this.enforcementService.checkListingCreation(teamIdForLimit);

    return true;
  }
}
