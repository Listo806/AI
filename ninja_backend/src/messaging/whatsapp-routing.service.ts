import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';
import { IntentEventsService } from './intent-events.service';

export type RouteAction = 'reply_ai' | 'notify_agent';

const HUMAN_KEYWORDS = ['human', 'agent', 'call me'];

@Injectable()
export class WhatsAppRoutingService {
  private readonly logger = new Logger(WhatsAppRoutingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
    private readonly intents: IntentEventsService,
  ) {}

  /**
   * Deterministic routing: reply_ai or notify_agent.
   * Rules:
   * 1) ownership === 'human' -> notify_agent
   * 2) ai_enabled === false -> notify_agent
   * 3) message contains keywords (human, agent, call me) -> set ownership human, notify_agent
   * 4) else -> reply_ai
   */
  async routeMessage(conversationId: string, messageText: string): Promise<{ action: RouteAction; reason: string }> {
    const conv = await this.conversations.findById(conversationId);
    if (!conv) {
      this.logger.warn(`routeMessage: conversation ${conversationId} not found`);
      return { action: 'notify_agent', reason: 'conversation_not_found' };
    }

    // 0) closed -> notify_agent (or ignore). We notify and log.
    if (conv.status === 'closed' || conv.stage === 'closed') {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'conversation_closed');
      return { action: 'notify_agent', reason: 'conversation_closed' };
    }

    if (conv.ownership === 'human') {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'ownership is human');
      return { action: 'notify_agent', reason: 'ownership_human' };
    }

    if (!conv.ai_enabled) {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'ai_disabled');
      return { action: 'notify_agent', reason: 'ai_disabled' };
    }

    // 2.5) Team-level AI Auto-Reply OFF (AI Center setting) -> notify_agent, no AI reply
    const { rows: teamRows } = await this.db.query(
      `SELECT t.ai_auto_reply_enabled FROM conversations c
       INNER JOIN leads l ON l.id = c.lead_id
       INNER JOIN teams t ON t.id = l.team_id
       WHERE c.id = $1`,
      [conversationId],
    );
    if (teamRows.length && teamRows[0].ai_auto_reply_enabled === false) {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'team_auto_reply_off');
      return { action: 'notify_agent', reason: 'team_auto_reply_off' };
    }

    // 3) intent escalation: use latest intent from DB (ORDER BY created_at DESC LIMIT 1)
    //    so routing reflects most recent intent from button action or prior message, not just current pass.
    const latestIntent = await this.intents.getLatestForConversation(conversationId);
    if (latestIntent?.intent_type === 'agent_request') {
      await this.conversations.updateOwnership(conversationId, 'human');
      await this.conversations.advanceStage(conversationId, 'escalated');
      await this.logRoutingEvent(conversationId, 'notify_agent', 'intent_agent_request');
      return { action: 'notify_agent', reason: 'intent_agent_request' };
    }

    const text = (messageText || '').toLowerCase();
    for (const kw of HUMAN_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        await this.conversations.updateOwnership(conversationId, 'human');
        await this.conversations.advanceStage(conversationId, 'escalated');
        await this.logRoutingEvent(conversationId, 'notify_agent', `keyword: ${kw}`);
        return { action: 'notify_agent', reason: `keyword_${kw}` };
      }
    }

    await this.logRoutingEvent(conversationId, 'reply_ai', 'default');
    return { action: 'reply_ai', reason: 'default' };
  }

  async logRoutingEvent(conversationId: string, action: RouteAction, reason: string): Promise<void> {
    await this.db.query(
      `INSERT INTO routing_events (conversation_id, action, reason) VALUES ($1, $2, $3)`,
      [conversationId, action, reason],
    );
  }
}
