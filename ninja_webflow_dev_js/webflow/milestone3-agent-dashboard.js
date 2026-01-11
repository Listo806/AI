/**
 * Milestone 3: Agent Dashboard (CRM Core) - Webflow Custom Code
 * 
 * This file contains the complete implementation for agent dashboard
 * to view assigned listings and incoming leads.
 * 
 * Usage:
 * 1. Copy this entire file to Webflow Custom Code (before </body>)
 * 2. Requires milestone2-authentication.js (or auth service)
 * 3. Configure API_BASE_URL
 * 4. Use data attributes to mark dashboard containers:
 *    - data-dashboard="leads" - Container for leads list
 *    - data-dashboard="properties" - Container for properties list
 *    - data-dashboard="stats" - Container for statistics
 * 
 * Dependencies: Requires milestone2-authentication.js
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'https://your-backend.onrender.com/api', // Update with your backend URL
  };

  // Use existing services if available
  const apiClient = window.NinjaApiClient || window.ApiClient;
  const authService = window.NinjaAuth || window.AuthService;

  if (!apiClient || !authService) {
    console.error('Agent Dashboard requires authentication service. Please include milestone2-authentication.js first.');
    return;
  }

  /**
   * Agent Dashboard Service
   */
  class AgentDashboard {
    constructor(apiClient, authService) {
      this.apiClient = apiClient;
      this.authService = authService;
      this.leads = [];
      this.properties = [];
      this.stats = {
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        totalProperties: 0,
        publishedProperties: 0,
      };
    }

    async loadDashboard() {
      try {
        await Promise.all([
          this.loadLeads(),
          this.loadProperties(),
        ]);
        this.calculateStats();
        return {
          leads: this.leads,
          properties: this.properties,
          stats: this.stats,
        };
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        throw error;
      }
    }

    async loadLeads(status = null) {
      try {
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        const queryString = queryParams.toString();
        const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;
        
        const allLeads = await this.apiClient.request(endpoint);
        const currentUserId = this.authService.getUserId();

        // Filter leads assigned to current user
        if (this.authService.isAgent()) {
          this.leads = allLeads.filter(lead => lead.assignedTo === currentUserId);
        } else {
          // Owners and admins see all team leads
          this.leads = allLeads;
        }

        return this.leads;
      } catch (error) {
        console.error('Failed to load leads:', error);
        throw error;
      }
    }

    async loadProperties(type = null, status = null) {
      try {
        const queryParams = new URLSearchParams();
        if (type) queryParams.append('type', type);
        if (status) queryParams.append('status', status);
        const queryString = queryParams.toString();
        const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
        
        this.properties = await this.apiClient.request(endpoint);
        return this.properties;
      } catch (error) {
        console.error('Failed to load properties:', error);
        throw error;
      }
    }

    getLeadsByStatus(status) {
      return this.leads.filter(lead => lead.status === status);
    }

    getPropertiesByStatus(status) {
      return this.properties.filter(property => property.status === status);
    }

    getRecentLeads(days = 7) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return this.leads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= cutoffDate;
      });
    }

    getRecentProperties(days = 7) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return this.properties.filter(property => {
        const propertyDate = new Date(property.createdAt);
        return propertyDate >= cutoffDate;
      });
    }

    calculateStats() {
      this.stats = {
        totalLeads: this.leads.length,
        newLeads: this.getLeadsByStatus('new').length,
        contactedLeads: this.getLeadsByStatus('contacted').length,
        qualifiedLeads: this.getLeadsByStatus('qualified').length,
        convertedLeads: this.getLeadsByStatus('converted').length,
        totalProperties: this.properties.length,
        publishedProperties: this.getPropertiesByStatus('published').length,
        draftProperties: this.getPropertiesByStatus('draft').length,
        soldProperties: this.getPropertiesByStatus('sold').length,
      };
    }

    getStats() {
      return this.stats;
    }

    async updateLeadStatus(leadId, newStatus) {
      try {
        const updatedLead = await this.apiClient.request(`/leads/${leadId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        });
        
        const index = this.leads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          this.leads[index] = updatedLead;
          this.calculateStats();
        }
        
        return updatedLead;
      } catch (error) {
        console.error('Failed to update lead status:', error);
        throw error;
      }
    }

    getLeadById(leadId) {
      return this.leads.find(lead => lead.id === leadId);
    }

    getPropertyById(propertyId) {
      return this.properties.find(property => property.id === propertyId);
    }

    searchLeads(searchTerm) {
      if (!searchTerm) return this.leads;
      const term = searchTerm.toLowerCase();
      return this.leads.filter(lead => 
        (lead.name && lead.name.toLowerCase().includes(term)) ||
        (lead.email && lead.email.toLowerCase().includes(term)) ||
        (lead.phone && lead.phone.toLowerCase().includes(term)) ||
        (lead.notes && lead.notes.toLowerCase().includes(term))
      );
    }

    searchProperties(searchTerm) {
      if (!searchTerm) return this.properties;
      const term = searchTerm.toLowerCase();
      return this.properties.filter(property => 
        (property.title && property.title.toLowerCase().includes(term)) ||
        (property.address && property.address.toLowerCase().includes(term)) ||
        (property.city && property.city.toLowerCase().includes(term)) ||
        (property.description && property.description.toLowerCase().includes(term))
      );
    }
  }

  /**
   * Dashboard Renderer
   */
  class DashboardRenderer {
    constructor(dashboard) {
      this.dashboard = dashboard;
    }

    render() {
      this.renderStats();
      this.renderLeads();
      this.renderProperties();
    }

    renderStats() {
      const container = document.querySelector('[data-dashboard="stats"]');
      if (!container) return;

      const stats = this.dashboard.getStats();
      
      // Look for stat elements with data-stat attribute
      const statElements = container.querySelectorAll('[data-stat]');
      statElements.forEach(el => {
        const statName = el.getAttribute('data-stat');
        if (stats[statName] !== undefined) {
          el.textContent = stats[statName];
        }
      });

      // Dispatch event with stats
      document.dispatchEvent(new CustomEvent('ninja:dashboard:stats', {
        detail: { stats }
      }));
    }

    renderLeads() {
      const container = document.querySelector('[data-dashboard="leads"]');
      if (!container) return;

      const leads = this.dashboard.leads;

      // Dispatch event with leads data
      document.dispatchEvent(new CustomEvent('ninja:dashboard:leads', {
        detail: { leads }
      }));

      // If container has a template, render it
      const template = container.querySelector('[data-lead-template]');
      if (template) {
        container.innerHTML = '';
        leads.forEach(lead => {
          const item = template.cloneNode(true);
          item.removeAttribute('data-lead-template');
          item.style.display = '';
          
          // Replace placeholders
          const html = item.innerHTML
            .replace(/\{\{name\}\}/g, lead.name || 'Unnamed Lead')
            .replace(/\{\{email\}\}/g, lead.email || '')
            .replace(/\{\{phone\}\}/g, lead.phone || '')
            .replace(/\{\{status\}\}/g, lead.status)
            .replace(/\{\{notes\}\}/g, lead.notes || '')
            .replace(/\{\{source\}\}/g, lead.source || '')
            .replace(/\{\{createdAt\}\}/g, new Date(lead.createdAt).toLocaleDateString());
          
          item.innerHTML = html;
          container.appendChild(item);
        });
      }
    }

    renderProperties() {
      const container = document.querySelector('[data-dashboard="properties"]');
      if (!container) return;

      const properties = this.dashboard.properties;

      // Dispatch event with properties data
      document.dispatchEvent(new CustomEvent('ninja:dashboard:properties', {
        detail: { properties }
      }));

      // If container has a template, render it
      const template = container.querySelector('[data-property-template]');
      if (template) {
        container.innerHTML = '';
        properties.forEach(property => {
          const item = template.cloneNode(true);
          item.removeAttribute('data-property-template');
          item.style.display = '';
          
          // Replace placeholders
          const price = property.price ? `$${property.price.toLocaleString()}` : 'Price not set';
          const location = [property.address, property.city, property.state]
            .filter(Boolean).join(', ') || 'Location not specified';
          
          const html = item.innerHTML
            .replace(/\{\{title\}\}/g, property.title || 'Untitled Property')
            .replace(/\{\{price\}\}/g, price)
            .replace(/\{\{location\}\}/g, location)
            .replace(/\{\{status\}\}/g, property.status)
            .replace(/\{\{type\}\}/g, property.type)
            .replace(/\{\{bedrooms\}\}/g, property.bedrooms || '')
            .replace(/\{\{bathrooms\}\}/g, property.bathrooms || '')
            .replace(/\{\{createdAt\}\}/g, new Date(property.createdAt).toLocaleDateString());
          
          item.innerHTML = html;
          container.appendChild(item);
        });
      }
    }
  }

  /**
   * Initialize Dashboard
   */
  async function initDashboard() {
    // Check authentication
    if (!authService.isAuthenticated()) {
      console.warn('Agent Dashboard: User not authenticated');
      return null;
    }

    // Check permissions
    if (!authService.hasAnyRole('agent', 'owner', 'admin', 'developer')) {
      console.warn('Agent Dashboard: User does not have permission');
      return null;
    }

    try {
      const dashboard = new AgentDashboard(apiClient, authService);
      await dashboard.loadDashboard();
      
      const renderer = new DashboardRenderer(dashboard);
      renderer.render();

      // Expose globally
      window.NinjaAgentDashboard = dashboard;
      window.NinjaDashboardRenderer = renderer;

      // Dispatch ready event
      document.dispatchEvent(new CustomEvent('ninja:dashboard:ready', {
        detail: { dashboard }
      }));

      return dashboard;
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      return null;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for auth to be ready
      if (authService.isAuthenticated()) {
        initDashboard();
      } else {
        document.addEventListener('ninja:auth:login', () => {
          initDashboard();
        });
      }
    });
  } else {
    if (authService.isAuthenticated()) {
      initDashboard();
    } else {
      document.addEventListener('ninja:auth:login', () => {
        initDashboard();
      });
    }
  }

  // Expose init function
  window.initNinjaDashboard = initDashboard;
})();
