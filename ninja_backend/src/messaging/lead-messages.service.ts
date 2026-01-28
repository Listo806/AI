import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type MessageChannel = 'whatsapp' | 'email';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface CreateMessageDto {
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  external_id?: string;
  body?: string;
  subject?: string;
  status?: MessageStatus;
  metadata?: Record<string, unknown>;
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
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class LeadMessagesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateMessageDto): Promise<LeadMessage> {
    const { rows } = await this.db.query(
      `INSERT INTO lead_messages (lead_id, channel, direction, external_id, body, subject, status, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, lead_id, channel, direction, external_id, body, subject, status, metadata, created_at, updated_at`,
      [
        dto.lead_id,
        dto.channel,
        dto.direction,
        dto.external_id ?? null,
        dto.body ?? null,
        dto.subject ?? null,
        dto.status ?? 'sent',
        dto.metadata ? JSON.stringify(dto.metadata) : null,
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
    let query = `SELECT id, lead_id, channel, direction, external_id, body, subject, status, metadata, created_at, updated_at
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
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
