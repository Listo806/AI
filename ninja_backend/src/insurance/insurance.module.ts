import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { StorageModule } from '../integrations/storage/storage.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

// Insurance Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, the shared StorageService for documents, and the WorkspaceLockGuard
// (from WorkspacesModule) to enforce the paid workspace add-on when its lock is on;
// no duplicate auth/tenant/storage systems.
@Module({
  imports: [DatabaseModule, StorageModule, WorkspacesModule],
  controllers: [InsuranceController],
  providers: [PaymentGuard, InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
