import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { BaileysSocketService } from "./baileys-socket.service";
import { OutboundThrottleService } from "./outbound-throttle.service";
import { WhatsAppQrConversationService } from "./whatsapp-qr-conversation.service";
import { WhatsAppQrRealtimeService } from "./whatsapp-qr-realtime.service";
import { normalizeToE164 } from "./utils/phone-normalize.util";
@Injectable()
export class WhatsAppQrOutboundService {
  private readonly logger = new Logger(WhatsAppQrOutboundService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => BaileysSocketService))
    private readonly sockets: BaileysSocketService,
    private readonly throttle: OutboundThrottleService,
    private readonly conversations: WhatsAppQrConversationService,
    private readonly realtime: WhatsAppQrRealtimeService,
  ) {}

  /**
   * Agent sends from CRM — handoff: set human, persist outbound as agent, no AI after this.
   */
  async sendAgentText(params: {
    userId: string;
    sessionId: string;
    conversationId: string;
    leadId?: string | null;
    contactId?: string | null;
    teamId: string | null;
    contactPhone: string;
    text: string;
  }): Promise<any> {
    await this.throttle.assertAllowed(params.sessionId);

    const text = String(params.text || "").trim();
    const normalizedContactPhone = normalizeToE164(params.contactPhone);

    if (!normalizedContactPhone) {
      throw new Error(`Invalid WhatsApp contact phone: ${params.contactPhone}`);
    }
    if (!text) {
      throw new Error("Message is required");
    }

    /*
     * sent WhatsApp
     * Baileys return real message key ID
     */
    const whatsappMessageId = await this.sockets.sendText(
      params.userId,
      normalizedContactPhone,
      text,
    );

    await this.conversations.setOwnerHuman(params.conversationId);

    /*
     *  sendMessage() ok, save lưu status = sent.
     */
    const { rows } = await this.db.query(
      `
    INSERT INTO whatsapp_qr_messages (
      session_id,
      conversation_id,
      lead_id,
      contact_id,
      team_id,
      contact_phone,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'outbound',
      'agent',
      'text',
      $7,
      $8,
      'sent',
      NOW()
    )
    RETURNING
      id,
      session_id,
      conversation_id,
      lead_id,
      contact_id,
      team_id,
      contact_phone,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at,
      delivered_at,
      read_at,
      failed_at,
      created_at
    `,
      [
        params.sessionId,
        params.conversationId,
        params.leadId ?? null,
        params.contactId ?? null,
        params.teamId,
        normalizedContactPhone,
        text,
        whatsappMessageId,
      ],
    );

    const savedMessage = rows[0];

    await this.db.query(
      `
    UPDATE whatsapp_qr_conversations
    SET
      contact_id = COALESCE(contact_id, $3),
      last_message_at = NOW(),
      last_message = $2,
      last_message_type = 'text',
      updated_at = NOW()
    WHERE id = $1
    `,
      [params.conversationId, text.slice(0, 500), params.contactId ?? null],
    );

    if (params.leadId) {
      await this.db.query(
        `
        UPDATE leads
        SET
          last_contacted_at = NOW(),
          last_activity_at = NOW(),
          last_action_type = 'whatsapp',
          last_action_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [params.leadId],
      );
    }

    if (params.contactId) {
      await this.db.query(
        `
      UPDATE contacts
      SET updated_at = NOW(),
          last_contact_at = NOW()
      WHERE id = $1
      `,
        [params.contactId],
      );
    }

    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: normalizedContactPhone,
      direction: "outbound",
      senderType: "agent",
      body: text,
      messageType: "text",
      messageId: savedMessage?.message_id || whatsappMessageId || null,
      databaseMessageId: savedMessage?.id || null,
      status: savedMessage?.status || "sent",
      sentAt:
        savedMessage?.sent_at?.toISOString?.() ||
        savedMessage?.sent_at ||
        new Date().toISOString(),
      createdAt:
        savedMessage?.created_at?.toISOString?.() ||
        savedMessage?.created_at ||
        new Date().toISOString(),
    });
    
    if (params.contactId) {
      await this.db.query(
        `
        INSERT INTO contact_activities (
          contact_id,
          user_id,
          team_id,
          type,
          title,
          sub,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'message',
          'WhatsApp message sent',
          $4,
          NOW()
        )
        `,
        [params.contactId, params.userId, params.teamId, text],
      );
    }

    return savedMessage;
  }

  async sendAiText(params: {
    userId: string;
    sessionId: string;
    conversationId: string;
    leadId?: string | null;
    contactId?: string | null;
    teamId: string | null;
    contactPhone: string;
    text: string;
  }): Promise<any> {
    await this.throttle.assertAllowed(params.sessionId);

    const text = String(params.text || "").trim();
    const normalizedContactPhone = normalizeToE164(params.contactPhone);

    if (!normalizedContactPhone) {
      throw new Error(`Invalid WhatsApp contact phone: ${params.contactPhone}`);
    }
    if (!text) {
      throw new Error("Message is required");
    }

    const whatsappMessageId = await this.sockets.sendText(
      params.userId,
      normalizedContactPhone,
      text,
    );

    const { rows } = await this.db.query(
      `
    INSERT INTO whatsapp_qr_messages (
      session_id,
      conversation_id,
      lead_id,
      contact_id,
      team_id,
      contact_phone,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'outbound',
      'ai',
      'text',
      $7,
      $8,
      'sent',
      NOW()
    )
    RETURNING
      id,
      session_id,
      conversation_id,
      lead_id,
      contact_id,
      team_id,
      contact_phone,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at,
      delivered_at,
      read_at,
      failed_at,
      created_at
    `,
      [
        params.sessionId,
        params.conversationId,
        params.leadId ?? null,
        params.contactId ?? null,
        params.teamId,
        normalizedContactPhone,
        text,
        whatsappMessageId,
      ],
    );

    const savedMessage = rows[0];

    await this.db.query(
      `
    UPDATE whatsapp_qr_conversations
    SET
      contact_id = COALESCE(contact_id, $3),
      last_message_at = NOW(),
      last_message = $2,
      last_message_type = 'text',
      updated_at = NOW()
    WHERE id = $1
    `,
      [params.conversationId, text.slice(0, 500), params.contactId ?? null],
    );

    if (params.leadId) {
      await this.db.query(
        `
        UPDATE leads
        SET
          last_contacted_at = NOW(),
          last_activity_at = NOW(),
          last_action_type = 'whatsapp',
          last_action_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [params.leadId],
      );
    }

    if (params.contactId) {
      await this.db.query(
        `
      UPDATE contacts
      SET updated_at = NOW(),
          last_contact_at = NOW()
      WHERE id = $1
      `,
        [params.contactId],
      );
    }

    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: normalizedContactPhone,
      direction: "outbound",
      senderType: "ai",
      body: text,
      messageType: "text",
      databaseMessageId: savedMessage?.id || null,
      messageId: savedMessage?.message_id || whatsappMessageId || null,
      status: savedMessage?.status || "sent",
      sentAt:
        savedMessage?.sent_at?.toISOString?.() ||
        savedMessage?.sent_at ||
        new Date().toISOString(),
      createdAt:
        savedMessage?.created_at?.toISOString?.() ||
        savedMessage?.created_at ||
        new Date().toISOString(),
    });

    return savedMessage;
  }

  /**
   * Agent sends voice message via Baileys.
   */
  async sendAgentVoice(params: {
    userId: string;
    sessionId: string;
    conversationId: string;
    leadId?: string | null;
    contactId?: string | null;
    teamId: string | null;
    contactPhone: string;
    audioBase64: string;
  }): Promise<any> {
    await this.throttle.assertAllowed(params.sessionId);
    const normalizedContactPhone = normalizeToE164(params.contactPhone);

    if (!normalizedContactPhone) {
      throw new Error(`Invalid WhatsApp contact phone: ${params.contactPhone}`);
    }
    const whatsappMessageId = await this.sockets.sendVoice(
      params.userId,
      normalizedContactPhone,
      params.audioBase64,
    );

    await this.conversations.setOwnerHuman(params.conversationId);

    const { rows } = await this.db.query(
      `
    INSERT INTO whatsapp_qr_messages (
      session_id,
      conversation_id,
      lead_id,
      contact_id,
      team_id,
      contact_phone,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'outbound',
      'agent',
      'audio',
      '[Voice message]',
      $7,
      'sent',
      NOW()
    )
    RETURNING
      id,
      conversation_id,
      lead_id,
      contact_id,
      direction,
      sender_type,
      message_type,
      body,
      message_id,
      status,
      sent_at,
      delivered_at,
      read_at,
      failed_at,
      created_at
    `,
      [
        params.sessionId,
        params.conversationId,
        params.leadId ?? null,
        params.contactId ?? null,
        params.teamId,
        normalizedContactPhone,
        whatsappMessageId,
      ],
    );

    const savedMessage = rows[0];

    await this.db.query(
      `
    UPDATE whatsapp_qr_conversations
    SET
      contact_id = COALESCE(contact_id, $2),
      last_message_at = NOW(),
      last_message = '[Voice message]',
      last_message_type = 'audio',
      updated_at = NOW()
    WHERE id = $1
    `,
      [params.conversationId, params.contactId ?? null],
    );

    if (params.leadId) {
      await this.db.query(
        `
        UPDATE leads
        SET
          last_contacted_at = NOW(),
          last_activity_at = NOW(),
          last_action_type = 'whatsapp',
          last_action_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        `,
        [params.leadId],
      );
    }

    if (params.contactId) {
      await this.db.query(
        `
      UPDATE contacts
      SET updated_at = NOW(),
          last_contact_at = NOW()
      WHERE id = $1
      `,
        [params.contactId],
      );
    }

    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: normalizedContactPhone,
      direction: "outbound",
      senderType: "agent",
      body: "[Voice message]",
      messageType: "audio",
      databaseMessageId: savedMessage?.id || null,
      messageId: savedMessage?.message_id || null,
      status: savedMessage?.status || "sent",
      sentAt:
        savedMessage?.sent_at?.toISOString?.() ||
        savedMessage?.sent_at ||
        new Date().toISOString(),
      createdAt:
        savedMessage?.created_at?.toISOString?.() ||
        savedMessage?.created_at ||
        new Date().toISOString(),
    });

    return savedMessage;
  }
}
