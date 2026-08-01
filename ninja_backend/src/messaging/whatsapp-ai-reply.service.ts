import { Injectable, Logger } from '@nestjs/common';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';
import { LeadMessagesService, LeadMessage } from './lead-messages.service';
import { ConversationsService } from './conversations.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { IntentEventsService, IntentType } from './intent-events.service';
import { EntityParsingService } from './entity-parsing.service';
import { LeadStateService } from '../leads/services/lead-state.service';
import { PropertyMatchingService } from '../properties/property-matching.service';
import { AiPropertyVisibilityService } from './ai-property-visibility.service';
import { DatabaseService } from '../database/database.service';
import { WhatsAppAiBookingService } from './whatsapp-ai-booking.service';

const CONTEXT_MESSAGE_LIMIT = 30;
const WHATSAPP_SYSTEM_PROMPT = `You are a helpful real estate assistant replying over WhatsApp. Be concise, friendly, and professional. Answer in the same language the lead uses when possible.`;

@Injectable()
export class WhatsAppAiReplyService {
  private readonly logger = new Logger(WhatsAppAiReplyService.name);

  constructor(
    private readonly aiAssistant: AiAssistantService,
    private readonly leadMessages: LeadMessagesService,
    private readonly conversations: ConversationsService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
    private readonly intents: IntentEventsService,
    private readonly entityParsing: EntityParsingService,
    private readonly leadState: LeadStateService,
    private readonly propertyMatching: PropertyMatchingService,
    private readonly aiPropertyVisibility: AiPropertyVisibilityService,
    private readonly db: DatabaseService,
    private readonly booking: WhatsAppAiBookingService,
  ) {}

  private detectSpanish(text: string): boolean {
    const t = (text || '').toLowerCase();
    return /(\bhola\b|\bgracias\b|\bquiero\b|\bcomprar\b|\balquilar\b|\basesor\b|\bagente\b|\bciudad\b)/.test(t);
  }

  private extractSignals(messages: LeadMessage[]): {
    city?: string;
    property_type?: string;
    budget?: string;
    monthly_budget?: string;
    zone?: string;
    lastLeadText?: string;
  } {
    const s: any = {};
    const lastLead = [...messages].reverse().find((m) => m.sender_type === 'lead' && m.body);
    s.lastLeadText = lastLead?.body || '';

    const text = messages
      .filter((m) => m.sender_type === 'lead')
      .map((m) => (m.body || '').toLowerCase())
      .join('\n');

    // City (very lightweight): look for "en <word>" / "in <word>" / "ciudad: <...>"
    const cityMatch =
      text.match(/(?:ciudad\s*[:\-]\s*)([a-z\s]{2,40})/) ||
      text.match(/\b(en|in)\s+([a-z]{2,25})\b/);
    if (cityMatch) s.city = (cityMatch[2] || cityMatch[1] || '').trim();

    // Property type
    const typeMap: Array<[RegExp, string]> = [
      [/\b(apartamento|apartment|depto|departamento|flat|studio)\b/, 'apartment'],
      [/\b(casa|house|home)\b/, 'house'],
      [/\b(condo|condominio)\b/, 'condo'],
      [/\b(terreno|land|lot)\b/, 'land'],
    ];
    for (const [re, val] of typeMap) {
      if (re.test(text)) {
        s.property_type = val;
        break;
      }
    }

    // Budget detection
    const money = text.match(/(\$|usd|d[oó]lares)?\s*([0-9]{2,3}(?:[.,][0-9]{3})+|[0-9]{3,7})/);
    if (money) {
      const amount = money[2].replace(/\./g, '').replace(/,/g, '');
      const isMonthly = /(mensual|al mes|por mes|\/mes|per month|monthly)/.test(text);
      if (isMonthly) s.monthly_budget = amount;
      else s.budget = amount;
    }

    // Zone/neighborhood/address (sell)
    const zoneMatch =
      text.match(/(?:zona|barrio|vecindario|neighborhood)\s*[:\-]?\s*([a-z0-9\s]{2,60})/) ||
      text.match(/(?:direcci[oó]n|address)\s*[:\-]?\s*([a-z0-9\s]{5,80})/);
    if (zoneMatch) s.zone = (zoneMatch[1] || '').trim();

    return s;
  }

