import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import "../styles/crm-dashboard.css";

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const pageTitle = getPageTitle(location.pathname);

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
            {/* Mobile menu toggle */}
            <button 
              className="crm-mobile-menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            {/* Desktop sidebar collapse toggle - Only shown when sidebar is collapsed */}
            {sidebarCollapsed && (
              <button
                className="crm-sidebar-toggle-outside"
                onClick={toggleSidebarCollapse}
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                ☰
              </button>
            )}
            <Link to="/dashboard" className="brand" style={{ textDecoration: 'none' }}>
              <span className="powered">powered by</span>
              <img src="/assets/header-logo.png" className="icon" alt="CORTEXA" />
              <span className="text"><strong>CORTEXA</strong> DealFlow</span>
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
