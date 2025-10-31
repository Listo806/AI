import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import Buy from "./Buy";
import Sell from "./Sell";
import Rent from "./Rent";
import Assistant from "./Assistant";
import ListProperty from "./ListProperty";
import Owners from "./Owners";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/list-property" element={<ListProperty />} />
        <Route path="/owners" element={<Owners />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
