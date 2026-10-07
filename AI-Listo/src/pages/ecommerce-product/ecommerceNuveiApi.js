const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://backend.cortexaaicrm.com/api";
const EC_TOKEN = "cortexa_ecommerce_access_token";

async function ecRequest(path, options = {}) {
  const token = localStorage.getItem(EC_TOKEN);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data?.data ?? data;
}

export const ecNuveiConfig = () => ecRequest("/nuvei/config");
export const ecMe = () => ecRequest("/users/me");
export const ecNuveiSubscription = () => ecRequest("/nuvei/subscription?product=ecommerce").then(x => x?.subscription ?? null);
export const ecNuveiCards = () => ecRequest("/nuvei/cards");
export const ecNuveiSaveToken = (card) => ecRequest("/nuvei/save-token", { method: "POST", body: JSON.stringify(card) });
export const ecNuveiActivate = (payload) => ecRequest("/nuvei/activate", { method: "POST", body: JSON.stringify({ ...payload, planKey: "ecommerce" }) });
export const ecNuveiThreeDsContinue = (subscriptionId) => ecRequest("/nuvei/3ds/continue", { method: "POST", body: JSON.stringify({ subscriptionId }) });

export function ecBrowserInfo() {
  // Keep these field names aligned with Nuvei/Paymentez browser_info.
  // The gateway validates js_enabled, timezone_offset and accept_header
  // before it can start 3DS2.
  return {
    user_agent: navigator.userAgent || "",
    language: navigator.language || "en-US",
    color_depth: window.screen?.colorDepth || 24,
    screen_height: window.screen?.height || 0,
    screen_width: window.screen?.width || 0,
    timezone_offset: new Date().getTimezoneOffset(),
    java_enabled: false,
    js_enabled: true,
    accept_header: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
}
