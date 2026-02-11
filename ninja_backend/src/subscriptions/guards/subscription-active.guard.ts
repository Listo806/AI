import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';
import { TeamsService } from '../../teams/teams.service';
import { UserRole } from '../../users/entities/user.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

@Injectable()
export class SubscriptionActiveGuard implements CanActivate {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly teamsService: TeamsService,
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
      const teams = await this.teamsService.findByUserId(user.id);
      if (teams.length > 0) {
        teamId = teams[0].id;
        user.teamId = teamId; // Attach for downstream use
      }
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

