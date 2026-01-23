import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BuyerEventType, LogEventDto } from '../dto/log-event.dto';
import { Buyer, BuyerEvent, BuyerIntentScore, BuyerIntentScoreLog, BuyerPropertyView } from '../entities/buyer.entity';
import { IntentScoringService } from './intent-scoring.service';

@Injectable()
export class BuyerEventsService {
  private readonly logger = new Logger(BuyerEventsService.name);

  // Event weights as specified
  private readonly EVENT_WEIGHTS: Record<BuyerEventType, number> = {
    [BuyerEventType.PROPERTY_SEARCH]: 2,
    [BuyerEventType.FILTERS_APPLIED]: 3,
    [BuyerEventType.LISTING_VIEW]: 4,
    [BuyerEventType.REVISIT]: 6,
    [BuyerEventType.CONTACTED]: 25,
  };

  constructor(
    private readonly db: DatabaseService,
    private readonly intentScoringService: IntentScoringService,
  ) {}

  /**
   * Get or create a buyer by ID
   */
  async getOrCreateBuyer(buyerId: string, sessionId?: string): Promise<Buyer> {
    const { rows } = await this.db.query(
      `SELECT id, user_id as "userId", session_id as "sessionId", 
              ip_hash as "ipHash", user_agent_hash as "userAgentHash",
              first_seen_at as "firstSeenAt", last_activity_at as "lastActivityAt",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM buyers 
       WHERE id = $1`,
      [buyerId],
    );

    if (rows.length > 0) {
      // Update last activity
      await this.db.query(
        `UPDATE buyers 
         SET last_activity_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [buyerId],
      );
      return rows[0];
    }

    // Create new buyer
    const { rows: newRows } = await this.db.query(
      `INSERT INTO buyers (id, session_id, first_seen_at, last_activity_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
       RETURNING id, user_id as "userId", session_id as "sessionId", 
                 ip_hash as "ipHash", user_agent_hash as "userAgentHash",
                 first_seen_at as "firstSeenAt", last_activity_at as "lastActivityAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [buyerId, sessionId || null],
    );

    return newRows[0];
  }

  /**
   * Log a buyer event and update intent score
   */
  async logEvent(dto: LogEventDto): Promise<BuyerEvent> {
    // Get or create buyer
    await this.getOrCreateBuyer(dto.buyerId);

    // Check if this is a revisit (for listing_view events)
    let isRevisit = false;
    if (dto.eventType === BuyerEventType.LISTING_VIEW && dto.propertyId) {
      isRevisit = await this.checkRevisit(dto.buyerId, dto.propertyId);
      
      // Update or create property view record
      await this.updatePropertyView(dto.buyerId, dto.propertyId);
    }

    // Determine actual event type (revisit takes precedence)
    const actualEventType = isRevisit ? BuyerEventType.REVISIT : dto.eventType;

    // Insert event
    const { rows } = await this.db.query(
      `INSERT INTO buyer_events (buyer_id, event_type, property_id, zone_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, buyer_id as "buyerId", event_type as "eventType", 
                 property_id as "propertyId", zone_id as "zoneId", 
                 metadata, created_at as "createdAt"`,
      [
        dto.buyerId,
        actualEventType,
        dto.propertyId || null,
        dto.zoneId || null,
        dto.metadata ? JSON.stringify(dto.metadata) : null,
      ],
    );

    const event = rows[0];

    // Update intent score
    const eventWeight = this.EVENT_WEIGHTS[actualEventType];
    await this.intentScoringService.updateIntentScore(
      dto.buyerId,
      eventWeight,
      `event:${actualEventType}`,
      event.id,
    );

    // Update buyer last activity
    await this.db.query(
      `UPDATE buyers 
       SET last_activity_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [dto.buyerId],
    );

    return event;
  }

  /**
   * Check if a property view is a revisit (within 7 days)
   */
  private async checkRevisit(buyerId: string, propertyId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT last_viewed_at as "lastViewedAt"
       FROM buyer_property_views
       WHERE buyer_id = $1 AND property_id = $2`,
      [buyerId, propertyId],
    );

    if (rows.length === 0) {
      return false; // First view, not a revisit
    }

    const lastViewedAt = new Date(rows[0].lastViewedAt);
    const daysSinceLastView = (Date.now() - lastViewedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceLastView <= 7; // Revisit if within 7 days
  }

  /**
   * Update or create property view record
   */
  private async updatePropertyView(buyerId: string, propertyId: string): Promise<void> {
    await this.db.query(
      `INSERT INTO buyer_property_views (buyer_id, property_id, first_viewed_at, last_viewed_at, view_count)
       VALUES ($1, $2, NOW(), NOW(), 1)
       ON CONFLICT (buyer_id, property_id)
       DO UPDATE SET 
         last_viewed_at = NOW(),
         view_count = buyer_property_views.view_count + 1`,
      [buyerId, propertyId],
    );
  }

  /**
   * Get buyer events
   */
  async getBuyerEvents(buyerId: string, limit: number = 100): Promise<BuyerEvent[]> {
    const { rows } = await this.db.query(
      `SELECT id, buyer_id as "buyerId", event_type as "eventType", 
              property_id as "propertyId", zone_id as "zoneId", 
              metadata, created_at as "createdAt"
       FROM buyer_events
       WHERE buyer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [buyerId, limit],
    );

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }
}
