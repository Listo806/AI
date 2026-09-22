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

const unwrap = (value) => value?.data?.data ?? value?.data ?? value;

export const setupApi = {
  get: () => apiClient.request(endpoint()),

  whatsappStatus: async () =>
    unwrap(await apiClient.request("/whatsapp-qr/status")),

  whatsappConnect: async () =>
    unwrap(await apiClient.request("/whatsapp-qr/connect", {
      method: "POST",
      body: JSON.stringify({}),
    })),

  whatsappDisconnect: async () =>
    unwrap(await apiClient.request("/whatsapp-qr/disconnect", {
      method: "POST",
      body: JSON.stringify({}),
    })),

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