import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./i18n/i18n";
import "./i18n/registerDevelopersAiCrm";
import "./i18n/registerVacationRentals";
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