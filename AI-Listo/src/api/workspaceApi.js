import apiClient from "./apiClient";

// Paid Workspace add-ons. Access is granted only by an active entitlement.
// A promotional included-workspace credit may comp one selection; otherwise the
// purchase endpoint returns a Paddle checkout intent.
const workspaceApi = {
  // { monthlyPrice, available, workspaces: [...] }
  getCatalog() {
    return apiClient.request("/workspaces/catalog", {
      method: "GET",
    });
  },

  // { entitlements: [...], activeWorkspaceIds: [...] }
  getEntitlements() {
    return apiClient.request("/workspaces/entitlements", {
      method: "GET",
    });
  },

  // {
  //   workspaces: [
  //     {
  //       id,
  //       route,
  //       entitled,
  //       accessible,
  //       workspaceInstanceId,
  //       ...
  //     }
  //   ]
  // }
  getAccess() {
    return apiClient.request("/workspaces/access", {
      method: "GET",
    });
  },

  // ============================================================
  // ACTIVATE WORKSPACE
  // ============================================================
  //
  // Platform-support activation endpoint. Normal customers must use purchase().
  //
  activate(workspaceId) {
    if (!workspaceId) {
      return Promise.reject(
        new Error("workspaceId is required"),
      );
    }

    return apiClient.request(
      `/workspaces/${encodeURIComponent(
        workspaceId,
      )}/activate`,
      {
        method: "POST",
      },
    );
  },

  // ============================================================
  // BACKWARDS COMPATIBILITY
  // ============================================================
  //
  // Some existing components may still call:
  //
  // workspaceApi.purchase(workspaceId)
  //
  // Normal customer flow: returns alreadyEntitled/comped when no payment is
  // needed, otherwise returns Paddle priceId + customData for secure checkout.
  //
  purchase(workspaceId) {
    if (!workspaceId) {
      return Promise.reject(
        new Error("workspaceId is required"),
      );
    }

    return apiClient.request(
      `/workspaces/${encodeURIComponent(
        workspaceId,
      )}/purchase`,
      {
        method: "POST",
      },
    );
  },
};

export default workspaceApi;