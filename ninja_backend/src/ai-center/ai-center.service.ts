import { Injectable, ForbiddenException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import OpenAI from "openai";
import { S3Service } from "../common/aws/s3.service";

const ALLOWED_TONES = ["professional", "friendly", "sales"] as const;
export type AutoReplyTone = (typeof ALLOWED_TONES)[number];

export interface OverviewResponse {
  ai_auto_reply: { enabled: boolean; tone: string };
  ai_appointment_setter: { enabled: boolean };
  active_channels: string[];
  connected_calendars: string[];
  recent_ai_actions: RecentAiAction[];
}

export interface RecentAiAction {
  id: string;
  timestamp: string;
  action: string;
  lead_id: string | null;
  channel: string | null;
  outcome: string | null;
  metadata?: Record<string, unknown>;
}

export interface AutoReplyResponse {
  enabled: boolean;
  tone: string;
}

export interface AppointmentSetterStatusResponse {
  enabled: boolean;
  appointments_booked_count: number;
  conversion_rate: number;
  leads_qualified_count: number;
  escalated_to_human_count: number;
  connected_channels: string[];
  connected_calendars: string[];
}

@Injectable()
export class AiCenterService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  constructor(
    private readonly db: DatabaseService,
    private readonly s3Service: S3Service,
  ) {}

  async getOverview(teamId: string): Promise<OverviewResponse> {
    const [team, recent] = await Promise.all([
      this.getTeamAiSettings(teamId),
      this.getRecentAiActions(teamId, 5),
    ]);
    const activeChannels = await this.getActiveChannels(teamId);

    return {
      ai_auto_reply: {
        enabled: team.ai_auto_reply_enabled ?? true,
        tone: team.ai_auto_reply_tone ?? "professional",
      },
      ai_appointment_setter: {
        enabled: team.ai_appointment_setter_enabled ?? false,
      },
      active_channels: activeChannels,
      connected_calendars: [],
      recent_ai_actions: recent,
    };
  }

  async getAutoReply(teamId: string): Promise<AutoReplyResponse> {
    const team = await this.getTeamAiSettings(teamId);
    return {
      enabled: team.ai_auto_reply_enabled ?? true,
      tone: team.ai_auto_reply_tone ?? "professional",
    };
  }

  async setAutoReply(
    teamId: string,
    body: { enabled?: boolean; tone?: string },
  ): Promise<AutoReplyResponse> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let n = 1;

    if (body.enabled !== undefined) {
      updates.push(`ai_auto_reply_enabled = $${n++}`);
      params.push(body.enabled);
    }
    if (body.tone !== undefined) {
      if (!ALLOWED_TONES.includes(body.tone as AutoReplyTone)) {
        throw new ForbiddenException("Invalid tone");
      }
      updates.push(`ai_auto_reply_tone = $${n++}`);
      params.push(body.tone);
    }

    if (updates.length === 0) return this.getAutoReply(teamId);

    params.push(teamId);
    await this.db.query(
      `UPDATE teams SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${n}`,
      params,
    );
    return this.getAutoReply(teamId);
  }

  async enableAppointmentSetter(teamId: string): Promise<{ ok: boolean }> {
    await this.db.query(
      `UPDATE teams SET ai_appointment_setter_enabled = true, updated_at = NOW() WHERE id = $1`,
      [teamId],
    );
    return { ok: true };
  }

  async disableAppointmentSetter(teamId: string): Promise<{ ok: boolean }> {
    await this.db.query(
      `UPDATE teams SET ai_appointment_setter_enabled = false, updated_at = NOW() WHERE id = $1`,
      [teamId],
    );
    return { ok: true };
  }

  async getAppointmentSetterStatus(
    teamId: string,
  ): Promise<AppointmentSetterStatusResponse> {
    const team = await this.getTeamAiSettings(teamId);
    const connectedChannels = await this.getActiveChannels(teamId);

    return {
      enabled: team.ai_appointment_setter_enabled ?? false,
      appointments_booked_count: 0,
      conversion_rate: 0,
      leads_qualified_count: 0,
      escalated_to_human_count: 0,
      connected_channels: connectedChannels,
      connected_calendars: [],
    };
  }

  async getActivity(
    teamId: string,
    limit: number = 10,
  ): Promise<RecentAiAction[]> {
    return this.getRecentAiActions(teamId, limit);
  }

  async getQualificationRules(teamId: string): Promise<{
    name: string;
    updated_at: string | null;
    rule_summary: {
      budget_constraint: string;
      location_constraint: string;
      booking_enabled: boolean;
      escalation_thresholds: string[];
    };
  }> {
    if (teamId) {
      await this.db.query(
        `INSERT INTO team_ai_config (team_id, name, updated_at)
        VALUES ($1, 'Default', NOW())
        ON CONFLICT (team_id) DO NOTHING`,
        [teamId],
      );
    }
    let rows: any[] = [];

    if (teamId) {
      const result = await this.db.query(
        `SELECT name, updated_at FROM team_ai_config WHERE team_id = $1`,
        [teamId],
      );
      rows = result.rows;
    }
    const r = rows[0];
    const connectedCalendars: string[] = [];
    return {
      name: r?.name ?? "Default",
      updated_at: r?.updated_at ?? null,
      rule_summary: {
        budget_constraint: "Property price <= lead parsed_budget_max",
        location_constraint:
          "Property city must match lead parsed_city (case-insensitive)",
        booking_enabled: connectedCalendars.length > 0,
        escalation_thresholds: [
          "Lead requests human (agent_request intent)",
          "Qualification complete but booking blocked (no calendar)",
        ],
      },
    };
  }

  private async getTeamAiSettings(teamId: string): Promise<{
    ai_auto_reply_enabled: boolean | null;
    ai_auto_reply_tone: string | null;
    ai_appointment_setter_enabled: boolean | null;
  }> {
    const { rows } = await this.db.query(
      `SELECT ai_auto_reply_enabled, ai_auto_reply_tone, ai_appointment_setter_enabled
       FROM teams WHERE id = $1`,
      [teamId],
    );
    return rows[0] ?? {};
  }

  private async getActiveChannels(teamId: string): Promise<string[]> {
    const channels: string[] = [];

    const platformWhatsApp = process.env.TWILIO_WHATSAPP_FROM?.trim();
    if (platformWhatsApp) {
      channels.push("whatsapp");
    }
    if (!channels.includes("whatsapp")) {
      const { rows: agentWa } = await this.db.query(
        `SELECT 1 FROM agent_whatsapp_connections aw
         INNER JOIN users u ON u.id = aw.agent_id AND u.team_id = $1
         WHERE aw.status = 'connected' LIMIT 1`,
        [teamId],
      );
      if (agentWa.length > 0) channels.push("whatsapp");
    }

    const { rows: agentIg } = await this.db.query(
      `SELECT 1 FROM agent_instagram_connections ai
       INNER JOIN users u ON u.id = ai.agent_id AND u.team_id = $1
       WHERE ai.status = 'connected' LIMIT 1`,
      [teamId],
    );
    if (agentIg.length > 0) channels.push("instagram");

    return channels;
  }

  private async getRecentAiActions(
    teamId: string,
    limit: number,
  ): Promise<RecentAiAction[]> {
    const { rows } = await this.db.query(
      `SELECT id, action, lead_id, channel, outcome, metadata, created_at
       FROM ai_activity
       WHERE team_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [teamId, limit],
    );
    return rows.map((r: any) => ({
      id: r.id,
      timestamp: r.created_at,
      action: r.action,
      lead_id: r.lead_id ?? null,
      channel: r.channel ?? null,
      outcome: r.outcome ?? null,
      metadata: r.metadata ?? undefined,
    }));
  }

  async getAgentSetup(teamId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const [
      channels,
      teamResult,
      propertiesResult,
      configResult,
      testResult,
      automationResult,
    ] = await Promise.all([
      this.getActiveChannels(teamId),
      this.db.query(
        `SELECT id, name, whatsapp_phone, ai_auto_reply_enabled,
                ai_auto_reply_tone, ai_appointment_setter_enabled
         FROM teams
         WHERE id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM properties
         WHERE team_id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT business_profile_completed,
                appointment_rules_configured,
                behavior_configured,
                automations_configured,
                tested,
                launched,
                paused,
                response_tone,
                capabilities,
                quick_controls,
                updated_at
         FROM ai_agent_settings
         WHERE team_id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM ai_activity
         WHERE team_id = $1
           AND action IN ('cortexa_chat', 'ai_test', 'test_ai')`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM ai_activity
         WHERE team_id = $1
           AND action LIKE 'automation_%'`,
        [teamId],
      ),
    ]);

    const team = teamResult.rows[0] || {};
    const propertyCount = Number(propertiesResult.rows[0]?.total || 0);
    const automationCount = Number(automationResult.rows[0]?.total || 0);
    const tested =
      Boolean(configResult.rows[0]?.tested) ||
      Number(testResult.rows[0]?.total || 0) > 0;
    const whatsappConnected = channels.includes("whatsapp");

    const config = configResult.rows[0] || {};
    const businessProfileCompleted = Boolean(
      config.business_profile_completed || team.name,
    );
    const appointmentRulesConfigured = Boolean(
      config.appointment_rules_configured || team.ai_appointment_setter_enabled,
    );
    const behaviorConfigured = Boolean(
      config.behavior_configured || team.ai_auto_reply_tone,
    );

    const requiredSteps = [
      whatsappConnected,
      businessProfileCompleted,
      propertyCount > 0,
      appointmentRulesConfigured,
      behaviorConfigured,
      automationCount > 0 || Boolean(config.automations_configured),
      tested,
    ];

    const completedBeforeLaunch = requiredSteps.filter(Boolean).length;
    const launchUnlocked = completedBeforeLaunch === requiredSteps.length;
    const launched = Boolean(config.launched && launchUnlocked);
    const completedSteps = completedBeforeLaunch + (launched ? 1 : 0);
    const progress = Math.round((completedSteps / 8) * 100);

    return {
      isSetupComplete: launched,
      agentStatus: config.paused ? "paused" : launched ? "active" : "setup",
      completedSteps,
      totalSteps: 8,
      progress,
      whatsapp: {
        connected: whatsappConnected,
        status: whatsappConnected ? "Connected" : "Not connected",
        pairingCode: null,
        qrCode: null,
        expiresIn: null,
        expiresLabel: "--:--",
      },
      businessProfile: {
        completed: businessProfileCompleted,
        status: businessProfileCompleted ? "Complete" : "Incomplete",
      },
      properties: {
        imported: propertyCount,
        status:
          propertyCount > 0 ? `${propertyCount} imported` : "No properties",
      },
      appointmentRules: {
        configured: appointmentRulesConfigured,
        status: appointmentRulesConfigured ? "Configured" : "Not configured",
      },
      behavior: {
        configured: behaviorConfigured,
        status: behaviorConfigured ? "Configured" : "Not configured",
      },
      automations: {
        total: automationCount,
        status: `${automationCount} automations`,
      },
      testAi: {
        tested,
        status: tested ? "Tested" : "Not tested",
      },
      launch: {
        unlocked: launchUnlocked,
        launched,
        status: launched ? "Launched" : launchUnlocked ? "Ready" : "Locked",
      },
    };
  }

  async getAgentDashboard(teamId: string) {
    const [
      activityCount,
      contactedLeads,
      bookedAppointments,
      sharedProperties,
      recentActivity,
      priorityTasks,
    ] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM ai_activity
         WHERE team_id = $1
           AND created_at >= CURRENT_DATE`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(DISTINCT lead_id)::int AS total
         FROM ai_activity
         WHERE team_id = $1
           AND lead_id IS NOT NULL
           AND created_at >= CURRENT_DATE`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM ai_activity
         WHERE team_id = $1
           AND action IN ('appointment_booked', 'booked_appointment')
           AND created_at >= CURRENT_DATE`,
        [teamId],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM ai_property_visibility apv
         INNER JOIN leads l ON l.id = apv.lead_id
         WHERE l.team_id = $1
           AND apv.action = 'sent_to_lead'
           AND apv.created_at >= CURRENT_DATE`,
        [teamId],
      ),
      this.db.query(
        `SELECT id, action, lead_id, channel, outcome, metadata, created_at
         FROM ai_activity
         WHERE team_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [teamId],
      ),
      this.db.query(
        `SELECT id, title, status, due_date
         FROM lead_tasks
         WHERE team_id = $1
           AND COALESCE(status, '') NOT IN ('completed', 'cancelled')
         ORDER BY due_date ASC NULLS LAST, created_at DESC
         LIMIT 4`,
        [teamId],
      ),
    ]);

    return {
      status: "live",
      glance: {
        conversations: Number(activityCount.rows[0]?.total || 0),
        leadsContacted: Number(contactedLeads.rows[0]?.total || 0),
        appointmentsBooked: Number(bookedAppointments.rows[0]?.total || 0),
        propertiesShared: Number(sharedProperties.rows[0]?.total || 0),
      },
      priorityTasks: priorityTasks.rows.map((row: any) => ({
        id: row.id,
        title: row.title || "Lead task",
        subtitle: row.due_date
          ? `Due ${new Date(row.due_date).toISOString()}`
          : "Lead task",
        priority:
          row.due_date && new Date(row.due_date).getTime() < Date.now()
            ? "High"
            : "Medium",
      })),
      recentActivity: recentActivity.rows.map((row: any) =>
        this.mapActivityRow(row),
      ),
    };
  }

  async getAgentKnowledge(teamId: string) {
    const [properties, team, config, lastActivity] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int AS total,
                MAX(updated_at) AS last_updated
         FROM properties
         WHERE team_id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT name, whatsapp_phone, updated_at
         FROM teams
         WHERE id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT business_profile_completed,
                appointment_rules_configured,
                behavior_configured,
                automations_configured,
                tested,
                launched,
                paused,
                response_tone,
                capabilities,
                quick_controls,
                updated_at
         FROM ai_agent_settings
         WHERE team_id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT MAX(created_at) AS last_updated
         FROM ai_activity
         WHERE team_id = $1`,
        [teamId],
      ),
    ]);

    const propertyCount = Number(properties.rows[0]?.total || 0);
    const businessItems = team.rows[0]?.name ? 1 : 0;
    const categories = [
      {
        key: "company_information",
        title: "Company Information",
        description: "Your company details, mission, values and offices",
        items: businessItems,
        status: businessItems ? "Active" : "Needs review",
        accent: "purple",
      },
      {
        key: "property_knowledge",
        title: "Property Knowledge",
        description: "Property types, features and market expertise",
        items: propertyCount,
        status: propertyCount ? "Active" : "Needs review",
        accent: "orange",
      },
    ];

    const knowledgeItems = categories.reduce(
      (sum, item) => sum + item.items,
      0,
    );
    const activeItems = categories
      .filter((item) => item.status === "Active")
      .reduce((sum, item) => sum + item.items, 0);
    const dataSources = [
      propertyCount > 0,
      Boolean(team.rows[0]?.name),
      Boolean(team.rows[0]?.whatsapp_phone),
    ].filter(Boolean).length;

    const lastUpdated =
      properties.rows[0]?.last_updated ||
      config.rows[0]?.updated_at ||
      lastActivity.rows[0]?.last_updated ||
      team.rows[0]?.updated_at ||
      null;

    const score =
      knowledgeItems > 0
        ? Math.min(100, Math.round((activeItems / knowledgeItems) * 100))
        : 0;

    return {
      stats: {
        knowledgeItems,
        activeItems,
        dataSources,
        lastUpdated,
        lastUpdatedLabel: lastUpdated
          ? this.relativeTime(lastUpdated)
          : "Never",
        lastUpdatedDate: lastUpdated
          ? new Date(lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "No updates yet",
      },
      categories,
      health: {
        score,
        complete: activeItems,
        total: knowledgeItems,
        upToDate: activeItems,
        wellStructured: activeItems,
        needsReview: Math.max(knowledgeItems - activeItems, 0),
      },
    };
  }

  async getAgentActivityFeed(
    teamId: string,
    params: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      search?: string;
    },
  ) {
    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.min(Math.max(Number(params.limit || 25), 1), 100);
    const offset = (page - 1) * limit;

    const where: string[] = ["a.team_id = $1"];
    const values: any[] = [teamId];
    let index = 2;

    if (params.type && params.type !== "all") {
      where.push(`a.action = $${index++}`);
      values.push(params.type);
    }

    if (params.status && params.status !== "all") {
      where.push(
        `LOWER(COALESCE(a.outcome, 'completed')) = LOWER($${index++})`,
      );
      values.push(params.status);
    }

    if (params.search?.trim()) {
      where.push(
        `(a.action ILIKE $${index}
          OR COALESCE(a.outcome, '') ILIKE $${index}
          OR COALESCE(a.metadata::text, '') ILIKE $${index}
          OR COALESCE(l.name, '') ILIKE $${index})`,
      );
      values.push(`%${params.search.trim()}%`);
      index += 1;
    }

    const whereSql = where.join(" AND ");

    const [itemsResult, countResult, summaryResult, typeResult, topResult] =
      await Promise.all([
        this.db.query(
          `SELECT a.id, a.action, a.lead_id, a.channel, a.outcome,
                  a.metadata, a.created_at, l.name AS lead_name
           FROM ai_activity a
           LEFT JOIN leads l ON l.id = a.lead_id
           WHERE ${whereSql}
           ORDER BY a.created_at DESC
           LIMIT $${index} OFFSET $${index + 1}`,
          [...values, limit, offset],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS total
           FROM ai_activity a
           LEFT JOIN leads l ON l.id = a.lead_id
           WHERE ${whereSql}`,
          values,
        ),
        this.db.query(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (
               WHERE LOWER(COALESCE(outcome, 'completed'))
                 IN ('completed', 'success')
             )::int AS completed,
             COUNT(*) FILTER (
               WHERE LOWER(COALESCE(outcome, ''))
                 IN ('escalated', 'requires_human')
             )::int AS escalated,
             COUNT(*) FILTER (
               WHERE LOWER(COALESCE(outcome, ''))
                 IN ('failed', 'error')
             )::int AS failed
           FROM ai_activity
           WHERE team_id = $1`,
          [teamId],
        ),
        this.db.query(
          `SELECT
             CASE
               WHEN action ILIKE '%appointment%' THEN 'Appointments'
               WHEN action ILIKE '%lead%' THEN 'Lead Updates'
               WHEN action ILIKE '%property%' THEN 'Property Updates'
               WHEN action ILIKE '%alert%' OR outcome ILIKE '%escalat%' THEN 'Alerts'
               WHEN action ILIKE '%data%' THEN 'Data Updates'
               ELSE 'Messages'
             END AS label,
             COUNT(*)::int AS total
           FROM ai_activity
           WHERE team_id = $1
           GROUP BY 1
           ORDER BY total DESC`,
          [teamId],
        ),
        this.db.query(
          `SELECT action, COUNT(*)::int AS total
           FROM ai_activity
           WHERE team_id = $1
           GROUP BY action
           ORDER BY total DESC
           LIMIT 5`,
          [teamId],
        ),
      ]);

    const summary = summaryResult.rows[0] || {};
    const summaryTotal = Number(summary.total || 0);
    const percent = (value: number) =>
      summaryTotal > 0 ? Math.round((value / summaryTotal) * 100) : 0;

    const colorByIndex = ["green", "orange", "purple", "blue", "red", "gray"];

    return {
      page,
      limit,
      total: Number(countResult.rows[0]?.total || 0),
      totalPages: Math.max(
        1,
        Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
      ),
      items: itemsResult.rows.map((row: any) => this.mapActivityRow(row)),
      overview: {
        total: summaryTotal,
        completed: Number(summary.completed || 0),
        escalated: Number(summary.escalated || 0),
        failed: Number(summary.failed || 0),
        completedPercentLabel: `${percent(Number(summary.completed || 0))}%`,
        escalatedPercentLabel: `${percent(Number(summary.escalated || 0))}%`,
        failedPercentLabel: `${percent(Number(summary.failed || 0))}%`,
        trendLabel: "Current period",
      },
      activityByType: typeResult.rows.map((row: any, rowIndex: number) => ({
        label: row.label,
        value: `${row.total} (${percent(Number(row.total || 0))}%)`,
        percent: percent(Number(row.total || 0)),
        accent: colorByIndex[rowIndex % colorByIndex.length],
      })),
      topActions: topResult.rows.map((row: any, rowIndex: number) => ({
        title: this.formatAiActionTitle(row.action),
        total: Number(row.total || 0),
        accent: colorByIndex[rowIndex % colorByIndex.length],
      })),
    };
  }

  async updateAgentSetup(
    teamId: string,
    body: {
      businessProfileCompleted?: boolean;
      appointmentRulesConfigured?: boolean;
      behaviorConfigured?: boolean;
      automationsConfigured?: boolean;
      tested?: boolean;
      launched?: boolean;
    },
  ) {
    const current = await this.getAgentSetup(teamId);

    if (body.launched === true && !current.launch.unlocked) {
      throw new ForbiddenException(
        "Complete all required setup steps before launching the AI Agent",
      );
    }

    await this.db.query(
      `INSERT INTO ai_agent_settings (
         team_id,
         business_profile_completed,
         appointment_rules_configured,
         behavior_configured,
         automations_configured,
         tested,
         launched,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (team_id)
       DO UPDATE SET
         business_profile_completed = COALESCE(
           $2,
           ai_agent_settings.business_profile_completed
         ),
         appointment_rules_configured = COALESCE(
           $3,
           ai_agent_settings.appointment_rules_configured
         ),
         behavior_configured = COALESCE(
           $4,
           ai_agent_settings.behavior_configured
         ),
         automations_configured = COALESCE(
           $5,
           ai_agent_settings.automations_configured
         ),
         tested = COALESCE($6, ai_agent_settings.tested),
         launched = COALESCE($7, ai_agent_settings.launched),
         updated_at = NOW()`,
      [
        teamId,
        body.businessProfileCompleted ?? null,
        body.appointmentRulesConfigured ?? null,
        body.behaviorConfigured ?? null,
        body.automationsConfigured ?? null,
        body.tested ?? null,
        body.launched ?? null,
      ],
    );

    if (body.tested === true) {
      await this.db.query(
        `INSERT INTO ai_activity (
           team_id, action, outcome, metadata, created_at
         )
         VALUES ($1, 'ai_test', 'success', '{}'::jsonb, NOW())`,
        [teamId],
      );
    }

    if (body.launched === true) {
      await this.db.query(
        `INSERT INTO ai_activity (
           team_id, action, outcome, metadata, created_at
         )
         VALUES ($1, 'agent_launched', 'success', '{}'::jsonb, NOW())`,
        [teamId],
      );
    }

    return this.getAgentSetup(teamId);
  }

  async getAgentControls(teamId: string) {
    const [teamResult, configResult, todayResult] = await Promise.all([
      this.db.query(
        `SELECT ai_auto_reply_enabled, ai_auto_reply_tone,
                ai_appointment_setter_enabled
         FROM teams
         WHERE id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT response_tone, capabilities, quick_controls, paused
         FROM ai_agent_settings
         WHERE team_id = $1`,
        [teamId],
      ),
      this.db.query(
        `SELECT
           COUNT(*) FILTER (
             WHERE action IN ('cortexa_chat', 'auto_reply', 'follow_up_sent')
           )::int AS responses_today,
           COUNT(*) FILTER (
             WHERE action IN ('appointment_booked', 'booked_appointment')
           )::int AS appointments_booked,
           COUNT(DISTINCT lead_id)::int AS leads_handled
         FROM ai_activity
         WHERE team_id = $1
           AND created_at >= CURRENT_DATE`,
        [teamId],
      ),
    ]);

    const team = teamResult.rows[0] || {};
    const config = configResult.rows[0] || {};

    return {
      status: config.paused ? "paused" : "active",
      responseTone:
        config.response_tone || team.ai_auto_reply_tone || "professional",
      responseToneLabel: this.toneLabel(
        config.response_tone || team.ai_auto_reply_tone || "professional",
      ),
      capabilities: {
        autoReplyToLeads: team.ai_auto_reply_enabled ?? true,
        leadQualification: config.capabilities?.leadQualification ?? true,
        appointmentBooking: team.ai_appointment_setter_enabled ?? false,
        propertyRecommendations:
          config.capabilities?.propertyRecommendations ?? true,
        followUpAutomation: config.capabilities?.followUpAutomation ?? true,
        leadScoring: config.capabilities?.leadScoring ?? true,
        humanApprovalHighValue:
          config.capabilities?.humanApprovalHighValue ?? true,
        autoEscalationHotLeads:
          config.capabilities?.autoEscalationHotLeads ?? true,
        marketingCampaigns: config.capabilities?.marketingCampaigns ?? false,
        smartInsights: config.capabilities?.smartInsights ?? true,
      },
      quickControls: {
        pauseAiAgent: config.paused ?? false,
        doNotDisturb: config.quick_controls?.doNotDisturb ?? true,
        workingHoursOnly: config.quick_controls?.workingHoursOnly ?? true,
        weekendsActive: config.quick_controls?.weekendsActive ?? false,
      },
      metrics: {
        responsesToday: Number(todayResult.rows[0]?.responses_today || 0),
        appointmentsBooked: Number(
          todayResult.rows[0]?.appointments_booked || 0,
        ),
        leadsHandled: Number(todayResult.rows[0]?.leads_handled || 0),
        avgResponseTime: config.quick_controls?.avgResponseTime || "—",
      },
      automationRules: [
        {
          title: "Auto reply within 5 minutes",
          enabled: team.ai_auto_reply_enabled ?? true,
        },
        {
          title: "Book appointments automatically",
          enabled: team.ai_appointment_setter_enabled ?? false,
        },
      ],
    };
  }

  async updateAgentControls(
    teamId: string,
    body: {
      responseTone?: string;
      capabilities?: Record<string, boolean>;
      quickControls?: Record<string, boolean>;
    },
  ) {
    const tone = body.responseTone;

    if (tone && !ALLOWED_TONES.includes(tone as AutoReplyTone)) {
      throw new ForbiddenException("Invalid response tone");
    }

    const currentResult = await this.db.query(
      `SELECT capabilities, quick_controls, paused, response_tone
       FROM ai_agent_settings
       WHERE team_id = $1`,
      [teamId],
    );

    const current = currentResult.rows[0] || {};
    const capabilities = {
      ...(current.capabilities || {}),
      ...(body.capabilities || {}),
    };
    const quickControls = {
      ...(current.quick_controls || {}),
      ...(body.quickControls || {}),
    };

    await Promise.all([
      this.db.query(
        `UPDATE teams
         SET ai_auto_reply_enabled = COALESCE($1, ai_auto_reply_enabled),
             ai_auto_reply_tone = COALESCE($2, ai_auto_reply_tone),
             ai_appointment_setter_enabled =
               COALESCE($3, ai_appointment_setter_enabled),
             updated_at = NOW()
         WHERE id = $4`,
        [
          capabilities.autoReplyToLeads,
          tone || null,
          capabilities.appointmentBooking,
          teamId,
        ],
      ),
      this.db.query(
        `INSERT INTO ai_agent_settings (
           team_id,
           response_tone,
           capabilities,
           quick_controls,
           paused,
           updated_at
         )
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NOW())
         ON CONFLICT (team_id)
         DO UPDATE SET
           response_tone = EXCLUDED.response_tone,
           capabilities = EXCLUDED.capabilities,
           quick_controls = EXCLUDED.quick_controls,
           paused = EXCLUDED.paused,
           updated_at = NOW()`,
        [
          teamId,
          tone || current.response_tone || "professional",
          JSON.stringify(capabilities),
          JSON.stringify(quickControls),
          Boolean(quickControls.pauseAiAgent),
        ],
      ),
    ]);

    await this.db.query(
      `INSERT INTO ai_activity (
         team_id, action, outcome, metadata, created_at
       )
       VALUES ($1, 'controls_updated', 'success', $2::jsonb, NOW())`,
      [
        teamId,
        JSON.stringify({
          responseTone: tone || null,
          capabilities,
          quickControls,
        }),
      ],
    );

    return this.getAgentControls(teamId);
  }

  private mapActivityRow(row: any) {
    const action = String(row.action || "");
    const createdAt = row.created_at || row.timestamp;
    const outcome = String(row.outcome || "completed");

    return {
      id: row.id,
      timestamp: createdAt,
      timeLabel: createdAt
        ? new Date(createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "",
      title: this.formatAiActionTitle(action),
      description: this.formatAiActionDescription(row),
      action,
      leadId: row.lead_id || null,
      leadName: row.lead_name || row.metadata?.leadName || null,
      channel: row.channel || null,
      status: outcome,
      statusLabel: this.titleCase(outcome),
      iconKey: this.activityIconKey(action, outcome),
      metadata: row.metadata || {},
    };
  }

  private formatAiActionTitle(action: string) {
    const titles: Record<string, string> = {
      cortexa_chat: "AI Chat",
      lead_qualified: "Qualified Lead",
      appointment_booked: "Booked Appointment",
      booked_appointment: "Booked Appointment",
      property_recommended: "Recommended Properties",
      follow_up_sent: "Sent Follow-up Message",
      auto_reply: "Auto Reply",
      lead_scored: "Lead Scored",
      email_sent: "Email Sent",
      data_enriched: "Data Enriched",
      hot_lead_alert: "Hot Lead Alert",
      controls_updated: "Controls Updated",
    };

    return titles[action] || this.titleCase(action.replace(/_/g, " "));
  }

  private formatAiActionDescription(row: any) {
    const metadata = row.metadata || {};

    if (metadata.description) return String(metadata.description);
    if (row.action === "cortexa_chat" && metadata.message) {
      return `User asked AI: ${metadata.message}`;
    }
    if (row.outcome) {
      return `AI action finished with ${row.outcome}.`;
    }

    return "AI completed this action.";
  }

  private activityIconKey(action: string, outcome: string) {
    if (outcome.toLowerCase().includes("escalat")) return "alert";
    if (action.includes("appointment")) return "appointment";
    if (action.includes("property")) return "property";
    if (action.includes("data")) return "data";
    if (action.includes("alert")) return "alert";
    return "message";
  }

  private toneLabel(tone: string) {
    const labels: Record<string, string> = {
      professional: "Professional & Friendly",
      friendly: "Friendly & Conversational",
      sales: "Sales Focused",
    };

    return labels[tone] || this.titleCase(tone);
  }

  private titleCase(value: string) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private relativeTime(value: string | Date) {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Never";

    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  async cortexaAgent({
    user,
    body,
  }: {
    user: any;
    body: {
      message: string;
      attachments?: any[];
      conversationId?: string;
      workspaceId?: string;
    };
  }) {
    const { message, attachments = [], conversationId, workspaceId } = body;

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      throw new ForbiddenException("Message or attachment is required");
    }

    const teamId = workspaceId || user?.teamId || user?.team_id;

    if (!teamId) {
      return {
        success: false,
        answer: "You need to create or join a team before using CORTEXA AI.",
      };
    }
    /*
     * LOAD REAL CRM DATA
     */

    const leadsResult = await this.db.query(
      `
        SELECT id, name, email, phone, status, notes, source, created_at
        FROM leads
        WHERE team_id = $1
        ORDER BY created_at DESC
        LIMIT 30
        `,
      [teamId],
    );

    const propertiesResult = await this.db.query(
      `
        SELECT id, title, city, price, created_at
        FROM properties
        WHERE team_id = $1
        ORDER BY created_at DESC
        LIMIT 20
        `,
      [teamId],
    );

    const pipelineResult = await this.db.query(
      `
        SELECT id, stage, value, name, notes
        FROM deals
        WHERE team_id = $1
        LIMIT 30
        `,
      [teamId],
    );

    const crmContext = {
      teamId,
      userId: user?.id,
      attachments,
      leads: leadsResult.rows,
      properties: propertiesResult.rows,
      pipeline: pipelineResult.rows,
    };

    /*
     * SYSTEM PROMPT
     */

    const systemPrompt = `
    You are CORTEXA AI, an AI agent built for real estate agents and teams.

    You help users:
    - manage leads
    - follow-ups
    - WhatsApp replies
    - appointments
    - pipelines
    - listings
    - ad copy
    - CRM analytics

    Only answer using available CRM data when data is required.

    If data is missing:
    - explain exactly what is missing
    - explain what the user should connect or create

    Be direct, professional, and action-oriented.
    Always give next steps.
    `;

    /*
     * OPENAI CALL
     */

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
          role: "system",
          content: [
            {
              type: "input_text",
              text: `CRM DATA:\n${JSON.stringify(crmContext)}`,
            },
          ],
        },

        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: message || "Analyze the uploaded attachment.",
            },

            ...attachments
              .filter((a) => a.type?.startsWith("image/"))
              .map((a) => ({
                type: "input_image",
                image_url: a.url,
              })),
          ] as any,
        },
      ],
    });

    /*
     * SAVE AI ACTIVITY
     */

    await this.db.query(
      `
        INSERT INTO ai_activity (
          team_id,
          action,
          outcome,
          metadata,
          created_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        `,
      [
        teamId,
        "cortexa_chat",
        "success",
        JSON.stringify({
          message,
          conversationId,
        }),
      ],
    );

    return {
      success: true,
      answer: response.output_text,
      conversationId: conversationId || crypto.randomUUID(),

      usage: response.usage || null,
    };
  }

  async uploadFiles({
    files,
    user,
  }: {
    files: Express.Multer.File[];
    user: any;
  }) {
    if (!files?.length) {
      throw new ForbiddenException("No files uploaded");
    }
    console.log("FILE:", files);
    console.log("USER:", user);
    try {
      const uploaded = [];

      for (const file of files) {
        const result = await this.s3Service.uploadFile(file);

        uploaded.push({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          url: result.url,
          key: result.key,
        });
      }

      return {
        success: true,
        files: uploaded,
      };
    } catch (err) {
      console.error("S3 ERROR:", err);
      console.error("S3 ERROR STACK:", err?.stack);
      console.error("S3 ERROR JSON:", JSON.stringify(err, null, 2));

      throw err;
    }
  }
}
