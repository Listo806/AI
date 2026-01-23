import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';

/**
 * Guard that enforces listing creation limits
 * Returns 403 FORBIDDEN if listing limit is reached
 */
@Injectable()
export class ListingLimitGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    // Hard block if limit reached
    await this.enforcementService.checkListingCreation(user.teamId);

    return true;
  }
}
