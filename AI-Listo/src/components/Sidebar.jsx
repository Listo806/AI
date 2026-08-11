import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { usePlan } from "../context/PlanContext";
import { LockBadge } from "./FeatureLock";
import { openFeatureAddOns, FEATURE_TO_ADDON } from "./FeatureAddOns";
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
  // Onboarding Setup (Connect WhatsApp QR + initial config). Sits above Calendar.
  {
    path: "/dashboard/ai-cortexa-setup",
    icon: "settings",
    labelKey: "nav.setup",
  },
  {
    path: "/dashboard/calendar",
    icon: "calendar",
    labelKey: "nav.calendar",
    feature: "calendar",
  },
  // Single, clean AI Agent entry -> opens the one-page ChatGPT-style workspace.
  // The old multi-tab AI setup page stays reachable by URL (/dashboard/ai-cortexa-setup)
  // for configuring the agent, but is no longer shown as a separate sidebar item.
  {
    path: "/dashboard/ai-cortexa",
    icon: "bot",
    labelKey: "nav.aiCenter.label",
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
  const plan = usePlan();
  // A nav item is locked when it maps to a plan feature the account lacks. Fails
  // open: usePlan returns "allowed" while loading / on error, so no badge flashes
  // for users who actually have access.
  const isLocked = (item) => !!item?.feature && !plan.hasFeature(item.feature);
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

  const [hoveredWorkspace, setHoveredWorkspace] = useState(null);

  const workspaceItems = [
    {
      id: "sales",
      feature: "salesWorkspace",
      label: "Sales Workspace",
      icon: "chart-no-axes-combined",
      tone: "purple",
      description: "Close more deals. Manage every stage from quote to payment.",
      capabilities: ["Quotes & Proposals","Deal Revenue Tracking","Orders & Contracts","Sales Performance","Invoicing & Payments","Discounts & Approvals","Returns & Credits","Document Management","Sales Commissions","Advanced Reports"],
      perfectFor: ["Sales Teams","B2B Companies","Distributors","Agencies","Service Providers"],
      benefits: [["circle-dollar-sign","Complete Sales Cycle","From quote to cash in one place"],["trending-up","Increase Revenue","Better visibility and faster conversions"],["shield-check","Team Alignment","Collaborate and win as one team"]],
      price: 97,
      path: "/dashboard/sales-workspace",
    },
    {
      id: "insurance",
      feature: "insuranceWorkspace",
      label: "Insurance Workspace",
      icon: "shield-check",
      tone: "blue",
      description: "Manage prospects, policies, renewals, and client follow-ups in one connected workspace.",
      capabilities: ["Policy Pipeline","Renewal Tracking","Quote Follow-ups","Client Documents","Commission Tracking","Automated Reminders"],
      perfectFor: ["Insurance Agencies","Brokers","Independent Agents"],
      benefits: [["shield","Policy Visibility","Keep every policy and renewal organized"],["bell-ring","Never Miss Renewals","Automated reminders for key dates"],["users","Client Retention","Stay connected throughout the lifecycle"]],
      price: 97,
    },
    {
      id: "financial",
      feature: "financialWorkspace",
      label: "Financial Services",
      icon: "landmark",
      tone: "green",
      description: "Organize client relationships, opportunities, documents, and follow-up workflows.",
      capabilities: ["Client Portfolio View","Opportunity Tracking","Document Workflows","Task Automation","Client Follow-ups","Performance Reports"],
      perfectFor: ["Advisors","Consultants","Financial Teams"],
      benefits: [["landmark","Client Organization","Centralize accounts and opportunities"],["file-check-2","Better Compliance Flow","Keep documents and tasks structured"],["bar-chart-3","Performance Insight","See activity and growth at a glance"]],
      price: 97,
    },
    {
      id: "ecommerce",
      feature: "ecommerceWorkspace",
      label: "E-Commerce",
      icon: "shopping-cart",
      tone: "orange",
      description: "Connect customers, orders, support, and revenue activity in one workspace.",
      capabilities: ["Order Management","Customer Profiles","Abandoned Follow-up","Support Tracking","Revenue Reporting","Customer Segments"],
      perfectFor: ["Online Stores","DTC Brands","Retail Teams"],
      benefits: [["shopping-bag","Order Visibility","Keep customer and order context together"],["refresh-cw","Repeat Revenue","Build smarter follow-up workflows"],["pie-chart","Customer Insight","Understand buying patterns faster"]],
      price: 97,
    },
    {
      id: "customer-service",
      feature: "customerServiceWorkspace",
      label: "Customer Service",
      icon: "headphones",
      tone: "cyan",
      description: "Give support teams one place to manage customers, conversations, and resolutions.",
      capabilities: ["Support Queue","Conversation History","Resolution Tracking","Team Assignment","Customer Context","Service Reports"],
      perfectFor: ["Support Teams","Service Businesses","Operations"],
      benefits: [["headphones","Faster Support","Keep every customer conversation visible"],["messages-square","Connected Context","CRM and support history stay together"],["badge-check","Better Resolution","Track ownership and outcomes clearly"]],
      price: 97,
    },
    {
      id: "marketing",
      feature: "marketingWorkspace",
      label: "Marketing Workspace",
      icon: "megaphone",
      tone: "pink",
      description: "Plan campaigns, follow leads, and connect marketing activity directly to revenue.",
      capabilities: ["Campaign Tracking","Lead Attribution","Audience Segments","Automated Nurture","Content Workflow","Revenue Attribution"],
      perfectFor: ["Marketing Teams","Agencies","Growth Teams"],
      benefits: [["megaphone","Campaign Clarity","See what is running and what converts"],["target","Better Targeting","Use CRM context to improve outreach"],["badge-dollar-sign","Revenue Attribution","Connect campaigns to pipeline results"]],
      price: 97,
    },
    {
      id: "projects",
      feature: "projectsWorkspace",
      label: "Projects Workspace",
      icon: "briefcase-business",
      tone: "indigo",
      description: "Coordinate projects, customers, tasks, deadlines, and delivery from one place.",
      capabilities: ["Project Pipelines","Task Tracking","Milestones","Client Collaboration","Files & Notes","Delivery Reports"],
      perfectFor: ["Agencies","Consultants","Delivery Teams"],
      benefits: [["briefcase-business","Project Control","Track delivery from kickoff to completion"],["list-checks","Clear Ownership","Keep tasks and milestones accountable"],["users-round","Client Alignment","Connect project work to customer context"]],
      price: 97,
    },
    {
      id: "real-estate",
      feature: "realEstateWorkspace",
      label: "Real Estate Workspace",
      icon: "building-2",
      tone: "emerald",
      description: "Manage properties, listings, buyers, sellers, opportunities, and real estate workflows from one connected workspace.",
      capabilities: [
        "Property Management",
        "Listings & Inventory",
        "Buyer & Seller Tracking",
        "Property-to-Lead Matching",
        "Deal Pipeline",
        "Property Activity Timeline",
        "AI Property Insights",
        "Listing Optimization",
      ],
      perfectFor: [
        "Real Estate Teams",
        "Agents & Brokers",
        "Investors",
        "Wholesalers",
        "Property Businesses",
      ],
      benefits: [
        ["building-2", "Connected Inventory", "Keep properties, leads, and deals connected"],
        ["search-check", "Faster Matching", "Match the right properties with the right leads"],
        ["chart-no-axes-combined", "Revenue Visibility", "Track property activity and pipeline performance"],
      ],
      price: 97,
      path: "/dashboard/properties",
    },
    {
      id: "team",
      feature: "teamWorkspace",
      label: "Team Workspace",
      icon: "users-round",
      tone: "violet",
      description: "Collaborate across your CRM with shared ownership, roles, permissions, and team visibility.",
      capabilities: ["Team Members","Roles & Permissions","Shared Pipeline","Team Activity","Seat Management","Performance Visibility"],
      perfectFor: ["Sales Teams","Operations","Growing Businesses"],
      benefits: [["users-round","Shared Workspace","Keep everyone connected to the same CRM"],["key-round","Role Control","Manage access with clear permissions"],["chart-spline","Team Visibility","Understand activity and performance"]],
      path: "/dashboard/team",
    },
  ];


  // CORTEXA WORKSPACES uses the same plan-feature gating as the
  // regular sidebar, but MUST NOT inherit PlanContext's fail-open behavior
  // for brand-new/unregistered workspace feature keys.
  //
  // Why:
  // - usePlan()/hasFeature intentionally fails open while loading/on error.
  // - New keys such as salesWorkspace, insuranceWorkspace, etc. are not yet
  //   guaranteed to exist in the plan/add-on registry.
  // - Treating an unknown key as allowed made almost every workspace ACTIVE.
  //
  // A workspace can become ACTIVE only when its feature is actually registered
  // in FEATURE_TO_ADDON, or is an existing core feature we already gate today.
  const CORE_WORKSPACE_FEATURES = new Set([
    "teamWorkspace",
  ]);

  const isWorkspaceFeatureRegistered = (workspace) => {
    const feature = workspace?.feature;
    if (!feature) return false;

    return (
      CORE_WORKSPACE_FEATURES.has(feature) ||
      Object.prototype.hasOwnProperty.call(FEATURE_TO_ADDON || {}, feature)
    );
  };

  const isSuperAdminAccount = [
    "super_admin",
    "super-admin",
  ].includes(String(user?.role || "").toLowerCase());

  const isWorkspaceActive = (workspace) => {
    // Team Workspace is always available.
    if (workspace?.id === "team") {
      return true;
    }

    // Super Admin has full access to every Cortexa Workspace.
    if (isSuperAdminAccount) {
      return true;
    }

    // For all other accounts, only registered workspace features can
    // become ACTIVE, and the current plan must include that feature.
    if (!isWorkspaceFeatureRegistered(workspace)) {
      return false;
    }

    return !isLocked(workspace);
  };

  const getWorkspaceBadge = (workspace) =>
    isWorkspaceActive(workspace) ? "ACTIVE" : "PREMIUM";

  const canOpenWorkspace = (workspace) =>
    isWorkspaceActive(workspace) && !!workspace?.path;


  // Helpful while wiring backend/add-on feature keys. Remove later if desired.
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.table(
      workspaceItems.map((workspace) => ({
        workspace: workspace.label,
        feature: workspace.feature,
        registered: isWorkspaceFeatureRegistered(workspace),
        superAdmin: isSuperAdminAccount,
        teamAlwaysActive: workspace.id === "team",
        hasFeature: workspace.feature
          ? plan.hasFeature(workspace.feature)
          : false,
        locked: workspace.feature ? isLocked(workspace) : true,
        badge: getWorkspaceBadge(workspace),
      })),
    );
  }, [plan]);


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
  }, [isCollapsed, aiCenterOpen, hoveredWorkspace]);

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
            labelKey: "nav.whatsappQr",
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
  // One operational sidebar for every non-VA role (admins included). Admin pages
  // (Listings/Users/Teams/Plans) now live in the profile dropdown, not here.
  // Order: Dashboard, WhatsApp, Leads, Pipeline, Contacts, Analytics, Properties,
  // then Setup/Calendar/AI Agent (AI_CENTER_ITEMS), then Team/Integrations/Generator.
  const operationalNav = [
    { path: "/dashboard/home", icon: "home", labelKey: "nav.dashboard" },
    ...whatsappNavEntries,
    { path: "/dashboard/leads", icon: "users", labelKey: "nav.leads" },
    { path: "/dashboard/pipeline", icon: "git-branch", labelKey: "nav.pipeline" },
    { path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
    { path: "/dashboard/analytics", icon: "bar-chart-3", labelKey: "nav.analytics", feature: "advancedAnalytics" },
  ];

  let navItems = operationalNav;
  if (role === "va") {
    navItems = [
      { path: "/dashboard/properties", icon: "building", labelKey: "nav.properties" },
    ];
  } else if (role === "va_uploader") {
    navItems = [
      { path: "/dashboard/va-upload", icon: "upload", labelKey: "nav.vaUpload" },
    ];
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
            aria-label={
              isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
            title={
              isCollapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
            }
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
                onClick={(e) => {
                  // A locked (add-on) item opens the one universal Feature
                  // Add-Ons modal focused on the add-on that unlocks it, instead
                  // of navigating into a gated page.
                  if (isLocked(item)) {
                    e.preventDefault();
                    openFeatureAddOns(FEATURE_TO_ADDON[item.feature] || null);
                  }
                  if (onClose) onClose();
                }}
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
                {!isCollapsed && isLocked(item) && <LockBadge />}
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
                      onClick={(e) => {
                        if (isLocked(item)) {
                          e.preventDefault();
                          openFeatureAddOns(FEATURE_TO_ADDON[item.feature] || null);
                        }
                        if (onClose) onClose();
                      }}
                      title={isCollapsed ? t(item.labelKey) : undefined}
                    >
                      <i data-lucide={item.icon} className="crm-nav-icon"></i>
                      {!isCollapsed && (
                        <span className="crm-nav-label">
                          {item.label || t(item.labelKey)}
                        </span>
                      )}
                      {!isCollapsed && isLocked(item) && <LockBadge />}
                    </NavLink>
                  ))}
                </>
              )}
              {/*</div>*/}
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
              onClick={(e) => {
                if (isLocked(item)) {
                  e.preventDefault();
                  openFeatureAddOns(FEATURE_TO_ADDON[item.feature] || null);
                }
                if (onClose) onClose();
              }}
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <i data-lucide={item.icon} className="crm-nav-icon"></i>
              {!isCollapsed && (
                <>
                  <span className="crm-nav-label">{t(item.labelKey)}</span>

                  {item.labelKey === "nav.generator" && (
                    <span className="crm-nav-addon">{t("nav.addOn")}</span>
                  )}
                  {isLocked(item) && <LockBadge />}
                </>
              )}
            </NavLink>
          ))}
          

          {!isCollapsed && (
            <section
              className="crm-workspaces-section"
              onMouseLeave={() => setHoveredWorkspace(null)}
            >
              <div className="crm-workspaces-heading">
                <span>CORTEXA WORKSPACES</span>
                <span className="crm-workspaces-new">NEW</span>
              </div>

              <div className="crm-workspaces-list">
                {workspaceItems.map((workspace) => {
                  const workspaceActive = isWorkspaceActive(workspace);
                  const workspaceCanOpen = canOpenWorkspace(workspace);

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      className={`crm-workspace-item ${
                        workspaceActive ? "is-active" : ""
                      } ${workspaceCanOpen ? "is-clickable" : "is-premium"}`}
                      onMouseEnter={() => setHoveredWorkspace(workspace)}
                      onFocus={() => setHoveredWorkspace(workspace)}
                      onClick={() => {
                        if (workspaceCanOpen) {
                          window.location.href = workspace.path;
                          return;
                        }

                        // Same behavior as locked menu items above:
                        // show the add-on flow if there is a configured add-on.
                        if (isLocked(workspace)) {
                          const addon = FEATURE_TO_ADDON[workspace.feature];

                          if (addon) {
                            openFeatureAddOns(addon);
                            return;
                          }
                        }

                        // Otherwise keep the preview open.
                        setHoveredWorkspace(workspace);
                      }}
                    >
                      <span
                        className={`crm-workspace-icon crm-workspace-icon-${workspace.tone}`}
                      >
                        <i data-lucide={workspace.icon}></i>
                      </span>

                      <span className="crm-workspace-label">
                        {workspace.label}
                      </span>

                      <span
                        className={`crm-workspace-badge ${
                          workspaceActive ? "active" : ""
                        }`}
                      >
                        {getWorkspaceBadge(workspace)}
                      </span>

                      <i
                        data-lucide="chevron-right"
                        className="crm-workspace-chevron"
                      ></i>
                    </button>
                  );
                })}
              </div>

              <div className="crm-workspaces-expand-card">
                <div className="crm-workspaces-expand-title">
                  <i data-lucide="crown"></i>
                  <strong>Expand Cortexa</strong>
                </div>

                <p>
                  Unlock powerful workspaces and scale your operations.
                </p>

                <button
                  type="button"
                  onMouseEnter={() =>
                    setHoveredWorkspace(workspaceItems[0])
                  }
                >
                  <span>Explore All Workspaces</span>
                  <i data-lucide="arrow-right"></i>
                </button>
              </div>
            </section>
          )}

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

      {!isCollapsed && hoveredWorkspace && (
        <aside
          className="crm-workspace-flyout"
          onMouseEnter={() => setHoveredWorkspace(hoveredWorkspace)}
          onMouseLeave={() => setHoveredWorkspace(null)}
        >
          <div className="crm-workspace-flyout-intro">
            <div className="crm-workspace-flyout-kicker">
              <i data-lucide="sparkles"></i>

              <div>
                <h3>Cortexa Workspaces</h3>
                <p>
                  Specialized business environments designed to help you
                  sell, serve and scale more effectively.
                </p>
              </div>
            </div>

            <div className="crm-workspace-flyout-points">
              <span>
                <i data-lucide="rocket"></i>
                Purpose-built for your industry
              </span>
              <span>
                <i data-lucide="lock-keyhole"></i>
                Activate only what you need
              </span>
              <span>
                <i data-lucide="shield-check"></i>
                Secure, scalable, and powerful
              </span>
              <span>
                <i data-lucide="zap"></i>
                Always connected to your CRM
              </span>
            </div>
          </div>

          <div className="crm-workspace-detail-card">
            <div className="crm-workspace-detail-head">
              <span
                className={`crm-workspace-detail-icon crm-workspace-icon-${hoveredWorkspace.tone}`}
              >
                <i data-lucide={hoveredWorkspace.icon}></i>
              </span>

              <div className="crm-workspace-detail-title">
                <h3>{hoveredWorkspace.label}</h3>
                <p>{hoveredWorkspace.description}</p>
              </div>

              <span
                className={`crm-workspace-detail-badge ${
                  isWorkspaceActive(hoveredWorkspace) ? "active" : ""
                }`}
              >
                {getWorkspaceBadge(hoveredWorkspace)}
              </span>
            </div>

            <div className="crm-workspace-detail-body">
              <h4>Key Capabilities</h4>

              <div className="crm-workspace-capabilities">
                {hoveredWorkspace.capabilities.map((capability) => (
                  <span key={capability}>
                    <i data-lucide="circle-check"></i>
                    {capability}
                  </span>
                ))}
              </div>

              <div className="crm-workspace-divider" />

              <h4>Perfect For</h4>

              <div className="crm-workspace-tags">
                {hoveredWorkspace.perfectFor.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <div className="crm-workspace-divider" />

              <h4>What You Get</h4>

              <div className="crm-workspace-benefits">
                {hoveredWorkspace.benefits.map(([icon, title, desc]) => (
                  <div key={title}>
                    <i data-lucide={icon}></i>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>

              <div className="crm-workspace-price-row">
                <div>
                  {isWorkspaceActive(hoveredWorkspace) ? (
                    <>
                      <small>Status</small>
                      <strong className="crm-workspace-active-label">
                        Active
                      </strong>
                    </>
                  ) : (
                    <>
                      <small>Starting at</small>
                      <strong>
                        ${hoveredWorkspace.price}
                        <em>/month</em>
                      </strong>
                      <p>Billed monthly. Cancel anytime.</p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className={
                    isWorkspaceActive(hoveredWorkspace)
                      ? "is-active"
                      : ""
                  }
                  onClick={() => {
                    if (canOpenWorkspace(hoveredWorkspace)) {
                      window.location.href = hoveredWorkspace.path;
                      return;
                    }

                    if (isLocked(hoveredWorkspace)) {
                      const addon =
                        FEATURE_TO_ADDON[hoveredWorkspace.feature];

                      if (addon) {
                        openFeatureAddOns(addon);
                      }
                    }
                  }}
                >
                  {isWorkspaceActive(hoveredWorkspace)
                    ? hoveredWorkspace.path
                      ? `Open ${hoveredWorkspace.label}`
                      : `${hoveredWorkspace.label} Active`
                    : `Activate ${hoveredWorkspace.label}`}

                  <i data-lucide="chevron-right"></i>
                </button>
              </div>

              <button
                type="button"
                className="crm-workspace-full-details"
              >
                View Full Details
                <i data-lucide="external-link"></i>
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}