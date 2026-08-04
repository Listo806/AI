// Self-contained Paddle Billing (Paddle.js v2) checkout helper.
//
// This module is intentionally NOT wired into the live CheckoutPage yet. It
// encodes the documented Paddle.js flow so the overlay checkout is ready to drop
// in once the product/price ids exist and we can test end to end (sandbox first).
//
// Flow: load paddle.js -> Paddle.Initialize({ token }) -> Paddle.Checkout.open
// with the setup-fee price + the selected tier price, and customData carrying our
// userId + plan so the backend webhook can link the Paddle subscription to the
// account (see PaymentsService.processPaddleWebhook).

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

// Initialize Paddle.js with the client-side token. `onEvent` receives Paddle
// checkout events (e.g. { name: "checkout.completed", data }).
export async function initPaddle(config, onEvent) {
  if (!config?.clientToken) throw new Error("Paddle client token missing");
  await loadPaddleJs();
  if (config.environment === "sandbox" && window.Paddle?.Environment?.set) {
    window.Paddle.Environment.set("sandbox");
  }
  window.Paddle.Initialize({
    token: config.clientToken,
    eventCallback: onEvent,
  });
}

// True only when the config carries a client token and a price for this plan,
// so callers can keep PayPal as the default until Paddle is fully configured.
export function paddleReady(config, plan) {
  return Boolean(config?.clientToken && config?.prices?.[plan]);
}

// Open the Paddle overlay checkout for a plan. Includes the one-time setup fee
// price (if configured) plus the tier's recurring/trial price, and passes our
// userId + plan as customData for webhook-based activation. When setupPriceId is
// passed (the exit-intent $7 offer) it replaces the standard setup price.
export function openPaddleCheckout({ config, plan, userId, email, setupPriceId }) {
  const items = [];
  const setup = setupPriceId || config?.setupPrice;
  if (setup) items.push({ priceId: setup, quantity: 1 });
  const tierPrice = config?.prices?.[plan];
  if (tierPrice) items.push({ priceId: tierPrice, quantity: 1 });
  if (!items.length) throw new Error("Paddle prices are not configured");

  window.Paddle.Checkout.open({
    items,
    customer: email ? { email } : undefined,
    customData: setupPriceId
      ? { userId, plan, offer: "exit7" }
      : { userId, plan },
  });
}
