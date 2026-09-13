import apiClient from "./apiClient";

const WORKSPACE_ID = "aesthetic-wellness";

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

const request = (path, options = {}) => apiClient.request(path, options);

const aestheticWellnessApi = {
  workspaceId: WORKSPACE_ID,

  getDashboard(params = {}) {
    return request(`/aesthetic-wellness/dashboard${buildQuery(params)}`);
  },

  getSetupStatus() {
    return request(`/aesthetic-wellness/setup-status`);
  },

  getConversionFlow() {
    return request(`/aesthetic-wellness/conversion-flow`);
  },

  savePipelineConfig(pipelineConfig) {
    return request(`/aesthetic-wellness/pipeline-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineConfig }),
    });
  },

  getLocations() {
    return request(`/aesthetic-wellness/locations`);
  },

  createLocation(payload) {
    return request(`/aesthetic-wellness/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateLocation(id, payload) {
    return request(`/aesthetic-wellness/locations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getProviders(locationId) {
    return request(`/aesthetic-wellness/providers${buildQuery({ location_id: locationId })}`);
  },

  createProvider(payload) {
    return request(`/aesthetic-wellness/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateProvider(id, payload) {
    return request(`/aesthetic-wellness/providers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getTreatments() {
    return request(`/aesthetic-wellness/treatments`);
  },

  createTreatment(payload) {
    return request(`/aesthetic-wellness/treatments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateTreatment(id, payload) {
    return request(`/aesthetic-wellness/treatments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};

export default aestheticWellnessApi;
