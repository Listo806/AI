import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WhatsAppQrMessageService {
  private readonly logger = new Logger(WhatsAppQrMessageService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Insert inbound message; dedupe when message_id already exists (partial unique index).
   * Returns true if a new row was inserted.
   */
  async insertInbound(params: {
    sessionId: string;
    conversationId: string;
    leadId: string;
    teamId: string | null;
    contactPhone: string;
    body: string | null;
    messageId: string | null;
    messageType: string;
  }): Promise<boolean> {
    if (params.messageId) {
      const { rows } = await this.db.query(
        `SELECT 1 FROM whatsapp_qr_messages WHERE message_id = $1 LIMIT 1`,
        [params.messageId],
      );
      if (rows.length) {
        this.logger.debug(`Dedupe skip message_id=${params.messageId}`);
        return false;
      }
    }

    try {
      await this.db.query(
        `INSERT INTO whatsapp_qr_messages
         (session_id, conversation_id, lead_id, team_id, contact_phone, direction, sender_type, message_type, body, message_id)
         VALUES ($1, $2, $3, $4, $5, 'inbound', 'lead', $6, $7, $8)`,
        [
          params.sessionId,
          params.conversationId,
          params.leadId,
          params.teamId,
          params.contactPhone,
          params.messageType,
          params.body,
          params.messageId,
        ],
      );
      const preview =
        (params.body || '').trim().slice(0, 500) ||
        `[${params.messageType}]`;
      await this.db.query(
        `UPDATE whatsapp_qr_conversations
         SET last_message_at = NOW(), last_message = $2, last_message_type = $3,
             unread_count = unread_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [params.conversationId, preview, params.messageType],
      );
      return true;
    } catch (e: any) {
      // 23505 unique_violation on message_id
      if (e?.code === '23505') return false;
      throw e;
    }
  }

  /**
   * Messages oldest-first for UI. Pagination: before = load messages strictly older than this timestamp.
   */
  async listByConversationId(
    conversationId: string,
    opts: { limit?: number; before?: string | null } = {},
  ): Promise<any[]> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const before = opts.before || null;
    const { rows } = await this.db.query(
      `SELECT id, direction, sender_type, message_type, body, message_id, created_at
       FROM whatsapp_qr_messages
       WHERE conversation_id = $1
         AND ($2::timestamptz IS NULL OR created_at < $2::timestamptz)
       ORDER BY created_at DESC
       LIMIT $3`,
      [conversationId, before, limit],
    );
    return rows.reverse();
  }
}
