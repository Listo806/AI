import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
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

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule],
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
  ],
  exports: [LeadMessagesService],
})
export class MessagingModule {}
