import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionsController } from './subscriptions.controller';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';
import { SubscriptionActiveGuard } from './guards/subscription-active.guard';
import { PaymentsModule } from '../payments/payments.module';
import { TeamsModule } from '../teams/teams.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PaymentsModule, TeamsModule, AnalyticsModule],
  controllers: [SubscriptionsController, StripeWebhookController],
  providers: [SubscriptionsService, SubscriptionPlansService, SubscriptionActiveGuard],
  exports: [SubscriptionsService, SubscriptionPlansService, SubscriptionActiveGuard],
})
export class SubscriptionsModule {}

