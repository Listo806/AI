// Paddle Billing (Paddle.js v2) checkout helper.
//
// New pricing model:
// solo   -> $7 starting charge  + existing $197/month recurring price
// team   -> $14 starting charge + existing $347/month recurring price
// growth -> $21 starting charge + existing $497/month recurring price
//
// IMPORTANT:
// $7 / $14 / $21 are ONE-TIME starting charges.
// They must NEVER be used as recurring subscription prices.

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

let scriptPromise = null;

function loadPaddleJs() {
  if (window.Paddle) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("paddle-js");

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const s = document.createElement("script");

    s.id = "paddle-js";
    s.src = PADDLE_JS;
    s.onload = () => resolve();
    s.onerror = reject;

    document.body.appendChild(s);
  });

  return scriptPromise;
}

export async function initPaddle(config, onEvent) {
  if (!config?.clientToken) {
    throw new Error("Paddle client token missing");
  }

  await loadPaddleJs();

  if (
    config.environment === "sandbox" &&
    window.Paddle?.Environment?.set
  ) {
    window.Paddle.Environment.set("sandbox");
  }

  window.Paddle.Initialize({
    token: config.clientToken,
    eventCallback: onEvent,
  });
}

// Pick the recurring price for the chosen billing cycle.
//
// Annual must resolve to a real annual Paddle price. It NEVER falls back to the
// monthly price: if the annual price ID is missing, this returns null so the
// checkout is blocked (paddleReady === false and openPaddleCheckout throws),
// rather than silently billing the customer monthly while they chose annual.
function recurringPriceFor(config, plan, billingCycle) {
  if (billingCycle === "annual") {
    return config?.annualPrices?.[plan] || null;
  }
  return config?.prices?.[plan] || null;
}

// Paddle NATIVE PAID-TRIAL price (single line item): its 14-day trial charges
// the intro amount ($7/$14/$21) and then renews at the full monthly amount. This
// is Paddle's native paid-trials feature (2026-06-11), so the checkout shows one
// clean line ("$7 for 14 days, then $197/month") with the next billing date.
//
// Present only once the backend has PADDLE_PRICE_*_PAIDTRIAL provisioned; until
// then this is null and the two-line-item (start + recurring) path is used.
// Monthly only for now — annual keeps using start + recurring.
function paidTrialPriceFor(config, plan, billingCycle) {
  if (billingCycle === "annual") return null;
  return config?.paidTrialPrices?.[plan] || null;
}

// Checkout is ready only when BOTH the one-time start price and the recurring
// price (for the selected cycle) exist:
//
// startPrices[plan]   -> $7 / $14 / $21 ONE-TIME
// prices[plan]        -> $197 / $347 / $497 MONTHLY
// annualPrices[plan]  -> $1,891.20 / $3,331.20 / $4,771.20 ANNUAL (when set)
export function paddleReady(config, plan, billingCycle) {
  if (!config?.clientToken) return false;
  // Native paid trial is a single self-contained price — enough on its own.
  if (paidTrialPriceFor(config, plan, billingCycle)) return true;
  // Otherwise BOTH the one-time start price and the recurring price must exist.
  return Boolean(
    config?.startPrices?.[plan] && recurringPriceFor(config, plan, billingCycle)
  );
}

export function openPaddleCheckout({
  config,
  plan,
  userId,
  email,
  startingCharge,
  billingCycle,
  settings,
}) {
  // Optional Paddle Checkout settings (e.g. inline display). Only attached when
  // provided, so the default overlay behaviour is unchanged for other callers.
  const settingsArg = settings ? { settings } : {};

  // Preferred: Paddle NATIVE PAID TRIAL. A single price whose 14-day trial
  // charges $7/$14/$21 and then renews at the monthly amount, so Paddle's
  // checkout natively shows "$X for 14 days, then $Y/month" and the next
  // billing date — no two-line-item workaround.
  const paidTrialPriceId = paidTrialPriceFor(config, plan, billingCycle);
  if (paidTrialPriceId) {
    window.Paddle.Checkout.open({
      ...settingsArg,
      items: [{ priceId: paidTrialPriceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      customData: {
        userId,
        plan,
        startingCharge,
        billingCycle: "monthly",
        pricingModel: "native_paid_trial",
      },
    });
    return;
  }

  // Fallback (until paid-trial prices are provisioned, and for annual billing):
  // two line items = one-time starting charge + recurring subscription.
  const startPriceId = config?.startPrices?.[plan];
  const recurringPriceId = recurringPriceFor(config, plan, billingCycle);

  if (!startPriceId) {
    throw new Error(
      `Starting Paddle price is not configured for plan: ${plan}`
    );
  }

  if (!recurringPriceId) {
    // Annual with no annual price must NOT proceed on the monthly price.
    throw new Error(
      billingCycle === "annual"
        ? `Annual billing for the ${plan} plan is not fully configured yet. Please choose monthly or contact support.`
        : `Recurring Paddle price is not configured for plan: ${plan}`
    );
  }

  window.Paddle.Checkout.open({
    ...settingsArg,
    items: [
      // ONE-TIME starting charge:
      // Solo $7 / Business $14 / Scale $21
      {
        priceId: startPriceId,
        quantity: 1,
      },

      // Existing recurring subscription:
      // Solo $197 / Business $347 / Scale $497
      {
        priceId: recurringPriceId,
        quantity: 1,
      },
    ],

    customer: email
      ? {
          email,
        }
      : undefined,

    customData: {
      userId,
      plan,
      startingCharge,
      billingCycle: billingCycle === "annual" ? "annual" : "monthly",
      pricingModel: "starter_plus_recurring",
    },
  });
}

// Inline checkout settings. Paddle renders ONLY the payment form inside the
// frame (no order summary / totals — those are the merchant's responsibility),
// so OUR summary card stays the single price display and "Due today" remains the
// final, most-prominent amount. The frame background is transparent so it blends
// into our secure-checkout card.
export const PADDLE_INLINE_FRAME_CLASS = "cortexa-paddle-frame";
export function paddleInlineSettings() {
  return {
    displayMode: "inline",
    frameTarget: PADDLE_INLINE_FRAME_CLASS,
    frameInitialHeight: 430,
    frameStyle:
      "width:100%;min-width:312px;background-color:transparent;border:none;",
    allowLogout: false,
    showAddDiscounts: false,
  };
}

// Open the Paddle checkout for a paid Workspace add-on. This is its OWN $97/month
// recurring subscription, entirely separate from the base plan, so it opens with a
// SINGLE recurring item and no starting charge. `priceId` and `customData` come
// from the backend purchase endpoint, which stamps the authoritative account data
// the webhook re-validates before granting the entitlement.
export function openWorkspaceCheckout({ priceId, customData, email }) {
  if (!priceId) {
    throw new Error("Workspace Paddle price is not configured");
  }

  window.Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: email ? { email } : undefined,
    customData: customData || {},
  });
}