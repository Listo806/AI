import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { IntentScoringService } from './intent-scoring.service';
import { BuyerPreferencesService } from './buyer-preferences.service';
import { MarketSignalsService } from './market-signals.service';

export enum TriggerType {
  INTENT_SPIKE = 'intent_spike',
  NEW_MATCHING_LISTING = 'new_matching_listing',
  MARKET_SCARCITY = 'market_scarcity',
}

export interface Trigger {
  buyerId: string;
  triggerType: TriggerType;
  intentScore: number;
  triggeredAt: Date;
  reason: string;
  metadata: {
    propertyId?: string;
    zoneId?: string;
    scoreIncrease?: number;
    [key: string]: any;
  };
}

@Injectable()
export class TriggerEvaluationService {
  private readonly logger = new Logger(TriggerEvaluationService.name);

  // Cooldown durations (in hours)
  private readonly COOLDOWNS: Record<TriggerType, number> = {
    [TriggerType.INTENT_SPIKE]: 24,
    [TriggerType.NEW_MATCHING_LISTING]: 12,
    [TriggerType.MARKET_SCARCITY]: 48,
  };

  constructor(
    private readonly db: DatabaseService,
    private readonly intentScoringService: IntentScoringService,
    private readonly buyerPreferencesService: BuyerPreferencesService,
    private readonly marketSignalsService: MarketSignalsService,
  ) {}

  /**
   * Evaluate intent spike trigger
   * Trigger condition: (intent_score_now - intent_score_24h_ago) >= 15
   * OR intent_score_now >= 60 AND increase >= 10 in last 24h
   */
  async evaluateIntentSpike(buyerId: string): Promise<Trigger | null> {
    // Get current intent score
    const currentScore = await this.intentScoringService.getIntentScore(buyerId);
    if (!currentScore || currentScore.score < 15) {
      return null; // No spike if score is too low
    }

    // Get score from 24 hours ago (from snapshots)
    const { rows } = await this.db.query(
      `SELECT score
       FROM intent_score_snapshots
       WHERE buyer_id = $1
       AND snapshot_at <= NOW() - INTERVAL '24 hours'
       ORDER BY snapshot_at DESC
       LIMIT 1`,
      [buyerId],
    );

    const score24hAgo = rows.length > 0 ? parseFloat(rows[0].score) : 0;
    const scoreIncrease = currentScore.score - score24hAgo;

    // Check trigger conditions
    const condition1 = scoreIncrease >= 15;
    const condition2 = currentScore.score >= 60 && scoreIncrease >= 10;

    if (condition1 || condition2) {
      return {
        buyerId,
        triggerType: TriggerType.INTENT_SPIKE,
        intentScore: currentScore.score,
        triggeredAt: new Date(),
        reason: `Intent score increased by ${scoreIncrease.toFixed(1)} points in the last 24 hours (${score24hAgo.toFixed(1)} → ${currentScore.score.toFixed(1)})`,
        metadata: {
          scoreIncrease: parseFloat(scoreIncrease.toFixed(2)),
          score24hAgo: parseFloat(score24hAgo.toFixed(2)),
        },
      };
    }

    return null;
  }

  /**
   * Evaluate new matching listing trigger
   * Fires when a new property is published that matches buyer preferences
   */
  async evaluateNewMatchingListing(buyerId: string): Promise<Trigger[]> {
    const triggers: Trigger[] = [];

    // Get buyer preferences
    const preferences = await this.buyerPreferencesService.getPreferences(buyerId);

    // If no preferences, no matches
    if (preferences.zones.length === 0 && !preferences.propertyType) {
      return triggers;
    }

    // Get current intent score
    const currentScore = await this.intentScoringService.getIntentScore(buyerId);
    const intentScore = currentScore ? currentScore.score : 0;

    // Build query to find matching new listings
    let query = `
      SELECT p.id, p.title, p.price, p.type, p.zone_id as "zoneId", p.published_at as "publishedAt"
      FROM properties p
      WHERE p.status = 'published'
      AND p.published_at >= NOW() - INTERVAL '7 days'
      AND p.id NOT IN (
        SELECT property_id 
        FROM buyer_property_views 
        WHERE buyer_id = $1
      )
    `;

    const params: any[] = [buyerId];
    let paramCount = 2;

    // Filter by property type
    if (preferences.propertyType) {
      query += ` AND p.type = $${paramCount++}`;
      params.push(preferences.propertyType);
    }

    // Filter by zones
    if (preferences.zones.length > 0) {
      query += ` AND p.zone_id = ANY($${paramCount++})`;
      params.push(preferences.zones);
    }

    // Filter by price range
    if (preferences.priceRange.min !== null) {
      query += ` AND p.price >= $${paramCount++}`;
      params.push(preferences.priceRange.min);
    }
    if (preferences.priceRange.max !== null) {
      query += ` AND p.price <= $${paramCount++}`;
      params.push(preferences.priceRange.max);
    }

    // Filter by bedrooms
    if (preferences.bedrooms.min !== null) {
      query += ` AND p.bedrooms >= $${paramCount++}`;
      params.push(preferences.bedrooms.min);
    }
    if (preferences.bedrooms.max !== null) {
      query += ` AND p.bedrooms <= $${paramCount++}`;
      params.push(preferences.bedrooms.max);
    }

    query += ` ORDER BY p.published_at DESC LIMIT 10`;

    const { rows } = await this.db.query(query, params);

    // Create triggers for each matching listing
    for (const listing of rows) {
      triggers.push({
        buyerId,
        triggerType: TriggerType.NEW_MATCHING_LISTING,
        intentScore,
        triggeredAt: new Date(), // When trigger is detected (not when listing was published)
        reason: `New matching listing: ${listing.title}${listing.price ? ` ($${listing.price.toLocaleString()})` : ''}`,
        metadata: {
          propertyId: listing.id,
          zoneId: listing.zoneId,
        },
      });
    }

    return triggers;
  }

