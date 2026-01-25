import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TriggerEvaluationService, TriggerType, Trigger } from './trigger-evaluation.service';
import { IntentScoringService } from './intent-scoring.service';

export enum SuggestedAction {
  CONTACT_BUYER = 'contact_buyer',
  SEND_LISTING = 'send_listing',
  FOLLOW_UP = 'follow_up',
  SCHEDULE_SHOWING = 'schedule_showing',
}

export interface PriorityFeedItem {
  buyerId: string;
  intentScore: number;
  triggerType: TriggerType;
  triggeredAt: Date;
  reason: string;
  matchedListingIds: string[];
  suggestedAction: SuggestedAction;
  cooldownUntil: Date | null;
}

@Injectable()
export class AgentPriorityFeedService {
  private readonly logger = new Logger(AgentPriorityFeedService.name);

  // Trigger priority weights for ranking
  private readonly TRIGGER_WEIGHTS: Record<TriggerType, number> = {
    [TriggerType.INTENT_SPIKE]: 50,
    [TriggerType.NEW_MATCHING_LISTING]: 30,
    [TriggerType.MARKET_SCARCITY]: 20,
  };

  // Default action mapping
  private readonly ACTION_MAPPING: Record<TriggerType, SuggestedAction> = {
    [TriggerType.INTENT_SPIKE]: SuggestedAction.CONTACT_BUYER,
    [TriggerType.NEW_MATCHING_LISTING]: SuggestedAction.SEND_LISTING,
    [TriggerType.MARKET_SCARCITY]: SuggestedAction.SCHEDULE_SHOWING,
  };

  constructor(
    private readonly db: DatabaseService,
    private readonly triggerEvaluationService: TriggerEvaluationService,
    private readonly intentScoringService: IntentScoringService,
  ) {}

  /**
   * Get priority feed for an agent
   * Returns ranked list of buyers with active triggers
   */
  async getPriorityFeed(agentId: string): Promise<PriorityFeedItem[]> {
    // Verify agent exists
    const { rows: agentRows } = await this.db.query(
      `SELECT id, role FROM users WHERE id = $1`,
      [agentId],
    );

    if (agentRows.length === 0) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Get all buyers assigned to this agent (via leads)
    const { rows: buyerRows } = await this.db.query(
      `SELECT DISTINCT l.buyer_id as "buyerId"
       FROM leads l
       WHERE l.assigned_to = $1
       AND l.buyer_id IS NOT NULL`,
      [agentId],
    );

    if (buyerRows.length === 0) {
      return []; // No buyers assigned to this agent
    }

    const buyerIds = buyerRows.map((row) => row.buyerId);
    const feedItems: PriorityFeedItem[] = [];

    // Evaluate triggers for each buyer
    for (const buyerId of buyerIds) {
      // Skip if agent has recent engagement (suppresses triggers)
      const hasEngagement = await this.triggerEvaluationService.hasRecentEngagement(
        buyerId,
        agentId,
      );
      if (hasEngagement) {
        continue;
      }

      // Evaluate all trigger types
      const triggers: Trigger[] = [];

      // Intent spike
      if (!(await this.triggerEvaluationService.isInCooldown(buyerId, agentId, TriggerType.INTENT_SPIKE))) {
        const intentSpike = await this.triggerEvaluationService.evaluateIntentSpike(buyerId);
        if (intentSpike) {
          triggers.push(intentSpike);
        }
      }

      // New matching listings
      if (!(await this.triggerEvaluationService.isInCooldown(buyerId, agentId, TriggerType.NEW_MATCHING_LISTING))) {
        const newListings = await this.triggerEvaluationService.evaluateNewMatchingListing(buyerId);
        triggers.push(...newListings);
      }

      // Market scarcity
      if (!(await this.triggerEvaluationService.isInCooldown(buyerId, agentId, TriggerType.MARKET_SCARCITY))) {
        const scarcity = await this.triggerEvaluationService.evaluateMarketScarcity(buyerId);
        triggers.push(...scarcity);
      }

      // Convert triggers to feed items
      for (const trigger of triggers) {
        // Get cooldown info
        const { rows: cooldownRows } = await this.db.query(
          `SELECT cooldown_until as "cooldownUntil"
           FROM buyer_trigger_history
           WHERE buyer_id = $1
           AND agent_id = $2
           AND trigger_type = $3
           ORDER BY triggered_at DESC
           LIMIT 1`,
          [buyerId, agentId, trigger.triggerType],
        );

        const cooldownUntil = cooldownRows.length > 0 
          ? new Date(cooldownRows[0].cooldownUntil)
          : null;

        // Extract matched listing IDs
        const matchedListingIds: string[] = [];
        if (trigger.metadata.propertyId) {
          matchedListingIds.push(trigger.metadata.propertyId);
        }

        // Calculate cooldown until (for new triggers)
        const cooldownHours = this.getCooldownHours(trigger.triggerType);
        const newCooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
        const finalCooldownUntil = cooldownUntil && cooldownUntil > new Date() ? cooldownUntil : newCooldownUntil;

        feedItems.push({
          buyerId: trigger.buyerId,
          intentScore: trigger.intentScore,
          triggerType: trigger.triggerType,
          triggeredAt: trigger.triggeredAt,
          reason: trigger.reason,
          matchedListingIds,
          suggestedAction: this.ACTION_MAPPING[trigger.triggerType],
          cooldownUntil: finalCooldownUntil,
        });

        // Record trigger in history (always record new triggers)
        await this.triggerEvaluationService.recordTrigger(
          trigger.buyerId,
          agentId,
          trigger,
        );
      }
    }

    // Rank feed items
    const rankedItems = this.rankFeedItems(feedItems);

    return rankedItems;
  }

  /**
   * Rank feed items by priority
   * Formula: trigger_priority_weight + (intent_score × 0.6) + recency_boost
   */
  private rankFeedItems(items: PriorityFeedItem[]): PriorityFeedItem[] {
    const now = Date.now();

    const itemsWithScores = items.map((item) => {
      const triggerWeight = this.TRIGGER_WEIGHTS[item.triggerType];
      const intentScoreComponent = item.intentScore * 0.6;

      // Recency boost: exponential decay e^(-hours/24)
      const hoursSinceTrigger = (now - item.triggeredAt.getTime()) / (1000 * 60 * 60);
      const recencyBoost = Math.exp(-hoursSinceTrigger / 24) * 20; // Max 20 points

      const rankScore = triggerWeight + intentScoreComponent + recencyBoost;

      return {
        ...item,
        _rankScore: rankScore, // Internal field for sorting
      };
    });

    // Sort by rank score (descending)
    itemsWithScores.sort((a, b) => b._rankScore - a._rankScore);

    // Remove internal _rankScore field
    return itemsWithScores.map(({ _rankScore, ...item }) => item);
  }

  /**
   * Get cooldown hours for trigger type
   */
  private getCooldownHours(triggerType: TriggerType): number {
    const cooldowns: Record<TriggerType, number> = {
      [TriggerType.INTENT_SPIKE]: 24,
      [TriggerType.NEW_MATCHING_LISTING]: 12,
      [TriggerType.MARKET_SCARCITY]: 48,
    };
    return cooldowns[triggerType];
  }
}
