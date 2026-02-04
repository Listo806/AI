import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { LeadMessagesService } from './lead-messages.service';
import { AgentWhatsAppConnectionService } from './agent-whatsapp-connection.service';
import twilio from 'twilio';

export interface SendWhatsAppDto {
  leadId: string;
  message: string;
  senderType?: 'platform' | 'agent';
  conversationId?: string;
  message_type?: 'text' | 'audio' | 'card';
  meta?: Record<string, unknown> | null;
}

export interface InboundWebhookPayload {
  MessageSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  ProfileName?: string;
  WaId?: string;
  NumMedia?: string;
  [k: string]: string | undefined;
}

@Injectable()
export class TwilioWhatsAppService {
  private readonly logger = new Logger(TwilioWhatsAppService.name);
  private readonly client: any;
  private readonly from: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly leadMessages: LeadMessagesService,
    private readonly agentConnections: AgentWhatsAppConnectionService,
  ) {
    const accountSid = config.get('TWILIO_ACCOUNT_SID');
    const authToken = config.get('TWILIO_AUTH_TOKEN');
    this.from = config.get('TWILIO_WHATSAPP_FROM') || '';

    if (accountSid && authToken && this.from) {
      this.client = (twilio as any)(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio WhatsApp configured');
    } else {
      this.client = null;
      this.isConfigured = false;
      this.logger.warn('Twilio WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.');
    }
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Normalize Twilio From (e.g. "whatsapp:+593987654321") to E.164
   */
  static phoneFromTwilioAddress(addr: string): string | null {
    if (!addr || typeof addr !== 'string') return null;
    const s = addr.replace(/^whatsapp:/i, '').trim();
    return /^\+[1-9]\d{1,14}$/.test(s) ? s : null;
  }

  /**
   * Find lead by phone (E.164). Prefer exact match on phone.
   */
  async findLeadByPhone(phone: string): Promise<{ id: string; team_id: string | null } | null> {
    const { rows } = await this.db.query(
      `SELECT id, team_id FROM leads WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [phone],
    );
    return rows.length ? { id: rows[0].id, team_id: rows[0].team_id } : null;
  }

  /**
   * Send WhatsApp message for a lead (outbound from CRM). Per-lead, per-action only.
   * senderType: platform (default) | agent. Agent uses connected Twilio sub-account.
   * Routing safety: AI/automation must use senderType 'platform' only — never 'agent'.
   * AI must not send on Agent WhatsApp or Instagram DM; only allowed platform channels.
   */
  async sendForLead(dto: SendWhatsAppDto, userId: string, teamId: string | null): Promise<{ messageId: string; status: string }> {
    const senderType = dto.senderType ?? 'platform';

    const { rows } = await this.db.query(
      `SELECT id, phone, team_id, created_by FROM leads WHERE id = $1`,
      [dto.leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');
    const lead = rows[0];
    const allowed = lead.team_id === teamId || lead.created_by === userId;
    if (!allowed) throw new BadRequestException('Lead not found');

    const phone = lead.phone;
    if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw new BadRequestException('Lead has no valid phone number for WhatsApp');
    }

    const to = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+${phone}`;
    const baseUrl = this.config.get('BACKEND_URL') || this.config.get('RENDER_EXTERNAL_URL') || 'http://localhost:3000';
    const statusCallback = `${baseUrl.replace(/\/$/, '')}/api/whatsapp/status-callback`;

    let client: any;
    let from: string;
    let storeAgentId: string | null = null;

    if (senderType === 'agent') {
      const conn = await this.agentConnections.getForSend(userId);
      if (!conn) throw new BadRequestException('Agent WhatsApp not connected. Connect via POST /api/agent/whatsapp/connect.');
      client = (twilio as any)(conn.subAccountSid, conn.authToken);
      from = conn.whatsappNumber.startsWith('+') ? `whatsapp:${conn.whatsappNumber}` : `whatsapp:+${conn.whatsappNumber}`;
      storeAgentId = userId;
    } else {
      if (!this.isConfigured || !this.client) {
        throw new BadRequestException('WhatsApp (Twilio) is not configured');
      }
      client = this.client;
      from = this.from;
    }

    const msg = await client.messages.create({
      body: dto.message,
      from,
      to,
      statusCallback,
    });

    const status = ['queued', 'sent', 'delivered', 'read', 'failed'].includes(msg.status) ? msg.status : 'sent';
    await this.leadMessages.create({
      lead_id: dto.leadId,
      channel: 'whatsapp',
      direction: 'outbound',
      external_id: msg.sid,
      body: dto.message,
      status,
      sender_type: senderType,
      agent_id: storeAgentId,
      conversation_id: dto.conversationId ?? null,
      message_type: dto.message_type ?? 'text',
      meta: dto.meta ?? null,
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [dto.leadId],
    );

    return { messageId: msg.sid, status: msg.status || 'queued' };
  }

  /**
   * Send AI reply to lead via platform WhatsApp. Stores message with sender_type='ai' and conversation_id.
   * Used by WhatsApp AI reply service after AiAssistantService.chat().
   */
  async sendAiReply(leadId: string, conversationId: string, message: string): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured || !this.client) {
      throw new BadRequestException('WhatsApp (Twilio) is not configured');
    }
    const { rows } = await this.db.query(
      `SELECT id, phone FROM leads WHERE id = $1`,
      [leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');
    const phone = rows[0].phone;
    if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw new BadRequestException('Lead has no valid phone number for WhatsApp');
    }
    const to = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+${phone}`;
    const baseUrl = this.config.get('BACKEND_URL') || this.config.get('RENDER_EXTERNAL_URL') || 'http://localhost:3000';
    const statusCallback = `${baseUrl.replace(/\/$/, '')}/api/whatsapp/status-callback`;

    const msg = await this.client.messages.create({
      body: message,
      from: this.from,
      to,
      statusCallback,
    });

    const status = ['queued', 'sent', 'delivered', 'read', 'failed'].includes(msg.status) ? msg.status : 'sent';
    await this.leadMessages.create({
      lead_id: leadId,
      channel: 'whatsapp',
      direction: 'outbound',
      external_id: msg.sid,
      body: message,
      status,
      sender_type: 'ai',
      conversation_id: conversationId,
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [leadId],
    );

    return { messageId: msg.sid, status: msg.status || 'queued' };
  }

  /**
   * Handle inbound webhook from Twilio. Find lead by From, resolve To (platform vs agent), store with sender_type.
   */
  async handleInbound(payload: InboundWebhookPayload): Promise<string> {
    const from = TwilioWhatsAppService.phoneFromTwilioAddress(payload.From || '');
    const body = payload.Body || '';
    const messageSid = payload.MessageSid || '';

    if (!from) {
      this.logger.warn('Inbound WhatsApp: missing or invalid From');
      return '<Response></Response>';
    }

    const resolved = await this.agentConnections.resolveReceivingNumber(payload.To || '');
    if (!resolved) {
      this.logger.warn(`Inbound WhatsApp: unknown receiving number To=${payload.To}, skipping store`);
      return '<Response></Response>';
    }

    const lead = await this.findLeadByPhone(from);
    if (!lead) {
      this.logger.warn(`Inbound WhatsApp: no lead for phone ${from}, skipping store`);
      return '<Response></Response>';
    }

    const senderType = resolved.type === 'platform' ? 'platform' : 'agent';
    const agentId = resolved.type === 'agent' ? resolved.agentId : null;

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
      },
      sender_type: senderType,
      agent_id: agentId,
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    return '<Response></Response>';
  }

  /**
   * Send WhatsApp template (ContentSid) to a lead. Used for broadcast only.
   * Platform number only; no agent send. Does not create lead_message (broadcast service logs to broadcast_events).
   */
  async sendTemplate(
    leadId: string,
    contentSid: string,
    options?: { contentVariables?: string | Record<string, string>; conversationId?: string },
  ): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured || !this.client) {
      throw new BadRequestException('WhatsApp (Twilio) is not configured');
    }
    const { rows } = await this.db.query(
      `SELECT id, phone FROM leads WHERE id = $1`,
      [leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');
    const phone = rows[0].phone;
    if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw new BadRequestException('Lead has no valid phone number for WhatsApp');
    }
    const to = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+${phone}`;
    const baseUrl = this.config.get('BACKEND_URL') || this.config.get('RENDER_EXTERNAL_URL') || 'http://localhost:3000';
    const statusCallback = `${baseUrl.replace(/\/$/, '')}/api/whatsapp/status-callback`;

    const params: Record<string, unknown> = {
      contentSid,
      from: this.from,
      to,
      statusCallback,
    };
    if (options?.contentVariables != null) {
      params.contentVariables =
        typeof options.contentVariables === 'string'
          ? options.contentVariables
          : JSON.stringify(options.contentVariables);
    }

    const msg = await this.client.messages.create(params as any);
    const status = ['queued', 'sent', 'delivered', 'read', 'failed'].includes(msg.status || '')
      ? (msg.status as string)
      : 'sent';
    return { messageId: msg.sid, status };
  }

  /**
   * Handle status callback. Update lead_messages.status by MessageSid.
   */
  async handleStatusCallback(messageSid: string, messageStatus: string): Promise<void> {
    const s = (messageStatus || '').toLowerCase();
    const status = ['queued', 'sent', 'delivered', 'read', 'failed'].includes(s) ? (s as 'queued' | 'sent' | 'delivered' | 'read' | 'failed') : 'sent';
    const n = await this.leadMessages.updateStatusByExternalId(messageSid, status);
    if (n > 0) this.logger.log(`WhatsApp status updated: ${messageSid} -> ${status}`);
  }
}
