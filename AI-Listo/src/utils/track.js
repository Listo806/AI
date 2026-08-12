// Analytics / conversion tracking through gtag. Feeds both Google Ads
// (AW-17836518151, loaded in index.html) and GA4 when a Measurement ID is
// provided via VITE_GA4_MEASUREMENT_ID. All helpers are safe no-ops when gtag
// is not present.
//
// Funnel/step events (page_view, choose_plan_click, paypal_button_click,
// paypal_checkout_started, first_login, account_created, trial_activated, ...)
// go through trackEvent() with no send_to, so GA4 collects them for funnel
// analysis and the Google Ads tag can build audiences from them.
// Conversions (sign-up, purchase) go through trackAdsConversion() to a specific
// Google Ads conversion action.
const GOOGLE_ADS_ID = "AW-17836518151";
const GA4_MEASUREMENT_ID =
  import.meta.env.VITE_GA4_MEASUREMENT_ID || "G-WTDN8QJ9CM";

let ga4Configured = false;

// The visitor's current lifecycle stage, kept in memory and re-asserted on every
// auth change (see setUserJourney). It is merged into every trackEvent below, so
// Google Ads / GA4 can segment audiences by where the person is in the funnel and
// — most importantly — keep a paying customer flagged as `paid` on every page so
// the acquisition-audience exclusion never decays. Defaults to an anonymous
// visitor until the auth layer reports who they are.
let currentJourney = { journey_stage: "visitor", customer_type: "visitor" };

// Configure GA4 once (idempotent). No-op until VITE_GA4_MEASUREMENT_ID is set,
// so this is safe to ship before the client provides a GA4 property. Automatic
// page_view is disabled so the SPA route-change tracker controls page_views.
export function initAnalytics() {
  if (ga4Configured || !GA4_MEASUREMENT_ID) return;
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });
    ga4Configured = true;
  }
}

// On-page QA log. Every tracked event/conversion is recorded to sessionStorage
// (so a full funnel journey across page navigations is captured in one place)
// and broadcast as a DOM event the debug panel listens to. Add ?trackdebug=1 to
// any page to see every event fire live with its data — no Tag Assistant setup
// needed. Purely observational; never affects what is sent to GA4 / Ads.
const TRACK_LOG_KEY = "cortexa_track_log";
export function pushTrackLog(type, name, params) {
  if (typeof window === "undefined") return;
  try {
    const entry = { t: new Date().toISOString(), type, name, params: params || {} };
    let log = [];
    try {
      log = JSON.parse(sessionStorage.getItem(TRACK_LOG_KEY) || "[]");
    } catch (_e) {
      log = [];
    }
    log.push(entry);
    if (log.length > 60) log = log.slice(-60);
    sessionStorage.setItem(TRACK_LOG_KEY, JSON.stringify(log));
    window.dispatchEvent(new CustomEvent("cortexa-track", { detail: entry }));
  } catch (_e) {
    /* best-effort: QA logging must never break tracking */
  }
}

// Generic funnel/step event -> GA4 (funnel analysis) + Google Ads (audiences).
// Also mirrored into GTM's dataLayer, so if a Google Tag Manager container is
// added later it can consume the exact same events with no code change. The
// dataLayer push is a harmless no-op when no GTM container is installed.
export function trackEvent(name, params = {}) {
  if (typeof window === "undefined") return;
  // Stamp every event with the current journey stage/customer type so audiences
  // and funnel reports can be segmented by lifecycle. Explicit params win, so a
  // caller can always override.
  const merged = { ...currentJourney, ...params };
  if (typeof window.gtag === "function") {
    window.gtag("event", name, merged);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...merged });
  pushTrackLog("event", name, merged);
}

// Terminated paid statuses that drop an account back to Free (mirrors
// TERMINATED_STATUSES in the backend plan-config.ts single source of truth).
const TERMINATED_PAY_STATUSES = [
  "canceled",
  "cancelled",
  "suspended",
  "past_due",
  "refunded",
  "expired",
];

const PAID_PLAN_KEYS = ["solo", "team", "growth", "business", "scale", "pro"];
const TIER_OF = {
  team: "business",
  growth: "scale",
  pro: "solo",
  business: "business",
  scale: "scale",
  solo: "solo",
  free: "free",
};

