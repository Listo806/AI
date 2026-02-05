import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const ALLOWED_TONES = ['professional', 'friendly', 'sales'] as const;
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
  constructor(private readonly db: DatabaseService) {}

  async getOverview(teamId: string): Promise<OverviewResponse> {
    const [team, recent] = await Promise.all([
      this.getTeamAiSettings(teamId),
      this.getRecentAiActions(teamId, 5),
    ]);
    const activeChannels = await this.getActiveChannels(teamId);

    return {
      ai_auto_reply: {
        enabled: team.ai_auto_reply_enabled ?? true,
        tone: team.ai_auto_reply_tone ?? 'professional',
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
      tone: team.ai_auto_reply_tone ?? 'professional',
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
        throw new ForbiddenException('Invalid tone');
      }
      updates.push(`ai_auto_reply_tone = $${n++}`);
      params.push(body.tone);
    }

    if (updates.length === 0) return this.getAutoReply(teamId);

    params.push(teamId);
    await this.db.query(
      `UPDATE teams SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${n}`,
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

  async getAppointmentSetterStatus(teamId: string): Promise<AppointmentSetterStatusResponse> {
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

  async getActivity(teamId: string, limit: number = 10): Promise<RecentAiAction[]> {
    return this.getRecentAiActions(teamId, limit);
  }

  async getQualificationRules(teamId: string): Promise<{ name: string; updated_at: string | null }> {
    await this.db.query(
      `INSERT INTO team_ai_config (team_id, name, updated_at)
       VALUES ($1, 'Default', NOW())
       ON CONFLICT (team_id) DO NOTHING`,
      [teamId],
    );
    const { rows } = await this.db.query(
      `SELECT name, updated_at FROM team_ai_config WHERE team_id = $1`,
      [teamId],
    );
    const r = rows[0];
    return {
      name: r?.name ?? 'Default',
      updated_at: r?.updated_at ?? null,
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
      channels.push('whatsapp');
    }
    if (!channels.includes('whatsapp')) {
      const { rows: agentWa } = await this.db.query(
        `SELECT 1 FROM agent_whatsapp_connections aw
         INNER JOIN users u ON u.id = aw.agent_id AND u.team_id = $1
         WHERE aw.status = 'connected' LIMIT 1`,
        [teamId],
      );
      if (agentWa.length > 0) channels.push('whatsapp');
    }

    const { rows: agentIg } = await this.db.query(
      `SELECT 1 FROM agent_instagram_connections ai
       INNER JOIN users u ON u.id = ai.agent_id AND u.team_id = $1
       WHERE ai.status = 'connected' LIMIT 1`,
      [teamId],
    );
    if (agentIg.length > 0) channels.push('instagram');

    return channels;
  }

  private async getRecentAiActions(teamId: string, limit: number): Promise<RecentAiAction[]> {
    const { rows } = await this.db.query(
      `SELECT id, action, lead_id, channel, outcome, created_at
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
    }));
  }
}
