import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CrmService } from './crm.service';
import { ActivityFeedService, NormalizedActivityItem } from './activity-feed.service';
import { leadScopeWhereClause } from './dashboard-scope-sql';

export interface DashboardAggregateMetrics {
  leads_total: number;
  leads_new: number;
  leads_active: number;
  leads_closed: number;
  conversations_total: number;
  conversations_unread: number;
  ai_actions_today: number;
}

export interface DashboardAggregateResponse {
  metrics: DashboardAggregateMetrics;
  recent_activity: NormalizedActivityItem[];
}

@Injectable()
export class DashboardAggregationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly crm: CrmService,
    private readonly activityFeed: ActivityFeedService,
  ) {}

  async getAggregate(
    userId: string,
    teamId: string | null,
    role: string,
    activityLimit = 30,
  ): Promise<DashboardAggregateResponse> {
    const { isGlobal, teamIds } = await this.crm.resolveDashboardDataScope(userId, teamId, role);
    const { clause, params: leadParams } = leadScopeWhereClause(isGlobal, teamIds, userId, 1);

    const leadsSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE l.status = 'new')::int AS new,
        COUNT(*) FILTER (WHERE l.status NOT IN ('closed-won', 'closed-lost'))::int AS active,
        COUNT(*) FILTER (WHERE l.status IN ('closed-won', 'closed-lost'))::int AS closed
      FROM leads l
      WHERE ${clause}
    `;

    const convSql = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(c.unread_count), 0)::int AS unread_sum
      FROM whatsapp_qr_conversations c
      INNER JOIN leads l ON l.id = c.lead_id
      WHERE ${clause}
    `;

    const aiTodayClause = `(created_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date`;
    let aiTodaySql: string;
    let aiTodayParams: unknown[];
    if (isGlobal) {
      aiTodaySql = `SELECT COUNT(*)::int AS n FROM ai_activity WHERE ${aiTodayClause}`;
      aiTodayParams = [];
    } else if (teamIds.length > 0) {
      aiTodaySql = `
        SELECT COUNT(*)::int AS n
        FROM ai_activity
        WHERE team_id = ANY($1::uuid[]) AND ${aiTodayClause}
      `;
      aiTodayParams = [teamIds];
    } else {
      aiTodaySql = `SELECT 0::int AS n`;
      aiTodayParams = [];
    }

    const [leadsRes, convRes, aiRes, recent_activity] = await Promise.all([
      this.db.query(leadsSql, leadParams),
      this.db.query(convSql, leadParams),
      this.db.query(aiTodaySql, aiTodayParams),
      this.activityFeed.getRecentActivity(isGlobal, teamIds, activityLimit),
    ]);

    const lr = leadsRes.rows[0] || {};
    const cr = convRes.rows[0] || {};
    const ar = aiRes.rows[0] || {};

    return {
      metrics: {
        leads_total: Number(lr.total) || 0,
        leads_new: Number(lr.new) || 0,
        leads_active: Number(lr.active) || 0,
        leads_closed: Number(lr.closed) || 0,
        conversations_total: Number(cr.total) || 0,
        conversations_unread: Number(cr.unread_sum) || 0,
        ai_actions_today: Number(ar.n) || 0,
      },
      recent_activity,
    };
  }
}
