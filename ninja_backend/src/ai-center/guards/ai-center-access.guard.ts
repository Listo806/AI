import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

/**
 * AI Center: only ADMIN, OWNER, AGENT may access. Others get 403.
 * Use with CrmAccessGuard (team + CRM required).
 */
@Injectable()
export class AiCenterAccessGuard implements CanActivate {
  private static readonly ALLOWED_VIEW: UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.AGENT];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('Access denied');
    }

    if (!AiCenterAccessGuard.ALLOWED_VIEW.includes(user.role as UserRole)) {
      throw new ForbiddenException('AI Center is not available for your role');
    }

    return true;
  }
}
