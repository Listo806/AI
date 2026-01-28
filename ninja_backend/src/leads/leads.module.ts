import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadAIService } from './lead-ai.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WhatsAppLeadService } from './services/whatsapp-lead.service';
import { WhatsAppPhoneResolverService } from './services/whatsapp-phone-resolver.service';
import { BuyerLinkerService } from './services/buyer-linker.service';
import { AILeadAnalysisService } from './services/ai-lead-analysis.service';
import { MessageDraftService } from './services/message-draft.service';
import { AILeadController } from './controllers/ai-lead.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [AnalyticsModule, SubscriptionsModule, IntegrationsModule, IntelligenceModule, MessagingModule],
  controllers: [AILeadController, LeadsController],
  providers: [
    LeadsService,
    LeadAIService,
    WhatsAppLeadService,
    WhatsAppPhoneResolverService,
    BuyerLinkerService,
    AILeadAnalysisService,
    MessageDraftService,
  ],
  exports: [LeadsService, LeadAIService],
})
export class LeadsModule {}

