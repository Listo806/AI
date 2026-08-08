// NOTE (new pricing):
//
// The main pricing checkout no longer uses this legacy exit-intent
// offer to determine the amount due today.
//
// New paid pricing:
//
// Solo
// $7 starting charge -> $197/month
//
// Business
// $14 starting charge -> $347/month
//
// Scale
// $21 starting charge -> $497/month
//
// This utility remains only for the existing exit-intent popup/campaign.
// CheckoutPage must NOT use SETUP_PRICE_7 to override Business or Scale.

// Exit-intent "$7 setup" offer.
//
// A visitor who is about to leave the public site is shown a popup offering the
// one-time setup fee at $7 instead of $97. Claiming it carries a flag from the
// popup, through trial signup, into checkout.

const OFFER_KEY = "cortexa_setup_offer";
const SEEN_KEY = "cortexa_exit_offer_seen_at";

export const EXIT_OFFER = "exit7";
export const OFFER_SETUP_FEE = 7;
export const REGULAR_SETUP_FEE = 97;

// Legacy $7 Paddle price.
// Kept only because the old exit-intent popup may still reference it.
export const SETUP_PRICE_7 =
  import.meta.env.VITE_PADDLE_SETUP_PRICE_7 ||
  "pri_01kz55xaxbqx55befkc7rnmp1x";

export const OFFER_PREVIEW =
  String(import.meta.env.VITE_EXIT_OFFER_PREVIEW || "") === "1";

export function offerIsAvailable() {
  return Boolean(SETUP_PRICE_7) || OFFER_PREVIEW;
}

export function setSetupOffer(kind = EXIT_OFFER) {
  try {
    localStorage.setItem(OFFER_KEY, kind);
  } catch (_e) {
    // private mode / storage disabled
  }
}

export function getSetupOffer() {
  try {
    return localStorage.getItem(OFFER_KEY) || "";
  } catch (_e) {
    return "";
  }
}

export function clearSetupOffer() {
  try {
    localStorage.removeItem(OFFER_KEY);
  } catch (_e) {
    // no-op
  }
}

export function setupOfferActive() {
  return (
    getSetupOffer() === EXIT_OFFER &&
    Boolean(SETUP_PRICE_7)
  );
}

export function exitOfferSeenRecently(
  ttlMs = 1000 * 60 * 60 * 24
) {
  try {
    const at = Number(
      localStorage.getItem(SEEN_KEY) || 0
    );

    return at > 0 && Date.now() - at < ttlMs;
  } catch (_e) {
    return false;
  }
}

export function markExitOfferSeen() {
  try {
    localStorage.setItem(
      SEEN_KEY,
      String(Date.now())
    );
  } catch (_e) {
    // no-op
  }
}