// Derive the lifecycle stage for a user object (as returned by /users/me, login,
// or the recovery/exit-popup flows — all carry paymentStatus/plan/selectedPlan).
// This mirrors the backend resolveEffectivePlan rules so the browser and server
// never disagree about who is a paying customer:
//   - paid            -> a confirmed paying customer (exclude from acquisition)
//   - past_customer   -> a lapsed/canceled paid account (win-back only)
//   - free            -> activated the Free plan
//   - registered_no_plan -> signed up but has not activated any plan
//   - visitor         -> not signed in
// Note: the browser user object has no checkout_status, so the backend's rare
// "checkout_status=paid but payment_status not active" fallback is not visible
// here. That state only arises from a partial activation failure (activation
// writes payment_status + plan together), so it is not a normal customer state.
export function deriveJourney(user) {
  if (!user) return { journeyStage: "visitor", customerType: "visitor", planTier: "none" };
  const pay = String(user.paymentStatus || "").trim().toLowerCase();
  const sel = String(user.selectedPlan || "").trim().toLowerCase();
  const rawPlan = String(user.plan || "").trim().toLowerCase();
  const terminated = TERMINATED_PAY_STATUSES.includes(pay);
  const paid = !terminated && (pay === "active" || pay === "paid");
  // Prefer the tier written to `plan` at activation; fall back to the selected
  // tier when `plan` is still the placeholder 'TRIAL' (a brief window if the
  // transaction webhook lands before the subscription one). Mirrors the backend.
  const planTierOf = (v) => (PAID_PLAN_KEYS.includes(v) ? TIER_OF[v] || "free" : null);

  if (paid) {
    const tier = planTierOf(rawPlan) || planTierOf(sel) || "solo";
    return { journeyStage: "paid", customerType: "paid", planTier: tier };
  }
  if (terminated) {
    return { journeyStage: "past_customer", customerType: "former_customer", planTier: "free" };
  }
  // Grandfathered pre-Paddle paid account that carries its tier on `plan`.
  if (planTierOf(rawPlan)) {
    return { journeyStage: "paid", customerType: "paid", planTier: planTierOf(rawPlan) };
  }
  const activatedFree = pay === "free" || rawPlan === "free" || sel === "free";
  if (activatedFree) {
    return { journeyStage: "free", customerType: "free", planTier: "free" };
  }
  return { journeyStage: "registered_no_plan", customerType: "lead", planTier: "none" };
}

// Publish the user's lifecycle to Google Ads + GA4. Sets GA4 user_properties
// (journey_stage / customer_type / plan_tier) and a stable user_id so the
// paying-customer exclusion stays attached to the person across sessions and
// devices, and updates the in-memory currentJourney that every trackEvent stamps.
// Safe no-op when gtag is absent. Call whenever the authenticated user changes.
export function setUserJourney(user) {
  const j = deriveJourney(user);
  currentJourney = { journey_stage: j.journeyStage, customer_type: j.customerType };
  const uid = user && user.id ? String(user.id) : null;
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("set", "user_properties", {
      journey_stage: j.journeyStage,
      customer_type: j.customerType,
      plan_tier: j.planTier,
    });
    if (uid) {
      window.gtag("config", GA4_MEASUREMENT_ID, {
        user_id: uid,
        send_page_view: false,
      });
      window.gtag("config", GOOGLE_ADS_ID, { user_id: uid });
    }
  }
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "journey_set",
      journey_stage: j.journeyStage,
      customer_type: j.customerType,
      plan_tier: j.planTier,
    });
  }
  pushTrackLog("journey", "journey_set", {
    journey_stage: j.journeyStage,
    customer_type: j.customerType,
    plan_tier: j.planTier,
    user_id: uid,
  });
  return j;
}

// Fire a specific Google Ads conversion action, e.g. "AW-XXXX/label".
export function trackAdsConversion(sendTo, params = {}) {
  if (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    sendTo
  ) {
    window.gtag("event", "conversion", { send_to: sendTo, ...params });
  }
  pushTrackLog("conversion", "conversion", { send_to: sendTo, ...params });
}

// Dedicated Sign-up conversion action (Google Ads). Fired on every real
// account creation (the /trial signup and the marketplace signup) so Ads
// consistently receives this action. Kept in one place so both paths report
// the same send_to. VITE_ADS_SIGNUP_CONVERSION overrides it if it changes.
export const SIGNUP_CONVERSION_SEND_TO =
  import.meta.env.VITE_ADS_SIGNUP_CONVERSION ||
  "AW-17836518151/G2jxCOX7mNccEIfWjrlC";

