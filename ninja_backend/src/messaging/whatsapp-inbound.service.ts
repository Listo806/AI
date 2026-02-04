import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { AgentWhatsAppConnectionService } from './agent-whatsapp-connection.service';
import { LeadMessagesService } from './lead-messages.service';
import { ConversationsService } from './conversations.service';
import { WhatsAppRoutingService } from './whatsapp-routing.service';
import { WhatsAppAiReplyService } from './whatsapp-ai-reply.service';
import { TwilioMediaService } from './twilio-media.service';
import { IntentEventsService } from './intent-events.service';

/** WhatsApp-first default: one immediate auto-reply for ad/landing first message (ES). */
const AD_GREETING_TEXT = 'Hola 👋 Soy el asistente de CORTEXA. ¿Buscas comprar, alquilar o vender?';

@Injectable()
export class WhatsAppInboundService {
  private readonly logger = new Logger(WhatsAppInboundService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
    private readonly agentConnections: AgentWhatsAppConnectionService,
    private readonly leadMessages: LeadMessagesService,
    private readonly conversations: ConversationsService,
    private readonly routing: WhatsAppRoutingService,
    private readonly aiReply: WhatsAppAiReplyService,
    private readonly twilioMedia: TwilioMediaService,
    private readonly intents: IntentEventsService,
  ) {}

