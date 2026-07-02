import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';
import { DatabaseService } from '../../database/database.service';

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  type: 'weekly' | 'monthly';
}

export interface Report {
  id: string;
  type: 'weekly' | 'monthly';
  period: ReportPeriod;
  generatedAt: Date;
  generatedBy: string;
  metrics: {
    leads: any;
    properties: any;
    subscriptions: any;
    teams: any;
    users: any;
    activity: any;
  };
  summary: {
    totalLeads: number;
    totalProperties: number;
    totalRevenue?: number;
    newUsers: number;
    activeUsers: number;
    keyHighlights: string[];
  };
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Generate a weekly report
   */
  async generateWeeklyReport(
    teamId: string | null,
    userId: string,
    userRole: string,
    weekStartDate?: Date,
  ): Promise<Report> {
    const startDate = weekStartDate || this.getLastWeekStart();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // End of week (7 days)

    return this.generateReport('weekly', teamId, userId, userRole, startDate, endDate);
  }

  /**
   * Generate a monthly report
   */
  async generateMonthlyReport(
    teamId: string | null,
    userId: string,
    userRole: string,
    monthStartDate?: Date,
  ): Promise<Report> {
    const startDate = monthStartDate || this.getLastMonthStart();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of month

    return this.generateReport('monthly', teamId, userId, userRole, startDate, endDate);
  }

  /**
   * Generate a report for a specific period
   */
  private async generateReport(
    type: 'weekly' | 'monthly',
    teamId: string | null,
    userId: string,
    userRole: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Report> {
    const effectiveTeamId = userRole === 'admin' ? null : teamId;
    const effectiveUserId = userRole === 'admin' ? null : (effectiveTeamId ? null : userId);
    const timeRange = { startDate, endDate };

    // Get all metrics
    const [leads, properties, subscriptions, teams, users, activity] = await Promise.all([
      this.analyticsService.getLeadMetrics(effectiveTeamId, effectiveUserId, timeRange),
      this.analyticsService.getPropertyMetrics(effectiveTeamId, timeRange),
      this.analyticsService.getSubscriptionMetrics(effectiveTeamId),
      this.analyticsService.getTeamMetrics(effectiveTeamId),
      this.analyticsService.getUserMetrics(effectiveTeamId, timeRange),
      this.analyticsService.getActivityMetrics(effectiveTeamId, timeRange),
    ]);

    // Generate summary
    const summary = this.generateSummary(leads, properties, subscriptions, users, activity);

    const report: Report = {
      id: this.generateReportId(),
      type,
      period: {
        startDate,
        endDate,
        type,
      },
      generatedAt: new Date(),
      generatedBy: userId,
      metrics: {
        leads,
        properties,
        subscriptions,
        teams,
        users,
        activity,
      },
      summary,
    };

    // Store report in database (optional, for historical tracking)
    await this.storeReport(report, effectiveTeamId);

    return report;
  }

  /**
   * Generate summary from metrics
   */
  private generateSummary(
    leads: any,
    properties: any,
    subscriptions: any,
    users: any,
    activity: any,
  ): Report['summary'] {
    const highlights: string[] = [];

    // Lead highlights
    if (leads.created > 0) {
      highlights.push(`${leads.created} new leads created`);
    }
    if (leads.converted > 0) {
      highlights.push(`${leads.converted} leads converted (${leads.conversionRate.toFixed(1)}% conversion rate)`);
    }

    // Property highlights
    if (properties.published > 0) {
      highlights.push(`${properties.published} properties published`);
    }
    if (properties.total > 0) {
      highlights.push(`${properties.total} total properties (${properties.byType.sale} for sale, ${properties.byType.rent} for rent)`);
    }

    // User highlights
    if (users.newUsers > 0) {
      highlights.push(`${users.newUsers} new users joined`);
    }
    if (users.activeUsers > 0) {
      highlights.push(`${users.activeUsers} active users`);
    }

    // Activity highlights
    if (activity.totalEvents > 0) {
      highlights.push(`${activity.totalEvents} total activities recorded`);
    }

    return {
      totalLeads: leads.total,
      totalProperties: properties.total,
      newUsers: users.newUsers,
      activeUsers: users.activeUsers,
      keyHighlights: highlights,
    };
  }

  /**
   * Get last week start date (Monday)
   */
  private getLastWeekStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Go back 7 days
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Get last month start date
   */
  private getLastMonthStart(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store report in database (optional, for historical tracking)
   */
  private async storeReport(report: Report, teamId: string | null): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO generated_reports
           (report_id, team_id, generated_by, type, period_start, period_end, summary, report)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          report.id,
          teamId,
          report.generatedBy ?? null,
          report.type,
          report.period.startDate,
          report.period.endDate,
          JSON.stringify(report.summary ?? null),
          JSON.stringify(report),
        ],
      );
      this.logger.log(
        `Stored ${report.type} report ${report.id} for period ${report.period.startDate.toISOString()} to ${report.period.endDate.toISOString()}`,
      );
    } catch (error: any) {
      this.logger.error('Failed to store report', error);
      // Don't throw - report generation should not fail if storage fails
    }
  }

  /**
   * List saved reports the caller may see. Admins see all; otherwise scoped to
   * the caller's team, or to reports they generated when they have no team.
   */
  async listReports(
    teamId: string | null,
    userId: string,
    userRole: string,
    limit = 50,
  ): Promise<any[]> {
    const isAdmin = userRole === 'admin';
    const params: any[] = [];
    let where = '';
    if (!isAdmin) {
      if (teamId) {
        params.push(teamId);
        where = `WHERE team_id = $${params.length}`;
      } else {
        params.push(userId);
        where = `WHERE generated_by = $${params.length}`;
      }
    }
    const safeLimit = Math.min(Math.max(1, limit), 200);
    params.push(safeLimit);
    const { rows } = await this.db.query(
      `SELECT id, report_id AS "reportId", type,
              period_start AS "periodStart", period_end AS "periodEnd",
              generated_by AS "generatedBy", summary, created_at AS "createdAt"
       FROM generated_reports
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );
    return rows;
  }

  /**
   * Fetch a single saved report, enforcing the same access scope as the list.
   */
  async getReportById(
    id: string,
    teamId: string | null,
    userId: string,
    userRole: string,
  ): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT id, report_id AS "reportId", type,
              period_start AS "periodStart", period_end AS "periodEnd",
              generated_by AS "generatedBy", team_id AS "teamId",
              summary, report, created_at AS "createdAt"
       FROM generated_reports
       WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Report not found');
    if (userRole !== 'admin') {
      const allowed = teamId
        ? row.teamId === teamId
        : row.generatedBy === userId;
      if (!allowed) {
        throw new ForbiddenException('You do not have access to this report');
      }
    }
    return row;
  }
}

