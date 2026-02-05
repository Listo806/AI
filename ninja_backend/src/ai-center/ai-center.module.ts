import { Module } from '@nestjs/common';
import { AiCenterController } from './ai-center.controller';
import { AiCenterService } from './ai-center.service';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [AiCenterController],
  providers: [AiCenterService],
  exports: [AiCenterService],
})
export class AiCenterModule {}
