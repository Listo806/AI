// Exit-intent "$7 setup" offer.
//
// A visitor who is about to leave the public site is shown a popup offering the
// one-time setup fee at $7 instead of $97. Claiming it carries a flag from the
// popup, through trial signup, into checkout, where the setup fee becomes $7 and
// the Paddle checkout uses the dedicated $7 price (VITE_PADDLE_SETUP_PRICE_7).
//
// The $7 Paddle price id is baked in as the production default (like the app's
// other production ids in track.js) and can be overridden per environment with
// VITE_PADDLE_SETUP_PRICE_7. If it is ever blank the popup stays hidden so we
// never advertise a price we cannot charge (VITE_EXIT_OFFER_PREVIEW=1 force-shows
// it for design review).

const OFFER_KEY = "cortexa_setup_offer";
const SEEN_KEY = "cortexa_exit_offer_seen_at";

export const EXIT_OFFER = "exit7";
export const OFFER_SETUP_FEE = 7;
export const REGULAR_SETUP_FEE = 97;

// The $7 Paddle one-time price id (client's live Paddle account).
export const SETUP_PRICE_7 =
  import.meta.env.VITE_PADDLE_SETUP_PRICE_7 ||
  "pri_01kz55xaxbqx55befkc7rnmp1x";
// Design-review override: show the popup even before the real price id exists.
export const OFFER_PREVIEW =
  String(import.meta.env.VITE_EXIT_OFFER_PREVIEW || "") === "1";

// The popup may advertise the offer only when a real $7 price is configured
// (or explicitly in preview mode).
export function offerIsAvailable() {
  return Boolean(SETUP_PRICE_7) || OFFER_PREVIEW;
}

export function setSetupOffer(kind = EXIT_OFFER) {
  try {
    localStorage.setItem(OFFER_KEY, kind);
  } catch (_e) {
    /* private mode / storage disabled — offer just won't persist */
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
    /* no-op */
  }
}

// The $7 setup should actually be charged only when the flag is set AND a real
// $7 price id exists to charge it with. Checkout uses this to switch the price.
export function setupOfferActive() {
  return getSetupOffer() === EXIT_OFFER && Boolean(SETUP_PRICE_7);
}

// Show the popup at most once per window (default 24h) so it is never nagging.
export function exitOfferSeenRecently(ttlMs = 1000 * 60 * 60 * 24) {
  try {
    const at = Number(localStorage.getItem(SEEN_KEY) || 0);
    return at > 0 && Date.now() - at < ttlMs;
  } catch (_e) {
    return false;
  }
}

export function markExitOfferSeen() {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch (_e) {
    /* no-op */
  }
}
