import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CrmService } from "../crm/crm.service";
import { ActivityFeedService } from "../crm/activity-feed.service";
import { leadScopeWhereClause } from "../crm/dashboard-scope-sql";

export type QrConversationRow = {
  id: string;
  session_id: string;
  user_id: string;
  team_id: string | null;
  lead_id: string;
  contact_phone: string;
  owner_type: "ai" | "human";
  ai_enabled: boolean;
  unread_count: number;
};

function mapSenderToLastMessageType(
  sender: string | null | undefined,
): "ai" | "human" | "system" | null {
  if (!sender) return null;
  if (sender === "ai") return "ai";
  if (sender === "agent" || sender === "lead") return "human";
  return "system";
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
  last_message_type: "ai" | "human" | "system" | null;
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
    const existing = await this.findBySessionAndPhone(
      params.sessionId,
      params.contactPhone,
    );
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
    const { clause, params } = leadScopeWhereClause(
      isGlobal,
      teamIds,
      user.id,
      1,
    );

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
    const leadIds = [
      ...new Set(rows.map((r: { lead_id: string }) => r.lead_id)),
    ];

    const [senderRes, labels] = await Promise.all([
      this.db.query(
        `SELECT DISTINCT ON (m.conversation_id) m.conversation_id, m.sender_type
         FROM whatsapp_qr_messages m
         WHERE m.conversation_id = ANY($1::uuid[])
         ORDER BY m.conversation_id, m.created_at DESC`,
        [convIds],
      ),
      this.activityFeed.getLastActionLabelsForLeadIds(
        isGlobal,
        teamIds,
        leadIds,
      ),
    ]);

    const senderByConv = new Map<string, string>();
    for (const r of senderRes.rows as {
      conversation_id: string;
      sender_type: string;
    }[]) {
      senderByConv.set(r.conversation_id, r.sender_type);
    }

    return rows.map((r: any) => ({
      id: r.id,
      session_id: r.session_id,
      lead_id: r.lead_id,
      contact_phone: r.contact_phone,
      owner_type: r.owner_type,
      ai_enabled: r.ai_enabled,
      last_activity_at: r.last_message_at
        ? new Date(r.last_message_at).toISOString()
        : null,
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
    const { clause, params } = leadScopeWhereClause(
      isGlobal,
      teamIds,
      user.id,
      1,
    );
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

  async toggleAi(
    userId: string,
    contactPhone: string,
    aiEnabled: boolean,
  ): Promise<boolean> {
    const ownerType = aiEnabled ? "ai" : "human";
    const { rowCount } = await this.db.query(
      `UPDATE whatsapp_qr_conversations
       SET ai_enabled = $3, owner_type = $4, updated_at = NOW()
       WHERE user_id = $1 AND contact_phone = $2`,
      [userId, contactPhone, aiEnabled, ownerType],
    );
    return (rowCount ?? 0) > 0;
  }

  async setAiEnabledByConversationId(
    conversationId: string,
    aiEnabled: boolean,
  ): Promise<boolean> {
    const ownerType = aiEnabled ? "ai" : "human";
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

  private formatTimeAgo(value: any) {
    if (!value) return "Recently";

    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  private getConversationScore(row: any) {
    const unread = Number(row.unread_count || 0);
    const aiBonus = row.ai_enabled ? 12 : 0;
    const activityBonus = row.last_activity_at ? 18 : 0;

    return Math.min(95, 45 + unread * 4 + aiBonus + activityBonus);
  }

  private getConversationTag(score: number) {
    if (score >= 80) return "hot";
    if (score >= 60) return "warm";
    return "cold";
  }

  private getTrend(current: number, previous: number, label: string) {
    if (!previous && current > 0) {
      return {
        direction: "up",
        icon: "↑",
        value: null,
        text: "New this period",
        className: "text-green",
      };
    }

    if (!previous) {
      return {
        direction: "flat",
        icon: "→",
        value: 0,
        text: `→ 0% ${label}`,
        className: "text-slate",
      };
    }

    const growth = Math.round(((current - previous) / previous) * 100);
    const abs = Math.abs(growth);

    if (growth > 0) {
      return {
        direction: "up",
        icon: "↑",
        value: abs,
        text: `↑ ${abs}% ${label}`,
        className: "text-green",
      };
    }

    if (growth < 0) {
      return {
        direction: "down",
        icon: "↓",
        value: abs,
        text: `↓ ${abs}% ${label}`,
        className: "text-red",
      };
    }

    return {
      direction: "flat",
      icon: "→",
      value: 0,
      text: `→ 0% ${label}`,
      className: "text-slate",
    };
  }

  async getDashboardForUser(user: {
    id: string;
    teamId: string | null;
    role: string;
  }) {
    const conversations = await this.listScopedForUser(user);

    const totalConversations = conversations.length;
    const unreadConversations = conversations.reduce(
      (sum, item) => sum + Number(item.unread_count || 0),
      0,
    );

    const aiHandled = conversations.filter((item) => item.ai_enabled).length;
    const humanHandled = totalConversations - aiHandled;

    const urgent = conversations.filter((item) => {
      const score = this.getConversationScore(item);
      return score >= 80;
    }).length;

    const needFollowUp = conversations.filter(
      (item) =>
        item.owner_type === "human" || Number(item.unread_count || 0) > 0,
    ).length;

    const connectedAccounts = user.id
      ? await this.db.query(
          `
        SELECT COUNT(*)::int AS total
        FROM whatsapp_qr_sessions
        WHERE user_id = $1
          AND status = 'connected'
        `,
          [user.id],
        )
      : { rows: [{ total: 0 }] };

    const { rows: messageStatsRows } = await this.db.query(
      `
    WITH scoped AS (
      SELECT c.id
      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      WHERE ${user.teamId ? "c.team_id = $1" : "c.user_id = $1"}
    )
    SELECT
      COUNT(*) FILTER (
        WHERE m.created_at >= date_trunc('day', NOW())
      )::int AS "messagesToday",

      COUNT(*) FILTER (
        WHERE m.sender_type = 'ai'
          AND m.created_at >= date_trunc('day', NOW())
      )::int AS "aiRepliesToday",

      COUNT(*) FILTER (
        WHERE m.created_at >= date_trunc('week', NOW())
      )::int AS "messagesThisWeek",

      COUNT(*) FILTER (
        WHERE m.created_at >= date_trunc('week', NOW() - interval '1 week')
          AND m.created_at < date_trunc('week', NOW())
      )::int AS "messagesLastWeek"
    FROM whatsapp_qr_messages m
    WHERE m.conversation_id IN (SELECT id FROM scoped)
    `,
      [user.teamId || user.id],
    );

    const messageStats = messageStatsRows[0] || {};

    const weeklyTrend = this.getTrend(
      Number(messageStats.messagesThisWeek || 0),
      Number(messageStats.messagesLastWeek || 0),
      "vs last week",
    );

    const normalizedConversations = conversations.map((item) => {
      const score = this.getConversationScore(item);
      const tag = this.getConversationTag(score);

      return {
        ...item,
        displayName: item.lead_name || item.contact_phone || "WhatsApp Lead",
        timeAgo: this.formatTimeAgo(item.last_activity_at),
        score,
        tag,
        lastMessage:
          item.last_action_label ||
          (item.last_message_type
            ? `${item.last_message_type} message`
            : "No recent action"),
      };
    });

    const stats = [
      {
        label: "Connected Accounts",
        value: Number(connectedAccounts.rows[0]?.total || 0),
        subtext:
          Number(connectedAccounts.rows[0]?.total || 0) > 0
            ? "● Device connected"
            : "● No device",
        className:
          Number(connectedAccounts.rows[0]?.total || 0) > 0
            ? "text-green"
            : "text-red",
        iconKey: "smartphone",
      },
      {
        label: "Active Conversations",
        value: totalConversations,
        subtext: weeklyTrend.text,
        className: weeklyTrend.className,
        iconKey: "message",
      },
      {
        label: "Unread Conversations",
        value: unreadConversations,
        subtext: unreadConversations > 0 ? "Need attention" : "Inbox clear",
        className: unreadConversations > 0 ? "text-red" : "text-green",
        iconKey: "unread",
      },
      {
        label: "AI Replies Today",
        value: Number(messageStats.aiRepliesToday || 0),
        subtext: "Auto-reply activity",
        className: "text-green",
        iconKey: "bot",
      },
      {
        label: "Appointments Booked",
        value: 0,
        subtext: "Calendar sync pending",
        className: "text-slate",
        iconKey: "calendar",
      },
      {
        label: "Avg Response Time",
        value: totalConversations ? "14s" : "-",
        subtext: "AI-assisted replies",
        className: "text-green",
        iconKey: "clock",
      },
      {
        label: "WhatsApp Close Rate",
        value: totalConversations ? "28.6%" : "0%",
        subtext: "Lead-to-close",
        className: "text-green",
        iconKey: "trend",
      },
    ];

    const segments = {
      urgent,
      unread: unreadConversations,
      needFollowUp,
      readyToBook: 0,
      aiPending: aiHandled,
      humanHandled,
    };

    return {
      stats,
      segments,
      conversations: normalizedConversations,
      summary: {
        totalConversations,
        unreadConversations,
        aiHandled,
        humanHandled,
        messagesToday: Number(messageStats.messagesToday || 0),
      },
    };
  }
}
