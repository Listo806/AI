import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { MoveDealDto } from "./dto/move-deal.dto";
import OpenAI from "openai";

const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "#3b82f6", position: 1 },
  { key: "qualified", label: "Qualified", color: "#8b5cf6", position: 2 },
  { key: "proposal", label: "Proposal", color: "#f59e0b", position: 3 },
  { key: "negotiation", label: "Negotiation", color: "#06b6d4", position: 4 },
  { key: "won", label: "Won", color: "#22c55e", position: 5 },
  { key: "lost", label: "Lost", color: "#ef4444", position: 6 },
];

@Injectable()
export class PipelineService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  constructor(private readonly db: DatabaseService) {}

  private getScope(userId: string, teamId?: string | null) {
    if (teamId) {
      return {
        where: "d.team_id = $1",
        params: [teamId],
      };
    }

    return {
      where: "d.created_by = $1",
      params: [userId],
    };
  }

  private formatMoney(value: any) {
    const amount = Number(value || 0);

    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;

    return `$${amount.toLocaleString()}`;
  }

  private formatTimeAgo(value: any) {
    if (!value) return "Recently updated";

    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }

  private getInitials(name = "") {
    return (
      String(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase() || "D"
    );
  }

  private getStageTitle(stage: string) {
    const map: Record<string, string> = {
      new: "New",
      qualified: "Qualified",
      proposal: "Proposal",
      negotiation: "Negotiation",
      won: "Won",
      lost: "Lost",
    };

    return map[stage] || stage;
  }

  private getDealScore(deal: any) {
    if (deal.stage === "won") return 100;
    if (deal.stage === "lost") return 22;
    if (deal.leadPriority === "high") return 91;
    if (deal.leadPriority === "medium") return 72;
    if (deal.stage === "negotiation") return 84;
    if (deal.stage === "proposal") return 78;
    if (deal.stage === "qualified") return 68;

    return 58;
  }

  private getDealTag(score: number, stage: string) {
    if (stage === "won") return "Won";
    if (stage === "lost") return "Lost";
    if (score >= 80) return "Hot";
    if (score >= 50) return "Warm";
    return "Cool";
  }

  private getNextAction(stage: string) {
    const map: Record<string, string> = {
      new: "Call now",
      qualified: "Schedule tour",
      proposal: "Follow up",
      negotiation: "Send offer",
      won: "Closed",
      lost: "Review reason",
    };

    return map[stage] || "Follow up";
  }

  private calcGrowth(current: number, previous: number) {
    if (!previous && current > 0) return 100;
    if (!previous) return 0;

    return Math.round(((current - previous) / previous) * 100);
  }

  private getTrend(
    current: number,
    previous: number,
    compareLabel: string,
    positiveGood = true,
    minPreviousForPercent = 1,
  ) {
    if (previous < minPreviousForPercent && current > 0) {
      return {
        direction: "up",
        icon: "↑",
        value: null,
        compareLabel,
        text: "New this period",
        className: positiveGood ? "text-green" : "text-red",
      };
    }

    if (current > previous) {
      const value = Math.abs(this.calcGrowth(current, previous));

      return {
        direction: "up",
        icon: "↑",
        value,
        compareLabel,
        text: `↑ ${value}% ${compareLabel}`,
        className: positiveGood ? "text-green" : "text-red",
      };
    }

    if (current < previous) {
      const value = Math.abs(this.calcGrowth(current, previous));

      return {
        direction: "down",
        icon: "↓",
        value,
        compareLabel,
        text: `↓ ${value}% ${compareLabel}`,
        className: positiveGood ? "text-red" : "text-green",
      };
    }

    return {
      direction: "flat",
      icon: "→",
      value: 0,
      compareLabel,
      text: `→ 0% ${compareLabel}`,
      className: "text-slate",
    };
  }

  private getConfidenceTrend(aiCloseScore: number) {
    if (aiCloseScore >= 80) {
      return {
        direction: "up",
        icon: "↑",
        value: aiCloseScore,
        text: "↑ High Confidence",
        className: "text-green",
      };
    }

    if (aiCloseScore >= 50) {
      return {
        direction: "flat",
        icon: "→",
        value: aiCloseScore,
        text: "→ Medium Confidence",
        className: "text-orange",
      };
    }

    return {
      direction: "down",
      icon: "↓",
      value: aiCloseScore,
      text: "↓ Low Confidence",
      className: "text-red",
    };
  }

  private getForecastPeriodSql(range = "month") {
    switch (range) {
      case "week":
        return {
          range: "week",
          label: "This Week",
          currentStart: "date_trunc('week', NOW())",
          previousStart: "date_trunc('week', NOW() - interval '1 week')",
          previousEnd: "date_trunc('week', NOW())",
          trendLabel: "vs last week",
        };

      case "quarter":
        return {
          range: "quarter",
          label: "This Quarter",
          currentStart: "date_trunc('quarter', NOW())",
          previousStart: "date_trunc('quarter', NOW() - interval '3 months')",
          previousEnd: "date_trunc('quarter', NOW())",
          trendLabel: "vs last quarter",
        };

      case "year":
        return {
          range: "year",
          label: "This Year",
          currentStart: "date_trunc('year', NOW())",
          previousStart: "date_trunc('year', NOW() - interval '1 year')",
          previousEnd: "date_trunc('year', NOW())",
          trendLabel: "vs last year",
        };

      case "month":
      default:
        return {
          range: "month",
          label: "This Month",
          currentStart: "date_trunc('month', NOW())",
          previousStart: "date_trunc('month', NOW() - interval '1 month')",
          previousEnd: "date_trunc('month', NOW())",
          trendLabel: "vs last month",
        };
    }
  }

  private async getPeriodSummary(
    scope: { where: string; params: any[] },
    period: any,
  ) {
    const { rows } = await this.db.query(
      `
      WITH scoped_deals AS (
        SELECT *
        FROM deals d
        WHERE ${scope.where}
      ),
      current_period AS (
        SELECT *
        FROM scoped_deals
        WHERE created_at >= ${period.currentStart}
      ),
      previous_period AS (
        SELECT *
        FROM scoped_deals
        WHERE created_at >= ${period.previousStart}
          AND created_at < ${period.previousEnd}
      )
      SELECT
        COUNT(*)::int AS "totalDeals",

        COUNT(*) FILTER (
          WHERE created_at >= ${period.currentStart}
        )::int AS "newDealsThisPeriod",

        COALESCE(SUM(value), 0)::numeric AS "pipelineValue",

        COALESCE(SUM(value) FILTER (
          WHERE stage = 'won'
            AND updated_at >= ${period.currentStart}
        ), 0)::numeric AS "wonThisPeriod",

        COUNT(*) FILTER (
          WHERE stage = 'negotiation'
        )::int AS "activeNegotiations",

        COUNT(*) FILTER (
          WHERE stage NOT IN ('won', 'lost')
            AND updated_at < NOW() - interval '7 days'
        )::int AS "stuckDeals",

        COUNT(*) FILTER (
          WHERE stage = 'won'
        )::int AS "wonDeals",

        COUNT(*) FILTER (
          WHERE stage = 'lost'
        )::int AS "lostDeals",

        COUNT(*) FILTER (
          WHERE stage NOT IN ('won', 'lost')
        )::int AS "openDeals",

        COALESCE(SUM(value) FILTER (
          WHERE stage NOT IN ('won', 'lost')
        ), 0)::numeric AS "openValue",

        COALESCE(SUM(value) FILTER (
          WHERE stage = 'won'
        ), 0)::numeric AS "wonValue",

        COALESCE(SUM(value) FILTER (
          WHERE stage NOT IN ('won', 'lost')
            AND updated_at < NOW() - interval '7 days'
        ), 0)::numeric AS "revenueAtRisk",

        COALESCE(AVG(value), 0)::numeric AS "averageDeal",

        (
          SELECT COUNT(*)::int
          FROM current_period
        ) AS "currentPeriodDeals",

        (
          SELECT COUNT(*)::int
          FROM previous_period
        ) AS "previousPeriodDeals",

        (
          SELECT COALESCE(SUM(value), 0)::numeric
          FROM current_period
        ) AS "currentPeriodValue",

        (
          SELECT COALESCE(SUM(value), 0)::numeric
          FROM previous_period
        ) AS "previousPeriodValue",

        (
          SELECT COUNT(*)::int
          FROM current_period
          WHERE stage = 'won'
        ) AS "currentPeriodClosings",

        (
          SELECT COUNT(*)::int
          FROM previous_period
          WHERE stage = 'won'
        ) AS "previousPeriodClosings",

        (
          SELECT COALESCE(SUM(value), 0)::numeric
          FROM current_period
          WHERE stage = 'won'
        ) AS "currentPeriodWonValue",

        (
          SELECT COALESCE(SUM(value), 0)::numeric
          FROM previous_period
          WHERE stage = 'won'
        ) AS "previousPeriodWonValue"

      FROM scoped_deals
      `,
      scope.params,
    );

    return rows[0] || {};
  }

  async getPipeline(userId: string, teamId?: string | null) {
    const scope = this.getScope(userId, teamId);

    const { rows } = await this.db.query(
      `
      SELECT
        d.id,
        d.name,
        d.value,
        d.stage,
        d.position,
        d.notes,
        d.lead_id AS "leadId",
        d.team_id AS "teamId",
        d.created_by AS "createdBy",
        d.assigned_to AS "assignedTo",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",

        l.name AS "leadName",
        l.email AS "leadEmail",
        l.phone AS "leadPhone",
        l.status AS "leadStatus",
        l.priority AS "leadPriority",

        u.name AS "assignedName",
        u.email AS "assignedEmail"

      FROM deals d
      LEFT JOIN leads l ON l.id = d.lead_id
      LEFT JOIN users u ON u.id = d.assigned_to
      WHERE ${scope.where}
      ORDER BY d.position ASC, d.created_at DESC
      `,
      scope.params,
    );

    return PIPELINE_STAGES.map((stage) => {
      const deals = rows.filter((deal) => deal.stage === stage.key);

      return {
        id: stage.key,
        key: stage.key,
        name: stage.label,
        color: stage.color,
        position: stage.position,
        totalDeals: deals.length,
        totalValue: deals.reduce(
          (sum, deal) => sum + Number(deal.value || 0),
          0,
        ),
        deals: deals.map((deal) => ({
          id: deal.id,
          name: deal.name,
          value: Number(deal.value || 0),
          stage: deal.stage,
          position: deal.position,
          notes: deal.notes,
          leadId: deal.leadId,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          lead: deal.leadId
            ? {
                id: deal.leadId,
                name: deal.leadName,
                email: deal.leadEmail,
                phone: deal.leadPhone,
                status: deal.leadStatus,
                priority: deal.leadPriority,
              }
            : null,
          assignedTo: deal.assignedTo,
          assignedUser: deal.assignedTo
            ? {
                id: deal.assignedTo,
                name: deal.assignedName,
                email: deal.assignedEmail,
              }
            : null,
        })),
      };
    });
  }

  async getSummary(userId: string, teamId?: string | null) {
    const dashboard = await this.getDashboard(userId, teamId, "month");
    return dashboard.summary;
  }

  async getDashboard(
    userId: string,
    teamId?: string | null,
    forecastRange = "month",
  ) {
    const scope = this.getScope(userId, teamId);

    const statsPeriod = this.getForecastPeriodSql("month");
    const forecastPeriod = this.getForecastPeriodSql(forecastRange);

    const { rows: deals } = await this.db.query(
      `
      SELECT
        d.id,
        d.name,
        COALESCE(d.value, 0) AS value,
        COALESCE(d.stage, 'new') AS stage,
        COALESCE(d.position, 0) AS position,
        d.notes,
        d.lead_id AS "leadId",
        d.team_id AS "teamId",
        d.created_by AS "createdBy",
        d.assigned_to AS "assignedTo",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",

        l.name AS "leadName",
        l.email AS "leadEmail",
        l.phone AS "leadPhone",
        l.status AS "leadStatus",
        l.priority AS "leadPriority",
        score_event.metadata AS "latestScoreMetadata",
        score_event.created_at AS "latestScoreAt"

      FROM deals d
      LEFT JOIN leads l ON l.id = d.lead_id
      LEFT JOIN LATERAL (
            SELECT metadata, created_at
            FROM events e
            WHERE e.entity_type = 'deal'
                AND e.entity_id = d.id
                AND e.event_type = 'deal.ai_score_reviewed'
            ORDER BY e.created_at DESC
            LIMIT 1
            ) score_event ON true
      WHERE ${scope.where}
      ORDER BY d.position ASC, d.created_at DESC
      `,
      scope.params,
    );

    const statsSummary = await this.getPeriodSummary(scope, statsPeriod);
    const forecastSummary = await this.getPeriodSummary(scope, forecastPeriod);

    const totalDeals = Number(statsSummary.totalDeals || 0);
    const wonDeals = Number(statsSummary.wonDeals || 0);
    const lostDeals = Number(statsSummary.lostDeals || 0);
    const openDeals = Number(statsSummary.openDeals || 0);
    const activeNegotiations = Number(statsSummary.activeNegotiations || 0);
    const stuckDeals = Number(statsSummary.stuckDeals || 0);

    const conversionRate = totalDeals
      ? Math.round((wonDeals / totalDeals) * 100)
      : 0;

    const aiCloseScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(conversionRate + activeNegotiations * 2 - stuckDeals * 3),
      ),
    );

    const dealsTrend = this.getTrend(
      Number(statsSummary.currentPeriodDeals || 0),
      Number(statsSummary.previousPeriodDeals || 0),
      statsPeriod.trendLabel,
    );

    const pipelineTrend = this.getTrend(
      Number(statsSummary.currentPeriodValue || 0),
      Number(statsSummary.previousPeriodValue || 0),
      statsPeriod.trendLabel,
      true,
      1000,
    );

    const wonTrend = this.getTrend(
      Number(statsSummary.currentPeriodWonValue || 0),
      Number(statsSummary.previousPeriodWonValue || 0),
      statsPeriod.trendLabel,
      true,
      1000,
    );

    const riskTrend = this.getTrend(
      Number(statsSummary.revenueAtRisk || 0),
      Number(statsSummary.openValue || 0),
      "of open value",
      false,
      1000,
    );

    const forecastRevenueTrend = this.getTrend(
      Number(forecastSummary.currentPeriodValue || 0),
      Number(forecastSummary.previousPeriodValue || 0),
      forecastPeriod.trendLabel,
      true,
      1000,
    );

    const forecastClosingsTrend = this.getTrend(
      Number(forecastSummary.currentPeriodClosings || 0),
      Number(forecastSummary.previousPeriodClosings || 0),
      forecastPeriod.trendLabel,
    );

    const forecastVelocityTrend = this.getTrend(
      Number(forecastSummary.currentPeriodValue || 0),
      Number(forecastSummary.previousPeriodValue || 0),
      forecastPeriod.trendLabel,
      true,
      1000,
    );

    const confidenceTrend = this.getConfidenceTrend(aiCloseScore);

    const stats = [
      {
        title: "Total Deals",
        value: totalDeals,
        change: dealsTrend.text,
        trend: dealsTrend,
        iconKey: "users",
        className: "blue",
        changeClass: dealsTrend.className,
      },
      {
        title: "Pipeline Value",
        value: this.formatMoney(statsSummary.pipelineValue),
        change: pipelineTrend.text,
        trend: pipelineTrend,
        iconKey: "dollar",
        className: "green",
        changeClass: pipelineTrend.className,
      },
      {
        title: "Won This Month",
        value: this.formatMoney(statsSummary.wonThisPeriod),
        change: wonTrend.text,
        trend: wonTrend,
        iconKey: "check",
        className: "purple",
        changeClass: wonTrend.className,
      },
      {
        title: "Active Negotiations",
        value: activeNegotiations,
        change: `${stuckDeals} stuck deals`,
        trend: {
          direction: stuckDeals > 0 ? "down" : "flat",
          icon: stuckDeals > 0 ? "↓" : "→",
          value: stuckDeals,
          text: `${stuckDeals} stuck deals`,
          className: stuckDeals > 0 ? "text-orange" : "text-green",
        },
        iconKey: "flame",
        className: "orange",
        changeClass: stuckDeals > 0 ? "text-orange" : "text-green",
      },
      {
        title: "AI Close Score",
        value: `${aiCloseScore}%`,
        change: confidenceTrend.text,
        trend: confidenceTrend,
        iconKey: "bot",
        className: "cyan",
        changeClass: confidenceTrend.className,
      },
      {
        title: "Revenue At Risk",
        value: this.formatMoney(statsSummary.revenueAtRisk),
        change: riskTrend.text,
        trend: riskTrend,
        iconKey: "alert",
        className: "pink",
        changeClass: riskTrend.className,
      },
    ];

    const columns = PIPELINE_STAGES.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage.key);
      const totalValue = stageDeals.reduce(
        (sum, deal) => sum + Number(deal.value || 0),
        0,
      );

      return {
        id: stage.key,
        title: stage.label,
        count: stageDeals.length,
        amount: this.formatMoney(totalValue),
        insight:
          stageDeals.length > 0
            ? `${stageDeals.length} active deal${stageDeals.length > 1 ? "s" : ""}`
            : "No active deals",
        deals: stageDeals.map((deal) => {
          const displayName = deal.leadName || deal.name || "Unnamed Deal";
          const aiMetadata = deal.latestScoreMetadata || {};
          const score = Number(aiMetadata.score || this.getDealScore(deal));
          const tag = aiMetadata.tag || this.getDealTag(score, deal.stage);
          const risk =
            aiMetadata.risk ||
            (score >= 80 ? "Low" : score >= 50 ? "Medium" : "High");

          const suggestedSteps = Array.isArray(aiMetadata.nextActions)
            ? aiMetadata.nextActions
            : [
                {
                  title: this.getNextAction(deal.stage),
                  impact: score >= 80 ? "high" : "medium",
                  impactLabel: score >= 80 ? "High impact" : "Medium impact",
                },
                {
                  title:
                    deal.stage === "new"
                      ? "Make first contact"
                      : "Follow up with buyer",
                  impact: "medium",
                  impactLabel: "Medium impact",
                },
              ];

          return {
            id: deal.id,
            name: displayName,
            property:
              deal.leadEmail ||
              deal.leadPhone ||
              deal.notes ||
              "No contact info",
            amount: this.formatMoney(deal.value),
            score: `${score}%`,
            tag,
            action: this.getNextAction(deal.stage),
            time: this.formatTimeAgo(deal.updatedAt || deal.createdAt),
            avatarClass: "avatar-blue",
            avatarInitials: this.getInitials(displayName),
            stage: deal.stage,
            leadId: deal.leadId,
            value: Number(deal.value || 0),
            risk,
            suggestedSteps,
            aiReason: aiMetadata.reason || null,
            aiScoredAt: deal.latestScoreAt || null,
          };
        }),
      };
    });

    const riskQueue = deals
      .filter(
        (deal) =>
          deal.stage !== "won" &&
          deal.stage !== "lost" &&
          new Date(deal.updatedAt).getTime() <
            Date.now() - 7 * 24 * 60 * 60 * 1000,
      )
      .slice(0, 4)
      .map((deal) => ({
        id: deal.id,
        name: deal.leadName || deal.name || "Unnamed Deal",
        value: this.formatMoney(deal.value),
        reason: "Stale for 7+ days",
        status: Number(deal.value || 0) >= 500000 ? "High" : "Medium",
        time: this.formatTimeAgo(deal.updatedAt || deal.createdAt),
      }));

    const forecast = {
      range: forecastPeriod.range,
      rangeLabel: forecastPeriod.label,

      forecastedRevenue: this.formatMoney(
        forecastSummary.currentPeriodValue || 0,
      ),
      forecastedRevenueTrend: forecastRevenueTrend,

      forecastedClosings: Number(forecastSummary.currentPeriodClosings || 0),
      forecastedClosingsTrend: forecastClosingsTrend,

      pipelineVelocity: totalDeals
        ? `${Math.max(1, totalDeals / 10).toFixed(2)}x`
        : "0x",
      pipelineVelocityTrend: forecastVelocityTrend,

      closeConfidence: `${aiCloseScore}%`,
      closeConfidenceTrend: confidenceTrend,

      description: `AI predicts ${this.formatMoney(
        forecastSummary.currentPeriodValue || 0,
      )} in revenue with ${aiCloseScore}% confidence for ${forecastPeriod.label.toLowerCase()} based on current pipeline health, deal velocity, and engagement signals.`,
    };

    const automationHealth = [
      { title: "AI Score Refresh", state: "Active" },
      { title: "Auto Prioritization", state: "Active" },
      { title: "Follow-Up Tasks", state: "Active" },
      { title: "Pipeline Sync", state: "Active" },
      {
        title: "Risk Detection",
        state: riskQueue.length ? "Active" : "Healthy",
      },
    ];

    return {
      stats,
      columns,
      riskQueue,
      forecast,
      automationHealth,
      summary: {
        totalDeals,
        wonDeals,
        lostDeals,
        openDeals,
        activeNegotiations,
        stuckDeals,
        pipelineValue: Number(statsSummary.pipelineValue || 0),
        openValue: Number(statsSummary.openValue || 0),
        wonValue: Number(statsSummary.wonValue || 0),
        revenueAtRisk: Number(statsSummary.revenueAtRisk || 0),
        averageDeal: Number(statsSummary.averageDeal || 0),
        conversionRate,
        aiCloseScore,
        trends: {
          dealsTrend,
          pipelineTrend,
          wonTrend,
          riskTrend,
          forecastRevenueTrend,
          forecastClosingsTrend,
          forecastVelocityTrend,
          confidenceTrend,
        },
      },
    };
  }

  async createDeal(dto: CreateDealDto, userId: string, teamId?: string | null) {
    if (!teamId) {
      throw new ForbiddenException("Team is required to create deals");
    }

    const stage = dto.stage || "new";

    const { rows } = await this.db.query(
      `
      INSERT INTO deals (
        team_id,
        name,
        value,
        stage,
        position,
        lead_id,
        notes,
        created_by,
        assigned_to,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        COALESCE(
          (
            SELECT MAX(position) + 1
            FROM deals
            WHERE team_id = $1 AND stage = $4
          ),
          0
        ),
        $5,
        $6,
        $7,
        $8,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        team_id AS "teamId",
        name,
        value,
        stage,
        position,
        lead_id AS "leadId",
        notes,
        created_by AS "createdBy",
        assigned_to AS "assignedTo",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        teamId,
        dto.name,
        dto.value || 0,
        stage,
        dto.leadId || null,
        dto.notes || null,
        userId,
        dto.assignedTo || userId,
      ],
    );

    await this.createEvent({
      eventType: "deal.created",
      entityId: rows[0].id,
      userId,
      teamId,
      metadata: {
        title: "Deal created",
        sub: rows[0].name,
        stage,
        value: rows[0].value,
      },
    });

    return rows[0];
  }

  async updateDeal(
    id: string,
    dto: UpdateDealDto,
    userId: string,
    teamId?: string | null,
  ) {
    const deal = await this.findDealForUser(id, userId, teamId);

    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (dto.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(dto.name);
    }

    if (dto.value !== undefined) {
      updates.push(`value = $${index++}`);
      values.push(dto.value);
    }

    if (dto.stage !== undefined) {
      updates.push(`stage = $${index++}`);
      values.push(dto.stage);
    }

    if (dto.notes !== undefined) {
      updates.push(`notes = $${index++}`);
      values.push(dto.notes || null);
    }

    if (dto.assignedTo !== undefined) {
      updates.push(`assigned_to = $${index++}`);
      values.push(dto.assignedTo || null);
    }

    if (!updates.length) return deal;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `
      UPDATE deals
      SET ${updates.join(", ")}
      WHERE id = $${index}
      RETURNING
        id,
        team_id AS "teamId",
        name,
        value,
        stage,
        position,
        lead_id AS "leadId",
        notes,
        created_by AS "createdBy",
        assigned_to AS "assignedTo",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      values,
    );

    await this.createEvent({
      eventType: "deal.updated",
      entityId: id,
      userId,
      teamId: rows[0].teamId,
      metadata: {
        title: "Deal updated",
        sub: rows[0].name,
      },
    });

    return rows[0];
  }

  async moveDeal(
    id: string,
    dto: MoveDealDto,
    userId: string,
    teamId?: string | null,
  ) {
    const deal = await this.findDealForUser(id, userId, teamId);
    const oldStage = deal.stage;

    const position =
      dto.position !== undefined
        ? dto.position
        : await this.getNextPosition(deal.teamId, dto.stage);

    const { rows } = await this.db.query(
      `
      UPDATE deals
      SET
        stage = $1,
        position = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        team_id AS "teamId",
        name,
        value,
        stage,
        position,
        lead_id AS "leadId",
        notes,
        created_by AS "createdBy",
        assigned_to AS "assignedTo",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [dto.stage, position, id],
    );

    await this.createEvent({
      eventType: "deal.stage_changed",
      entityId: id,
      userId,
      teamId: rows[0].teamId,
      metadata: {
        title: "Deal moved",
        sub: `Moved from ${oldStage} to ${dto.stage}`,
        oldStage,
        newStage: dto.stage,
      },
    });

    return rows[0];
  }

  async deleteDeal(id: string, userId: string, teamId?: string | null) {
    const deal = await this.findDealForUser(id, userId, teamId);

    await this.db.query(`DELETE FROM deals WHERE id = $1`, [id]);

    await this.createEvent({
      eventType: "deal.deleted",
      entityId: id,
      userId,
      teamId: deal.teamId,
      metadata: {
        title: "Deal deleted",
        sub: deal.name,
      },
    });

    return { message: "Deal deleted successfully" };
  }

  async getDealEvents(id: string, userId: string, teamId?: string | null) {
    const deal = await this.findDealForUser(id, userId, teamId);

    const { rows } = await this.db.query(
      `
      SELECT
        id,
        event_type AS "eventType",
        entity_type AS "entityType",
        entity_id AS "entityId",
        user_id AS "userId",
        team_id AS "teamId",
        COALESCE(metadata, '{}'::jsonb) AS metadata,
        created_at AS "createdAt"
      FROM events
      WHERE entity_type = 'deal'
        AND entity_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [deal.id],
    );

    return {
      deal,
      events: rows.map((event) => ({
        ...event,
        timeAgo: this.formatTimeAgo(event.createdAt),
      })),
    };
  }

  private async findDealForUser(
    id: string,
    userId: string,
    teamId?: string | null,
  ) {
    const { rows } = await this.db.query(
      `
      SELECT
        id,
        team_id AS "teamId",
        name,
        value,
        stage,
        position,
        lead_id AS "leadId",
        notes,
        created_by AS "createdBy",
        assigned_to AS "assignedTo",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM deals
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException("Deal not found");
    }

    const deal = rows[0];

    const isCreator = deal.createdBy === userId;
    const isSameTeam = teamId && deal.teamId === teamId;

    if (!isCreator && !isSameTeam) {
      throw new ForbiddenException("You do not have access to this deal");
    }

    return deal;
  }

  private async getNextPosition(teamId: string, stage: string) {
    const { rows } = await this.db.query(
      `
      SELECT COALESCE(MAX(position) + 1, 0)::int AS position
      FROM deals
      WHERE team_id = $1 AND stage = $2
      `,
      [teamId, stage],
    );

    return rows[0]?.position || 0;
  }

  private async createEvent(params: {
    eventType: string;
    entityId: string;
    userId: string;
    teamId?: string | null;
    metadata?: any;
  }) {
    await this.db.query(
      `
      INSERT INTO events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        team_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        params.eventType,
        "deal",
        params.entityId,
        params.userId,
        params.teamId || null,
        JSON.stringify(params.metadata || {}),
      ],
    );
  }

  async scoreDeal(id: string, userId: string, teamId?: string | null) {
    const deal = await this.findDealForUser(id, userId, teamId);

    const { rows: detailRows } = await this.db.query(
      `
    SELECT
      d.id,
      d.name,
      d.value,
      d.stage,
      d.notes,
      d.created_at AS "createdAt",
      d.updated_at AS "updatedAt",

      l.name AS "leadName",
      l.email AS "leadEmail",
      l.phone AS "leadPhone",
      l.status AS "leadStatus",
      l.priority AS "leadPriority",
      l.source AS "leadSource",
      l.notes AS "leadNotes",

      u.name AS "assignedName",
      u.email AS "assignedEmail"

    FROM deals d
    LEFT JOIN leads l ON l.id = d.lead_id
    LEFT JOIN users u ON u.id = d.assigned_to
    WHERE d.id = $1
    LIMIT 1
    `,
      [id],
    );

    const dealDetail = detailRows[0] || deal;

    const { rows: eventRows } = await this.db.query(
      `
    SELECT
      event_type AS "eventType",
      metadata,
      created_at AS "createdAt"
    FROM events
    WHERE entity_type = 'deal'
      AND entity_id = $1
    ORDER BY created_at DESC
    LIMIT 10
    `,
      [id],
    );

    const aiContext = {
      deal: dealDetail,
      recentEvents: eventRows,
    };

    const systemPrompt = `
You are CORTEXA AI, a real estate CRM pipeline scoring assistant.

Analyze the deal and return ONLY valid JSON.

Scoring rules:
- score must be 0 to 100.
- tag must be one of: Hot, Warm, Cool, Won, Lost.
- risk must be one of: Low, Medium, High.
- nextActions must contain 2 to 4 practical actions.
- Be realistic based only on the CRM data provided.
- If data is limited, still give a useful conservative score.

Return JSON with this exact shape:
{
  "score": 84,
  "tag": "Hot",
  "risk": "Medium",
  "reason": "Short explanation",
  "nextActions": [
    {
      "title": "Schedule follow-up call",
      "impact": "high",
      "impactLabel": "High impact"
    }
  ]
}
`;

    let aiResult: any = null;

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt,
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `CRM DEAL DATA:\n${JSON.stringify(aiContext)}`,
              },
            ],
          },
        ],
      });

      const raw = response.output_text || "{}";
      aiResult = JSON.parse(raw);
    } catch (err) {
      console.error("AI score deal error:", err);

      const fallbackScore =
        deal.stage === "won"
          ? 100
          : deal.stage === "lost"
            ? 22
            : deal.stage === "negotiation"
              ? 84
              : deal.stage === "proposal"
                ? 78
                : deal.stage === "qualified"
                  ? 68
                  : 58;

      aiResult = {
        score: fallbackScore,
        tag: this.getDealTag(fallbackScore, deal.stage),
        risk:
          fallbackScore >= 80 ? "Low" : fallbackScore >= 50 ? "Medium" : "High",
        reason:
          "Fallback score generated from deal stage because AI scoring failed.",
        nextActions: [
          {
            title: this.getNextAction(deal.stage),
            impact: fallbackScore >= 80 ? "high" : "medium",
            impactLabel: fallbackScore >= 80 ? "High impact" : "Medium impact",
          },
        ],
      };
    }

    const score = Math.max(0, Math.min(100, Number(aiResult.score || 0)));

    const result = {
      score,
      tag: aiResult.tag || this.getDealTag(score, deal.stage),
      risk:
        aiResult.risk ||
        (score >= 80 ? "Low" : score >= 50 ? "Medium" : "High"),
      reason: aiResult.reason || "AI score completed.",
      nextActions: Array.isArray(aiResult.nextActions)
        ? aiResult.nextActions.slice(0, 4)
        : [
            {
              title: this.getNextAction(deal.stage),
              impact: "medium",
              impactLabel: "Medium impact",
            },
          ],
    };

    await this.createEvent({
      eventType: "deal.ai_score_reviewed",
      entityId: id,
      userId,
      teamId: deal.teamId,
      metadata: {
        title: "AI score reviewed",
        sub: `${result.tag} deal • ${result.score}% • ${result.risk} risk`,
        ...result,
      },
    });

    return {
      id,
      ...result,
      message: "AI score reviewed successfully",
    };
  }

  async analyzePipeline(userId: string, teamId?: string | null) {
    if (!teamId) {
      throw new ForbiddenException("Team is required to analyze pipeline");
    }

    const dashboard = await this.getDashboard(userId, teamId, "month");

    const aiContext = {
      summary: dashboard.summary,
      stats: dashboard.stats,
      riskQueue: dashboard.riskQueue,
      forecast: dashboard.forecast,
      columns: dashboard.columns.map((col) => ({
        id: col.id,
        title: col.title,
        count: col.count,
        amount: col.amount,
        deals: col.deals.map((deal) => ({
          id: deal.id,
          name: deal.name,
          value: deal.value,
          stage: deal.stage,
          score: deal.score,
          tag: deal.tag,
          risk: deal.risk,
          action: deal.action,
          time: deal.time,
        })),
      })),
    };

    const systemPrompt = `
You are CORTEXA AI, a CRM pipeline intelligence analyst for real estate teams.

Analyze the CRM pipeline and return ONLY valid JSON.

Return this exact shape:
{
  "headline": "Short executive summary",
  "health": "Healthy | Watch | Critical",
  "confidence": 0,
  "revenueAtRiskReason": "Short reason",
  "recommendedActions": [
    {
      "title": "Action title",
      "priority": "high | medium | low",
      "reason": "Why this matters"
    }
  ],
  "stageInsights": [
    {
      "stage": "new",
      "insight": "Short insight"
    }
  ]
}

Rules:
- confidence must be 0-100.
- recommendedActions should contain 3 to 5 actions.
- Be direct and practical.
- Use only the CRM data provided.
`;

    let result: any;

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `PIPELINE DATA:\n${JSON.stringify(aiContext)}`,
              },
            ],
          },
        ],
      });

      result = JSON.parse(response.output_text || "{}");
    } catch (err) {
      console.error("Analyze pipeline AI error:", err);

      result = {
        headline: "Pipeline analysis completed with fallback logic.",
        health: dashboard.riskQueue.length ? "Watch" : "Healthy",
        confidence: dashboard.summary.aiCloseScore || 0,
        revenueAtRiskReason: dashboard.riskQueue.length
          ? "Some deals have been stale for more than 7 days."
          : "No major risk detected.",
        recommendedActions: [
          {
            title: "Review stale deals",
            priority: dashboard.riskQueue.length ? "high" : "low",
            reason: "Stale deals can reduce close probability.",
          },
          {
            title: "Prioritize negotiation stage",
            priority: "medium",
            reason: "Negotiation deals are closest to revenue.",
          },
        ],
        stageInsights: dashboard.columns.map((col) => ({
          stage: col.id,
          insight: col.insight,
        })),
      };
    }

    await this.db.query(
      `
    INSERT INTO ai_activity (
      team_id,
      action,
      outcome,
      metadata,
      created_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    `,
      [
        teamId,
        "pipeline_analysis",
        "success",
        JSON.stringify({
          userId,
          ...result,
        }),
      ],
    );

    return {
      success: true,
      ...result,
    };
  }
}
