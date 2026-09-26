import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ContactService } from './contact.service';

// Public (no auth) endpoint behind the website contact form.
// POST /api/contact
@ApiTags('public-contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Public website contact form: stores the message and emails the support inbox' })
  @ApiResponse({ status: 201, description: 'Message received (stored and emailed)' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many messages from this address' })
  @ApiResponse({ status: 502, description: 'Stored, but the email provider rejected the message' })
  submit(@Body() body: any, @Req() req: Request) {
    // `trust proxy` is set in main.ts, so req.ip is the real client address on
    // Render (not the spoofable left-most X-Forwarded-For entry).
    const ip = req.ip || req.socket?.remoteAddress || '';
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
    return this.contact.submit(body, ip, userAgent);
  }
}
