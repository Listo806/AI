import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';
import { IntentEventsService, IntentType } from './intent-events.service';

@Injectable()
export class WhatsAppActionsService {
  private readonly logger = new Logger(WhatsAppActionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
    private readonly intents: IntentEventsService,
  ) {}

  /**
   * Log button/action payload and optionally apply side effects (e.g. HABLAR_CON_AGENTE -> set ownership human).
   */
  async handleAction(payload: {
    conversationId?: string;
    leadId?: string;
    actionType: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO whatsapp_actions_log (conversation_id, lead_id, action_type, payload) VALUES ($1, $2, $3, $4)`,
      [
        payload.conversationId ?? null,
        payload.leadId ?? null,
        payload.actionType,
        payload.payload ? JSON.stringify(payload.payload) : null,
      ],
    );

    if (!payload.conversationId) return;

    // Button -> intent mapping (minimal)
    const mappedIntent = this.mapActionToIntent(payload.actionType, payload.payload);
    if (mappedIntent && payload.leadId) {
      await this.intents.createIfAllowed({
        conversationId: payload.conversationId,
        leadId: payload.leadId,
        detectedFrom: 'button',
        intentType: mappedIntent,
        confidence: mappedIntent === 'agent_request' ? 1.0 : 0.9,
      });
    }

    // Side effects
    if (mappedIntent === 'agent_request') {
      await this.conversations.updateOwnership(payload.conversationId, 'human');
      await this.conversations.advanceStage(payload.conversationId, 'escalated');
      this.logger.log(`WhatsApp action ${payload.actionType}: agent_request escalation for conversation ${payload.conversationId}`);
    }
  }

  private mapActionToIntent(actionType: string, payload?: Record<string, unknown>): IntentType | null {
    const a = (actionType || '').toUpperCase();
    if (a === 'HABLAR_CON_AGENTE' || a === 'CONTACT_AGENT') return 'agent_request';
    if (a === 'COMPRAR') return 'buy';
    if (a === 'ALQUILAR') return 'rent';
    if (a === 'CONFIRM_INTEREST') return 'general';
    // Supported actions (VIEW_PROPERTY, BOOK_SHOWING) are not intents by default.
    return null;
  }
}
