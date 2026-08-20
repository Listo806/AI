import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./FinancialServicesWorkspace.css";
import financialApi from "../../api/financialApi";
import ClientModal from "./ClientModal";
import ApplicationsSection from "./ApplicationsSection";
import AccountsSection from "./AccountsSection";
import TransactionsSection from "./TransactionsSection";
import InvestmentsSection from "./InvestmentsSection";
import CommissionsSection from "./CommissionsSection";
import FinancialDocumentsSection from "./FinancialDocumentsSection";
import FinancialReportsSection from "./FinancialReportsSection";
import FinancialOverviewSection from "./FinancialOverviewSection";
import { money, formatDate, initials } from "../sales/salesFormat";

// KPI cards driven by the live /financial/stats endpoint. In this first slice only
// Clients exist, so Total Clients and (recorded) AUM are real and the rest report 0
// until their tabs are wired — no invented numbers, no fake "vs last month".
const STAT_CONFIG = [
  { key: "totalClients", icon: "users", labelKey: "totalClients" },
  { key: "applicationsInProgress", icon: "calendar-days", labelKey: "applicationsInProgress" },
  { key: "accountsUnderManagement", icon: "shield-check", labelKey: "accountsUnderManagement" },
  { key: "assetsUnderManagement", icon: "circle-dollar-sign", labelKey: "assetsUnderManagement" },
  { key: "revenueThisMonth", icon: "badge-dollar-sign", labelKey: "revenueThisMonth" },
  { key: "conversionRate", icon: "chart-no-axes-combined", labelKey: "conversionRate" },
];

const TABS = [
  ["settings", "Overview", "overview"],
  ["users", "Clients", "clients"],
  ["file-text", "Applications", "applications"],
  ["wallet-cards", "Accounts", "accounts"],
  ["receipt-text", "Transactions", "transactions"],
  ["chart-pie", "Investments", "investments"],
  ["files", "Documents", "documents"],
  ["network", "Commissions", "commissions"],
  ["file-chart-column", "Reports", "reports"],
];

const RISK_FILTERS = ["Conservative", "Moderate Low", "Moderate", "Moderate High", "High"];

function Icon({ name, size = 16 }) {
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}

function statValue(key, stats, t) {
  const s = stats?.[key];
  switch (key) {
    case "totalClients":
      return { value: (s?.count || 0).toLocaleString(), sub: t("financialWorkspace.stats.activeCount", { count: s?.active || 0 }) };
    case "applicationsInProgress":
      return { value: (s?.count || 0).toLocaleString(), sub: t("financialWorkspace.stats.inProgress") };
    case "accountsUnderManagement":
      return { value: (s?.count || 0).toLocaleString(), sub: t("financialWorkspace.stats.activeAccounts") };
    case "assetsUnderManagement":
      return { value: money(s?.amount || 0), sub: t("financialWorkspace.stats.totalAumRecorded") };
    case "revenueThisMonth":
      return { value: money(s?.amount || 0), sub: t("financialWorkspace.stats.approvedPaidThisMonth") };
    case "conversionRate":
      return { value: `${s?.percent || 0}%`, sub: t("financialWorkspace.stats.applicationsApproved") };
    default:
      return { value: "—", sub: "" };
  }
}


const MOBILE_TONES = ["#1688ff", "#22d665", "#9b4dff", "#f59e0b", "#ec4899", "#12d4cb"];

function buildDonutGradient(rows, valueKey) {
  const clean = (Array.isArray(rows) ? rows : [])
    .map((r) => ({ ...r, _value: Math.max(0, Number(r?.[valueKey]) || 0) }))
    .filter((r) => r._value > 0);

  const total = clean.reduce((sum, r) => sum + r._value, 0);
  if (!total) return { gradient: "#202733 0 100%", total: 0, rows: [] };

  let at = 0;
  const stops = clean.map((r, index) => {
    const start = at;
    const pct = (r._value / total) * 100;
    at += pct;
    return `${MOBILE_TONES[index % MOBILE_TONES.length]} ${start}% ${at}%`;
  });

  return {
    gradient: stops.join(", "),
    total,
    rows: clean.map((r, index) => ({
      ...r,
      color: MOBILE_TONES[index % MOBILE_TONES.length],
      percent: (r._value / total) * 100,
    })),
  };
}

