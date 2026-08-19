import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Settings2,
  Download,
  Upload,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  FileText,
  ClipboardList,
  PackageCheck,
  BadgeDollarSign,
  ShoppingCart,
  Percent,
  RotateCcw,
  Table2,
  List,
  CalendarDays,
  ChevronDown,
  Bot,
  Zap,
  Mail,
  Handshake,
  UserPlus,
  Headphones,
  BarChart3,
  UsersRound,
  CircleHelp,
  Activity,
  Filter,
} from "lucide-react";
import "./SalesWorkspace.css";
import salesApi from "../../api/salesApi";
import QuoteModal from "./QuoteModal";
import ProposalsSection from "./ProposalsSection";
import OrdersSection from "./OrdersSection";
import ContractsSection from "./ContractsSection";
import ReturnsSection from "./ReturnsSection";
import InvoicesSection from "./InvoicesSection";
import CommissionsSection from "./CommissionsSection";
import CustomersSection from "./CustomersSection";
import SalesOverviewSection from "./SalesOverviewSection";
import { relativeTime } from "./salesFormat";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// KPI card config. Values come from the live /sales/stats endpoint. In this first
// slice only Quotes exist, so Open Quotes is real and the rest report 0 until
// their tabs are wired — no invented numbers, and no fake "vs last month" trend
// (comparisons appear only once real history exists).
const STAT_CONFIG = [
  { key: "openQuotes", labelKey: "kpi.openQuotes", nounKey: "kpi.quotes", Icon: FileText, tone: "blue" },
  { key: "openProposals", labelKey: "kpi.openProposals", nounKey: "kpi.proposals", Icon: ClipboardList, tone: "purple" },
  { key: "ordersThisMonth", labelKey: "kpi.ordersThisMonth", nounKey: "kpi.orders", Icon: PackageCheck, tone: "green" },
  { key: "outstandingInvoices", labelKey: "kpi.outstandingInvoices", nounKey: "kpi.invoices", Icon: BadgeDollarSign, tone: "amber" },
  { key: "commissionsDue", labelKey: "kpi.commissionsDue", Icon: ShoppingCart, tone: "cyan" },
  { key: "conversionRate", labelKey: "kpi.conversionRate", Icon: Percent, tone: "pink" },
];

