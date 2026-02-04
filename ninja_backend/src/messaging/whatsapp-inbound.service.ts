import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';
import { AgentWhatsAppConnectionService } from './agent-whatsapp-connection.service';
import { LeadMessagesService } from './lead-messages.service';
import { ConversationsService } from './conversations.service';
import { WhatsAppRoutingService } from './whatsapp-routing.service';
import { WhatsAppAiReplyService } from './whatsapp-ai-reply.service';
import { TwilioMediaService } from './twilio-media.service';
import { IntentEventsService } from './intent-events.service';

const AD_GREETING_TEXT = `¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?
• COMPRAR - Estoy interesado en comprar
• ALQUILAR - Estoy interesado en alquilar
• HABLAR CON AGENTE - Quiero hablar con un asesor`;

@Injectable()
export class WhatsAppInboundService {
  private readonly logger = new Logger(WhatsAppInboundService.name);

  constructor(
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

    const lead = await this.twilioWhatsApp.findLeadByPhone(from);
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

    const isAd = this.detectAdSource(payload);
    const { conversation, created } = await this.conversations.getOrCreateForLead(lead.id, {
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

  private detectAdSource(payload: Record<string, string>): boolean {
    return !!(payload.ad_id || payload.campaign_id || payload.source === 'ad');
  }

  private extractAdMeta(payload: Record<string, string>): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    if (payload.ad_id) meta.ad_id = payload.ad_id;
    if (payload.campaign_id) meta.campaign_id = payload.campaign_id;
    if (payload.platform) meta.platform = payload.platform;
    return meta;
  }
}
