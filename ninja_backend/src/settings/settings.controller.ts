import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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

  @Get()
  @ApiOperation({ summary: 'Get settings for the authenticated user' })
  getSettings(@CurrentUser() user: any) {
    return this.settingsService.get(user.id, user.teamId ?? null);
  }

  @Put('notifications')
  @ApiOperation({ summary: 'Update notification preferences for the authenticated user' })
  updateNotifications(
    @CurrentUser() user: any,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsService.updateNotifications(user.id, body);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update preferences for the authenticated user' })
  updatePreferences(
    @CurrentUser() user: any,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsService.updatePreferences(
      user.id,
      user.teamId ?? null,
      body,
    );
  }
}
