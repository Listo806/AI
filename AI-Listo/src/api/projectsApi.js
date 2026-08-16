import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient for the Projects / Client Delivery
// Workspace. Files reuse the existing Team Workspace file endpoints
// (/integrations/team-files*) so there is no duplicate storage system.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const projectsApi = {
  // context / dashboard
  getContext() {
    return apiClient.request(`/projects/context`, { method: "GET" });
  },
  getOverview() {
    return apiClient.request(`/projects/overview`, { method: "GET" });
  },
  getReports(params = {}) {
    return apiClient.request(`/projects/reports${toQuery(params)}`, { method: "GET" });
  },
  getTimeAndExpenses(params = {}) {
    return apiClient.request(`/projects/time-expenses${toQuery(params)}`, { method: "GET" });
  },

  // projects
  listProjects(params = {}) {
    return apiClient.request(`/projects${toQuery(params)}`, { method: "GET" });
  },
  getProject(id) {
    return apiClient.request(`/projects/${id}`, { method: "GET" });
  },
  createProject(body) {
    return apiClient.request(`/projects`, { method: "POST", body: JSON.stringify(body) });
  },
  updateProject(id, body) {
    return apiClient.request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteProject(id) {
    return apiClient.request(`/projects/${id}`, { method: "DELETE" });
  },

  // tasks (shared team_tasks records)
  listTasks(params = {}) {
    return apiClient.request(`/projects/tasks${toQuery(params)}`, { method: "GET" });
  },
  getTask(id) {
    return apiClient.request(`/projects/tasks/${id}`, { method: "GET" });
  },
  createTask(body) {
    return apiClient.request(`/projects/tasks`, { method: "POST", body: JSON.stringify(body) });
  },
  updateTask(id, body) {
    return apiClient.request(`/projects/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteTask(id) {
    return apiClient.request(`/projects/tasks/${id}`, { method: "DELETE" });
  },
  logTime(taskId, body) {
    return apiClient.request(`/projects/tasks/${taskId}/time`, { method: "POST", body: JSON.stringify(body) });
  },

  // milestones
  listMilestones(params = {}) {
    return apiClient.request(`/projects/milestones${toQuery(params)}`, { method: "GET" });
  },
  createMilestone(body) {
    return apiClient.request(`/projects/milestones`, { method: "POST", body: JSON.stringify(body) });
  },
  updateMilestone(id, body) {
    return apiClient.request(`/projects/milestones/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteMilestone(id) {
    return apiClient.request(`/projects/milestones/${id}`, { method: "DELETE" });
  },

  // deliverables
  listDeliverables(params = {}) {
    return apiClient.request(`/projects/deliverables${toQuery(params)}`, { method: "GET" });
  },
  createDeliverable(body) {
    return apiClient.request(`/projects/deliverables`, { method: "POST", body: JSON.stringify(body) });
  },
  updateDeliverable(id, body) {
    return apiClient.request(`/projects/deliverables/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteDeliverable(id) {
    return apiClient.request(`/projects/deliverables/${id}`, { method: "DELETE" });
  },

  // expenses
  createExpense(body) {
    return apiClient.request(`/projects/expenses`, { method: "POST", body: JSON.stringify(body) });
  },
  updateExpense(id, body) {
    return apiClient.request(`/projects/expenses/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteExpense(id) {
    return apiClient.request(`/projects/expenses/${id}`, { method: "DELETE" });
  },

  // clients (shared contacts)
  listClients(params = {}) {
    return apiClient.request(`/projects/clients${toQuery(params)}`, { method: "GET" });
  },
  getClient(id) {
    return apiClient.request(`/projects/clients/${id}`, { method: "GET" });
  },

  // files (reused Team Workspace storage)
  listFiles(params = {}) {
    return apiClient.request(`/integrations/team-files${toQuery(params)}`, { method: "GET" });
  },
  uploadFile(formData) {
    return apiClient.request(`/integrations/team-files/upload`, { method: "POST", body: formData });
  },
  getFileUrl(id, teamId) {
    return apiClient.request(`/integrations/team-files/${id}/url${toQuery({ teamId })}`, { method: "GET" });
  },
  deleteFile(id, teamId) {
    return apiClient.request(`/integrations/team-files/${id}${toQuery({ teamId })}`, { method: "DELETE" });
  },
};

export default projectsApi;