function money(value, locale = "en-US") {
  const n = Number(value) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(value, locale = "en-US") {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function daysLeftNote(validUntil, t) {
  if (!validUntil) return { text: "", danger: false };
  const d = new Date(validUntil);
  if (isNaN(d.getTime())) return { text: "", danger: false };
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);

  if (diff < 0) {
    return { text: t("salesWorkspace.validity.expired"), danger: true };
  }

  if (diff === 0) {
    return { text: t("salesWorkspace.validity.daysLeft", { count: 0 }), danger: true };
  }

  return {
    text: t("salesWorkspace.validity.daysLeft", { count: diff }),
    danger: false,
  };
}

function initials(name) {
  return String(name || "")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Build a KPI card's value + sub-line from the live stats payload.
function statCard(key, stats, t, locale) {
  const s = stats?.[key];
  if (!s) return { value: "—", sub: "" };

  const config = STAT_CONFIG.find((item) => item.key === key);

  switch (key) {
    case "openQuotes":
    case "openProposals":
    case "ordersThisMonth":
    case "outstandingInvoices":
      return {
        value: money(s.value, locale),
        sub: t("salesWorkspace.kpi.countLabel", {
          count: Number(s.count || 0).toLocaleString(locale),
          noun: t(`salesWorkspace.${config.nounKey}`),
        }),
      };
    case "commissionsDue":
      return {
        value: money(s.amount, locale),
        sub: t("salesWorkspace.kpi.pendingCount", { count: s.count || 0 }),
      };
    case "conversionRate":
      return {
        value: `${s.percent || 0}%`,
        sub: t("salesWorkspace.kpi.acceptedVsClosed"),
      };
    default:
      return { value: "—", sub: "" };
  }
}

const TABS = [
  { key: "Overview", labelKey: "tabs.overview" },
  { key: "Customers", labelKey: "tabs.customers" },
  { key: "Quotes", labelKey: "tabs.quotes" },
  { key: "Proposals", labelKey: "tabs.proposals" },
  { key: "Orders", labelKey: "tabs.orders" },
  { key: "Contracts", labelKey: "tabs.contracts" },
  { key: "Invoices", labelKey: "tabs.invoices" },
  { key: "Commissions", labelKey: "tabs.commissions" },
  { key: "Returns", labelKey: "tabs.returns" },
];

export default function SalesWorkspace() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale =
    i18n.language?.startsWith("es")
      ? "es-ES"
      : i18n.language?.startsWith("pt")
        ? "pt-BR"
        : "en-US";
  const [activeTab, setActiveTab] = useState("Quotes");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityRows, setActivityRows] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDetails, setActivityDetails] = useState("");
  const [activitySaving, setActivitySaving] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalQuoteId, setModalQuoteId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  // Debounce the section search into server-side queries.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  // Overview KPIs + summary cards (keep last-good on transient error).
  useEffect(() => {
    let alive = true;
    salesApi
      .getStats()
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  // Live quotes for the Quotes tab.
  useEffect(() => {
    if (activeTab !== "Quotes") return undefined;
    let alive = true;
    setLoading(true);
    salesApi
      .listQuotes({ search: debouncedSearch || undefined, page, limit })
      .then((res) => {
        if (!alive) return;
        setQuotes(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(t("salesWorkspace.errors.loadQuotes"));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeTab, debouncedSearch, page, limit, refreshTick, t]);

  const openModal = (mode, id = null) => {
    setModalMode(mode);
    setModalQuoteId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);
  const convertToProposal = async (id) => {
    try {
      await salesApi.convertQuoteToProposal(id);
      handleSaved();
      // eslint-disable-next-line no-alert
      window.alert(t("salesWorkspace.messages.proposalCreated"));
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e?.message || t("salesWorkspace.errors.createProposal"));
    }
  };

  const goToSalesTab = (tab) => {
    setActiveTab(tab);
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAllSalesActivity = async () => {
    setActivityModalOpen(true);
    setActivityLoading(true);
    try {
      const res = await salesApi.listActivity({ limit: 50 });
      setActivityRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setActivityRows([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const saveSalesActivity = async () => {
    const title = activityTitle.trim();
    if (!title || activitySaving) return;

    setActivitySaving(true);
    try {
      await salesApi.logActivity({
        title,
        details: activityDetails.trim() || undefined,
        type: "note",
      });
      setActivityTitle("");
      setActivityDetails("");
      setActivityLogOpen(false);
      handleSaved();
      window.alert(t("salesWorkspace.more.activitySaved"));
    } catch (e) {
      window.alert(e?.message || t("salesWorkspace.more.activitySaveFailed"));
    } finally {
      setActivitySaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pipeline = stats?.pipeline || [];
  const activity = stats?.recentActivity || [];
  const reps = stats?.topReps || [];
  const pipelineTotal = pipeline.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  const openDeals = pipeline.reduce(
    (sum, item) => sum + (Number(item.dealCount) || 0),
    0,
  );
  const expectedRevenue = Number(
    stats?.expectedRevenue?.value ??
      stats?.expectedRevenue ??
      stats?.revenue?.expected ??
      0,
  );

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const statusLabel = (status) => {
    const key = String(status || "").trim().toLowerCase();
    const known = {
      pending: "pending",
      sent: "sent",
      approved: "approved",
      draft: "draft",
      viewed: "viewed",
      accepted: "accepted",
      rejected: "rejected",
      expired: "expired",
    };

    return known[key]
      ? t(`salesWorkspace.status.${known[key]}`)
      : status || "-";
  };

  return (
    <div className="sales-ws">
      <div className="sales-ws-header">
        <div>
          <h1>{t("salesWorkspace.title")}</h1>
          <p>{t("salesWorkspace.subtitle")}</p>
        </div>

        <div className="sales-ws-header-actions">
          <label className="sales-ws-global-search">
            <Search size={15} />
            <input placeholder={t("salesWorkspace.searchAnything")} />
            <kbd>⌘ K</kbd>
          </label>
          <button className="sales-ws-quick-create" onClick={() => openModal("create")}>
            <Plus size={15} />
            {t("salesWorkspace.quickCreate")}
          </button>
        </div>
      </div>

      <div className="sales-ws-stat-grid">
        {STAT_CONFIG.map(({ key, labelKey, Icon, tone }) => {
          const { value, sub } = statCard(key, stats, t, locale);
          return (
            <div className="sales-ws-stat-card" key={key}>
              <div className={`sales-ws-stat-icon ${tone}`}>
                <Icon size={18} />
              </div>
              <span>{t(`salesWorkspace.${labelKey}`)}</span>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          );
        })}
      </div>

      <nav className="sales-ws-tabs sales-ws-tabs-desktop">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {t(`salesWorkspace.${tab.labelKey}`)}
          </button>
        ))}
      </nav>

      <div className="sales-ws-tabs-mobile-wrap">
        <nav className="sales-ws-tabs sales-ws-tabs-mobile">
          {TABS.slice(0, 6).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileMoreOpen(false);
              }}
            >
              {t(`salesWorkspace.${tab.labelKey}`)}
            </button>
          ))}

          <button
            type="button"
            className={
              mobileMoreOpen || TABS.slice(6).some((tab) => tab.key === activeTab)
                ? "more-open"
                : ""
            }
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((open) => !open)}
          >
            {t("salesWorkspace.tabs.more")}
            <ChevronDown
              size={15}
              className={mobileMoreOpen ? "rotate" : ""}
            />
          </button>
        </nav>

        {mobileMoreOpen && (
          <div className="sales-ws-tabs-mobile-more-menu">
            {TABS.slice(6).map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMobileMoreOpen(false);
                }}
              >
                {t(`salesWorkspace.${tab.labelKey}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "Overview" ? (
        <SalesOverviewSection stats={stats} onGoTo={setActiveTab} />
      ) : activeTab === "Customers" ? (
        <CustomersSection />
      ) : activeTab === "Quotes" ? (
        <section className="sales-ws-quotes">
          <div className="sales-ws-section-head">
            <div>
              <h2>{t("salesWorkspace.quotes.title")}</h2>
              <p>{t("salesWorkspace.quotes.subtitle")}</p>
            </div>

            <div className="sales-ws-section-actions">
              <button>
                <Upload size={14} /> {t("salesWorkspace.actions.import")}
              </button>
              <button>
                <Download size={14} /> {t("salesWorkspace.actions.export")}
              </button>
              <button className="btn-filter">
                <Settings2 size={14} />
              </button>
              <button className="primary" onClick={() => openModal("create")}>
                <Plus size={14} /> {t("salesWorkspace.actions.newQuote")}
              </button>
            </div>
          </div>

          <div className="sales-ws-filters">
            <label>
              <Search size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("salesWorkspace.quotes.searchPlaceholder")}
              />
            </label>

            {[
              ["status", t("salesWorkspace.filters.status")],
              ["owner", t("salesWorkspace.filters.owner")],
              ["dateRange", t("salesWorkspace.filters.dateRange")],
              ["pipeline", t("salesWorkspace.filters.pipeline")],
              ["more", t("salesWorkspace.filters.more")],
            ].map(([key, label]) => (
              <button key={key}>
                {label}
                <ChevronDown size={14} />
              </button>
            ))}

            <button className="reset" onClick={() => setSearch("")}>
              <RotateCcw size={13} /> {t("salesWorkspace.filters.reset")}
            </button>

            <span>{t("salesWorkspace.filters.view")}</span>
            <button>
              <Table2 size={13} /> {t("salesWorkspace.filters.table")}
            </button>
            <button>
              <List size={13} />
            </button>
            <button>
              <CalendarDays size={13} />
            </button>
          </div>


          <div className="sales-ws-mobile-toolbar">
            <button className="primary" onClick={() => openModal("create")}>
              <Plus size={20} />
              {t("salesWorkspace.actions.newQuote")}
            </button>
            <button>
              <Upload size={18} />
              {t("salesWorkspace.actions.importExport")}
            </button>
          </div>

          <div className="sales-ws-mobile-search-row">
            <label>
              <Search size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("salesWorkspace.quotes.searchPlaceholder")}
              />
            </label>
            <button type="button">
              <Filter size={20} />
              {t("salesWorkspace.filters.filters")}
            </button>
          </div>

          <div className="sales-ws-mobile-quote-list">
            {loading ? (
              <div className="sales-ws-mobile-empty">{t("common.loading")}</div>
            ) : error ? (
              <div className="sales-ws-mobile-empty">{error}</div>
            ) : quotes.length === 0 ? (
              <div className="sales-ws-mobile-empty">
                {t("salesWorkspace.quotes.empty")}
              </div>
            ) : (
              quotes.map((quote) => {
                const status = String(quote.status || "").toLowerCase();
                const tone =
                  status === "sent" || status === "accepted"
                    ? "green"
                    : status === "approved" || status === "viewed"
                      ? "amber"
                      : "blue";

                return (
                  <article
                    className={`sales-ws-mobile-quote-card ${tone}`}
                    key={`mobile-${quote.id}`}
                  >
                    <div className="sales-ws-mobile-quote-main">
                      <div className="sales-ws-mobile-quote-icon">
                        <FileText />
                      </div>

                      <div className="sales-ws-mobile-quote-identity">
                        <strong>
                          {quote.quoteNumber ||
                            t("salesWorkspace.quotes.unnumbered")}
                        </strong>
                        <span>{quote.customerName || "—"}</span>
                        {(quote.dealName || quote.segment) && (
                          <em>{quote.dealName || quote.segment}</em>
                        )}
                      </div>

                      <div className="sales-ws-mobile-quote-value">
                        <strong>
                          {quote.value != null
                            ? money(quote.value, locale)
                            : "—"}
                        </strong>
                        <span>{t("salesWorkspace.table.value")}</span>
                      </div>

                      <div className="sales-ws-mobile-quote-status">
                        <strong className={`status-pill ${status || "pending"}`}>
                          {statusLabel(quote.status)}
                        </strong>
                        <span>{t("salesWorkspace.table.status")}</span>
                      </div>

                      <div className="sales-ws-mobile-quote-valid">
                        <strong>{formatDate(quote.validUntil, locale)}</strong>
                        <span>{t("salesWorkspace.table.validUntil")}</span>
                      </div>
                    </div>

                    <div className="sales-ws-mobile-quote-meta">
                      <div>
                        <strong>{quote.ownerName || "—"}</strong>
                        <span>{t("salesWorkspace.table.owner")}</span>
                      </div>
                      <div>
                        <strong>{formatDate(quote.createdAt, locale)}</strong>
                        <span>{t("salesWorkspace.table.created")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModal("view", quote.id)}
                        aria-label={t("salesWorkspace.tabs.more")}
                      >
                        <MoreVertical />
                      </button>
                    </div>

                    <div className="sales-ws-mobile-quote-actions">
                      <button
                        type="button"
                        onClick={() => openModal("view", quote.id)}
                      >
                        <Eye />
                        {t("common.view")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("edit", quote.id)}
                      >
                        <Pencil />
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal("view", quote.id)}
                      >
                        {t("salesWorkspace.tabs.more")}
                        <MoreVertical />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="sales-ws-table-wrap">
            <table className="sales-ws-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>{t("salesWorkspace.table.quoteNumber")}</th>
                  <th>{t("salesWorkspace.table.customer")}</th>
                  <th>{t("salesWorkspace.table.contact")}</th>
                  <th>{t("salesWorkspace.table.pipelineDeal")}</th>
                  <th>{t("salesWorkspace.table.value")}</th>
                  <th>{t("salesWorkspace.table.status")}</th>
                  <th>{t("salesWorkspace.table.validUntil")}</th>
                  <th>{t("salesWorkspace.table.owner")}</th>
                  <th>{t("salesWorkspace.table.created")}</th>
                  <th>{t("salesWorkspace.table.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="sales-ws-empty-row">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={11} className="sales-ws-empty-row">
                      {error}
                    </td>
                  </tr>
                ) : quotes.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="sales-ws-empty-row">
                      {t("salesWorkspace.quotes.empty")}
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => {
                    const valid = daysLeftNote(quote.validUntil, t);
                    return (
                      <tr key={quote.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td className="quote-id">{quote.quoteNumber || "-"}</td>

                        <td>
                          <div className="sales-ws-customer">
                            <strong>{quote.customerName || "-"}</strong>
                            {quote.segment && <span>{quote.segment}</span>}
                          </div>
                        </td>

                        <td>
                          <div className="sales-ws-two-line">
                            <strong>{quote.contactName || "-"}</strong>
                            {quote.contactRole && <span>{quote.contactRole}</span>}
                          </div>
                        </td>

                        <td>
                          <div className="sales-ws-two-line deal">
                            <strong>{quote.dealName || "-"}</strong>
                            {quote.stage && <span>{quote.stage}</span>}
                          </div>
                        </td>

                        <td className="sales-ws-money">
                          {quote.value != null ? money(quote.value, locale) : "-"}
                        </td>

                        <td>
                          <span
                            className={`sales-ws-status ${String(quote.status || "").toLowerCase()}`}
                          >
                            {statusLabel(quote.status)}
                          </span>
                        </td>

                        <td>
                          <div className="sales-ws-valid">
                            <strong>{formatDate(quote.validUntil, locale)}</strong>
                            {valid.text && (
                              <span className={valid.danger ? "danger" : ""}>{valid.text}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          {quote.ownerName ? (
                            <div className="sales-ws-owner">
                              <span>{initials(quote.ownerName)}</span>
                              {quote.ownerName}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          <div className="sales-ws-two-line">
                            <strong>{formatDate(quote.createdAt, locale)}</strong>
                          </div>
                        </td>

                        <td>
                          <div className="sales-ws-row-actions">
                            <button
                              type="button"
                              onClick={() => convertToProposal(quote.id)}
                              aria-label={t("salesWorkspace.actions.createProposal")}
                              title={t("salesWorkspace.actions.createProposal")}
                            >
                              <ClipboardList size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("view", quote.id)}
                              aria-label={t("salesWorkspace.actions.viewQuote")}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("edit", quote.id)}
                              aria-label={t("salesWorkspace.actions.editQuote")}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("view", quote.id)}
                              aria-label={t("salesWorkspace.tabs.more")}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="sales-ws-pagination">
            <span>
              {t("salesWorkspace.pagination.showingQuotes", {
                from,
                to,
                total: total.toLocaleString(locale),
              })}
            </span>
            <div>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </button>
              <button className="active">{page}</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </button>
            </div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value="20">{t("salesWorkspace.pagination.perPage", { count: 20 })}</option>
              <option value="50">{t("salesWorkspace.pagination.perPage", { count: 50 })}</option>
              <option value="100">{t("salesWorkspace.pagination.perPage", { count: 100 })}</option>
            </select>
          </div>
        </section>
      ) : activeTab === "Proposals" ? (
        <ProposalsSection />
      ) : activeTab === "Orders" ? (
        <OrdersSection />
      ) : activeTab === "Contracts" ? (
        <ContractsSection />
      ) : activeTab === "Returns" ? (
        <ReturnsSection />
      ) : activeTab === "Invoices" ? (
        <InvoicesSection />
      ) : activeTab === "Commissions" ? (
        <CommissionsSection />
      ) : (
        <section className="sales-ws-quotes">
          <div className="sales-ws-section-head">
            <div>
              <h2>{t(`salesWorkspace.tabs.${String(activeTab).toLowerCase()}`)}</h2>
              <p>{t("salesWorkspace.workspaceReady", { workspace: t(`salesWorkspace.tabs.${String(activeTab).toLowerCase()}`) })}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab !== "More" && (
        <section className="sales-ws-mobile-intelligence">
          <div className="sales-ws-mobile-intelligence-heading">
            <h2>{t("salesWorkspace.intelligence.title")}</h2>
            <p>{t("salesWorkspace.intelligence.subtitle")}</p>
          </div>

          <div className="sales-ws-mobile-intel-card blue">
            <div className="sales-ws-mobile-intel-head">
              <div>
                <span className="intel-icon"><BarChart3 /></span>
                <strong>{t("salesWorkspace.pipelineSummary")}</strong>
              </div>
              <button>{t("common.thisMonth")} <ChevronDown /></button>
            </div>

            <div className="sales-ws-mobile-pipeline-summary">
              <div>
                <span>{t("salesWorkspace.intelligence.totalPipelineValue")}</span>
                <strong>{money(pipelineTotal, locale)}</strong>
              </div>
              <div>
                <span>{t("salesWorkspace.intelligence.openDeals")}</span>
                <strong>{openDeals}</strong>
              </div>
              <div>
                <span>{t("salesWorkspace.intelligence.expectedRevenue")}</span>
                <strong>{money(expectedRevenue, locale)}</strong>
              </div>
            </div>

            <button
              className="sales-ws-mobile-intel-link"
              onClick={() => navigate("/dashboard/pipeline")}
            >
              {t("salesWorkspace.intelligence.viewFullPipeline")} →
            </button>
          </div>

          <div className="sales-ws-mobile-intel-card green">
            <div className="sales-ws-mobile-intel-head">
              <div>
                <span className="intel-icon"><Activity /></span>
                <strong>{t("salesWorkspace.recentActivity")}</strong>
              </div>
              <button>{t("salesWorkspace.intelligence.allActivity")} <ChevronDown /></button>
            </div>

            <div className="sales-ws-mobile-intel-activity">
              {activity.length === 0 ? (
                <p>{t("salesWorkspace.noRecentActivity")}</p>
              ) : (
                activity.slice(0, 4).map((item, index) => (
                  <div key={`${item.title}-${index}`}>
                    <span><FileText /></span>
                    <strong>{item.title}</strong>
                    <time>{relativeTime(item.at)}</time>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="sales-ws-mobile-intel-link"
              onClick={openAllSalesActivity}
            >
              {t("salesWorkspace.viewAllActivity")} →
            </button>
          </div>

          <div className="sales-ws-mobile-intel-card amber">
            <div className="sales-ws-mobile-intel-head">
              <div>
                <span className="intel-icon"><UsersRound /></span>
                <strong>{t("salesWorkspace.topPerformingReps")}</strong>
              </div>
              <button>{t("common.thisMonth")} <ChevronDown /></button>
            </div>

            <div className="sales-ws-mobile-reps">
              {reps.length === 0 ? (
                <p>{t("salesWorkspace.noDataYet")}</p>
              ) : (
                reps.slice(0, 3).map((rep, index) => (
                  <div key={rep.name || index}>
                    <b>{index + 1}</b>
                    <span className="avatar">{initials(rep.name)}</span>
                    <strong>{rep.name}</strong>
                    <em>{money(rep.amount, locale)}</em>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="sales-ws-mobile-intel-link"
              onClick={() => navigate("/dashboard/analytics")}
            >
              {t("salesWorkspace.viewFullLeaderboard")} →
            </button>
          </div>
        </section>
      )}


      {activeTab === "Overview" && (
        <section className="sales-ws-mobile-more">
          <div className="sales-ws-mobile-assistant">
            <div className="sales-ws-mobile-assistant-head">
              <div className="assistant-icon">
                <Bot />
              </div>

              <div>
                <h2>{t("salesWorkspace.more.aiAssistantTitle")}</h2>
                <p>{t("salesWorkspace.more.aiAssistantSubtitle")}</p>
                <span className="online">
                  <i />
                  {t("salesWorkspace.more.online")}
                </span>
              </div>
            </div>

            <div className="sales-ws-mobile-assistant-actions">
              <button
                type="button"
                className="purple"
                onClick={() => navigate("/dashboard/ai-cortexa")}
              >
                <Zap />
                {t("salesWorkspace.more.askAi")}
              </button>

              <button
                type="button"
                className="blue"
                onClick={() => navigate("/dashboard/leads")}
              >
                <UsersRound />
                {t("salesWorkspace.more.leadHelp")}
              </button>

              <button
                type="button"
                className="green"
                onClick={() => navigate("/dashboard/leads")}
              >
                <CalendarDays />
                {t("salesWorkspace.more.followUp")}
              </button>

              <button
                type="button"
                className="amber"
                onClick={() => navigate("/dashboard/contacts")}
              >
                <Mail />
                {t("salesWorkspace.more.sendEmail")}
              </button>
            </div>
          </div>

          <div className="sales-ws-mobile-more-card green">
            <div className="sales-ws-mobile-more-title">
              <h3>{t("salesWorkspace.more.quickActions")}</h3>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {t("salesWorkspace.more.allTools")} →
              </button>
            </div>

            <div className="sales-ws-mobile-quick-grid">
              <button
                type="button"
                className="blue"
                onClick={() => openModal("create")}
              >
                <FileText />
                {t("salesWorkspace.actions.newQuote")}
              </button>

              <button
                type="button"
                className="green"
                onClick={() => goToSalesTab("Proposals")}
              >
                <Handshake />
                {t("salesWorkspace.more.newProposal")}
              </button>

              <button
                type="button"
                className="purple"
                onClick={() => goToSalesTab("Orders")}
              >
                <ShoppingCart />
                {t("salesWorkspace.more.addOrder")}
              </button>

              <button
                type="button"
                className="amber"
                onClick={() => goToSalesTab("Customers")}
              >
                <UserPlus />
                {t("salesWorkspace.more.newCustomer")}
              </button>

              <button
                type="button"
                className="cyan"
                onClick={() => goToSalesTab("Contracts")}
              >
                <FileText />
                {t("salesWorkspace.more.createContract")}
              </button>

              <button
                type="button"
                className="blue"
                onClick={() => setActivityLogOpen(true)}
              >
                <Zap />
                {t("salesWorkspace.more.logActivity")}
              </button>
            </div>
          </div>

          <div className="sales-ws-mobile-more-card green">
            <div className="sales-ws-mobile-more-title">
              <h3>{t("salesWorkspace.recentActivity")}</h3>
              <button type="button" onClick={openAllSalesActivity}>
                {t("salesWorkspace.viewAll")} →
              </button>
            </div>

            <div className="sales-ws-mobile-more-activity">
              {activity.length === 0 ? (
                <p>{t("salesWorkspace.noRecentActivity")}</p>
              ) : (
                activity.slice(0, 2).map((item, index) => (
                  <div key={`${item.title}-${index}`}>
                    <span className={index === 0 ? "green" : "blue"}>
                      {index === 0 ? <FileText /> : <Mail />}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      {item.subtitle && <small>{item.subtitle}</small>}
                      <time>{relativeTime(item.at)}</time>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sales-ws-mobile-more-card amber compact">
            <h3>{t("salesWorkspace.more.helpSupport")}</h3>
            <div className="sales-ws-mobile-support-grid">
              <button
                type="button"
                onClick={() => navigate("/dashboard/help-center")}
              >
                <CircleHelp />
                {t("salesWorkspace.more.helpCenter")}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard/help-center")}
              >
                <Headphones />
                {t("salesWorkspace.more.contactSupport")}
              </button>
            </div>
          </div>

          <div className="sales-ws-mobile-more-card purple compact">
            <h3>{t("salesWorkspace.more.salesShortcuts")}</h3>
            <div className="sales-ws-mobile-shortcuts">
              <button
                type="button"
                onClick={() => navigate("/dashboard/pipeline")}
              >
                <BarChart3 />
                {t("salesWorkspace.more.myPipeline")}
              </button>

              <button
                type="button"
                onClick={() => goToSalesTab("Customers")}
              >
                <UsersRound />
                {t("salesWorkspace.more.topCustomers")}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard/analytics")}
              >
                <BarChart3 />
                {t("salesWorkspace.more.reports")}
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="sales-ws-bottom">
        <div className="sales-ws-bottom-card pipeline">
          <div className="sales-ws-card-head">
            <strong>{t("salesWorkspace.pipelineSummary")}</strong>
            <span>{t("common.thisMonth")}⌄</span>
          </div>

          <div className="sales-ws-pipeline">
            {pipeline.length === 0 ? (
              <div>
                <span>{t("salesWorkspace.noPipelineData")}</span>
              </div>
            ) : (
              pipeline.map((p) => (
                <div key={p.label}>
                  <span>{p.label}</span>
                  <strong>{money(p.value, locale)}</strong>
                  <small>{p.dealCount || 0} Deals</small>
                  <i className={p.tone || "blue"} />
                </div>
              ))
            )}
          </div>

          <div className="sales-ws-pipeline-total">
            {t("salesWorkspace.intelligence.totalPipelineValue")}:{" "}
            <strong>{money(pipelineTotal, locale)}</strong>
          </div>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>{t("salesWorkspace.recentActivity")}</strong>
            <span>{t("salesWorkspace.intelligence.allActivity")}⌄</span>
          </div>

          <div className="sales-ws-activity-list">
            {activity.length === 0 ? (
              <div className="sales-ws-activity-row">
                <div>
                  <small>{t("salesWorkspace.noRecentActivity")}</small>
                </div>
              </div>
            ) : (
              activity.map((a, i) => (
                <div className="sales-ws-activity-row" key={`${a.title}-${i}`}>
                  <div>
                    <strong>{a.title}</strong>
                    {a.subtitle && <small>{a.subtitle}</small>}
                  </div>
                  <time>{relativeTime(a.at)}</time>
                </div>
              ))
            )}
          </div>

          <button className="sales-ws-link-btn" onClick={openAllSalesActivity}>{t("salesWorkspace.viewAllActivity")} →</button>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>{t("salesWorkspace.topPerformingReps")}</strong>
            <span>{t("common.thisMonth")}⌄</span>
          </div>

          <div className="sales-ws-reps">
            {reps.length === 0 ? (
              <div>
                <span>{t("salesWorkspace.noDataYet")}</span>
              </div>
            ) : (
              reps.map((r, index) => (
                <div key={r.name || index}>
                  <b>{index + 1}</b>
                  <span className="avatar">{initials(r.name)}</span>
                  <strong>{r.name}</strong>
                  <span>{money(r.amount, locale)}</span>
                  <small>{t("salesWorkspace.kpi.countLabel", { count: r.orders || 0, noun: t("salesWorkspace.kpi.orders") })}</small>
                </div>
              ))
            )}
          </div>

          <button className="sales-ws-link-btn" onClick={() => navigate("/dashboard/analytics")}>{t("salesWorkspace.viewFullLeaderboard")} →</button>
        </div>
      </div>


      {activityModalOpen && (
        <div className="sales-ws-activity-modal-backdrop" onClick={() => setActivityModalOpen(false)}>
          <div className="sales-ws-activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sales-ws-activity-modal-head">
              <h3>{t("salesWorkspace.recentActivity")}</h3>
              <button type="button" onClick={() => setActivityModalOpen(false)}>×</button>
            </div>

            <div className="sales-ws-activity-modal-list">
              {activityLoading ? (
                <p>{t("common.loading")}</p>
              ) : activityRows.length === 0 ? (
                <p>{t("salesWorkspace.noRecentActivity")}</p>
              ) : (
                activityRows.map((item, index) => (
                  <div key={item.id || `${item.title}-${index}`}>
                    <span className="activity-dot" />
                    <div>
                      <strong>{item.title}</strong>
                      {item.subtitle && <small>{item.subtitle}</small>}
                    </div>
                    <time>{relativeTime(item.at || item.createdAt)}</time>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activityLogOpen && (
        <div className="sales-ws-activity-modal-backdrop" onClick={() => setActivityLogOpen(false)}>
          <div className="sales-ws-activity-modal sales-ws-log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sales-ws-activity-modal-head">
              <h3>{t("salesWorkspace.more.logActivity")}</h3>
              <button type="button" onClick={() => setActivityLogOpen(false)}>×</button>
            </div>

            <label>
              <span>{t("salesWorkspace.more.activityTitle")}</span>
              <input
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder={t("salesWorkspace.more.activityTitlePlaceholder")}
              />
            </label>

            <label>
              <span>{t("salesWorkspace.more.activityDetails")}</span>
              <textarea
                value={activityDetails}
                onChange={(e) => setActivityDetails(e.target.value)}
                placeholder={t("salesWorkspace.more.activityDetailsPlaceholder")}
                rows={4}
              />
            </label>

            <div className="sales-ws-log-actions">
              <button type="button" onClick={() => setActivityLogOpen(false)}>
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="primary"
                disabled={!activityTitle.trim() || activitySaving}
                onClick={saveSalesActivity}
              >
                {activitySaving
                  ? t("common.saving")
                  : t("salesWorkspace.more.saveActivity")}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuoteModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        quoteId={modalQuoteId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
