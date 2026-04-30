import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BuyerIntentScore, BuyerIntentScoreLog } from '../entities/buyer.entity';

@Injectable()
export class IntentScoringService {
  private readonly logger = new Logger(IntentScoringService.name);

  // Time decay configuration
  private readonly DAILY_DECAY_RATE = 0.95; // 5% decay per day
  private readonly INACTIVITY_THRESHOLD_DAYS = 14;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get current intent score for a buyer
   */
  async getIntentScore(buyerId: string): Promise<BuyerIntentScore | null> {
    const { rows } = await this.db.query(
      `SELECT id, buyer_id as "buyerId", score, 
              last_calculated_at as "lastCalculatedAt", 
              last_activity_at as "lastActivityAt",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM buyer_intent_scores
       WHERE buyer_id = $1`,
      [buyerId],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  /**
   * Update intent score with new event weight
   * Applies time decay first, then adds new weight
   */
  async updateIntentScore(
    buyerId: string,
    eventWeight: number,
    changeReason: string,
    eventId?: string,
  ): Promise<BuyerIntentScore> {
    // Get current score or create new
    let currentScore = await this.getIntentScore(buyerId);
    let scoreBefore = currentScore ? currentScore.score : 0;

    // Apply time decay if score exists
    if (currentScore) {
      const daysSinceActivity = this.getDaysSinceActivity(currentScore.lastActivityAt);
      
      if (daysSinceActivity > 0) {
        // Apply daily decay: score × 0.95^days
        const decayFactor = Math.pow(this.DAILY_DECAY_RATE, daysSinceActivity);
        scoreBefore = currentScore.score * decayFactor;
        
        // Log decay if significant
        if (Math.abs(scoreBefore - currentScore.score) > 0.01) {
          await this.logScoreChange(
            buyerId,
            currentScore.score,
            scoreBefore,
            `decay:${(1 - this.DAILY_DECAY_RATE) * 100}% per day for ${daysSinceActivity} days`,
            null,
          );
        }
      }
    }

    // Add new event weight (can be negative for events like favorite_removed)
    let scoreAfter = Math.max(0, Math.min(100, scoreBefore + eventWeight)); // Cap between 0 and 100

    // Log score change
    await this.logScoreChange(buyerId, scoreBefore, scoreAfter, changeReason, eventId || null);

    // Upsert intent score
    const { rows } = await this.db.query(
      `INSERT INTO buyer_intent_scores (buyer_id, score, last_calculated_at, last_activity_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW(), NOW())
       ON CONFLICT (buyer_id)
       DO UPDATE SET 
         score = $2,
         last_calculated_at = NOW(),
         last_activity_at = NOW(),
         updated_at = NOW()
       RETURNING id, buyer_id as "buyerId", score, 
                 last_calculated_at as "lastCalculatedAt", 
                 last_activity_at as "lastActivityAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [buyerId, scoreAfter],
    );

    return rows[0];
  }

  /**
   * Log a score change
   */
  private async logScoreChange(
    buyerId: string,
    scoreBefore: number,
    scoreAfter: number,
    changeReason: string,
    eventId: string | null,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO buyer_intent_score_logs (buyer_id, score_before, score_after, change_reason, event_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [buyerId, scoreBefore, scoreAfter, changeReason, eventId],
    );
  }

  /**
   * Calculate days since last activity
   */
  private getDaysSinceActivity(lastActivityAt: Date): number {
    const now = Date.now();
    const lastActivity = new Date(lastActivityAt).getTime();
    return (now - lastActivity) / (1000 * 60 * 60 * 24);
  }

  /**
   * Get score change history for a buyer
   */
  async getScoreHistory(buyerId: string, limit: number = 50): Promise<BuyerIntentScoreLog[]> {
    const { rows } = await this.db.query(
      `SELECT id, buyer_id as "buyerId", score_before as "scoreBefore", 
              score_after as "scoreAfter", change_reason as "changeReason",
              event_id as "eventId", created_at as "createdAt"
       FROM buyer_intent_score_logs
       WHERE buyer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [buyerId, limit],
    );

    return rows;
  }

  /**
   * Apply time decay to all inactive buyers (batch job)
   * This can be called periodically to update scores for inactive buyers
   */
  async applyTimeDecayToInactiveBuyers(): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT buyer_id as "buyerId", score, last_activity_at as "lastActivityAt"
       FROM buyer_intent_scores
       WHERE last_activity_at < NOW() - INTERVAL '${this.INACTIVITY_THRESHOLD_DAYS} days'
       AND score > 0`,
    );

    let updatedCount = 0;

    for (const row of rows) {
      const daysSinceActivity = this.getDaysSinceActivity(row.lastActivityAt);
      if (daysSinceActivity > 0) {
        const decayFactor = Math.pow(this.DAILY_DECAY_RATE, daysSinceActivity);
        const newScore = Math.max(0, row.score * decayFactor);

        if (Math.abs(newScore - row.score) > 0.01) {
          await this.logScoreChange(
            row.buyerId,
            row.score,
            newScore,
            `decay:${(1 - this.DAILY_DECAY_RATE) * 100}% per day for ${Math.floor(daysSinceActivity)} days`,
            null,
          );

          await this.db.query(
            `UPDATE buyer_intent_scores
             SET score = $1, last_calculated_at = NOW(), updated_at = NOW()
             WHERE buyer_id = $2`,
            [newScore, row.buyerId],
          );

          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * Create a snapshot of current intent score
   * Should be called periodically (e.g., every hour) for spike detection
   */
  async createSnapshot(buyerId: string): Promise<void> {
    const score = await this.getIntentScore(buyerId);
    if (score) {
      await this.db.query(
        `INSERT INTO intent_score_snapshots (buyer_id, score, snapshot_at, created_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [buyerId, score.score],
      );
    }
  }

  /**
   * Create snapshots for all buyers with intent scores
   * Should be called periodically (e.g., hourly cron job)
   */
  async createSnapshotsForAllBuyers(): Promise<number> {
    const { rows } = await this.db.query(
      `SELECT buyer_id as "buyerId", score
       FROM buyer_intent_scores`,
    );

    for (const row of rows) {
      await this.db.query(
        `INSERT INTO intent_score_snapshots (buyer_id, score, snapshot_at, created_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [row.buyerId, row.score],
      );
    }

    return rows.length;
  }
}
