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
import { randomBytes } from "crypto";
@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  /**
   * Per-plan seat caps (Feature B). A team's tier lives on the OWNER's
   * `users.plan` ('solo' | 'team' | 'growth'). 'growth' is the $497 "Business"
   * tier. Anything unknown (trial / unpaid / no plan) falls back to the Solo cap.
   */
  private static readonly PLAN_SEAT_LIMITS: Record<string, number> = {
    solo: 1,
    team: 3,
    growth: 5,
  };

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
  ) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

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
        [invitationId, normalizedRole, token, requestingUserId, expiresAt],
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
   * Resolve the seat cap for a team from its plan tier. The tier lives on the
   * team OWNER's `users.plan` (falling back to `selected_plan`): solo=1, team=3,
   * growth=5. Trial / unpaid / unknown tiers default to the Solo cap (1).
   */
  async getTeamSeatLimit(teamId: string): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT LOWER(TRIM(COALESCE(u.plan, u.selected_plan, ''))) AS tier
       FROM teams t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1
       LIMIT 1`,
      [teamId],
    );
    const tier = rows[0]?.tier || "";
    const base = TeamsService.PLAN_SEAT_LIMITS[tier] ?? 1;

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
}
