/**
 * Agent Instagram: Meta app settings, connect, status, conversations, messages
 */
import apiClient from './apiClient';

const BASE = '/agent/instagram';

export async function getCallbackUrl() {
  const res = await apiClient.request(`${BASE}/callback-url`);
  return res?.callbackUrl ?? '';
}

export async function getAppSettings() {
  const res = await apiClient.request(`${BASE}/app-settings`);
  return { hasCredentials: res?.hasCredentials === true };
}

export async function saveAppSettings(appId, appSecret) {
  await apiClient.request(`${BASE}/app-settings`, {
    method: 'POST',
    body: JSON.stringify({ appId: String(appId).trim(), appSecret: String(appSecret).trim() }),
  });
}

export async function getInstagramAuthUrl() {
  const res = await apiClient.request(`${BASE}/auth-url`);
  return res?.url ?? res?.data?.url ?? null;
}

export async function getInstagramStatus() {
  const res = await apiClient.request(BASE);
  const data = res?.data ?? res;
  return {
    connected: data?.connected === true,
    instagramUsername: data?.instagramUsername ?? null,
  };
}

export async function disconnectInstagram() {
  await apiClient.request(BASE + '/disconnect', { method: 'DELETE' });
}

export async function getInstagramConversations() {
  const res = await apiClient.request(`${BASE}/conversations`);
  const data = Array.isArray(res?.data) ? res.data : [];
  return data;
}

export async function getInstagramLeadMessages(leadId) {
  const res = await apiClient.request(`${BASE}/leads/${leadId}/messages`);
  return Array.isArray(res?.data) ? res.data : [];
}

export async function sendInstagramDm(leadId, message) {
  const res = await apiClient.request('/instagram/send', {
    method: 'POST',
    body: JSON.stringify({ leadId, message }),
  });
  return res?.data ?? res;
}
