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

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule],
  controllers: [WhatsAppController, EmailController, AgentWhatsAppController],
  providers: [LeadMessagesService, TwilioWhatsAppService, EmailService, AgentWhatsAppConnectionService],
  exports: [LeadMessagesService],
})
export class MessagingModule {}