  /**
   * Full inbound flow: resolve lead/conversation, handle audio, save message, detect ad,
   * route (reply_ai or notify_agent), send AI reply or ad greeting when applicable.
   */
  async handleInbound(payload: Record<string, string>): Promise<string> {
    const from = TwilioWhatsAppService.phoneFromTwilioAddress(payload.From || '');
    let body = (payload.Body || '').trim();
    const messageSid = payload.MessageSid || '';
    const numMedia = parseInt(payload.NumMedia || '0', 10);
    const mediaUrl0 = payload.MediaUrl0 || '';

    if (!from) {
      this.logger.warn('Inbound WhatsApp: missing or invalid From');
      return '<Response></Response>';
    }

    const resolved = await this.agentConnections.resolveReceivingNumber(payload.To || '');
    if (!resolved) {
      this.logger.warn(`Inbound WhatsApp: unknown receiving number To=${payload.To}, skipping store`);
      return '<Response></Response>';
    }

    const isAd = this.detectAdSource(payload);
    let lead = await this.twilioWhatsApp.findLeadByPhone(from);
    if (!lead && isAd) {
      const createdBy = this.config.get('WHATSAPP_FIRST_LEAD_CREATED_BY');
      if (createdBy) {
        lead = await this.upsertLeadFromAd(from, payload, createdBy);
        if (lead) this.logger.log(`Inbound WhatsApp: created lead from ad for phone ${from}`);
      }
    }
    if (!lead) {
      this.logger.warn(`Inbound WhatsApp: no lead for phone ${from}, skipping store`);
      return '<Response></Response>';
    }

    let messageType: 'text' | 'audio' = 'text';
    if (numMedia > 0 && mediaUrl0) {
      try {
        const buffer = await this.twilioMedia.downloadMedia(mediaUrl0);
        const contentType = payload.MediaContentType0 || '';
        const transcript = await this.twilioMedia.transcribeAudio(buffer, contentType);
        body = transcript || '[Voice message]';
        messageType = 'audio';
      } catch (err: any) {
        this.logger.warn(`Inbound WhatsApp: media download/transcribe failed: ${err?.message}`);
        body = body || '[Voice message]';
      }
    }

    const { conversation, created } = await this.conversations.getOrCreateForLead(lead.id, {
      ownership: isAd ? 'ai' : undefined,
      ai_enabled: isAd ? true : undefined,
      source: isAd ? 'ad' : 'organic',
      source_meta: isAd ? this.extractAdMeta(payload) : null,
    });

    const senderType = resolved.type === 'platform' ? 'platform' : 'agent';
    const agentId = resolved.type === 'agent' ? resolved.agentId : null;

    const metaVoice = messageType === 'audio'
      ? { from_voice: true, media_content_type: payload.MediaContentType0 || 'audio/ogg' }
      : null;

    await this.leadMessages.create({
      lead_id: lead.id,
      channel: 'whatsapp',
      direction: 'inbound',
      external_id: messageSid,
      body: body || null,
      status: 'sent',
      metadata: {
        From: payload.From,
        To: payload.To,
        ProfileName: payload.ProfileName,
        WaId: payload.WaId,
        NumMedia: payload.NumMedia,
        MediaUrl0: mediaUrl0 || undefined,
      },
      sender_type: 'lead',
      agent_id: agentId,
      conversation_id: conversation.id,
      message_type: messageType,
      media_url: messageType === 'audio' ? mediaUrl0 : undefined,
      meta: metaVoice,
    });

    // Intent detection (minimal, safe). Run after transcription if audio.
    await this.intents.createIfAllowed({
      conversationId: conversation.id,
      leadId: lead.id,
      detectedFrom: messageType === 'audio' ? 'audio' : 'text',
      text: body,
    });

    await this.db.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversation.id]);
    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    if (conversation.source === 'ad' && created) {
      await this.twilioWhatsApp.sendAiReply(lead.id, conversation.id, AD_GREETING_TEXT);
      return '<Response></Response>';
    }

    const { action } = await this.routing.routeMessage(conversation.id, body);

    if (action === 'reply_ai') {
      await this.aiReply.replyWithAi(conversation.id, lead.id, from);
    }
    // notify_agent: no auto-send; agent sees conversation in CRM

    return '<Response></Response>';
  }

  /**
   * Ad source: ad_id / campaign_id / source=ad (simulation) or ReferralCtwaClid (Twilio from Meta Click-to-WhatsApp).
   */
  private detectAdSource(payload: Record<string, string>): boolean {
    return !!(
      payload.ad_id ||
      payload.campaign_id ||
      payload.source === 'ad' ||
      payload.ReferralCtwaClid
    );
  }

  private extractAdMeta(payload: Record<string, string>): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    if (payload.ad_id) meta.ad_id = payload.ad_id;
    if (payload.campaign_id) meta.campaign_id = payload.campaign_id;
    if (payload.ReferralCtwaClid) meta.ctwa_clid = payload.ReferralCtwaClid;
    if (payload.platform) meta.platform = payload.platform;
    if (payload.utm_source) meta.utm_source = payload.utm_source;
    if (payload.utm_medium) meta.utm_medium = payload.utm_medium;
    if (payload.utm_campaign) meta.utm_campaign = payload.utm_campaign;
    if (payload.utm_term) meta.utm_term = payload.utm_term;
    if (payload.utm_content) meta.utm_content = payload.utm_content;
    if (payload.landing_page) meta.landing_page = payload.landing_page;
    return meta;
  }

  /**
   * Upsert lead by phone when first inbound is from ad/landing. Creates lead so ad-first flow can continue.
   * Requires WHATSAPP_FIRST_LEAD_CREATED_BY (user UUID) in env. Lead remains eligible for broadcast (ai-owned).
   */
  private async upsertLeadFromAd(
    phone: string,
    payload: Record<string, string>,
    createdBy: string,
  ): Promise<{ id: string; team_id: string | null } | null> {
    const { rows: userRows } = await this.db.query(
      `SELECT team_id FROM users WHERE id = $1`,
      [createdBy],
    );
    if (!userRows.length) {
      this.logger.warn(`Inbound WhatsApp: WHATSAPP_FIRST_LEAD_CREATED_BY user ${createdBy} not found`);
      return null;
    }
    const teamId = userRows[0].team_id ?? null;
    const name = (payload.ProfileName || '').trim() || 'WhatsApp Lead';
    const { rows } = await this.db.query(
      `INSERT INTO leads (name, phone, status, created_by, team_id, source, first_source, created_at, updated_at)
       VALUES ($1, $2, 'new', $3, $4, 'whatsapp_ad', 'whatsapp_ad', NOW(), NOW())
       RETURNING id, team_id`,
      [name, phone, createdBy, teamId],
    );
    if (!rows.length) return null;
    return { id: rows[0].id, team_id: rows[0].team_id ?? null };
  }
}
