import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { DatabaseService } from '../../database/database.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that requires an active subscription
 * Returns 403 FORBIDDEN if team doesn't have active subscription
 * Use this for features that require any subscription (not specific features)
 * 
 * NOTE: VA users bypass subscription checks (they can access listings without subscription)
 * NOTE: Owners who own teams but have teamId=null get their first owned team resolved
 */
@Injectable()
export class SubscriptionRequiredGuard implements CanActivate {
  constructor(
    private readonly enforcementService: SubscriptionEnforcementService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // VA users bypass subscription requirements
    if (user && user.role === UserRole.VA) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User must be part of a team');
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

    if (!teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkActiveSubscription(teamId);

    return true;
  }
}