  /**
   * Evaluate market scarcity trigger
   * Fires when zone scarcity changes from false → true
   */
  async evaluateMarketScarcity(buyerId: string): Promise<Trigger[]> {
    const triggers: Trigger[] = [];

    // Get buyer preferences to find their zones
    const preferences = await this.buyerPreferencesService.getPreferences(buyerId);

    if (preferences.zones.length === 0) {
      return triggers;
    }

    // Get current intent score
    const currentScore = await this.intentScoringService.getIntentScore(buyerId);
    const intentScore = currentScore ? currentScore.score : 0;

    // Check each zone for scarcity transitions
    for (const zoneId of preferences.zones) {
      try {
        const signals = await this.marketSignalsService.getMarketSignals(zoneId);

        // Check if scarcity just became true (check history)
        const { rows: historyRows } = await this.db.query(
          `SELECT is_scarcity, changed_at as "changedAt"
           FROM zone_scarcity_history
           WHERE zone_id = $1
           ORDER BY changed_at DESC
           LIMIT 2`,
          [zoneId],
        );

        // If current scarcity is true, check if it recently transitioned from false
        if (signals.inventoryChange.isScarcity) {
          // Get the most recent history entry (should be the current state)
          const currentHistory = historyRows.length > 0 ? historyRows[0] : null;
          
          // Get the previous state (before current)
          const previousScarcity = historyRows.length > 1 ? historyRows[1].is_scarcity : false;
          
          // Check if transition happened recently (within last 7 days)
          if (currentHistory && !previousScarcity) {
            const changeTime = new Date(currentHistory.changedAt).getTime();
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            
            if (changeTime >= sevenDaysAgo) {
              triggers.push({
                buyerId,
                triggerType: TriggerType.MARKET_SCARCITY,
                intentScore,
                triggeredAt: new Date(currentHistory.changedAt),
                reason: `Market scarcity detected in ${signals.zoneName}. Only ${signals.activeListingsCount} active listings available.`,
                metadata: {
                  zoneId,
                  activeListingsCount: signals.activeListingsCount,
                },
              });
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to check scarcity for zone ${zoneId}:`, error);
      }
    }

    return triggers;
  }

  /**
   * Check if trigger is in cooldown for buyer-agent pair
   */
  async isInCooldown(
    buyerId: string,
    agentId: string,
    triggerType: TriggerType,
  ): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT cooldown_until as "cooldownUntil"
       FROM buyer_trigger_history
       WHERE buyer_id = $1
       AND agent_id = $2
       AND trigger_type = $3
       AND cooldown_until > NOW()
       ORDER BY triggered_at DESC
       LIMIT 1`,
      [buyerId, agentId, triggerType],
    );

    return rows.length > 0;
  }

  /**
   * Check if agent has recently engaged with buyer
   */
  async hasRecentEngagement(buyerId: string, agentId: string): Promise<boolean> {
    // Check for engagements in last 24 hours
    const { rows } = await this.db.query(
      `SELECT id
       FROM agent_buyer_engagements
       WHERE buyer_id = $1
       AND agent_id = $2
       AND engagement_at >= NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [buyerId, agentId],
    );

    return rows.length > 0;
  }

  /**
   * Record trigger in history
   */
  async recordTrigger(
    buyerId: string,
    agentId: string,
    trigger: Trigger,
  ): Promise<void> {
    const cooldownHours = this.COOLDOWNS[trigger.triggerType];
    const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

    await this.db.query(
      `INSERT INTO buyer_trigger_history 
       (buyer_id, agent_id, trigger_type, triggered_at, cooldown_until, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        buyerId,
        agentId,
        trigger.triggerType,
        trigger.triggeredAt,
        cooldownUntil,
        JSON.stringify(trigger.metadata),
      ],
    );
  }
}
