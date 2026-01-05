import apiClient from './apiClient';

/**
 * Properties API Service
 * Handles all property-related API calls
 */

/**
 * Get properties with optional filters and bounding box
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by type (sale, rent)
 * @param {string} options.status - Filter by status
 * @param {string} options.search - Search text for address, city, state, title, description
 * @param {Object} options.bbox - Bounding box {west, south, east, north}
 * @returns {Promise} Response with properties array
 */
export const getProperties = async (options = {}) => {
  const params = {};
  if (options.type) params.type = options.type;
  if (options.status) params.status = options.status;
  if (options.search) params.search = options.search;
  if (options.bbox) {
    params.west = options.bbox.west;
    params.south = options.bbox.south;
    params.east = options.bbox.east;
    params.north = options.bbox.north;
  }

  const response = await apiClient.get('/properties', { params });
  return response.data;
};

/**
 * Get property by ID
 * @param {string} id - Property ID
 * @returns {Promise} Response with property object
 */
export const getProperty = async (id) => {
  const response = await apiClient.get(`/properties/${id}`);
  return response.data;
};