  private determineNextQuestion(intent: IntentType, signals: any): { block_ai: boolean; question?: string; qualified: boolean } {
    const missing: string[] = [];
    if (intent === 'buy' || intent === 'rent') {
      if (!signals.city) missing.push('city');
      if (!signals.property_type) missing.push('property_type');
      if (intent === 'buy') {
        if (!signals.budget) missing.push('budget');
      } else {
        if (!signals.monthly_budget) missing.push('monthly_budget');
      }
    } else if (intent === 'sell') {
      if (!signals.city) missing.push('city');
      if (!signals.property_type) missing.push('property_type');
      if (!signals.zone) missing.push('zone');
    }

    const qualified = missing.length === 0 && intent !== 'general' && intent !== 'agent_request';
    if (missing.length === 0) return { block_ai: false, qualified };

    const es = this.detectSpanish(signals.lastLeadText || '');

    // One short message, only missing fields.
    const q = ((): string => {
      if (intent === 'rent') {
        if (es) return 'Para ayudarte mejor, ¿en qué ciudad buscas y cuál es tu presupuesto mensual aproximado?';
        return 'To help you better, what city are you looking in and what is your approximate monthly budget?';
      }
      if (intent === 'buy') {
        if (es) return 'Para ayudarte mejor, ¿en qué ciudad buscas y cuál es tu presupuesto aproximado de compra?';
        return 'To help you better, what city are you looking in and what is your approximate purchase budget?';
      }
      if (intent === 'sell') {
        if (es) return 'Para ayudarte mejor, ¿en qué ciudad está la propiedad y en qué zona/barrio (o dirección aproximada)?';
        return 'To help you better, what city is the property in and what neighborhood/zone (or approximate address)?';
      }
      if (es) return '¿Me puedes dar un poco más de contexto para ayudarte mejor?';
      return 'Can you share a bit more context so I can help you better?';
    })();

    return { block_ai: true, question: q, qualified: false };
  }

  /**
   * Build chat payload from conversation messages and optional lead context.
   * Inbound (lead) -> user; outbound (agent/ai/platform) -> assistant.
   */
  private messagesToChatPayload(messages: LeadMessage[], leadContext?: string): ChatMessage[] {
    const out: ChatMessage[] = [];
    if (leadContext) {
      out.push({ role: 'system', content: WHATSAPP_SYSTEM_PROMPT + '\n\nLead context: ' + leadContext });
    } else {
      out.push({ role: 'system', content: WHATSAPP_SYSTEM_PROMPT });
    }
    for (const m of messages) {
      const content = (m.body || '').trim();
      if (!content) continue;
      const prefix = m.channel ? `[${m.channel}] ` : '';
      const role = m.direction === 'inbound' || m.sender_type === 'lead' ? 'user' : 'assistant';
      out.push({ role, content: prefix + content });
    }
    return out;
  }

