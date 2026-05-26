import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class MembersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findMembers(teamId: string, options: any) {
    const { page, limit, search, filter, role, sort } = options;

    const offset = (page - 1) * limit;

    const where: string[] = [`tm.team_id = $1`, `tm.status = 'active'`];

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

    if (filter === "active") {
      where.push(`u.is_active = true`);
    }

    if (filter === "pending") {
      where.push(`u.is_active = false`);
    }
    if (filter === "managers") {
      where.push(`LOWER(tm.role) = 'manager'`);
    }

    if (filter === "agents") {
      where.push(`LOWER(tm.role) = 'agent'`);
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

        COUNT(DISTINCT l.id)
          as "totalLeads",

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
        ) as "pipelineValue",

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
        )::int as "aiScore"

      FROM team_members tm

      INNER JOIN users u
        ON u.id = tm.user_id

      LEFT JOIN leads l
        ON l.assigned_to = u.id

      LEFT JOIN deals d
        ON d.assigned_to = u.id

      WHERE ${where.join(" AND ")}

      GROUP BY
        u.id,
        tm.id,
        u.name,
        u.email,
        u.avatar_url,
        tm.role,
        u.is_active,
        u.last_seen_at

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
