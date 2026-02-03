import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type MessageChannel = 'whatsapp' | 'email' | 'instagram_dm';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type SenderType = 'platform' | 'agent' | 'ai' | 'lead';
export type MessageType = 'text' | 'audio' | 'card';

export interface CreateMessageDto {
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  external_id?: string;
  body?: string;
  subject?: string;
  status?: MessageStatus;
  metadata?: Record<string, unknown>;
  sender_type?: SenderType;
  agent_id?: string | null;
  conversation_id?: string | null;
  message_type?: MessageType;
  media_url?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface LeadMessage {
  id: string;
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  external_id: string | null;
  body: string | null;
  subject: string | null;
  status: MessageStatus;
  metadata: Record<string, unknown> | null;
  sender_type: SenderType;
  agent_id: string | null;
  conversation_id: string | null;
  message_type: MessageType;
  media_url: string | null;
  meta: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class LeadMessagesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateMessageDto): Promise<LeadMessage> {
    const { rows } = await this.db.query(
      `INSERT INTO lead_messages (lead_id, channel, direction, external_id, body, subject, status, metadata, sender_type, agent_id, conversation_id, message_type, media_url, meta, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       RETURNING id, lead_id, channel, direction, external_id, body, subject, status, metadata, sender_type, agent_id, conversation_id, message_type, media_url, meta, created_at, updated_at`,
      [
        dto.lead_id,
        dto.channel,
        dto.direction,
        dto.external_id ?? null,
        dto.body ?? null,
        dto.subject ?? null,
        dto.status ?? 'sent',
        dto.metadata ? JSON.stringify(dto.metadata) : null,
        dto.sender_type ?? 'platform',
        dto.agent_id ?? null,
        dto.conversation_id ?? null,
        dto.message_type ?? 'text',
        dto.media_url ?? null,
        dto.meta ? JSON.stringify(dto.meta) : null,
      ],
    );
    return this.mapRow(rows[0]);
  }

  async updateStatusByExternalId(externalId: string, status: MessageStatus): Promise<number> {
    const result = await this.db.query(
      `UPDATE lead_messages SET status = $1, updated_at = NOW() WHERE external_id = $2`,
      [status, externalId],
    );
    return result.rowCount ?? 0;
  }

  async findByLead(leadId: string, channel?: MessageChannel): Promise<LeadMessage[]> {
    let query = `SELECT id, lead_id, channel, direction, external_id, body, subject, status, metadata, sender_type, agent_id, conversation_id, message_type, media_url, meta, created_at, updated_at
                 FROM lead_messages WHERE lead_id = $1`;
    const params: any[] = [leadId];
    if (channel) {
      query += ` AND channel = $2`;
      params.push(channel);
    }
    query += ` ORDER BY created_at ASC`;

    const { rows } = await this.db.query(query, params);
    return rows.map(this.mapRow);
  }

  /**
   * Find messages by conversation (for WhatsApp AI reply context and API).
   * Returns last N messages in chronological order (oldest first).
   */
  async findByConversation(conversationId: string, limit = 50): Promise<LeadMessage[]> {
    const { rows } = await this.db.query(
      `SELECT id, lead_id, channel, direction, external_id, body, subject, status, metadata, sender_type, agent_id, conversation_id, message_type, media_url, meta, created_at, updated_at
       FROM lead_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit],
    );
    return rows.reverse().map(this.mapRow);
  }

  async getEmailThread(leadId: string): Promise<LeadMessage[]> {
    return this.findByLead(leadId, 'email');
  }

  private mapRow(row: any): LeadMessage {
    return {
      id: row.id,
      lead_id: row.lead_id,
      channel: row.channel,
      direction: row.direction,
      external_id: row.external_id,
      body: row.body,
      subject: row.subject,
      status: row.status,
      metadata: row.metadata,
      sender_type: row.sender_type ?? 'platform',
      agent_id: row.agent_id ?? null,
      conversation_id: row.conversation_id ?? null,
      message_type: row.message_type ?? 'text',
      media_url: row.media_url ?? null,
      meta: row.meta ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
