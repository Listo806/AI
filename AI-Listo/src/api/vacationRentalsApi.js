import apiClient from './apiClient';

/**
 * Public vacation search — backend always enforces listing_type = vacation.
 */
export async function searchVacationRentals({
  city,
  checkIn,
  checkOut,
  search,
  minPrice,
  maxPrice,
  bedrooms,
  bathrooms,
  propertyType,
  sort,
  limit = 20,
  offset = 0,
} = {}) {
  const q = new URLSearchParams();
  if (city?.trim()) q.set('city', city.trim());
  if (checkIn) q.set('checkIn', checkIn);
  if (checkOut) q.set('checkOut', checkOut);
  if (search?.trim()) q.set('search', search.trim());
  if (minPrice != null && minPrice !== '') q.set('minPrice', String(minPrice));
  if (maxPrice != null && maxPrice !== '') q.set('maxPrice', String(maxPrice));
  if (bedrooms != null && bedrooms !== '') q.set('bedrooms', String(bedrooms));
  if (bathrooms != null && bathrooms !== '') q.set('bathrooms', String(bathrooms));
  if (propertyType?.trim()) q.set('propertyType', propertyType.trim());
  if (sort && sort !== 'recommended') q.set('sort', String(sort));
  q.set('limit', String(limit));
  q.set('offset', String(offset));
  return apiClient.request(`/vacation-rentals/search?${q.toString()}`);
}
