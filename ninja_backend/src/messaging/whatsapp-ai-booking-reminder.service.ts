import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';

/**
 * Sends a one-time WhatsApp reminder to the lead before an appointment.
 *
 * Scope is deliberately narrow: only appointments whose team has turned AI
 * booking on (ai_agent_appointment_rules.booking_enabled = true) and that link a
 * lead with a phone number. The opt-in flag is what authorizes messaging the
 * lead automatically.
 *
 * Idempotency uses its own column (wa_reminder_sent_at), separate from the email
 * reminder's reminder_sent_at, so the two channels never suppress each other —
 * the email sweep marks reminder_sent_at even when there is no email recipient.
 */
@Injectable()
export class WhatsAppAiBookingReminderService {
  private readonly logger = new Logger(WhatsAppAiBookingReminderService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendDueWhatsAppReminders() {
    let due: any[];
    try {
      const { rows } = await this.db.query(
        `
        SELECT a.id, a.team_id, a.lead_id, a.title, a.start_at, a.timezone,
               l.phone,
               (SELECT c.id FROM conversations c
                 WHERE c.lead_id = a.lead_id
                 ORDER BY c.updated_at DESC LIMIT 1) AS conversation_id
        FROM appointments a
        JOIN ai_agent_appointment_rules r
          ON r.team_id = a.team_id AND r.booking_enabled = true
        JOIN leads l ON l.id = a.lead_id
        WHERE a.wa_reminder_sent_at IS NULL
          AND a.lead_id IS NOT NULL
          AND COALESCE(a.reminder_minutes_before, 0) > 0
          AND a.status IN ('pending', 'confirmed')
          AND a.start_at > NOW()
          AND a.start_at <= NOW() + make_interval(mins => a.reminder_minutes_before)
          AND l.phone IS NOT NULL
        ORDER BY a.start_at ASC
        LIMIT 200
        `,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`WhatsApp reminder sweep query failed: ${err?.message}`);
      return;
    }

    for (const row of due) {
      if (!row.conversation_id) {
        // No conversation to attach the message to — mark handled so the sweep
        // does not keep re-scanning this row every 10 minutes.
        await this.markSent(row.id);
        continue;
      }
      const message = this.reminderText(row.title, row.start_at, row.timezone);
      try {
        await this.twilioWhatsApp.sendAiReply(
          row.lead_id,
          row.conversation_id,
          message,
        );
        await this.markSent(row.id);
      } catch (err: any) {
        const msg = String(err?.message || '');
        // If WhatsApp isn't configured for this run, stop trying this sweep.
        if (/not configured/i.test(msg)) {
          this.logger.warn('WhatsApp not configured; skipping reminder sweep');
          return;
        }
        this.logger.warn(
          `WhatsApp reminder failed for appointment ${row.id}: ${msg}`,
        );
      }
    }
  }

  private async markSent(id: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE appointments SET wa_reminder_sent_at = NOW() WHERE id = $1`,
        [id],
      );
    } catch (err: any) {
      this.logger.warn(`Could not mark WhatsApp reminder sent for ${id}: ${err?.message}`);
    }
  }

  private reminderText(
    title: string | null,
    startAt: string,
    tz: string | null,
  ): string {
    let when = startAt;
    try {
      when = new Intl.DateTimeFormat('en-US', {
        timeZone: tz || 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(startAt));
    } catch {
      /* keep raw */
    }
    return `Reminder: your ${title || 'property viewing'} is on ${when}. See you then! Reply here if you need to reschedule.`;
  }
}
