import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const AI_CENTER_PATHS = [
  "/dashboard/ai-center",
  "/dashboard/ai-auto-reply",
  "/dashboard/ai-appointment-setter",
  "/dashboard/ai-qualification-rules",
  "/dashboard/ai-messaging",
  "/dashboard/ai-logs",
];

const AI_CENTER_ITEMS = [
  { path: "/dashboard/ai-center", labelKey: "nav.aiCenter.overview" },
  { path: "/dashboard/ai-auto-reply", labelKey: "nav.aiCenter.autoReply" },
  { path: "/dashboard/ai-appointment-setter", labelKey: "nav.aiCenter.appointmentSetter" },
  { path: "/dashboard/ai-qualification-rules", labelKey: "nav.aiCenter.qualificationRules" },
  { path: "/dashboard/ai-messaging", labelKey: "nav.aiCenter.messaging" },
  { path: "/dashboard/ai-logs", labelKey: "nav.aiCenter.activityLogs" },
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const [aiCenterOpen, setAiCenterOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("aiCenterSidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const open = AI_CENTER_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
    if (open && !aiCenterOpen) setAiCenterOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem("aiCenterSidebarOpen", JSON.stringify(aiCenterOpen));
    } catch (_) {}
  }, [aiCenterOpen]);

  // Initialize Lucide icons when component mounts or updates
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [isCollapsed, aiCenterOpen]);

  const isAiCenterActive = AI_CENTER_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  const topNavItems = [
    { path: "/dashboard/whatsapp", icon: "whatsapp", labelKey: "nav.whatsapp", isWhatsApp: true },
    { path: "/dashboard/home", icon: "home", labelKey: "nav.dashboard" },
    { path: "/dashboard/leads", icon: "users", labelKey: "nav.leads" },
    { path: "/dashboard/instagram", icon: "camera", labelKey: "nav.instagram" },
    { path: "/dashboard/pipeline", icon: "git-branch", labelKey: "nav.pipeline" },
    { path: "/dashboard/properties", icon: "building", labelKey: "nav.properties" },
    { path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
  ];

  const bottomNavItems = [
    { path: "/dashboard/analytics", icon: "bar-chart-3", labelKey: "nav.analytics" },
    { path: "/dashboard/team", icon: "users-2", labelKey: "nav.team" },
    { path: "/dashboard/integrations", icon: "plug", labelKey: "nav.integrations" },
  ];

  const role = user?.role?.toLowerCase?.() || user?.role;
  const canSeeAiCenter = role && ["admin", "owner", "agent"].includes(role);
  const canSeeAdmin = role === "super_admin" || role === "admin";
  const canSeePlatformListings = ["agent", "owner", "user"].includes(role);

  let navItems = topNavItems;
  if (role === "va") {
    navItems = topNavItems.filter((item) => item.path === "/dashboard/properties");
  } else if (role === "va_uploader") {
    navItems = [{ path: "/dashboard/va-upload", icon: "upload", labelKey: "nav.vaUpload" }];
  } else if (canSeeAdmin) {
    navItems = [
      { path: "/dashboard/admin/listings", icon: "file-check", labelKey: "nav.adminListings" },
      { path: "/dashboard/admin/users", icon: "shield", labelKey: "nav.adminUsers" },
      { path: "/dashboard/admin/teams", icon: "users", labelKey: "nav.adminTeams" },
    ];
  } else {
    if (canSeePlatformListings) {
      navItems = [
        ...topNavItems.slice(0, 6),
        { path: "/dashboard/platform-listings", icon: "store", labelKey: "nav.marketplace" },
        ...topNavItems.slice(6),
      ];
    }
  }

  const showAiCenterAndBottom = canSeeAiCenter && !canSeeAdmin;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside className={`crm-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo and Site Name */}
        <div className="crm-sidebar-header">
          {/* Desktop Toggle Button - Inside Sidebar (left of logo when expanded, centered when collapsed) */}
          <button
            className="crm-sidebar-toggle-inside"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i data-lucide="menu"></i>
          </button>
          {!isCollapsed && (
            <>
              <img 
                src="https://cdn.prod.website-files.com/69167a6a46fd073f4a958199/6921521d6cd18daedff74085_fb6918ba4a8709dd126682d90c8e31f1_ai_house_logo.avif"
                alt="Listo Qasa Logo"
                className="crm-sidebar-logo"
              />
              <span className="crm-sidebar-brand">Listo Qasa</span>
            </>
          )}
        </div>

        <nav className="crm-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={`${item.path}-${index}`}
              to={item.path}
              className={({ isActive }) =>
                `crm-nav-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
              end={item.path === "/dashboard/home"}
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              {item.isWhatsApp ? (
                <img
                  src="/assets/WhatsApp-Logo.svg"
                  alt="WhatsApp"
                  className="crm-nav-icon"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <i data-lucide={item.icon} className="crm-nav-icon"></i>
              )}
              {!isCollapsed && (
                <span className="crm-nav-label">
                  {t(item.labelKey)}
                  {item.isWhatsApp && <span style={{ marginLeft: "4px", fontSize: "12px" }}>🔥</span>}
                </span>
              )}
            </NavLink>
          ))}

          {showAiCenterAndBottom && (
            <div className="crm-nav-group" style={{ marginTop: "4px" }}>
              {isCollapsed ? (
                <NavLink
                  to="/dashboard/ai-center"
                  className={({ isActive }) => `crm-nav-link ${isActive ? "active" : ""}`}
                  onClick={onClose}
                  title={t("nav.aiCenter.label")}
                >
                  <i data-lucide="bot" className="crm-nav-icon"></i>
                </NavLink>
              ) : (
                <>
                  <button
                    type="button"
                    className={`crm-nav-link ${isAiCenterActive ? "active" : ""}`}
                    onClick={() => setAiCenterOpen((o) => !o)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "var(--sidebar-link-padding, 10px 12px)",
                      color: "inherit",
                      textAlign: "left",
                      font: "inherit",
                    }}
                  >
                    <i data-lucide="bot" className="crm-nav-icon"></i>
                    <span className="crm-nav-label">{t("nav.aiCenter.label")}</span>
                    <i
                      data-lucide={aiCenterOpen ? "chevron-down" : "chevron-right"}
                      style={{ marginLeft: "auto", width: "16px", height: "16px" }}
                    />
                  </button>
                  {aiCenterOpen && (
                    <div className="crm-nav-sub" style={{ paddingLeft: "12px" }}>
                      {AI_CENTER_ITEMS.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `crm-nav-link crm-nav-link-sub ${isActive ? "active" : ""}`
                          }
                          onClick={onClose}
                          style={{ paddingLeft: "24px", fontSize: "13px" }}
                        >
                          <span className="crm-nav-label">{t(item.labelKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {showAiCenterAndBottom &&
            bottomNavItems.map((item, index) => (
              <NavLink
                key={`${item.path}-${index}`}
                to={item.path}
                className={({ isActive }) =>
                  `crm-nav-link ${isActive ? "active" : ""}`
                }
                onClick={onClose}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <i data-lucide={item.icon} className="crm-nav-icon"></i>
                {!isCollapsed && (
                  <span className="crm-nav-label">{t(item.labelKey)}</span>
                )}
              </NavLink>
            ))}
        </nav>

        {/* Sidebar Footer - Account Info */}
        {/* <div className="crm-sidebar-footer">
          <div className="crm-user-info">
            <div className="crm-user-avatar">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="crm-user-details">
                <div className="crm-user-name">{user?.email || 'User'}</div>
                <div className="crm-user-role">{user?.role || 'user'}</div>
              </div>
            )}
          </div>
        </div> */}
      </aside>
    </>
  );
}
