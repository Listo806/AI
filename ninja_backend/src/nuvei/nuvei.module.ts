import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { NuveiService } from './nuvei.service';
import { RenewalReportingService } from './renewal-reporting.service';
import { NuveiClientService } from './nuvei-client.service';
import { NuveiController } from './nuvei.controller';

/**
 * Nuvei / Datafast (Paymentez) payment module.
 *
 * Ships alongside the existing Paddle module and stays dormant until
 * NUVEI_ENABLED=true, so the live billing path is unaffected while the new
 * processor is validated in the testing environment.
 */
@Module({
  imports: [ConfigModule, DatabaseModule, PlatformMailModule],
  controllers: [NuveiController],
  providers: [NuveiService, NuveiClientService, RenewalReportingService],
  exports: [NuveiService, NuveiClientService],
})
export class NuveiModule {}
