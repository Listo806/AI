import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';

// Financial Services Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, and the WorkspaceLockGuard (from WorkspacesModule) to enforce the
// $97 add-on when its lock is on; no duplicate auth/tenant systems.
@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [FinancialController],
  providers: [PaymentGuard, FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
