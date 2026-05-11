import { Module } from '@nestjs/common';
import { AiCenterController } from './ai-center.controller';
import { AiCenterService } from './ai-center.service';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { S3Service } from '../common/aws/s3.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [AiCenterController],
  providers: [
    AiCenterService,
    S3Service,
  ],
  exports: [AiCenterService],
})
export class AiCenterModule {}
