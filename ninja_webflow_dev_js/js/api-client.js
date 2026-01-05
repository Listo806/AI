/**
 * API Client for Ninja Backend
 * Handles authentication and API communication
 */

class ApiClient {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.accessToken = localStorage.getItem('ninja_access_token');
    this.refreshToken = localStorage.getItem('ninja_refresh_token');
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('ninja_access_token', accessToken);
    localStorage.setItem('ninja_refresh_token', refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('ninja_access_token');
    localStorage.removeItem('ninja_refresh_token');
  }

  /**
   * Make authenticated API request
   */
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
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          // Retry request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse(retryResponse);
        } catch (refreshError) {
          this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to backend. Make sure the server is running.');
      }
      throw error;
    }
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    // Handle different status codes
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (e) {
        // Response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Provide user-friendly messages for common errors
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

    // Parse JSON response
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      // Response is not JSON, return empty object
      return {};
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  /**
   * Login user
   */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.request('/users/me');
  }

  /**
   * Get all properties
   * @param {Object} filters - Optional filters (type, status, search)
   */
  async getProperties(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);

    const queryString = queryParams.toString();
    const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get property by ID
   */
  async getProperty(id) {
    return this.request(`/properties/${id}`);
  }
}

// Export for use in modules
window.ApiClient = ApiClient;
