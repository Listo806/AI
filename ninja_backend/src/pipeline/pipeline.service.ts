import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";
import { MoveDealDto } from "./dto/move-deal.dto";

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
    const scope = this.getScope(userId, teamId);

    const { rows } = await this.db.query(
      `
    WITH current_deals AS (
      SELECT *
      FROM deals d
      WHERE ${scope.where}
    ),
    this_month AS (
      SELECT *
      FROM current_deals
      WHERE created_at >= date_trunc('month', NOW())
    ),
    last_month AS (
      SELECT *
      FROM current_deals
      WHERE created_at >= date_trunc('month', NOW() - interval '1 month')
        AND created_at < date_trunc('month', NOW())
    )
    SELECT
      COUNT(*)::int AS "totalDeals",

      COUNT(*) FILTER (
        WHERE created_at >= date_trunc('month', NOW())
      )::int AS "newDealsThisMonth",

      COALESCE(SUM(value), 0)::numeric AS "pipelineValue",

      COALESCE(SUM(value) FILTER (
        WHERE stage = 'won'
          AND updated_at >= date_trunc('month', NOW())
      ), 0)::numeric AS "wonThisMonth",

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
          AND updated_at < NOW() - interval '7 days'
      ), 0)::numeric AS "revenueAtRisk",

      COALESCE(SUM(value) FILTER (
        WHERE stage NOT IN ('won', 'lost')
      ), 0)::numeric AS "openValue",

      COALESCE(SUM(value) FILTER (
        WHERE stage = 'won'
      ), 0)::numeric AS "wonValue",

      COALESCE(AVG(value), 0)::numeric AS "averageDeal",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM this_month
      ) AS "thisMonthValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM last_month
      ) AS "lastMonthValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM this_month
        WHERE stage = 'won'
      ) AS "thisMonthWonValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM last_month
        WHERE stage = 'won'
      ) AS "lastMonthWonValue"

    FROM current_deals
    `,
      scope.params,
    );

    const data = rows[0] || {};

    const totalDeals = Number(data.totalDeals || 0);
    const wonDeals = Number(data.wonDeals || 0);

    const pipelineValue = Number(data.pipelineValue || 0);
    const thisMonthValue = Number(data.thisMonthValue || 0);
    const lastMonthValue = Number(data.lastMonthValue || 0);

    const thisMonthWonValue = Number(data.thisMonthWonValue || 0);
    const lastMonthWonValue = Number(data.lastMonthWonValue || 0);

    const revenueAtRisk = Number(data.revenueAtRisk || 0);
    const openValue = Number(data.openValue || 0);

    const calcGrowth = (current: number, previous: number) => {
      if (!previous && current > 0) return 100;
      if (!previous) return 0;

      return Math.round(((current - previous) / previous) * 100);
    };

    const conversionRate = totalDeals
      ? Math.round((wonDeals / totalDeals) * 100)
      : 0;

    const aiCloseScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          conversionRate +
            Number(data.activeNegotiations || 0) * 2 -
            Number(data.stuckDeals || 0) * 3,
        ),
      ),
    );

    const riskGrowth = openValue
      ? Math.round((revenueAtRisk / openValue) * 100)
      : 0;

    return {
      totalDeals,
      newDealsThisMonth: Number(data.newDealsThisMonth || 0),

      pipelineValue,
      pipelineGrowth: calcGrowth(thisMonthValue, lastMonthValue),

      wonThisMonth: Number(data.wonThisMonth || 0),
      wonGrowth: calcGrowth(thisMonthWonValue, lastMonthWonValue),

      activeNegotiations: Number(data.activeNegotiations || 0),
      stuckDeals: Number(data.stuckDeals || 0),

      aiCloseScore,
      aiGrowth: conversionRate,

      revenueAtRisk,
      riskGrowth,

      wonDeals,
      lostDeals: Number(data.lostDeals || 0),
      openDeals: Number(data.openDeals || 0),
      openValue,
      wonValue: Number(data.wonValue || 0),
      averageDeal: Number(data.averageDeal || 0),
      conversionRate,
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

  private formatMoney(value: any) {
    const amount = Number(value || 0);

    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;

    return `$${amount.toLocaleString()}`;
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
    const map = {
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
    const map = {
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

  async getDashboard(userId: string, teamId?: string | null) {
    const scope = this.getScope(userId, teamId);

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
      l.priority AS "leadPriority"

    FROM deals d
    LEFT JOIN leads l ON l.id = d.lead_id
    WHERE ${scope.where}
    ORDER BY d.position ASC, d.created_at DESC
    `,
      scope.params,
    );

    const { rows: summaryRows } = await this.db.query(
      `
    WITH current_deals AS (
      SELECT *
      FROM deals d
      WHERE ${scope.where}
    ),
    this_month AS (
      SELECT *
      FROM current_deals
      WHERE created_at >= date_trunc('month', NOW())
    ),
    last_month AS (
      SELECT *
      FROM current_deals
      WHERE created_at >= date_trunc('month', NOW() - interval '1 month')
        AND created_at < date_trunc('month', NOW())
    )
    SELECT
      COUNT(*)::int AS "totalDeals",

      COUNT(*) FILTER (
        WHERE created_at >= date_trunc('month', NOW())
      )::int AS "newDealsThisMonth",

      COALESCE(SUM(value), 0)::numeric AS "pipelineValue",

      COALESCE(SUM(value) FILTER (
        WHERE stage = 'won'
          AND updated_at >= date_trunc('month', NOW())
      ), 0)::numeric AS "wonThisMonth",

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

      COALESCE(SUM(value) FILTER (
        WHERE stage NOT IN ('won', 'lost')
          AND updated_at < NOW() - interval '7 days'
      ), 0)::numeric AS "revenueAtRisk",

      COALESCE(SUM(value) FILTER (
        WHERE stage NOT IN ('won', 'lost')
      ), 0)::numeric AS "openValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM this_month
      ) AS "thisMonthValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM last_month
      ) AS "lastMonthValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM this_month
        WHERE stage = 'won'
      ) AS "thisMonthWonValue",

      (
        SELECT COALESCE(SUM(value), 0)::numeric
        FROM last_month
        WHERE stage = 'won'
      ) AS "lastMonthWonValue"
    FROM current_deals
    `,
      scope.params,
    );

    const summary = summaryRows[0] || {};

    const totalDeals = Number(summary.totalDeals || 0);
    const wonDeals = Number(summary.wonDeals || 0);
    const activeNegotiations = Number(summary.activeNegotiations || 0);
    const stuckDeals = Number(summary.stuckDeals || 0);

    const conversionRate = totalDeals
      ? Math.round((wonDeals / totalDeals) * 100)
      : 0;

    const aiCloseScore = Math.min(
      100,
      Math.max(0, conversionRate + activeNegotiations * 2 - stuckDeals * 3),
    );

    const pipelineGrowth = this.calcGrowth(
      Number(summary.thisMonthValue || 0),
      Number(summary.lastMonthValue || 0),
    );

    const wonGrowth = this.calcGrowth(
      Number(summary.thisMonthWonValue || 0),
      Number(summary.lastMonthWonValue || 0),
    );

    const riskGrowth = Number(summary.openValue || 0)
      ? Math.round(
          (Number(summary.revenueAtRisk || 0) /
            Number(summary.openValue || 0)) *
            100,
        )
      : 0;

    const stats = [
      {
        title: "Total Deals",
        value: totalDeals,
        change: `↑ ${Number(summary.newDealsThisMonth || 0)} this month`,
        iconKey: "users",
        className: "blue",
        changeClass: "text-green",
      },
      {
        title: "Pipeline Value",
        value: this.formatMoney(summary.pipelineValue),
        change: `↑ ${pipelineGrowth}% vs last month`,
        iconKey: "dollar",
        className: "green",
        changeClass: "text-green",
      },
      {
        title: "Won This Month",
        value: this.formatMoney(summary.wonThisMonth),
        change: `↑ ${wonGrowth}% vs last month`,
        iconKey: "check",
        className: "purple",
        changeClass: "text-green",
      },
      {
        title: "Active Negotiations",
        value: activeNegotiations,
        change: `${stuckDeals} stuck deals`,
        iconKey: "flame",
        className: "orange",
        changeClass: "text-orange",
      },
      {
        title: "AI Close Score",
        value: `${aiCloseScore}%`,
        change: `↑ ${conversionRate}% vs last month`,
        iconKey: "bot",
        className: "cyan",
        changeClass: "text-green",
      },
      {
        title: "Revenue At Risk",
        value: this.formatMoney(summary.revenueAtRisk),
        change: `↑ ${riskGrowth}% vs last month`,
        iconKey: "alert",
        className: "pink",
        changeClass: "text-red",
      },
    ];

    const stageOrder = [
      "new",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ];

    const columns = stageOrder.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      const totalValue = stageDeals.reduce(
        (sum, deal) => sum + Number(deal.value || 0),
        0,
      );

      return {
        id: stage,
        title: this.getStageTitle(stage),
        count: stageDeals.length,
        amount: this.formatMoney(totalValue),
        insight:
          stageDeals.length > 0
            ? `${stageDeals.length} active deal${stageDeals.length > 1 ? "s" : ""}`
            : "No active deals",
        deals: stageDeals.map((deal) => {
          const displayName = deal.leadName || deal.name || "Unnamed Deal";
          const score = this.getDealScore(deal);
          const tag = this.getDealTag(score, deal.stage);

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
            time: "Recently updated",
            avatarClass: "avatar-blue",
            avatarInitials: this.getInitials(displayName),
            stage: deal.stage,
            leadId: deal.leadId,
            value: Number(deal.value || 0),
          };
        }),
      };
    });

    return {
      stats,
      columns,
      summary: {
        totalDeals,
        conversionRate,
        aiCloseScore,
        pipelineGrowth,
        wonGrowth,
        riskGrowth,
      },
    };
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
      events: rows,
    };
  }
}
