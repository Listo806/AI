import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { DatabaseModule } from '../database/database.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [DatabaseModule, LeadsModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
