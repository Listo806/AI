/**
 * Property-related API (list, CRUD, images, media, team) using apiClient
 */
import apiClient from './apiClient';

const MAX_IMAGES_PER_PROPERTY = 20;

export { MAX_IMAGES_PER_PROPERTY };

/**
 * List properties for the current user/team.
 * Backend: GET /properties -> { items, total, limit, offset }.
 * @param {{ type?, status?, search?, limit?, offset? }} [opts]
 */
export async function getProperties(opts = {}) {
  const qs = new URLSearchParams();
  ['type', 'status', 'search', 'limit', 'offset'].forEach((k) => {
    if (opts[k] !== undefined && opts[k] !== null && opts[k] !== '') {
      qs.append(k, opts[k]);
    }
  });
  const query = qs.toString();
  const res = await apiClient.request(`/properties${query ? `?${query}` : ''}`);
  // Normalise: controller returns { items, total, limit, offset }
  if (Array.isArray(res)) return { items: res, total: res.length, limit: res.length, offset: 0 };
  return {
    items: res?.items ?? res?.data ?? [],
    total: res?.total ?? 0,
    limit: res?.limit ?? 0,
    offset: res?.offset ?? 0,
  };
}

export async function getProperty(propertyId) {
  return apiClient.request(`/properties/${propertyId}`);
}

export async function createProperty(payload) {
  return apiClient.request('/properties', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProperty(propertyId, payload) {
  return apiClient.request(`/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function publishProperty(propertyId) {
  return apiClient.request(`/properties/${propertyId}/publish`, { method: 'POST' });
}

export async function deleteProperty(propertyId) {
  return apiClient.request(`/properties/${propertyId}`, { method: 'DELETE' });
}

export async function getPropertyMedia(propertyId) {
  const res = await apiClient.request(`/properties/${propertyId}/media`);
  return Array.isArray(res) ? res : res?.data ?? [];
}

export async function addPropertyMedia(propertyId, { url, type = 'image', isPrimary = false, displayOrder }) {
  const body = { url, type };
  if (isPrimary !== undefined) body.isPrimary = isPrimary;
  if (displayOrder !== undefined) body.displayOrder = displayOrder;
  return apiClient.request(`/properties/${propertyId}/media`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePropertyMedia(propertyId, mediaId, { isPrimary, displayOrder }) {
  const body = {};
  if (isPrimary !== undefined) body.isPrimary = isPrimary;
  if (displayOrder !== undefined) body.displayOrder = displayOrder;
  return apiClient.request(`/properties/${propertyId}/media/${mediaId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deletePropertyMedia(propertyId, mediaId) {
  return apiClient.request(`/properties/${propertyId}/media/${mediaId}`, {
    method: 'DELETE',
  });
}

/** Upload file to S3 then add as property media. Folder: properties/{propertyId}/images/ */
export async function uploadPropertyImage(propertyId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `properties/${propertyId}/images/`);
  const uploadRes = await apiClient.request('/integrations/storage/upload', {
    method: 'POST',
    body: formData,
  });
  const url = uploadRes?.url ?? uploadRes?.data?.url;
  if (!url) throw new Error('Upload did not return URL');
  return addPropertyMedia(propertyId, { url, type: 'image', isPrimary: false });
}

export async function setPropertyThumbnail(propertyId, thumbnailUrl) {
  return apiClient.request(`/properties/${propertyId}`, {
    method: 'PUT',
    body: JSON.stringify({ thumbnailUrl: thumbnailUrl || null }),
  });
}
