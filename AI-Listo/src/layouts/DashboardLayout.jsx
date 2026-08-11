import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import { useAuth } from "../context/AuthContext";
import { PlanProvider } from "../context/PlanContext";
import { useTheme } from "../theme/ThemeProvider";
import "../styles/crm-dashboard.css";
import BottomNav from "../components/BottomNav";
import FeatureAddOns from "../components/FeatureAddOns";
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
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const accountRole = String(user?.role || "").toLowerCase();
  const isAdmin = ["admin", "super_admin", "developer"].includes(accountRole);
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Sử dụng useRef để lưu kích thước màn hình trước đó, tránh chạy lại logic khi người dùng bấm nút thủ công
  const lastLayoutTypeRef = useRef("");

  // Paywall gate: a trial owner who has not paid cannot use the CRM — send them
  // to checkout to finish. Every non-owner role and any paid/active account pass
  // through. An empty/unknown status is never blocked (avoids locking out a payer
  // whose status is missing). A recent payment grace flag (set on checkout
  // completion) also passes, so a just-paid customer is not bounced while the
  // Paddle webhook catches up and flips payment_status to active server-side.
  useEffect(() => {
    if (!user) return;
    const status = String(user.paymentStatus || "").toLowerCase();
    const paid = status === "active" || status === "paid";
    if (paid) return;
    // Free tier has CRM access without paying, so never bounce a Free owner.
    if (String(user.selectedPlan || "").toLowerCase() === "free") return;
    if (user.role !== "owner" || !user.selectedPlan || !status) return;
    const paidAt = Number(localStorage.getItem("cortexa_paid_at") || 0);
    if (paidAt && Date.now() - paidAt < 30 * 60 * 1000) return;
    navigate(`/checkout?plan=${encodeURIComponent(user.selectedPlan)}`, {
      replace: true,
    });
  }, [user, navigate]);

  // Tự động kiểm tra cấu hình theme mặc định dựa trên thiết bị (chỉ kích hoạt khi thay đổi kích thước/thiết bị)
  useEffect(() => {
    if (typeof toggleTheme !== "function") return;

    const handleThemeResponsive = () => {
      const width = window.innerWidth;
      const currentLayoutType = width < 1025 ? "mobile-tablet" : "desktop";

      // Chỉ thay đổi theme tự động nếu chuyển giao diện thiết bị (ví dụ: từ Desktop co màn hình lại thành Mobile)
      if (lastLayoutTypeRef.current !== currentLayoutType) {
        lastLayoutTypeRef.current = currentLayoutType; // Lưu trạng thái hiện tại lại

        if (currentLayoutType === "mobile-tablet") {
          if (!isDark) {
            toggleTheme(); // Bắt buộc là Dark khi vào mobile/tablet lần đầu
          }
        } else {
          if (isDark) {
            toggleTheme(); // Bắt buộc là Light khi vào desktop lần đầu
          }
        }
      }
    };

    // Khởi chạy kiểm tra ngay lần mount đầu tiên
    handleThemeResponsive();

    window.addEventListener("resize", handleThemeResponsive);
    return () => window.removeEventListener("resize", handleThemeResponsive);
  }, [isDark, toggleTheme]); 

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
      return sidebarOpen ? t('nav.closeMenu') : t('nav.openMenu');
    } else {
      return sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar');
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
    <PlanProvider>
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
                aria-label={t('nav.accountMenu')}
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
                      <div className="crm-account-menu-name">{user?.name || user?.email || t('nav.userFallback')}</div>
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
                    {t('header.settings') || 'Settings'}
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
                      aria-label={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}
                    >
                      <span className={`crm-theme-option ${!isDark ? 'active' : ''}`}>{t('header.light') || 'Light'}</span>
                      <span className={`crm-theme-option ${isDark ? 'active' : ''}`}>{t('header.dark') || 'Dark'}</span>
                    </button>
                  </div>
                  {isAdmin && (
                    <>
                      <div className="crm-account-menu-divider"></div>
                      <button
                        type="button"
                        className="crm-account-menu-item"
                        onClick={() => setAdminMenuOpen((o) => !o)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <span>{t('nav.admin')}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {adminMenuOpen ? '▾' : '▸'}
                        </span>
                      </button>
                      {adminMenuOpen && (
                        <div style={{ paddingLeft: 14 }}>
                          <Link
                            to="/dashboard/admin/customers"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.adminCustomers') || 'Customers'}
                          </Link>
                          <Link
                            to="/dashboard/admin/listings"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.listings')}
                          </Link>
                          <Link
                            to="/dashboard/admin/users"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.users')}
                          </Link>
                          <Link
                            to="/dashboard/admin/teams"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.teams')}
                          </Link>
                          {/* Kept until the new Customers page is verified, then retired. */}
                          <Link
                            to="/dashboard/admin/signups"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.adminSignups')}
                          </Link>
                          <Link
                            to="/dashboard/admin/plans"
                            className="crm-account-menu-item"
                            onClick={() => setAccountDropdownOpen(false)}
                          >
                            {t('nav.adminPlans')}
                          </Link>
                        </div>
                      )}
                    </>
                  )}
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
    <FeatureAddOns />
    </PlanProvider>
  );
}