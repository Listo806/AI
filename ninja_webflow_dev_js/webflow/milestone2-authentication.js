/**
 * Milestone 2: Authentication & Roles - Webflow Custom Code
 * 
 * This file contains the complete implementation for user authentication,
 * session management, and role-based access control.
 * 
 * Usage:
 * 1. Copy this entire file to Webflow Custom Code (before </body>)
 * 2. Configure API_BASE_URL
 * 3. Use data attributes for role-based visibility:
 *    - data-require-auth: Show only when authenticated
 *    - data-require-role="owner,admin": Show only for specific roles
 *    - data-hide-role="agent": Hide for specific roles
 * 4. Use window.NinjaAuth for authentication methods
 * 
 * Dependencies: Requires milestone1-filters-sorting.js or api-client.js
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://your-backend.onrender.com/api', // Update with your backend URL
    STORAGE_PREFIX: 'ninja_',
  };

  // Use existing ApiClient if available, otherwise create minimal version
  let ApiClient;
  if (window.ApiClient) {
    ApiClient = window.ApiClient;
  } else {
    // Minimal ApiClient for standalone use
    class MinimalApiClient {
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

      async getCurrentUser() {
        return this.request('/users/me');
      }
    }
    ApiClient = MinimalApiClient;
  }

  /**
   * Authentication Service
   */
  class AuthService {
    constructor(apiClient) {
      this.apiClient = apiClient;
      this.currentUser = null;
      this.init();
    }

    init() {
      const userStr = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (e) {
          this.clearSession();
        }
      }
    }

    async signup(email, password, role = 'owner') {
      try {
        const response = await this.apiClient.request('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        });
        if (response.accessToken) {
          this.apiClient.setTokens(response.accessToken, response.refreshToken);
          this.setCurrentUser(response.user);
        }
        return response;
      } catch (error) {
        throw new Error(error.message || 'Signup failed');
      }
    }

    async login(email, password) {
      try {
        const response = await this.apiClient.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (response.accessToken) {
          this.apiClient.setTokens(response.accessToken, response.refreshToken);
          this.setCurrentUser(response.user);
        }
        return response;
      } catch (error) {
        throw new Error(error.message || 'Login failed');
      }
    }

    logout() {
      this.clearSession();
      this.apiClient.clearTokens();
      document.dispatchEvent(new CustomEvent('ninja:auth:logout', {
        detail: { user: this.currentUser }
      }));
    }

    getCurrentUser() {
      return this.currentUser;
    }

    isAuthenticated() {
      return !!this.currentUser && !!this.apiClient.accessToken;
    }

    getUserRole() {
      return this.currentUser?.role || null;
    }

    hasRole(role) {
      return this.currentUser?.role === role;
    }

    hasAnyRole(...roles) {
      return roles.includes(this.currentUser?.role);
    }

    isOwner() {
      return this.hasRole('owner');
    }

    isAgent() {
      return this.hasRole('agent');
    }

    isAdmin() {
      return this.hasRole('admin');
    }

    isDeveloper() {
      return this.hasRole('developer');
    }

    async verifySession() {
      if (!this.isAuthenticated()) return false;
      try {
        const user = await this.apiClient.getCurrentUser();
        this.setCurrentUser(user);
        return true;
      } catch (error) {
        this.clearSession();
        return false;
      }
    }

    setCurrentUser(user) {
      this.currentUser = user;
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'user', JSON.stringify(user));
      document.dispatchEvent(new CustomEvent('ninja:auth:login', {
        detail: { user }
      }));
    }

    clearSession() {
      this.currentUser = null;
      localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
    }

    getTeamId() {
      return this.currentUser?.teamId || null;
    }

    getUserId() {
      return this.currentUser?.id || null;
    }
  }

  /**
   * Permissions Service
   */
  class Permissions {
    constructor(authService) {
      this.auth = authService;
    }

    canAccess(feature, requiredRoles = []) {
      if (!this.auth.isAuthenticated()) return false;
      if (requiredRoles.length === 0) return true;
      return this.auth.hasAnyRole(...requiredRoles);
    }

    canViewProperties() {
      return this.auth.isAuthenticated();
    }

    canCreateProperties() {
      return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
    }

    canEditProperties() {
      return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
    }

    canDeleteProperties() {
      return this.auth.hasAnyRole('owner', 'admin');
    }

    canViewLeads() {
      return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
    }

    canCreateLeads() {
      return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
    }

    canEditLeads() {
      return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
    }

    canDeleteLeads() {
      return this.auth.hasAnyRole('owner', 'admin');
    }

    canAccessAgentDashboard() {
      return this.auth.hasAnyRole('agent', 'owner', 'admin');
    }

    canAccessAdminPanel() {
      return this.auth.hasAnyRole('admin', 'developer');
    }

    canManageTeams() {
      return this.auth.hasAnyRole('owner', 'admin');
    }

    canManageSubscriptions() {
      return this.auth.hasAnyRole('owner', 'admin');
    }

    canViewAnalytics() {
      return this.auth.hasAnyRole('owner', 'admin', 'developer');
    }

    getDefaultRedirectUrl() {
      if (!this.auth.isAuthenticated()) return '/login';
      const role = this.auth.getUserRole();
      switch (role) {
        case 'admin':
        case 'developer':
          return '/admin';
        case 'agent':
          return '/agent-dashboard';
        case 'owner':
          return '/dashboard';
        default:
          return '/';
      }
    }

    protectRoute(requiredRoles = [], redirectTo = '/login') {
      if (!this.auth.isAuthenticated()) {
        if (redirectTo) window.location.href = redirectTo;
        return false;
      }
      if (requiredRoles.length > 0 && !this.canAccess(null, requiredRoles)) {
        if (redirectTo) window.location.href = redirectTo;
        return false;
      }
      return true;
    }

    applyPermissionsToElements() {
      if (!this.auth.isAuthenticated()) {
        document.querySelectorAll('[data-require-auth]').forEach(el => {
          el.style.display = 'none';
        });
        return;
      }

      document.querySelectorAll('[data-require-auth]').forEach(el => {
        el.style.display = '';
      });

      const role = this.auth.getUserRole();
      
      document.querySelectorAll(`[data-require-role]`).forEach(el => {
        const requiredRoles = el.getAttribute('data-require-role').split(',').map(r => r.trim());
        if (this.auth.hasAnyRole(...requiredRoles)) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });

      document.querySelectorAll(`[data-hide-role]`).forEach(el => {
        const hideRoles = el.getAttribute('data-hide-role').split(',').map(r => r.trim());
        if (this.auth.hasAnyRole(...hideRoles)) {
          el.style.display = 'none';
        } else {
          el.style.display = '';
        }
      });
    }
  }

  // Initialize
  const apiClient = new ApiClient(CONFIG.API_BASE_URL);
  const authService = new AuthService(apiClient);
  const permissions = new Permissions(authService);

  // Apply permissions on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      permissions.applyPermissionsToElements();
    });
  } else {
    permissions.applyPermissionsToElements();
  }

  // Re-apply permissions on auth events
  document.addEventListener('ninja:auth:login', () => {
    permissions.applyPermissionsToElements();
  });

  document.addEventListener('ninja:auth:logout', () => {
    permissions.applyPermissionsToElements();
  });

  // Expose globally
  window.NinjaAuth = authService;
  window.NinjaPermissions = permissions;
  window.NinjaApiClient = apiClient;
})();
