import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class TeamAnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  /* =====================================================
      MEMBER PERFORMANCE STATS
  ===================================================== */

  async getMemberStats(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        u.id,

        COUNT(DISTINCT l.id) as "totalLeads",

        COALESCE(
          SUM(
            CASE
              WHEN d.stage != 'won'
              THEN d.value
              ELSE 0
            END
          ),
          0
        ) as "pipelineValue",

        COUNT(
          DISTINCT CASE
            WHEN d.stage = 'won'
            THEN d.id
          END
        ) as "dealsWon"

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

      GROUP BY u.id
      `,
      [teamId],
    );

    return result.rows;
  }

  /* =====================================================
      TEAM OVERVIEW STATS
  ===================================================== */

  async getTeamOverview(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM team_members tm
          WHERE tm.team_id = $1
          AND tm.status = 'active'
        ) as "totalMembers",

        (
          SELECT COUNT(*)
          FROM leads
          WHERE team_id = $1
        ) as "totalLeads",

        (
          SELECT COUNT(*)
          FROM deals
          WHERE team_id = $1
          AND stage = 'won'
        ) as "dealsWon",

        (
          SELECT COALESCE(SUM(value), 0)
          FROM deals
          WHERE team_id = $1
          AND stage != 'won'
        ) as "pipelineValue",

        (
          SELECT COALESCE(SUM(value), 0)
          FROM deals
          WHERE team_id = $1
          AND stage = 'won'
        ) as "revenue"
      `,
      [teamId],
    );

    return result.rows[0];
  }

  /* =====================================================
      DEAL METRICS
  ===================================================== */

  async getDealMetrics(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        COUNT(*) as "totalDeals",

        COUNT(
          CASE
            WHEN stage = 'won'
            THEN 1
          END
        ) as "wonDeals",

        COUNT(
          CASE
            WHEN stage = 'lost'
            THEN 1
          END
        ) as "lostDeals",

        COALESCE(AVG(value), 0) as "averageDealValue"

      FROM deals

      WHERE team_id = $1
      `,
      [teamId],
    );

    return result.rows[0];
  }
}
