import apiClient from "./apiClient";
import { localeCodeFromPath } from "../i18n/locales";

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

// 3DS: after the hidden "method" iframe was shown, continue the authentication.
export async function nuveiThreeDsContinue(subscriptionId) {
  const res = await apiClient.request("/nuvei/3ds/continue", {
    method: "POST",
    body: JSON.stringify({ subscriptionId }),
  });
  return res?.data ?? res;
}

// The signed-in user's saved cards (id + last4/brand; never the token).
export async function nuveiListCards() {
  const res = await apiClient.request("/nuvei/cards");
  return res?.data ?? res;
}

export async function nuveiCancel(subscriptionId, immediately = false) {
  const res = await apiClient.request("/nuvei/cancel", {
    method: "POST",
    body: JSON.stringify({ subscriptionId, immediately }),
  });
  return res?.data ?? res;
}

// Admin: create a Link-to-Pay for a custom Web Solutions quotation. The page
// language travels with it, so the payer can be shown their own language.
export async function nuveiCreateLinkToPay(payload) {
  const locale = localeCodeFromPath(
    typeof window === "undefined" ? "/" : window.location.pathname,
  );
  const res = await apiClient.request("/nuvei/link-to-pay", {
    method: "POST",
    body: JSON.stringify({ locale, ...payload }),
  });
  return res?.data ?? res;
}

// Paid Workspace add-on ($97/month per additional Workspace).
// { workspaceId, quote: true } only validates and returns the price + the saved
// card that would be charged ({ status: 'confirm', card }); with a cardId it
// charges (3DS like the plan activation). The server unlocks the Workspace only
// after Nuvei confirms the payment.
export async function nuveiWorkspaceAddon(payload) {
  const res = await apiClient.request("/nuvei/workspace-addons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

// 3DS: after the hidden "method" iframe was shown, continue the add-on charge.
export async function nuveiWorkspaceAddonContinue(addonId) {
  const res = await apiClient.request(
    `/nuvei/workspace-addons/${encodeURIComponent(addonId)}/3ds/continue`,
    { method: "POST" },
  );
  return res?.data ?? res;
}

// One add-on's status (polled after 3DS / a bank review).
export async function nuveiWorkspaceAddonStatus(addonId) {
  const res = await apiClient.request(
    `/nuvei/workspace-addons/${encodeURIComponent(addonId)}`,
  );
  return res?.data ?? res;
}

// The account's Workspace add-ons: { canManage, addons: [...] }.
export async function nuveiWorkspaceAddons() {
  const res = await apiClient.request("/nuvei/workspace-addons");
  return res?.data ?? res;
}

// Cancel an add-on (stays unlocked until the paid month ends).
export async function nuveiWorkspaceAddonCancel(addonId) {
  const res = await apiClient.request(
    `/nuvei/workspace-addons/${encodeURIComponent(addonId)}/cancel`,
    { method: "POST" },
  );
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
