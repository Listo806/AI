import apiClient from "../../api/apiClient";

const normalizeWorkspaceId = (workspaceId) => {
  if (!workspaceId) return "";
  if (workspaceId === "default") return "";
  if (workspaceId === "undefined") return "";
  if (workspaceId === "null") return "";

  return workspaceId;
};

const endpoint = (path = "", workspaceId = "") => {
  const ws = normalizeWorkspaceId(workspaceId);

  return `/setup${path}${
    ws ? `?workspace_id=${encodeURIComponent(ws)}` : ""
  }`;
};

export const setupApi = {
  get: () => apiClient.request(endpoint()),

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
      body: JSON.stringify({}),
    }),

  assist: (body, workspaceId) =>
    apiClient.request(endpoint("/assistance", workspaceId), {
      method: "POST",
      body: JSON.stringify(body),
    }),

  dismiss: (workspaceId) =>
    apiClient.request(endpoint("/assistance/dismiss", workspaceId), {
      method: "POST",
      body: JSON.stringify({}),
    }),
};