import { Module } from '@nestjs/common';
import { MapboxModule } from './mapbox/mapbox.module';
import { StorageModule } from './storage/storage.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AiAssistantModule } from './ai/ai-assistant.module';
import { PushNotificationModule } from './notifications/push-notification.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SendgridModule } from './email/sendgrid.module';
import { AppsIntegrationsModule } from './apps-integrations/apps-integrations.module';

@Module({
  imports: [
    MapboxModule,
    StorageModule,
    WhatsAppModule,
    AiAssistantModule,
    PushNotificationModule,
    WebhooksModule,
    SendgridModule,
    AppsIntegrationsModule,
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
    AppsIntegrationsModule,
  ],
})
export class IntegrationsModule {}

