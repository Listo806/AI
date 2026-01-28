import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsapp: TwilioWhatsAppService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Req() req: Request, @Res() res: Response) {
    const payload = (req.body || {}) as Record<string, string>;
    const twiml = await this.whatsapp.handleInbound(payload);
    res.set('Content-Type', 'text/xml');
    return res.send(twiml);
  }

  @Post('status-callback')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async statusCallback(@Req() req: Request, @Res() res: Response) {
    const payload = (req.body || {}) as Record<string, string>;
    const messageSid = payload.MessageSid;
    const messageStatus = payload.MessageStatus;
    if (messageSid) await this.whatsapp.handleStatusCallback(messageSid, messageStatus || '');
    return res.status(200).end();
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, CrmAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send WhatsApp message to a lead' })
  @ApiBody({ type: SendWhatsAppDto })
  @ApiResponse({ status: 200, description: 'Message sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'CRM access required' })
  async send(@Body() dto: SendWhatsAppDto, @CurrentUser() user: any) {
    const result = await this.whatsapp.sendForLead(
      { leadId: dto.leadId, message: dto.message },
      user.id,
      user.teamId,
    );
    return { success: true, data: result };
  }
}
