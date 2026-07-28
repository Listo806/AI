import React, { useEffect } from "react";
import Landing from "./pages/landing/Landing";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { trackEvent, initAnalytics } from "./utils/track";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";
import ProtectedRoute from "./components/ProtectedRoute";
import VaRouteGuard from "./components/VaRouteGuard";
import DashboardLayout from "./layouts/DashboardLayout";
import "./i18n/config";
import {
  LegacyPropertyRedirect,
  LegacyLeadRedirect,
} from "./components/LegacyRedirect";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import SignUpDev from "./pages/auth/SignUpDev";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import Dashboard from "./pages/dashboard/Dashboard";
import Leads from "./pages/leads/LeadsList";
import PropertiesList from "./pages/properties/PropertiesList";
import PropertyForm from "./pages/properties/PropertyForm";
import PropertyDetail from "./pages/properties/PropertyDetail";
import LeadsList from "./pages/leads/LeadsList";
import LeadDetail from "./pages/leads/LeadDetail";
import Pipeline from "./pages/pipeline/Pipeline";
import Properties from "./pages/properties/PropertiesList";
import Contacts from "./pages/contacts/Contacts";

import Privacy from "./pages/common/Privacy";
import Refund from "./pages/common/Refund";
import Terms from "./pages/common/Terms";
import Cancellation from "./pages/common/Cancellation";
import Contact from "./pages/common/Contact";
import HelpCenter from "./pages/common/HelpCenter";
import About from "./pages/common/About";
import Support from "./pages/common/Support";
import CityPage from "./pages/common/CityPage";
import CountryPage from "./pages/common/CountryPage";

import Pricing from "./pages/common/Pricing";
import Trial from "./pages/common/Trial";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import LocaleLayout from "./components/LocaleLayout";
import PaymentSuccess from "./pages/checkout/PaymentSuccess";
import Onboarding from "./pages/checkout/Onboarding";

import CortexaAISetup from "./pages/ai-center/CortexaAISetup";
import CortexaAI from "./pages/ai-center/CortexaAI";
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
import {
  WhatsAppPrimaryRoute,
  WhatsAppQrRoute,
} from "./components/WhatsAppRoute";
import Instagram from "./pages/instagram/Instagram";
import CalendarPage from "./pages/calendar/CalendarPage";
import Billing from "./pages/billing/Billing";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/account/Profile";
import AccountBilling from "./pages/account/Billing";
import AccountSettings from "./pages/account/Settings";
import Listings from "./pages/listings/Listings";
import ListingDetail from "./pages/listings/ListingDetail";
import VacationRentalsSearch from "./pages/vacation-rentals/VacationRentalsSearch";
import VacationRentalsSearchDetail from "./pages/vacation-rentals/VacationRentalsSearchDetail";
import VacationRentalsUpload from "./pages/vacation-rentals/VacationRentalsUpload";
import View from "./pages/view/View";
import PlatformListings from "./pages/platform/PlatformListings";
import VaUpload from "./pages/va/VaUpload";
import AdminListings from "./pages/admin/AdminListings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminPlans from "./pages/admin/AdminPlans";
import DashboardIndexRedirect from "./components/DashboardIndexRedirect";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import InstagramPage from "./pages/integrations/InstagramPage";
import CrmImportPage from "./pages/integrations/CrmImportPage";
import CsvLeadImportPage from "./pages/integrations/CsvLeadImportPage";
import PropertyFeedPage from "./pages/integrations/PropertyFeedPage";
import MakePage from "./pages/integrations/MakePage";
import GoogleAdsPage from "./pages/integrations/GoogleAdsPage";
import ApiAccessPage from "./pages/integrations/ApiAccessPage";
import MlsIdxPage from "./pages/integrations/MlsIdxPage";
import TiktokPage from "./pages/integrations/TiktokPage";
import AppointmentPage from "./pages/integrations/AppointmentPage";
import TeamMembersPage from "./pages/team/TeamMembersPage";
import TeamAIInsightsPage from "./pages/team/TeamAIInsightsPage";
import TeamPerformancePage from "./pages/team/TeamPerformancePage";
import TeamActivityPage from "./pages/team/TeamActivityPage";
import TeamNotificationsPage from "./pages/team/TeamNotificationsPage";
import TeamManagePage from "./pages/team/TeamManagePage";
import TeamPendingInvitesPage from "./pages/team/TeamPendingInvitesPage";
import WhatsAppPage from "./pages/whatsapp/WhatsAppPage";
import LeadGeneratorPage from "./pages/generator/LeadGeneratorPage";
import SetupGuidePage from "./pages/common/SetupGuidePage";
import IntegrationsPage from "./pages/common/IntegrationsPage";
import FeaturesPage from "./pages/common/FeaturesPage";

function VacationUploadPublicRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/vacation-rentals/upload/${id}`} replace />;
}

// Root route handler - shows sign-in or redirects to dashboard
function RootRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // if (isAuthenticated()) {
  // const role = user?.role?.toLowerCase?.() || user?.role;
  // if (role === 'va') return <Navigate to="/dashboard/properties" replace />;
  // if (role === 'va_uploader') return <Navigate to="/dashboard/va-upload" replace />;
  // if (role === 'super_admin' || role === 'admin') return <Navigate to="/dashboard/admin/listings" replace />;
  // if (role === 'user') return <Navigate to="/dashboard/platform-listings" replace />;
  // return <Navigate to="/dashboard/whatsapp" replace />;
  // }
  return <Landing />;
  // Not authenticated - show sign-in
  return <Navigate to="/sign-in" replace />;
}

// The public marketing + funnel + legal pages, generated once per locale so
// English lives at the root, Spanish under /es, and Portuguese under /pt-br.
function publicRoutes(prefix) {
  const p = prefix ? `/${prefix}` : "";
  return (
    <>
      <Route path={p || "/"} element={<RootRoute />} />
      <Route path={`${p}/sign-in`} element={<SignIn variant="crm" />} />
      <Route path={`${p}/sign-up`} element={<SignUp />} />
      <Route path={`${p}/forgot-password`} element={<ForgotPassword />} />
      <Route path={`${p}/reset-password`} element={<ResetPassword />} />
      <Route path={`${p}/privacy-policy`} element={<Privacy />} />
      <Route path={`${p}/refund-policy`} element={<Refund />} />
      <Route path={`${p}/terms`} element={<Terms />} />
      <Route path={`${p}/cancellation`} element={<Cancellation />} />
      <Route path={`${p}/contact`} element={<Contact />} />
      <Route path={`${p}/help`} element={<HelpCenter />} />
      <Route path={`${p}/about`} element={<About />} />
      <Route path={`${p}/support`} element={<Support />} />
      <Route path={`${p}/features`} element={<FeaturesPage />} />
      <Route path={`${p}/integrations`} element={<IntegrationsPage />} />
      <Route path={`${p}/setup-guide`} element={<SetupGuidePage />} />
      <Route path={`${p}/pricing`} element={<Pricing />} />
      <Route path={`${p}/trial`} element={<Trial />} />
      <Route path={`${p}/checkout`} element={<CheckoutPage />} />
      <Route path={`${p}/payment-success`} element={<PaymentSuccess />} />
      <Route path={`${p}/onboarding`} element={<Onboarding />} />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public site — English at root, Spanish at /es, Portuguese at /pt-br.
          The URL decides the language; LocaleLayout sets it + hreflang/canonical. */}
      <Route element={<LocaleLayout code="en" />}>{publicRoutes("")}</Route>
      <Route element={<LocaleLayout code="es" />}>{publicRoutes("es")}</Route>
      <Route element={<LocaleLayout code="pt" />}>
        {publicRoutes("pt-br")}
      </Route>

      <Route path="/sign-up-dev" element={<SignUpDev />} />

      <Route path="/internal/sign-in" element={<SignIn variant="internal" />} />
      <Route path="/team/sign-in" element={<SignIn variant="internal" />} />

      {/* Public Listings (no auth required) — /buy = sale, /rent = rent, /listings = browse */}
      <Route path="/buy" element={<Listings />} />
      <Route path="/rent" element={<Listings />} />
      <Route path="/listings" element={<Listings />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route
        path="/vacation-rentals/search"
        element={<VacationRentalsSearch />}
      />
      <Route
        path="/vacation-rentals/search/:id"
        element={<VacationRentalsSearchDetail />}
      />
      <Route
        path="/vacation-rentals/upload"
        element={<Navigate to="/dashboard/vacation-rentals/upload" replace />}
      />
      <Route
        path="/vacation-rentals/upload/:id"
        element={<VacationUploadPublicRedirect />}
      />
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
        <Route
          path="vacation-rentals/upload"
          element={<VacationRentalsUpload />}
        />
        <Route
          path="vacation-rentals/upload/:id"
          element={<VacationRentalsUpload />}
        />

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
        <Route path="ai-cortexa-setup" element={<CortexaAI />} />
        <Route path="ai-cortexa" element={<CortexaAI />} />
        <Route path="ai-center" element={<AICenterOverview />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="ai-auto-reply" element={<AIAutoReply />} />
        <Route path="ai-appointment-setter" element={<AIAppointmentSetter />} />
        <Route
          path="ai-qualification-rules"
          element={<AIQualificationRules />}
        />
        <Route path="ai-messaging" element={<AIMessaging />} />
        <Route path="ai-logs" element={<AIActivityLogs />} />

        {/* Analytics Route */}
        <Route path="analytics" element={<Analytics />} />

        {/* Team Route */}
        <Route path="team" element={<Team />} />
        <Route path="team/members" element={<TeamMembersPage />} />
        <Route path="team/ai-insights" element={<TeamAIInsightsPage />} />
        <Route path="team/performance" element={<TeamPerformancePage />} />
        <Route path="team/activity" element={<TeamActivityPage />} />
        <Route path="team/notifications" element={<TeamNotificationsPage />} />
        <Route path="team/manage" element={<TeamManagePage />} />
        <Route path="team/invites" element={<TeamPendingInvitesPage />} />

        {/* Integrations Routes */}
        <Route path="integrations" element={<Integrations />} />
        <Route path="integrations/webhooks" element={<WebhooksPage />} />
        <Route path="integrations/email" element={<EmailProviderPage />} />
        <Route path="integrations/zapier" element={<ZapierPage />} />
        <Route path="integrations/google-drive" element={<GoogleDrivePage />} />
        <Route path="integrations/instagram" element={<InstagramPage />} />
        <Route path="integrations/crm-import" element={<CrmImportPage />} />
        <Route path="integrations/csv-leads" element={<CsvLeadImportPage />} />
        <Route
          path="integrations/property-feed"
          element={<PropertyFeedPage />}
        />
        <Route path="integrations/make" element={<MakePage />} />
        <Route path="integrations/google-ads" element={<GoogleAdsPage />} />
        <Route path="integrations/api-access" element={<ApiAccessPage />} />
        <Route path="integrations/mls" element={<MlsIdxPage />} />
        <Route path="integrations/tiktok" element={<TiktokPage />} />
        <Route
          path="integrations/ai-appointment"
          element={<AppointmentPage />}
        />
        <Route path="whatsapp" element={<WhatsAppPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="generator" element={<LeadGeneratorPage />} />

        {/* WhatsApp: VITE_WHATSAPP_UI twilio|qr|both — see src/config/whatsappUi.js 
        <Route path="whatsapp" element={<WhatsAppPrimaryRoute />} />*/}
        <Route path="whatsapp-qr" element={<WhatsAppQrRoute />} />

        {/* Instagram Route */}
        <Route path="instagram" element={<Instagram />} />

        {/* Billing Route (legacy - redirects to account/billing) */}
        <Route
          path="billing"
          element={<Navigate to="/account/billing" replace />}
        />

        {/* Settings Route (legacy - redirects to account/settings) */}
        <Route
          path="settings"
          element={<Navigate to="/account/settings" replace />}
        />
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
      <Route
        path="/properties"
        element={<Navigate to="/dashboard/properties" replace />}
      />
      <Route path="/properties/:id" element={<LegacyPropertyRedirect />} />
      <Route
        path="/leads"
        element={<Navigate to="/dashboard/leads" replace />}
      />
      <Route path="/leads/:id" element={<LegacyLeadRedirect />} />

      <Route path="/:country/:city" element={<CityPage />} />
      <Route path="/:country" element={<CountryPage />} />
    </Routes>
  );
}

// Fire a page_view on every route change so Google Ads sees each page in this
// single-page app. Without this the tag fires only once per visit, which makes
// page-based retargeting audiences (e.g. pricing visitors) miss most people.
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    // Configure GA4 once (no-op until a Measurement ID is set), then record the
    // page view for both GA4 (funnel analysis) and Google Ads (audiences).
    initAnalytics();
    trackEvent("page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <PageViewTracker />
          <AppRoutes />
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
