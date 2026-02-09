import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PlatformController],
  providers: [PlatformListingsService],
})
export class PlatformModule {}
