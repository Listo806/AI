import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { DatabaseService } from "../database/database.service";
import { Team, CreateTeamDto, UpdateTeamDto } from "./entities/team.entity";
import { UsersService } from "../users/users.service";
import { EventLoggerService } from "../analytics/events/event-logger.service";
import { NotificationsService } from "../notifications/notifications.service";
import { TeamAIInsightsService } from "./insights/ai-insights.service";
import { TeamAnalyticsService } from "./analytics/team-analytics.service";
import { ConfigService } from "../config/config.service";
import { getPlan, resolveEffectivePlan } from "../plans/plan-config";
import { randomBytes } from "crypto";
@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  /**
   * Seat-limit error message. The 🔒 prefix follows the existing subscription
   * gate convention so the frontend apiClient preserves it (instead of replacing
   * 403 bodies with a generic "no permission" message).
   */
  private static readonly SEAT_LIMIT_MESSAGE =
    "🔒 Seat limit reached for your plan. Upgrade to add more users.";

  constructor(
    private readonly db: DatabaseService,
    private readonly usersService: UsersService,
    private readonly eventLogger: EventLoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly aiInsightsService: TeamAIInsightsService,
    private readonly analyticsService: TeamAnalyticsService,
    private readonly configService: ConfigService,
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
    await this.db.query(
      `
      INSERT INTO team_members (
        team_id,
        user_id,
        role,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'owner', 'active', NOW(), NOW())
      `,
      [team.id, ownerId],
    );

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
      `
      SELECT id
      FROM team_members
      WHERE user_id = $1
      AND team_id = $2
      AND status = 'active'
      LIMIT 1
      `,
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
  async findByUserId(userId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `
      SELECT
        t.id,
        t.name,

        t.owner_id as "ownerId",
        owner.name as "ownerName",
        owner.email as "ownerEmail",

        t.seat_limit as "seatLimit",

        t.created_at as "createdAt",
        t.updated_at as "updatedAt",

        CASE
          WHEN t.owner_id = $1
          THEN true
          ELSE false
        END as "isOwner",

        COUNT(
          DISTINCT CASE
            WHEN tm.status = 'active'
            THEN tm.user_id
          END
        )::int as "memberCount",

        COUNT(
          DISTINCT CASE
            WHEN ti.status = 'pending'
            THEN ti.id
          END
        )::int as "pendingInviteCount"

      FROM teams t

      LEFT JOIN users owner
        ON owner.id = t.owner_id

      LEFT JOIN team_members tm
        ON tm.team_id = t.id

      LEFT JOIN team_invitations ti
        ON ti.team_id = t.id

      WHERE
        t.owner_id = $1

        OR EXISTS (
          SELECT 1
          FROM team_members access_tm
          WHERE access_tm.team_id = t.id
            AND access_tm.user_id = $1
            AND access_tm.status = 'active'
        )

      GROUP BY
        t.id,
        t.name,
        t.owner_id,
        owner.name,
        owner.email,
        t.seat_limit,
        t.created_at,
        t.updated_at

      ORDER BY t.created_at DESC
      `,
      [userId],
    );

    return rows.map((team: any) => ({
      ...team,
      memberCount: Number(team.memberCount || 0),
      pendingInviteCount: Number(team.pendingInviteCount || 0),
      availableSeats: Math.max(
        0,
        Number(team.seatLimit || 0) - Number(team.memberCount || 0),
      ),
    }));
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
    const { rows } = await this.db.query(
      `
      SELECT COUNT(*) as count
      FROM team_members tm
      INNER JOIN users u
        ON u.id = tm.user_id
      WHERE tm.team_id = $1
      AND tm.status = 'active'
      `,
      [teamId],
    );

    return Number(rows[0].count || 0);
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
      const limit = seatLimit;

      // Get active members (excluding owner) ordered by creation date
      const { rows } = await client.query(
        `
        SELECT
          tm.user_id as id
        FROM team_members tm
        INNER JOIN users u
          ON u.id = tm.user_id
        WHERE tm.team_id = $1
        AND tm.status = 'active'
        AND tm.role != 'owner'
        ORDER BY tm.created_at ASC
        `,
        [teamId],
      );

      const activeMembers = rows;

      if (activeMembers.length > limit) {
        const toDeactivate = activeMembers.slice(limit);
        const ids = toDeactivate.map((m: any) => m.id);

        if (ids.length > 0) {
          // Deactivate excess members
          await client.query(
            `UPDATE team_members
            SET status = 'removed',
                updated_at = NOW()
            WHERE team_id = $1
            AND user_id = ANY($2::uuid[])`,
            [teamId, ids],
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
    role = "agent",
  ): Promise<void> {
    // Seat enforcement (Feature B) based on the team's plan cap, counting active
    // members plus pending invitations. Checked before we take the row lock.
    const [planSeatLimit, planSeatUsage] = await Promise.all([
      this.getTeamSeatLimit(teamId),
      this.getTeamSeatUsage(teamId),
    ]);
    if (planSeatUsage >= planSeatLimit) {
      throw new ForbiddenException(TeamsService.SEAT_LIMIT_MESSAGE);
    }

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
        //await client.query("ROLLBACK");
        throw new NotFoundException("Team not found");
      }

      const team = teamRows[0];

      // Only owner can add members
      if (team.owner_id !== requestingUserId) {
        //await client.query("ROLLBACK");
        throw new ForbiddenException("Only team owner can add members");
      }

      // Get current active seat count (excluding owner)
      const { rows: seatCountRows } = await client.query(
        `
        SELECT COUNT(*) as count
        FROM team_members tm
        INNER JOIN users u
          ON u.id = tm.user_id
        WHERE tm.team_id = $1
        AND tm.status = 'active'
        AND u.is_active = true
        `,
        [teamId],
      );

      const currentSeats = parseInt(seatCountRows[0].count, 10);
      // Enforce against the plan cap (Feature B), not the legacy teams.seat_limit.
      const availableSeats = planSeatLimit - currentSeats;
      if (availableSeats === 1) {
        try {
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
              seatLimit: planSeatLimit,
              usedSeats: currentSeats,
            },
          });
        } catch (error) {
          console.error(
            "Failed to create notification after member added",
            error,
          );
        }
      }
      if (availableSeats <= 0) {
        //await client.query("ROLLBACK");
        throw new ForbiddenException(TeamsService.SEAT_LIMIT_MESSAGE);
      }

      // Atomically add user to team and activate
      await client.query(
        `
        INSERT INTO team_members (
          team_id,
          user_id,
          role,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'active', NOW(), NOW())
        ON CONFLICT (team_id, user_id)
        DO UPDATE SET
          role = EXCLUDED.role,
          status = 'active',
          updated_at = NOW()
        `,
        [teamId, userId, role || "agent"],
      );

      await client.query("COMMIT");

      // Log event after successful commit
      await this.eventLogger.logTeamMemberAdded(
        teamId,
        requestingUserId,
        userId,
      );
      const addedUser = await this.usersService.findById(userId);
      try {
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
        console.error(
          "Failed to create notification after member added",
          error,
        );
      }
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR", rollbackError);
      }

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

    const result = await this.db.query(
      `
      UPDATE team_members
      SET
        status = 'removed',
        updated_at = NOW()
      WHERE team_id = $1
      AND user_id = $2
      `,
      [teamId, userId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException("Member not found in this team");
    }
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

        tm.role,

        u.avatar_url as avatar,

        u.job_title as "jobTitle",

        u.is_active as "isActive",

        u.last_seen_at as "lastSeenAt",

        u.created_at as "createdAt",
        t.id as "teamId",
        t.name as "teamName",

        tm.created_at as "joinedAt",

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
      
      INNER JOIN teams t
        ON t.id = tm.team_id

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
        u.phone,
        u.avatar_url,
        u.job_title,
        u.last_seen_at,
        u.created_at,
        tm.role,
        t.id,
        t.name,
        tm.created_at

      ORDER BY u.created_at DESC

      LIMIT $2
      `,
      [teamId, limit],
    );

    return result.rows.map((member: any) => {
      const totalLeads = Number(member.totalLeads || 0);

      const dealsWon = Number(member.dealsWon || 0);

      const pipelineValue = Number(member.pipelineValue || 0);

      const aiScore = Math.min(
        100,
        Math.round(
          dealsWon * 12 + totalLeads * 2 + Math.min(pipelineValue / 2000, 30),
        ),
      );

      return {
        ...member,
        aiScore,
      };
    });
  }

  /** Add a member to the team by email (owner only). */
  async addMemberByEmail(
    teamId: string,
    email: string,
    requestingUserId: string,
    role = "agent",
  ) {
    return this.inviteMemberByEmail(teamId, email, requestingUserId, role);
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
    await this.db.query(`DELETE FROM team_members WHERE team_id = $1`, [
      teamId,
    ]);

    await this.db.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
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
      this.getActivities(teamId, 4),
      this.getSubscription(teamId),
      this.aiInsightsService.generate(teamId),
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
        (
          SELECT COUNT(DISTINCT tm.user_id)
          FROM team_members tm
          INNER JOIN users u
            ON u.id = tm.user_id
          WHERE tm.team_id = $1
          AND tm.status = 'active'
        ) as total_members,

        (
          SELECT COUNT(DISTINCT tm.user_id)
          FROM team_members tm
          INNER JOIN users u
            ON u.id = tm.user_id
          WHERE tm.team_id = $1
          AND tm.status = 'active'
        ) as active_members,

        (
          SELECT COUNT(*)
          FROM leads
          WHERE team_id = $1
        ) as total_leads,

        (
          SELECT COALESCE(SUM(value), 0)
          FROM deals
          WHERE team_id = $1
          AND stage != 'won'
        ) as total_pipeline,

        (
          SELECT COUNT(*)
          FROM deals
          WHERE team_id = $1
          AND stage = 'won'
        ) as deals_won,

        (
          SELECT COALESCE(SUM(value), 0)
          FROM deals
          WHERE team_id = $1
          AND stage = 'won'
        ) as revenue
    ),

    previous_month AS (
      SELECT
        COUNT(*) as previous_members
      FROM team_members tm
      WHERE tm.team_id = $1
      AND tm.status = 'active'
      AND tm.created_at < NOW() - INTERVAL '30 days'
    ),

    -- Per active member: real lead/deal aggregates, mirroring getMembers().
    member_scores AS (
      SELECT
        tm.user_id,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(
          DISTINCT CASE WHEN d.stage = 'won' THEN d.id END
        ) as deals_won,
        COALESCE(
          SUM(CASE WHEN d.stage <> 'won' THEN d.value ELSE 0 END),
          0
        ) as pipeline_value
      FROM team_members tm
      INNER JOIN users u
        ON u.id = tm.user_id
      LEFT JOIN leads l
        ON l.assigned_to = tm.user_id
        AND l.team_id = $1
      LEFT JOIN deals d
        ON d.assigned_to = tm.user_id
        AND d.team_id = $1
      WHERE tm.team_id = $1
      AND tm.status = 'active'
      GROUP BY tm.user_id
    ),

    -- Same derived aiScore formula used in getMembers(), computed in SQL.
    member_ai AS (
      SELECT
        LEAST(
          100,
          ROUND(
            deals_won * 12
            + total_leads * 2
            + LEAST(pipeline_value / 2000.0, 30)
          )
        ) as ai_score
      FROM member_scores
    )

    SELECT
      cm.total_members as "totalMembers",

      cm.active_members as "activeMembers",

      cm.total_leads as "totalLeads",

      cm.total_pipeline as "totalPipeline",

      cm.deals_won as "dealsWon",

      cm.revenue as "revenue",

      -- Real average of the per-member derived aiScore; NULL when no members.
      (SELECT ROUND(AVG(ai_score))::int FROM member_ai) as "avgAIScore",

      -- Real conversion rate: closed-won leads / total leads; NULL when no leads.
      (
        SELECT CASE
          WHEN COUNT(*) > 0
          THEN ROUND(
            (COUNT(*) FILTER (WHERE status = 'closed-won')::numeric
             / COUNT(*)::numeric) * 100
          )::int
          ELSE NULL
        END
        FROM leads
        WHERE team_id = $1
      ) as "conversionRate",

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

      -- No prior-period snapshot exists in this system, so these period-over-period
      -- deltas cannot be honestly computed. Return NULL (rendered as no delta).
      NULL as "activeGrowth",

      NULL as "pipelineGrowth",

      NULL as "leadsGrowth",

      NULL as "aiGrowth",

      NULL as "conversionGrowth"

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

        case "user.logged_in":
          message = `${item.userName} logged in`;
          break;

        case "property.created":
          message = `${item.userName} created a new property`;
          break;

        case "lead.updated":
          message = `${item.userName} updated a lead`;
          break;

        case "lead.status_changed":
          message = `${item.userName} changed the lead status`;
          break;

        default:
          message = `${item.userName} ${String(item.eventType || "")
            .replaceAll("_", " ")
            .replaceAll(".", " ")
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

  private async getActivityStats(teamId: string) {
    const result = await this.db.query(
      `
    SELECT

      COUNT(*)::int as "totalActivities",

      COUNT(*) FILTER (
        WHERE event_type ILIKE '%message%'
           OR event_type ILIKE '%email%'
           OR event_type ILIKE '%sms%'
           OR event_type ILIKE '%whatsapp%'
      )::int as messages,

      COUNT(*) FILTER (
        WHERE event_type ILIKE '%call%'
      )::int as calls,

      COUNT(*) FILTER (
        WHERE event_type ILIKE '%ai%'
      )::int as "aiActions"

    FROM events

    WHERE team_id = $1
    `,
      [teamId],
    );

    return (
      result.rows[0] || {
        totalActivities: 0,
        messages: 0,
        calls: 0,
        aiActions: 0,
      }
    );
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

  async getLeaderboard(teamId: string) {
    const rows = await this.analyticsService.getMemberStats(teamId);

    const normalizedRows = rows.map((member: any) => {
      const totalLeads = Number(member.totalLeads || 0);

      const dealsWon = Number(member.dealsWon || 0);

      const pipelineValue = Number(member.pipelineValue || 0);

      const aiScore = Math.min(
        100,
        Math.round(
          dealsWon * 12 + totalLeads * 2 + Math.min(pipelineValue / 2000, 30),
        ),
      );

      return {
        ...member,
        aiScore,
      };
    });

    if (!normalizedRows.length) {
      return [];
    }

    const topPipeline = [...normalizedRows].sort(
      (a, b) => Number(b.pipelineValue) - Number(a.pipelineValue),
    )[0];

    const topLeads = [...normalizedRows].sort(
      (a, b) => Number(b.totalLeads) - Number(a.totalLeads),
    )[0];

    const topAi = [...normalizedRows].sort(
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
    limit = 5,
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

    const conditions: string[] = [`tm.team_id = $1`, `tm.status = 'active'`];

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

    if (filter === "pending") {
      conditions.push(`tm.status = 'pending'`);
    }
    if (filter === "manager") {
      conditions.push(`LOWER(tm.role) = 'manager'`);
    }

    if (filter === "agent") {
      conditions.push(`LOWER(tm.role) = 'agent'`);
    }
    if (filter === "viewer") {
      conditions.push(`LOWER(tm.role) = 'viewer'`);
    }
    if (filter === "high-performers") {
      conditions.push(`
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
      conditions.push(`
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

    const whereClause = conditions.join(" AND ");

    const totalResult = await this.db.query(
      `
    SELECT COUNT(*) as total
    FROM team_members tm
    INNER JOIN users u
      ON u.id = tm.user_id
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

        tm.role,
        t.id as "teamId",
        t.name as "teamName",

        tm.created_at as "joinedAt",

        u.avatar_url as avatar,

        u.job_title as "jobTitle",

        u.is_active as "isActive",

        u.last_seen_at as "lastSeenAt",

        u.created_at as "createdAt",

        COALESCE(ls.total_leads, 0) as "totalLeads",

        COALESCE(ds.pipeline_value, 0) as "pipelineValue",

        COALESCE(ds.deals_won, 0) as "dealsWon"

      FROM team_members tm

      INNER JOIN users u
        ON u.id = tm.user_id

      INNER JOIN teams t
        ON t.id = tm.team_id

      LEFT JOIN (
        SELECT
          assigned_to,

          COUNT(*) as total_leads

        FROM leads

        WHERE team_id = $1

        GROUP BY assigned_to
      ) ls
        ON ls.assigned_to = u.id

      LEFT JOIN (
        SELECT
          assigned_to,

          COALESCE(
            SUM(
              CASE
                WHEN stage != 'won'
                THEN value
                ELSE 0
              END
            ),
            0
          ) as pipeline_value,

          COUNT(
            CASE
              WHEN stage = 'won'
              THEN 1
            END
          ) as deals_won

        FROM deals

        WHERE team_id = $1

        GROUP BY assigned_to
      ) ds
        ON ds.assigned_to = u.id

      WHERE ${whereClause}

      ORDER BY u.created_at DESC

      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}

    `,
      values,
    );

    const members = membersResult.rows.map((member: any) => {
      const totalLeads = Number(member.totalLeads || 0);

      const dealsWon = Number(member.dealsWon || 0);

      const pipelineValue = Number(member.pipelineValue || 0);

      const aiScore = Math.min(
        100,
        Math.round(
          dealsWon * 12 + totalLeads * 2 + Math.min(pipelineValue / 2000, 30),
        ),
      );

      return {
        ...member,
        aiScore,
      };
    });

    return {
      data: members,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivitiesPaginated({
    teamId,
    page = 1,
    limit = 20,
    search = "",
    type = "all",
    userId = "",
    dateFrom = "",
    dateTo = "",
    sort = "createdAt:desc",
  }: {
    teamId: string;
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  }) {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.min(100, Math.max(1, Number(limit || 20)));
    const offset = (safePage - 1) * safeLimit;

    const conditions: string[] = [`e.team_id = $1`];
    const values: any[] = [teamId];

    let paramIndex = 2;

    if (userId) {
      conditions.push(`e.user_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`e.created_at >= $${paramIndex}`);
      values.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`e.created_at <= $${paramIndex}`);
      values.push(dateTo);
      paramIndex++;
    }

    if (search) {
      conditions.push(`
      (
        u.name ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
        OR e.event_type ILIKE $${paramIndex}
        OR e.entity_type ILIKE $${paramIndex}
      )
    `);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (type && type !== "all") {
      conditions.push(`
      (
        e.event_type ILIKE $${paramIndex}
        OR e.entity_type ILIKE $${paramIndex}
      )
    `);
      values.push(`%${type}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    let orderBy = "e.created_at DESC";

    switch (sort) {
      case "createdAt:asc":
        orderBy = "e.created_at ASC";
        break;

      case "user:asc":
        orderBy = "u.name ASC NULLS LAST";
        break;

      case "user:desc":
        orderBy = "u.name DESC NULLS LAST";
        break;

      case "type:asc":
        orderBy = "e.event_type ASC";
        break;

      case "type:desc":
        orderBy = "e.event_type DESC";
        break;

      default:
        orderBy = "e.created_at DESC";
    }

    const totalResult = await this.db.query(
      `
    SELECT COUNT(*) as total
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE ${whereClause}
    `,
      values,
    );

    const total = Number(totalResult.rows[0]?.total || 0);
    const stats = await this.getActivityStats(teamId);

    const queryValues = [...values, safeLimit, offset];

    const result = await this.db.query(
      `
    SELECT
      e.id,
      e.event_type as "eventType",
      e.entity_type as "entityType",
      e.metadata,
      e.created_at as "createdAt",
      u.name as "userName",
      u.email as "userEmail",
      u.avatar_url as avatar
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
    `,
      queryValues,
    );

    const data = result.rows.map((item: any) => {
      let message = "";

      switch (item.eventType) {
        case "team.member_added":
          message = `${item.userName || "Someone"} invited a new team member`;
          break;

        case "team.member_removed":
          message = `${item.userName || "Someone"} removed a team member`;
          break;

        case "user.logged_in":
          message = `${item.userName || "Someone"} logged in`;
          break;

        case "property.created":
          message = `${item.userName || "Someone"} created a new property`;
          break;

        case "lead.updated":
          message = `${item.userName || "Someone"} updated a lead`;
          break;

        case "lead.status_changed":
          message = `${item.userName || "Someone"} changed the lead status`;
          break;

        default:
          message = `${item.userName || "Someone"} ${String(
            item.eventType || "updated activity",
          )
            .replaceAll("_", " ")
            .replaceAll(".", " ")
            .toLowerCase()}`;
      }

      const metadata = item.metadata || {};

      return {
        id: item.id,
        avatar: item.avatar,
        userName: item.userName,
        userEmail: item.userEmail,
        eventType: item.eventType,
        entityType: item.entityType,
        createdAt: item.createdAt,
        metadata,
        oldValue: metadata.oldValue || metadata.old || null,
        newValue: metadata.newValue || metadata.new || null,
        entityId: metadata.entityId || null,
        ip: metadata.ip || null,
        browser: metadata.browser || null,
        device: metadata.device || null,
        message,
        time: this.formatTimeAgo(item.createdAt),
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return {
      stats,
      data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  private buildActivityMessage(item: any) {
    switch (item.eventType) {
      case "team.member_added":
        return `${item.userName || "Someone"} invited a new team member`;

      case "team.member_removed":
        return `${item.userName || "Someone"} removed a team member`;

      case "user.logged_in":
        return `${item.userName || "Someone"} logged in`;

      case "property.created":
        return `${item.userName || "Someone"} created a new property`;

      case "lead.updated":
        return `${item.userName || "Someone"} updated a lead`;

      case "lead.status_changed":
        return `${item.userName || "Someone"} changed the lead status`;

      default:
        return `${item.userName || "Someone"} ${String(
          item.eventType || "updated activity",
        )
          .replaceAll("_", " ")
          .replaceAll(".", " ")
          .toLowerCase()}`;
    }
  }

  private csvEscape(value: any) {
    if (value === null || value === undefined) return "";

    return `"${String(value).replace(/"/g, '""')}"`;
  }

  async exportActivitiesCsv({
    teamId,
    search = "",
    type = "all",
    userId = "",
    dateFrom = "",
    dateTo = "",
    sort = "createdAt:desc",
  }: {
    teamId: string;
    search?: string;
    type?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  }) {
    const conditions: string[] = [`e.team_id = $1`];
    const values: any[] = [teamId];

    let paramIndex = 2;

    if (userId) {
      conditions.push(`e.user_id = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`e.created_at >= $${paramIndex}`);
      values.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`e.created_at <= $${paramIndex}`);
      values.push(dateTo);
      paramIndex++;
    }

    if (search) {
      conditions.push(`
      (
        u.name ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
        OR e.event_type ILIKE $${paramIndex}
        OR e.entity_type ILIKE $${paramIndex}
      )
    `);

      values.push(`%${search}%`);
      paramIndex++;
    }

    if (type && type !== "all") {
      conditions.push(`
      (
        e.event_type ILIKE $${paramIndex}
        OR e.entity_type ILIKE $${paramIndex}
      )
    `);

      values.push(`%${type}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    let orderBy = "e.created_at DESC";

    switch (sort) {
      case "createdAt:asc":
        orderBy = "e.created_at ASC";
        break;

      case "user:asc":
        orderBy = "u.name ASC NULLS LAST";
        break;

      case "user:desc":
        orderBy = "u.name DESC NULLS LAST";
        break;

      case "type:asc":
        orderBy = "e.event_type ASC";
        break;

      case "type:desc":
        orderBy = "e.event_type DESC";
        break;

      default:
        orderBy = "e.created_at DESC";
    }

    const result = await this.db.query(
      `
    SELECT
      e.id,
      e.event_type as "eventType",
      e.entity_type as "entityType",
      e.metadata,
      e.created_at as "createdAt",
      u.name as "userName",
      u.email as "userEmail"
    FROM events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 10000
    `,
      values,
    );

    const headers = [
      "ID",
      "User Name",
      "User Email",
      "Event Type",
      "Entity Type",
      "Message",
      "Created At",
      "Metadata",
    ];

    const rows = result.rows.map((item: any) => {
      const message = this.buildActivityMessage(item);

      return [
        item.id,
        item.userName || "",
        item.userEmail || "",
        item.eventType || "",
        item.entityType || "",
        message,
        item.createdAt ? new Date(item.createdAt).toISOString() : "",
        JSON.stringify(item.metadata || {}),
      ]
        .map((value) => this.csvEscape(value))
        .join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }
  async getAIInsights(teamId: string) {
    return this.aiInsightsService.generate(teamId);
  }

  async refreshAIInsights(teamId: string, userId: string) {
    return this.aiInsightsService.refreshAIInsights(teamId, userId);
  }

  async changeMemberRole(
    teamId: string,
    memberUserId: string,
    role: string,
    requestingUserId: string,
  ) {
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();

    const allowedRoles = ["manager", "agent", "admin", "viewer"];

    if (!normalizedRole) {
      throw new BadRequestException("Role is required");
    }

    if (!allowedRoles.includes(normalizedRole)) {
      throw new BadRequestException(`Invalid role: ${normalizedRole}`);
    }

    const team = await this.findById(teamId);

    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (String(team.ownerId) !== String(requestingUserId)) {
      throw new ForbiddenException("Only team owner can change member roles");
    }

    if (String(memberUserId) === String(team.ownerId)) {
      throw new BadRequestException("The team owner role cannot be changed");
    }

    const memberResult = await this.db.query(
      `
    SELECT
      tm.user_id as "userId",
      tm.role,
      tm.status,
      u.name,
      u.email
    FROM team_members tm
    INNER JOIN users u
      ON u.id = tm.user_id
    WHERE tm.team_id = $1
      AND tm.user_id = $2
    LIMIT 1
    `,
      [teamId, memberUserId],
    );

    const member = memberResult.rows[0];

    if (!member) {
      throw new NotFoundException("Member not found in this team");
    }

    if (member.status !== "active") {
      throw new BadRequestException(
        "Only active team members can have their role changed",
      );
    }

    const previousRole = String(member.role || "").toLowerCase();

    if (previousRole === normalizedRole) {
      return {
        success: true,
        message: "Member already has this role",
        member: {
          id: member.userId,
          name: member.name,
          email: member.email,
          role: previousRole,
          status: member.status,
        },
      };
    }

    try {
      const updateResult = await this.db.query(
        `
      UPDATE team_members
      SET
        role = $3,
        updated_at = NOW()
      WHERE team_id = $1
        AND user_id = $2
        AND status = 'active'
      RETURNING
        user_id as id,
        role,
        status,
        updated_at as "updatedAt"
      `,
        [teamId, memberUserId, normalizedRole],
      );

      if (updateResult.rowCount === 0) {
        throw new NotFoundException("Active team member not found");
      }

      const updatedMember = updateResult.rows[0];

      try {
        await this.notificationsService.create({
          teamId,
          actorUserId: requestingUserId,

          type: "team.member_role_changed",
          category: "team",
          priority: "medium",

          title: "Team member role updated",
          message: `${member.name || member.email || "Team member"} role changed from ${previousRole} to ${normalizedRole}`,

          url: `/dashboard/team/members`,

          entityType: "user",
          entityId: memberUserId,

          icon: "shield",

          metadata: {
            userId: memberUserId,
            previousRole,
            newRole: normalizedRole,
          },
        });
      } catch (notificationError) {
        console.error(
          "CREATE ROLE CHANGE NOTIFICATION ERROR",
          notificationError,
        );
      }

      try {
        await this.db.query(
          `
        INSERT INTO events (
          team_id,
          user_id,
          event_type,
          entity_type,
          entity_id,
          metadata,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::jsonb,
          NOW()
        )
        `,
          [
            teamId,
            requestingUserId,
            "team.member_role_changed",
            "user",
            memberUserId,
            JSON.stringify({
              title: "Member role changed",
              sub: `${member.name || member.email || "Team member"} changed from ${previousRole} to ${normalizedRole}`,
              memberUserId,
              memberName: member.name || null,
              memberEmail: member.email || null,
              previousRole,
              newRole: normalizedRole,
            }),
          ],
        );
      } catch (eventError) {
        console.error("CREATE ROLE CHANGE EVENT ERROR", eventError);
      }

      return {
        success: true,
        message: "Member role updated successfully",
        member: {
          ...updatedMember,
          name: member.name,
          email: member.email,
          previousRole,
        },
      };
    } catch (error: any) {
      console.error("CHANGE MEMBER ROLE SERVICE ERROR", {
        teamId,
        memberUserId,
        requestingUserId,
        requestedRole: normalizedRole,
        databaseCode: error?.code,
        databaseConstraint: error?.constraint,
        databaseDetail: error?.detail,
        message: error?.message,
        stack: error?.stack,
      });

      /*
       * PostgreSQL check constraint violation.
       */
      if (error?.code === "23514") {
        throw new BadRequestException(
          `Role "${normalizedRole}" is not allowed by the team_members role constraint`,
        );
      }

      /*
       * PostgreSQL enum invalid value.
       */
      if (error?.code === "22P02") {
        throw new BadRequestException(
          `Role "${normalizedRole}" is not supported by the database`,
        );
      }

      /*
       * Foreign key violation.
       */
      if (error?.code === "23503") {
        throw new BadRequestException("Invalid team or member");
      }

      throw error;
    }
  }

  async inviteMemberByEmail(
    teamId: string,
    email: string,
    requestingUserId: string,
    role = "agent",
    name: string | null = null,
  ) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    // Optional name the inviter typed; applied to the member's account on accept
    // if they do not already have a name of their own.
    const inviteeName = name ? String(name).trim() || null : null;

    const normalizedRole = String(role || "agent")
      .trim()
      .toLowerCase();
    const allowedRoles = ["admin", "manager", "agent", "viewer"];
    if (!normalizedEmail) {
      throw new BadRequestException("Email is required");
    }

    if (!allowedRoles.includes(normalizedRole)) {
      throw new BadRequestException(`Invalid team role: ${normalizedRole}`);
    }
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (String(team.ownerId) !== String(requestingUserId)) {
      throw new ForbiddenException("Only team owner can invite members");
    }

    const existingMember = await this.db.query(
      `
      SELECT
        tm.id,
        tm.status
      FROM team_members tm
      INNER JOIN users u
        ON u.id = tm.user_id
      WHERE tm.team_id = $1
        AND LOWER(u.email) = LOWER($2)
        AND tm.status = 'active'
      LIMIT 1
      `,
      [teamId, normalizedEmail],
    );

    if (existingMember.rows.length > 0) {
      throw new BadRequestException(
        "This user is already an active team member",
      );
    }

    const existingInvite = await this.db.query(
      `
      SELECT
        id,
        status
      FROM team_invitations
      WHERE team_id = $1
        AND LOWER(email) = LOWER($2)
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [teamId, normalizedEmail],
    );

    // Seat enforcement (Feature B). A brand-new invitation consumes a seat; a
    // re-invite to an address that already has a pending invite does not, so we
    // only enforce when there is no existing pending invitation for this email.
    if (existingInvite.rows.length === 0) {
      const [limit, usage] = await Promise.all([
        this.getTeamSeatLimit(teamId),
        this.getTeamSeatUsage(teamId),
      ]);
      if (usage >= limit) {
        throw new ForbiddenException(TeamsService.SEAT_LIMIT_MESSAGE);
      }
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let invitation;
    if (existingInvite.rows.length > 0) {
      const invitationId = existingInvite.rows[0].id;

      const result = await this.db.query(
        `
      UPDATE team_invitations
      SET
        role = $2,
        token = $3,
        invited_by = $4,
        expires_at = $5,
        invitee_name = COALESCE($6, invitee_name),
        created_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        team_id as "teamId",
        invited_by as "invitedBy",
        email,
        role,
        status,
        expires_at as "expiresAt",
        accepted_at as "acceptedAt",
        created_at as "createdAt"
      `,
        [invitationId, normalizedRole, token, requestingUserId, expiresAt, inviteeName],
      );

      invitation = result.rows[0];
    } else {
      const result = await this.db.query(
        `
      INSERT INTO team_invitations (
        team_id,
        invited_by,
        email,
        role,
        token,
        status,
        expires_at,
        invitee_name,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'pending',
        $6,
        $7,
        NOW()
      )
      RETURNING
        id,
        team_id as "teamId",
        invited_by as "invitedBy",
        email,
        role,
        status,
        expires_at as "expiresAt",
        accepted_at as "acceptedAt",
        created_at as "createdAt"
      `,
        [
          teamId,
          requestingUserId,
          normalizedEmail,
          normalizedRole,
          token,
          expiresAt,
          inviteeName,
        ],
      );

      invitation = result.rows[0];
    }

    try {
      await this.db.query(
        `
      INSERT INTO events (
        team_id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        metadata,
        created_at
      )
      VALUES (
        $1,
        $2,
        'team.invitation_created',
        'team_invitation',
        $3,
        $4::jsonb,
        NOW()
      )
      `,
        [
          teamId,
          requestingUserId,
          invitation.id,
          JSON.stringify({
            email: normalizedEmail,
            role: normalizedRole,
            expiresAt,
          }),
        ],
      );
    } catch (error) {
      console.error("CREATE TEAM INVITE EVENT ERROR", error);
    }

    // Email the invited address an accept link (Feature A). Best-effort: a mail
    // failure must NOT fail the invite — it is logged inside the mailer.
    const acceptUrl = `${this.getFrontendBaseUrl()}/accept-invite?token=${token}`;
    await this.sendInvitationEmail(
      normalizedEmail,
      team.name,
      normalizedRole,
      acceptUrl,
    );

    return {
      success: true,
      message: "Team invitation created successfully",
      invitation,
    };
  }

  async getPendingInvitations({
    teamId,
    requestingUserId,
    page = 1,
    limit = 20,
    search = "",
    role = "all",
  }: {
    teamId: string;
    requestingUserId: string;
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (String(team.ownerId) !== String(requestingUserId)) {
      throw new ForbiddenException("Only team owner can manage invitations");
    }
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.min(100, Math.max(1, Number(limit || 20)));
    const offset = (safePage - 1) * safeLimit;
    const conditions: string[] = [`ti.team_id = $1`, `ti.status = 'pending'`];
    const values: any[] = [teamId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`ti.email ILIKE $${paramIndex}`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (role && role !== "all") {
      conditions.push(`LOWER(ti.role) = LOWER($${paramIndex})`);
      values.push(role);
      paramIndex++;
    }
    const whereClause = conditions.join(" AND ");
    const totalResult = await this.db.query(
      `
      SELECT COUNT(*)::int as total
      FROM team_invitations ti
      WHERE ${whereClause}
      `,
      values,
    );
    const total = Number(totalResult.rows[0]?.total || 0);
    const queryValues = [...values, safeLimit, offset];
    const result = await this.db.query(
      `
    SELECT
      ti.id,
      ti.team_id as "teamId",
      t.name as "teamName",

      ti.email,
      ti.role,
      ti.status,

      ti.invited_by as "invitedBy",
      inviter.name as "invitedByName",
      inviter.email as "invitedByEmail",

      ti.expires_at as "expiresAt",
      ti.accepted_at as "acceptedAt",
      ti.created_at as "createdAt",

      CASE
        WHEN ti.expires_at IS NOT NULL
          AND ti.expires_at < NOW()
        THEN true
        ELSE false
      END as "isExpired"

    FROM team_invitations ti

    INNER JOIN teams t
      ON t.id = ti.team_id

    LEFT JOIN users inviter
      ON inviter.id = ti.invited_by

    WHERE ${whereClause}

    ORDER BY ti.created_at DESC

    LIMIT $${paramIndex}
    OFFSET $${paramIndex + 1}
    `,
      queryValues,
    );
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      data: result.rows,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  async resendInvitation(
    teamId: string,
    invitationId: string,
    requestingUserId: string,
  ) {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (String(team.ownerId) !== String(requestingUserId)) {
      throw new ForbiddenException("Only team owner can resend invitations");
    }
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await this.db.query(
      `
    UPDATE team_invitations
    SET
      token = $3,
      expires_at = $4,
      status = 'pending',
      invited_by = $5,
      created_at = NOW()
    WHERE id = $1
      AND team_id = $2
      AND status = 'pending'
    RETURNING
      id,
      team_id as "teamId",
      email,
      role,
      status,
      expires_at as "expiresAt",
      created_at as "createdAt"
    `,
      [invitationId, teamId, token, expiresAt, requestingUserId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException("Pending invitation not found");
    }

    return {
      success: true,
      message: "Invitation resent successfully",
      invitation: result.rows[0],
    };
  }

  async cancelInvitation(
    teamId: string,
    invitationId: string,
    requestingUserId: string,
  ) {
    const team = await this.findById(teamId);
    if (!team) {
      throw new NotFoundException("Team not found");
    }

    if (String(team.ownerId) !== String(requestingUserId)) {
      throw new ForbiddenException("Only team owner can cancel invitations");
    }
    const result = await this.db.query(
      `
    UPDATE team_invitations
    SET status = 'cancelled'
    WHERE id = $1
      AND team_id = $2
      AND status = 'pending'
    RETURNING
      id,
      email,
      role,
      status
    `,
      [invitationId, teamId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException("Pending invitation not found");
    }
    return {
      success: true,
      message: "Invitation cancelled successfully",
      invitation: result.rows[0],
    };
  }

  /* =====================================================
    SEAT LIMITS BY PLAN (Feature B)
  ===================================================== */

  /**
   * Resolve the seat cap for a team from its EFFECTIVE plan (the team OWNER's).
   * Uses the shared resolveEffectivePlan rule so seats are payment-gated exactly
   * like every other entitlement: selected_plan is intent only, so an owner who
   * merely clicked the 3/5-user plan without paying stays at the Free/Solo cap of
   * 1, while a confirmed-paid Business gets 3 and Scale gets 5. Paid seat add-ons
   * still raise the cap on top.
   */
  async getTeamSeatLimit(teamId: string): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT u.plan, u.selected_plan, u.payment_status, u.checkout_status
       FROM teams t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1
       LIMIT 1`,
      [teamId],
    );
    const { planId } = resolveEffectivePlan(rows[0] || {});
    const base = getPlan(planId).seats;

    // Add paid extra seats: each active $97 'seat' add-on raises the limit by 1.
    let extra = 0;
    try {
      const seatRows = await this.db.query(
        `SELECT COUNT(*)::int AS n
           FROM team_addon_history
          WHERE team_id = $1 AND addon_key = 'seat' AND disabled_at IS NULL`,
        [teamId],
      );
      extra = Number(seatRows.rows[0]?.n || 0);
    } catch (_e) {
      extra = 0;
    }
    return base + extra;
  }

  /**
   * Current seat usage: active team members PLUS pending, not-yet-expired
   * invitations (so a pending invite holds a seat). `excludeToken` omits one
   * invitation from the count — used at accept time, where converting a held
   * pending seat into an active membership must not be double-counted.
   */
  async getTeamSeatUsage(
    teamId: string,
    excludeToken?: string,
  ): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT
         (
           SELECT COUNT(*)
           FROM team_members
           WHERE team_id = $1
             AND status = 'active'
         )
         +
         (
           SELECT COUNT(*)
           FROM team_invitations
           WHERE team_id = $1
             AND status = 'pending'
             AND (expires_at IS NULL OR expires_at > NOW())
             AND ($2::text IS NULL OR token <> $2)
         ) AS usage`,
      [teamId, excludeToken ?? null],
    );
    return Number(rows[0]?.usage || 0);
  }

  /** Plan-based seat limit + usage for the current team (used by the invite UI). */
  async getSeatUsageInfo(
    teamId: string,
  ): Promise<{ limit: number; used: number; available: number }> {
    const [limit, used] = await Promise.all([
      this.getTeamSeatLimit(teamId),
      this.getTeamSeatUsage(teamId),
    ]);
    return { limit, used, available: Math.max(0, limit - used) };
  }

  /* =====================================================
    INVITATION ACCEPT FLOW (Feature A)
  ===================================================== */

  private getFrontendBaseUrl(): string {
    return (
      this.configService.get("FRONTEND_URL") || "https://www.cortexaaicrm.com"
    )
      .split(",")[0]
      .trim();
  }

  /**
   * Send the invitation email (accept link). Mirrors auth.service.sendResetEmail:
   * pulls SMTP config from ConfigService and is strictly best-effort — a missing
   * or failing SMTP setup is logged and swallowed, never thrown.
   */
  private async sendInvitationEmail(
    to: string,
    teamName: string,
    role: string,
    acceptUrl: string,
  ): Promise<void> {
    try {
      const host = this.configService.get("SMTP_HOST");
      const user = this.configService.get("SMTP_USER");
      const pass = this.configService.get("SMTP_PASS");
      const from = this.configService.get("EMAIL_FROM") || user;
      const port = Number(this.configService.get("SMTP_PORT")) || 587;

      if (!host || !user || !pass || !from) {
        this.logger.warn(
          "Team invitation email not sent: SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM).",
        );
        return;
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const safeTeam = teamName || "a CORTEXA workspace";
      const html = `
        <div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
          <h2 style="margin:0 0 12px">You've been invited to ${safeTeam}</h2>
          <p>You've been invited to join <strong>${safeTeam}</strong> on CORTEXA as <strong>${role}</strong>.</p>
          <p style="margin:20px 0">
            <a href="${acceptUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Accept invitation</a>
          </p>
          <p style="color:#64748b;font-size:13px">This invitation expires in 7 days. If you did not expect this, you can safely ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">${acceptUrl}</p>
        </div>`;

      await transporter.sendMail({
        from,
        to,
        subject: `You've been invited to join ${safeTeam} on CORTEXA`,
        text: `You've been invited to join ${safeTeam} as ${role}. Accept your invitation (expires in 7 days): ${acceptUrl}`,
        html,
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to send team invitation email: ${err?.message}`,
      );
    }
  }

  /**
   * Public lookup of a pending invitation by token so the accept page can show
   * context and prefill the email. Returns { valid: false } for missing /
   * already-accepted / cancelled tokens (no detail leak); expired tokens get
   * { valid: false, expired: true }.
   */
  async getInvitationByToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    teamName?: string;
    role?: string;
    expired?: boolean;
  }> {
    if (!token) return { valid: false };

    const { rows } = await this.db.query(
      `SELECT
         ti.email,
         ti.role,
         ti.status,
         ti.expires_at AS "expiresAt",
         t.name AS "teamName"
       FROM team_invitations ti
       JOIN teams t ON t.id = ti.team_id
       WHERE ti.token = $1
       LIMIT 1`,
      [token],
    );

    const inv = rows[0];
    if (!inv) return { valid: false };

    const expired = inv.expiresAt
      ? new Date(inv.expiresAt).getTime() < Date.now()
      : false;

    if (inv.status !== "pending" || expired) {
      return { valid: false, expired };
    }

    return {
      valid: true,
      email: inv.email,
      teamName: inv.teamName,
      role: inv.role,
      expired: false,
    };
  }

  /**
   * Accept a pending invitation as the authenticated user. Verifies the invite
   * is pending + unexpired, that the signed-in email matches the invited email,
   * re-checks the seat cap (seats may have filled since the invite), then adds
   * the user to team_members (idempotent) and lands brand-new invitees in the
   * workspace by setting users.team_id when it is null.
   */
  async acceptInvitation(
    token: string,
    user: { id: string; email: string },
  ): Promise<{ success: true; teamId: string }> {
    if (!token) {
      throw new BadRequestException("Invitation token is required");
    }

    const { rows } = await this.db.query(
      `SELECT
         id,
         team_id AS "teamId",
         invited_by AS "invitedBy",
         email,
         role,
         status,
         invitee_name AS "inviteeName",
         expires_at AS "expiresAt"
       FROM team_invitations
       WHERE token = $1
       LIMIT 1`,
      [token],
    );

    const invitation = rows[0];
    const isExpired =
      invitation?.expiresAt &&
      new Date(invitation.expiresAt).getTime() < Date.now();

    if (!invitation || invitation.status !== "pending" || isExpired) {
      throw new NotFoundException("This invitation is invalid or has expired.");
    }

    // The authenticated user's email must match the invited address.
    const authEmail = String(user?.email || "")
      .trim()
      .toLowerCase();
    const invitedEmail = String(invitation.email || "")
      .trim()
      .toLowerCase();
    if (!authEmail || authEmail !== invitedEmail) {
      throw new ForbiddenException(
        "This invitation was sent to a different email.",
      );
    }

    const teamId = invitation.teamId as string;

    // Idempotent: if already an active member, just mark the invite accepted.
    const existing = await this.db.query(
      `SELECT id FROM team_members
       WHERE team_id = $1 AND user_id = $2 AND status = 'active'
       LIMIT 1`,
      [teamId, user.id],
    );
    const alreadyMember = existing.rows.length > 0;

    if (!alreadyMember) {
      // Re-check the seat cap. Exclude THIS invitation from usage: accepting it
      // converts a held pending seat, so it must not count against the cap.
      const [limit, usage] = await Promise.all([
        this.getTeamSeatLimit(teamId),
        this.getTeamSeatUsage(teamId, token),
      ]);
      if (usage >= limit) {
        throw new ForbiddenException(TeamsService.SEAT_LIMIT_MESSAGE);
      }

      await this.db.query(
        `INSERT INTO team_members (
           team_id, user_id, role, status, created_at, updated_at
         )
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         ON CONFLICT (team_id, user_id)
         DO UPDATE SET
           role = EXCLUDED.role,
           status = 'active',
           updated_at = NOW()`,
        [teamId, user.id, invitation.role || "agent"],
      );
    }

    // Land a brand-new invitee in this workspace (only when they have none yet).
    await this.db.query(
      `UPDATE users SET team_id = $1, updated_at = NOW()
       WHERE id = $2 AND team_id IS NULL`,
      [teamId, user.id],
    );

    // Apply the name the inviter entered, but only if the member has none of
    // their own yet (never overwrite a name the person set themselves).
    if (invitation.inviteeName) {
      await this.db.query(
        `UPDATE users SET name = $1, updated_at = NOW()
         WHERE id = $2 AND (name IS NULL OR name = '')`,
        [invitation.inviteeName, user.id],
      );
    }

    // Mark the invitation accepted.
    await this.db.query(
      `UPDATE team_invitations
       SET status = 'accepted', accepted_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [invitation.id],
    );

    // Best-effort logging + notification — never block the join on these.
    try {
      await this.eventLogger.logTeamMemberAdded(
        teamId,
        invitation.invitedBy || user.id,
        user.id,
      );
    } catch (error) {
      console.error("ACCEPT INVITE EVENT ERROR", error);
    }

    try {
      const joined = await this.usersService.findById(user.id);
      await this.notificationsService.create({
        teamId,
        actorUserId: user.id,

        type: "team.member_added",
        category: "team",
        priority: "medium",

        title: "Invitation accepted",
        message: `${joined?.name || joined?.email || "A new member"} joined the team`,

        url: `/dashboard/team/members`,

        entityType: "user",
        entityId: user.id,

        icon: "user-plus",

        metadata: { userId: user.id, via: "invitation" },
      });
    } catch (error) {
      console.error("ACCEPT INVITE NOTIFICATION ERROR", error);
    }

    return { success: true, teamId };
  }

  /* =====================================================
     TEAM WORKSPACE — PROJECT / TASK / TIME DATA
     ===================================================== */

  private workspaceSchemaReady = false;

  private async ensureWorkspaceSchema(): Promise<void> {
    if (this.workspaceSchemaReady) return;

    // Existing `projects` table is intentionally reused and extended rather than
    // replaced, so any existing project records remain available.
    await this.db.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active',
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        ADD COLUMN IF NOT EXISTS owner_id UUID,
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS team_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        task_type VARCHAR(50) NOT NULL DEFAULT 'task',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        due_date TIMESTAMPTZ,
        progress INT NOT NULL DEFAULT 0,
        estimated_minutes INT NOT NULL DEFAULT 0,
        labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT team_tasks_status_check
          CHECK (status IN ('pending','in_progress','review','on_hold','completed','cancelled')),
        CONSTRAINT team_tasks_priority_check
          CHECK (priority IN ('low','medium','high','urgent')),
        CONSTRAINT team_tasks_progress_check
          CHECK (progress >= 0 AND progress <= 100)
      )
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_tasks_team
      ON team_tasks(team_id, updated_at DESC)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_tasks_assignee
      ON team_tasks(team_id, assigned_to)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_tasks_project
      ON team_tasks(team_id, project_id)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_tasks_due
      ON team_tasks(team_id, due_date)
      WHERE due_date IS NOT NULL
    `);

    await this.db.query(`
      CREATE TABLE IF NOT EXISTS team_time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        task_id UUID REFERENCES team_tasks(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        minutes INT NOT NULL CHECK (minutes > 0),
        note TEXT,
        started_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_time_entries_team
      ON team_time_entries(team_id, created_at DESC)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_time_entries_task
      ON team_time_entries(team_id, task_id)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_team_time_entries_user
      ON team_time_entries(team_id, user_id)
    `);

    // Reuse the existing stored_files table, but allow files to be associated
    // with the project/task that owns them.
    await this.db.query(`
      ALTER TABLE stored_files
        ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES team_tasks(id) ON DELETE SET NULL
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_stored_files_team_project
      ON stored_files(team_id, project_id)
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_stored_files_team_task
      ON stored_files(team_id, task_id)
    `);

    this.workspaceSchemaReady = true;
  }

  private normalizeWorkspaceTaskStatus(raw: any): string {
    const v = String(raw || 'pending').trim().toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, string> = {
      pending: 'pending',
      todo: 'pending',
      to_do: 'pending',
      in_progress: 'in_progress',
      progress: 'in_progress',
      review: 'review',
      on_hold: 'on_hold',
      hold: 'on_hold',
      completed: 'completed',
      complete: 'completed',
      done: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled',
    };
    return map[v] || 'pending';
  }

  private normalizeWorkspacePriority(raw: any): string {
    const v = String(raw || 'medium').trim().toLowerCase();
    return ['low', 'medium', 'high', 'urgent'].includes(v) ? v : 'medium';
  }

  private async logWorkspaceTaskEvent(
    teamId: string,
    userId: string,
    taskId: string,
    eventType: string,
    metadata: Record<string, any>,
  ) {
    try {
      await this.db.query(
        `INSERT INTO events
           (team_id, user_id, event_type, entity_type, entity_id, metadata, created_at)
         VALUES ($1,$2,$3,'team_task',$4,$5::jsonb,NOW())`,
        [teamId, userId, eventType, taskId, JSON.stringify(metadata || {})],
      );
    } catch (error) {
      this.logger.warn(`Could not log ${eventType}: ${error?.message || error}`);
    }
  }

  async getWorkspaceOverview(teamId: string, userId: string) {
    await this.ensureWorkspaceSchema();

    const [
      metricsResult,
      statusResult,
      priorityResult,
      workloadResult,
      deadlinesResult,
      projectsResult,
    ] = await Promise.all([
      this.db.query(
        `
        WITH task_totals AS (
          SELECT
            COUNT(*)::int AS assigned,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (
              WHERE status = 'completed'
                AND due_date IS NOT NULL
                AND completed_at IS NOT NULL
                AND completed_at <= due_date
            )::int AS completed_on_time,
            COUNT(*) FILTER (
              WHERE status = 'completed'
                AND due_date IS NOT NULL
                AND completed_at IS NOT NULL
            )::int AS completed_with_due
          FROM team_tasks
          WHERE team_id = $1
        ),
        project_totals AS (
          SELECT COUNT(*) FILTER (
            WHERE COALESCE(status,'active') NOT IN ('completed','cancelled')
          )::int AS active_projects
          FROM projects
          WHERE team_id = $1
        ),
        time_totals AS (
          SELECT COALESCE(SUM(minutes),0)::int AS minutes_logged
          FROM team_time_entries
          WHERE team_id = $1
        ),
        member_productivity AS (
          SELECT
            tm.user_id,
            COUNT(tt.id)::int AS assigned,
            COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS completed
          FROM team_members tm
          LEFT JOIN team_tasks tt
            ON tt.team_id = tm.team_id
           AND tt.assigned_to = tm.user_id
          WHERE tm.team_id = $1
            AND tm.status = 'active'
          GROUP BY tm.user_id
        )
        SELECT
          p.active_projects AS "activeProjects",
          t.assigned AS "tasksAssigned",
          t.completed AS "tasksCompleted",
          CASE WHEN t.assigned = 0 THEN 0
               ELSE ROUND((t.completed::numeric / t.assigned::numeric) * 100, 1)
          END AS "completionRate",
          CASE WHEN t.completed_with_due = 0 THEN 0
               ELSE ROUND((t.completed_on_time::numeric / t.completed_with_due::numeric) * 100, 1)
          END AS "onTimeRate",
          COALESCE((
            SELECT ROUND(AVG(
              CASE WHEN assigned = 0 THEN 0
                   ELSE (completed::numeric / assigned::numeric) * 100
              END
            ), 1)
            FROM member_productivity
          ),0) AS productivity,
          ROUND(tm.minutes_logged::numeric / 60.0, 1) AS "hoursLogged"
        FROM task_totals t
        CROSS JOIN project_totals p
        CROSS JOIN time_totals tm
        `,
        [teamId],
      ),
      this.db.query(
        `SELECT status AS key, COUNT(*)::int AS count
           FROM team_tasks
          WHERE team_id = $1
          GROUP BY status
          ORDER BY count DESC`,
        [teamId],
      ),
      this.db.query(
        `SELECT priority AS key, COUNT(*)::int AS count
           FROM team_tasks
          WHERE team_id = $1
          GROUP BY priority
          ORDER BY count DESC`,
        [teamId],
      ),
      this.db.query(
        `
        SELECT
          tm.user_id AS id,
          COALESCE(u.name, u.email) AS name,
          u.email,
          COUNT(tt.id) FILTER (WHERE tt.status <> 'completed' AND tt.status <> 'cancelled')::int AS "openTasks",
          COALESCE(SUM(tt.estimated_minutes) FILTER (
            WHERE tt.status <> 'completed' AND tt.status <> 'cancelled'
          ),0)::int AS "estimatedMinutes",
          COALESCE((
            SELECT SUM(te.minutes)::int
            FROM team_time_entries te
            WHERE te.team_id = $1 AND te.user_id = tm.user_id
          ),0)::int AS "loggedMinutes"
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        LEFT JOIN team_tasks tt
          ON tt.team_id = tm.team_id
         AND tt.assigned_to = tm.user_id
        WHERE tm.team_id = $1
          AND tm.status = 'active'
        GROUP BY tm.user_id, u.name, u.email
        ORDER BY "openTasks" DESC, name ASC
        `,
        [teamId],
      ),
      this.db.query(
        `
        SELECT
          tt.id,
          tt.title AS name,
          p.name AS project,
          tt.due_date AS "dueDate",
          tt.status,
          tt.priority
        FROM team_tasks tt
        LEFT JOIN projects p ON p.id = tt.project_id AND p.team_id = tt.team_id
        WHERE tt.team_id = $1
          AND tt.status NOT IN ('completed','cancelled')
          AND tt.due_date IS NOT NULL
          AND tt.due_date >= NOW() - INTERVAL '1 day'
          AND tt.due_date < NOW() + INTERVAL '8 days'
        ORDER BY tt.due_date ASC
        LIMIT 8
        `,
        [teamId],
      ),
      this.db.query(
        `
        SELECT
          p.id, p.name, p.description, p.status, p.priority,
          p.start_date AS "startDate", p.due_date AS "dueDate",
          p.progress, p.owner_id AS "ownerId",
          COALESCE(u.name,u.email) AS "ownerName",
          p.created_at AS "createdAt", p.updated_at AS "updatedAt",
          COUNT(tt.id)::int AS "taskCount",
          COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS "completedTasks"
        FROM projects p
        LEFT JOIN users u ON u.id = p.owner_id
        LEFT JOIN team_tasks tt ON tt.project_id = p.id AND tt.team_id = p.team_id
        WHERE p.team_id = $1
        GROUP BY p.id,u.name,u.email
        ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
        LIMIT 100
        `,
        [teamId],
      ),
    ]);

    const workload = workloadResult.rows.map((r: any) => ({
      ...r,
      openTasks: Number(r.openTasks || 0),
      estimatedMinutes: Number(r.estimatedMinutes || 0),
      loggedMinutes: Number(r.loggedMinutes || 0),
    }));
    const maxOpen = Math.max(0, ...workload.map((r: any) => r.openTasks));
    const workloadRows = workload.map((r: any) => ({
      ...r,
      workloadPercent: maxOpen > 0 ? Math.round((r.openTasks / maxOpen) * 100) : 0,
    }));

    const workloadValues = workloadRows.map((r: any) => r.openTasks);
    const avg = workloadValues.length
      ? workloadValues.reduce((a: number, b: number) => a + b, 0) / workloadValues.length
      : 0;
    const spread = workloadValues.length
      ? Math.max(...workloadValues) - Math.min(...workloadValues)
      : 0;
    const workloadBalancePercent =
      avg > 0 ? Math.max(0, Math.round(100 - (spread / Math.max(avg, 1)) * 35)) : 100;

    const baseMetrics = metricsResult.rows[0] || {};
    return {
      metrics: {
        ...baseMetrics,
        activeProjects: Number(baseMetrics.activeProjects || 0),
        tasksAssigned: Number(baseMetrics.tasksAssigned || 0),
        tasksCompleted: Number(baseMetrics.tasksCompleted || 0),
        completionRate: Number(baseMetrics.completionRate || 0),
        onTimeRate: Number(baseMetrics.onTimeRate || 0),
        productivity: Number(baseMetrics.productivity || 0),
        hoursLogged: Number(baseMetrics.hoursLogged || 0),
        workloadBalance: workloadBalancePercent,
      },
      taskBreakdowns: {
        status: statusResult.rows,
        priority: priorityResult.rows,
      },
      workload: workloadRows,
      upcomingDeadlines: deadlinesResult.rows,
      projects: projectsResult.rows,
    };
  }

  async getWorkspaceTasks(
    teamId: string,
    currentUserId: string,
    query: any = {},
  ) {
    await this.ensureWorkspaceSchema();

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const offset = (page - 1) * limit;
    const conditions: string[] = ['tt.team_id = $1'];
    const values: any[] = [teamId];
    let i = 2;

    const add = (sql: string, value: any) => {
      conditions.push(sql.replace('?', `$${i}`));
      values.push(value);
      i += 1;
    };

    if (query.my === 'true' || query.my === true) add('tt.assigned_to = ?', currentUserId);
    if (query.q) {
      conditions.push(`(
        tt.title ILIKE $${i}
        OR COALESCE(tt.description,'') ILIKE $${i}
        OR COALESCE(p.name,'') ILIKE $${i}
        OR COALESCE(u.name,u.email,'') ILIKE $${i}
      )`);
      values.push(`%${String(query.q).trim()}%`);
      i += 1;
    }
    if (query.status && query.status !== 'all') add('tt.status = ?', this.normalizeWorkspaceTaskStatus(query.status));
    if (query.priority && query.priority !== 'all') add('tt.priority = ?', this.normalizeWorkspacePriority(query.priority));
    if (query.assignee && query.assignee !== 'all') add('tt.assigned_to = ?', query.assignee);
    if (query.project && query.project !== 'all') add('tt.project_id = ?', query.project);
    if (query.taskType && query.taskType !== 'all') add('tt.task_type = ?', query.taskType);
    if (query.dateFrom) add('tt.due_date >= ?::timestamptz', query.dateFrom);
    if (query.dateTo) add('tt.due_date <= ?::timestamptz', query.dateTo);

    const where = conditions.join(' AND ');

    const count = await this.db.query(
      `SELECT COUNT(*)::int AS total
         FROM team_tasks tt
         LEFT JOIN projects p ON p.id = tt.project_id
         LEFT JOIN users u ON u.id = tt.assigned_to
        WHERE ${where}`,
      values,
    );

    const rows = await this.db.query(
      `
      SELECT
        tt.id,
        tt.title AS name,
        tt.description,
        tt.project_id AS "projectId",
        p.name AS project,
        tt.status,
        tt.priority,
        tt.task_type AS "taskType",
        tt.assigned_to AS "assigneeId",
        COALESCE(u.name,u.email) AS assignee,
        tt.due_date AS "dueDate",
        tt.progress,
        tt.estimated_minutes AS "estimatedMinutes",
        tt.labels,
        tt.created_by AS "createdBy",
        tt.created_at AS "createdAt",
        tt.updated_at AS "updatedAt",
        tt.completed_at AS "completedAt",
        COALESCE((
          SELECT SUM(te.minutes)::int
          FROM team_time_entries te
          WHERE te.team_id = tt.team_id AND te.task_id = tt.id
        ),0)::int AS "loggedMinutes"
      FROM team_tasks tt
      LEFT JOIN projects p ON p.id = tt.project_id AND p.team_id = tt.team_id
      LEFT JOIN users u ON u.id = tt.assigned_to
      WHERE ${where}
      ORDER BY
        CASE WHEN tt.due_date IS NULL THEN 1 ELSE 0 END,
        tt.due_date ASC,
        tt.updated_at DESC
      LIMIT $${i} OFFSET $${i + 1}
      `,
      [...values, limit, offset],
    );

    const total = Number(count.rows[0]?.total || 0);
    return {
      data: rows.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createWorkspaceTask(teamId: string, userId: string, body: any) {
    await this.ensureWorkspaceSchema();

    const title = String(body?.name || body?.title || '').trim();
    if (!title) throw new BadRequestException('Task name is required.');

    const status = this.normalizeWorkspaceTaskStatus(body?.status);
    const priority = this.normalizeWorkspacePriority(body?.priority);
    const progress =
      status === 'completed'
        ? 100
        : Math.max(0, Math.min(100, Number(body?.progress || 0)));

    if (body?.projectId) {
      const p = await this.db.query(
        `SELECT id FROM projects WHERE id = $1 AND team_id = $2 LIMIT 1`,
        [body.projectId, teamId],
      );
      if (!p.rows.length) throw new BadRequestException('Invalid project.');
    }

    if (body?.assigneeId) {
      const m = await this.db.query(
        `SELECT 1 FROM team_members
          WHERE team_id = $1 AND user_id = $2 AND status = 'active'
          LIMIT 1`,
        [teamId, body.assigneeId],
      );
      if (!m.rows.length) throw new BadRequestException('Assignee is not an active team member.');
    }

    const result = await this.db.query(
      `
      INSERT INTO team_tasks (
        team_id, project_id, title, description, status, priority, task_type,
        assigned_to, created_by, due_date, progress, estimated_minutes, labels,
        completed_at, created_at, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        CASE WHEN $5 = 'completed' THEN NOW() ELSE NULL END,
        NOW(),NOW()
      )
      RETURNING *
      `,
      [
        teamId,
        body?.projectId || null,
        title,
        body?.description || null,
        status,
        priority,
        String(body?.taskType || 'task').trim().toLowerCase(),
        body?.assigneeId || null,
        userId,
        body?.dueDate || null,
        progress,
        Math.max(0, Number(body?.estimatedMinutes || 0)),
        Array.isArray(body?.labels) ? body.labels.map(String) : [],
      ],
    );

    const task = result.rows[0];
    await this.logWorkspaceTaskEvent(teamId, userId, task.id, 'team.task_created', {
      title,
      projectId: task.project_id,
      assignedTo: task.assigned_to,
      status: task.status,
      priority: task.priority,
    });
    return task;
  }

  async updateWorkspaceTask(teamId: string, taskId: string, userId: string, body: any) {
    await this.ensureWorkspaceSchema();

    const existingResult = await this.db.query(
      `SELECT * FROM team_tasks WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [taskId, teamId],
    );
    const existing = existingResult.rows[0];
    if (!existing) throw new NotFoundException('Task not found.');

    const nextStatus =
      body?.status !== undefined
        ? this.normalizeWorkspaceTaskStatus(body.status)
        : existing.status;
    const nextPriority =
      body?.priority !== undefined
        ? this.normalizeWorkspacePriority(body.priority)
        : existing.priority;
    const nextProgress =
      nextStatus === 'completed'
        ? 100
        : body?.progress !== undefined
          ? Math.max(0, Math.min(100, Number(body.progress)))
          : existing.progress;

    const result = await this.db.query(
      `
      UPDATE team_tasks SET
        project_id = CASE WHEN $3::boolean THEN $4::uuid ELSE project_id END,
        title = CASE WHEN $5::boolean THEN $6 ELSE title END,
        description = CASE WHEN $7::boolean THEN $8 ELSE description END,
        status = $9,
        priority = $10,
        task_type = CASE WHEN $11::boolean THEN $12 ELSE task_type END,
        assigned_to = CASE WHEN $13::boolean THEN $14::uuid ELSE assigned_to END,
        due_date = CASE WHEN $15::boolean THEN $16::timestamptz ELSE due_date END,
        progress = $17,
        estimated_minutes = CASE WHEN $18::boolean THEN $19::int ELSE estimated_minutes END,
        labels = CASE WHEN $20::boolean THEN $21::text[] ELSE labels END,
        completed_at = CASE
          WHEN $9 = 'completed' AND completed_at IS NULL THEN NOW()
          WHEN $9 <> 'completed' THEN NULL
          ELSE completed_at
        END,
        updated_at = NOW()
      WHERE id = $1 AND team_id = $2
      RETURNING *
      `,
      [
        taskId,
        teamId,
        Object.prototype.hasOwnProperty.call(body || {}, 'projectId'),
        body?.projectId || null,
        Object.prototype.hasOwnProperty.call(body || {}, 'name') || Object.prototype.hasOwnProperty.call(body || {}, 'title'),
        body?.name ?? body?.title ?? null,
        Object.prototype.hasOwnProperty.call(body || {}, 'description'),
        body?.description ?? null,
        nextStatus,
        nextPriority,
        Object.prototype.hasOwnProperty.call(body || {}, 'taskType'),
        body?.taskType || 'task',
        Object.prototype.hasOwnProperty.call(body || {}, 'assigneeId'),
        body?.assigneeId || null,
        Object.prototype.hasOwnProperty.call(body || {}, 'dueDate'),
        body?.dueDate || null,
        nextProgress,
        Object.prototype.hasOwnProperty.call(body || {}, 'estimatedMinutes'),
        Math.max(0, Number(body?.estimatedMinutes || 0)),
        Object.prototype.hasOwnProperty.call(body || {}, 'labels'),
        Array.isArray(body?.labels) ? body.labels.map(String) : [],
      ],
    );

    const changes: any = {};
    for (const [key, oldValue, newValue] of [
      ['status', existing.status, nextStatus],
      ['priority', existing.priority, nextPriority],
      ['progress', Number(existing.progress || 0), nextProgress],
      ['assignee', existing.assigned_to, body?.assigneeId],
      ['dueDate', existing.due_date, body?.dueDate],
    ] as any[]) {
      if (newValue !== undefined && String(oldValue ?? '') !== String(newValue ?? '')) {
        changes[key] = { from: oldValue, to: newValue };
      }
    }

    const eventType =
      nextStatus === 'completed' && existing.status !== 'completed'
        ? 'team.task_completed'
        : body?.status !== undefined && existing.status !== nextStatus
          ? 'team.task_status_changed'
          : body?.priority !== undefined && existing.priority !== nextPriority
            ? 'team.task_priority_changed'
            : body?.assigneeId !== undefined && existing.assigned_to !== body?.assigneeId
              ? 'team.task_assigned'
              : body?.dueDate !== undefined && String(existing.due_date || '') !== String(body?.dueDate || '')
                ? 'team.task_due_date_changed'
                : body?.progress !== undefined && Number(existing.progress || 0) !== nextProgress
                  ? 'team.task_progress_updated'
                  : 'team.task_updated';

    await this.logWorkspaceTaskEvent(teamId, userId, taskId, eventType, {
      title: result.rows[0]?.title,
      changes,
    });

    return result.rows[0];
  }

  async deleteWorkspaceTask(teamId: string, taskId: string, userId: string) {
    await this.ensureWorkspaceSchema();
    const result = await this.db.query(
      `DELETE FROM team_tasks WHERE id = $1 AND team_id = $2 RETURNING id,title`,
      [taskId, teamId],
    );
    if (!result.rows.length) throw new NotFoundException('Task not found.');
    await this.logWorkspaceTaskEvent(teamId, userId, taskId, 'team.task_deleted', {
      title: result.rows[0].title,
    });
    return { deleted: true };
  }

  async logWorkspaceTime(teamId: string, taskId: string, userId: string, body: any) {
    await this.ensureWorkspaceSchema();
    const minutes = Math.max(0, Number(body?.minutes || 0));
    if (!minutes) throw new BadRequestException('Minutes must be greater than 0.');

    const taskResult = await this.db.query(
      `SELECT id,project_id,title FROM team_tasks WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [taskId, teamId],
    );
    const task = taskResult.rows[0];
    if (!task) throw new NotFoundException('Task not found.');

    const result = await this.db.query(
      `
      INSERT INTO team_time_entries
        (team_id,task_id,project_id,user_id,minutes,note,started_at,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      [
        teamId,
        taskId,
        task.project_id || null,
        userId,
        minutes,
        body?.note || null,
        body?.startedAt || null,
      ],
    );
    await this.logWorkspaceTaskEvent(teamId, userId, taskId, 'team.time_logged', {
      title: task.title,
      minutes,
      note: body?.note || null,
    });
    return result.rows[0];
  }


  async getWorkspaceTimeTracking(
    teamId: string,
    query: any = {},
  ) {
    await this.ensureWorkspaceSchema();

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['te.team_id = $1'];
    const values: any[] = [teamId];
    let i = 2;

    const add = (sql: string, value: any) => {
      conditions.push(sql.replace('?', `$${i}`));
      values.push(value);
      i += 1;
    };

    if (query.member && query.member !== 'all') add('te.user_id = ?', query.member);
    if (query.project && query.project !== 'all') add('te.project_id = ?', query.project);
    if (query.task && query.task !== 'all') add('te.task_id = ?', query.task);
    if (query.dateFrom) add('COALESCE(te.started_at, te.created_at) >= ?::timestamptz', query.dateFrom);
    if (query.dateTo) add("COALESCE(te.started_at, te.created_at) < (?::date + INTERVAL '1 day')", query.dateTo);
    if (query.q) {
      conditions.push(`(
        COALESCE(tt.title,'') ILIKE $${i}
        OR COALESCE(p.name,'') ILIKE $${i}
        OR COALESCE(u.name,u.email,'') ILIKE $${i}
        OR COALESCE(te.note,'') ILIKE $${i}
      )`);
      values.push(`%${String(query.q).trim()}%`);
      i += 1;
    }

    const where = conditions.join(' AND ');

    const [countResult, rowsResult, summaryResult, memberResult, projectResult, taskResult] =
      await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int AS total
             FROM team_time_entries te
             LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
             LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
             LEFT JOIN users u ON u.id = te.user_id
            WHERE ${where}`,
          values,
        ),
        this.db.query(
          `SELECT
             te.id,
             te.team_id AS "teamId",
             te.task_id AS "taskId",
             tt.title AS "taskName",
             te.project_id AS "projectId",
             p.name AS "projectName",
             te.user_id AS "userId",
             COALESCE(u.name,u.email) AS "memberName",
             te.minutes,
             te.note,
             te.started_at AS "startedAt",
             te.created_at AS "createdAt"
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
           LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
           LEFT JOIN users u ON u.id = te.user_id
           WHERE ${where}
           ORDER BY COALESCE(te.started_at,te.created_at) DESC
           LIMIT $${i} OFFSET $${i + 1}`,
          [...values, limit, offset],
        ),
        this.db.query(
          `SELECT
             COALESCE(SUM(te.minutes),0)::int AS "totalMinutes",
             COUNT(*)::int AS "entryCount",
             COUNT(DISTINCT te.user_id)::int AS "activeMembers",
             COUNT(DISTINCT te.project_id) FILTER (WHERE te.project_id IS NOT NULL)::int AS "projectsTracked",
             COUNT(DISTINCT te.task_id) FILTER (WHERE te.task_id IS NOT NULL)::int AS "tasksTracked"
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
           LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
           LEFT JOIN users u ON u.id = te.user_id
           WHERE ${where}`,
          values,
        ),
        this.db.query(
          `SELECT
             te.user_id AS id,
             COALESCE(u.name,u.email) AS name,
             COALESCE(SUM(te.minutes),0)::int AS minutes,
             COUNT(*)::int AS entries
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
           LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
           LEFT JOIN users u ON u.id = te.user_id
           WHERE ${where}
           GROUP BY te.user_id,u.name,u.email
           ORDER BY minutes DESC`,
          values,
        ),
        this.db.query(
          `SELECT
             te.project_id AS id,
             COALESCE(p.name,'No project') AS name,
             COALESCE(SUM(te.minutes),0)::int AS minutes,
             COUNT(*)::int AS entries
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
           LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
           LEFT JOIN users u ON u.id = te.user_id
           WHERE ${where}
           GROUP BY te.project_id,p.name
           ORDER BY minutes DESC`,
          values,
        ),
        this.db.query(
          `SELECT
             te.task_id AS id,
             COALESCE(tt.title,'No task') AS name,
             COALESCE(SUM(te.minutes),0)::int AS minutes,
             COUNT(*)::int AS entries
           FROM team_time_entries te
           LEFT JOIN team_tasks tt ON tt.id = te.task_id AND tt.team_id = te.team_id
           LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
           LEFT JOIN users u ON u.id = te.user_id
           WHERE ${where}
           GROUP BY te.task_id,tt.title
           ORDER BY minutes DESC
           LIMIT 20`,
          values,
        ),
      ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const summary = summaryResult.rows[0] || {};

    return {
      summary: {
        totalMinutes: Number(summary.totalMinutes || 0),
        hoursLogged: Number((Number(summary.totalMinutes || 0) / 60).toFixed(1)),
        entryCount: Number(summary.entryCount || 0),
        activeMembers: Number(summary.activeMembers || 0),
        projectsTracked: Number(summary.projectsTracked || 0),
        tasksTracked: Number(summary.tasksTracked || 0),
      },
      byMember: memberResult.rows,
      byProject: projectResult.rows,
      byTask: taskResult.rows,
      data: rowsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getWorkspaceReports(teamId: string, query: any = {}) {
    await this.ensureWorkspaceSchema();

    const dateFrom = query.dateFrom || null;
    const dateTo = query.dateTo || null;

    const taskDateWhere = `
      team_id = $1
      AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
      AND ($3::date IS NULL OR created_at < ($3::date + INTERVAL '1 day'))
    `;
    const timeDateWhere = `
      team_id = $1
      AND ($2::timestamptz IS NULL OR COALESCE(started_at,created_at) >= $2::timestamptz)
      AND ($3::date IS NULL OR COALESCE(started_at,created_at) < ($3::date + INTERVAL '1 day'))
    `;

    const [
      summaryResult,
      statusResult,
      priorityResult,
      memberResult,
      projectResult,
      timeMemberResult,
      timeProjectResult,
      trendResult,
      activityResult,
      deadlineResult,
    ] = await Promise.all([
      this.db.query(
        `SELECT
           COUNT(*)::int AS "tasksCreated",
           COUNT(*) FILTER (WHERE status = 'completed')::int AS "tasksCompleted",
           COUNT(*) FILTER (
             WHERE status = 'completed'
               AND due_date IS NOT NULL
               AND completed_at IS NOT NULL
               AND completed_at <= due_date
           )::int AS "completedOnTime",
           COUNT(*) FILTER (
             WHERE status = 'completed'
               AND due_date IS NOT NULL
               AND completed_at IS NOT NULL
           )::int AS "completedWithDue",
           COALESCE(AVG(progress),0)::numeric(10,1) AS "avgProgress"
         FROM team_tasks
         WHERE ${taskDateWhere}`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT status AS key,COUNT(*)::int AS count
         FROM team_tasks
         WHERE ${taskDateWhere}
         GROUP BY status ORDER BY count DESC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT priority AS key,COUNT(*)::int AS count
         FROM team_tasks
         WHERE ${taskDateWhere}
         GROUP BY priority ORDER BY count DESC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT
           tm.user_id AS id,
           COALESCE(u.name,u.email) AS name,
           COUNT(tt.id)::int AS assigned,
           COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS completed,
           COUNT(tt.id) FILTER (
             WHERE tt.status = 'completed'
               AND tt.due_date IS NOT NULL
               AND tt.completed_at <= tt.due_date
           )::int AS "completedOnTime",
           COALESCE(AVG(tt.progress),0)::numeric(10,1) AS "avgProgress"
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         LEFT JOIN team_tasks tt
           ON tt.team_id = tm.team_id
          AND tt.assigned_to = tm.user_id
          AND ($2::timestamptz IS NULL OR tt.created_at >= $2::timestamptz)
          AND ($3::date IS NULL OR tt.created_at < ($3::date + INTERVAL '1 day'))
         WHERE tm.team_id = $1 AND tm.status = 'active'
         GROUP BY tm.user_id,u.name,u.email
         ORDER BY completed DESC,assigned DESC,name ASC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT
           p.id,p.name,
           COUNT(tt.id)::int AS tasks,
           COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS completed,
           COALESCE(AVG(tt.progress),0)::numeric(10,1) AS "avgProgress"
         FROM projects p
         LEFT JOIN team_tasks tt
           ON tt.project_id = p.id
          AND tt.team_id = p.team_id
          AND ($2::timestamptz IS NULL OR tt.created_at >= $2::timestamptz)
          AND ($3::date IS NULL OR tt.created_at < ($3::date + INTERVAL '1 day'))
         WHERE p.team_id = $1
         GROUP BY p.id,p.name
         ORDER BY completed DESC,tasks DESC,p.name ASC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT te.user_id AS id,COALESCE(u.name,u.email) AS name,
                COALESCE(SUM(te.minutes),0)::int AS minutes
         FROM team_time_entries te
         JOIN users u ON u.id = te.user_id
         WHERE ${timeDateWhere}
         GROUP BY te.user_id,u.name,u.email
         ORDER BY minutes DESC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT te.project_id AS id,COALESCE(p.name,'No project') AS name,
                COALESCE(SUM(te.minutes),0)::int AS minutes
         FROM team_time_entries te
         LEFT JOIN projects p ON p.id = te.project_id AND p.team_id = te.team_id
         WHERE ${timeDateWhere}
         GROUP BY te.project_id,p.name
         ORDER BY minutes DESC`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT
           TO_CHAR(day,'YYYY-MM-DD') AS date,
           COUNT(tt.id)::int AS created,
           COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS completed
         FROM generate_series(
           CURRENT_DATE - INTERVAL '13 days',
           CURRENT_DATE,
           INTERVAL '1 day'
         ) day
         LEFT JOIN team_tasks tt
           ON tt.team_id = $1
          AND tt.created_at >= day
          AND tt.created_at < day + INTERVAL '1 day'
         GROUP BY day
         ORDER BY day ASC`,
        [teamId],
      ),
      this.db.query(
        `SELECT
           e.id,
           e.event_type AS "eventType",
           e.entity_id AS "entityId",
           e.metadata,
           e.created_at AS "createdAt",
           COALESCE(u.name,u.email) AS "userName"
         FROM events e
         LEFT JOIN users u ON u.id = e.user_id
         WHERE e.team_id = $1
           AND (e.event_type LIKE 'team.task_%' OR e.event_type = 'team.time_logged')
           AND ($2::timestamptz IS NULL OR e.created_at >= $2::timestamptz)
           AND ($3::date IS NULL OR e.created_at < ($3::date + INTERVAL '1 day'))
         ORDER BY e.created_at DESC
         LIMIT 20`,
        [teamId, dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT tt.id,tt.title AS name,p.name AS project,
                tt.due_date AS "dueDate",tt.status,tt.priority,
                COALESCE(u.name,u.email) AS assignee
         FROM team_tasks tt
         LEFT JOIN projects p ON p.id = tt.project_id AND p.team_id = tt.team_id
         LEFT JOIN users u ON u.id = tt.assigned_to
         WHERE tt.team_id = $1
           AND tt.status NOT IN ('completed','cancelled')
           AND tt.due_date IS NOT NULL
           AND tt.due_date >= NOW() - INTERVAL '1 day'
         ORDER BY tt.due_date ASC
         LIMIT 20`,
        [teamId],
      ),
    ]);

    const s = summaryResult.rows[0] || {};
    const totalTime = timeMemberResult.rows.reduce(
      (sum: number, row: any) => sum + Number(row.minutes || 0),
      0,
    );

    const memberTimeMap = new Map(
      timeMemberResult.rows.map((row: any) => [String(row.id), Number(row.minutes || 0)]),
    );

    const members = memberResult.rows.map((row: any) => {
      const assigned = Number(row.assigned || 0);
      const completed = Number(row.completed || 0);
      const completedOnTime = Number(row.completedOnTime || 0);
      return {
        ...row,
        assigned,
        completed,
        completedOnTime,
        avgProgress: Number(row.avgProgress || 0),
        completionRate: assigned ? Number(((completed / assigned) * 100).toFixed(1)) : 0,
        onTimeRate: completed ? Number(((completedOnTime / completed) * 100).toFixed(1)) : 0,
        loggedMinutes: memberTimeMap.get(String(row.id)) || 0,
      };
    });

    const projectTimeMap = new Map(
      timeProjectResult.rows.map((row: any) => [String(row.id), Number(row.minutes || 0)]),
    );
    const projects = projectResult.rows.map((row: any) => ({
      ...row,
      tasks: Number(row.tasks || 0),
      completed: Number(row.completed || 0),
      avgProgress: Number(row.avgProgress || 0),
      loggedMinutes: projectTimeMap.get(String(row.id)) || 0,
    }));

    const tasksCreated = Number(s.tasksCreated || 0);
    const tasksCompleted = Number(s.tasksCompleted || 0);
    const completedWithDue = Number(s.completedWithDue || 0);
    const completedOnTime = Number(s.completedOnTime || 0);

    return {
      summary: {
        tasksCreated,
        tasksCompleted,
        completionRate: tasksCreated
          ? Number(((tasksCompleted / tasksCreated) * 100).toFixed(1))
          : 0,
        onTimeRate: completedWithDue
          ? Number(((completedOnTime / completedWithDue) * 100).toFixed(1))
          : 0,
        avgProgress: Number(s.avgProgress || 0),
        totalMinutes: totalTime,
        hoursLogged: Number((totalTime / 60).toFixed(1)),
      },
      tasksByStatus: statusResult.rows,
      tasksByPriority: priorityResult.rows,
      members,
      projects,
      timeByMember: timeMemberResult.rows,
      timeByProject: timeProjectResult.rows,
      trend: trendResult.rows,
      recentActivity: activityResult.rows,
      upcomingDeadlines: deadlineResult.rows,
    };
  }

  async getWorkspaceProjects(teamId: string) {
    await this.ensureWorkspaceSchema();
    const result = await this.db.query(
      `
      SELECT
        p.id,p.name,p.description,p.status,p.priority,p.progress,
        p.owner_id AS "ownerId",COALESCE(u.name,u.email) AS "ownerName",
        p.start_date AS "startDate",p.due_date AS "dueDate",
        p.created_at AS "createdAt",p.updated_at AS "updatedAt",
        COUNT(tt.id)::int AS "taskCount",
        COUNT(tt.id) FILTER (WHERE tt.status = 'completed')::int AS "completedTasks"
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      LEFT JOIN team_tasks tt ON tt.project_id = p.id AND tt.team_id = p.team_id
      WHERE p.team_id = $1
      GROUP BY p.id,u.name,u.email
      ORDER BY p.updated_at DESC NULLS LAST,p.created_at DESC
      `,
      [teamId],
    );
    return { data: result.rows };
  }

  async createWorkspaceProject(teamId: string, userId: string, body: any) {
    await this.ensureWorkspaceSchema();
    const name = String(body?.name || '').trim();
    if (!name) throw new BadRequestException('Project name is required.');

    const result = await this.db.query(
      `
      INSERT INTO projects
        (team_id,name,description,status,priority,owner_id,start_date,due_date,progress,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      RETURNING
        id,team_id AS "teamId",name,description,status,priority,
        owner_id AS "ownerId",start_date AS "startDate",due_date AS "dueDate",
        progress,created_at AS "createdAt",updated_at AS "updatedAt"
      `,
      [
        teamId,
        name,
        body?.description || null,
        String(body?.status || 'active').toLowerCase(),
        this.normalizeWorkspacePriority(body?.priority),
        body?.ownerId || userId,
        body?.startDate || null,
        body?.dueDate || null,
        Math.max(0, Math.min(100, Number(body?.progress || 0))),
      ],
    );

    try {
      await this.db.query(
        `INSERT INTO events
           (team_id,user_id,event_type,entity_type,entity_id,metadata,created_at)
         VALUES ($1,$2,'team.project_created','project',$3,$4::jsonb,NOW())`,
        [teamId,userId,result.rows[0].id,JSON.stringify({ title: name })],
      );
    } catch (_) {}

    return result.rows[0];
  }

    async getWorkspaceProjectDetail(
    teamId: string,
    projectId: string,
  ) {
    await this.ensureWorkspaceSchema();

    const projectResult = await this.db.query(
      `
      SELECT
        p.id,
        p.team_id AS "teamId",
        p.name,
        p.description,
        p.status,
        p.priority,
        p.progress,

        p.owner_id AS "ownerId",
        COALESCE(owner.name, owner.email) AS "ownerName",

        p.start_date AS "startDate",
        p.due_date AS "dueDate",

        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",

        COUNT(DISTINCT tt.id)::int AS "taskCount",

        COUNT(DISTINCT tt.id)
          FILTER (
            WHERE tt.status = 'completed'
          )::int AS "completedTasks",

        COUNT(DISTINCT tt.id)
          FILTER (
            WHERE tt.status NOT IN ('completed', 'cancelled')
          )::int AS "openTasks",

        COUNT(DISTINCT tt.id)
          FILTER (
            WHERE
              tt.status NOT IN ('completed', 'cancelled')
              AND tt.due_date IS NOT NULL
              AND tt.due_date < NOW()
          )::int AS "overdueTasks",

        COALESCE(
          (
            SELECT SUM(te.minutes)
            FROM team_time_entries te
            WHERE
              te.team_id = p.team_id
              AND te.project_id = p.id
          ),
          0
        )::int AS "loggedMinutes"

      FROM projects p

      LEFT JOIN users owner
        ON owner.id = p.owner_id

      LEFT JOIN team_tasks tt
        ON tt.project_id = p.id
        AND tt.team_id = p.team_id

      WHERE
        p.id = $1
        AND p.team_id = $2

      GROUP BY
        p.id,
        owner.name,
        owner.email

      LIMIT 1
      `,
      [projectId, teamId],
    );

    const project = projectResult.rows[0];

    if (!project) {
      throw new NotFoundException("Project not found.");
    }

    /*
     * Tasks belonging to this project.
     *
     * We intentionally use team_id + project_id so a project
     * can never expose another team's tasks.
     */
    const tasksResult = await this.db.query(
      `
      SELECT
        tt.id,

        tt.project_id AS "projectId",

        tt.title AS name,
        tt.title,

        tt.description,

        tt.status,
        tt.priority,

        tt.task_type AS "taskType",

        tt.assigned_to AS "assigneeId",

        COALESCE(
          assignee.name,
          assignee.email
        ) AS assignee,

        tt.due_date AS "dueDate",

        tt.progress,

        tt.estimated_minutes AS "estimatedMinutes",

        tt.labels,

        tt.created_by AS "createdBy",

        tt.completed_at AS "completedAt",

        tt.created_at AS "createdAt",

        tt.updated_at AS "updatedAt",

        COALESCE(
          (
            SELECT SUM(te.minutes)
            FROM team_time_entries te
            WHERE
              te.team_id = tt.team_id
              AND te.task_id = tt.id
          ),
          0
        )::int AS "loggedMinutes"

      FROM team_tasks tt

      LEFT JOIN users assignee
        ON assignee.id = tt.assigned_to

      WHERE
        tt.team_id = $1
        AND tt.project_id = $2

      ORDER BY
        CASE
          WHEN tt.status = 'completed' THEN 1
          ELSE 0
        END,

        CASE
          WHEN tt.due_date IS NULL THEN 1
          ELSE 0
        END,

        tt.due_date ASC,

        tt.updated_at DESC
      `,
      [teamId, projectId],
    );

    /*
     * Time tracking entries for this project.
     */
    const timeResult = await this.db.query(
      `
      SELECT
        te.id,

        te.task_id AS "taskId",

        tt.title AS "taskName",

        te.user_id AS "userId",

        COALESCE(
          u.name,
          u.email
        ) AS "userName",

        te.minutes,

        te.note,

        te.started_at AS "startedAt",

        te.created_at AS "createdAt"

      FROM team_time_entries te

      LEFT JOIN team_tasks tt
        ON tt.id = te.task_id
        AND tt.team_id = te.team_id

      LEFT JOIN users u
        ON u.id = te.user_id

      WHERE
        te.team_id = $1
        AND te.project_id = $2

      ORDER BY
        COALESCE(
          te.started_at,
          te.created_at
        ) DESC

      LIMIT 100
      `,
      [teamId, projectId],
    );

    return {
      ...project,

      taskCount: Number(project.taskCount || 0),

      completedTasks: Number(
        project.completedTasks || 0,
      ),

      openTasks: Number(
        project.openTasks || 0,
      ),

      overdueTasks: Number(
        project.overdueTasks || 0,
      ),

      loggedMinutes: Number(
        project.loggedMinutes || 0,
      ),

      loggedHours: Number(
        (
          Number(project.loggedMinutes || 0) / 60
        ).toFixed(1),
      ),

      tasks: tasksResult.rows,

      timeEntries: timeResult.rows,
    };
  }


  async updateWorkspaceProject(
    teamId: string,
    projectId: string,
    userId: string,
    body: any,
  ) {
    await this.ensureWorkspaceSchema();

    const existingResult = await this.db.query(
      `
      SELECT *
      FROM projects
      WHERE
        id = $1
        AND team_id = $2
      LIMIT 1
      `,
      [projectId, teamId],
    );

    const existing = existingResult.rows[0];

    if (!existing) {
      throw new NotFoundException("Project not found.");
    }

    /*
     * Validate owner.
     *
     * ownerId must belong to this team.
     */
    if (body?.ownerId) {
      const memberResult = await this.db.query(
        `
        SELECT 1
        FROM team_members
        WHERE
          team_id = $1
          AND user_id = $2
          AND status = 'active'
        LIMIT 1
        `,
        [teamId, body.ownerId],
      );

      if (!memberResult.rows.length) {
        throw new BadRequestException(
          "Project owner must be an active team member.",
        );
      }
    }

    const name =
      body?.name !== undefined
        ? String(body.name || "").trim()
        : existing.name;

    if (!name) {
      throw new BadRequestException(
        "Project name is required.",
      );
    }

    const status =
      body?.status !== undefined
        ? String(body.status || "active")
            .trim()
            .toLowerCase()
        : existing.status;

    const priority =
      body?.priority !== undefined
        ? this.normalizeWorkspacePriority(
            body.priority,
          )
        : existing.priority;

    const progress =
      body?.progress !== undefined
        ? Math.max(
            0,
            Math.min(
              100,
              Number(body.progress || 0),
            ),
          )
        : Number(existing.progress || 0);

    const result = await this.db.query(
      `
      UPDATE projects

      SET
        name = $3,

        description = $4,

        status = $5,

        priority = $6,

        owner_id = $7,

        start_date = $8,

        due_date = $9,

        progress = $10,

        updated_at = NOW()

      WHERE
        id = $1
        AND team_id = $2

      RETURNING
        id,

        team_id AS "teamId",

        name,

        description,

        status,

        priority,

        owner_id AS "ownerId",

        start_date AS "startDate",

        due_date AS "dueDate",

        progress,

        created_at AS "createdAt",

        updated_at AS "updatedAt"
      `,
      [
        projectId,
        teamId,

        name,

        body?.description !== undefined
          ? body.description || null
          : existing.description,

        status,

        priority,

        body?.ownerId !== undefined
          ? body.ownerId || null
          : existing.owner_id,

        body?.startDate !== undefined
          ? body.startDate || null
          : existing.start_date,

        body?.dueDate !== undefined
          ? body.dueDate || null
          : existing.due_date,

        progress,
      ],
    );

    const updated = result.rows[0];

    /*
     * Determine which fields changed for Recent Activity.
     */
    const changes: Record<string, any> = {};

    if (existing.name !== updated.name) {
      changes.name = {
        from: existing.name,
        to: updated.name,
      };
    }

    if (existing.status !== updated.status) {
      changes.status = {
        from: existing.status,
        to: updated.status,
      };
    }

    if (existing.priority !== updated.priority) {
      changes.priority = {
        from: existing.priority,
        to: updated.priority,
      };
    }

    if (
      Number(existing.progress || 0) !==
      Number(updated.progress || 0)
    ) {
      changes.progress = {
        from: Number(existing.progress || 0),
        to: Number(updated.progress || 0),
      };
    }

    if (
      String(existing.owner_id || "") !==
      String(updated.ownerId || "")
    ) {
      changes.ownerId = {
        from: existing.owner_id,
        to: updated.ownerId,
      };
    }

    if (
      String(existing.due_date || "") !==
      String(updated.dueDate || "")
    ) {
      changes.dueDate = {
        from: existing.due_date,
        to: updated.dueDate,
      };
    }

    /*
     * Record project activity.
     */
    try {
      await this.db.query(
        `
        INSERT INTO events (
          team_id,
          user_id,
          event_type,
          entity_type,
          entity_id,
          metadata,
          created_at
        )

        VALUES (
          $1,
          $2,
          'team.project_updated',
          'project',
          $3,
          $4::jsonb,
          NOW()
        )
        `,
        [
          teamId,
          userId,
          projectId,
          JSON.stringify({
            title: updated.name,
            changes,
          }),
        ],
      );
    } catch (error) {
      this.logger.warn(
        `Unable to log project update activity: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }

    return updated;
  }


  async deleteWorkspaceProject(
    teamId: string,
    projectId: string,
    userId: string,
  ) {
    await this.ensureWorkspaceSchema();

    const projectResult = await this.db.query(
      `
      SELECT
        id,
        name
      FROM projects
      WHERE
        id = $1
        AND team_id = $2
      LIMIT 1
      `,
      [projectId, teamId],
    );

    const project = projectResult.rows[0];

    if (!project) {
      throw new NotFoundException(
        "Project not found.",
      );
    }

    /*
     * IMPORTANT:
     *
     * We do NOT delete project tasks.
     *
     * Tasks remain in Team Workspace and simply become
     * unassigned from this project.
     *
     * This prevents accidental task/history loss.
     */

    const client = await this.db.getClient();

    try {
      await client.query("BEGIN");

      /*
       * Preserve time history but remove project relationship.
       */
      await client.query(
        `
        UPDATE team_time_entries
        SET project_id = NULL
        WHERE
          team_id = $1
          AND project_id = $2
        `,
        [teamId, projectId],
      );

      /*
       * Preserve tasks.
       */
      await client.query(
        `
        UPDATE team_tasks

        SET
          project_id = NULL,
          updated_at = NOW()

        WHERE
          team_id = $1
          AND project_id = $2
        `,
        [teamId, projectId],
      );

      await client.query(
        `
        DELETE FROM projects
        WHERE
          id = $1
          AND team_id = $2
        `,
        [projectId, teamId],
      );

      /*
       * Project deletion activity.
       */
      await client.query(
        `
        INSERT INTO events (
          team_id,
          user_id,
          event_type,
          entity_type,
          entity_id,
          metadata,
          created_at
        )

        VALUES (
          $1,
          $2,
          'team.project_deleted',
          'project',
          $3,
          $4::jsonb,
          NOW()
        )
        `,
        [
          teamId,
          userId,
          projectId,
          JSON.stringify({
            title: project.name,
          }),
        ],
      );

      await client.query("COMMIT");

      return {
        deleted: true,
        projectId,
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}

      throw error;
    } finally {
      client.release();
    }
  }
}