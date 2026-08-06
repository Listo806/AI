import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PlatformMailerService } from './platform-mailer.service';

// 1x1 transparent GIF used as the open-tracking pixel.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

// Public open/click tracking for platform emails. No auth: these URLs are opened
// by mail clients and recipients. Open records via an invisible pixel; click
// records then 302-redirects to the original destination.
@ApiTags('email')
@ApiExcludeController()
@Controller('email/track')
export class EmailTrackController {
  constructor(private readonly mailer: PlatformMailerService) {}

  @Get('open/:token')
  async open(@Param('token') token: string, @Res() res: Response) {
    const t = String(token || '').replace(/\.(png|gif)$/i, '');
    await this.mailer.recordOpen(t);
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    });
    res.end(PIXEL);
  }

  @Get('click/:token')
  async click(
    @Param('token') token: string,
    @Query('u') u: string,
    @Res() res: Response,
  ) {
    await this.mailer.recordClick(String(token || ''));
    let dest = this.mailer.appUrl();
    try {
      const decoded = decodeURIComponent(u || '');
      if (/^https?:\/\//i.test(decoded)) dest = decoded;
    } catch (_e) {
      /* keep the safe default */
    }
    res.redirect(302, dest);
  }
}
