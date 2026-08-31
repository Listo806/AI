import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request?.user;
    if (!user) return false;

    const url = String(request?.originalUrl || request?.url || '');
    const isAdminRoute = /^\/?api\/admin(?:\/|$)/i.test(url) || /^\/admin(?:\/|$)/i.test(url);

    if (isAdminRoute) {
      // On /admin APIs, legacy users.role is no longer sufficient for privileged
      // access. JwtStrategy exposes internalRole only while internal access is active.
      const internalRole = user.internalRole;
      return requiredRoles.some((role) => internalRole === role);
    }

    // Customer/CRM routes keep their existing users.role semantics. This avoids
    // breaking a customer/team role simply because the same identity also has
    // Cortexa internal access.
    return requiredRoles.some((role) => user.role === role);
  }
}
