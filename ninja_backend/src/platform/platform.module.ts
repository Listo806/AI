import { Module } from '@nestjs/common';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { MarketplaceBillingNotificationsService } from './marketplace-billing-notifications.service';
import { NuveiModule } from '../nuvei/nuvei.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplacePlansController } from './marketplace-plans.controller';
import { MarketplacePlansService } from './marketplace-plans.service';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule, NuveiModule, PlatformMailModule],
  controllers: [PlatformController, MarketplacePlansController],
  providers: [PlatformListingsService, MarketplacePlansService, MarketplaceBillingNotificationsService],
  exports: [MarketplacePlansService],
})
export class PlatformModule {}
