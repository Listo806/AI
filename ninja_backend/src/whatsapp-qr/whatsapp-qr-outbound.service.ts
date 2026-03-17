import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BaileysSocketService } from './baileys-socket.service';
import { OutboundThrottleService } from './outbound-throttle.service';
import { WhatsAppQrConversationService } from './whatsapp-qr-conversation.service';
import { WhatsAppQrRealtimeService } from './whatsapp-qr-realtime.service';

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
    leadId: string;
    teamId: string | null;
    contactPhone: string;
    text: string;
  }): Promise<void> {
    await this.throttle.assertAllowed(params.sessionId);
    await this.sockets.sendText(params.userId, params.contactPhone, params.text);
    await this.conversations.setOwnerHuman(params.conversationId);
    await this.db.query(
      `INSERT INTO whatsapp_qr_messages
       (session_id, conversation_id, lead_id, team_id, contact_phone, direction, sender_type, message_type, body, message_id)
       VALUES ($1, $2, $3, $4, $5, 'outbound', 'agent', 'text', $6, NULL)`,
      [
        params.sessionId,
        params.conversationId,
        params.leadId,
        params.teamId,
        params.contactPhone,
        params.text,
      ],
    );
    await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET last_message_at = NOW(), last_message = $2, last_message_type = 'text', updated_at = NOW()
       WHERE id = $1`,
      [params.conversationId, params.text.slice(0, 500)],
    );
    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(),
       last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [params.leadId],
    );
    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: params.contactPhone,
      direction: 'outbound',
      senderType: 'agent',
      body: params.text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    });
  }

  async sendAiText(params: {
    userId: string;
    sessionId: string;
    conversationId: string;
    leadId: string;
    teamId: string | null;
    contactPhone: string;
    text: string;
  }): Promise<void> {
    await this.throttle.assertAllowed(params.sessionId);
    await this.sockets.sendText(params.userId, params.contactPhone, params.text);
    await this.db.query(
      `INSERT INTO whatsapp_qr_messages
       (session_id, conversation_id, lead_id, team_id, contact_phone, direction, sender_type, message_type, body, message_id)
       VALUES ($1, $2, $3, $4, $5, 'outbound', 'ai', 'text', $6, NULL)`,
      [
        params.sessionId,
        params.conversationId,
        params.leadId,
        params.teamId,
        params.contactPhone,
        params.text,
      ],
    );
    await this.conversations.setOwnerHuman(params.conversationId);
    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(),
       last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [params.leadId],
    );
    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: params.contactPhone,
      direction: 'outbound',
      senderType: 'ai',
      body: params.text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Agent sends voice message via Baileys.
   */
  async sendAgentVoice(params: {
    userId: string;
    sessionId: string;
    conversationId: string;
    leadId: string;
    teamId: string | null;
    contactPhone: string;
    audioBase64: string;
  }): Promise<void> {
    await this.throttle.assertAllowed(params.sessionId);
    await this.sockets.sendVoice(params.userId, params.contactPhone, params.audioBase64);
    await this.conversations.setOwnerHuman(params.conversationId);
    await this.db.query(
      `INSERT INTO whatsapp_qr_messages
       (session_id, conversation_id, lead_id, team_id, contact_phone, direction, sender_type, message_type, body, message_id)
       VALUES ($1, $2, $3, $4, $5, 'outbound', 'agent', 'audio', '[Voice message]', NULL)`,
      [
        params.sessionId,
        params.conversationId,
        params.leadId,
        params.teamId,
        params.contactPhone,
      ],
    );
    await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET last_message_at = NOW(), last_message = '[Voice message]', last_message_type = 'audio', updated_at = NOW()
       WHERE id = $1`,
      [params.conversationId],
    );
    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(),
       last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [params.leadId],
    );
    this.realtime.emitMessage({
      userId: params.userId,
      conversationId: params.conversationId,
      contactPhone: params.contactPhone,
      direction: 'outbound',
      senderType: 'agent',
      body: '[Voice message]',
      messageType: 'audio',
      createdAt: new Date().toISOString(),
    });
  }
}
