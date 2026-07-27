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

// Generic funnel/step event -> GA4 (funnel analysis) + Google Ads (audiences).
export function trackEvent(name, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
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

export { GOOGLE_ADS_ID };
