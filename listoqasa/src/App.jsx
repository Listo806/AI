import { DIRECTORY_LOCATIONS } from "./components/marketplace/LocationDirectory";
import LegalPage from "./pages/Legal/LegalPages";
import React from "react";
import {AboutPage, ContactPage} from "./pages/Company/CompanyPages";
import "./i18n/registerCompanyPages";
import PropertyDetailBoundary from "./components/PropertyDetailBoundary";
import { Navigate, useSearchParams, useParams } from "react-router-dom";
function LocationResults(){const {slug}=useParams();if(!DIRECTORY_LOCATIONS.some(x=>x.slug===slug))return <Navigate to="/buy" replace/>;return <Listings/>;}
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
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/property/:id" element={<PropertyDetailBoundary><ListingDetail /></PropertyDetailBoundary>} />
        <Route path="/property" element={<LegacyPropertyRedirect />} />
        <Route path="/buy" element={<Listings />} />
        <Route path="/properties-in/:slug" element={<LocationResults />} />
        <Route path="/rent" element={<Listings />} />

        <Route path="/trial" element={<TrialRedirect />} />
        <Route path="/marketplace/signup" element={<MarketplaceSignupPage />} />
        <Route path="/marketplace/subscription" element={<MarketplaceSubscriptionPage />} />
        <Route path="/marketplace/checkout" element={<MarketplaceCheckoutPage />} />
        <Route path="/marketplace/purchase-confirmation" element={<MarketplacePurchaseConfirmationPage />} />
        <Route path="/marketplace/payment-pending" element={<MarketplacePaymentPendingPage />} />
        <Route path="/marketplace/login" element={<MarketplaceLoginPage />} />
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
        <Route path="/vacation-rentals/host" element={<VacationHostLanding />} />
        <Route path="/vacation-rentals/admin/import" element={<VacationSampleAdmin />} />
        <Route path="/vacation-rentals/search" element={<VacationResults />} />
        <Route path="/vacation-rentals/property/:id" element={<VacationDetail />} />
        
        <Route path="/owner-plans" element={<OwnerPlansPage />} />

        <Route path="/agent-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/developer-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/vacation-rental-plans" element={<VacationRentalPlansPage />} />
      </Routes>
    </BrowserRouter>
  );
}
