import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadAIService } from './lead-ai.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { WhatsAppLeadService } from './services/whatsapp-lead.service';
import { WhatsAppPhoneResolverService } from './services/whatsapp-phone-resolver.service';
import { BuyerLinkerService } from './services/buyer-linker.service';
import { AILeadAnalysisService } from './services/ai-lead-analysis.service';
import { MessageDraftService } from './services/message-draft.service';
import { LeadStateService } from './services/lead-state.service';
import { AILeadController } from './controllers/ai-lead.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { MessagingModule } from '../messaging/messaging.module';
import { WebhooksModule } from '../integrations/webhooks/webhooks.module';
import { AwsModule } from '../common/aws/aws.module';
import { PaymentGuard } from '../auth/guards/payment.guard';

@Module({
  imports: [ConfigModule, AnalyticsModule, SubscriptionsModule, PlansModule, IntegrationsModule, IntelligenceModule, forwardRef(() => MessagingModule), WebhooksModule, AwsModule],
  controllers: [AILeadController, LeadsController],
  providers: [
    PaymentGuard,
    LeadsService,
    LeadAIService,
    WhatsAppLeadService,
    WhatsAppPhoneResolverService,
    BuyerLinkerService,
    AILeadAnalysisService,
    MessageDraftService,
    LeadStateService,
  ],
  exports: [LeadsService, LeadAIService, LeadStateService],
})
export class LeadsModule {}

