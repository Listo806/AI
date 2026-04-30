import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '../../config/config.service';
import { UserRole } from '../../users/entities/user.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

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

    const enforcementDisabled =
      (this.configService.get('SUBSCRIPTION_ENFORCEMENT_DISABLED') ?? 'false') === 'true';
    if (enforcementDisabled) {
      return true;
    }

    if (!teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    // Get team's subscription
    const { rows } = await this.db.query(
      `SELECT s.status, s.seat_limit as "seatLimit"
       FROM subscriptions s
       JOIN teams t ON t.subscription_id = s.id
       WHERE t.id = $1 AND s.status = $2`,
      [teamId, SubscriptionStatus.ACTIVE],
    );

    if (rows.length === 0) {
      throw new ForbiddenException('Team does not have an active subscription');
    }

    // Store subscription info in request for later use
    request.subscription = rows[0];

    return true;
  }
}

