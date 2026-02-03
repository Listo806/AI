import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';

export type RouteAction = 'reply_ai' | 'notify_agent';

const HUMAN_KEYWORDS = ['human', 'agent', 'call me'];

@Injectable()
export class WhatsAppRoutingService {
  private readonly logger = new Logger(WhatsAppRoutingService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
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

    if (conv.ownership === 'human') {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'ownership is human');
      return { action: 'notify_agent', reason: 'ownership_human' };
    }

    if (!conv.ai_enabled) {
      await this.logRoutingEvent(conversationId, 'notify_agent', 'ai_disabled');
      return { action: 'notify_agent', reason: 'ai_disabled' };
    }

    const text = (messageText || '').toLowerCase();
    for (const kw of HUMAN_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        await this.conversations.updateOwnership(conversationId, 'human');
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
