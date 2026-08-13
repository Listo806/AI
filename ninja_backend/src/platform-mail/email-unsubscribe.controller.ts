import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PlatformMailerService } from './platform-mailer.service';

// Public email unsubscribe endpoint (the onboarding footer link). Opts the user
// out of marketing/onboarding mail and cancels their remaining queued sequence.
// Token-only: no login, and the id is never exposed.
@ApiTags('email')
@ApiExcludeController()
@Controller('email')
export class EmailUnsubscribeController {
  constructor(private readonly mailer: PlatformMailerService) {}

  @Get('unsubscribe')
  async unsubscribe(@Query('token') token: string, @Res() res: Response) {
    const ok = await this.mailer.unsubscribeByToken(String(token || ''));
    const msg = ok
      ? 'You have been unsubscribed. You will no longer receive Cortexa onboarding emails.'
      : 'This unsubscribe link is invalid or has already been used.';
    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head>` +
        `<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:40px 16px;color:#0f172a">` +
        `<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;text-align:center">` +
        `<div style="font-size:20px;font-weight:700;color:#2563eb;margin-bottom:12px">Cortexa</div>` +
        `<p style="font-size:15px;line-height:1.6">${msg}</p>` +
        `</div></body></html>`,
    );
  }
}
