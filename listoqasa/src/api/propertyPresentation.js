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
