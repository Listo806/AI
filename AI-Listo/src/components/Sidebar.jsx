import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { usePlan } from "../context/PlanContext";
import { useAiUnits } from "../context/AiUnitsContext";
import { LockBadge } from "./FeatureLock";
import { openFeatureAddOns, FEATURE_TO_ADDON } from "./FeatureAddOns";
import { useEffect, useState, useCallback } from "react";
import workspaceApi from "../api/workspaceApi";
import apiClient from "../api/apiClient";
import { whatsappUiMode, primaryRouteIsQr } from "../config/whatsappUi";
import headlogoImg from "../assets/cortexa/headlogo.png";
import headlogoImgDark from "../assets/cortexa/headlogotran.png";
import { ChevronsLeft, ChevronsRight, Home, icons, ChartColumn } from "lucide-react";

const toLucideComponentName = (name = "") =>
  String(name)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

function SidebarIcon({ name, className, style, ...props }) {
  // Keep Dashboard/Home explicit. Some lucide-react builds/tree-shaking
  // configurations do not expose every icon consistently through `icons`.
  if (name === "home") {
    return <Home className={className} style={style} {...props} />;
  }
  if (name === "bar-chart-3") {
    return <ChartColumn className={className} style={style} {...props} />;
  }

  const Icon = icons[toLucideComponentName(name)];

  if (!Icon) {
    return null;
  }

  return <Icon className={className} style={style} {...props} />;
}

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
  const aiUnits = useAiUnits();
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

  // Super Admin QA mode:
  // false = internal/admin view (all workspaces available to Super Admin)
  // true  = render the same locked/unpaid presentation a normal customer sees
  const [previewWorkspacesAsCustomer, setPreviewWorkspacesAsCustomer] = useState(false);

  // Inline "Add to My Plan" feedback shown in the workspace flyout. Cleared each
  // time a different workspace is hovered so a stale message never lingers.
  const [wsError, setWsError] = useState(null);
  const [wsBusy, setWsBusy] = useState(false);

  // LIVE per-workspace entitlement for the sidebar badges. ACTIVE (green) means
  // the workspace is linked to this customer's CRM account/plan. LOCKED means it
  // has not been selected for the plan yet.
  const [wsEntitled, setWsEntitled] = useState({});
  const [leadGenEntitled, setLeadGenEntitled] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const access = await workspaceApi.getAccess();
        if (alive && access && Array.isArray(access.workspaces)) {
          const map = {};
          access.workspaces.forEach((w) => {
            map[w.id] = !!w.entitled;
          });
          setWsEntitled(map);
        }
      } catch (_e) {
        /* fail closed — leave map empty so badges read LOCKED */
      }
      try {
        const res = await apiClient.request("/subscriptions/my-addons");
        const data = res && res.data !== undefined ? res.data : res;
        if (alive) setLeadGenEntitled(!!data?.leadGenerator);
      } catch (_e) {
        /* leave false */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  // Reload the live workspace entitlements after a plan-linked activation.
  const loadAccess = useCallback(async () => {
    try {
      const access = await workspaceApi.getAccess();
      if (access && Array.isArray(access.workspaces)) {
        const map = {};
        access.workspaces.forEach((w) => {
          map[w.id] = !!w.entitled;
        });
        setWsEntitled(map);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Add the selected Workspace directly to the customer's active CRM plan.
  // The backend creates/returns the stable Workspace instance UUID and links it
  // to the current customer/team + CRM subscription. No Paddle checkout is opened.
  const activateWorkspace = useCallback(
    async (ws) => {
      const catalogId = ws.id === "financial" ? "financial_services" : ws.id;
      setWsError(null);
      setWsBusy(true);

      try {
        const result = await workspaceApi.activate(catalogId);

        if (!result?.activated && !result?.alreadyEntitled) {
          setWsError(
            result?.message ||
              "Could not add this workspace to your CRM plan. Please try again.",
          );
          return;
        }

        await loadAccess();
        setWsError(null);
        setHoveredWorkspace(null);

        // Requirement: once selected, the workspace should immediately load inside
        // the customer's CRM. Prefer the backend route, then the sidebar route.
        const nextRoute = result?.route || ws.path;
        if (nextRoute) {
          window.location.href = nextRoute;
        }
      } catch (e) {
        setWsError(
          e?.response?.data?.message ||
            e?.data?.message ||
            e?.message ||
            "Could not add this workspace to your CRM plan. Please try again.",
        );
      } finally {
        setWsBusy(false);
      }
    },
    [loadAccess],
  );

  // Reset the Add-to-Plan feedback whenever a different workspace is hovered.
  useEffect(() => {
    setWsError(null);
    setWsBusy(false);
  }, [hoveredWorkspace?.id]);

  const workspaceItems = [
    {
      id: "business",
      feature: "businessWorkspace",
      label: "Business Suite",
      icon: "briefcase-business",
      tone: "slate",
      description:
        "Manage operations, billing, products, services, and everyday business workflows in one connected workspace.",
      capabilities: [
        "Tasks & To-Dos",
        "Follow-Ups",
        "Documents",
        "Work Items",
        "Estimates & Quotes",
        "Invoices",
        "Payments",
        "Expenses",
        "Products",
        "Services",
        "Price Lists",
        "Categories",
        "Business Reports",
        "Activity Tracking",
      ],
      perfectFor: [
        "Small Businesses",
        "Service Businesses",
        "Agencies",
        "Consultants",
        "Operations Teams",
        "Growing Companies",
      ],
      benefits: [
        [
          "briefcase-business",
          "COMPLETE BUSINESS OPERATIONS",
          "Manage tasks, documents, billing, expenses, products, services, and everyday business activity from one organized workspace.",
        ],
        [
          "receipt-text",
          "CONNECTED BILLING",
          "Move from estimate to invoice to payment while keeping outstanding balances and financial activity synchronized.",
        ],
        [
          "package",
          "PRODUCTS & SERVICES",
          "Maintain products, services, categories, and price lists and reuse them across estimates and invoices.",
        ],
        [
          "shield-check",
          "CONNECTED TO CORTEXA",
          "Works seamlessly with your existing Cortexa contacts, CRM, team, AI, automation, analytics, and business data.",
        ],
      ],
      price: 97,
      path: "/dashboard/business-workspace",
    },
    {
      id: "sales",
      feature: "salesWorkspace",
      label: "Sales Workspace",
      icon: "chart-no-axes-combined",
      tone: "purple",
      description: "Run your entire sales operation from quote to revenue in one connected workspace.",
      capabilities: ["Quotes & Proposals","Customers","Orders & Contracts","Invoices & Payments","Sales Commissions","Returns & Credits","Discounts & Approvals","Document Management","Sales Reporting","Revenue Tracking"],
      perfectFor: ["Sales Teams","B2B Companies","Distributors","Agencies","Service Providers"],
      benefits: [["circle-dollar-sign","COMPLETE SALES OPERATIONS","Manage quotes, proposals, orders, contracts, invoices, commissions and the operational side of your sales cycle from one workspace."],["trending-up","REVENUE VISIBILITY","See the activity behind your revenue—from customer orders and invoices to commissions, returns and sales performance."],["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa leads, pipeline, contacts, AI, automation, analytics and CRM data."]],
      price: 97,
      path: "/dashboard/sales-workspace",
    },
    {
      id: "insurance",
      feature: "insuranceWorkspace",
      label: "Insurance Workspace",
      icon: "shield-check",
      tone: "blue",
      description: "Manage your entire insurance operation—from quote to policy, renewal, claim, and commission—in one connected workspace.",
      capabilities: ["Policies","Quotes","Claims","Renewals","Carriers","Commissions","Client & Policy Documents","Coverage & Premium Tracking","Renewal Management","Insurance Reporting"],
      perfectFor: ["Insurance Agencies","Independent Agents","Brokers","Insurance Teams","Multi-Carrier Agencies"],
      benefits: [["shield","COMPLETE POLICY OPERATIONS","Manage quotes, policies, carriers, coverage, premiums, renewals and claims from one organized workspace."],["bell-ring","RENEWAL & CLIENT VISIBILITY","Stay ahead of upcoming renewals, policy activity, claims and important client dates without losing track of opportunities."],["users","COMMISSION TRACKING","Track commissions across policies, agents and carriers with clear visibility into insurance revenue."],["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa leads, pipeline, contacts, AI, automation, WhatsApp, analytics and CRM data."]],
      price: 97,
      path: "/dashboard/insurance-workspace",
    },
    {
      id: "financial",
      feature: "financialWorkspace",
      label: "Financial Services",
      icon: "landmark",
      tone: "green",
      description: "Manage clients, applications, accounts, transactions, documents, and financial workflows in one connected workspace.",
      capabilities: ["Client Management","Applications","Accounts","Approvals & Reviews","Transactions","Investment Activity","Advisor Workflows","Document Management","Commission Tracking","Financial Reporting"],
      perfectFor: ["Financial Advisors","Financial Services Teams","Consultants","Brokers","Wealth & Client Management Teams"],
      benefits: [["landmark","COMPLETE CLIENT OPERATIONS","Manage clients, applications, accounts, approvals, transactions, documents, and ongoing financial workflows from one organized workspace."],["file-check-2","APPLICATION & ACCOUNT VISIBILITY","Track applications, account activity, reviews, approvals, and important client actions without losing visibility across your operation."],["bar-chart-3","FINANCIAL WORKFLOW MANAGEMENT","Keep advisors, client activity, documents, commissions, and operational workflows organized and connected."],["trending-up","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa leads, pipeline, contacts, AI, automation, WhatsApp, analytics, and CRM data."]],
      price: 97,
      path: "/dashboard/financial-services",
    },
    {
      id: "ecommerce",
      feature: "ecommerceWorkspace",
      label: "E-Commerce",
      icon: "shopping-cart",
      tone: "orange",
      description: "Manage customers, subscriptions, billing, payments, and recurring revenue in one connected workspace.",
      capabilities: ["Customers & Subscriptions","Plans & Pricing","Billing Calendar","Recurring Payments","Payment Status Tracking","Failed Payments & Retries","Refunds & Cancellations","Seats & Users","Customer Lifetime Value","Revenue & Billing Reporting","Payment Gateway Integrations"],
      perfectFor: ["Subscription Businesses","E-Commerce Companies","SaaS Businesses","Membership Businesses","Recurring Revenue Companies"],
      benefits: [["shopping-bag","COMPLETE SUBSCRIPTION OPERATIONS","Manage customers, subscriptions, plans, billing status, payments, seats, and account activity from one organized workspace."],["refresh-cw","BILLING CALENDAR","See upcoming billing, successful payments, failed payments, retries, past-due accounts, and scheduled billing activity from one powerful calendar."],["pie-chart","RECURRING REVENUE CONTROL","Track subscription activity, customer lifetime value, payment performance, cancellations, and recurring revenue with clear operational visibility."],["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa customers, contacts, AI, automation, analytics, team data, and CRM activity."]],
      price: 97,
      path: "/dashboard/e-commerce-workspace",
    },
    {
      id: "customer-service",
      feature: "customerServiceWorkspace",
      label: "Customer Service",
      icon: "headphones",
      tone: "cyan",
      description: "Manage customer support, tickets, escalations, resolutions, and service operations in one connected workspace.",
      capabilities: ["Tickets & Cases","Support Inbox","Customer Support History","Agent Assignment","Priority & Status Management","SLA Tracking","Escalations","AI-Assisted Support","Knowledge Base","Customer Satisfaction","Service Automation","Support Reporting"],
      perfectFor: ["Customer Service Teams","Support Teams","Service Businesses","Operations Teams","Client Success Teams"],
      benefits: [["headphones","COMPLETE SUPPORT OPERATIONS","Manage tickets, cases, assignments, priorities, escalations, and resolutions from one organized workspace."],["messages-square","FASTER RESOLUTION","Give your team the customer history, conversations, support activity, and AI assistance they need to resolve issues faster."],["badge-check","SERVICE PERFORMANCE","Track response times, SLA performance, escalations, resolutions, customer satisfaction, and team activity with clear operational visibility."],["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa customers, contacts, WhatsApp, AI, automation, analytics, and CRM data."]],
      price: 97,
      path: "/dashboard/customer-service-workspace",
    },
    {
      id: "real-estate",
      feature: "realEstateWorkspace",
      label: "Real Estate Workspace",
      icon: "building-2",
      tone: "emerald",
      description: "Manage properties, buyers, sellers, showings, offers, transactions, and commissions in one connected real estate workspace.",
      capabilities: [
        "Properties & Listings",
        "Buyers & Sellers",
        "AI Property-to-Lead Matching",
        "Showings",
        "Offers",
        "Transactions",
        "Documents",
        "Commission Tracking",
        "Listing Optimization",
        "AI Property Insights",
        "Property Activity",
        "Real Estate Reporting",
      ],
      perfectFor: [
        "Real Estate Agents",
        "Brokers",
        "Real Estate Teams",
        "Investors",
        "Wholesalers",
        "Property Businesses",
      ],
      benefits: [
        ["building-2", "COMPLETE REAL ESTATE OPERATIONS", "Manage properties, listings, buyers, sellers, showings, offers, transactions, documents, and commissions from one organized workspace."],
        ["search-check", "SMART PROPERTY MATCHING", "Connect the right properties with the right buyers and leads using your existing Cortexa CRM data and AI-powered matching."],
        ["chart-no-axes-combined", "FROM LISTING TO COMMISSION", "Follow the complete real estate lifecycle from property and lead matching through showings, offers, transactions, and commissions."],
        ["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa leads, pipeline, contacts, AI, automation, WhatsApp, analytics, and CRM data."],
      ],
      price: 97,
      path: "/dashboard/real-estate-workspace",
    },
    {
      id: "team",
      feature: "teamWorkspace",
      label: "Team Workspace",
      icon: "users-round",
      tone: "violet",
      description: "Plan, assign, collaborate, and manage your team’s work from one connected workspace.",
      capabilities: ["Projects","Kanban Boards","Tasks & Assignments","My Tasks","Team Calendar","Deadlines & Priorities","Time Tracking","Workload Visibility","Files & Documents","Comments & @Mentions","Team Collaboration","Roles & Permissions","Activity Tracking","Team Reporting","AI-Assisted Workflows"],
      perfectFor: ["Sales Teams","Operations Teams","Project Teams","Agencies","Service Businesses","Growing Companies"],
      benefits: [["users-round","COMPLETE TEAM OPERATIONS","Manage internal projects, tasks, boards, assignments, deadlines, priorities, files, and team activity from one organized workspace."],["key-round","WORK MANAGEMENT","Give every team member clear ownership of their work with tasks, priorities, deadlines, calendars, workload visibility, and time tracking."],["chart-spline","CONNECTED COLLABORATION","Keep projects, tasks, comments, files, approvals, activity, and team communication connected to the work being completed."],["shield-check","CONNECTED TO CORTEXA","Works seamlessly with your existing Cortexa CRM, customers, contacts, AI, automation, analytics, and business data."]],
      price: 97,
      path: "/dashboard/team",
    },
    {
      id: "lead-generator",
      feature: "leadGenerator",
      label: "Lead Generator",
      icon: "target",
      tone: "indigo",
      description: "Find, verify, and enrich new business leads on demand, then push them straight into your Cortexa pipeline.",
      capabilities: ["Business Lead Search","Company & Contact Discovery","Email Finding","Email Verification","Data Enrichment","Bulk Lead Export","CRM Pipeline Sync","Search History","Credit Usage Tracking","Lead Quality Scoring"],
      perfectFor: ["Sales Teams","Agencies","Recruiters","B2B Companies","Growth Teams"],
      benefits: [["target","FIND NEW LEADS ON DEMAND","Search companies and decision-makers by industry, location, and role, and pull fresh prospects whenever you need them."],["mail-check","VERIFIED CONTACT DATA","Find and verify business emails so your outreach reaches real inboxes and your sender reputation stays clean."],["shield-check","CONNECTED TO CORTEXA","New leads flow straight into your existing Cortexa pipeline, contacts, AI, and automation."]],
      price: 97,
      path: "/dashboard/generator",
    },
  ];
   const getWorkspaceI18nKey = (workspace) =>
    String(workspace?.id || "").replace(/-/g, "_");

  const getWorkspaceLabel = (workspace) => {
    if (!workspace) return "";
    const key = getWorkspaceI18nKey(workspace);
    return t(
      `nav.workspaces.items.${key}.label`,
      workspace.label || ""
    );
  };

  const getWorkspaceDescription = (workspace) => {
    if (!workspace) return "";
    const key = getWorkspaceI18nKey(workspace);
    return t(
      `nav.workspaces.items.${key}.description`,
      workspace.description || ""
    );
  };

  const getWorkspaceCapabilities = (workspace) => {
    if (!workspace) return [];
    const key = getWorkspaceI18nKey(workspace);
    const translated = t(
      `nav.workspaces.items.${key}.capabilities`,
      {
        returnObjects: true,
      }
    );

    return Array.isArray(translated)
      ? translated
      : workspace.capabilities || [];
  };

  const getWorkspaceConnectionLine = (workspace) => {
    if (!workspace) return "";
    const key = getWorkspaceI18nKey(workspace);
    return t(
      `nav.workspaces.items.${key}.connected`,
      "Connected to your Cortexa CRM, data, AI, and automation."
    );
  };
  

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

  // Sidebar workspace id -> backend catalog id. The only divergence is Financial
  // (sidebar "financial" vs catalog "financial_services").
  const catalogIdFor = (id) => (id === "financial" ? "financial_services" : id);

  // A workspace is ACTIVE (green) only when the account genuinely holds it, driven by
  // the LIVE entitlement data — never hard-coded. Team is core; platform support sees
  // everything; Lead Generator uses its own add-on entitlement for now; every other
  // paid workspace is ACTIVE only when the team owns the $97 add-on.
  const isWorkspaceActive = (workspace) => {
    // GLOBAL RULE: every paid Workspace (Team included) is LOCKED unless the account
    // holds a verified $97 entitlement. No base plan (Free/Solo/Business/Scale) ever
    // includes a Workspace. Platform support (super_admin) sees everything for
    // support, except while previewing the customer experience.

    // Admin "Preview as Customer" QA mode: render every paid workspace exactly as
    // an unpaid customer sees it, regardless of the admin's real entitlement. This
    // is local, view-only state and never changes what real customers experience.
    if (previewWorkspacesAsCustomer) {
      return false;
    }
    if (isSuperAdminAccount) {
      return true;
    }
    // Lead Generator now uses the SAME workspace entitlement as every other $97
    // workspace (catalog id "lead-generator"), no separate add-on system.
    return !!wsEntitled[catalogIdFor(workspace?.id)];
  };

  const getWorkspaceBadge = (workspace) =>
    isWorkspaceActive(workspace) ? t("nav.workspaces.active") : t("nav.workspaces.locked");

  // Every workspace routes to its page; WorkspaceGate + the backend guard enforce
  // access and present the $97 add-on purchase when the team is not entitled.
  const canOpenWorkspace = (workspace) => !!workspace?.path;


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

  const primaryWhatsappNav =
    whatsappNavEntries.find(
      (item) => item.labelKey === "nav.whatsapp"
    ) || whatsappNavEntries[0];
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
    {
      path: "/dashboard/home",
      icon: "home",
      labelKey: "nav.dashboard",
    },

    ...(canSeeAiCenter
      ? [
          {
            path: "/dashboard/ai-cortexa",
            icon: "bot",
            labelKey: "nav.aiCenter.label",
          },
        ]
      : []),

    ...(primaryWhatsappNav
      ? [primaryWhatsappNav]
      : []),

    {
      path: "/dashboard/leads",
      icon: "users",
      labelKey: "nav.leads",
    },

    {
      path: "/dashboard/contacts",
      icon: "contact",
      labelKey: "nav.contacts",
    },

    {
      path: "/dashboard/pipeline",
      icon: "git-branch",
      labelKey: "nav.pipeline",
    },

    {
      path: "/dashboard/calendar",
      icon: "calendar",
      labelKey: "nav.calendar",
      feature: "calendar",
    },

    {
      path: "/dashboard/analytics",
      icon: "bar-chart-3",
      labelKey: "nav.analytics",
    },

    {
      path: "/dashboard/integrations",
      icon: "plug",
      labelKey: "nav.integrations",
    },

    ...(canSeeAiCenter
      ? [
          {
            path: "/dashboard/ai-cortexa-setup",
            icon: "settings",
            labelKey: "nav.setup",
          },
        ]
      : []),
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
                  <SidebarIcon name="smartphone" className="crm-nav-icon" />
                ) : (
                  <SidebarIcon name={item.icon} className="crm-nav-icon" />
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
                  <SidebarIcon name="bot" className="crm-nav-icon" />
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
                    <SidebarIcon name="bot" className="crm-nav-icon" />
                    <span className="crm-nav-label">{t("nav.aiCenter.label")}</span>
                    <SidebarIcon name={aiCenterOpen ? "chevron-down" : "chevron-right"}
                      style={{ marginLeft: "auto", width: "16px", height: "16px" }} />
                  </button>*/}
                  
                </>
              )}
              {/*</div>*/}
            </>
          )}
          
          {/* Core-CRM growth action: invite a teammate. Persistent, above the
              Workspaces section, visible on every core CRM page (desktop) and in
              the mobile drawer. Opens the global Invite Team Member modal. */}
          <button
            type="button"
            className="crm-nav-link crm-invite-team-link"
            onClick={() => {
              window.dispatchEvent(
                new Event("cortexa:open-invite-team")
              );

              if (onClose) onClose();
            }}
            title={
              isCollapsed
                ? t("nav.inviteTeamMember")
                : undefined
            }
            style={{
              width: "100%",
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
            }}
          >
            <SidebarIcon
              name="user-plus"
              className="crm-nav-icon"
            />

            {!isCollapsed && (
              <span className="crm-nav-label">
                {t("nav.inviteTeamMember")}
              </span>
            )}
          </button>

          {!isCollapsed && (
            <section
              className="crm-workspaces-section"
              onMouseLeave={() => setHoveredWorkspace(null)}
            >
              <div className="crm-workspaces-heading">
                <span>{t("nav.workspaces.title")}</span>
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
                      onMouseEnter={() => {
                        if (typeof window !== "undefined" && window.innerWidth > 1024) {
                          setHoveredWorkspace(workspace);
                        }
                      }}
                      onFocus={() => setHoveredWorkspace(workspace)}
                      onClick={() => {
                        // GLOBAL RULE: a LOCKED workspace never navigates. Clicking it
                        // only opens the hover card (with its "Add to My Plan" $97 CTA).
                        // Only an ACTIVE (purchased/entitled) workspace opens its route.
                        if (isWorkspaceActive(workspace) && workspace.path) {
                          window.location.href = workspace.path;
                          return;
                        }
                        setHoveredWorkspace(workspace);
                      }}
                    >
                      <span
                        className={`crm-workspace-icon crm-workspace-icon-${workspace.tone}`}
                      >
                        <SidebarIcon name={workspace.icon} />
                      </span>

                      <span className="crm-workspace-label">
                        {getWorkspaceLabel(workspace)}
                      </span>

                      <span
                        className={`crm-workspace-badge ${
                          workspaceActive ? "active" : "locked"
                        }`}
                      >
                        {getWorkspaceBadge(workspace)}
                      </span>

                      <SidebarIcon name="chevron-right"
                        className="crm-workspace-chevron" />
                    </button>
                  );
                })}

              </div>

              {(() => {
                // The single AI Units display: label + real number on one line,
                // then one horizontal bar. Unlimited plans show "Unlimited" + a
                // full green bar. Reads from the real backend balance.
                const b = aiUnits.balance;
                if (!b || b.entitled === false) return null;
                const COLORS = { green: "#16a34a", yellow: "#ea580c", red: "#dc2626", empty: "#dc2626" };

                if (aiUnits.unlimited) {
                  return (
                    <div className="crm-workspaces-expand-card crm-workspaces-ai-usage">
                      <div className="crm-workspaces-ai-usage-head">
                        <span>AI Units</span>
                        <strong style={{ color: "#16a34a" }}>Unlimited</strong>
                      </div>
                      <div className="crm-workspaces-ai-usage-track" role="progressbar" aria-label="AI Units" aria-valuenow="100">
                        <span className="crm-workspaces-ai-usage-fill" style={{ width: "100%", background: "#16a34a" }} />
                      </div>
                    </div>
                  );
                }

                const remaining = b?.totalRemaining ?? 0;
                const pct = Math.max(0, Math.min(100, b?.percentRemaining ?? 0));
                const color = COLORS[b?.color] || "#16a34a";
                const isOut = remaining <= 0;
                return (
                  <div className="crm-workspaces-expand-card crm-workspaces-ai-usage">
                    <div className="crm-workspaces-ai-usage-head">
                      <span>{isOut ? "AI Credits" : "AI Units Remaining"}</span>
                      <strong style={{ color }}>{remaining}</strong>
                    </div>
                    <div
                      className="crm-workspaces-ai-usage-track"
                      role="progressbar"
                      aria-label="AI Units Remaining"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={pct}
                    >
                      <span className="crm-workspaces-ai-usage-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    {isOut && (
                      <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <strong style={{ display: "block", color: "#dc2626" }}>You're out of AI credits.</strong>
                        <span style={{ color: "#6b7280" }}>To add more credits and continue using your AI Agent, click here.</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("cortexa:open-ai-units"))}
                      style={{
                        display: "block",
                        marginTop: 8,
                        background: isOut ? "#5b45f6" : "none",
                        border: "none",
                        borderRadius: isOut ? 8 : 0,
                        padding: isOut ? "9px 12px" : 0,
                        cursor: "pointer",
                        color: isOut ? "#ffffff" : "#14b8a6",
                        fontSize: 12,
                        fontWeight: 700,
                        width: isOut ? "100%" : "auto",
                        textAlign: isOut ? "center" : "left",
                      }}
                    >
                      {isOut ? "Add AI Credits" : "Get More AI →"}
                    </button>
                  </div>
                );
              })()}
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
          onMouseEnter={() => {
            if (typeof window !== "undefined" && window.innerWidth > 1024) {
              setHoveredWorkspace(hoveredWorkspace);
            }
          }}
          onMouseLeave={() => {
            if (typeof window !== "undefined" && window.innerWidth > 1024) {
              setHoveredWorkspace(null);
            }
          }}
        >
          <button
            type="button"
            className="crm-workspace-flyout-close"
            aria-label={t("nav.workspaces.closePreview")}
            onClick={() => setHoveredWorkspace(null)}
          >
            <SidebarIcon name="x" />
          </button>

          {isFullAccessRole && (
            <div className="crm-workspace-admin-previewbar">
              <div className="crm-workspace-admin-previewbar-copy">
                <span className="crm-workspace-admin-previewbar-eyebrow">
                  <SidebarIcon name="shield-check" />
                  ADMIN VIEW
                </span>
                <strong>
                  {previewWorkspacesAsCustomer
                    ? "Customer Preview View"
                    : "Admin / Active View"}
                </strong>
                <small>
                  {previewWorkspacesAsCustomer
                    ? "Showing the unpaid customer-facing workspace state."
                    : "Showing your internal Super Admin workspace access."}
                </small>
              </div>

              <button
                type="button"
                className={`crm-workspace-preview-toggle ${
                  previewWorkspacesAsCustomer ? "is-previewing" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewWorkspacesAsCustomer((current) => !current);
                }}
              >
                <SidebarIcon name={
                    previewWorkspacesAsCustomer ? "shield-check" : "eye"
                  } />
                {previewWorkspacesAsCustomer
                  ? "Back to Admin View"
                  : "Preview as Customer"}
              </button>
            </div>
          )}

          <div className="crm-workspace-flyout-intro">
            <div className="crm-workspace-flyout-kicker">
              <SidebarIcon name="sparkles" />
              <div>
                <h3>{t("nav.workspaces.flyoutTitle")}</h3>
                <p>
                  {t("nav.workspaces.flyoutDescription")}
                </p>
              </div>
            </div>

            <div className="crm-workspace-flyout-points">
              <span>
                <SidebarIcon name="rocket" />
                {t("nav.workspaces.specializedOperations")}
              </span>
              <span>
                <SidebarIcon name="lock-keyhole" />
                {t("nav.workspaces.activateWhatYouNeed")}
              </span>
            </div>
          </div>

          <div className={`crm-workspace-detail-card ${
            previewWorkspacesAsCustomer
              ? "is-customer-preview"
              : ""
          }`}>
            {previewWorkspacesAsCustomer && (
              <div className="crm-workspace-customer-preview-note">
                <SidebarIcon name="eye" />
                CUSTOMER PREVIEW — this is the unpaid customer-facing presentation
              </div>
            )}

            <div className="crm-workspace-detail-head">
              <span
                className={`crm-workspace-detail-icon crm-workspace-icon-${hoveredWorkspace.tone}`}
              >
                <SidebarIcon name={hoveredWorkspace.icon} />
              </span>

              <div className="crm-workspace-detail-title">
                <h3>{getWorkspaceLabel(hoveredWorkspace)}</h3>
                <p>{getWorkspaceDescription(hoveredWorkspace)}</p>
              </div>

              <span
                className={`crm-workspace-detail-badge ${
                  isWorkspaceActive(hoveredWorkspace) ? "active" : "locked"
                }`}
              >
                {getWorkspaceBadge(hoveredWorkspace)}
              </span>
            </div>

            <div className="crm-workspace-detail-body">
              <h4>{t("nav.workspaces.whatsIncluded")}</h4>

              <div className="crm-workspace-capabilities">
                {getWorkspaceCapabilities(hoveredWorkspace)
                  .slice(0, 6)
                  .map((capability, index) => (
                    <span key={`${hoveredWorkspace.id}-${index}`}>
                      <SidebarIcon name="circle-check" />
                      {capability}
                    </span>
                  ))}
              </div>

              <div className="crm-workspace-divider" />

              <p className="crm-workspace-connected-line">
                <SidebarIcon name="link-2" />
                <span>{getWorkspaceConnectionLine(hoveredWorkspace)}</span>
              </p>

              <div className="crm-workspace-price-row">
                {!isWorkspaceActive(hoveredWorkspace) && (
                  <div className="crm-workspace-preview-price">
                    <strong style={{ color: "#16a34a" }}>
                      {t("nav.workspaces.included", "Included with your plan")}
                    </strong>
                  </div>
                )}

                <button
                  type="button"
                  disabled={wsBusy && !isWorkspaceActive(hoveredWorkspace)}
                  className={
                    isWorkspaceActive(hoveredWorkspace)
                      ? "is-active"
                      : ""
                  }
                  onClick={() => {
                    if (isWorkspaceActive(hoveredWorkspace)) {
                      if (hoveredWorkspace.path) {
                        window.location.href = hoveredWorkspace.path;
                      }
                      return;
                    }
                    activateWorkspace(hoveredWorkspace);
                  }}
                >
                  {isWorkspaceActive(hoveredWorkspace)
                    ? hoveredWorkspace.path
                      ? `${t("nav.workspaces.open")} ${getWorkspaceLabel(
                          hoveredWorkspace
                        )}`
                      : `${getWorkspaceLabel(
                          hoveredWorkspace
                        )} ${t("nav.workspaces.activeSuffix")}`
                    : wsBusy
                      ? t("nav.workspaces.activating", "Adding to your plan...")
                      : t("nav.workspaces.addToPlan", "Add to My Plan")}
                </button>

                {wsError && !isWorkspaceActive(hoveredWorkspace) ? (
                  <p className="crm-workspace-price-helper" style={{ color: "#dc2626" }}>
                    {wsError}
                  </p>
                ) : isWorkspaceActive(hoveredWorkspace) ? (
                  <p className="crm-workspace-price-helper">
                    {t("nav.workspaces.activeOnAccount")}
                  </p>
                ) : (
                  <p className="crm-workspace-price-helper" style={{ color: "#16a34a" }}>
                    {t(
                      "nav.workspaces.includedNoCharge",
                      "This workspace will be added directly to your active CRM plan. No additional checkout is required.",
                    )}
                  </p>
                )}
              </div>


            </div>
          </div>
        </aside>
      )}
    </>
  );
}