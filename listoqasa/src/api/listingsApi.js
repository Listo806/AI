const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://backend.cortexaaicrm.com/api").replace(/\/+$/, "");
const PUBLIC_LISTINGS_URL = `${API_BASE_URL}/properties/public`;

function resolveItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

async function requestPublicListings(params = {}, signal) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });

  const response = await fetch(`${PUBLIC_LISTINGS_URL}?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) throw new Error(`Failed to load public listings: ${response.status} ${response.statusText}`);

  const payload = await response.json();
  return {
    items: resolveItems(payload),
    total: Number(payload?.total ?? payload?.data?.total ?? 0),
    limit: Number(payload?.limit ?? payload?.data?.limit ?? params.limit ?? 20),
    offset: Number(payload?.offset ?? payload?.data?.offset ?? params.offset ?? 0),
  };
}

export function getNewListings({ limit = 6, signal } = {}) {
  return requestPublicListings({ limit, offset: 0 }, signal);
}

export function getLuxuryListings({ limit = 6, signal } = {}) {
  return requestPublicListings({ limit, offset: 30 }, signal);
}

export function searchListings({ search, city, propertyType, mode, country = "ecuador", limit = 20, offset = 0 } = {}, signal) {
  return requestPublicListings({ search, city, propertyType, mode, country, limit, offset }, signal);
}

export { requestPublicListings };
