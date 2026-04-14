/**
 * Canonical list of vacation rental amenities.
 * Frontend mirrors this list (slug + label + emoji icon).
 * To add an amenity: append the slug here AND in AI-Listo/src/lib/amenities.js.
 */
export const VACATION_AMENITY_SLUGS = [
  'wifi',
  'kitchen',
  'air_conditioning',
  'heating',
  'pool',
  'hot_tub',
  'parking',
  'tv',
  'washer',
  'dryer',
  'workspace',
  'bbq',
  'beach_access',
  'pets_allowed',
  'gym',
  'breakfast',
  'balcony',
  'fireplace',
  'smoke_alarm',
  'first_aid',
] as const;

export type VacationAmenitySlug = (typeof VACATION_AMENITY_SLUGS)[number];

export function isValidAmenitySlug(slug: string): slug is VacationAmenitySlug {
  return (VACATION_AMENITY_SLUGS as readonly string[]).includes(slug);
}

export function sanitizeAmenities(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const s = raw.trim().toLowerCase();
    if (!s || seen.has(s)) continue;
    if (!isValidAmenitySlug(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
