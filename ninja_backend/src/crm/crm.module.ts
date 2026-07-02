import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { ActivityFeedService } from './activity-feed.service';
import { DashboardAggregationService } from './dashboard-aggregation.service';
import { DashboardExtendedService } from './dashboard-extended.service';
import { CrmPropertiesController } from './crm-properties.controller';
import { CrmProjectsController } from './crm-projects.controller';
import { CrmPropertiesService } from './crm-properties.service';
import { CrmProjectsService } from './crm-projects.service';
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { DatabaseModule } from '../database/database.module';
import { LeadsModule } from '../leads/leads.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [DatabaseModule, LeadsModule, SubscriptionsModule],
  controllers: [CrmController, CrmPropertiesController, CrmProjectsController, DealsController, ContactsController],
  providers: [
    CrmService,
    ActivityFeedService,
    DashboardAggregationService,
    DashboardExtendedService,
    CrmPropertiesService,
    CrmProjectsService,
    DealsService,
    ContactsService,
  ],
  exports: [
    CrmService,
    ActivityFeedService,
    DashboardAggregationService,
    DashboardExtendedService,
    CrmPropertiesService,
    CrmProjectsService,
    DealsService,
    ContactsService,
  ],
})
export class CrmModule {}
