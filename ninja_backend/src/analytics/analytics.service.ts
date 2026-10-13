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

  /**
   * Aggregate from persisted CRM records. All queries are restricted to the
   * authenticated team. Null denotes a metric with no reliable source.
   */
  async getOverviewV2(teamId: string, days: number, workspaceId?: string) {
    // This endpoint is team-scoped. Existing contacts/appointments/ai_activity
    // migrations do not define workspace_id, so do not silently pretend to
    // provide workspace-specific totals.
    if (workspaceId) {
      throw new BadRequestException('Workspace-specific analytics require a verified workspace mapping');
    }
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const params = [teamId, start, end];
    const contacts = await this.db.query(
      `SELECT count(*)::int AS total FROM contacts
       WHERE team_id=$1 AND created_at >= $2 AND created_at <= $3`, params);
    const appointments = await this.db.query(
      `SELECT count(*)::int AS booked,
       count(*) FILTER (WHERE lower(status)='completed')::int AS completed,
       count(*) FILTER (WHERE lower(status) IN ('canceled','cancelled'))::int AS canceled,
       count(*) FILTER (WHERE lower(status) IN ('no_show','no-show'))::int AS no_show
       FROM appointments WHERE team_id=$1 AND created_at >= $2 AND created_at <= $3`, params);
    const ai = await this.db.query(
      `SELECT count(*) FILTER (WHERE lower(coalesce(outcome,'')) IN ('success','completed','succeeded'))::int AS successful,
       count(*) FILTER (WHERE lower(coalesce(outcome,'')) IN ('failed','error'))::int AS failed
       FROM ai_activity WHERE team_id=$1 AND created_at >= $2 AND created_at <= $3`,params);
    const automation = await this.db.query(
      `SELECT count(*) FILTER (WHERE status='applied')::int AS successful,
       count(*) FILTER (WHERE status IN ('failed','error'))::int AS failed,
       count(*) FILTER (WHERE status IN ('pending','awaiting_approval'))::int AS awaiting_approval
       FROM mkt_automation_runs WHERE team_id=$1 AND created_at >= $2 AND created_at <= $3`,params);
    const series = await this.db.query(
      `SELECT day::date::text AS date,
       (SELECT count(*)::int FROM appointments a WHERE a.team_id=$1
        AND a.created_at::date=day::date) AS appointments,
       (SELECT count(*)::int FROM ai_activity i WHERE i.team_id=$1
        AND i.created_at::date=day::date) AS ai_actions
       FROM generate_series($2::date,$3::date,interval '1 day') day ORDER BY day`,params);
    const ap = appointments.rows[0];
    const aiResult = ai.rows[0];
    const auto = automation.rows[0];
    const denominator = auto.successful + auto.failed;
    return {
      period: {startDate:start.toISOString(),endDate:end.toISOString(),days},
      metrics: {
        newContacts:contacts.rows[0].total,
        conversationsHandled:null,
        appointmentsBooked:ap.booked,
        aiActionsCompleted:aiResult.successful,
        averageFirstResponse:null,bookingRate:null,followupCompletion:null,
        automationSuccess:denominator > 0 ? Math.round(auto.successful*100/denominator) : null
      },
      activity:{series:series.rows.map((r:any)=>({...r,conversations:null}))},
      channels:{calls:null,whatsapp:null,email:null,websiteChat:null},
      appointments:{booked:ap.booked,completed:ap.completed,canceled:ap.canceled,noShow:ap.no_show},
      followups:{dueInPeriod:null,completedOnTime:null,completedLate:null,missed:null},
      aiAutomation:{successful:auto.successful,failed:auto.failed,awaitingApproval:auto.awaiting_approval},
      teamPerformance:null,
      coverage:{workspace:false,conversations:false,channels:false,firstResponse:false,
        bookingRate:false,followups:false,teamPerformance:false,activityConversations:false}
    };
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

