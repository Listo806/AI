import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CrmService } from "../crm/crm.service";
import { ActivityFeedService } from "../crm/activity-feed.service";
import { leadScopeWhereClause } from "../crm/dashboard-scope-sql";
import OpenAI from "openai";

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
  last_message: string | null;

  lead_status: string | null;
  lead_priority: string | null;
  lead_source: string | null;

  assigned_agent_name: string | null;
  assigned_agent_email: string | null;

  property_title: string | null;
  property_city: string | null;
  property_state: string | null;
  property_price: number | string | null;
}

@Injectable()
export class WhatsAppQrConversationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly crm: CrmService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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
      `SELECT
              c.id,
              c.session_id,
              c.lead_id,
              c.contact_phone,
              c.owner_type,
              c.ai_enabled,
              c.last_message_at,
              c.last_message,
              c.last_message_type,
              c.unread_count,
              c.status,
              c.property_id,
              c.user_id AS qr_user_id,

              l.name AS lead_name,
              l.status AS lead_status,
              l.priority AS lead_priority,
              l.source AS lead_source,

              u.name AS assigned_agent_name,
              u.email AS assigned_agent_email,

              p.title AS property_title,
              p.city AS property_city,
              p.state AS property_state,
              p.price AS property_price

      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      LEFT JOIN users u ON u.id = l.assigned_to
      LEFT JOIN properties p ON p.id = COALESCE(c.property_id, l.property_id)
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

    return rows.map((r: any) => {
      const mappedSenderType = mapSenderToLastMessageType(
        senderByConv.get(r.id),
      );

      return {
        id: r.id,
        session_id: r.session_id,
        lead_id: r.lead_id,
        contact_phone: r.contact_phone,
        owner_type: r.owner_type,
        ai_enabled: r.ai_enabled,
        last_activity_at: r.last_message_at
          ? new Date(r.last_message_at).toISOString()
          : null,
        unread_count: Number(r.unread_count || 0),
        status: r.status,
        property_id: r.property_id ?? null,
        qr_user_id: r.qr_user_id,

        lead_name: r.lead_name ?? null,
        lead_status: r.lead_status ?? null,
        lead_priority: r.lead_priority ?? null,
        lead_source: r.lead_source ?? null,

        assigned_agent_name: r.assigned_agent_name ?? "Unassigned",
        assigned_agent_email: r.assigned_agent_email ?? null,

        property_title: r.property_title ?? null,
        property_city: r.property_city ?? null,
        property_state: r.property_state ?? null,
        property_price: r.property_price ?? null,

        last_message: r.last_message ?? null,
        last_message_type: mappedSenderType,
        last_action_label: labels.get(r.lead_id) ?? null,
      };
    });
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
          item.last_message ||
          item.last_action_label ||
          (item.last_message_type
            ? `${item.last_message_type} message`
            : "No recent action"),
      };
    });

    const appointmentsBooked = await this.db
      .query(
        `
    SELECT COUNT(*)::int total
    FROM appointments
    WHERE team_id IS NOT DISTINCT FROM $1
      AND created_at >= date_trunc('day', now())
  `,
        [user.teamId],
      )
      .catch(() => ({ rows: [{ total: 0 }] }));

    const avgResponseSeconds = await this.db
      .query(
        `
  SELECT
  COALESCE(
      ROUND(AVG(
        EXTRACT(EPOCH FROM (
            agent.created_at - lead.created_at
        ))
      )),0
  ) avg
  FROM whatsapp_qr_messages lead
  JOIN whatsapp_qr_messages agent
       ON agent.conversation_id=lead.conversation_id
      AND agent.direction='outbound'
      AND lead.direction='inbound'
      AND agent.created_at>lead.created_at
  `,
      )
      .catch(() => ({ rows: [{ avg: 0 }] }));

    const stats = [
      {
        label: "Active Conversations",
        value: totalConversations,
        subtext: `${unreadConversations} unread`,
        className: "text-blue",
        iconKey: "message",
      },
      {
        label: "AI Replies Today",
        value: Number(messageStats.aiRepliesToday || 0),
        subtext: weeklyTrend.text,
        className: weeklyTrend.className,
        iconKey: "bot",
      },
      {
        label: "Appointments Booked",
        value: appointmentsBooked.rows[0].total,
        subtext: "Booked today",
        className: "text-green",
        iconKey: "calendar",
      },
      {
        label: "Avg Response Time",
        value: `${avgResponseSeconds.rows[0].avg || 0}s`,
        subtext: "AI + Human",
        className: "text-green",
        iconKey: "clock",
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
      aiStatus: {
        active: aiHandled,
        human: humanHandled,
        conversationsToday: totalConversations,
        appointmentsToday: appointmentsBooked.rows[0].total,
        averageResponseTime: `${avgResponseSeconds.rows[0].avg || 0}s`,
      },
    };
  }

  async getConversationIntelligence(
    user: { id: string; teamId: string | null; role: string },
    contactPhone: string,
  ) {
    const conv = await this.findScopedByContactPhone(user, contactPhone);
    const { rows: convRows } = await this.db.query(
      `
      SELECT
          property_id
      FROM whatsapp_qr_conversations
      WHERE id = $1
      LIMIT 1
      `,
      [conv.id],
    );

    const conversationPropertyId = convRows[0]?.property_id ?? null;
    if (!conv) {
      return {
        score: 0,
        sentiment: "Unknown",
        intent: "Unknown",
        responseLikelihood: "0%",
        closeProbability: "0%",
        expectedRevenue: "$0",
        budget: "Unknown",
        timeline: "Unknown",
        ghostRisk: "0%",
        summary: "Conversation not found.",
        recommendedAction: "Select another conversation.",
        suggestedReplies: [],
      };
    }

    const { rows: leadRows } = await this.db.query(
      `
    SELECT
      id,
      name,
      email,
      phone,
      status,
      priority,
      source,
      notes,
      property_id,
      lead_metadata,
      parsed_city,
      parsed_country,
      parsed_budget_min,
      parsed_budget_max,
      parsed_intent,
      created_at,
      updated_at
    FROM leads
    WHERE id = $1
    LIMIT 1
    `,
      [conv.lead_id],
    );

    let property: any = null;

    const propertyId = leadRows[0]?.property_id || conversationPropertyId;

    if (propertyId) {
      const { rows: propertyRows } = await this.db.query(
        `
    SELECT
      id,
      title,
      city,
      state,
      price,
      type,
      status,
      bedrooms,
      bathrooms,
      square_feet,
      property_type,
      listing_type
    FROM properties
    WHERE id = $1
    LIMIT 1
    `,
        [propertyId],
      );

      property = propertyRows[0] || null;
    }

    const { rows: messageRows } = await this.db.query(
      `
    SELECT
      direction,
      sender_type,
      message_type,
      body,
      created_at
    FROM whatsapp_qr_messages
    WHERE conversation_id = $1
    ORDER BY created_at DESC
    LIMIT 30
    `,
      [conv.id],
    );

    const messages = messageRows.reverse();

    const context = {
      conversation: conv,
      lead: leadRows[0] || null,
      property,
      messages,
    };

    const systemPrompt = `
