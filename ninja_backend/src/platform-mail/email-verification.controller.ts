import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { PlatformMailerService } from './platform-mailer.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(private readonly mailer: PlatformMailerService) {}

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  status(@CurrentUser() user: any) {
    return this.mailer.getEmailVerificationStatus(user.id);
  }

  @Post('resend')
  @UseGuards(AuthGuard('jwt'))
  resend(@CurrentUser() user: any) {
    return this.mailer.resendPaidVerification(user.id);
  }

  @Patch('email')
  @UseGuards(AuthGuard('jwt'))
  changeEmail(@CurrentUser() user: any, @Body() body: { email?: string }) {
    return this.mailer.changePendingVerificationEmail(user.id, body?.email || '');
  }

  // Public by design: possession of the random single-use token is the credential.
  @Post('verify')
  verify(@Body() body: { token?: string }) {
    return this.mailer.verifyPaidEmailToken(body?.token || '');
  }
}
