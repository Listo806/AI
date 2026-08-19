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
  listActivity(params = {}) {
    return apiClient.request(`/sales/activity${toQuery(params)}`, {
      method: "GET",
    });
  },

  logActivity(body) {
    return apiClient.request(`/sales/activity`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  searchContacts(search) {
    return apiClient.request(`/sales/contacts${toQuery({ search })}`, {
      method: "GET",
    });
  },
  listCustomers(params = {}) {
    return apiClient.request(`/sales/customers${toQuery(params)}`, { method: "GET" });
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

  listContracts(params = {}) {
    return apiClient.request(`/sales/contracts${toQuery(params)}`, { method: "GET" });
  },
  getContract(id) {
    return apiClient.request(`/sales/contracts/${id}`, { method: "GET" });
  },
  createContract(body) {
    return apiClient.request(`/sales/contracts`, { method: "POST", body: JSON.stringify(body) });
  },
  updateContract(id, body) {
    return apiClient.request(`/sales/contracts/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteContract(id) {
    return apiClient.request(`/sales/contracts/${id}`, { method: "DELETE" });
  },

  listReturns(params = {}) {
    return apiClient.request(`/sales/returns${toQuery(params)}`, { method: "GET" });
  },
  getReturn(id) {
    return apiClient.request(`/sales/returns/${id}`, { method: "GET" });
  },
  createReturn(body) {
    return apiClient.request(`/sales/returns`, { method: "POST", body: JSON.stringify(body) });
  },
  updateReturn(id, body) {
    return apiClient.request(`/sales/returns/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteReturn(id) {
    return apiClient.request(`/sales/returns/${id}`, { method: "DELETE" });
  },

  listInvoices(params = {}) {
    return apiClient.request(`/sales/invoices${toQuery(params)}`, { method: "GET" });
  },
  getInvoice(id) {
    return apiClient.request(`/sales/invoices/${id}`, { method: "GET" });
  },
  createInvoice(body) {
    return apiClient.request(`/sales/invoices`, { method: "POST", body: JSON.stringify(body) });
  },
  updateInvoice(id, body) {
    return apiClient.request(`/sales/invoices/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteInvoice(id) {
    return apiClient.request(`/sales/invoices/${id}`, { method: "DELETE" });
  },

  listCommissions(params = {}) {
    return apiClient.request(`/sales/commissions${toQuery(params)}`, { method: "GET" });
  },
  getCommission(id) {
    return apiClient.request(`/sales/commissions/${id}`, { method: "GET" });
  },
  createCommission(body) {
    return apiClient.request(`/sales/commissions`, { method: "POST", body: JSON.stringify(body) });
  },
  updateCommission(id, body) {
    return apiClient.request(`/sales/commissions/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteCommission(id) {
    return apiClient.request(`/sales/commissions/${id}`, { method: "DELETE" });
  },
};

export default salesApi;
