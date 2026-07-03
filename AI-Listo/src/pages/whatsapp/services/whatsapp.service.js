import apiClient from "../../../api/apiClient";

const unwrap = (res) => res?.data || res || null;

export const whatsappService = {
  async getStatus() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/status", {
        method: "GET",
      }),
    );
  },

  async getPendingQr() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/pending-qr", {
        method: "GET",
      }),
    );
  },

  async connect() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/connect", {
        method: "POST",
      }),
    );
  },

  async disconnect() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/disconnect", {
        method: "POST",
      }),
    );
  },

  async getConversations() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/conversations", {
        method: "GET",
      }),
    );
  },

  async getMessages(contactPhone, limit = 50) {
    return unwrap(
      await apiClient.request(
        `/whatsapp-qr/conversations/${encodeURIComponent(contactPhone)}/messages?limit=${limit}`,
        {
          method: "GET",
        },
      ),
    );
  },

  async sendMessage(contactPhone, message) {
    return unwrap(
      await apiClient.request("/whatsapp-qr/send", {
        method: "POST",
        body: JSON.stringify({
          contactPhone,
          message,
        }),
      }),
    );
  },

  async toggleAi(contactPhone, aiEnabled) {
    return unwrap(
      await apiClient.request(
        `/whatsapp-qr/conversations/${encodeURIComponent(contactPhone)}/toggle-ai`,
        {
          method: "POST",
          body: JSON.stringify({
            aiEnabled,
          }),
        },
      ),
    );
  },

  async getDashboard() {
    return unwrap(
      await apiClient.request("/whatsapp-qr/dashboard", {
        method: "GET",
      }),
    );
  },

  async getConversationIntelligence(contactPhone) {
    return unwrap(
      await apiClient.request(
        `/whatsapp-qr/conversations/${encodeURIComponent(
          contactPhone,
        )}/intelligence`,
        {
          method: "GET",
        },
      ),
    );
  },
};
