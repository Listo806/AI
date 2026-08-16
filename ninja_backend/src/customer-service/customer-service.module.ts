import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { StorageModule } from '../integrations/storage/storage.module';
import { CustomerServiceController } from './customer-service.controller';
import { CustomerServiceService } from './customer-service.service';

// Customer Service Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, the shared StorageService for private ticket attachments, and the
// WorkspaceLockGuard (from WorkspacesModule) to enforce the $97 add-on when its lock
// is on; no duplicate auth/tenant/storage systems. Customers reuse CRM contacts and
// agents reuse team users.
@Module({
  imports: [DatabaseModule, WorkspacesModule, StorageModule],
  controllers: [CustomerServiceController],
  providers: [PaymentGuard, CustomerServiceService],
  exports: [CustomerServiceService],
})
export class CustomerServiceModule {}
