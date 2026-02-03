import { Injectable, Logger } from '@nestjs/common';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';
import { LeadMessagesService, LeadMessage } from './lead-messages.service';
import { ConversationsService } from './conversations.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';

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
  ) {}

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
