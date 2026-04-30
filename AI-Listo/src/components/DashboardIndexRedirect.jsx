import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redirects /dashboard to the default page based on user role.
 * Super Admin and Admin -> /dashboard/admin/listings
 */
export default function DashboardIndexRedirect() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.() || user?.role;

  if (role === "super_admin" || role === "admin") {
    return <Navigate to="/dashboard/admin/listings" replace />;
  }

  return <Navigate to="/dashboard/whatsapp" replace />;
}
