import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const AESTHETIC = 'aesthetic-wellness';

@Injectable()
export class WorkspaceAiSetupService {
  constructor(private readonly db: DatabaseService) {}

  supports(workspaceId?: string | null) {
    return String(workspaceId || '').trim().toLowerCase() === AESTHETIC;
  }

  private require(teamId?: string | null, workspaceId?: string | null) {
    if (!teamId) throw new ForbiddenException('Team is required.');
    const ws = String(workspaceId || '').trim().toLowerCase();
    if (!this.supports(ws)) throw new BadRequestException(`Unsupported workspace setup: ${ws || 'empty'}`);
    return ws;
  }

  private async ensure(teamId: string, workspaceId: string) {
    await this.db.query(
      `INSERT INTO workspace_ai_setup_configs(team_id,workspace_id)
       VALUES($1,$2)
       ON CONFLICT(team_id,workspace_id) DO NOTHING`,
      [teamId, workspaceId],
    );
  }

  private async activeChannels(teamId: string) {
    const channels: string[] = [];
    const { rows } = await this.db.query(
      `SELECT whatsapp_phone FROM teams WHERE id=$1 LIMIT 1`,
      [teamId],
    );
    if (rows[0]?.whatsapp_phone) channels.push('whatsapp');
    const qr = await this.db.query(
      `SELECT 1 FROM whatsapp_qr_sessions
        WHERE team_id=$1 AND status='connected' LIMIT 1`,
      [teamId],
    ).catch(() => ({ rows: [] as any[] }));
    if (qr.rows.length && !channels.includes('whatsapp')) channels.push('whatsapp');
    return channels;
  }