  /**
   * Reply with AI: strict decision ladder.
   * 1) Check missing required info -> ask only missing
   * 2) When sufficient -> qualify
   * 3) Attempt booking if calendar exists
   * 4) If no calendar -> booking_blocked
   * 5) Escalate only if lead requests human or qualified+blocked
   */
  async replyWithAi(
    conversationId: string,
    leadId: string,
    leadPhone: string,
    leadContext?: string,
  ): Promise<{ reply: string; messageId?: string; logMetadata?: Record<string, unknown> }> {
    const conv = await this.conversations.findById(conversationId);
    if (!conv) {
      this.logger.warn(`replyWithAi: conversation ${conversationId} not found`);
      return { reply: '' };
    }
    if (conv.ownership !== 'ai' || !conv.ai_enabled || conv.status !== 'open') {
      this.logger.warn(`replyWithAi: conversation ${conversationId} not eligible`);
      return { reply: '' };
    }

    const { rows: leadRows } = await this.db.query(
      `SELECT team_id as "teamId" FROM leads WHERE id = $1`,
      [leadId],
    );
    const teamId = leadRows[0]?.teamId;

    const leadStateBefore = await this.leadState.getState(leadId);
    if (leadStateBefore === 'escalated_to_human') {
      return { reply: '' };
    }

    const persisted = await this.entityParsing.getForLead(leadId);
    const history = await this.leadMessages.findByConversation(conversationId, CONTEXT_MESSAGE_LIMIT);

    // AI booking (opt-in per team): if this lead is already mid-booking, handle
    // the time reply / reschedule directly and skip re-qualification. When the
    // team flag is off, this whole block is inert and the flow is unchanged.
    if (
      teamId &&
      (leadStateBefore === 'booking_offered' || leadStateBefore === 'booked')
    ) {
      const rules = await this.booking.getRules(teamId);
      if (rules.bookingEnabled) {
        const bctx = { teamId, leadId, conversationId, rules, history, leadStateBefore };
        if (leadStateBefore === 'booking_offered') {
          return this.booking.onBookingReply(bctx);
        }
        const followUp = await this.booking.onBookedFollowUp(bctx);
        if (followUp.handled) {
          return {
            reply: followUp.reply || '',
            messageId: followUp.messageId,
            logMetadata: followUp.logMetadata,
          };
        }
        // A booked lead said something that isn't a scheduling change — answer
        // it with the normal assistant, but do NOT re-run qualification/booking
        // (which would re-offer a viewing to someone already booked).
        return this.freeformChatReply(
          conversationId,
          leadId,
          teamId,
          history,
          leadContext,
          persisted,
          leadStateBefore,
        );
      }
    }

    const signals = this.extractSignals(history);
    const merged = {
      city: persisted.city || signals.city,
      budget: persisted.budget_max != null ? String(persisted.budget_max) : signals.budget,
      monthly_budget: signals.monthly_budget || (persisted.budget_max != null && persisted.intent === 'rent' ? String(persisted.budget_max) : undefined),
      property_type: signals.property_type,
      zone: signals.zone,
      lastLeadText: signals.lastLeadText,
    };

    const latestIntent = await this.intents.getLatestForConversation(conversationId);
    const raw = (latestIntent?.intent_type as IntentType) || 'general';
    const intent: IntentType =
      raw === 'buyer_search' ? 'buy' :
      raw === 'seller_listing' ? 'sell' :
      raw === 'agent_crm' || raw === 'general_support' ? 'general' :
      raw;

    if (intent === 'agent_request') {
      await this.leadState.transition(leadId, 'escalated_to_human', 'lead_requested');
      const logMeta = { parsed_entities: persisted, decision: 'escalate', reason: 'lead_requested', lead_state_before: leadStateBefore, lead_state_after: 'escalated_to_human' };
      if (teamId) await this.logAiActivity(teamId, leadId, 'escalated', 'whatsapp', 'lead_requested', logMeta);
      return { reply: '', logMetadata: logMeta };
    }

    const nextq = this.determineNextQuestion(intent, merged);

    if (nextq.block_ai && nextq.question) {
      await this.leadState.transition(leadId, 'collecting_info', 'ask_missing');
      const sent = await this.twilioWhatsApp.sendAiReply(leadId, conversationId, nextq.question);
      const logMeta = {
        parsed_entities: persisted,
        decision: 'ask',
        lead_state_before: leadStateBefore,
        lead_state_after: 'collecting_info',
        question_asked: 'missing_info',
      };
      if (teamId) await this.logAiActivity(teamId, leadId, 'auto_reply', 'whatsapp', 'ask_missing', logMeta);
      return { reply: nextq.question, messageId: sent.messageId, logMetadata: logMeta };
    }

    if (nextq.qualified) {
      await this.leadState.transition(leadId, 'qualified', 'info_complete');
      await this.conversations.advanceStage(conversationId, 'qualified');

      const { properties, matchCount } = await this.propertyMatching.findEligibleForLead(leadId, teamId ?? null);

      // AI booking path (opt-in per team). When the team has turned booking on,
      // offer a viewing and drive the scheduling conversation instead of the
      // legacy "qualified but no calendar -> escalate" hand-off below.
      if (teamId) {
        const rules = await this.booking.getRules(teamId);
        if (rules.bookingEnabled) {
          for (const p of properties.slice(0, 10)) {
            await this.aiPropertyVisibility.recordMatched(leadId, p.id);
          }
          return this.booking.onQualified({
            teamId,
            leadId,
            conversationId,
            rules,
            history,
            leadStateBefore,
            propertyId: properties[0]?.id ?? null,
          });
        }
      }

      const hasCalendar = false; // TODO: check team integrations for connected calendar

      if (!hasCalendar) {
        await this.leadState.transition(leadId, 'booking_blocked', 'no_calendar');
        await this.leadState.transition(leadId, 'escalated_to_human', 'qualified_but_blocked');
        const logMeta = {
          parsed_entities: persisted,
          decision: 'escalate',
          reason: 'qualified_but_blocked',
          lead_state_before: leadStateBefore,
          lead_state_after: 'escalated_to_human',
          booking_eligibility: 'blocked',
          match_count: matchCount,
        };
        if (teamId) await this.logAiActivity(teamId, leadId, 'escalated', 'whatsapp', 'qualified_but_blocked', logMeta);
        return { reply: '', logMetadata: logMeta };
      }

      // Record matched properties for visibility tracking
      for (const p of properties.slice(0, 10)) {
        await this.aiPropertyVisibility.recordMatched(leadId, p.id);
      }
      const logMeta = {
        parsed_entities: persisted,
        decision: 'qualify',
        lead_state_before: leadStateBefore,
        lead_state_after: 'qualified',
        booking_eligibility: 'allowed',
        match_count: matchCount,
      };
      if (teamId) await this.logAiActivity(teamId, leadId, 'auto_reply', 'whatsapp', 'qualified', logMeta);
    }

    return this.freeformChatReply(
      conversationId,
      leadId,
      teamId,
      history,
      leadContext,
      persisted,
      leadStateBefore,
    );
  }

