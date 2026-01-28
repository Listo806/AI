import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { LeadMessagesService } from './lead-messages.service';
import twilio from 'twilio';

export interface SendWhatsAppDto {
  leadId: string;
  message: string;
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
   */
  async sendForLead(dto: SendWhatsAppDto, userId: string, teamId: string | null): Promise<{ messageId: string; status: string }> {
    if (!this.isConfigured || !this.client) {
      throw new BadRequestException('WhatsApp (Twilio) is not configured');
    }

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

    const msg = await this.client.messages.create({
      body: dto.message,
      from: this.from,
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
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [dto.leadId],
    );

    return { messageId: msg.sid, status: msg.status || 'queued' };
  }

  /**
   * Handle inbound webhook from Twilio. Find lead by From, store message, return TwiML.
   */
  async handleInbound(payload: InboundWebhookPayload): Promise<string> {
    const from = TwilioWhatsAppService.phoneFromTwilioAddress(payload.From || '');
    const body = payload.Body || '';
    const messageSid = payload.MessageSid || '';

    if (!from) {
      this.logger.warn('Inbound WhatsApp: missing or invalid From');
      return '<Response></Response>';
    }

    const lead = await this.findLeadByPhone(from);
    if (!lead) {
      this.logger.warn(`Inbound WhatsApp: no lead for phone ${from}, skipping store`);
      return '<Response></Response>';
    }

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
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    return '<Response></Response>';
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
