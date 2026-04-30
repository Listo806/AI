/**
 * Subscription and plans (no payment gateway - select plan only)
 */
import apiClient from './apiClient';

const BASE = '/subscriptions';

export async function getPlans(activeOnly = true) {
  const list = await apiClient.request(`${BASE}/plans?activeOnly=${activeOnly}`);
  return Array.isArray(list) ? list : list?.data ?? [];
}

export async function getPlan(id) {
  return apiClient.request(`${BASE}/plans/${id}`);
}

export async function getTeamSubscription(teamId) {
  return apiClient.request(`${BASE}/team/${teamId}`);
}

export async function getTeamFeatures(teamId) {
  return apiClient.request(`${BASE}/team/${teamId}/features`);
}

export async function selectPlan(teamId, planId) {
  return apiClient.request(`${BASE}/team/${teamId}/select-plan`, {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

// Admin only
export async function createPlan(body) {
  return apiClient.request(`${BASE}/plans`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePlan(id, body) {
  return apiClient.request(`${BASE}/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deletePlan(id) {
  return apiClient.request(`${BASE}/plans/${id}`, { method: 'DELETE' });
}
