import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CalendarService } from "./calendar.service";

/**
 * Phase 1 of AI appointment booking: a deterministic, rules-aware engine.
 *
 * Given a team and a desired start time, it reads the team's appointment rules
 * (ai_agent_appointment_rules), validates the time against working days /
 * working hours / duration / buffers / daily cap in the team's timezone, checks
 * the appointments table for conflicts (the plain calendar create does NO such
 * check), and returns a typed decision. confirmBooking() then creates the row
 * via the existing CalendarService.
 *
 * This service changes NOTHING in the live WhatsApp path — it is only reachable
 * through its own endpoints, so it is safe to ship and fully API-testable.
 *
 * Defaults / assumptions (product decisions still open, see the build spec):
 *  - Desired times are interpreted in the team's rules.timezone.
 *  - Conflicts are checked at the TEAM level (not per-agent).
 *  - A start in the past is rejected; no maximum booking horizon is enforced here.
 */

export type BookingStatus =
  | "slot_found"
  | "in_past"
  | "out_of_hours"
  | "conflict"
  | "cap_reached"
  | "invalid";

export interface BookingDecision {
  status: BookingStatus;
  reason: string;
  startIso?: string;
  endIso?: string;
  timezone?: string;
  autoConfirm?: boolean;
  requiresApproval?: boolean;
  appointmentStatus?: "confirmed" | "pending";
}

interface AppointmentRules {
  timezone: string;
  workingDays: string[];
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  bookingDuration: number; // minutes
  bufferBefore: number; // minutes
  bufferAfter: number; // minutes
  maxDailyBookings: number;
  allowWeekends: boolean;
  autoConfirm: boolean;
  requireHumanApproval: boolean;
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

@Injectable()
export class BookingEngineService {
  private readonly logger = new Logger(BookingEngineService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly calendar: CalendarService,
  ) {}

  // --- Timezone helpers (built on Intl, no external library) ---

