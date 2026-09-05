import apiClient from "./apiClient";

// Customer Workspaces are attached directly to the account's active CRM plan.
// Selecting the included Workspace does NOT open a separate Paddle checkout.
const workspaceApi = {
  // { includedWithPlan, includedWorkspaceLimit, available, workspaces: [...] }
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
  // Adds the selected Workspace directly to the customer's
  // current ACTIVE CRM plan.
  //
  // IMPORTANT:
  // - No Paddle checkout.
  // - No separate Workspace payment.
  // - Backend validates the active CRM subscription.
  // - Backend creates/returns a unique Workspace instance UUID.
  // - Workspace is linked to:
  //      customer/user
  //      team/account
  //      active CRM subscription
  //      active CRM plan
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
  // Keep this method temporarily so older frontend code does not
  // immediately break.
  //
  // IMPORTANT:
  // The backend purchase endpoint has been changed to use the
  // SAME no-payment activation flow.
  //
  // It must NOT return Paddle checkout information anymore.
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