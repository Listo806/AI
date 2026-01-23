import { Module } from '@nestjs/common';
import { IntelligenceController } from './intelligence.controller';
import { BuyerEventsService } from './services/buyer-events.service';
import { IntentScoringService } from './services/intent-scoring.service';
import { MarketSignalsService } from './services/market-signals.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IntelligenceController],
  providers: [BuyerEventsService, IntentScoringService, MarketSignalsService],
  exports: [BuyerEventsService, IntentScoringService, MarketSignalsService],
})
export class IntelligenceModule {}
