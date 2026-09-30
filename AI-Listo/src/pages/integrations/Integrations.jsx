import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Cloud,
  Code2,
  Database,
  FileSpreadsheet,
  FolderSync,
  Headphones,
  Link2,
  Mail,
  MessageCircle,
  Search,
  Settings2,
  X,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { getPlanUsage } from "../../api/platformApi";
import "./AppsIntegrationsHub.css";

const CATEGORIES = [
  { label: "All", target: "integration-directory" },
  { label: "Communication", target: "communication" },
  { label: "Scheduling", target: "communication" },
  { label: "Marketing & Leads", target: "marketing" },
  { label: "E-Commerce", target: "ecommerce" },
  { label: "Customer Service", target: "customer-service" },
  { label: "Data & Developer", target: "data-developer" },
  { label: "Workspaces", target: "workspaces" },
];

const EXISTING = new Set([
  "zapier", "email_provider", "webhooks", "google_calendar", "whatsapp",
  "crm_import", "google_drive", "csv_lead_import", "make", "google_ads",
  "tiktok", "api_access", "property_feed_sync", "mls_idx_feed",
]);

const LOGO_OVERRIDES = {
  // Simple Icons no longer exposes the Microsoft Outlook brand slug reliably.
  microsoftoutlook: "https://img.icons8.com/color/96/microsoft-outlook-2019.png",
};
const logo = (slug) => LOGO_OVERRIDES[slug] || `https://cdn.simpleicons.org/${slug}`;

const app = (key, title, description, options = {}) => ({
  key,
  title,
  description,
  category: options.category || "",
  status: options.status || (EXISTING.has(key) ? "available" : "coming_soon"),
  logo: options.logo,
  icon: options.icon,
  action: options.action,
});

const communication = [
  app("whatsapp", "WhatsApp Business", "Sync conversations and let your AI agent engage leads.", { category: "Communication", logo: logo("whatsapp") }),
  app("gmail", "Gmail", "Send, receive, and track customer email inside Cortexa.", { category: "Communication", logo: logo("gmail"), status: "available", action: "email_provider" }),
  app("outlook", "Microsoft Outlook", "Sync Outlook email, contacts, and customer activity.", { category: "Communication", logo: logo("microsoftoutlook"), status: "available", action: "email_provider" }),
  app("custom_smtp", "Custom SMTP", "Connect another email provider securely through SMTP.", { category: "Communication", icon: Mail, status: "available", action: "email_provider" }),
  app("twilio", "Twilio", "Power business SMS and voice calls from one connection.", { category: "Communication", logo: logo("twilio"), status: "available", action: "twilio" }),
  app("google_calendar", "Google Calendar", "Sync appointments, availability, and meeting updates.", { category: "Scheduling", logo: logo("googlecalendar") }),
  app("outlook_calendar", "Outlook Calendar", "Keep Microsoft 365 calendars and Cortexa in sync.", { category: "Scheduling", logo: logo("microsoftoutlook") }),
  app("calendly", "Calendly", "Bring scheduled meetings and invitees into Cortexa.", { category: "Scheduling", logo: logo("calendly") }),
  app("zoom", "Zoom", "Create meetings and attach details to customer records.", { category: "Scheduling", logo: logo("zoom") }),
  app("google_meet", "Google Meet", "Launch and track Google Meet appointments.", { category: "Scheduling", logo: logo("googlemeet") }),
  app("slack", "Slack", "Send team alerts and customer activity to Slack.", { category: "Communication", logo: logo("slack") }),
  app("microsoft_teams", "Microsoft Teams", "Connect collaboration, meetings, and team alerts.", { category: "Communication", logo: logo("microsoftteams") }),
];

