import apiClient from "./apiClient";

const PUBLIC_API_BASE = import.meta.env.VITE_API_BASE_URL || "https://backend.cortexaaicrm.com/api";

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

  // Audiences
  listAudiences(params = {}) {
    return apiClient.request(`/marketing/audiences${toQuery(params)}`, { method: "GET" });
  },
  getAudience(id) {
    return apiClient.request(`/marketing/audiences/${id}`, { method: "GET" });
  },
  createAudience(body) {
    return apiClient.request(`/marketing/audiences`, { method: "POST", body: JSON.stringify(body) });
  },
  updateAudience(id, body) {
    return apiClient.request(`/marketing/audiences/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteAudience(id) {
    return apiClient.request(`/marketing/audiences/${id}`, { method: "DELETE" });
  },
  listAudienceMembers(id) {
    return apiClient.request(`/marketing/audiences/${id}/members`, { method: "GET" });
  },
  addAudienceMembers(id, members) {
    return apiClient.request(`/marketing/audiences/${id}/members`, { method: "POST", body: JSON.stringify({ members }) });
  },
  removeAudienceMember(id, memberId) {
    return apiClient.request(`/marketing/audiences/${id}/members/${memberId}`, { method: "DELETE" });
  },

  // Forms & Landing Pages
  listForms(params = {}) {
    return apiClient.request(`/marketing/forms${toQuery(params)}`, { method: "GET" });
  },
  getForm(id) {
    return apiClient.request(`/marketing/forms/${id}`, { method: "GET" });
  },
  createForm(body) {
    return apiClient.request(`/marketing/forms`, { method: "POST", body: JSON.stringify(body) });
  },
  updateForm(id, body) {
    return apiClient.request(`/marketing/forms/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteForm(id) {
    return apiClient.request(`/marketing/forms/${id}`, { method: "DELETE" });
  },
  listSubmissions(id) {
    return apiClient.request(`/marketing/forms/${id}/submissions`, { method: "GET" });
  },
  // Public form intake (no auth; account is derived server-side from the form).
  publicFormUrl(id) {
    return `${PUBLIC_API_BASE}/marketing/public/forms/${id}/submit`;
  },
  submitPublicForm(id, body) {
    return apiClient.request(`/marketing/public/forms/${id}/submit`, { method: "POST", body: JSON.stringify(body) });
  },

  // Automations
  listAutomations(params = {}) {
    return apiClient.request(`/marketing/automations${toQuery(params)}`, { method: "GET" });
  },
  createAutomation(body) {
    return apiClient.request(`/marketing/automations`, { method: "POST", body: JSON.stringify(body) });
  },
  updateAutomation(id, body) {
    return apiClient.request(`/marketing/automations/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteAutomation(id) {
    return apiClient.request(`/marketing/automations/${id}`, { method: "DELETE" });
  },
  runAutomation(id, body) {
    return apiClient.request(`/marketing/automations/${id}/run`, { method: "POST", body: JSON.stringify(body || {}) });
  },
  listAutomationRuns(id) {
    return apiClient.request(`/marketing/automations/${id}/runs`, { method: "GET" });
  },

  // Content
  listContent(params = {}) {
    return apiClient.request(`/marketing/content${toQuery(params)}`, { method: "GET" });
  },
  createContent(body) {
    return apiClient.request(`/marketing/content`, { method: "POST", body: JSON.stringify(body) });
  },
  updateContent(id, body) {
    return apiClient.request(`/marketing/content/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteContent(id) {
    return apiClient.request(`/marketing/content/${id}`, { method: "DELETE" });
  },

  // Integrations
  listIntegrations() {
    return apiClient.request(`/marketing/integrations`, { method: "GET" });
  },
  connectIntegration(body) {
    return apiClient.request(`/marketing/integrations/connect`, { method: "POST", body: JSON.stringify(body) });
  },
  disconnectIntegration(provider) {
    return apiClient.request(`/marketing/integrations/disconnect`, { method: "POST", body: JSON.stringify({ provider }) });
  },

  // Reports + import + AI
  getReports(range) {
    return apiClient.request(`/marketing/reports${range ? `?range=${encodeURIComponent(range)}` : ""}`, { method: "GET" });
  },
  importLeads(body) {
    return apiClient.request(`/marketing/leads/import`, { method: "POST", body: JSON.stringify(body) });
  },
  aiQuery(question) {
    return apiClient.request(`/marketing/ai/query`, { method: "POST", body: JSON.stringify({ question }) });
  },
  // Raw CSV fetch (the endpoint returns text/csv, not JSON).
  async exportCsv(type, range) {
    const token = localStorage.getItem("listo_access_token");
    const res = await fetch(`${PUBLIC_API_BASE}/marketing/export/${type}${range ? `?range=${encodeURIComponent(range)}` : ""}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.text();
  },
};

export default marketingApi;
