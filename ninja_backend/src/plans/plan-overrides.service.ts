import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  PLAN_ORDER,
  PlanFeatures,
  PlanId,
  PlanLimits,
  getPlan,
  normalizePlanId,
} from './plan-config';

// Admin-editable overrides for plan LIMITS and FEATURE access, layered on top of
// the code defaults in plan-config. Pricing/Paddle are intentionally NOT
// overridable here (real charges live in Paddle). Everything falls back to the
// code default when there is no override, so an empty table changes nothing.
//
// Enforcement note: today only the Free plan's limits/features are enforced
// (paid tiers are unlimited + grandfathered), so editing Free's caps/features
// has an immediate real effect; editing paid tiers is stored for when per-tier
// paid enforcement is turned on.
@Injectable()
export class PlanOverridesService {
  private readonly logger = new Logger(PlanOverridesService.name);
  private ready = false;
  private cache: Record<string, { limits?: any; features?: any }> | null = null;

  constructor(private readonly db: DatabaseService) {}

  private async ensureTable(): Promise<void> {
    if (this.ready) return;
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS plan_overrides (
          plan_id TEXT PRIMARY KEY,
          limits JSONB,
          features JSONB,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      this.ready = true;
    } catch (err: any) {
      this.logger.error(`ensureTable failed: ${err?.message}`);
    }
  }

  private async loadAll(): Promise<Record<string, any>> {
    if (this.cache) return this.cache;
    await this.ensureTable();
    try {
      const { rows } = await this.db.query(
        `SELECT plan_id, limits, features FROM plan_overrides`,
      );
      const map: Record<string, any> = {};
      for (const r of rows) map[r.plan_id] = { limits: r.limits, features: r.features };
      this.cache = map;
      return map;
    } catch (err: any) {
      this.logger.error(`loadAll failed: ${err?.message}`);
      return {};
    }
  }

  // Effective limits for a plan = code defaults with any override merged in.
  async getLimits(id?: string | null): Promise<PlanLimits> {
    const planId = normalizePlanId(id);
    const base = { ...getPlan(planId).limits };
    const ov = (await this.loadAll())[planId]?.limits;
    if (ov && typeof ov === 'object') {
      for (const k of Object.keys(base) as (keyof PlanLimits)[]) {
        if (k in ov) (base as any)[k] = ov[k];
      }
    }
    return base;
  }

  async getLimit(
    id: string | null | undefined,
    key: keyof PlanLimits,
  ): Promise<number | null> {
    return (await this.getLimits(id))[key];
  }

  async getFeatures(id?: string | null): Promise<PlanFeatures> {
    const planId = normalizePlanId(id);
    const base = { ...getPlan(planId).features };
    const ov = (await this.loadAll())[planId]?.features;
    if (ov && typeof ov === 'object') {
      for (const k of Object.keys(base) as (keyof PlanFeatures)[]) {
        if (k in ov) (base as any)[k] = !!ov[k];
      }
    }
    return base;
  }

  async hasFeature(
    id: string | null | undefined,
    key: keyof PlanFeatures,
  ): Promise<boolean> {
    return (await this.getFeatures(id))[key];
  }

  // Merged catalog for the admin plan editor: label + pricing (read-only, from
  // code/Paddle) + effective limits + features + which fields are overridden.
  async listMerged() {
    const map = await this.loadAll();
    const plans = [];
    for (const id of PLAN_ORDER) {
      const cfg = getPlan(id);
      plans.push({
        id,
        label: cfg.label,
        isFree: cfg.isFree,
        seats: cfg.seats,
        pricing: {
          intro: cfg.pricing.introCents / 100,
          monthly: cfg.pricing.monthlyCents / 100,
          annual: cfg.pricing.annualCents / 100,
        },
        limits: await this.getLimits(id),
        features: await this.getFeatures(id),
        overridden: !!map[id],
      });
    }
    // Only Free limits/features are enforced today; tell the UI so it can label.
    return { enforcedPlanIds: ['free'], plans };
  }

  async setOverride(
    planIdRaw: string,
    body: { limits?: Partial<PlanLimits>; features?: Partial<PlanFeatures> },
  ) {
    await this.ensureTable();
    const planId: PlanId = normalizePlanId(planIdRaw);
    // Sanitize: keep only known keys.
    const baseLimits = getPlan(planId).limits;
    const baseFeatures = getPlan(planId).features;
    const limits: any = {};
    if (body?.limits) {
      for (const k of Object.keys(baseLimits) as (keyof PlanLimits)[]) {
        if (k in body.limits) {
          const v = (body.limits as any)[k];
          limits[k] = v === null || v === '' ? null : Number(v);
        }
      }
    }
    const features: any = {};
    if (body?.features) {
      for (const k of Object.keys(baseFeatures) as (keyof PlanFeatures)[]) {
        if (k in body.features) features[k] = !!(body.features as any)[k];
      }
    }
    await this.db.query(
      `INSERT INTO plan_overrides (plan_id, limits, features, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (plan_id) DO UPDATE
         SET limits = EXCLUDED.limits, features = EXCLUDED.features, updated_at = NOW()`,
      [planId, JSON.stringify(limits), JSON.stringify(features)],
    );
    this.cache = null; // invalidate
    return { success: true, planId };
  }

  async resetOverride(planIdRaw: string) {
    await this.ensureTable();
    const planId = normalizePlanId(planIdRaw);
    await this.db.query(`DELETE FROM plan_overrides WHERE plan_id = $1`, [planId]);
    this.cache = null;
    return { success: true, planId };
  }
}
