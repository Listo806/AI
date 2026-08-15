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
} from "lucide-react";
import "./SalesWorkspace.css";
import salesApi from "../../api/salesApi";
import QuoteModal from "./QuoteModal";
import ProposalsSection from "./ProposalsSection";
import OrdersSection from "./OrdersSection";
import ContractsSection from "./ContractsSection";
import ReturnsSection from "./ReturnsSection";

// KPI card config. Values come from the live /sales/stats endpoint. In this first
// slice only Quotes exist, so Open Quotes is real and the rest report 0 until
// their tabs are wired — no invented numbers, and no fake "vs last month" trend
// (comparisons appear only once real history exists).
const STAT_CONFIG = [
  { key: "openQuotes", label: "Open Quotes", noun: "Quotes", Icon: FileText, tone: "blue" },
  { key: "openProposals", label: "Open Proposals", noun: "Proposals", Icon: ClipboardList, tone: "purple" },
  { key: "ordersThisMonth", label: "Orders This Month", noun: "Orders", Icon: PackageCheck, tone: "green" },
  { key: "outstandingInvoices", label: "Outstanding Invoices", noun: "Invoices", Icon: BadgeDollarSign, tone: "amber" },
  { key: "commissionsDue", label: "Commissions Due", Icon: ShoppingCart, tone: "cyan" },
  { key: "conversionRate", label: "Conversion Rate", Icon: Percent, tone: "pink" },
];

