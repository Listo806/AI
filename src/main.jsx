import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Main pages
import App from "./App";
import Buy from "./Buy";
import Sell from "./Sell";
import Rent from "./Rent";
import Assistant from "./Assistant";
import ListProperty from "./ListProperty";
import Owners from "./Owners";

// Payment + post-checkout flow
import Checkout from "./Checkout";
import ThankYou from "./ThankYou";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Main public site */}
        <Route path="/" element={<App />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/list-property" element={<ListProperty />} />

        {/* Owner plan funnel */}
        <Route path="/owners" element={<Owners />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
