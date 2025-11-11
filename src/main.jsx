import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Buy from "./components/Buy.jsx";
import Sell from "./components/Sell.jsx";
import Rent from "./components/Rent.jsx";
import ListProperty from "./components/ListProperty.jsx";
import Owners from "./components/Owners.jsx";
import Agents from "./components/Agents.jsx";
import DevelopersLandingPage from "./components/DevelopersLandingPage.jsx";
import WholesalersLandingPage from "./components/WholesalersLandingPage.jsx";
import InvestorsLandingPage from "./components/InvestorsLandingPage.jsx";
import AICRMLandingPage from "./components/AICRMLandingPage.jsx";
import AIAssistantLandingPage from "./components/AIAssistantLandingPage.jsx";
import AICRMInterface from "./components/AICRMInterface.jsx";
import Checkout from "./Checkout.jsx";
import ThankYou from "./ThankYou.jsx";
import SignInLandingPage from "./components/SignInLandingPage.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/list-property" element={<ListProperty />} />
        <Route path="/owners" element={<Owners />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/developers" element={<DevelopersLandingPage />} />
        <Route path="/wholesalers" element={<WholesalersLandingPage />} />
        <Route path="/investors" element={<InvestorsLandingPage />} />
        <Route path="/ai-crm" element={<AICRMLandingPage />} />
        <Route path="/ai-assistant" element={<AIAssistantLandingPage />} />
        <Route path="/ai-crm/interface" element={<AICRMInterface />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/sign-in" element={<SignInLandingPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
