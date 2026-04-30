import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { QrConversationRow } from './whatsapp-qr-conversation.service';

export type QrRouteAction = 'reply_ai' | 'notify_agent';

const HUMAN_KEYWORDS = ['human', 'agent', 'call me', 'llamame', 'hablar con'];

@Injectable()
export class WhatsAppQrRoutingService {
  private readonly logger = new Logger(WhatsAppQrRoutingService.name);

  constructor(private readonly db: DatabaseService) {}

  async logRoute(params: {
    qrConversationId: string;
    leadId: string;
    route: QrRouteAction;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO routing_events_qr (qr_conversation_id, lead_id, route) VALUES ($1, $2, $3)`,
      [params.qrConversationId, params.leadId, params.route],
    );
  }

  async route(
    conv: QrConversationRow,
    messageText: string,
  ): Promise<{ action: QrRouteAction; reason: string }> {
    if (conv.owner_type === 'human') {
      await this.logRoute({
        qrConversationId: conv.id,
        leadId: conv.lead_id,
        route: 'notify_agent',
      });
      return { action: 'notify_agent', reason: 'owner_human' };
    }

    // Use session owner's team (same as AI Auto-Reply page) so "turn on" there applies here
    const { rows: teamRows } = await this.db.query(
      `SELECT t.ai_auto_reply_enabled FROM users u
       INNER JOIN teams t ON t.id = u.team_id
       WHERE u.id = $1`,
      [conv.user_id],
    );
    if (teamRows.length && teamRows[0].ai_auto_reply_enabled === false) {
      await this.logRoute({
        qrConversationId: conv.id,
        leadId: conv.lead_id,
        route: 'notify_agent',
      });
      return { action: 'notify_agent', reason: 'team_auto_reply_off' };
    }

    const text = (messageText || '').toLowerCase();
    for (const kw of HUMAN_KEYWORDS) {
      if (text.includes(kw)) {
        await this.logRoute({
          qrConversationId: conv.id,
          leadId: conv.lead_id,
          route: 'notify_agent',
        });
        return { action: 'notify_agent', reason: `keyword_${kw}` };
      }
    }

    await this.logRoute({
      qrConversationId: conv.id,
      leadId: conv.lead_id,
      route: 'reply_ai',
    });
    return { action: 'reply_ai', reason: 'default' };
  }
}
