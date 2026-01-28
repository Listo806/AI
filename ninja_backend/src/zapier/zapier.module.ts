import { Module } from '@nestjs/common';
import { ZapierController } from './zapier.controller';
import { ZapierService } from './zapier.service';
import { LeadsModule } from '../leads/leads.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [LeadsModule, DatabaseModule],
  controllers: [ZapierController],
  providers: [ZapierService],
  exports: [ZapierService],
})
export class ZapierModule {}
