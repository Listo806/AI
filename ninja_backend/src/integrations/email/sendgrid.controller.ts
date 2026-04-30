import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SendgridService } from './sendgrid.service';
import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

class SaveEmailConfigDto {
  @IsString()
  @IsNotEmpty()
  sendgrid_api_key: string;

  @IsEmail()
  from_email: string;
}

class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;
}

@Controller('integrations/email')
@UseGuards(JwtAuthGuard)
export class SendgridController {
  constructor(private readonly sendgridService: SendgridService) {}

  private requireTeam(user: any): string {
    if (!user.teamId) {
      throw new ForbiddenException('User must be part of a team to configure email');
    }
    return user.teamId;
  }

  @Post('config')
  async saveConfig(
    @CurrentUser() user: any,
    @Body() dto: SaveEmailConfigDto,
  ) {
    return this.sendgridService.saveConfig(this.requireTeam(user), dto.sendgrid_api_key, dto.from_email);
  }

  @Get('config')
  async getConfig(@CurrentUser() user: any) {
    return this.sendgridService.getConfig(this.requireTeam(user));
  }

  @Post('test')
  async sendTestEmail(@CurrentUser() user: any) {
    return this.sendgridService.sendTestEmail(this.requireTeam(user));
  }

  @Post('send')
  async sendEmail(
    @CurrentUser() user: any,
    @Body() dto: SendEmailDto,
  ) {
    return this.sendgridService.sendEmail(this.requireTeam(user), dto.to, dto.subject, dto.html);
  }
}
