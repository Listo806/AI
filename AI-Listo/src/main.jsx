import './i18n/config';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
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
