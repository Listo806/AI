import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AiAssistantService } from '../integrations/ai/ai-assistant.service';
import {
  BookingEngineService,
  AppointmentRules,
  BookingDecision,
} from '../calendar/booking-engine.service';
import { LeadStateService } from '../leads/services/lead-state.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { LeadMessage } from './lead-messages.service';

/**
 * Conversational AI appointment booking over WhatsApp.
 *
 * This is the live-chat layer on top of the deterministic BookingEngineService.
 * When a lead is qualified and the team has turned booking on, the AI offers a
 * viewing, reads the day/time the lead replies with (language model extraction),
 * validates it against the team's rules (engine), and books it — confirming or
 * marking it pending per auto_confirm / require_human_approval.
 *
 * SAFETY: every entry point is only reached when getRules().bookingEnabled is
 * true. With the flag off (the default for every team) none of this runs, and
 * the WhatsApp reply path behaves exactly as it did before.
 *
 * Product defaults chosen here (all reversible in code / settings):
 *  - Times are interpreted in the team's rules.timezone.
 *  - A day with no time defaults to the start of working hours.
 *  - After MAX_TURNS unworkable/parse-failed replies, hand off to a human with a
 *    message (never silent).
 *  - Conflicts are team-level; the appointment links the lead (assigned_to left
 *    to the team so any agent can pick it up).
 */

export interface BookingTurnResult {
  reply: string;
  messageId?: string;
  logMetadata?: Record<string, unknown>;
}

export interface FlowCtx {
  teamId: string;
  leadId: string;
  conversationId: string;
  rules: AppointmentRules;
  history: LeadMessage[];
  leadStateBefore: string;
  propertyId?: string | null;
}

const MAX_TURNS = 5;
const STD_WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

@Injectable()
export class WhatsAppAiBookingService {
  private readonly logger = new Logger(WhatsAppAiBookingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiAssistant: AiAssistantService,
    private readonly bookingEngine: BookingEngineService,
    private readonly leadState: LeadStateService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
  ) {}

  /** Master switch: is conversational auto-booking on for this team? */
  async isEnabled(teamId: string): Promise<boolean> {
    if (!teamId) return false;
    try {
      const rules = await this.bookingEngine.getRules(teamId);
      return !!rules.bookingEnabled;
    } catch {
      return false;
    }
  }

  async getRules(teamId: string): Promise<AppointmentRules> {
    return this.bookingEngine.getRules(teamId);
  }

  /**
   * Read-only end-to-end check for a single lead phrase: run the same language
   * extraction + rules validation the live flow uses, but write nothing and send
   * nothing. Lets us (and the team) verify phrasing like "tomorrow at 3pm"
   * without a real WhatsApp round-trip.
   */
  async previewExtraction(
    teamId: string,
    text: string,
  ): Promise<{
    bookingEnabled: boolean;
    timezone: string;
    utcIso: string | null;
    decision: BookingDecision | null;
  }> {
    const rules = await this.bookingEngine.getRules(teamId);
    const history = [
      { body: text, sender_type: 'lead', direction: 'inbound' } as LeadMessage,
    ];
    const utcIso = await this.extractDesiredTimeIso(rules, history);
    const decision = utcIso
      ? await this.bookingEngine.computeSlot(teamId, utcIso)
      : null;
    return {
      bookingEnabled: rules.bookingEnabled,
      timezone: rules.timezone,
      utcIso,
      decision,
    };
  }

  // ── Entry points ──────────────────────────────────────────────────────────

  /**
   * The lead just became qualified. If their qualifying message already names a
   * time, try to book it; otherwise offer a viewing and wait for a time.
   */
  async onQualified(ctx: FlowCtx): Promise<BookingTurnResult> {
    await this.setPromptCount(ctx.leadId, 0);

    const iso = await this.extractDesiredTimeIso(ctx.rules, ctx.history);
    if (iso) {
      return this.validateAndRespond(ctx, iso);
    }

    await this.leadState.transition(ctx.leadId, 'booking_offered', 'offer_booking');
    const es = this.isSpanish(ctx.history);
    const reply = this.msgOffer(ctx.rules, es);
    return this.send(ctx, reply, 'auto_reply', 'booking_offered', {
      decision: 'offer_booking',
    });
  }

