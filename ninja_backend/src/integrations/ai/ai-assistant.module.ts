import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { ConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../../database/database.module';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';
import { PlansModule } from '../../plans/plans.module';
import { PaymentGuard } from '../../auth/guards/payment.guard';

@Module({
  imports: [ConfigModule, DatabaseModule, SubscriptionsModule, PlansModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, PaymentGuard],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}

