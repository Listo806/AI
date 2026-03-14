import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WhatsAppQrOutboundService } from './whatsapp-qr-outbound.service';
import { WhatsAppQrMessageService } from './whatsapp-qr-message.service';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';

const CONTEXT_MESSAGE_LIMIT = 30;
const WHATSAPP_SYSTEM_PROMPT = `You are a helpful real estate assistant replying over WhatsApp. Be concise, friendly, and professional. Answer in the same language the lead uses when possible.`;

/**
 * AI reply for QR channel. Uses AiAssistantService with conversation history from whatsapp_qr_messages.
 */
@Injectable()
export class WhatsAppQrAiReplyService {
  private readonly logger = new Logger(WhatsAppQrAiReplyService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => WhatsAppQrOutboundService))
    private readonly outbound: WhatsAppQrOutboundService,
    private readonly qrMessages: WhatsAppQrMessageService,
    private readonly aiAssistant: AiAssistantService,
  ) {}

  /**
   * Build chat payload from whatsapp_qr_messages. Inbound/lead -> user; outbound -> assistant.
   */
  private messagesToChatPayload(rows: { direction: string; sender_type: string; body: string | null }[]): ChatMessage[] {
    const out: ChatMessage[] = [{ role: 'system', content: WHATSAPP_SYSTEM_PROMPT }];
    for (const m of rows) {
      const content = (m.body || '').trim();
      if (!content) continue;
      const role = m.direction === 'inbound' || m.sender_type === 'lead' ? 'user' : 'assistant';
      out.push({ role, content });
    }
    return out;
  }

  /**
   * Load conversation context, call AI, and send reply via outbound.
   * Uses team-level ai_auto_reply_enabled (AI Auto-Reply page), not per-conversation flag.
   */
  async replyIfEnabled(
    qrConversationId: string,
    leadId: string,
    contactPhoneE164: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.user_id, c.team_id, c.contact_phone, c.owner_type
       FROM whatsapp_qr_conversations c WHERE c.id = $1`,
      [qrConversationId],
    );
    if (!rows.length || rows[0].owner_type === 'human') return;

    const conv = rows[0];
    if (conv.team_id) {
      const { rows: teamRows } = await this.db.query(
        `SELECT ai_auto_reply_enabled FROM teams WHERE id = $1`,
        [conv.team_id],
      );
      if (teamRows.length && teamRows[0].ai_auto_reply_enabled === false) return;
    }

    const history = await this.qrMessages.listByConversationId(qrConversationId, CONTEXT_MESSAGE_LIMIT);
    const messages = this.messagesToChatPayload(history);
    if (messages.length <= 1) {
      this.logger.debug(`replyIfEnabled: no user messages in conversation ${qrConversationId}`);
      return;
    }

    let text: string;
    try {
      const { message } = await this.aiAssistant.chat({ messages });
      text = (message || '').trim() || 'Thanks for your message. How can I help you today?';
    } catch (err: any) {
      this.logger.warn(`AI reply failed for conversation ${qrConversationId}: ${err?.message}`);
      text = 'Thanks for your message. An agent will continue the conversation shortly.';
    }

    await this.outbound.sendAiText({
      userId: conv.user_id,
      sessionId: conv.session_id,
      conversationId: conv.id,
      leadId,
      teamId: conv.team_id,
      contactPhone: contactPhoneE164,
      text,
    });
  }
}
