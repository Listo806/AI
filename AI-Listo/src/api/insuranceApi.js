import apiClient from "./apiClient";

// Thin wrapper over the shared apiClient (which attaches the auth token and the
// /api base URL) for the Insurance Workspace endpoints.
function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const insuranceApi = {
  listPolicies(params = {}) {
    return apiClient.request(`/insurance/policies${toQuery(params)}`, {
      method: "GET",
    });
  },
  getPolicy(id) {
    return apiClient.request(`/insurance/policies/${id}`, { method: "GET" });
  },
  createPolicy(body) {
    return apiClient.request(`/insurance/policies`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updatePolicy(id, body) {
    return apiClient.request(`/insurance/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deletePolicy(id) {
    return apiClient.request(`/insurance/policies/${id}`, { method: "DELETE" });
  },
};

export default insuranceApi;
