import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

type FreeReviewPayload = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  websiteUrl: string;
  platform?: string;
  improvements: string[];
  limitations: string;
  goal: string;
  systems?: string;
  contactMethod?: string;
  authorized: boolean;
};

@Injectable()
export class WebSolutionsReviewService {
  private readonly logger = new Logger(WebSolutionsReviewService.name);
  private readonly recipient = 'support@cortexaaicrm.com';

  constructor(private readonly config: ConfigService) {}

  private esc(value: unknown) {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async submit(body: FreeReviewPayload) {
    const required = ['fullName','businessName','email','phone','websiteUrl','limitations','goal'] as const;
    for (const key of required) {
      if (!String(body?.[key] ?? '').trim()) throw new BadRequestException(`${key} is required`);
    }
    if (!Array.isArray(body?.improvements) || !body.improvements.length) {
      throw new BadRequestException('Please select at least one improvement.');
    }
    if (body?.authorized !== true) throw new BadRequestException('Authorization is required.');
    if (!/^\S+@\S+\.\S+$/.test(body.email.trim())) throw new BadRequestException('A valid email is required.');

    const apiKey = this.config.get('SENDGRID_API_KEY');
    const fromEmail =
      this.config.get('SENDGRID_FROM_EMAIL') ||
      this.config.get('PLATFORM_FROM_EMAIL') ||
      'support@cortexaaicrm.com';

    if (!apiKey) {
      this.logger.error('SENDGRID_API_KEY is missing');
      throw new InternalServerErrorException('Email service is not configured.');
    }

    const html = `
      <h2>New Free Website Review Request</h2>
      <table cellpadding="7" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px">
        <tr><td><b>Full name</b></td><td>${this.esc(body.fullName)}</td></tr>
        <tr><td><b>Business name</b></td><td>${this.esc(body.businessName)}</td></tr>
        <tr><td><b>Business email</b></td><td>${this.esc(body.email)}</td></tr>
        <tr><td><b>Phone</b></td><td>${this.esc(body.phone)}</td></tr>
        <tr><td><b>Website URL</b></td><td>${this.esc(body.websiteUrl)}</td></tr>
        <tr><td><b>Platform</b></td><td>${this.esc(body.platform || 'Not specified')}</td></tr>
        <tr><td><b>Preferred contact</b></td><td>${this.esc(body.contactMethod || 'Email')}</td></tr>
        <tr><td><b>Improvements</b></td><td>${body.improvements.map(x=>this.esc(x)).join('<br>')}</td></tr>
        <tr><td><b>Current limitations</b></td><td>${this.esc(body.limitations)}</td></tr>
        <tr><td><b>Desired result</b></td><td>${this.esc(body.goal)}</td></tr>
        <tr><td><b>Systems/tools to connect</b></td><td>${this.esc(body.systems || 'None specified')}</td></tr>
      </table>`;

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: this.recipient }] }],
        from: { email: fromEmail, name: 'Cortexa Web Solutions' },
        reply_to: { email: body.email.trim(), name: body.fullName.trim() },
        subject: `Free Website Review — ${body.businessName.trim()}`,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`SendGrid review email failed ${response.status}: ${detail}`);
      throw new InternalServerErrorException('Unable to send the review request.');
    }

    return { success: true, sentTo: this.recipient };
  }
}