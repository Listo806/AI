import './i18n/config';

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import { NotificationProvider } from "./context/NotificationContext";
import { handOffPrerender } from "./prerenderHandoff";

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

// Public pages arrive with their content already written into the HTML; swap
// it for the application once the application shows the same page.
handOffPrerender();

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

