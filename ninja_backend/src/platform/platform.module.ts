import { ListoqasaLifecycleEmailService } from './listoqasa-lifecycle-email.service';
import { EcuadorBankTrialLifecycleService } from './ecuador-bank-trial-lifecycle.service';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { EcuadorBankCheckoutService } from './ecuador-bank-checkout.service';
import { EcuadorBankCheckoutController } from './ecuador-bank-checkout.controller';
import { MarketplacePurchaseService } from './marketplace-purchase.service';
import { Module } from '@nestjs/common';
import { NuveiModule } from '../nuvei/nuvei.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GoogleAdsModule } from '../integrations/google-ads/google-ads.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplacePlansController } from './marketplace-plans.controller';
import { MarketplacePlansService } from './marketplace-plans.service';
import { MarketplaceBankAdminController } from './marketplace-bank-admin.controller';
import { PlatformController } from './platform.controller';
import { PlatformListingsService } from './platform-listings.service';
import { ProductBillingController } from './product-billing.controller';
import { ProductBillingService } from './product-billing.service';

@Module({
  imports: [GoogleAdsModule, PlatformMailModule, DatabaseModule, SubscriptionsModule, NuveiModule, WorkspacesModule],
  controllers: [EcuadorBankCheckoutController, PlatformController, MarketplacePlansController, MarketplaceBankAdminController, ProductBillingController],
  providers: [ListoqasaLifecycleEmailService, EcuadorBankTrialLifecycleService, EcuadorBankCheckoutService, PlatformListingsService, MarketplacePlansService, MarketplacePurchaseService, ProductBillingService],
  exports: [MarketplacePlansService],
})
export class PlatformModule {}
