import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ComparableListingsService } from './services/comparable-listings.service';
import { MatchExplanationService } from './services/match-explanation.service';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [IntelligenceModule, PropertiesModule],
  controllers: [ListingsController],
  providers: [ComparableListingsService, MatchExplanationService],
  exports: [ComparableListingsService, MatchExplanationService],
})
export class ListingsModule {}
