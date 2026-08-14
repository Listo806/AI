import apiClient from "./apiClient";

// Paid Workspace add-ons. Each Workspace is its own $97/month Paddle subscription,
// unlocked per account by a workspace entitlement. The backend webhook is what
// actually grants/revokes access; these calls only read the catalog/entitlements
// and fetch the parameters needed to open the Paddle checkout.
const workspaceApi = {
  // { monthlyPrice, available, workspaces: [{ id, name, route }] }
  getCatalog() {
    return apiClient.request("/workspaces/catalog", { method: "GET" });
  },

  // { entitlements: [...], activeWorkspaceIds: [...] }
  getEntitlements() {
    return apiClient.request("/workspaces/entitlements", { method: "GET" });
  },

  // { workspaces: [{ id, name, route, locked, entitled, accessible }] }
  getAccess() {
    return apiClient.request("/workspaces/access", { method: "GET" });
  },

  // { alreadyEntitled, priceId, environment, customData, email } | { alreadyEntitled: true }
  purchase(workspaceId) {
    return apiClient.request(
      `/workspaces/${encodeURIComponent(workspaceId)}/purchase`,
      { method: "POST" },
    );
  },
};

export default workspaceApi;
