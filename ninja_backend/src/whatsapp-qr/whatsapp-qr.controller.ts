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
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CrmAccessGuard } from "../subscriptions/guards/crm-access.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { WhatsAppQrSessionService } from "./whatsapp-qr-session.service";
import { BaileysSocketService } from "./baileys-socket.service";
import { BaileysRedisAuthService } from "./baileys-redis-auth.service";
import { WhatsAppQrConversationService } from "./whatsapp-qr-conversation.service";
import { WhatsAppQrMessageService } from "./whatsapp-qr-message.service";
import { WhatsAppQrOutboundService } from "./whatsapp-qr-outbound.service";
import { SendQrMessageDto } from "./dto/send-qr-message.dto";
import { SendQrVoiceDto } from "./dto/send-qr-voice.dto";
import { ToggleAiDto } from "./dto/toggle-ai.dto";
import { normalizeToE164 } from "./utils/phone-normalize.util";
import { WhatsAppQrRealtimeService } from "./whatsapp-qr-realtime.service";

@ApiTags("whatsapp-qr")
@Controller("whatsapp-qr")
@UseGuards(JwtAuthGuard, CrmAccessGuard)
@ApiBearerAuth("JWT-auth")
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

  private async resolveConnectedHandle(conversation: {
    user_id: string;
    session_id: string;
  }) {
    let handle = this.sockets.getHandle(conversation.user_id);

    if (handle?.connected) {
      return handle;
    }

    handle = await this.sockets.ensureSocket(
      conversation.user_id,
      conversation.session_id,
    );

    if (handle?.connected) {
      return handle;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      handle = this.sockets.getHandle(conversation.user_id);
      if (handle?.connected) {
        return handle;
      }
    }

    return handle;
  }
  @Get("pending-qr")
  @ApiOperation({
    summary: "Get pending QR if any (fallback when socket event missed)",
  })
  async pendingQr(@CurrentUser() user: any) {
    const qr = this.realtime.getLastQr(user.id);
    return { data: { qr: qr ?? null } };
  }

  @Get("status")
  @ApiOperation({
    summary: "WhatsApp QR connection status (scoped to current user)",
  })
  async status(@CurrentUser() user: any) {
    const row = await this.sessions.findByUserId(user.id);
    const handle = this.sockets.getHandle(user.id);
    const dbStatus = row?.status ?? "disconnected";
    const connected = dbStatus === "connected" && handle?.connected === true;
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

  @Post("connect")
  @ApiOperation({ summary: "Start or resume QR connection" })
  async connect(@CurrentUser() user: any) {
    const row = await this.sessions.getOrCreateByUserId(user.id);
    await this.sessions.touchLastQrAt(row.id);
    await this.sockets.ensureSocket(user.id, row.id);
    return {
      success: true,
      data: {
        sessionId: row.id,
        message: this.sockets.isQrEnabled()
          ? "Session ready; connect Socket.IO namespace /whatsapp-qr with JWT to receive qr/connected/message events"
          : "Set WHATSAPP_QR_ENABLED=true and REDIS_URL for auth persistence",
      },
    };
  }

  @Post("disconnect")
  @ApiOperation({ summary: "Disconnect and clear Redis auth" })
  async disconnect(@CurrentUser() user: any) {
    const row = await this.sessions.findByUserId(user.id);
    if (row) await this.sessions.setStatus(row.id, "disconnected");
    await this.redisAuth.clearAuth(user.id);
    await this.sockets.disconnectUser(user.id);
    return { success: true };
  }

  @Get("timeline/:phone")
  async getTimeline(
    @CurrentUser() user: any,
    @Param("phone") phone: string,
    @Query("page") pageRaw?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const contactPhone = normalizeToE164(decodeURIComponent(phone || ""));

    if (!contactPhone) {
      return {
        data: {
          items: [],
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        },
      };
    }

    const conv = await this.conversations.findScopedByContactPhone(
      user,
      contactPhone,
    );

    if (!conv) {
      return {
        data: {
          items: [],
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        },
      };
    }

    const page = pageRaw ? parseInt(pageRaw, 10) : 1;
    const limit = limitRaw ? parseInt(limitRaw, 10) : 20;

    const data = await this.conversations.getConversationTimeline(
      conv.id,
      Number.isFinite(page) ? page : 1,
      Number.isFinite(limit) ? limit : 20,
    );

    return { data };
  }

  @Get("conversations")
  @ApiOperation({
    summary:
      "List QR conversations (role-scoped): admin = site-wide, owner = all their teams, agent = own team. No message bodies.",
  })
  async listConversations(@CurrentUser() user: any) {
    const data = await this.conversations.listScopedForUser(user);
    return { data };
  }

  @Get("conversations/:contactPhone/messages")
  @ApiOperation({
    summary:
      "Messages for contact (E.164). Pagination: limit (default 50, max 200), before (ISO timestamp — older messages)",
  })
  async listMessages(
    @CurrentUser() user: any,
    @Param("contactPhone") contactPhoneParam: string,
    @Query("limit") limitRaw?: string,
    @Query("before") before?: string,
  ) {
    const contactPhone = normalizeToE164(
      decodeURIComponent(contactPhoneParam || ""),
    );
    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone; use E.164");
    }
    const conv = await this.conversations.findScopedByContactPhone(
      user,
      contactPhone,
    );
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

  @Post("send")
  @ApiOperation({
    summary: "Agent send outbound via Baileys",
  })
  async send(
    @CurrentUser()
    user: any,
    @Body()
    dto: SendQrMessageDto,
  ) {
    const contactPhone = normalizeToE164(dto.contactPhone);
    const message = String(dto.message || "").trim();
    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone; use E.164");
    }
    if (!message) {
      throw new BadRequestException("Message is required");
    }
    const conv = await this.conversations.findScopedByContactPhone(
      user,
      contactPhone,
    );
    if (!conv) {
      throw new NotFoundException("No conversation for this contact");
    }
    const handle = await this.resolveConnectedHandle(conv);
    if (!handle?.connected) {
      const session = await this.sessions.findByUserId(conv.user_id);
      throw new BadRequestException({
        code: "WHATSAPP_SESSION_NOT_CONNECTED",
        message:
          session?.status === "connected"
            ? "WhatsApp is reconnecting. Please try again in a few seconds."
            : "The WhatsApp account for this conversation is disconnected. Reconnect it from AI Agent Setup.",

        conversationId: conv.id,
        sessionId: conv.session_id,
        sessionStatus: session?.status || "unknown",
      });
    }

    await this.outbound.sendAgentText({
      userId: conv.user_id,
      sessionId: conv.session_id,
      conversationId: conv.id,
      leadId: conv.lead_id,
      teamId: conv.team_id,
      contactPhone,
      text: message,
    });

    return {
      success: true,
      data: {
        conversationId: conv.id,
        contactPhone,
        sent: true,
      },
    };
  }

  @Post("send-voice")
  @ApiOperation({
    summary: "Send voice message (audio/ogg base64) via Baileys",
  })
  async sendVoice(@CurrentUser() user: any, @Body() dto: SendQrVoiceDto) {
    const contactPhone = normalizeToE164(dto.contactPhone);
    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone; use E.164");
    }
    const conv = await this.conversations.findScopedByContactPhone(
      user,
      contactPhone,
    );
    if (!conv) {
      throw new NotFoundException("No conversation for this contact");
    }
    const handle = await this.resolveConnectedHandle(conv);
    if (!handle?.connected) {
      throw new BadRequestException(
        "WhatsApp QR session for this conversation is not connected",
      );
    }
    await this.outbound.sendAgentVoice({
      userId: conv.user_id,
      sessionId: conv.session_id,
      conversationId: conv.id,
      leadId: conv.lead_id,
      teamId: conv.team_id,
      contactPhone,
      audioBase64: dto.audioBase64,
    });
    return { success: true };
  }

  @Post("conversations/:contactPhone/toggle-ai")
  @ApiOperation({ summary: "Toggle AI for conversation" })
  async toggleAi(
    @CurrentUser() user: any,
    @Param("contactPhone") contactPhoneParam: string,
    @Body() dto: ToggleAiDto,
  ) {
    const contactPhone = normalizeToE164(
      decodeURIComponent(contactPhoneParam || ""),
    );
    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone");
    }
    const conv = await this.conversations.findScopedByContactPhone(
      user,
      contactPhone,
    );
    if (!conv) {
      throw new NotFoundException("Conversation not found");
    }
    const ok = await this.conversations.setAiEnabledByConversationId(
      conv.id,
      dto.aiEnabled,
    );
    if (!ok) {
      throw new NotFoundException("Conversation not found");
    }
    return { success: true, aiEnabled: dto.aiEnabled };
  }

  @Get("dashboard")
  @ApiOperation({ summary: "WhatsApp dashboard overview" })
  async dashboard(@CurrentUser() user: any) {
    return this.conversations.getDashboardForUser(user);
  }

  @Get("conversations/:contactPhone/intelligence")
  @ApiOperation({ summary: "AI intelligence for WhatsApp QR conversation" })
  async conversationIntelligence(
    @CurrentUser() user: any,
    @Param("contactPhone") contactPhoneParam: string,
  ) {
    const contactPhone = normalizeToE164(
      decodeURIComponent(contactPhoneParam || ""),
    );

    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone");
    }

    return this.conversations.getConversationIntelligence(user, contactPhone);
  }

  @Post("ai-assist/reply")
  @ApiOperation({ summary: "Generate AI assisted WhatsApp reply" })
  async aiAssistReply(
    @CurrentUser() user: any,
    @Body() body: { contactPhone?: string },
  ) {
    const contactPhone = normalizeToE164(body.contactPhone);

    if (!contactPhone) {
      throw new BadRequestException("Invalid contactPhone");
    }

    const data = await this.conversations.generateAiAssistReply(
      user,
      contactPhone,
    );

    return { data };
  }
}
