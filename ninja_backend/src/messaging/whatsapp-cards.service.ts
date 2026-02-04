import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { LeadMessagesService } from './lead-messages.service';
import { ConversationsService } from './conversations.service';

@Injectable()
export class WhatsAppCardsService {
  private readonly logger = new Logger(WhatsAppCardsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
    private readonly leadMessages: LeadMessagesService,
    private readonly conversations: ConversationsService,
  ) {}

  /**
   * Send property card as text + optional link. Stores message_type='card', meta with payload.
   */
  async sendPropertyCard(
    conversationId: string,
    propertyId: string,
    senderType: 'platform' | 'agent',
    userId: string,
    teamId: string | null,
  ): Promise<{ messageId: string }> {
    const conv = await this.conversations.assertTeamAccess(conversationId, teamId);
    const { rows } = await this.db.query(
      `SELECT id, title, address, city, state, price, bedrooms, bathrooms, type FROM properties WHERE id = $1`,
      [propertyId],
    );
    if (!rows.length) throw new BadRequestException('Property not found');
    const prop = rows[0];
    const location = [prop.address, prop.city, prop.state].filter(Boolean).join(', ');
    const body = [
      `🏠 ${prop.title || 'Property'}`,
      location && `📍 ${location}`,
      prop.price != null && `💰 $${Number(prop.price).toLocaleString()}`,
      prop.bedrooms != null && `🛏 ${prop.bedrooms} beds`,
      prop.bathrooms != null && `🛁 ${prop.bathrooms} baths`,
      prop.type && `Type: ${prop.type}`,
    ]
      .filter(Boolean)
      .join('\n');
    const link = await this.generateWebViewLink('property', propertyId);
    const message = link ? `${body}\n\n${link}` : body;
    const result = await this.twilioWhatsApp.sendForLead(
      {
        leadId: conv.lead_id,
        message,
        senderType,
        conversationId,
        message_type: 'card',
        meta: { propertyId, link },
      },
      userId,
      teamId,
    );
    await this.conversations.advanceStage(conversationId, 'presented');
    return { messageId: result.messageId };
  }

  /**
   * Generate signed URL for web view (tokenized, expiry-based).
   */
  async generateWebViewLink(type: string, entityId: string, expiryHours = 24): Promise<string> {
    const baseUrl = this.config.get('WEBVIEW_BASE_URL') || this.config.get('FRONTEND_URL') || '';
    if (!baseUrl) return '';
    const secret = this.config.get('WEBVIEW_LINK_SECRET') || this.config.get('JWT_SECRET') || 'change-me';
    const exp = Math.floor(Date.now() / 1000) + expiryHours * 3600;
    const payload = `${type}:${entityId}:${exp}`;
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ type, entityId, exp, sig })).toString('base64url');
    return `${baseUrl.replace(/\/$/, '')}/view?t=${token}`;
  }
}