  /**
   * The lead replied while we're waiting for a time (state booking_offered).
   */
  async onBookingReply(ctx: FlowCtx): Promise<BookingTurnResult> {
    const es = this.isSpanish(ctx.history);

    // A concrete time wins even if the phrasing mentions an agent
    // ("can an agent call me tomorrow at 3?").
    const iso = await this.extractDesiredTimeIso(ctx.rules, ctx.history);
    if (iso) {
      return this.validateAndRespond(ctx, iso);
    }

    if (this.wantsHuman(ctx.history)) {
      return this.escalate(ctx, 'lead_requested', es);
    }

    // No time understood — nudge, bounded, then hand off.
    return this.respondBounded(ctx, this.msgReAsk(es), 'time_not_understood', es);
  }

  /**
   * The lead already has a booking (state booked). If they name a new time,
   * treat it as a reschedule; if they ask for a human, escalate; otherwise let
   * the normal AI chat answer (handled=false).
   */
  async onBookedFollowUp(
    ctx: FlowCtx,
  ): Promise<{ handled: boolean } & Partial<BookingTurnResult>> {
    const es = this.isSpanish(ctx.history);

    // A scheduling change takes priority; only treat it as a human hand-off when
    // there is no new time in the message.
    const iso = await this.extractDesiredTimeIso(ctx.rules, ctx.history);
    if (!iso) {
      if (this.wantsHuman(ctx.history)) {
        return { handled: true, ...(await this.escalate(ctx, 'lead_requested', es)) };
      }
      return { handled: false };
    }

    const decision = await this.bookingEngine.computeSlot(ctx.teamId, iso);
    if (decision.status === 'slot_found') {
      const moved = await this.reschedule(ctx.teamId, ctx.leadId, decision);
      const reply = moved
        ? this.msgRescheduled(decision, ctx.rules, es)
        : this.msgConfirmed(decision, ctx.rules, es);
      const res = await this.send(ctx, reply, 'auto_reply', 'booked', {
        decision: moved ? 'rescheduled' : 'booked',
        start_iso: decision.startIso,
      });
      return { handled: true, ...res };
    }

    const reply = this.msgForDecision(decision, ctx.rules, es);
    const res = await this.send(ctx, reply, 'auto_reply', 'booked', {
      decision: decision.status,
    });
    return { handled: true, ...res };
  }

  // ── Core validate + book ─────────────────────────────────────────────────

  private async validateAndRespond(
    ctx: FlowCtx,
    desiredIso: string,
  ): Promise<BookingTurnResult> {
    const es = this.isSpanish(ctx.history);
    const decision = await this.bookingEngine.computeSlot(ctx.teamId, desiredIso);

    if (decision.status === 'slot_found') {
      let appointmentId: string | undefined;
      try {
        const booked = await this.bookingEngine.confirmBooking(
          ctx.teamId,
          null,
          desiredIso,
          {
            title: 'Property viewing',
            leadId: ctx.leadId,
            propertyId: ctx.propertyId || undefined,
            notes: 'Booked by AI over WhatsApp.',
          },
        );
        appointmentId = booked.appointment?.id;
      } catch (err: any) {
        this.logger.error(`confirmBooking failed: ${err?.message}`);
        // Fall back to a human rather than dropping the lead.
        return this.escalate(ctx, 'booking_error', es);
      }

      await this.setPromptCount(ctx.leadId, 0);
      await this.leadState.transition(ctx.leadId, 'booked', 'appointment_booked');

      const reply =
        decision.appointmentStatus === 'confirmed'
          ? this.msgConfirmed(decision, ctx.rules, es)
          : this.msgPending(decision, ctx.rules, es);

      return this.send(ctx, reply, 'booked', 'booked', {
        decision: 'booked',
        appointment_id: appointmentId,
        appointment_status: decision.appointmentStatus,
        start_iso: decision.startIso,
      });
    }

    // A specific time that doesn't work — explain why, stay in booking_offered,
    // and keep the turn budget so we eventually hand off.
    return this.respondBounded(
      ctx,
      this.msgForDecision(decision, ctx.rules, es),
      decision.status,
      es,
    );
  }