const marketing = [
  app("google_ads", "Google Ads", "Track campaigns, leads, and advertising performance inside Cortexa.", { category: "Marketing & Leads", logo: logo("googleads") }),
  app("tiktok", "TikTok Lead Sync", "Bring TikTok leads directly into your Cortexa pipeline.", { category: "Marketing & Leads", logo: logo("tiktok") }),
  app("mailchimp", "Mailchimp", "Sync contacts, audiences, and campaign engagement.", { category: "Marketing & Leads", logo: logo("mailchimp"), status: "available", action: "mailchimp" }),
  app("zapier", "Zapier", "Connect Cortexa with thousands of apps and automated workflows.", { category: "Automation", logo: logo("zapier") }),
  app("make", "Make", "Build advanced visual automations across your business tools.", { category: "Automation", logo: logo("make") }),
  app("meta_lead_ads", "Meta Lead Ads", "Capture Facebook and Instagram leads automatically.", { category: "Marketing & Leads", logo: logo("meta") }),
  app("linkedin_leads", "LinkedIn Lead Gen Forms", "Send professional-network leads directly into Cortexa.", { category: "Marketing & Leads", logo: logo("linkedin") }),
  app("n8n", "n8n", "Create flexible, developer-friendly workflow automations.", { category: "Automation", logo: logo("n8n") }),
];

const stores = [
  app("shopify", "Shopify", "Sync customers, products, orders, refunds, and subscriptions.", { category: "E-Commerce", logo: logo("shopify") }),
  app("woocommerce", "WooCommerce", "Bring WordPress store activity and customer data into Cortexa.", { category: "E-Commerce", logo: logo("woocommerce") }),
  app("bigcommerce", "BigCommerce", "Connect orders, products, customers, and store performance.", { category: "E-Commerce", logo: logo("bigcommerce") }),
];

const payments = [
  ["stripe", "Stripe", "Track payments, subscriptions, refunds, fees, and disputes.", "stripe"],
  ["paypal", "PayPal / Braintree", "Sync PayPal and Braintree transaction activity.", "paypal"],
  ["square", "Square", "Connect online and in-person payments with customer records.", "square"],
  ["authorize_net", "Authorize.net", "Link gateway transactions to customers and sales.", "auth0"],
  ["adyen", "Adyen", "Bring global payment activity and status updates into Cortexa.", "adyen"],
  ["nmi", "NMI", "Connect independent merchant accounts through the NMI gateway.", "n26"],
  ["checkout", "Checkout.com", "Track merchant payments, refunds, and transaction outcomes.", "checkoutdotcom"],
  ["mercado_pago", "Mercado Pago", "Sync Latin American payments and customer transactions.", "mercadopago"],
  ["dlocal", "dLocal", "Connect local payment methods across emerging markets.", "dlocal"],
  ["payu", "PayU", "Bring regional payment activity and order status into Cortexa.", "payu"],
  ["kushki", "Kushki", "Connect digital payments across Latin America.", "kubernetes"],
  ["quickbooks", "QuickBooks Online", "Sync customers, invoices, payments, and accounting records.", "quickbooks"],
  ["xero", "Xero", "Keep invoices, contacts, and payment data aligned.", "xero"],
].map(([key, title, description, slug]) => app(key, title, description, { category: "E-Commerce", logo: logo(slug) }));
payments.push(app("custom_payment", "Custom Payment Gateway", "Request a provider that is not currently listed.", { category: "E-Commerce", icon: Settings2, status: "request" }));

const affiliates = [
  ["impact", "Impact.com", "Attribute customers, sales, and commissions to partners.", "impact"],
  ["partnerstack", "PartnerStack", "Track partner referrals, recurring revenue, and commissions.", "partnerstack"],
  ["rewardful", "Rewardful", "Connect Stripe-based affiliate and recurring subscription data.", "rewardful"],
  ["firstpromoter", "FirstPromoter", "Track referrals, conversions, commissions, and payouts.", "firstpromoter"],
].map(([key, title, description, slug]) => app(key, title, description, { category: "E-Commerce", logo: logo(slug) }));

const fraud = [
  ["chargeflow", "Chargeflow", "Monitor disputes, evidence deadlines, and recovered revenue.", "chargebee"],
  ["chargebacks911", "Chargebacks911", "Connect chargeback prevention, disputes, and outcomes.", "c"],
  ["riskified", "Riskified", "Bring fraud decisions, alerts, and order risk into Cortexa.", "r"]
].map(([key, title, description, slug]) => app(key, title, description, { category: "E-Commerce", logo: logo(slug) }));

