import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { TeamAIMetrics } from "./interfaces/ai-metrics.interface";
import { TeamAnalyticsService } from "../analytics/team-analytics.service";
@Injectable()
export class TeamAIInsightsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: TeamAnalyticsService,
  ) {}

  async generate(teamId: string) {
    const [
      members,
      memberStats,
      conversations,
      notifications,
      properties,
      leads,
      deals,
    ] = await Promise.all([
      this.getMembers(teamId),

      this.analyticsService.getMemberStats(teamId),

      this.getConversations(teamId),

      this.getNotifications(teamId),

      this.getProperties(teamId),

      this.getLeads(teamId),

      this.getDeals(teamId),
    ]);
    const mergedMembers = members.map((member: any) => {
      const stats = memberStats.find((s: any) => s.id === member.id);

      return {
        ...member,

        totalLeads: Number(stats?.totalLeads || 0),

        dealsWon: Number(stats?.dealsWon || 0),

        pipelineValue: Number(stats?.pipelineValue || 0),
      };
    });
    const metrics = this.buildMetrics({
      members: mergedMembers,
      conversations,
      notifications,
      properties,
      leads,
      deals,
    });

    const health = this.calculateHealthScore(metrics);
    const shouldSave = await this.shouldCreateSnapshot(teamId);

    if (shouldSave) {
      await this.saveSnapshot(teamId, metrics, health);
    }
    const history = await this.getTeamHistory(teamId);
    const previousSnapshot = await this.getPreviousSnapshot(teamId);
    return {
      teamHealthScore: health,

      summary: this.generateSummary(metrics),

      productivityScore: metrics.productivityScore,

      collaborationScore: metrics.collaborationScore,

      efficiencyScore: metrics.efficiencyScore,

      risks: this.generateRisks(metrics),

      recommendations: this.generateRecommendations(metrics),

      topPerformers: this.generateTopPerformers(members),

      membersNeedingAttention: this.generateMembersNeedingAttention(members),

      trends: this.generateTrends(metrics, previousSnapshot),

      workloadDistribution: this.generateWorkloadDistribution(metrics),

      alerts: this.generateAlerts(metrics),

      overloadedMembers: this.generateOverloadedMembers(members),
      pipelineRisks: this.generatePipelineRisks(metrics),
      conversionRate: metrics.conversionRate,

      averageDealValue: metrics.averageDealValue,

      wonDeals: metrics.wonDeals,

      lostDeals: metrics.lostDeals,

      openDeals: metrics.openDeals,
      history,
      averageAIScore: metrics.averageAIScore,

      pipelineValue: metrics.pipelineValue,

      inactiveLeads: metrics.inactiveLeads,

      dealsWon: metrics.dealsWon,
    };
  }

  /* =====================================================
    DATA
  ===================================================== */

  private async getMembers(teamId: string) {
    const result = await this.db.query(
      `
    SELECT
      u.id,
      u.name,
      u.email,
      u.last_seen_at,
      u.is_active,
      tm.role,

      COUNT(DISTINCT l.id) as "totalLeads",

      COUNT(
        DISTINCT CASE
          WHEN d.stage = 'won'
          THEN d.id
        END
      ) as "dealsWon",

      COALESCE(
        SUM(
          CASE
            WHEN d.stage != 'won'
            THEN d.value
            ELSE 0
          END
        ),
        0
      ) as "pipelineValue"

    FROM team_members tm

    INNER JOIN users u
      ON u.id = tm.user_id

    LEFT JOIN leads l
      ON l.assigned_to = u.id
      AND l.team_id = $1

    LEFT JOIN deals d
      ON d.assigned_to = u.id
      AND d.team_id = $1

    WHERE tm.team_id = $1
    AND tm.status = 'active'

    GROUP BY
      u.id,
      u.name,
      u.email,
      u.last_seen_at,
      tm.role,
      u.is_active
    `,
      [teamId],
    );

    return result.rows.map((member: any) => {
      const totalLeads = Number(member.totalLeads || 0);

      const dealsWon = Number(member.dealsWon || 0);

      const pipelineValue = Number(member.pipelineValue || 0);

      const engagementScore = member.is_active ? 90 : 45;

      const performanceScore = Math.min(100, dealsWon * 15 + totalLeads * 2);

      const responseScore = Math.min(
        100,
        Math.floor(pipelineValue / 1000) + 50,
      );

      const aiScore = Math.round(
        (engagementScore + performanceScore + responseScore) / 3,
      );

      return {
        ...member,

        totalLeads,

        dealsWon,

        pipelineValue,

        engagementScore,

        performanceScore,

        responseScore,

        aiScore,
      };
    });
  }

  private async getConversations(teamId: string) {
    try {
      const result = await this.db.query(
        `
        SELECT id
        FROM conversations
        WHERE team_id = $1
        `,
        [teamId],
      );

      return result.rows;
    } catch {
      return [];
    }
  }

  private async getNotifications(teamId: string) {
    try {
      return await this.notificationsService.getTeamNotifications(teamId, 100);
    } catch {
      return [];
    }
  }

  private async getProperties(teamId: string) {
    try {
      const result = await this.db.query(
        `
        SELECT id
        FROM properties
        WHERE team_id = $1
        `,
        [teamId],
      );

      return result.rows;
    } catch {
      return [];
    }
  }

  /* =====================================================
    METRICS
  ===================================================== */

  private buildMetrics({
    members,
    conversations,
    notifications,
    properties,
    leads,
    deals,
  }): TeamAIMetrics {
    const totalMembers = members.length;

    const activeMembers = members.filter((m: any) => m.is_active).length;

    const inactiveMembers = totalMembers - activeMembers;

    const totalProperties = properties.length;

    const totalConversations = conversations.length;

    const unreadNotifications = notifications.filter(
      (n: any) => !n.isRead,
    ).length;

    const responseRate =
      totalConversations > 0
        ? Math.min(100, Math.round((totalConversations / totalMembers) * 12))
        : 0;

    const engagementRate =
      totalMembers > 0
        ? Math.min(100, Math.round((activeMembers / totalMembers) * 100))
        : 0;

    const collaborationScore = Math.round((engagementRate + responseRate) / 2);

    const averageAIScore =
      totalMembers > 0
        ? Math.round(
            members.reduce((sum, m) => sum + m.aiScore, 0) / totalMembers,
          )
        : 0;

    const pipelineValue = members.reduce(
      (sum, m) => sum + Number(m.pipelineValue || 0),
      0,
    );

    const productivityScore = Math.min(
      100,
      Math.round(
        totalProperties * 2 + responseRate * 0.3 + averageAIScore * 0.4,
      ),
    );

    const efficiencyScore = Math.round(
      (productivityScore + collaborationScore + averageAIScore) / 3,
    );

    const dealsWon = members.reduce(
      (sum, m) => sum + Number(m.dealsWon || 0),
      0,
    );

    const activeLeads = leads.filter((l: any) => l.status !== "closed").length;

    const inactiveLeads = leads.filter((l: any) => {
      const updatedAt = new Date(l.updated_at).getTime();

      const days = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);

      return days >= 14;
    }).length;

    const wonDeals = deals.filter((d: any) => d.stage === "won").length;

    const lostDeals = deals.filter((d: any) => d.stage === "lost").length;

    const openDeals = deals.filter(
      (d: any) => d.stage !== "won" && d.stage !== "lost",
    ).length;

    const conversionRate =
      deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 0;

    const averageDealValue =
      deals.length > 0
        ? Math.round(
            deals.reduce((sum, d) => sum + Number(d.value || 0), 0) /
              deals.length,
          )
        : 0;

    return {
      totalMembers,

      activeMembers,

      inactiveMembers,

      totalProperties,

      totalConversations,

      unreadNotifications,

      responseRate,

      engagementRate,

      collaborationScore,

      productivityScore,

      efficiencyScore,
      averageAIScore,

      pipelineValue,

      dealsWon,

      activeLeads,

      inactiveLeads,

      wonDeals,

      lostDeals,

      openDeals,

      conversionRate,

      averageDealValue,
    };
  }

  /* =====================================================
    HEALTH
  ===================================================== */

  private calculateHealthScore(metrics: TeamAIMetrics) {
    return Math.round(
      (metrics.productivityScore +
        metrics.collaborationScore +
        metrics.efficiencyScore) /
        3,
    );
  }

  /* =====================================================
    SUMMARY
  ===================================================== */

  private generateSummary(metrics: TeamAIMetrics) {
    return `
        Your team currently has ${metrics.activeMembers} active members
        with an average AI score of ${metrics.averageAIScore}%.

        The team is managing ${metrics.activeLeads} active leads
        with ${metrics.dealsWon} successful closed deals.

        Current collaboration performance is ${metrics.collaborationScore}%
        and operational efficiency is ${metrics.efficiencyScore}%.

        Unread notifications: ${metrics.unreadNotifications}.
        `.trim();
  }

  /* =====================================================
    RISKS
  ===================================================== */

  private generateRisks(metrics: TeamAIMetrics) {
    const risks = [];

    if (metrics.inactiveMembers >= 3) {
      risks.push("Several members appear inactive.");
    }

    if (metrics.unreadNotifications >= 10) {
      risks.push("Large amount of unread notifications detected.");
    }

    if (metrics.inactiveLeads >= 5) {
      risks.push("Multiple stale leads may require reassignment.");
    }

    if (metrics.responseRate < 40) {
      risks.push("Low response rate may affect lead conversion.");
    }

    if (metrics.averageAIScore < 70) {
      risks.push("Overall AI performance score is below healthy range.");
    }

    return risks;
  }

  /* =====================================================
    RECOMMENDATIONS
  ===================================================== */

  private generateRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.conversionRate < 20) {
      recommendations.push(
        "Review lead qualification process to improve conversion rates.",
      );
    }

    if (metrics.inactiveLeads >= 5) {
      recommendations.push("Reassign or follow up inactive leads immediately.");
    }

    if (metrics.unreadNotifications > 10) {
      recommendations.push("Reduce notification overload for better focus.");
    }

    if (metrics.collaborationScore < 70) {
      recommendations.push("Encourage more team collaboration sessions.");
    }

    if (metrics.pipelineValue < 10000) {
      recommendations.push(
        "Increase pipeline generation activities this week.",
      );
    }

    if (metrics.averageAIScore < 75) {
      recommendations.push(
        "Schedule AI performance coaching for lower-performing members.",
      );
    }

    recommendations.push("Run weekly AI operational review.");

    return recommendations;
  }

  /* =====================================================
    TOP PERFORMERS
  ===================================================== */

  private generateTopPerformers(members: any[]) {
    return members
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3)
      .map((member, index) => ({
        id: member.id,

        name: member.name,
        email: member.email,

        role: member.role || "Team Member",

        totalLeads: member.totalLeads,

        pipelineValue: member.pipelineValue,
        score: member.aiScore || 90 - index * 5,
      }));
  }

  /* =====================================================
  MEMBERS NEEDING ATTENTION
===================================================== */

  private generateMembersNeedingAttention(members: any[]) {
    return members
      .filter((m) => m.aiScore < 75)
      .slice(0, 5)
      .map((member) => ({
        id: member.id,

        name: member.name,

        aiScore: member.aiScore,

        issue:
          member.aiScore < 60
            ? `${member.name} has low engagement this week.`
            : `${member.name} performance is below team average.`,

        suggestion: "Review notifications and assign new lead activity.",
      }));
  }

  private generateOverloadedMembers(members: any[]) {
    return members
      .filter((member) => member.totalLeads >= 15)
      .map((member) => ({
        id: member.id,

        name: member.name,

        totalLeads: member.totalLeads,

        aiScore: member.aiScore,

        severity: member.totalLeads >= 30 ? "high" : "medium",
      }));
  }
  /* =====================================================
  TRENDS
===================================================== */

  private generateTrends(metrics: TeamAIMetrics, previous: any) {
    return {
      productivity: this.calculateTrend(
        metrics.productivityScore,
        previous?.productivity_score || 0,
      ),

      collaboration: this.calculateTrend(
        metrics.collaborationScore,
        previous?.collaboration_score || 0,
      ),

      efficiency: this.calculateTrend(
        metrics.efficiencyScore,
        previous?.efficiency_score || 0,
      ),
    };
  }

  /* =====================================================
  WORKLOAD
===================================================== */

  private generateWorkloadDistribution(metrics: TeamAIMetrics) {
    return {
      balanced: metrics.collaborationScore >= 70,

      overloadedMembers:
        metrics.inactiveMembers > 2 ? metrics.inactiveMembers : 0,

      activeMembers: metrics.activeMembers,
    };
  }

  /* =====================================================
  ALERTS
===================================================== */

  private generateAlerts(metrics: TeamAIMetrics) {
    const alerts = [];

    if (metrics.unreadNotifications >= 10) {
      alerts.push({
        type: "warning",

        title: "Unread notifications increasing",

        description: "Your team has too many unread notifications pending.",
      });
    }

    if (metrics.inactiveLeads >= 5) {
      alerts.push({
        type: "danger",

        title: "Inactive leads detected",

        description: "Several leads have not been updated in over 14 days.",
      });
    }

    if (metrics.averageAIScore >= 85) {
      alerts.push({
        type: "success",

        title: "Excellent AI performance",

        description: "Your team is maintaining strong AI productivity metrics.",
      });
    }

    return alerts;
  }

  private async getLeads(teamId: string) {
    try {
      const result = await this.db.query(
        `
      SELECT
        id,
        status,
        assigned_to,
        created_at,
        updated_at
      FROM leads
      WHERE team_id = $1
      `,
        [teamId],
      );

      return result.rows;
    } catch {
      return [];
    }
  }

  private async getDeals(teamId: string) {
    try {
      const result = await this.db.query(
        `
      SELECT
        id,
        stage,
        value,
        assigned_to,
        created_at,
        updated_at
      FROM deals
      WHERE team_id = $1
      `,
        [teamId],
      );

      return result.rows;
    } catch {
      return [];
    }
  }

  private generatePipelineRisks(metrics: any) {
    const risks = [];

    if (metrics.conversionRate < 20) {
      risks.push({
        type: "danger",

        title: "Low conversion rate",

        description: "Deal conversion rate is below healthy threshold.",
      });
    }

    if (metrics.inactiveLeads >= 10) {
      risks.push({
        type: "warning",

        title: "Inactive leads increasing",

        description: "Many leads have not been updated recently.",
      });
    }

    if (metrics.pipelineValue <= 5000) {
      risks.push({
        type: "warning",

        title: "Low pipeline value",

        description: "Current pipeline value is lower than expected.",
      });
    }

    return risks;
  }

  private async saveSnapshot(
    teamId: string,
    metrics: TeamAIMetrics,
    health: number,
  ) {
    await this.db.query(
      `
    INSERT INTO team_ai_snapshots (
      team_id,
      productivity_score,
      collaboration_score,
      efficiency_score,
      health_score,
      pipeline_value,
      conversion_rate,
      active_leads,
      inactive_leads,
      won_deals,
      lost_deals
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
    )
    `,
      [
        teamId,
        metrics.productivityScore,
        metrics.collaborationScore,
        metrics.efficiencyScore,
        health,
        metrics.pipelineValue,
        metrics.conversionRate,
        metrics.activeLeads,
        metrics.inactiveLeads,
        metrics.wonDeals,
        metrics.lostDeals,
      ],
    );
  }

  private async shouldCreateSnapshot(teamId: string) {
    const result = await this.db.query(
      `
    SELECT created_at
    FROM team_ai_snapshots
    WHERE team_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
      [teamId],
    );

    const latest = result.rows[0];

    if (!latest) {
      return true;
    }

    const lastCreatedAt = new Date(latest.created_at).getTime();

    const now = Date.now();

    const diffHours = (now - lastCreatedAt) / (1000 * 60 * 60);

    return diffHours >= 1;
  }

  private async getTeamHistory(teamId: string) {
    try {
      const result = await this.db.query(
        `
      SELECT
        DATE(created_at) as date,

        productivity_score,

        collaboration_score,

        efficiency_score,

        health_score,

        conversion_rate,

        pipeline_value

      FROM team_ai_snapshots
      WHERE team_id = $1
      ORDER BY created_at ASC
      LIMIT 30
      `,
        [teamId],
      );

      return result.rows;
    } catch (error) {
      console.error(error);

      return [];
    }
  }

  private calculateTrend(current: number, previous: number) {
    if (!previous) {
      return "0%";
    }

    const diff = ((current - previous) / previous) * 100;

    const sign = diff >= 0 ? "+" : "";

    return `${sign}${Math.round(diff)}%`;
  }

  private async getPreviousSnapshot(teamId: string) {
    const result = await this.db.query(
      `
    SELECT *
    FROM team_ai_snapshots
    WHERE team_id = $1
    ORDER BY created_at DESC
    OFFSET 1
    LIMIT 1
    `,
      [teamId],
    );

    return result.rows[0];
  }

  async refreshAIInsights(teamId: string, userId: string) {
    const insights = await this.generate(teamId);

    return {
      success: true,
      refreshedAt: new Date(),
      insights,
    };
  }
}
