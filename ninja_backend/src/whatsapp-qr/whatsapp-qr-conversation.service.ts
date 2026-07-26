import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CrmService } from "../crm/crm.service";
import { ActivityFeedService } from "../crm/activity-feed.service";
import { leadScopeWhereClause } from "../crm/dashboard-scope-sql";
import { normalizeToE164 } from "./utils/phone-normalize.util";
import OpenAI from "openai";

export type QrConversationRow = {
  id: string;
  session_id: string;
  user_id: string;
  team_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  contact_phone: string;
  property_id?: string | null;
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

  lead_id: string | null;
  contact_id: string | null;

  contact_phone: string;
  owner_type: string;
  ai_enabled: boolean;
  last_activity_at: string | null;
  unread_count: number;
  status: string;
  property_id: string | null;
  qr_user_id: string;

  lead_name: string | null;
  lead_status: string | null;
  lead_priority: string | null;
  lead_source: string | null;

  contact_name: string | null;
  contact_status: string | null;
  contact_type: string | null;

  last_message_type: "ai" | "human" | "system" | null;
  last_action_label: string | null;
  last_message: string | null;

  assigned_agent_name: string | null;
  assigned_agent_email: string | null;

  property_title: string | null;
  property_city: string | null;
  property_state: string | null;
  property_price: number | string | null;
}

export type CrmConversationEntity = "lead" | "contact";

export interface ResolvedCrmConversation {
  id: string;
  session_id: string;
  user_id: string;
  team_id: string | null;

  lead_id: string | null;
  contact_id: string | null;

  contact_phone: string;
  owner_type: "ai" | "human";
  ai_enabled: boolean;
  unread_count: number;
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