const customerService = [
  app("zendesk", "Zendesk", "Sync customer tickets, conversations, status, and priority.", { category: "Customer Service", logo: logo("zendesk") }),
  app("intercom", "Intercom", "Connect customer conversations, AI handoffs, and support activity.", { category: "Customer Service", logo: logo("intercom") }),
  app("freshdesk", "Freshdesk", "Bring tickets, contacts, assignments, and resolutions into Cortexa.", { category: "Customer Service", logo: logo("freshworks") }),
];
const callCenters = [
  ["aircall", "Aircall", "Log calls, recordings, contacts, and follow-up activity.", "aircall"],
  ["ringcentral", "RingCentral", "Connect business calls, messages, recordings, and teams.", "ringcentral"],
  ["dialpad", "Dialpad", "Sync calls, AI transcripts, summaries, and customer activity.", "dialpad"],
  ["justcall", "JustCall", "Bring sales calls, SMS, dispositions, and notes into Cortexa.", "justcall"],
  ["five9", "Five9", "Connect enterprise contact-center calls, agents, and outcomes.", "five9"],
  ["talkdesk", "Talkdesk", "Sync contact-center conversations, recordings, and performance.", "talkdesk"],
].map(([key, title, description, slug]) => app(key, title, description, { category: "Customer Service", logo: logo(slug) }));

const migration = [
  app("crm_import", "CRM Migration", "Choose a supported CRM and import its customer and pipeline data.", { category: "Data & Developer", icon: Database }),
  app("hubspot_migration", "HubSpot", "Import contacts, companies, deals, and pipeline data.", { category: "Data & Developer", logo: logo("hubspot") }),
  app("salesforce_migration", "Salesforce", "Transfer accounts, contacts, opportunities, and activities.", { category: "Data & Developer", logo: logo("salesforce") }),
  app("pipedrive_migration", "Pipedrive", "Bring contacts, deals, stages, notes, and activities.", { category: "Data & Developer", logo: logo("pipedrive") }),
  app("zoho_migration", "Zoho CRM", "Import leads, contacts, accounts, deals, and tasks.", { category: "Data & Developer", logo: logo("zoho") }),
  app("dynamics_migration", "Microsoft Dynamics 365", "Transfer customers, opportunities, and sales activity.", { category: "Data & Developer", logo: logo("dynamics365") }),
  app("close_migration", "Close", "Bring leads, contacts, opportunities, emails, and calls.", { category: "Data & Developer", logo: logo("close") }),
  app("highlevel_migration", "HighLevel", "Import contacts, opportunities, pipelines, and conversations.", { category: "Data & Developer", logo: logo("gohighlevel") }),
  app("clickup_migration", "ClickUp", "Transfer CRM records, tasks, lists, and custom fields.", { category: "Data & Developer", logo: logo("clickup") }),
  app("monday_migration", "monday CRM", "Bring contacts, deals, boards, and mapped columns.", { category: "Data & Developer", logo: logo("mondaydotcom") }),
  app("keap_migration", "Keap", "Import contacts, opportunities, tags, and automation data.", { category: "Data & Developer", logo: logo("keap") }),
  app("freshsales_migration", "Freshsales", "Transfer contacts, accounts, deals, and activities.", { category: "Data & Developer", logo: logo("freshworks") }),
  app("csv_lead_import", "CSV Import", "Upload leads and customers with guided field mapping.", { category: "Data & Developer", icon: FileSpreadsheet }),
];
const files = [
  app("google_drive", "Google Drive", "Attach contracts, documents, and customer files from Drive.", { category: "Data & Developer", logo: logo("googledrive") }),
  app("onedrive", "Microsoft OneDrive", "Connect Microsoft files and folders to customer records.", { category: "Data & Developer", logo: logo("microsoftonedrive") }),
  app("dropbox", "Dropbox", "Bring shared files and documents into Cortexa.", { category: "Data & Developer", logo: logo("dropbox") }),
  app("box", "Box", "Connect secure business content and shared files.", { category: "Data & Developer", logo: logo("box") }),
  app("docusign", "DocuSign", "Track agreements, signatures, and completed documents.", { category: "Data & Developer", logo: logo("docusign") }),
  app("pandadoc", "PandaDoc", "Connect proposals, quotes, contracts, and signatures.", { category: "Data & Developer", logo: logo("pandadoc") }),
];
const developer = [
  app("api_access", "API Access", "Connect external systems securely through the Cortexa API.", { category: "Data & Developer", icon: Code2 }),
  app("webhooks", "Webhooks", "Send and receive real-time events for custom automations.", { category: "Data & Developer", icon: Webhook }),
  app("api_keys", "API Keys", "Create and manage secure application credentials.", { category: "Data & Developer", icon: Link2 }),
  app("developer_docs", "Developer Documentation", "Explore authentication, endpoints, events, and guides.", { category: "Data & Developer", icon: FileSpreadsheet, status: "coming_soon" }),
  app("oauth_apps", "OAuth Apps", "Build authorized connections without sharing credentials.", { category: "Data & Developer", icon: ShieldCheck, status: "coming_soon" }),
  app("integration_logs", "Integration Logs", "Monitor sync activity, delivery status, and errors.", { category: "Data & Developer", icon: Workflow, status: "coming_soon" }),
];

