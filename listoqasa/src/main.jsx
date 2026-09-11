import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./i18n/i18n";
import "./i18n/registerDevelopersAiCrm";
import "./i18n/registerVacationRentals";
import "./i18n/registerPricingPlans";
import "./i18n/registerHeaderVacationHero";
import "./i18n/registerCenteredHero";
import "./i18n/registerHomeHeroMode";
import "./i18n/registerVacationLegacy";
import App from "./App";

import "./styles/globals.css";
import "./styles/layout.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <App />
  </StrictMode>
);