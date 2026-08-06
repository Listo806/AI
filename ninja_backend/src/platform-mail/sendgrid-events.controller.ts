import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { PlatformMailerService } from './platform-mailer.service';

// Public SendGrid Event Webhook endpoint. SendGrid POSTs a JSON array of events
// (delivered / open / click / bounce / dropped), each carrying our custom_args
// token, which maps the event back to the email_log row. Configure this URL in
// SendGrid: Settings -> Mail Settings -> Event Webhook ->
//   https://backend.cortexaaicrm.com/api/email/sendgrid/events
@ApiTags('email')
@ApiExcludeController()
@Controller('email/sendgrid')
export class SendgridEventsController {
  constructor(private readonly mailer: PlatformMailerService) {}

  @Post('events')
  @HttpCode(200)
  async events(@Body() body: any) {
    const events = Array.isArray(body) ? body : body?.events || [];
    await this.mailer.recordSendgridEvents(events);
    return { received: true };
  }
}
