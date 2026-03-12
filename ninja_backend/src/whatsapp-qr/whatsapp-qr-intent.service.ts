import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * Lightweight intent logging to intent_events_qr (parity with Twilio intent_events).
 */
@Injectable()
export class WhatsAppQrIntentService {
  constructor(private readonly db: DatabaseService) {}

  async logIntent(params: {
    qrConversationId: string;
    leadId: string;
    intentType: string;
    confidence: number;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO intent_events_qr (qr_conversation_id, lead_id, intent_type, confidence)
       VALUES ($1, $2, $3, $4)`,
      [
        params.qrConversationId,
        params.leadId,
        params.intentType,
        params.confidence,
      ],
    );
  }

  /**
   * Minimal heuristic: agent_request keywords + 1–4 funnel mapping.
   */
  detectFromText(text: string): { intent_type: string; confidence: number } | null {
    const t = (text || '').toLowerCase();
    if (/\b(human|agent|person|call me|llamame|hablar con)\b/.test(t)) {
      return { intent_type: 'agent_request', confidence: 0.9 };
    }
    if (/^\s*1\s*$|^1[\.\)]|\b(buy|comprar|buyer)\b/.test(t))
      return { intent_type: 'buy', confidence: 0.6 };
    if (/^\s*2\s*$|^2[\.\)]|\b(rent|alquilar|rentar)\b/.test(t))
      return { intent_type: 'rent', confidence: 0.6 };
    if (/^\s*3\s*$|^3[\.\)]|\b(sell|vender|seller)\b/.test(t))
      return { intent_type: 'sell', confidence: 0.6 };
    if (/^\s*4\s*$|^4[\.\)]/.test(t))
      return { intent_type: 'general_support', confidence: 0.5 };
    return null;
  }
}