const teamWorkspace = [
  app("jira", "Jira", "Sync projects, issues, tasks, and development workflows.", { category: "Workspaces", logo: logo("jira") }),
  app("asana", "Asana", "Connect projects, assignments, deadlines, and team activity.", { category: "Workspaces", logo: logo("asana") }),
  app("trello", "Trello", "Bring boards, cards, checklists, and task updates into Cortexa.", { category: "Workspaces", logo: logo("trello") }),
];

const realEstate = [
  app("mls_idx_feed", "MLS / IDX", "Import and synchronize property listings from approved feeds.", { category: "Workspaces", icon: ShoppingBag }),
  app("property_feed_sync", "Property Feed Sync", "Connect regional property data and listing updates.", { category: "Workspaces", icon: FolderSync }),
  app("property_portals", "Authorized Property Portals", "Connect approved property portals when access is available.", { category: "Workspaces", icon: Cloud, status: "request" }),
];
const insurance = [
  app("agencyzoom", "AgencyZoom", "Connect insurance leads, policies, activities, and retention workflows.", { category: "Workspaces", icon: Boxes }),
  app("applied_epic", "Applied Epic", "Sync agency customers, policies, activities, and account data.", { category: "Workspaces", icon: Database }),
  app("ezlynx", "EZLynx", "Bring insurance leads, applicants, policies, and customer activity.", { category: "Workspaces", icon: Workflow }),
];
const finance = [
  app("plaid", "Plaid", "Connect approved account and transaction data securely.", { category: "Workspaces", logo: logo("plaid") }),
  app("mx", "MX", "Bring permissioned financial account and transaction data into Cortexa.", { category: "Workspaces", logo: logo("mx") }),
  app("yodlee", "Envestnet Yodlee", "Connect approved financial data and account insights.", { category: "Workspaces", logo: logo("yodlee") }),
];

const ALL_APPS = [...communication, ...marketing, ...stores, ...payments, ...affiliates, ...fraud, ...customerService, ...callCenters, ...migration, ...files, ...developer, ...teamWorkspace, ...realEstate, ...insurance, ...finance];

const ROUTES = {
  whatsapp: "/dashboard/whatsapp",
  email_provider: "/dashboard/integrations/email",
  zapier: "/dashboard/integrations/zapier",
  google_drive: "/dashboard/integrations/google-drive",
  crm_import: "/dashboard/integrations/crm-import",
  csv_lead_import: "/dashboard/integrations/csv-leads",
  property_feed_sync: "/dashboard/integrations/property-feed",
  make: "/dashboard/integrations/make",
  google_ads: "/dashboard/integrations/google-ads",
  api_access: "/dashboard/integrations/api-access",
  mls_idx_feed: "/dashboard/integrations/mls",
  tiktok: "/dashboard/integrations/tiktok",
  webhooks: "/dashboard/integrations/webhooks",
};

