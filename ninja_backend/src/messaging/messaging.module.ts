import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LeadMessagesService } from './lead-messages.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { EmailService } from './email.service';
import { WhatsAppController } from './whatsapp.controller';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule],
  controllers: [WhatsAppController, EmailController],
  providers: [LeadMessagesService, TwilioWhatsAppService, EmailService],
  exports: [LeadMessagesService],
})
export class MessagingModule {}
