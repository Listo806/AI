/**
 * Standalone Authentication Module for Webflow
 * 
 * This file can be hosted externally and loaded via script tag:
 * <script src="https://your-backend.onrender.com/api/webflow/auth.js"></script>
 * 
 * Features:
 * - Page-based authentication (/sign-in, /sign-up)
 * - Automatic form handling
 * - Redirect on success
 * - Error handling
 */

(function() {
  'use strict';

  // Configuration - Update these values
  const CONFIG = {
    API_BASE_URL: 'https://ai-2-7ikc.onrender.com/api', // Update with your backend URL
    DASHBOARD_URL: '/dashboard',
    STORAGE_PREFIX: 'listo_',
  };

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
   * Page Router
   */
  class PageRouter {
    constructor() {
      this.currentPath = window.location.pathname;
    }

    isSignInPage() {
      return this.currentPath === '/sign-in' || this.currentPath.endsWith('/sign-in');
    }

    isSignUpPage() {
      return this.currentPath === '/sign-up' || this.currentPath.endsWith('/sign-up');
    }

    redirect(url) {
      window.location.href = url;
    }

    redirectToDashboard() {
      this.redirect(CONFIG.DASHBOARD_URL);
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
      // Sign In Form
      const signInForm = document.getElementById('signin-form');
      if (signInForm) {
        signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
      }

      // Sign Up Form
      const signUpForm = document.getElementById('signup-form');
      if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
      }
    }

    async handleSignIn(e) {
      e.preventDefault();
      
      const emailInput = document.getElementById('signin-email');
      const passwordInput = document.getElementById('signin-password');
      const errorElement = document.getElementById('signin-error');

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
        this.setFormLoading('signin-form', true);

        await this.authService.login(email, password);
        
        // Success - redirect to dashboard
        this.router.redirectToDashboard();
      } catch (error) {
        this.showError(errorElement, error.message);
        this.setFormLoading('signin-form', false);
      }
    }

    async handleSignUp(e) {
      e.preventDefault();
      
      const nameInput = document.getElementById('signup-name');
      const emailInput = document.getElementById('signup-email');
      const passwordInput = document.getElementById('signup-password');
      const errorElement = document.getElementById('signup-error');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Clear previous errors
      this.clearError(errorElement);

      // Validation
      if (!name || !email || !password) {
        this.showError(errorElement, 'Please fill in all fields.');
        return;
      }

      if (password.length < 6) {
        this.showError(errorElement, 'Password must be at least 6 characters long.');
        return;
      }

      try {
        // Disable form during submission
        this.setFormLoading('signup-form', true);

        // Sign up with default role 'owner' (can be changed)
        await this.authService.signup(email, password, 'owner');
        
        // Success - redirect to dashboard
        this.router.redirectToDashboard();
      } catch (error) {
        this.showError(errorElement, error.message);
        this.setFormLoading('signup-form', false);
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
      element.style.display = 'none';
    }

    setFormLoading(formId, loading) {
      const form = document.getElementById(formId);
      if (!form) return;

      const submitButton = form.querySelector('button[type="submit"]');
      const inputs = form.querySelectorAll('input, button');

      if (loading) {
        inputs.forEach(input => {
          input.disabled = true;
        });
        if (submitButton) {
          submitButton.textContent = 'Loading...';
        }
      } else {
        inputs.forEach(input => {
          input.disabled = false;
        });
        if (submitButton) {
          if (formId === 'signin-form') {
            submitButton.textContent = 'Sign In';
          } else if (formId === 'signup-form') {
            submitButton.textContent = 'Create Account';
          }
        }
      }
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

    // Check if user is already authenticated
    if (authService.isAuthenticated() && (router.isSignInPage() || router.isSignUpPage())) {
      // Already logged in, redirect to dashboard
      router.redirectToDashboard();
      return;
    }

    // Initialize form handlers
    if (router.isSignInPage() || router.isSignUpPage()) {
      formHandler.init();
    }

    // Expose globally for external use
    window.NinjaAuth = {
      apiClient,
      authService,
      router,
      formHandler,
      isAuthenticated: () => authService.isAuthenticated(),
      logout: () => {
        apiClient.clearTokens();
        localStorage.removeItem(CONFIG.STORAGE_PREFIX + 'user');
        window.location.href = '/sign-in';
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
