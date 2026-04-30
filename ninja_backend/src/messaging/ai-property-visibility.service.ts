import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type AiPropertyAction = 'matched_by_ai' | 'sent_to_lead' | 'rejected';

@Injectable()
export class AiPropertyVisibilityService {
  constructor(private readonly db: DatabaseService) {}

  async record(leadId: string, propertyId: string, action: AiPropertyAction): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO ai_property_visibility (lead_id, property_id, action) VALUES ($1, $2, $3)`,
        [leadId, propertyId, action],
      );
    } catch (err: any) {
      if (err.code !== '42P01') throw err; // ignore if table doesn't exist yet
    }
  }

  async recordMatched(leadId: string, propertyId: string): Promise<void> {
    await this.record(leadId, propertyId, 'matched_by_ai');
  }

  async recordSent(leadId: string, propertyId: string): Promise<void> {
    await this.record(leadId, propertyId, 'sent_to_lead');
  }

  async recordRejected(leadId: string, propertyId: string): Promise<void> {
    await this.record(leadId, propertyId, 'rejected');
  }
}
