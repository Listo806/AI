import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient for the Marketing Workspace.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const marketingApi = {
  getStats() {
    return apiClient.request(`/marketing/stats`, { method: "GET" });
  },

  listCampaigns(params = {}) {
    return apiClient.request(`/marketing/campaigns${toQuery(params)}`, { method: "GET" });
  },
  getCampaign(id) {
    return apiClient.request(`/marketing/campaigns/${id}`, { method: "GET" });
  },
  createCampaign(body) {
    return apiClient.request(`/marketing/campaigns`, { method: "POST", body: JSON.stringify(body) });
  },
  updateCampaign(id, body) {
    return apiClient.request(`/marketing/campaigns/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  duplicateCampaign(id) {
    return apiClient.request(`/marketing/campaigns/${id}/duplicate`, { method: "POST", body: JSON.stringify({}) });
  },
  deleteCampaign(id) {
    return apiClient.request(`/marketing/campaigns/${id}`, { method: "DELETE" });
  },

  listCosts(campaignId) {
    return apiClient.request(`/marketing/campaigns/${campaignId}/costs`, { method: "GET" });
  },
  createCost(campaignId, body) {
    return apiClient.request(`/marketing/campaigns/${campaignId}/costs`, { method: "POST", body: JSON.stringify(body) });
  },
  deleteCost(campaignId, costId) {
    return apiClient.request(`/marketing/campaigns/${campaignId}/costs/${costId}`, { method: "DELETE" });
  },
};

export default marketingApi;
