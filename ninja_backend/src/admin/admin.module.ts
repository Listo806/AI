import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminListingsController, AdminUsersController],
  providers: [AdminListingsService, AdminUsersService],
})
export class AdminModule {}
