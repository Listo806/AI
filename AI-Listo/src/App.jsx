import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import { LegacyPropertyRedirect, LegacyLeadRedirect } from "./components/LegacyRedirect";
import SignIn from "./pages/auth/SignIn";
import Dashboard from "./pages/dashboard/Dashboard";
import PropertiesList from "./pages/properties/PropertiesList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetail from "./pages/properties/PropertyDetail";
import LeadsList from "./pages/leads/LeadsList";
import LeadDetail from "./pages/leads/LeadDetail";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import Listings from "./pages/listings/Listings";
import ListingDetail from "./pages/listings/ListingDetail";

// Root route handler - shows sign-in or redirects to dashboard
function RootRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated()) {
    // User is authenticated - redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated - show sign-in
  return <Navigate to="/sign-in" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/sign-in" element={<SignIn />} />
      
      {/* Public Listings (no auth required) */}
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />

      {/* Protected Dashboard Routes - All under /dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Index */}
        <Route index element={<Dashboard />} />
        
        {/* Properties Routes */}
        <Route path="properties" element={<PropertiesList />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        
        {/* Leads Routes */}
        <Route path="leads" element={<LeadsList />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        
        {/* Placeholder Pages */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Legacy Routes - Redirect to dashboard */}
      <Route path="/properties" element={<Navigate to="/dashboard/properties" replace />} />
      <Route path="/properties/:id" element={<LegacyPropertyRedirect />} />
      <Route path="/leads" element={<Navigate to="/dashboard/leads" replace />} />
      <Route path="/leads/:id" element={<LegacyLeadRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
            <NotificationToast />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
