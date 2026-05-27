import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

import { NotificationsService } from "../../notifications/notifications.service";

import { TeamAIMetrics } from "./interfaces/ai-metrics.interface";

@Injectable()
export class TeamAIInsightsService {
  constructor(
    private readonly db: DatabaseService,

    private readonly notificationsService: NotificationsService,
  ) {}

  async generate(teamId: string) {
    const [members, conversations, notifications, properties, leads] =
      await Promise.all([
        this.getMembers(teamId),

        this.getConversations(teamId),

        this.getNotifications(teamId),

        this.getProperties(teamId),
        this.getLeads(teamId),
      ]);

    const metrics = this.buildMetrics({
      members,
      conversations,
      notifications,
      properties,
      leads,
    });

    const health = this.calculateHealthScore(metrics);

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

      trends: this.generateTrends(metrics),

      workloadDistribution: this.generateWorkloadDistribution(metrics),

      alerts: this.generateAlerts(metrics),

      nextActions: this.generateActions(metrics),
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

  private generateRecommendations(metrics: TeamAIMetrics) {
    const recommendations = [];

    if (metrics.productivityScore < 70) {
      recommendations.push("Increase daily team activity tracking.");
    }

    if (metrics.collaborationScore < 70) {
      recommendations.push("Encourage more team collaboration and follow-ups.");
    }

    if (metrics.unreadNotifications > 5) {
      recommendations.push("Review and clear pending notifications.");
    }

    recommendations.push("Schedule weekly AI performance review.");

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

        score: member.aiScore || 90 - index * 5,
      }));
  }

  /* =====================================================
    ACTIONS
  ===================================================== */

  private generateActions(metrics: TeamAIMetrics) {
    return [
      {
        label: "Open Team Members",

        route: "/dashboard/team/members",
      },

      {
        label: "Review Notifications",

        route: "/dashboard/notifications",
      },

      {
        label: "Open Team Dashboard",

        route: "/dashboard/team",
      },
    ];
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
            ? "Low engagement detected"
            : "Performance slightly below average",
      }));
  }

  /* =====================================================
  TRENDS
===================================================== */

  private generateTrends(metrics: TeamAIMetrics) {
    return {
      productivity: "+12%",

      collaboration: "+7%",

      efficiency: "+5%",

      responseRate: `${metrics.responseRate}%`,
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
}
