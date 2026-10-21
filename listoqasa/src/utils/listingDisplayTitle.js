// Display-only cleanup. Original titles and sample disclosure remain in stored records.
export function listingDisplayTitle(value) {
  return String(value || '').replace(/\s+de\s+ejemplo\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}
