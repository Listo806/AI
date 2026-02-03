import { Injectable, Logger } from '@nestjs/common';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';
import { LeadMessagesService, LeadMessage } from './lead-messages.service';
import { ConversationsService } from './conversations.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { IntentEventsService, IntentType } from './intent-events.service';

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
      text.match(/(?:ciudad\\s*[:\\-]\\s*)([a-z\\s]{2,40})/) ||
      text.match(/\\b(en|in)\\s+([a-z]{2,25})\\b/);
    if (cityMatch) s.city = (cityMatch[2] || cityMatch[1] || '').trim();

    // Property type
    const typeMap: Array<[RegExp, string]> = [
      [/\\b(apartamento|apartment|depto|departamento|flat|studio)\\b/, 'apartment'],
      [/\\b(casa|house|home)\\b/, 'house'],
      [/\\b(condo|condominio)\\b/, 'condo'],
      [/\\b(terreno|land|lot)\\b/, 'land'],
    ];
    for (const [re, val] of typeMap) {
      if (re.test(text)) {
        s.property_type = val;
        break;
      }
    }

    // Budget detection
    const money = text.match(/(\\$|usd|d[oó]lares)?\\s*([0-9]{2,3}(?:[.,][0-9]{3})+|[0-9]{3,7})/);
    if (money) {
      const amount = money[2].replace(/\\./g, '').replace(/,/g, '');
      const isMonthly = /(mensual|al mes|por mes|\/mes|per month|monthly)/.test(text);
      if (isMonthly) s.monthly_budget = amount;
      else s.budget = amount;
    }

    // Zone/neighborhood/address (sell)
    const zoneMatch =
      text.match(/(?:zona|barrio|vecindario|neighborhood)\\s*[:\\-]?\\s*([a-z0-9\\s]{2,60})/) ||
      text.match(/(?:direcci[oó]n|address)\\s*[:\\-]?\\s*([a-z0-9\\s]{5,80})/);
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
   * Reply with AI: load last N messages, call AiAssistantService.chat(), send via Twilio, persist.
   * Caller must ensure routing already decided reply_ai and conversation ownership/ai_enabled/status allow AI.
   */
  async replyWithAi(conversationId: string, leadId: string, leadPhone: string, leadContext?: string): Promise<{ reply: string; messageId?: string }> {
    const conv = await this.conversations.findById(conversationId);
    if (!conv) {
      this.logger.warn(`replyWithAi: conversation ${conversationId} not found`);
      return { reply: '' };
    }
    if (conv.ownership !== 'ai' || !conv.ai_enabled || conv.status !== 'open') {
      this.logger.warn(`replyWithAi: conversation ${conversationId} not eligible (ownership=${conv.ownership}, ai_enabled=${conv.ai_enabled}, status=${conv.status})`);
      return { reply: '' };
    }

    const history = await this.leadMessages.findByConversation(conversationId, CONTEXT_MESSAGE_LIMIT);

    // Deterministic next-question control (no free-chat).
    const latestIntent = await this.intents.getLatestForConversation(conversationId);
    const intent: IntentType = (latestIntent?.intent_type as IntentType) || 'general';
    if (intent === 'agent_request') {
      // routing should have escalated already, but never reply here
      return { reply: '' };
    }
    const signals = this.extractSignals(history);
    const nextq = this.determineNextQuestion(intent, signals);
    if (nextq.qualified) {
      await this.conversations.advanceStage(conversationId, 'qualified');
    }
    if (nextq.block_ai && nextq.question) {
      const sent = await this.twilioWhatsApp.sendAiReply(leadId, conversationId, nextq.question);
      return { reply: nextq.question, messageId: sent.messageId };
    }

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
      reply = ''; // Do not send on AI failure; agent can pick up
      return { reply };
    }

    if (!reply) return { reply: '' };

    try {
      const sent = await this.twilioWhatsApp.sendAiReply(leadId, conversationId, reply);
      return { reply, messageId: sent.messageId };
    } catch (err: any) {
      this.logger.error(`replyWithAi: Twilio send failed: ${err?.message}`);
      return { reply }; // Reply was generated but not sent
    }
  }
}
