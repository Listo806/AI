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
  searchClientRecords(search) {
    return apiClient.request(`/financial/client-search${toQuery({ search })}`, { method: "GET" });
  },

  listApplications(params = {}) {
    return apiClient.request(`/financial/applications${toQuery(params)}`, { method: "GET" });
  },
  getApplication(id) {
    return apiClient.request(`/financial/applications/${id}`, { method: "GET" });
  },
  createApplication(body) {
    return apiClient.request(`/financial/applications`, { method: "POST", body: JSON.stringify(body) });
  },
  updateApplication(id, body) {
    return apiClient.request(`/financial/applications/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteApplication(id) {
    return apiClient.request(`/financial/applications/${id}`, { method: "DELETE" });
  },

  listAccounts(params = {}) {
    return apiClient.request(`/financial/accounts${toQuery(params)}`, { method: "GET" });
  },
  getAccount(id) {
    return apiClient.request(`/financial/accounts/${id}`, { method: "GET" });
  },
  createAccount(body) {
    return apiClient.request(`/financial/accounts`, { method: "POST", body: JSON.stringify(body) });
  },
  updateAccount(id, body) {
    return apiClient.request(`/financial/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteAccount(id) {
    return apiClient.request(`/financial/accounts/${id}`, { method: "DELETE" });
  },
};

export default financialApi;
