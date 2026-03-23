import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';
import { AiAssistantModule } from '../integrations/ai/ai-assistant.module';
import { PropertiesModule } from '../properties/properties.module';
import { SiteAssistController } from './site-assist.controller';
import { SiteAssistService } from './site-assist.service';
import { SiteAssistOrchestratorService } from './site-assist-orchestrator.service';

@Module({
  imports: [DatabaseModule, ConfigModule, AiAssistantModule, PropertiesModule],
  controllers: [SiteAssistController],
  providers: [SiteAssistService, SiteAssistOrchestratorService],
})
export class SiteAssistModule {}
