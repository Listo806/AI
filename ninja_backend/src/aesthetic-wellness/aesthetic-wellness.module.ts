import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AestheticWellnessController } from './aesthetic-wellness.controller';
import { AestheticWellnessService } from './aesthetic-wellness.service';
import { WorkspaceAiSetupService } from './workspace-ai-setup.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [AestheticWellnessController],
  providers: [AestheticWellnessService, WorkspaceAiSetupService],
  exports: [AestheticWellnessService, WorkspaceAiSetupService],
})
export class AestheticWellnessModule {}
