import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { LeadsModule } from './leads/leads.module';
import { PropertiesModule } from './properties/properties.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HelpCenterModule } from './help-center/help-center.module';
import { CrmModule } from './crm/crm.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { ListingsModule } from './listings/listings.module';
import { ZapierModule } from './zapier/zapier.module';
import { MessagingModule } from './messaging/messaging.module';
import { AiCenterModule } from './ai-center/ai-center.module';
import { PlatformModule } from './platform/platform.module';
import { VaModule } from './va/va.module';
import { AdminModule } from './admin/admin.module';
import { WhatsAppQrModule } from './whatsapp-qr/whatsapp-qr.module';
import { SiteAssistModule } from './site-assist/site-assist.module';
import { VacationRentalsModule } from './vacation-rentals/vacation-rentals.module';
import { TrialModule } from './trial/trial.module';
import { ScheduleModule } from "@nestjs/schedule";
import { PipelineModule } from "./pipeline/pipeline.module";
import { CalendarModule } from "./calendar/calendar.module";
import { PlatformMailModule } from "./platform-mail/platform-mail.module";
import { PlansModule } from "./plans/plans.module";
import { InsuranceModule } from "./insurance/insurance.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { SalesModule } from "./sales/sales.module";
import { FinancialModule } from "./financial/financial.module";
import { CustomerServiceModule } from "./customer-service/customer-service.module";
import { EcommerceWorkspaceModule } from './ecommerce/ecommerce-workspace.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PlansModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    LeadsModule,
    PropertiesModule,
    SubscriptionsModule,
    PaymentsModule,
    IntegrationsModule,
    AnalyticsModule,
    HelpCenterModule,
    CrmModule,
    IntelligenceModule,
    ListingsModule,
    ZapierModule,
    MessagingModule,
    AiCenterModule,
    PlatformModule,
    VaModule,
    AdminModule,
    WhatsAppQrModule,
    SiteAssistModule,
    VacationRentalsModule,
    TrialModule,
    ScheduleModule.forRoot(),
    PipelineModule,
    CalendarModule,
    PlatformMailModule,
    InsuranceModule,
    WorkspacesModule,
    EcommerceWorkspaceModule,
    SalesModule,
    FinancialModule,
    CustomerServiceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

