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

// Checkout is ready only when BOTH price IDs exist:
//
// startPrices[plan]
// -> $7 / $14 / $21 ONE-TIME
//
// prices[plan]
// -> $197 / $347 / $497 MONTHLY
export function paddleReady(config, plan) {
  return Boolean(
    config?.clientToken &&
      config?.startPrices?.[plan] &&
      config?.prices?.[plan]
  );
}

export function openPaddleCheckout({
  config,
  plan,
  userId,
  email,
  startingCharge,
}) {
  const startPriceId = config?.startPrices?.[plan];
  const recurringPriceId = config?.prices?.[plan];

  if (!startPriceId) {
    throw new Error(
      `Starting Paddle price is not configured for plan: ${plan}`
    );
  }

  if (!recurringPriceId) {
    throw new Error(
      `Recurring Paddle price is not configured for plan: ${plan}`
    );
  }

  window.Paddle.Checkout.open({
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
      pricingModel: "starter_plus_recurring",
    },
  });
}