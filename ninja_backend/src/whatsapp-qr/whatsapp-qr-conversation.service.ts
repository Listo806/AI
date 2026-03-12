import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type QrConversationRow = {
  id: string;
  session_id: string;
  user_id: string;
  team_id: string | null;
  lead_id: string;
  contact_phone: string;
  owner_type: 'ai' | 'human';
  ai_enabled: boolean;
  unread_count: number;
};

@Injectable()
export class WhatsAppQrConversationService {
  constructor(private readonly db: DatabaseService) {}

  async findBySessionAndPhone(
    sessionId: string,
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const { rows } = await this.db.query(
      `SELECT id, session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, unread_count
       FROM whatsapp_qr_conversations
       WHERE session_id = $1 AND contact_phone = $2`,
      [sessionId, contactPhone],
    );
    return rows.length ? rows[0] : null;
  }

  async getOrCreate(params: {
    sessionId: string;
    userId: string;
    teamId: string | null;
    leadId: string;
    contactPhone: string;
  }): Promise<{ row: QrConversationRow; created: boolean }> {
    const existing = await this.findBySessionAndPhone(params.sessionId, params.contactPhone);
    if (existing) return { row: existing, created: false };

    const { rows } = await this.db.query(
      `INSERT INTO whatsapp_qr_conversations
       (session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, last_message_at, unread_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'ai', true, NOW(), 1, NOW())
       RETURNING id, session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, unread_count`,
      [
        params.sessionId,
        params.userId,
        params.teamId,
        params.leadId,
        params.contactPhone,
      ],
    );
    return { row: rows[0], created: true };
  }

  async touchInbound(conversationId: string): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET last_message_at = NOW(), unread_count = unread_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [conversationId],
    );
  }

  async listByUserId(userId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.lead_id, c.contact_phone, c.owner_type, c.ai_enabled,
              c.last_message_at, c.unread_count, c.status, c.created_at,
              l.name AS lead_name
       FROM whatsapp_qr_conversations c
       INNER JOIN leads l ON l.id = c.lead_id
       WHERE c.user_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC`,
      [userId],
    );
    return rows;
  }

  async findByUserAndPhone(
    userId: string,
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const { rows } = await this.db.query(
      `SELECT id, session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, unread_count
       FROM whatsapp_qr_conversations
       WHERE user_id = $1 AND contact_phone = $2`,
      [userId, contactPhone],
    );
    return rows.length ? rows[0] : null;
  }

  async toggleAi(userId: string, contactPhone: string, aiEnabled: boolean): Promise<boolean> {
    const ownerType = aiEnabled ? 'ai' : 'human';
    const { rowCount } = await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET ai_enabled = $3, owner_type = $4, updated_at = NOW()
       WHERE user_id = $1 AND contact_phone = $2`,
      [userId, contactPhone, aiEnabled, ownerType],
    );
    return (rowCount ?? 0) > 0;
  }

  async resetUnread(conversationId: string): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp_qr_conversations SET unread_count = 0, updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );
  }

  async setOwnerHuman(conversationId: string): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp_qr_conversations SET owner_type = 'human', ai_enabled = false, updated_at = NOW() WHERE id = $1`,
      [conversationId],
    );
  }
}
