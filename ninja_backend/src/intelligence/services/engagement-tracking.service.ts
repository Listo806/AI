import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export enum EngagementType {
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  CONTACT_ATTEMPT = 'contact_attempt',
  NOTE_ADDED = 'note_added',
  WHATSAPP_CLICK = 'whatsapp_click',
  CALL_CLICK = 'call_click',
  EMAIL_CLICK = 'email_click',
}

@Injectable()
export class EngagementTrackingService {
  private readonly logger = new Logger(EngagementTrackingService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Record agent engagement with buyer
   */
  async recordEngagement(
    agentId: string,
    buyerId: string,
    engagementType: EngagementType,
    leadId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO agent_buyer_engagements 
       (agent_id, buyer_id, lead_id, engagement_type, engagement_at, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW(), $5, NOW())`,
      [
        agentId,
        buyerId,
        leadId || null,
        engagementType,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  }

  /**
   * Check if agent has engaged with buyer recently
   */
  async hasRecentEngagement(
    agentId: string,
    buyerId: string,
    hours: number = 24,
  ): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT id
       FROM agent_buyer_engagements
       WHERE agent_id = $1
       AND buyer_id = $2
       AND engagement_at >= NOW() - INTERVAL '${hours} hours'
       LIMIT 1`,
      [agentId, buyerId],
    );

    return rows.length > 0;
  }

  /**
   * Get engagement history for buyer-agent pair
   */
  async getEngagementHistory(
    agentId: string,
    buyerId: string,
    limit: number = 50,
  ): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT id, agent_id as "agentId", buyer_id as "buyerId", 
              lead_id as "leadId", engagement_type as "engagementType",
              engagement_at as "engagementAt", metadata, created_at as "createdAt"
       FROM agent_buyer_engagements
       WHERE agent_id = $1
       AND buyer_id = $2
       ORDER BY engagement_at DESC
       LIMIT $3`,
      [agentId, buyerId, limit],
    );

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }
}
