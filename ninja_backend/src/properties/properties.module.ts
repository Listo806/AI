import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyMatchingService } from './property-matching.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../integrations/storage/storage.module';
import { WebhooksModule } from '../integrations/webhooks/webhooks.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule, SubscriptionsModule, StorageModule, WebhooksModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyMatchingService],
  exports: [PropertiesService, PropertyMatchingService],
})
export class PropertiesModule {}

