import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard that blocks VA users from accessing non-properties routes
 * VA users can ONLY access:
 * - /dashboard/properties (and all sub-routes)
 * 
 * All other routes are blocked and redirected to /dashboard/properties
 */
export default function VaRouteGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // If user is not VA, allow access
  if (!user || user.role !== 'va') {
    return children;
  }

  // VA users can only access properties routes
  // Check if current path is a properties route (including /new, /:id, /:id/edit)
  const isPropertiesRoute = location.pathname.startsWith('/dashboard/properties');

  if (isPropertiesRoute) {
    return children;
  }

  // Block access - redirect to properties
  return <Navigate to="/dashboard/properties" replace />;
}
