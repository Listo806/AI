import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CrmService } from '../crm/crm.service';
import { ActivityFeedService } from '../crm/activity-feed.service';
import { leadScopeWhereClause } from '../crm/dashboard-scope-sql';

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

function mapSenderToLastMessageType(sender: string | null | undefined): 'ai' | 'human' | 'system' | null {
  if (!sender) return null;
  if (sender === 'ai') return 'ai';
  if (sender === 'agent' || sender === 'lead') return 'human';
  return 'system';
}

export interface QrConversationListItem {
  id: string;
  session_id: string;
  lead_id: string;
  contact_phone: string;
  owner_type: string;
  ai_enabled: boolean;
  last_activity_at: string | null;
  unread_count: number;
  status: string;
  property_id: string | null;
  /** User who owns the QR WhatsApp session for this row */
  qr_user_id: string;
  lead_name: string | null;
  last_message_type: 'ai' | 'human' | 'system' | null;
  last_action_label: string | null;
}

@Injectable()
export class WhatsAppQrConversationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly crm: CrmService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

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
    /** When lead came from a listing / property CTA */
    propertyId?: string | null;
  }): Promise<{ row: QrConversationRow; created: boolean }> {
    const existing = await this.findBySessionAndPhone(params.sessionId, params.contactPhone);
    if (existing) {
      if (params.propertyId && !(existing as any).property_id) {
        await this.db.query(
          `UPDATE whatsapp_qr_conversations SET property_id = $2, updated_at = NOW() WHERE id = $1`,
          [existing.id, params.propertyId],
        );
      }
      return { row: existing, created: false };
    }

    const { rows } = await this.db.query(
      `INSERT INTO whatsapp_qr_conversations
       (session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, last_message_at, unread_count, updated_at, property_id)
       VALUES ($1, $2, $3, $4, $5, 'ai', true, NOW(), 1, NOW(), $6)
       RETURNING id, session_id, user_id, team_id, lead_id, contact_phone, owner_type, ai_enabled, unread_count`,
      [
        params.sessionId,
        params.userId,
        params.teamId,
        params.leadId,
        params.contactPhone,
        params.propertyId ?? null,
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

  /**
   * Legacy: conversations for one user's QR session only (no role expansion).
   */
  async listByUserId(userId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.lead_id, c.contact_phone, c.owner_type, c.ai_enabled,
              c.last_message_at, c.last_message, c.last_message_type, c.property_id,
              c.unread_count, c.status, c.created_at,
              l.name AS lead_name
       FROM whatsapp_qr_conversations c
       INNER JOIN leads l ON l.id = c.lead_id
       WHERE c.user_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC`,
      [userId],
    );
    return rows;
  }

  /**
   * Role-scoped inbox: admin = all QR threads; owner = all teams they belong to; agent = own team.
   * Omits message bodies; adds last_message_type (ai|human|system) and last_action_label (events + ai_activity).
   */
  async listScopedForUser(user: {
    id: string;
    teamId: string | null;
    role: string;
  }): Promise<QrConversationListItem[]> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );
    const { clause, params } = leadScopeWhereClause(isGlobal, teamIds, user.id, 1);

    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.lead_id, c.contact_phone, c.owner_type, c.ai_enabled,
              c.last_message_at, c.unread_count, c.status, c.property_id, c.user_id AS qr_user_id,
              l.name AS lead_name
       FROM whatsapp_qr_conversations c
       INNER JOIN leads l ON l.id = c.lead_id
       WHERE ${clause}
       ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
       LIMIT 200`,
      params,
    );

    if (rows.length === 0) return [];

    const convIds = rows.map((r: { id: string }) => r.id);
    const leadIds = [...new Set(rows.map((r: { lead_id: string }) => r.lead_id))];

    const [senderRes, labels] = await Promise.all([
      this.db.query(
        `SELECT DISTINCT ON (m.conversation_id) m.conversation_id, m.sender_type
         FROM whatsapp_qr_messages m
         WHERE m.conversation_id = ANY($1::uuid[])
         ORDER BY m.conversation_id, m.created_at DESC`,
        [convIds],
      ),
      this.activityFeed.getLastActionLabelsForLeadIds(isGlobal, teamIds, leadIds),
    ]);

    const senderByConv = new Map<string, string>();
    for (const r of senderRes.rows as { conversation_id: string; sender_type: string }[]) {
      senderByConv.set(r.conversation_id, r.sender_type);
    }

    return rows.map((r: any) => ({
      id: r.id,
      session_id: r.session_id,
      lead_id: r.lead_id,
      contact_phone: r.contact_phone,
      owner_type: r.owner_type,
      ai_enabled: r.ai_enabled,
      last_activity_at: r.last_message_at ? new Date(r.last_message_at).toISOString() : null,
      unread_count: r.unread_count,
      status: r.status,
      property_id: r.property_id ?? null,
      qr_user_id: r.qr_user_id,
      lead_name: r.lead_name ?? null,
      last_message_type: mapSenderToLastMessageType(senderByConv.get(r.id)),
      last_action_label: labels.get(r.lead_id) ?? null,
    }));
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

  /**
   * Resolve a QR thread by phone within the same lead scope as {@link listScopedForUser}.
   * If multiple sessions share the same contact phone, returns the most recently active row.
   */
  async findScopedByContactPhone(
    user: { id: string; teamId: string | null; role: string },
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );
    const { clause, params } = leadScopeWhereClause(isGlobal, teamIds, user.id, 1);
    const allParams = [...params, contactPhone];
    const phoneIdx = params.length + 1;
    const { rows } = await this.db.query(
      `SELECT c.id, c.session_id, c.user_id, c.team_id, c.lead_id, c.contact_phone, c.owner_type, c.ai_enabled, c.unread_count
       FROM whatsapp_qr_conversations c
       INNER JOIN leads l ON l.id = c.lead_id
       WHERE c.contact_phone = $${phoneIdx} AND ${clause}
       ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
       LIMIT 1`,
      allParams,
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

  async setAiEnabledByConversationId(conversationId: string, aiEnabled: boolean): Promise<boolean> {
    const ownerType = aiEnabled ? 'ai' : 'human';
    const { rowCount } = await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET ai_enabled = $1, owner_type = $2, updated_at = NOW()
       WHERE id = $3`,
      [aiEnabled, ownerType, conversationId],
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
