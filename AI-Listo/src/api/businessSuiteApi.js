import apiClient from "./apiClient";

function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") p.set(key, String(value));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

const endpointByType = {
  task: "tasks",
  followUp: "follow-ups",
  workItem: "work-items",
  estimate: "estimates",
  invoice: "invoices",
  payment: "payments",
  expense: "expenses",
  product: "products",
  service: "services",
  priceList: "price-lists",
  category: "categories",
  company: "companies",
  customerGroup: "customer-groups",
  segment: "segments",
};

const businessSuiteApi = {
  overview: () => apiClient.request("/business-suite/overview"),
  reports: (params = {}) => apiClient.request(`/business-suite/reports${qs(params)}`),
  activity: (params = {}) => apiClient.request(`/business-suite/activity${qs(params)}`),
  settings: () => apiClient.request("/business-suite/settings"),
  updateSettings: (body) => apiClient.request("/business-suite/settings", { method: "PATCH", body: JSON.stringify(body) }),
  customersSummary: () => apiClient.request("/business-suite/customers-summary"),
  customers: (params = {}) => apiClient.request(`/business-suite/customers${qs(params)}`),
  documents: (params = {}) => apiClient.request(`/business-suite/documents${qs(params)}`),
  list(type, params = {}) {
    const ep = endpointByType[type];
    if (!ep) throw new Error(`Unsupported Business Suite type: ${type}`);
    return apiClient.request(`/business-suite/${ep}${qs(params)}`);
  },
  create(type, body) {
    const ep = endpointByType[type];
    if (!ep) throw new Error(`Unsupported Business Suite type: ${type}`);
    return apiClient.request(`/business-suite/${ep}`, { method: "POST", body: JSON.stringify(body) });
  },
  update(type, id, body) {
    const ep = endpointByType[type];
    if (!ep) throw new Error(`Unsupported Business Suite type: ${type}`);
    return apiClient.request(`/business-suite/${ep}/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  remove(type, id) {
    const ep = endpointByType[type];
    if (!ep) throw new Error(`Unsupported Business Suite type: ${type}`);
    return apiClient.request(`/business-suite/${ep}/${id}`, { method: "DELETE" });
  },
  convertEstimate(id) {
    return apiClient.request(`/business-suite/estimates/${id}/convert-to-invoice`, { method: "POST" });
  },
};

export default businessSuiteApi;