function IntegrationLogo({ item }) {
  const [failed, setFailed] = useState(false);
  const Icon = item.icon || Sparkles;
  if (item.logo && !failed) return <img src={item.logo} alt="" onError={() => setFailed(true)} />;
  return <Icon size={32} strokeWidth={1.8} />;
}

function StatusText({ status, onRequest, t }) {
  const labels = { connected: t("integrations.directory.status.connected"), active: t("integrations.directory.status.connected"), available: t("integrations.directory.status.available") };
  if (status === "coming_soon" || status === "request") {
    return <button type="button" className="directory-request-btn" onClick={(e) => { e.stopPropagation(); onRequest?.(); }}>{t("integrations.directory.actions.request")}</button>;
  }
  return <span className={`directory-status is-${status || "available"}`}>{labels[status] || "Available"}</span>;
}

function DirectoryCard({ item, onAction, onRequest, t }) {
  const unavailable = item.status === "coming_soon" || item.status === "request";
  const clickable = !unavailable;
  return (
    <article className={`directory-card ${clickable ? "is-clickable" : ""}`} onClick={() => clickable && onAction(item)}>
      <div className="directory-logo"><IntegrationLogo item={item} /></div>
      <div className="directory-card-copy">
        <div className="directory-card-heading">
          <h4>{item.title}</h4>
          {clickable && <ArrowRight size={18} />}
        </div>
        <p>{t(`integrations.directory.apps.${item.key}.description`, { defaultValue: item.description })}</p>
        <span className="directory-category">{t(`integrations.directory.categories.${item.category}`, { defaultValue: item.category })}</span>
        <StatusText status={item.status} onRequest={() => onRequest(item)} t={t} />
      </div>
    </article>
  );
}

function CardGrid({ items, onAction, onRequest, t, className = "" }) {
  return <div className={`directory-grid ${className}`.trim()}>{items.map((item) => <DirectoryCard key={item.key} item={item} onAction={onAction} onRequest={onRequest} t={t} />)}</div>;
}

