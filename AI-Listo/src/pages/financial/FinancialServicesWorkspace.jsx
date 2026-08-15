import React, { useEffect, useState } from "react";
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
  { key: "totalClients", icon: "users", label: "Total Clients" },
  { key: "applicationsInProgress", icon: "calendar-days", label: "Applications In Progress" },
  { key: "accountsUnderManagement", icon: "shield-check", label: "Accounts Under Management" },
  { key: "assetsUnderManagement", icon: "circle-dollar-sign", label: "Assets Under Management" },
  { key: "revenueThisMonth", icon: "badge-dollar-sign", label: "Revenue (This Month)" },
  { key: "conversionRate", icon: "chart-no-axes-combined", label: "Conversion Rate" },
];

const TABS = [
  ["settings", "Overview"],
  ["users", "Clients"],
  ["file-text", "Applications"],
  ["wallet-cards", "Accounts"],
  ["receipt-text", "Transactions"],
  ["chart-pie", "Investments"],
  ["files", "Documents"],
  ["network", "Commissions"],
  ["file-chart-column", "Reports"],
];

const RISK_FILTERS = ["Conservative", "Moderate Low", "Moderate", "Moderate High", "High"];

function Icon({ name, size = 16 }) {
  return <i data-lucide={name} style={{ width: size, height: size }} />;
}

function statValue(key, stats) {
  const s = stats?.[key];
  switch (key) {
    case "totalClients":
      return { value: (s?.count || 0).toLocaleString("en-US"), sub: `${(s?.active || 0).toLocaleString("en-US")} Active` };
    case "applicationsInProgress":
      return { value: (s?.count || 0).toLocaleString("en-US"), sub: "In progress" };
    case "accountsUnderManagement":
      return { value: (s?.count || 0).toLocaleString("en-US"), sub: "Active accounts" };
    case "assetsUnderManagement":
      return { value: money(s?.amount || 0), sub: "Total AUM (recorded)" };
    case "revenueThisMonth":
      return { value: money(s?.amount || 0), sub: "Approved + paid this month" };
    case "conversionRate":
      return { value: `${s?.percent || 0}%`, sub: "Applications approved" };
    default:
      return { value: "—", sub: "" };
  }
}

export default function FinancialServicesWorkspace() {
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
        setError("Could not load clients.");
        setLoading(false);
      });
    return () => { alive = false; };
  }, [tab, debounced, clientType, status, risk, page, limit, refreshTick]);

  // Render the data-lucide icons after each data change.
  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, clients, stats, loading, modalOpen]);

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

  return (
    <div className="fsw-page">
      <header className="fsw-header">
        <div>
          <h1>Financial Services Workspace</h1>
          <p>Manage your entire client journey from application to portfolio management.</p>
        </div>
        <div className="fsw-header-actions">
          <div className="fsw-global-search">
            <Icon name="search" />
            <input placeholder="Search clients, accounts, applications, documents..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="fsw-new" onClick={() => openModal("create")}>
            <Icon name="plus" /> New <Icon name="chevron-down" size={14} />
          </button>
        </div>
      </header>

      <section className="fsw-stats">
        {STAT_CONFIG.map(({ key, icon, label }) => {
          const { value, sub } = statValue(key, stats);
          return (
            <div className="fsw-stat" key={key}>
              <div className="fsw-stat-top">
                <span>{label}</span>
                <span className="fsw-stat-icon">
                  <Icon name={icon} size={20} />
                </span>
              </div>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          );
        })}
      </section>

      <nav className="fsw-tabs">
        {TABS.map(([icon, label]) => (
          <button key={label} className={tab === label ? "active" : ""} onClick={() => setTab(label)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>

      {tab === "Overview" ? (
        <FinancialOverviewSection stats={stats} />
      ) : tab === "Clients" ? (
        <>
          <section className="fsw-section-title">
            <div>
              <h2>Clients</h2>
              <p>View and manage all clients</p>
            </div>
            <div className="fsw-section-actions">
              <button><Icon name="upload" />Import</button>
              <button><Icon name="download" />Export</button>
              <button><Icon name="settings-2" /></button>
              <button className="primary" onClick={() => openModal("create")}>
                <Icon name="plus" />New Client
              </button>
            </div>
          </section>

          <div className="fsw-filters">
            <label className="fsw-search">
              <Icon name="search" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." />
            </label>
            <select value={clientType} onChange={(e) => setClientType(e.target.value)}>
              <option>Client Type</option>
              <option>Retail Client</option>
              <option>Corporate Client</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <select value={risk} onChange={(e) => setRisk(e.target.value)}>
              <option>Risk Level</option>
              {RISK_FILTERS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <button className="fsw-reset" onClick={reset}>
              <Icon name="rotate-ccw" size={14} />Reset
            </button>
          </div>

          <div className="fsw-table-wrap">
            <table className="fsw-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>Client Type</th>
                  <th>Primary Advisor</th>
                  <th>Account Type</th>
                  <th>AUM / Balance</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Next Review</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={12} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No clients yet. Add your first client to get started.</td></tr>
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
              <span>Showing {from} to {to} of {total.toLocaleString("en-US")} clients</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                <button className="active">{page}</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </div>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
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
          <p>{tab} workspace is ready for the next implementation step.</p>
        </div>
      )}

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
