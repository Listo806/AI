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
};

export default aiUnitsApi;
