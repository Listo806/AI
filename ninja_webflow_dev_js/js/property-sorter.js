/**
 * Property Sorting Logic
 * Sorts properties by newest, price, or distance
 */

class PropertySorter {
  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  static toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Sort properties based on sort type
   * @param {Array} properties - Array of property objects
   * @param {string} sortType - Sort type: 'newest', 'price-low', 'price-high', 'distance'
   * @param {Object} options - Additional options (e.g., userLocation for distance sorting)
   * @returns {Array} Sorted properties
   */
  static sort(properties, sortType = 'newest', options = {}) {
    const sorted = [...properties];

    switch (sortType) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.publishedAt || 0);
          const dateB = new Date(b.createdAt || b.publishedAt || 0);
          return dateB - dateA; // Newest first
        });

      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB; // Low to high
        });

      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA; // High to low
        });

      case 'distance':
        if (!options.userLocation || !options.userLocation.latitude || !options.userLocation.longitude) {
          console.warn('User location not provided for distance sorting');
          return sorted; // Return unsorted if no location
        }

        // Calculate distance for each property and add as temporary property
        const propertiesWithDistance = sorted.map(prop => ({
          ...prop,
          _distance: this.calculateDistance(
            options.userLocation.latitude,
            options.userLocation.longitude,
            prop.latitude,
            prop.longitude
          ),
        }));

        // Sort by distance
        return propertiesWithDistance.sort((a, b) => {
          // Properties without coordinates go to the end
          if (!a.latitude || !a.longitude) return 1;
          if (!b.latitude || !b.longitude) return -1;
          return a._distance - b._distance;
        });

      default:
        return sorted;
    }
  }

  /**
   * Get sort type from form input
   * @param {HTMLElement} container - Container element with sort input
   * @returns {string} Sort type
   */
  static getSortTypeFromForm(container = document) {
    const sortSelect = container.querySelector('#sortBy');
    return sortSelect?.value || 'newest';
  }
}

// Export for use in modules
window.PropertySorter = PropertySorter;