function money(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function daysLeftNote(validUntil) {
  if (!validUntil) return { text: "", danger: false };
  const d = new Date(validUntil);
  if (isNaN(d.getTime())) return { text: "", danger: false };
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: "expired", danger: true };
  if (diff === 0) return { text: "0 days left", danger: true };
  return { text: `${diff} day${diff === 1 ? "" : "s"} left`, danger: false };
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
function statCard(key, stats) {
  const s = stats?.[key];
  if (!s) return { value: "—", sub: "" };
  switch (key) {
    case "openQuotes":
    case "openProposals":
    case "ordersThisMonth":
    case "outstandingInvoices":
      return { value: money(s.value), sub: `${(s.count || 0).toLocaleString("en-US")} ${STAT_CONFIG.find((c) => c.key === key).noun}` };
    case "commissionsDue":
      return { value: money(s.amount), sub: `${s.count || 0} Pending` };
    case "conversionRate":
      return { value: `${s.percent || 0}%`, sub: "This Month" };
    default:
      return { value: "—", sub: "" };
  }
}

const TABS = [
  "Overview",
  "Customers",
  "Quotes",
  "Proposals",
  "Orders",
  "Contracts",
  "Invoices",
  "Commissions",
  "Returns",
];

export default function SalesWorkspace() {
  const [activeTab, setActiveTab] = useState("Quotes");
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
        setError("Could not load quotes.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeTab, debouncedSearch, page, limit, refreshTick]);

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
      window.alert("Proposal created. Open the Proposals tab to see it.");
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(e?.message || "Could not create proposal");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pipeline = stats?.pipeline || [];
  const activity = stats?.recentActivity || [];
  const reps = stats?.topReps || [];
  const pipelineTotal = pipeline.reduce((sum, p) => sum + (Number(p.value) || 0), 0);

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="sales-ws">
      <div className="sales-ws-header">
        <div>
          <h1>Sales Workspace</h1>
          <p>Manage your entire sales cycle from quote to commission.</p>
        </div>

        <div className="sales-ws-header-actions">
          <label className="sales-ws-global-search">
            <Search size={15} />
            <input placeholder="Search anything..." />
            <kbd>⌘ K</kbd>
          </label>
          <button className="sales-ws-quick-create" onClick={() => openModal("create")}>
            <Plus size={15} />
            Quick Create
          </button>
        </div>
      </div>

      <div className="sales-ws-stat-grid">
        {STAT_CONFIG.map(({ key, label, Icon, tone }) => {
          const { value, sub } = statCard(key, stats);
          return (
            <div className="sales-ws-stat-card" key={key}>
              <div className={`sales-ws-stat-icon ${tone}`}>
                <Icon size={18} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          );
        })}
      </div>

      <nav className="sales-ws-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Quotes" ? (
        <section className="sales-ws-quotes">
          <div className="sales-ws-section-head">
            <div>
              <h2>Quotes</h2>
              <p>Create, manage and track all your quotes</p>
            </div>

            <div className="sales-ws-section-actions">
              <button>
                <Upload size={14} /> Import
              </button>
              <button>
                <Download size={14} /> Export
              </button>
              <button>
                <Settings2 size={14} />
              </button>
              <button className="primary" onClick={() => openModal("create")}>
                <Plus size={14} /> New Quote
              </button>
            </div>
          </div>

          <div className="sales-ws-filters">
            <label>
              <Search size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotes..."
              />
            </label>

            {["Status", "Owner", "Date Range", "Pipeline", "More Filters"].map((item) => (
              <button key={item}>
                {item}
                <ChevronDown size={14} />
              </button>
            ))}

            <button className="reset" onClick={() => setSearch("")}>
              <RotateCcw size={13} /> Reset
            </button>

            <span>View</span>
            <button>
              <Table2 size={13} /> Table
            </button>
            <button>
              <List size={13} />
            </button>
            <button>
              <CalendarDays size={13} />
            </button>
          </div>

          <div className="sales-ws-table-wrap">
            <table className="sales-ws-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Pipeline / Deal</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th>Owner</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="sales-ws-empty-row">
                      Loading…
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
                      No quotes yet. Create your first quote to get started.
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => {
                    const valid = daysLeftNote(quote.validUntil);
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
                          {quote.value != null ? money(quote.value) : "-"}
                        </td>

                        <td>
                          <span
                            className={`sales-ws-status ${String(quote.status || "").toLowerCase()}`}
                          >
                            {quote.status || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="sales-ws-valid">
                            <strong>{formatDate(quote.validUntil)}</strong>
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
                            <strong>{formatDate(quote.createdAt)}</strong>
                          </div>
                        </td>

                        <td>
                          <div className="sales-ws-row-actions">
                            <button
                              type="button"
                              onClick={() => convertToProposal(quote.id)}
                              aria-label="Create proposal from quote"
                              title="Create proposal"
                            >
                              <ClipboardList size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("view", quote.id)}
                              aria-label="View quote"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("edit", quote.id)}
                              aria-label="Edit quote"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("view", quote.id)}
                              aria-label="More"
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
              Showing {from} to {to} of {total.toLocaleString("en-US")} quotes
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
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
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
      ) : (
        <section className="sales-ws-quotes">
          <div className="sales-ws-section-head">
            <div>
              <h2>{activeTab}</h2>
              <p>{activeTab} workspace is ready for the next implementation step.</p>
            </div>
          </div>
        </section>
      )}

      <div className="sales-ws-bottom">
        <div className="sales-ws-bottom-card pipeline">
          <div className="sales-ws-card-head">
            <strong>Sales Pipeline Summary</strong>
            <span>This Month⌄</span>
          </div>

          <div className="sales-ws-pipeline">
            {pipeline.length === 0 ? (
              <div>
                <span>No pipeline data yet</span>
              </div>
            ) : (
              pipeline.map((p) => (
                <div key={p.label}>
                  <span>{p.label}</span>
                  <strong>{money(p.value)}</strong>
                  <small>{p.dealCount || 0} Deals</small>
                  <i className={p.tone || "blue"} />
                </div>
              ))
            )}
          </div>

          <div className="sales-ws-pipeline-total">
            Total Pipeline Value: <strong>{money(pipelineTotal)}</strong>
          </div>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>Recent Activity</strong>
            <span>All Activity⌄</span>
          </div>

          <div className="sales-ws-activity-list">
            {activity.length === 0 ? (
              <div className="sales-ws-activity-row">
                <div>
                  <small>No recent activity</small>
                </div>
              </div>
            ) : (
              activity.map((a, i) => (
                <div className="sales-ws-activity-row" key={`${a.title}-${i}`}>
                  <div>
                    <strong>{a.title}</strong>
                    {a.subtitle && <small>{a.subtitle}</small>}
                  </div>
                  <time>{a.time || ""}</time>
                </div>
              ))
            )}
          </div>

          <button className="sales-ws-link-btn">View all activity →</button>
        </div>

        <div className="sales-ws-bottom-card">
          <div className="sales-ws-card-head">
            <strong>Top Performing Reps</strong>
            <span>This Month⌄</span>
          </div>

          <div className="sales-ws-reps">
            {reps.length === 0 ? (
              <div>
                <span>No data yet</span>
              </div>
            ) : (
              reps.map((r, index) => (
                <div key={r.name || index}>
                  <b>{index + 1}</b>
                  <span className="avatar">{initials(r.name)}</span>
                  <strong>{r.name}</strong>
                  <span>{money(r.amount)}</span>
                  <small>{r.orders || 0} Orders</small>
                </div>
              ))
            )}
          </div>

          <button className="sales-ws-link-btn">View full leaderboard →</button>
        </div>
      </div>

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
