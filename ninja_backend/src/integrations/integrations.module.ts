import { Module } from '@nestjs/common';
import { MapboxModule } from './mapbox/mapbox.module';
import { StorageModule } from './storage/storage.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AiAssistantModule } from './ai/ai-assistant.module';
import { PushNotificationModule } from './notifications/push-notification.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SendgridModule } from './email/sendgrid.module';

@Module({
  imports: [
    MapboxModule,
    StorageModule,
    WhatsAppModule,
    AiAssistantModule,
    PushNotificationModule,
    WebhooksModule,
    SendgridModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    MapboxModule,
    StorageModule,
    WhatsAppModule,
    AiAssistantModule,
    PushNotificationModule,
    WebhooksModule,
    SendgridModule,
  ],
})
export class IntegrationsModule {}

