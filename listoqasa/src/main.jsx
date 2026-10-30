import { captureMarketplaceAdClick } from "./api/marketplaceAdAttribution";
import { initializeGoogleAds } from "./api/googleAdsTracking";
import { registerListoQasaPwa } from "./pwa";
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
import "./i18n/registerMarketplaceListings";
import App from "./App";
import CookieConsentBanner from "./components/CookieConsentBanner";

import "./styles/globals.css";
import "./styles/layout.css";

// Tell mobile browsers that the site supports the light color scheme only.
// Also covers source-only deployments where index.html is outside this package.
const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]') || document.createElement("meta");
colorSchemeMeta.setAttribute("name", "color-scheme");
colorSchemeMeta.setAttribute("content", "light");
if (!colorSchemeMeta.isConnected) document.head.appendChild(colorSchemeMeta);

captureMarketplaceAdClick();
initializeGoogleAds();
registerListoQasaPwa();

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <App />
    <CookieConsentBanner />
  </StrictMode>
);