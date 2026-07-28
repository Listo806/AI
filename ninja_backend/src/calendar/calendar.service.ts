import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { DatabaseService } from "../database/database.service";
import { GoogleCalendarService } from "../integrations/google-calendar/google-calendar.service";
import { SendgridService } from "../integrations/email/sendgrid.service";

const TYPES = ["showing", "consultation", "call", "meeting", "other"];
const STATUSES = ["pending", "confirmed", "completed", "canceled"];

const isEmail = (v: any): v is string =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly sendgrid: SendgridService,
  ) {}

  private serialize = (row: any) => ({
    id: row.id,
    teamId: row.team_id,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    leadId: row.lead_id,
    contactId: row.contact_id,
    propertyId: row.property_id,
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
    reminderMinutesBefore: row.reminder_minutes_before,
    reminderSentAt: row.reminder_sent_at,
    googleEventId: row.google_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Enriched fields, present only on list() rows (LEFT JOINs). They let the
    // UI show who/what an appointment is linked to without extra requests.
    assignedToName: row.assigned_to_name ?? null,
    assignedToEmail: row.assigned_to_email ?? null,
    leadName: row.lead_name ?? null,
    leadEmail: row.lead_email ?? null,
    contactName: row.contact_name ?? null,
    contactEmail: row.contact_email ?? null,
    propertyTitle: row.property_title ?? null,
  });

  private toIso(value: any): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }

  async list(
    teamId: string,
    opts: { from?: string; to?: string; leadId?: string; contactId?: string } = {},
  ) {
    const clauses = ["a.team_id = $1"];
    const params: any[] = [teamId];
    if (opts.from) {
      params.push(opts.from);
      clauses.push(`a.end_at >= $${params.length}`);
    }
    if (opts.to) {
      params.push(opts.to);
      clauses.push(`a.start_at <= $${params.length}`);
    }
    if (opts.leadId) {
      params.push(opts.leadId);
      clauses.push(`a.lead_id = $${params.length}`);
    }
    if (opts.contactId) {
      params.push(opts.contactId);
      clauses.push(`a.contact_id = $${params.length}`);
    }

    const { rows } = await this.db.query(
      `
      SELECT
        a.*,
        ua.name  AS assigned_to_name,
        ua.email AS assigned_to_email,
        l.name   AS lead_name,
        l.email  AS lead_email,
        c.name   AS contact_name,
        c.email  AS contact_email,
        p.title  AS property_title
      FROM appointments a
      LEFT JOIN users ua    ON ua.id = a.assigned_to
      LEFT JOIN leads l     ON l.id  = a.lead_id     AND l.team_id = a.team_id
      LEFT JOIN contacts c  ON c.id  = a.contact_id  AND c.team_id = a.team_id
      LEFT JOIN properties p ON p.id = a.property_id AND p.team_id = a.team_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY a.start_at ASC
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

  // Active team members, for the "Assigned Agent" dropdown.
  async teamMembers(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT u.id, u.name, u.email, tm.role
      FROM team_members tm
      INNER JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
        AND tm.status = 'active'
        AND u.is_active = true
      ORDER BY (tm.role = 'owner') DESC, u.name ASC NULLS LAST, u.email ASC
      `,
      [teamId],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name || r.email,
      email: r.email,
      role: r.role,
    }));
  }

  // Search across leads + contacts for the appointment "Contact / Lead" picker.
  async crmSearch(teamId: string, q: string) {
    const term = `%${(q || "").trim()}%`;
    const { rows } = await this.db.query(
      `
      (
        SELECT id, 'lead'::text AS kind, name, email, phone
        FROM leads
        WHERE team_id = $1
          AND ($2 = '%%' OR name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
        ORDER BY updated_at DESC
        LIMIT 15
      )
      UNION ALL
      (
        SELECT id, 'contact'::text AS kind, name, email, phone
        FROM contacts
        WHERE team_id = $1
          AND ($2 = '%%' OR name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
        ORDER BY updated_at DESC
        LIMIT 15
      )
      `,
      [teamId, term],
    );
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      email: r.email || null,
      phone: r.phone || null,
    }));
  }

  async create(teamId: string, userId: string | null, body: any) {
    const type = TYPES.includes(body.type) ? body.type : "other";
    const status = STATUSES.includes(body.status) ? body.status : "pending";

    // Validate every CRM link belongs to THIS team before storing it, so the
    // enriched list() join can never surface another team's lead/contact/agent.
    const leadId = await this.resolveTeamRef("leads", body.leadId, teamId);
    const contactId = await this.resolveTeamRef("contacts", body.contactId, teamId);
    const propertyId = await this.resolveTeamRef("properties", body.propertyId, teamId);
    const assignedTo = await this.resolveTeamMember(body.assignedTo, teamId);

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
        team_id, created_by, assigned_to, lead_id, contact_id, property_id,
        title, type, status, location, notes, attendee_name, attendee_email,
        start_at, end_at, timezone, all_day, reminder_minutes_before,
        google_event_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
      `,
      [
        teamId,
        userId,
        assignedTo,
        leadId,
        contactId,
        propertyId,
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
        this.normalizeReminder(body.reminderMinutesBefore),
        googleEventId,
      ],
    );

    const created = this.serialize(rows[0]);
    await this.logActivity(created.id, teamId, userId, "created");
    return created;
  }

  async update(
    teamId: string,
    id: string,
    body: any,
    actorId: string | null = null,
  ) {
    const existing = await this.getOwned(teamId, id);

    // Re-validate any CRM link that is being changed against this team; existing
    // values were already validated when they were set.
    const leadId =
      body.leadId !== undefined
        ? await this.resolveTeamRef("leads", body.leadId, teamId)
        : existing.lead_id;
    const contactId =
      body.contactId !== undefined
        ? await this.resolveTeamRef("contacts", body.contactId, teamId)
        : existing.contact_id;
    const propertyId =
      body.propertyId !== undefined
        ? await this.resolveTeamRef("properties", body.propertyId, teamId)
        : existing.property_id;
    const assignedTo =
      body.assignedTo !== undefined
        ? await this.resolveTeamMember(body.assignedTo, teamId)
        : existing.assigned_to;

    const pick = (key: string, col: string) =>
      body[key] !== undefined ? body[key] : existing[col];

    const next = {
      title: pick("title", "title"),
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
      location: pick("location", "location"),
      notes: pick("notes", "notes"),
      attendee_name: pick("attendeeName", "attendee_name"),
      attendee_email: pick("attendeeEmail", "attendee_email"),
      assigned_to: assignedTo,
      lead_id: leadId,
      contact_id: contactId,
      property_id: propertyId,
      start_at: pick("startAt", "start_at"),
      end_at: pick("endAt", "end_at"),
      timezone: pick("timezone", "timezone"),
      all_day:
        body.allDay !== undefined ? Boolean(body.allDay) : existing.all_day,
      reminder_minutes_before:
        body.reminderMinutesBefore !== undefined
          ? this.normalizeReminder(body.reminderMinutesBefore)
          : existing.reminder_minutes_before,
    };

    // If the reminder window or the start time moved, allow the reminder to fire
    // again by clearing the sent marker.
    const resetReminder =
      (body.reminderMinutesBefore !== undefined &&
        next.reminder_minutes_before !== existing.reminder_minutes_before) ||
      (body.startAt !== undefined &&
        this.toIso(next.start_at) !== this.toIso(existing.start_at));

    const { rows } = await this.db.query(
      `
      UPDATE appointments
      SET title=$1, type=$2, status=$3, location=$4, notes=$5, attendee_name=$6,
          attendee_email=$7, assigned_to=$8, lead_id=$9, contact_id=$10,
          property_id=$11, start_at=$12, end_at=$13, timezone=$14, all_day=$15,
          reminder_minutes_before=$16,
          reminder_sent_at = CASE WHEN $17 THEN NULL ELSE reminder_sent_at END,
          updated_at=NOW()
      WHERE id=$18 AND team_id=$19
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
        next.lead_id,
        next.contact_id,
        next.property_id,
        next.start_at,
        next.end_at,
        next.timezone,
        next.all_day,
        next.reminder_minutes_before,
        resetReminder,
        id,
        teamId,
      ],
    );

    await this.logUpdateActivity(existing, next, teamId, id, actorId);

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

  // Return the id only if that record exists AND belongs to this team; else null.
  // Prevents linking (and later enriching) another team's lead/contact/property.
  private async resolveTeamRef(
    table: "leads" | "contacts" | "properties",
    id: any,
    teamId: string,
  ): Promise<string | null> {
    if (!id) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT 1 FROM ${table} WHERE id = $1 AND team_id = $2 LIMIT 1`,
        [id, teamId],
      );
      return rows[0] ? id : null;
    } catch {
      return null;
    }
  }

  // Return the userId only if they are an active member (or the owner) of this
  // team; else null. Keeps assigned_to from pointing at a foreign/nonexistent user.
  private async resolveTeamMember(
    userId: any,
    teamId: string,
  ): Promise<string | null> {
    if (!userId) return null;
    try {
      const { rows } = await this.db.query(
        `
        SELECT 1
        FROM team_members
        WHERE user_id = $1 AND team_id = $2 AND status = 'active'
        UNION
        SELECT 1 FROM teams WHERE id = $2 AND owner_id = $1
        LIMIT 1
        `,
        [userId, teamId],
      );
      return rows[0] ? userId : null;
    } catch {
      return null;
    }
  }

  private normalizeReminder(value: any): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    // Cap at 7 days so a typo cannot schedule a reminder years out.
    return Math.min(Math.round(n), 60 * 24 * 7);
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

  // ── Activity log ───────────────────────────────────────────────────
  // Best-effort; a logging failure must never break the appointment action.
  private async logActivity(
    appointmentId: string,
    teamId: string,
    actorId: string | null,
    action: string,
    detail: string | null = null,
  ) {
    try {
      await this.db.query(
        `INSERT INTO appointment_activity (appointment_id, team_id, actor_id, action, detail)
         VALUES ($1, $2, $3, $4, $5)`,
        [appointmentId, teamId, actorId || null, action, detail],
      );
    } catch (err: any) {
      this.logger.warn(`Could not log appointment activity: ${err?.message}`);
    }
  }

  // Classify what an edit did (rescheduled / canceled / other change) and log
  // one entry. A no-op save logs nothing.
  private async logUpdateActivity(
    existing: any,
    next: any,
    teamId: string,
    id: string,
    actorId: string | null,
  ) {
    const timeChanged =
      this.toIso(existing.start_at) !== this.toIso(next.start_at) ||
      this.toIso(existing.end_at) !== this.toIso(next.end_at);
    const nowCanceled =
      next.status === "canceled" && existing.status !== "canceled";

    const labels: Record<string, string> = {
      title: "title",
      type: "meeting type",
      location: "location",
      notes: "notes",
      attendee_name: "attendee",
      attendee_email: "attendee email",
      assigned_to: "assigned agent",
      lead_id: "linked lead",
      contact_id: "linked contact",
      property_id: "property",
      reminder_minutes_before: "reminder",
    };
    const changed: string[] = [];
    for (const [col, label] of Object.entries(labels)) {
      if (String(existing[col] ?? "") !== String(next[col] ?? "")) {
        changed.push(label);
      }
    }
    const statusChanged = existing.status !== next.status;

    let action: string | null = null;
    let detail: string | null = null;
    if (nowCanceled) {
      action = "canceled";
    } else if (timeChanged) {
      action = "rescheduled";
      detail = `Moved to ${this.formatWhen(next.start_at, next.timezone)}`;
    } else if (statusChanged) {
      action = "updated";
      detail = `Status changed to ${next.status}`;
    } else if (changed.length) {
      action = "updated";
      detail = `Changed ${changed.join(", ")}`;
    }

    if (action) {
      await this.logActivity(id, teamId, actorId, action, detail);
    }
  }

  async getActivity(teamId: string, appointmentId: string) {
    const { rows } = await this.db.query(
      `
      SELECT aa.id, aa.action, aa.detail, aa.created_at, aa.actor_id,
             u.name AS actor_name, u.email AS actor_email
      FROM appointment_activity aa
      LEFT JOIN users u ON u.id = aa.actor_id
      WHERE aa.appointment_id = $1 AND aa.team_id = $2
      ORDER BY aa.created_at DESC
      `,
      [appointmentId, teamId],
    );
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      detail: r.detail,
      createdAt: r.created_at,
      actorId: r.actor_id,
      actorName: r.actor_name || r.actor_email || "Someone",
    }));
  }

  // ── Email reminders ────────────────────────────────────────────────
  // Every 10 minutes, send a one-time email reminder for appointments whose
  // start is now within their reminder window. Recipients are the attendee (if
  // the agent entered one) and the assigned agent (or the creator). The time
  // window naturally bounds retries: once start_at passes, the row drops out.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendDueReminders() {
    let due: any[];
    try {
      const { rows } = await this.db.query(
        `
        SELECT
          a.*,
          COALESCE(ua.email, cu.email) AS agent_email,
          COALESCE(ua.name, cu.name)   AS agent_name
        FROM appointments a
        LEFT JOIN users ua ON ua.id = a.assigned_to
        LEFT JOIN users cu ON cu.id = a.created_by
        WHERE a.reminder_sent_at IS NULL
          AND COALESCE(a.reminder_minutes_before, 0) > 0
          AND a.status IN ('pending', 'confirmed')
          AND a.start_at > NOW()
          AND a.start_at <= NOW() + make_interval(mins => a.reminder_minutes_before)
        ORDER BY a.start_at ASC
        LIMIT 200
        `,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error("Reminder sweep query failed", err?.message);
      return;
    }

    if (!due.length) return;

    // Remember which teams have no working SendGrid config so we do not retry
    // every appointment for them within this run.
    const unconfiguredTeams = new Set<string>();

    for (const row of due) {
      const recipients = Array.from(
        new Set([row.attendee_email, row.agent_email].filter(isEmail)),
      );

      if (!recipients.length || unconfiguredTeams.has(row.team_id)) {
        // Nothing to send to (or team has no email set up): mark handled so the
        // sweep does not keep looking at this row.
        if (!recipients.length) await this.markReminderSent(row.id);
        continue;
      }

      const subject = this.reminderSubject(row);
      const html = this.reminderHtml(row);

      let sentAny = false;
      let unconfigured = false;
      for (const to of recipients) {
        try {
          await this.sendgrid.sendEmail(row.team_id, to, subject, html);
          sentAny = true;
        } catch (err: any) {
          const msg = String(err?.message || "");
          if (/not configured/i.test(msg)) {
            unconfigured = true;
            break;
          }
          this.logger.warn(
            `Failed to send reminder for appointment ${row.id} to ${to}: ${msg}`,
          );
        }
      }

      if (unconfigured) {
        // Leave the row unsent; once the team configures email it will fire on a
        // later sweep (until the appointment start passes).
        unconfiguredTeams.add(row.team_id);
        continue;
      }

      if (sentAny) await this.markReminderSent(row.id);
    }
  }

  private async markReminderSent(id: string) {
    try {
      await this.db.query(
        `UPDATE appointments SET reminder_sent_at = NOW() WHERE id = $1`,
        [id],
      );
    } catch (err: any) {
      this.logger.warn(
        `Could not mark reminder sent for ${id}: ${err?.message}`,
      );
    }
  }

  private reminderSubject(row: any): string {
    const when = this.formatWhen(row.start_at, row.timezone);
    return `Reminder: ${row.title || "Appointment"} — ${when}`;
  }

  private reminderHtml(row: any): string {
    const when = this.formatWhen(row.start_at, row.timezone);
    const esc = (s: any) =>
      String(s ?? "").replace(
        /[&<>"]/g,
        (c) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c,
      );
    const rows: string[] = [`<p><strong>When:</strong> ${esc(when)}</p>`];
    if (row.location) rows.push(`<p><strong>Where:</strong> ${esc(row.location)}</p>`);
    if (row.attendee_name)
      rows.push(`<p><strong>With:</strong> ${esc(row.attendee_name)}</p>`);
    if (row.notes) rows.push(`<p><strong>Notes:</strong> ${esc(row.notes)}</p>`);
    return `
      <div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
        <h2 style="margin:0 0 12px">${esc(row.title || "Appointment reminder")}</h2>
        ${rows.join("\n")}
        <p style="margin-top:16px;color:#64748b;font-size:13px">
          Sent by CORTEXA CRM. This is an automated appointment reminder.
        </p>
      </div>
    `;
  }

  private formatWhen(startAt: any, timezone?: string): string {
    const d = startAt instanceof Date ? startAt : new Date(startAt);
    try {
      return d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone || undefined,
        timeZoneName: "short",
      });
    } catch {
      return d.toISOString();
    }
  }
}
