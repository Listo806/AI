import React, { useState, useEffect } from "react";
import "./AppsIntegrationsHub.css";
import {
  Search,
  Zap,
  Mail,
  Webhook,
  CalendarDays,
  Camera,
  MessageCircle,
  Database,
  Cloud,
  FileSpreadsheet,
  FolderSync,
  Workflow,
  BarChart3,
  Globe,
  Link2,
  Building2,
  ChevronRight,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
const categories = [
  "All Apps",
  "Communication",
  "Automation",
  "Calendars",
  "Marketing",
  "Storage",
  "CRM Imports",
  "API & Webhooks",
];

const integrationsConfig = [
  {
    key: "zapier",
    title: "Zapier",
    description: "Connect thousands of apps and automate workflows instantly.",
    icon: Zap,
    iconColor: "#ff5a1f",
    iconBg: "#fff1eb",
    category: "Automation",
    //status: "Connected",
  },
  {
    key: "email_provider",
    title: "Email Provider",
    description: "Connect Gmail, Outlook, SMTP, and outbound email services.",
    icon: Mail,
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
    category: "Communication",
    //status: "Configure",
  },
  {
    key: "webhooks",
    title: "Webhooks",
    description:
      "Send and receive real-time API events and automation triggers.",
    icon: Webhook,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    category: "API & Webhooks",
    //status: "Active",
  },
  {
    key: "google_calendar",
    title: "Google Calendar",
    description: "Sync appointments, meetings, and scheduling automatically.",
    icon: CalendarDays,
    iconColor: "#16a34a",
    iconBg: "#f0fdf4",
    category: "Calendars",
    //status: "Connect",
  },
  {
    key: "instagram",
    title: "Instagram",
    description: "Connect Instagram messaging, lead capture, and automation.",
    icon: Camera,
    iconColor: "#e1306c",
    iconBg: "#fff0f6",
    category: "Marketing",
    //status: "Connected",
  },
  {
    key: "whatsapp",
    title: "WhatsApp",
    description: "Sync WhatsApp conversations and automate lead engagement.",
    icon: MessageCircle,
    iconColor: "#22c55e",
    iconBg: "#f0fdf4",
    category: "Communication",
    //status: "Connected",
  },
  {
    key: "crm_migration",
    title: "CRM Migration Tool",
    description:
      "Import leads, pipelines, contacts, and properties from another CRM.",
    icon: Database,
    iconColor: "#0f766e",
    iconBg: "#ecfeff",
    category: "CRM Imports",
    //status: "Import",
  },
  {
    key: "google_drive",
    title: "Google Drive",
    description: "Store contracts, property documents, and media in the cloud.",
    icon: Cloud,
    iconColor: "#0284c7",
    iconBg: "#f0f9ff",
    category: "Storage",
    //status: "Connect",
  },
  {
    key: "csv_lead_import",
    title: "CSV Lead Import",
    description:
      "Upload lead lists and import contacts into your CRM instantly.",
    icon: FileSpreadsheet,
    iconColor: "#15803d",
    iconBg: "#f0fdf4",
    category: "CRM Imports",
    //status: "Import",
  },
  {
    key: "property_feed_sync",
    title: "Property Feed Sync",
    description: "Sync listings and property feeds from external platforms.",
    icon: FolderSync,
    iconColor: "#d97706",
    iconBg: "#fffbeb",
    category: "CRM Imports",
    //status: "Sync",
  },
  {
    key: "make",
    title: "Make.com",
    description: "Create advanced automations and visual workflow systems.",
    icon: Workflow,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    category: "Automation",
    //status: "Connect",
  },
  {
    key: "google_ads",
    title: "Google Ads",
    description:
      "Track campaigns, leads, and ad performance directly inside CORTEXA.",
    icon: BarChart3,
    iconColor: "#ea4335",
    iconBg: "#fef2f2",
    category: "Marketing",
    //status: "Connect",
  },
  {
    key: "tiktok",
    title: "TikTok Lead Sync",
    description: "Capture TikTok leads directly into your CRM.",
    icon: Globe,
    iconColor: "#1877f2",
    iconBg: "#eff6ff",
    category: "Marketing",
    //status: "Connect",
  },
  {
    key: "api_access",
    title: "API Access",
    description:
      "Connect external CRMs, websites, and custom systems using APIs.",
    icon: Link2,
    iconColor: "#475569",
    iconBg: "#f8fafc",
    category: "API & Webhooks",
    //status: "Configure",
  },
  {
    key: "mls_idx_feed",
    title: "MLS / IDX Feed",
    description:
      "Import and synchronize property listings from MLS/IDX systems.",
    icon: Building2,
    iconColor: "#b45309",
    iconBg: "#fefce8",
    category: "CRM Imports",
    //status: "Connect",
  },
];

export default function AppsIntegrationsHub() {
  const [activeCategory, setActiveCategory] = useState("All Apps");
  const navigate = useNavigate();
  const [syncingKey, setSyncingKey] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadIntegrations();
  }, []);
  const [integrationStates, setIntegrationStates] = useState([]);
  const [search, setSearch] = useState("");
  const loadIntegrations = async () => {
    try {
      setLoading(true);

      const [
        integrationsRes,
        emailStatus,
        webhookStatus,
        zapierStatus,
        googleCalendarStatus,
        googleDriveStatus,
      ] = await Promise.all([
        apiClient.request("/integrations"),
        loadEmailStatus(),
        loadWebhookStatus(),
        loadZapierStatus(),
        loadGoogleCalendarStatus(),
        loadGoogleDriveStatus(),
      ]);

      const integrations = integrationsRes.integrations || [];

      const updated = integrations.map((item) => {
        /*
         * EMAIL PROVIDER
         */
        if (item.key === "email_provider" && emailStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "webhooks" && webhookStatus?.isConfigured) {
          return {
            ...item,
            status: "active",
          };
        }
        if (item.key === "zapier" && zapierStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (
          item.key === "google_calendar" &&
          googleCalendarStatus?.isConfigured
        ) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "google_drive" && googleDriveStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }

        return item;
      });

      setIntegrationStates(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const mergedIntegrations = integrationsConfig.map((config) => {
    const dbIntegration = integrationStates.find(
      (item) => item.key === config.key,
    );

    return {
      ...dbIntegration,
      ...config,
    };
  });
  const getButtonLabel = (integration) => {
    if (
      integration.key === "csv_lead_import" ||
      integration.key === "crm_migration"
    ) {
      return "Import";
    }

    if (
      integration.key === "email_provider" ||
      integration.key === "api_access" ||
      integration.key === "zapier" ||
      integration.key === "google_calendar" ||
      integration.key === "google_drive"
    ) {
      return integration.status === "connected" ? "Connected" : "Configure";
    }

    if (integration.status === "active") {
      return "Active";
    }

    if (integration.status === "connected") {
      return "Connected";
    }

    return "Sync Now";
  };
  const handleIntegrationClick = async (integration) => {
    try {
      /*
       * WHATSAPP
       */
      if (integration.key === "whatsapp") {
        navigate("/dashboard/whatsapp");
        return;
      }

      /*
       * WEBHOOKS
       */
      if (integration.key === "webhooks") {
        navigate("/dashboard/integrations/webhooks");
        return;
      }

      /*
       * EMAIL PROVIDER
       */
      if (integration.key === "email_provider") {
        navigate("/dashboard/integrations/email");
        return;
      }

      if (integration.key === "zapier") {
        navigate("/dashboard/integrations/zapier");
        return;
      }

      if (integration.key === "google_calendar") {
        const res = await apiClient.request(
          "/integrations/google-calendar/auth-url",
        );
        window.location.href = res.url;
        return;
      }

      if (integration.key === "google_drive") {
        navigate("/dashboard/integrations/google-drive");
        return;
      }
      /*
       * PLACEHOLDER SYNC
       */
      setSyncingKey(integration.key);
      await apiClient.request(`/integrations/${integration.key}/sync`, {
        method: "POST",
      });

      await loadIntegrations();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingKey(null);
    }
  };
  const filteredIntegrations = mergedIntegrations.filter((integration) => {
    const matchesCategory =
      activeCategory === "All Apps" || integration.category === activeCategory;

    const matchesSearch =
      integration.title?.toLowerCase().includes(search.toLowerCase()) ||
      integration.description?.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const loadEmailStatus = async () => {
    try {
      const res = await apiClient.request("/integrations/email/config/status");

      return res;
    } catch (err) {
      console.error(err);
      return null;
    }
  };
  const loadWebhookStatus = async () => {
    try {
      const webhooks = await apiClient.request("/webhooks");

      return {
        isConfigured: webhooks?.length > 0,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  };
  const loadZapierStatus = async () => {
    try {
      const res = await apiClient.request("/integrations/zapier/config/status");

      return res;
    } catch (err) {
      console.error(err);

      return {
        isConfigured: false,
      };
    }
  };
  const loadGoogleCalendarStatus = async () => {
    try {
      return await apiClient.request(
        "/integrations/google-calendar/config/status",
      );
    } catch (err) {
      console.error(err);

      return {
        isConfigured: false,
      };
    }
  };
  const loadGoogleDriveStatus = async () => {
    try {
      const res = await apiClient.request(
        "/integrations/google-drive/config/status",
      );

      return res;
    } catch (err) {
      console.error(err);

      return {
        isConfigured: false,
      };
    }
  };

  return (
    <div className="apps-page">
      <div className="apps-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="sidebar-title">Apps & Integrations</h1>

            <p className="sidebar-description">
              Connect your CRM, apps, automations, calendars, APIs, and external
              services.
            </p>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`category-btn ${
                  activeCategory === category ? "active" : ""
                }`}
              >
                <span>{category}</span>

                <span className="arrow">›</span>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          {/* TOPBAR */}
          <div className="topbar">
            <div>
              <h2 className="page-title">{activeCategory}</h2>

              <p className="page-description">
                Connect and manage integrations for your real estate business.
              </p>
            </div>

            <div className="search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search integrations..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* GRID */}
          {loading ? (
            <div className="apps-loading">Loading integrations...</div>
          ) : (
            <div className="integrations-grid">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;

                return (
                  <div key={integration.key} className="integration-card">
                    <div
                      className="integration-icon"
                      style={{
                        backgroundColor: integration.iconBg,
                      }}
                    >
                      <Icon
                        size={24}
                        color={integration.iconColor}
                        strokeWidth={2.2}
                      />
                    </div>

                    <div className="integration-right">
                      <h3 className="integration-title">{integration.title}</h3>

                      <p className="integration-description">
                        {integration.description}
                      </p>

                      <button
                        className={`integration-btn status-${integration.status?.replaceAll("_", "-")}`}
                        onClick={() => handleIntegrationClick(integration)}
                        disabled={syncingKey === integration.key}
                      >
                        {syncingKey === integration.key
                          ? "Syncing..."
                          : getButtonLabel(integration)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
