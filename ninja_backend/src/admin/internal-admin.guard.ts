import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InternalAdminGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.id;
    if (!userId) return false;

    const { rows } = await this.db.query(
      `SELECT internal_role, status, permissions
         FROM internal_user_access
        WHERE user_id = $1
        LIMIT 1`,
      [userId],
    );

    const access = rows[0];
    if (!access || access.status !== 'active') {
      throw new ForbiddenException('Active internal access is required');
    }

    if (!['super_admin', 'admin'].includes(access.internal_role)) {
      throw new ForbiddenException('Admin internal access is required');
    }

    request.user.internalRole = access.internal_role;
    request.user.internalPermissions = access.permissions ?? [];
    return true;
  }
}
