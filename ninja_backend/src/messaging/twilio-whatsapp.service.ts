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
    const twilioDisabled = config.get('TWILIO_WHATSAPP_DISABLED') === 'true';
    if (twilioDisabled) {
      this.client = null;
      this.from = '';
      this.isConfigured = false;
      this.logger.warn('Twilio WhatsApp disabled (TWILIO_WHATSAPP_DISABLED=true). QR module replaces dashboard path.');
      return;
    }

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

  /** Spec §16: structured disabled response when Twilio WhatsApp is turned off */
  private assertNotDisabled(): void {
    if (this.config.get('TWILIO_WHATSAPP_DISABLED') === 'true') {
      throw new BadRequestException({
        code: 'TWILIO_WHATSAPP_DISABLED',
        message: 'Twilio WhatsApp is disabled. Use WhatsApp QR connection.',
      });
    }
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
   * Find or create lead by phone. Never drops unknown phones.
   * Uses WHATSAPP_FIRST_LEAD_CREATED_BY for team/created_by if set, else null.
   */
  async findOrCreateLeadByPhone(
    phone: string,
    profileName?: string,
  ): Promise<{ id: string; team_id: string | null }> {
    const existing = await this.findLeadByPhone(phone);
    if (existing) return existing;

    let createdBy = this.config.get('WHATSAPP_FIRST_LEAD_CREATED_BY') || null;
    let teamId: string | null = null;
    if (createdBy) {
      const { rows: userRows } = await this.db.query(
        `SELECT team_id FROM users WHERE id = $1`,
        [createdBy],
      );
      if (userRows.length) teamId = userRows[0].team_id ?? null;
    } else {
      // created_by is NOT NULL: use first active user as fallback for unassigned WhatsApp leads
      const { rows: fallback } = await this.db.query(
        `SELECT id, team_id FROM users WHERE is_active = true ORDER BY created_at ASC LIMIT 1`,
      );
      if (fallback.length) {
        createdBy = fallback[0].id;
        teamId = fallback[0].team_id ?? null;
      }
    }
    if (!createdBy) {
      this.logger.warn('Cannot create lead: no WHATSAPP_FIRST_LEAD_CREATED_BY and no users in system');
      throw new Error('WhatsApp lead creation requires WHATSAPP_FIRST_LEAD_CREATED_BY or at least one user');
    }

    const name = (profileName || '').trim() || 'WhatsApp Lead';
    const { rows } = await this.db.query(
      `INSERT INTO leads (name, phone, status, created_by, team_id, source, first_source, created_at, updated_at)
       VALUES ($1, $2, 'new', $3, $4, 'whatsapp', 'whatsapp', NOW(), NOW())
       RETURNING id, team_id`,
      [name, phone, createdBy, teamId],
    );
    if (!rows.length) throw new Error('Failed to create lead');
    const leadId = rows[0].id;
    if (teamId) {
      try {
        await this.db.query(
          `INSERT INTO contacts (team_id, created_by, name, email, phone, lead_id, notes, updated_at)
           VALUES ($1, $2, $3, NULL, $4, $5, NULL, NOW())`,
          [teamId, createdBy, name, phone, leadId],
        );
      } catch (err) {
        this.logger.warn?.('Failed to auto-create contact for WhatsApp lead', leadId, err);
      }
    }
    this.logger.log(`Created lead for unknown phone ${phone}`);
    return { id: leadId, team_id: rows[0].team_id ?? null };
  }

  /**
   * Send WhatsApp message for a lead (outbound from CRM). Per-lead, per-action only.
   * senderType: platform (default) | agent. Agent uses connected Twilio sub-account.
   * Routing safety: AI/automation must use senderType 'platform' only — never 'agent'.
   * AI must not send on Agent WhatsApp or Instagram DM; only allowed platform channels.
   */
  async sendForLead(dto: SendWhatsAppDto, userId: string, teamId: string | null): Promise<{ messageId: string; status: string }> {
    this.assertNotDisabled();
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
   * Check if last inbound (lead) message was within 24h for this conversation.
   * Use to decide: within 24h = free-form OK; outside 24h = template only (contentSid required).
   */
  async isWithin24hWindow(conversationId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT created_at FROM lead_messages
       WHERE conversation_id = $1 AND direction = 'inbound' AND sender_type = 'lead'
       ORDER BY created_at DESC LIMIT 1`,
      [conversationId],
    );
    if (!rows.length) return true;
    const lastAt = new Date(rows[0].created_at).getTime();
    return Date.now() - lastAt < 24 * 60 * 60 * 1000;
  }

  /**
   * Send AI reply to lead via platform WhatsApp. Stores message with sender_type='ai' and conversation_id.
   * Used by WhatsApp AI reply service after AiAssistantService.chat().
   * Note: For proactive/follow-up sends outside 24h, use sendTemplate with contentSid instead.
   */
  async sendAiReply(leadId: string, conversationId: string, message: string): Promise<{ messageId: string; status: string }> {
    const { rows } = await this.db.query(
      `SELECT id, phone, source FROM leads WHERE id = $1`,
      [leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');

    // Simulator lead (in-browser "Test AI"): never touch Twilio. Just record the
    // outbound turn so the conversation history builds across turns, and return a
    // synthetic id. This lets the REAL bot + booking flow run with no phone and
    // even when Twilio is disabled/unconfigured. Real leads are unaffected.
    if (rows[0].source === 'ai_sim') {
      const simSid = `sim_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      await this.leadMessages.create({
        lead_id: leadId,
        channel: 'whatsapp',
        direction: 'outbound',
        external_id: simSid,
        body: message,
        status: 'sent',
        sender_type: 'ai',
        conversation_id: conversationId,
      });
      return { messageId: simSid, status: 'sent' };
    }

    this.assertNotDisabled();
    if (!this.isConfigured || !this.client) {
      throw new BadRequestException('WhatsApp (Twilio) is not configured');
    }
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
    if (this.config.get('TWILIO_WHATSAPP_DISABLED') === 'true') {
      return '<Response></Response>';
    }
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
    this.assertNotDisabled();
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
