import apiClient from "./apiClient";

// Public Paddle config for the checkout: { clientToken, environment, prices, setupPrice }.
// Returns null on any error so the checkout can fall back to PayPal.
export async function fetchPaddleConfig() {
  try {
    return await apiClient.request("/payments/paddle/config");
  } catch {
    return null;
  }
}
