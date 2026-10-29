const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://backend.cortexaaicrm.com/api").replace(/\/+$/, "");
const PUBLIC_LISTINGS_URL = `${API_BASE_URL}/properties/public`;

function resolveItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.data?.properties)) return payload.data.properties;
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

// Fetch both sale and rental listings; API defaults may otherwise exclude rentals.
import { isLuxuryResidentialProperty, isPublicMarketplaceProperty, listingTimestamp, diverseListings, hasListingPhoto, listingKind, listingMode, selectBalancedListings } from './propertyPresentation';
async function homepagePool() {
  const responses = await Promise.allSettled([
    requestPublicListings({country:'ecuador',mode:'sale',limit:100,offset:0}),
    requestPublicListings({country:'ecuador',mode:'rent',limit:100,offset:0}),
  ]);
  if (responses.every(r=>r.status==='rejected')) throw responses[0].reason;
  const seen = new Set();
  return responses.flatMap(r=>r.status==='fulfilled'?r.value.items:[])
    .filter(item=>{if(!isPublicMarketplaceProperty(item)||seen.has(item.id))return false;seen.add(item.id);return true;})
    .sort((a,b)=>listingTimestamp(b)-listingTimestamp(a));
}
let poolPromise = null;
function getHomepagePool() {
  // Do not bind a shared in-flight request to a component AbortSignal.
  // React StrictMode unmounts/remounts effects in development; aborting the
  // first mount must not cancel the request reused by the second mount.
  if (!poolPromise) {
    poolPromise = homepagePool().finally(()=>{poolPromise=null;});
  }
  return poolPromise;
}
export async function getNewListings({limit=8,signal}={}) {
  const items = await getHomepagePool();
  const available = items.filter(hasListingPhoto);
  const selected = selectBalancedListings(available,limit,item=>`${listingKind(item)}:${listingMode(item)}`);
  return {items:selected,total:items.length};
}
export async function getLuxuryListings({limit=8,signal}={}) {
  const items = await getHomepagePool();
  const luxury = items.filter(item=>isLuxuryResidentialProperty(item)&&hasListingPhoto(item));
  return {items:selectBalancedListings(luxury,limit,item=>listingKind(item)),total:luxury.length};
}

export function searchListings({ search, city, propertyType, mode, country = "ecuador", limit = 20, offset = 0 } = {}, signal) {
  return requestPublicListings({ search, city, propertyType, mode, country, limit, offset }, signal);
}

export { requestPublicListings };

// Homepage-specific endpoint: classification happens across the complete published
// inventory on the backend, rather than a truncated first search page.
let homepageCollectionsPromise;
export function getHomepageCollections() {
  if (!homepageCollectionsPromise) {
    homepageCollectionsPromise = fetch(`${API_BASE_URL}/properties/homepage-collections?limit=6`, {
      headers: { Accept: "application/json" },
    }).then(async response => {
      if (!response.ok) throw new Error(`Homepage collections failed: ${response.status}`);
      return response.json();
    }).finally(() => { homepageCollectionsPromise = null; });
  }
  return homepageCollectionsPromise;
}
