import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

const WORKSPACE_ID = "aesthetic-wellness";

type DashboardFilters = {
  range?: string;
  locationId?: string;
  providerId?: string;
};

@Injectable()
export class AestheticWellnessService {
  private schemaReady = false;
  private schemaPromise: Promise<void> | null = null;

  constructor(private readonly db: DatabaseService) {}

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) {
      return;
    }

    if (this.schemaPromise) {
      return this.schemaPromise;
    }

    this.schemaPromise = (async () => {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS workspace_ai_setup_configs (
          team_id UUID NOT NULL,
          workspace_id VARCHAR(64) NOT NULL,

          business_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
          appointment_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
          behavior JSONB NOT NULL DEFAULT '{}'::jsonb,
          automations JSONB NOT NULL DEFAULT '{}'::jsonb,
          pipeline_config JSONB NOT NULL DEFAULT '{}'::jsonb,

          qualification_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          safety_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
          faqs JSONB NOT NULL DEFAULT '[]'::jsonb,

          business_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
          appointment_rules_configured BOOLEAN NOT NULL DEFAULT FALSE,
          behavior_configured BOOLEAN NOT NULL DEFAULT FALSE,
          automations_configured BOOLEAN NOT NULL DEFAULT FALSE,

          tested BOOLEAN NOT NULL DEFAULT FALSE,
          launched BOOLEAN NOT NULL DEFAULT FALSE,
          paused BOOLEAN NOT NULL DEFAULT FALSE,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          PRIMARY KEY (team_id, workspace_id)
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_workspace_ai_setup_workspace
        ON workspace_ai_setup_configs(workspace_id, team_id)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_locations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL,
          workspace_id VARCHAR(64) NOT NULL DEFAULT 'aesthetic-wellness',

          name VARCHAR(180) NOT NULL,

          address_line1 TEXT,
          address_line2 TEXT,
          city VARCHAR(120),
          state VARCHAR(120),
          postal_code VARCHAR(32),
          country VARCHAR(120),

          timezone VARCHAR(100) DEFAULT 'UTC',

          is_active BOOLEAN NOT NULL DEFAULT TRUE,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_aesthetic_locations_team_ws
        ON aesthetic_locations(team_id, workspace_id, is_active)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_providers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL,
          workspace_id VARCHAR(64) NOT NULL DEFAULT 'aesthetic-wellness',

          user_id UUID,
          location_id UUID REFERENCES aesthetic_locations(id) ON DELETE SET NULL,

          name VARCHAR(180) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          title VARCHAR(120),

          availability JSONB NOT NULL DEFAULT '{}'::jsonb,

          is_active BOOLEAN NOT NULL DEFAULT TRUE,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_aesthetic_providers_team_ws
        ON aesthetic_providers(team_id, workspace_id, is_active)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_treatments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL,
          workspace_id VARCHAR(64) NOT NULL DEFAULT 'aesthetic-wellness',

          name VARCHAR(180) NOT NULL,
          category VARCHAR(120),
          description TEXT,

          duration_minutes INTEGER NOT NULL DEFAULT 30,

          price NUMERIC(12,2) NOT NULL DEFAULT 0,

          rebooking_days INTEGER,

          booking_buffer_before INTEGER NOT NULL DEFAULT 0,
          booking_buffer_after INTEGER NOT NULL DEFAULT 0,

          is_active BOOLEAN NOT NULL DEFAULT TRUE,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_team_ws
        ON aesthetic_treatments(team_id, workspace_id, is_active)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_provider_treatments (
          provider_id UUID NOT NULL
            REFERENCES aesthetic_providers(id)
            ON DELETE CASCADE,

          treatment_id UUID NOT NULL
            REFERENCES aesthetic_treatments(id)
            ON DELETE CASCADE,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

          PRIMARY KEY(provider_id, treatment_id)
        )
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_treatment_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

          team_id UUID NOT NULL,

          workspace_id VARCHAR(64)
            NOT NULL
            DEFAULT 'aesthetic-wellness',

          appointment_id UUID,
          contact_id UUID,
          lead_id UUID,

          provider_id UUID
            REFERENCES aesthetic_providers(id)
            ON DELETE SET NULL,

          treatment_id UUID
            REFERENCES aesthetic_treatments(id)
            ON DELETE SET NULL,

          revenue NUMERIC(12,2) NOT NULL DEFAULT 0,

          status VARCHAR(32)
            NOT NULL
            DEFAULT 'scheduled',

          completed_at TIMESTAMPTZ,
          next_rebook_at TIMESTAMPTZ,

          notes TEXT,

          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      /*
       * DO NOT put CHECK constraint here.
       * Existing deployments may already have a slightly
       * different treatment status vocabulary.
       */

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_aesthetic_records_team_ws
        ON aesthetic_treatment_records(
          team_id,
          workspace_id,
          status,
          completed_at
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_aesthetic_records_rebook
        ON aesthetic_treatment_records(
          team_id,
          workspace_id,
          next_rebook_at
        )
      `);

      /*
       * Existing CRM tables.
       *
       * These ALTERs are intentionally idempotent so production
       * databases can upgrade safely when the service starts.
       */

      await this.db.query(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS aesthetic_location_id UUID
      `);

      await this.db.query(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS aesthetic_provider_id UUID
      `);

      await this.db.query(`
        ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS aesthetic_treatment_id UUID
      `);

      await this.db.query(`
        ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE contacts
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE deals
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE ai_activity
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE lead_tasks
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        ALTER TABLE whatsapp_qr_messages
        ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(64)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_appointments_team_workspace
        ON appointments(team_id, workspace_id, start_at)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_team_workspace
        ON leads(team_id, workspace_id, created_at)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_contacts_team_workspace
        ON contacts(team_id, workspace_id, created_at)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_deals_team_workspace
        ON deals(team_id, workspace_id, stage)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_activity_team_workspace
        ON ai_activity(team_id, workspace_id, created_at)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_lead_tasks_team_workspace
        ON lead_tasks(team_id, workspace_id, due_date)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_wa_messages_team_workspace
        ON whatsapp_qr_messages(team_id, workspace_id, created_at)
      `);

      this.schemaReady = true;
    })();

    try {
      await this.schemaPromise;
    } catch (error) {
      this.schemaReady = false;

      console.error("[AESTHETIC] ensureSchema failed:", error);

      throw error;
    } finally {
      this.schemaPromise = null;
    }
  }

  private async safeQuery<T = any>(
    label: string,
    sql: string,
    params: any[] = [],
  ): Promise<{ rows: T[] }> {
    try {
      return await this.db.query(sql, params);
    } catch (error: any) {
      console.error(`[AESTHETIC] query failed: ${label}`, {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
      });

      return {
        rows: [],
      };
    }
  }
  private requireTeam(teamId?: string | null) {
    if (!teamId)
      throw new ForbiddenException("A CRM team/account is required.");
    return teamId;
  }

  private async assertProvider(teamId: string, providerId?: string) {
    if (!providerId) return null;
    const { rows } = await this.db.query(
      `SELECT id, user_id, location_id, name
         FROM aesthetic_providers
        WHERE id = $1 AND team_id = $2 AND workspace_id = $3 AND is_active = true
        LIMIT 1`,
      [providerId, teamId, WORKSPACE_ID],
    );
    if (!rows[0])
      throw new BadRequestException("Invalid provider for this workspace.");
    return rows[0];
  }

  private async assertLocation(teamId: string, locationId?: string) {
    if (!locationId) return null;
    const { rows } = await this.db.query(
      `SELECT id, name, timezone
         FROM aesthetic_locations
        WHERE id = $1 AND team_id = $2 AND workspace_id = $3 AND is_active = true
        LIMIT 1`,
      [locationId, teamId, WORKSPACE_ID],
    );
    if (!rows[0])
      throw new BadRequestException("Invalid location for this workspace.");
    return rows[0];
  }

  private rangeSql(range = "today", column = "created_at") {
    switch (String(range || "today").toLowerCase()) {
      case "7d":
      case "7days":
        return `${column} >= CURRENT_DATE - INTERVAL '6 days'`;
      case "30d":
      case "30days":
        return `${column} >= CURRENT_DATE - INTERVAL '29 days'`;
      case "month":
      case "this-month":
        return `${column} >= date_trunc('month', CURRENT_DATE)`;
      case "today":
      default:
        return `${column} >= CURRENT_DATE AND ${column} < CURRENT_DATE + INTERVAL '1 day'`;
    }
  }

  async getSetupStatus(teamId: string) {
    this.requireTeam(teamId);

    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT business_profile_completed, appointment_rules_configured,
              behavior_configured, automations_configured, tested,
              launched, paused, updated_at
         FROM workspace_ai_setup_configs
        WHERE team_id = $1 AND workspace_id = $2
        LIMIT 1`,
      [teamId, WORKSPACE_ID],
    );

    const r = rows[0] || {};
    const checks = [
      !!r.business_profile_completed,
      await this.hasClinicConfiguration(teamId),
      !!r.appointment_rules_configured,
      !!r.behavior_configured,
      !!r.automations_configured,
      !!r.tested,
    ];
    const firstIncompleteIndex = checks.findIndex((v) => !v);
    const firstIncompleteStep =
      firstIncompleteIndex === -1 ? 7 : firstIncompleteIndex + 1;
    const launchUnlocked = checks.every(Boolean);
    const launched = !!r.launched && launchUnlocked;

    return {
      completed: launched,
      launched,
      paused: !!r.paused,
      launchUnlocked,
      firstIncompleteStep,
      completedSteps: checks.filter(Boolean).length + (launched ? 1 : 0),
      totalSteps: 7,
      updatedAt: r.updated_at || null,
    };
  }

  async hasClinicConfiguration(teamId: string) {
    const [t, p] = await Promise.all([
      this.db.query(
        `SELECT 1 FROM aesthetic_treatments
          WHERE team_id = $1 AND workspace_id = $2 AND is_active = true LIMIT 1`,
        [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT 1 FROM aesthetic_providers
          WHERE team_id = $1 AND workspace_id = $2 AND is_active = true LIMIT 1`,
        [teamId, WORKSPACE_ID],
      ),
    ]);
    return t.rows.length > 0 && p.rows.length > 0;
  }

  async getDashboard(teamId: string, filters: DashboardFilters = {}) {
    this.requireTeam(teamId);

    await this.ensureSchema();

    console.log("[AESTHETIC] dashboard", {
      teamId,
      range: filters.range || "today",
      locationId: filters.locationId || null,
      providerId: filters.providerId || null,
    });
    const provider = await this.assertProvider(teamId, filters.providerId);
    const location = await this.assertLocation(teamId, filters.locationId);

    const apptParams: any[] = [teamId, WORKSPACE_ID];
    const apptWhere = ["a.team_id = $1", "a.workspace_id = $2"];
    if (location) {
      apptParams.push(location.id);
      apptWhere.push(`a.aesthetic_location_id = $${apptParams.length}`);
    }
    if (provider) {
      apptParams.push(provider.id);
      apptWhere.push(`a.aesthetic_provider_id = $${apptParams.length}`);
    }

    const leadParams: any[] = [teamId, WORKSPACE_ID];
    const leadWhere = ["l.team_id = $1", "l.workspace_id = $2"];
    if (provider?.user_id) {
      leadParams.push(provider.user_id);
      leadWhere.push(`l.assigned_to = $${leadParams.length}`);
    }

    const todayApptWhere = [
      ...apptWhere,
      this.rangeSql("today", "a.start_at"),
    ].join(" AND ");
    const selectedApptWhere = [
      ...apptWhere,
      this.rangeSql(filters.range || "today", "a.start_at"),
    ].join(" AND ");
    const todayLeadWhere = [
      ...leadWhere,
      this.rangeSql("today", "l.created_at"),
    ].join(" AND ");

    const [
      setup,
      newInquiries,
      prevInquiries,
      bookedToday,
      prevBooked,
      appointmentsToday,
      prevAppointments,
      showRate,
      prevShowRate,
      revenueToday,
      prevRevenue,
      rebookingDue,
      prevRebooking,
      schedule,
      pipeline,
      treatmentInterest,
      rebookClients,
      followups,
      providerPerformance,
      revenueOverview,
      activity,
      conversationStats,
    ] = await Promise.all([
      this.getSetupStatus(teamId),
      this.db.query(
        `SELECT COUNT(*)::int total FROM leads l WHERE ${todayLeadWhere}`,
        leadParams,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM leads l
          WHERE ${leadWhere.join(" AND ")}
            AND l.created_at >= CURRENT_DATE - INTERVAL '1 day'
            AND l.created_at < CURRENT_DATE`,
        leadParams,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM appointments a
          WHERE ${todayApptWhere} AND a.type = 'consultation'`,
        apptParams,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM appointments a
          WHERE ${apptWhere.join(" AND ")} AND a.type = 'consultation'
            AND a.start_at >= CURRENT_DATE - INTERVAL '1 day'
            AND a.start_at < CURRENT_DATE`,
        apptParams,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM appointments a WHERE ${todayApptWhere}`,
        apptParams,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM appointments a
          WHERE ${apptWhere.join(" AND ")}
            AND a.start_at >= CURRENT_DATE - INTERVAL '1 day'
            AND a.start_at < CURRENT_DATE`,
        apptParams,
      ),
      this.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE a.status IN ('completed','confirmed'))::int attended,
           COUNT(*) FILTER (WHERE a.status <> 'canceled')::int eligible
         FROM appointments a WHERE ${selectedApptWhere}`,
        apptParams,
      ),
      this.db.query(
        `SELECT
           COUNT(*) FILTER (WHERE a.status IN ('completed','confirmed'))::int attended,
           COUNT(*) FILTER (WHERE a.status <> 'canceled')::int eligible
         FROM appointments a
         WHERE ${apptWhere.join(" AND ")}
           AND a.start_at >= CURRENT_DATE - INTERVAL '7 days'
           AND a.start_at < CURRENT_DATE`,
        apptParams,
      ),
      this.db.query(
        `SELECT COALESCE(SUM(r.revenue),0)::numeric revenue
           FROM aesthetic_treatment_records r
          WHERE r.team_id = $1 AND r.workspace_id = $2
            AND r.status = 'completed'
            AND r.completed_at >= CURRENT_DATE
            AND r.completed_at < CURRENT_DATE + INTERVAL '1 day'
            ${filters.providerId ? "AND r.provider_id = $3" : ""}`,
        filters.providerId
          ? [teamId, WORKSPACE_ID, filters.providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT COALESCE(SUM(r.revenue),0)::numeric revenue
           FROM aesthetic_treatment_records r
          WHERE r.team_id = $1 AND r.workspace_id = $2
            AND r.status = 'completed'
            AND r.completed_at >= CURRENT_DATE - INTERVAL '1 day'
            AND r.completed_at < CURRENT_DATE
            ${filters.providerId ? "AND r.provider_id = $3" : ""}`,
        filters.providerId
          ? [teamId, WORKSPACE_ID, filters.providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT COUNT(*)::int total
           FROM aesthetic_treatment_records r
          WHERE r.team_id = $1 AND r.workspace_id = $2
            AND r.next_rebook_at IS NOT NULL
            AND r.next_rebook_at <= CURRENT_DATE + INTERVAL '7 days'
            AND r.next_rebook_at >= CURRENT_DATE - INTERVAL '30 days'
            ${filters.providerId ? "AND r.provider_id = $3" : ""}`,
        filters.providerId
          ? [teamId, WORKSPACE_ID, filters.providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT COUNT(*)::int total
           FROM aesthetic_treatment_records r
          WHERE r.team_id = $1 AND r.workspace_id = $2
            AND r.next_rebook_at >= CURRENT_DATE - INTERVAL '1 day'
            AND r.next_rebook_at < CURRENT_DATE
            ${filters.providerId ? "AND r.provider_id = $3" : ""}`,
        filters.providerId
          ? [teamId, WORKSPACE_ID, filters.providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT a.id, a.start_at, a.status, a.title,
                COALESCE(c.name, l.name, a.attendee_name, 'Client') client_name,
                COALESCE(t.name, a.title) service_name,
                COALESCE(p.name, u.name, 'Unassigned') provider_name
           FROM appointments a
           LEFT JOIN contacts c ON c.id = a.contact_id AND c.team_id = a.team_id
           LEFT JOIN leads l ON l.id = a.lead_id AND l.team_id = a.team_id
           LEFT JOIN aesthetic_treatments t ON t.id = a.aesthetic_treatment_id
           LEFT JOIN aesthetic_providers p ON p.id = a.aesthetic_provider_id
           LEFT JOIN users u ON u.id = a.assigned_to
          WHERE ${todayApptWhere}
          ORDER BY a.start_at ASC
          LIMIT 8`,
        apptParams,
      ),
      this.getPipeline(teamId, filters.providerId),
      this.db.query(
        `SELECT COALESCE(NULLIF(l.lead_metadata->>'treatment_interest',''), 'Other') name,
                COUNT(*)::int total
           FROM leads l
          WHERE l.team_id = $1 AND l.workspace_id = $2
            AND l.created_at >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY 1
          ORDER BY total DESC
          LIMIT 6`,
        [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT r.id,
                COALESCE(c.name, l.name, 'Client') client_name,
                COALESCE(t.name, 'Treatment') treatment_name,
                r.next_rebook_at
           FROM aesthetic_treatment_records r
           LEFT JOIN contacts c ON c.id = r.contact_id AND c.team_id = r.team_id
           LEFT JOIN leads l ON l.id = r.lead_id AND l.team_id = r.team_id
           LEFT JOIN aesthetic_treatments t ON t.id = r.treatment_id
          WHERE r.team_id = $1 AND r.workspace_id = $2
            AND r.next_rebook_at IS NOT NULL
            AND r.next_rebook_at <= CURRENT_DATE + INTERVAL '14 days'
            ${filters.providerId ? "AND r.provider_id = $3" : ""}
          ORDER BY r.next_rebook_at ASC
          LIMIT 5`,
        filters.providerId
          ? [teamId, WORKSPACE_ID, filters.providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.getFollowUpQueue(teamId, filters.providerId),
      this.getProviderPerformance(teamId, filters.locationId),
      this.getRevenueOverview(teamId, filters.providerId),
      this.db.query(
        `SELECT id, action, created_at, outcome, metadata
           FROM ai_activity
          WHERE team_id = $1 AND workspace_id = $2
          ORDER BY created_at DESC
          LIMIT 8`,
        [teamId, WORKSPACE_ID],
      ),
      this.getConversationStats(teamId),
    ]);

    const trend = (current: number, previous: number) => {
      if (!previous) return current ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    const percent = (a: number, b: number) =>
      b > 0 ? Math.round((a / b) * 100) : 0;

    const show = showRate.rows[0] || {};
    const prevShow = prevShowRate.rows[0] || {};
    const showNow = percent(
      Number(show.attended || 0),
      Number(show.eligible || 0),
    );
    const showPrev = percent(
      Number(prevShow.attended || 0),
      Number(prevShow.eligible || 0),
    );

    const treatmentRows = treatmentInterest.rows;
    const treatmentTotal = treatmentRows.reduce(
      (sum: number, row: any) => sum + Number(row.total || 0),
      0,
    );

    return {
      workspaceId: WORKSPACE_ID,
      setup,
      aiReceptionist: {
        live: setup.completed && !setup.paused,
        conversationsToday: conversationStats.conversationsToday,
        consultationsBooked: Number(bookedToday.rows[0]?.total || 0),
        avgResponseSeconds: conversationStats.avgResponseSeconds,
      },
      metrics: {
        newInquiries: {
          value: Number(newInquiries.rows[0]?.total || 0),
          trendPercent: trend(
            Number(newInquiries.rows[0]?.total || 0),
            Number(prevInquiries.rows[0]?.total || 0),
          ),
        },
        consultationsBooked: {
          value: Number(bookedToday.rows[0]?.total || 0),
          trendPercent: trend(
            Number(bookedToday.rows[0]?.total || 0),
            Number(prevBooked.rows[0]?.total || 0),
          ),
        },
        todaysAppointments: {
          value: Number(appointmentsToday.rows[0]?.total || 0),
          trendPercent: trend(
            Number(appointmentsToday.rows[0]?.total || 0),
            Number(prevAppointments.rows[0]?.total || 0),
          ),
        },
        showRate: { value: showNow, trendPercent: showNow - showPrev },
        revenueToday: {
          value: Number(revenueToday.rows[0]?.revenue || 0),
          trendPercent: trend(
            Number(revenueToday.rows[0]?.revenue || 0),
            Number(prevRevenue.rows[0]?.revenue || 0),
          ),
        },
        rebookingDue: {
          value: Number(rebookingDue.rows[0]?.total || 0),
          trendPercent: trend(
            Number(rebookingDue.rows[0]?.total || 0),
            Number(prevRebooking.rows[0]?.total || 0),
          ),
        },
      },
      schedule: schedule.rows.map((r: any) => ({
        id: r.id,
        timeLabel: new Date(r.start_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        clientName: r.client_name,
        serviceName: r.service_name,
        providerName: r.provider_name,
        status: r.status,
        statusLabel: this.titleCase(r.status),
      })),
      pipeline,
      treatmentInterest: treatmentRows.map((r: any) => ({
        name: r.name,
        percent: treatmentTotal
          ? Math.round((Number(r.total || 0) / treatmentTotal) * 100)
          : 0,
      })),
      rebookingClients: rebookClients.rows.map((r: any) =>
        this.mapRebookingRow(r),
      ),
      followUpQueue: followups,
      providers: providerPerformance,
      revenueOverview,
      aiActivity: activity.rows.map((r: any) => ({
        id: r.id,
        timeLabel: new Date(r.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        title: this.activityTitle(r.action, r.metadata),
        outcome: r.outcome,
      })),
    };
  }

  private async getConversationStats(teamId: string) {
    await this.ensureSchema();

    try {
      const { rows } = await this.db.query(
        `
      WITH clinic_messages AS (
        SELECT
          m.id,
          m.conversation_id,
          m.direction,
          m.created_at
        FROM whatsapp_qr_messages m
        WHERE m.team_id = $1
          AND m.workspace_id = $2
          AND m.created_at >= CURRENT_DATE
          AND m.created_at < CURRENT_DATE + INTERVAL '1 day'
      ),

      inbound_messages AS (
        SELECT
          i.id,
          i.conversation_id,
          i.created_at,

          (
            SELECT MIN(o.created_at)
            FROM clinic_messages o
            WHERE o.conversation_id = i.conversation_id
              AND o.direction = 'outbound'
              AND o.created_at > i.created_at
          ) AS response_at

        FROM clinic_messages i
        WHERE i.direction = 'inbound'
      )

      SELECT
        (
          SELECT COUNT(DISTINCT conversation_id)::int
          FROM clinic_messages
        ) AS conversations,

        COALESCE(
          ROUND(
            AVG(
              EXTRACT(
                EPOCH FROM (response_at - created_at)
              )
            )
          )::int,
          0
        ) AS avg_seconds

      FROM inbound_messages
      WHERE response_at IS NOT NULL
      `,
        [teamId, WORKSPACE_ID],
      );

      return {
        conversationsToday: Number(rows[0]?.conversations || 0),

        avgResponseSeconds: Number(rows[0]?.avg_seconds || 0),
      };
    } catch (error: any) {
      /*
       * WhatsApp statistics must never prevent
       * the clinic dashboard from rendering.
       */
      console.error(
        "[AESTHETIC] conversation stats failed:",
        error?.message || error,
      );

      return {
        conversationsToday: 0,
        avgResponseSeconds: 0,
      };
    }
  }

  private async getPipeline(teamId: string, providerId?: string) {
    const provider = providerId
      ? await this.assertProvider(teamId, providerId)
      : null;
    const leadFilter = provider?.user_id ? "AND l.assigned_to = $3" : "";
    const leadParams = provider?.user_id
      ? [teamId, WORKSPACE_ID, provider.user_id]
      : [teamId, WORKSPACE_ID];
    const apptFilter = providerId ? "AND a.aesthetic_provider_id = $3" : "";
    const apptParams = providerId
      ? [teamId, WORKSPACE_ID, providerId]
      : [teamId, WORKSPACE_ID];

    const [newInquiry, qualified, booked, confirmed, completed, followup] =
      await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int total FROM leads l WHERE l.team_id=$1 AND l.workspace_id=$2 AND l.status='new' ${leadFilter}`,
          leadParams,
        ),
        this.db.query(
          `SELECT COUNT(*)::int total FROM leads l WHERE l.team_id=$1 AND l.workspace_id=$2 AND l.status='qualified' ${leadFilter}`,
          leadParams,
        ),
        this.db.query(
          `SELECT COUNT(*)::int total FROM appointments a WHERE a.team_id=$1 AND a.workspace_id=$2 AND a.type='consultation' AND a.status IN ('pending','confirmed','completed') ${apptFilter}`,
          apptParams,
        ),
        this.db.query(
          `SELECT COUNT(*)::int total FROM appointments a WHERE a.team_id=$1 AND a.workspace_id=$2 AND a.status='confirmed' ${apptFilter}`,
          apptParams,
        ),
        this.db.query(
          `SELECT COUNT(*)::int total FROM aesthetic_treatment_records r WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.status='completed' ${providerId ? "AND r.provider_id=$3" : ""}`,
          providerId
            ? [teamId, WORKSPACE_ID, providerId]
            : [teamId, WORKSPACE_ID],
        ),
        this.db.query(
          `SELECT COUNT(*)::int total FROM lead_tasks t WHERE t.team_id=$1 AND t.workspace_id=$2 AND t.status IN ('pending','in_progress') ${provider?.user_id ? "AND t.assigned_to=$3" : ""}`,
          provider?.user_id
            ? [teamId, WORKSPACE_ID, provider.user_id]
            : [teamId, WORKSPACE_ID],
        ),
      ]);

    return [
      {
        id: "new-inquiry",
        name: "New Inquiry",
        count: Number(newInquiry.rows[0]?.total || 0),
      },
      {
        id: "ai-qualified",
        name: "AI Qualified",
        count: Number(qualified.rows[0]?.total || 0),
      },
      {
        id: "consultation-booked",
        name: "Consultation Booked",
        count: Number(booked.rows[0]?.total || 0),
      },
      {
        id: "confirmed",
        name: "Confirmed",
        count: Number(confirmed.rows[0]?.total || 0),
      },
      {
        id: "treatment-completed",
        name: "Treatment Completed",
        count: Number(completed.rows[0]?.total || 0),
      },
      {
        id: "follow-up",
        name: "Follow-Up",
        count: Number(followup.rows[0]?.total || 0),
      },
    ];
  }

  private async getFollowUpQueue(teamId: string, providerId?: string) {
    const provider = providerId
      ? await this.assertProvider(teamId, providerId)
      : null;
    // lead_tasks in the current CRM schema does not reliably expose assigned_to.
    // Keep the workspace/team scope here; provider-specific queues are derived
    // from appointments/treatment records instead.
    const params: any[] = [teamId, WORKSPACE_ID];
    const assigned = "";
    const [postTreatment, missed, unanswered, rebooking] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*)::int total FROM aesthetic_treatment_records r WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.status='completed' AND r.completed_at >= CURRENT_DATE - INTERVAL '7 days' ${providerId ? "AND r.provider_id=$3" : ""}`,
        providerId
          ? [teamId, WORKSPACE_ID, providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM appointments a WHERE a.team_id=$1 AND a.workspace_id=$2 AND a.status='canceled' AND a.start_at >= CURRENT_DATE - INTERVAL '30 days' ${providerId ? "AND a.aesthetic_provider_id=$3" : ""}`,
        providerId
          ? [teamId, WORKSPACE_ID, providerId]
          : [teamId, WORKSPACE_ID],
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM lead_tasks t WHERE t.team_id=$1 AND t.workspace_id=$2 AND t.status IN ('pending','in_progress') AND LOWER(COALESCE(t.title,'')) LIKE '%unanswered%' ${assigned}`,
        params,
      ),
      this.db.query(
        `SELECT COUNT(*)::int total FROM aesthetic_treatment_records r WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.next_rebook_at <= CURRENT_DATE + INTERVAL '7 days' AND r.next_rebook_at IS NOT NULL ${providerId ? "AND r.provider_id=$3" : ""}`,
        providerId
          ? [teamId, WORKSPACE_ID, providerId]
          : [teamId, WORKSPACE_ID],
      ),
    ]);

    return [
      {
        id: "post-treatment",
        label: "post-treatment check-ins",
        count: Number(postTreatment.rows[0]?.total || 0),
      },
      {
        id: "missed-consultations",
        label: "missed consultations",
        count: Number(missed.rows[0]?.total || 0),
      },
      {
        id: "unanswered-inquiries",
        label: "unanswered inquiries",
        count: Number(unanswered.rows[0]?.total || 0),
      },
      {
        id: "rebooking-reminders",
        label: "rebooking reminders",
        count: Number(rebooking.rows[0]?.total || 0),
      },
    ];
  }

  private async getProviderPerformance(teamId: string, locationId?: string) {
    const params: any[] = [teamId, WORKSPACE_ID];
    let location = "";
    if (locationId) {
      params.push(locationId);
      location = `AND p.location_id = $${params.length}`;
    }
    const { rows } = await this.db.query(
      `SELECT p.id, p.name,
              COUNT(DISTINCT a.id)::int appointments,
              COALESCE(SUM(r.revenue) FILTER (WHERE r.status='completed'),0)::numeric revenue,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('confirmed','completed'))::int attended,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status <> 'canceled')::int eligible
         FROM aesthetic_providers p
         LEFT JOIN appointments a
           ON a.team_id=p.team_id AND a.workspace_id=p.workspace_id
          AND a.aesthetic_provider_id=p.id
          AND a.start_at >= date_trunc('week', CURRENT_DATE)
         LEFT JOIN aesthetic_treatment_records r
           ON r.team_id=p.team_id AND r.workspace_id=p.workspace_id
          AND r.provider_id=p.id
          AND r.completed_at >= date_trunc('week', CURRENT_DATE)
        WHERE p.team_id=$1 AND p.workspace_id=$2 AND p.is_active=true ${location}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC, appointments DESC
        LIMIT 8`,
      params,
    );
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      appointments: Number(r.appointments || 0),
      revenue: Number(r.revenue || 0),
      showRate:
        Number(r.eligible || 0) > 0
          ? Math.round((Number(r.attended || 0) / Number(r.eligible)) * 100)
          : 0,
    }));
  }

  private async getRevenueOverview(teamId: string, providerId?: string) {
    const params = providerId
      ? [teamId, WORKSPACE_ID, providerId]
      : [teamId, WORKSPACE_ID];
    const providerFilter = providerId ? "AND r.provider_id=$3" : "";
    const { rows } = await this.db.query(
      `WITH days AS (
         SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date day
       ), totals AS (
         SELECT r.completed_at::date day, SUM(r.revenue)::numeric value
           FROM aesthetic_treatment_records r
          WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.status='completed'
            AND r.completed_at >= CURRENT_DATE - INTERVAL '6 days'
            ${providerFilter}
          GROUP BY 1
       )
       SELECT d.day, COALESCE(t.value,0)::numeric value
         FROM days d LEFT JOIN totals t ON t.day=d.day
        ORDER BY d.day`,
      params,
    );
    const values = rows.map((r: any) => Number(r.value || 0));
    const total = values.reduce((a: number, b: number) => a + b, 0);
    const max = Math.max(...values, 1);
    const prev = await this.db.query(
      `SELECT COALESCE(SUM(r.revenue),0)::numeric total
         FROM aesthetic_treatment_records r
        WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.status='completed'
          AND r.completed_at >= CURRENT_DATE - INTERVAL '13 days'
          AND r.completed_at < CURRENT_DATE - INTERVAL '6 days'
          ${providerFilter}`,
      params,
    );
    const previous = Number(prev.rows[0]?.total || 0);
    const changePercent = previous
      ? Math.round(((total - previous) / previous) * 100)
      : total
        ? 100
        : 0;
    return {
      total,
      changePercent,
      points: rows.map((r: any) => ({
        label: new Date(`${r.day}T12:00:00Z`).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        value: Number(r.value || 0),
        percent: Math.round((Number(r.value || 0) / max) * 100),
      })),
    };
  }

  private mapRebookingRow(r: any) {
    const due = new Date(r.next_rebook_at);
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();
    const dueStart = new Date(
      due.getFullYear(),
      due.getMonth(),
      due.getDate(),
    ).getTime();
    const days = Math.round((dueStart - todayStart) / 86400000);
    return {
      id: r.id,
      clientName: r.client_name,
      treatmentName: r.treatment_name,
      overdue: days < 0,
      dueLabel:
        days === 0
          ? "Due today"
          : days < 0
            ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
            : `Due in ${days} day${days === 1 ? "" : "s"}`,
    };
  }

  private titleCase(value: string) {
    return String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  private activityTitle(action: string, metadata: any) {
    const map: Record<string, string> = {
      qualified: "Qualified inquiry",
      booked: "Booked consultation",
      transferred_to_human: "Transferred medical question to staff",
      appointment_reminder: "Sent appointment reminder",
      follow_up_sent: "Sent follow-up",
      agent_launched: "AI receptionist launched",
    };
    const treatment = metadata?.treatment || metadata?.service || "";
    return `${map[action] || this.titleCase(action)}${treatment ? ` · ${treatment}` : ""}`;
  }

  async listLocations(teamId: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id, name, address_line1 AS "addressLine1", address_line2 AS "addressLine2",
              city, state, postal_code AS "postalCode", country, timezone,
              is_active AS "isActive"
         FROM aesthetic_locations
        WHERE team_id=$1 AND workspace_id=$2
        ORDER BY is_active DESC, name ASC`,
      [teamId, WORKSPACE_ID],
    );
    return { items: rows };
  }

  async saveLocation(teamId: string, body: any, id?: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    if (!String(body?.name || "").trim())
      throw new BadRequestException("Location name is required.");
    const params = [
      teamId,
      WORKSPACE_ID,
      String(body.name).trim(),
      body.addressLine1 || null,
      body.addressLine2 || null,
      body.city || null,
      body.state || null,
      body.postalCode || null,
      body.country || null,
      body.timezone || "UTC",
      body.isActive !== false,
    ];
    if (id) {
      const { rows } = await this.db.query(
        `UPDATE aesthetic_locations SET name=$3,address_line1=$4,address_line2=$5,city=$6,state=$7,postal_code=$8,country=$9,timezone=$10,is_active=$11,updated_at=now()
          WHERE id=$12 AND team_id=$1 AND workspace_id=$2 RETURNING *`,
        [...params, id],
      );
      if (!rows[0]) throw new NotFoundException("Location not found.");
      return rows[0];
    }
    const { rows } = await this.db.query(
      `INSERT INTO aesthetic_locations(team_id,workspace_id,name,address_line1,address_line2,city,state,postal_code,country,timezone,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      params,
    );
    return rows[0];
  }

  async listProviders(teamId: string, locationId?: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    const params: any[] = [teamId, WORKSPACE_ID];
    let location = "";
    if (locationId) {
      params.push(locationId);
      location = `AND p.location_id=$${params.length}`;
    }
    const { rows } = await this.db.query(
      `SELECT p.id,p.user_id AS "userId",p.location_id AS "locationId",p.name,p.email,p.phone,p.title,p.availability,p.is_active AS "isActive",l.name AS "locationName"
         FROM aesthetic_providers p LEFT JOIN aesthetic_locations l ON l.id=p.location_id
        WHERE p.team_id=$1 AND p.workspace_id=$2 ${location}
        ORDER BY p.is_active DESC,p.name ASC`,
      params,
    );
    return { items: rows };
  }

  async saveProvider(teamId: string, body: any, id?: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    if (!String(body?.name || "").trim())
      throw new BadRequestException("Provider name is required.");
    const params = [
      teamId,
      WORKSPACE_ID,
      body.userId || null,
      body.locationId || null,
      String(body.name).trim(),
      body.email || null,
      body.phone || null,
      body.title || null,
      JSON.stringify(body.availability || {}),
      body.isActive !== false,
    ];
    if (id) {
      const { rows } = await this.db.query(
        `UPDATE aesthetic_providers SET user_id=$3,location_id=$4,name=$5,email=$6,phone=$7,title=$8,availability=$9::jsonb,is_active=$10,updated_at=now()
          WHERE id=$11 AND team_id=$1 AND workspace_id=$2 RETURNING *`,
        [...params, id],
      );
      if (!rows[0]) throw new NotFoundException("Provider not found.");
      return rows[0];
    }
    const { rows } = await this.db.query(
      `INSERT INTO aesthetic_providers(team_id,workspace_id,user_id,location_id,name,email,phone,title,availability,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING *`,
      params,
    );
    return rows[0];
  }

  async listTreatments(teamId: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT id,name,category,description,duration_minutes AS "durationMinutes",price,rebooking_days AS "rebookingDays",booking_buffer_before AS "bufferBefore",booking_buffer_after AS "bufferAfter",is_active AS "isActive"
         FROM aesthetic_treatments WHERE team_id=$1 AND workspace_id=$2
        ORDER BY is_active DESC,name ASC`,
      [teamId, WORKSPACE_ID],
    );
    return {
      items: rows.map((r: any) => ({ ...r, price: Number(r.price || 0) })),
    };
  }

  async saveTreatment(teamId: string, body: any, id?: string) {
    this.requireTeam(teamId);
    await this.ensureSchema();
    if (!String(body?.name || "").trim())
      throw new BadRequestException("Treatment name is required.");
    const params = [
      teamId,
      WORKSPACE_ID,
      String(body.name).trim(),
      body.category || null,
      body.description || null,
      Math.max(5, Number(body.durationMinutes || 30)),
      Math.max(0, Number(body.price || 0)),
      body.rebookingDays == null || body.rebookingDays === ""
        ? null
        : Math.max(1, Number(body.rebookingDays)),
      Math.max(0, Number(body.bufferBefore || 0)),
      Math.max(0, Number(body.bufferAfter || 0)),
      body.isActive !== false,
    ];
    if (id) {
      const { rows } = await this.db.query(
        `UPDATE aesthetic_treatments SET name=$3,category=$4,description=$5,duration_minutes=$6,price=$7,rebooking_days=$8,booking_buffer_before=$9,booking_buffer_after=$10,is_active=$11,updated_at=now()
          WHERE id=$12 AND team_id=$1 AND workspace_id=$2 RETURNING *`,
        [...params, id],
      );
      if (!rows[0]) throw new NotFoundException("Treatment not found.");
      return rows[0];
    }
    const { rows } = await this.db.query(
      `INSERT INTO aesthetic_treatments(team_id,workspace_id,name,category,description,duration_minutes,price,rebooking_days,booking_buffer_before,booking_buffer_after,is_active)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      params,
    );
    return rows[0];
  }

  async getConversionFlow(teamId: string) {
    await this.ensureSchema();
    const [locations, providers, treatments, setup] = await Promise.all([
      this.listLocations(teamId),
      this.listProviders(teamId),
      this.listTreatments(teamId),
      this.getWorkspaceConfig(teamId),
    ]);
    return {
      workspaceId: WORKSPACE_ID,
      locations: locations.items,
      providers: providers.items,
      treatments: treatments.items,
      pipelineConfig: setup.pipelineConfig || {},
    };
  }

  async savePipelineConfig(teamId: string, pipelineConfig: any) {
    await this.ensureSchema();
    await this.ensureWorkspaceConfig(teamId);
    const { rows } = await this.db.query(
      `UPDATE workspace_ai_setup_configs SET pipeline_config=$3::jsonb,updated_at=now()
        WHERE team_id=$1 AND workspace_id=$2 RETURNING pipeline_config`,
      [teamId, WORKSPACE_ID, JSON.stringify(pipelineConfig || {})],
    );
    return rows[0]?.pipeline_config || {};
  }

  async getWorkspaceConfig(teamId: string) {
    await this.ensureWorkspaceConfig(teamId);
    const { rows } = await this.db.query(
      `SELECT business_profile AS "businessProfile",appointment_rules AS "appointmentRules",behavior,automations,pipeline_config AS "pipelineConfig",qualification_questions AS "qualificationQuestions",safety_rules AS "safetyRules",faqs,business_profile_completed AS "businessProfileCompleted",appointment_rules_configured AS "appointmentRulesConfigured",behavior_configured AS "behaviorConfigured",automations_configured AS "automationsConfigured",tested,launched,paused
         FROM workspace_ai_setup_configs WHERE team_id=$1 AND workspace_id=$2 LIMIT 1`,
      [teamId, WORKSPACE_ID],
    );
    return rows[0];
  }

  async ensureWorkspaceConfig(teamId: string) {
    this.requireTeam(teamId);
    await this.db.query(
      `INSERT INTO workspace_ai_setup_configs(team_id,workspace_id) VALUES($1,$2)
       ON CONFLICT(team_id,workspace_id) DO NOTHING`,
      [teamId, WORKSPACE_ID],
    );
  }
}