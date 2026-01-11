/**
 * Main Application Logic
 * Coordinates API calls, filtering, sorting, and UI updates
 */

class PropertyApp {
  constructor() {
    this.apiClient = new ApiClient();
    this.properties = [];
    this.filteredProperties = [];
    this.userLocation = null;
    this.geocodingApiKey = null; // Will be set if Mapbox geocoding is needed

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    // Check if user is authenticated
    const isAuthenticated = await this.checkAuthentication();

    if (!isAuthenticated) {
      this.showError('Please login first. Set your credentials in the browser console: app.login("email", "password")');
      return;
    }

    // Load properties
    await this.loadProperties();

    // Set up event listeners
    this.setupEventListeners();

    // Initial render
    this.applyFiltersAndSort();
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication() {
    try {
      if (!this.apiClient.accessToken) {
        return false;
      }
      await this.apiClient.getCurrentUser();
      return true;
    } catch (error) {
      console.warn('Not authenticated:', error.message);
      return false;
    }
  }

  /**
   * Login helper (for console use)
   */
  async login(email, password) {
    try {
      await this.apiClient.login(email, password);
      console.log('Login successful!');
      await this.loadProperties();
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('Login failed:', error.message);
      this.showError(error.message);
    }
  }

  /**
   * Load properties from API
   */
  async loadProperties() {
    try {
      this.showLoading();
      
      // Get basic filters from form (type, status)
      const basicFilters = {
        type: document.querySelector('#propertyType')?.value || '',
        status: document.querySelector('#status')?.value || '',
      };

      // Remove empty filters
      Object.keys(basicFilters).forEach(key => {
        if (!basicFilters[key]) delete basicFilters[key];
      });

      this.properties = await this.apiClient.getProperties(basicFilters);
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('Failed to load properties:', error);
      this.showError(`Failed to load properties: ${error.message}`);
    }
  }

  /**
   * Set up event listeners for filters and sorting
   */
  setupEventListeners() {
    // Filter inputs
    const filterInputs = ['#priceMin', '#priceMax', '#bedrooms', '#bathrooms', '#propertyType', '#status', '#sortBy'];
    filterInputs.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener('change', () => this.applyFiltersAndSort());
        element.addEventListener('input', () => {
          // Debounce for number inputs
          if (selector.includes('price')) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.applyFiltersAndSort(), 500);
          } else {
            this.applyFiltersAndSort();
          }
        });
      }
    });

    // Location button
    const setLocationBtn = document.querySelector('#setLocation');
    if (setLocationBtn) {
      setLocationBtn.addEventListener('click', () => this.setUserLocation());
    }
  }

  /**
   * Set user location for distance sorting
   */
  async setUserLocation() {
    const locationInput = document.querySelector('#userLocation');
    const address = locationInput?.value.trim();

    if (!address) {
      alert('Please enter a location');
      return;
    }

    try {
      // Try to geocode the address using Mapbox API if available
      // For now, we'll use a simple approach - you can integrate Mapbox geocoding here
      // Or use the backend's geocoding endpoint: /api/integrations/mapbox/geocode
      
      // For local dev, you can manually set coordinates:
      // app.userLocation = { latitude: 40.7128, longitude: -74.0060 }; // New York example
      
      // Try using browser geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('Location set from browser:', this.userLocation);
            this.applyFiltersAndSort();
          },
          async () => {
            // Fallback: try to geocode via backend
            await this.geocodeAddress(address);
          }
        );
      } else {
        await this.geocodeAddress(address);
      }
    } catch (error) {
      console.error('Failed to set location:', error);
      alert('Failed to set location. You can manually set coordinates in console: app.userLocation = { latitude: X, longitude: Y }');
    }
  }

  /**
   * Geocode address using backend API
   */
  async geocodeAddress(address) {
    try {
      const response = await fetch(`${this.apiClient.baseUrl}/integrations/mapbox/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiClient.accessToken}`,
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      if (data.latitude && data.longitude) {
        this.userLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
        };
        console.log('Location set:', this.userLocation);
        this.applyFiltersAndSort();
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Apply filters and sorting, then render
   */
  applyFiltersAndSort() {
    // Get filters from form
    const filters = PropertyFilters.getFiltersFromForm();

    // Apply filters
    this.filteredProperties = PropertyFilters.filter(this.properties, filters);

    // Get sort type from form
    const sortType = PropertySorter.getSortTypeFromForm();

    // Apply sorting
    this.filteredProperties = PropertySorter.sort(this.filteredProperties, sortType, {
      userLocation: this.userLocation,
    });

    // Render results
    this.renderProperties();
  }

  /**
   * Render properties to the DOM
   */
  renderProperties() {
    const container = document.querySelector('#propertiesContainer');
    const resultsCount = document.querySelector('#resultsCount');

    if (!container) return;

    // Update results count
    if (resultsCount) {
      resultsCount.textContent = `Showing ${this.filteredProperties.length} of ${this.properties.length} properties`;
    }

    // Clear container
    container.innerHTML = '';

    if (this.filteredProperties.length === 0) {
      container.innerHTML = '<div class="loading">No properties match your filters.</div>';
      return;
    }

    // Render each property
    this.filteredProperties.forEach(property => {
      const card = this.createPropertyCard(property);
      container.appendChild(card);
    });
  }

  /**
   * Create a property card element
   */
  createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';

    const price = property.price
      ? `$${property.price.toLocaleString()}`
      : 'Price not set';

    const location = [property.address, property.city, property.state]
      .filter(Boolean)
      .join(', ') || 'Location not specified';

    const details = [];
    if (property.bedrooms) details.push(`${property.bedrooms} bed`);
    if (property.bathrooms) details.push(`${property.bathrooms} bath`);
    if (property.squareFeet) details.push(`${property.squareFeet.toLocaleString()} sqft`);

    const date = property.publishedAt || property.createdAt;
    const dateStr = date ? new Date(date).toLocaleDateString() : '';

    // Add distance if available
    let distanceInfo = '';
    if (property._distance !== undefined && property._distance !== Infinity) {
      const distance = property._distance < 1
        ? `${Math.round(property._distance * 1000)}m`
        : `${property._distance.toFixed(1)}km`;
      distanceInfo = `<div style="color: #2563eb; font-size: 12px; margin-top: 5px;">📍 ${distance} away</div>`;
    }

    card.innerHTML = `
      <div class="property-title">${property.title || 'Untitled Property'}</div>
      <div class="property-price">${price}</div>
      <div class="property-details">${details.join(' • ') || 'Details not available'}</div>
      <div class="property-location">${location}</div>
      ${distanceInfo}
      <div class="property-date">${dateStr}</div>
    `;

    return card;
  }

  /**
   * Show loading state
   */
  showLoading() {
    const container = document.querySelector('#propertiesContainer');
    if (container) {
      container.innerHTML = '<div class="loading">Loading properties...</div>';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.querySelector('#error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
    console.error(message);
  }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new PropertyApp();
    window.app = app; // Make app available globally for console access
  });
} else {
  app = new PropertyApp();
  window.app = app; // Make app available globally for console access
}
