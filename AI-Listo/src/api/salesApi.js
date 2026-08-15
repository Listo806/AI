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
  convertQuoteToProposal(id) {
    return apiClient.request(`/sales/quotes/${id}/convert-to-proposal`, {
      method: "POST",
    });
  },

  listProposals(params = {}) {
    return apiClient.request(`/sales/proposals${toQuery(params)}`, { method: "GET" });
  },
  getProposal(id) {
    return apiClient.request(`/sales/proposals/${id}`, { method: "GET" });
  },
  createProposal(body) {
    return apiClient.request(`/sales/proposals`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateProposal(id, body) {
    return apiClient.request(`/sales/proposals/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteProposal(id) {
    return apiClient.request(`/sales/proposals/${id}`, { method: "DELETE" });
  },
  convertProposalToOrder(id) {
    return apiClient.request(`/sales/proposals/${id}/convert-to-order`, {
      method: "POST",
    });
  },

  listOrders(params = {}) {
    return apiClient.request(`/sales/orders${toQuery(params)}`, { method: "GET" });
  },
  getOrder(id) {
    return apiClient.request(`/sales/orders/${id}`, { method: "GET" });
  },
  createOrder(body) {
    return apiClient.request(`/sales/orders`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateOrder(id, body) {
    return apiClient.request(`/sales/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteOrder(id) {
    return apiClient.request(`/sales/orders/${id}`, { method: "DELETE" });
  },
};

export default salesApi;