  /** Send a non-booking reply, but escalate once the turn budget is spent. */
  private async respondBounded(
    ctx: FlowCtx,
    reply: string,
    outcome: string,
    es: boolean,
  ): Promise<BookingTurnResult> {
    const count = await this.incrementPromptCount(ctx.leadId);
    if (count >= MAX_TURNS) {
      return this.escalate(ctx, 'too_many_attempts', es);
    }
    if (ctx.leadStateBefore !== 'booking_offered') {
      await this.leadState.transition(ctx.leadId, 'booking_offered', 'awaiting_time');
    }
    return this.send(ctx, reply, 'auto_reply', outcome, { decision: outcome });
  }

  private async escalate(
    ctx: FlowCtx,
    reason: string,
    es: boolean,
  ): Promise<BookingTurnResult> {
    await this.leadState.transition(ctx.leadId, 'escalated_to_human', reason);
    const reply = this.msgHandoff(es);
    return this.send(ctx, reply, 'escalated', reason, { decision: 'escalate', reason });
  }

  // ── Reschedule ────────────────────────────────────────────────────────────

  private async reschedule(
    teamId: string,
    leadId: string,
    decision: BookingDecision,
  ): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT id FROM appointments
        WHERE team_id = $1 AND lead_id = $2
          AND status NOT IN ('canceled', 'completed')
          AND start_at > NOW()
        ORDER BY start_at ASC
        LIMIT 1`,
      [teamId, leadId],
    );
    const id = rows[0]?.id;
    if (!id) return false;
    await this.db.query(
      `UPDATE appointments
          SET start_at = $2::timestamptz,
              end_at = $3::timestamptz,
              reminder_sent_at = NULL,
              wa_reminder_sent_at = NULL,
              updated_at = NOW()
        WHERE id = $1`,
      [id, decision.startIso, decision.endIso],
    );
    return true;
  }

  // ── Language-model time extraction ────────────────────────────────────────

  /**
   * Ask the model for the single viewing time the lead wants, as a wall-clock
   * string in the team timezone, then convert it to a UTC instant. Returns null
   * when there is no clear time (the caller then re-asks). The deterministic
   * engine still validates whatever comes back, so a bad guess is rejected, not
   * booked blindly.
   */
  private async extractDesiredTimeIso(
    rules: AppointmentRules,
    history: LeadMessage[],
  ): Promise<string | null> {
    const tz = rules.timezone;
    const nowLocal = this.nowInZone(tz);
    const tail = history
      .filter((m) => (m.body || '').trim())
      .slice(-6)
      .map((m) => {
        const who =
          m.direction === 'inbound' || m.sender_type === 'lead'
            ? 'Lead'
            : 'Assistant';
        return `${who}: ${(m.body || '').trim()}`;
      })
      .join('\n');

    const system =
      `You read a real estate lead's WhatsApp chat and extract the single date and time they want for a property viewing.\n` +
      `Business timezone: ${tz}. Current local date/time: ${nowLocal}.\n` +
      `Resolve relative words ("today", "tomorrow", "next Monday", "this afternoon", "in 2 hours") against that current local time.\n` +
      `Reply with ONLY minified JSON and nothing else: {"has_time":boolean,"local":"YYYY-MM-DDTHH:mm" or null}.\n` +
      `"local" is the wall-clock time in ${tz} with NO timezone letter or offset. If only a day is given, use ${rules.startTime}. ` +
      `If the latest lead message does not request or change a viewing time, return {"has_time":false,"local":null}.`;

    const user = `Chat (most recent last):\n${tail}\n\nExtract the requested viewing time as JSON.`;

