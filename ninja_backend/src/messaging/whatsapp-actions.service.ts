import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';

@Injectable()
export class WhatsAppActionsService {
  private readonly logger = new Logger(WhatsAppActionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
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
    if (payload.actionType === 'HABLAR_CON_AGENTE' && payload.conversationId) {
      await this.conversations.updateOwnership(payload.conversationId, 'human');
      this.logger.log(`WhatsApp action ${payload.actionType}: set ownership human for conversation ${payload.conversationId}`);
    }
  }
}
