import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Render app first - don't block on icon initialization
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize Lucide icons - non-blocking, safe initialization
(function initLucideIcons() {
  'use strict';
  
  const initLucide = () => {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (error) {
      // Silently fail - don't block rendering
      console.warn('Lucide icons init:', error);
    }
  };
  
  // Initialize after React renders
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initLucide, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(initLucide, 500);
    });
  }
  
  // Re-initialize on route changes (debounced)
  let debounceTimer;
  const debouncedInit = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(initLucide, 300);
  };
  
  // Set up observer only after body exists, and only watch for major changes
  const setupObserver = () => {
    if (!document.body) {
      setTimeout(setupObserver, 100);
      return;
    }
    
    try {
      const observer = new MutationObserver((mutations) => {
        // Only re-init if significant changes (new routes/components)
        const hasSignificantChange = mutations.some(mutation => 
          mutation.addedNodes.length > 0 && 
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (node.tagName === 'MAIN' || node.classList?.contains('crm-content'))
          )
        );
        
        if (hasSignificantChange) {
          debouncedInit();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: false
      });
    } catch (error) {
      // Observer setup failed - not critical
      console.warn('Lucide observer setup failed:', error);
    }
  };
  
  // Setup observer after a delay
  setTimeout(setupObserver, 1000);
})();
