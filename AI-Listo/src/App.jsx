import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import "./i18n/config";
import { LegacyPropertyRedirect, LegacyLeadRedirect } from "./components/LegacyRedirect";
import SignIn from "./pages/auth/SignIn";
import Dashboard from "./pages/dashboard/Dashboard";
import PropertiesList from "./pages/properties/PropertiesList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetail from "./pages/properties/PropertyDetail";
import LeadsList from "./pages/leads/LeadsList";
import LeadDetail from "./pages/leads/LeadDetail";
import Pipeline from "./pages/pipeline/Pipeline";
import Contacts from "./pages/contacts/Contacts";
import AIAssistant from "./pages/ai-assistant/AIAssistant";
import AIAutomations from "./pages/ai-automations/AIAutomations";
import Analytics from "./pages/dashboard/Analytics";
import Team from "./pages/team/Team";
import Integrations from "./pages/integrations/Integrations";
import WhatsApp from "./pages/whatsapp/WhatsApp";
import Instagram from "./pages/instagram/Instagram";
import Billing from "./pages/billing/Billing";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/account/Profile";
import AccountBilling from "./pages/account/Billing";
import AccountSettings from "./pages/account/Settings";
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
        
        {/* Leads Routes */}
        <Route path="leads" element={<LeadsList />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        
        {/* Pipeline Route */}
        <Route path="pipeline" element={<Pipeline />} />
        
        {/* Properties Routes */}
        <Route path="properties" element={<PropertiesList />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        
        {/* Contacts Route */}
        <Route path="contacts" element={<Contacts />} />
        
        {/* AI Routes */}
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="ai-automations" element={<AIAutomations />} />
        
        {/* Analytics Route */}
        <Route path="analytics" element={<Analytics />} />
        
        {/* Team Route */}
        <Route path="team" element={<Team />} />
        
        {/* Integrations Route */}
        <Route path="integrations" element={<Integrations />} />
        
        {/* WhatsApp Route */}
        <Route path="whatsapp" element={<WhatsApp />} />
        
        {/* Instagram Route */}
        <Route path="instagram" element={<Instagram />} />
        
        {/* Billing Route (legacy - redirects to account/billing) */}
        <Route path="billing" element={<Navigate to="/account/billing" replace />} />
        
        {/* Settings Route (legacy - redirects to account/settings) */}
        <Route path="settings" element={<Navigate to="/account/settings" replace />} />
      </Route>

      {/* Account Routes - Outside dashboard but still protected */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<Profile />} />
        <Route path="billing" element={<AccountBilling />} />
        <Route path="settings" element={<AccountSettings />} />
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
