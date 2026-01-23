/**
 * Standalone Authentication Module for Webflow
 * 
 * This file can be hosted externally and loaded via script tag:
 * <script src="https://your-backend.onrender.com/static/auth.js"></script>
 * 
 * Features:
 * - Auth/session checks
 * - Protected route logic (redirects to /sign-in if not authenticated)
 * - Token handling with automatic refresh
 * - Form handling for /sign-in and /sign-up pages only
 * - No UI overrides on public pages
 */

(function() {
  'use strict';

  // Configuration - Update these values
  const CONFIG = {
    API_BASE_URL: 'https://ai-2-7ikc.onrender.com/api', // Update with your backend URL
    DASHBOARD_URL: '/dashboard',
    SIGN_IN_URL: '/sign-in',
    STORAGE_PREFIX: 'listo_',
    // Role-based dashboard paths
    DASHBOARD_PATHS: {
      owner: '/dashboard/owners',
      agent: '/dashboard/agent',
      developer: '/dashboard/developer',
      admin: '/dashboard/admin',
      wholesaler: '/dashboard/wholesalers',
      investor: '/dashboard/investors',
    },
    // Pages that require authentication (add your protected routes here)
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

  // Detect local testing environment (simple HTTP server, no routing)
  // For local testing, we'll disable automatic redirects to avoid 404 errors
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
            
            // Only redirect if not already on sign-in/sign-up page
            const currentPath = window.location.pathname;
            if (currentPath !== CONFIG.SIGN_IN_URL && !currentPath.endsWith('/sign-up')) {
              window.location.href = CONFIG.SIGN_IN_URL;
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
            window.location.href = CONFIG.SIGN_IN_URL;
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

    setCurrentUser(user) {
      localStorage.setItem(CONFIG.STORAGE_PREFIX + 'user', JSON.stringify(user));
      document.dispatchEvent(new CustomEvent('ninja:auth:login', {
        detail: { user }
      }));
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
   * Get role-based dashboard URL
   */
  function getDashboardUrlForRole(role) {
    if (!role) return CONFIG.DASHBOARD_URL;
    
    // Normalize role to lowercase
    const normalizedRole = role.toLowerCase();
    
    // Return role-specific dashboard or default
    return CONFIG.DASHBOARD_PATHS[normalizedRole] || CONFIG.DASHBOARD_URL;
  }

  /**
   * Page Router
   * Handles routing for both production (path-based) and local testing
   */
  class PageRouter {
    constructor() {
      this.currentPath = window.location.pathname;
    }

    isSignInPage() {
      return this.currentPath === CONFIG.SIGN_IN_URL || 
             this.currentPath.endsWith('/sign-in') ||
             this.currentPath.includes('sign-in') ||
             this.currentPath.includes('auth-test');
    }

    isSignUpPage() {
      return this.currentPath === '/sign-up' || 
             this.currentPath.endsWith('/sign-up') ||
             this.currentPath.includes('sign-up');
    }

    isProtectedPage() {
      // Check if current page is in protected pages list
      return CONFIG.PROTECTED_PAGES.some(protectedPath => 
        this.currentPath === protectedPath || 
        this.currentPath.startsWith(protectedPath + '/') ||
        this.currentPath.includes('dashboard')
      );
    }

    isPublicPage() {
      return this.isSignInPage() || this.isSignUpPage();
    }

    redirect(url) {
      if (IS_LOCAL_TESTING) {
        // For local testing, don't redirect to avoid 404 errors
        // Instead, dispatch an event that test pages can listen to
        console.log('[Local Testing] Would redirect to:', url);
        document.dispatchEvent(new CustomEvent('ninja:auth:redirect', {
          detail: { url: url, type: url.includes('dashboard') ? 'dashboard' : 'sign-in' }
        }));
        return;
      }
      // For production, use full page navigation
      window.location.href = url;
    }

    redirectToDashboard(role) {
      // Get role-based dashboard URL
      const dashboardUrl = role ? getDashboardUrlForRole(role) : CONFIG.DASHBOARD_URL;
      this.redirect(dashboardUrl);
    }

    redirectToSignIn() {
      this.redirect(CONFIG.SIGN_IN_URL);
    }
  }

  /**
   * Form Handler
   */
  class FormHandler {
    constructor(authService, router) {
      this.authService = authService;
      this.router = router;
    }

    init() {
      // Sign In Form - using Webflow form ID
      const signInForm = document.getElementById('lqSigninForm');
      if (signInForm) {
        signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
      }

      // Sign Up Form - using Webflow form ID
      const signUpForm = document.getElementById('lqSignupForm');
      if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
      }
    }

    async handleSignIn(e) {
      e.preventDefault();
      
      const form = e.target;
      // Find inputs within the form context (using class selectors)
      const emailInput = form.querySelector('.auth-email') || form.querySelector('#lqEmail');
      const passwordInput = form.querySelector('.auth-password') || form.querySelector('#lqPass');
      const errorElement = form.querySelector('.auth-error') || form.querySelector('.lq-error');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Clear previous errors
      this.clearError(errorElement);

      // Validation
      if (!email || !password) {
        this.showError(errorElement, 'Please enter both email and password.');
        return;
      }

      try {
        // Disable form during submission
        this.setFormLoading('lqSigninForm', true);

        const response = await this.authService.login(email, password);
        
        // Success - redirect to role-based dashboard
        const userRole = response.user?.role || getCurrentUser()?.role;
        this.router.redirectToDashboard(userRole);
      } catch (error) {
        this.showError(errorElement, error.message);
        this.setFormLoading('lqSigninForm', false);
      }
    }

    async handleSignUp(e) {
      e.preventDefault();
      
      const form = e.target;
      // Find inputs within the form context (using class selectors)
      const emailInput = form.querySelector('.auth-email') || form.querySelector('#lqEmail');
      const passwordInput = form.querySelector('.auth-password') || form.querySelector('#lqPass');
      const roleSelect = form.querySelector('#signupRole');
      const errorElement = form.querySelector('.auth-error') || form.querySelector('.lq-error');

      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const role = roleSelect ? roleSelect.value : 'owner';

      // Clear previous errors
      this.clearError(errorElement);

      // Validation
      if (!email || !password) {
        this.showError(errorElement, 'Please fill in all fields.');
        return;
      }

      if (password.length < 6) {
        this.showError(errorElement, 'Password must be at least 6 characters long.');
        return;
      }

      try {
        // Disable form during submission
        this.setFormLoading('lqSignupForm', true);

        // Sign up with selected role (defaults to 'owner')
        const response = await this.authService.signup(email, password, role);
        
        // Success - redirect to role-based dashboard
        const userRole = response.user?.role || role;
        this.router.redirectToDashboard(userRole);
      } catch (error) {
        this.showError(errorElement, error.message);
        this.setFormLoading('lqSignupForm', false);
      }
    }

    showError(element, message) {
      if (!element) return;
      
      element.textContent = message;
      element.style.display = 'block';
      element.style.color = '#ef4444';
      
      // Scroll to error
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    clearError(element) {
      if (!element) return;
      element.textContent = '';
      // Don't hide the element completely - just clear the text
      // Webflow may have styling that depends on the element existing
    }

    setFormLoading(formId, loading) {
      const form = document.getElementById(formId);
      if (!form) return;

      const submitButton = form.querySelector('button[type="submit"]') || form.querySelector('.form-auth-submit');
      const inputs = form.querySelectorAll('input, select, button');

      if (loading) {
        inputs.forEach(input => {
          input.disabled = true;
        });
        if (submitButton) {
          const originalText = submitButton.textContent || submitButton.innerText;
          submitButton.setAttribute('data-original-text', originalText);
          submitButton.textContent = 'Loading...';
        }
      } else {
        inputs.forEach(input => {
          input.disabled = false;
        });
        if (submitButton) {
          const originalText = submitButton.getAttribute('data-original-text');
          if (originalText) {
            submitButton.textContent = originalText;
            submitButton.removeAttribute('data-original-text');
          } else {
            // Fallback to default text
            if (formId === 'lqSigninForm') {
              submitButton.textContent = 'Sign In';
            } else if (formId === 'lqSignupForm') {
              submitButton.textContent = 'Sign Up';
            }
          }
        }
      }
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

    /**
     * Check if current page requires authentication and handle accordingly
     */
    async checkProtectedRoute() {
      // Skip check for public pages (sign-in, sign-up)
      if (this.router.isPublicPage()) {
        // If already authenticated on sign-in/sign-up, redirect to role-based dashboard
        if (this.authService.isAuthenticated()) {
          const user = getCurrentUser();
          this.router.redirectToDashboard(user?.role);
        }
        return;
      }

      // Check if current page is protected
      if (this.router.isProtectedPage()) {
        // Verify session is still valid
        if (!this.authService.isAuthenticated()) {
          // Not authenticated - redirect to sign-in
          this.router.redirectToSignIn();
          return;
        }

        // Verify token is still valid by checking current user
        try {
          const userData = await this.apiClient.request('/users/me');
          // Update stored user data in case it changed
          if (userData) {
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'user', JSON.stringify(userData));
          }
        } catch (error) {
          // Token invalid or expired - redirect to sign-in
          this.apiClient.clearTokens();
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
          this.router.redirectToSignIn();
        }
      }
      // For public pages (not sign-in/sign-up), do nothing - no redirects or UI overrides
    }
  }

  /**
   * Initialize Authentication
   */
  function initAuth() {
    const router = new PageRouter();
    const apiClient = new ApiClient(CONFIG.API_BASE_URL);
    const authService = new AuthService(apiClient);
    const formHandler = new FormHandler(authService, router);
    const protectedRouteHandler = new ProtectedRouteHandler(authService, router, apiClient);

    // Handle protected routes (check auth and redirect if needed)
    protectedRouteHandler.checkProtectedRoute();

    // Initialize form handlers ONLY for sign-in/sign-up pages
    if (router.isSignInPage() || router.isSignUpPage()) {
      formHandler.init();
    }

    // Expose globally for external use
    window.NinjaAuth = {
      apiClient,
      authService,
      router,
      formHandler,
      protectedRouteHandler,
      isAuthenticated: () => authService.isAuthenticated(),
      getCurrentUser: () => getCurrentUser(),
      getDashboardUrl: (role) => getDashboardUrlForRole(role),
      logout: () => {
        apiClient.clearTokens();
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
        router.redirectToSignIn();
      },
      checkAuth: async () => {
        // Verify current session
        try {
          const userData = await apiClient.request('/users/me');
          // Update stored user data
          if (userData) {
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'user', JSON.stringify(userData));
          }
          return true;
        } catch (error) {
          // Session invalid
          apiClient.clearTokens();
          localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
          if (router.isProtectedPage()) {
            router.redirectToSignIn();
          }
          return false;
        }
      },
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
