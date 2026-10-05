import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
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
 *
 * WorkspacesModule provides WorkspaceEntitlementsService: a paid Workspace
 * add-on ($97/month) bought through Nuvei unlocks via the same entitlement
 * rows the WorkspaceLockGuard reads. WorkspacesModule imports only the
 * database, so there is no module cycle.
 */
@Module({
  imports: [ConfigModule, DatabaseModule, PlatformMailModule, WorkspacesModule],
  controllers: [NuveiController],
  providers: [NuveiService, NuveiClientService, RenewalReportingService],
  exports: [NuveiService, NuveiClientService],
})
export class NuveiModule {}
