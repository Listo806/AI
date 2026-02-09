import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { VaController } from './va.controller';
import { VaListingsService } from './va-listings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VaController],
  providers: [VaListingsService],
})
export class VaModule {}
