import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminTeamsController } from './admin-teams.controller';
import { AdminTeamsService } from './admin-teams.service';
import { InternalAdminGuard } from './internal-admin.guard';
import { AdminBillingCalendarController } from './admin-billing-calendar.controller';
import { AdminBillingCalendarService } from './admin-billing-calendar.service';

@Module({
  imports: [DatabaseModule, PaymentsModule],
  controllers: [
    AdminListingsController,
    AdminUsersController,
    AdminTeamsController,
    AdminBillingCalendarController,
  ],
  providers: [
    AdminListingsService,
    AdminUsersService,
    AdminTeamsService,
    InternalAdminGuard,
    AdminBillingCalendarService,
  ],
})
export class AdminModule {}
