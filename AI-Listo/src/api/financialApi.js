import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient for the Financial Services Workspace.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const financialApi = {
  getStats() {
    return apiClient.request(`/financial/stats`, { method: "GET" });
  },
  searchContacts(search) {
    return apiClient.request(`/financial/contacts${toQuery({ search })}`, { method: "GET" });
  },
  listClients(params = {}) {
    return apiClient.request(`/financial/clients${toQuery(params)}`, { method: "GET" });
  },
  getClient(id) {
    return apiClient.request(`/financial/clients/${id}`, { method: "GET" });
  },
  createClient(body) {
    return apiClient.request(`/financial/clients`, { method: "POST", body: JSON.stringify(body) });
  },
  updateClient(id, body) {
    return apiClient.request(`/financial/clients/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteClient(id) {
    return apiClient.request(`/financial/clients/${id}`, { method: "DELETE" });
  },
};

export default financialApi;
