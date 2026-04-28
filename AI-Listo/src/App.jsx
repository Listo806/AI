import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing/Landing";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Leads from "./pages/leads/LeadsList";
import Pipeline from "./pages/pipeline/Pipeline";
import Properties from "./pages/properties/PropertiesList";
import Contacts from "./pages/contacts/Contacts";

import Profile from "./pages/account/Profile";
import Billing from "./pages/account/Billing";
import Settings from "./pages/account/Settings";
import SignIn from "./pages/auth/SignIn";
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

export default function App() {
    return (
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="properties" element={<Properties />} />
            <Route path="contacts" element={<Contacts />} />
          </Route>


          <Route path="/account/profile" element={<Profile />} />
          <Route path="/account/billing" element={<Billing />} />
          <Route path="/account/settings" element={<Settings />} />
          
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/refund-policy" element={<Refund />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cancellation" element={<Cancellation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/:country/:city" element={<CityPage />} />
          <Route path="/:country" element={<CountryPage />} />
          
        </Routes>
      );
  
}
