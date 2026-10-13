import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that enforces listing creation limits
 * Returns 403 FORBIDDEN if listing limit is reached
 *
 * All roles are subject to purchased listing allowances.
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

    if (enforcementDisabled) {
      return true;
    }

    if (!user) throw new ForbiddenException('Authentication required');
    const teamIdForLimit = user.teamId;
    if (!teamIdForLimit) throw new ForbiddenException('User must be part of a team');
    if (request.body?.teamId && String(request.body.teamId) !== String(teamIdForLimit)) {
      throw new ForbiddenException('Cannot create listings for another team');
    }

    // Vacation Rentals has a separate paid product entitlement, enforced at
    // create/publish by PropertiesService. Do not apply legacy CRM team quota.
    if (request.body?.listingType === 'vacation') return true;

    // Hard block if limit reached
    await this.enforcementService.checkListingCreation(teamIdForLimit);

    return true;
  }
}
