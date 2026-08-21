import apiClient from "./apiClient";

// One client for the single AI Units balance. The sidebar meter and the global
// AI Power HUD both read from here, so there is one source of truth.
const aiUnitsApi = {
  getBalance() {
    return apiClient.request("/ai-units/balance", { method: "GET" });
  },
  getConfig() {
    return apiClient.request("/ai-units/config", { method: "GET" });
  },
  getCheckout(packageId) {
    return apiClient.request(`/ai-units/checkout/${encodeURIComponent(packageId)}`, {
      method: "GET",
    });
  },
  // The AI purchase options for the popup: the one-time credit packs (mapped by
  // each price's REAL Paddle amount, never guessed) + the recurring Unlimited AI.
  getPurchaseOptions() {
    return apiClient.request("/payments/paddle/ai-purchase-options", {
      method: "GET",
    });
  },
  // Admin: AI Units snapshot for a customer, resolved from their (owner) user id.
  getAdminByUser(userId) {
    return apiClient.request(`/ai-units/admin/by-user/${encodeURIComponent(userId)}`, {
      method: "GET",
    });
  },
};

export default aiUnitsApi;
