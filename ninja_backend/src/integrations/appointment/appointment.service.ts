import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class AppointmentService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async get(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM appointment_integrations
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    return rows[0] || null;
  }

  async save(teamId: string, body: any) {
    await this.db.query(
      `
      INSERT INTO appointment_integrations (
        team_id,
        provider,
        booking_enabled,
        property_tours_enabled,
        auto_assign_agent,
        meeting_duration_minutes,
        buffer_minutes,
        timezone,
        notification_email
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9
      )
      ON CONFLICT (team_id)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        booking_enabled =
          EXCLUDED.booking_enabled,
        property_tours_enabled =
          EXCLUDED.property_tours_enabled,
        auto_assign_agent =
          EXCLUDED.auto_assign_agent,
        meeting_duration_minutes =
          EXCLUDED.meeting_duration_minutes,
        buffer_minutes =
          EXCLUDED.buffer_minutes,
        timezone =
          EXCLUDED.timezone,
        notification_email =
          EXCLUDED.notification_email
      `,
      [
        teamId,
        body.provider,
        body.bookingEnabled,
        body.propertyToursEnabled,
        body.autoAssignAgent,
        body.meetingDurationMinutes,
        body.bufferMinutes,
        body.timezone,
        body.notificationEmail,
      ],
    );

    return {
      success: true,
    };
  }
}