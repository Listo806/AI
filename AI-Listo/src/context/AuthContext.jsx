import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

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

        if (token && !apiClient.accessToken) {
          apiClient.setTokens(token, null);
        }

        if (userStr && !user) {
          try {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
          } catch (e) {
            console.error('Failed to parse stored user:', e);
            localStorage.removeItem(STORAGE_PREFIX + 'user');
          }
        }

        if (token) {
          try {
            const currentUser = await apiClient.request('/auth/me');
            setUser(currentUser.user);
            localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(currentUser.user));
          } catch (error) {
            console.error('❌ /auth/me FAILED:', error);

            // apiClient.clearTokens();
            // localStorage.removeItem(STORAGE_PREFIX + 'user');
            // setUser(null);
            const storedUser = localStorage.getItem(STORAGE_PREFIX + 'user');
              if (storedUser) {
                try {
                  setUser(JSON.parse(storedUser));
                } catch {}
              }
          }
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

  const login = async (email, password) => {
    try {
      const response = await apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.accessToken) {
        apiClient.setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
        localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(response.user));

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
      const currentUser = await apiClient.request('/auth/me');
      setUser(currentUser.user);
      localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(currentUser.user));
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
       return <div>Loading...</div>;
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
