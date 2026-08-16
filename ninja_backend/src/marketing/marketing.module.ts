import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MarketingController } from './marketing.controller';
import { MarketingPublicController } from './marketing-public.controller';
import { MarketingService } from './marketing.service';

// Marketing Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, and the WorkspaceLockGuard (from WorkspacesModule) to enforce the
// $97 add-on when its lock is on; no duplicate auth/tenant systems.
@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [MarketingController, MarketingPublicController],
  providers: [PaymentGuard, MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
