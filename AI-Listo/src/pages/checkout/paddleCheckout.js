// Paddle Billing (Paddle.js v2) checkout helper.
//
// RESTORED SUBSCRIPTION FLOW:
// solo   -> $7 starting charge  + $197/month recurring price
// team   -> $14 starting charge + $347/month recurring price
// growth -> $21 starting charge + $497/month recurring price
//
// IMPORTANT:
// - No TransactionPreview().
// - No native paid-trial price preference.
// - No backend Paddle API changes.
// - Existing CheckoutPage layout stays unchanged.
// - Paddle environment is derived from the CLIENT TOKEN prefix so a stale
//   PADDLE_ENVIRONMENT value cannot send a test token to production or vice versa.

const PADDLE_JS = "https://cdn.paddle.com/paddle/v2/paddle.js";

let scriptPromise = null;

function loadPaddleJs() {
  if (window.Paddle) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("paddle-js");

    if (existing) {
      if (window.Paddle) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const s = document.createElement("script");

    s.id = "paddle-js";
    s.src = PADDLE_JS;
    s.async = true;

    s.onload = () => resolve();
    s.onerror = reject;

    document.body.appendChild(s);
  });

  return scriptPromise;
}

function resolvePaddleEnvironment(config) {
  const token = String(config?.clientToken || "").trim();
  const configured = String(config?.environment || "")
    .trim()
    .toLowerCase();

  // Current Paddle Billing client-side tokens:
  // test_... => sandbox
  // live_... => production
  if (token.startsWith("test_")) return "sandbox";
  if (token.startsWith("live_")) return "production";

  // Fallback for older config values.
  if (
    configured === "sandbox" ||
    configured === "test"
  ) {
    return "sandbox";
  }

  return "production";
}

export async function initPaddle(config, onEvent) {
  if (!config?.clientToken) {
    throw new Error("Paddle client token missing");
  }

  await loadPaddleJs();

  if (!window.Paddle) {
    throw new Error("Paddle.js failed to load");
  }

  const environment = resolvePaddleEnvironment(config);

  if (
    environment === "sandbox" &&
    window.Paddle?.Environment?.set
  ) {
    window.Paddle.Environment.set("sandbox");
  }

  // Do NOT call Environment.set("production").
  // Production is Paddle.js' default environment.
  //
  // IMPORTANT: reload the page after deploying this file so Paddle.js is
  // initialized fresh. Paddle.Initialize() should only happen once per page.
  window.Paddle.Initialize({
    token: config.clientToken,
    eventCallback: onEvent,
  });

  const tokenPrefix = String(config.clientToken).slice(0, 5);

  console.log("[PADDLE INIT]", {
    environment,
    configuredEnvironment: config?.environment || null,
    tokenPrefix: `${tokenPrefix}...`,
  });
}

function recurringPriceFor(config, plan, billingCycle) {
  if (billingCycle === "annual") {
    return config?.annualPrices?.[plan] || null;
  }

  return config?.prices?.[plan] || null;
}

export function paddleReady(config, plan, billingCycle) {
  if (!config?.clientToken) return false;

  return Boolean(
    config?.startPrices?.[plan] &&
      recurringPriceFor(config, plan, billingCycle)
  );
}

function buildPaddleCustomer(email) {
  const cleanEmail = String(email || "").trim();

  return cleanEmail
    ? {
        email: cleanEmail,
      }
    : undefined;
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
  if (!window.Paddle?.Checkout?.open) {
    throw new Error("Paddle Checkout is not initialized");
  }

  const startPriceId =
    config?.startPrices?.[plan] || null;

  const recurringPriceId =
    recurringPriceFor(
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
    throw new Error(
      billingCycle === "annual"
        ? `Annual billing for the ${plan} plan is not fully configured yet. Please choose monthly or contact support.`
        : `Recurring Paddle price is not configured for plan: ${plan}`
    );
  }

  // These values are safe to log: Paddle price IDs are public catalog IDs.
  console.log("[PADDLE CHECKOUT CONFIG]", {
    environment:
      resolvePaddleEnvironment(config),
    plan,
    billingCycle:
      billingCycle === "annual"
        ? "annual"
        : "monthly",
    startPriceId,
    recurringPriceId,
  });

  window.Paddle.Checkout.open({
    ...(settings
      ? {
          settings,
        }
      : {}),

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

    customer:
      buildPaddleCustomer(email),

    customData: {
      userId,
      plan,
      startingCharge,

      billingCycle:
        billingCycle === "annual"
          ? "annual"
          : "monthly",

      pricingModel:
        "starter_plus_recurring",
    },
  });
}

// Keep the existing inline checkout layout.
// No visual redesign.
export const PADDLE_INLINE_FRAME_CLASS =
  "cortexa-paddle-frame";

export function paddleInlineSettings() {
  return {
    displayMode: "inline",
    frameTarget:
      PADDLE_INLINE_FRAME_CLASS,
    frameInitialHeight: 280,
    frameStyle:
      "width:100%;min-width:312px;background-color:transparent;border:none;",
    allowLogout: false,
    showAddDiscounts: false,
  };
}

export function openWorkspaceCheckout({
  priceId,
  customData,
  email,
}) {
  if (!priceId) {
    throw new Error(
      "Workspace Paddle price is not configured"
    );
  }

  if (!window.Paddle?.Checkout?.open) {
    throw new Error(
      "Paddle Checkout is not initialized"
    );
  }

  window.Paddle.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],

    customer:
      buildPaddleCustomer(email),

    customData:
      customData || {},
  });
}

export function openBusinessPromoCheckout({
  priceId,
  userId,
  email,
  settings,
}) {
  if (!priceId) {
    throw new Error(
      "Business promo Paddle price is not configured"
    );
  }

  if (!window.Paddle?.Checkout?.open) {
    throw new Error(
      "Paddle Checkout is not initialized"
    );
  }

  window.Paddle.Checkout.open({
    ...(settings ? { settings } : {}),

    items: [
      {
        priceId,
        quantity: 1,
      },
    ],

    customer:
      buildPaddleCustomer(email),

    customData: {
      userId,
      plan: "team",
      billingCycle: "monthly",
      pricingModel:
        "promo_business_257",
    },
  });
}
