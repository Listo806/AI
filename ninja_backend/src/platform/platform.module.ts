import { Module } from '@nestjs/common';
import { NuveiModule } from '../nuvei/nuvei.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplacePlansController } from './marketplace-plans.controller';
import { MarketplacePlansService } from './marketplace-plans.service';
import { MarketplaceBankAdminController } from './marketplace-bank-admin.controller';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule, NuveiModule],
  controllers: [PlatformController, MarketplacePlansController, MarketplaceBankAdminController],
  providers: [PlatformListingsService, MarketplacePlansService],
  exports: [MarketplacePlansService],
})
export class PlatformModule {}
