import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { StorageModule } from '../integrations/storage/storage.module';

// Insurance Workspace module. Reuses the shared DatabaseService, the CRM
// PaymentGuard, and the shared StorageService for documents; no duplicate
// auth/tenant/storage systems.
@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [InsuranceController],
  providers: [PaymentGuard, InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
