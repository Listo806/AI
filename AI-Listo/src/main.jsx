import './i18n/config';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import { NotificationProvider } from "./context/NotificationContext";

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Lucide icons init (keep your logic)
(function initLucideIcons() {
  'use strict';
  
  const initLucide = () => {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (error) {
      console.warn('Lucide icons init:', error);
    }
  };
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initLucide, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(initLucide, 500);
    });
  }
})();
