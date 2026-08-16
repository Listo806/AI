import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient for the Customer Service Workspace.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const customerServiceApi = {
  getStats() {
    return apiClient.request(`/customer-service/stats`, { method: "GET" });
  },
  searchContacts(search) {
    return apiClient.request(`/customer-service/contacts${toQuery({ search })}`, { method: "GET" });
  },
  searchAgents(search) {
    return apiClient.request(`/customer-service/agents${toQuery({ search })}`, { method: "GET" });
  },

  listTickets(params = {}) {
    return apiClient.request(`/customer-service/tickets${toQuery(params)}`, { method: "GET" });
  },
  getTicket(id) {
    return apiClient.request(`/customer-service/tickets/${id}`, { method: "GET" });
  },
  createTicket(body) {
    return apiClient.request(`/customer-service/tickets`, { method: "POST", body: JSON.stringify(body) });
  },
  updateTicket(id, body) {
    return apiClient.request(`/customer-service/tickets/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteTicket(id) {
    return apiClient.request(`/customer-service/tickets/${id}`, { method: "DELETE" });
  },
};

export default customerServiceApi;
