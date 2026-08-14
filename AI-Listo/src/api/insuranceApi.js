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
  searchContacts(search) {
    return apiClient.request(`/insurance/contacts${toQuery({ search })}`, {
      method: "GET",
    });
  },
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
  listClaims(params = {}) {
    return apiClient.request(`/insurance/claims${toQuery(params)}`, {
      method: "GET",
    });
  },
  getClaim(id) {
    return apiClient.request(`/insurance/claims/${id}`, { method: "GET" });
  },
  createClaim(body) {
    return apiClient.request(`/insurance/claims`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateClaim(id, body) {
    return apiClient.request(`/insurance/claims/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteClaim(id) {
    return apiClient.request(`/insurance/claims/${id}`, { method: "DELETE" });
  },
  listQuotes(params = {}) {
    return apiClient.request(`/insurance/quotes${toQuery(params)}`, {
      method: "GET",
    });
  },
  getQuote(id) {
    return apiClient.request(`/insurance/quotes/${id}`, { method: "GET" });
  },
  createQuote(body) {
    return apiClient.request(`/insurance/quotes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateQuote(id, body) {
    return apiClient.request(`/insurance/quotes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  convertQuote(id) {
    return apiClient.request(`/insurance/quotes/${id}/convert`, {
      method: "POST",
    });
  },
  deleteQuote(id) {
    return apiClient.request(`/insurance/quotes/${id}`, { method: "DELETE" });
  },
};

export default insuranceApi;
