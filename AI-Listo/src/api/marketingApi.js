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

  // Leads
  listLeads(params = {}) {
    return apiClient.request(`/marketing/leads${toQuery(params)}`, { method: "GET" });
  },
  getLead(id) {
    return apiClient.request(`/marketing/leads/${id}`, { method: "GET" });
  },
  createLead(body) {
    return apiClient.request(`/marketing/leads`, { method: "POST", body: JSON.stringify(body) });
  },
  updateLead(id, body) {
    return apiClient.request(`/marketing/leads/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteLead(id) {
    return apiClient.request(`/marketing/leads/${id}`, { method: "DELETE" });
  },
  listTouchpoints(leadId) {
    return apiClient.request(`/marketing/leads/${leadId}/touchpoints`, { method: "GET" });
  },
  createTouchpoint(leadId, body) {
    return apiClient.request(`/marketing/leads/${leadId}/touchpoints`, { method: "POST", body: JSON.stringify(body) });
  },

  // Conversions
  listConversions(params = {}) {
    return apiClient.request(`/marketing/conversions${toQuery(params)}`, { method: "GET" });
  },
  createConversion(body) {
    return apiClient.request(`/marketing/conversions`, { method: "POST", body: JSON.stringify(body) });
  },
  deleteConversion(id) {
    return apiClient.request(`/marketing/conversions/${id}`, { method: "DELETE" });
  },

  // Attribution (last-touch)
  getAttribution(range) {
    return apiClient.request(`/marketing/attribution${range ? `?range=${encodeURIComponent(range)}` : ""}`, { method: "GET" });
  },

  // Email & SMS messages
  listMessages(params = {}) {
    return apiClient.request(`/marketing/messages${toQuery(params)}`, { method: "GET" });
  },
  getMessage(id) {
    return apiClient.request(`/marketing/messages/${id}`, { method: "GET" });
  },
  createMessage(body) {
    return apiClient.request(`/marketing/messages`, { method: "POST", body: JSON.stringify(body) });
  },
  updateMessage(id, body) {
    return apiClient.request(`/marketing/messages/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteMessage(id) {
    return apiClient.request(`/marketing/messages/${id}`, { method: "DELETE" });
  },
  listRecipients(id) {
    return apiClient.request(`/marketing/messages/${id}/recipients`, { method: "GET" });
  },
  addRecipients(id, recipients) {
    return apiClient.request(`/marketing/messages/${id}/recipients`, { method: "POST", body: JSON.stringify({ recipients }) });
  },
  sendMessage(id) {
    return apiClient.request(`/marketing/messages/${id}/send`, { method: "POST", body: JSON.stringify({}) });
  },
  recordEvent(id, body) {
    return apiClient.request(`/marketing/messages/${id}/events`, { method: "POST", body: JSON.stringify(body) });
  },

  // Suppression
  listSuppression(params = {}) {
    return apiClient.request(`/marketing/suppression${toQuery(params)}`, { method: "GET" });
  },
  addSuppression(body) {
    return apiClient.request(`/marketing/suppression`, { method: "POST", body: JSON.stringify(body) });
  },
  deleteSuppression(id) {
    return apiClient.request(`/marketing/suppression/${id}`, { method: "DELETE" });
  },
};

export default marketingApi;
