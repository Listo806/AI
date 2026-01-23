import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadAIService } from './lead-ai.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AnalyticsModule, SubscriptionsModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadAIService],
  exports: [LeadsService, LeadAIService],
})
export class LeadsModule {}

