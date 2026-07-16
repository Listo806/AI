import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
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

const AI_KNOWLEDGE_CATEGORIES = [
  "company_information",
  "office_hours",
  "service_areas",
  "property_knowledge",
  "sales_scripts",
  "financing_partners",
  "faqs",
  "policies_processes",
] as const;

const AI_KNOWLEDGE_SOURCE_TYPES = [
  "text",
  "qa",
  "website",
  "document",
  "system",
] as const;

const AI_KNOWLEDGE_STATUSES = ["active", "inactive", "needs_review"] as const;

const AI_KNOWLEDGE_CATEGORY_META: Record<
  string,
  {
    title: string;
    description: string;
    accent: string;
  }
> = {
  company_information: {
    title: "Company Information",
    description: "Your company details, mission, values and offices",
    accent: "purple",
  },

  office_hours: {
    title: "Office Hours & Availability",
    description: "Business hours, holidays and availability rules",
    accent: "green",
  },

  service_areas: {
    title: "Service Areas",
    description: "Areas, neighborhoods and coverage information",
    accent: "blue",
  },

  property_knowledge: {
    title: "Property Knowledge",
    description: "Property types, features and market expertise",
    accent: "orange",
  },

  sales_scripts: {
    title: "Sales Scripts & Templates",
    description: "Scripts, email templates and messaging guides",
    accent: "purple",
  },

  financing_partners: {
    title: "Financing & Partners",
    description: "Lenders, partners and financing information",
    accent: "green",
  },

  faqs: {
    title: "FAQs",
    description: "Frequently asked questions and answers",
    accent: "blue",
  },

  policies_processes: {
    title: "Policies & Processes",
    description: "Business policies and internal processes",
    accent: "purple",
  },
};
type AiAgentRuntimeControls = {
  teamId: string;
  launched: boolean;
  paused: boolean;
  responseTone: string;

  capabilities: Record<string, boolean>;

  quickControls: Record<string, boolean>;
};

