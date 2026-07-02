import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CrmService } from './crm.service';
import { ActivityFeedService, NormalizedActivityItem } from './activity-feed.service';
import { leadScopeWhereClause } from './dashboard-scope-sql';

/**
 * Extended dashboard/analytics metrics backing every Dashboard and Analytics
 * panel with real data. All blocks honor the same lead/deal scope as
 * /crm/dashboard/summary and accept optional filters
 * (date range, source, agent, deal stage).
 *
 * Metric definitions (kept deliberately explicit so figures are auditable):
 * - appointmentsBooked   = contact_activities rows of type 'meeting' in period.
 * - speedToLeadHours     = AVG(last_contacted_at - created_at) over leads
 *                          created in period that have been contacted.
 * - followUp             = lead_tasks due in period; completed = status 'completed'.
 * - avgTimeToCloseDays   = AVG(updated_at - created_at) over deals won in period.
 * - projectedRevenue     = SUM(value * stage weight) over open deals
 *                          (weights below — pipeline-standard estimates).
 */
const PROJECTION_WEIGHTS: { [stage: string]: number } = {
  new: 0.1,
  qualified: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
};

export interface ExtendedFilters {
  startDate: Date;
  endDate: Date;
  source?: string | null;
  agentId?: string | null;
  stage?: string | null;
  teamFilterId?: string | null;
}

