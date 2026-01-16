/**
 * API Client for backend communication
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-2-7ikc.onrender.com/api';
const STORAGE_PREFIX = 'listo_';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.accessToken = localStorage.getItem(STORAGE_PREFIX + 'access_token');
    this.refreshToken = localStorage.getItem(STORAGE_PREFIX + 'refresh_token');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem(STORAGE_PREFIX + 'access_token', accessToken);
    localStorage.setItem(STORAGE_PREFIX + 'refresh_token', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(STORAGE_PREFIX + 'access_token');
    localStorage.removeItem(STORAGE_PREFIX + 'refresh_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Check if this is a public endpoint (doesn't require auth)
    const isPublicEndpoint = endpoint.includes('/public') || 
                            endpoint.includes('/auth/signin') || 
                            endpoint.includes('/auth/signup') ||
                            endpoint.includes('/properties/public');

    // Only add auth header if we have a token and it's not a public endpoint
    if (this.accessToken && !isPublicEndpoint) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      // Only try to refresh token if it's not a public endpoint
      if (response.status === 401 && this.refreshToken && !isPublicEndpoint) {
        try {
          await this.refreshAccessToken();
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return this.handleResponse(retryResponse);
        } catch (refreshError) {
          this.clearTokens();
          localStorage.removeItem(STORAGE_PREFIX + 'user');
          throw new Error('Session expired');
        }
      }

      // For public endpoints, don't clear tokens on 401
      if (response.status === 401 && !this.refreshToken && !isPublicEndpoint) {
        this.clearTokens();
        localStorage.removeItem(STORAGE_PREFIX + 'user');
      }

      return this.handleResponse(response, isPublicEndpoint);
    } catch (error) {
      throw error;
    }
  }

  async handleResponse(response, isPublicEndpoint = false) {
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
        // Don't show "Invalid credentials" for public endpoints
        if (isPublicEndpoint) {
          errorMessage = 'Unable to load data. Please try again later.';
        } else {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        }
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
}

export default new ApiClient();
