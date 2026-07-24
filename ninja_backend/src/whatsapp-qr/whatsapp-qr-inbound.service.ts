import { Injectable, Logger } from "@nestjs/common";
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
    const lead = await this.findExistingLeadByPhone(
      parsed.contactPhoneE164,
      userId,
    );

    if (!lead) {
      this.logger.debug(
        `QR inbound ignored: no CRM lead exists for ${parsed.contactPhoneE164}`,
      );
      return;
    }
    const propertyIdFromMessage = this.extractPropertyIdFromMessage(
      parsed.body,
    );
    const cleanBody = this.cleanPropertyTags(parsed.body);
    if (propertyIdFromMessage && !lead.property_id) {
      await this.db.query(
        `
      UPDATE leads
      SET
        property_id = $1,
        updated_at = NOW()
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

    if (!inserted) {
      return;
    }

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
      `
    UPDATE leads
    SET
      last_contacted_at = NOW(),
      last_activity_at = NOW(),
      last_action_type = 'whatsapp',
      last_action_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    `,
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
  private async findExistingLeadByPhone(
    phone: string,
    sessionUserId: string,
  ): Promise<{
    id: string;
    team_id: string | null;
    property_id: string | null;
  } | null> {
    const normalizedPhone = normalizeToE164(phone);

    if (!normalizedPhone) {
      return null;
    }

    /*
     * Only retrieve leads that the current user has permission to use:
     * - Leads created by the user
     * - Leads assigned to the user
     * - Leads on the same team as the user
     */
    const { rows } = await this.db.query(
      `
      SELECT
        l.id,
        l.team_id,
        l.property_id
      FROM leads l
      LEFT JOIN users u
        ON u.id = $2
      WHERE regexp_replace(
        COALESCE(l.phone, ''),
        '[^0-9]',
        '',
        'g'
      ) = regexp_replace(
        $1,
        '[^0-9]',
        '',
        'g'
      )
      AND (
        l.created_by = $2
        OR l.assigned_to = $2
        OR (
          u.team_id IS NOT NULL
          AND l.team_id = u.team_id
        )
      )
      ORDER BY
        CASE
          WHEN l.created_by = $2 THEN 0
          WHEN l.assigned_to = $2 THEN 1
          ELSE 2
        END,
        l.updated_at DESC NULLS LAST,
        l.created_at DESC
      LIMIT 1
      `,
      [normalizedPhone, sessionUserId],
    );

    return rows[0] || null;
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
