import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller';
import { AgentsController } from './agents.controller';
import { BuyerEventsService } from './services/buyer-events.service';
import { IntentScoringService } from './services/intent-scoring.service';
import { MarketSignalsService } from './services/market-signals.service';
import { BuyerPreferencesService } from './services/buyer-preferences.service';
import { TriggerEvaluationService } from './services/trigger-evaluation.service';
import { AgentPriorityFeedService } from './services/agent-priority-feed.service';
import { EngagementTrackingService } from './services/engagement-tracking.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IntelligenceController, AgentsController],
  providers: [
    BuyerEventsService,
    IntentScoringService,
    MarketSignalsService,
    BuyerPreferencesService,
    TriggerEvaluationService,
    AgentPriorityFeedService,
    EngagementTrackingService,
  ],
  exports: [
    BuyerEventsService,
    IntentScoringService,
    MarketSignalsService,
    BuyerPreferencesService,
    TriggerEvaluationService,
    AgentPriorityFeedService,
    EngagementTrackingService,
  ],
})
export class IntelligenceModule {}
