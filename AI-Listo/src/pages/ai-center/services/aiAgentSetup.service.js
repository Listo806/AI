import apiClient from "../../../api/apiClient";

const unwrapResponse = (response) => {
  return response?.data ?? response ?? null;
};

const request = async (url, options = {}) => {
  const response = await apiClient.request(url, options);

  return unwrapResponse(response);
};

export const aiAgentSetupService = {
  async getBusinessProfile() {
    return request("/ai-center/agent/business-profile", {
      method: "GET",
    });
  },

  async saveBusinessProfile(payload) {
    return request("/ai-center/agent/business-profile", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  async getSetup() {
    return request("/ai-center/agent/setup", {
      method: "GET",
    });
  },

  async updateSetup(payload) {
    return request("/ai-center/agent/setup", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },
};

export default aiAgentSetupService;