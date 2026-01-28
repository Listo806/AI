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

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}

