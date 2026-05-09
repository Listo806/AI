import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard for restricted roles:
 * - VA: can only access /dashboard/properties
 * - VA_UPLOADER: can only access /dashboard/va-upload
 * - SUPER_ADMIN / ADMIN: can only access /dashboard/admin/* and /account/*
 * All other roles: full access.
 */
export default function VaRouteGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return children;

  const role = user.role?.toLowerCase?.() || user.role;
  const path = location.pathname;

  // VA users: only properties
  if (role === 'va') {
    if (path.startsWith('/dashboard/properties')) return children;
    return <Navigate to="/dashboard/properties" replace />;
  }

  // VA_UPLOADER: only va-upload
  if (role === 'va_uploader') {
    if (path.startsWith('/dashboard/va-upload')) return children;
    return <Navigate to="/dashboard/va-upload" replace />;
  }

  // Super Admin / Admin: only admin and account routes
  // if (role === 'super_admin' || role === 'admin') {
    // if (path.startsWith('/dashboard/admin') || path.startsWith('/account')) return children;
    // return <Navigate to="/dashboard/admin/listings" replace />;
  // }

  return children;
}
