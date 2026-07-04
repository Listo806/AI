/**
 * Property-related API (images, media, team) using apiClient
 */
import apiClient from "./apiClient";

const MAX_IMAGES_PER_PROPERTY = 20;

export { MAX_IMAGES_PER_PROPERTY };

export async function getPropertyMedia(propertyId) {
  const res = await apiClient.request(`/properties/${propertyId}/media`);
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export async function addPropertyMedia(
  propertyId,
  { url, type = "image", isPrimary = false, displayOrder },
) {
  const body = { url, type };
  if (isPrimary !== undefined) body.isPrimary = isPrimary;
  if (displayOrder !== undefined) body.displayOrder = displayOrder;
  return apiClient.request(`/properties/${propertyId}/media`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePropertyMedia(
  propertyId,
  mediaId,
  { isPrimary, displayOrder },
) {
  const body = {};
  if (isPrimary !== undefined) body.isPrimary = isPrimary;
  if (displayOrder !== undefined) body.displayOrder = displayOrder;
  return apiClient.request(`/properties/${propertyId}/media/${mediaId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deletePropertyMedia(propertyId, mediaId) {
  return apiClient.request(`/properties/${propertyId}/media/${mediaId}`, {
    method: "DELETE",
  });
}

/** Upload file to S3 then add as property media. Folder: properties/{propertyId}/images/ */
export async function uploadPropertyImage(propertyId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", `properties/${propertyId}/images/`);
  const uploadRes = await apiClient.request("/integrations/storage/upload", {
    method: "POST",
    body: formData,
  });
  const url = uploadRes?.url ?? uploadRes?.data?.url;
  if (!url) throw new Error("Upload did not return URL");
  return addPropertyMedia(propertyId, { url, type: "image", isPrimary: false });
}

export async function setPropertyThumbnail(propertyId, thumbnailUrl) {
  return apiClient.request(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify({ thumbnailUrl: thumbnailUrl || null }),
  });
}

export async function getProperties(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const qs = query.toString();

  const res = await apiClient.request(`/properties${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });

  return res?.data || res;
}

export async function getPropertiesDashboard(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const qs = query.toString();

  const res = await apiClient.request(
    `/properties/dashboard${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
    },
  );

  return res?.data || res;
}

export async function createProperty(payload) {
  const res = await apiClient.request("/properties", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res?.data || res;
}

export async function publishProperty(propertyId) {
  const res = await apiClient.request(`/properties/${propertyId}/publish`, {
    method: "POST",
  });
  return res?.data || res;
}

export async function deleteProperty(propertyId) {
  const res = await apiClient.request(`/properties/${propertyId}`, {
    method: "DELETE",
  });
  return res?.data || res;
}

export async function updateProperty(propertyId, payload) {
  const res = await apiClient.request(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return res?.data || res;
}

export async function getPropertyById(propertyId) {
  const res = await apiClient.request(`/properties/${propertyId}`, {
    method: "GET",
  });

  return res?.data || res;
}
