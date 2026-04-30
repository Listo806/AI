import apiClient from './apiClient';

/**
 * Get current user profile (same as used by AuthContext).
 */
export async function getProfile() {
  return apiClient.request('/users/me');
}

/**
 * Update current user profile (name, phone). Returns updated user.
 */
export async function updateProfile(data) {
  return apiClient.request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
