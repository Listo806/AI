// Canonical source of truth for the four Cortexa plans (Free, Solo, Business,
// Scale) and their monthly/annual pricing, seat counts, usage limits, and
// feature access. Everything plan-related — checkout, permission guards, usage
// metering, the pricing page, and the admin — should read from here so there is
// exactly one place that defines what each plan costs and unlocks.
//
// Amounts are in cents. Annual price = monthly x 12 with the advertised 20% off.
// Paddle price ids are NOT stored here (they are per-environment secrets kept in
// env vars); this module only owns the plan -> env-var-name mapping so the
// checkout knows which env var to read for a given plan + billing cycle.

export type PlanId = 'free' | 'solo' | 'business' | 'scale';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  // null means unlimited.
  aiConversationsPerMonth: number | null;
  automationWorkflows: number | null;
  integrations: number | null;
}

export interface PlanFeatures {
  crm: boolean;
  aiAgent: boolean;
  automations: boolean;
  emailSmsMarketing: boolean;
  calendar: boolean;
  reports: boolean;
  advancedAnalytics: boolean;
  teamWorkspace: boolean;
  advancedAutomations: boolean;
  workflowsSequences: boolean;
  customFields: boolean;
  advancedPermissions: boolean;
  whiteLabel: boolean;
  customObjects: boolean;
}

export interface PlanPricing {
  introCents: number; // the "to start" amount
  monthlyCents: number;
  annualCents: number;
}

export interface PlanConfig {
  id: PlanId;
  label: string;
  isFree: boolean;
  popular: boolean;
  seats: number;
  entersCrmImmediately: boolean; // Free enters the product without paying
  pricing: PlanPricing;
  limits: PlanLimits;
  features: PlanFeatures;
  // Env var names holding the Paddle price ids for each billing cycle. null for
  // Free (no Paddle). Values are read from process.env at checkout time.
  paddleEnv: { monthly: string; annual: string } | null;
}

const UNLIMITED: PlanLimits = {
  aiConversationsPerMonth: null,
  automationWorkflows: null,
  integrations: null,
};

export const PLAN_ORDER: PlanId[] = ['free', 'solo', 'business', 'scale'];

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    isFree: true,
    popular: false,
    seats: 1,
    entersCrmImmediately: true,
    pricing: { introCents: 0, monthlyCents: 0, annualCents: 0 },
    limits: {
      aiConversationsPerMonth: 50,
      automationWorkflows: 5,
      integrations: 1,
    },
    features: {
      crm: true,
      aiAgent: true,
      automations: true,
      emailSmsMarketing: false,
      calendar: false,
      reports: false,
      advancedAnalytics: false,
      teamWorkspace: false,
      advancedAutomations: false,
      workflowsSequences: false,
      customFields: false,
      advancedPermissions: false,
      whiteLabel: false,
      customObjects: false,
    },
    paddleEnv: null,
  },
  solo: {
    id: 'solo',
    label: 'Solo',
    isFree: false,
    popular: false,
    seats: 1,
    entersCrmImmediately: false,
    pricing: { introCents: 700, monthlyCents: 19700, annualCents: 189120 },
    limits: UNLIMITED,
    features: {
      crm: true,
      aiAgent: true,
      automations: true,
      emailSmsMarketing: true,
      calendar: true,
      reports: true,
      advancedAnalytics: false,
      teamWorkspace: false,
      advancedAutomations: false,
      workflowsSequences: false,
      customFields: false,
      advancedPermissions: false,
      whiteLabel: false,
      customObjects: false,
    },
    paddleEnv: { monthly: 'PADDLE_PRICE_SOLO', annual: 'PADDLE_PRICE_SOLO_ANNUAL' },
  },
  business: {
    id: 'business',
    label: 'Business',
    isFree: false,
    popular: true,
    seats: 3,
    entersCrmImmediately: false,
    pricing: { introCents: 1400, monthlyCents: 34700, annualCents: 333120 },
    limits: UNLIMITED,
    features: {
      crm: true,
      aiAgent: true,
      automations: true,
      emailSmsMarketing: true,
      calendar: true,
      reports: true,
      advancedAnalytics: true,
      teamWorkspace: true,
      advancedAutomations: true,
      workflowsSequences: true,
      customFields: true,
      advancedPermissions: false,
      whiteLabel: false,
      customObjects: false,
    },
    paddleEnv: {
      monthly: 'PADDLE_PRICE_BUSINESS',
      annual: 'PADDLE_PRICE_BUSINESS_ANNUAL',
    },
  },
  scale: {
    id: 'scale',
    label: 'Scale',
    isFree: false,
    popular: false,
    seats: 5,
    entersCrmImmediately: false,
    pricing: { introCents: 2100, monthlyCents: 49700, annualCents: 477120 },
    limits: UNLIMITED,
    features: {
      crm: true,
      aiAgent: true,
      automations: true,
      emailSmsMarketing: true,
      calendar: true,
      reports: true,
      advancedAnalytics: true,
      teamWorkspace: true,
      advancedAutomations: true,
      workflowsSequences: true,
      customFields: true,
      advancedPermissions: true,
      whiteLabel: true,
      customObjects: true,
    },
    paddleEnv: { monthly: 'PADDLE_PRICE_SCALE', annual: 'PADDLE_PRICE_SCALE_ANNUAL' },
  },
};

export const ANNUAL_DISCOUNT_PERCENT = 20;

// Map any historically-stored plan string to a current plan id. The old system
// used solo/team/growth (and the literal 'TRIAL'/'pro'); resolve at read time so
// existing rows and live subscriptions never need rewriting.
const LEGACY_MAP: Record<string, PlanId> = {
  free: 'free',
  solo: 'solo',
  team: 'business',
  business: 'business',
  growth: 'scale',
  scale: 'scale',
  pro: 'solo',
};

export function normalizePlanId(raw?: string | null): PlanId {
  const key = String(raw || '')
    .trim()
    .toLowerCase();
  return LEGACY_MAP[key] || 'free';
}

export function getPlan(id?: string | null): PlanConfig {
  return PLANS[normalizePlanId(id)];
}

export function getSeatLimit(id?: string | null): number {
  return getPlan(id).seats;
}

export function getLimit(
  id: string | null | undefined,
  key: keyof PlanLimits,
): number | null {
  return getPlan(id).limits[key];
}

export function hasFeature(
  id: string | null | undefined,
  key: keyof PlanFeatures,
): boolean {
  return getPlan(id).features[key];
}

// Frontend-safe view of the plans (labels, prices, limits, features) with no
// secrets. Served by GET /api/plans/config and consumed by the pricing page,
// the popup, and the lock/upgrade screens.
export function publicPlansConfig() {
  return {
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    plans: PLAN_ORDER.map((id) => {
      const p = PLANS[id];
      return {
        id: p.id,
        label: p.label,
        isFree: p.isFree,
        popular: p.popular,
        seats: p.seats,
        entersCrmImmediately: p.entersCrmImmediately,
        pricing: {
          introCents: p.pricing.introCents,
          monthlyCents: p.pricing.monthlyCents,
          annualCents: p.pricing.annualCents,
          intro: p.pricing.introCents / 100,
          monthly: p.pricing.monthlyCents / 100,
          annual: p.pricing.annualCents / 100,
        },
        limits: p.limits,
        features: p.features,
      };
    }),
  };
}
