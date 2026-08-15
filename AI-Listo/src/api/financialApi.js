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

  listTransactions(params = {}) {
    return apiClient.request(`/financial/transactions${toQuery(params)}`, { method: "GET" });
  },
  getTransaction(id) {
    return apiClient.request(`/financial/transactions/${id}`, { method: "GET" });
  },
  createTransaction(body) {
    return apiClient.request(`/financial/transactions`, { method: "POST", body: JSON.stringify(body) });
  },
  updateTransaction(id, body) {
    return apiClient.request(`/financial/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteTransaction(id) {
    return apiClient.request(`/financial/transactions/${id}`, { method: "DELETE" });
  },

  listInvestments(params = {}) {
    return apiClient.request(`/financial/investments${toQuery(params)}`, { method: "GET" });
  },
  getInvestment(id) {
    return apiClient.request(`/financial/investments/${id}`, { method: "GET" });
  },
  createInvestment(body) {
    return apiClient.request(`/financial/investments`, { method: "POST", body: JSON.stringify(body) });
  },
  updateInvestment(id, body) {
    return apiClient.request(`/financial/investments/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteInvestment(id) {
    return apiClient.request(`/financial/investments/${id}`, { method: "DELETE" });
  },

  listCommissions(params = {}) {
    return apiClient.request(`/financial/commissions${toQuery(params)}`, { method: "GET" });
  },
  getCommission(id) {
    return apiClient.request(`/financial/commissions/${id}`, { method: "GET" });
  },
  createCommission(body) {
    return apiClient.request(`/financial/commissions`, { method: "POST", body: JSON.stringify(body) });
  },
  updateCommission(id, body) {
    return apiClient.request(`/financial/commissions/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteCommission(id) {
    return apiClient.request(`/financial/commissions/${id}`, { method: "DELETE" });
  },

  listDocuments(params = {}) {
    return apiClient.request(`/financial/documents${toQuery(params)}`, { method: "GET" });
  },
  // Multipart upload; apiClient strips Content-Type for FormData so the browser
  // sets the multipart boundary.
  uploadDocument(formData) {
    return apiClient.request(`/financial/documents`, { method: "POST", body: formData });
  },
  getDocumentLink(id) {
    return apiClient.request(`/financial/documents/${id}/link`, { method: "GET" });
  },
  deleteDocument(id) {
    return apiClient.request(`/financial/documents/${id}`, { method: "DELETE" });
  },

  getReports() {
    return apiClient.request(`/financial/reports`, { method: "GET" });
  },
};

export default financialApi;
