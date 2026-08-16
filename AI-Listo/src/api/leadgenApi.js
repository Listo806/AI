import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient for the Lead Generator workspace.
// Every method hits the real /leadgen engine — there is no local/demo data.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const leadgenApi = {
  getContext() {
    return apiClient.request(`/leadgen/context`, { method: "GET" });
  },
  getOverview() {
    return apiClient.request(`/leadgen/overview`, { method: "GET" });
  },
  getSources() {
    return apiClient.request(`/leadgen/sources`, { method: "GET" });
  },
  interpret(body) {
    return apiClient.request(`/leadgen/interpret`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  listSearches(params = {}) {
    return apiClient.request(`/leadgen/searches${toQuery(params)}`, { method: "GET" });
  },
  createSearch(body) {
    return apiClient.request(`/leadgen/searches`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getSearch(id) {
    return apiClient.request(`/leadgen/searches/${id}`, { method: "GET" });
  },
  listLeads(id, params = {}) {
    return apiClient.request(`/leadgen/searches/${id}/leads${toQuery(params)}`, {
      method: "GET",
    });
  },
  cancelSearch(id) {
    return apiClient.request(`/leadgen/searches/${id}/cancel`, { method: "POST" });
  },
  listSavedSearches() {
    return apiClient.request(`/leadgen/saved-searches`, { method: "GET" });
  },
  createSavedSearch(body) {
    return apiClient.request(`/leadgen/saved-searches`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  deleteSavedSearch(id) {
    return apiClient.request(`/leadgen/saved-searches/${id}`, { method: "DELETE" });
  },
  importLead(id) {
    return apiClient.request(`/leadgen/leads/${id}/import`, { method: "POST" });
  },
};

export default leadgenApi;
