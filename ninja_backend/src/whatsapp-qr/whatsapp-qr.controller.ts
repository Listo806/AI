import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { SendQrVoiceDto } from './dto/send-qr-voice.dto';
import { ToggleAiDto } from './dto/toggle-ai.dto';
import { normalizeToE164 } from './utils/phone-normalize.util';
import { WhatsAppQrRealtimeService } from './whatsapp-qr-realtime.service';

@ApiTags('whatsapp-qr')
@Controller('whatsapp-qr')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class WhatsAppQrController {
  constructor(
    private readonly sessions: WhatsAppQrSessionService,
    private readonly sockets: BaileysSocketService,
    private readonly redisAuth: BaileysRedisAuthService,
    private readonly realtime: WhatsAppQrRealtimeService,
    private readonly conversations: WhatsAppQrConversationService,
    private readonly messages: WhatsAppQrMessageService,
    private readonly outbound: WhatsAppQrOutboundService,
  ) {}

  @Get('pending-qr')
  @ApiOperation({ summary: 'Get pending QR if any (fallback when socket event missed)' })
  async pendingQr(@CurrentUser() user: any) {
    const qr = this.realtime.getLastQr(user.id);
    return { data: { qr: qr ?? null } };
  }

  @Get('status')
  @ApiOperation({ summary: 'WhatsApp QR connection status (scoped to current user)' })
  async status(@CurrentUser() user: any) {
    const row = await this.sessions.findByUserId(user.id);
    const handle = this.sockets.getHandle(user.id);
    const dbStatus = row?.status ?? 'disconnected';
    const connected =
      dbStatus === 'connected' && handle?.connected === true;
    return {
      data: {
        enabled: this.sockets.isQrEnabled(),
        connected,
        phone: row ? row.phone : null,
        status: dbStatus,
        connected_at: row?.connected_at ?? null,
        updated_at: row?.updated_at ?? null,
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
    const row = await this.sessions.findByUserId(user.id);
    if (row) await this.sessions.setStatus(row.id, 'disconnected');
    await this.redisAuth.clearAuth(user.id);
    await this.sockets.disconnectUser(user.id);
    return { success: true };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List QR conversations for current user only (by user_id)' })
  async listConversations(@CurrentUser() user: any) {
    const data = await this.conversations.listByUserId(user.id);
    return { data };
  }

  @Get('conversations/:contactPhone/messages')
  @ApiOperation({
    summary:
      'Messages for contact (E.164). Pagination: limit (default 50, max 200), before (ISO timestamp — older messages)',
  })
  async listMessages(
    @CurrentUser() user: any,
    @Param('contactPhone') contactPhoneParam: string,
    @Query('limit') limitRaw?: string,
    @Query('before') before?: string,
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
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;
    const data = await this.messages.listByConversationId(conv.id, {
      limit: Number.isFinite(limit) ? limit : 50,
      before: before || null,
    });
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

  @Post('send-voice')
  @ApiOperation({ summary: 'Send voice message (audio/ogg base64) via Baileys' })
  async sendVoice(@CurrentUser() user: any, @Body() dto: SendQrVoiceDto) {
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
    await this.outbound.sendAgentVoice({
      userId: user.id,
      sessionId: conv.session_id,
      conversationId: conv.id,
      leadId: conv.lead_id,
      teamId: conv.team_id,
      contactPhone,
      audioBase64: dto.audioBase64,
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
