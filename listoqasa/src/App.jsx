import LuxuryReviewAdmin from "./pages/CreateListing/LuxuryReviewAdmin";
import LegalPage from "./pages/Legal/LegalPages";
import React, { useEffect } from "react";
import i18n from "./i18n/i18n";
import {AboutPage, ContactPage} from "./pages/Company/CompanyPages";
import "./i18n/registerCompanyPages";
import PropertyDetailBoundary from "./components/PropertyDetailBoundary";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
function TrialRedirect(){const [p]=useSearchParams();const addon=p.get("addon");const plan=p.get("plan");const billing=p.get("billing")==="yearly"?"yearly":"monthly";if(addon==="ai-crm")return <Navigate to="/agent-plans" replace />;return <Navigate to={`/marketplace/signup?audience=agent&plan=${encodeURIComponent(plan||"essential")}&billing=${billing}`} replace />;}
import MarketplaceSignupPage from "./pages/CreateListing/MarketplaceSignupPage";
import MarketplaceSubscriptionPage from "./pages/CreateListing/MarketplaceSubscriptionPage";
import MarketplaceCheckoutPage from "./pages/CreateListing/MarketplaceCheckoutPage";
import MarketplacePurchaseConfirmationPage from "./pages/CreateListing/MarketplacePurchaseConfirmationPage";
import MarketplacePaymentPendingPage from "./pages/CreateListing/MarketplacePaymentPendingPage";
import CreateListingPage from "./pages/CreateListing/CreateListingPage";
import MyListingsPage from "./pages/MyListings/MyListingsPage";
import PublicPortfolioPage from "./pages/MyListings/PublicPortfolioPage";
import MarketplaceLoginPage from "./pages/CreateListing/MarketplaceLoginPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import ListingDetail from "./pages/Listings/ListingDetail";
import Listings from "./pages/Listings/Listings";
import CommercialOwnersPage from "./pages/CommercialOwners/CommercialOwnersPage";
import "./i18n/registerListingPropertyPages";
import OwnersPage from "./pages/Owners/OwnersPage";
import AgentsPage from "./pages/Agents/AgentsPage";
import FindAgentPage from "./pages/FindAgent/FindAgentPage";
import DevelopersPage from "./pages/Developers/DevelopersPage";
import AiCrmPage from "./pages/AiCrm/AiCrmPage";
import VacationSampleAdmin from "./pages/VacationRentals/VacationSampleAdmin";
import VacationResults from "./pages/VacationRentals/VacationResults";
import VacationDetail from "./pages/VacationRentals/VacationDetail";
import VacationRentalsPage from "./pages/VacationRentals/VacationRentalsPage";
import HelpCenterPage from "./pages/HelpCenter/HelpCenterPage";
import StayAccountPage from "./pages/HelpCenter/StayAccountPage";
import VacationHostLanding from "./pages/VacationHost/VacationHostLanding";
import OwnerPlansPage from "./pages/OwnerPlans/OwnerPlansPage";
import AgentDeveloperPlansPage from "./pages/AgentDeveloperPlans/AgentDeveloperPlansPage";
import VacationRentalPlansPage from "./pages/VacationRentalPlans/VacationRentalPlansPage";
import AiHelpPricingPage from "./pages/AiHelpPricing/AiHelpPricingPage";
function LegacyPropertyRedirect(){const [params]=useSearchParams();const id=params.get("id");return <Navigate replace to={id?`/property/${encodeURIComponent(id)}`:"/"}/>;}
function UrlLanguageSync() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  // A URL with an explicit language always wins over browser-stored preferences.
  useEffect(() => {
    const pathLanguage = /^\/es-ec(?:\/|$)/i.test(pathname) ? "es" : pathname.match(/^\/(en|es|pt)(?:\/|$)/i)?.[1]?.toLowerCase();
    const queryLanguage = new URLSearchParams(search).get("lang")?.toLowerCase();
    const explicitLanguage = pathLanguage || (["en", "es", "pt"].includes(queryLanguage) ? queryLanguage : null);
    if (explicitLanguage && (i18n.resolvedLanguage || i18n.language) !== explicitLanguage) {
      i18n.changeLanguage(explicitLanguage);
    }
  }, [pathname, search]);

  // Language changes from any selector update the address bar without reloading.
  useEffect(() => {
    const onLanguageChanged = (rawLanguage) => {
      const language = rawLanguage?.split("-")[0]?.toLowerCase();
      if (!["en", "es", "pt"].includes(language)) return;
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const prefixMatch = path.match(/^\/(es-ec|en|es|pt)(?=\/|$)/i);
      const prefix = prefixMatch?.[1]?.toLowerCase() || "";
      const barePath = prefix ? path.slice(prefix.length + 1) || "/" : path;
      const home = barePath === "/";
      // Keep language and Ecuador locale in the URL instead of relying on
      // a query parameter that is lost on navigation or refresh.
      const localizable = /^\/(?:buy|rent|sell|owners|agents|developers|commercial-owners|find-agent|property|vacation-rentals|owner-plans|agent-plans|developer-plans|vacation-rental-plans|about|about-us|contact|contact-us|terms|privacy|cancellation-policy|refund-policy|help)(?:\/|$)/i.test(barePath);
      if (!home && !localizable) return;
      const nextPrefix = language === "es" && prefix === "es-ec" ? "es-ec" : language;
      // Ecuador must not silently become a generic Spanish page.
      if (prefix === "es-ec" && language !== "es") {
        params.set("country", "EC");
      }
      params.delete("lang");
      const nextPath = `/${nextPrefix}${home ? "" : barePath}`;
      const query = params.toString();
      const next = `${nextPath}${query ? `?${query}` : ""}${window.location.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== current) navigate(next, { replace: true });
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => i18n.off("languageChanged", onLanguageChanged);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <UrlLanguageSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/en" element={<HomePage />} />
        <Route path="/es" element={<HomePage />} />
        <Route path="/pt" element={<HomePage />} />
        <Route path="/property/:id" element={<PropertyDetailBoundary><ListingDetail /></PropertyDetailBoundary>} />
        <Route path="/property" element={<LegacyPropertyRedirect />} />
        <Route path="/app" element={<Listings />} />
        <Route path="/buy" element={<Listings />} />
        <Route path="/rent" element={<Listings />} />
        <Route path="/apartments" element={<Listings />} />
        <Route path="/houses" element={<Listings />} />
        <Route path="/land" element={<Listings />} />
        <Route path="/commercial" element={<Listings />} />
        <Route path="/new-projects" element={<Listings />} />
        <Route path="/es-ec/propiedades-en-venta" element={<Listings />} />
        <Route path="/es-ec/propiedades-en-alquiler" element={<Listings />} />
        <Route path="/es-ec/casas-en-venta" element={<Listings />} />
        <Route path="/es-ec/casas-en-alquiler" element={<Listings />} />
        <Route path="/es-ec/departamentos-en-venta" element={<Listings />} />
        <Route path="/es-ec/departamentos-en-alquiler" element={<Listings />} />
        <Route path="/es-ec/terrenos-en-venta" element={<Listings />} />
        <Route path="/es-ec/propiedades-comerciales" element={<Listings />} />
        <Route path="/es-ec/oficinas-en-venta" element={<Listings />} />
        <Route path="/es-ec/oficinas-en-alquiler" element={<Listings />} />

        <Route path="/trial" element={<TrialRedirect />} />
        <Route path="/marketplace/signup" element={<MarketplaceSignupPage />} />
        <Route path="/es/marketplace/signup" element={<MarketplaceSignupPage />} />
        <Route path="/es-ec/marketplace/signup" element={<MarketplaceSignupPage />} />
        <Route path="/marketplace/subscription" element={<MarketplaceSubscriptionPage />} />
        <Route path="/marketplace/checkout" element={<MarketplaceCheckoutPage />} />
        <Route path="/es-ec/marketplace/checkout" element={<MarketplaceCheckoutPage />} />
        <Route path="/marketplace/purchase-confirmation" element={<MarketplacePurchaseConfirmationPage />} />
        <Route path="/marketplace/payment-pending" element={<MarketplacePaymentPendingPage />} />
        <Route path="/marketplace/login" element={<MarketplaceLoginPage />} />
        <Route path="/admin/luxury-review" element={<LuxuryReviewAdmin />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/profile/:ownerId" element={<PublicPortfolioPage />} />
        <Route path="/create-listing" element={<CreateListingPage />} />
        <Route path="/owners/create" element={<CreateListingPage />} />
        <Route path="/owners" element={<OwnersPage />} />
        <Route path="/commercial-owners" element={<CommercialOwnersPage />} />

        <Route path="/sell" element={<OwnersPage />} />

        <Route path="/agents" element={<AgentsPage />} />

        <Route path="/find-agent" element={<FindAgentPage />} />
        <Route path="/developers" element={<DevelopersPage />} />

        <Route path="/ai-crm" element={<AiCrmPage />} />

        <Route path="/ai-help" element={<AiCrmPage />} />
        <Route path="/ai-help/pricing" element={<AiHelpPricingPage />} />
        <Route path="/es-ec/ai-help/pricing" element={<AiHelpPricingPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/contact-us" element={<ContactPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
        <Route path="/cancellation-policy" element={<LegalPage type="refund" />} />
        <Route path="/refund-policy" element={<LegalPage type="refund" />} />
        <Route path="/my-trips" element={<StayAccountPage mode="trips" />} />
        <Route path="/saved-stays" element={<StayAccountPage mode="saved" />} />
        <Route path="/vacation-rentals" element={<VacationRentalsPage />} />
        <Route path="/es-ec" element={<HomePage />} />
        <Route path="/es-ec/vacation-rentals" element={<VacationRentalsPage />} />
        <Route path="/es-ec/alquileres-vacacionales" element={<VacationRentalsPage />} />
        <Route path="/vacation-rentals/host" element={<VacationHostLanding />} />
        <Route path="/vacation-rentals/admin/import" element={<VacationSampleAdmin />} />
        <Route path="/vacation-rentals/search" element={<VacationResults />} />
        <Route path="/vacation-rentals/app" element={<VacationResults />} />
        <Route path="/vacation-rentals/property/:id" element={<VacationDetail />} />
        
        <Route path="/owner-plans" element={<OwnerPlansPage />} />
        <Route path="/es/owner-plans" element={<OwnerPlansPage />} />

        <Route path="/agent-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/developer-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/es/developer-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/vacation-rental-plans" element={<VacationRentalPlansPage />} />
        <Route path="/es/vacation-rental-plans" element={<VacationRentalPlansPage />} />
      </Routes>
    </BrowserRouter>
  );
}
