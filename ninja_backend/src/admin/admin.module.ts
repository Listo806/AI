import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminTeamsController } from './admin-teams.controller';
import { AdminTeamsService } from './admin-teams.service';
import { InternalAdminGuard } from './internal-admin.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminListingsController, AdminUsersController, AdminTeamsController],
  providers: [
    AdminListingsService,
    AdminUsersService,
    AdminTeamsService,
    InternalAdminGuard,
  ],
})
export class AdminModule {}
