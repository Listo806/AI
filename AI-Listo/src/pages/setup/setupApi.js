import apiClient from "../../api/apiClient";

const storedWorkspace = () =>
  localStorage.getItem("activeWorkspaceId") ||
  localStorage.getItem("workspace_id") ||
  "";

const endpoint = (path = "", workspaceId = "") =>
  `/setup${path}${workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : ""}`;

export const setupApi = {
  async get() {
    const requested = storedWorkspace();

    // Prefer the active workspace. If localStorage contains a stale/non-entitled
    // workspace, retry without it so the backend resolves an active workspace
    // belonging to the authenticated team.
    if (requested) {
      try {
        return await apiClient.request(endpoint("", requested));
      } catch (error) {
        if (error?.status !== 403 && error?.statusCode !== 403) throw error;
      }
    }

    return apiClient.request(endpoint());
  },

  save: (body, workspaceId) =>
    apiClient.request(endpoint("", workspaceId), {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  test: (body, workspaceId) =>
    apiClient.request(endpoint("/test", workspaceId), {
      method: "POST",
      body: JSON.stringify(body),
    }),

  activate: (workspaceId) =>
    apiClient.request(endpoint("/activate", workspaceId), {
      method: "POST",
      body: "{}",
    }),

  assist: (body, workspaceId) =>
    apiClient.request(endpoint("/assistance", workspaceId), {
      method: "POST",
      body: JSON.stringify(body),
    }),

  dismiss: (workspaceId) =>
    apiClient.request(endpoint("/assistance/dismiss", workspaceId), {
      method: "POST",
      body: "{}",
    }),
};
