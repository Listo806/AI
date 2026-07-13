import apiClient from "../../../api/apiClient";

const unwrapResponse = (response) => {
  return response?.data ?? response ?? null;
};

const request = async (url, options = {}) => {
  const response = await apiClient.request(url, options);
  return unwrapResponse(response);
};

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};

export const aiAgentSetupService = {
  // ==========================
  // AI Agent Setup
  // ==========================

  getSetup() {
    return request("/ai-center/agent/setup", {
      method: "GET",
    });
  },

  updateSetup(payload) {
    return request("/ai-center/agent/setup", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  // ==========================
  // Business Profile
  // ==========================

  getBusinessProfile() {
    return request("/ai-center/agent/business-profile", {
      method: "GET",
    });
  },

  saveBusinessProfile(payload) {
    return request("/ai-center/agent/business-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  // ==========================
  // Property Catalog
  // ==========================

  getPropertyCatalog(params = {}) {
    return request(`/ai-center/agent/property-catalog${buildQuery(params)}`, {
      method: "GET",
    });
  },

  savePropertyCatalog(propertyIds) {
    return request("/ai-center/agent/property-catalog", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        propertyIds,
      }),
    });
  },

  // ==========================
  // Knowledge Base
  // ==========================

  getKnowledgeBase() {
    return request("/ai-center/agent/knowledge", {
      method: "GET",
    });
  },

  saveKnowledgeBase(payload) {
    return request("/ai-center/agent/knowledge", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  // ==========================
  // Test AI
  // ==========================

  testAgent(payload) {
    return request("/ai-center/agent/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  getAppointmentRules() {
    return request("/ai-center/agent/appointment-rules", {
      method: "GET",
    });
  },

  saveAppointmentRules(payload) {
    return request("/ai-center/agent/appointment-rules", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  getBehavior() {
    return request("/ai-center/agent/behavior", {
      method: "GET",
    });
  },

  saveBehavior(payload) {
    return request("/ai-center/agent/behavior", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  getAutomations() {
    return request("/ai-center/agent/automations", {
      method: "GET",
    });
  },

  saveAutomations(payload) {
    return request("/ai-center/agent/automations", {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  getAgentTest() {
    return request("/ai-center/agent/test", {
      method: "GET",
    });
  },

  createAgentTestSession() {
    return request("/ai-center/agent/test/sessions", {
      method: "POST",
    });
  },

  runAgentTest(message, sessionId) {
    return request("/ai-center/agent/test", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message,
        sessionId: sessionId || undefined,
      }),
    });
  },

  getChatSessions(limit = 20) {
    return request(`/ai-center/agent/chat/sessions?limit=${limit}`, {
      method: "GET",
    });
  },

  createChatSession() {
    return request("/ai-center/agent/chat/sessions", {
      method: "POST",
    });
  },

  getChatSession(sessionId) {
    return request(`/ai-center/agent/chat/sessions/${sessionId}`, {
      method: "GET",
    });
  },

  sendChatMessage(payload) {
    return request("/ai-center/agent/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
};

export default aiAgentSetupService;