  /**
   * General assistant reply (no qualification / no booking). Used as the normal
   * tail of the flow, and for a booked lead whose message is just a question
   * rather than a scheduling change.
   */
  private async freeformChatReply(
    conversationId: string,
    leadId: string,
    teamId: string | undefined,
    history: LeadMessage[],
    leadContext: string | undefined,
    persisted: any,
    leadStateBefore: string,
  ): Promise<{ reply: string; messageId?: string; logMetadata?: Record<string, unknown> }> {
    const chatMessages = this.messagesToChatPayload(history, leadContext);
    if (chatMessages.length <= 1) {
      this.logger.warn('replyWithAi: no conversation history to reply to');
      return { reply: '' };
    }

    let reply: string;
    try {
      const result = await this.aiAssistant.chat({ messages: chatMessages });
      reply = (result.message || '').trim();
    } catch (err: any) {
      this.logger.error(`replyWithAi: AI chat failed: ${err?.message}`);
      return { reply: '' };
    }

    if (!reply) return { reply: '' };

    try {
      const sent = await this.twilioWhatsApp.sendAiReply(leadId, conversationId, reply);
      const logMeta = {
        parsed_entities: persisted,
        decision: 'chat',
        lead_state_before: leadStateBefore,
        lead_state_after: await this.leadState.getState(leadId),
      };
      if (teamId) await this.logAiActivity(teamId, leadId, 'auto_reply', 'whatsapp', 'sent', logMeta);
      return { reply, messageId: sent.messageId, logMetadata: logMeta };
    } catch (err: any) {
      this.logger.error(`replyWithAi: Twilio send failed: ${err?.message}`);
      return { reply };
    }
  }

  private async logAiActivity(
    teamId: string,
    leadId: string,
    action: string,
    channel: string,
    outcome: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO ai_activity (team_id, action, lead_id, channel, outcome, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [teamId, action, leadId, channel, outcome, metadata ? JSON.stringify(metadata) : null],
      );
    } catch (err: any) {
      this.logger.warn(`logAiActivity failed: ${err?.message}`);
    }
  }
}
