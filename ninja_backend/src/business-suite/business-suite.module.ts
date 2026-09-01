import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BusinessSuiteController } from './business-suite.controller';
import { BusinessSuiteService } from './business-suite.service';

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [BusinessSuiteController],
  providers: [PaymentGuard, BusinessSuiteService],
  exports: [BusinessSuiteService],
})
export class BusinessSuiteModule {}
