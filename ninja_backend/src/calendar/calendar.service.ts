import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { GoogleCalendarService } from "../integrations/google-calendar/google-calendar.service";

const TYPES = ["showing", "consultation", "call", "meeting", "other"];
const STATUSES = ["pending", "confirmed", "completed", "canceled"];

@Injectable()
export class CalendarService {
  constructor(
    private readonly db: DatabaseService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  private serialize = (row: any) => ({
    id: row.id,
    teamId: row.team_id,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    leadId: row.lead_id,
    contactId: row.contact_id,
    title: row.title,
    type: row.type,
    status: row.status,
    location: row.location,
    notes: row.notes,
    attendeeName: row.attendee_name,
    attendeeEmail: row.attendee_email,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    allDay: row.all_day,
    googleEventId: row.google_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private toIso(value: any): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }

  async list(teamId: string, from?: string, to?: string) {
    const clauses = ["team_id = $1"];
    const params: any[] = [teamId];
    if (from) {
      params.push(from);
      clauses.push(`end_at >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      clauses.push(`start_at <= $${params.length}`);
    }

    const { rows } = await this.db.query(
      `
      SELECT *
      FROM appointments
      WHERE ${clauses.join(" AND ")}
      ORDER BY start_at ASC
      `,
      params,
    );

    return rows.map(this.serialize);
  }

  async stats(teamId: string, from?: string, to?: string) {
    const clauses = ["team_id = $1"];
    const params: any[] = [teamId];
    if (from) {
      params.push(from);
      clauses.push(`start_at >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      clauses.push(`start_at <= $${params.length}`);
    }

    const { rows } = await this.db.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'canceled')::int AS canceled
      FROM appointments
      WHERE ${clauses.join(" AND ")}
      `,
      params,
    );

    return rows[0];
  }

  async create(teamId: string, userId: string | null, body: any) {
    const type = TYPES.includes(body.type) ? body.type : "other";
    const status = STATUSES.includes(body.status) ? body.status : "pending";

    // Mirror to the team's connected Google Calendar (best-effort; a missing
    // connection or API error must not block creating the appointment).
    let googleEventId: string | null = null;
    try {
      const ev = await this.googleCalendar.createEvent(teamId, {
        summary: body.title,
        description: body.notes,
        location: body.location,
        startIso: body.startAt,
        endIso: body.endAt,
        timezone: body.timezone,
        attendees: body.attendeeEmail ? [body.attendeeEmail] : [],
      });
      googleEventId = ev?.id || null;
    } catch {
      googleEventId = null;
    }

    const { rows } = await this.db.query(
      `
      INSERT INTO appointments (
        team_id, created_by, assigned_to, lead_id, contact_id, title, type,
        status, location, notes, attendee_name, attendee_email, start_at,
        end_at, timezone, all_day, google_event_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
      `,
      [
        teamId,
        userId,
        body.assignedTo || null,
        body.leadId || null,
        body.contactId || null,
        body.title,
        type,
        status,
        body.location || null,
        body.notes || null,
        body.attendeeName || null,
        body.attendeeEmail || null,
        body.startAt,
        body.endAt,
        body.timezone || null,
        Boolean(body.allDay),
        googleEventId,
      ],
    );

    return this.serialize(rows[0]);
  }

  async update(teamId: string, id: string, body: any) {
    const existing = await this.getOwned(teamId, id);

    const next = {
      title: body.title !== undefined ? body.title : existing.title,
      type:
        body.type !== undefined
          ? TYPES.includes(body.type)
            ? body.type
            : "other"
          : existing.type,
      status:
        body.status !== undefined
          ? STATUSES.includes(body.status)
            ? body.status
            : existing.status
          : existing.status,
      location: body.location !== undefined ? body.location : existing.location,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      attendee_name:
        body.attendeeName !== undefined
          ? body.attendeeName
          : existing.attendee_name,
      attendee_email:
        body.attendeeEmail !== undefined
          ? body.attendeeEmail
          : existing.attendee_email,
      assigned_to:
        body.assignedTo !== undefined ? body.assignedTo : existing.assigned_to,
      start_at: body.startAt !== undefined ? body.startAt : existing.start_at,
      end_at: body.endAt !== undefined ? body.endAt : existing.end_at,
      timezone: body.timezone !== undefined ? body.timezone : existing.timezone,
      all_day:
        body.allDay !== undefined ? Boolean(body.allDay) : existing.all_day,
    };

    const { rows } = await this.db.query(
      `
      UPDATE appointments
      SET title=$1, type=$2, status=$3, location=$4, notes=$5, attendee_name=$6,
          attendee_email=$7, assigned_to=$8, start_at=$9, end_at=$10,
          timezone=$11, all_day=$12, updated_at=NOW()
      WHERE id=$13 AND team_id=$14
      RETURNING *
      `,
      [
        next.title,
        next.type,
        next.status,
        next.location,
        next.notes,
        next.attendee_name,
        next.attendee_email,
        next.assigned_to,
        next.start_at,
        next.end_at,
        next.timezone,
        next.all_day,
        id,
        teamId,
      ],
    );

    if (existing.google_event_id) {
      try {
        await this.googleCalendar.updateEvent(teamId, existing.google_event_id, {
          summary: next.title,
          description: next.notes,
          location: next.location,
          startIso: this.toIso(next.start_at),
          endIso: this.toIso(next.end_at),
          timezone: next.timezone,
        });
      } catch {
        // ignore sync failure; the appointment is still updated locally
      }
    }

    return this.serialize(rows[0]);
  }

  async remove(teamId: string, id: string) {
    const existing = await this.getOwned(teamId, id);

    if (existing.google_event_id) {
      try {
        await this.googleCalendar.deleteEvent(teamId, existing.google_event_id);
      } catch {
        // ignore sync failure; still delete locally
      }
    }

    await this.db.query(
      `DELETE FROM appointments WHERE id = $1 AND team_id = $2`,
      [id, teamId],
    );

    return { success: true };
  }

  private async getOwned(teamId: string, id: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM appointments WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [id, teamId],
    );
    if (!rows[0]) {
      throw new NotFoundException("Appointment not found");
    }
    return rows[0];
  }
}
