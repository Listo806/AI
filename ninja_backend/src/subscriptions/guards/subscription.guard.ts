import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    // Get team's subscription
    const { rows } = await this.db.query(
      `SELECT s.status, s.seat_limit as "seatLimit"
       FROM subscriptions s
       JOIN teams t ON t.subscription_id = s.id
       WHERE t.id = $1 AND s.status = $2`,
      [user.teamId, SubscriptionStatus.ACTIVE],
    );

    if (rows.length === 0) {
      throw new ForbiddenException('Team does not have an active subscription');
    }

    // Store subscription info in request for later use
    request.subscription = rows[0];

    return true;
  }
}

