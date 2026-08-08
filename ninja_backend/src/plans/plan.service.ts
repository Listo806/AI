import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  PlanConfig,
  PlanFeatures,
  PlanId,
  PlanLimits,
  getLimit,
  getPlan,
  getSeatLimit,
  hasFeature,
  normalizePlanId,
} from './plan-config';

// Resolves a user's / team's effective plan and answers feature + limit
// questions from the canonical plan-config. The authoritative stored tier is
// COALESCE(selected_plan, plan) on the users table, normalized to a current plan
// id. This is the single service the permission guards and usage metering (built
// in later phases) will call, and it self-heals the plan columns it writes to.
@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);
  private columnsReady = false;

  constructor(private readonly db: DatabaseService) {}

  // Self-healing: migrations are not auto-run in this codebase, so add the plan
  // columns at runtime the first time they are needed (idempotent).
  async ensurePlanColumns(): Promise<void> {
    if (this.columnsReady) return;
    try {
      const cols = [
        `billing_cycle VARCHAR(10)`,
        `plan_status VARCHAR(24) DEFAULT 'active'`,
        `paddle_customer_id TEXT`,
        `upgraded_at TIMESTAMPTZ`,
        `downgraded_at TIMESTAMPTZ`,
        `canceled_at TIMESTAMPTZ`,
      ];
      for (const c of cols) {
        await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c}`);
      }
      this.columnsReady = true;
    } catch (err: any) {
      this.logger.error(`ensurePlanColumns failed: ${err?.message}`);
    }
  }

  normalize(raw?: string | null): PlanId {
    return normalizePlanId(raw);
  }

  // Effective plan id for a user, resolved from COALESCE(selected_plan, plan).
  // Defaults to 'free' for missing/unknown rows.
  async getPlanIdForUser(userId?: string | null): Promise<PlanId> {
    if (!userId) return 'free';
    try {
      const { rows } = await this.db.query(
        `SELECT COALESCE(selected_plan, plan) AS p FROM users WHERE id = $1`,
        [userId],
      );
      return normalizePlanId(rows[0]?.p);
    } catch (err: any) {
      this.logger.error(`getPlanIdForUser failed: ${err?.message}`);
      return 'free';
    }
  }

  getConfig(id?: string | null): PlanConfig {
    return getPlan(id);
  }

  getLimits(id?: string | null): PlanLimits {
    return getPlan(id).limits;
  }

  getFeatures(id?: string | null): PlanFeatures {
    return getPlan(id).features;
  }

  getSeatLimit(id?: string | null): number {
    return getSeatLimit(id);
  }

  hasFeature(id: string | null | undefined, key: keyof PlanFeatures): boolean {
    return hasFeature(id, key);
  }

  getLimit(
    id: string | null | undefined,
    key: keyof PlanLimits,
  ): number | null {
    return getLimit(id, key);
  }
}
