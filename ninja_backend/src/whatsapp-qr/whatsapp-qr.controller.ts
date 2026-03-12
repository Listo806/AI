import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WhatsAppQrSessionService } from './whatsapp-qr-session.service';
import { BaileysSocketService } from './baileys-socket.service';
import { BaileysRedisAuthService } from './baileys-redis-auth.service';
import { WhatsAppQrConversationService } from './whatsapp-qr-conversation.service';
import { WhatsAppQrMessageService } from './whatsapp-qr-message.service';
import { WhatsAppQrOutboundService } from './whatsapp-qr-outbound.service';
import { SendQrMessageDto } from './dto/send-qr-message.dto';
import { ToggleAiDto } from './dto/toggle-ai.dto';
import { normalizeToE164 } from './utils/phone-normalize.util';

@ApiTags('whatsapp-qr')
@Controller('whatsapp-qr')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class WhatsAppQrController {
  constructor(
    private readonly sessions: WhatsAppQrSessionService,
    private readonly sockets: BaileysSocketService,
    private readonly redisAuth: BaileysRedisAuthService,
    private readonly conversations: WhatsAppQrConversationService,
    private readonly messages: WhatsAppQrMessageService,
    private readonly outbound: WhatsAppQrOutboundService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'WhatsApp QR connection status' })
  async status(@CurrentUser() user: any) {
    const row = await this.sessions.findByUserId(user.id);
    const handle = this.sockets.getHandle(user.id);
    return {
      data: {
        enabled: this.sockets.isQrEnabled(),
        connected: handle ? handle.connected : false,
        phone: row ? row.phone : null,
        status: row ? row.status : 'disconnected',
      },
    };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Start or resume QR connection' })
  async connect(@CurrentUser() user: any) {
    const row = await this.sessions.getOrCreateByUserId(user.id);
    await this.sessions.touchLastQrAt(row.id);
    await this.sockets.ensureSocket(user.id, row.id);
    return {
      success: true,
      data: {
        sessionId: row.id,
        message: this.sockets.isQrEnabled()
          ? 'Session ready; connect Socket.IO namespace /whatsapp-qr with JWT to receive qr/connected/message events'
          : 'Set WHATSAPP_QR_ENABLED=true and REDIS_URL for auth persistence',
      },
    };
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect and clear Redis auth' })
  async disconnect(@CurrentUser() user: any) {
    await this.redisAuth.clearAuth(user.id);
    await this.sockets.disconnectUser(user.id);
    const row = await this.sessions.findByUserId(user.id);
    if (row) await this.sessions.setStatus(row.id, 'disconnected');
    return { success: true };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List QR conversations for current user' })
  async listConversations(@CurrentUser() user: any) {
    const data = await this.conversations.listByUserId(user.id);
    return { data };
  }

  @Get('conversations/:contactPhone/messages')
  @ApiOperation({ summary: 'Messages for contact (E.164 in path, URL-encoded + allowed)' })
  async listMessages(
    @CurrentUser() user: any,
    @Param('contactPhone') contactPhoneParam: string,
  ) {
    const contactPhone = normalizeToE164(
      decodeURIComponent(contactPhoneParam || ''),
    );
    if (!contactPhone) {
      throw new BadRequestException('Invalid contactPhone; use E.164');
    }
    const conv = await this.conversations.findByUserAndPhone(user.id, contactPhone);
    if (!conv) {
      return { data: [] };
    }
    await this.conversations.resetUnread(conv.id);
    const data = await this.messages.listByConversationId(conv.id);
    return { data, conversationId: conv.id };
  }

  @Post('send')
  @ApiOperation({ summary: 'Agent send outbound via Baileys' })
  async send(@CurrentUser() user: any, @Body() dto: SendQrMessageDto) {
    const handle = this.sockets.getHandle(user.id);
    if (!handle?.connected) {
      throw new BadRequestException('WhatsApp QR not connected');
    }
    const contactPhone = normalizeToE164(dto.contactPhone);
    if (!contactPhone) {
      throw new BadRequestException('Invalid contactPhone; use E.164');
    }
    const conv = await this.conversations.findByUserAndPhone(user.id, contactPhone);
    if (!conv) {
      throw new NotFoundException('No conversation for this contact');
    }
    await this.outbound.sendAgentText({
      userId: user.id,
      sessionId: conv.session_id,
      conversationId: conv.id,
      leadId: conv.lead_id,
      teamId: conv.team_id,
      contactPhone,
      text: dto.message.trim(),
    });
    return { success: true };
  }

  @Post('conversations/:contactPhone/toggle-ai')
  @ApiOperation({ summary: 'Toggle AI for conversation' })
  async toggleAi(
    @CurrentUser() user: any,
    @Param('contactPhone') contactPhoneParam: string,
    @Body() dto: ToggleAiDto,
  ) {
    const contactPhone = normalizeToE164(
      decodeURIComponent(contactPhoneParam || ''),
    );
    if (!contactPhone) {
      throw new BadRequestException('Invalid contactPhone');
    }
    const ok = await this.conversations.toggleAi(
      user.id,
      contactPhone,
      dto.aiEnabled,
    );
    if (!ok) {
      throw new NotFoundException('Conversation not found');
    }
    return { success: true, aiEnabled: dto.aiEnabled };
  }
}
