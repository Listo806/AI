const API_BASE = (import.meta.env.VITE_API_URL || 'https://backend.cortexaaicrm.com/api').replace(/\/+$/, '');
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function propertyImageUrl(value) {
  if (!value) return '';
  if (Array.isArray(value)) return propertyImageUrl(value[0]);
  if (typeof value === 'object') return propertyImageUrl(value.url || value.fileUrl || value.file_url || value.secure_url || value.src || value.path || value.imageUrl);
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url) || url.startsWith('blob:')) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  return `${API_ORIGIN}/${url.replace(/^\/+/, '')}`;
}

export function propertyCoverImage(item) {
  return propertyImageUrl(item?.thumbnailUrl || item?.thumbnail_url || item?.coverImage || item?.cover_image || item?.imageUrl || item?.image_url || item?.image || item?.photos || item?.images || item?.media);
}

export function isPublicMarketplaceProperty(item) {
  if (!item?.id) return false;
  const status = String(item.status || item.publicationStatus || item.publication_status || '').toLowerCase();
  if (['draft', 'rejected', 'archived', 'deleted', 'inactive', 'unpublished'].includes(status)) return false;
  if (item.isTest === true || item.is_test === true || item.test === true) return false;
  return true;
}

export function matchesMarketplaceSection(item, section) {
  const kind = String(item.propertyType || item.property_type || item.category || '').toLowerCase();
  const mode = String(item.mode || item.listingType || item.listing_type || item.type || '').toLowerCase();
  if (section === 'land') return /land|lot|terrain|terreno|plot/.test(kind);
  if (section === 'commercial') return /commercial|office|retail|industrial|warehouse|local comercial/.test(kind);
  if (section === 'rent') return /rent|rental|alquiler|arriendo/.test(mode);
  if (section === 'new') return item.isNewProject === true || item.is_new_project === true || item.projectId != null || item.project_id != null || /new.project|development|project|proyecto/.test(kind);
  return true;
}


// Strict type-based collections: never label an office, warehouse or land as a home.
export function isResidentialProperty(item) {
  const kind = listingKind(item);
  return /^(house|single.family|single_family|casa|home|apartment|apartamento|departamento|flat|villa|condo|condominium|penthouse|townhouse|duplex)$/.test(kind);
}

export function isLuxuryResidentialProperty(item) {
  if (!isResidentialProperty(item)) return false;
  if (listingKind(item) === 'penthouse') return true;
  const price = Number(item.price);
  const kind = listingKind(item);
  if (listingMode(item) === 'sale' && Number.isFinite(price) && price >= 300000 &&
      /^(house|home|casa|villa|condo|condominium|apartment|apartamento|departamento)$/.test(kind)) return true;
  const tags = [item.title, item.description, item.category, item.tags?.join?.(' ')]
    .filter(Boolean).join(' ').toLowerCase();
  return item.isLuxury === true || item.is_luxury === true || item.luxury === true || String(item.luxuryDesignation || item.luxury_designation || '').toLowerCase() === 'luxury' ||
    /\b(luxury|lujo|luxo|premium|exclusive|exclusiv[ao]|penthouse|mansion|mansión)\b/.test(tags);
}

export function isDevelopmentProject(item) {
  const kind = String(item?.propertyType || item?.property_type || '').toLowerCase();
  const label = [item?.title, item?.description].filter(Boolean).join(' ').toLowerCase();
  return item?.isNewProject === true || item?.is_new_project === true ||
    item?.projectId != null || item?.project_id != null ||
    /\b(development|construction|project|proyecto|projeto|construcci[oó]n|desarrollo inmobiliario)\b/.test(label) ||
    /project|development/.test(kind);
}

// Curate actual listing records; do not replace photos with unrelated stock images.
export function listingKind(item) {
  return String(item?.propertyType || item?.property_type || item?.propertyCategory || item?.property_category || item?.category || '').trim().toLowerCase();
}
export function listingMode(item) {
  const mode = String(item?.mode || item?.listingType || item?.listing_type || item?.type || item?.transactionType || item?.transaction_type || '').toLowerCase();
  return /rent|rental|alquiler|arriendo|lease/.test(mode) ? 'rent' : 'sale';
}
export function listingTimestamp(item) {
  const value = item?.publishedAt || item?.published_at || item?.createdAt || item?.created_at;
  const n = Date.parse(value || ''); return Number.isFinite(n) ? n : 0;
}
export function diverseListings(items, limit = 6, categoryOf = listingKind) {
  const buckets = new Map();
  for (const item of items) {
    const key = categoryOf(item) || 'other';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  const result = [];
  while (result.length < limit && [...buckets.values()].some(group => group.length)) {
    for (const group of buckets.values()) {
      if (result.length >= limit) break;
      if (group.length) result.push(group.shift());
    }
  }
  return result;
}
export function hasListingPhoto(item) { return Boolean(propertyCoverImage(item)); }

// A representative photo must belong to the actual listing, never to a different property.
export function listingPhotos(item) {
  const candidates = [item?.photos, item?.images, item?.media, item?.gallery, item?.coverImage, item?.cover_image, item?.thumbnailUrl, item?.imageUrl, item?.image];
  const urls = [];
  for (const source of candidates) {
    for (const value of Array.isArray(source) ? source : source ? [source] : []) {
      const url = propertyImageUrl(value);
      if (url && !urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}
export function selectRepresentativePhoto(item, usedPhotos = new Set()) {
  const photos = listingPhotos(item);
  const best = photos.find(url => !usedPhotos.has(url)) || photos[0] || '';
  if (best) usedPhotos.add(best);
  return best;
}
export function selectBalancedListings(items, limit = 6, groupBy = listingKind) {
  const sorted = [...items].sort((a,b)=>listingTimestamp(b)-listingTimestamp(a));
  const buckets = new Map();
  for (const item of sorted) {
    const key = groupBy(item) || 'other';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  const result = [], seenImages = new Set();
  while (result.length < limit && [...buckets.values()].some(group => group.length)) {
    for (const group of buckets.values()) {
      if (result.length >= limit) break;
      const candidate = group.find(item => listingPhotos(item).some(photo=>!seenImages.has(photo))) || group[0];
      if (!candidate) continue;
      group.splice(group.indexOf(candidate),1);
      selectRepresentativePhoto(candidate,seenImages);
      result.push(candidate);
    }
  }
  return result;
}
