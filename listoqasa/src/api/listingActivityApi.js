import apiClient from './apiClient';

// Random per-tab browser session key; never transmit visitor IP, email or phone.
function sessionKey() {
  const key = 'listoqasa_listing_session';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}

export async function recordListingActivity(id, type, channel) {
  if (!id) return;
  return apiClient.request(`/platform/public-listings/${encodeURIComponent(id)}/activity`, {
    method: 'POST',
    body: JSON.stringify({ type, ...(type === 'view' ? { sessionKey: sessionKey() } : {}), ...(type === 'contact_click' ? { channel } : {}) }),
  });
}
