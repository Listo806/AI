/**
 * Permission Checking Utilities
 * Role-based access control helpers for Webflow
 */

class Permissions {
  constructor(authService) {
    this.auth = authService;
  }

  /**
   * Check if user can access a feature based on role
   */
  canAccess(feature, requiredRoles = []) {
    if (!this.auth.isAuthenticated()) {
      return false;
    }

    if (requiredRoles.length === 0) {
      return true; // No role requirement
    }

    return this.auth.hasAnyRole(...requiredRoles);
  }

  /**
   * Check if user can view properties
   */
  canViewProperties() {
    return this.auth.isAuthenticated();
  }

  /**
   * Check if user can create properties
   */
  canCreateProperties() {
    return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
  }

  /**
   * Check if user can edit properties
   */
  canEditProperties() {
    return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
  }

  /**
   * Check if user can delete properties
   */
  canDeleteProperties() {
    return this.auth.hasAnyRole('owner', 'admin');
  }

  /**
   * Check if user can view leads
   */
  canViewLeads() {
    return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
  }

  /**
   * Check if user can create leads
   */
  canCreateLeads() {
    return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
  }

  /**
   * Check if user can edit leads
   */
  canEditLeads() {
    return this.auth.hasAnyRole('owner', 'agent', 'admin', 'developer');
  }

  /**
   * Check if user can delete leads
   */
  canDeleteLeads() {
    return this.auth.hasAnyRole('owner', 'admin');
  }

  /**
   * Check if user can access agent dashboard
   */
  canAccessAgentDashboard() {
    return this.auth.hasAnyRole('agent', 'owner', 'admin');
  }

  /**
   * Check if user can access admin panel
   */
  canAccessAdminPanel() {
    return this.auth.hasAnyRole('admin', 'developer');
  }

  /**
   * Check if user can manage teams
   */
  canManageTeams() {
    return this.auth.hasAnyRole('owner', 'admin');
  }

  /**
   * Check if user can manage subscriptions
   */
  canManageSubscriptions() {
    return this.auth.hasAnyRole('owner', 'admin');
  }

  /**
   * Check if user can view analytics
   */
  canViewAnalytics() {
    return this.auth.hasAnyRole('owner', 'admin', 'developer');
  }

  /**
   * Get redirect URL based on user role
   */
  getDefaultRedirectUrl() {
    if (!this.auth.isAuthenticated()) {
      return '/login';
    }

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

  /**
   * Protect a route - check if user can access
   */
  protectRoute(requiredRoles = [], redirectTo = '/login') {
    if (!this.auth.isAuthenticated()) {
      if (redirectTo) {
        window.location.href = redirectTo;
      }
      return false;
    }

    if (requiredRoles.length > 0 && !this.canAccess(null, requiredRoles)) {
      if (redirectTo) {
        window.location.href = redirectTo;
      }
      return false;
    }

    return true;
  }

  /**
   * Show/hide elements based on permissions
   */
  applyPermissionsToElements() {
    // Hide elements that require authentication if not logged in
    if (!this.auth.isAuthenticated()) {
      document.querySelectorAll('[data-require-auth]').forEach(el => {
        el.style.display = 'none';
      });
      return;
    }

    // Show authenticated-only elements
    document.querySelectorAll('[data-require-auth]').forEach(el => {
      el.style.display = '';
    });

    // Handle role-based visibility
    const role = this.auth.getUserRole();
    
    // Show elements for specific roles
    document.querySelectorAll(`[data-require-role]`).forEach(el => {
      const requiredRoles = el.getAttribute('data-require-role').split(',').map(r => r.trim());
      if (this.auth.hasAnyRole(...requiredRoles)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Hide elements for specific roles
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

// Export for use in modules
window.Permissions = Permissions;
