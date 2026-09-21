import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('me')
  getMine(@CurrentUser() user: any) {
    return this.settings.get(user.id, user.teamId);
  }

  @Patch('me/notifications')
  updateNotifications(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settings.updateNotifications(user.id, body);
  }

  @Patch('me/preferences')
  updatePreferences(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settings.updatePreferences(user.id, user.teamId, body);
  }
}