  async findScopedByLeadId(
    user: {
      id: string;
      teamId: string | null;
      role: string;
    },
    leadId: string,
  ): Promise<ResolvedCrmConversation | null> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );

    const params: any[] = [leadId];
    const where: string[] = ["c.lead_id = $1"];

    if (!isGlobal) {
      params.push(user.id);
      const userIndex = params.length;

      if (teamIds.length > 0) {
        params.push(teamIds);
        const teamIndex = params.length;

        where.push(`
        (
          l.created_by = $${userIndex}
          OR l.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        where.push(`l.created_by = $${userIndex}`);
      }
    }

    const { rows } = await this.db.query(
      `
      SELECT
        c.id,
        c.session_id,
        c.user_id,
        c.team_id,
        c.lead_id,
        c.contact_id,
        c.contact_phone,
        c.owner_type,
        c.ai_enabled,
        c.unread_count
      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      WHERE ${where.join(" AND ")}
      ORDER BY
        c.last_message_at DESC NULLS LAST,
        c.updated_at DESC
      LIMIT 1
      `,
      params,
    );

    return rows[0] || null;
  }

  async getOrCreateByLead(
    user: {
      id: string;
      teamId: string | null;
      role: string;
    },
    leadId: string,
  ): Promise<ResolvedCrmConversation | null> {
    const existingByLead = await this.findScopedByLeadId(user, leadId);

    if (existingByLead) {
      return existingByLead;
    }

    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );

    const leadParams: any[] = [leadId];
    const leadWhere: string[] = ["l.id = $1"];

    if (!isGlobal) {
      leadParams.push(user.id);
      const userIndex = leadParams.length;

      if (teamIds.length > 0) {
        leadParams.push(teamIds);
        const teamIndex = leadParams.length;

        leadWhere.push(`
        (
          l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
          OR l.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        leadWhere.push(`
        (
          l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
        )
      `);
      }
    }

    const { rows: leadRows } = await this.db.query(
      `
    SELECT
      l.id,
      l.phone,
      l.contact_id,
      l.team_id,
      l.property_id,
      l.created_by,
      l.assigned_to
    FROM leads l
    WHERE ${leadWhere.join(" AND ")}
    LIMIT 1
    `,
      leadParams,
    );

    const lead = leadRows[0] || null;

    if (!lead) {
      return null;
    }

    const contactPhone = normalizeToE164(lead.phone);

    if (!contactPhone) {
      throw new Error(
        "Lead phone number is missing or invalid. Use a valid international phone number.",
      );
    }

    const { rows: sessionRows } = await this.db.query(
      `
    SELECT
      s.id,
      s.user_id,
      s.status,
      s.connected_at,
      s.updated_at
    FROM whatsapp_qr_sessions s
    WHERE s.user_id = $1
      AND s.status = 'connected'
    ORDER BY
      s.connected_at DESC NULLS LAST,
      s.updated_at DESC NULLS LAST
    LIMIT 1
    `,
      [user.id],
    );

    const session = sessionRows[0] || null;

    if (!session) {
      throw new Error(
        "No connected WhatsApp session is available. Connect WhatsApp first.",
      );
    }

    const reusableParams: any[] = [contactPhone];
    const reusableWhere: string[] = [
      `
    regexp_replace(
      COALESCE(c.contact_phone, ''),
      '[^0-9]',
      '',
      'g'
    ) = regexp_replace(
      $1,
      '[^0-9]',
      '',
      'g'
    )
    `,
    ];

    if (!isGlobal) {
      reusableParams.push(user.id);
      const userIndex = reusableParams.length;

      if (teamIds.length > 0) {
        reusableParams.push(teamIds);
        const teamIndex = reusableParams.length;

        reusableWhere.push(`
        (
          c.user_id = $${userIndex}
          OR c.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        reusableWhere.push(`c.user_id = $${userIndex}`);
      }
    }

    const { rows: reusableRows } = await this.db.query(
      `
    SELECT
      c.id,
      c.session_id,
      c.user_id,
      c.team_id,
      c.lead_id,
      c.contact_id,
      c.contact_phone,
      c.owner_type,
      c.ai_enabled,
      c.unread_count,
      c.property_id
    FROM whatsapp_qr_conversations c
    WHERE ${reusableWhere.join(" AND ")}
    ORDER BY
      c.last_message_at DESC NULLS LAST,
      c.updated_at DESC NULLS LAST
    LIMIT 1
    `,
      reusableParams,
    );

    const reusableConversation = reusableRows[0] || null;
    const conversationTeamId = lead.team_id || user.teamId || null;

    if (reusableConversation) {
      const { rows: updatedRows } = await this.db.query(
        `
      UPDATE whatsapp_qr_conversations
      SET
        session_id = $2,
        user_id = $3,
        team_id = COALESCE($4, team_id),
        lead_id = $5,
        contact_id = COALESCE($6, contact_id),
        contact_phone = $7,
        property_id = COALESCE($8, property_id),
        owner_type = 'human',
        ai_enabled = false,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        session_id,
        user_id,
        team_id,
        lead_id,
        contact_id,
        contact_phone,
        owner_type,
        ai_enabled,
        unread_count
      `,
        [
          reusableConversation.id,
          session.id,
          session.user_id,
          conversationTeamId,
          lead.id,
          lead.contact_id || null,
          contactPhone,
          lead.property_id || null,
        ],
      );

      return updatedRows[0] || null;
    }

    const created = await this.getOrCreate({
      sessionId: session.id,
      userId: session.user_id,
      teamId: conversationTeamId,
      leadId: lead.id,
      contactId: lead.contact_id || null,
      contactPhone,
      propertyId: lead.property_id || null,
    });

    return created.row;
  }

  async findScopedByContactId(
    user: {
      id: string;
      teamId: string | null;
      role: string;
    },
    contactId: string,
  ): Promise<ResolvedCrmConversation | null> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );
    const params: any[] = [contactId];
    const where: string[] = [
      `
    (
      c.contact_id = $1
      OR l.contact_id = $1
    )
    `,
    ];

    if (!isGlobal) {
      params.push(user.id);
      const userIndex = params.length;
      if (teamIds.length > 0) {
        params.push(teamIds);
        const teamIndex = params.length;
        where.push(`
        (
          c.user_id = $${userIndex}
          OR c.team_id = ANY($${teamIndex}::uuid[])

          OR l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
          OR l.team_id = ANY($${teamIndex}::uuid[])

          OR ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
          OR ct.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        where.push(`
        (
          c.user_id = $${userIndex}

          OR l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}

          OR ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
        )
      `);
      }
    }

    const { rows } = await this.db.query(
      `
        SELECT
          c.id,
          c.session_id,
          c.user_id,
          c.team_id,
          c.lead_id,
          COALESCE(c.contact_id, l.contact_id) AS contact_id,
          c.contact_phone,
          c.owner_type,
          c.ai_enabled,
          c.unread_count

        FROM whatsapp_qr_conversations c

        LEFT JOIN leads l
          ON l.id = c.lead_id

        LEFT JOIN contacts ct
          ON ct.id = COALESCE(c.contact_id, l.contact_id)

        WHERE ${where.join(" AND ")}

        ORDER BY
          c.last_message_at DESC NULLS LAST,
          c.updated_at DESC

        LIMIT 1
        `,
      params,
    );

    return rows[0] || null;
  }

  async resolveCrmConversation(
    user: {
      id: string;
      teamId: string | null;
      role: string;
    },
    entityType: CrmConversationEntity,
    entityId: string,
  ): Promise<ResolvedCrmConversation | null> {
    if (entityType === "lead") {
      return this.findScopedByLeadId(user, entityId);
    }

    return this.findScopedByContactId(user, entityId);
  }

  async findBySessionAndPhone(
    sessionId: string,
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const { rows } = await this.db.query(
      `
        SELECT
          id,
          session_id,
          user_id,
          team_id,
          lead_id,
          contact_id,
          contact_phone,
          owner_type,
          ai_enabled,
          unread_count,
          property_id
        FROM whatsapp_qr_conversations
        WHERE session_id = $1
          AND regexp_replace(
            COALESCE(contact_phone, ''),
            '[^0-9]',
            '',
            'g'
          ) = regexp_replace(
            $2,
            '[^0-9]',
            '',
            'g'
          )
        ORDER BY
          last_message_at DESC NULLS LAST,
          updated_at DESC
        LIMIT 1
        `,
      [sessionId, contactPhone],
    );

    return rows[0] || null;
  }

  async getOrCreate(params: {
    sessionId: string;
    userId: string;
    teamId: string | null;
    leadId: string;
    contactId?: string | null;
    contactPhone: string;
    propertyId?: string | null;
  }): Promise<{ row: QrConversationRow; created: boolean }> {
    const { rows: existingRows } = await this.db.query(
      `
      SELECT
        c.id,
        c.session_id,
        c.user_id,
        c.team_id,
        c.lead_id,
        c.contact_id,
        c.contact_phone,
        c.owner_type,
        c.ai_enabled,
        c.unread_count,
        c.property_id
      FROM whatsapp_qr_conversations c
      WHERE
        c.lead_id = $1

        OR (
          c.user_id = $2
          AND regexp_replace(
            COALESCE(c.contact_phone, ''),
            '[^0-9]',
            '',
            'g'
          ) = regexp_replace(
            $3,
            '[^0-9]',
            '',
            'g'
          )
        )

        OR (
          c.session_id = $4
          AND regexp_replace(
            COALESCE(c.contact_phone, ''),
            '[^0-9]',
            '',
            'g'
          ) = regexp_replace(
            $3,
            '[^0-9]',
            '',
            'g'
          )
        )

      ORDER BY
        CASE
          WHEN c.lead_id = $1 THEN 0
          WHEN c.user_id = $2 THEN 1
          ELSE 2
        END,
        c.updated_at DESC NULLS LAST
      LIMIT 1
      `,
      [params.leadId, params.userId, params.contactPhone, params.sessionId],
    );

    const existing = existingRows[0] || null;

    if (existing) {
      const { rows: updatedRows } = await this.db.query(
        `
      UPDATE whatsapp_qr_conversations
      SET
        session_id = $2,
        user_id = $3,
        team_id = COALESCE($4, team_id),
        lead_id = $5,
        contact_id = COALESCE($6, contact_id),
        contact_phone = $7,
        property_id = COALESCE($8, property_id),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        session_id,
        user_id,
        team_id,
        lead_id,
        contact_id,
        contact_phone,
        owner_type,
        ai_enabled,
        unread_count,
        property_id
      `,
        [
          existing.id,
          params.sessionId,
          params.userId,
          params.teamId,
          params.leadId,
          params.contactId ?? null,
          params.contactPhone,
          params.propertyId ?? null,
        ],
      );

      return {
        row: updatedRows[0],
        created: false,
      };
    }

    const { rows: createdRows } = await this.db.query(
      `
      INSERT INTO whatsapp_qr_conversations (
        session_id,
        user_id,
        team_id,
        lead_id,
        contact_id,
        contact_phone,
        owner_type,
        ai_enabled,
        last_message_at,
        unread_count,
        updated_at,
        property_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'human',
        false,
        NOW(),
        0,
        NOW(),
        $7
      )
      RETURNING
        id,
        session_id,
        user_id,
        team_id,
        lead_id,
        contact_id,
        contact_phone,
        owner_type,
        ai_enabled,
        unread_count,
        property_id
      `,
      [
        params.sessionId,
        params.userId,
        params.teamId,
        params.leadId,
        params.contactId ?? null,
        params.contactPhone,
        params.propertyId ?? null,
      ],
    );

    return {
      row: createdRows[0],
      created: true,
    };
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
      `SELECT
        c.id,
        c.session_id,
        c.lead_id,
        c.contact_id,
        c.contact_phone,
        c.owner_type,
        c.ai_enabled,
        c.last_message_at,
        c.last_message,
        c.last_message_type,
        c.property_id,
        c.unread_count,
        c.status,
        c.created_at,
        l.name AS lead_name,
        ct.name AS contact_name,
        ct.status AS contact_status,
        ct.type AS contact_type
      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      LEFT JOIN contacts ct ON ct.id = c.contact_id
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

    const params: any[] = [];
    const where: string[] = [
      `
    (
      c.lead_id IS NOT NULL
      OR c.contact_id IS NOT NULL
    )
    `,
    ];

    if (!isGlobal) {
      params.push(user.id);
      const userIndex = params.length;

      if (teamIds.length > 0) {
        params.push(teamIds);
        const teamIndex = params.length;

        where.push(`
        (
          c.user_id = $${userIndex}
          OR c.team_id = ANY($${teamIndex}::uuid[])

          OR l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
          OR l.team_id = ANY($${teamIndex}::uuid[])

          OR ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
          OR ct.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        where.push(`
        (
          c.user_id = $${userIndex}

          OR l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}

          OR ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
        )
      `);
      }
    }

    const { rows } = await this.db.query(
      `
    SELECT
      c.id,
      c.session_id,
      c.lead_id,
      c.contact_id,
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

      ct.name AS contact_name,
      ct.status AS contact_status,
      ct.type AS contact_type,

      u.name AS assigned_agent_name,
      u.email AS assigned_agent_email,

      p.title AS property_title,
      p.city AS property_city,
      p.state AS property_state,
      p.price AS property_price

    FROM whatsapp_qr_conversations c

    LEFT JOIN leads l
      ON l.id = c.lead_id

    LEFT JOIN contacts ct
      ON ct.id = COALESCE(c.contact_id, l.contact_id)

    LEFT JOIN users u
      ON u.id = COALESCE(l.assigned_to, ct.assigned_to)

    LEFT JOIN properties p
      ON p.id = COALESCE(c.property_id, l.property_id)

    WHERE ${where.join(" AND ")}

    ORDER BY
      c.last_message_at DESC NULLS LAST,
      c.updated_at DESC

    LIMIT 200
    `,
      params,
    );

    if (rows.length === 0) {
      return [];
    }

    const convIds = rows.map((row: any) => row.id);

    const leadIds = [
      ...new Set(rows.map((row: any) => row.lead_id).filter(Boolean)),
    ] as string[];

    const senderRes = await this.db.query(
      `
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.sender_type
    FROM whatsapp_qr_messages m
    WHERE m.conversation_id = ANY($1::uuid[])
    ORDER BY
      m.conversation_id,
      m.created_at DESC
    `,
      [convIds],
    );

    const labels =
      leadIds.length > 0
        ? await this.activityFeed.getLastActionLabelsForLeadIds(
            isGlobal,
            teamIds,
            leadIds,
          )
        : new Map<string, string>();

    const senderByConv = new Map<string, string>();

    for (const row of senderRes.rows) {
      senderByConv.set(row.conversation_id, row.sender_type);
    }

    return rows.map((row: any) => ({
      id: row.id,
      session_id: row.session_id,

      lead_id: row.lead_id ?? null,
      contact_id: row.contact_id ?? null,

      contact_phone: row.contact_phone,
      owner_type: row.owner_type,
      ai_enabled: row.ai_enabled,

      last_activity_at: row.last_message_at
        ? new Date(row.last_message_at).toISOString()
        : null,

      unread_count: Number(row.unread_count || 0),
      status: row.status,
      property_id: row.property_id ?? null,
      qr_user_id: row.qr_user_id,

      lead_name: row.lead_name ?? null,
      lead_status: row.lead_status ?? null,
      lead_priority: row.lead_priority ?? null,
      lead_source: row.lead_source ?? null,

      contact_name: row.contact_name ?? null,
      contact_status: row.contact_status ?? null,
      contact_type: row.contact_type ?? null,

      assigned_agent_name: row.assigned_agent_name ?? "Unassigned",

      assigned_agent_email: row.assigned_agent_email ?? null,

      property_title: row.property_title ?? null,
      property_city: row.property_city ?? null,
      property_state: row.property_state ?? null,
      property_price: row.property_price ?? null,

      last_message: row.last_message ?? null,

      last_message_type: mapSenderToLastMessageType(senderByConv.get(row.id)),

      last_action_label: row.lead_id ? (labels.get(row.lead_id) ?? null) : null,
    }));
  }

  async findByUserAndPhone(
    userId: string,
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const { rows } = await this.db.query(
      `SELECT id, session_id, user_id, team_id, lead_id, contact_id, contact_phone, owner_type, ai_enabled, unread_count
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
    user: {
      id: string;
      teamId?: string | null;
      team_id?: string | null;
      role: string;
    },
    contactPhone: string,
  ): Promise<QrConversationRow | null> {
    const normalizedTeamId = user.teamId || user.team_id || null;

    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      normalizedTeamId,
      user.role,
    );

    const values: any[] = [contactPhone];
    const where: string[] = ["c.contact_phone = $1"];

    if (!isGlobal) {
      values.push(user.id);
      const userIndex = values.length;

      if (teamIds.length > 0) {
        values.push(teamIds);
        const teamIndex = values.length;

        where.push(`
        (
          l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
          OR l.team_id = ANY($${teamIndex}::uuid[])
          OR c.user_id = $${userIndex}
          OR c.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        where.push(`
        (
          l.created_by = $${userIndex}
          OR l.assigned_to = $${userIndex}
          OR c.user_id = $${userIndex}
        )
      `);
      }
    }

    const { rows } = await this.db.query(
      `
      SELECT
        c.id,
        c.session_id,
        c.user_id,
        c.team_id,
        c.lead_id,
        c.contact_id,
        c.contact_phone,
        c.owner_type,
        c.ai_enabled,
        c.unread_count,
        c.property_id,
        c.last_message_at,
        c.updated_at
      FROM whatsapp_qr_conversations c
      LEFT JOIN leads l
        ON l.id = c.lead_id
      WHERE ${where.join(" AND ")}
      ORDER BY
        c.last_message_at DESC NULLS LAST,
        c.updated_at DESC
      LIMIT 1
      `,
      values,
    );

    return rows[0] || null;
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
       WHERE user_id = $1
        AND regexp_replace(
              COALESCE(contact_phone, ''),
              '[^0-9]',
              '',
              'g'
            ) = regexp_replace(
              $2,
              '[^0-9]',
              '',
              'g'
            )`,
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

      const rawLastMessage = String(item.last_message || "").trim();

      const invalidLastMessages = new Set([
        "[text]",
        "[message]",
        "text",
        "null",
        "undefined",
      ]);

      const hasValidLastMessage =
        rawLastMessage.length > 0 &&
        !invalidLastMessages.has(rawLastMessage.toLowerCase());

      return {
        ...item,
        displayName: item.lead_name || item.contact_phone || "WhatsApp Lead",
        timeAgo: this.formatTimeAgo(item.last_activity_at),
        score,
        tag,
        lastMessage: hasValidLastMessage ? rawLastMessage : "No messages yet",
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
  -- Average time from each inbound message to its NEXT outbound reply.
  -- (Pairing with only the next reply avoids the inflated cross-join average.)
  -- Scoped to this user's team/conversations so it never averages in
  -- other accounts' or old test data (mirrors the messageStats query above).
  WITH scoped AS (
    SELECT c.id
    FROM whatsapp_qr_conversations c
    INNER JOIN leads l ON l.id = c.lead_id
    WHERE ${user.teamId ? "c.team_id = $1" : "c.user_id = $1"}
  )
  SELECT COALESCE(ROUND(AVG(resp_sec)), 0) AS avg
  FROM (
    SELECT EXTRACT(EPOCH FROM (
      (SELECT MIN(a.created_at)
         FROM whatsapp_qr_messages a
        WHERE a.conversation_id = m.conversation_id
          AND a.direction = 'outbound'
          AND a.created_at > m.created_at) - m.created_at
    )) AS resp_sec
    FROM whatsapp_qr_messages m
    WHERE m.direction = 'inbound'
      AND m.conversation_id IN (SELECT id FROM scoped)
  ) t
  WHERE t.resp_sec IS NOT NULL
  `,
        [user.teamId || user.id],
      )
      .catch(() => ({ rows: [{ avg: 0 }] }));

    // Format the average response time as a readable duration (e.g. "2m 5s").
    const avgResponseSec = Math.round(
      Number(avgResponseSeconds.rows[0]?.avg) || 0,
    );
    const avgResponseLabel =
      avgResponseSec <= 0
        ? '0s'
        : avgResponseSec < 60
          ? `${avgResponseSec}s`
          : avgResponseSec < 3600
            ? `${Math.floor(avgResponseSec / 60)}m ${avgResponseSec % 60}s`
            : `${Math.floor(avgResponseSec / 3600)}h ${Math.floor(
                (avgResponseSec % 3600) / 60,
              )}m`;

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
        value: avgResponseLabel,
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
        averageResponseTime: avgResponseLabel,
      },
    };
  }

  async getConversationIntelligence(
    user: {
      id: string;
      teamId?: string | null;
      team_id?: string | null;
      role: string;
    },
    contactPhone: string,
  ) {
    // 1. Tìm conversation theo phone và quyền user
    const conv = await this.findScopedByContactPhone(user, contactPhone);

    // 2. Không tìm thấy conversation thì trả dữ liệu rỗng
    if (!conv) {
      return {
        lead: null,
        contact: null,
        property: null,
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

    // 3. Lấy property_id và contact_id trực tiếp từ conversation
    const { rows: convRows } = await this.db.query(
      `
    SELECT
      property_id,
      contact_id
    FROM whatsapp_qr_conversations
    WHERE id = $1
    LIMIT 1
    `,
      [conv.id],
    );

    const conversationPropertyId = convRows[0]?.property_id ?? null;

    const conversationContactId = convRows[0]?.contact_id ?? null;

    // 4. Lấy Lead nếu conversation có lead_id
    let lead: any = null;

    if (conv.lead_id) {
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

      lead = leadRows[0] || null;
    }

    // 5. Lấy Contact nếu conversation có contact_id
    let contact: any = null;

    if (conversationContactId) {
      const { rows: contactRows } = await this.db.query(
        `
      SELECT
        id,
        name,
        email,
        phone,
        type,
        status,
        source,
        notes,
        score,
        created_at,
        updated_at
      FROM contacts
      WHERE id = $1
      LIMIT 1
      `,
        [conversationContactId],
      );

      contact = contactRows[0] || null;
    }

    // 6. Lấy Property
    let property: any = null;

    const propertyId = lead?.property_id || conversationPropertyId;

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

    // 7. Lấy 30 messages gần nhất
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

    // 8. Context gửi cho OpenAI
    const context = {
      conversation: conv,
      lead,
      contact,
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
            content: [
              {
                type: "input_text",
                text: systemPrompt,
              },
            ],
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
        lead: lead
          ? {
              id: lead.id,
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              status: lead.status,
              priority: lead.priority,
              source: lead.source,
            }
          : null,

        contact: contact
          ? {
              id: contact.id,
              name: contact.name,
              phone: contact.phone,
              email: contact.email,
              type: contact.type,
              status: contact.status,
              source: contact.source,
            }
          : null,

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
        lead: lead
          ? {
              id: lead.id,
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              status: lead.status,
              priority: lead.priority,
              source: lead.source,
            }
          : null,

        contact: contact
          ? {
              id: contact.id,
              name: contact.name,
              phone: contact.phone,
              email: contact.email,
              type: contact.type,
              status: contact.status,
              source: contact.source,
            }
          : null,

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

  async getConversationTimeline(conversationId: string, page = 1, limit = 20) {
    const safePage = Math.max(Number(page || 1), 1);
    const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 50);
    const offset = (safePage - 1) * safeLimit;

    const { rows: countRows } = await this.db.query(
      `
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT id FROM whatsapp_qr_messages WHERE conversation_id = $1
      UNION ALL
      SELECT id FROM whatsapp_qr_conversations WHERE id = $1
    ) x
    `,
      [conversationId],
    );

    const total = Number(countRows[0]?.total || 0);

    const { rows } = await this.db.query(
      `
    WITH events AS (
      SELECT
        ('conversation-' || c.id)::text AS id,
        'system'::text AS type,
        'Conversation created'::text AS title,
        'WhatsApp conversation started.'::text AS description,
        c.created_at AS created_at
      FROM whatsapp_qr_conversations c
      WHERE c.id = $1

      UNION ALL

      SELECT
        m.id::text AS id,
        m.direction::text AS type,
        CASE
          WHEN m.direction = 'inbound' THEN 'Message received'
          WHEN m.sender_type = 'ai' THEN 'AI replied'
          ELSE 'Agent replied'
        END AS title,
        CASE
            WHEN NULLIF(TRIM(m.body), '') IS NOT NULL
                THEN m.body
            WHEN m.message_type = 'image'
                THEN '📷 Photo'
            WHEN m.message_type = 'audio'
                THEN '🎤 Voice message'
            WHEN m.message_type = 'video'
                THEN '🎥 Video'
            WHEN m.message_type = 'document'
                THEN '📄 Document'
            ELSE 'Message'
        END AS description,
        m.created_at AS created_at
      FROM whatsapp_qr_messages m
      WHERE m.conversation_id = $1
    )
    SELECT *
    FROM events
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
      [conversationId, safeLimit, offset],
    );

    return {
      items: rows,
      page: safePage,
      limit: safeLimit,
      total,
      hasMore: offset + rows.length < total,
    };
  }

  async generateAiAssistReply(
    user: { id: string; teamId: string | null; role: string },
    contactPhone: string,
  ) {
    const conv = await this.findScopedByContactPhone(user, contactPhone);

    if (!conv) {
      return {
        text: "",
        reason: "Conversation not found.",
      };
    }

    const { rows: leadRows } = await this.db.query(
      `
    SELECT
      id,
      name,
      phone,
      email,
      status,
      priority,
      source,
      notes,
      parsed_intent,
      parsed_budget_min,
      parsed_budget_max,
      parsed_city,
      parsed_country
    FROM leads
    WHERE id = $1
    LIMIT 1
    `,
      [conv.lead_id],
    );

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
      AND body IS NOT NULL
      AND TRIM(body) <> ''
    ORDER BY created_at DESC
    LIMIT 25
    `,
      [conv.id],
    );

    const messages = messageRows.reverse();

    const systemPrompt = `
You are CORTEXA AI, a real estate CRM WhatsApp copilot.

Generate ONE helpful WhatsApp reply for the agent to send.

Rules:
- Do not send it yourself.
- Keep it short, natural, and professional.
- Same language as the lead if obvious.
- Do not invent property details.
- If missing information, ask one clear follow-up question.
- Output ONLY the reply text. No JSON. No markdown.
`;

    const context = {
      lead: leadRows[0] || null,
      conversation: {
        id: conv.id,
        ai_enabled: conv.ai_enabled,
        owner_type: conv.owner_type,
        unread_count: conv.unread_count,
      },
      messages,
    };

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
                text: `CRM WHATSAPP CONTEXT:\n${JSON.stringify(context)}`,
              },
            ],
          },
        ],
      });

      const text = String(response.output_text || "").trim();

      return {
        text:
          text ||
          "Thanks for your message. I can help with that. What would be the best time to follow up?",
        reason: "generated",
      };
    } catch (err) {
      console.error("WhatsApp AI Assist error:", err);

      return {
        text: "Thanks for your message. I can help with that. What would be the best time to follow up?",
        reason: "fallback",
      };
    }
  }

  async attachConnectedSession(
    conversationId: string,
    params: {
      sessionId: string;
      userId: string;
    },
  ) {
    const { rows } = await this.db.query(
      `
    UPDATE whatsapp_qr_conversations
    SET
      session_id = $2,
      user_id = $3,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      session_id,
      user_id,
      team_id,
      lead_id,
      contact_phone
    `,
      [conversationId, params.sessionId, params.userId],
    );

    return rows[0] || null;
  }

  async getOrCreateByContact(
    user: {
      id: string;
      teamId: string | null;
      role: string;
    },
    contactId: string,
  ): Promise<ResolvedCrmConversation | null> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(
      user.id,
      user.teamId,
      user.role,
    );

    const params: any[] = [contactId];
    const where: string[] = ["ct.id = $1"];

    if (!isGlobal) {
      params.push(user.id);
      const userIndex = params.length;

      if (teamIds.length > 0) {
        params.push(teamIds);
        const teamIndex = params.length;

        where.push(`
        (
          ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
          OR ct.team_id = ANY($${teamIndex}::uuid[])
        )
      `);
      } else {
        where.push(`
        (
          ct.created_by = $${userIndex}
          OR ct.assigned_to = $${userIndex}
        )
      `);
      }
    }

    const { rows: contactRows } = await this.db.query(
      `
    SELECT
      ct.id,
      ct.phone,
      ct.team_id,
      ct.lead_id
    FROM contacts ct
    WHERE ${where.join(" AND ")}
    LIMIT 1
    `,
      params,
    );

    const contact = contactRows[0] || null;

    if (!contact) {
      return null;
    }

    const contactPhone = normalizeToE164(contact.phone);

    if (!contactPhone) {
      throw new Error(
        "Contact phone number is missing or invalid. Use a valid international phone number.",
      );
    }

    const { rows: sessionRows } = await this.db.query(
      `
    SELECT
      id,
      user_id,
      status,
      connected_at,
      updated_at
    FROM whatsapp_qr_sessions
    WHERE user_id = $1
      AND status = 'connected'
    ORDER BY
      connected_at DESC NULLS LAST,
      updated_at DESC NULLS LAST
    LIMIT 1
    `,
      [user.id],
    );

    const session = sessionRows[0] || null;

    if (!session) {
      throw new Error(
        "No connected WhatsApp session is available. Connect WhatsApp first.",
      );
    }

    let linkedLeadId = contact.lead_id ?? null;

    if (!linkedLeadId) {
      const { rows: leadRows } = await this.db.query(
        `
      SELECT id
      FROM leads
      WHERE contact_id = $1
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1
      `,
        [contact.id],
      );

      linkedLeadId = leadRows[0]?.id ?? null;
    }

    const created = await this.getOrCreate({
      sessionId: session.id,
      userId: session.user_id,
      teamId: contact.team_id || user.teamId || null,
      leadId: linkedLeadId,
      contactId: contact.id,
      contactPhone,
      propertyId: null,
    });

    return created.row as ResolvedCrmConversation;
  }
}