  /** The wall-clock parts an IANA timezone shows for a given UTC instant. */
  private partsInZone(date: Date, tz: string) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
    });
    const p: Record<string, string> = {};
    for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
    return {
      year: Number(p.year),
      month: Number(p.month),
      day: Number(p.day),
      hour: Number(p.hour),
      minute: Number(p.minute),
      second: Number(p.second),
      weekday: String(p.weekday || "").toLowerCase(),
    };
  }

  /** Offset (ms) of tz at this instant: localWallClockAsUTC - instant. */
  private tzOffsetMs(date: Date, tz: string): number {
    const p = this.partsInZone(date, tz);
    const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asIfUtc - date.getTime();
  }

  /** Convert a local wall-clock in tz to the correct UTC instant (DST-safe). */
  private zonedToUtc(
    y: number,
    mo: number,
    d: number,
    h: number,
    mi: number,
    tz: string,
  ): Date {
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    const offset1 = this.tzOffsetMs(new Date(guess), tz);
    let utc = guess - offset1;
    const offset2 = this.tzOffsetMs(new Date(utc), tz);
    if (offset2 !== offset1) utc = guess - offset2;
    return new Date(utc);
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = String(hhmm || "").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  // --- Rules ---

  private async getRules(teamId: string): Promise<AppointmentRules> {
    const { rows } = await this.db.query(
      `SELECT timezone, working_days, start_time, end_time, booking_duration,
              buffer_before, buffer_after, max_daily_bookings, allow_weekends,
              auto_confirm, require_human_approval
         FROM ai_agent_appointment_rules WHERE team_id = $1 LIMIT 1`,
      [teamId],
    );
    const r = rows[0];
    return {
      timezone: r?.timezone || "UTC",
      workingDays: Array.isArray(r?.working_days)
        ? r.working_days.map((d: string) => String(d).toLowerCase())
        : ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: r?.start_time ? String(r.start_time).slice(0, 5) : "09:00",
      endTime: r?.end_time ? String(r.end_time).slice(0, 5) : "18:00",
      bookingDuration: Number(r?.booking_duration ?? 30),
      bufferBefore: Number(r?.buffer_before ?? 0),
      bufferAfter: Number(r?.buffer_after ?? 0),
      maxDailyBookings: Number(r?.max_daily_bookings ?? 20),
      allowWeekends: r ? Boolean(r.allow_weekends) : false,
      autoConfirm: r ? Boolean(r.auto_confirm) : true,
      requireHumanApproval: r ? Boolean(r.require_human_approval) : false,
    };
  }

  // --- Core ---

  /**
   * Validate a desired start against the team's rules + existing appointments.
   * Read-only: never writes. Use confirmBooking() to actually create.
   */
  async computeSlot(
    teamId: string,
    desiredStartIso: string,
  ): Promise<BookingDecision> {
    const rules = await this.getRules(teamId);

    const start = new Date(desiredStartIso);
    if (isNaN(start.getTime())) {
      return { status: "invalid", reason: "Unparseable desired start time." };
    }
    if (start.getTime() <= Date.now()) {
      return { status: "in_past", reason: "Requested time is in the past." };
    }

    const end = new Date(start.getTime() + rules.bookingDuration * 60_000);

    // Local wall-clock of the requested start, in the team's timezone.
    const local = this.partsInZone(start, rules.timezone);
    const isWeekend = local.weekday === "saturday" || local.weekday === "sunday";
    if (isWeekend && !rules.allowWeekends) {
      return {
        status: "out_of_hours",
        reason: "Weekends are not available for this team.",
      };
    }
    if (!rules.workingDays.includes(local.weekday)) {
      return {
        status: "out_of_hours",
        reason: `${local.weekday} is not a working day.`,
      };
    }

    // The appointment [start, end] must sit within [startTime, endTime] local.
    const startMin = local.hour * 60 + local.minute;
    const endLocal = this.partsInZone(end, rules.timezone);
    const endMin = endLocal.hour * 60 + endLocal.minute;
    const openMin = this.toMinutes(rules.startTime);
    const closeMin = this.toMinutes(rules.endTime);
    // Guard against an end that rolled to the next local day.
    const crossedDay =
      endLocal.year !== local.year ||
      endLocal.month !== local.month ||
      endLocal.day !== local.day;
    if (crossedDay || startMin < openMin || endMin > closeMin) {
      return {
        status: "out_of_hours",
        reason: `Outside working hours ${rules.startTime}-${rules.endTime}.`,
      };
    }

    // Conflict check with buffers applied to the block we occupy.
    const blockStart = new Date(
      start.getTime() - rules.bufferBefore * 60_000,
    ).toISOString();
    const blockEnd = new Date(
      end.getTime() + rules.bufferAfter * 60_000,
    ).toISOString();
    const { rows: conflicts } = await this.db.query(
      `SELECT id FROM appointments
        WHERE team_id = $1
          AND status NOT IN ('canceled', 'completed')
          AND start_at < $3::timestamptz
          AND end_at   > $2::timestamptz
        LIMIT 1`,
      [teamId, blockStart, blockEnd],
    );
    if (conflicts.length > 0) {
      return {
        status: "conflict",
        reason: "That time overlaps an existing appointment (incl. buffers).",
      };
    }

    // Daily cap: count active appointments on the same local calendar day.
    const dayStartUtc = this.zonedToUtc(
      local.year,
      local.month,
      local.day,
      0,
      0,
      rules.timezone,
    ).toISOString();
    const dayEndUtc = this.zonedToUtc(
      local.year,
      local.month,
      local.day,
      23,
      59,
      rules.timezone,
    ).toISOString();
    const { rows: dayRows } = await this.db.query(
      `SELECT COUNT(*)::int AS c FROM appointments
        WHERE team_id = $1
          AND status NOT IN ('canceled', 'completed')
          AND start_at >= $2::timestamptz
          AND start_at <= $3::timestamptz`,
      [teamId, dayStartUtc, dayEndUtc],
    );
    if ((dayRows[0]?.c ?? 0) >= rules.maxDailyBookings) {
      return {
        status: "cap_reached",
        reason: `Daily booking cap of ${rules.maxDailyBookings} reached.`,
      };
    }

    const requiresApproval = rules.requireHumanApproval;
    const appointmentStatus: "confirmed" | "pending" =
      rules.autoConfirm && !requiresApproval ? "confirmed" : "pending";

    return {
      status: "slot_found",
      reason: "Slot is available and within the rules.",
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      timezone: rules.timezone,
      autoConfirm: rules.autoConfirm,
      requiresApproval,
      appointmentStatus,
    };
  }

  /**
   * Create the appointment for a slot_found decision, honoring auto_confirm /
   * require_human_approval for the stored status. Re-validates the slot first
   * so a stale decision can't slip a conflict through.
   */
  async confirmBooking(
    teamId: string,
    userId: string | null,
    desiredStartIso: string,
    ctx: {
      title?: string;
      leadId?: string;
      contactId?: string;
      propertyId?: string;
      attendeeName?: string;
      attendeeEmail?: string;
    } = {},
  ): Promise<{ decision: BookingDecision; appointment?: any }> {
    const decision = await this.computeSlot(teamId, desiredStartIso);
    if (decision.status !== "slot_found") return { decision };

    const appointment = await this.calendar.create(teamId, userId, {
      title: ctx.title || "Property viewing",
      type: "showing",
      status: decision.appointmentStatus,
      startAt: decision.startIso,
      endAt: decision.endIso,
      timezone: decision.timezone,
      leadId: ctx.leadId,
      contactId: ctx.contactId,
      propertyId: ctx.propertyId,
      attendeeName: ctx.attendeeName,
      attendeeEmail: ctx.attendeeEmail,
    });
    return { decision, appointment };
  }
}
