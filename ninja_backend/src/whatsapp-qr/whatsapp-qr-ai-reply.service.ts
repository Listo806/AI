import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WhatsAppQrOutboundService } from './whatsapp-qr-outbound.service';

/**
 * AI reply for QR channel. Minimal placeholder until full AiAssistant parity.
 */
@Injectable()
export class WhatsAppQrAiReplyService {
  private readonly logger = new Logger(WhatsAppQrAiReplyService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => WhatsAppQrOutboundService))
    private readonly outbound: WhatsAppQrOutboundService,
  ) {}

  /**
   * Load conversation context and send a short reply via outbound (handoff after send).
   */
  async replyIfEnabled(
    qrConversationId: string,
    leadId: string,
    contactPhoneE164: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.user_id, c.team_id, c.contact_phone, c.ai_enabled, c.owner_type
       FROM whatsapp_qr_conversations c WHERE c.id = $1`,
      [qrConversationId],
    );
    if (!rows.length || !rows[0].ai_enabled || rows[0].owner_type === 'human')
      return;

    const conv = rows[0];
    // Placeholder reply; replace with AiAssistant + lead_messages context later
    const text =
      'Thanks for your message. An agent will continue the conversation shortly.';
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