// Fire the sign-up conversion. When the caller is about to hard-navigate
// (window.location.*), the browser can cancel the tracking request before it
// reaches Google, which makes Ads report the action as "wasn't detected".
// Pass onSent and we run it only after the beacon has been sent
// (event_callback), with a timeout fallback so signup never hangs on the pixel.
// When the caller stays on the page (SPA navigate), omit onSent — the beacon
// completes on its own.
export function trackSignupConversion({ onSent } = {}) {
  const done = typeof onSent === "function" ? onSent : () => {};
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    let fired = false;
    const once = () => {
      if (fired) return;
      fired = true;
      done();
    };
    window.gtag("event", "conversion", {
      send_to: SIGNUP_CONVERSION_SEND_TO,
      value: 67.0,
      currency: "USD",
      event_callback: once,
    });
    pushTrackLog("conversion", "sign_up_conversion", {
      send_to: SIGNUP_CONVERSION_SEND_TO,
      value: 67.0,
      currency: "USD",
    });
    // Fallback: if gtag is blocked/slow and the callback never fires, proceed.
    setTimeout(once, 1200);
  } else {
    done();
  }
}

// Dedicated Purchase conversion action (Google Ads), separate from Sign-up.
// VITE_ADS_PURCHASE_CONVERSION overrides it if the label ever changes.
export const PURCHASE_CONVERSION_SEND_TO =
  import.meta.env.VITE_ADS_PURCHASE_CONVERSION ||
  "AW-17836518151/2dX2CMD3mNccEIfWjrlC";

// Fire the purchase once a payment is confirmed. Emits BOTH a GA4 `purchase`
// event (for the funnel + revenue reporting) and the Google Ads Purchase
// conversion action, each carrying the transaction id (so Google Ads dedupes
// duplicate reports), the real value + currency, the offer ($7 or $97), the
// plan, and the ad click id / campaign pulled from stored attribution.
export function trackPurchase(order = {}) {
  const value = Number(order.value) || 0;
  const currency = order.currency || "USD";
  const transactionId = order.transactionId || undefined;
  const attribution = getAttribution();
  const gclid = attribution.gclid || undefined;
  const campaign = attribution.utm?.campaign || undefined;

  // GA4 standard purchase event.
  trackEvent("purchase", {
    transaction_id: transactionId,
    value,
    currency,
    offer: order.offer, // "$7" | "$97"
    plan: order.plan || undefined,
    gclid,
    campaign,
    items: order.plan
      ? [{ item_id: order.plan, item_name: order.plan, price: value, quantity: 1 }]
      : undefined,
  });

  // Google Ads Purchase conversion action (transaction_id enables Ads-side
  // deduplication so a re-report never double-counts).
  trackAdsConversion(PURCHASE_CONVERSION_SEND_TO, {
    value,
    currency,
    transaction_id: transactionId,
  });
}

// Provide user-identifying data for Google Ads Enhanced Conversions. gtag hashes
// it client-side before sending. Has no effect until Enhanced Conversions is
// turned on in the Google Ads UI.
export function setUserData(userData = {}) {
  const clean = {};
  if (userData.email) {
    clean.email = String(userData.email).trim().toLowerCase();
  }
  if (userData.phone) {
    clean.phone_number = String(userData.phone).trim();
  }
  if (Object.keys(clean).length === 0) return;
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("set", "user_data", clean);
  }
}

// Capture the Google Ads click identifiers (gclid / wbraid / gbraid) from the
// ad landing URL and persist them, so a later Purchase can be attributed back
// to the ad click (for server-side or Enhanced Conversions). Safe no-op when
// none are present; only writes when an id is actually in the URL.
export function captureClickIds() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["gclid", "wbraid", "gbraid"]) {
      const val = params.get(key);
      if (val) {
        localStorage.setItem(`ads_${key}`, val);
        localStorage.setItem("ads_click_at", String(Date.now()));
      }
    }
    // First-touch UTM + landing page: record once so the original source
    // survives later internal navigation and reaches the sign-up record.
    if (!localStorage.getItem("attr_landing_page")) {
      localStorage.setItem(
        "attr_landing_page",
        window.location.pathname + window.location.search,
      );
    }
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]) {
      const val = params.get(key);
      if (val && !localStorage.getItem(`attr_${key}`)) {
        localStorage.setItem(`attr_${key}`, val);
      }
    }
  } catch (_e) {
    /* non-fatal: attribution is best-effort */
  }
}

// Attribution snapshot passed to the sign-up API: landing page, UTM params, and
// the Google Click ID. All best-effort (null when not captured).
export function getAttribution() {
  if (typeof window === "undefined") return {};
  try {
    const g = (k) => localStorage.getItem(k) || null;
    return {
      landingPage: g("attr_landing_page"),
      gclid: g("ads_gclid"),
      utm: {
        source: g("attr_utm_source"),
        medium: g("attr_utm_medium"),
        campaign: g("attr_utm_campaign"),
        term: g("attr_utm_term"),
        content: g("attr_utm_content"),
      },
    };
  } catch (_e) {
    return {};
  }
}

export { GOOGLE_ADS_ID };
