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
  // How many WhatsApp numbers/accounts the team may connect. Free = 1.
  whatsappConnections: number | null;
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
  // ── Limited-AI entitlements (granular, so Free can experience the AI without
  // getting the premium automation system). aiAgent stays the master "AI on"
  // flag; these gate specific capabilities on top of it. ──────────────────────
  aiWhatsapp: boolean; // AI may respond to WhatsApp conversations
  aiBooking: boolean; // AI appointment booking / scheduling over chat
  aiAppointmentSetter: boolean; // autonomous AI appointment setter
  advancedAiAgent: boolean; // advanced AI sales agent / autonomous follow-up
  leadGenerator: boolean; // Lead Generator module
  premiumIntegrations: boolean; // premium/third-party integrations
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
  whatsappConnections: null,
};

// Every paid tier is grandfathered to the full AI/premium feature set (see the
// grandfathering note in usage.service). Defined once so the three paid plans
// stay in sync as feature keys are added.
const PAID_AI_FEATURES = {
  aiWhatsapp: true,
  aiBooking: true,
  aiAppointmentSetter: true,
  advancedAiAgent: true,
  leadGenerator: true,
  premiumIntegrations: true,
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
      whatsappConnections: 1,
    },
    features: {
      crm: true, // full basic CRM: leads, pipeline, contacts, notes, activity
      aiAgent: true, // master AI switch on (limited by the flags below)
      automations: true, // basic automations only (advanced gated below)
      emailSmsMarketing: false,
      calendar: true, // basic calendar (AI scheduling gated by aiBooking)
      reports: false,
      advancedAnalytics: false,
      teamWorkspace: false,
      advancedAutomations: false,
      workflowsSequences: false,
      customFields: false,
      advancedPermissions: false,
      whiteLabel: false,
      customObjects: false,
      // Limited AI: WhatsApp responses ON; every premium AI capability OFF.
      aiWhatsapp: true,
      aiBooking: false,
      aiAppointmentSetter: false,
      advancedAiAgent: false,
      leadGenerator: false,
      premiumIntegrations: false,
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
      ...PAID_AI_FEATURES,
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
      ...PAID_AI_FEATURES,
    },
    // The live Paddle checkout (paddle.service getPublicConfig) uses the internal
    // keys solo/team/growth, so the recurring price env for Business is
    // PADDLE_PRICE_TEAM. Kept in sync here so every price reference agrees on one
    // naming and no future consumer reads a variable the checkout does not set.
    paddleEnv: {
      monthly: 'PADDLE_PRICE_TEAM',
      annual: 'PADDLE_PRICE_TEAM_ANNUAL',
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
      ...PAID_AI_FEATURES,
    },
    // Scale maps to the internal 'growth' key used by the live checkout.
    paddleEnv: { monthly: 'PADDLE_PRICE_GROWTH', annual: 'PADDLE_PRICE_GROWTH_ANNUAL' },
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

// Paid statuses that have lapsed and must drop the account back to Free caps.
const TERMINATED_STATUSES = [
  'canceled',
  'cancelled',
  'suspended',
  'past_due',
  'refunded',
  'expired',
];

// Resolve an account's EFFECTIVE plan (for entitlements, CRM access, and admin
// display) from its raw user columns. This is the SINGLE source of truth so the
// payment guard, the usage/feature layer, and the Customers view can never disagree
// about what plan an account is on.
//
// Rules:
//  - selected_plan is only an INTENT to buy and never grants a tier by itself.
//  - An account is on a paid tier when it has actually paid (payment_status
//    active/paid, or checkout_status paid) OR it carries a paid tier on the legacy
//    `plan` column and is not in a terminated state (grandfathered pre-Paddle).
//  - Everything else — an unpaid plan-selector, a terminated/canceled paid account,
//    or a genuine Free account — resolves to Free.
//  - For a confirmed-paid account the tier comes from the `plan` column (what
//    activation writes), NOT selected_plan, so an unpaid upgrade click cannot
//    escalate entitlements before the higher tier is paid.
export function resolveEffectivePlan(row: {
  selected_plan?: string | null;
  plan?: string | null;
  payment_status?: string | null;
  checkout_status?: string | null;
}): { planId: PlanId; paid: boolean; terminated: boolean; isFree: boolean } {
  const pay = String(row?.payment_status || '').toLowerCase();
  const checkout = String(row?.checkout_status || '').toLowerCase();
  const terminated = TERMINATED_STATUSES.includes(pay);
  // checkout_status='paid' is a sticky "has ever paid" flag set at purchase and
  // never cleared on cancellation, so a terminated payment_status must win over it —
  // otherwise a canceled account would read as still-paid and keep premium forever.
  const paid =
    !terminated &&
    (pay === 'active' || pay === 'paid' || checkout === 'paid');
  const planTier = normalizePlanId(row?.plan);
  const selectedTier = normalizePlanId(row?.selected_plan || row?.plan);

  let planId: PlanId;
  if (paid) {
    // Confirmed paid: entitle the tier activation wrote to `plan`. Fall back to the
    // selected tier only for an anomalous paid row with no `plan`, so a paying
    // customer is never under-entitled.
    planId = planTier !== 'free' ? planTier : selectedTier;
  } else if (planTier !== 'free' && !terminated) {
    // Grandfather a pre-Paddle paid account that carries its tier on `plan`.
    planId = planTier;
  } else {
    // Unpaid plan-selector, terminated/canceled paid account, or genuine Free.
    planId = 'free';
  }
  return { planId, paid, terminated, isFree: planId === 'free' };
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
