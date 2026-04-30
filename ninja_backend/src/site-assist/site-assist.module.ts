import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { ConversationAssistModule } from '../conversation-assist/conversation-assist.module';
import { SiteAssistController } from './site-assist.controller';
import { SiteAssistService } from './site-assist.service';
import { SiteAssistOrchestratorService } from './site-assist-orchestrator.service';

@Module({
  imports: [DatabaseModule, ConfigModule, ConversationAssistModule],
  controllers: [SiteAssistController],
  providers: [SiteAssistService, SiteAssistOrchestratorService],
})
export class SiteAssistModule {}