function MobileDonutCard({ title, rows, valueKey, labelKey, center, centerLabel, formatter = (v) => v }) {
  const donut = buildDonutGradient(rows, valueKey);

  return (
    <article className="fsw-mobile-intel-card fsw-mobile-intel-donut-card">
      <div className="fsw-mobile-intel-card-head">
        <strong>{title}</strong>
      </div>

      <div className="fsw-mobile-intel-donut-body">
        <div
          className="fsw-mobile-real-donut"
          style={{ "--fsw-donut": donut.gradient }}
        >
          <div className="fsw-mobile-real-donut-center">
            <b>{center ?? formatter(donut.total)}</b>
            <small>{centerLabel}</small>
          </div>
        </div>

        <div className="fsw-mobile-donut-legend">
          {donut.rows.length ? donut.rows.map((row, index) => (
            <div key={`${row?.[labelKey] || "item"}-${index}`}>
              <span className="fsw-mobile-legend-name">
                <i style={{ background: row.color }} />
                {row?.[labelKey] || "—"}
              </span>
              <strong>
                {formatter(row._value)}
                <small>({Math.round(row.percent)}%)</small>
              </strong>
            </div>
          )) : (
            <div className="fsw-mobile-intel-empty">—</div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function FinancialServicesWorkspace() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [clientType, setClientType] = useState("Client Type");
  const [status, setStatus] = useState("Status");
  const [risk, setRisk] = useState("Risk Level");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [mobileView, setMobileView] = useState("content");
  const [mobileHub, setMobileHub] = useState(null);
  const [mobileHubLoading, setMobileHubLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, clientType, status, risk, limit]);

  useEffect(() => {
    let alive = true;
    financialApi.getStats().then((s) => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [refreshTick]);

  useEffect(() => {
    let alive = true;
    setMobileHubLoading(true);
    financialApi.getMobileHub()
      .then((data) => {
        if (alive) setMobileHub(data || null);
      })
      .catch(() => {
        if (alive) setMobileHub(null);
      })
      .finally(() => {
        if (alive) setMobileHubLoading(false);
      });

    return () => { alive = false; };
  }, [refreshTick]);

  useEffect(() => {
    if (tab !== "Clients") return undefined;
    let alive = true;
    setLoading(true);
    financialApi
      .listClients({
        search: debounced || undefined,
        clientType: clientType !== "Client Type" ? clientType : undefined,
        status: status !== "Status" ? status : undefined,
        riskLevel: risk !== "Risk Level" ? risk : undefined,
        page,
        limit,
      })
      .then((res) => {
        if (!alive) return;
        setClients(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(t("financialWorkspace.clients.loadError"));
        setLoading(false);
      });
    return () => { alive = false; };
  }, [tab, debounced, clientType, status, risk, page, limit, refreshTick]);

  // Render the data-lucide icons after each data change.
  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, clients, stats, loading, modalOpen, mobileView, mobileHub]);

  const openModal = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };
  const handleSaved = () => setRefreshTick((t) => t + 1);
  const reset = () => {
    setSearch("");
    setClientType("Client Type");
    setStatus("Status");
    setRisk("Risk Level");
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const openMobileTab = (nextTab) => {
    setTab(nextTab);
    setMobileView("content");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showMobileActions = () => {
    setMobileView("actions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showMobileAssistant = () => {
    setMobileView("assistant");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mobileActions = [
    ["newClient", "user-round-plus", "blue", () => openModal("create")],
    ["newApplication", "file-plus-2", "purple", () => openMobileTab("Applications")],
    ["newAccount", "shield-check", "green", () => openMobileTab("Accounts")],
    ["newTransaction", "badge-dollar-sign", "orange", () => openMobileTab("Transactions")],
    ["newInvestment", "chart-no-axes-combined", "purple", () => openMobileTab("Investments")],
    ["portfolioAllocation", "chart-pie", "cyan", () => openMobileTab("Investments")],
    ["uploadDocument", "file-up", "pink", () => openMobileTab("Documents")],
    ["recordCommission", "circle-dollar-sign", "green", () => openMobileTab("Commissions")],
    ["scheduleReview", "calendar-days", "blue", () => openMobileTab("Clients")],
    ["taskFollowUp", "clipboard-check", "purple", () => openMobileTab("Clients")],
    ["generateReport", "download", "orange", () => openMobileTab("Reports")],
    ["sendStatement", "mail", "cyan", () => openMobileTab("Documents")],
  ];

  const assistantPrompts = [
    ["applications", "file-search", "blue", "Applications"],
    ["reviews", "calendar-days", "green", "Clients"],
    ["accounts", "user-round-x", "purple", "Accounts"],
    ["portfolio", "chart-pie", "orange", "Investments"],
    ["revenue", "circle-dollar-sign", "pink", "Commissions"],
  ];

  const appStatusRows = Array.isArray(stats?.applicationsByStatus)
    ? stats.applicationsByStatus
    : [];
  const portfolioRows = Array.isArray(stats?.portfolioAllocation)
    ? stats.portfolioAllocation
    : [];
  const portfolioTotal = portfolioRows.reduce(
    (sum, row) => sum + (Number(row?.amount) || 0),
    0,
  );

  return (
    <div className={`fsw-page fsw-mobile-view-${mobileView}`}>
      <header className="fsw-header">
        <div>
          <h1>{t("financialWorkspace.title")}</h1>
          <p>{t("financialWorkspace.subtitle")}</p>
        </div>
        <div className="fsw-header-actions">
          <div className="fsw-global-search">
            <Icon name="search" />
            <input placeholder={t("financialWorkspace.searchGlobal")} />
            <kbd>⌘ K</kbd>
          </div>
          <button className="fsw-new" onClick={() => openModal("create")}>
            <Icon name="plus" /> {t("financialWorkspace.new")} <Icon name="chevron-down" size={14} />
          </button>
        </div>
      </header>

      <section className="fsw-stats">
        {STAT_CONFIG.map(({ key, icon, labelKey }) => {
          const { value, sub } = statValue(key, stats, t);
          return (
            <div className="fsw-stat" key={key}>
              <div className="fsw-stat-top">
                <span>{t(`financialWorkspace.stats.${labelKey}`)}</span>
                <span className="fsw-stat-icon">
                  <Icon name={icon} size={20} />
                </span>
              </div>
              <div className="fsw-stat-mobile-content">
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
              <span className="fsw-stat-mobile-arrow"><Icon name="chevron-right" size={22} /></span>
            </div>
          );
        })}
      </section>

      <nav className="fsw-tabs">
        {TABS.map(([icon, label, labelKey]) => (
          <button key={label} className={tab === label ? "active" : ""} onClick={() => { setTab(label); setMobileView("content"); }}>
            <Icon name={icon} />
            {t(`financialWorkspace.tabs.${labelKey}`)}
          </button>
        ))}
      </nav>

      {tab === "Overview" ? (
        <>
          <div className="fsw-desktop-overview">
            <FinancialOverviewSection stats={stats} />
          </div>

          <section className="fsw-mobile-financial-intelligence">
            <div className="fsw-mobile-intelligence-title">
              <h2>{t("financialWorkspace.mobileIntelligence.title")}</h2>
              <p>{t("financialWorkspace.mobileIntelligence.subtitle")}</p>
            </div>

            <MobileDonutCard
              title={t("financialWorkspace.mobileIntelligence.applicationsByStatus")}
              rows={appStatusRows}
              valueKey="count"
              labelKey="status"
              center={appStatusRows.reduce((sum, row) => sum + (Number(row?.count) || 0), 0)}
              centerLabel={t("financialWorkspace.mobileIntelligence.total")}
              formatter={(value) => Number(value || 0).toLocaleString()}
            />

            <MobileDonutCard
              title={t("financialWorkspace.mobileIntelligence.portfolioAllocation")}
              rows={portfolioRows}
              valueKey="amount"
              labelKey="category"
              center={money(portfolioTotal)}
              centerLabel={t("financialWorkspace.mobileIntelligence.totalAum")}
              formatter={(value) => money(value || 0)}
            />

            <article className="fsw-mobile-intel-card fsw-mobile-activity-card">
              <div className="fsw-mobile-intel-card-head">
                <strong>{t("financialWorkspace.mobileIntelligence.recentActivity")}</strong>
              </div>
              <div className="fsw-mobile-intel-list">
                {(stats?.recentActivity || []).length ? (
                  stats.recentActivity.slice(0, 5).map((item, index) => (
                    <div key={`${item?.title || "activity"}-${index}`}>
                      <span className={`fsw-mobile-intel-list-icon tone-${index % 5}`}>
                        <Icon name={["circle-check","file-text","circle-dollar-sign","calendar-days","files"][index % 5]} size={18}/>
                      </span>
                      <p>
                        <strong>{item?.title || "—"}</strong>
                        <small>{item?.subtitle || "—"}</small>
                      </p>
                      <time>{formatDate(item?.at)}</time>
                    </div>
                  ))
                ) : (
                  <div className="fsw-mobile-intel-empty">{t("financialWorkspace.mobileIntelligence.noActivity")}</div>
                )}
              </div>
            </article>

            <article className="fsw-mobile-intel-card fsw-mobile-reviews-card">
              <div className="fsw-mobile-intel-card-head">
                <strong>{t("financialWorkspace.mobileIntelligence.upcomingReviews")}</strong>
              </div>
              <div className="fsw-mobile-intel-list">
                {(stats?.upcomingReviews || []).length ? (
                  stats.upcomingReviews.slice(0, 5).map((item, index) => (
                    <div key={`${item?.clientName || "review"}-${index}`}>
                      <span className="fsw-mobile-intel-list-icon tone-3">
                        <Icon name="calendar-days" size={18}/>
                      </span>
                      <p>
                        <strong>{item?.clientName || "—"}</strong>
                        <small>{t("financialWorkspace.mobileIntelligence.portfolioReview")}</small>
                      </p>
                      <time>{formatDate(item?.nextReviewDate)}</time>
                    </div>
                  ))
                ) : (
                  <div className="fsw-mobile-intel-empty">{t("financialWorkspace.mobileIntelligence.noReviews")}</div>
                )}
              </div>
            </article>
          </section>
        </>
      ) : tab === "Clients" ? (
        <>
          <section className="fsw-section-title">
            <div>
              <h2>{t("financialWorkspace.clients.title")}</h2>
              <p>{t("financialWorkspace.clients.subtitle")}</p>
            </div>
            <div className="fsw-section-actions">
              <button><Icon name="upload" />{t("financialWorkspace.actions.import")}</button>
              <button><Icon name="download" />{t("financialWorkspace.actions.export")}</button>
              <button><Icon name="settings-2" /></button>
              <button className="primary" onClick={() => openModal("create")}>
                <Icon name="plus" />{t("financialWorkspace.actions.newClient")}
              </button>
            </div>
          </section>

          <div className="fsw-filters">
            <label className="fsw-search">
              <Icon name="search" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("financialWorkspace.clients.search")} />
            </label>
            <select value={clientType} onChange={(e) => setClientType(e.target.value)}>
              <option value="Client Type">{t("financialWorkspace.filters.clientType")}</option>
              <option value="Retail Client">{t("financialWorkspace.clientTypes.retail")}</option>
              <option value="Corporate Client">{t("financialWorkspace.clientTypes.corporate")}</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Status">{t("financialWorkspace.filters.status")}</option>
              <option value="Active">{t("common.active")}</option>
              <option value="Inactive">{t("common.inactive")}</option>
            </select>
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option value="Risk Level">{t("financialWorkspace.filters.riskLevel")}</option>
              {RISK_FILTERS.map((x) => (
                <option key={x} value={x}>
                  {t(`financialWorkspace.risk.${x.toLowerCase().replaceAll(" ", "_")}`, { defaultValue: x })}
                </option>
              ))}
            </select>
            <button className="fsw-reset" onClick={reset}>
              <Icon name="rotate-ccw" size={14} />{t("financialWorkspace.actions.reset")}
            </button>
          </div>

          <div className="fsw-mobile-client-list">
            {loading ? (
              <div className="fsw-mobile-state">{t("common.loading")}</div>
            ) : error ? (
              <div className="fsw-mobile-state error">{error}</div>
            ) : clients.length === 0 ? (
              <div className="fsw-mobile-state">{t("financialWorkspace.clients.empty")}</div>
            ) : (
              clients.map((c, i) => (
                <article
                  className={`fsw-mobile-client-card tone-${i % 5}`}
                  key={c.id}
                  onClick={() => openModal("view", c.id)}
                >
                  <div className="fsw-mobile-client-avatar">{initials(c.clientName || c.advisorName || "C")}</div>
                  <div className="fsw-mobile-client-main">
                    <strong>{c.clientName || "-"}</strong>
                    <span>{c.clientType || c.kind || "-"}</span>
                    {c.email && <small><Icon name="mail" size={13} />{c.email}</small>}
                    {c.phone && <small><Icon name="phone" size={13} />{c.phone}</small>}
                  </div>
                  <div className="fsw-mobile-client-assets">
                    <small>{t("financialWorkspace.table.aumBalance")}</small>
                    <strong>{c.aum != null ? money(c.aum) : "-"}</strong>
                    <span>{t("financialWorkspace.clients.accounts")}: {c.accountCount ?? c.accountsCount ?? "-"}</span>
                  </div>
                  <div className="fsw-mobile-client-status">
                    <small>{t("financialWorkspace.table.status")}</small>
                    <span className={`status ${String(c.status || "").toLowerCase()}`}>{c.status || "-"}</span>
                    <small>{t("financialWorkspace.table.lastActivity")}</small>
                    <b>{formatDate(c.lastActivityAt)}</b>
                  </div>
                  <Icon name="chevron-right" size={20} />
                </article>
              ))
            )}
          </div>

          

          <div className="fsw-table-wrap">
            <table className="fsw-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>{t("financialWorkspace.table.clientId")}</th>
                  <th>{t("financialWorkspace.table.clientName")}</th>
                  <th>{t("financialWorkspace.table.clientType")}</th>
                  <th>{t("financialWorkspace.table.primaryAdvisor")}</th>
                  <th>{t("financialWorkspace.table.accountType")}</th>
                  <th>{t("financialWorkspace.table.aumBalance")}</th>
                  <th>{t("financialWorkspace.table.riskLevel")}</th>
                  <th>{t("financialWorkspace.table.status")}</th>
                  <th>{t("financialWorkspace.table.lastActivity")}</th>
                  <th>{t("financialWorkspace.table.nextReview")}</th>
                  <th>{t("financialWorkspace.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>{t("common.loading")}</td></tr>
                ) : error ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>{t("financialWorkspace.clients.empty")}</td></tr>
                ) : (
                  clients.map((c, i) => (
                    <tr key={c.id}>
                      <td><input type="checkbox" /></td>
                      <td><a>{c.clientNumber || "-"}</a></td>
                      <td>
                        <b>{c.clientName || "-"}</b>
                        {c.kind && <small>{c.kind}</small>}
                      </td>
                      <td>{c.clientType || "-"}</td>
                      <td>
                        {c.advisorName ? (
                          <div className="fsw-advisor">
                            <span className={`avatar a${i % 4}`}>{initials(c.advisorName)}</span>
                            <span><b>{c.advisorName}</b></span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{c.accountType || "-"}</td>
                      <td className="money">{c.aum != null ? money(c.aum) : "-"}</td>
                      <td>
                        {c.riskLevel ? (
                          <span className={`risk ${String(c.riskLevel).toLowerCase().replaceAll(" ", "-")}`}>{c.riskLevel}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {c.status ? (
                          <span className={`status ${String(c.status).toLowerCase()}`}>{c.status}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatDate(c.lastActivityAt)}</td>
                      <td>{formatDate(c.nextReviewDate)}</td>
                      <td>
                        <div className="fsw-row-actions">
                          <button onClick={() => openModal("view", c.id)}><Icon name="eye" size={15} /></button>
                          <button onClick={() => openModal("edit", c.id)}><Icon name="pencil" size={15} /></button>
                          <button onClick={() => openModal("view", c.id)}><Icon name="ellipsis-vertical" size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="fsw-pagination">
              <span>{t("financialWorkspace.pagination.showingClients", { from, to, total: total.toLocaleString() })}</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                <button className="active">{page}</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </div>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value="20">{t("financialWorkspace.pagination.perPage", { count: 20 })}</option>
                <option value="50">{t("financialWorkspace.pagination.perPage", { count: 50 })}</option>
                <option value="100">{t("financialWorkspace.pagination.perPage", { count: 100 })}</option>
              </select>
            </div>
          </div>
        </>
      ) : tab === "Applications" ? (
        <ApplicationsSection />
      ) : tab === "Accounts" ? (
        <AccountsSection />
      ) : tab === "Transactions" ? (
        <TransactionsSection />
      ) : tab === "Investments" ? (
        <InvestmentsSection />
      ) : tab === "Documents" ? (
        <FinancialDocumentsSection />
      ) : tab === "Commissions" ? (
        <CommissionsSection />
      ) : tab === "Reports" ? (
        <FinancialReportsSection />
      ) : (
        <div className="fsw-placeholder">
          <Icon name={TABS.find((x) => x[1] === tab)?.[0] || "landmark"} size={38} />
          <h2>{tab}</h2>
          <p>{t("financialWorkspace.placeholder", { tab: t(`financialWorkspace.tabs.${String(tab).toLowerCase()}`, { defaultValue: tab }) })}</p>
        </div>
      )}

      <section className="fsw-mobile-actions-hub">
        <div className="fsw-mobile-screen-title">
          <h2>{t("financialWorkspace.mobileActions.title")}</h2>
          <p>{t("financialWorkspace.mobileActions.subtitle")}</p>
        </div>

        <div className="fsw-mobile-actions-grid">
          {mobileActions.map(([key, icon, tone, onClick]) => (
            <button
              type="button"
              key={key}
              className={`fsw-mobile-action-card tone-${tone}`}
              onClick={onClick}
            >
              <span className="fsw-mobile-action-icon"><Icon name={icon} size={30}/></span>
              <span className="fsw-mobile-action-copy">
                <strong>{t(`financialWorkspace.mobileActions.items.${key}.title`)}</strong>
                <small>{t(`financialWorkspace.mobileActions.items.${key}.subtitle`)}</small>
              </span>
              <Icon name="chevron-right" size={19}/>
            </button>
          ))}
        </div>

        <div className="fsw-mobile-support-card">
          <span className="fsw-mobile-action-icon"><Icon name="headphones" size={28}/></span>
          <div>
            <strong>{t("financialWorkspace.mobileActions.support.title")}</strong>
            <small>{t("financialWorkspace.mobileActions.support.subtitle")}</small>
          </div>
          <button type="button">
            {t("financialWorkspace.mobileActions.support.button")}
            <Icon name="chevron-right" size={17}/>
          </button>
        </div>
      </section>

      <section className="fsw-mobile-ai-assistant">
        <div className="fsw-mobile-screen-title">
          <h2>{t("financialWorkspace.aiAssistant.title")} <span>✦</span></h2>
          <p>{t("financialWorkspace.aiAssistant.subtitle")}</p>
        </div>

        <div className="fsw-mobile-ai-prompts">
          {assistantPrompts.map(([key, icon, tone, targetTab]) => (
            <button
              type="button"
              key={key}
              className={`fsw-mobile-ai-prompt tone-${tone}`}
              onClick={() => openMobileTab(targetTab)}
            >
              <span className="fsw-mobile-ai-icon"><Icon name={icon} size={25}/></span>
              <span>
                <strong>{t(`financialWorkspace.aiAssistant.prompts.${key}.title`)}</strong>
                <small>{t(`financialWorkspace.aiAssistant.prompts.${key}.subtitle`)}</small>
              </span>
              <Icon name="chevron-right" size={19}/>
            </button>
          ))}
        </div>

        <div className="fsw-mobile-ai-summary">
          <div className="fsw-mobile-ai-summary-head">
            <strong>✦ {t("financialWorkspace.aiAssistant.summary.title")}</strong>
            <button type="button" onClick={() => setRefreshTick((v) => v + 1)}>
              <Icon name="refresh-cw" size={15}/>
              {t("financialWorkspace.actions.refresh")}
            </button>
          </div>

          <div className="fsw-mobile-ai-summary-grid">
            <button type="button" onClick={() => openMobileTab("Applications")}>
              <Icon name="file-text" size={22}/>
              <b>{mobileHubLoading ? "…" : (mobileHub?.applicationsNeedAttention ?? 0)}</b>
              <span>{t("financialWorkspace.aiAssistant.summary.applications")}</span>
              <small>{t("common.view")}</small>
            </button>
            <button type="button" onClick={() => openMobileTab("Clients")}>
              <Icon name="calendar-days" size={22}/>
              <b>{mobileHubLoading ? "…" : (mobileHub?.reviewsThisWeek ?? 0)}</b>
              <span>{t("financialWorkspace.aiAssistant.summary.reviews")}</span>
              <small>{t("common.view")}</small>
            </button>
            <button type="button" onClick={() => openMobileTab("Accounts")}>
              <Icon name="user-round" size={22}/>
              <b>{mobileHubLoading ? "…" : (mobileHub?.accountsLowActivity ?? 0)}</b>
              <span>{t("financialWorkspace.aiAssistant.summary.accounts")}</span>
              <small>{t("common.view")}</small>
            </button>
            <button type="button" onClick={() => openMobileTab("Commissions")}>
              <Icon name="circle-dollar-sign" size={22}/>
              <b>{mobileHubLoading ? "…" : money(mobileHub?.revenueThisMonth || 0)}</b>
              <span>{t("financialWorkspace.aiAssistant.summary.revenue")}</span>
              <small>{t("common.view")}</small>
            </button>
          </div>
        </div>

        <div className="fsw-mobile-ai-quick-title">{t("financialWorkspace.aiAssistant.quickActions")}</div>
        <div className="fsw-mobile-ai-quick-grid">
          {[
            ["file-chart-column","generateReport","blue","Reports"],
            ["download","exportData","green","Clients"],
            ["mail","sendSummary","purple","Documents"],
            ["bell","setReminder","orange","Clients"],
            ["chart-pie","portfolioReview","pink","Investments"],
            ["chart-no-axes-combined","performanceTrends","blue","Reports"],
            ["lightbulb","aiInsights","green","Overview"],
            ["message-circle","askAnything","purple","Overview"],
          ].map(([icon,key,tone,target]) => (
            <button type="button" key={key} className={`tone-${tone}`} onClick={() => openMobileTab(target)}>
              <Icon name={icon} size={25}/>
              <strong>{t(`financialWorkspace.aiAssistant.quick.${key}.title`)}</strong>
              <small>{t(`financialWorkspace.aiAssistant.quick.${key}.subtitle`)}</small>
            </button>
          ))}
        </div>

        <div className="fsw-mobile-ai-input">
          <Icon name="sparkles" size={20}/>
          <input
            readOnly
            placeholder={t("financialWorkspace.aiAssistant.inputPlaceholder")}
          />
          <Icon name="mic" size={20}/>
          <button type="button"><Icon name="send" size={18}/></button>
        </div>

        <div className="fsw-mobile-ai-disclaimer">
          <Icon name="lock-keyhole" size={13}/>
          {t("financialWorkspace.aiAssistant.disclaimer")}
        </div>
      </section>

      <nav className="fsw-mobile-bottom-nav">
        <button
          type="button"
          className={mobileView === "content" && tab === "Overview" ? "active" : ""}
          onClick={() => openMobileTab("Overview")}
        >
          <Icon name="house" size={23}/>
          <span>{t("financialWorkspace.bottomNav.home")}</span>
        </button>
        <button
          type="button"
          className={mobileView === "content" && tab === "Clients" ? "active" : ""}
          onClick={() => openMobileTab("Clients")}
        >
          <Icon name="users" size={23}/>
          <span>{t("financialWorkspace.bottomNav.clients")}</span>
        </button>
        <button
          type="button"
          className={`create ${mobileView === "actions" ? "active" : ""}`}
          onClick={showMobileActions}
        >
          <span className="plus"><Icon name="plus" size={28}/></span>
          <span>{t("financialWorkspace.bottomNav.add")}</span>
        </button>
        <button
          type="button"
          className={mobileView === "content" && tab === "Reports" ? "active" : ""}
          onClick={() => openMobileTab("Reports")}
        >
          <Icon name="chart-no-axes-column-increasing" size={23}/>
          <span>{t("financialWorkspace.bottomNav.reports")}</span>
        </button>
        <button
          type="button"
          className={mobileView === "assistant" ? "active" : ""}
          onClick={showMobileAssistant}
        >
          <Icon name="ellipsis" size={24}/>
          <span>{t("financialWorkspace.bottomNav.more")}</span>
        </button>
      </nav>

      <ClientModal
        key={nonce}
        open={modalOpen}
        mode={modalMode}
        recordId={modalId}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
