// Hidden Cost Calculator — modular model.
//
// Everything the calculator needs (categories, per-CRM starting estimates,
// Cortexa pricing, the multi-year horizon, and the formulas) lives here, so the
// editorial can be re-tuned without touching the UI. Change a number, a category,
// or a formula in this one file and the page updates.
//
// IMPORTANT (honesty): the per-CRM numbers below are *starting estimates* based
// on typical published pricing. They are pre-filled only as a convenience and
// every field is editable by the visitor. Keep them conservative and defensible
// — this tool should be persuasive, not misleading.

// --- Cortexa side ----------------------------------------------------------
export const CORTEXA = {
  setupFee: 97, // one-time, matches the real checkout
  plans: {
    solo: { key: "solo", label: "Solo", monthly: 197, includedUsers: 1 },
    team: { key: "team", label: "Team", monthly: 347, includedUsers: 3 },
    growth: { key: "growth", label: "Growth", monthly: 497, includedUsers: 5 },
  },
  // Price per user above a plan's included seats. TODO: confirm with client.
  perExtraUserMonthly: 40,
};

// Number of years used for "Total Estimated Investment". Configurable.
export const HORIZON_YEARS = 3;

// --- Cost categories (drives the input rows) -------------------------------
// kind: "oneTime" is spent once; "monthly" recurs every month.
// perUser: default is multiplied by the user count when pre-filling.
export const CATEGORIES = [
  { id: "implementation", label: "Implementation / setup", kind: "oneTime", optional: false },
  { id: "training", label: "Employee training", kind: "oneTime", optional: true },
  { id: "monthlySubscription", label: "Monthly subscription", kind: "monthly", optional: false, perUser: true },
  { id: "consultingMonthly", label: "Consulting / administrator", kind: "monthly", optional: true },
  { id: "integrationsMonthly", label: "Third-party integrations", kind: "monthly", optional: true },
  { id: "aiAddonsMonthly", label: "AI add-ons", kind: "monthly", optional: true, perUser: true },
  { id: "otherMonthly", label: "Other monthly software", kind: "monthly", optional: true },
];

// --- Per-CRM starting estimates (editable) ---------------------------------
// perUser fields are a per-seat figure; flat fields are totals.
export const CRM_PRESETS = {
  salesforce: {
    label: "Salesforce",
    implementation: 5000,
    training: 1500,
    monthlySubscription: 165, // per user / month (Sales Cloud Enterprise territory)
    consultingMonthly: 500,
    integrationsMonthly: 200,
    aiAddonsMonthly: 50, // per user / month (Einstein-type)
    otherMonthly: 100,
  },
  hubspot: {
    label: "HubSpot",
    implementation: 1500, // published Professional onboarding fee territory
    training: 500,
    monthlySubscription: 100, // per user / month (Sales Hub Professional territory)
    consultingMonthly: 300,
    integrationsMonthly: 150,
    aiAddonsMonthly: 30,
    otherMonthly: 50,
  },
  other: {
    label: "Other",
    implementation: 500,
    training: 200,
    monthlySubscription: 50, // per user / month
    consultingMonthly: 100,
    integrationsMonthly: 100,
    aiAddonsMonthly: 20,
    otherMonthly: 50,
  },
  none: {
    label: "None",
    implementation: 0,
    training: 0,
    monthlySubscription: 0,
    consultingMonthly: 0,
    integrationsMonthly: 0,
    aiAddonsMonthly: 0,
    otherMonthly: 0,
  },
};

export const CURRENT_CRM_OPTIONS = [
  { value: "salesforce", label: "Salesforce" },
  { value: "hubspot", label: "HubSpot" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
];

// --- Helpers ---------------------------------------------------------------
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/**
 * Pre-fill editable field values for a chosen CRM and user count. perUser
 * categories are multiplied by users; everything else is taken flat.
 */
export function presetValues(crmKey, users) {
  const preset = CRM_PRESETS[crmKey] || CRM_PRESETS.none;
  const seats = Math.max(1, Math.floor(n(users) || 1));
  const values = {};
  for (const cat of CATEGORIES) {
    const base = n(preset[cat.id]);
    values[cat.id] = cat.perUser ? base * seats : base;
  }
  return values;
}

/** Sum the fields into the three headline outputs for the current CRM. */
export function computeCurrent(values) {
  let oneTime = 0;
  let monthly = 0;
  for (const cat of CATEGORIES) {
    const v = n(values[cat.id]);
    if (cat.kind === "oneTime") oneTime += v;
    else monthly += v;
  }
  return {
    oneTime,
    monthly,
    year1: oneTime + monthly * 12,
    totalInvestment: oneTime + monthly * 12 * HORIZON_YEARS,
  };
}

/** Choose the smallest Cortexa plan that covers the seat count. */
export function pickCortexaPlan(users) {
  const seats = Math.max(1, Math.floor(n(users) || 1));
  if (seats <= CORTEXA.plans.solo.includedUsers) return CORTEXA.plans.solo;
  if (seats <= CORTEXA.plans.team.includedUsers) return CORTEXA.plans.team;
  return CORTEXA.plans.growth;
}

/** Cortexa cost for a seat count: $97 once + plan monthly + extra-seat monthly. */
export function computeCortexa(users) {
  const seats = Math.max(1, Math.floor(n(users) || 1));
  const plan = pickCortexaPlan(seats);
  const extraSeats = Math.max(0, seats - plan.includedUsers);
  const monthly = plan.monthly + extraSeats * CORTEXA.perExtraUserMonthly;
  const oneTime = CORTEXA.setupFee;
  return {
    plan,
    extraSeats,
    oneTime,
    monthly,
    year1: oneTime + monthly * 12,
    totalInvestment: oneTime + monthly * 12 * HORIZON_YEARS,
  };
}

export function formatUSD(value) {
  const v = Math.round(n(value));
  return "$" + v.toLocaleString("en-US");
}
