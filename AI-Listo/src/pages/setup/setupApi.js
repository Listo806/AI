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


  whatsappStatus: async () => {
    const response = await apiClient.request("/whatsapp-qr/status", {
      method: "GET",
    });
    return response?.data || response || null;
  },

  whatsappConnect: async () => {
    const response = await apiClient.request("/whatsapp-qr/connect", {
      method: "POST",
    });
    return response?.data || response || null;
  },

  whatsappDisconnect: async () => {
    const response = await apiClient.request("/whatsapp-qr/disconnect", {
      method: "POST",
    });
    return response?.data || response || null;
  },

  pipeline: () => apiClient.request("/pipeline", { method: "GET" }),
  pipelineAgents: () => apiClient.request("/pipeline/agents", { method: "GET" }),

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