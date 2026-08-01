import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';
import { LeadMessagesService } from './lead-messages.service';
import { IntentEventsService } from './intent-events.service';
import { LeadStateService } from '../leads/services/lead-state.service';
import { WhatsAppAiReplyService } from './whatsapp-ai-reply.service';
import { WhatsAppAiBookingService } from './whatsapp-ai-booking.service';

/**
 * In-browser "simulate a WhatsApp chat" for the Test AI panel.
 *
 * It drives the REAL bot (WhatsAppAiReplyService.replyWithAi → intent,
 * qualification, lead-state, booking) against a dedicated per-team sentinel lead
 * (leads.source = 'ai_sim'). The only thing bypassed is the Twilio transport —
 * TwilioWhatsAppService.sendAiReply short-circuits for that lead and just
 * records the outbound turn — so the whole flow can be exercised with no phone.
 *
 * reset() wipes the sentinel lead's conversation, messages, intents, state, and
 * any appointments it booked, so each test starts clean.
 */
@Injectable()
export class WhatsAppAiSimulatorService {
  private readonly logger = new Logger(WhatsAppAiSimulatorService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
    private readonly leadMessages: LeadMessagesService,
    private readonly intents: IntentEventsService,
    private readonly leadState: LeadStateService,
    private readonly aiReply: WhatsAppAiReplyService,
    private readonly booking: WhatsAppAiBookingService,
  ) {}

  async simulate(
    teamId: string,
    userId: string | null,
    text: string,
  ): Promise<{
    reply: string;
    leadState: string;
    bookingEnabled: boolean;
    note?: string;
  }> {
    const message = String(text || '').trim();
    const bookingEnabled = await this.booking.isEnabled(teamId);
    if (!message) {
      return { reply: '', leadState: 'new', bookingEnabled, note: 'Empty message.' };
    }

    const leadId = await this.ensureSimLead(teamId, userId);
    const { conversation } = await this.conversations.getOrCreateForLead(leadId, {
      ownership: 'ai',
      ai_enabled: true,
    });

    // Record the browser message as an inbound lead turn (so history + signal
    // extraction see it), then seed the intent the real inbound flow would.
    await this.leadMessages.create({
      lead_id: leadId,
      channel: 'whatsapp',
      direction: 'inbound',
      body: message,
      status: 'delivered',
      sender_type: 'lead',
      conversation_id: conversation.id,
    });
    try {
      await this.intents.createIfAllowed({
        conversationId: conversation.id,
        leadId,
        detectedFrom: 'text',
        text: message,
      });
    } catch (err: any) {
      this.logger.warn(`simulate: intent seed failed: ${err?.message}`);
    }

    const res = await this.aiReply.replyWithAi(conversation.id, leadId, 'sim');
    const leadState = await this.leadState.getState(leadId);
    const reply = res.reply || '';

    return {
      reply,
      leadState,
      bookingEnabled,
      note: reply ? undefined : this.describeEmpty(leadState, bookingEnabled),
    };
  }

  async reset(teamId: string): Promise<{ ok: boolean }> {
    const { rows } = await this.db.query(
      `SELECT id FROM leads WHERE team_id = $1 AND source = 'ai_sim' LIMIT 1`,
      [teamId],
    );
    const leadId = rows[0]?.id;
    if (!leadId) return { ok: true };

    // Best-effort cleanup; each statement is independent.
    for (const q of [
      `DELETE FROM appointments WHERE team_id = $1 AND lead_id = $2`,
      `DELETE FROM intent_events WHERE lead_id = $2`,
      `DELETE FROM lead_messages WHERE lead_id = $2`,
      `DELETE FROM conversations WHERE lead_id = $2`,
      `UPDATE leads SET lead_ai_state = 'new', booking_prompt_count = 0 WHERE id = $2`,
    ]) {
      try {
        await this.db.query(q, [teamId, leadId]);
      } catch (err: any) {
        this.logger.warn(`simulate reset step failed: ${err?.message}`);
      }
    }
    return { ok: true };
  }

  private async ensureSimLead(
    teamId: string,
    userId: string | null,
  ): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT id FROM leads WHERE team_id = $1 AND source = 'ai_sim' LIMIT 1`,
      [teamId],
    );
    if (rows[0]?.id) return rows[0].id;

    // A clearly-fake, never-dialed placeholder phone; the Twilio path is
    // short-circuited for this lead so it is never used to send anything.
    const phone = `+1555${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
    const { rows: created } = await this.db.query(
      `INSERT INTO leads (name, phone, status, created_by, team_id, source, first_source, created_at, updated_at)
       VALUES ('AI Test (simulator)', $1, 'new', $2, $3, 'ai_sim', 'ai_sim', NOW(), NOW())
       RETURNING id`,
      [phone, userId, teamId],
    );
    return created[0].id;
  }

  private describeEmpty(leadState: string, bookingEnabled: boolean): string {
    if (leadState === 'escalated_to_human') {
      return bookingEnabled
        ? 'The AI handed this conversation to a human agent.'
        : 'The AI qualified the lead and handed it to a human. Turn on "Let the AI book viewings over WhatsApp" in Appointment Rules to have it book automatically.';
    }
    return 'No reply was generated for this message.';
  }
}
