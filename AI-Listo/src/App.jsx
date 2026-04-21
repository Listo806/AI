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
          
        </Routes>
      );
  
}
