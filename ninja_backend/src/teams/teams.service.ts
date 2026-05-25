import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { Team, CreateTeamDto, UpdateTeamDto } from "./entities/team.entity";
import { UsersService } from "../users/users.service";
import { EventLoggerService } from "../analytics/events/event-logger.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class TeamsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
    private readonly eventLogger: EventLoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTeamDto: CreateTeamDto, ownerId: string): Promise<Team> {
    const seatLimit = createTeamDto.seatLimit || 1;

    const { rows } = await this.db.query(
      `INSERT INTO teams (name, owner_id, seat_limit, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      [createTeamDto.name, ownerId, seatLimit],
    );

    const team = rows[0];

    // Set creating owner as a member of the new team (owner is always in the team they create)
    await this.usersService.update(ownerId, { teamId: team.id } as any);

    return team;
  }

  async findById(id: string): Promise<Team | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  /** Ensure user can access team: must be owner or a member. Owner can manage only their own teams. */
  async ensureCanAccessTeam(teamId: string, userId: string): Promise<Team> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }
    const isOwner = team.ownerId === userId;
    const { rows: memberCheck } = await this.db.query(
      "SELECT id FROM users WHERE id = $1 AND team_id = $2",
      [userId, teamId],
    );
    const isMember = memberCheck.length > 0;
    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        "You can only access your own teams or teams you are a member of",
      );
    }
    return team;
  }

  /** Teams the user owns (owner_id = userId) OR the single team they are a member of (team_id). One owner can have multiple teams. */
  async findByUserId(userId: string): Promise<Team[]> {
    const { rows } = await this.db.query(
      `SELECT t.id, t.name, t.owner_id as "ownerId", t.seat_limit as "seatLimit", t.created_at as "createdAt", t.updated_at as "updatedAt"
       FROM teams t
       WHERE t.owner_id = $1
          OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)
       ORDER BY t.created_at DESC`,
      [userId],
    );
    return rows;
  }

  async update(
    id: string,
    updateTeamDto: UpdateTeamDto,
    userId: string,
  ): Promise<Team> {
    const team = await this.findById(id);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    // Only owner can update team
    if (team.ownerId !== userId) {
      throw new ForbiddenException("Only team owner can update the team");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateTeamDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateTeamDto.name);
    }

    if (updateTeamDto.seatLimit !== undefined) {
      if (updateTeamDto.seatLimit < 1) {
        throw new BadRequestException("Seat limit must be at least 1");
      }
      updates.push(`seat_limit = $${paramCount++}`);
      values.push(updateTeamDto.seatLimit);
    }

    if (updates.length === 0) {
      return team;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE teams SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING id, name, owner_id as "ownerId", seat_limit as "seatLimit", created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    const updatedTeam = rows[0];

    // Enforce seat limits if seat limit was changed
    if (updateTeamDto.seatLimit !== undefined) {
      await this.enforceSeatLimits(id);
    }

    return updatedTeam;
  }

  /** Used seats: users with team_id = teamId, plus the owner if their team_id is not this team (owner always counts in every team they own). */
  async getSeatCount(teamId: string): Promise<number> {
    const team = await this.findById(teamId);
    if (!team) return 0;
    const { rows } = await this.db.query(
      `SELECT COUNT(*) as count FROM users WHERE team_id = $1 AND is_active = true`,
      [teamId],
    );
    let count = parseInt(rows[0].count, 10);
    const owner = await this.usersService.findById(team.ownerId);
    if (owner && owner.teamId !== teamId) {
      count += 1; // owner has "owner membership" in this team
    }
    return count;
  }

  async getAvailableSeats(teamId: string): Promise<number> {
    const team = await this.findById(teamId);
    if (!team) {
      return 0;
    }
    const currentSeats = await this.getSeatCount(teamId);
    return Math.max(0, team.seatLimit - currentSeats);
  }

  async canAddMember(teamId: string): Promise<boolean> {
    const availableSeats = await this.getAvailableSeats(teamId);
    return availableSeats > 0;
  }

  async enforceSeatLimits(teamId: string): Promise<void> {
    const client = await this.db.getClient();

    try {
      await client.query("BEGIN");

      // Lock team row
      const { rows: teamRows } = await client.query(
        `SELECT seat_limit, token_version FROM teams WHERE id = $1 FOR UPDATE`,
        [teamId],
      );

      if (teamRows.length === 0) {
        await client.query("ROLLBACK");
        return;
      }

      const seatLimit = teamRows[0].seat_limit;
      const limit = seatLimit - 1; // -1 for owner

      // Get active members (excluding owner) ordered by creation date
      const { rows } = await client.query(
        `SELECT id FROM users
         WHERE team_id = $1 AND is_active = true AND role != 'owner'
         ORDER BY created_at ASC`,
        [teamId],
      );

      const activeMembers = rows;

      if (activeMembers.length > limit) {
        const toDeactivate = activeMembers.slice(limit);
        const ids = toDeactivate.map((m: any) => m.id);

        if (ids.length > 0) {
          // Deactivate excess members
          await client.query(
            `UPDATE users SET is_active = false, updated_at = NOW() 
             WHERE id = ANY($1::uuid[])`,
            [ids],
          );
          for (const member of toDeactivate) {
            await this.notificationsService.create({
              teamId,
              userId: member.id,

              type: "team.member_deactivated",
              category: "team",
              priority: "high",

              title: "Account deactivated",
              message: "Your team seat has been removed by the owner",

              url: `/teams`,

              icon: "user-x",

              metadata: {
                reason: "seat_limit_exceeded",
              },
            });
          }
          // Increment team token version to invalidate tokens for deactivated users
          await client.query(
            `UPDATE teams 
             SET token_version = token_version + 1, updated_at = NOW()
             WHERE id = $1`,
            [teamId],
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async addMember(
    teamId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<void> {
    const client = await this.db.getClient();

    try {
      await client.query("BEGIN");

      // Lock team row to prevent concurrent modifications (row-level locking)
      const { rows: teamRows } = await client.query(
        `SELECT id, owner_id, seat_limit, token_version
         FROM teams WHERE id = $1 FOR UPDATE`,
        [teamId],
      );

      if (teamRows.length === 0) {
        await client.query("ROLLBACK");
        throw new NotFoundException("Team not found");
      }

      const team = teamRows[0];

      // Only owner can add members
      if (team.owner_id !== requestingUserId) {
        await client.query("ROLLBACK");
        throw new ForbiddenException("Only team owner can add members");
      }

      // Get current active seat count (excluding owner)
      const { rows: seatCountRows } = await client.query(
        `SELECT COUNT(*) as count
         FROM users
         WHERE team_id = $1 AND is_active = true AND role != 'owner'`,
        [teamId],
      );

      const currentSeats = parseInt(seatCountRows[0].count, 10);
      const availableSeats = team.seat_limit - 1 - currentSeats; // -1 for owner
      if (availableSeats === 1) {
        await this.notificationsService.create({
          teamId,

          type: "team.seats_almost_full",
          category: "billing",
          priority: "high",

          title: "Team seats almost full",
          message: `Your team is reaching the seat limit`,

          url: `/teams/${teamId}/billing`,

          icon: "alert-triangle",

          metadata: {
            seatLimit: team.seat_limit,
            usedSeats: currentSeats + 1,
          },
        });
      }
      if (availableSeats <= 0) {
        await client.query("ROLLBACK");
        throw new BadRequestException("No available seats in this team");
      }

      // Atomically add user to team and activate
      await client.query(
        `UPDATE users 
          SET 
            team_id = $1,
            role = $2,
            is_active = true,
            updated_at = NOW()
          WHERE id = $3`,
        [teamId, role || "agent", userId],
      );

      //* Increment team token version to invalidate existing tokens
      /*await client.query(
        `UPDATE teams 
         SET token_version = token_version + 1, updated_at = NOW()
         WHERE id = $1`,
        [teamId],
      ); */

      await client.query("COMMIT");

      // Log event after successful commit
      await this.eventLogger.logTeamMemberAdded(
        teamId,
        requestingUserId,
        userId,
      );
      const addedUser = await this.usersService.findById(userId);

      await this.notificationsService.create({
        teamId,
        actorUserId: requestingUserId,

        type: "team.member_added",
        category: "team",
        priority: "medium",

        title: "New team member added",
        message: `${addedUser?.name || "A new user"} joined the team`,

        url: `/teams/${teamId}/members`,

        entityType: "user",
        entityId: userId,

        icon: "user-plus",

        metadata: {
          userId,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async removeMember(
    teamId: string,
    userId: string,
    requestingUserId: string,
  ): Promise<void> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    // Only owner can remove members (and can't remove themselves)
    if (team.ownerId !== requestingUserId) {
      throw new ForbiddenException("Only team owner can remove members");
    }

    if (userId === team.ownerId) {
      throw new BadRequestException("Cannot remove team owner");
    }

    const removedUser = await this.usersService.findById(userId);

    // Remove user from team
    await this.usersService.update(userId, { teamId: null } as any);

    // Log event
    await this.eventLogger.logTeamMemberRemoved(
      teamId,
      requestingUserId,
      userId,
    );
    await this.notificationsService.create({
      teamId,
      actorUserId: requestingUserId,

      type: "team.member_removed",
      category: "team",
      priority: "medium",

      title: "Team member removed",
      message: `${removedUser?.name || "A member"} was removed from the team`,

      url: `/teams/${teamId}/members`,

      entityType: "user",
      entityId: userId,

      icon: "user-minus",

      metadata: {
        userId,
      },
    });
  }

  async getMembers(teamId: string, limit = 20) {
    const result = await this.db.query(
      `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,

      u.avatar_url as avatar,

      u.job_title as "jobTitle",

      u.is_active as "isActive",

      u.last_seen_at as "lastSeenAt",

      u.created_at as "createdAt",

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
      ) as "dealsWon",

      FLOOR(RANDOM() * 30 + 70) as "aiScore"

    FROM users u

    LEFT JOIN leads l
      ON l.assigned_to = u.id
      AND l.team_id = $1

    LEFT JOIN deals d
      ON d.assigned_to = u.id
      AND d.team_id = $1

    WHERE u.team_id = $1

    GROUP BY u.id

    ORDER BY u.created_at DESC LIMIT $2
    `,
      [teamId, limit],
    );

    return result.rows;
  }

  /** Add a member to the team by email (owner only). */
  async addMemberByEmail(
    teamId: string,
    email: string,
    requestingUserId: string,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException("No user found with this email");
    }
    await this.addMember(teamId, user.id, requestingUserId);
  }

  /** Delete a team (owner only). Unlinks all members, then deletes the team. Owner can only delete their own teams. */
  async remove(teamId: string, userId: string): Promise<{ deleted: boolean }> {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }
    if (team.ownerId !== userId) {
      throw new ForbiddenException("You can only delete your own teams");
    }
    /*await this.db.query(
      `UPDATE users SET team_id = NULL, token_version = COALESCE(token_version, 0) + 1, updated_at = NOW() WHERE team_id = $1`,
      [teamId],
    );*/
    await this.db.query("DELETE FROM teams WHERE id = $1", [teamId]);
    return { deleted: true };
  }
  async getDashboard(teamId: string, userId: string) {
    const [
      teamResult,
      statsResult,
      membersResult,
      activitiesResult,
      subscriptionResult,
      insightsResult,
      leaderboardResult,
      notificationsResult,
      unreadCount,
    ] = await Promise.all([
      this.getTeam(teamId),
      this.getStats(teamId),
      this.getDashboardMembers(teamId),
      this.getActivities(teamId, 5),
      this.getSubscription(teamId),
      this.getInsights(teamId),
      this.getLeaderboard(teamId),
      this.notificationsService.getNotifications(teamId, userId),
      this.notificationsService.getUnreadCount(teamId, userId),
    ]);

    return {
      team: teamResult,
      stats: statsResult,
      members: membersResult,
      activities: activitiesResult,
      subscription: subscriptionResult,
      insights: insightsResult,
      leaderboard: leaderboardResult,
      notifications: notificationsResult,
      unreadNotifications: unreadCount,
    };
  }

  async getTeam(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        t.id,
        t.name,
        t.seat_limit,
        t.created_at,
        u.name as owner_name,
        u.email as owner_email
      FROM teams t
      LEFT JOIN users u ON u.id = t.owner_id
      WHERE t.id = $1
      `,
      [teamId],
    );

    return result.rows[0];
  }

  async getStats(teamId: string) {
    const result = await this.db.query(
      `
    WITH current_month AS (
      SELECT
        COUNT(DISTINCT u.id) as total_members,

        COUNT(DISTINCT CASE
          WHEN u.is_active = true THEN u.id
        END) as active_members,

        COUNT(DISTINCT l.id) as total_leads,

        COALESCE(SUM(
          CASE
            WHEN d.stage != 'won' THEN d.value
            ELSE 0
          END
        ), 0) as total_pipeline,

        COUNT(DISTINCT CASE
          WHEN d.stage = 'won' THEN d.id
        END) as deals_won,

        COALESCE(SUM(
          CASE
            WHEN d.stage = 'won' THEN d.value
            ELSE 0
          END
        ), 0) as revenue

      FROM teams t

      LEFT JOIN users u
        ON u.team_id = t.id

      LEFT JOIN leads l
        ON l.team_id = t.id

      LEFT JOIN deals d
        ON d.team_id = t.id

      WHERE t.id = $1
    ),

    previous_month AS (
      SELECT
        COUNT(*) as previous_members
      FROM users
      WHERE team_id = $1
      AND created_at < NOW() - INTERVAL '30 days'
    )

    SELECT
      cm.total_members as "totalMembers",

      cm.active_members as "activeMembers",

      cm.total_leads as "totalLeads",

      cm.total_pipeline as "totalPipeline",

      cm.deals_won as "dealsWon",

      cm.revenue as "revenue",

      82 as "avgAIScore",

      24 as "conversionRate",

      CASE
        WHEN pm.previous_members = 0 THEN '+0%'
        ELSE
          CONCAT(
            ROUND(
              (
                (cm.total_members - pm.previous_members)::numeric
                / pm.previous_members
              ) * 100
            ),
            '%'
          )
      END as "membersGrowth",

      '+12%' as "activeGrowth",

      '+18%' as "pipelineGrowth",

      '+9%' as "leadsGrowth",

      '+6%' as "aiGrowth",

      '+4%' as "conversionGrowth"

    FROM current_month cm
    CROSS JOIN previous_month pm
    `,
      [teamId],
    );

    return result.rows[0];
  }
  async getDashboardMembers(teamId: string) {
    return this.getMembers(teamId, 5);
  }
  async getDashboardMembersOld(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        avatar_url,
        job_title,
        is_active,
        last_seen_at,
        created_at
      FROM users
      WHERE team_id = $1
      ORDER BY created_at DESC
      `,
      [teamId],
    );

    return result.rows;
  }

  async getActivities(teamId: string, limit = 20) {
    const result = await this.db.query(
      `
    SELECT
      e.id,

      e.event_type as "eventType",

      e.entity_type as "entityType",

      e.metadata,

      e.created_at as "createdAt",

      u.name as "userName",

      u.avatar_url as avatar

    FROM events e

    LEFT JOIN users u
      ON u.id = e.user_id

    WHERE e.team_id = $1

    ORDER BY e.created_at DESC

    LIMIT $2
    `,
      [teamId, limit],
    );

    return result.rows.map((item: any) => {
      let message = "";

      switch (item.eventType) {
        case "team.member_added":
          message = `${item.userName} invited a new team member`;
          break;

        case "team.member_removed":
          message = `${item.userName} removed a team member`;
          break;

        default:
          message = `${item.userName} ${String(item.eventType || "")
            .replaceAll("_", " ")
            .toLowerCase()}`;
      }

      return {
        id: item.id,
        avatar: item.avatar,
        message,
        time: this.formatTimeAgo(item.createdAt),
      };
    });
  }

  private formatTimeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);

      if (count > 0) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  }

  async getSubscription(teamId: string) {
    const result = await this.db.query(
      `
      SELECT
        s.status,
        s.seat_limit,
        s.current_period_end,
        sp.name as plan_name,
        sp.price
      FROM subscriptions s
      LEFT JOIN subscription_plans sp
        ON sp.id = s.plan_id
      WHERE s.team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    return result.rows[0];
  }

  async getInsights(teamId: string) {
    const insights: any[] = [];

    /* MEMBERS */
    const membersResult = await this.db.query(
      `
    SELECT COUNT(*) as total
    FROM users
    WHERE team_id = $1
    `,
      [teamId],
    );

    const totalMembers = Number(membersResult.rows[0]?.total || 0);

    /* LEADS */
    const leadsResult = await this.db.query(
      `
    SELECT COUNT(*) as total
    FROM leads
    WHERE team_id = $1
    `,
      [teamId],
    );

    const totalLeads = Number(leadsResult.rows[0]?.total || 0);

    /* OPEN DEALS */
    const pipelineResult = await this.db.query(
      `
    SELECT COALESCE(SUM(value),0) as total
    FROM deals
    WHERE team_id = $1
    AND stage != 'won'
    `,
      [teamId],
    );

    const pipeline = Number(pipelineResult.rows[0]?.total || 0);

    /* ===== INSIGHTS ===== */

    if (totalMembers <= 2) {
      insights.push({
        id: "team-small",
        type: "warning",
        title: "Small team detected",
        description: "Consider inviting more members to improve collaboration.",
      });
    }

    if (totalLeads === 0) {
      insights.push({
        id: "no-leads",
        type: "danger",
        title: "No active leads",
        description: "Your team currently has no active leads in the pipeline.",
      });
    }

    if (pipeline > 10000) {
      insights.push({
        id: "pipeline-healthy",
        type: "success",
        title: "Healthy pipeline growth",
        description: "Your team pipeline is performing well this month.",
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "all-good",
        type: "info",
        title: "Team performance stable",
        description: "Everything looks healthy across your workspace.",
      });
    }

    return insights.slice(0, 5);
  }

  async getLeaderboard(teamId: string) {
    const result = await this.db.query(
      `
    SELECT
      u.id,
      u.name,

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

      FLOOR(RANDOM() * 20 + 80) as "aiScore"

    FROM users u

    LEFT JOIN leads l
      ON l.assigned_to = u.id

    LEFT JOIN deals d
      ON d.assigned_to = u.id

    WHERE u.team_id = $1

    GROUP BY u.id

    ORDER BY "pipelineValue" DESC LIMIT 4
    `,
      [teamId],
    );

    const rows = result.rows;

    if (!rows.length) {
      return [];
    }

    const topPipeline = [...rows].sort(
      (a, b) => Number(b.pipelineValue) - Number(a.pipelineValue),
    )[0];

    const topLeads = [...rows].sort(
      (a, b) => Number(b.totalLeads) - Number(a.totalLeads),
    )[0];

    const topAi = [...rows].sort(
      (a, b) => Number(b.aiScore) - Number(a.aiScore),
    )[0];

    return [
      {
        id: "highest-pipeline",
        label: "Highest Pipeline",
        name: topPipeline?.name || "-",
        value: `$${Number(topPipeline?.pipelineValue || 0).toLocaleString()}`,
      },

      {
        id: "most-leads",
        label: "Most Leads Closed",
        name: topLeads?.name || "-",
        value: `${topLeads?.totalLeads || 0} leads`,
      },

      {
        id: "highest-ai",
        label: "Highest AI Score",
        name: topAi?.name || "-",
        value: `${topAi?.aiScore || 0}%`,
      },
    ];
  }
  async getMembersPaginated({
    teamId,
    page = 1,
    limit = 10,
    search = "",
    filter = "all",
  }: {
    teamId: string;
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  }) {
    const offset = (page - 1) * limit;

    const conditions: string[] = [`u.team_id = $1`];

    const values: any[] = [teamId];

    let paramIndex = 2;

    if (search) {
      conditions.push(`
      (
        u.name ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
      )
    `);

      values.push(`%${search}%`);
      paramIndex++;
    }

    if (filter === "active") {
      conditions.push(`u.is_active = true`);
    }

    if (filter === "inactive") {
      conditions.push(`u.is_active = false`);
    }

    const whereClause = conditions.join(" AND ");

    const totalResult = await this.db.query(
      `
    SELECT COUNT(*) as total
    FROM users u
    WHERE ${whereClause}
    `,
      values,
    );

    const total = Number(totalResult.rows[0]?.total || 0);

    values.push(limit);
    values.push(offset);

    const membersResult = await this.db.query(
      `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role,

      u.avatar_url as avatar,

      u.job_title as "jobTitle",

      u.is_active as "isActive",

      u.last_seen_at as "lastSeenAt",

      u.created_at as "createdAt",

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
      ) as "dealsWon",

      FLOOR(RANDOM() * 30 + 70) as "aiScore"

    FROM users u

    LEFT JOIN leads l
      ON l.assigned_to = u.id
      AND l.team_id = $1

    LEFT JOIN deals d
      ON d.assigned_to = u.id
      AND d.team_id = $1

    WHERE ${whereClause}

    GROUP BY u.id

    ORDER BY u.created_at DESC

    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
    `,
      values,
    );

    return {
      data: membersResult.rows,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