@Injectable()
export class AiCenterService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  constructor(
    private readonly db: DatabaseService,
    private readonly s3Service: S3Service,
  ) {}
  private resolveRequestedCapability(message: string) {
    const value = String(message || "").toLowerCase();

    if (
      value.includes("appointment") ||
      value.includes("book") ||
      value.includes("schedule")
    ) {
      return {
        key: "appointmentBooking",
        defaultValue: true,
      };
    }

    if (
      value.includes("property") ||
      value.includes("listing") ||
      value.includes("recommend")
    ) {
      return {
        key: "propertyRecommendations",
        defaultValue: true,
      };
    }

    if (value.includes("qualify") || value.includes("qualification")) {
      return {
        key: "leadQualification",
        defaultValue: true,
      };
    }

    if (value.includes("score") || value.includes("hot lead")) {
      return {
        key: "leadScoring",
        defaultValue: true,
      };
    }

    if (value.includes("follow up") || value.includes("follow-up")) {
      return {
        key: "followUpAutomation",
        defaultValue: true,
      };
    }

    if (value.includes("campaign") || value.includes("marketing")) {
      return {
        key: "marketingCampaigns",
        defaultValue: false,
      };
    }

    if (value.includes("whatsapp")) {
      return {
        key: "whatsappCommunication",
        defaultValue: true,
      };
    }

    return null;
  }

  private isInsideWorkingHours(controls: AiAgentRuntimeControls) {
    const quick = controls.quickControls || {};

    if (quick.workingHoursOnly !== true) {
      return true;
    }
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend && quick.weekendsActive !== true) {
      return false;
    }

    return hour >= 9 && hour < 18;
  }
  private async getRuntimeControls(
    teamId: string,
  ): Promise<AiAgentRuntimeControls> {
    const result = await this.db.query(
      `
      SELECT
        launched,
        paused,
        response_tone,
        capabilities,
        quick_controls
      FROM ai_agent_settings
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    const row = result.rows[0];

    if (!row) {
      return {
        teamId,
        launched: false,
        paused: false,
        responseTone: "professional",
        capabilities: {},
        quickControls: {},
      };
    }

    return {
      teamId,
      launched: Boolean(row.launched),
      paused: Boolean(row.paused),

      responseTone: row.response_tone || "professional",

      capabilities:
        row.capabilities && typeof row.capabilities === "object"
          ? row.capabilities
          : {},

      quickControls:
        row.quick_controls && typeof row.quick_controls === "object"
          ? row.quick_controls
          : {},
    };
  }

  private async assertCapabilityEnabled(
    teamId: string,
    controls: AiAgentRuntimeControls,
    capability: string,
    defaultValue = false,
  ): Promise<void> {
    const enabled = controls.capabilities[capability] ?? defaultValue;

    if (enabled) {
      return;
    }

    await this.db.query(
      `
    INSERT INTO ai_activity (
      team_id,
      action,
      channel,
      outcome,
      metadata,
      created_at
    )
    VALUES (
      $1,
      'ai_capability_blocked',
      'web',
      'blocked',
      $2::jsonb,
      NOW()
    )
    `,
      [
        teamId,
        JSON.stringify({
          capability,
        }),
      ],
    );

    throw new ForbiddenException({
      code: "AI_CAPABILITY_DISABLED",

      capability,

      message: `AI capability "${capability}" is disabled.`,
    });
  }

  private assertAgentRuntimeAvailable(
    controls: AiAgentRuntimeControls,
    options: {
      allowWhenPaused?: boolean;
    } = {},
  ): void {
    if (!controls.launched) {
      throw new ForbiddenException({
        code: "AI_AGENT_SETUP_REQUIRED",

        message: "Complete setup and launch the AI Agent first.",
      });
    }

    const paused =
      controls.paused || controls.quickControls?.pauseAiAgent === true;

    if (paused && options.allowWhenPaused !== true) {
      throw new ForbiddenException({
        code: "AI_AGENT_PAUSED",

        message: "The AI Agent is currently paused.",
      });
    }
  }
  private async logRuntimeBlock(
    teamId: string,
    reason: string,
    metadata: Record<string, any> = {},
  ) {
    try {
      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'ai_action_blocked',
        $2,
        'blocked',
        $3::jsonb,
        NOW()
      )
      `,
        [
          teamId,

          metadata.channel || "system",

          JSON.stringify({
            reason,
            ...metadata,
          }),
        ],
      );
    } catch (error) {
      console.error("LOG AI RUNTIME BLOCK FAILED:", error);
    }
  }
  async assertAgentActionAllowed(
    teamId: string,

    capability?: string,

    options: {
      defaultValue?: boolean;
      checkWorkingHours?: boolean;
      allowWhenPaused?: boolean;
      channel?: string;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<AiAgentRuntimeControls> {
    if (!teamId) {
      throw new ForbiddenException({
        code: "AI_AGENT_TEAM_REQUIRED",
        message: "A team is required to use the AI Agent.",
      });
    }

    const controls = await this.getRuntimeControls(teamId);

    this.assertAgentRuntimeAvailable(controls, {
      allowWhenPaused: options.allowWhenPaused,
    });

    if (
      options.checkWorkingHours !== false &&
      !this.isInsideWorkingHours(controls)
    ) {
      await this.logRuntimeBlock(teamId, "outside_working_hours", {
        channel: options.channel || "system",

        capability: capability || null,

        ...options.metadata,
      });

      throw new ForbiddenException({
        code: "AI_AGENT_OUTSIDE_WORKING_HOURS",

        message: "The AI Agent is outside its configured working hours.",
      });
    }

    if (capability) {
      await this.assertCapabilityEnabled(
        teamId,
        controls,
        capability,
        options.defaultValue ?? false,
      );
    }

    return controls;
  }
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

    if (!channels.includes("whatsapp")) {
      const { rows: qrWhatsApp } = await this.db.query(
        `
        SELECT 1
        FROM whatsapp_qr_sessions ws
        INNER JOIN users u
          ON u.id = ws.user_id
        WHERE u.team_id = $1
          AND ws.status = 'connected'
        LIMIT 1
        `,
        [teamId],
      );

      if (qrWhatsApp.length > 0) {
        channels.push("whatsapp");
      }
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
      appointmentRulesResult,
      behaviorResult,
      automationsResult,
      testResult,
      businessProfileResult,
    ] = await Promise.all([
      this.getActiveChannels(teamId),

      this.db.query(
        `
        SELECT
          id,
          name,
          whatsapp_phone,
          ai_auto_reply_enabled,
          ai_auto_reply_tone,
          ai_appointment_setter_enabled
        FROM teams
        WHERE id = $1
        `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT COUNT(*)::int AS total
        FROM ai_agent_property_catalog
        WHERE team_id = $1
          AND is_active = true
        `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT
          business_profile_completed,
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
        WHERE team_id = $1
        `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT id
        FROM ai_agent_appointment_rules
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT team_id
        FROM ai_agent_behavior
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT team_id
        FROM ai_agent_automations
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      ),

      this.db.query(
        `
          SELECT COUNT(*)::int AS total
          FROM ai_agent_test_sessions
          WHERE team_id = $1
            AND EXISTS (
              SELECT 1
              FROM ai_agent_test_messages message
              WHERE message.session_id = ai_agent_test_sessions.id
                AND message.role = 'assistant'
            )
          `,
        [teamId],
      ),

      this.db.query(
        `
        SELECT
          business_name,
          business_type,
          description,
          city,
          country
        FROM ai_agent_business_profiles
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      ),
    ]);

    const team = teamResult.rows[0] || {};
    const propertyCount = Number(propertiesResult.rows[0]?.total || 0);
    const tested = Number(testResult.rows[0]?.total || 0) > 0;
    const whatsappConnected = channels.includes("whatsapp");

    const config = configResult.rows[0] || {};
    const businessProfileCompleted = this.isBusinessProfileComplete(
      businessProfileResult.rows[0],
    );
    const appointmentRulesConfigured = Boolean(
      config.appointment_rules_configured || team.ai_appointment_setter_enabled,
    );
    const appointmentRulesCompleted = appointmentRulesResult.rows.length > 0;
    const behaviorConfigured = behaviorResult.rows.length > 0;
    const automationsConfigured = automationsResult.rows.length > 0;

    const requiredSteps = [
      whatsappConnected,
      businessProfileCompleted,
      propertyCount > 0,
      appointmentRulesCompleted,
      behaviorConfigured,
      automationsConfigured,
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
        configured: appointmentRulesCompleted,
        completed: appointmentRulesCompleted,
        status: appointmentRulesCompleted ? "Configured" : "Not configured",
      },
      behavior: {
        configured: behaviorConfigured,
        completed: behaviorConfigured,
        status: behaviorConfigured ? "Configured" : "Not configured",
      },
      automations: {
        configured: automationsConfigured,
        completed: automationsConfigured,
        total: automationsConfigured ? 1 : 0,
        status: automationsConfigured ? "Configured" : "Not configured",
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

  async getAgentKnowledge(
    teamId: string,
    params: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const page = Math.max(Number(params.page || 1), 1);

    const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100);

    const offset = (page - 1) * limit;

    const values: any[] = [teamId];

    const where: string[] = ["team_id = $1"];

    if (params.category && params.category !== "all") {
      this.validateKnowledgeCategory(params.category);

      values.push(params.category);

      where.push(`category = $${values.length}`);
    }

    if (params.status && params.status !== "all") {
      this.validateKnowledgeStatus(params.status);

      values.push(params.status);

      where.push(`status = $${values.length}`);
    }

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);

      const searchParam = `$${values.length}`;

      where.push(`
      (
        title ILIKE ${searchParam}
        OR content ILIKE ${searchParam}
      )
    `);
    }

    const whereSql = where.join(" AND ");

    const [itemsResult, countResult, summaryResult, categoryResult] =
      await Promise.all([
        this.db.query(
          `
      SELECT
        id,
        category,
        source_type,
        title,
        content,
        source_url,
        metadata,
        status,
        priority,
        last_reviewed_at,
        created_at,
        updated_at

      FROM ai_agent_knowledge_items

      WHERE ${whereSql}

      ORDER BY
        priority DESC,
        updated_at DESC

      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
      `,
          [...values, limit, offset],
        ),

        this.db.query(
          `
      SELECT COUNT(*)::int AS total
      FROM ai_agent_knowledge_items
      WHERE ${whereSql}
      `,
          values,
        ),

        this.db.query(
          `
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE status = 'active'
        )::int AS active,

        COUNT(*) FILTER (
          WHERE status = 'needs_review'
        )::int AS needs_review,

        COUNT(
          DISTINCT source_type
        )::int AS data_sources,

        MAX(updated_at) AS last_updated

      FROM ai_agent_knowledge_items

      WHERE team_id = $1
      `,
          [teamId],
        ),

        this.db.query(
          `
      SELECT
        category,

        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE status = 'active'
        )::int AS active,

        COUNT(*) FILTER (
          WHERE status = 'needs_review'
        )::int AS needs_review

      FROM ai_agent_knowledge_items

      WHERE team_id = $1

      GROUP BY category
      `,
          [teamId],
        ),
      ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const summary = summaryResult.rows[0] || {};
    const knowledgeItems = Number(summary.total || 0);
    const activeItems = Number(summary.active || 0);
    const needsReview = Number(summary.needs_review || 0);
    const categoryMap = new Map<string, any>(
      categoryResult.rows.map((row: any) => [String(row.category), row]),
    );
    const categories = AI_KNOWLEDGE_CATEGORIES.map((key) => {
      const row = categoryMap.get(key);
      const meta = AI_KNOWLEDGE_CATEGORY_META[key];
      const items = Number(row?.total || 0);
      const active = Number(row?.active || 0);
      const categoryNeedsReview = Number(row?.needs_review || 0);

      return {
        key,
        title: meta.title,
        description: meta.description,
        accent: meta.accent,

        items,
        active,

        needsReview: categoryNeedsReview,

        status:
          items === 0
            ? "Empty"
            : categoryNeedsReview > 0
              ? "Needs review"
              : active > 0
                ? "Active"
                : "Inactive",
      };
    });

    const lastUpdated = summary.last_updated || null;

    const healthScore =
      knowledgeItems > 0
        ? Math.max(
            0,
            Math.min(100, Math.round((activeItems / knowledgeItems) * 100)),
          )
        : 0;

    return {
      page,
      limit,
      total,

      totalPages: Math.max(1, Math.ceil(total / limit)),

      stats: {
        knowledgeItems,
        activeItems,

        dataSources: Number(summary.data_sources || 0),

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

      health: {
        score: healthScore,

        complete: activeItems,

        total: knowledgeItems,

        upToDate: knowledgeItems - needsReview,

        wellStructured: activeItems,

        needsReview,
      },
      categories,
      items: itemsResult.rows.map((row: any) => this.mapKnowledgeItem(row)),
    };
  }

  async getAgentKnowledgeItem(teamId: string, id: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM ai_agent_knowledge_items
      WHERE id = $1
        AND team_id = $2
      LIMIT 1
      `,
      [id, teamId],
    );

    if (!rows[0]) {
      throw new ForbiddenException("Knowledge item not found");
    }

    return this.mapKnowledgeItem(rows[0]);
  }

  async createAgentKnowledgeItem(teamId: string, userId: string, body: any) {
    const payload = this.validateKnowledgePayload(body);

    const { rows } = await this.db.query(
      `
      INSERT INTO ai_agent_knowledge_items (
        team_id,
        created_by,

        category,
        source_type,

        title,
        content,

        source_url,
        metadata,

        status,
        priority,

        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,

        $3,
        $4,

        $5,
        $6,

        $7,
        $8::jsonb,

        $9,
        $10,

        NOW(),
        NOW()
      )

      RETURNING *
      `,
      [
        teamId,
        userId,

        payload.category,
        payload.sourceType,

        payload.title,
        payload.content,

        payload.sourceUrl,

        JSON.stringify(payload.metadata),

        payload.status,
        payload.priority,
      ],
    );

    await this.logKnowledgeActivity(
      teamId,
      userId,
      "knowledge_item_created",
      rows[0],
    );

    return this.mapKnowledgeItem(rows[0]);
  }

  async updateAgentKnowledgeItem(
    teamId: string,
    userId: string,
    id: string,
    body: any,
  ) {
    const existing = await this.getAgentKnowledgeItem(teamId, id);

    const payload = this.validateKnowledgePayload({
      category: body.category ?? existing.category,

      sourceType: body.sourceType ?? existing.sourceType,

      title: body.title ?? existing.title,

      content: body.content ?? existing.content,

      sourceUrl:
        body.sourceUrl !== undefined ? body.sourceUrl : existing.sourceUrl,

      status: body.status ?? existing.status,

      priority: body.priority ?? existing.priority,

      metadata: body.metadata ?? existing.metadata,
    });

    const { rows } = await this.db.query(
      `
      UPDATE ai_agent_knowledge_items

      SET
        category = $1,
        source_type = $2,

        title = $3,
        content = $4,

        source_url = $5,
        metadata = $6::jsonb,

        status = $7,
        priority = $8,

        updated_at = NOW()

      WHERE id = $9
        AND team_id = $10

      RETURNING *
      `,
      [
        payload.category,
        payload.sourceType,

        payload.title,
        payload.content,

        payload.sourceUrl,

        JSON.stringify(payload.metadata),

        payload.status,
        payload.priority,

        id,
        teamId,
      ],
    );

    await this.logKnowledgeActivity(
      teamId,
      userId,
      "knowledge_item_updated",
      rows[0],
    );

    return this.mapKnowledgeItem(rows[0]);
  }

  async deleteAgentKnowledgeItem(teamId: string, userId: string, id: string) {
    const { rows } = await this.db.query(
      `
      DELETE FROM ai_agent_knowledge_items

      WHERE id = $1
        AND team_id = $2

      RETURNING
        id,
        category,
        title
      `,
      [id, teamId],
    );

    if (!rows[0]) {
      throw new ForbiddenException("Knowledge item not found");
    }

    await this.logKnowledgeActivity(
      teamId,
      userId,
      "knowledge_item_deleted",
      rows[0],
    );

    return {
      success: true,
      id,
    };
  }

  async searchAgentKnowledge(teamId: string, query: string, limit = 8) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      return {
        query: "",
        items: [],
      };
    }

    const safeLimit = Math.min(Math.max(Number(limit || 8), 1), 30);

    const { rows } = await this.db.query(
      `
      SELECT
        id,
        category,
        source_type,
        title,
        content,
        source_url,
        metadata,
        status,
        priority,
        created_at,
        updated_at,

        (
          ts_rank(
            search_vector,
            websearch_to_tsquery(
              'simple',
              $2
            )
          )
          +
          similarity(
            title,
            $2
          )
        ) AS relevance

      FROM ai_agent_knowledge_items

      WHERE team_id = $1
        AND status = 'active'

        AND (
          search_vector @@
            websearch_to_tsquery(
              'simple',
              $2
            )

          OR title % $2

          OR content ILIKE
            '%' || $2 || '%'
        )

      ORDER BY
        priority DESC,
        relevance DESC,
        updated_at DESC

      LIMIT $3
      `,
      [teamId, cleanQuery, safeLimit],
    );

    return {
      query: cleanQuery,

      items: rows.map((row: any) => ({
        ...this.mapKnowledgeItem(row),

        relevance: Number(row.relevance || 0),
      })),
    };
  }

  private validateKnowledgeCategory(value: string) {
    if (!AI_KNOWLEDGE_CATEGORIES.includes(value as any)) {
      throw new ForbiddenException("Invalid knowledge category");
    }
  }

  private validateKnowledgeSourceType(value: string) {
    if (!AI_KNOWLEDGE_SOURCE_TYPES.includes(value as any)) {
      throw new ForbiddenException("Invalid knowledge source type");
    }
  }

  private validateKnowledgeStatus(value: string) {
    if (!AI_KNOWLEDGE_STATUSES.includes(value as any)) {
      throw new ForbiddenException("Invalid knowledge status");
    }
  }

  private validateKnowledgePayload(body: any) {
    const category = String(body.category || "").trim();

    const sourceType = String(body.sourceType || "text").trim();

    const title = String(body.title || "").trim();

    const content = String(body.content || "").trim();

    const status = String(body.status || "active").trim();

    const priority = Math.min(Math.max(Number(body.priority || 0), 0), 100);

    this.validateKnowledgeCategory(category);

    this.validateKnowledgeSourceType(sourceType);

    this.validateKnowledgeStatus(status);

    if (title.length < 3) {
      throw new ForbiddenException(
        "Knowledge title must contain at least 3 characters",
      );
    }

    if (title.length > 255) {
      throw new ForbiddenException(
        "Knowledge title must not exceed 255 characters",
      );
    }

    if (content.length < 10) {
      throw new ForbiddenException(
        "Knowledge content must contain at least 10 characters",
      );
    }

    if (content.length > 20000) {
      throw new ForbiddenException(
        "Knowledge content must not exceed 20000 characters",
      );
    }

    return {
      category,
      sourceType,
      title,
      content,

      sourceUrl: body.sourceUrl ? String(body.sourceUrl).trim() : null,

      status,
      priority,

      metadata:
        body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    };
  }

  private mapKnowledgeItem(row: any) {
    return {
      id: row.id,

      category: row.category,

      categoryTitle:
        AI_KNOWLEDGE_CATEGORY_META[row.category]?.title || row.category,

      sourceType: row.source_type,

      title: row.title,

      content: row.content,

      preview:
        String(row.content || "").length > 180
          ? `${String(row.content).slice(0, 180)}...`
          : row.content,

      sourceUrl: row.source_url || null,

      metadata: row.metadata || {},

      status: row.status,

      priority: Number(row.priority || 0),

      lastReviewedAt: row.last_reviewed_at || null,

      createdAt: row.created_at,

      updatedAt: row.updated_at,
    };
  }

  private async logKnowledgeActivity(
    teamId: string,
    userId: string,
    action: string,
    item: any,
  ) {
    await this.db.query(
      `
    INSERT INTO ai_activity (
      team_id,
      action,
      channel,
      outcome,
      metadata,
      created_at
    )
    VALUES (
      $1,
      $2,
      'web',
      'success',
      $3::jsonb,
      NOW()
    )
    `,
      [
        teamId,
        action,

        JSON.stringify({
          userId,

          knowledgeItemId: item?.id,

          category: item?.category,

          title: item?.title,
        }),
      ],
    );
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
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }
    const currentSetup = await this.getAgentSetup(teamId);
    if (body.launched === true && !currentSetup.launch.unlocked) {
      throw new ForbiddenException(
        "Complete all required setup steps before launching the AI Agent",
      );
    }

    const currentConfigResult = await this.db.query(
      `
      SELECT
        business_profile_completed,
        appointment_rules_configured,
        behavior_configured,
        automations_configured,
        tested,
        launched
      FROM ai_agent_settings
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    const currentConfig = currentConfigResult.rows[0] || {};

    const businessProfileCompleted =
      body.businessProfileCompleted ??
      currentConfig.business_profile_completed ??
      Boolean(currentSetup.businessProfile?.completed);

    const appointmentRulesConfigured =
      body.appointmentRulesConfigured ??
      currentConfig.appointment_rules_configured ??
      Boolean(currentSetup.appointmentRules?.configured);

    const behaviorConfigured =
      body.behaviorConfigured ??
      currentConfig.behavior_configured ??
      Boolean(currentSetup.behavior?.configured);

    const automationsConfigured =
      body.automationsConfigured ??
      currentConfig.automations_configured ??
      Boolean(currentSetup.automations?.configured);

    const tested =
      body.tested ??
      currentConfig.tested ??
      Boolean(currentSetup.testAi?.tested);

    const launched =
      body.launched ??
      currentConfig.launched ??
      Boolean(currentSetup.launch?.launched);

    await this.db.query("BEGIN");

    try {
      await this.db.query(
        `
      INSERT INTO ai_agent_settings (
        team_id,
        business_profile_completed,
        appointment_rules_configured,
        behavior_configured,
        automations_configured,
        tested,
        launched,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        business_profile_completed =
          EXCLUDED.business_profile_completed,

        appointment_rules_configured =
          EXCLUDED.appointment_rules_configured,

        behavior_configured =
          EXCLUDED.behavior_configured,

        automations_configured =
          EXCLUDED.automations_configured,

        tested =
          EXCLUDED.tested,

        launched =
          EXCLUDED.launched,

        updated_at = NOW()
      `,
        [
          teamId,
          businessProfileCompleted,
          appointmentRulesConfigured,
          behaviorConfigured,
          automationsConfigured,
          tested,
          launched,
        ],
      );

      if (body.tested === true) {
        await this.db.query(
          `
        INSERT INTO ai_activity (
          team_id,
          action,
          channel,
          outcome,
          metadata,
          created_at
        )
        VALUES (
          $1,
          'ai_test',
          'web',
          'success',
          '{}'::jsonb,
          NOW()
        )
        `,
          [teamId],
        );
      }

      if (body.launched === true && !currentSetup.launch.launched) {
        await this.db.query(
          `
        INSERT INTO ai_activity (
          team_id,
          action,
          channel,
          outcome,
          metadata,
          created_at
        )
        VALUES (
          $1,
          'agent_launched',
          'web',
          'success',
          $2::jsonb,
          NOW()
        )
        `,
          [
            teamId,
            JSON.stringify({
              completedSteps: currentSetup.completedSteps,
              launchedAt: new Date().toISOString(),
            }),
          ],
        );

        await this.db.query(
          `
        UPDATE teams
        SET
          ai_auto_reply_enabled = true,
          ai_appointment_setter_enabled = true,
          updated_at = NOW()
        WHERE id = $1
        `,
          [teamId],
        );
      }

      await this.db.query("COMMIT");
    } catch (error) {
      await this.db.query("ROLLBACK");
      console.error("UPDATE AGENT SETUP ERROR:", error);
      throw error;
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
    const requestedCapability = this.resolveRequestedCapability(message);

    const runtimeControls = await this.assertAgentActionAllowed(
      teamId,
      requestedCapability?.key,
      {
        defaultValue: requestedCapability?.defaultValue ?? true,
        checkWorkingHours: false,
        allowWhenPaused: true,
        channel: "web",
        metadata: {
          userId: user?.id || null,
          conversationId: conversationId || null,
        },
      },
    );

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
    const toneInstructions: Record<string, string> = {
      professional:
        "Use a professional, clear, friendly and approachable tone.",

      friendly: "Use a warm, conversational and personable tone.",

      sales:
        "Use a confident and conversion-focused tone without being aggressive.",
    };

    const responseToneInstruction =
      toneInstructions[runtimeControls.responseTone] ||
      toneInstructions.professional;
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

Communication style:
${responseToneInstruction}

Enabled capabilities:
${JSON.stringify(runtimeControls.capabilities)}

Be direct, professional, and action-oriented.
Always give clear next steps.
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

  async getAgentBusinessProfile(teamId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const { rows } = await this.db.query(
      `
    SELECT
      business_name,
      business_type,
      description,
      website,
      email,
      phone,

      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,

      service_areas,
      specialties,
      languages,

      timezone,
      currency,

      created_at,
      updated_at
    FROM ai_agent_business_profiles
    WHERE team_id = $1
    LIMIT 1
    `,
      [teamId],
    );

    const row = rows[0];

    if (!row) {
      const teamResult = await this.db.query(
        `
      SELECT name, whatsapp_phone
      FROM teams
      WHERE id = $1
      LIMIT 1
      `,
        [teamId],
      );

      const team = teamResult.rows[0] || {};

      return {
        exists: false,
        completed: false,

        businessName: team.name || "",
        businessType: "real_estate",
        description: "",

        website: "",
        email: "",
        phone: team.whatsapp_phone || "",

        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",

        serviceAreas: [],
        specialties: [],
        languages: [],

        timezone: "",
        currency: "USD",

        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      exists: true,
      completed: this.isBusinessProfileComplete(row),

      businessName: row.business_name,
      businessType: row.business_type,
      description: row.description || "",

      website: row.website || "",
      email: row.email || "",
      phone: row.phone || "",

      addressLine1: row.address_line1 || "",
      addressLine2: row.address_line2 || "",
      city: row.city || "",
      state: row.state || "",
      postalCode: row.postal_code || "",
      country: row.country || "",

      serviceAreas: Array.isArray(row.service_areas) ? row.service_areas : [],

      specialties: Array.isArray(row.specialties) ? row.specialties : [],

      languages: Array.isArray(row.languages) ? row.languages : [],

      timezone: row.timezone || "",
      currency: row.currency || "USD",

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveAgentBusinessProfile(
    teamId: string,
    userId: string,
    body: {
      businessName: string;
      businessType: string;
      description: string;

      website?: string | null;
      email?: string | null;
      phone?: string | null;

      addressLine1?: string | null;
      addressLine2?: string | null;
      city: string;
      state?: string | null;
      postalCode?: string | null;
      country: string;

      serviceAreas?: string[];
      specialties?: string[];
      languages?: string[];

      timezone?: string | null;
      currency?: string;
    },
  ) {
    const businessName = String(body.businessName || "").trim();
    const businessType = String(body.businessType || "").trim();
    const description = String(body.description || "").trim();
    const city = String(body.city || "").trim();
    const country = String(body.country || "").trim();

    if (!businessName || !businessType || !description || !city || !country) {
      throw new ForbiddenException(
        "Business name, business type, description, city and country are required",
      );
    }

    if (description.length > 2000) {
      throw new ForbiddenException(
        "Business description must not exceed 2000 characters",
      );
    }

    const serviceAreas = this.cleanStringArray(body.serviceAreas);
    const specialties = this.cleanStringArray(body.specialties);
    const languages = this.cleanStringArray(body.languages);

    const { rows } = await this.db.query(
      `
    INSERT INTO ai_agent_business_profiles (
      team_id,

      business_name,
      business_type,
      description,

      website,
      email,
      phone,

      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,

      service_areas,
      specialties,
      languages,

      timezone,
      currency,

      created_at,
      updated_at
    )
    VALUES (
      $1,

      $2,
      $3,
      $4,

      $5,
      $6,
      $7,

      $8,
      $9,
      $10,
      $11,
      $12,
      $13,

      $14::jsonb,
      $15::jsonb,
      $16::jsonb,

      $17,
      $18,

      NOW(),
      NOW()
    )
    ON CONFLICT (team_id)
    DO UPDATE SET
      business_name = EXCLUDED.business_name,
      business_type = EXCLUDED.business_type,
      description = EXCLUDED.description,

      website = EXCLUDED.website,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,

      address_line1 = EXCLUDED.address_line1,
      address_line2 = EXCLUDED.address_line2,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      postal_code = EXCLUDED.postal_code,
      country = EXCLUDED.country,

      service_areas = EXCLUDED.service_areas,
      specialties = EXCLUDED.specialties,
      languages = EXCLUDED.languages,

      timezone = EXCLUDED.timezone,
      currency = EXCLUDED.currency,

      updated_at = NOW()

    RETURNING *
    `,
      [
        teamId,

        businessName,
        businessType,
        description,

        body.website?.trim() || null,
        body.email?.trim() || null,
        body.phone?.trim() || null,

        body.addressLine1?.trim() || null,
        body.addressLine2?.trim() || null,
        city,
        body.state?.trim() || null,
        body.postalCode?.trim() || null,
        country,

        JSON.stringify(serviceAreas),
        JSON.stringify(specialties),
        JSON.stringify(languages),

        body.timezone?.trim() || null,
        body.currency?.trim() || "USD",
      ],
    );

    await this.db.query(
      `
    INSERT INTO ai_agent_settings (
      team_id,
      business_profile_completed,
      updated_at
    )
    VALUES ($1, true, NOW())

    ON CONFLICT (team_id)
    DO UPDATE SET
      business_profile_completed = true,
      updated_at = NOW()
    `,
      [teamId],
    );

    await this.db.query(
      `
    INSERT INTO ai_activity (
      team_id,
      action,
      channel,
      outcome,
      metadata,
      created_at
    )
    VALUES (
      $1,
      'business_profile_updated',
      'web',
      'success',
      $2::jsonb,
      NOW()
    )
    `,
      [
        teamId,
        JSON.stringify({
          userId,
          businessName,
          businessType,
          city,
          country,
        }),
      ],
    );

    return this.getAgentBusinessProfile(teamId);
  }

  private cleanStringArray(value?: string[]) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(value.map((item) => String(item || "").trim()).filter(Boolean)),
    ).slice(0, 100);
  }

  private isBusinessProfileComplete(row: any) {
    return Boolean(
      String(row?.business_name || "").trim() &&
      String(row?.business_type || "").trim() &&
      String(row?.description || "").trim() &&
      String(row?.city || "").trim() &&
      String(row?.country || "").trim(),
    );
  }

  async getAgentPropertyCatalog(
    teamId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
    },
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.min(Math.max(Number(params.limit || 12), 1), 100);
    const offset = (page - 1) * limit;
    const values: any[] = [teamId];
    const where: string[] = ["p.team_id = $1"];

    if (params.search?.trim()) {
      values.push(`%${params.search.trim()}%`);

      const searchParam = `$${values.length}`;

      where.push(`
      (
        COALESCE(p.title, '') ILIKE ${searchParam}
        OR COALESCE(p.city, '') ILIKE ${searchParam}
        OR COALESCE(p.state, '') ILIKE ${searchParam}
        OR COALESCE(p.address, '') ILIKE ${searchParam}
        OR COALESCE(p.description, '') ILIKE ${searchParam}
        OR COALESCE(p.zip_code, '') ILIKE ${searchParam}
      )
    `);
    }

    const whereSql = where.join(" AND ");
    const limitParam = `$${values.length + 1}`;
    const offsetParam = `$${values.length + 2}`;
    const [propertiesResult, countResult, selectedResult] = await Promise.all([
      this.db.query(
        `
      SELECT
        p.id,
        p.title,
        p.description,
        p.address,
        p.city,
        p.state,
        p.zip_code,
        p.price,
        p.type,
        p.property_type,
        p.status,
        p.bedrooms,
        p.bathrooms,

        COALESCE(
          NULLIF(p.thumbnail_url, ''),
          media.url
        ) AS image_url,

        CASE
          WHEN catalog.property_id IS NOT NULL
          THEN true
          ELSE false
        END AS selected

      FROM properties p

      LEFT JOIN ai_agent_property_catalog catalog
        ON catalog.property_id = p.id
        AND catalog.team_id = $1
        AND catalog.is_active = true

      LEFT JOIN LATERAL (
        SELECT pm.url
        FROM property_media pm
        WHERE pm.property_id = p.id
          AND pm.type = 'image'
        ORDER BY
          pm.is_primary DESC,
          pm.display_order ASC,
          pm.created_at ASC
        LIMIT 1
      ) media ON true

      WHERE ${whereSql}

      ORDER BY
        CASE
          WHEN catalog.property_id IS NOT NULL
          THEN 0
          ELSE 1
        END,
        p.updated_at DESC,
        p.created_at DESC

      LIMIT ${limitParam}
      OFFSET ${offsetParam}
      `,
        [...values, limit, offset],
      ),

      this.db.query(
        `
      SELECT COUNT(*)::int AS total
      FROM properties p
      WHERE ${whereSql}
      `,
        values,
      ),

      this.db.query(
        `
      SELECT property_id
      FROM ai_agent_property_catalog
      WHERE team_id = $1
        AND is_active = true
      ORDER BY created_at ASC
      `,
        [teamId],
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const selectedPropertyIds = selectedResult.rows.map((row: any) =>
      String(row.property_id),
    );

    return {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      selectedCount: selectedPropertyIds.length,
      selectedPropertyIds,
      items: propertiesResult.rows.map((row: any) => ({
        id: String(row.id),
        title: row.title || "Untitled property",
        description: row.description || "",
        address: row.address || "",
        city: row.city || "",
        state: row.state || "",
        zipCode: row.zip_code || "",
        price: row.price != null ? Number(row.price) : null,
        currency: "USD",
        type: row.type || null,
        propertyType: row.property_type || null,
        status: row.status || "draft",
        bedrooms: row.bedrooms != null ? Number(row.bedrooms) : null,
        bathrooms: row.bathrooms != null ? Number(row.bathrooms) : null,
        imageUrl: row.image_url || null,
        selected: Boolean(row.selected),
      })),
    };
  }

  async saveAgentPropertyCatalog(
    teamId: string,
    userId: string,
    propertyIds: string[],
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const uniquePropertyIds = Array.from(
      new Set(
        (Array.isArray(propertyIds) ? propertyIds : [])
          .map((id) => String(id || "").trim())
          .filter(Boolean),
      ),
    );

    if (uniquePropertyIds.length > 5000) {
      throw new ForbiddenException("Too many properties selected");
    }

    if (uniquePropertyIds.length > 0) {
      const validResult = await this.db.query(
        `
      SELECT id
      FROM properties
      WHERE team_id = $1
        AND id = ANY($2::uuid[])
      `,
        [teamId, uniquePropertyIds],
      );

      const validIds = new Set(validResult.rows.map((row: any) => row.id));

      const invalidIds = uniquePropertyIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        throw new ForbiddenException(
          "One or more properties do not belong to this team",
        );
      }
    }

    await this.db.query("BEGIN");

    try {
      await this.db.query(
        `
      UPDATE ai_agent_property_catalog
      SET
        is_active = false,
        updated_at = NOW()
      WHERE team_id = $1
      `,
        [teamId],
      );

      if (uniquePropertyIds.length > 0) {
        await this.db.query(
          `
        INSERT INTO ai_agent_property_catalog (
          team_id,
          property_id,
          is_active,
          added_by,
          created_at,
          updated_at
        )

        SELECT
          $1,
          property_id,
          true,
          $3,
          NOW(),
          NOW()

        FROM unnest(
          $2::uuid[]
        ) AS property_id

        ON CONFLICT (
          team_id,
          property_id
        )

        DO UPDATE SET
          is_active = true,
          added_by = EXCLUDED.added_by,
          updated_at = NOW()
        `,
          [teamId, uniquePropertyIds, userId],
        );
      }

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'property_catalog_updated',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,
          JSON.stringify({
            userId,
            propertyCount: uniquePropertyIds.length,
          }),
        ],
      );

      await this.db.query("COMMIT");
    } catch (error) {
      await this.db.query("ROLLBACK");
      throw error;
    }

    return {
      success: true,
      imported: uniquePropertyIds.length,
      propertyIds: uniquePropertyIds,
    };
  }

  async getAppointmentRules(teamId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const { rows } = await this.db.query(
      `
    SELECT
      id,
      team_id,
      timezone,
      working_days,
      start_time,
      end_time,
      booking_duration,
      buffer_before,
      buffer_after,
      max_daily_bookings,
      allow_weekends,
      auto_confirm,
      require_human_approval,
      reminder_minutes,
      google_calendar_enabled,
      outlook_calendar_enabled,
      intake_questions,
      created_at,
      updated_at
    FROM ai_agent_appointment_rules
    WHERE team_id = $1
    LIMIT 1
    `,
      [teamId],
    );

    const row = rows[0];

    if (!row) {
      return {
        exists: false,
        configured: false,

        timezone: "UTC",

        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],

        startTime: "09:00",
        endTime: "18:00",

        bookingDuration: 30,
        bufferBefore: 0,
        bufferAfter: 0,

        maxDailyBookings: 20,

        allowWeekends: false,
        autoConfirm: true,
        requireHumanApproval: false,

        reminderMinutes: 30,

        googleCalendarEnabled: false,
        outlookCalendarEnabled: false,

        intakeQuestions: [],

        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      exists: true,
      configured: true,
      id: row.id,
      timezone: row.timezone || "UTC",
      workingDays: Array.isArray(row.working_days) ? row.working_days : [],
      startTime: row.start_time ? String(row.start_time).slice(0, 5) : "09:00",
      endTime: row.end_time ? String(row.end_time).slice(0, 5) : "18:00",
      bookingDuration: Number(row.booking_duration || 30),
      bufferBefore: Number(row.buffer_before || 0),
      bufferAfter: Number(row.buffer_after || 0),
      maxDailyBookings: Number(row.max_daily_bookings || 20),
      allowWeekends: Boolean(row.allow_weekends),
      autoConfirm: Boolean(row.auto_confirm),
      requireHumanApproval: Boolean(row.require_human_approval),
      reminderMinutes: Number(row.reminder_minutes || 30),
      googleCalendarEnabled: Boolean(row.google_calendar_enabled),
      outlookCalendarEnabled: Boolean(row.outlook_calendar_enabled),
      intakeQuestions: Array.isArray(row.intake_questions)
        ? row.intake_questions
        : [],

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveAppointmentRules(
    teamId: string,
    userId: string,
    body: {
      timezone?: string;

      workingDays?: string[];

      startTime?: string;
      endTime?: string;

      bookingDuration?: number;
      bufferBefore?: number;
      bufferAfter?: number;

      maxDailyBookings?: number;

      allowWeekends?: boolean;
      autoConfirm?: boolean;
      requireHumanApproval?: boolean;

      reminderMinutes?: number;

      googleCalendarEnabled?: boolean;
      outlookCalendarEnabled?: boolean;

      intakeQuestions?: string[];
    },
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const allowedDays = new Set([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);

    const timezone = String(body.timezone || "UTC").trim() || "UTC";

    const workingDays = Array.from(
      new Set(
        (Array.isArray(body.workingDays) ? body.workingDays : [])
          .map((day) =>
            String(day || "")
              .trim()
              .toLowerCase(),
          )
          .filter((day) => allowedDays.has(day)),
      ),
    );

    if (workingDays.length === 0) {
      throw new ForbiddenException("Select at least one working day");
    }

    const startTime = String(body.startTime || "09:00").trim();
    const endTime = String(body.endTime || "18:00").trim();
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      throw new ForbiddenException(
        "Start time and end time must use HH:mm format",
      );
    }

    if (startTime >= endTime) {
      throw new ForbiddenException("End time must be later than start time");
    }

    const bookingDuration = Math.min(
      Math.max(Number(body.bookingDuration || 30), 15),
      480,
    );

    const bufferBefore = Math.min(
      Math.max(Number(body.bufferBefore || 0), 0),
      240,
    );

    const bufferAfter = Math.min(
      Math.max(Number(body.bufferAfter || 0), 0),
      240,
    );

    const maxDailyBookings = Math.min(
      Math.max(Number(body.maxDailyBookings || 20), 1),
      100,
    );

    const reminderMinutes = Math.min(
      Math.max(Number(body.reminderMinutes || 30), 0),
      10080,
    );

    const intakeQuestions = Array.from(
      new Set(
        (Array.isArray(body.intakeQuestions) ? body.intakeQuestions : [])
          .map((question) => String(question || "").trim())
          .filter(Boolean),
      ),
    ).slice(0, 20);

    const allowWeekends = Boolean(body.allowWeekends);
    const autoConfirm = body.autoConfirm !== false;
    const requireHumanApproval = Boolean(body.requireHumanApproval);
    const googleCalendarEnabled = Boolean(body.googleCalendarEnabled);
    const outlookCalendarEnabled = Boolean(body.outlookCalendarEnabled);

    await this.db.query("BEGIN");

    try {
      await this.db.query(
        `
      INSERT INTO ai_agent_appointment_rules (
        team_id,

        timezone,
        working_days,

        start_time,
        end_time,

        booking_duration,
        buffer_before,
        buffer_after,

        max_daily_bookings,

        allow_weekends,
        auto_confirm,
        require_human_approval,

        reminder_minutes,

        google_calendar_enabled,
        outlook_calendar_enabled,

        intake_questions,

        created_at,
        updated_at
      )
      VALUES (
        $1,

        $2,
        $3::jsonb,

        $4,
        $5,

        $6,
        $7,
        $8,

        $9,

        $10,
        $11,
        $12,

        $13,

        $14,
        $15,

        $16::jsonb,

        NOW(),
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        timezone =
          EXCLUDED.timezone,

        working_days =
          EXCLUDED.working_days,

        start_time =
          EXCLUDED.start_time,

        end_time =
          EXCLUDED.end_time,

        booking_duration =
          EXCLUDED.booking_duration,

        buffer_before =
          EXCLUDED.buffer_before,

        buffer_after =
          EXCLUDED.buffer_after,

        max_daily_bookings =
          EXCLUDED.max_daily_bookings,

        allow_weekends =
          EXCLUDED.allow_weekends,

        auto_confirm =
          EXCLUDED.auto_confirm,

        require_human_approval =
          EXCLUDED.require_human_approval,

        reminder_minutes =
          EXCLUDED.reminder_minutes,

        google_calendar_enabled =
          EXCLUDED.google_calendar_enabled,

        outlook_calendar_enabled =
          EXCLUDED.outlook_calendar_enabled,

        intake_questions =
          EXCLUDED.intake_questions,

        updated_at = NOW()
      `,
        [
          teamId,

          timezone,
          JSON.stringify(workingDays),

          startTime,
          endTime,

          bookingDuration,
          bufferBefore,
          bufferAfter,

          maxDailyBookings,

          allowWeekends,
          autoConfirm,
          requireHumanApproval,

          reminderMinutes,

          googleCalendarEnabled,
          outlookCalendarEnabled,

          JSON.stringify(intakeQuestions),
        ],
      );

      await this.db.query(
        `
      INSERT INTO ai_agent_settings (
        team_id,
        appointment_rules_configured,
        updated_at
      )
      VALUES (
        $1,
        true,
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        appointment_rules_configured = true,
        updated_at = NOW()
      `,
        [teamId],
      );

      await this.db.query(
        `
      UPDATE teams
      SET
        ai_appointment_setter_enabled = true,
        updated_at = NOW()
      WHERE id = $1
      `,
        [teamId],
      );

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'appointment_rules_updated',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,
          JSON.stringify({
            userId,
            timezone,
            workingDays,
            startTime,
            endTime,
            bookingDuration,
            maxDailyBookings,
            autoConfirm,
            requireHumanApproval,
          }),
        ],
      );

      await this.db.query("COMMIT");
    } catch (error) {
      await this.db.query("ROLLBACK");
      throw error;
    }

    return this.getAppointmentRules(teamId);
  }

  async getAgentBehavior(teamId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const { rows } = await this.db.query(
      `
    SELECT *
    FROM ai_agent_behavior
    WHERE team_id = $1
    LIMIT 1
    `,
      [teamId],
    );

    const row = rows[0];

    if (!row) {
      return {
        exists: false,
        configured: false,

        tone: "professional",
        personality: "helpful",
        responseLength: "balanced",

        greetingMessage:
          "Hi! I’m the AI assistant for our real estate team. How can I help you today?",

        fallbackMessage:
          "I’m not fully certain about that. Let me connect you with a team member.",

        escalationMessage:
          "I’m bringing in a human agent who can help you further.",

        qualificationQuestions: [
          "What type of property are you looking for?",
          "What is your preferred location?",
          "What is your budget range?",
        ],

        forbiddenTopics: [],
        customInstructions: "",

        askOneQuestionAtATime: true,
        confirmBeforeBooking: true,
        mentionAiIdentity: false,
        useEmojis: false,
        proactiveFollowUp: true,
        autoEscalateHotLeads: true,

        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      exists: true,
      configured: true,

      tone: row.tone,
      personality: row.personality,

      responseLength: row.response_length,

      greetingMessage: row.greeting_message || "",

      fallbackMessage: row.fallback_message || "",

      escalationMessage: row.escalation_message || "",

      qualificationQuestions: Array.isArray(row.qualification_questions)
        ? row.qualification_questions
        : [],

      forbiddenTopics: Array.isArray(row.forbidden_topics)
        ? row.forbidden_topics
        : [],

      customInstructions: row.custom_instructions || "",

      askOneQuestionAtATime: Boolean(row.ask_one_question_at_a_time),

      confirmBeforeBooking: Boolean(row.confirm_before_booking),

      mentionAiIdentity: Boolean(row.mention_ai_identity),

      useEmojis: Boolean(row.use_emojis),

      proactiveFollowUp: Boolean(row.proactive_follow_up),

      autoEscalateHotLeads: Boolean(row.auto_escalate_hot_leads),

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveAgentBehavior(teamId: string, userId: string, body: any) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const allowedTones = ["professional", "friendly", "sales"];

    const allowedPersonalities = [
      "helpful",
      "consultative",
      "concise",
      "luxury",
      "investor_focused",
    ];

    const allowedResponseLengths = ["concise", "balanced", "detailed"];

    const tone = String(body.tone || "professional").trim();

    const personality = String(body.personality || "helpful").trim();

    const responseLength = String(body.responseLength || "balanced").trim();

    if (!allowedTones.includes(tone)) {
      throw new ForbiddenException("Invalid AI tone");
    }

    if (!allowedPersonalities.includes(personality)) {
      throw new ForbiddenException("Invalid AI personality");
    }

    if (!allowedResponseLengths.includes(responseLength)) {
      throw new ForbiddenException("Invalid response length");
    }

    const greetingMessage = String(body.greetingMessage || "").trim();

    if (!greetingMessage) {
      throw new ForbiddenException("Greeting message is required");
    }

    const fallbackMessage = String(body.fallbackMessage || "").trim();

    const escalationMessage = String(body.escalationMessage || "").trim();

    const customInstructions = String(body.customInstructions || "").trim();

    const qualificationQuestions = this.cleanStringArray(
      body.qualificationQuestions,
    ).slice(0, 30);

    const forbiddenTopics = this.cleanStringArray(body.forbiddenTopics).slice(
      0,
      30,
    );

    await this.db.query("BEGIN");

    try {
      await this.db.query(
        `
      INSERT INTO ai_agent_behavior (
        team_id,

        tone,
        personality,
        response_length,

        greeting_message,
        fallback_message,
        escalation_message,

        qualification_questions,
        forbidden_topics,
        custom_instructions,

        ask_one_question_at_a_time,
        confirm_before_booking,
        mention_ai_identity,
        use_emojis,
        proactive_follow_up,
        auto_escalate_hot_leads,

        created_at,
        updated_at
      )
      VALUES (
        $1,

        $2,
        $3,
        $4,

        $5,
        $6,
        $7,

        $8::jsonb,
        $9::jsonb,
        $10,

        $11,
        $12,
        $13,
        $14,
        $15,
        $16,

        NOW(),
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        tone =
          EXCLUDED.tone,

        personality =
          EXCLUDED.personality,

        response_length =
          EXCLUDED.response_length,

        greeting_message =
          EXCLUDED.greeting_message,

        fallback_message =
          EXCLUDED.fallback_message,

        escalation_message =
          EXCLUDED.escalation_message,

        qualification_questions =
          EXCLUDED.qualification_questions,

        forbidden_topics =
          EXCLUDED.forbidden_topics,

        custom_instructions =
          EXCLUDED.custom_instructions,

        ask_one_question_at_a_time =
          EXCLUDED.ask_one_question_at_a_time,

        confirm_before_booking =
          EXCLUDED.confirm_before_booking,

        mention_ai_identity =
          EXCLUDED.mention_ai_identity,

        use_emojis =
          EXCLUDED.use_emojis,

        proactive_follow_up =
          EXCLUDED.proactive_follow_up,

        auto_escalate_hot_leads =
          EXCLUDED.auto_escalate_hot_leads,

        updated_at = NOW()
      `,
        [
          teamId,

          tone,
          personality,
          responseLength,

          greetingMessage,
          fallbackMessage || null,
          escalationMessage || null,

          JSON.stringify(qualificationQuestions),

          JSON.stringify(forbiddenTopics),

          customInstructions || null,

          body.askOneQuestionAtATime !== false,

          body.confirmBeforeBooking !== false,

          Boolean(body.mentionAiIdentity),

          Boolean(body.useEmojis),

          body.proactiveFollowUp !== false,

          body.autoEscalateHotLeads !== false,
        ],
      );

      await this.db.query(
        `
      INSERT INTO ai_agent_settings (
        team_id,
        behavior_configured,
        response_tone,
        updated_at
      )
      VALUES (
        $1,
        true,
        $2,
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        behavior_configured = true,
        response_tone = EXCLUDED.response_tone,
        updated_at = NOW()
      `,
        [teamId, tone],
      );

      await this.db.query(
        `
      UPDATE teams
      SET
        ai_auto_reply_tone = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
        [teamId, tone],
      );

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'ai_behavior_updated',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,

          JSON.stringify({
            userId,
            tone,
            personality,
            responseLength,
            qualificationQuestionCount: qualificationQuestions.length,
            forbiddenTopicCount: forbiddenTopics.length,
          }),
        ],
      );

      await this.db.query("COMMIT");
    } catch (error) {
      await this.db.query("ROLLBACK");
      throw error;
    }

    return this.getAgentBehavior(teamId);
  }

  async getAutomations(teamId: string) {
    const { rows } = await this.db.query(
      `
        SELECT *
        FROM ai_agent_automations
        WHERE team_id=$1
        LIMIT 1
        `,
      [teamId],
    );

    if (!rows.length) {
      return {
        configured: false,
        autoReply: true,
        autoFollowUp: true,
        autoBookAppointment: true,
        autoAssignAgent: false,
        autoCreateTask: true,
        autoSendPropertyMatches: true,
        autoSendMarketReport: false,
        autoCollectContactInfo: true,
        autoCollectBudget: true,
        autoCollectTimeline: true,
        followUpAfterMinutes: 30,
        reminderAfterHours: 24,
        hotLeadScore: 80,
      };
    }

    const row = rows[0];

    return {
      configured: true,
      autoReply: row.auto_reply,
      autoFollowUp: row.auto_follow_up,
      autoBookAppointment: row.auto_book_appointment,
      autoAssignAgent: row.auto_assign_agent,
      autoCreateTask: row.auto_create_task,
      autoSendPropertyMatches: row.auto_send_property_matches,
      autoSendMarketReport: row.auto_send_market_report,
      autoCollectContactInfo: row.auto_collect_contact_info,
      autoCollectBudget: row.auto_collect_budget,
      autoCollectTimeline: row.auto_collect_timeline,
      followUpAfterMinutes: row.follow_up_after_minutes,
      reminderAfterHours: row.reminder_after_hours,
      hotLeadScore: row.hot_lead_score,
    };
  }

  async saveAutomations(
    teamId: string,
    userId: string,
    body: {
      autoReply?: boolean;
      autoFollowUp?: boolean;
      autoBookAppointment?: boolean;
      autoAssignAgent?: boolean;
      autoCreateTask?: boolean;
      autoSendPropertyMatches?: boolean;
      autoSendMarketReport?: boolean;
      autoCollectContactInfo?: boolean;
      autoCollectBudget?: boolean;
      autoCollectTimeline?: boolean;

      followUpAfterMinutes?: number;
      reminderAfterHours?: number;
      hotLeadScore?: number;
    },
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const autoReply = body.autoReply !== false;

    const autoFollowUp = body.autoFollowUp !== false;

    const autoBookAppointment = body.autoBookAppointment !== false;

    const autoAssignAgent = Boolean(body.autoAssignAgent);

    const autoCreateTask = body.autoCreateTask !== false;

    const autoSendPropertyMatches = body.autoSendPropertyMatches !== false;

    const autoSendMarketReport = Boolean(body.autoSendMarketReport);

    const autoCollectContactInfo = body.autoCollectContactInfo !== false;

    const autoCollectBudget = body.autoCollectBudget !== false;

    const autoCollectTimeline = body.autoCollectTimeline !== false;

    const followUpAfterMinutes = Math.min(
      Math.max(Number(body.followUpAfterMinutes ?? 30), 5),
      10080,
    );

    const reminderAfterHours = Math.min(
      Math.max(Number(body.reminderAfterHours ?? 24), 1),
      720,
    );

    const hotLeadScore = Math.min(
      Math.max(Number(body.hotLeadScore ?? 80), 1),
      100,
    );

    await this.db.query("BEGIN");

    try {
      await this.db.query(
        `
      INSERT INTO ai_agent_automations (
        team_id,

        auto_reply,
        auto_follow_up,
        auto_book_appointment,
        auto_assign_agent,
        auto_create_task,
        auto_send_property_matches,
        auto_send_market_report,
        auto_collect_contact_info,
        auto_collect_budget,
        auto_collect_timeline,

        follow_up_after_minutes,
        reminder_after_hours,
        hot_lead_score,

        created_at,
        updated_at
      )
      VALUES (
        $1,

        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,

        $12,
        $13,
        $14,

        NOW(),
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        auto_reply =
          EXCLUDED.auto_reply,

        auto_follow_up =
          EXCLUDED.auto_follow_up,

        auto_book_appointment =
          EXCLUDED.auto_book_appointment,

        auto_assign_agent =
          EXCLUDED.auto_assign_agent,

        auto_create_task =
          EXCLUDED.auto_create_task,

        auto_send_property_matches =
          EXCLUDED.auto_send_property_matches,

        auto_send_market_report =
          EXCLUDED.auto_send_market_report,

        auto_collect_contact_info =
          EXCLUDED.auto_collect_contact_info,

        auto_collect_budget =
          EXCLUDED.auto_collect_budget,

        auto_collect_timeline =
          EXCLUDED.auto_collect_timeline,

        follow_up_after_minutes =
          EXCLUDED.follow_up_after_minutes,

        reminder_after_hours =
          EXCLUDED.reminder_after_hours,

        hot_lead_score =
          EXCLUDED.hot_lead_score,

        updated_at = NOW()
      `,
        [
          teamId,

          autoReply,
          autoFollowUp,
          autoBookAppointment,
          autoAssignAgent,
          autoCreateTask,
          autoSendPropertyMatches,
          autoSendMarketReport,
          autoCollectContactInfo,
          autoCollectBudget,
          autoCollectTimeline,

          followUpAfterMinutes,
          reminderAfterHours,
          hotLeadScore,
        ],
      );

      await this.db.query(
        `
      INSERT INTO ai_agent_settings (
        team_id,
        automations_configured,
        updated_at
      )
      VALUES (
        $1,
        true,
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        automations_configured = true,
        updated_at = NOW()
      `,
        [teamId],
      );

      await this.db.query(
        `
      UPDATE teams
      SET
        ai_auto_reply_enabled = $2,
        ai_appointment_setter_enabled = $3,
        updated_at = NOW()
      WHERE id = $1
      `,
        [teamId, autoReply, autoBookAppointment],
      );

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'automations_updated',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,
          JSON.stringify({
            userId,

            enabledAutomations: [
              autoReply && "auto_reply",
              autoFollowUp && "auto_follow_up",
              autoBookAppointment && "auto_book_appointment",
              autoAssignAgent && "auto_assign_agent",
              autoCreateTask && "auto_create_task",
              autoSendPropertyMatches && "auto_send_property_matches",
              autoSendMarketReport && "auto_send_market_report",
              autoCollectContactInfo && "auto_collect_contact_info",
              autoCollectBudget && "auto_collect_budget",
              autoCollectTimeline && "auto_collect_timeline",
            ].filter(Boolean),

            followUpAfterMinutes,
            reminderAfterHours,
            hotLeadScore,
          }),
        ],
      );

      await this.db.query("COMMIT");
    } catch (error) {
      await this.db.query("ROLLBACK");
      throw error;
    }

    return this.getAutomations(teamId);
  }

  async getAgentTest(teamId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const [sessionsResult, latestSessionResult] = await Promise.all([
      this.db.query(
        `
      SELECT COUNT(*)::int AS total
      FROM ai_agent_test_sessions
      WHERE team_id = $1
      `,
        [teamId],
      ),

      this.db.query(
        `
      SELECT
        id,
        title,
        status,
        created_at,
        updated_at
      FROM ai_agent_test_sessions
      WHERE team_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
      `,
        [teamId],
      ),
    ]);

    const latestSession = latestSessionResult.rows[0];

    let messages: any[] = [];

    if (latestSession) {
      const messagesResult = await this.db.query(
        `
        SELECT
          id,
          role,
          content,
          metadata,
          created_at
        FROM ai_agent_test_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
        `,
        [latestSession.id],
      );

      messages = messagesResult.rows.map((row: any) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      }));
    }

    const total = Number(sessionsResult.rows[0]?.total || 0);

    return {
      tested: total > 0,
      total,

      latestSession: latestSession
        ? {
            id: latestSession.id,
            title: latestSession.title,
            status: latestSession.status,
            createdAt: latestSession.created_at,
            updatedAt: latestSession.updated_at,
            messages,
          }
        : null,
    };
  }

  async createAgentTestSession(teamId: string, userId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const { rows } = await this.db.query(
      `
      INSERT INTO ai_agent_test_sessions (
        team_id,
        created_by,
        title,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        'AI Agent Test',
        'active',
        NOW(),
        NOW()
      )
      RETURNING
        id,
        title,
        status,
        created_at,
        updated_at
      `,
      [teamId, userId],
    );

    const session = rows[0];

    return {
      id: session.id,
      title: session.title,
      status: session.status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: [],
    };
  }

  async runAgentTest(
    teamId: string,
    userId: string,
    message: string,
    sessionId?: string,
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) {
      throw new ForbiddenException("Message is required");
    }

    let activeSessionId = String(sessionId || "").trim();

    if (activeSessionId) {
      const sessionResult = await this.db.query(
        `
        SELECT id
        FROM ai_agent_test_sessions
        WHERE id = $1
          AND team_id = $2
        LIMIT 1
        `,
        [activeSessionId, teamId],
      );

      if (!sessionResult.rows[0]) {
        activeSessionId = "";
      }
    }

    if (!activeSessionId) {
      const session = await this.createAgentTestSession(teamId, userId);

      activeSessionId = session.id;
    }

    const userMessageResult = await this.db.query(
      `
      INSERT INTO ai_agent_test_messages (
        session_id,
        role,
        content,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'user',
        $2,
        '{}'::jsonb,
        NOW()
      )
      RETURNING
        id,
        role,
        content,
        metadata,
        created_at
      `,
      [activeSessionId, cleanMessage],
    );

    try {
      const response = await this.cortexaAgent({
        user: {
          id: userId,
          teamId,
        },

        body: {
          message: cleanMessage,
          conversationId: activeSessionId,
        },
      });

      const answer = String(
        response?.answer || "The AI Agent returned no response.",
      );

      const assistantMessageResult = await this.db.query(
        `
        INSERT INTO ai_agent_test_messages (
          session_id,
          role,
          content,
          metadata,
          created_at
        )
        VALUES (
          $1,
          'assistant',
          $2,
          $3::jsonb,
          NOW()
        )
        RETURNING
          id,
          role,
          content,
          metadata,
          created_at
        `,
        [
          activeSessionId,
          answer,

          JSON.stringify({
            usage: response?.usage || null,
          }),
        ],
      );

      await this.db.query(
        `
      UPDATE ai_agent_test_sessions
      SET updated_at = NOW()
      WHERE id = $1
      `,
        [activeSessionId],
      );

      await this.db.query(
        `
      INSERT INTO ai_agent_settings (
        team_id,
        tested,
        updated_at
      )
      VALUES (
        $1,
        true,
        NOW()
      )

      ON CONFLICT (team_id)

      DO UPDATE SET
        tested = true,
        updated_at = NOW()
      `,
        [teamId],
      );

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'ai_test',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,

          JSON.stringify({
            userId,
            sessionId: activeSessionId,
            prompt: cleanMessage,
          }),
        ],
      );

      const mapMessage = (row: any) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      });

      return {
        success: true,
        answer,

        sessionId: activeSessionId,

        conversationId: activeSessionId,

        userMessage: mapMessage(userMessageResult.rows[0]),

        assistantMessage: mapMessage(assistantMessageResult.rows[0]),

        usage: response?.usage || null,
      };
    } catch (error: any) {
      await this.db.query(
        `
      INSERT INTO ai_agent_test_messages (
        session_id,
        role,
        content,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'assistant',
        $2,
        $3::jsonb,
        NOW()
      )
      `,
        [
          activeSessionId,

          "The AI test could not be completed.",

          JSON.stringify({
            error: error?.message || "Unknown AI error",
          }),
        ],
      );

      await this.db.query(
        `
      UPDATE ai_agent_test_sessions
      SET updated_at = NOW()
      WHERE id = $1
      `,
        [activeSessionId],
      );

      throw error;
    }
  }

  async getAgentChatSessions(teamId: string, limit = 20) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 100);

    const { rows } = await this.db.query(
      `
    SELECT
      session.id,
      session.title,
      session.status,
      session.created_at,
      session.updated_at,

      (
        SELECT message.content
        FROM ai_agent_chat_messages message
        WHERE message.session_id = session.id
        ORDER BY message.created_at DESC
        LIMIT 1
      ) AS last_message,

      (
        SELECT COUNT(*)::int
        FROM ai_agent_chat_messages message
        WHERE message.session_id = session.id
      ) AS message_count

    FROM ai_agent_chat_sessions session

    WHERE session.team_id = $1
      AND session.status = 'active'

    ORDER BY session.updated_at DESC

    LIMIT $2
    `,
      [teamId, safeLimit],
    );

    return {
      items: rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,

        lastMessage: row.last_message || "",

        messageCount: Number(row.message_count || 0),

        createdAt: row.created_at,

        updatedAt: row.updated_at,
      })),
    };
  }

  async createAgentChatSession(teamId: string, userId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const { rows } = await this.db.query(
      `
    INSERT INTO ai_agent_chat_sessions (
      team_id,
      created_by,
      title,
      status,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      'New Chat',
      'active',
      NOW(),
      NOW()
    )
    RETURNING
      id,
      title,
      status,
      created_at,
      updated_at
    `,
      [teamId, userId],
    );

    const row = rows[0];

    return {
      id: row.id,
      title: row.title,
      status: row.status,
      messages: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAgentChatSession(teamId: string, sessionId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const sessionResult = await this.db.query(
      `
      SELECT
        id,
        title,
        status,
        created_at,
        updated_at
      FROM ai_agent_chat_sessions
      WHERE id = $1
        AND team_id = $2
      LIMIT 1
      `,
      [sessionId, teamId],
    );

    const session = sessionResult.rows[0];
    if (!session) {
      throw new ForbiddenException("Chat session not found");
    }
    const messagesResult = await this.db.query(
      `
      SELECT
        id,
        role,
        content,
        metadata,
        created_at
      FROM ai_agent_chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      `,
      [sessionId],
    );

    return {
      id: session.id,
      title: session.title,
      status: session.status,

      messages: messagesResult.rows.map((row: any) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      })),

      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }

  async sendAgentChatMessage(
    teamId: string,
    userId: string,
    body: {
      message: string;
      sessionId?: string;
      attachments?: any[];
    },
  ) {
    console.log("CHAT SERVICE");
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }
    const message = String(body.message || "").trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const requestedCapability = this.resolveRequestedCapability(message);

    await this.assertAgentActionAllowed(teamId, requestedCapability?.key, {
      defaultValue: requestedCapability?.defaultValue ?? true,

      checkWorkingHours: false,
      allowWhenPaused: true,
      channel: "web",

      metadata: {
        userId,
        sessionId: body.sessionId || null,
      },
    });
    if (!message && attachments.length === 0) {
      throw new ForbiddenException("Message or attachment is required");
    }
    let sessionId = String(body.sessionId || "").trim();
    if (sessionId) {
      const validSession = await this.db.query(
        `
        SELECT id
        FROM ai_agent_chat_sessions
        WHERE id = $1
          AND team_id = $2
          AND status = 'active'
        LIMIT 1
        `,
        [sessionId, teamId],
      );

      if (!validSession.rows[0]) {
        sessionId = "";
      }
    }
    if (!sessionId) {
      const session = await this.createAgentChatSession(teamId, userId);
      sessionId = session.id;
    }
    const userMessageResult = await this.db.query(
      `
      INSERT INTO ai_agent_chat_messages (
        session_id,
        role,
        content,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'user',
        $2,
        $3::jsonb,
        NOW()
      )
      RETURNING
        id,
        role,
        content,
        metadata,
        created_at
      `,
      [
        sessionId,
        message || "Analyze the attached files.",

        JSON.stringify({
          attachments,
        }),
      ],
    );

    const aiResponse = await this.cortexaAgent({
      user: {
        id: userId,
        teamId,
      },

      body: {
        message,
        attachments,
        conversationId: sessionId,
      },
    });
    const assistantContent = String(
      aiResponse?.answer || "No response returned.",
    );
    const assistantMessageResult = await this.db.query(
      `
      INSERT INTO ai_agent_chat_messages (
        session_id,
        role,
        content,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'assistant',
        $2,
        $3::jsonb,
        NOW()
      )
      RETURNING
        id,
        role,
        content,
        metadata,
        created_at
      `,
      [
        sessionId,
        assistantContent,
        JSON.stringify({
          usage: aiResponse?.usage || null,
        }),
      ],
    );
    const sessionMessageCount = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM ai_agent_chat_messages
      WHERE session_id = $1
      `,
      [sessionId],
    );

    if (Number(sessionMessageCount.rows[0]?.total || 0) <= 2) {
      const title =
        message.length > 60
          ? `${message.slice(0, 60)}...`
          : message || "Attachment Chat";

      await this.db.query(
        `
      UPDATE ai_agent_chat_sessions
      SET
        title = $2,
        updated_at = NOW()
      WHERE id = $1
      `,
        [sessionId, title],
      );
    } else {
      await this.db.query(
        `
      UPDATE ai_agent_chat_sessions
      SET updated_at = NOW()
      WHERE id = $1
      `,
        [sessionId],
      );
    }

    const mapMessage = (row: any) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    });

    return {
      success: true,
      sessionId,
      conversationId: sessionId,
      answer: assistantContent,
      userMessage: mapMessage(userMessageResult.rows[0]),
      assistantMessage: mapMessage(assistantMessageResult.rows[0]),
      usage: aiResponse?.usage || null,
    };
  }

  async importAgentKnowledge(teamId: string, userId: string, items: any[]) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    if (!Array.isArray(items)) {
      throw new ForbiddenException("Knowledge items must be an array");
    }

    if (items.length === 0) {
      throw new ForbiddenException("At least one knowledge item is required");
    }

    if (items.length > 500) {
      throw new ForbiddenException("Maximum 500 knowledge items per import");
    }

    const validItems: any[] = [];
    const rejectedItems: Array<{
      index: number;
      title: string;
      reason: string;
    }> = [];

    items.forEach((item, index) => {
      try {
        const payload = this.validateKnowledgePayload({
          category: item?.category || "company_information",

          sourceType: item?.sourceType || "text",

          title: item?.title,

          content: item?.content,

          sourceUrl: item?.sourceUrl,

          status: item?.status || "active",

          priority: item?.priority || 0,

          metadata: item?.metadata || {},
        });

        validItems.push({
          ...payload,
          originalIndex: index,
        });
      } catch (error: any) {
        rejectedItems.push({
          index,
          title: String(item?.title || "").trim() || `Item ${index + 1}`,

          reason: error?.message || "Invalid knowledge item",
        });
      }
    });

    if (validItems.length === 0) {
      return {
        success: false,
        imported: 0,
        rejected: rejectedItems.length,
        rejectedItems,
      };
    }

    await this.db.query("BEGIN");

    try {
      const importedItems: any[] = [];

      for (const item of validItems) {
        const { rows } = await this.db.query(
          `
          INSERT INTO ai_agent_knowledge_items (
            team_id,
            created_by,

            category,
            source_type,

            title,
            content,

            source_url,
            metadata,

            status,
            priority,

            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,

            $3,
            $4,

            $5,
            $6,

            $7,
            $8::jsonb,

            $9,
            $10,

            NOW(),
            NOW()
          )
          RETURNING
            id,
            category,
            source_type,
            title,
            content,
            source_url,
            metadata,
            status,
            priority,
            created_at,
            updated_at
          `,
          [
            teamId,
            userId,

            item.category,
            item.sourceType,

            item.title,
            item.content,

            item.sourceUrl,

            JSON.stringify({
              ...(item.metadata || {}),
              imported: true,
              importedAt: new Date().toISOString(),
            }),

            item.status,
            item.priority,
          ],
        );

        importedItems.push(rows[0]);
      }

      await this.db.query(
        `
      INSERT INTO ai_activity (
        team_id,
        action,
        channel,
        outcome,
        metadata,
        created_at
      )
      VALUES (
        $1,
        'knowledge_bulk_imported',
        'web',
        'success',
        $2::jsonb,
        NOW()
      )
      `,
        [
          teamId,
          JSON.stringify({
            userId,
            imported: importedItems.length,
            rejected: rejectedItems.length,
            categories: Array.from(
              new Set(importedItems.map((item) => item.category)),
            ),
          }),
        ],
      );
      await this.db.query("COMMIT");
      return {
        success: true,
        imported: importedItems.length,
        rejected: rejectedItems.length,
        rejectedItems,
        items: importedItems.map((row: any) => this.mapKnowledgeItem(row)),
      };
    } catch (error) {
      await this.db.query("ROLLBACK");
      console.error("IMPORT AI KNOWLEDGE ERROR:", error);
      throw error;
    }
  }

  private escapeCsvValue(value: unknown) {
    if (value === null || value === undefined) {
      return "";
    }
    const text =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  async exportAgentActivityCsv(
    teamId: string,

    params: {
      type?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }

    const values: any[] = [teamId];

    const where: string[] = ["activity.team_id = $1"];

    const type = String(params.type || "all")
      .trim()
      .toLowerCase();

    const status = String(params.status || "all")
      .trim()
      .toLowerCase();

    const search = String(params.search || "").trim();

    if (type && type !== "all") {
      values.push(type);

      const typeParam = `$${values.length}`;

      where.push(`
      (
        LOWER(
          COALESCE(
            activity.action,
            ''
          )
        ) LIKE '%' || ${typeParam} || '%'

        OR LOWER(
          COALESCE(
            activity.channel,
            ''
          )
        ) = ${typeParam}

        OR LOWER(
          COALESCE(
            activity.metadata->>'type',
            ''
          )
        ) = ${typeParam}

        OR LOWER(
          COALESCE(
            activity.metadata->>'category',
            ''
          )
        ) = ${typeParam}
      )
    `);
    }

    if (status && status !== "all") {
      values.push(status);

      const statusParam = `$${values.length}`;

      where.push(`
      LOWER(
        COALESCE(
          activity.outcome,
          ''
        )
      ) = ${statusParam}
    `);
    }

    if (search) {
      values.push(`%${search}%`);

      const searchParam = `$${values.length}`;

      where.push(`
      (
        activity.action
          ILIKE ${searchParam}

        OR activity.channel
          ILIKE ${searchParam}

        OR activity.outcome
          ILIKE ${searchParam}

        OR activity.metadata::text
          ILIKE ${searchParam}
      )
    `);
    }

    const result = await this.db.query(
      `
      SELECT
        activity.id,
        activity.action,
        activity.channel,
        activity.outcome,
        activity.metadata,
        activity.created_at

      FROM ai_activity activity

      WHERE ${where.join(" AND ")}

      ORDER BY
        activity.created_at DESC
      `,
      values,
    );

    const headers = [
      "ID",
      "Date",
      "Time",
      "Action",
      "Type",
      "Channel",
      "Status",
      "Title",
      "Description",
      "Lead",
      "Contact",
      "Property",
      "Prompt",
      "AI Response",
      "Execution Time",
      "Tokens",
      "Confidence",
    ];

    const rows = result.rows.map((row: any) => {
      const metadata =
        row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const createdAt = row.created_at ? new Date(row.created_at) : null;
      const date =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? createdAt.toISOString().slice(0, 10)
          : "";

      const time =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? createdAt.toISOString().slice(11, 19)
          : "";

      const itemType =
        metadata.type ||
        metadata.category ||
        metadata.iconKey ||
        row.channel ||
        "";

      const values = [
        row.id,
        date,
        time,
        row.action,
        itemType,
        row.channel,
        row.outcome,
        metadata.title || metadata.label || "",
        metadata.description || metadata.summary || "",
        metadata.leadName || metadata.lead_name || "",
        metadata.contactName || metadata.contact_name || "",
        metadata.propertyTitle ||
          metadata.property_title ||
          metadata.propertyAddress ||
          "",

        metadata.prompt || metadata.userMessage || "",
        metadata.response || metadata.aiResponse || metadata.answer || "",
        metadata.executionTimeMs || metadata.durationMs || "",
        metadata.tokens || metadata.totalTokens || "",
        metadata.confidence || metadata.confidenceScore || "",
      ];
      return values.map((value) => this.escapeCsvValue(value)).join(",");
    });

    const csv = [
      headers.map((header) => this.escapeCsvValue(header)).join(","),
      ...rows,
    ].join("\r\n");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return {
      filename: `ai-agent-activity-${timestamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      total: result.rows.length,
      csv,
    };
  }
  async getAgentActivityDetail(teamId: string, activityId: string) {
    if (!teamId) {
      throw new ForbiddenException("Team is required");
    }
    if (!activityId) {
      throw new NotFoundException("Activity ID is required");
    }
    const result = await this.db.query(
      `
      SELECT
        activity.id,
        activity.team_id,
        activity.action,
        activity.channel,
        activity.outcome,
        activity.metadata,
        activity.created_at

      FROM ai_activity activity

      WHERE activity.id = $1
        AND activity.team_id = $2

      LIMIT 1
      `,
      [activityId, teamId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException("AI activity not found");
    }
    const metadata =
      row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const action = String(row.action || "");
    const normalizedAction = action
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());

    return {
      id: row.id,

      action,
      actionLabel:
        metadata.actionLabel ||
        metadata.title ||
        normalizedAction ||
        "AI Activity",

      title:
        metadata.title || metadata.label || normalizedAction || "AI Activity",
      description: metadata.description || metadata.summary || "",
      type: metadata.type || metadata.category || row.channel || action,
      iconKey: metadata.iconKey || metadata.type || action,
      channel: row.channel,
      outcome: row.outcome,
      status: row.outcome || metadata.status || "success",
      statusLabel:
        metadata.statusLabel ||
        (row.outcome === "success" ? "Completed" : row.outcome),
      prompt:
        metadata.prompt || metadata.userMessage || metadata.user_message || "",

      response:
        metadata.response ||
        metadata.aiResponse ||
        metadata.ai_response ||
        metadata.answer ||
        "",

      executionTimeMs:
        metadata.executionTimeMs ??
        metadata.execution_time_ms ??
        metadata.durationMs ??
        metadata.duration_ms ??
        null,

      tokens:
        metadata.tokens ??
        metadata.totalTokens ??
        metadata.total_tokens ??
        null,

      confidence:
        metadata.confidence ??
        metadata.confidenceScore ??
        metadata.confidence_score ??
        null,

      leadName: metadata.leadName || metadata.lead_name || null,

      contactName: metadata.contactName || metadata.contact_name || null,

      propertyTitle:
        metadata.propertyTitle ||
        metadata.property_title ||
        metadata.propertyAddress ||
        metadata.property_address ||
        null,

      appointmentTitle:
        metadata.appointmentTitle || metadata.appointment_title || null,

      conversationId:
        metadata.conversationId ||
        metadata.conversation_id ||
        metadata.sessionId ||
        metadata.session_id ||
        null,

      createdAt: row.created_at,

      metadata,
    };
  }
}
