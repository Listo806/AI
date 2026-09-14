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
// the intro amount ($7/$14/$21) and then renews at the full monthly amount.
//
// Present only once the backend has PADDLE_PRICE_*_PAIDTRIAL provisioned;
// until then this is null and the two-line-item path is used.
//
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
// annualPrices[plan]  -> $1,891.20 / $3,331.20 / $4,771.20 ANNUAL
export function paddleReady(config, plan, billingCycle) {
  if (!config?.clientToken) return false;

  if (
    billingCycle !== "annual" &&
    config?.paidTrialPrices?.[plan]
  ) {
    return true;
  }

  const recurring =
    billingCycle === "annual"
      ? config?.annualPrices?.[plan]
      : config?.prices?.[plan];

  return Boolean(
    config?.startPrices?.[plan] &&
      recurring
  );
}

/**
 * Build Paddle customer prefill.
 *
 * Keep this intentionally minimal. The checkout page already collects the
 * customer's contact details; Paddle only needs the email prefill here.
 */
function buildPaddleCustomer({ email }) {
  const cleanEmail = String(email || "").trim();

  return cleanEmail
    ? {
        email: cleanEmail,
      }
    : undefined;
}

export async function openPaddleCheckout({
  config,
  plan,
  userId,
  email,
  countryCode,
  postalCode,
  region,
  startingCharge,
  billingCycle,
  settings,
}) {
  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  const settingsArg = settings ? { settings } : {};
  const customer = buildPaddleCustomer({ email });

  const recurringPriceId =
    billingCycle === "annual"
      ? config?.annualPrices?.[plan]
      : config?.prices?.[plan];

  const startPriceId =
    config?.startPrices?.[plan];

  const paidTrialPriceId =
    billingCycle === "annual"
      ? null
      : config?.paidTrialPrices?.[plan] || null;

  const candidates = [];

  // Paddle native paid trial is the cleanest monthly model:
  // one price contains "$7/$14/$21 for 14 days, then $197/$347/$497 per month".
  if (paidTrialPriceId) {
    candidates.push({
      pricingModel: "native_paid_trial",
      items: [
        {
          priceId: paidTrialPriceId,
          quantity: 1,
        },
      ],
    });
  }

  // Fallback to the already-provisioned one-time start price + recurring plan.
  if (startPriceId && recurringPriceId) {
    candidates.push({
      pricingModel: "starter_plus_recurring",
      items: [
        {
          priceId: startPriceId,
          quantity: 1,
        },
        {
          priceId: recurringPriceId,
          quantity: 1,
        },
      ],
    });
  }

  if (!candidates.length) {
    throw new Error(
      billingCycle === "annual"
        ? `Annual Paddle pricing is not configured for the ${plan} plan.`
        : `Paddle pricing is not configured for the ${plan} plan.`
    );
  }

  let selected = null;
  let lastError = null;

  // Validate the exact items using Paddle's transaction preview BEFORE opening
  // checkout. This tells us which configured price path Paddle currently accepts.
  //
  // It does not alter the visible checkout design.
  for (const candidate of candidates) {
    try {
      if (window.Paddle?.TransactionPreview) {
        await window.Paddle.TransactionPreview({
          items: candidate.items,
        });
      }

      selected = candidate;
      break;
    } catch (error) {
      lastError = error;

      console.warn(
        "[PADDLE CHECKOUT PREVIEW FAILED]",
        candidate.pricingModel,
        error
      );
    }
  }

  if (!selected) {
    const detail =
      lastError?.detail ||
      lastError?.message ||
      "Paddle rejected all configured checkout price combinations.";

    throw new Error(detail);
  }

  console.log(
    "[PADDLE CHECKOUT PATH]",
    selected.pricingModel,
    selected.items
  );

  window.Paddle.Checkout.open({
    ...settingsArg,

    items: selected.items,

    customer,

    customData: {
      userId,
      plan,
      startingCharge,

      billingCycle:
        billingCycle === "annual"
          ? "annual"
          : "monthly",

      pricingModel:
        selected.pricingModel,
    },
  });
}

// ---------------------------------------------------------
// INLINE CHECKOUT
// ---------------------------------------------------------

// Paddle renders the payment flow inside this frame.
// Our own summary remains outside the iframe so:
//
// "Due today"
//
// remains the primary price displayed by our checkout page.
export const PADDLE_INLINE_FRAME_CLASS = "cortexa-paddle-frame";

export function paddleInlineSettings() {
  return {
    displayMode: "inline",
    frameTarget: PADDLE_INLINE_FRAME_CLASS,
    frameInitialHeight: 280,
    frameStyle:
      "width:100%;min-width:312px;background-color:transparent;border:none;",
    allowLogout: false,
    showAddDiscounts: false,
  };
}

// ---------------------------------------------------------
// WORKSPACE ADD-ON CHECKOUT
// ---------------------------------------------------------

// Open Paddle checkout for the Workspace add-on.
//
// IMPORTANT:
// This is its OWN $97/month recurring subscription.
// It is completely separate from the base:
// Solo / Business / Scale subscriptions.
export function openWorkspaceCheckout({
  priceId,
  customData,
  email,

  // Optional. Existing callers don't need to provide these.
  countryCode,
  postalCode,
  region,
}) {
  if (!priceId) {
    throw new Error(
      "Workspace Paddle price is not configured"
    );
  }

  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  const customer = buildPaddleCustomer({
    email,
    countryCode,
    postalCode,
    region,
  });

  window.Paddle.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],

    customer,

    customData: customData || {},
  });
}

// ---------------------------------------------------------
// BUSINESS $257 PROMOTIONAL CHECKOUT
// ---------------------------------------------------------

// Open Paddle checkout for the promotional Business offer.
//
// IMPORTANT:
// This uses ONLY the promo price id (pri_...PROMO257) — a SINGLE recurring
// $257/month item, charged immediately, with NO trial and NO starting-charge
// line. It provisions the Business plan (custom_data.plan = 'team'), which the
// webhook grants (3 users, unlimited AI). The overlay shows "$257/month, billed
// today" natively, so no custom summary is needed.
export function openBusinessPromoCheckout({
  priceId,
  userId,
  email,
  countryCode,
  postalCode,
  region,
  settings,
}) {
  if (!priceId) {
    throw new Error("Business promo Paddle price is not configured");
  }
  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  const customer = buildPaddleCustomer({
    email,
    countryCode,
    postalCode,
    region,
  });

  window.Paddle.Checkout.open({
    ...(settings ? { settings } : {}),
    items: [{ priceId, quantity: 1 }],
    customer,
    customData: {
      userId,
      plan: "team",
      billingCycle: "monthly",
      pricingModel: "promo_business_257",
    },
  });
}