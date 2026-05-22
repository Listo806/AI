/**
 * Platform API - Marketplace, VA, and Admin endpoints
 * Used for platform authentication and admin controls (separate from CRM).
 */
import apiClient from './apiClient';

// ============================================================================
// PLATFORM LISTINGS (Agent/Owner/User - submit without CRM)
// ============================================================================

export async function getMyPlatformListings() {
  const res = await apiClient.request('/platform/listings');
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function createPlatformListing(data) {
  const res = await apiClient.request('/platform/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// ============================================================================
// VA LISTINGS (VA_UPLOADER/VA - always PENDING_REVIEW)
// ============================================================================

export async function getMyVaListings() {
  const res = await apiClient.request('/va/listings');
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function createVaListing(data) {
  const res = await apiClient.request('/va/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateVaListing(id, data) {
  const res = await apiClient.request(`/va/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN LISTINGS (Super Admin / Admin)
// ============================================================================

export async function getAdminListings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.origin) params.append('origin', filters.origin);
  if (filters.createdBy) params.append('createdBy', filters.createdBy);
  if (filters.title) params.append('title', filters.title);
  if (filters.uploaderEmail) params.append('uploaderEmail', filters.uploaderEmail);
  const qs = params.toString();
  const res = await apiClient.request(`/admin/listings${qs ? '?' + qs : ''}`);
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminListingById(id) {
  const res = await apiClient.request(`/admin/listings/${id}`);
  return res?.data || res;
}

export async function updateAdminListingStatus(id, status, rejectionReason = null) {
  const body = { status };
  if (rejectionReason != null) body.rejectionReason = rejectionReason;
  const res = await apiClient.request(`/admin/listings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return res?.data || res;
}

export async function updateAdminListing(id, { teamId }) {
  const res = await apiClient.request(`/admin/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ teamId: teamId || null }),
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN USERS (Super Admin / Admin) - Full CRUD
// ============================================================================

export async function getAdminUsers(role = null) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  const res = await apiClient.request(`/admin/users${qs}`);
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminUserById(id) {
  const res = await apiClient.request(`/admin/users/${id}`);
  return res?.data || res;
}

export async function createAdminUser(payload) {
  const res = await apiClient.request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminUser(id, payload) {
  const res = await apiClient.request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminUserRole(id, role) {
  const res = await apiClient.request(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  return res?.data || res;
}

export async function deleteAdminUser(id) {
  const res = await apiClient.request(`/admin/users/${id}`, {
    method: 'DELETE',
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN TEAMS (Super Admin / Admin) - Full CRUD + members
// ============================================================================

export async function getAdminTeams() {
  const res = await apiClient.request('/admin/teams');
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminTeamById(id) {
  const res = await apiClient.request(`/admin/teams/${id}`);
  return res?.data || res;
}

export async function createAdminTeam(payload) {
  const res = await apiClient.request('/admin/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminTeam(id, payload) {
  const res = await apiClient.request(`/admin/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function deleteAdminTeam(id) {
  const res = await apiClient.request(`/admin/teams/${id}`, {
    method: 'DELETE',
  });
  return res?.data || res;
}

export async function addAdminTeamMember(teamId, userId) {
  const res = await apiClient.request(`/admin/teams/${teamId}/members/${userId}`, {
    method: 'POST',
  });
  return res?.data || res;
}

export async function removeAdminTeamMember(teamId, userId) {
  const res = await apiClient.request(`/admin/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  });
  return res?.data || res;
}
/* ======================================================
 OWNER TEAMS
====================================================== */

export async function getTeamDashboard() {
  const res = await apiClient.request('/teams');

  console.log('getTeamDashboard RAW', res);

  return Array.isArray(res)
    ? res
    : res?.data || [];
}

export async function getMyTeams() {
  const res = await apiClient.request('/teams');

  console.log('getMyTeams RAW', res);

  return Array.isArray(res)
    ? res
    : res?.data || [];
}

export async function getTeam(id) {
  const res = await apiClient.request(
    `/teams/${id}`
  );

  return res?.data || res;
}

export async function getTeamSeats(
  teamId
) {
  const res = await apiClient.request(
    `/teams/${teamId}/seats`
  );

  return res?.data || res;
}

export async function getTeamMembers(
  teamId
) {
  const res = await apiClient.request(
    `/teams/${teamId}/members`
  );

  console.log(
    'getTeamMembers RAW',
    res
  );

  /*
    backend:
    return { data: members }
  */

  if (Array.isArray(res)) {
    return res;
  }

  if (Array.isArray(res?.data)) {
    return res.data;
  }

  return [];
}

export async function createTeam(payload) {
  const res = await apiClient.request('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

export async function updateTeam(teamId, payload) {
  const res = await apiClient.request(`/teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

export async function inviteTeamMemberByEmail(teamId, email) {
  const res = await apiClient.request(`/teams/${teamId}/members/invite`, {
    method: 'POST',
    body: JSON.stringify({ email: email?.trim?.() || '' }),
  });
  return res?.data ?? res;
}

export async function addTeamMember(teamId, userId) {
  const res = await apiClient.request(`/teams/${teamId}/members/${userId}`, {
    method: 'POST',
  });
  return res?.data ?? res;
}

export async function removeTeamMember(teamId, userId) {
  const res = await apiClient.request(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  });
  return res?.data ?? res;
}

export async function deleteTeam(teamId) {
  const res = await apiClient.request(`/teams/${teamId}`, {
    method: 'DELETE',
  });
  return res?.data ?? res;
}
