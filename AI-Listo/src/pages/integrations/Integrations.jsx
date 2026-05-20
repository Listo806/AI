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
  Music2,
  CalendarCheck2,
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
  // {
  // key: "instagram",
  // title: "Instagram",
  // description: "Connect Instagram messaging, lead capture, and automation.",
  // icon: Camera,
  // iconColor: "#e1306c",
  // iconBg: "#fff0f6",
  // category: "Marketing",
  // //status: "Connected",
  // },
  {
    key: "appointment",
    title: "AI Appointment Booking",
    description:
      "Automatically schedule calls, meetings, and property tours with qualified leads.",
    icon: CalendarCheck2,
    iconColor: "#22c55e",
    iconBg: "#f0fdf4",
    category: "Communication",
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
    key: "crm_import",
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
    icon: Music2,
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
  const [apiKey, setApiKey] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revokingKey, setRevokingKey] = useState(false);
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
        instagramStatus,
        makeStatus,
        googleAdsStatus,
        apiAccessStatus,
        mlsStatus,
        tiktokStatus,
        appointmentStatus,
      ] = await Promise.all([
        apiClient.request("/integrations"),
        loadEmailStatus(),
        loadWebhookStatus(),
        loadZapierStatus(),
        loadGoogleCalendarStatus(),
        loadGoogleDriveStatus(),
        loadInstagramStatus(),
        loadMakeStatus(),
        loadGoogleAdsStatus(),
        loadApiAccessStatus(),
        loadMlsStatus(),
        loadTikTokStatus(),
        loadAppointmentStatus(),
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
        if (item.key === "instagram" && instagramStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "make" && makeStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "google_ads" && googleAdsStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "mls_idx_feed" && mlsStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "tiktok" && tiktokStatus?.isConfigured) {
          return {
            ...item,
            status: "connected",
          };
        }
        if (item.key === "appointment" && appointmentStatus?.isConfigured) {
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
      integration.key === "crm_import"
    ) {
      return "Import";
    }

    if (
      integration.key === "email_provider" ||
      integration.key === "api_access" ||
      integration.key === "zapier" ||
      integration.key === "google_calendar" ||
      integration.key === "google_drive" ||
      integration.key === "google_ads" ||
      integration.key === "mls_idx_feed" ||
      integration.key === "tiktok" ||
      integration.key === "appointment"
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
      if (integration.key === "instagram") {
        navigate("/dashboard/integrations/instagram");
        return;
      }
      if (integration.key === "crm_import") {
        navigate("/dashboard/integrations/crm-import");
        return;
      }
      if (integration.key === "csv_lead_import") {
        navigate("/dashboard/integrations/csv-leads");
        return;
      }
      if (integration.key === "property_feed_sync") {
        navigate("/dashboard/integrations/property-feed");
        return;
      }
      if (integration.key === "make") {
        navigate("/dashboard/integrations/make");
        return;
      }
      if (integration.key === "google_ads") {
        navigate("/dashboard/integrations/google-ads");
        return;
      }
      if (integration.key === "api_access") {
        navigate("/dashboard/integrations/api-access");
        return;
      }
      if (integration.key === "mls_idx_feed") {
        navigate("/dashboard/integrations/mls");
        return;
      }
      if (integration.key === "tiktok") {
        navigate("/dashboard/integrations/tiktok");
        return;
      }
      if (integration.key === "appointment") {
        navigate("/dashboard/integrations/ai-appointment");
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

  const loadInstagramStatus = async () => {
    try {
      return await apiClient.request("/integrations/instagram/config/status");
    } catch (err) {
      return {
        isConfigured: false,
      };
    }
  };
  const loadMakeStatus = async () => {
    try {
      return await apiClient.request("/integrations/make/config/status");
    } catch (err) {
      return {
        isConfigured: false,
      };
    }
  };
  const loadGoogleAdsStatus = async () => {
    try {
      return await apiClient.request("/integrations/google-ads/config/status");
    } catch (err) {
      return {
        isConfigured: false,
      };
    }
  };
  const loadApiAccessStatus = async () => {
    try {
      return await apiClient.request("/integrations/api-access/status");
    } catch (err) {
      return { isConfigured: false };
    }
  };
  const loadMlsStatus = async () => {
    try {
      return await apiClient.request("/integrations/mls/status");
    } catch (err) {
      return {
        isConfigured: false,
      };
    }
  };
  const loadTikTokStatus = async () => {
    try {
      return await apiClient.request("/integrations/tiktok/status");
    } catch (err) {
      return {
        isConfigured: false,
      };
    }
  };
  const loadAppointmentStatus = async () => {
    try {
      return await apiClient.request("/integrations/ai-appointment/status");
    } catch (err) {
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
          {loading ? (
            <div className="apps-loading">Loading integrations...</div>
          ) : (
            <div className="integrations-grid">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;

                return (
                  <div key={integration.key} className="integration-card">
                    <div className="integration-left">
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
                      <h3 className="integration-title">{integration.title}</h3>
                    </div>
                    <div className="integration-right">
                      <p className="integration-description">
                        {integration.description}
                      </p>
                    </div>
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
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
