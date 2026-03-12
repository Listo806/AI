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
      return true;
    } catch (e: any) {
      // 23505 unique_violation on message_id
      if (e?.code === '23505') return false;
      throw e;
    }
  }
}
