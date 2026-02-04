import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TwilioWhatsAppService } from './twilio-whatsapp.service';

export interface BroadcastFilters {
  stages?: string[];
  city?: string;
  intent?: string[];
}

export interface SendBroadcastDto {
  contentSid: string;
  templateName: string;
  contentVariables?: string | Record<string, string>;
  stages?: string[];
  city?: string;
  intent?: string[];
  teamId?: string | null;
  source?: string;
  delayMs?: number;
}

export interface EligibleRow {
  conversation_id: string;
  lead_id: string;
  lead_phone: string;
}

@Injectable()
export class WhatsAppBroadcastService {
  private readonly logger = new Logger(WhatsAppBroadcastService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly twilioWhatsApp: TwilioWhatsAppService,
  ) {}

  /**
   * Get conversations eligible for broadcast:
   * - status = open, ownership = ai, stage IN (configurable, default new/qualified), NOT escalated
   * - Lead has valid phone
   * - Optional: city, intent (from latest intent_events)
   * - Optional: teamId (via leads.team_id)
   */
  async getEligibleConversations(
    filters: BroadcastFilters & { teamId?: string | null } = {},
  ): Promise<EligibleRow[]> {
    const stages = filters.stages?.length
      ? filters.stages
      : ['new', 'qualified'];
    const params: unknown[] = [stages];
    let paramIndex = 2;

    let query = `
      SELECT c.id AS conversation_id, c.lead_id AS lead_id, l.phone AS lead_phone
      FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.status = 'open'
        AND c.ownership = 'ai'
        AND c.stage = ANY($1::varchar[])
        AND c.stage <> 'escalated'
        AND l.phone IS NOT NULL
        AND l.phone ~ '^\\+[1-9]\\d{1,14}$'
    `;
    if (filters.teamId != null) {
      query += ` AND l.team_id = $${paramIndex}`;
      params.push(filters.teamId);
      paramIndex++;
    }
    if (filters.city) {
      query += ` AND LOWER(TRIM(l.city)) = LOWER(TRIM($${paramIndex}))`;
      params.push(filters.city);
      paramIndex++;
    }
    if (filters.intent?.length) {
      query += `
        AND (
          SELECT ie.intent_type FROM intent_events ie
          WHERE ie.conversation_id = c.id
          ORDER BY ie.created_at DESC LIMIT 1
        ) = ANY($${paramIndex}::varchar[])
      `;
      params.push(filters.intent);
      paramIndex++;
    }

    query += ` ORDER BY c.updated_at ASC`;

    const { rows } = await this.db.query(query, params);
    return rows.map((r: any) => ({
      conversation_id: r.conversation_id,
      lead_id: r.lead_id,
      lead_phone: r.lead_phone,
    }));
  }

  /**
   * Send broadcast: loop over eligible conversations, send template one-by-one, log each to broadcast_events.
   * Never sends if ownership = human or escalated (eligibility already enforces this).
   */
  async sendBroadcast(dto: SendBroadcastDto): Promise<{ sent: number; failed: number; errors: string[] }> {
    if (!this.twilioWhatsApp.getIsConfigured()) {
      throw new BadRequestException('WhatsApp (Twilio) is not configured');
    }
    if (!dto.contentSid || !dto.templateName) {
      throw new BadRequestException('contentSid and templateName are required');
    }

    const eligible = await this.getEligibleConversations({
      stages: dto.stages?.length ? dto.stages : ['new', 'qualified'],
      city: dto.city,
      intent: dto.intent,
      teamId: dto.teamId,
    });

    const delayMs = Math.max(0, dto.delayMs ?? 500);
    const source = dto.source ?? 'broadcast';
    let sent = 0;
    const errors: string[] = [];

    for (const row of eligible) {
      try {
        await this.twilioWhatsApp.sendTemplate(row.lead_id, dto.contentSid, {
          contentVariables: dto.contentVariables,
          conversationId: row.conversation_id,
        });
        await this.db.query(
          `INSERT INTO broadcast_events (conversation_id, lead_id, template_name, sent_at, source_meta)
           VALUES ($1, $2, $3, NOW(), $4)`,
          [
            row.conversation_id,
            row.lead_id,
            dto.templateName,
            JSON.stringify({
              conversation_id: row.conversation_id,
              lead_id: row.lead_id,
              source,
              content_sid: dto.contentSid,
            }),
          ],
        );
        sent++;
        this.logger.debug(`Broadcast sent to lead ${row.lead_id} (conv ${row.conversation_id})`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`lead ${row.lead_id}: ${msg}`);
        this.logger.warn(`Broadcast failed for lead ${row.lead_id}: ${msg}`);
      }
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    return { sent, failed: errors.length, errors };
  }
}