    let raw: string;
    try {
      const res = await this.aiAssistant.chat({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      raw = res.message || '';
    } catch (err: any) {
      this.logger.warn(`time extraction chat failed: ${err?.message}`);
      return null;
    }

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    let parsed: any;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
    if (!parsed?.has_time || !parsed?.local) return null;

    return this.bookingEngine.localToUtcIso(String(parsed.local), tz);
  }

  // ── Prompt-count helpers ──────────────────────────────────────────────────

  private async setPromptCount(leadId: string, n: number): Promise<void> {
    try {
      await this.db.query(
        `UPDATE leads SET booking_prompt_count = $2 WHERE id = $1`,
        [leadId, n],
      );
    } catch (err: any) {
      this.logger.warn(`setPromptCount failed: ${err?.message}`);
    }
  }

  private async incrementPromptCount(leadId: string): Promise<number> {
    try {
      const { rows } = await this.db.query(
        `UPDATE leads
            SET booking_prompt_count = COALESCE(booking_prompt_count, 0) + 1
          WHERE id = $1
          RETURNING booking_prompt_count`,
        [leadId],
      );
      return Number(rows[0]?.booking_prompt_count ?? MAX_TURNS);
    } catch (err: any) {
      this.logger.warn(`incrementPromptCount failed: ${err?.message}`);
      return MAX_TURNS; // fail safe: hand off rather than loop
    }
  }

  // ── Send + log ────────────────────────────────────────────────────────────

  private async send(
    ctx: FlowCtx,
    reply: string,
    action: string,
    outcomeState: string,
    extraMeta: Record<string, unknown>,
  ): Promise<BookingTurnResult> {
    const logMetadata: Record<string, unknown> = {
      ...extraMeta,
      lead_state_before: ctx.leadStateBefore,
      lead_state_after: outcomeState,
      channel: 'whatsapp',
      flow: 'ai_booking',
    };
    let messageId: string | undefined;
    try {
      const sent = await this.twilioWhatsApp.sendAiReply(
        ctx.leadId,
        ctx.conversationId,
        reply,
      );
      messageId = sent.messageId;
    } catch (err: any) {
      this.logger.error(`booking reply send failed: ${err?.message}`);
    }
    await this.logAiActivity(
      ctx.teamId,
      ctx.leadId,
      action,
      String(extraMeta.decision || outcomeState),
      logMetadata,
    );
    return { reply, messageId, logMetadata };
  }

  private async logAiActivity(
    teamId: string,
    leadId: string,
    action: string,
    outcome: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO ai_activity (team_id, action, lead_id, channel, outcome, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [teamId, action, leadId, 'whatsapp', outcome, JSON.stringify(metadata)],
      );
    } catch (err: any) {
      this.logger.warn(`logAiActivity failed: ${err?.message}`);
    }
  }

  // ── Language + formatting ─────────────────────────────────────────────────

  private isSpanish(history: LeadMessage[]): boolean {
    const lastLead = [...history]
      .reverse()
      .find((m) => (m.sender_type === 'lead' || m.direction === 'inbound') && m.body);
    const t = (lastLead?.body || '').toLowerCase();
    return /(\bhola\b|\bgracias\b|\bquiero\b|\bcomprar\b|\balquilar\b|\bmañana\b|\bhoy\b|\bcita\b|\bvisita\b|\bagendar\b|\btarde\b)/.test(
      t,
    );
  }

  private wantsHuman(history: LeadMessage[]): boolean {
    const lastLead = [...history]
      .reverse()
      .find((m) => (m.sender_type === 'lead' || m.direction === 'inbound') && m.body);
    const t = (lastLead?.body || '').toLowerCase();
    return /(speak|talk|connect).{0,20}(agent|human|someone|person|rep)|human agent|real person|call me|hablar con (un |una )?(agente|asesor|persona)|con un agente|una persona/.test(
      t,
    );
  }

