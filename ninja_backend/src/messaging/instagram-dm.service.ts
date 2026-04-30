import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { LeadMessagesService } from './lead-messages.service';
import { AgentInstagramConnectionService } from './agent-instagram-connection.service';

const META_GRAPH = 'https://graph.facebook.com/v18.0';

@Injectable()
export class InstagramDmService {
  private readonly logger = new Logger(InstagramDmService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly leadMessages: LeadMessagesService,
    private readonly instagramConnections: AgentInstagramConnectionService,
  ) {}

  /**
   * Send Instagram DM to a lead. Per-lead, per-action. Agent must own connected Instagram.
   */
  async sendForLead(leadId: string, message: string, userId: string, teamId: string | null): Promise<{ messageId: string }> {
    const conn = await this.instagramConnections.getForSend(userId);
    if (!conn) throw new BadRequestException('Instagram not connected. Connect via OAuth first.');

    const { rows } = await this.db.query(
      `SELECT id, instagram_id, team_id, created_by FROM leads WHERE id = $1`,
      [leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');
    const lead = rows[0];
    const allowed = lead.team_id === teamId || lead.created_by === userId;
    if (!allowed) throw new BadRequestException('Lead not found');

    const recipientId = lead.instagram_id;
    if (!recipientId || typeof recipientId !== 'string') {
      throw new BadRequestException('Lead has no Instagram ID for DM');
    }

    const text = message.slice(0, 1000);
    const res = await fetch(
      `${META_GRAPH}/me/messages?access_token=${encodeURIComponent(conn.accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );
    const data = (await res.json()) as { message_id?: string; error?: { message: string } };
    if (!res.ok || data.error) {
      this.logger.warn(`Instagram send failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(data.error?.message || 'Failed to send Instagram DM');
    }

    const messageId = data.message_id || '';
    await this.leadMessages.create({
      lead_id: leadId,
      channel: 'instagram_dm',
      direction: 'outbound',
      external_id: messageId,
      body: text,
      status: 'sent',
      sender_type: 'agent',
      agent_id: userId,
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'instagram_dm', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [leadId],
    );

    return { messageId };
  }
}
