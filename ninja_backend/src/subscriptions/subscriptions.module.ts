import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PaddleWebhookController } from './webhooks/paddle-webhook.controller';
import { SubscriptionActiveGuard } from './guards/subscription-active.guard';
import { PaymentsModule } from '../payments/payments.module';
import { TeamsModule } from '../teams/teams.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PaymentsModule, TeamsModule, AnalyticsModule],
  controllers: [SubscriptionsController, PaddleWebhookController],
  providers: [SubscriptionsService, SubscriptionPlansService, SubscriptionActiveGuard],
  exports: [SubscriptionsService, SubscriptionPlansService, SubscriptionActiveGuard],
})
export class SubscriptionsModule {}

// Note: Stripe webhook controller has been removed as we're using Paddle now
// If you need to support both providers, you can add it back and update the service methods

