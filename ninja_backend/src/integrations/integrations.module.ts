import { Module } from "@nestjs/common";
import { MapboxModule } from "./mapbox/mapbox.module";
import { StorageModule } from "./storage/storage.module";
import { WhatsAppModule } from "./whatsapp/whatsapp.module";
import { AiAssistantModule } from "./ai/ai-assistant.module";
import { PushNotificationModule } from "./notifications/push-notification.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { SendgridModule } from "./email/sendgrid.module";
import { AppsIntegrationsModule } from "./apps-integrations/apps-integrations.module";
import { ZapierModule } from "./zapier/zapier.module";
import { GoogleCalendarModule } from "./google-calendar/google-calendar.module";
import { GoogleDriveModule } from "./google-drive/google-drive.module";
import { InstagramModule } from "./instagram/instagram.module";
import { MetaWebhookController } from "./instagram/meta-webhook.controller";
import { CrmImportModule } from "./crm-import/crm-import.module";
import { CsvLeadsModule } from "./csv-leads/csv-leads.module";
import { PropertyFeedModule } from "./property-feed/property-feed.module";

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
    ZapierModule,
    GoogleCalendarModule,
    GoogleDriveModule,
    InstagramModule,
    CrmImportModule,
    CsvLeadsModule,
    PropertyFeedModule,
  ],
  controllers: [MetaWebhookController],
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
    ZapierModule,
    GoogleCalendarModule,
    GoogleDriveModule,
    InstagramModule,
    CrmImportModule,
    CsvLeadsModule,
    PropertyFeedModule,
  ],
})
export class IntegrationsModule {}
