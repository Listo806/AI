// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import AIAssistantLandingPage from "./components/AIAssistantLandingPage";
import "./index.css";

// ✅ Create the React root and render your app
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ai-assistant" element={<AIAssistantLandingPage />} />
        {/* Wildcard route for unknown paths */}
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);


