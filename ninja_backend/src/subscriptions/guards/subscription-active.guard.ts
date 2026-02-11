import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../../users/entities/user.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionActiveGuard implements CanActivate {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No active subscription found');
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

    if (!teamId) {
      throw new ForbiddenException('No active subscription found');
    }

    const subscription = await this.subscriptionsService.findActiveByTeamId(teamId);

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new ForbiddenException('Active subscription required');
    }

    return true;
  }
}

