import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { isInternalAccount } from '../utils/internalAccess';

const AuthContext = createContext(null);
const STORAGE_PREFIX = 'listo_';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in and verify token
    const checkAuth = async () => {
          const userStr = localStorage.getItem(STORAGE_PREFIX + 'user');
          const token = apiClient.accessToken || localStorage.getItem(STORAGE_PREFIX + 'access_token');

          let cachedUser = null;

          if (token && !apiClient.accessToken) {
            apiClient.setTokens(token, null);
          }

          if (userStr && userStr !== 'undefined') {
            try {
              cachedUser = JSON.parse(userStr);
              setUser(cachedUser);
            } catch {
              localStorage.removeItem(STORAGE_PREFIX + 'user');
            }
          }

          if (token) {
            try {
              const currentUser = await apiClient.request('/users/me');

              // Accept both the bare user object and a { user } wrapper.
              const u = currentUser?.user ?? currentUser;
              if (u && u.id) {
                setUser(u);
                localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(u));
              }
            } catch (error) {
              console.error('❌ /users/me FAILED:', error);

              // chỉ logout nếu KHÔNG có cache
              if (!cachedUser) {
                setUser(null);
              }
            }
          } else {
            if (!cachedUser) setUser(null);
          }

          setLoading(false);
        };

    checkAuth();
  }, []);

  const getDashboardPath = (role) => {
    const paths = {
      owner: '/dashboard/whatsapp',
      agent: '/dashboard/whatsapp',
      developer: '/dashboard/whatsapp',
      admin: '/dashboard/admin/listings',
      super_admin: '/dashboard/admin/listings',
      wholesaler: '/dashboard/wholesalers',
      investor: '/dashboard/investors',
      va: '/dashboard/properties',
      va_uploader: '/dashboard/va-upload',
      user: '/dashboard/platform-listings',
    };
    return paths[role] || '/dashboard';
  };

  // `options.redirect` (default true) lets callers authenticate without the
  // built-in role-based navigation — e.g. the accept-invite flow, which needs to
  // accept the invitation first and then land the user on /dashboard/team.
  const login = async (email, password, options = {}) => {
    const { redirect = true } = options;
    try {
      const response = await apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.accessToken) {
        apiClient.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
        localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(response.user));

        if (redirect) {
          const u = response.user || {};
          const verificationPending =
            String(u.paymentStatus || '').toLowerCase() === 'paid_email_verification_pending' ||
            String(u.accountStatus || '').toLowerCase() === 'paid_email_verification_pending';
          if (verificationPending && !isInternalAccount(u)) {
            const path = window.location.pathname;
            const prefix = path.startsWith('/es-ec/') ? '/es-ec' : path.startsWith('/es/') ? '/es' : path.startsWith('/pt/') ? '/pt' : '';
            navigate(`${prefix}/verify-email`);
            return response;
          }

          // Resume checkout: an unpaid owner with a selected plan is sent back to
          // the checkout page instead of the dashboard so they can finish paying.
          // 'trialing' = paid subscription in its trial; must not be sent back to checkout.
          const paid = ['active', 'paid', 'trialing'].includes(String(u.paymentStatus || '').toLowerCase());
          const isFreePlan = String(u.selectedPlan || '').toLowerCase() === 'free';
          // Free tier has CRM access without paying — never bounce a Free owner to
          // checkout (matches the DashboardLayout exemption). Only an owner who
          // picked a PAID plan and hasn't paid is sent back to finish checkout.
          // Only a CUSTOMER account that picked a paid plan and has not paid is
          // sent back to finish checkout. Internal staff never are, and an
          // account with no role is never assumed to be an unpaid customer.
          if (
            !paid &&
            !isFreePlan &&
            u.selectedPlan &&
            u.role === 'owner' &&
            !isInternalAccount(u)
          ) {
            navigate(`/checkout?plan=${encodeURIComponent(u.selectedPlan)}`);
            return response;
          }

          // Internal staff land in the admin area whatever their customer role is.
          if (isInternalAccount(u)) {
            navigate('/dashboard/admin/listings');
            return response;
          }

          // Redirect based on user role
          const role = response.user?.role;
          if (role === 'va') {
            navigate('/dashboard/properties');
          } else if (role === 'va_uploader') {
            navigate('/dashboard/va-upload');
          } else if (role === 'super_admin' || role === 'admin') {
            navigate('/dashboard/admin/listings');
          } else if (role === 'user') {
            navigate(getDashboardPath(role));
          } else {
            navigate('/dashboard');
          }
        }

      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    apiClient.clearTokens();
    localStorage.removeItem(STORAGE_PREFIX + 'user');
    setUser(null);
    navigate('/sign-in');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const refreshUser = async () => {
    if (!apiClient.accessToken) return;
    try {
      const currentUser = await apiClient.request('/users/me');
      // /users/me returns the user object directly (no { user } wrapper).
      // Previously `currentUser.user` was undefined here, which logged the
      // customer out right after a successful payment.
      const u = currentUser?.user ?? currentUser;
      if (u && u.id) {
        setUser(u);
        localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(u));
        return u;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated,
    getDashboardPath,
    refreshUser,
  };
    if (loading) {
      return (
        <div className="app-splash">
          <div className="app-splash-word">CORTEXA</div>
          <div className="app-spinner" />
        </div>
      );
    }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
