import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type QrSessionStatus =
  | "pending"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

@Injectable()
export class WhatsAppQrSessionService {
  constructor(private readonly db: DatabaseService) {}

  async getOrCreateByUserId(userId: string): Promise<{
    id: string;
    user_id: string;
    phone: string | null;
    status: QrSessionStatus;
  }> {
    const { rows } = await this.db.query(
      `INSERT INTO whatsapp_qr_sessions (user_id, status, updated_at)
       VALUES ($1, 'pending', NOW())
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING id, user_id, phone, status`,
      [userId],
    );
    if (rows.length) return rows[0];
    const r2 = await this.db.query(
      `SELECT id, user_id, phone, status FROM whatsapp_qr_sessions WHERE user_id = $1`,
      [userId],
    );
    return r2.rows[0];
  }

  async findByUserId(userId: string): Promise<{
    id: string;
    user_id: string;
    phone: string | null;
    status: string;
    connected_at: string | null;
    updated_at: string;
  } | null> {
    const { rows } = await this.db.query(
      `SELECT id, user_id, phone, status, connected_at, updated_at FROM whatsapp_qr_sessions WHERE user_id = $1`,
      [userId],
    );
    return rows.length ? rows[0] : null;
  }

  async setStatus(
    sessionId: string,
    status: QrSessionStatus,
    phone?: string | null,
  ): Promise<void> {
    const statusVar = status as string;
    if (phone != null) {
      await this.db.query(
        `UPDATE whatsapp_qr_sessions SET status = $2::varchar, phone = $3::varchar,
         connected_at = CASE WHEN $2::varchar = 'connected' AND connected_at IS NULL THEN NOW() ELSE connected_at END,
         disconnected_at = CASE WHEN $2::varchar = 'disconnected' THEN NOW() ELSE disconnected_at END,
         updated_at = NOW() WHERE id = $1`,
        [sessionId, statusVar, phone],
      );
    } else {
      await this.db.query(
        `UPDATE whatsapp_qr_sessions SET status = $2::varchar,
         connected_at = CASE WHEN $2::varchar = 'connected' AND connected_at IS NULL THEN NOW() ELSE connected_at END,
         disconnected_at = CASE WHEN $2::varchar = 'disconnected' THEN NOW() ELSE disconnected_at END,
         updated_at = NOW() WHERE id = $1`,
        [sessionId, statusVar],
      );
    }
  }

  async touchLastQrAt(sessionId: string): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp_qr_sessions SET last_qr_at = NOW(), status = 'connecting', updated_at = NOW() WHERE id = $1`,
      [sessionId],
    );
  }

  async findBestConnectedSession(params: {
    conversationSessionId?: string | null;
    conversationUserId?: string | null;
    requestUserId: string;
    teamId?: string | null;
  }): Promise<{
    id: string;
    user_id: string;
    phone: string | null;
    status: string;
    connected_at: string | null;
    updated_at: string;
  } | null> {
    const { conversationSessionId, conversationUserId, requestUserId, teamId } =
      params;

    const { rows } = await this.db.query(
      `
    SELECT
      session.id,
      session.user_id,
      session.phone,
      session.status,
      session.connected_at,
      session.updated_at
    FROM whatsapp_qr_sessions session
    INNER JOIN users account_user
      ON account_user.id = session.user_id
    WHERE session.status = 'connected'
      AND (
        session.id IS NOT DISTINCT FROM $1
        OR session.user_id IS NOT DISTINCT FROM $2
        OR session.user_id = $3
        OR (
          $4::uuid IS NOT NULL
          AND account_user.team_id = $4
        )
      )

    ORDER BY
      CASE
        WHEN session.id IS NOT DISTINCT FROM $1
          THEN 1
        WHEN session.user_id IS NOT DISTINCT FROM $2
          THEN 2
        WHEN session.user_id = $3
          THEN 3
        ELSE 4
      END,
      session.connected_at DESC NULLS LAST,
      session.updated_at DESC

    LIMIT 1
    `,
      [
        conversationSessionId || null,
        conversationUserId || null,
        requestUserId,
        teamId || null,
      ],
    );

    return rows[0] || null;
  }
}
