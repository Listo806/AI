import { MarketplacePurchaseService } from './marketplace-purchase.service';
import { Module } from '@nestjs/common';
import { NuveiModule } from '../nuvei/nuvei.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplacePlansController } from './marketplace-plans.controller';
import { MarketplacePlansService } from './marketplace-plans.service';
import { MarketplaceBankAdminController } from './marketplace-bank-admin.controller';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';
import { ProductBillingController } from './product-billing.controller';
import { ProductBillingService } from './product-billing.service';

@Module({
  imports: [DatabaseModule, SubscriptionsModule, NuveiModule, WorkspacesModule],
  controllers: [PlatformController, MarketplacePlansController, MarketplaceBankAdminController, ProductBillingController],
  providers: [PlatformListingsService, MarketplacePlansService, MarketplacePurchaseService, ProductBillingService],
  exports: [MarketplacePlansService],
})
export class PlatformModule {}
