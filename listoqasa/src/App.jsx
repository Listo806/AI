import React from "react";
import MarketplaceSignupPage from "./pages/CreateListing/MarketplaceSignupPage";
import MarketplaceCheckoutPage from "./pages/CreateListing/MarketplaceCheckoutPage";
import CreateListingPage from "./pages/CreateListing/CreateListingPage";
import MarketplaceLoginPage from "./pages/CreateListing/MarketplaceLoginPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import OwnersPage from "./pages/Owners/OwnersPage";
import AgentsPage from "./pages/Agents/AgentsPage";
import FindAgentPage from "./pages/FindAgent/FindAgentPage";
import DevelopersPage from "./pages/Developers/DevelopersPage";
import AiCrmPage from "./pages/AiCrm/AiCrmPage";
import VacationRentalsPage from "./pages/VacationRentals/VacationRentalsPage";
import OwnerPlansPage from "./pages/OwnerPlans/OwnerPlansPage";
import AgentDeveloperPlansPage from "./pages/AgentDeveloperPlans/AgentDeveloperPlansPage";
import VacationRentalPlansPage from "./pages/VacationRentalPlans/VacationRentalPlansPage";
import AiHelpPricingPage from "./pages/AiHelpPricing/AiHelpPricingPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/marketplace/signup" element={<MarketplaceSignupPage />} />
        <Route path="/marketplace/checkout" element={<MarketplaceCheckoutPage />} />
        <Route path="/marketplace/login" element={<MarketplaceLoginPage />} />
        <Route path="/create-listing" element={<CreateListingPage />} />
        <Route path="/owners/create" element={<CreateListingPage />} />
        <Route path="/owners" element={<OwnersPage />} />

        <Route path="/sell" element={<OwnersPage />} />

        <Route path="/agents" element={<AgentsPage />} />

        <Route path="/find-agent" element={<FindAgentPage />} />
        <Route path="/developers" element={<DevelopersPage />} />

        <Route path="/ai-crm" element={<AiCrmPage />} />

        <Route path="/ai-help" element={<AiCrmPage />} />
        <Route path="/ai-help/pricing" element={<AiHelpPricingPage />} />
        <Route path="/vacation-rentals" element={<VacationRentalsPage />} />
        
        <Route path="/owner-plans" element={<OwnerPlansPage />} />

        <Route path="/agent-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/developer-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/vacation-rental-plans" element={<VacationRentalPlansPage />} />
      </Routes>
    </BrowserRouter>
  );
}
