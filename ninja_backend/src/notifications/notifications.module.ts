import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}