You are CORTEXA AI, a real estate WhatsApp conversation intelligence analyst.

Analyze this WhatsApp conversation and return ONLY valid JSON.

Return this exact shape:
{
  "score": 88,
  "sentiment": "Positive | Neutral | Negative",
  "intent": "Very High | High | Medium | Low",
  "responseLikelihood": "92%",
  "closeProbability": "78%",
  "expectedRevenue": "$325K",
  "budget": "$250K - $400K",
  "timeline": "Within 30 days",
  "ghostRisk": "12%",
  "summary": "Short useful summary",
  "recommendedAction": "One clear next best action",
  "suggestedReplies": [
    "Short WhatsApp reply option 1",
    "Short WhatsApp reply option 2",
    "Short WhatsApp reply option 3"
  ]
}

Rules:
- Use only the CRM and message data provided.
- If budget or revenue is missing, infer conservatively or return "Unknown".
- Keep suggested replies short, friendly, and professional.
- Same language as the lead if obvious.
`;

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `WHATSAPP CRM DATA:\n${JSON.stringify(context)}`,
              },
            ],
          },
        ],
      });

      const parsed = JSON.parse(response.output_text || "{}");

      return {
        lead: {
          id: leadRows[0]?.id ?? null,
          name: leadRows[0]?.name ?? null,
          phone: leadRows[0]?.phone ?? null,
          email: leadRows[0]?.email ?? null,
          status: leadRows[0]?.status ?? null,
          priority: leadRows[0]?.priority ?? null,
          source: leadRows[0]?.source ?? null,
        },

        property: property
          ? {
              id: property.id,
              title: property.title,
              city: property.city,
              state: property.state,
              price: property.price,
              type: property.type,
            }
          : null,
        score: Number(parsed.score || 0),
        sentiment: parsed.sentiment || "Unknown",
        intent: parsed.intent || "Unknown",
        responseLikelihood: parsed.responseLikelihood || "0%",
        closeProbability: parsed.closeProbability || "0%",
        expectedRevenue: parsed.expectedRevenue || "$0",
        budget: parsed.budget || "Unknown",
        timeline: parsed.timeline || "Unknown",
        ghostRisk: parsed.ghostRisk || "0%",
        summary: parsed.summary || "No summary available.",
        recommendedAction:
          parsed.recommendedAction || "Review the conversation and follow up.",
        suggestedReplies: Array.isArray(parsed.suggestedReplies)
          ? parsed.suggestedReplies.slice(0, 3)
          : [],
      };
    } catch (err) {
      console.error("WhatsApp intelligence AI error:", err);

      const fallbackScore = this.getConversationScore({
        unread_count: conv.unread_count,
        ai_enabled: conv.ai_enabled,
        last_activity_at: new Date().toISOString(),
      });

      return {
        lead: {
          id: leadRows[0]?.id ?? null,
          name: leadRows[0]?.name ?? null,
          phone: leadRows[0]?.phone ?? null,
          email: leadRows[0]?.email ?? null,
          status: leadRows[0]?.status ?? null,
          priority: leadRows[0]?.priority ?? null,
          source: leadRows[0]?.source ?? null,
        },

        property: property
          ? {
              id: property.id,
              title: property.title,
              city: property.city,
              state: property.state,
              price: property.price,
              type: property.type,
            }
          : null,
        score: fallbackScore,
        sentiment: fallbackScore >= 60 ? "Positive" : "Neutral",
        intent:
          fallbackScore >= 80
            ? "Very High"
            : fallbackScore >= 60
              ? "Medium"
              : "Low",
        responseLikelihood: `${Math.min(95, fallbackScore + 4)}%`,
        closeProbability: `${Math.max(8, fallbackScore - 10)}%`,
        expectedRevenue: "$0",
        budget: "Unknown",
        timeline: "Unknown",
        ghostRisk: `${Math.max(5, 100 - fallbackScore)}%`,
        summary: "Fallback intelligence generated from conversation activity.",
        recommendedAction: conv.ai_enabled
          ? "Let AI handle the next reply or send property options."
          : "Human owner selected. Review conversation and reply manually.",
        suggestedReplies: [
          "Thanks for your message. I can help you with the next steps.",
          "Would you like me to send more property details?",
          "What time works best for a quick follow-up?",
        ],
      };
    }
  }

  async getConversationTimeline(conversationId: string) {
    const events: any[] = [];

    // Conversation created
    const { rows: convRows } = await this.db.query(
      `
    SELECT created_at
    FROM whatsapp_qr_conversations
    WHERE id = $1
    `,
      [conversationId],
    );

    if (convRows.length) {
      events.push({
        id: `conversation-${conversationId}`,
        type: "system",
        title: "Conversation created",
        description: "WhatsApp conversation started.",
        created_at: convRows[0].created_at,
      });
    }

    // Messages
    const { rows: messages } = await this.db.query(
      `
    SELECT
      id,
      direction,
      sender_type,
      body,
      message_type,
      created_at
    FROM whatsapp_qr_messages
    WHERE conversation_id = $1
    ORDER BY created_at ASC
    `,
      [conversationId],
    );

    for (const msg of messages) {
      events.push({
        id: msg.id,
        type: msg.direction,
        title:
          msg.direction === "inbound"
            ? "Message received"
            : msg.sender_type === "ai"
              ? "AI replied"
              : "Agent replied",
        description: msg.body || `[${msg.message_type}]`,
        created_at: msg.created_at,
      });
    }

    events.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return events;
  }
}
