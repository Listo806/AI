import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { LeadMessagesService } from './lead-messages.service';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';

@Injectable()
export class InstagramWebhookService {
  private readonly logger = new Logger(InstagramWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly leadMessages: LeadMessagesService,
    private readonly instagramConnections: AgentInstagramConnectionService,
  ) {}

  verify(mode: string, token: string, challenge: string): string | null {
    const expected = this.config.get('META_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected && challenge) {
      return challenge;
    }
    return null;
  }

  async handle(body: any): Promise<void> {
    if (!body || body.object !== 'instagram') return;
    const entry = body.entry;
    if (!Array.isArray(entry)) return;

    for (const item of entry) {
      const messaging = item.messaging;
      if (!Array.isArray(messaging)) continue;
      for (const ev of messaging) {
        await this.processMessage(ev, item.id);
      }
    }
  }

  private async processMessage(ev: any, pageOrIgId: string): Promise<void> {
    const senderId = ev.sender?.id;
    const recipientId = ev.recipient?.id;
    const message = ev.message;
    if (!senderId || !recipientId || !message) return;

    const text = message.text || (message.attachments?.length ? '[attachment]' : '') || '';
    const mid = message.mid || '';

    const agentId = await this.instagramConnections.getAgentByInstagramAccountId(recipientId);
    if (!agentId) {
      this.logger.warn(`Instagram webhook: no agent for recipient ${recipientId}`);
      return;
    }

    const { rows } = await this.db.query(
      `SELECT id FROM leads WHERE instagram_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [senderId],
    );
    if (!rows.length) {
      this.logger.warn(`Instagram webhook: no lead for sender ${senderId}`);
      return;
    }
    const leadId = rows[0].id;

    await this.leadMessages.create({
      lead_id: leadId,
      channel: 'instagram_dm',
      direction: 'inbound',
      external_id: mid,
      body: text || null,
      status: 'sent',
      metadata: { sender: ev.sender, recipient: ev.recipient },
      sender_type: 'agent',
      agent_id: agentId,
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'instagram_dm', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [leadId],
    );
    this.logger.log(`Instagram inbound stored: lead=${leadId} agent=${agentId}`);
  }
}
