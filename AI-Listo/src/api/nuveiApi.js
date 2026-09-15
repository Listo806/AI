import apiClient from "./apiClient";

// Nuvei / Datafast (Paymentez) API helpers.
//
// The engine is dormant on the backend until NUVEI_ENABLED=true, so
// fetchNuveiConfig().enabled is the switch the UI reads before showing the
// Nuvei checkout instead of Paddle.

export async function fetchNuveiConfig() {
  try {
    const res = await apiClient.request("/nuvei/config");
    return res?.data ?? res;
  } catch {
    return null;
  }
}

// The signed-in user's latest Nuvei subscription (null if none).
export async function fetchNuveiSubscription() {
  try {
    const res = await apiClient.request("/nuvei/subscription");
    return (res?.data ?? res)?.subscription ?? null;
  } catch {
    return null;
  }
}

// Server-side Add Card (staging/test path). Returns { cardId, status }.
export async function nuveiAddCard(card) {
  const res = await apiClient.request("/nuvei/card", {
    method: "POST",
    body: JSON.stringify(card),
  });
  return res?.data ?? res;
}

// Store a token produced by the Paymentez browser SDK (PCI-safe path).
export async function nuveiSaveToken(card) {
  const res = await apiClient.request("/nuvei/save-token", {
    method: "POST",
    body: JSON.stringify(card),
  });
  return res?.data ?? res;
}

// Begin a subscription: charge activation (3DS) on the saved card.
export async function nuveiActivate(payload) {
  const res = await apiClient.request("/nuvei/activate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

export async function nuveiCancel(subscriptionId) {
  const res = await apiClient.request("/nuvei/cancel", {
    method: "POST",
    body: JSON.stringify({ subscriptionId }),
  });
  return res?.data ?? res;
}

// Admin: create a Link-to-Pay for a custom Web Solutions quotation.
export async function nuveiCreateLinkToPay(payload) {
  const res = await apiClient.request("/nuvei/link-to-pay", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

// Admin: refund a transaction.
export async function nuveiRefund(transactionId, amount) {
  const res = await apiClient.request("/nuvei/refund", {
    method: "POST",
    body: JSON.stringify({ transactionId, amount }),
  });
  return res?.data ?? res;
}

// Browser fingerprint the backend forwards to Nuvei for 3DS2.
export function collectBrowserInfo() {
  try {
    return {
      language: navigator.language || "en-US",
      java_enabled: false,
      js_enabled: true,
      color_depth: window.screen?.colorDepth || 24,
      screen_height: window.screen?.height || 0,
      screen_width: window.screen?.width || 0,
      timezone_offset: new Date().getTimezoneOffset(),
      user_agent: navigator.userAgent || "",
      accept_header: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };
  } catch {
    return null;
  }
}
