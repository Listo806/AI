import React from "react";
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
import Listings from "./pages/Listings/Listings";
import ListingDetail from "./pages/Listings/ListingDetail";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/owners" element={<OwnersPage />} />

        <Route path="/sell" element={<OwnersPage />} />

        <Route path="/agents" element={<AgentsPage />} />

        <Route path="/find-agent" element={<FindAgentPage />} />
        <Route path="/developers" element={<DevelopersPage />} />

        <Route path="/ai-crm" element={<AiCrmPage />} />

        <Route path="/ai-help" element={<AiCrmPage />} />
        <Route path="/vacation-rentals" element={<VacationRentalsPage />} />

        <Route path="/buy" element={<Listings />} />
        <Route path="/rent" element={<Listings />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/property/:id" element={<ListingDetail />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        
        <Route path="/owner-plans" element={<OwnerPlansPage />} />

        <Route path="/agent-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/developer-plans" element={<AgentDeveloperPlansPage />} />
        <Route path="/vacation-rental-plans" element={<VacationRentalPlansPage />} />
      </Routes>
    </BrowserRouter>
  );
}
