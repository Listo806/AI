import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient (auth token + /api base) for the Sales
// Workspace endpoints. Mirrors insuranceApi.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const salesApi = {
  getStats() {
    return apiClient.request(`/sales/stats`, { method: "GET" });
  },
  searchContacts(search) {
    return apiClient.request(`/sales/contacts${toQuery({ search })}`, {
      method: "GET",
    });
  },
  listQuotes(params = {}) {
    return apiClient.request(`/sales/quotes${toQuery(params)}`, {
      method: "GET",
    });
  },
  getQuote(id) {
    return apiClient.request(`/sales/quotes/${id}`, { method: "GET" });
  },
  createQuote(body) {
    return apiClient.request(`/sales/quotes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateQuote(id, body) {
    return apiClient.request(`/sales/quotes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteQuote(id) {
    return apiClient.request(`/sales/quotes/${id}`, { method: "DELETE" });
  },
};

export default salesApi;
