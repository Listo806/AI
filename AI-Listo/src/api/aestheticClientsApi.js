import apiClient from "./apiClient";

const qs = (params = {}) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "all") s.set(k, String(v));
  });
  return s.toString() ? `?${s.toString()}` : "";
};

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const request = (path, options) => apiClient.request(path, options);

export const aestheticClientsApi = {
  list: (params) => request(`/aesthetic-wellness/clients${qs(params)}`),
  stats: () => request("/aesthetic-wellness/clients/stats"),
  get: (id) => request(`/aesthetic-wellness/clients/${encodeURIComponent(id)}`),
  create: (body) => request("/aesthetic-wellness/clients", json("POST", body)),
  update: (id, body) =>
    request(`/aesthetic-wellness/clients/${encodeURIComponent(id)}`, json("PATCH", body)),
  archive: (id) =>
    request(`/aesthetic-wellness/clients/${encodeURIComponent(id)}/archive`, json("PATCH", {})),
};

export default aestheticClientsApi;
