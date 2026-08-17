// Frontend plan catalog. This mirrors the backend source of truth in
// ninja_backend/src/plans/plan-config.ts so marketing pages can render instantly,
// and loadPlansConfig() refreshes the live values from GET /api/plans/config at
// runtime (the backend is authoritative). Keep the mirror below in sync with the
// backend file. Prices here are in dollars.

export const ANNUAL_DISCOUNT_PERCENT = 20;
export const PLAN_ORDER = ["free", "solo", "business", "scale"];

export const PLANS = {
  free: {
    id: "free",
    label: "Free",
    isFree: true,
    popular: false,
    seats: 1,
    entersCrmImmediately: true,
    pricing: { intro: 0, monthly: 0, annual: 0 },
    limits: { aiConversationsPerMonth: 50, automationWorkflows: 5, integrations: 1, whatsappConnections: 1 },
    features: {
      crm: true, aiAgent: true, automations: true, emailSmsMarketing: false,
      calendar: true, reports: false, advancedAnalytics: false, teamWorkspace: false,
      advancedAutomations: false, workflowsSequences: false, customFields: false,
      advancedPermissions: false, whiteLabel: false, customObjects: false,
      aiWhatsapp: true, aiBooking: false, aiAppointmentSetter: false,
      advancedAiAgent: false, leadGenerator: false, premiumIntegrations: false,
    },
  },
  solo: {
    id: "solo",
    label: "Solo",
    isFree: false,
    popular: false,
    seats: 1,
    entersCrmImmediately: false,
    pricing: { intro: 7, monthly: 197, annual: 1891.2 },
    limits: { aiConversationsPerMonth: null, automationWorkflows: null, integrations: null, whatsappConnections: null },
    features: {
      crm: true, aiAgent: true, automations: true, emailSmsMarketing: true,
      calendar: true, reports: true, advancedAnalytics: false, teamWorkspace: false,
      advancedAutomations: false, workflowsSequences: false, customFields: false,
      advancedPermissions: false, whiteLabel: false, customObjects: false,
      aiWhatsapp: true, aiBooking: true, aiAppointmentSetter: true,
      advancedAiAgent: true, leadGenerator: true, premiumIntegrations: true,
    },
  },
  business: {
    id: "business",
    label: "Business",
    isFree: false,
    popular: true,
    seats: 3,
    entersCrmImmediately: false,
    pricing: { intro: 14, monthly: 347, annual: 3331.2 },
    limits: { aiConversationsPerMonth: null, automationWorkflows: null, integrations: null, whatsappConnections: null },
    features: {
      crm: true, aiAgent: true, automations: true, emailSmsMarketing: true,
      calendar: true, reports: true, advancedAnalytics: true, teamWorkspace: false,
      advancedAutomations: true, workflowsSequences: true, customFields: true,
      advancedPermissions: false, whiteLabel: false, customObjects: false,
      aiWhatsapp: true, aiBooking: true, aiAppointmentSetter: true,
      advancedAiAgent: true, leadGenerator: true, premiumIntegrations: true,
    },
  },
  scale: {
    id: "scale",
    label: "Scale",
    isFree: false,
    popular: false,
    seats: 5,
    entersCrmImmediately: false,
    pricing: { intro: 21, monthly: 497, annual: 4771.2 },
    limits: { aiConversationsPerMonth: null, automationWorkflows: null, integrations: null, whatsappConnections: null },
    features: {
      crm: true, aiAgent: true, automations: true, emailSmsMarketing: true,
      calendar: true, reports: true, advancedAnalytics: true, teamWorkspace: false,
      advancedAutomations: true, workflowsSequences: true, customFields: true,
      advancedPermissions: true, whiteLabel: true, customObjects: true,
      aiWhatsapp: true, aiBooking: true, aiAppointmentSetter: true,
      advancedAiAgent: true, leadGenerator: true, premiumIntegrations: true,
    },
  },
};

export function getPlan(id) {
  return PLANS[id] || PLANS.free;
}

export function orderedPlans() {
  return PLAN_ORDER.map((id) => PLANS[id]);
}

// Recurring price for a plan on a billing cycle ("monthly" | "annual").
export function recurringPrice(id, cycle) {
  const p = getPlan(id).pricing;
  return cycle === "annual" ? p.annual : p.monthly;
}

// Dollars a plan saves per year on annual vs 12x monthly.
export function annualSavings(id) {
  const p = getPlan(id).pricing;
  return Math.max(0, p.monthly * 12 - p.annual);
}

// Format a USD amount: whole numbers show no cents ($197), fractional keep two
// ($1,891.20), always with thousands separators.
export function formatUsd(n) {
  const hasCents = Number(n) % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

// Refresh the catalog from the backend (authoritative). Returns the same shape as
// the mirror; falls back to the mirror on any error. Cached after the first load.
let _cache = null;
export async function loadPlansConfig() {
  if (_cache) return _cache;
  const fallback = { annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT, plans: orderedPlans() };
  try {
    const base =
      import.meta.env.VITE_API_BASE_URL || "https://backend.cortexaaicrm.com/api";
    const res = await fetch(`${base}/plans/config`);
    if (!res.ok) return fallback;
    const data = await res.json();
    _cache = data && Array.isArray(data.plans) ? data : fallback;
    return _cache;
  } catch (_e) {
    return fallback;
  }
}
