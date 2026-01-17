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
      const token = apiClient.accessToken;

      if (userStr && token) {
        try {
          const userData = JSON.parse(userStr);
          // Verify token is still valid
          try {
            const currentUser = await apiClient.request('/users/me');
            // Token is valid - update user data
            setUser(currentUser);
            localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(currentUser));
          } catch (error) {
            // Token invalid - clear everything
            console.error('Token validation failed:', error);
            apiClient.clearTokens();
            localStorage.removeItem(STORAGE_PREFIX + 'user');
            setUser(null);
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
          localStorage.removeItem(STORAGE_PREFIX + 'user');
          apiClient.clearTokens();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const getDashboardPath = (role) => {
    const paths = {
      owner: '/dashboard/owners',
      agent: '/dashboard/agent',
      developer: '/dashboard/developer',
      admin: '/dashboard/admin',
      wholesaler: '/dashboard/wholesalers',
      investor: '/dashboard/investors',
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
        
        // Redirect to dashboard (all users go to /dashboard now)
        navigate('/dashboard');
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
    return !!apiClient.accessToken && !!user;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
