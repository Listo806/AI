import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionEnforcementService } from '../services/subscription-enforcement.service';
import { TeamsService } from '../../teams/teams.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Guard that enforces AI features access
 * Returns 403 FORBIDDEN if team doesn't have AI features
 * NOTE: Owners who own teams but have teamId=null get their first owned team resolved
 */
@Injectable()
export class AiFeaturesGuard implements CanActivate {
  constructor(
    private readonly enforcementService: SubscriptionEnforcementService,
    private readonly teamsService: TeamsService,
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
      const teams = await this.teamsService.findByUserId(user.id);
      if (teams.length > 0) {
        teamId = teams[0].id;
        user.teamId = teamId; // Attach for downstream use
      }
    }

    if (!teamId) {
      throw new ForbiddenException('User must be part of a team');
    }

    await this.enforcementService.checkAiFeatures(teamId);

    return true;
  }
}
