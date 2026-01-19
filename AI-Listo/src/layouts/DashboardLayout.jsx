import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

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

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="crm-root">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="crm-main">
        <header className="crm-header">
          <div className="crm-header-left">
            <button 
              className="crm-mobile-menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <img 
              src="/Header Background.png"
              alt="Header"
              className="crm-header-image"
            />
          </div>
          <div className="crm-header-right">
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
                  <button className="crm-account-menu-item" onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
