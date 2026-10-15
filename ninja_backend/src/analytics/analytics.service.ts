import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventType, EntityType } from './events/event-logger.service';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

export interface LeadMetrics {
  total: number;
  byStatus: { [status: string]: number };
  created: number;
  converted: number;
  conversionRate: number;
  averageTimeToConvert?: number; // in days
}

export interface PropertyMetrics {
  total: number;
  byType: { sale: number; rent: number };
  byStatus: { [status: string]: number };
  published: number;
  averagePrice?: number;
  totalValue?: number;
}

export interface SubscriptionMetrics {
  total: number;
  active: number;
  cancelled: number;
  byPlan: { [planId: string]: number };
  revenue?: number;
}

export interface TeamMetrics {
  total: number;
  totalMembers: number;
  averageMembersPerTeam: number;
  activeTeams: number;
}

export interface UserMetrics {
  total: number;
  newUsers: number;
  activeUsers: number;
  byRole: { [role: string]: number };
}

export interface ActivityMetrics {
  totalEvents: number;
  eventsByType: { [eventType: string]: number };
  eventsByDay: Array<{ date: string; count: number }>;
}

export interface DashboardMetrics {
  leads: LeadMetrics;
  properties: PropertyMetrics;
  subscriptions: SubscriptionMetrics;
  teams: TeamMetrics;
  users: UserMetrics;
  activity: ActivityMetrics;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly db: DatabaseService) {}

  /** Command Center uses the same team-scoped persisted tables as Analytics V2.
   * Missing sources are null, not invented zeros. No workspace membership bypass.
   */
  async getCommandCenter(teamId: string, days: number) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const args = [teamId, start, end];
    const [tasks, taskTotals, aiTotals, aiHistory, messages, automation, series] = await Promise.all([
      this.db.query(`SELECT id, title AS name, status, task_type AS "taskType",
        due_date AS "dueDate", assigned_to AS "assigneeId", created_at AS "createdAt"
        FROM team_tasks WHERE team_id=$1
        AND lower(coalesce(status,'')) NOT IN ('completed','done','cancelled','canceled','closed')
        ORDER BY due_date ASC NULLS LAST, created_at DESC LIMIT 500`, [teamId]),
      this.db.query(`SELECT count(*)::int AS open,
        count(*) FILTER (WHERE due_date < now())::int AS overdue,
        count(*) FILTER (WHERE due_date <= now() AND
          (lower(coalesce(task_type,'')) LIKE '%follow%up%' OR lower(title) LIKE '%follow%up%'))::int AS followups_due
        FROM team_tasks WHERE team_id=$1 AND lower(coalesce(status,'')) NOT IN
        ('completed','done','cancelled','canceled','closed')`, [teamId]),
      this.db.query(`SELECT
        count(*) FILTER (WHERE lower(coalesce(outcome,'completed')) IN ('completed','success','succeeded'))::int AS completed,
        count(*) FILTER (WHERE lower(coalesce(outcome,'')) IN ('failed','error'))::int AS failed
        FROM ai_activity WHERE team_id=$1 AND created_at >= $2 AND created_at < $3`, args),
      this.db.query(`SELECT a.id, a.action, a.channel, a.outcome, a.created_at AS "createdAt",
        a.lead_id AS "leadId", l.name AS "leadName"
        FROM ai_activity a LEFT JOIN leads l ON l.id=a.lead_id AND l.team_id=a.team_id
        WHERE a.team_id=$1 AND a.created_at >= $2 AND a.created_at < $3
        ORDER BY a.created_at DESC LIMIT 100`, args),
      this.db.query(`SELECT
        count(*) FILTER (WHERE lower(trim(m.channel)) IN ('call','calls','phone','voice','voice_call','phone_call'))::int AS calls,
        count(*) FILTER (WHERE lower(trim(m.channel))='whatsapp')::int AS whatsapp,
        count(*) FILTER (WHERE lower(trim(m.channel))='email')::int AS email,
        count(*) FILTER (WHERE lower(trim(m.channel)) IN ('website_chat','web_chat','webchat','website chat','live_chat','site_chat','chat_widget'))::int AS "websiteChat"
        FROM lead_messages m JOIN leads l ON l.id=m.lead_id
        WHERE l.team_id=$1 AND m.created_at >= $2 AND m.created_at < $3`, args),
      this.db.query(`SELECT
        count(*) FILTER (WHERE lower(status) IN ('applied','completed','success'))::int AS successful,
        count(*) FILTER (WHERE lower(status) IN ('failed','error'))::int AS failed,
        count(*) FILTER (WHERE lower(status) IN ('pending','awaiting_approval','needs_attention'))::int AS "needsAttention"
        FROM mkt_automation_runs WHERE team_id=$1 AND created_at >= $2 AND created_at < $3`, args),
      this.db.query(`SELECT d.day::date::text AS date,
        (SELECT count(*)::int FROM lead_messages m JOIN leads l ON l.id=m.lead_id
          WHERE l.team_id=$1 AND m.created_at >= d.day AND m.created_at < d.day+interval '1 day') AS conversations,
        (SELECT count(*)::int FROM appointments a WHERE a.team_id=$1
          AND a.created_at >= d.day AND a.created_at < d.day+interval '1 day') AS appointments,
        (SELECT count(*)::int FROM team_tasks t WHERE t.team_id=$1 AND lower(t.status) IN ('completed','done')
          AND t.completed_at >= d.day AND t.completed_at < d.day+interval '1 day') AS "completedTasks"
        FROM generate_series($2::date, ($3::date - interval '1 day')::date, interval '1 day') d(day)
        ORDER BY d.day`, args),
    ]);
    const rows = tasks.rows;
    return {
      period: { days, start: start.toISOString(), end: end.toISOString() },
      tasks: {
        rows,
        open: taskTotals.rows[0].open,
        overdue: taskTotals.rows[0].overdue,
        followups_due: taskTotals.rows[0].followups_due,
        truncated: rows.length === 500,
      },
      ai: { completed: aiTotals.rows[0].completed, failed: aiTotals.rows[0].failed, history: aiHistory.rows },
      channels: messages.rows[0],
      automation: automation.rows[0],
      activity: { series: series.rows },
    };
  }

  /**
   * Aggregate from persisted CRM records. All queries are restricted to the
   * authenticated team. Null denotes a metric with no reliable source.
   */
  async getOverviewV2(teamId: string, days: number, workspaceId?: string, offsetDays = 0) {
    const end = new Date(Date.now() - offsetDays * 86400000);
    const start = new Date(end.getTime() - days * 86400000);
    const params: any[] = [teamId, start, end];
    if (workspaceId) params.push(workspaceId);
    const scoped = (alias: string) => workspaceId ? ` AND ${alias}.workspace_id = $4` : '';
    const q = async (sql: string, args: any[] = params) =>
      (await this.db.query(sql, args)).rows;
    // Every lead-linked message is restricted by the lead's team and workspace.
    const [contacts, leads, appointments, messages, responses, ai, automation, leadFollowups, teamFollowups, members, series] =
      await Promise.all([
        q(`SELECT count(*)::int AS total FROM contacts c WHERE c.team_id=$1 AND c.created_at >= $2 AND c.created_at < $3${scoped('c')}`),
        q(`SELECT count(*)::int AS total FROM leads l WHERE l.team_id=$1 AND l.created_at >= $2 AND l.created_at < $3${scoped('l')}`),
        q(`SELECT count(*)::int AS booked,
             count(*) FILTER (WHERE lower(a.status)='completed')::int AS completed,
             count(*) FILTER (WHERE lower(a.status) IN ('cancelled','canceled'))::int AS canceled,
             count(*) FILTER (WHERE lower(a.status) IN ('no_show','no-show'))::int AS no_show,
             count(DISTINCT a.lead_id) FILTER (WHERE a.lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM leads l WHERE l.id=a.lead_id AND l.team_id=$1 AND l.created_at >= $2 AND l.created_at < $3))::int AS booked_leads
           FROM appointments a WHERE a.team_id=$1 AND a.created_at >= $2 AND a.created_at < $3${scoped('a')}`),
        q(`SELECT count(DISTINCT m.lead_id)::int AS handled,
             count(*) FILTER (WHERE lower(m.channel)='whatsapp')::int AS whatsapp,
             count(*) FILTER (WHERE lower(m.channel)='email')::int AS email,
             count(*) FILTER (WHERE lower(trim(m.channel)) IN ('call','calls','phone','voice','voice_call','phone_call'))::int AS calls,
             count(*) FILTER (WHERE lower(trim(m.channel)) IN ('website_chat','web_chat','webchat','website chat','live_chat','site_chat','chat_widget'))::int AS website_chat
           FROM lead_messages m JOIN leads l ON l.id=m.lead_id
           WHERE l.team_id=$1 AND m.created_at >= $2 AND m.created_at < $3${scoped('l')}`),
        q(`WITH first_inbound AS (
             SELECT DISTINCT ON (m.lead_id) m.lead_id,m.created_at AS received_at
             FROM lead_messages m JOIN leads l ON l.id=m.lead_id
             WHERE l.team_id=$1 AND m.direction='inbound' AND m.created_at >= $2 AND m.created_at < $3${scoped('l')}
             ORDER BY m.lead_id,m.created_at
           )
           SELECT round(avg(extract(epoch FROM (r.responded_at - i.received_at))/60)::numeric,1) AS minutes
           FROM first_inbound i JOIN LATERAL (
             SELECT min(m.created_at) AS responded_at FROM lead_messages m
             WHERE m.lead_id=i.lead_id AND m.direction='outbound' AND m.created_at >= i.received_at
           ) r ON r.responded_at IS NOT NULL`),
        q(`SELECT count(*) FILTER (WHERE lower(coalesce(outcome,'')) IN ('success','completed','succeeded'))::int AS successful,
             count(*) FILTER (WHERE lower(coalesce(outcome,'')) IN ('failed','error'))::int AS failed
           FROM ai_activity ai WHERE ai.team_id=$1 AND ai.created_at >= $2 AND ai.created_at < $3${scoped('ai')}`),
        // Automation runs do not have workspace_id; never attribute team totals to a workspace.
        workspaceId ? Promise.resolve(null) :
          q(`SELECT count(*) FILTER (WHERE status='applied')::int AS successful,
               count(*) FILTER (WHERE status IN ('failed','error'))::int AS failed,
               count(*) FILTER (WHERE status IN ('pending','awaiting_approval'))::int AS awaiting_approval
             FROM mkt_automation_runs WHERE team_id=$1 AND created_at >= $2 AND created_at < $3`,params.slice(0,3)),
        q(`SELECT count(*) FILTER (WHERE f.due_date >= $2 AND f.due_date < $3)::int AS due,
             count(*) FILTER (WHERE f.completed_at >= $2 AND f.completed_at < $3 AND f.due_date IS NOT NULL AND f.completed_at <= f.due_date)::int AS on_time,
             count(*) FILTER (WHERE f.completed_at >= $2 AND f.completed_at < $3 AND f.due_date IS NOT NULL AND f.completed_at > f.due_date)::int AS late,
             count(*) FILTER (WHERE f.due_date >= $2 AND f.due_date < $3 AND f.due_date < now() AND f.status NOT IN ('completed','cancelled'))::int AS missed
           FROM lead_tasks f JOIN leads l ON l.id=f.lead_id
           WHERE l.team_id=$1${scoped('l')}`),
        workspaceId ? Promise.resolve(null) :
          q(`SELECT count(*) FILTER (WHERE t.due_date >= $2 AND t.due_date < $3 AND lower(t.task_type) IN ('follow_up','follow-up','followup'))::int AS due,
               count(*) FILTER (WHERE t.completed_at >= $2 AND t.completed_at < $3 AND t.due_date IS NOT NULL AND t.completed_at <= t.due_date AND lower(t.task_type) IN ('follow_up','follow-up','followup'))::int AS on_time,
               count(*) FILTER (WHERE t.completed_at >= $2 AND t.completed_at < $3 AND t.due_date IS NOT NULL AND t.completed_at > t.due_date AND lower(t.task_type) IN ('follow_up','follow-up','followup'))::int AS late,
               count(*) FILTER (WHERE t.due_date >= $2 AND t.due_date < $3 AND t.due_date < now() AND t.status NOT IN ('completed','cancelled') AND lower(t.task_type) IN ('follow_up','follow-up','followup'))::int AS missed
             FROM team_tasks t WHERE t.team_id=$1`,params.slice(0,3)),
        q(`SELECT tm.user_id AS id,coalesce(u.name,u.email) AS name,
             (SELECT count(*)::int FROM lead_tasks lt JOIN leads l ON l.id=lt.lead_id
              WHERE l.team_id=$1 AND lt.assigned_to=tm.user_id AND lt.status='completed'
                AND lt.completed_at >= $2 AND lt.completed_at < $3${scoped('l')}) AS tasks_completed,
             (SELECT count(*)::int FROM lead_messages m JOIN leads l ON l.id=m.lead_id
              WHERE l.team_id=$1 AND l.assigned_to=tm.user_id
                AND m.created_at >= $2 AND m.created_at < $3${scoped('l')}) AS conversations_handled,
             (SELECT round(avg(extract(epoch FROM (reply.responded_at - inbound.received_at))/60)::numeric,1)
              FROM (SELECT DISTINCT ON (m.lead_id) m.lead_id,m.created_at AS received_at
                    FROM lead_messages m JOIN leads l ON l.id=m.lead_id
                    WHERE l.team_id=$1 AND l.assigned_to=tm.user_id AND m.direction='inbound'
                      AND m.created_at >= $2 AND m.created_at < $3${scoped('l')}
                    ORDER BY m.lead_id,m.created_at) inbound
              JOIN LATERAL (SELECT min(m.created_at) AS responded_at FROM lead_messages m
                            WHERE m.lead_id=inbound.lead_id AND m.direction='outbound'
                              AND m.created_at >= inbound.received_at) reply
              ON reply.responded_at IS NOT NULL) AS avg_response_minutes,
             (SELECT round(100.0 * count(*) FILTER (WHERE lt.completed_at <= lt.due_date)
                      / nullif(count(*),0),1)
              FROM lead_tasks lt JOIN leads l ON l.id=lt.lead_id
              WHERE l.team_id=$1 AND lt.assigned_to=tm.user_id AND lt.status='completed'
                AND lt.completed_at >= $2 AND lt.completed_at < $3 AND lt.due_date IS NOT NULL${scoped('l')}) AS followup_completion
           FROM team_members tm JOIN users u ON u.id=tm.user_id
           WHERE tm.team_id=$1 AND tm.status='active' ORDER BY name`),
        q(`SELECT d.day::date::text AS date,
             (SELECT count(*)::int FROM lead_messages m JOIN leads l ON l.id=m.lead_id
              WHERE l.team_id=$1 AND m.created_at >= d.day AND m.created_at < d.day+interval '1 day'${scoped('l')}) AS conversations,
             (SELECT count(*)::int FROM appointments a WHERE a.team_id=$1 AND a.created_at >= d.day
              AND a.created_at < d.day+interval '1 day'${scoped('a')}) AS appointments,
             (SELECT count(*)::int FROM ai_activity ai WHERE ai.team_id=$1 AND ai.created_at >= d.day
              AND ai.created_at < d.day+interval '1 day'${scoped('ai')}) AS ai_actions
           FROM generate_series($2::date,($3::date - interval '1 day')::date,interval '1 day') AS d(day) ORDER BY d.day`)
      ]);
    const follow = {
      dueInPeriod: leadFollowups[0].due + (teamFollowups?.[0]?.due || 0),
      completedOnTime: leadFollowups[0].on_time + (teamFollowups?.[0]?.on_time || 0),
      completedLate: leadFollowups[0].late + (teamFollowups?.[0]?.late || 0),
      missed: leadFollowups[0].missed + (teamFollowups?.[0]?.missed || 0)
    };
    const auto = automation?.[0] || null;
    const denominator = auto ? auto.successful + auto.failed : 0;
    const leadTotal = leads[0].total;
    return {
      period:{startDate:start.toISOString(),endDate:end.toISOString(),days},
      metrics:{
        newContacts:contacts[0].total,conversationsHandled:messages[0].handled,
        appointmentsBooked:appointments[0].booked,aiActionsCompleted:ai[0].successful,
        averageFirstResponse:responses[0].minutes === null ? null : Number(responses[0].minutes),
        bookingRate:leadTotal ? Math.round(appointments[0].booked_leads * 10000 / leadTotal)/100 : null,
        followupCompletion:(follow.completedOnTime + follow.completedLate) ?
          Math.round(follow.completedOnTime*10000/(follow.completedOnTime+follow.completedLate))/100 : null,
        automationSuccess:denominator ? Math.round(auto.successful*10000/denominator)/100 : null
      },
      activity:{series},
      channels:{calls:messages[0].calls,whatsapp:messages[0].whatsapp,email:messages[0].email,websiteChat:messages[0].website_chat},
      appointments:{booked:appointments[0].booked,completed:appointments[0].completed,
        canceled:appointments[0].canceled,noShow:appointments[0].no_show},
      followups:follow,
      aiAutomation:auto ? {successful:auto.successful,failed:auto.failed,awaitingApproval:auto.awaiting_approval} :
        {successful:null,failed:null,awaitingApproval:null},
      teamPerformance:members.map((m:any)=>({id:m.id,name:m.name,conversationsHandled:m.conversations_handled,
        tasksCompleted:m.tasks_completed,averageFirstResponse:m.avg_response_minutes === null ? null : Number(m.avg_response_minutes),
        followupCompletion:m.followup_completion === null ? null : Number(m.followup_completion)})),
      coverage:{calls:'lead_messages.channel',websiteChat:'lead_messages.channel',automationWorkspace:!workspaceId,
        followups:workspaceId?'lead_tasks_only':'lead_tasks_and_team_tasks',
        responseTime:'first_inbound_to_first_outbound',bookingRate:'booked_leads_over_new_leads'}
    };
  }

  async getOverviewInsights(teamId: string, days: number, workspaceId?: string, offsetDays = 0) {
    const data = await this.getOverviewV2(teamId,days,workspaceId,offsetDays);
    // Deterministic, sourced insights; not presented as LLM-generated analysis.
    return {period:data.period,metrics:data.metrics,coverage:data.coverage};
  }

  /**
   * Get lead metrics for a time range.
   * Scope: when teamId is set, filter by team_id; when teamId is null and userId is set, filter by created_by (same as CRM summary).
   */
  async getLeadMetrics(
    teamId: string | null,
    userId: string | null,
    timeRange?: TimeRange,
  ): Promise<LeadMetrics> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    let query: string;
    let params: any[];

    // Contacted: match Leads page — count leads with last_contacted_at set (or status = 'contacted')
    const contactedFilter = `(last_contacted_at IS NOT NULL OR status = 'contacted')`;
    if (teamId) {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new_count,
          COUNT(*) FILTER (WHERE ${contactedFilter}) as contacted_count,
          COUNT(*) FILTER (WHERE status = 'qualified') as qualified_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
          COUNT(*) FILTER (WHERE status = 'lost') as lost_count,
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) as created_in_period
        FROM leads
        WHERE team_id = $3
      `;
      params = [startDate, endDate, teamId];
    } else if (userId) {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new_count,
          COUNT(*) FILTER (WHERE ${contactedFilter}) as contacted_count,
          COUNT(*) FILTER (WHERE status = 'qualified') as qualified_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
          COUNT(*) FILTER (WHERE status = 'lost') as lost_count,
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) as created_in_period
        FROM leads
        WHERE created_by = $3
      `;
      params = [startDate, endDate, userId];
    } else {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new_count,
          COUNT(*) FILTER (WHERE ${contactedFilter}) as contacted_count,
          COUNT(*) FILTER (WHERE status = 'qualified') as qualified_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
          COUNT(*) FILTER (WHERE status = 'lost') as lost_count,
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) as created_in_period
        FROM leads
        WHERE 1=1
      `;
      params = [startDate, endDate];
    }

    const { rows } = await this.db.query(query, params);

    const row = rows[0];
    const total = parseInt(row.total) || 0;
    const converted = parseInt(row.converted_count) || 0;
    const created = parseInt(row.created_in_period) || 0;

    return {
      total,
      byStatus: {
        new: parseInt(row.new_count) || 0,
        contacted: parseInt(row.contacted_count) || 0,
        qualified: parseInt(row.qualified_count) || 0,
        converted,
        lost: parseInt(row.lost_count) || 0,
      },
      created,
      converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    };
  }

  /**
   * Get property metrics for a time range
   */
  async getPropertyMetrics(teamId: string | null, timeRange?: TimeRange): Promise<PropertyMetrics> {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'sale') as sale_count,
        COUNT(*) FILTER (WHERE type = 'rent') as rent_count,
        COUNT(*) FILTER (WHERE status = 'published') as published_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
        COUNT(*) FILTER (WHERE status = 'rented') as rented_count,
        AVG(price) FILTER (WHERE price IS NOT NULL) as avg_price,
        SUM(price) FILTER (WHERE price IS NOT NULL) as total_value
      FROM properties
      WHERE ($1::uuid IS NULL OR team_id = $1)
    `;

    const { rows } = await this.db.query(query, [teamId || null]);
    const row = rows[0];

    return {
      total: parseInt(row.total) || 0,
      byType: {
        sale: parseInt(row.sale_count) || 0,
        rent: parseInt(row.rent_count) || 0,
      },
      byStatus: {
        draft: parseInt(row.draft_count) || 0,
        published: parseInt(row.published_count) || 0,
        sold: parseInt(row.sold_count) || 0,
        rented: parseInt(row.rented_count) || 0,
        archived: 0,
      },
      published: parseInt(row.published_count) || 0,
      averagePrice: parseFloat(row.avg_price) || undefined,
      totalValue: parseFloat(row.total_value) || undefined,
    };
  }

  /**
   * Get subscription metrics
   */
  async getSubscriptionMetrics(teamId: string | null): Promise<SubscriptionMetrics> {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count
      FROM subscriptions
      WHERE ($1::uuid IS NULL OR team_id = $1)
    `;

    const { rows } = await this.db.query(query, [teamId || null]);
    const row = rows[0];

    // Get subscription count by plan
    const planQuery = `
      SELECT plan_id, COUNT(*) as count
      FROM subscriptions
      WHERE ($1::uuid IS NULL OR team_id = $1)
      GROUP BY plan_id
    `;
    const { rows: planRows } = await this.db.query(planQuery, [teamId || null]);

    const byPlan: { [planId: string]: number } = {};
    planRows.forEach((r: any) => {
      byPlan[r.plan_id] = parseInt(r.count);
    });

    return {
      total: parseInt(row.total) || 0,
      active: parseInt(row.active_count) || 0,
      cancelled: parseInt(row.cancelled_count) || 0,
      byPlan,
    };
  }

  /**
   * Get team metrics
   */
  async getTeamMetrics(teamId: string | null): Promise<TeamMetrics> {
    let query = `
      SELECT 
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT u.id) as total_members,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN t.id END) as active_teams
      FROM teams t
      LEFT JOIN users u ON u.team_id = t.id
      LEFT JOIN subscriptions s ON s.team_id = t.id
      WHERE ($1::uuid IS NULL OR t.id = $1)
    `;

    const { rows } = await this.db.query(query, [teamId || null]);
    const row = rows[0];

    const totalTeams = parseInt(row.total_teams) || 0;
    const totalMembers = parseInt(row.total_members) || 0;

    return {
      total: totalTeams,
      totalMembers,
      averageMembersPerTeam: totalTeams > 0 ? totalMembers / totalTeams : 0,
      activeTeams: parseInt(row.active_teams) || 0,
    };
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(teamId: string | null, timeRange?: TimeRange): Promise<UserMetrics> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2) as new_users,
        COUNT(DISTINCT CASE WHEN u.id IN (
          SELECT DISTINCT user_id FROM events 
          WHERE created_at >= $1 AND created_at <= $2
        ) THEN u.id END) as active_users
      FROM users u
      WHERE ($3::uuid IS NULL OR u.team_id = $3)
    `;

    const { rows } = await this.db.query(query, [startDate, endDate, teamId || null]);
    const row = rows[0];

    // Get users by role
    const roleQuery = `
      SELECT role, COUNT(*) as count
      FROM users
      WHERE ($1::uuid IS NULL OR team_id = $1)
      GROUP BY role
    `;
    const { rows: roleRows } = await this.db.query(roleQuery, [teamId || null]);

    const byRole: { [role: string]: number } = {};
    roleRows.forEach((r: any) => {
      byRole[r.role] = parseInt(r.count);
    });

    return {
      total: parseInt(row.total) || 0,
      newUsers: parseInt(row.new_users) || 0,
      activeUsers: parseInt(row.active_users) || 0,
      byRole,
    };
  }

  /**
   * Get activity metrics from events
   */
  async getActivityMetrics(teamId: string | null, timeRange?: TimeRange): Promise<ActivityMetrics> {
    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    // Total events
    let query = `
      SELECT COUNT(*) as total
      FROM events
      WHERE created_at >= $1 AND created_at <= $2
        AND ($3::uuid IS NULL OR team_id = $3)
    `;
    const { rows: totalRows } = await this.db.query(query, [startDate, endDate, teamId || null]);
    const totalEvents = parseInt(totalRows[0].total) || 0;

    // Events by type
    query = `
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE created_at >= $1 AND created_at <= $2
        AND ($3::uuid IS NULL OR team_id = $3)
      GROUP BY event_type
      ORDER BY count DESC
    `;
    const { rows: typeRows } = await this.db.query(query, [startDate, endDate, teamId || null]);

    const eventsByType: { [eventType: string]: number } = {};
    typeRows.forEach((r: any) => {
      eventsByType[r.event_type] = parseInt(r.count);
    });

    // Events by day
    query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM events
      WHERE created_at >= $1 AND created_at <= $2
        AND ($3::uuid IS NULL OR team_id = $3)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const { rows: dayRows } = await this.db.query(query, [startDate, endDate, teamId || null]);

    const eventsByDay = dayRows.map((r: any) => ({
      date: r.date.toISOString().split('T')[0],
      count: parseInt(r.count),
    }));

    return {
      totalEvents,
      eventsByType,
      eventsByDay,
    };
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    userId: string,
    userRole: string,
    teamId: string | null,
    timeRange?: TimeRange,
  ): Promise<DashboardMetrics> {
    // Admin: all leads; else team scope or user scope (created_by) to match CRM summary
    const effectiveTeamId = userRole === 'admin' ? null : teamId;
    const effectiveUserId = userRole === 'admin' ? null : (effectiveTeamId ? null : userId);

    const [leads, properties, subscriptions, teams, users, activity] = await Promise.all([
      this.getLeadMetrics(effectiveTeamId, effectiveUserId, timeRange),
      this.getPropertyMetrics(effectiveTeamId, timeRange),
      this.getSubscriptionMetrics(effectiveTeamId),
      this.getTeamMetrics(effectiveTeamId),
      this.getUserMetrics(effectiveTeamId, timeRange),
      this.getActivityMetrics(effectiveTeamId, timeRange),
    ]);

    const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeRange?.endDate || new Date();

    return {
      leads,
      properties,
      subscriptions,
      teams,
      users,
      activity,
      period: {
        startDate,
        endDate,
      },
    };
  }
}

