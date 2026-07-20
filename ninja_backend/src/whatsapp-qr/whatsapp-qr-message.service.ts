import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

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
    contactId?: string | null;
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

    let contactId = params.contactId ?? null;

    if (!contactId) {
      const { rows: contactRows } = await this.db.query(
        `
        SELECT contact_id
        FROM leads
        WHERE id = $1
        LIMIT 1
        `,
        [params.leadId],
      );
      contactId = contactRows[0]?.contact_id ?? null;
    }
    try {
      await this.db.query(
        `INSERT INTO whatsapp_qr_messages (
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
          message_id
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'inbound',
          'lead',
          $7,
          $8,
          $9
        )`,
        [
          params.sessionId,
          params.conversationId,
          params.leadId,
          contactId,
          params.teamId,
          params.contactPhone,
          params.messageType,
          params.body,
          params.messageId,
        ],
      );
      const preview =
        (params.body || "").trim().slice(0, 500) || `[${params.messageType}]`;
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
      if (e?.code === "23505") return false;
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
      `SELECT
        id,
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
        conversation_id,
        lead_id,
        contact_id,
        created_at
      FROM whatsapp_qr_messages
      WHERE conversation_id = $1
        AND ($2::timestamptz IS NULL OR created_at < $2::timestamptz)
      ORDER BY created_at DESC
      LIMIT $3`,
      [conversationId, before, limit],
    );
    return rows.reverse();
  }

  async updateOutboundStatusByMessageId(params: {
    messageId: string;
    status: "sent" | "delivered" | "read" | "failed";
    occurredAt?: Date | string | null;
  }): Promise<any | null> {
    const messageId = String(params.messageId || "").trim();

    if (!messageId) {
      return null;
    }

    const occurredAt =
      params.occurredAt instanceof Date
        ? params.occurredAt
        : params.occurredAt
          ? new Date(params.occurredAt)
          : new Date();

    const safeOccurredAt = Number.isNaN(occurredAt.getTime())
      ? new Date()
      : occurredAt;

    /*
     * Không cho trạng thái bị lùi:
     *
     * sent      = 1
     * delivered = 2
     * read      = 3
     * failed    = trạng thái lỗi riêng
     */
    const { rows } = await this.db.query(
      `
      UPDATE whatsapp_qr_messages
      SET
        status = CASE
          WHEN $2 = 'failed' THEN
            CASE
              WHEN status IN ('read', 'delivered') THEN status
              ELSE 'failed'
            END

          WHEN $2 = 'read' THEN 'read'

          WHEN $2 = 'delivered' THEN
            CASE
              WHEN status = 'read' THEN 'read'
              ELSE 'delivered'
            END

          WHEN $2 = 'sent' THEN
            CASE
              WHEN status IN ('read', 'delivered') THEN status
              ELSE 'sent'
            END

          ELSE status
        END,

        sent_at = CASE
          WHEN $2 IN ('sent', 'delivered', 'read')
            THEN COALESCE(sent_at, $3::timestamptz)
          ELSE sent_at
        END,

        delivered_at = CASE
          WHEN $2 IN ('delivered', 'read')
            THEN COALESCE(delivered_at, $3::timestamptz)
          ELSE delivered_at
        END,

        read_at = CASE
          WHEN $2 = 'read'
            THEN COALESCE(read_at, $3::timestamptz)
          ELSE read_at
        END,

        failed_at = CASE
          WHEN $2 = 'failed'
            THEN COALESCE(failed_at, $3::timestamptz)
          ELSE failed_at
        END

      WHERE message_id = $1
        AND direction = 'outbound'

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
      [messageId, params.status, safeOccurredAt.toISOString()],
    );

    return rows[0] || null;
  }
}
