import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadAIService } from './lead-ai.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WhatsAppLeadService } from './services/whatsapp-lead.service';
import { WhatsAppPhoneResolverService } from './services/whatsapp-phone-resolver.service';
import { BuyerLinkerService } from './services/buyer-linker.service';

@Module({
  imports: [AnalyticsModule, SubscriptionsModule],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    LeadAIService,
    WhatsAppLeadService,
    WhatsAppPhoneResolverService,
    BuyerLinkerService,
  ],
  exports: [LeadsService, LeadAIService],
})
export class LeadsModule {}

