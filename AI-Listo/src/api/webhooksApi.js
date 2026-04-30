import apiClient from './apiClient';

const webhooksApi = {
  // ── Webhook Endpoints CRUD ────────────────────────────────────────
  getWebhooks() {
    return apiClient.request('/webhooks');
  },

  getWebhook(id) {
    return apiClient.request(`/webhooks/${id}`);
  },

  createWebhook(data) {
    return apiClient.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWebhook(id, data) {
    return apiClient.request(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleWebhook(id) {
    return apiClient.request(`/webhooks/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  deleteWebhook(id) {
    return apiClient.request(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  },

  testWebhook(id) {
    return apiClient.request(`/webhooks/${id}/test`, {
      method: 'POST',
    });
  },

  // ── Webhook Logs ──────────────────────────────────────────────────
  getWebhookLogs(limit = 50, offset = 0) {
    return apiClient.request(`/webhooks/logs?limit=${limit}&offset=${offset}`);
  },

  // ── Email Provider (SendGrid) ─────────────────────────────────────
  getEmailConfig() {
    return apiClient.request('/integrations/email/config');
  },

  saveEmailConfig(data) {
    return apiClient.request('/integrations/email/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendTestEmail() {
    return apiClient.request('/integrations/email/test', {
      method: 'POST',
    });
  },
};

export default webhooksApi;
