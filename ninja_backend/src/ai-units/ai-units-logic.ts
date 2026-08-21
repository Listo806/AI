/**
 * AI Units — pure logic and default configuration.
 *
 * No I/O here so every rule (cycle dates, threshold colors, free-first
 * consumption) is unit-testable without a database. All dates are handled in
 * UTC to keep the monthly cycle stable regardless of server timezone.
 */

// Client-defined metered AI actions (credit values in DEFAULT_AI_UNITS_CONFIG).
// Legacy keys ('writing','pipeline_summary','deal_intel','automation',
// 'detailed_report','heavy') are kept as aliases so existing call sites keep
// working; actionCost() falls back to the 'simple' cost for anything unknown.
export type AiActionType =
  | 'simple' // simple question / short answer
  | 'reply' // writes/replies to a lead
  | 'writing' // legacy alias for reply
  | 'summarize' // summarizes a contact/conversation
  | 'next_action' // recommends next action
  | 'follow_up' // drafts a follow-up
  | 'lead_analysis' // qualifies/analyzes a lead
  | 'pipeline_analysis' // analyzes a pipeline/deal
  | 'pipeline_summary' // legacy alias for pipeline_analysis
  | 'deal_intel' // legacy alias for pipeline_analysis
  | 'booking' // appointment conversation / booking assistance
  | 'content' // longer sales/email content
  | 'deep_analysis' // deeper CRM analysis
  | 'insights' // business/dashboard insights
  | 'detailed_report' // legacy alias for insights
  | 'workflow' // substantial multi-step workflow
  | 'automation' // legacy alias for workflow
  | 'research' // advanced research / large analysis
  | 'heavy'; // legacy alias for research

export interface AiUnitsConfig {
  /** Free units granted each monthly cycle. Backend-configurable. */
  freeAllowance: number;
  /** Units charged per successful AI action, by type. */
  actionCosts: Record<AiActionType, number>;
  /** One-time refill packages. */
  packages: Array<{ id: string; units: number; price: number }>;
  /** Percent-remaining thresholds for the meter color. */
  thresholds: { green: number; yellow: number };
  /** Percent at or below which the "low balance" behavior triggers. */
  lowThreshold: number;
  /** Solo upgrade monthly price (display only). */
  soloPrice: number;
}

export const DEFAULT_AI_UNITS_CONFIG: AiUnitsConfig = {
  freeAllowance: 50,
  // Client credit-deduction table (2026-08-20).
  actionCosts: {
    simple: 2, // simple question / short answer
    reply: 3, // writes/replies to a lead
    writing: 3, // legacy alias for reply
    summarize: 3, // summarizes a contact/conversation
    next_action: 3, // recommends next action
    follow_up: 4, // drafts a follow-up
    lead_analysis: 5, // qualifies/analyzes a lead
    pipeline_analysis: 5, // analyzes a pipeline/deal
    pipeline_summary: 5, // legacy alias
    deal_intel: 5, // legacy alias
    booking: 5, // appointment conversation / booking assistance
    content: 6, // longer sales/email content
    deep_analysis: 8, // deeper CRM analysis
    insights: 10, // business/dashboard insights
    detailed_report: 10, // legacy alias for insights
    workflow: 12, // substantial multi-step workflow
    automation: 12, // legacy alias for workflow
    research: 20, // advanced research / large analysis
    heavy: 20, // legacy alias for research
  },
  // Client credit packs (2026-08-20): 100/$47, 200/$67, 400/$97.
  packages: [
    { id: 'boost', units: 100, price: 47 },
    { id: 'plus', units: 200, price: 67 },
    { id: 'max', units: 400, price: 97 },
  ],
  thresholds: { green: 50, yellow: 20 },
  lowThreshold: 20,
  soloPrice: 197,
};

/** Deep-merge stored admin overrides on top of the defaults. */
export function mergeAiUnitsConfig(stored: any): AiUnitsConfig {
  const s = stored && typeof stored === 'object' ? stored : {};
  return {
    freeAllowance:
      typeof s.freeAllowance === 'number' && s.freeAllowance >= 0
        ? Math.floor(s.freeAllowance)
        : DEFAULT_AI_UNITS_CONFIG.freeAllowance,
    actionCosts: { ...DEFAULT_AI_UNITS_CONFIG.actionCosts, ...(s.actionCosts || {}) },
    packages: Array.isArray(s.packages) && s.packages.length ? s.packages : DEFAULT_AI_UNITS_CONFIG.packages,
    thresholds: { ...DEFAULT_AI_UNITS_CONFIG.thresholds, ...(s.thresholds || {}) },
    lowThreshold:
      typeof s.lowThreshold === 'number' ? s.lowThreshold : DEFAULT_AI_UNITS_CONFIG.lowThreshold,
    soloPrice: typeof s.soloPrice === 'number' ? s.soloPrice : DEFAULT_AI_UNITS_CONFIG.soloPrice,
  };
}