function SectionTitle({ eyebrow, title, description }) {
  return <header className="directory-section-title">{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</header>;
}

export default function AppsIntegrationsHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [states, setStates] = useState({});
  const [usage, setUsage] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [requestContext, setRequestContext] = useState({ name: "", email: "", workspace: "" });
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      apiClient.request("/integrations"),
      apiClient.request("/integrations/email/config/status"),
      apiClient.request("/webhooks"),
      apiClient.request("/integrations/zapier/config/status"),
      apiClient.request("/integrations/google-calendar/config/status"),
      apiClient.request("/integrations/google-drive/config/status"),
      apiClient.request("/integrations/make/config/status"),
      apiClient.request("/integrations/google-ads/config/status"),
      apiClient.request("/integrations/api-access/status"),
      apiClient.request("/integrations/mls/status"),
      apiClient.request("/integrations/tiktok/status"),
    ]).then((results) => {
      if (!alive) return;
      const next = {};
      const db = results[0].status === "fulfilled" ? results[0].value?.integrations || [] : [];
      db.forEach((row) => { if (row?.key) next[row.key] = row.status; });
      const configuredKeys = ["email_provider", "webhooks", "zapier", "google_calendar", "google_drive", "make", "google_ads", "api_access", "mls_idx_feed", "tiktok"];
      results.slice(1).forEach((result, i) => {
        if (result.status !== "fulfilled") return;
        const value = result.value;
        const configured = Array.isArray(value) ? value.length > 0 : Boolean(value?.isConfigured || value?.configured || value?.active || value?.hasKey);
        if (configured) next[configuredKeys[i]] = "connected";
      });
      setStates(next);
    });
    getPlanUsage().then((data) => alive && setUsage(data)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const hydrated = useMemo(() => {
    const seen = new Set();
    return ALL_APPS.map((item) => {
      if (seen.has(item.key)) return null;
      seen.add(item.key);
      if (!EXISTING.has(item.key)) return item;
      const live = states[item.key];
      return { ...item, status: live === "connected" || live === "active" ? "connected" : "available" };
    }).filter(Boolean);
  }, [states]);

  const byKeys = (items) => items.map((original) => hydrated.find((x) => x.key === original.key) || original);
  const query = search.trim().toLowerCase();
  const searchResults = query ? hydrated.filter((item) => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query)) : [];
  const connectedCount = hydrated.filter((item) => item.status === "connected").length;

  const requestIntegration = async (item = null) => {
    setRequestModal(item || { key: "custom", title: t("integrations.directory.request.customIntegration") });
    setRequestError("");
    setRequestSuccess("");
    try {
      const res = await apiClient.request("/integrations/request-context");
      setRequestContext(res?.customer || { name: "", email: "", workspace: "" });
    } catch (error) {
      setRequestError(error?.message || t("integrations.directory.request.loadAccountError"));
    }
  };

  const closeRequestModal = () => {
    if (requestLoading) return;
    setRequestModal(null);
    setRequestMessage("");
    setRequestError("");
    setRequestSuccess("");
  };

  const submitIntegrationRequest = async (e) => {
    e.preventDefault();
    if (!requestModal || !requestMessage.trim()) return;
    setRequestLoading(true);
    setRequestError("");
    try {
      const res = await apiClient.request("/integrations/request", {
        method: "POST",
        body: JSON.stringify({
          integrationKey: requestModal.key,
          integrationName: requestModal.title,
          message: requestMessage.trim(),
        }),
      });
      setRequestSuccess(t("integrations.directory.request.success"));
    } catch (error) {
      // Deliberately keep requestMessage unchanged so the customer can retry.
      setRequestError(error?.message || t("integrations.directory.request.submitError"));
    } finally {
      setRequestLoading(false);
    }
  };

  const onAction = async (item) => {
    if (item.status === "request" || item.status === "coming_soon") return requestIntegration(item);
    const actionKey = item.action || item.key;
    if (actionKey === "google_calendar") {
      try {
        const res = await apiClient.request("/integrations/google-calendar/auth-url");
        if (res?.url) window.location.href = res.url;
      } catch (error) { console.error(error); }
      return;
    }
    if (ROUTES[actionKey]) return navigate(ROUTES[actionKey]);
    // Twilio/Mailchimp are intentionally not pointed at guessed routes. Their cards
    // remain truthful directory entries until their existing route is supplied here.
  };

  const scrollCategory = (target) => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="integrations-directory" id="integration-directory">
      <section className="directory-hero">
        <span className="directory-eyebrow">{t("integrations.directory.hero.eyebrow")}</span>
        <h1>{t("integrations.directory.hero.titleLine1")}<br />{t("integrations.directory.hero.titleLine2")}</h1>
        <p>{t("integrations.directory.hero.description")}</p>
        <div className="directory-search"><Search size={23} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("integrations.directory.hero.searchPlaceholder")} /></div>
        <div className="directory-meta"><strong><Boxes size={20} /> {connectedCount} {t(connectedCount === 1 ? "integrations.directory.hero.connectedApp" : "integrations.directory.hero.connectedApps")}</strong><i /><button type="button" onClick={requestIntegration}>{t("integrations.directory.actions.requestAnIntegration")} <ArrowRight size={16} /></button></div>
        <div className="logo-orbit" aria-hidden="true">
          <svg className="logo-orbit-lines" viewBox="0 0 1200 300" preserveAspectRatio="none">
            <path className="orbit-path orbit-path-top" d="M8 18 C150 62 330 126 600 132 C870 126 1050 62 1192 18" />
            <path className="orbit-path orbit-path-bottom" d="M8 126 C150 170 330 234 600 240 C870 234 1050 170 1192 126" />
            {[
              [145,58],[285,96],[430,121],[600,132],[770,121],[915,96],[1055,58],
              [285,202],[915,202]
            ].map(([cx,cy], index) => <circle key={index} className="orbit-node" cx={cx} cy={cy} r="5" />)}
          </svg>
          {["whatsapp", "gmail", "microsoftoutlook", "googlecalendar", "googleads", "tiktok", "mailchimp", "zapier", "make", "shopify", "googledrive"].map((slug) => <span key={slug}><img src={logo(slug)} alt="" /></span>)}
        </div>
        <div className="directory-benefits"><div><Zap /><p><b>{t("integrations.directory.benefits.saveTime")}</b><small>{t("integrations.directory.benefits.saveTimeDesc")}</small></p></div><div><Link2 /><p><b>{t("integrations.directory.benefits.workSmarter")}</b><small>{t("integrations.directory.benefits.workSmarterDesc")}</small></p></div><div><Users /><p><b>{t("integrations.directory.benefits.growFaster")}</b><small>{t("integrations.directory.benefits.growFasterDesc")}</small></p></div></div>
      </section>

      <section className="directory-explore">
        <SectionTitle title={t("integrations.directory.explore.title")} description={t("integrations.directory.explore.description")} />
        <div className="directory-filters">{CATEGORIES.map((cat) => <button key={cat.label} className={cat.label === "All" ? "active" : ""} onClick={() => scrollCategory(cat.target)}>{t(`integrations.directory.filters.${cat.label}`, { defaultValue: cat.label })}</button>)}</div>
      </section>

      {query ? (
        <section className="directory-section search-results"><SectionTitle eyebrow={t("integrations.directory.search.eyebrow")} title={t("integrations.directory.search.resultsFor", { search })} description={t(searchResults.length === 1 ? "integrations.directory.search.oneFound" : "integrations.directory.search.manyFound", { count: searchResults.length })} />{searchResults.length ? <CardGrid items={searchResults} onAction={onAction} onRequest={requestIntegration} t={t} /> : <div className="directory-empty">{t("integrations.directory.search.empty")}</div>}</section>
      ) : <>
        <section className="directory-section" id="communication"><SectionTitle title={t("integrations.directory.sections.communication.title")} description={t("integrations.directory.sections.communication.description")} /><CardGrid items={byKeys(communication)} onAction={onAction} onRequest={requestIntegration} t={t} /></section>
        <section className="directory-section" id="marketing"><SectionTitle title={t("integrations.directory.sections.marketing.title")} description={t("integrations.directory.sections.marketing.description")} /><CardGrid items={byKeys(marketing)} onAction={onAction} onRequest={requestIntegration} t={t} className="marketing-grid" /></section>
        <section className="directory-section" id="ecommerce"><SectionTitle title={t("integrations.directory.sections.ecommerce.title")} description={t("integrations.directory.sections.ecommerce.description")} /><h3 className="directory-group-title">{t("integrations.directory.groups.stores")}</h3><CardGrid items={byKeys(stores)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.payments")}</h3><CardGrid items={byKeys(payments)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.affiliate")}</h3><CardGrid items={byKeys(affiliates)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.fraud")}</h3><CardGrid items={byKeys(fraud)} onAction={onAction} onRequest={requestIntegration} t={t} /></section>
        <section className="directory-section" id="customer-service"><SectionTitle title={t("integrations.directory.sections.customerService.title")} description={t("integrations.directory.sections.customerService.description")} /><h3 className="directory-group-title">{t("integrations.directory.groups.customerService")}</h3><CardGrid items={byKeys(customerService)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.callCenters")}</h3><CardGrid items={byKeys(callCenters)} onAction={onAction} onRequest={requestIntegration} t={t} /></section>
        <section className="directory-section" id="data-developer"><SectionTitle title={t("integrations.directory.sections.data.title")} description={t("integrations.directory.sections.data.description")} /><h3 className="directory-group-title">{t("integrations.directory.groups.crmMigration")}</h3><CardGrid items={byKeys(migration)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.files")}</h3><CardGrid items={byKeys(files)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.developer")}</h3><CardGrid items={byKeys(developer)} onAction={onAction} onRequest={requestIntegration} t={t} /></section>
        <section className="directory-section" id="workspaces"><SectionTitle title={t("integrations.directory.sections.workspaces.title")} description={t("integrations.directory.sections.workspaces.description")} /><h3 className="directory-group-title">{t("integrations.directory.groups.teamWorkspace")}</h3><CardGrid items={byKeys(teamWorkspace)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.realEstate")}</h3><CardGrid items={byKeys(realEstate)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.insurance")}</h3><CardGrid items={byKeys(insurance)} onAction={onAction} onRequest={requestIntegration} t={t} /><h3 className="directory-group-title">{t("integrations.directory.groups.financialServices")}</h3><CardGrid items={byKeys(finance)} onAction={onAction} onRequest={requestIntegration} t={t} /></section>
      </>}

      <section className="directory-final-cta" id="integration-final-cta"><span>{t("integrations.directory.cta.eyebrow")}</span><h2>{t("integrations.directory.cta.title")}</h2><p>{t("integrations.directory.cta.description")}</p><div><button type="button" onClick={() => requestIntegration()}>{t("integrations.directory.actions.request")}</button><button type="button" onClick={() => navigate("/dashboard/integrations/api-access")}>{t("integrations.directory.actions.buildApi")}</button><button type="button" className="outline" onClick={() => navigate("/dashboard/integrations/api-access")}>{t("integrations.directory.actions.developerDocs")}</button></div></section>
      {requestModal && <div className="integration-request-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closeRequestModal(); }}>
        <div className="integration-request-modal" role="dialog" aria-modal="true" aria-labelledby="integration-request-title">
          <button type="button" className="integration-request-close" onClick={closeRequestModal} aria-label={t("integrations.directory.request.close")}><X size={20} /></button>
          <span className="integration-request-kicker">{t("integrations.directory.request.kicker")}</span>
          <h3 id="integration-request-title">{t("integrations.directory.request.title", { integration: requestModal.title })}</h3>
          <p className="integration-request-intro">{t("integrations.directory.request.intro")}</p>
          {requestSuccess ? <div className="integration-request-success">{requestSuccess}</div> : <form onSubmit={submitIntegrationRequest}>
            <div className="integration-request-details">
              <label><span>{t("integrations.directory.request.integration")}</span><input value={requestModal.title} readOnly /></label>
              <label><span>{t("integrations.directory.request.name")}</span><input value={requestContext.name || ""} readOnly /></label>
              <label><span>{t("integrations.directory.request.email")}</span><input value={requestContext.email || ""} readOnly /></label>
              <label><span>{t("integrations.directory.request.workspace")}</span><input value={requestContext.workspace || ""} readOnly /></label>
            </div>
            <label className="integration-request-message"><span>{t("integrations.directory.request.messageLabel")}</span><textarea rows="4" maxLength="3000" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder={t("integrations.directory.request.messagePlaceholder")} required /></label>
            {requestError && <div className="integration-request-error">{requestError}</div>}
            <div className="integration-request-actions"><button type="button" className="secondary" onClick={closeRequestModal}>{t("integrations.directory.request.cancel")}</button><button type="submit" disabled={requestLoading || !requestMessage.trim()}>{requestLoading ? t("integrations.directory.request.sending") : t("integrations.directory.request.send")}</button></div>
          </form>}
        </div>
      </div>}

      {usage?.isFree && <div className="directory-plan-note"><b>{t("integrations.directory.plan.freePlan")}</b> {usage.usage?.integrationsConnected ?? 0} {t("integrations.directory.plan.of")} {usage.limits?.integrations ?? 1} {t("integrations.directory.plan.connectedUsed")}. <button onClick={() => navigate("/pricing")}>{t("integrations.directory.plan.viewPlans")}</button></div>}
      <footer className="directory-footer"><strong>CORTEXA</strong><div><span>{t("integrations.directory.footer.product")}</span><a href="#integration-directory">{t("integrations.directory.footer.integrations")}</a><a href="#workspaces">{t("integrations.directory.footer.workspaces")}</a></div><div><span>{t("integrations.directory.footer.resources")}</span><button onClick={() => navigate("/dashboard/integrations/api-access")}>{t("integrations.directory.footer.developerDocs")}</button><button onClick={requestIntegration}>{t("integrations.directory.footer.contactSupport")}</button></div><div><span>{t("integrations.directory.footer.legal")}</span><button type="button">{t("integrations.directory.footer.privacy")}</button><button type="button">{t("integrations.directory.footer.terms")}</button></div><small>{t("integrations.directory.footer.copyright")}</small></footer>
    </div>
  );
}
