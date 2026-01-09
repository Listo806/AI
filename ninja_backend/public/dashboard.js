/**
 * Standalone Dashboard Module for Webflow - Milestone 3
 * 
 * This file can be hosted externally and loaded via script tag:
 * <script src="https://your-backend.onrender.com/static/dashboard.js"></script>
 * 
 * Features:
 * - Agent Dashboard v1 (view-only)
 * - Stats display
 * - Recent leads and properties
 * - Works with auth.js (requires window.NinjaAuth)
 * - No conflicts with auth.js
 * 
 * Dependencies: Requires auth.js to be loaded first
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    MAX_RECENT_ITEMS: 5, // Number of recent items to show
  };

  // Wait for auth.js to be available
  if (!window.NinjaAuth) {
    console.warn('Dashboard: auth.js not loaded. Waiting...');
    // Retry after a short delay
    setTimeout(() => {
      if (!window.NinjaAuth) {
        console.error('Dashboard: auth.js is required but not found.');
        return;
      }
      initDashboard();
    }, 500);
  } else {
    // Initialize immediately if auth is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
      initDashboard();
    }
  }

  /**
   * Helper to get current user from localStorage
   * Works with both 'ninja_' and 'listo_' prefixes
   */
  function getCurrentUser() {
    const prefixes = ['ninja_', 'listo_'];
    for (const prefix of prefixes) {
      const userStr = localStorage.getItem(prefix + 'user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          console.warn('Failed to parse user from storage:', e);
        }
      }
    }
    return null;
  }

  /**
   * Dashboard Service
   * Uses the API client and auth service from auth.js
   * Uses new CRM endpoints for optimized performance
   */
  class DashboardService {
    constructor(apiClient, authService) {
      // Use the API client from auth.js (no conflicts)
      this.apiClient = apiClient;
      this.authService = authService;
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
        // Load all dashboard data in parallel using new CRM endpoints
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

        // Update leads from recent endpoint
        this.leads = leadsResponse.data || [];
        
        // Update properties from recent endpoint
        this.properties = propertiesResponse.data || [];

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
      // This will come from the API response if available
      return 'No leads yet. AI matching is active.';
    }

    getPropertiesEmptyMessage() {
      // This will come from the API response if available
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
    constructor(authService) {
      this.authService = authService;
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
          if (window.NinjaAuth && window.NinjaAuth.logout) {
            window.NinjaAuth.logout();
          }
        });
      }
    }
  }

  /**
   * Initialize Dashboard
   */
  async function initDashboard() {
    // Check if auth is available
    if (!window.NinjaAuth || !window.NinjaAuth.apiClient || !window.NinjaAuth.authService) {
      console.error('Dashboard: NinjaAuth not available. Make sure auth.js is loaded first.');
      showError('Authentication service not available. Please refresh the page.');
      return;
    }

    // Check if user is authenticated
    if (!window.NinjaAuth.isAuthenticated()) {
      console.warn('Dashboard: User not authenticated');
      // Auth.js will handle redirect to /sign-in
      return;
    }

    // Check if we're on a dashboard page
    const currentPath = window.location.pathname;
    const isDashboardPage = currentPath === '/dashboard' || 
                           currentPath.startsWith('/dashboard') ||
                           currentPath === '/agent-dashboard';

    if (!isDashboardPage) {
      // Not on dashboard page, don't initialize
      return;
    }

    try {
      const apiClient = window.NinjaAuth.apiClient;
      const authService = window.NinjaAuth.authService;

      // Initialize services
      const dashboardService = new DashboardService(apiClient, authService);
      const renderer = new DashboardRenderer(dashboardService);
      const sidebarHandler = new SidebarHandler(authService);

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
      window.NinjaDashboard = {
        service: dashboardService,
        renderer: renderer,
        refresh: async () => {
          await dashboardService.loadDashboard();
          renderer.render();
        },
      };

      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('ninja:dashboard:ready', {
        detail: { dashboard: dashboardService }
      }));

    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      showError(`Failed to load dashboard: ${error.message}`);
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    const errorEl = document.getElementById('dashboard-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  // Re-initialize if auth becomes available later
  document.addEventListener('ninja:auth:login', () => {
    const currentPath = window.location.pathname;
    if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard')) {
      initDashboard();
    }
  });
})();
