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

  // Drive the REAL WhatsApp bot (qualification + booking) against a per-team
  // simulator lead — no phone, nothing sent. Shaped to match runAgentTest so the
  // Test AI modal renders it unchanged.
  async simulateAgent(message) {
    const r = await request("/ai-booking/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    const content = r?.reply || r?.note || "The AI Agent returned no response.";
    return {
      success: true,
      answer: content,
      sessionId: "sim",
      conversationId: "sim",
      userMessage: {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
      },
      assistantMessage: {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
      },
      bookingEnabled: r?.bookingEnabled,
      leadState: r?.leadState,
    };
  },

  resetAgentSim() {
    return request("/ai-booking/simulate/reset", { method: "POST" });
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

  // payload may include activeContext (leads, pipeline, contacts, etc.).
  // Backend uses it only as a CRM module focus;
  // industry context remains account-driven.
  sendChatMessage(payload) {
    return request("/ai-center/agent/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getKnowledge(params = {}) {
    return request(`/ai-center/agent/knowledge${buildQuery(params)}`, {
      method: "GET",
    });
  },

  getKnowledgeItem(id) {
    return request(`/ai-center/agent/knowledge/items/${id}`, {
      method: "GET",
    });
  },

  createKnowledgeItem(payload) {
    return request("/ai-center/agent/knowledge/items", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  updateKnowledgeItem(id, payload) {
    return request(`/ai-center/agent/knowledge/items/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });
  },

  deleteKnowledgeItem(id) {
    return request(`/ai-center/agent/knowledge/items/${id}`, {
      method: "DELETE",
    });
  },

  searchKnowledge(query, limit = 8) {
    return request(
      `/ai-center/agent/knowledge/search${buildQuery({
        query,
        limit,
      })}`,
      {
        method: "GET",
      },
    );
  },

  importKnowledge(items) {
    return request("/ai-center/agent/knowledge/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
      }),
    });
  },

  getActivityFeed(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value);
      }
    });

    return request(`/ai-center/agent/activity-feed?${query.toString()}`);
  },

  getActivityDetail(id) {
    return request(`/ai-center/agent/activity-feed/${id}`);
  },

  exportActivityCsv(params = {}) {
    return request(
      `/ai-center/agent/activity-feed/export${buildQuery(params)}`,
      {
        method: "GET",
      },
    );
  },

  getActivityDetail(id) {
    return request(`/ai-center/agent/activity-feed/${id}`, {
      method: "GET",
    });
  },
};

export default aiAgentSetupService;
