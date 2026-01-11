import apiClient from './apiClient';

/**
 * Mapbox API Service
 * Handles all mapbox-related API calls
 */

/**
 * Geocode an address to get coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise} Response with latitude, longitude, and placeName
 */
export const geocodeAddress = async (address) => {
  const response = await apiClient.post('/integrations/mapbox/geocode', {
    address,
  });
  return response.data;
};

/**
 * Reverse geocode coordinates to get an address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise} Response with address details
 */
export const reverseGeocode = async (latitude, longitude) => {
  const response = await apiClient.post('/integrations/mapbox/reverse-geocode', {
    latitude,
    longitude,
  });
  return response.data;
};

/**
 * Search for locations
 * @param {string} query - Search query
 * @param {number} lat - Optional latitude for proximity search
 * @param {number} lng - Optional longitude for proximity search
 * @returns {Promise} Response with array of location results
 */
export const searchLocations = async (query, lat = null, lng = null) => {
  const params = new URLSearchParams({ q: query });
  if (lat !== null) params.append('lat', lat);
  if (lng !== null) params.append('lng', lng);
  
  const response = await apiClient.get(`/integrations/mapbox/search?${params.toString()}`);
  return response.data;
};
