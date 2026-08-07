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
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  pushTrackLog("event", name, params);
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
