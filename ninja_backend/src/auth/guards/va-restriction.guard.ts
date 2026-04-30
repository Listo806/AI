import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that blocks VA users from accessing restricted routes
 * VA users can ONLY access:
 * - Properties/Listings (create, edit, publish)
 * - Media upload
 * 
 * VA users are BLOCKED from:
 * - Dashboard analytics
 * - Settings
 * - Billing
 * - Team management
 * - Admin features
 * - Intelligence / AI features
 * - CRM features
 */
@Injectable()
export class VaRestrictionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let other guards handle authentication
    if (!user) {
      return true;
    }

    // Block VA users from accessing restricted routes
    if (user.role === UserRole.VA) {
      throw new ForbiddenException(
        'Access denied. Virtual Assistants can only access listings/properties functionality.'
      );
    }

    return true;
  }
}
