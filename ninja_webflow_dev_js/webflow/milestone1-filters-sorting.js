/**
 * Milestone 1: Filters & Sorting - Webflow Custom Code
 * 
 * This file contains the complete implementation for property filtering and sorting
 * that can be added to Webflow as custom code.
 * 
 * Usage:
 * 1. Copy this entire file to Webflow Custom Code (before </body>)
 * 2. Configure API_BASE_URL and ensure authentication is set up
 * 3. Ensure your Webflow page has elements with these IDs/classes:
 *    - Sort dropdown: #sortBy or .sort-by
 *    - Price filters: #priceMin, #priceMax
 *    - Bedroom/Bathroom filters: #bedrooms, #bathrooms
 *    - Property container: #propertiesContainer or .properties-container
 * 
 * Dependencies: None (vanilla JavaScript)
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://ai-2-7ikc.onrender.com/api', // Update with your backend URL
    STORAGE_PREFIX: 'ninja_',
  };

  /**
   * API Client
   */
  class ApiClient {
    constructor(baseUrl) {
      this.baseUrl = baseUrl;
      this.accessToken = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'access_token');
      this.refreshToken = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'refresh_token');
    }

    setTokens(accessToken, refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'access_token', accessToken);
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'refresh_token', refreshToken);
    }

    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'access_token');
      localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'refresh_token');
    }

    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            headers['Authorization'] = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            return this.handleResponse(retryResponse);
          } catch (refreshError) {
            this.clearTokens();
            throw new Error('Session expired');
          }
        }

        return this.handleResponse(response);
      } catch (error) {
        throw error;
      }
    }

    async handleResponse(response) {
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }

        // User-friendly error messages
        if (response.status === 409) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (response.status === 422) {
          errorMessage = 'Invalid input. Please check your information and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      try {
        const data = await response.json();
        return data;
      } catch (e) {
        return {};
      }
    }

    async refreshAccessToken() {
      if (!this.refreshToken) throw new Error('No refresh token');
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Token refresh failed');
      this.setTokens(data.accessToken, data.refreshToken);
      return data;
    }

    async getProperties(filters = {}) {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      const queryString = queryParams.toString();
      return this.request(`/properties${queryString ? `?${queryString}` : ''}`);
    }
  }

  /**
   * Property Filters
   */
  class PropertyFilters {
    static filter(properties, filters = {}) {
      let filtered = [...properties];

      if (filters.priceMin !== undefined && filters.priceMin !== null && filters.priceMin !== '') {
        const minPrice = parseFloat(filters.priceMin);
        filtered = filtered.filter(prop => prop.price !== null && prop.price !== undefined && prop.price >= minPrice);
      }

      if (filters.priceMax !== undefined && filters.priceMax !== null && filters.priceMax !== '') {
        const maxPrice = parseFloat(filters.priceMax);
        filtered = filtered.filter(prop => prop.price !== null && prop.price !== undefined && prop.price <= maxPrice);
      }

      if (filters.bedrooms !== undefined && filters.bedrooms !== null && filters.bedrooms !== '') {
        const minBedrooms = parseInt(filters.bedrooms);
        filtered = filtered.filter(prop => prop.bedrooms !== null && prop.bedrooms !== undefined && prop.bedrooms >= minBedrooms);
      }

      if (filters.bathrooms !== undefined && filters.bathrooms !== null && filters.bathrooms !== '') {
        const minBathrooms = parseInt(filters.bathrooms);
        filtered = filtered.filter(prop => prop.bathrooms !== null && prop.bathrooms !== undefined && prop.bathrooms >= minBathrooms);
      }

      if (filters.type !== undefined && filters.type !== null && filters.type !== '') {
        filtered = filtered.filter(prop => prop.type === filters.type);
      }

      if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
        filtered = filtered.filter(prop => prop.status === filters.status);
      }

      return filtered;
    }

    static getFiltersFromForm(container = document) {
      const getValue = (selector) => {
        const el = container.querySelector(selector);
        return el ? el.value : '';
      };

      return {
        priceMin: getValue('#priceMin') || getValue('.price-min'),
        priceMax: getValue('#priceMax') || getValue('.price-max'),
        bedrooms: getValue('#bedrooms') || getValue('.bedrooms'),
        bathrooms: getValue('#bathrooms') || getValue('.bathrooms'),
        type: getValue('#propertyType') || getValue('.property-type'),
        status: getValue('#status') || getValue('.status'),
      };
    }
  }

  /**
   * Property Sorter
   */
  class PropertySorter {
    static calculateDistance(lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
      const R = 6371;
      const dLat = this.toRad(lat2 - lat1);
      const dLon = this.toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    static toRad(degrees) {
      return degrees * (Math.PI / 180);
    }

    static sort(properties, sortType = 'newest', options = {}) {
      const sorted = [...properties];

      switch (sortType) {
        case 'newest':
          return sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.publishedAt || 0);
            const dateB = new Date(b.createdAt || b.publishedAt || 0);
            return dateB - dateA;
          });

        case 'price-low':
          return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));

        case 'price-high':
          return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));

        case 'distance':
          if (!options.userLocation || !options.userLocation.latitude || !options.userLocation.longitude) {
            return sorted;
          }
          const withDistance = sorted.map(prop => ({
            ...prop,
            _distance: this.calculateDistance(
              options.userLocation.latitude,
              options.userLocation.longitude,
              prop.latitude,
              prop.longitude
            ),
          }));
          return withDistance.sort((a, b) => {
            if (!a.latitude || !a.longitude) return 1;
            if (!b.latitude || !b.longitude) return -1;
            return a._distance - b._distance;
          });

        default:
          return sorted;
      }
    }

    static getSortTypeFromForm(container = document) {
      const sortSelect = container.querySelector('#sortBy') || container.querySelector('.sort-by');
      return sortSelect ? sortSelect.value : 'newest';
    }
  }

  /**
   * Webflow Property App
   */
  class WebflowPropertyApp {
    constructor() {
      this.apiClient = new ApiClient(CONFIG.API_BASE_URL);
      this.properties = [];
      this.filteredProperties = [];
      this.userLocation = null;
      this.debounceTimer = null;
    }

    async init() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.start());
      } else {
        this.start();
      }
    }

    async start() {
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        console.warn('Not authenticated. Properties will not load.');
        return;
      }

      await this.loadProperties();
      this.setupEventListeners();
      this.applyFiltersAndSort();
    }

    async checkAuthentication() {
      try {
        if (!this.apiClient.accessToken) return false;
        await this.apiClient.request('/users/me');
        return true;
      } catch (error) {
        return false;
      }
    }

    async loadProperties() {
      try {
        const basicFilters = PropertyFilters.getFiltersFromForm();
        const apiFilters = {};
        if (basicFilters.type) apiFilters.type = basicFilters.type;
        if (basicFilters.status) apiFilters.status = basicFilters.status;

        this.properties = await this.apiClient.getProperties(apiFilters);
        this.applyFiltersAndSort();
      } catch (error) {
        console.error('Failed to load properties:', error);
      }
    }

    setupEventListeners() {
      const filterSelectors = [
        '#priceMin', '.price-min',
        '#priceMax', '.price-max',
        '#bedrooms', '.bedrooms',
        '#bathrooms', '.bathrooms',
        '#propertyType', '.property-type',
        '#status', '.status',
        '#sortBy', '.sort-by'
      ];

      filterSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.addEventListener('change', () => this.applyFiltersAndSort());
          if (selector.includes('price')) {
            el.addEventListener('input', () => {
              clearTimeout(this.debounceTimer);
              this.debounceTimer = setTimeout(() => this.applyFiltersAndSort(), 500);
            });
          }
        });
      });
    }

    applyFiltersAndSort() {
      const filters = PropertyFilters.getFiltersFromForm();
      this.filteredProperties = PropertyFilters.filter(this.properties, filters);

      const sortType = PropertySorter.getSortTypeFromForm();
      this.filteredProperties = PropertySorter.sort(this.filteredProperties, sortType, {
        userLocation: this.userLocation,
      });

      this.renderProperties();
    }

    renderProperties() {
      // This is a placeholder - you'll need to customize this based on your Webflow structure
      // The actual rendering will depend on how your Webflow CMS/collection is set up
      const container = document.querySelector('#propertiesContainer') || 
                       document.querySelector('.properties-container');
      
      if (!container) {
        console.warn('Properties container not found. Add element with id="propertiesContainer" or class="properties-container"');
        return;
      }

      // Update results count if element exists
      const countEl = document.querySelector('#resultsCount') || document.querySelector('.results-count');
      if (countEl) {
        countEl.textContent = `Showing ${this.filteredProperties.length} of ${this.properties.length} properties`;
      }

      // Trigger custom event for Webflow integration
      const event = new CustomEvent('propertiesFiltered', {
        detail: {
          properties: this.filteredProperties,
          total: this.properties.length,
          filtered: this.filteredProperties.length,
        }
      });
      document.dispatchEvent(event);
    }
  }

  // Initialize
  const app = new WebflowPropertyApp();
  app.init();

  // Expose for external use
  window.NinjaPropertyApp = app;
})();
