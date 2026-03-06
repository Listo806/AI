/**
 * CRM Contacts API – CRUD for contacts (optional teamId for owners)
 */
import apiClient from './apiClient';

const CONTACTS_BASE = '/crm/contacts';

export async function getContacts(options = {}) {
  const { teamId } = options;
  const url = teamId ? `${CONTACTS_BASE}?teamId=${encodeURIComponent(teamId)}` : CONTACTS_BASE;
  const res = await apiClient.request(url);
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function getContact(id) {
  return apiClient.request(`${CONTACTS_BASE}/${id}`);
}

export async function createContact(payload) {
  return apiClient.request(CONTACTS_BASE, {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      email: payload.email ?? undefined,
      phone: payload.phone ?? undefined,
      leadId: payload.leadId ?? undefined,
      teamId: payload.teamId ?? undefined,
      notes: payload.notes ?? undefined,
    }),
  });
}

export async function updateContact(id, payload) {
  return apiClient.request(`${CONTACTS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteContact(id) {
  return apiClient.request(`${CONTACTS_BASE}/${id}`, {
    method: 'DELETE',
  });
}
