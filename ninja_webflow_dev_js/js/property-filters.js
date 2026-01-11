/**
 * Property Filtering Logic
 * Filters properties based on price range, bedrooms, bathrooms, etc.
 */

class PropertyFilters {
  /**
   * Filter properties based on criteria
   * @param {Array} properties - Array of property objects
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered properties
   */
  static filter(properties, filters = {}) {
    let filtered = [...properties];

    // Filter by price range
    if (filters.priceMin !== undefined && filters.priceMin !== null && filters.priceMin !== '') {
      const minPrice = parseFloat(filters.priceMin);
      filtered = filtered.filter(prop => {
        if (prop.price === null || prop.price === undefined) return false;
        return prop.price >= minPrice;
      });
    }

    if (filters.priceMax !== undefined && filters.priceMax !== null && filters.priceMax !== '') {
      const maxPrice = parseFloat(filters.priceMax);
      filtered = filtered.filter(prop => {
        if (prop.price === null || prop.price === undefined) return false;
        return prop.price <= maxPrice;
      });
    }

    // Filter by bedrooms
    if (filters.bedrooms !== undefined && filters.bedrooms !== null && filters.bedrooms !== '') {
      const minBedrooms = parseInt(filters.bedrooms);
      filtered = filtered.filter(prop => {
        if (prop.bedrooms === null || prop.bedrooms === undefined) return false;
        return prop.bedrooms >= minBedrooms;
      });
    }

    // Filter by bathrooms
    if (filters.bathrooms !== undefined && filters.bathrooms !== null && filters.bathrooms !== '') {
      const minBathrooms = parseInt(filters.bathrooms);
      filtered = filtered.filter(prop => {
        if (prop.bathrooms === null || prop.bathrooms === undefined) return false;
        return prop.bathrooms >= minBathrooms;
      });
    }

    // Filter by property type
    if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
      filtered = filtered.filter(prop => prop.type === filters.type);
    }

    // Filter by status
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
      filtered = filtered.filter(prop => prop.status === filters.status);
    }

    return filtered;
  }

  /**
   * Get filter values from form inputs
   * @param {HTMLElement} container - Container element with filter inputs
   * @returns {Object} Filter object
   */
  static getFiltersFromForm(container = document) {
    return {
      priceMin: container.querySelector('#priceMin')?.value || '',
      priceMax: container.querySelector('#priceMax')?.value || '',
      bedrooms: container.querySelector('#bedrooms')?.value || '',
      bathrooms: container.querySelector('#bathrooms')?.value || '',
      type: container.querySelector('#propertyType')?.value || '',
      status: container.querySelector('#status')?.value || '',
    };
  }
}

// Export for use in modules
window.PropertyFilters = PropertyFilters;
