import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type ConversationOwnership = 'ai' | 'human';
export type ConversationStatus = 'open' | 'closed';
export type ConversationSource = 'organic' | 'ad';
export type ConversationStage = 'new' | 'qualified' | 'presented' | 'escalated' | 'converted' | 'closed';

export interface Conversation {
  id: string;
  lead_id: string;
  agent_id: string | null;
  ownership: ConversationOwnership;
  ai_enabled: boolean;
  status: ConversationStatus;
  source: ConversationSource;
  source_meta: Record<string, unknown> | null;
  stage: ConversationStage;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConversationDto {
  lead_id: string;
  agent_id?: string | null;
  ownership?: ConversationOwnership;
  ai_enabled?: boolean;
  source?: ConversationSource;
  source_meta?: Record<string, unknown> | null;
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly db: DatabaseService) {}

  private mapRow(row: any): Conversation {
    return {
      id: row.id,
      lead_id: row.lead_id,
      agent_id: row.agent_id ?? null,
      ownership: row.ownership ?? 'ai',
      ai_enabled: row.ai_enabled ?? true,
      status: row.status ?? 'open',
      source: row.source ?? 'organic',
      source_meta: row.source_meta ?? null,
      stage: row.stage ?? 'new',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Get-or-create open WhatsApp conversation for a lead.
   * Returns existing open conversation or creates one. Second value is true if newly created.
   */
  async getOrCreateForLead(leadId: string, dto?: Partial<CreateConversationDto>): Promise<{ conversation: Conversation; created: boolean }> {
    const { rows: existing } = await this.db.query(
      `SELECT id, lead_id, agent_id, ownership, ai_enabled, status, source, source_meta, stage, created_at, updated_at
       FROM conversations WHERE lead_id = $1 AND status = 'open' LIMIT 1`,
      [leadId],
    );
    if (existing.length > 0) {
      return { conversation: this.mapRow(existing[0]), created: false };
    }
    const { rows: created } = await this.db.query(
      `INSERT INTO conversations (lead_id, agent_id, ownership, ai_enabled, status, source, source_meta, updated_at)
       VALUES ($1, $2, $3, $4, 'open', $5, $6, NOW())
       RETURNING id, lead_id, agent_id, ownership, ai_enabled, status, source, source_meta, stage, created_at, updated_at`,
      [
        leadId,
        dto?.agent_id ?? null,
        dto?.ownership ?? 'ai',
        dto?.ai_enabled ?? true,
        dto?.source ?? 'organic',
        dto?.source_meta ? JSON.stringify(dto.source_meta) : null,
      ],
    );
    return { conversation: this.mapRow(created[0]), created: true };
  }

  async findById(id: string): Promise<Conversation | null> {
    const { rows } = await this.db.query(
      `SELECT id, lead_id, agent_id, ownership, ai_enabled, status, source, source_meta, stage, created_at, updated_at
       FROM conversations WHERE id = $1`,
      [id],
    );
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async findByLeadId(leadId: string, status?: ConversationStatus): Promise<Conversation | null> {
    let query = `SELECT id, lead_id, agent_id, ownership, ai_enabled, status, source, source_meta, stage, created_at, updated_at
                 FROM conversations WHERE lead_id = $1`;
    const params: any[] = [leadId];
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    query += ` ORDER BY updated_at DESC LIMIT 1`;
    const { rows } = await this.db.query(query, params);
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  /**
   * List conversations for a team (via lead.team_id). Optional filters.
   */
  async listForTeam(teamId: string, filters?: { status?: ConversationStatus; ownership?: ConversationOwnership }): Promise<Conversation[]> {
    let query = `
      SELECT c.id, c.lead_id, c.agent_id, c.ownership, c.ai_enabled, c.status, c.source, c.source_meta, c.stage, c.created_at, c.updated_at
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE l.team_id = $1`;
    const params: any[] = [teamId];
    if (filters?.status) {
      params.push(filters.status);
      query += ` AND c.status = $${params.length}`;
    }
    if (filters?.ownership) {
      params.push(filters.ownership);
      query += ` AND c.ownership = $${params.length}`;
    }
    query += ` ORDER BY c.updated_at DESC`;
    const { rows } = await this.db.query(query, params);
    return rows.map(this.mapRow);
  }

  async updateOwnership(id: string, ownership: ConversationOwnership): Promise<void> {
    await this.db.query(
      `UPDATE conversations SET ownership = $1, updated_at = NOW() WHERE id = $2`,
      [ownership, id],
    );
  }

  async setAiEnabled(id: string, aiEnabled: boolean): Promise<void> {
    await this.db.query(
      `UPDATE conversations SET ai_enabled = $1, updated_at = NOW() WHERE id = $2`,
      [aiEnabled, id],
    );
  }

  /**
   * Close conversation: set both status and stage to 'closed' for consistency (analytics, UI filters).
   */
  async closeConversation(id: string): Promise<void> {
    await this.db.query(
      `UPDATE conversations SET status = 'closed', stage = 'closed', updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  /**
   * Advance stage forward (never regress), except when closing.
   */
  async advanceStage(id: string, next: ConversationStage): Promise<void> {
    const order: ConversationStage[] = ['new', 'qualified', 'presented', 'escalated', 'converted', 'closed'];
    const { rows } = await this.db.query(`SELECT stage, status FROM conversations WHERE id = $1`, [id]);
    if (!rows.length) return;
    const current: ConversationStage = rows[0].stage ?? 'new';
    const status: ConversationStatus = rows[0].status ?? 'open';

    if (next === 'closed' || status === 'closed') {
      await this.closeConversation(id);
      return;
    }

    const curIdx = order.indexOf(current);
    const nextIdx = order.indexOf(next);
    if (nextIdx > curIdx) {
      await this.db.query(`UPDATE conversations SET stage = $1, updated_at = NOW() WHERE id = $2`, [next, id]);
    }
  }

  async updateSourceMeta(id: string, source: ConversationSource, sourceMeta: Record<string, unknown> | null): Promise<void> {
    await this.db.query(
      `UPDATE conversations SET source = $1, source_meta = $2, updated_at = NOW() WHERE id = $3`,
      [source, sourceMeta ? JSON.stringify(sourceMeta) : null, id],
    );
  }

  /**
   * Assert conversation belongs to team (via lead). Throws if not found or no access.
   */
  async assertTeamAccess(conversationId: string, teamId: string | null): Promise<Conversation> {
    const conv = await this.findById(conversationId);
    if (!conv) throw new Error('Conversation not found');
    const { rows } = await this.db.query(
      `SELECT team_id FROM leads WHERE id = $1`,
      [conv.lead_id],
    );
    if (!rows.length || rows[0].team_id !== teamId) throw new Error('Conversation not found');
    return conv;
  }
}
