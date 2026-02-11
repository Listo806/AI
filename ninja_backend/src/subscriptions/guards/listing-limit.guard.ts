import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that enforces listing creation limits
 * Returns 403 FORBIDDEN if listing limit is reached
 * 
 * NOTE: VA users bypass listing limits (they can create unlimited listings)
 */
@Injectable()
export class ListingLimitGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // VA users bypass listing limits
    if (user && user.role === UserRole.VA) {
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
