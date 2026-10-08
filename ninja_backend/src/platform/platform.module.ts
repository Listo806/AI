import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule],
  controllers: [PlatformController],
  providers: [PlatformListingsService],
})
export class PlatformModule {}
