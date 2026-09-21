import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { SettingsService } from "../settings/settings.service";

export interface CreateNotificationDto {
  teamId: string;

  userId?: string | null;

  actorUserId?: string | null;

  type: string;

  category?: string;

  priority?: string;

  title: string;

  message?: string;

  url?: string;

  entityType?: string;

  entityId?: string;

  icon?: string;

  imageUrl?: string;

  actionLabel?: string;

  actionUrl?: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly settings: SettingsService,
  ) {}

  private preferenceKey(type?: string, category?: string): any {
    const t = String(type || "").toLowerCase();
    const c = String(category || "").toLowerCase();
    if (t === "lead.assigned") return "newLeadAssigned";
    if (t.includes("whatsapp") || t.includes("message")) return "newCustomerMessage";
    if (t.includes("appointment") || t.includes("booking")) return "appointmentUpdates";
    if (t.includes("task") || t.includes("deadline")) return "taskUpdates";
    if (t.startsWith("deal.") || t.includes("pipeline") || t.includes("stage")) return "pipelineChanges";
    if (t.includes("handoff") || t.includes("escalat") || c === "ai") return "aiHumanAssistance";
    if (t.startsWith("payment.") || t.startsWith("subscription.") || c === "payment" || c === "subscription") return "billingAccountAlerts";
    if (t.startsWith("team.") || c === "team") return "importantTeamActivity";
    return null;
  }

  private async inAppAllowed(userId: string, row: any) {
    const key = this.preferenceKey(row?.type, row?.category);
    if (!key) return true;
    return this.settings.notificationAllowed(userId, key, "inApp");
  }

  async create(dto: CreateNotificationDto) {
    await this.db.query(
      `
      INSERT INTO team_notifications (
        team_id,
        user_id,
        actor_user_id,
        type,
        category,
        priority,
        title,
        message,
        url,
        entity_type,
        entity_id,
        icon,
        image_url,
        action_label,
        action_url,
        metadata,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,
        NOW()
      )
      `,
      [
        dto.teamId,
        dto.userId || null,
        dto.actorUserId || null,
        dto.type,
        dto.category || null,
        dto.priority || "normal",
        dto.title,
        dto.message || null,
        dto.url || null,
        dto.entityType || null,
        dto.entityId || null,
        dto.icon || null,
        dto.imageUrl || null,
        dto.actionLabel || null,
        dto.actionUrl || null,
        JSON.stringify(dto.metadata || {}),
      ],
    );
  }

  async markAsRead(notificationId: string, teamId: string, userId: string) {
    await this.db.query(
      `
      UPDATE team_notifications
      SET
        is_read = true,
        read_at = NOW()
      WHERE id = $1
      AND team_id = $2
      AND (
        user_id IS NULL
        OR user_id = $3
      )
      `,
      [notificationId, teamId, userId],
    );
  }

  async markAllAsRead(teamId: string, userId: string) {
    await this.db.query(
      `
      UPDATE team_notifications
      SET
        is_read = true,
        read_at = NOW()
      WHERE team_id = $1
      AND (
        user_id IS NULL
        OR user_id = $2
      )
      `,
      [teamId, userId],
    );
  }

  async getNotifications(teamId: string, userId: string, limit = 20) {
    const result = await this.db.query(
      `
    SELECT
      n.id,

      n.team_id as "teamId",

      n.user_id as "userId",

      n.actor_user_id as "actorUserId",

      n.type,

      n.category,

      n.priority,

      n.title,

      n.message,

      n.url,

      n.entity_type as "entityType",

      n.entity_id as "entityId",

      n.icon,

      n.image_url as "imageUrl",

      n.action_label as "actionLabel",

      n.action_url as "actionUrl",

      n.is_read as "isRead",

      n.read_at as "readAt",

      n.metadata,

      n.created_at as "createdAt",

      u.name as "actorName",

      u.avatar_url as "actorAvatar"

    FROM team_notifications n

    LEFT JOIN users u
      ON u.id = n.actor_user_id

    WHERE n.team_id = $1

    AND n.deleted_at IS NULL

    AND (
      n.user_id IS NULL
      OR n.user_id = $2
    )

    ORDER BY n.created_at DESC

    LIMIT $3
    `,
      [teamId, userId, Math.max(limit * 4, limit)],
    );

    const visible: any[] = [];
    for (const row of result.rows) {
      if (await this.inAppAllowed(userId, row)) visible.push(row);
      if (visible.length >= limit) break;
    }
    return visible;
  }
 
  async getTeamNotifications(teamId: string, limit = 50) {
    const result = await this.db.query(
      `
    SELECT
      n.id,

      n.team_id as "teamId",

      n.user_id as "userId",

      n.actor_user_id as "actorUserId",

      n.type,

      n.category,

      n.priority,

      n.title,

      n.message,

      n.url,

      n.entity_type as "entityType",

      n.entity_id as "entityId",

      n.icon,

      n.image_url as "imageUrl",

      n.action_label as "actionLabel",

      n.action_url as "actionUrl",

      n.is_read as "isRead",

      n.read_at as "readAt",

      n.metadata,

      n.created_at as "createdAt"

    FROM team_notifications n

    WHERE n.team_id = $1

    AND n.deleted_at IS NULL

    ORDER BY n.created_at DESC

    LIMIT $2
    `,
      [teamId, limit],
    );

    return result.rows;
  }

  async getUnreadCount(teamId: string, userId: string) {
    const result = await this.db.query(
      `SELECT type, category
       FROM team_notifications
       WHERE team_id = $1
         AND (user_id IS NULL OR user_id = $2)
         AND is_read = false
         AND deleted_at IS NULL`,
      [teamId, userId],
    );
    let total = 0;
    for (const row of result.rows) {
      if (await this.inAppAllowed(userId, row)) total += 1;
    }
    return total;
  }
  async markNotificationAsRead(
    teamId: string,
    notificationId: string,
    userId: string,
  ) {
    await this.markAsRead(notificationId, teamId, userId);

    return {
      success: true,
    };
  }

  async markAllNotificationsAsRead(teamId: string, userId: string) {
    await this.markAllAsRead(teamId, userId);

    return {
      success: true,
    };
  }
}
