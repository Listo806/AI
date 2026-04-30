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
    // Use session owner's team (same as AI Auto-Reply page) so "turn on" there applies here
    const { rows: teamRows } = await this.db.query(
      `SELECT t.ai_auto_reply_enabled FROM users u
       INNER JOIN teams t ON t.id = u.team_id
       WHERE u.id = $1`,
      [conv.user_id],
    );
    if (teamRows.length && teamRows[0].ai_auto_reply_enabled === false) return;

    const history = await this.qrMessages.listByConversationId(qrConversationId, {
      limit: CONTEXT_MESSAGE_LIMIT,
    });
    const messages = this.messagesToChatPayload(history);
    if (messages.length <= 1) {
      this.logger.debug(`replyIfEnabled: no user messages in conversation ${qrConversationId}`);
      return;
    }

    const AI_REPLY_MS = 8000;
    let text: string;
    try {
      const chatPromise = this.aiAssistant.chat({ messages });
      const timeoutPromise = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('AI reply timeout')), AI_REPLY_MS),
      );
      const { message } = await Promise.race([chatPromise, timeoutPromise]);
      text = (message || '').trim() || 'Thanks for your message. How can I help you today?';
    } catch (err: any) {
      if (err?.message === 'AI reply timeout') {
        this.logger.warn(`AI reply timeout (${AI_REPLY_MS}ms) conversation ${qrConversationId}`);
      }
      else
        this.logger.warn(`AI reply failed for conversation ${qrConversationId}: ${err?.message}`);
      text =
        err?.message === 'AI reply timeout'
          ? 'Thanks for your message. Our team will reply shortly.'
          : 'Thanks for your message. An agent will continue the conversation shortly.';
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
