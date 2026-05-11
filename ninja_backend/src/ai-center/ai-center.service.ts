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
              text:
                message ||
                "Analyze the uploaded attachment.",
            },

            ...attachments
              .filter((a) =>
                a.type?.startsWith("image/"),
              )
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