@Injectable()
export class DashboardExtendedService {
  constructor(
    private readonly db: DatabaseService,
    private readonly crm: CrmService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  async getExtended(
    userId: string,
    teamId: string | null,
    role: string,
    filters: ExtendedFilters,
  ) {
    let { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(userId, teamId, role);
    if (filters.teamFilterId) {
      if (isGlobal) {
        isGlobal = false;
        teamIds = [filters.teamFilterId];
      } else if (teamIds.includes(filters.teamFilterId)) {
        teamIds = [filters.teamFilterId];
      }
    }
    const { startDate, endDate } = filters;
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodMs);

    const [
      kpis,
      trends,
      leadSources,
      pipelineLeakage,
      whatsapp,
      lostReasons,
      teamPerformance,
      priorityQueue,
      riskAlerts,
      liveTracking,
      automationHealth,
      upcomingClosings,
      dealsByStage,
      filterOptions,
      nextTasks,
    ] = await Promise.all([
      this.getKpis(isGlobal, teamIds, userId, filters),
      this.getTrends(isGlobal, teamIds, userId, filters),
      this.getLeadSources(isGlobal, teamIds, userId, filters),
      this.getPipelineLeakage(isGlobal, teamIds, userId, filters, prevStart),
      this.getWhatsapp(isGlobal, teamIds, userId, filters),
      this.getLostReasons(isGlobal, teamIds, userId, filters),
      this.getTeamPerformance(isGlobal, teamIds, userId, filters),
      this.getPriorityQueue(isGlobal, teamIds, userId, filters),
      this.getRiskAlerts(isGlobal, teamIds, userId),
      this.activityFeed.getRecentActivity(isGlobal, teamIds, 8),
      this.getAutomationHealth(isGlobal, teamIds),
      this.getUpcomingClosings(isGlobal, teamIds, userId),
      this.getDealsByStage(isGlobal, teamIds, userId, filters),
      this.getFilterOptions(isGlobal, teamIds, userId),
      this.getNextTasks(isGlobal, teamIds, userId),
    ]);

    return {
      period: { startDate, endDate },
      appliedFilters: {
        source: filters.source || null,
        agentId: filters.agentId || null,
        stage: filters.stage || null,
      },
      kpis,
      trends,
      leadSources,
      pipelineLeakage,
      whatsapp,
      lostReasons,
      teamPerformance,
      priorityQueue,
      riskAlerts,
      liveTracking: (liveTracking as NormalizedActivityItem[]) || [],
      automationHealth,
      upcomingClosings,
      dealsByStage,
      filterOptions,
      nextTasks,
    };
  }

  /** Lead scope + optional source/agent filters. Alias `l` must be the leads table. */
  private leadWhere(
    isGlobal: boolean,
    teamIds: string[],
    userId: string,
    filters: ExtendedFilters,
    startIdx: number,
  ): { clause: string; params: any[]; nextIdx: number } {
    const scope = leadScopeWhereClause(isGlobal, teamIds, userId, startIdx);
    let clause = scope.clause;
    const params: any[] = [...scope.params];
    let idx = scope.nextParamIndex;
    if (filters.source) {
      clause += ` AND COALESCE(l.source, 'direct') = $${idx}`;
      params.push(filters.source);
      idx += 1;
    }
    if (filters.agentId) {
      clause += ` AND l.assigned_to = $${idx}`;
      params.push(filters.agentId);
      idx += 1;
    }
    return { clause, params, nextIdx: idx };
  }

  /** Deal scope mirroring the lead scope (team ids or created_by), plus optional agent/stage filters. Alias `d`. */
  private dealWhere(
    isGlobal: boolean,
    teamIds: string[],
    userId: string,
    filters: ExtendedFilters,
    startIdx: number,
    applyStage = true,
  ): { clause: string; params: any[]; nextIdx: number } {
    let clause: string;
    const params: any[] = [];
    let idx = startIdx;
    if (isGlobal) {
      clause = 'TRUE';
    } else if (teamIds.length > 0) {
      const placeholders = teamIds.map((_, i) => `$${idx + i}`).join(', ');
      idx += teamIds.length;
      clause = `(d.team_id IN (${placeholders}) OR d.created_by = $${idx})`;
      params.push(...teamIds, userId);
      idx += 1;
    } else {
      clause = `d.created_by = $${idx}`;
      params.push(userId);
      idx += 1;
    }
    if (filters.agentId) {
      clause += ` AND d.assigned_to = $${idx}`;
      params.push(filters.agentId);
      idx += 1;
    }
    if (applyStage && filters.stage) {
      clause += ` AND d.stage = $${idx}`;
      params.push(filters.stage);
      idx += 1;
    }
    return { clause, params, nextIdx: idx };
  }

  /** Team scope for tables carrying team_id directly (contact_activities, ai_activity…). Alias required. */
  private teamWhere(
    alias: string,
    isGlobal: boolean,
    teamIds: string[],
    startIdx: number,
  ): { clause: string; params: any[]; nextIdx: number } {
    if (isGlobal) return { clause: 'TRUE', params: [], nextIdx: startIdx };
    if (teamIds.length === 0) return { clause: 'FALSE', params: [], nextIdx: startIdx };
    const placeholders = teamIds.map((_, i) => `$${startIdx + i}`).join(', ');
    return {
      clause: `${alias}.team_id IN (${placeholders})`,
      params: [...teamIds],
      nextIdx: startIdx + teamIds.length,
    };
  }

  private async getKpis(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const lw = this.leadWhere(isGlobal, teamIds, userId, f, 3);
    const speedSql = `
      SELECT
        AVG(EXTRACT(EPOCH FROM (l.last_contacted_at - l.created_at)) / 3600.0) AS hours
      FROM leads l
      WHERE l.created_at >= $1 AND l.created_at <= $2
        AND l.last_contacted_at IS NOT NULL AND l.last_contacted_at >= l.created_at
        AND ${lw.clause}
    `;

    const followSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE lt.status = 'completed')::int AS completed
      FROM lead_tasks lt
      INNER JOIN leads l ON l.id = lt.lead_id
      WHERE lt.due_date >= $1 AND lt.due_date <= $2
        AND lt.status <> 'cancelled'
        AND ${lw.clause}
    `;

    const dwOpen = this.dealWhere(isGlobal, teamIds, userId, f, 1, false);
    const projSql = `
      SELECT COALESCE(SUM(
        d.value * (CASE d.stage
          WHEN 'new' THEN ${PROJECTION_WEIGHTS.new}
          WHEN 'qualified' THEN ${PROJECTION_WEIGHTS.qualified}
          WHEN 'proposal' THEN ${PROJECTION_WEIGHTS.proposal}
          WHEN 'negotiation' THEN ${PROJECTION_WEIGHTS.negotiation}
          ELSE 0 END)
      ), 0)::float AS projected
      FROM deals d
      WHERE d.stage NOT IN ('won', 'lost') AND ${dwOpen.clause}
    `;

    const dwClose = this.dealWhere(isGlobal, teamIds, userId, f, 3, false);
    const closeSql = `
      SELECT AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) / 86400.0) AS days
      FROM deals d
      WHERE d.stage = 'won' AND d.updated_at >= $1 AND d.updated_at <= $2 AND ${dwClose.clause}
    `;

    const tw = this.teamWhere('ca', isGlobal, teamIds, 3);
    const apptSql = `
      SELECT COUNT(*)::int AS n
      FROM contact_activities ca
      WHERE ca.type = 'meeting' AND ca.created_at >= $1 AND ca.created_at <= $2 AND ${tw.clause}
    `;

    const lwScore = this.leadWhere(isGlobal, teamIds, userId, f, 1);
    const scoreSql = `
      SELECT AVG(a.score)::float AS score
      FROM leads l INNER JOIN lead_ai_analysis a ON a.lead_id = l.id
      WHERE l.status NOT IN ('converted', 'lost') AND ${lwScore.clause}
    `;
    const dwRisk = this.dealWhere(isGlobal, teamIds, userId, f, 1, false);
    const riskSql = `
      SELECT COALESCE(SUM(d.value), 0)::float AS v
      FROM deals d
      WHERE d.stage NOT IN ('won', 'lost') AND d.updated_at < NOW() - INTERVAL '14 days' AND ${dwRisk.clause}
    `;

    const [speed, follow, proj, close, appt, score, risk] = await Promise.all([
      this.db.query(speedSql, [f.startDate, f.endDate, ...lw.params]),
      this.db.query(followSql, [f.startDate, f.endDate, ...lw.params]),
      this.db.query(projSql, dwOpen.params),
      this.db.query(closeSql, [f.startDate, f.endDate, ...dwClose.params]),
      this.db.query(apptSql, [f.startDate, f.endDate, ...tw.params]),
      this.db.query(scoreSql, lwScore.params),
      this.db.query(riskSql, dwRisk.params),
    ]);

    const fu = follow.rows[0] || {};
    const total = Number(fu.total) || 0;
    const completed = Number(fu.completed) || 0;
    return {
      projectedRevenue: Number(proj.rows[0]?.projected) || 0,
      projectionWeights: PROJECTION_WEIGHTS,
      appointmentsBooked: Number(appt.rows[0]?.n) || 0,
      speedToLeadHours: speed.rows[0]?.hours != null ? Number(speed.rows[0].hours) : null,
      followUp: { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : null },
      avgTimeToCloseDays: close.rows[0]?.days != null ? Number(close.rows[0].days) : null,
      avgLeadScore: score.rows[0]?.score != null ? Math.round(Number(score.rows[0].score)) : null,
      revenueAtRisk: Number(risk.rows[0]?.v) || 0,
    };
  }

  private async getTrends(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const lw = this.leadWhere(isGlobal, teamIds, userId, f, 3);
    const leadsSql = `
      SELECT (l.created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::int AS n
      FROM leads l
      WHERE l.created_at >= $1 AND l.created_at <= $2 AND ${lw.clause}
      GROUP BY 1 ORDER BY 1
    `;

    const dw = this.dealWhere(isGlobal, teamIds, userId, f, 3, false);
    const revSql = `
      SELECT (d.updated_at AT TIME ZONE 'UTC')::date AS d, COALESCE(SUM(d.value), 0)::float AS v, COUNT(*)::int AS n
      FROM deals d
      WHERE d.stage = 'won' AND d.updated_at >= $1 AND d.updated_at <= $2 AND ${dw.clause}
      GROUP BY 1 ORDER BY 1
    `;

    const tw = this.teamWhere('ca', isGlobal, teamIds, 3);
    const apptSql = `
      SELECT (ca.created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::int AS n
      FROM contact_activities ca
      WHERE ca.type = 'meeting' AND ca.created_at >= $1 AND ca.created_at <= $2 AND ${tw.clause}
      GROUP BY 1 ORDER BY 1
    `;

    const [leads, rev, appt] = await Promise.all([
      this.db.query(leadsSql, [f.startDate, f.endDate, ...lw.params]),
      this.db.query(revSql, [f.startDate, f.endDate, ...dw.params]),
      this.db.query(apptSql, [f.startDate, f.endDate, ...tw.params]),
    ]);

    const day = (r: any) => (r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d));
    return {
      leadsByDay: leads.rows.map((r: any) => ({ date: day(r), count: Number(r.n) })),
      revenueByDay: rev.rows.map((r: any) => ({ date: day(r), value: Number(r.v), deals: Number(r.n) })),
      appointmentsByDay: appt.rows.map((r: any) => ({ date: day(r), count: Number(r.n) })),
    };
  }

  private async getLeadSources(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const lw = this.leadWhere(isGlobal, teamIds, userId, f, 3);
    const sql = `
      SELECT
        COALESCE(NULLIF(TRIM(l.source), ''), 'direct') AS source,
        COUNT(*)::int AS leads,
        COUNT(*) FILTER (WHERE l.status = 'converted')::int AS converted,
        COALESCE(SUM(d.won_value), 0)::float AS revenue
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT SUM(value) AS won_value FROM deals WHERE lead_id = l.id AND stage = 'won'
      ) d ON TRUE
      WHERE l.created_at >= $1 AND l.created_at <= $2 AND ${lw.clause}
      GROUP BY 1
      ORDER BY leads DESC
      LIMIT 12
    `;
    const { rows } = await this.db.query(sql, [f.startDate, f.endDate, ...lw.params]);
    return rows.map((r: any) => ({
      source: r.source,
      leads: Number(r.leads),
      converted: Number(r.converted),
      conversionRate: Number(r.leads) > 0 ? Math.round((Number(r.converted) / Number(r.leads)) * 100) : 0,
      revenue: Number(r.revenue),
    }));
  }

  private async getPipelineLeakage(
    isGlobal: boolean,
    teamIds: string[],
    userId: string,
    f: ExtendedFilters,
    prevStart: Date,
  ) {
    const dw = this.dealWhere(isGlobal, teamIds, userId, f, 5, false);
    const sql = `
      SELECT d.stage,
        COUNT(*) FILTER (WHERE d.created_at >= $1 AND d.created_at <= $2)::int AS cur,
        COUNT(*) FILTER (WHERE d.created_at >= $3 AND d.created_at < $4)::int AS prev
      FROM deals d
      WHERE ${dw.clause}
      GROUP BY d.stage
    `;
    const { rows } = await this.db.query(sql, [f.startDate, f.endDate, prevStart, f.startDate, ...dw.params]);
    const by: { [s: string]: { cur: number; prev: number } } = {};
    rows.forEach((r: any) => { by[r.stage] = { cur: Number(r.cur), prev: Number(r.prev) }; });
    const order = ['new', 'qualified', 'proposal', 'negotiation', 'won'];
    const base = by['new']?.cur || 0;
    return order.map((stage) => {
      const cur = by[stage]?.cur || 0;
      const prev = by[stage]?.prev || 0;
      return {
        stage,
        deals: cur,
        conversionPct: base > 0 ? Math.round((cur / base) * 100) : null,
        prevDeals: prev,
        deltaPct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null,
      };
    });
  }

  private async getWhatsapp(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const lw = this.leadWhere(isGlobal, teamIds, userId, f, 3);
    const convSql = `
      SELECT COUNT(*)::int AS n
      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      WHERE c.created_at <= $2 AND ($1::timestamptz IS NOT NULL) AND ${lw.clause}
    `;
    const msgSql = `
      SELECT
        COUNT(*) FILTER (WHERE m.direction = 'outbound')::int AS replies_all,
        COUNT(*) FILTER (WHERE m.direction = 'outbound' AND m.created_at >= $1 AND m.created_at <= $2)::int AS replies_period
      FROM whatsapp_qr_messages m
      INNER JOIN leads l ON l.id = m.lead_id
      WHERE ${lw.clause}
    `;
    const daySql = `
      SELECT (m.created_at AT TIME ZONE 'UTC')::date AS d, COUNT(DISTINCT m.conversation_id)::int AS n
      FROM whatsapp_qr_messages m
      INNER JOIN leads l ON l.id = m.lead_id
      WHERE m.created_at >= $1 AND m.created_at <= $2 AND ${lw.clause}
      GROUP BY 1 ORDER BY 1
    `;
    const [conv, msg, byDay] = await Promise.all([
      this.db.query(convSql, [f.startDate, f.endDate, ...lw.params]),
      this.db.query(msgSql, [f.startDate, f.endDate, ...lw.params]),
      this.db.query(daySql, [f.startDate, f.endDate, ...lw.params]),
    ]);
    const m = msg.rows[0] || {};
    return {
      conversations: Number(conv.rows[0]?.n) || 0,
      repliesSent: Number(m.replies_all) || 0,
      repliesPeriod: Number(m.replies_period) || 0,
      byDay: byDay.rows.map((r: any) => ({
        date: r.d instanceof Date ? r.d.toISOString().split('T')[0] : String(r.d),
        conversations: Number(r.n),
      })),
    };
  }

  private async getLostReasons(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const dw = this.dealWhere(isGlobal, teamIds, userId, f, 3, false);
    const sql = `
      SELECT COALESCE(NULLIF(TRIM(d.lost_reason), ''), '(no reason recorded)') AS reason, COUNT(*)::int AS n
      FROM deals d
      WHERE d.stage = 'lost' AND d.updated_at >= $1 AND d.updated_at <= $2 AND ${dw.clause}
      GROUP BY 1 ORDER BY n DESC LIMIT 8
    `;
    const { rows } = await this.db.query(sql, [f.startDate, f.endDate, ...dw.params]);
    const total = rows.reduce((s: number, r: any) => s + Number(r.n), 0);
    return rows.map((r: any) => ({
      reason: r.reason,
      count: Number(r.n),
      pct: total > 0 ? Math.round((Number(r.n) / total) * 100) : 0,
    }));
  }

  private async getTeamPerformance(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    if (!isGlobal && teamIds.length === 0) return [];
    const userScope = isGlobal
      ? 'TRUE'
      : `u.team_id IN (${teamIds.map((_, i) => `$${i + 3}`).join(', ')})`;
    const params: any[] = [f.startDate, f.endDate, ...(isGlobal ? [] : teamIds)];
    const sql = `
      SELECT u.id, COALESCE(NULLIF(TRIM(u.name), ''), u.email) AS name,
        COALESCE(d.total, 0)::int AS deals,
        COALESCE(d.won, 0)::int AS won,
        COALESCE(d.revenue, 0)::float AS revenue,
        r.hours AS response_hours
      FROM users u
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE stage = 'won') AS won,
               SUM(value) FILTER (WHERE stage = 'won') AS revenue
        FROM deals WHERE assigned_to = u.id AND created_at <= $2
      ) d ON TRUE
      LEFT JOIN LATERAL (
        SELECT AVG(EXTRACT(EPOCH FROM (last_contacted_at - created_at)) / 3600.0) AS hours
        FROM leads
        WHERE assigned_to = u.id AND last_contacted_at IS NOT NULL
          AND created_at >= $1 AND created_at <= $2
      ) r ON TRUE
      WHERE ${userScope}
      ORDER BY revenue DESC NULLS LAST, deals DESC
      LIMIT 10
    `;
    const { rows } = await this.db.query(sql, params);
    return rows.map((r: any) => ({
      userId: r.id,
      name: r.name,
      deals: Number(r.deals),
      won: Number(r.won),
      closeRatePct: Number(r.deals) > 0 ? Math.round((Number(r.won) / Number(r.deals)) * 100) : null,
      revenue: Number(r.revenue),
      avgResponseHours: r.response_hours != null ? Number(r.response_hours) : null,
    }));
  }

  private async getPriorityQueue(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const lw = this.leadWhere(isGlobal, teamIds, userId, f, 1);
    const sql = `
      SELECT l.id, l.name, a.score, a.intent_label, a.priority AS ai_priority, l.priority,
             a.next_action_json->>'action' AS next_action
      FROM leads l
      LEFT JOIN lead_ai_analysis a ON a.lead_id = l.id
      WHERE l.status NOT IN ('converted', 'lost') AND ${lw.clause}
      ORDER BY a.score DESC NULLS LAST,
        CASE COALESCE(a.priority, l.priority)
          WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        l.created_at DESC
      LIMIT 8
    `;
    const { rows } = await this.db.query(sql, lw.params);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      score: r.score != null ? Number(r.score) : null,
      intent: r.intent_label || null,
      priority: r.ai_priority || r.priority || null,
      nextAction: r.next_action || null,
    }));
  }

  private async getRiskAlerts(isGlobal: boolean, teamIds: string[], userId: string) {
    const noFilter: ExtendedFilters = { startDate: new Date(0), endDate: new Date() };
    const lw = this.leadWhere(isGlobal, teamIds, userId, noFilter, 1);
    const lw2 = this.leadWhere(isGlobal, teamIds, userId, noFilter, 1);
    const dw = this.dealWhere(isGlobal, teamIds, userId, noFilter, 1, false);
    const overdueSql = `
      SELECT COUNT(*)::int AS n FROM lead_tasks lt
      INNER JOIN leads l ON l.id = lt.lead_id
      WHERE lt.status IN ('pending', 'in_progress') AND lt.due_date < NOW() AND ${lw.clause}
    `;
    const uncontactedSql = `
      SELECT COUNT(*)::int AS n FROM leads l
      WHERE l.status = 'new' AND l.last_contacted_at IS NULL
        AND l.created_at < NOW() - INTERVAL '48 hours' AND ${lw2.clause}
    `;
    const stalledSql = `
      SELECT COUNT(*)::int AS n FROM deals d
      WHERE d.stage NOT IN ('won', 'lost') AND d.updated_at < NOW() - INTERVAL '14 days' AND ${dw.clause}
    `;
    const [o, u, s] = await Promise.all([
      this.db.query(overdueSql, lw.params),
      this.db.query(uncontactedSql, lw2.params),
      this.db.query(stalledSql, dw.params),
    ]);
    return {
      overdueTasks: Number(o.rows[0]?.n) || 0,
      uncontacted48h: Number(u.rows[0]?.n) || 0,
      stalledDeals14d: Number(s.rows[0]?.n) || 0,
    };
  }

  private async getAutomationHealth(isGlobal: boolean, teamIds: string[]) {
    if (!isGlobal && teamIds.length === 0) return [];
    const teamFilter = isGlobal ? 'TRUE' : `team_id IN (${teamIds.map((_, i) => `$${i + 1}`).join(', ')})`;
    const params = isGlobal ? [] : [...teamIds];
    const cfgSql = `
      SELECT
        BOOL_OR(COALESCE(ai_auto_reply_enabled, false)) AS auto_reply,
        BOOL_OR(COALESCE(ai_appointment_setter_enabled, false)) AS appt_setter
      FROM team_ai_config WHERE ${teamFilter}
    `;
    const waSql = `
      SELECT COUNT(*) FILTER (WHERE status = 'connected')::int AS connected, COUNT(*)::int AS total
      FROM whatsapp_qr_sessions WHERE ${teamFilter}
    `;
    let cfg: any = {};
    let wa: any = {};
    try { cfg = (await this.db.query(cfgSql, params)).rows[0] || {}; } catch { /* table optional */ }
    try { wa = (await this.db.query(waSql, params)).rows[0] || {}; } catch { /* table optional */ }
    return [
      { label: 'AI Auto Reply', status: cfg.auto_reply ? 'Active' : 'Off' },
      { label: 'AI Appointment Setter', status: cfg.appt_setter ? 'Active' : 'Off' },
      {
        label: 'WhatsApp Session',
        status: Number(wa.connected) > 0 ? 'Connected' : Number(wa.total) > 0 ? 'Disconnected' : 'Not set up',
      },
    ];
  }

  private async getUpcomingClosings(isGlobal: boolean, teamIds: string[], userId: string) {
    const noFilter: ExtendedFilters = { startDate: new Date(0), endDate: new Date() };
    const dw = this.dealWhere(isGlobal, teamIds, userId, noFilter, 1, false);
    const sql = `
      SELECT d.id, d.name, d.value::float AS value, d.expected_close_date, d.stage
      FROM deals d
      WHERE d.stage NOT IN ('won', 'lost') AND d.expected_close_date IS NOT NULL
        AND d.expected_close_date >= CURRENT_DATE - INTERVAL '7 days'
        AND ${dw.clause}
      ORDER BY d.expected_close_date ASC
      LIMIT 6
    `;
    const { rows } = await this.db.query(sql, dw.params);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value) || 0,
      stage: r.stage,
      expectedCloseDate:
        r.expected_close_date instanceof Date
          ? r.expected_close_date.toISOString().split('T')[0]
          : r.expected_close_date,
    }));
  }

  private async getDealsByStage(isGlobal: boolean, teamIds: string[], userId: string, f: ExtendedFilters) {
    const dw = this.dealWhere(isGlobal, teamIds, userId, f, 1, false);
    const sql = `
      SELECT d.stage, COUNT(*)::int AS n, COALESCE(SUM(d.value), 0)::float AS v
      FROM deals d
      WHERE ${dw.clause}
      GROUP BY d.stage
    `;
    const { rows } = await this.db.query(sql, dw.params);
    const counts: { [s: string]: number } = {};
    const values: { [s: string]: number } = {};
    rows.forEach((r: any) => {
      counts[r.stage] = Number(r.n);
      values[r.stage] = Number(r.v);
    });
    return { counts, values };
  }

  private async getFilterOptions(isGlobal: boolean, teamIds: string[], userId: string) {
    const noFilter: ExtendedFilters = { startDate: new Date(0), endDate: new Date() };
    const lw = this.leadWhere(isGlobal, teamIds, userId, noFilter, 1);
    const srcSql = `
      SELECT DISTINCT COALESCE(NULLIF(TRIM(l.source), ''), 'direct') AS source
      FROM leads l WHERE ${lw.clause} ORDER BY 1 LIMIT 30
    `;
    const agentScope = isGlobal
      ? 'TRUE'
      : teamIds.length > 0
        ? `u.team_id IN (${teamIds.map((_, i) => `$${i + 1}`).join(', ')})`
        : `u.id = $1`;
    const agentParams = isGlobal ? [] : teamIds.length > 0 ? [...teamIds] : [userId];
    const agentSql = `
      SELECT u.id, COALESCE(NULLIF(TRIM(u.name), ''), u.email) AS name
      FROM users u WHERE ${agentScope} ORDER BY name LIMIT 50
    `;
    const teamScope = isGlobal ? 'TRUE' : teamIds.length > 0
      ? `t.id IN (${teamIds.map((_, i) => `$${i + 1}`).join(', ')})`
      : 'FALSE';
    const teamSql = `SELECT t.id, t.name FROM teams t WHERE ${teamScope} ORDER BY t.name LIMIT 20`;
    const [src, agents, teams] = await Promise.all([
      this.db.query(srcSql, lw.params),
      this.db.query(agentSql, agentParams),
      this.db.query(teamSql, isGlobal ? [] : teamIds.length > 0 ? [...teamIds] : []),
    ]);
    return {
      sources: src.rows.map((r: any) => r.source),
      agents: agents.rows.map((r: any) => ({ id: r.id, name: r.name })),
      teams: teams.rows.map((r: any) => ({ id: r.id, name: r.name })),
      stages: ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    };
  }

  private async getNextTasks(isGlobal: boolean, teamIds: string[], userId: string) {
    const noFilter: ExtendedFilters = { startDate: new Date(0), endDate: new Date() };
    const lw = this.leadWhere(isGlobal, teamIds, userId, noFilter, 1);
    const sql = `
      SELECT lt.id, lt.title, lt.due_date, lt.status, l.name AS lead_name
      FROM lead_tasks lt
      INNER JOIN leads l ON l.id = lt.lead_id
      WHERE lt.status IN ('pending', 'in_progress') AND ${lw.clause}
      ORDER BY lt.due_date ASC NULLS LAST
      LIMIT 5
    `;
    const { rows } = await this.db.query(sql, lw.params);
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      leadName: r.lead_name,
      status: r.status,
      dueDate: r.due_date instanceof Date ? r.due_date.toISOString() : r.due_date,
    }));
  }
}
