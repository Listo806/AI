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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
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

  private async resolveConnectedHandle(
    user: {
      id: string;
      teamId?: string | null;
      team_id?: string | null;
    },
    conversation: {
      id: string;
      user_id: string;
      session_id: string;
      team_id?: string | null;
    },
  ) {
    const teamId = user.teamId || user.team_id || conversation.team_id || null;
    const originalHasAuth = await this.sockets.hasStoredAuth(
      conversation.user_id,
    );

    console.log("[WA SEND] original auth state", {
      userId: conversation.user_id,

      hasStoredAuth: originalHasAuth,
    });
    console.log("[WA SEND] resolve connection", {
      requestUserId: user.id,
      teamId,
      conversationId: conversation.id,
      conversationUserId: conversation.user_id,
      conversationSessionId: conversation.session_id,
    });

    let handle = this.sockets.getHandle(conversation.user_id);

    console.log("[WA SEND] existing handle", {
      exists: Boolean(handle),
      connected: handle?.connected === true,
    });

    if (handle?.connected) {
      return {
        handle,
        conversation,
        session: null,
        reason: "existing_handle",
      };
    }

    if (originalHasAuth) {
      try {
        handle = await this.sockets.ensureSocket(
          conversation.user_id,
          conversation.session_id,
        );
      } catch (error) {
        console.error("[WA SEND] restore original socket failed", error);
      }
    } else {
      console.warn("[WA SEND] original session has no stored credentials", {
        userId: conversation.user_id,
        sessionId: conversation.session_id,
      });
    }

    if (!handle?.connected) {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));

        handle = this.sockets.getHandle(conversation.user_id);

        if (handle?.connected) {
          break;
        }
      }
    }

    console.log("[WA SEND] original restored handle", {
      exists: Boolean(handle),
      connected: handle?.connected === true,
    });

    if (handle?.connected) {
      return {
        handle,
        conversation,
        session: null,
        reason: "original_session_restored",
      };
    }

    const connectedSession = await this.sessions.findBestConnectedSession({
      conversationSessionId: conversation.session_id,

      conversationUserId: conversation.user_id,

      requestUserId: user.id,

      teamId,
    });

    console.log(
      "[WA SEND] best connected DB session",
      connectedSession
        ? {
            id: connectedSession.id,
            userId: connectedSession.user_id,
            status: connectedSession.status,
            phone: connectedSession.phone,
          }
        : null,
    );

    if (!connectedSession) {
      return {
        handle: null,
        conversation,
        session: null,
        reason: originalHasAuth
          ? "socket_reconnect_failed"
          : "whatsapp_qr_required",
      };
    }

    let connectedHandle = null;

    try {
      connectedHandle = await this.sockets.ensureSocket(
        connectedSession.user_id,
        connectedSession.id,
      );
    } catch (error) {
      console.error("[WA SEND] restore fallback socket failed", error);
    }

    if (!connectedHandle?.connected) {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));

        connectedHandle = this.sockets.getHandle(connectedSession.user_id);

        if (connectedHandle?.connected) {
          break;
        }
      }
    }

    console.log("[WA SEND] fallback restored handle", {
      sessionId: connectedSession.id,
      userId: connectedSession.user_id,
      exists: Boolean(connectedHandle),
      connected: connectedHandle?.connected === true,
    });

    if (!connectedHandle?.connected) {
      await this.sessions.setStatus(connectedSession.id, "disconnected");

      return {
        handle: connectedHandle,
        conversation,
        session: connectedSession,
        reason: "database_connected_but_socket_disconnected",
      };
    }

    const updatedConversation = await this.conversations.attachConnectedSession(
      conversation.id,
      {
        sessionId: connectedSession.id,
        userId: connectedSession.user_id,
      },
    );

    return {
      handle: connectedHandle,
      conversation: updatedConversation || conversation,
      session: connectedSession,
      reason: "fallback_session_restored",
    };
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
    summary: "WhatsApp QR connection status",
  })
  async status(
    @CurrentUser()
    user: any,
  ) {
    const row = await this.sessions.findByUserId(user.id);

    if (!row) {
      return {
        data: {
          enabled: this.sockets.isQrEnabled(),
          connected: false,
          phone: null,
          status: "disconnected",
          connected_at: null,
          updated_at: null,
        },
      };
    }

    let handle = this.sockets.getHandle(user.id);

    if (row.status === "connected" && !handle?.connected) {
      try {
        handle = await this.sockets.ensureSocket(user.id, row.id);
        for (let attempt = 0; attempt < 10; attempt += 1) {
          if (handle?.connected) {
            break;
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 300));
          handle = this.sockets.getHandle(user.id);
        }
      } catch (error) {
        console.error("[WA STATUS] restore failed", error);
      }
    }

    const connected = handle?.connected === true;
    if (row.status === "connected" && !connected) {
      const hasStoredAuth = await this.sockets.hasStoredAuth(user.id);
      await this.sessions.setStatus(
        row.id,
        hasStoredAuth ? "connecting" : "disconnected",
      );
    }

    const hasStoredAuth = connected
      ? true
      : await this.sockets.hasStoredAuth(user.id);

    return {
      data: {
        enabled: this.sockets.isQrEnabled(),
        connected,
        phone: connected ? row.phone : null,
        status: connected
          ? "connected"
          : hasStoredAuth
            ? "connecting"
            : "disconnected",
        requiresQr: !connected && !hasStoredAuth,
        connected_at: connected ? row.connected_at : null,
        updated_at: row.updated_at,
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
    const resolved = await this.resolveConnectedHandle(user, conv);
    const handle = resolved.handle;
    const sendConversation = resolved.conversation;

    if (!handle?.connected) {
      const qrRequired =
        resolved.reason === "whatsapp_qr_required" ||
        resolved.reason === "database_connected_but_socket_disconnected";

      throw new BadRequestException({
        code: qrRequired ? "WHATSAPP_QR_REQUIRED" : "WHATSAPP_RECONNECTING",
        message: qrRequired
          ? "Your WhatsApp login has expired or is missing. Scan the QR code again from AI Agent Setup."
          : "WhatsApp is reconnecting. Please wait a few seconds and try again.",

        reason: resolved.reason || "unknown",
        conversationId: conv.id,
        conversationSessionId: conv.session_id,
        conversationOwnerUserId: conv.user_id,
        attemptedSessionId: resolved.session?.id || null,
        attemptedSessionStatus: resolved.session?.status || "none",
      });
    }

    await this.outbound.sendAgentText({
      userId: sendConversation.user_id,
      sessionId: sendConversation.session_id,
      conversationId: sendConversation.id,
      leadId: sendConversation.lead_id,
      contactId: sendConversation.contact_id || null,
      teamId: sendConversation.team_id,
      contactPhone: sendConversation.contact_phone,
      text: message,
    });

    return {
      success: true,
      data: {
        conversationId: sendConversation.id,
        sessionId: sendConversation.session_id,
        whatsappOwnerUserId: sendConversation.user_id,
        contactPhone: sendConversation.contact_phone,
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
    const resolved = await this.resolveConnectedHandle(user, conv);
    const handle = resolved.handle;
    const sendConversation = resolved.conversation;
    if (!handle?.connected) {
      throw new BadRequestException(
        "WhatsApp QR session for this conversation is not connected",
      );
    }
    const savedMessage = await this.outbound.sendAgentVoice({
      userId: sendConversation.user_id,
      sessionId: sendConversation.session_id,
      conversationId: sendConversation.id,
      leadId: sendConversation.lead_id,
      contactId: sendConversation.contact_id || null,
      teamId: sendConversation.team_id,
      contactPhone: sendConversation.contact_phone,
      audioBase64: dto.audioBase64,
    });

    return {
      success: true,
      data: {
        conversationId: sendConversation.id,
        sent: true,
        message: savedMessage,
      },
    };
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

  @Get("leads/:leadId/conversation")
  @ApiOperation({
    summary: "Get the shared WhatsApp conversation for a lead",
  })
  async getLeadConversation(
    @CurrentUser() user: any,
    @Param("leadId") leadId: string,
  ) {
    const conversation = await this.conversations.findScopedByLeadId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      leadId,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  @Get("contacts/:contactId/conversation")
  @ApiOperation({
    summary: "Get the shared WhatsApp conversation for a contact",
  })
  async getContactConversation(
    @CurrentUser() user: any,
    @Param("contactId") contactId: string,
  ) {
    const conversation = await this.conversations.findScopedByContactId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      contactId,
    );

    return {
      success: true,
      data: conversation,
    };
  }

  @Get("leads/:leadId/messages")
  @ApiOperation({
    summary: "Get shared WhatsApp messages for a lead",
  })
  async getLeadMessages(
    @CurrentUser() user: any,
    @Param("leadId") leadId: string,
    @Query("limit") limitRaw?: string,
    @Query("before") before?: string,
  ) {
    const conversation = await this.conversations.findScopedByLeadId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      leadId,
    );
    if (!conversation) {
      return {
        success: true,
        data: [],
        conversationId: null,
      };
    }
    const parsedLimit = Number(limitRaw);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const messages = await this.messages.listByConversationId(conversation.id, {
      limit,
      before: before || null,
    });

    return {
      success: true,
      data: messages,
      conversationId: conversation.id,
    };
  }

  @Get("contacts/:contactId/messages")
  @ApiOperation({
    summary: "Get shared WhatsApp messages for a contact",
  })
  async getContactMessages(
    @CurrentUser() user: any,
    @Param("contactId") contactId: string,
    @Query("limit") limitRaw?: string,
    @Query("before") before?: string,
  ) {
    const conversation = await this.conversations.findScopedByContactId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      contactId,
    );
    if (!conversation) {
      return {
        success: true,
        data: [],
        conversationId: null,
      };
    }
    const parsedLimit = Number(limitRaw);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const messages = await this.messages.listByConversationId(conversation.id, {
      limit,
      before: before || null,
    });

    return {
      success: true,
      data: messages,
      conversationId: conversation.id,
    };
  }

  private async sendThroughConversation(
    user: any,
    conversation: any,
    messageRaw: string,
  ) {
    const message = String(messageRaw || "").trim();

    if (!message) {
      throw new BadRequestException("Message is required");
    }

    const resolved = await this.resolveConnectedHandle(user, conversation);

    const handle = resolved.handle;
    const sendConversation = resolved.conversation;

    if (!handle?.connected) {
      throw new BadRequestException({
        code: "WHATSAPP_SESSION_NOT_CONNECTED",
        message:
          "No active WhatsApp connection is available. Connect WhatsApp from AI Agent Setup.",
        conversationId: conversation.id,
      });
    }

    const savedMessage = await this.outbound.sendAgentText({
      userId: sendConversation.user_id,
      sessionId: sendConversation.session_id,
      conversationId: sendConversation.id,
      leadId: sendConversation.lead_id,
      contactId: sendConversation.contact_id || null,
      teamId: sendConversation.team_id,
      contactPhone: sendConversation.contact_phone,
      text: message,
    });

    return {
      success: true,
      data: {
        conversationId: sendConversation.id,
        leadId: sendConversation.lead_id,
        contactId: sendConversation.contact_id || null,
        contactPhone: sendConversation.contact_phone,
        sent: true,
        message: savedMessage,
      },
    };
  }

  @Post("leads/:leadId/send")
  @ApiOperation({
    summary: "Send a real WhatsApp message from the Lead page",
  })
  async sendFromLead(
    @CurrentUser() user: any,
    @Param("leadId") leadId: string,
    @Body() body: { message: string },
  ) {
    console.log("=== SEND FROM LEAD ===", leadId);
    const conversation = await this.conversations.findScopedByLeadId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      leadId,
    );

    if (!conversation) {
      throw new NotFoundException({
        code: "WHATSAPP_CONVERSATION_NOT_FOUND",
        message:
          "This lead does not have a WhatsApp conversation yet. The conversation must be created or linked first.",
      });
    }

    return this.sendThroughConversation(user, conversation, body.message);
  }

  @Post("contacts/:contactId/send")
  @ApiOperation({
    summary: "Send a real WhatsApp message from the Contact page",
  })
  async sendFromContact(
    @CurrentUser() user: any,
    @Param("contactId") contactId: string,
    @Body() body: { message: string },
  ) {
    console.log("=== SEND FROM CONTACT ===", contactId);
    const conversation = await this.conversations.findScopedByContactId(
      {
        id: user.id,
        teamId: user.teamId || user.team_id || null,
        role: user.role,
      },
      contactId,
    );
    if (!conversation) {
      throw new NotFoundException({
        code: "WHATSAPP_CONVERSATION_NOT_FOUND",
        message:
          "This contact does not have a WhatsApp conversation yet. The conversation must be created or linked first.",
      });
    }

    return this.sendThroughConversation(user, conversation, body.message);
  }
}
