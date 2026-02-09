import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface EligibleProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type: string;
}

@Injectable()
export class PropertyMatchingService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Find properties eligible for a lead:
   * - status = published
   * - city matches lead parsed_city (case-insensitive)
   * - price <= lead parsed_budget_max
   */
  async findEligibleForLead(
    leadId: string,
    teamId: string | null,
  ): Promise<{ properties: EligibleProperty[]; matchCount: number }> {
    const { rows: leadRows } = await this.db.query(
      `SELECT parsed_city, parsed_budget_max, parsed_intent FROM leads WHERE id = $1`,
      [leadId],
    );
    const lead = leadRows[0];
    const city = lead?.parsed_city?.trim();
    const budgetMax = lead?.parsed_budget_max != null ? Number(lead.parsed_budget_max) : null;

    const conditions: string[] = ["p.status = 'published'"];
    const params: unknown[] = [];
    let i = 1;

    if (city) {
      conditions.push(`LOWER(TRIM(p.city)) = LOWER(TRIM($${i++}))`);
      params.push(city);
    }
    if (budgetMax != null && budgetMax > 0) {
      conditions.push(`(p.price IS NULL OR p.price <= $${i++})`);
      params.push(budgetMax);
    }

    if (teamId) {
      conditions.push(`(p.team_id = $${i++} OR p.team_id IS NULL)`);
      params.push(teamId);
    }

    const where = conditions.join(' AND ');
    const { rows } = await this.db.query(
      `SELECT p.id, p.title, p.city, p.price, p.type
       FROM properties p
       WHERE ${where}
       ORDER BY p.price ASC NULLS LAST, p.created_at DESC
       LIMIT 50`,
      params,
    );

    return {
      properties: rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        city: r.city,
        price: r.price != null ? Number(r.price) : 0,
        type: r.type,
      })),
      matchCount: rows.length,
    };
  }
}
