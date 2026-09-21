import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Canonical endpoint used by the current frontend.
  @Get('me')
  @ApiOperation({ summary: 'Get settings for the authenticated user' })
  getMySettings(@CurrentUser() user: any) {
    return this.settingsService.get(user.id, user.teamId ?? null);
  }

  // Backward-compatible endpoint for older clients.
  @Get()
  getSettings(@CurrentUser() user: any) {
    return this.settingsService.get(user.id, user.teamId ?? null);
  }

  @Patch('me/notifications')
  @ApiOperation({ summary: 'Update notification preferences for the authenticated user' })
  patchMyNotifications(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settingsService.updateNotifications(user.id, body);
  }

  @Put('notifications')
  updateNotifications(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settingsService.updateNotifications(user.id, body);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update preferences for the authenticated user' })
  patchMyPreferences(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settingsService.updatePreferences(user.id, user.teamId ?? null, body);
  }

  @Put('preferences')
  updatePreferences(@CurrentUser() user: any, @Body() body: Record<string, unknown>) {
    return this.settingsService.updatePreferences(user.id, user.teamId ?? null, body);
  }
}
