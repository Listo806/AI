import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SignIn from "./pages/auth/SignIn";
import Dashboard from "./pages/dashboard/Dashboard";
import PropertiesList from "./pages/properties/PropertiesList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetail from "./pages/properties/PropertyDetail";
import Listings from "./pages/listings/Listings";
import ListingDetail from "./pages/listings/ListingDetail";
import LeadsList from "./pages/leads/LeadsList";
import LeadDetail from "./pages/leads/LeadDetail";

// Root route handler - shows sign-in or redirects to role-based dashboard
function RootRoute() {
  const { isAuthenticated, loading, user, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated() && user) {
    // User is authenticated - redirect to role-based dashboard
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  // Not authenticated - show sign-in
  return <SignIn />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/owners" element={<Dashboard />} />
      <Route path="/dashboard/agent" element={<Dashboard />} />
      <Route path="/dashboard/developer" element={<Dashboard />} />
      <Route path="/dashboard/admin" element={<Dashboard />} />
      <Route path="/dashboard/wholesalers" element={<Dashboard />} />
      <Route path="/dashboard/investors" element={<Dashboard />} />
      <Route path="/properties" element={<PropertiesList />} />
      <Route path="/properties/new" element={<PropertyForm />} />
      <Route path="/properties/:id/edit" element={<PropertyForm />} />
      <Route path="/properties/:id" element={<PropertyDetail />} />
      {/* Leads */}
      <Route path="/leads" element={<LeadsList />} />
      <Route path="/leads/:id" element={<LeadDetail />} />
      {/* Public Listings */}
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}