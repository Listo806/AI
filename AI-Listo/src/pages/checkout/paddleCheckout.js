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

  // Native paid trial is a single self-contained price.
  if (paidTrialPriceFor(config, plan, billingCycle)) {
    return true;
  }

  // Otherwise BOTH one-time + recurring prices are required.
  return Boolean(
    config?.startPrices?.[plan] &&
      recurringPriceFor(config, plan, billingCycle)
  );
}

/**
 * Build Paddle customer prefill.
 *
 * To skip Paddle's first:
 *
 * "Please enter your details"
 *
 * screen, Paddle needs:
 *
 * - email
 * - countryCode
 *
 * Some countries additionally require:
 * - postalCode
 *
 * UAE may additionally require:
 * - region
 *
 * IMPORTANT:
 * Do not send an empty address object.
 */
function buildPaddleCustomer({
  email,
  countryCode,
  postalCode,
  region,
}) {
  const cleanEmail = String(email || "").trim();

  const cleanCountryCode = String(countryCode || "")
    .trim()
    .toUpperCase();

  const cleanPostalCode = String(postalCode || "").trim();

  const cleanRegion = String(region || "").trim();

  if (!cleanEmail) {
    return undefined;
  }

  // If we only know the email, Paddle can prefill the email,
  // but it may still show the "Your details" step because
  // country is missing.
  if (!cleanCountryCode) {
    return {
      email: cleanEmail,
    };
  }

  const address = {
    countryCode: cleanCountryCode,
  };

  if (cleanPostalCode) {
    address.postalCode = cleanPostalCode;
  }

  if (cleanRegion) {
    address.region = cleanRegion;
  }

  return {
    email: cleanEmail,
    address,
  };
}

export function openPaddleCheckout({
  config,
  plan,
  userId,
  email,

  // NEW:
  // These values allow Paddle to skip the customer-details step.
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

  // Optional Paddle Checkout settings (e.g. inline display).
  // Only attached when provided, so default overlay behavior
  // stays unchanged for other callers.
  const settingsArg = settings ? { settings } : {};

  // Build customer once and reuse it for both checkout paths.
  const customer = buildPaddleCustomer({
    email,
    countryCode,
    postalCode,
    region,
  });

  // ---------------------------------------------------------
  // PREFERRED:
  // Paddle native paid trial
  //
  // One line item:
  // Solo     -> $7 for 14 days -> $197/month
  // Business -> $14 for 14 days -> $347/month
  // Scale    -> $21 for 14 days -> $497/month
  // ---------------------------------------------------------

  const paidTrialPriceId = paidTrialPriceFor(
    config,
    plan,
    billingCycle
  );

  if (paidTrialPriceId) {
    window.Paddle.Checkout.open({
      ...settingsArg,

      items: [
        {
          priceId: paidTrialPriceId,
          quantity: 1,
        },
      ],

      // Prefilled customer information.
      //
      // When email + countryCode are available,
      // Paddle can go directly to the payment screen.
      customer,

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

  // ---------------------------------------------------------
  // FALLBACK:
  // one-time starting charge + recurring subscription
  //
  // Used until native paid-trial prices exist,
  // and currently used for annual billing.
  // ---------------------------------------------------------

  const startPriceId = config?.startPrices?.[plan];

  const recurringPriceId = recurringPriceFor(
    config,
    plan,
    billingCycle
  );

  if (!startPriceId) {
    throw new Error(
      `Starting Paddle price is not configured for plan: ${plan}`
    );
  }

  if (!recurringPriceId) {
    // Annual with no annual price must NEVER silently
    // fall back to monthly billing.
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
      //
      // Solo     $7
      // Business $14
      // Scale    $21
      {
        priceId: startPriceId,
        quantity: 1,
      },

      // Existing recurring subscription:
      //
      // Solo     $197/month
      // Business $347/month
      // Scale    $497/month
      {
        priceId: recurringPriceId,
        quantity: 1,
      },
    ],

    // Same prefilled information applies to the fallback checkout.
    customer,

    customData: {
      userId,
      plan,
      startingCharge,

      billingCycle:
        billingCycle === "annual"
          ? "annual"
          : "monthly",

      pricingModel: "starter_plus_recurring",
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

    // IMPORTANT:
    // Use Paddle one-page checkout.
    //
    // This removes the separate first "Your details" screen.
    // Email/country are prefilled when available, while any legally
    // required postal/region field stays inside the same payment screen.
    variant: "one-page",

    frameInitialHeight: 420,

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