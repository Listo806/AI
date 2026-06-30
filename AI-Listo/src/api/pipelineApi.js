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

export async function updateDealStage(id, stage, position = 0) {
  return apiClient.request(`${DEALS_BASE}/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage, position }),
  });
}

export const getPipeline = async () => {
  const res = await apiClient.get("/pipeline");
  return res.data;
};

export const getPipelineSummary = async () => {
  const res = await apiClient.get("/pipeline/summary");
  return res.data;
};

export const createDeal = async (payload) => {
  const res = await apiClient.post("/pipeline/deals", payload);
  return res.data;
};

export const updateDeal = async (dealId, payload) => {
  const res = await apiClient.patch(`/pipeline/deals/${dealId}`, payload);
  return res.data;
};

export const moveDeal = async (dealId, payload) => {
  const res = await apiClient.patch(`/pipeline/deals/${dealId}/move`, payload);
  return res.data;
};

export const deleteDeal = async (dealId) => {
  const res = await apiClient.delete(`/pipeline/deals/${dealId}`);
  return res.data;
};
