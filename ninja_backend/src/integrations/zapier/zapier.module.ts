import { Module } from '@nestjs/common';
import { ZapierIntegrationService } from './zapier-integration.service';
import { ZapierIntegrationController } from './zapier-integration.controller';

@Module({
  controllers: [ZapierIntegrationController],
  providers: [ZapierIntegrationService],
  exports: [ZapierIntegrationService],
})
export class ZapierModule {}
