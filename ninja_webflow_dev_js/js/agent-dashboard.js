/**
 * Agent Dashboard Service
 * Handles fetching and displaying assigned listings and leads for agents
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

  /**
   * Load all dashboard data
   */
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

  /**
   * Load leads assigned to current user
   */
  async loadLeads(status = null) {
    try {
      const allLeads = await this.apiClient.getLeads(status);
      const currentUserId = this.authService.getUserId();

      // Filter leads assigned to current user
      // If user is agent, show only assigned leads
      // If user is owner/admin, show all team leads
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

  /**
   * Load properties (listings) for current user/team
   */
  async loadProperties(type = null, status = null) {
    try {
      const filters = {};
      if (type) filters.type = type;
      if (status) filters.status = status;

      this.properties = await this.apiClient.getProperties(filters);
      return this.properties;
    } catch (error) {
      console.error('Failed to load properties:', error);
      throw error;
    }
  }

  /**
   * Get leads by status
   */
  getLeadsByStatus(status) {
    return this.leads.filter(lead => lead.status === status);
  }

  /**
   * Get properties by status
   */
  getPropertiesByStatus(status) {
    return this.properties.filter(property => property.status === status);
  }

  /**
   * Get recent leads (last N days)
   */
  getRecentLeads(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= cutoffDate;
    });
  }

  /**
   * Get recent properties (last N days)
   */
  getRecentProperties(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.properties.filter(property => {
      const propertyDate = new Date(property.createdAt);
      return propertyDate >= cutoffDate;
    });
  }

  /**
   * Calculate dashboard statistics
   */
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

  /**
   * Get dashboard statistics
   */
  getStats() {
    return this.stats;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId, newStatus) {
    try {
      const updatedLead = await this.apiClient.updateLead(leadId, { status: newStatus });
      
      // Update local lead
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

  /**
   * Get lead by ID
   */
  getLeadById(leadId) {
    return this.leads.find(lead => lead.id === leadId);
  }

  /**
   * Get property by ID
   */
  getPropertyById(propertyId) {
    return this.properties.find(property => property.id === propertyId);
  }

  /**
   * Filter leads by search term
   */
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

  /**
   * Filter properties by search term
   */
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

// Export for use in modules
window.AgentDashboard = AgentDashboard;
