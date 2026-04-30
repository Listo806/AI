/**
 * Pipeline / Deals API – CRUD and stage updates for CRM deals
 * Optional: teamId (owners with multiple teams), assignedTo: 'me' for my deals
 */
import apiClient from './apiClient';

const DEALS_BASE = '/crm/deals';

export async function getDeals(options = {}) {
  const { teamId, assignedTo } = options;
  const params = new URLSearchParams();
  if (teamId) params.set('teamId', teamId);
  if (assignedTo === 'me') params.set('assignedTo', 'me');
  const qs = params.toString();
  const url = qs ? `${DEALS_BASE}?${qs}` : DEALS_BASE;
  const res = await apiClient.request(url);
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function getDeal(id) {
  return apiClient.request(`${DEALS_BASE}/${id}`);
}

export async function createDeal(payload) {
  return apiClient.request(DEALS_BASE, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      value: payload.value ?? 0,
      stage: payload.stage ?? 'new',
      position: payload.position ?? 0,
      leadId: payload.leadId ?? undefined,
      teamId: payload.teamId ?? undefined,
      assignedTo: payload.assignedTo ?? undefined,
      notes: payload.notes ?? undefined,
    }),
  });
}

export async function updateDeal(id, payload) {
  return apiClient.request(`${DEALS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateDealStage(id, stage, position = 0) {
  return apiClient.request(`${DEALS_BASE}/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, position }),
  });
}

export async function deleteDeal(id) {
  return apiClient.request(`${DEALS_BASE}/${id}`, {
    method: 'DELETE',
  });
}
