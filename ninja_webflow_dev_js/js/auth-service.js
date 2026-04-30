/**
 * Authentication Service
 * Handles login, signup, session management, and role-based access
 */

class AuthService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.currentUser = null;
    this.init();
  }

  /**
   * Initialize - load user from storage
   */
  init() {
    const userStr = localStorage.getItem('ninja_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user from storage:', e);
        this.clearSession();
      }
    }
  }

  /**
   * Sign up a new user
   */
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

  /**
   * Login user
   */
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

  /**
   * Logout user
   */
  logout() {
    this.clearSession();
    this.apiClient.clearTokens();
    
    // Dispatch logout event
    document.dispatchEvent(new CustomEvent('ninja:auth:logout', {
      detail: { user: this.currentUser }
    }));
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.apiClient.accessToken;
  }

  /**
   * Get user role
   */
  getUserRole() {
    return this.currentUser?.role || null;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role) {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(...roles) {
    return roles.includes(this.currentUser?.role);
  }

  /**
   * Check if user is owner
   */
  isOwner() {
    return this.hasRole('owner');
  }

  /**
   * Check if user is agent
   */
  isAgent() {
    return this.hasRole('agent');
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Check if user is developer
   */
  isDeveloper() {
    return this.hasRole('developer');
  }

  /**
   * Verify current session is still valid
   */
  async verifySession() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const user = await this.apiClient.getCurrentUser();
      this.setCurrentUser(user);
      return true;
    } catch (error) {
      // Session invalid, clear it
      this.clearSession();
      return false;
    }
  }

  /**
   * Set current user
   */
  setCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('ninja_user', JSON.stringify(user));
    
    // Dispatch login event
    document.dispatchEvent(new CustomEvent('ninja:auth:login', {
      detail: { user }
    }));
  }

  /**
   * Clear session
   */
  clearSession() {
    this.currentUser = null;
    localStorage.removeItem('ninja_user');
  }

  /**
   * Get user team ID
   */
  getTeamId() {
    return this.currentUser?.teamId || null;
  }

  /**
   * Get user ID
   */
  getUserId() {
    return this.currentUser?.id || null;
  }
}

// Export for use in modules
window.AuthService = AuthService;
