// GLOBAL LANGUAGE ENGINE (Marketplace Only - No Redirects)
(function() {
    'use strict';
    
    // =====================================================
    // CONFIGURATION
    // =====================================================
    const CONFIG = {
      STORAGE_KEY: 'marketplace_lang',
      SESSION_KEY: 'marketplace_lang_session',
      SUPPORTED_LANGS: ['en', 'pt', 'es'],
      DEFAULT_LANG: 'en',
      ATTR_ACTIVE: 'data-lang-active',
      ATTR_LANG: 'data-lang',
      ATTR_SET_LANG: 'data-set-lang',
      CLASS_LANG_BLOCK: 'lq-lang-block'
    };
  
    console.log('🌐 Language Engine: Initializing on marketplace');
  
    // =====================================================
    // LANGUAGE DETECTION
    // =====================================================
    function detectLanguage() {
      // Priority 0: session lock (keeps language stable for current browser session)
      const sessionLang = sessionStorage.getItem(CONFIG.SESSION_KEY);
      if (sessionLang && CONFIG.SUPPORTED_LANGS.includes(sessionLang)) {
        return sessionLang;
      }

      // Priority 1: localStorage
      const savedLang = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (savedLang && CONFIG.SUPPORTED_LANGS.includes(savedLang)) {
        return savedLang;
      }
  
      // Priority 2: URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang && CONFIG.SUPPORTED_LANGS.includes(urlLang)) {
        return urlLang;
      }
          
      // Priority 3: Browser language
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang) {
        const shortLang = browserLang.split('-')[0].toLowerCase();
        if (CONFIG.SUPPORTED_LANGS.includes(shortLang)) {
          return shortLang;
        }
      }
      
      // Priority 4: Default
      return CONFIG.DEFAULT_LANG;
    }
  
    // =====================================================
    // CLOSE DROPDOWN
    // =====================================================
    function closeDropdown() {
      const dropdown = document.querySelector('.w-dropdown');
      if (dropdown) {
        // Remove w--open class from dropdown and toggle
        dropdown.classList.remove('w--open');
        const toggle = dropdown.querySelector('.w-dropdown-toggle');
        if (toggle) {
          toggle.classList.remove('w--open');
          toggle.setAttribute('aria-expanded', 'false');
        }
        
        // Close the dropdown list
        const list = dropdown.querySelector('.w-dropdown-list');
        if (list) {
          list.classList.remove('w--open');
        }
      }
    }
  
    // =====================================================
    // INTERCEPT WEBFLOW LOCALIZATION CLICKS
    // =====================================================
    function interceptLocalizationLinks() {
      // Find all Webflow localization links
      const localeLinks = document.querySelectorAll('.w-locales-item a[hreflang]');
      
      localeLinks.forEach(link => {
        // Remove any existing listeners to prevent duplicates
        link.removeEventListener('click', handleLocaleClick);
        link.addEventListener('click', handleLocaleClick);
      });
    }
  
    function handleLocaleClick(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Extract language from hreflang attribute
      const lang = e.currentTarget.getAttribute('hreflang');
      
      if (lang && CONFIG.SUPPORTED_LANGS.includes(lang)) {
        // Update UI without page reload
        setActiveLanguage(lang);
        
        // Update URL with lang parameter
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.pushState({}, '', url);
        
        // Update active state in dropdown
        updateDropdownActiveState(lang);
        
        // Close the dropdown
        closeDropdown();
      }
    }
    
    // =====================================================
    // UPDATE DROPDOWN ACTIVE STATE
    // =====================================================
    function updateDropdownActiveState(lang) {
      // Remove current class from all locale links
      document.querySelectorAll('.w-locales-item a').forEach(link => {
        link.classList.remove('w--current');
        link.removeAttribute('aria-current');
      });
      
      // Add current class to active language link
      const activeLink = document.querySelector(`.w-locales-item a[hreflang="${lang}"]`);
      if (activeLink) {
        activeLink.classList.add('w--current');
        activeLink.setAttribute('aria-current', 'page');
      }
      
      // Update dropdown button text
      const dropdownToggle = document.querySelector('.local-dropdown .local-drop .text-lo');
      if (dropdownToggle) {
        dropdownToggle.textContent = lang.toUpperCase();
      }
    }
  
    // =====================================================
    // DOM UPDATER
    // =====================================================
    function setActiveLanguage(lang) {
      if (!CONFIG.SUPPORTED_LANGS.includes(lang)) {
        console.warn(`Unsupported language: ${lang}`);
        return;
      }
      
      // Update HTML attribute
      document.documentElement.setAttribute(CONFIG.ATTR_ACTIVE, lang);
      
      // Show/hide language blocks
      const langBlocks = document.querySelectorAll(`[${CONFIG.ATTR_LANG}]`);
      langBlocks.forEach(block => {
        const blockLang = block.getAttribute(CONFIG.ATTR_LANG);
        if (blockLang === lang) {
          block.style.display = '';
          block.removeAttribute('hidden');
        } else {
          block.style.display = 'none';
          block.setAttribute('hidden', '');
        }
      });
      
      // Update any custom toggle buttons if they exist
      const langToggles = document.querySelectorAll(`[${CONFIG.ATTR_SET_LANG}]`);
      langToggles.forEach(btn => {
        const btnLang = btn.getAttribute(CONFIG.ATTR_SET_LANG);
        if (btnLang === lang) {
          btn.classList.add('active');
          btn.setAttribute('aria-current', 'page');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('active');
          btn.removeAttribute('aria-current');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
      
      // Persist to localStorage
      localStorage.setItem(CONFIG.STORAGE_KEY, lang);
      sessionStorage.setItem(CONFIG.SESSION_KEY, lang);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
      }));
    }
  
    // =====================================================
    // FIX URL ON PAGE LOAD (REMOVE LANGUAGE PREFIX AND ADD LANG PARAM)
    // =====================================================
    function fixUrlOnLoad() {
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      let needsUpdate = false;
      let langFromPath = null;
      
      // Check if first path part is a language code
      if (pathParts.length > 0 && CONFIG.SUPPORTED_LANGS.includes(pathParts[0])) {
        langFromPath = pathParts[0];
        needsUpdate = true;
      }
      
      // Get current URL params
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      
      // If we have saved language in localStorage, use it
      const savedLang = localStorage.getItem(CONFIG.STORAGE_KEY);
      
      // Determine which language to use for URL
      let targetLang = null;
      if (savedLang && CONFIG.SUPPORTED_LANGS.includes(savedLang)) {
        targetLang = savedLang;
      } else if (urlLang && CONFIG.SUPPORTED_LANGS.includes(urlLang)) {
        targetLang = urlLang;
      } else if (langFromPath) {
        targetLang = langFromPath;
      }
      
      // Build new URL
      if (needsUpdate || (targetLang && targetLang !== urlLang)) {
        // Build new path without language prefix
        let newPath = '/';
        if (langFromPath) {
          newPath = '/' + pathParts.slice(1).join('/');
        } else {
          newPath = currentPath;
        }
        
        // Ensure newPath doesn't have double slashes
        newPath = newPath.replace(/\/+/g, '/');
        
        // Create new URL
        const url = new URL(window.location.origin + newPath);
        
        // Add lang parameter if we have a target language
        if (targetLang) {
          url.searchParams.set('lang', targetLang);
        }
        
        // Preserve other URL parameters
        urlParams.forEach((value, key) => {
          if (key !== 'lang') {
            url.searchParams.set(key, value);
          }
        });
        
        // Replace URL without reload
        window.history.replaceState({}, '', url);
      }
    }
  
    // =====================================================
    // INITIALIZATION
    // =====================================================
    function initLanguageEngine() {
      // First, fix the URL if it has language prefix
      fixUrlOnLoad();
      
      // Detect initial language
      const initialLang = detectLanguage();
      
      // Apply language without flicker
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            setActiveLanguage(initialLang);
            updateDropdownActiveState(initialLang);
            interceptLocalizationLinks();
            
            // Add click outside listener to ensure dropdown closes properly
            document.addEventListener('click', function(e) {
              const dropdown = document.querySelector('.w-dropdown');
              if (dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.remove('w--open');
                const toggle = dropdown.querySelector('.w-dropdown-toggle');
                if (toggle) {
                  toggle.classList.remove('w--open');
                  toggle.setAttribute('aria-expanded', 'false');
                }
                const list = dropdown.querySelector('.w-dropdown-list');
                if (list) {
                  list.classList.remove('w--open');
                }
              }
            });
          }, 0);
        });
      } else {
        setActiveLanguage(initialLang);
        updateDropdownActiveState(initialLang);
        interceptLocalizationLinks();
        
        // Add click outside listener
        document.addEventListener('click', function(e) {
          const dropdown = document.querySelector('.w-dropdown');
          if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('w--open');
            const toggle = dropdown.querySelector('.w-dropdown-toggle');
            if (toggle) {
              toggle.classList.remove('w--open');
              toggle.setAttribute('aria-expanded', 'false');
            }
            const list = dropdown.querySelector('.w-dropdown-list');
            if (list) {
              list.classList.remove('w--open');
            }
          }
        });
      }
      
      // MutationObserver for dynamic content
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const currentLang = document.documentElement.getAttribute(CONFIG.ATTR_ACTIVE) || CONFIG.DEFAULT_LANG;
            
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) {
                // Check for new locale links and attach interceptors
                if (node.matches && node.matches('.w-locales-item a[hreflang]')) {
                  node.addEventListener('click', handleLocaleClick);
                }
                
                // Handle language blocks
                if (node.hasAttribute && node.hasAttribute(CONFIG.ATTR_LANG)) {
                  const nodeLang = node.getAttribute(CONFIG.ATTR_LANG);
                  node.style.display = nodeLang === currentLang ? '' : 'none';
                }
                
                if (node.querySelectorAll) {
                  const childLangBlocks = node.querySelectorAll(`[${CONFIG.ATTR_LANG}]`);
                  childLangBlocks.forEach(block => {
                    const blockLang = block.getAttribute(CONFIG.ATTR_LANG);
                    block.style.display = blockLang === currentLang ? '' : 'none';
                  });
                }
              }
            });
          }
        });
      });
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      } else {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      
      // Handle popstate (back/forward buttons)
      window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && CONFIG.SUPPORTED_LANGS.includes(urlLang)) {
          setActiveLanguage(urlLang);
          updateDropdownActiveState(urlLang);
        }
      });
    }
  
    // Start the engine
    initLanguageEngine();
  
  })();