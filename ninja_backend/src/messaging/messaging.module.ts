import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { LeadMessagesService } from './lead-messages.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { EmailService } from './email.service';
import { AgentWhatsAppConnectionService } from './agent-whatsapp-connection.service';
import { WhatsAppController } from './whatsapp.controller';
import { EmailController } from './email.controller';
import { AgentWhatsAppController } from './agent-whatsapp.controller';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';
import { InstagramDmService } from './instagram-dm.service';
import { InstagramWebhookService } from './instagram-webhook.service';
import { InstagramController } from './instagram.controller';
import { AgentInstagramController } from './agent-instagram.controller';
import { ConversationsService } from './conversations.service';
import { WhatsAppRoutingService } from './whatsapp-routing.service';
import { WhatsAppAiReplyService } from './whatsapp-ai-reply.service';
import { TwilioMediaService } from './twilio-media.service';
import { WhatsAppInboundService } from './whatsapp-inbound.service';
import { WhatsAppCardsService } from './whatsapp-cards.service';
import { WhatsAppActionsService } from './whatsapp-actions.service';
import { IntentEventsService } from './intent-events.service';

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule, IntegrationsModule],
  controllers: [
    WhatsAppController,
    EmailController,
    AgentWhatsAppController,
    InstagramController,
    AgentInstagramController,
  ],
  providers: [
    LeadMessagesService,
    TwilioWhatsAppService,
    EmailService,
    AgentWhatsAppConnectionService,
    AgentInstagramConnectionService,
    InstagramDmService,
    InstagramWebhookService,
    ConversationsService,
    WhatsAppRoutingService,
    TwilioMediaService,
    WhatsAppAiReplyService,
    WhatsAppInboundService,
    WhatsAppCardsService,
    WhatsAppActionsService,
    IntentEventsService,
  ],
  exports: [LeadMessagesService, ConversationsService],
})
export class MessagingModule {}
