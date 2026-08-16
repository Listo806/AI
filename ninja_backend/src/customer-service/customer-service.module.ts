import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CustomerServiceController } from './customer-service.controller';
import { CustomerServiceService } from './customer-service.service';

// Customer Service Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, and the WorkspaceLockGuard (from WorkspacesModule) to enforce the
// $97 add-on when its lock is on; no duplicate auth/tenant systems. Customers reuse
// CRM contacts and agents reuse team users.
@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [CustomerServiceController],
  providers: [PaymentGuard, CustomerServiceService],
  exports: [CustomerServiceService],
})
export class CustomerServiceModule {}
