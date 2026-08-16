import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { LeadgenController } from './leadgen.controller';
import { LeadgenService } from './leadgen.service';

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [LeadgenController],
  providers: [PaymentGuard, LeadgenService],
  exports: [LeadgenService],
})
export class LeadgenModule {}
