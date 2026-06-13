import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeProvider";
import "../styles/crm-dashboard.css";
import BottomNav from "../components/BottomNav";
import headlogoImgDark from "../assets/cortexa/headlogotran.png";
import headlogoImg from "../assets/cortexa/headlogo.png";
const initLucideIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const getPageTitle = (pathname) => {
  const routeMap = {
    "/dashboard": "Dashboard",
    "/dashboard/leads": "Leads",
    "/dashboard/pipeline": "Pipeline",
    "/dashboard/properties": "Properties",
    "/dashboard/vacation-rentals/upload": "Vacation listing",
    "/dashboard/platform-listings": "Marketplace Listings",
    "/dashboard/va-upload": "VA Upload",
    "/dashboard/admin/listings": "Admin: Listings",
    "/dashboard/admin/users": "Admin: Users",
    "/dashboard/admin/teams": "Admin: Teams",
    "/dashboard/contacts": "Contacts",
    "/dashboard/ai-center": "AI Center",
    "/dashboard/ai-assistant": "AI Assistant",
    "/dashboard/ai-auto-reply": "AI Auto-Reply",
    "/dashboard/ai-appointment-setter": "AI Setter",
    "/dashboard/ai-qualification-rules": "AI Qualification Rules",
    "/dashboard/ai-messaging": "AI Messaging & Follow-Ups",
    "/dashboard/ai-logs": "AI Activity & Logs",
    "/dashboard/analytics": "Analytics",
    "/dashboard/team": "Team",
    "/dashboard/integrations": "Integrations",
    "/dashboard/billing": "Billing",
    "/dashboard/settings": "Settings",
    "/account/profile": "Profile",
    "/account/billing": "Billing",
    "/account/settings": "Settings",
  };

  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

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
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const isMobile = window.innerWidth < 1025;
    if (isMobile && !isDark && typeof toggleTheme === "function") {
      toggleTheme();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        document.body.classList.remove('sidebar-open');
        const scrollY = document.body.style.top;
        document.body.style.top = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
  }, [sidebarOpen]);

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

  const handleSidebarToggle = () => {
    const isMobile = window.innerWidth < 1025;
    
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
    
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  };

  const getToggleButtonLabel = () => {
    const isMobile = window.innerWidth < 1025;
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

  useEffect(() => {
    initLucideIcons();
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
            <button 
              className="crm-sidebar-toggle-header"
              onClick={handleSidebarToggle}
              aria-label={getToggleButtonLabel()}
              title={getToggleButtonLabel()}
            >
              <i data-lucide="menu"></i>
            </button>
          </div>
          <div className="crm-header-center">
            <img src={headlogoImg} className="m-logo logo-light" alt="CORTEXA" />
            <img src={headlogoImgDark} className="m-logo logo-dark" alt="CORTEXA" />
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
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </button>
              {accountDropdownOpen && (
                <div className="crm-account-menu">
                  <div className="crm-account-menu-header">
                    <div className="crm-account-menu-avatar">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="crm-account-menu-info">
                      <div className="crm-account-menu-name">{user?.name || user?.email || 'User'}</div>
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
        <BottomNav 
          onToggleSidebar={handleSidebarToggle} 
          currentTab={location.pathname} 
          setCurrentTab={(route) => navigate(route)} 
        />
      </div>
    </div>
  );
}