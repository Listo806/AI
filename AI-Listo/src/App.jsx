import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";
import ProtectedRoute from "./components/ProtectedRoute";
import VaRouteGuard from "./components/VaRouteGuard";
import DashboardLayout from "./layouts/DashboardLayout";
import "./i18n/config";
import { LegacyPropertyRedirect, LegacyLeadRedirect } from "./components/LegacyRedirect";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Dashboard from "./pages/dashboard/Dashboard";
import PropertiesList from "./pages/properties/PropertiesList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetail from "./pages/properties/PropertyDetail";
import LeadsList from "./pages/leads/LeadsList";
import LeadDetail from "./pages/leads/LeadDetail";
import Pipeline from "./pages/pipeline/Pipeline";
import Contacts from "./pages/contacts/Contacts";
import AICenterOverview from "./pages/ai-center/AICenterOverview";
import AIAutoReply from "./pages/ai-center/AIAutoReply";
import AIAppointmentSetter from "./pages/ai-center/AIAppointmentSetter";
import AIQualificationRules from "./pages/ai-center/AIQualificationRules";
import AIMessaging from "./pages/ai-center/AIMessaging";
import AIActivityLogs from "./pages/ai-center/AIActivityLogs";
import AIAssistant from "./pages/ai-assistant/AIAssistant";
import Analytics from "./pages/dashboard/Analytics";
import Team from "./pages/team/Team";
import Integrations from "./pages/integrations/Integrations";
import WebhooksPage from "./pages/integrations/WebhooksPage";
import EmailProviderPage from "./pages/integrations/EmailProviderPage";
import ZapierPage from "./pages/integrations/ZapierPage";
import { WhatsAppPrimaryRoute, WhatsAppQrRoute } from "./components/WhatsAppRoute";
import Instagram from "./pages/instagram/Instagram";
import Billing from "./pages/billing/Billing";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/account/Profile";
import AccountBilling from "./pages/account/Billing";
import AccountSettings from "./pages/account/Settings";
import Listings from "./pages/listings/Listings";
import ListingDetail from "./pages/listings/ListingDetail";
import VacationRentalsSearch from "./pages/vacation-rentals/VacationRentalsSearch";
import VacationRentalsSearchDetail from "./pages/vacation-rentals/VacationRentalsSearchDetail";
import View from "./pages/view/View";
import PlatformListings from "./pages/platform/PlatformListings";
import VaUpload from "./pages/va/VaUpload";
import AdminListings from "./pages/admin/AdminListings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminPlans from "./pages/admin/AdminPlans";
import DashboardIndexRedirect from "./components/DashboardIndexRedirect";

// Root route handler - shows sign-in or redirects to dashboard
function RootRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated()) {
    const role = user?.role?.toLowerCase?.() || user?.role;
    if (role === 'va') return <Navigate to="/dashboard/properties" replace />;
    if (role === 'va_uploader') return <Navigate to="/dashboard/va-upload" replace />;
    if (role === 'super_admin' || role === 'admin') return <Navigate to="/dashboard/admin/listings" replace />;
    if (role === 'user') return <Navigate to="/dashboard/platform-listings" replace />;
    return <Navigate to="/dashboard/whatsapp" replace />;
  }

  // Not authenticated - show sign-in
  return <Navigate to="/sign-in" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/sign-in" element={<SignIn variant="crm" />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/internal/sign-in" element={<SignIn variant="internal" />} />
      <Route path="/team/sign-in" element={<SignIn variant="internal" />} />
      
      {/* Public Listings (no auth required) */}
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/vacation-rentals/search" element={<VacationRentalsSearch />} />
      <Route path="/vacation-rentals/search/:id" element={<VacationRentalsSearchDetail />} />
      {/* Tokenized webview link from WhatsApp property card */}
      <Route path="/view" element={<View />} />

      {/* Protected Dashboard Routes - All under /dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <VaRouteGuard>
              <DashboardLayout />
            </VaRouteGuard>
          </ProtectedRoute>
        }
      >
        {/* Dashboard Index - Redirect based on role */}
        <Route index element={<DashboardIndexRedirect />} />
        
        {/* Dashboard Home Route - Actual dashboard page */}
        <Route path="home" element={<Dashboard />} />
        
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
        
        {/* Platform Marketplace (Agent/Owner/User) */}
        <Route path="platform-listings" element={<PlatformListings />} />
        
        {/* VA Upload */}
        <Route path="va-upload" element={<VaUpload />} />
        
        {/* Admin */}
        <Route path="admin/listings" element={<AdminListings />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/teams" element={<AdminTeams />} />
        <Route path="admin/plans" element={<AdminPlans />} />
        
        {/* Contacts Route */}
        <Route path="contacts" element={<Contacts />} />
        
        {/* AI Center Routes */}
        <Route path="ai-center" element={<AICenterOverview />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="ai-auto-reply" element={<AIAutoReply />} />
        <Route path="ai-appointment-setter" element={<AIAppointmentSetter />} />
        <Route path="ai-qualification-rules" element={<AIQualificationRules />} />
        <Route path="ai-messaging" element={<AIMessaging />} />
        <Route path="ai-logs" element={<AIActivityLogs />} />
        
        {/* Analytics Route */}
        <Route path="analytics" element={<Analytics />} />
        
        {/* Team Route */}
        <Route path="team" element={<Team />} />
        
        {/* Integrations Routes */}
        <Route path="integrations" element={<Integrations />} />
        <Route path="integrations/webhooks" element={<WebhooksPage />} />
        <Route path="integrations/email" element={<EmailProviderPage />} />
        <Route path="integrations/zapier" element={<ZapierPage />} />
        
        {/* WhatsApp: VITE_WHATSAPP_UI twilio|qr|both — see src/config/whatsappUi.js */}
        <Route path="whatsapp" element={<WhatsAppPrimaryRoute />} />
        <Route path="whatsapp-qr" element={<WhatsAppQrRoute />} />
        
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
            <VaRouteGuard>
              <DashboardLayout />
            </VaRouteGuard>
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
