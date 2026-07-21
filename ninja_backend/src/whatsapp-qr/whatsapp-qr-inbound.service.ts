import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import { DatabaseService } from "../database/database.service";
import { normalizeToE164 } from "./utils/phone-normalize.util";
import { parseWaMessage } from "./utils/message-parser.util";
import { WhatsAppQrConversationService } from "./whatsapp-qr-conversation.service";
import { WhatsAppQrMessageService } from "./whatsapp-qr-message.service";
import { WhatsAppQrIntentService } from "./whatsapp-qr-intent.service";
import { WhatsAppQrRoutingService } from "./whatsapp-qr-routing.service";
import { WhatsAppQrAiReplyService } from "./whatsapp-qr-ai-reply.service";
import { WhatsAppQrRealtimeService } from "./whatsapp-qr-realtime.service";

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
    if (type !== "notify" && type !== "append") return;
    for (const msg of baileysMessages) {
      try {
        await this.handleOneMessage(userId, sessionId, msg);
      } catch (e: any) {
        this.logger.warn(`QR inbound handle error: ${e?.message}`);
      }
    }
  }

  private extractPropertyIdFromMessage(
    text: string | null | undefined,
  ): string | null {
    const match = String(text || "").match(/\[pid:([0-9a-fA-F-]{36})\]/);
    return match?.[1] || null;
  }

  private cleanPropertyTags(text: string | null | undefined): string {
    return String(text || "")
      .replace(/\[flow:property\]/gi, "")
      .replace(/\[pid:[0-9a-fA-F-]{36}\]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private resolveInboundPhoneJid(msg: any): string | null {
    const candidates = [
      msg?.key?.remoteJidAlt,
      msg?.key?.participantAlt,
      msg?.senderPn,
      msg?.key?.senderPn,
      msg?.message?.senderPn,
      msg?.message?.extendedTextMessage?.contextInfo?.participant,
      msg?.message?.messageContextInfo?.participant,
    ];
    const remoteJid = String(msg?.key?.remoteJid || "").trim();
    if (remoteJid && !/@lid$/i.test(remoteJid)) {
      candidates.push(remoteJid);
    }
    for (const candidate of candidates) {
      const normalized = normalizeToE164(candidate);

      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  private prepareMessageForParsing(msg: any, contactPhone: string): any {
    const phoneDigits = contactPhone.replace(/\D/g, "");
    return {
      ...msg,
      key: {
        ...(msg?.key || {}),
        remoteJid: `${phoneDigits}@s.whatsapp.net`,
      },
    };
  }

  private async handleOneMessage(
    userId: string,
    sessionId: string,
    msg: any,
  ): Promise<void> {
    const originalRemoteJid = String(msg?.key?.remoteJid || "").trim();

    const resolvedContactPhone = this.resolveInboundPhoneJid(msg);

    if (!resolvedContactPhone) {
      this.logger.warn(
        [
          "QR inbound: cannot resolve real contact phone",
          `remoteJid=${originalRemoteJid || "empty"}`,
          `remoteJidAlt=${String(msg?.key?.remoteJidAlt || "empty")}`,
          `senderPn=${String(msg?.senderPn || msg?.key?.senderPn || "empty")}`,
        ].join(" "),
      );

      return;
    }

    const messageForParser = this.prepareMessageForParsing(
      msg,
      resolvedContactPhone,
    );

    const parsed = parseWaMessage(messageForParser, normalizeToE164);

    if (!parsed || parsed.fromMe) {
      return;
    }

    parsed.contactPhoneE164 = resolvedContactPhone;

    const lead = await this.findOrCreateLeadByPhone(
      parsed.contactPhoneE164,
      parsed.pushName || undefined,
      userId,
    );

    const propertyIdFromMessage = this.extractPropertyIdFromMessage(
      parsed.body,
    );
    const cleanBody = this.cleanPropertyTags(parsed.body);

    if (propertyIdFromMessage && !lead.property_id) {
      await this.db.query(
        `
    UPDATE leads
    SET property_id = $1, updated_at = NOW()
    WHERE id = $2
    `,
        [propertyIdFromMessage, lead.id],
      );

      lead.property_id = propertyIdFromMessage;
    }
    const { row: conv } = await this.conversations.getOrCreate({
      sessionId,
      userId,
      teamId: lead.team_id,
      leadId: lead.id,
      contactPhone: parsed.contactPhoneE164,
      propertyId: lead.property_id || propertyIdFromMessage || null,
    });

    const inserted = await this.messages.insertInbound({
      sessionId,
      conversationId: conv.id,
      leadId: lead.id,
      teamId: lead.team_id,
      contactPhone: parsed.contactPhoneE164,
      body: cleanBody || parsed.body || null,
      messageId: parsed.messageId,
      messageType: parsed.messageType,
    });
    if (!inserted) return;

    this.realtime.emitMessage({
      userId,
      conversationId: conv.id,
      contactPhone: parsed.contactPhoneE164,
      direction: "inbound",
      senderType: "lead",
      body: cleanBody || parsed.body || null,
      messageType: parsed.messageType,
      createdAt: new Date().toISOString(),
    });

    const intent = this.intents.detectFromText(cleanBody);
    if (intent) {
      await this.intents.logIntent({
        qrConversationId: conv.id,
        leadId: lead.id,
        intentType: intent.intent_type,
        confidence: intent.confidence,
      });
      if (intent.intent_type === "agent_request") {
        await this.conversations.setOwnerHuman(conv.id);
        conv.owner_type = "human";
        conv.ai_enabled = false;
      }
    }

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(),
       last_action_type = 'whatsapp', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [lead.id],
    );

    const { action } = await this.routing.route(conv, cleanBody);
    if (action === "reply_ai") {
      await this.aiReply.replyIfEnabled(
        conv.id,
        lead.id,
        parsed.contactPhoneE164,
      );
    } else if (lead.team_id) {
      await this.logAiActivity(
        lead.team_id,
        "escalated",
        lead.id,
        "whatsapp_qr",
        "notify_agent",
      );
    }
  }

  /**
   * Find existing lead by phone or create one. Uses sessionUserId when provided so the
   * connected user owns the lead (shows on Leads page for that owner).
   */
  private async findOrCreateLeadByPhone(
    phone: string,
    profileName?: string,
    sessionUserId?: string,
  ): Promise<{
    id: string;
    team_id: string | null;
    property_id: string | null;
  }> {
    const { rows: existing } = await this.db.query(
      `
      SELECT
        id,
        team_id,
        property_id
      FROM leads
      WHERE regexp_replace(
        COALESCE(phone, ''),
        '[^0-9]',
        '',
        'g'
      ) = regexp_replace(
        $1,
        '[^0-9]',
        '',
        'g'
      )
      ORDER BY
        CASE
          WHEN property_id IS NOT NULL THEN 0
          ELSE 1
        END,
        created_at DESC
      LIMIT 1
      `,
      [phone],
    );
    if (existing.length) {
      if (!existing[0].property_id) {
        const { rows: latestProperty } = await this.db.query(
          `
          SELECT property_id
          FROM leads
          WHERE regexp_replace(
            COALESCE(phone, ''),
            '[^0-9]',
            '',
            'g'
          ) = regexp_replace(
            $1,
            '[^0-9]',
            '',
            'g'
          )
          AND property_id IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 1
          `,
          [phone],
        );

        if (latestProperty.length) {
          await this.db.query(
            `
            UPDATE leads
            SET property_id=$1
            WHERE id=$2
            `,
            [latestProperty[0].property_id, existing[0].id],
          );
          existing[0].property_id = latestProperty[0].property_id;
        }
      }

      return {
        id: existing[0].id,
        team_id: existing[0].team_id,
        property_id: existing[0].property_id,
      };
    }

    let createdBy: string | null = null;
    let teamId: string | null = null;
    if (sessionUserId) {
      const { rows: userRows } = await this.db.query(
        `SELECT id, team_id FROM users WHERE id = $1`,
        [sessionUserId],
      );
      if (userRows.length) {
        createdBy = userRows[0].id;
        teamId = userRows[0].team_id ?? null;
      }
    }
    if (!createdBy) {
      createdBy = this.config.get("WHATSAPP_FIRST_LEAD_CREATED_BY") || null;
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
    }
    if (!createdBy) {
      throw new Error(
        "QR lead creation requires session user, WHATSAPP_FIRST_LEAD_CREATED_BY, or at least one user",
      );
    }

    const name = (profileName || "").trim() || "WhatsApp Lead";
    const { rows } = await this.db.query(
      `INSERT INTO leads (name, phone, status, created_by, team_id, source, first_source, created_at, updated_at, property_id)
       VALUES ($1, $2, 'new', $3, $4, 'whatsapp', 'whatsapp', NOW(), NOW(), NULL)
       RETURNING id, team_id`,
      [name, phone, createdBy, teamId],
    );
    if (!rows.length) throw new Error("Failed to create lead");
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
    return { id: leadId, team_id: rows[0].team_id ?? null, property_id: null };
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
