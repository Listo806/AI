import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { normalizeToE164 } from './utils/phone-normalize.util';
import { parseWaMessage } from './utils/message-parser.util';
import { WhatsAppQrConversationService } from './whatsapp-qr-conversation.service';
import { WhatsAppQrMessageService } from './whatsapp-qr-message.service';
import { WhatsAppQrIntentService } from './whatsapp-qr-intent.service';
import { WhatsAppQrRoutingService } from './whatsapp-qr-routing.service';
import { WhatsAppQrAiReplyService } from './whatsapp-qr-ai-reply.service';
import { WhatsAppQrRealtimeService } from './whatsapp-qr-realtime.service';

/**
 * Baileys messages.upsert → normalize → lead find/create → QR conversation → message row
 * → intent → routing → AI reply when reply_ai (outbound wired in ai-reply service).
 * Spec: parity with WhatsAppInboundService; isolated QR tables.
 */
@Injectable()
export class WhatsAppQrInboundService {
  private readonly logger = new Logger(WhatsAppQrInboundService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly conversations: WhatsAppQrConversationService,
    private readonly messages: WhatsAppQrMessageService,
    private readonly intents: WhatsAppQrIntentService,
    private readonly routing: WhatsAppQrRoutingService,
    private readonly aiReply: WhatsAppQrAiReplyService,
    private readonly realtime: WhatsAppQrRealtimeService,
  ) {}

  /**
   * Process upsert batch for one connected user (session owner).
   */
  async handleUpsert(
    userId: string,
    sessionId: string,
    baileysMessages: any[],
    type: string,
  ): Promise<void> {
    // notify = new messages; append = sometimes used for live — process both
    if (type !== 'notify' && type !== 'append') return;
    for (const msg of baileysMessages) {
      try {
        await this.handleOneMessage(userId, sessionId, msg);
      } catch (e: any) {
        this.logger.warn(`QR inbound handle error: ${e?.message}`);
      }
    }
  }

  private async handleOneMessage(
    userId: string,
    sessionId: string,
    msg: any,
  ): Promise<void> {
    const parsed = parseWaMessage(msg, normalizeToE164);
    if (!parsed || parsed.fromMe) return;
    if (!parsed.contactPhoneE164) {
      this.logger.warn(`QR inbound: cannot normalize jid ${parsed.remoteJid}`);
      return;
    }

    const lead = await this.findOrCreateLeadByPhone(
      parsed.contactPhoneE164,
      parsed.pushName || undefined,
    );

    const { row: conv } = await this.conversations.getOrCreate({
      sessionId,
      userId,
      teamId: lead.team_id,
      leadId: lead.id,
      contactPhone: parsed.contactPhoneE164,
    });

    const inserted = await this.messages.insertInbound({
      sessionId,
      conversationId: conv.id,
      leadId: lead.id,
      teamId: lead.team_id,
      contactPhone: parsed.contactPhoneE164,
      body: parsed.body || null,
      messageId: parsed.messageId,
      messageType: parsed.messageType,
    });
    if (!inserted) return;

    await this.conversations.touchInbound(conv.id);
    this.realtime.emitMessage({
      userId,
      conversationId: conv.id,
      contactPhone: parsed.contactPhoneE164,
      direction: 'inbound',
      senderType: 'lead',
      body: parsed.body || null,
      messageType: parsed.messageType,
      createdAt: new Date().toISOString(),
    });

    const intent = this.intents.detectFromText(parsed.body);
    if (intent) {
      await this.intents.logIntent({
        qrConversationId: conv.id,
        leadId: lead.id,
        intentType: intent.intent_type,
        confidence: intent.confidence,
      });
      if (intent.intent_type === 'agent_request') {
        await this.conversations.setOwnerHuman(conv.id);
        conv.owner_type = 'human';
        conv.ai_enabled = false;
      }
    }

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(),
       last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    const { action } = await this.routing.route(conv, parsed.body);
    if (action === 'reply_ai') {
      await this.aiReply.replyIfEnabled(conv.id, lead.id, parsed.contactPhoneE164);
    } else if (lead.team_id) {
      await this.logAiActivity(
        lead.team_id,
        'escalated',
        lead.id,
        'whatsapp_qr',
        'notify_agent',
      );
    }
  }

  /**
   * Same logic as TwilioWhatsAppService.findOrCreateLeadByPhone (no Twilio dependency).
   */
  private async findOrCreateLeadByPhone(
    phone: string,
    profileName?: string,
  ): Promise<{ id: string; team_id: string | null }> {
    const { rows: existing } = await this.db.query(
      `SELECT id, team_id FROM leads WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [phone],
    );
    if (existing.length) return { id: existing[0].id, team_id: existing[0].team_id };

    let createdBy = this.config.get('WHATSAPP_FIRST_LEAD_CREATED_BY') || null;
    let teamId: string | null = null;
    if (createdBy) {
      const { rows: userRows } = await this.db.query(
        `SELECT team_id FROM users WHERE id = $1`,
        [createdBy],
      );
      if (userRows.length) teamId = userRows[0].team_id ?? null;
    } else {
      const { rows: fallback } = await this.db.query(
        `SELECT id, team_id FROM users WHERE is_active = true ORDER BY created_at ASC LIMIT 1`,
      );
      if (fallback.length) {
        createdBy = fallback[0].id;
        teamId = fallback[0].team_id ?? null;
      }
    }
    if (!createdBy) {
      throw new Error('QR lead creation requires WHATSAPP_FIRST_LEAD_CREATED_BY or at least one user');
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
      } catch {
        // ignore duplicate contact
      }
    }
    this.logger.log(`QR created lead for phone ${phone}`);
    return { id: leadId, team_id: rows[0].team_id ?? null };
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
    } catch {
      // ignore
    }
  }
}
