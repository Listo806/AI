/**
 * Canonical amenity catalog. Mirrors backend src/properties/amenities.constants.ts.
 * To add an amenity: append here AND in the backend constants file.
 */
export const AMENITIES = [
  { slug: 'wifi',             label: 'WiFi',              icon: '📶' },
  { slug: 'kitchen',          label: 'Kitchen',           icon: '🍳' },
  { slug: 'air_conditioning', label: 'Air conditioning',  icon: '❄️' },
  { slug: 'heating',          label: 'Heating',           icon: '🔥' },
  { slug: 'pool',             label: 'Pool',              icon: '🏊' },
  { slug: 'hot_tub',          label: 'Hot tub',           icon: '♨️' },
  { slug: 'parking',          label: 'Parking',           icon: '🚗' },
  { slug: 'tv',               label: 'TV',                icon: '📺' },
  { slug: 'washer',           label: 'Washer',            icon: '🧺' },
  { slug: 'dryer',            label: 'Dryer',             icon: '👕' },
  { slug: 'workspace',        label: 'Workspace',         icon: '💻' },
  { slug: 'bbq',              label: 'BBQ grill',         icon: '🍖' },
  { slug: 'beach_access',     label: 'Beach access',      icon: '🏖️' },
  { slug: 'pets_allowed',     label: 'Pets allowed',      icon: '🐶' },
  { slug: 'gym',              label: 'Gym',               icon: '🏋️' },
  { slug: 'breakfast',        label: 'Breakfast',         icon: '🥐' },
  { slug: 'balcony',          label: 'Balcony',           icon: '🌅' },
  { slug: 'fireplace',        label: 'Fireplace',         icon: '🔥' },
  { slug: 'smoke_alarm',      label: 'Smoke alarm',       icon: '🚨' },
  { slug: 'first_aid',        label: 'First aid kit',     icon: '🩹' },
];

const BY_SLUG = AMENITIES.reduce((acc, a) => ((acc[a.slug] = a), acc), {});

/** Get amenity object by slug (returns null if unknown) */
export function getAmenity(slug) {
  return BY_SLUG[slug] || null;
}

/** Format an amenity for compact display: "📶 WiFi" */
export function formatAmenity(slug) {
  const a = BY_SLUG[slug];
  if (!a) return null;
  return `${a.icon} ${a.label}`;
}
