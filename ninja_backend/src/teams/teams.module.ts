import { Module, forwardRef  } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MembersModule } from './members/members.module';
import { TeamAIInsightsService } from "./insights/ai-insights.service";
import { TeamAnalyticsService } from "./analytics/team-analytics.service";
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [UsersModule, AnalyticsModule, NotificationsModule, forwardRef(() => MembersModule), WorkspacesModule,],
  controllers: [TeamsController],
  providers: [TeamsService, TeamAIInsightsService, TeamAnalyticsService],
  exports: [TeamsService],
})
export class TeamsModule {}

