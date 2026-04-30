import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ParsedEntities {
  city?: string;
  country?: string;
  budget_min?: number;
  budget_max?: number;
  intent?: 'buy' | 'rent' | 'sell';
}

@Injectable()
export class EntityParsingService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Parse entities from message text (NLP-style extraction).
   */
  parseFromText(text: string): ParsedEntities {
    const t = (text || '').toLowerCase().trim();
    const out: ParsedEntities = {};

    // City: "ciudad: X", "en X", "in X"
    const cityMatch =
      t.match(/(?:ciudad\s*[:\-]\s*)([a-záéíóúñ\s]{2,40})/) ||
      t.match(/\b(en|in)\s+([a-záéíóúñ]{2,25})\b/);
    if (cityMatch) out.city = (cityMatch[2] || cityMatch[1] || '').trim();

    // Country: "país: X", "country: X"
    const countryMatch = t.match(/(?:país|country|pais)\s*[:\-]\s*([a-záéíóúñ\s]{2,50})/i);
    if (countryMatch) out.country = countryMatch[1].trim();

    // Budget: $X, USD X, presupuesto X
    const rangeMatch = t.match(/(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)/);
    if (rangeMatch) {
      const toNum = (s: string) => parseFloat(s.replace(/,/g, ''));
      const lo = toNum(rangeMatch[1]);
      const hi = toNum(rangeMatch[2]);
      if (!isNaN(lo)) out.budget_min = lo;
      if (!isNaN(hi)) out.budget_max = hi;
    } else {
      const moneyMatch = t.match(
        /(\$|usd|d[oó]lares|presupuesto)?\s*([0-9]{2,3}(?:[.,][0-9]{3})+|[0-9]{3,8})/i,
      );
      if (moneyMatch) {
        const amount = parseFloat(moneyMatch[2].replace(/,/g, ''));
        if (!isNaN(amount)) out.budget_max = amount;
      }
    }

    // Intent
    if (/\b(comprar|compra|buy|purchase)\b/.test(t)) out.intent = 'buy';
    else if (/\b(alquilar|alquiler|rent|lease)\b/.test(t)) out.intent = 'rent';
    else if (/\b(vender|venta|sell|listing)\b/.test(t)) out.intent = 'sell';

    return out;
  }

  /**
   * Persist parsed entities to lead. Merges with existing (only overwrite if new value).
   */
  async persistToLead(leadId: string, parsed: ParsedEntities): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (parsed.city !== undefined && parsed.city) {
      updates.push(`parsed_city = $${i++}`);
      params.push(parsed.city);
    }
    if (parsed.country !== undefined && parsed.country) {
      updates.push(`parsed_country = $${i++}`);
      params.push(parsed.country);
    }
    if (parsed.budget_min !== undefined) {
      updates.push(`parsed_budget_min = $${i++}`);
      params.push(parsed.budget_min);
    }
    if (parsed.budget_max !== undefined) {
      updates.push(`parsed_budget_max = $${i++}`);
      params.push(parsed.budget_max);
    }
    if (parsed.intent !== undefined) {
      updates.push(`parsed_intent = $${i++}`);
      params.push(parsed.intent);
    }

    if (updates.length === 0) return;

    params.push(leadId);
    await this.db.query(
      `UPDATE leads SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
      params,
    );
  }

  /**
   * Get current parsed entities for a lead.
   */
  async getForLead(leadId: string): Promise<ParsedEntities & { lead_ai_state?: string }> {
    const { rows } = await this.db.query(
      `SELECT parsed_city, parsed_country, parsed_budget_min, parsed_budget_max, parsed_intent, lead_ai_state
       FROM leads WHERE id = $1`,
      [leadId],
    );
    const r = rows[0];
    if (!r) return {};
    return {
      city: r.parsed_city ?? undefined,
      country: r.parsed_country ?? undefined,
      budget_min: r.parsed_budget_min != null ? Number(r.parsed_budget_min) : undefined,
      budget_max: r.parsed_budget_max != null ? Number(r.parsed_budget_max) : undefined,
      intent: r.parsed_intent ?? undefined,
      lead_ai_state: r.lead_ai_state ?? 'new',
    };
  }
}
