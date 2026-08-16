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
  importTickets(tickets) {
    return apiClient.request(`/customer-service/tickets/import`, { method: "POST", body: JSON.stringify({ tickets }) });
  },
  updateTicket(id, body) {
    return apiClient.request(`/customer-service/tickets/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteTicket(id) {
    return apiClient.request(`/customer-service/tickets/${id}`, { method: "DELETE" });
  },

  // Conversation
  listMessages(ticketId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/messages`, { method: "GET" });
  },
  createMessage(ticketId, body) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify(body) });
  },
  deleteMessage(ticketId, messageId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/messages/${messageId}`, { method: "DELETE" });
  },
  listActivity(ticketId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/activity`, { method: "GET" });
  },

  // Attachments (private S3)
  listAttachments(ticketId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/attachments`, { method: "GET" });
  },
  uploadAttachment(ticketId, formData) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/attachments`, { method: "POST", body: formData });
  },
  getAttachmentLink(ticketId, attachmentId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/attachments/${attachmentId}/link`, { method: "GET" });
  },
  deleteAttachment(ticketId, attachmentId) {
    return apiClient.request(`/customer-service/tickets/${ticketId}/attachments/${attachmentId}`, { method: "DELETE" });
  },

  // Customers (CRM contacts + rollups)
  listCustomers(params = {}) {
    return apiClient.request(`/customer-service/customers${toQuery(params)}`, { method: "GET" });
  },
  getCustomer(id) {
    return apiClient.request(`/customer-service/customers/${id}`, { method: "GET" });
  },

  // Knowledge Base
  listArticles(params = {}) {
    return apiClient.request(`/customer-service/kb/articles${toQuery(params)}`, { method: "GET" });
  },
  getArticle(id) {
    return apiClient.request(`/customer-service/kb/articles/${id}`, { method: "GET" });
  },
  createArticle(body) {
    return apiClient.request(`/customer-service/kb/articles`, { method: "POST", body: JSON.stringify(body) });
  },
  updateArticle(id, body) {
    return apiClient.request(`/customer-service/kb/articles/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteArticle(id) {
    return apiClient.request(`/customer-service/kb/articles/${id}`, { method: "DELETE" });
  },

  // SLA policies + recompute
  listSlaPolicies() {
    return apiClient.request(`/customer-service/sla/policies`, { method: "GET" });
  },
  createSlaPolicy(body) {
    return apiClient.request(`/customer-service/sla/policies`, { method: "POST", body: JSON.stringify(body) });
  },
  updateSlaPolicy(id, body) {
    return apiClient.request(`/customer-service/sla/policies/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteSlaPolicy(id) {
    return apiClient.request(`/customer-service/sla/policies/${id}`, { method: "DELETE" });
  },
  recomputeSla() {
    return apiClient.request(`/customer-service/sla/recompute`, { method: "POST", body: JSON.stringify({}) });
  },

  // Escalation rules
  listEscalations() {
    return apiClient.request(`/customer-service/escalations`, { method: "GET" });
  },
  createEscalation(body) {
    return apiClient.request(`/customer-service/escalations`, { method: "POST", body: JSON.stringify(body) });
  },
  updateEscalation(id, body) {
    return apiClient.request(`/customer-service/escalations/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteEscalation(id) {
    return apiClient.request(`/customer-service/escalations/${id}`, { method: "DELETE" });
  },

  // Automation rules
  listAutomations() {
    return apiClient.request(`/customer-service/automations`, { method: "GET" });
  },
  createAutomation(body) {
    return apiClient.request(`/customer-service/automations`, { method: "POST", body: JSON.stringify(body) });
  },
  updateAutomation(id, body) {
    return apiClient.request(`/customer-service/automations/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteAutomation(id) {
    return apiClient.request(`/customer-service/automations/${id}`, { method: "DELETE" });
  },

  // Surveys
  listSurveys(params = {}) {
    return apiClient.request(`/customer-service/surveys${toQuery(params)}`, { method: "GET" });
  },
  getSurvey(id) {
    return apiClient.request(`/customer-service/surveys/${id}`, { method: "GET" });
  },
  createSurvey(body) {
    return apiClient.request(`/customer-service/surveys`, { method: "POST", body: JSON.stringify(body) });
  },
  updateSurvey(id, body) {
    return apiClient.request(`/customer-service/surveys/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteSurvey(id) {
    return apiClient.request(`/customer-service/surveys/${id}`, { method: "DELETE" });
  },

  // Reports
  getReports(params = {}) {
    return apiClient.request(`/customer-service/reports${toQuery(params)}`, { method: "GET" });
  },

  // AI assist (tenant-isolated KB retrieval)
  aiKnowledgeSearch(query, limit) {
    return apiClient.request(`/customer-service/ai/knowledge-search${toQuery({ query, limit })}`, { method: "GET" });
  },
};

export default customerServiceApi;
