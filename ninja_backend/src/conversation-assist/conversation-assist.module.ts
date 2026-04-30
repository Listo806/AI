import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { AiAssistantModule } from '../integrations/ai/ai-assistant.module';
import { PropertiesModule } from '../properties/properties.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ConversationAssistEngineService } from './conversation-assist-engine.service';
import { ConversationAssistCrmController } from './conversation-assist-crm.controller';

@Module({
  imports: [ConfigModule, AiAssistantModule, PropertiesModule, AuthModule, SubscriptionsModule],
  controllers: [ConversationAssistCrmController],
  providers: [ConversationAssistEngineService],
  exports: [ConversationAssistEngineService],
})
export class ConversationAssistModule {}
