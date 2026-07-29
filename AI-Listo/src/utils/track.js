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
    // Fallback: if gtag is blocked/slow and the callback never fires, proceed.
    setTimeout(once, 1200);
  } else {
    done();
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
