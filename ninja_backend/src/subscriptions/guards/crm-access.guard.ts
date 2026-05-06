import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that enforces CRM access
 * Returns 403 FORBIDDEN if team doesn't have CRM access
 * NOTE: Owners who own teams but have teamId=null get their first owned team resolved
 */
@Injectable()
export class CrmAccessGuard implements CanActivate {
  constructor(
    private readonly enforcementService: SubscriptionEnforcementService,
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User must be part of a team');
    }
    console.log('CRM GUARD ROLE:', user.role);
    if (user.role === UserRole.AGENT || user.role === UserRole.DEVELOPER) {
      return true;
    }
    // Owners may own teams via owner_id but have user.team_id=null; resolve first owned team
    let teamId = user.teamId;
    if (!teamId && user.role === UserRole.OWNER) {
      const { rows } = await this.db.query(
        `SELECT id FROM teams WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [user.id],
      );
      if (rows.length > 0) {
        teamId = rows[0].id;
        user.teamId = teamId; // Attach for downstream use
      }
    }

    const enforcementDisabled =
      (this.configService.get('SUBSCRIPTION_ENFORCEMENT_DISABLED') ?? 'false') === 'true';
    if (enforcementDisabled) {
      return true;
    }

    //if (!teamId) {
      //throw new ForbiddenException('User must be part of a team');
    //}

    //await this.enforcementService.checkCrmAccess(teamId);
    await this.enforcementService.checkCrmAccess(teamId, user.role);

    return true;
  }
}
