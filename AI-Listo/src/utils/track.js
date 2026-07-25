// Fire a Google Ads / analytics event through gtag if it is loaded. Safe no-op
// when the tag is not present. Used to feed Google Ads retargeting audiences:
//   signup_started   -> visitor began the trial signup
//   account_created  -> trial account was created (not yet activated/paid)
//   trial_activated  -> customer paid the setup fee and activated the trial
// Audiences and exclusions are built from these events (and page URLs) in the
// Google Ads dashboard.
const GOOGLE_ADS_ID = "AW-17836518151";

export function trackEvent(name, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, { send_to: GOOGLE_ADS_ID, ...params });
  }
}
