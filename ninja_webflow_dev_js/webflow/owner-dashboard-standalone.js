/**
 * Standalone Owner Dashboard Module for Webflow
 * 
 * This file combines authentication and dashboard functionality into one file.
 * Use this on the owner dashboard page instead of loading auth.js + dashboard.js separately.
 * 
 * This file can be hosted externally and loaded via script tag:
 * <script src="https://your-backend.onrender.com/static/owner-dashboard.js"></script>
 * 
 * Features:
 * - Authentication checks and protected route handling
 * - Token management with automatic refresh
 * - Owner dashboard with stats, recent leads, and recent properties
 * - Sidebar with user info and logout
 * - Works standalone (no dependencies on other JS files)
 * 
 * Target Page: /dashboard/owners
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://ai-2-7ikc.onrender.com/api', // Update with your backend URL
    DASHBOARD_URL: '/dashboard/owners',
    SIGN_IN_URL: '/sign-in',
    STORAGE_PREFIX: 'listo_',
    MAX_RECENT_ITEMS: 5,
    // Role-based dashboard paths
    DASHBOARD_PATHS: {
      owner: '/dashboard/owners',
      agent: '/dashboard/agent',
      developer: '/dashboard/developer',
      admin: '/dashboard/admin',
      wholesaler: '/dashboard/wholesalers',
      investor: '/dashboard/investors',
    },
    // Pages that require authentication
    PROTECTED_PAGES: [
      '/dashboard',
      '/dashboard/owners',
      '/dashboard/agent',
      '/dashboard/developer',
      '/dashboard/admin',
      '/dashboard/wholesalers',
      '/dashboard/investors',
    ],
  };

  // Detect local testing environment
  const IS_LOCAL_TESTING = window.location.protocol === 'file:' || 
                            (window.location.hostname === 'localhost' && 
                             window.location.pathname.split('/').length <= 2);

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
            // Token refresh failed - clear tokens and redirect to sign-in
            this.clearTokens();
            localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
            
            const currentPath = window.location.pathname;
            if (currentPath !== CONFIG.SIGN_IN_URL && !currentPath.endsWith('/sign-up')) {
              if (IS_LOCAL_TESTING) {
                document.dispatchEvent(new CustomEvent('ninja:auth:redirect', {
                  detail: { url: CONFIG.SIGN_IN_URL, type: 'sign-in' }
                }));
              } else {
                window.location.href = CONFIG.SIGN_IN_URL;
              }
            }
            
            throw new Error('Session expired');
          }
        }
        
        // If 401 and no refresh token, redirect to sign-in
        if (response.status === 401 && !this.refreshToken) {
          this.clearTokens();
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
          
          const currentPath = window.location.pathname;
          if (currentPath !== CONFIG.SIGN_IN_URL && !currentPath.endsWith('/sign-up')) {
            if (IS_LOCAL_TESTING) {
              document.dispatchEvent(new CustomEvent('ninja:auth:redirect', {
                detail: { url: CONFIG.SIGN_IN_URL, type: 'sign-in' }
              }));
            } else {
              window.location.href = CONFIG.SIGN_IN_URL;
            }
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
  }

  /**
   * Authentication Service
   */
  class AuthService {
    constructor(apiClient) {
      this.apiClient = apiClient;
    }

    isAuthenticated() {
      return !!this.apiClient.accessToken;
    }
  }

  /**
   * Get current user from localStorage
   */
  function getCurrentUser() {
    try {
      const userStr = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Page Router
   */
  class PageRouter {
    constructor() {
      this.currentPath = window.location.pathname;
    }

    isProtectedPage() {
      return CONFIG.PROTECTED_PAGES.some(protectedPath => 
        this.currentPath === protectedPath || 
        this.currentPath.startsWith(protectedPath + '/') ||
        this.currentPath.includes('dashboard')
      );
    }

    redirect(url) {
      if (IS_LOCAL_TESTING) {
        console.log('[Local Testing] Would redirect to:', url);
        document.dispatchEvent(new CustomEvent('ninja:auth:redirect', {
          detail: { url: url, type: url.includes('dashboard') ? 'dashboard' : 'sign-in' }
        }));
        return;
      }
      window.location.href = url;
    }

    redirectToSignIn() {
      this.redirect(CONFIG.SIGN_IN_URL);
    }
  }

  /**
   * Protected Route Handler
   */
  class ProtectedRouteHandler {
    constructor(authService, router, apiClient) {
      this.authService = authService;
      this.router = router;
      this.apiClient = apiClient;
    }

    async checkProtectedRoute() {
      // Check if current page is protected
      if (this.router.isProtectedPage()) {
        // Verify session is still valid
        if (!this.authService.isAuthenticated()) {
          // Not authenticated - redirect to sign-in
          this.router.redirectToSignIn();
          return false;
        }

        // Verify token is still valid by checking current user
        try {
          const userData = await this.apiClient.request('/users/me');
          // Update stored user data in case it changed
          if (userData) {
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'user', JSON.stringify(userData));
          }
          return true;
        } catch (error) {
          // Token invalid or expired - redirect to sign-in
          this.apiClient.clearTokens();
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
          this.router.redirectToSignIn();
          return false;
        }
      }
      return true;
    }
  }

  /**
   * Dashboard Service
   */
  class DashboardService {
    constructor(apiClient) {
      this.apiClient = apiClient;
      this.leads = [];
      this.properties = [];
      this.stats = {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        totalProperties: 0,
        publishedProperties: 0,
      };
      this.loading = false;
      this.error = null;
    }

    async loadDashboard() {
      this.loading = true;
      this.error = null;
      
      try {
        // Load all dashboard data in parallel using CRM endpoints
        const [summary, leadsResponse, propertiesResponse] = await Promise.all([
          this.apiClient.request('/crm/dashboard/summary'),
          this.apiClient.request('/crm/leads/recent?limit=' + CONFIG.MAX_RECENT_ITEMS),
          this.apiClient.request('/crm/properties/recent?limit=' + CONFIG.MAX_RECENT_ITEMS),
        ]);

        // Update stats from summary endpoint
        this.stats = {
          totalLeads: summary.leads?.total || 0,
          newLeads: summary.leads?.new || 0,
          qualifiedLeads: summary.leads?.qualified || 0,
          totalProperties: summary.properties?.total || 0,
          publishedProperties: summary.properties?.published || 0,
        };

        // Update leads from recent endpoint (response may be direct array or { data: [...] })
        this.leads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse.data || []);
        
        // Update properties from recent endpoint (response may be direct array or { data: [...] })
        this.properties = Array.isArray(propertiesResponse) ? propertiesResponse : (propertiesResponse.data || []);

        this.loading = false;
        
        return {
          leads: this.leads,
          properties: this.properties,
          stats: this.stats,
          summary: summary,
        };
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        this.error = error.message || 'Failed to load dashboard';
        this.loading = false;
        throw error;
      }
    }

    getStats() {
      return this.stats;
    }

    getRecentLeads(limit = CONFIG.MAX_RECENT_ITEMS) {
      return this.leads.slice(0, limit);
    }

    getRecentProperties(limit = CONFIG.MAX_RECENT_ITEMS) {
      return this.properties.slice(0, limit);
    }

    getLeadsEmptyMessage() {
      return 'No leads yet. AI matching is active.';
    }

    getPropertiesEmptyMessage() {
      return 'Upload your first property to start receiving AI-matched leads.';
    }
  }

  /**
   * Dashboard Renderer
   */
  class DashboardRenderer {
    constructor(dashboardService) {
      this.dashboard = dashboardService;
    }

    renderStats() {
      const stats = this.dashboard.getStats();
      const statsContainer = document.getElementById('dashboard-stats');
      
      if (!statsContainer) return;

      // Update stat values
      const statElements = statsContainer.querySelectorAll('[data-stat]');
      statElements.forEach(el => {
        const statName = el.getAttribute('data-stat');
        if (stats[statName] !== undefined) {
          el.textContent = stats[statName];
        }
      });
    }

    renderLeads() {
      const leads = this.dashboard.getRecentLeads();
      const container = document.getElementById('dashboard-leads-list');
      const loadingEl = document.getElementById('dashboard-leads-loading');
      const emptyEl = document.getElementById('dashboard-leads-empty');

      if (!container) return;

      // Show loading state
      if (this.dashboard.loading) {
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        container.style.display = 'none';
        return;
      }

      // Hide loading
      if (loadingEl) loadingEl.style.display = 'none';

      if (leads.length === 0) {
        if (emptyEl) {
          emptyEl.textContent = this.dashboard.getLeadsEmptyMessage();
          emptyEl.style.display = 'block';
        }
        container.style.display = 'none';
        return;
      }

      // Show list
      if (emptyEl) emptyEl.style.display = 'none';
      container.style.display = 'block';
      container.innerHTML = '';

      leads.forEach(lead => {
        const item = this.createLeadItem(lead);
        container.appendChild(item);
      });
    }

    renderProperties() {
      const properties = this.dashboard.getRecentProperties();
      const container = document.getElementById('dashboard-properties-list');
      const loadingEl = document.getElementById('dashboard-properties-loading');
      const emptyEl = document.getElementById('dashboard-properties-empty');

      if (!container) return;

      // Show loading state
      if (this.dashboard.loading) {
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        container.style.display = 'none';
        return;
      }

      // Hide loading
      if (loadingEl) loadingEl.style.display = 'none';

      if (properties.length === 0) {
        if (emptyEl) {
          emptyEl.textContent = this.dashboard.getPropertiesEmptyMessage();
          emptyEl.style.display = 'block';
        }
        container.style.display = 'none';
        return;
      }

      // Show list
      if (emptyEl) emptyEl.style.display = 'none';
      container.style.display = 'block';
      container.innerHTML = '';

      properties.forEach(property => {
        const item = this.createPropertyItem(property);
        container.appendChild(item);
      });
    }

    createLeadItem(lead) {
      const li = document.createElement('li');
      li.className = 'item-list-item';

      const statusClass = `badge-${lead.status}`;
      const date = new Date(lead.created_at).toLocaleDateString();
      const aiScore = lead.ai_score || 0;
      const aiScoreDisplay = aiScore > 0 ? ` (AI: ${(aiScore * 100).toFixed(0)}%)` : '';

      li.innerHTML = `
        <div class="item-header">
          <div class="item-title">${lead.name || 'Unnamed Lead'}</div>
          <span class="item-badge ${statusClass}">${lead.status}${aiScoreDisplay}</span>
        </div>
        <div class="item-details">
          ${lead.intent ? `<div><strong>Intent:</strong> ${lead.intent}</div>` : ''}
          ${lead.location ? `<div>📍 ${lead.location}</div>` : ''}
        </div>
        <div class="item-meta">${date}</div>
      `;

      return li;
    }

    createPropertyItem(property) {
      const li = document.createElement('li');
      li.className = 'item-list-item';

      const statusClass = `badge-${property.status}`;
      const date = new Date(property.created_at).toLocaleDateString();
      const views = property.views || 0;
      const leadsGenerated = property.leads_generated || 0;

      li.innerHTML = `
        <div class="item-header">
          <div class="item-title">${property.title || 'Untitled Property'}</div>
          <span class="item-badge ${statusClass}">${property.status}</span>
        </div>
        <div class="item-details">
          ${property.location ? `<div>📍 ${property.location}</div>` : ''}
          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            👁️ ${views} views • 📋 ${leadsGenerated} leads
          </div>
        </div>
        <div class="item-meta">${date}</div>
      `;

      return li;
    }

    render() {
      // Show error if any
      if (this.dashboard.error) {
        const errorEl = document.getElementById('dashboard-error');
        if (errorEl) {
          errorEl.textContent = this.dashboard.error;
          errorEl.style.display = 'block';
        }
      } else {
        const errorEl = document.getElementById('dashboard-error');
        if (errorEl) errorEl.style.display = 'none';
      }

      this.renderStats();
      this.renderLeads();
      this.renderProperties();
    }
  }

  /**
   * Sidebar Handler
   */
  class SidebarHandler {
    constructor(authService, apiClient, router) {
      this.authService = authService;
      this.apiClient = apiClient;
      this.router = router;
    }

    init() {
      this.updateUserInfo();
      this.setupLogout();
    }

    updateUserInfo() {
      const user = getCurrentUser();
      const emailEl = document.getElementById('sidebar-user-email');
      const roleEl = document.getElementById('sidebar-user-role');

      if (user) {
        if (emailEl) emailEl.textContent = user.email || 'User';
        if (roleEl) roleEl.textContent = user.role || 'user';
      }
    }

    setupLogout() {
      const logoutBtn = document.getElementById('sidebar-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.apiClient.clearTokens();
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
          this.router.redirectToSignIn();
        });
      }
    }
  }

  /**
   * Initialize Owner Dashboard
   */
  async function initOwnerDashboard() {
    // Check if we're on the owner dashboard page
    const currentPath = window.location.pathname;
    const isOwnerDashboard = currentPath === '/dashboard/owners' || 
                             currentPath.includes('dashboard-owner') ||
                             currentPath.includes('dashboard/owners');

    if (!isOwnerDashboard) {
      // Not on owner dashboard page, don't initialize
      return;
    }

    // Initialize services
    const router = new PageRouter();
    const apiClient = new ApiClient(CONFIG.API_BASE_URL);
    const authService = new AuthService(apiClient);
    const protectedRouteHandler = new ProtectedRouteHandler(authService, router, apiClient);

    // Check authentication first
    const isAuthenticated = await protectedRouteHandler.checkProtectedRoute();
    if (!isAuthenticated) {
      // Will be redirected to sign-in
      return;
    }

    try {
      // Initialize dashboard services
      const dashboardService = new DashboardService(apiClient);
      const renderer = new DashboardRenderer(dashboardService);
      const sidebarHandler = new SidebarHandler(authService, apiClient, router);

      // Load and render dashboard
      try {
        await dashboardService.loadDashboard();
        renderer.render();
        sidebarHandler.init();
      } catch (error) {
        // Error already set in dashboardService
        renderer.render();
      }

      // Expose globally for external use
      window.NinjaOwnerDashboard = {
        service: dashboardService,
        renderer: renderer,
        auth: {
          apiClient,
          authService,
          router,
          isAuthenticated: () => authService.isAuthenticated(),
          getCurrentUser: () => getCurrentUser(),
          logout: () => {
            apiClient.clearTokens();
            localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
            router.redirectToSignIn();
          },
        },
        refresh: async () => {
          await dashboardService.loadDashboard();
          renderer.render();
        },
      };

      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('ninja:owner-dashboard:ready', {
        detail: { dashboard: dashboardService }
      }));

    } catch (error) {
      console.error('Failed to initialize owner dashboard:', error);
      const errorEl = document.getElementById('dashboard-error');
      if (errorEl) {
        errorEl.textContent = `Failed to load dashboard: ${error.message}`;
        errorEl.style.display = 'block';
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOwnerDashboard);
  } else {
    initOwnerDashboard();
  }
})();
