import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import "../styles/crm-dashboard.css";

// Initialize Lucide icons helper
const initLucideIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

// Map routes to page titles
const getPageTitle = (pathname) => {
  const routeMap = {
    "/dashboard": "Dashboard",
    "/dashboard/leads": "Leads",
    "/dashboard/pipeline": "Pipeline",
    "/dashboard/properties": "Properties",
    "/dashboard/contacts": "Contacts",
    "/dashboard/ai-assistant": "AI Assistant",
    "/dashboard/ai-automations": "AI Automations",
    "/dashboard/analytics": "Analytics",
    "/dashboard/team": "Team",
    "/dashboard/integrations": "Integrations",
    "/dashboard/billing": "Billing",
    "/dashboard/settings": "Settings",
    "/account/profile": "Profile",
    "/account/billing": "Billing",
    "/account/settings": "Settings",
  };

  // Check exact match first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Check if pathname starts with any route
  for (const [route, title] of Object.entries(routeMap)) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return title;
    }
  }

  return "Dashboard";
};

export default function DashboardLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  
  // Sidebar collapse state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      // Add class to body to lock scroll and prevent interaction
      document.body.classList.add('sidebar-open');
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        // Remove class and restore scroll position
        document.body.classList.remove('sidebar-open');
        const scrollY = document.body.style.top;
        document.body.style.top = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
  }, [sidebarOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountDropdownOpen && !event.target.closest('.crm-account-dropdown')) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountDropdownOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Unified toggle function - handles both mobile (open/close) and desktop (collapse/expand)
  const handleSidebarToggle = () => {
    // Check if we're on mobile (window width < 769px)
    const isMobile = window.innerWidth < 769;
    
    if (isMobile) {
      // Mobile: toggle open/close
      setSidebarOpen(!sidebarOpen);
    } else {
      // Desktop: toggle collapse/expand
      setSidebarCollapsed(!sidebarCollapsed);
    }
    
    // Initialize Lucide icons after toggle
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  };

  // Get appropriate aria-label and title for the toggle button
  const getToggleButtonLabel = () => {
    const isMobile = window.innerWidth < 769;
    if (isMobile) {
      return sidebarOpen ? "Close menu" : "Open menu";
    } else {
      return sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
    }
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const pageTitle = getPageTitle(location.pathname);

  // Initialize Lucide icons when component mounts
  useEffect(() => {
    initLucideIcons();
    // Re-initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(initLucideIcons, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`crm-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      <div className="crm-main">
        <header className="crm-header">
          <div className="crm-header-left">
            {/* Unified sidebar toggle button - works for both mobile and desktop */}
            <button 
              className="crm-sidebar-toggle-header"
              onClick={handleSidebarToggle}
              aria-label={getToggleButtonLabel()}
              title={getToggleButtonLabel()}
            >
              <i data-lucide="menu"></i>
            </button>
            <Link to="/dashboard" className="brand" style={{ textDecoration: 'none' }}>
              <span className="powered">powered by</span>
              <img src="/assets/header-logo.png" className="icon" alt="CORTEXA" />
              <span className="text"><strong>CORTEXA</strong></span>
            </Link>
          </div>
          <div className="crm-header-right">
            <LanguageSelector />
            <div className="crm-account-dropdown">
              <button
                className="crm-account-trigger"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                aria-label="Account menu"
              >
                <div className="crm-header-avatar">
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              </button>
              {accountDropdownOpen && (
                <div className="crm-account-menu">
                  <div className="crm-account-menu-header">
                    <div className="crm-account-menu-avatar">
                      {user?.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="crm-account-menu-info">
                      <div className="crm-account-menu-name">{user?.email || 'User'}</div>
                      <div className="crm-account-menu-role">{user?.role || 'user'}</div>
                    </div>
                  </div>
                  <div className="crm-account-menu-divider"></div>
                  <Link 
                    to="/account/profile" 
                    className="crm-account-menu-item"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    {t('header.profile')}
                  </Link>
                  <Link 
                    to="/account/billing" 
                    className="crm-account-menu-item"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    {t('header.billing')}
                  </Link>
                  <Link 
                    to="/account/settings" 
                    className="crm-account-menu-item"
                    onClick={() => setAccountDropdownOpen(false)}
                  >
                    {t('header.settings')}
                  </Link>
                  <div className="crm-account-menu-divider"></div>
                  <div className="crm-theme-toggle-wrap">
                    <span className="crm-theme-toggle-label">{t('header.theme') || 'Theme'}</span>
                    <button
                      type="button"
                      className="crm-theme-toggle"
                      onClick={toggleTheme}
                      role="switch"
                      aria-checked={isDark}
                      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      <span className={`crm-theme-option ${!isDark ? 'active' : ''}`}>{t('header.light') || 'Light'}</span>
                      <span className={`crm-theme-option ${isDark ? 'active' : ''}`}>{t('header.dark') || 'Dark'}</span>
                    </button>
                  </div>
                  <div className="crm-account-menu-divider"></div>
                  <button className="crm-account-menu-item" onClick={logout}>
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className={`crm-content ${location.pathname === '/dashboard' ? 'dashboard-content-dark' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
