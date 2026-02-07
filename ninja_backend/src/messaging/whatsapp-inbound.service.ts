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
import { WhatsAppFlowOrchestratorService } from './whatsapp-flow-orchestrator.service';

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
    private readonly flowOrchestrator: WhatsAppFlowOrchestratorService,
  ) {}

  /**
   * Full inbound flow: resolve lead/conversation (never drop), handle audio,
   * parse source, route (reply_ai or notify_agent), send AI reply or entry greeting.
   */
  async handleInbound(payload: Record<string, string>): Promise<string> {
    const from = TwilioWhatsAppService.phoneFromTwilioAddress(payload.From || '');
    let body = (payload.Body || '').trim();
    const messageSid = payload.MessageSid || '';
    const numMedia = parseInt(payload.NumMedia || '0', 10);
    const mediaUrl0 = payload.MediaUrl0 || '';
    const profileName = payload.ProfileName || '';

    if (!from) {
      this.logger.warn('Inbound WhatsApp: missing or invalid From');
      return '<Response></Response>';
    }

    const resolved = await this.agentConnections.resolveReceivingNumber(payload.To || '');
    if (!resolved) {
      this.logger.warn(`Inbound WhatsApp: unknown receiving number To=${payload.To}, skipping store`);
      return '<Response></Response>';
    }

    // RULE: Never drop first-time inbound. Create lead if unknown.
    const lead = await this.twilioWhatsApp.findOrCreateLeadByPhone(from, profileName);

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

    // Parse [src:xxx] from body for Master Funnel source tracking
    const parsedSource = this.flowOrchestrator.parseSourceFromBody(body);
    const sourceTag = parsedSource || 'organic_unknown';

    // Strip [src:xxx] from body for cleaner message storage (optional)
    const bodyForStorage = body.replace(/\[src:[a-z0-9_]+\]/gi, '').trim() || body;

    const isAd = this.detectAdSource(payload);
    const sourceMeta: Record<string, unknown> = {
      source: sourceTag,
      ...(isAd ? this.extractAdMeta(payload) : {}),
    };

    const { conversation, created } = await this.conversations.getOrCreateForLead(lead.id, {
      ownership: 'ai',
      ai_enabled: true,
      source: isAd ? 'ad' : 'organic',
      source_meta: sourceMeta,
    });

    // Update source_meta with parsed source if conversation existed (first message sets it)
    if (!created && parsedSource) {
      await this.flowOrchestrator.mergeConversationSourceMeta(conversation.id, { source: sourceTag });
    }

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
      body: bodyForStorage || null,
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

    // Intent detection (supports 1-4 mapping and funnel intents)
    await this.intents.createIfAllowed({
      conversationId: conversation.id,
      leadId: lead.id,
      detectedFrom: messageType === 'audio' ? 'audio' : 'text',
      text: bodyForStorage,
    });

    await this.db.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversation.id]);
    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    // Immediate auto-reply for NEW conversations (Master or Property flow)
    if (created) {
      const flow = await this.flowOrchestrator.determineFlow(lead.id, conversation.id);
      // Property flow: merge lead_metadata (property_title, seller_type) into conversation source_meta
      if (flow === 'property') {
        const { rows } = await this.db.query(
          `SELECT property_id, lead_metadata FROM leads WHERE id = $1`,
          [lead.id],
        );
        if (rows.length) {
          const r = rows[0];
          const meta: Record<string, unknown> = { ...sourceMeta };
          if (r.property_id) meta.property_id = r.property_id;
          if (r.lead_metadata && typeof r.lead_metadata === 'object') {
            Object.assign(meta, r.lead_metadata);
          }
          await this.flowOrchestrator.mergeConversationSourceMeta(conversation.id, meta);
        }
      }
      const entryMessage = this.flowOrchestrator.getEntryMessage(flow, true);
      await this.twilioWhatsApp.sendAiReply(lead.id, conversation.id, entryMessage);
      if (lead.team_id) {
        await this.logAiActivity(lead.team_id, 'auto_reply', lead.id, 'whatsapp', 'entry_greeting');
      }
      return '<Response></Response>';
    }

    // Existing conversation: route (AI vs agent)
    const { action, reason } = await this.routing.routeMessage(conversation.id, bodyForStorage);

    if (action === 'reply_ai') {
      await this.aiReply.replyWithAi(conversation.id, lead.id, from);
      if (lead.team_id) {
        await this.logAiActivity(lead.team_id, 'auto_reply', lead.id, 'whatsapp', 'sent');
      }
    } else if (lead.team_id) {
      await this.logAiActivity(lead.team_id, 'escalated', lead.id, 'whatsapp', reason || 'notify_agent');
    }

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
    if (payload.utm_adgroup) meta.utm_adgroup = payload.utm_adgroup;
    if (payload.utm_ad) meta.utm_ad = payload.utm_ad;
    if (payload.utm_term) meta.utm_term = payload.utm_term;
    if (payload.utm_content) meta.utm_content = payload.utm_content;
    if (payload.landing_page) meta.landing_page = payload.landing_page;
    return meta;
  }

  private async logAiActivity(
    teamId: string,
    action: string,
    leadId: string,
    channel: string,
    outcome: string,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO ai_activity (team_id, action, lead_id, channel, outcome, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [teamId, action, leadId, channel, outcome],
      );
    } catch (err: any) {
      this.logger.warn(`logAiActivity failed: ${err?.message}`);
    }
  }
}