  async getSetup(teamId: string, workspaceId: string) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);

    const [cfg, channels, treatmentCount, providerCount] = await Promise.all([
      this.db.query(
        `SELECT * FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2 LIMIT 1`,
        [teamId, ws],
      ),
      this.activeChannels(teamId),
      this.db.query(
        `SELECT COUNT(*)::int total FROM aesthetic_treatments
          WHERE team_id=$1 AND workspace_id=$2 AND is_active=true`,
        [teamId, ws],
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM aesthetic_providers
          WHERE team_id=$1 AND workspace_id=$2 AND is_active=true`,
        [teamId, ws],
      ),
    ]);

    const r = cfg.rows[0] || {};
    const whatsappConnected = channels.includes('whatsapp');
    const clinicConfigured = Number(treatmentCount.rows[0]?.total || 0) > 0 && Number(providerCount.rows[0]?.total || 0) > 0;

    const required = [
      whatsappConnected,
      !!r.business_profile_completed,
      clinicConfigured,
      !!r.appointment_rules_configured,
      !!r.behavior_configured,
      !!r.automations_configured,
      !!r.tested,
    ];
    const launchUnlocked = required.every(Boolean);
    const launched = !!r.launched && launchUnlocked;
    const completedSteps = required.filter(Boolean).length + (launched ? 1 : 0);
    const totalSteps = required.length + 1;

    return {
      workspaceId: ws,
      workspaceType: 'aesthetic-wellness',
      isSetupComplete: launched,
      agentStatus: r.paused ? 'paused' : launched ? 'active' : 'setup',
      completedSteps,
      totalSteps,
      progress: Math.round((completedSteps / totalSteps) * 100),
      whatsapp: {
        connected: whatsappConnected,
        status: whatsappConnected ? 'Connected' : 'Not connected',
        pairingCode: null,
        qrCode: null,
        expiresIn: null,
        expiresLabel: '--:--',
      },
      businessProfile: {
        completed: !!r.business_profile_completed,
        status: r.business_profile_completed ? 'Complete' : 'Incomplete',
      },
      clinic: {
        configured: clinicConfigured,
        completed: clinicConfigured,
        treatments: Number(treatmentCount.rows[0]?.total || 0),
        providers: Number(providerCount.rows[0]?.total || 0),
        status: clinicConfigured ? 'Configured' : 'Treatments & providers required',
      },
      properties: {
        imported: 0,
        skipped: true,
        status: 'Not used for Aesthetic & Wellness',
      },
      appointmentRules: {
        ...(r.appointment_rules || {}),
        configured: !!r.appointment_rules_configured,
        completed: !!r.appointment_rules_configured,
        status: r.appointment_rules_configured ? 'Configured' : 'Not configured',
      },
      behavior: {
        ...(r.behavior || {}),
        configured: !!r.behavior_configured,
        completed: !!r.behavior_configured,
        status: r.behavior_configured ? 'Configured' : 'Not configured',
      },
      automations: {
        ...(r.automations || {}),
        configured: !!r.automations_configured,
        completed: !!r.automations_configured,
        status: r.automations_configured ? 'Configured' : 'Not configured',
      },
      testAi: {
        tested: !!r.tested,
        status: r.tested ? 'Tested' : 'Not tested',
      },
      launch: {
        unlocked: launchUnlocked,
        launched,
        status: launched ? 'Launched' : launchUnlocked ? 'Ready' : 'Locked',
      },
      firstIncompleteStep: this.firstIncompleteStep({
        whatsappConnected,
        business: !!r.business_profile_completed,
        clinic: clinicConfigured,
        appointment: !!r.appointment_rules_configured,
        behavior: !!r.behavior_configured,
        automations: !!r.automations_configured,
        tested: !!r.tested,
        launched,
      }),
    };
  }

  private firstIncompleteStep(v: any) {
    if (!v.whatsappConnected) return 1;
    if (!v.business) return 2;
    if (!v.clinic) return 3;
    if (!v.appointment) return 4;
    if (!v.behavior) return 5;
    if (!v.automations) return 6;
    if (!v.tested) return 7;
    if (!v.launched) return 8;
    return 8;
  }

  async updateSetup(teamId: string, workspaceId: string, body: any) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const current = await this.getSetup(teamId, ws);
    if (body?.launched === true && !current.launch.unlocked) {
      throw new ForbiddenException('Complete all required clinic setup steps before launching the AI receptionist.');
    }

    const mappings: Record<string, string> = {
      businessProfileCompleted: 'business_profile_completed',
      appointmentRulesConfigured: 'appointment_rules_configured',
      behaviorConfigured: 'behavior_configured',
      automationsConfigured: 'automations_configured',
      tested: 'tested',
      launched: 'launched',
      paused: 'paused',
    };
    const sets: string[] = [];
    const values: any[] = [teamId, ws];
    Object.entries(mappings).forEach(([key, col]) => {
      if (body?.[key] !== undefined) {
        values.push(!!body[key]);
        sets.push(`${col}=$${values.length}`);
      }
    });
    if (sets.length) {
      await this.db.query(
        `UPDATE workspace_ai_setup_configs SET ${sets.join(',')},updated_at=now()
          WHERE team_id=$1 AND workspace_id=$2`,
        values,
      );
    }

    if (body?.tested === true) {
      await this.db.query(
        `INSERT INTO ai_activity(team_id,workspace_id,action,channel,outcome,metadata,created_at)
         VALUES($1,$2,'ai_test','web','success','{}'::jsonb,now())`,
        [teamId, ws],
      );
    }
    if (body?.launched === true && !current.launch.launched) {
      await this.db.query(
        `INSERT INTO ai_activity(team_id,workspace_id,action,channel,outcome,metadata,created_at)
         VALUES($1,$2,'agent_launched','web','success',$3::jsonb,now())`,
        [teamId, ws, JSON.stringify({ launchedAt: new Date().toISOString() })],
      );
    }
    return this.getSetup(teamId, ws);
  }

  async getBusinessProfile(teamId: string, workspaceId: string) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `SELECT business_profile FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2`,
      [teamId, ws],
    );
    return rows[0]?.business_profile || {};
  }

  async saveBusinessProfile(teamId: string, workspaceId: string, body: any) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const completed = !!String(body?.businessName || body?.business_name || '').trim();
    const { rows } = await this.db.query(
      `UPDATE workspace_ai_setup_configs
          SET business_profile=$3::jsonb,business_profile_completed=$4,updated_at=now()
        WHERE team_id=$1 AND workspace_id=$2 RETURNING business_profile`,
      [teamId, ws, JSON.stringify(body || {}), completed],
    );
    return rows[0]?.business_profile || body;
  }

  async getAppointmentRules(teamId: string, workspaceId: string) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `SELECT appointment_rules FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2`,
      [teamId, ws],
    );
    return rows[0]?.appointment_rules || {};
  }

  async saveAppointmentRules(teamId: string, workspaceId: string, body: any) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `UPDATE workspace_ai_setup_configs
          SET appointment_rules=$3::jsonb,appointment_rules_configured=true,updated_at=now()
        WHERE team_id=$1 AND workspace_id=$2 RETURNING appointment_rules`,
      [teamId, ws, JSON.stringify(body || {})],
    );
    return rows[0]?.appointment_rules || body;
  }

  async getBehavior(teamId: string, workspaceId: string) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `SELECT behavior FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2`,
      [teamId, ws],
    );
    return rows[0]?.behavior || {};
  }

  async saveBehavior(teamId: string, workspaceId: string, body: any) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const safetyRules = Array.isArray(body?.forbiddenTopics) ? body.forbiddenTopics : [];
    const questions = Array.isArray(body?.qualificationQuestions) ? body.qualificationQuestions : [];
    const { rows } = await this.db.query(
      `UPDATE workspace_ai_setup_configs
          SET behavior=$3::jsonb,qualification_questions=$4::jsonb,safety_rules=$5::jsonb,
              behavior_configured=true,updated_at=now()
        WHERE team_id=$1 AND workspace_id=$2 RETURNING behavior`,
      [teamId, ws, JSON.stringify(body || {}), JSON.stringify(questions), JSON.stringify(safetyRules)],
    );
    return rows[0]?.behavior || body;
  }

  async getAutomations(teamId: string, workspaceId: string) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `SELECT automations FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2`,
      [teamId, ws],
    );
    return rows[0]?.automations || {};
  }

  async saveAutomations(teamId: string, workspaceId: string, body: any) {
    const ws = this.require(teamId, workspaceId);
    await this.ensure(teamId, ws);
    const { rows } = await this.db.query(
      `UPDATE workspace_ai_setup_configs
          SET automations=$3::jsonb,automations_configured=true,updated_at=now()
        WHERE team_id=$1 AND workspace_id=$2 RETURNING automations`,
      [teamId, ws, JSON.stringify(body || {})],
    );
    return rows[0]?.automations || body;
  }
}
