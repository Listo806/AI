import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';

/**
 * Guard that enforces CRM access
 * Returns 403 FORBIDDEN if team doesn't have CRM access
 */
@Injectable()
export class CrmAccessGuard implements CanActivate {
  constructor(private readonly enforcementService: SubscriptionEnforcementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkCrmAccess(user.teamId);

    return true;
  }
}
