import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrmAccessGuard } from '../subscriptions/guards/crm-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WhatsAppQrSessionService } from './whatsapp-qr-session.service';
import { BaileysSocketService } from './baileys-socket.service';
import { BaileysRedisAuthService } from './baileys-redis-auth.service';
import { SendQrMessageDto } from './dto/send-qr-message.dto';
import { ToggleAiDto } from './dto/toggle-ai.dto';

@ApiTags('whatsapp-qr')
@Controller('whatsapp-qr')
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth('JWT-auth')
export class WhatsAppQrController {
  constructor(
    private readonly sessions: WhatsAppQrSessionService,
    private readonly sockets: BaileysSocketService,
    private readonly redisAuth: BaileysRedisAuthService,
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
          ? 'Session ready; connect Socket.IO namespace /whatsapp-qr with JWT to receive qr/connected events'
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
  @ApiOperation({ summary: 'List QR conversations' })
  async conversations() {
    return { data: [] };
  }

  @Get('conversations/:contactPhone/messages')
  @ApiOperation({ summary: 'Messages for contact' })
  async messages(@Param('contactPhone') _contactPhone: string) {
    return { data: [] };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send outbound' })
  async send(@Body() _dto: SendQrMessageDto) {
    return { success: false, message: 'Outbound not wired yet' };
  }

  @Post('conversations/:contactPhone/toggle-ai')
  @ApiOperation({ summary: 'Toggle AI' })
  async toggleAi(@Param('contactPhone') _contactPhone: string, @Body() _dto: ToggleAiDto) {
    return { success: false, message: 'Toggle-ai not wired yet' };
  }
}
