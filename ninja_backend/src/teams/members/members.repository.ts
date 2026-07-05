import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class MembersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMembers(teamId: string, options: any) {
    const { page, limit, search, filter, role, sort } = options;

    const offset = (page - 1) * limit;

    const where: string[] = [`tm.team_id = $1`];

    const values: any[] = [teamId];

    let index = 2;

    /* SEARCH */

    if (search) {
      where.push(`
        (
          LOWER(u.name)
          LIKE LOWER($${index})

          OR LOWER(u.email)
          LIKE LOWER($${index})
        )
      `);

      values.push(`%${search}%`);

      index++;
    }

    /* FILTER */

    if (filter === "pending") {
      where.push(`tm.status = 'pending'`);
    } else if (filter === "removed") {
      where.push(`tm.status = 'removed'`);
    } else {
      where.push(`tm.status = 'active'`);
    }
    if (filter === "manager") {
      where.push(`LOWER(tm.role) = 'manager'`);
    }

    if (filter === "agent") {
      where.push(`LOWER(tm.role) = 'agent'`);
    }
    if (filter === "viewer") {
      where.push(`LOWER(tm.role) = 'viewer'`);
    }
    if (filter === "high-performers") {
      where.push(`
        (
          SELECT
            LEAST(
              100,
              (
                COUNT(DISTINCT l2.id) * 3
              )
            )
          FROM leads l2
          WHERE l2.assigned_to = u.id
        ) >= 85
      `);
    }

    if (filter === "needs-attention") {
      where.push(`
        (
          SELECT
            LEAST(
              100,
              (
                COUNT(DISTINCT l2.id) * 3
              )
            )
          FROM leads l2
          WHERE l2.assigned_to = u.id
        ) < 70
      `);
    }
    /* ROLE */

    if (role) {
      where.push(`tm.role = $${index}`);

      values.push(role);

      index++;
    }

    /* SORT */

    const [sortField, sortDirection] = (sort || "createdAt:desc").split(":");

    const allowedSorts = {
      createdAt: "u.created_at",
      name: "u.name",

      totalLeads: `COUNT(DISTINCT l.id)`,

      aiScore: `
        LEAST(
          100,
          (
            COUNT(DISTINCT l.id) * 3
            +
            COUNT(
              DISTINCT CASE
                WHEN d.stage = 'won'
                THEN d.id
              END
            ) * 10
          )
        )
      `,
    };

    const orderBy = allowedSorts[sortField] || "u.created_at";

    const direction = sortDirection === "asc" ? "ASC" : "DESC";

    values.push(limit);
    values.push(offset);

    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        tm.id as "memberId",
        u.avatar_url as avatar,

        tm.role,

        u.is_active as "isActive",

        u.last_seen_at as "lastSeenAt",

        COALESCE(
          lead_stats.total_leads,
          0
        ) as "totalLeads",

        COALESCE(
          deal_stats.deals_won,
          0
        ) as "dealsWon",

        COALESCE(
          deal_stats.pipeline_value,
          0
        ) as "pipelineValue",

        LEAST(
          100,
          (
            COALESCE(
              lead_stats.total_leads,
              0
            ) * 3
            +
            COALESCE(
              deal_stats.deals_won,
              0
            ) * 10
          )
        )::int as "aiScore"

      FROM team_members tm

      INNER JOIN users u
        ON u.id = tm.user_id

      LEFT JOIN (
          SELECT
            assigned_to,
            COUNT(*) as total_leads
          FROM leads
          WHERE team_id = $1
          GROUP BY assigned_to
        ) lead_stats
          ON lead_stats.assigned_to = u.id

        LEFT JOIN (
          SELECT
            assigned_to,

            COUNT(
              CASE
                WHEN stage = 'won'
                THEN 1
              END
            ) as deals_won,

            COALESCE(
              SUM(
                CASE
                  WHEN stage != 'won'
                  THEN value
                  ELSE 0
                END
              ),
              0
            ) as pipeline_value

          FROM deals
          WHERE team_id = $1
          GROUP BY assigned_to
        ) deal_stats
          ON deal_stats.assigned_to = u.id

      WHERE ${where.join(" AND ")}

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.is_active,
        u.last_seen_at,
        tm.id,
        tm.role,
        lead_stats.total_leads,
        deal_stats.deals_won,
        deal_stats.pipeline_value

      ORDER BY ${orderBy} ${direction}

      LIMIT $${index}
      OFFSET $${index + 1}
      `,
      values,
    );

    const countResult = await this.db.query(
      `
      SELECT COUNT(DISTINCT u.id) as total

      FROM team_members tm

      INNER JOIN users u
        ON u.id = tm.user_id

      WHERE ${where.join(" AND ")}
      `,
      values.slice(0, index - 1),
    );
    const total = Number(countResult.rows[0].total);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: result.rows,

      pagination: {
        page,
        limit,

        total,

        totalPages,
        hasNextPage: page < totalPages,

        hasPrevPage: page > 1,
      },
    };
  }
}
