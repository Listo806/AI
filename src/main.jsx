import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Main Pages ---
import App from "./App";
import Buy from "./Buy";
import Sell from "./Sell";
import Rent from "./Rent";
import Assistant from "./Assistant";
import ListProperty from "./ListProperty";
import Owners from "./Owners";
import Agents from "./Agents";

// --- Additional Landing Pages (for future use) ---
import DevelopersLandingPage from "./components/DevelopersLandingPage";
import WholesalersLandingPage from "./components/WholesalersLandingPage";
import InvestorsLandingPage from "./components/InvestorsLandingPage";
import AICRMLandingPage from "./components/AICRMLandingPage";
import AIAssistantLandingPage from "./components/AIAssistantLandingPage";

// --- Payment + Post-Checkout Flow ---
import Checkout from "./Checkout";
import ThankYou from "./ThankYou";

// --- Global Styles ---
import "./index.css";

// --- Render Application ---
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Main Public Site */}
        <Route path="/" element={<App />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/list-property" element={<ListProperty />} />

        {/* Core Funnels */}
        <Route path="/owners" element={<Owners />} />
        <Route path="/agents" element={<Agents />} />

        {/* Developer / Wholesaler / Investor Landing Pages */}
        <Route path="/developers" element={<DevelopersLandingPage />} />
        <Route path="/wholesalers" element={<WholesalersLandingPage />} />
        <Route path="/investors" element={<InvestorsLandingPage />} />

        {/* AI System Pages */}
        <Route path="/ai-crm" e


