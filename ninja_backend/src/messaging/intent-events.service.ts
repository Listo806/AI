import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';

export type IntentType = 'buy' | 'rent' | 'sell' | 'agent_request' | 'general';
export type DetectedFrom = 'text' | 'audio' | 'button';

export interface IntentEvent {
  id: string;
  conversation_id: string;
  lead_id: string;
  intent_type: IntentType;
  confidence: number;
  detected_from: DetectedFrom;
  source: 'organic' | 'ad';
  source_meta: Record<string, unknown> | null;
  created_at: Date;
}

@Injectable()
export class IntentEventsService {
  private readonly logger = new Logger(IntentEventsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
  ) {}

  private mapRow(row: any): IntentEvent {
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      lead_id: row.lead_id,
      intent_type: row.intent_type,
      confidence: Number(row.confidence),
      detected_from: row.detected_from,
      source: row.source,
      source_meta: row.source_meta ?? null,
      created_at: row.created_at,
    };
  }

  async getLatestForConversation(conversationId: string): Promise<IntentEvent | null> {
    const { rows } = await this.db.query(
      `SELECT id, conversation_id, lead_id, intent_type, confidence, detected_from, source, source_meta, created_at
       FROM intent_events
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [conversationId],
    );
    return rows.length ? this.mapRow(rows[0]) : null;
  }

  async listForConversation(conversationId: string, limit = 50): Promise<IntentEvent[]> {
    const { rows } = await this.db.query(
      `SELECT id, conversation_id, lead_id, intent_type, confidence, detected_from, source, source_meta, created_at
       FROM intent_events
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, limit],
    );
    return rows.map((r: any) => this.mapRow(r));
  }

  /**
   * Minimal, safe intent detection (heuristics). No free-chat, no automation.
   */
  detectIntentFromText(text: string): { intent_type: IntentType; confidence: number } {
    const t = (text || '').toLowerCase();

    const has = (re: RegExp) => re.test(t);

    // agent_request (highest priority)
    if (has(/\b(human|agent|call me)\b/) || has(/\b(asesor|agente|representante)\b/)) {
      return { intent_type: 'agent_request', confidence: 0.95 };
    }

    // buy / rent / sell
    if (has(/\b(comprar|compra|buy|purchase)\b/)) return { intent_type: 'buy', confidence: 0.9 };
    if (has(/\b(alquilar|alquiler|rent|lease)\b/)) return { intent_type: 'rent', confidence: 0.9 };
    if (has(/\b(vender|venta|sell|listing)\b/)) return { intent_type: 'sell', confidence: 0.85 };

    return { intent_type: 'general', confidence: 0.5 };
  }

  async createIfAllowed(args: {
    conversationId: string;
    leadId: string;
    detectedFrom: DetectedFrom;
    text?: string;
    intentType?: IntentType;
    confidence?: number;
  }): Promise<IntentEvent | null> {
    const conv = await this.conversations.findById(args.conversationId);
    if (!conv) return null;

    let intent: IntentType;
    let confidence: number;
    if (args.intentType) {
      intent = args.intentType;
      confidence = args.confidence ?? (intent === 'agent_request' ? 1.0 : 0.8);
    } else {
      const detected = this.detectIntentFromText(args.text || '');
      intent = detected.intent_type;
      confidence = detected.confidence;
    }

    // Storage rules
    const shouldStore = intent === 'agent_request' || confidence >= 0.6;
    if (!shouldStore) return null;

    const { rows } = await this.db.query(
      `INSERT INTO intent_events (conversation_id, lead_id, intent_type, confidence, detected_from, source, source_meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, conversation_id, lead_id, intent_type, confidence, detected_from, source, source_meta, created_at`,
      [
        args.conversationId,
        args.leadId,
        intent,
        confidence,
        args.detectedFrom,
        conv.source,
        conv.source_meta ? JSON.stringify(conv.source_meta) : null,
      ],
    );
    return this.mapRow(rows[0]);
  }
}

