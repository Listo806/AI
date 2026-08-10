import { Module } from '@nestjs/common';
import { AiCenterController } from './ai-center.controller';
import { AiCenterService } from './ai-center.service';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { S3Service } from '../common/aws/s3.service';
import { AiAgentSetupCompleteGuard } from "./guards/ai-agent-setup-complete.guard";
import { PaymentGuard } from "../auth/guards/payment.guard";
@Module({
  imports: [DatabaseModule, SubscriptionsModule, PlansModule],
  controllers: [AiCenterController],
  providers: [
    PaymentGuard,
    AiCenterService,
    S3Service,
    AiAgentSetupCompleteGuard,
  ],
  exports: [AiCenterService, AiAgentSetupCompleteGuard],
})
export class AiCenterModule {}
