import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';

// Insurance Workspace module. Reuses the shared DatabaseService and the CRM
// PaymentGuard; no duplicate auth/tenant systems.
@Module({
  imports: [DatabaseModule],
  controllers: [InsuranceController],
  providers: [PaymentGuard, InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