  private nowInZone(tz: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date());
    } catch {
      return new Date().toISOString();
    }
  }

  private tzCity(tz: string): string {
    const part = String(tz || 'UTC').split('/').pop() || tz;
    return part.replace(/_/g, ' ');
  }

  private to12h(hhmm: string): string {
    const [h, m] = String(hhmm || '09:00').split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  }

  private hoursLabel(rules: AppointmentRules): string {
    return `${this.to12h(rules.startTime)}–${this.to12h(rules.endTime)}`;
  }

  private daysLabel(rules: AppointmentRules, es: boolean): string {
    const days = rules.workingDays || [];
    const isStd =
      days.length === STD_WEEKDAYS.length &&
      STD_WEEKDAYS.every((d) => days.includes(d));
    if (isStd) return es ? 'de lunes a viernes' : 'Monday to Friday';
    const abbrev: Record<string, string> = {
      monday: es ? 'lun' : 'Mon',
      tuesday: es ? 'mar' : 'Tue',
      wednesday: es ? 'mié' : 'Wed',
      thursday: es ? 'jue' : 'Thu',
      friday: es ? 'vie' : 'Fri',
      saturday: es ? 'sáb' : 'Sat',
      sunday: es ? 'dom' : 'Sun',
    };
    return days.map((d) => abbrev[d] || d).join(', ');
  }

  private formatWhen(iso: string | undefined, tz: string, es: boolean): string {
    if (!iso) return '';
    try {
      const f = new Intl.DateTimeFormat(es ? 'es-ES' : 'en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${f.format(new Date(iso))} (${this.tzCity(tz)})`;
    } catch {
      return iso;
    }
  }

  // ── Message copy (EN / ES) ────────────────────────────────────────────────

  private msgOffer(rules: AppointmentRules, es: boolean): string {
    const days = this.daysLabel(rules, es);
    const hours = this.hoursLabel(rules);
    return es
      ? `Perfecto, puedo agendar una visita para ti. ¿Qué día y hora te viene mejor? Atendemos ${days} de ${hours} (${this.tzCity(rules.timezone)}).`
      : `Great — I can set up a viewing for you. What day and time works best? We're available ${days}, ${hours} (${this.tzCity(rules.timezone)}).`;
  }

  private msgConfirmed(
    decision: BookingDecision,
    rules: AppointmentRules,
    es: boolean,
  ): string {
    const when = this.formatWhen(decision.startIso, rules.timezone, es);
    return es
      ? `Listo, tu visita quedó agendada para el ${when}. Te enviaré un recordatorio antes. Si necesitas cambiarla, respóndeme con otra hora.`
      : `You're all set for ${when}. I'll send a reminder before then. Need to change it? Just reply with a new time.`;
  }

  private msgPending(
    decision: BookingDecision,
    rules: AppointmentRules,
    es: boolean,
  ): string {
    const when = this.formatWhen(decision.startIso, rules.timezone, es);
    return es
      ? `Gracias, solicité tu visita para el ${when}. Un miembro del equipo la confirmará en breve y te aviso cuando esté lista.`
      : `Thanks — I've requested ${when}. A team member will confirm shortly and I'll message you once it's set.`;
  }

  private msgRescheduled(
    decision: BookingDecision,
    rules: AppointmentRules,
    es: boolean,
  ): string {
    const when = this.formatWhen(decision.startIso, rules.timezone, es);
    return es
      ? `Hecho, moví tu visita al ${when}. Te enviaré un recordatorio antes.`
      : `Done — I've moved your viewing to ${when}. I'll send a reminder before then.`;
  }

  private msgReAsk(es: boolean): string {
    return es
      ? `Perdona, no capté una hora exacta. ¿Me das un día y una hora, por ejemplo "martes a las 2pm"?`
      : `Sorry, I didn't catch a specific time. Could you give a day and time, like "Tuesday at 2pm"?`;
  }

  private msgHandoff(es: boolean): string {
    return es
      ? `Sin problema, le pido a un miembro del equipo que te contacte para coordinar la visita.`
      : `No problem — I'll have a team member reach out to find a time that works for you.`;
  }

  private msgForDecision(
    decision: BookingDecision,
    rules: AppointmentRules,
    es: boolean,
  ): string {
    const days = this.daysLabel(rules, es);
    const hours = this.hoursLabel(rules);
    switch (decision.status) {
      case 'out_of_hours':
        return es
          ? `Esa hora está fuera de nuestro horario (${hours}, ${days}). ¿Qué otro día u hora te viene bien?`
          : `That time is outside our hours (${hours}, ${days}). What other day or time works for you?`;
      case 'conflict':
        return es
          ? `Justo se ocupó ese horario. ¿Me propones otro día u hora?`
          : `That slot was just taken. Could you share another day or time?`;
      case 'cap_reached':
        return es
          ? `Ese día ya estamos completos. ¿Probamos otro día?`
          : `We're fully booked that day. Would another day work?`;
      case 'in_past':
        return es
          ? `Esa hora ya pasó. ¿Qué día y hora próximos te vienen bien?`
          : `That time has already passed. What upcoming day and time works?`;
      default:
        return this.msgReAsk(es);
    }
  }
}