export function actionCost(config: AiUnitsConfig, action: string): number {
  const c = (config.actionCosts as any)[action];
  return typeof c === 'number' && c >= 0 ? c : config.actionCosts.simple;
}

// ---------------------------------------------------------------------------
// Monthly cycle math (UTC, anchored to the account's signup day-of-month).
// ---------------------------------------------------------------------------
function daysInMonthUTC(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/** Add `months` to `base`, clamping the day to the anchor / month length. */
export function addMonthsClamped(base: Date, months: number, anchorDay: number): Date {
  const total = base.getUTCFullYear() * 12 + base.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  const day = Math.min(anchorDay, daysInMonthUTC(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, day));
}

/**
 * Given the account signup date and "now", return the current cycle's start
 * and the next reset date, anchored to the signup day-of-month and correct
 * across short months and leap years.
 */
export function computeCycleReset(signup: Date, now: Date): { cycleStart: Date; cycleReset: Date } {
  const anchorDay = signup.getUTCDate();
  let months = (now.getUTCFullYear() - signup.getUTCFullYear()) * 12 + (now.getUTCMonth() - signup.getUTCMonth());
  let start = addMonthsClamped(signup, months, anchorDay);
  if (start.getTime() > now.getTime()) {
    months -= 1;
    start = addMonthsClamped(signup, months, anchorDay);
  }
  let reset = addMonthsClamped(signup, months + 1, anchorDay);
  if (reset.getTime() <= now.getTime()) {
    months += 1;
    start = addMonthsClamped(signup, months, anchorDay);
    reset = addMonthsClamped(signup, months + 1, anchorDay);
  }
  return { cycleStart: start, cycleReset: reset };
}

export function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Balance / color / consumption.
// ---------------------------------------------------------------------------
export type MeterColor = 'green' | 'yellow' | 'red' | 'empty';

export function thresholdColor(percent: number, thresholds: { green: number; yellow: number }): MeterColor {
  if (percent <= 0) return 'empty';
  if (percent >= thresholds.green) return 'green';
  if (percent >= thresholds.yellow) return 'yellow';
  return 'red';
}

/** Free-first consumption plan for a charge of `cost` units. */
export function planConsumption(
  freeUsed: number,
  allowance: number,
  purchased: number,
  cost: number,
): {
  affordable: boolean;
  charged: number;
  freeCharge: number;
  purchasedCharge: number;
  newFreeUsed: number;
  newPurchased: number;
} {
  const freeRemaining = Math.max(0, allowance - freeUsed);
  const freeCharge = Math.min(freeRemaining, cost);
  const rem = cost - freeCharge;
  const purchasedCharge = Math.min(purchased, rem);
  const charged = freeCharge + purchasedCharge;
  return {
    affordable: charged === cost,
    charged,
    freeCharge,
    purchasedCharge,
    newFreeUsed: freeUsed + freeCharge,
    newPurchased: purchased - purchasedCharge,
  };
}

/** Compute the full balance view from raw account fields + config. */
export function computeBalanceView(
  freeUsed: number,
  purchased: number,
  config: AiUnitsConfig,
): {
  freeAllowance: number;
  freeUsed: number;
  freeRemaining: number;
  purchased: number;
  totalRemaining: number;
  percentRemaining: number;
  color: MeterColor;
} {
  const allowance = config.freeAllowance;
  const freeRemaining = Math.max(0, allowance - freeUsed);
  const total = freeRemaining + Math.max(0, purchased);
  const denom = Math.max(1, allowance + Math.max(0, purchased));
  const percent = Math.max(0, Math.min(100, Math.round((total / denom) * 100)));
  return {
    freeAllowance: allowance,
    freeUsed,
    freeRemaining,
    purchased: Math.max(0, purchased),
    totalRemaining: total,
    percentRemaining: percent,
    color: thresholdColor(percent, config.thresholds),
  };
}
