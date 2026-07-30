import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { whatsappUiMode, primaryRouteIsQr } from "../config/whatsappUi";
import headlogoImg from "../assets/cortexa/headlogo.png";
import headlogoImgDark from "../assets/cortexa/headlogotran.png";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
const AI_CENTER_PATHS = [
  "/dashboard/ai-cortexa",
  // "/dashboard/ai-center",
  // "/dashboard/ai-assistant",
  // "/dashboard/ai-auto-reply",
  // "/dashboard/ai-appointment-setter",
  // "/dashboard/ai-qualification-rules",
  // "/dashboard/ai-messaging",
  // "/dashboard/ai-logs",
];

const AI_CENTER_ITEMS = [
  {
    path: "/dashboard/calendar",
    icon: "calendar",
    label: "Calendar",
  },
  // Single, clean AI Agent entry -> opens the one-page ChatGPT-style workspace.
  // The old multi-tab AI setup page stays reachable by URL (/dashboard/ai-cortexa-setup)
  // for configuring the agent, but is no longer shown as a separate sidebar item.
  {
    path: "/dashboard/ai-cortexa",
    icon: "bot",
    label: "AI Agent",
  },
  // { path: "/dashboard/ai-center", labelKey: "nav.aiCenter.overview" },
  // { path: "/dashboard/ai-assistant", labelKey: "nav.aiCenter.aiAssistant" },
  // { path: "/dashboard/ai-auto-reply", labelKey: "nav.aiCenter.autoReply" },
  // { path: "/dashboard/ai-appointment-setter", labelKey: "nav.aiCenter.appointmentSetter" },
  // { path: "/dashboard/ai-qualification-rules", labelKey: "nav.aiCenter.qualificationRules" },
  // { path: "/dashboard/ai-messaging", labelKey: "nav.aiCenter.messaging" },
  // { path: "/dashboard/ai-logs", labelKey: "nav.aiCenter.activityLogs" },
];

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  if (loading) return null;
  const location = useLocation();

  const [aiCenterOpen, setAiCenterOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("aiCenterSidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const WhatsAppIcon = () => {
    return (
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.6 6.31999C16.8669 5.58141 15.9943 4.99596 15.033 4.59767C14.0716 4.19938 13.0406 3.99622 12 3.99999C10.6089 4.00135 9.24248 4.36819 8.03771 5.06377C6.83294 5.75935 5.83208 6.75926 5.13534 7.96335C4.4386 9.16745 4.07046 10.5335 4.06776 11.9246C4.06507 13.3158 4.42793 14.6832 5.12 15.89L4 20L8.2 18.9C9.35975 19.5452 10.6629 19.8891 11.99 19.9C14.0997 19.9001 16.124 19.0668 17.6222 17.5816C19.1205 16.0965 19.9715 14.0796 19.99 11.97C19.983 10.9173 19.7682 9.87634 19.3581 8.9068C18.948 7.93725 18.3505 7.05819 17.6 6.31999ZM12 18.53C10.8177 18.5308 9.65701 18.213 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.55925 14.0667 5.24174 12.429 5.51762 10.8372C5.7935 9.24545 6.64361 7.81015 7.9069 6.80322C9.1702 5.79628 10.7589 5.28765 12.3721 5.37368C13.9853 5.4597 15.511 6.13441 16.66 7.26999C17.916 8.49818 18.635 10.1735 18.66 11.93C18.6442 13.6859 17.9355 15.3645 16.6882 16.6006C15.441 17.8366 13.756 18.5301 12 18.53ZM15.61 13.59C15.41 13.49 14.44 13.01 14.26 12.95C14.08 12.89 13.94 12.85 13.81 13.05C13.6144 13.3181 13.404 13.5751 13.18 13.82C13.07 13.96 12.95 13.97 12.75 13.82C11.6097 13.3694 10.6597 12.5394 10.06 11.47C9.85 11.12 10.26 11.14 10.64 10.39C10.6681 10.3359 10.6827 10.2759 10.6827 10.215C10.6827 10.1541 10.6681 10.0941 10.64 10.04C10.64 9.93999 10.19 8.95999 10.03 8.56999C9.87 8.17999 9.71 8.23999 9.58 8.22999H9.19C9.08895 8.23154 8.9894 8.25465 8.898 8.29776C8.8066 8.34087 8.72546 8.403 8.66 8.47999C8.43562 8.69817 8.26061 8.96191 8.14676 9.25343C8.03291 9.54495 7.98287 9.85749 8 10.17C8.0627 10.9181 8.34443 11.6311 8.81 12.22C9.6622 13.4958 10.8301 14.5293 12.2 15.22C12.9185 15.6394 13.7535 15.8148 14.58 15.72C14.8552 15.6654 15.1159 15.5535 15.345 15.3915C15.5742 15.2296 15.7667 15.0212 15.91 14.78C16.0428 14.4856 16.0846 14.1583 16.03 13.84C15.94 13.74 15.81 13.69 15.61 13.59Z"
          fill="currentColor"
        />
      </svg>
    );
  };

  useEffect(() => {
    const open = AI_CENTER_PATHS.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
    );
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

  const isAiCenterActive = AI_CENTER_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
  );

  // VITE_WHATSAPP_UI: twilio = original only | qr = QR at /dashboard/whatsapp only | both = two entries
  const whatsappNavEntries =
    whatsappUiMode === "both"
      ? [
          {
            path: "/dashboard/whatsapp",
            icon: "whatsapp",
            labelKey: "nav.whatsapp",
            isWhatsApp: true,
          },
          {
            path: "/dashboard/whatsapp-qr",
            icon: "smartphone",
            label: "WhatsApp QR",
          },
        ]
      : primaryRouteIsQr
        ? [
            {
              path: "/dashboard/whatsapp-qr",
              icon: "whatsapp",
              labelKey: "nav.whatsapp",
              isWhatsApp: true,
            },
          ]
        : [
            {
              path: "/dashboard/whatsapp",
              icon: "whatsapp",
              labelKey: "nav.whatsapp",
              isWhatsApp: true,
            },
          ];

  const topNavItems = [
    { path: "/dashboard/home", icon: "home", labelKey: "nav.dashboard" },
    ...whatsappNavEntries,
    { path: "/dashboard/leads", icon: "users", labelKey: "nav.leads" },
    //{ path: "/dashboard/instagram", icon: "camera", labelKey: "nav.instagram" },
    {
      path: "/dashboard/pipeline",
      icon: "git-branch",
      labelKey: "nav.pipeline",
    },
    {
      path: "/dashboard/properties",
      icon: "building",
      labelKey: "nav.properties",
    },
    //{ path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
  ];
  const instagramNavItems = [
    { path: "/dashboard/instagram", icon: "camera", labelKey: "nav.instagram" },
  ];
  const analyticsNavItems = [
    {
      path: "/dashboard/analytics",
      icon: "bar-chart-3",
      labelKey: "nav.analytics",
    },
  ];

  const bottomNavItems = [
    //{ path: "/dashboard/analytics", icon: "bar-chart-3", labelKey: "nav.analytics" },
    { path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
    //{ path: "/dashboard/team", icon: "users-2", labelKey: "nav.team" },
    //{ path: "/dashboard/integrations", icon: "plug", labelKey: "nav.integrations" },
  ];

  const systemNavItems = [
    { path: "/dashboard/team", icon: "users-2", labelKey: "nav.team" },
    {
      path: "/dashboard/integrations",
      icon: "plug",
      labelKey: "nav.integrations",
    },
    { path: "/dashboard/generator", icon: "target", labelKey: "nav.generator" },
  ];

  const role =
    typeof user?.role === "string" ? user.role.toLowerCase() : user?.role;
  const isDeveloper = role === "developer";
  const isFullAccessRole = ["super_admin", "admin", "developer"].includes(role);

  const canSeeAiCenter =
    role && ["super_admin", "admin", "owner", "agent", "developer"].includes(role);
  const canSeeAdmin = role === "super_admin" || role === "admin" || isDeveloper;
  const canSeePlatformListings = ["agent", "owner", "user", "developer"].includes(role);
  console.log("USER IN SIDEBAR:", user);
  let navItems = topNavItems;
  if (role === "va") {
    navItems = topNavItems.filter(
      (item) => item.path === "/dashboard/properties",
    );
  } else if (role === "va_uploader") {
    navItems = [
      {
        path: "/dashboard/va-upload",
        icon: "upload",
        labelKey: "nav.vaUpload",
      },
    ];
  } else if (canSeeAdmin) {
    navItems = [
      { path: "/dashboard/home", icon: "home", labelKey: "nav.dashboard" },
      ...whatsappNavEntries,
      { path: "/dashboard/leads", icon: "users", labelKey: "nav.leads" },
      { path: "/dashboard/pipeline", icon: "git-branch", labelKey: "nav.pipeline" },
      { path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
      { path: "/dashboard/analytics", icon: "bar-chart-3", labelKey: "nav.analytics" },
      {
        path: "/dashboard/properties",
        icon: "building",
        labelKey: "nav.properties",
      },
      {
        path: "/dashboard/admin/listings",
        icon: "file-check",
        labelKey: "nav.adminListings",
      },
      {
        path: "/dashboard/admin/users",
        icon: "shield",
        labelKey: "nav.adminUsers",
      },
      {
        path: "/dashboard/admin/teams",
        icon: "users",
        labelKey: "nav.adminTeams",
      },
      {
        path: "/dashboard/admin/plans",
        icon: "credit-card",
        labelKey: "nav.adminPlans",
      },
    ];
  } else {
    if (canSeePlatformListings) {
      navItems = [
        ...topNavItems.slice(0, 6),
        //{ path: "/dashboard/platform-listings", icon: "store", labelKey: "nav.marketplace" },
        ...topNavItems.slice(6),
      ];
    }
  }

  const showAiCenterAndBottom = canSeeAiCenter;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside
        className={`crm-sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
      >
        {/* Logo and Site Name */}
        <img src={headlogoImg} className="cx-logo-img- logo-light" />
        <img src={headlogoImgDark} className="m-logo logo-dark" alt="CORTEXA" />
        <div className="crm-sidebar-header">
          {/* Desktop Toggle Button - Inside Sidebar (left of logo when expanded, centered when collapsed) */}
          <button
            className="crm-sidebar-toggle-inside"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight size={18} />
            ) : (
              <ChevronsLeft size={18} />
            )}
          </button>
          {/*{!isCollapsed && (
            <>
              <img 
                src="https://cdn.prod.website-files.com/69167a6a46fd073f4a958199/6921521d6cd18daedff74085_fb6918ba4a8709dd126682d90c8e31f1_ai_house_logo.avif"
                alt="ListoQasa Logo"
                className="crm-sidebar-logo"
              />
              <span className="crm-sidebar-brand">ListoQasa</span>
            </>
          )}*/}
        </div>

        <nav className="crm-nav">
          {/*!isCollapsed && <div className="crm-nav-fix-label">{t("nav.core")}</div>*/}
          {navItems.map((item, index) => (
            <span key={`${item.path}-${index}`} style={{ display: "contents" }}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `crm-nav-link ${isActive ? "active" : ""}`
                }
                onClick={onClose}
                end={
                  item.path === "/dashboard/home" ||
                  item.path === "/vacation-rentals/search"
                }
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                {item.isWhatsApp ? (
                  /*<img
                    src="/assets/WhatsApp-Logo.svg"
                    alt="WhatsApp"
                    className="crm-nav-icon"
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />*/
                  <WhatsAppIcon />
                ) : item.path === "/dashboard/whatsapp-qr" ||
                  (primaryRouteIsQr &&
                    item.path === "/dashboard/whatsapp" &&
                    item.icon === "smartphone") ? (
                  <i data-lucide="smartphone" className="crm-nav-icon"></i>
                ) : (
                  <i data-lucide={item.icon} className="crm-nav-icon"></i>
                )}
                {!isCollapsed && (
                  <span className="crm-nav-label">
                    {item.label || t(item.labelKey)}
                    {/*{item.isWhatsApp && <span style={{ marginLeft: "4px", fontSize: "12px" }}>🔥</span>}*/}
                  </span>
                )}
              </NavLink>
            </span>
          ))}

          {showAiCenterAndBottom && (
            <>
              {/*!isCollapsed && <div className="crm-nav-fix-label">{t("nav.ai_agent")}</div>*/}
              {/*<div className="crm-nav-group crm-nav-group-ai">*/}
              {isCollapsed ? (
                <NavLink
                  to="/dashboard/ai-cortexa"
                  className={({ isActive }) =>
                    `crm-nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={onClose}
                  title={t("nav.aiCenter.label")}
                >
                  <i data-lucide="bot" className="crm-nav-icon"></i>
                </NavLink>
              ) : (
                <>
                  {/*<button
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
                  </button>*/}
                  {AI_CENTER_ITEMS.map((item, index) => (
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
                        <span className="crm-nav-label">
                          {item.label || t(item.labelKey)}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </>
              )}
              {/*</div>*/}
            </>
          )}
          {!canSeeAdmin && (
            <>
              {/*!isCollapsed && <div className="crm-nav-fix-label">{t("nav.intelligence")}</div>*/}
              {analyticsNavItems.map((item, index) => (
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
            </>
          )}
          {showAiCenterAndBottom && !canSeeAdmin && (
            <>
              {/*!isCollapsed && <div className="crm-nav-fix-label">{t("nav.management")}</div>*/}
              {/* <div className="crm-nav-spacer" aria-hidden="true" /> */}
              <div className="crm-nav-group-bottom">
                {bottomNavItems.map((item, index) => (
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
              </div>
            </>
          )}

          {/*!isCollapsed && <div className="crm-nav-fix-label">{t("nav.system")}</div>*/}
          {systemNavItems.map((item, index) => (
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
                <>
                  <span className="crm-nav-label">{t(item.labelKey)}</span>

                  {item.labelKey === "nav.generator" && (
                    <span className="crm-nav-addon">add on</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
          
        </nav>

        {/* {!isCollapsed && (
        <div style={{marginTop: "auto", padding: "20px 16px", borderTop: "1px solid #eef2f7"}}>
  
          <div style={{fontSize: "11px", color: "#9ca3af", marginBottom: "6px"}}>
            Powered by
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "6px"}}>
            <img src="/assets/header-logo.png" style={{width: "15px", height: "15px"}} />
            <span style={{fontSize: "13px", fontWeight: "600", color: "#1f2937"}}>
              CORTEXA
            </span>
          </div>

          <div style={{fontSize: "11px", color: "#6b7280", marginTop: "2px"}}>
            Intelligence Core
          </div>
        </div>
        )}

        <div
          className={`crm-sidebar-powered ${isCollapsed ? "crm-sidebar-powered--collapsed" : ""}`}
          aria-label="Powered by CORTEXA Intelligence Core"
        >
          <div className="crm-nav-spacer" aria-hidden="true" />
          <div className="crm-sidebar-powered-sep" role="separator" />
          {!isCollapsed && (
            <>
              <p className="crm-sidebar-powered-by">Powered by</p>
              <p className="crm-sidebar-powered-brand"><img src="/assets/header-logo.png" className="icon" alt="CORTEXA" /> CORTEXA</p>
              <p className="crm-sidebar-powered-text">Intelligence Core</p>
            </>
          )}
          {isCollapsed && (
            <span className="crm-sidebar-powered-abbr" title="CORTEXA Intelligence Core">
              <img src="/assets/header-logo.png" className="icon" alt="CORTEXA" />
            </span>
          )}
        </div> */}

        {/* Sidebar Footer - Account Info */}
        {/* <div className="crm-sidebar-footer">
          <div className="crm-user-info">
            <div className="crm-user-avatar">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="crm-user-details">
                <div className="crm-user-name">{user?.name || user?.email || 'User'}</div>
                <div className="crm-user-role">{user?.role || 'user'}</div>
              </div>
            )}
          </div>
        </div> */}
      </aside>
    </>
  );
}
