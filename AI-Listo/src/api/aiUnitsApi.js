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
  // Admin: AI Units snapshot for a customer, resolved from their (owner) user id.
  getAdminByUser(userId) {
    return apiClient.request(`/ai-units/admin/by-user/${encodeURIComponent(userId)}`, {
      method: "GET",
    });
  },
  // Admin: read / toggle the floating-HUD preview on the calling admin's account.
  getPreview() {
    return apiClient.request(`/ai-units/admin/preview`, { method: "GET" });
  },
  setPreview(enabled) {
    return apiClient.request(`/ai-units/admin/preview`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
  },
};

export default aiUnitsApi;
