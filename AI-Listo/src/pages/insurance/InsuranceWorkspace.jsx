import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Bell,
  Settings2,
  Download,
  Upload,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
  ClipboardList,
  BadgeDollarSign,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  Table2,
  List,
  CalendarDays,
  CircleCheck,
  FileCheck2,
  ReceiptText,
  Umbrella,
  ChevronDown,
} from "lucide-react";
import "./InsuranceWorkspace.css";
import insuranceApi from "../../api/insuranceApi";
import PolicyModal from "./PolicyModal";
import ClaimsSection from "./ClaimsSection";
import QuotesSection from "./QuotesSection";
import RenewalsSection from "./RenewalsSection";
import CarriersSection from "./CarriersSection";
import CommissionsSection from "./CommissionsSection";
import OverviewSection from "./OverviewSection";
import ReportsSection from "./ReportsSection";
import DocumentsSection from "./DocumentsSection";

// KPI card config (labels/icons/tones). Values come from the live stats
// endpoint (/api/insurance/stats). Policies-by-Type, Recent Activity and
// Upcoming Renewals below are also driven by that live payload.
const STAT_CONFIG = [
  { key: "activePolicies", label: "Active Policies", sub: "Total Premium", Icon: ShieldCheck, tone: "blue" },
  { key: "expiring30", label: "Policies Expiring (30 Days)", sub: "Premium at Risk", Icon: CalendarClock, tone: "amber" },
  { key: "openClaims", label: "Open Claims", sub: "Total Claimed", Icon: ClipboardList, tone: "purple" },
  { key: "claimsPaidThisMonth", label: "Claims Paid (This Month)", sub: "Paid Amount", Icon: BadgeDollarSign, tone: "green" },
  { key: "commissionsDue", label: "Commissions Due", sub: "", Icon: ShoppingCart, tone: "pink" },
  { key: "renewalRate", label: "Renewal Rate", sub: "Renewed vs closed", Icon: TrendingUp, tone: "mint" },
];

const TYPE_TONES = ["blue", "royal", "green", "mint", "purple", "gray"];

const ACTIVITY_ICON = {
  Policy: ShieldCheck,
  Claim: ClipboardList,
  Quote: FileCheck2,
  Renewal: CalendarClock,
};

function formatMoney(value) {
  if (value == null) return "-";
  const n = Number(value);
  if (!isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// Build a KPI card's value + sub-line from the live stats payload.
function statCardValue(key, stats) {
  const k = stats?.kpis?.[key];
  if (!k) return { value: "—", sub1: "" };
  const count = (k.count || 0).toLocaleString("en-US");
  switch (key) {
    case "activePolicies":
      return { value: count, sub1: formatMoney(k.totalPremium) };
    case "expiring30":
      return { value: count, sub1: formatMoney(k.premiumAtRisk) };
    case "openClaims":
      return { value: count, sub1: formatMoney(k.totalClaimed) };
    case "claimsPaidThisMonth":
      return { value: count, sub1: formatMoney(k.totalPaid) };
    case "commissionsDue":
      return { value: formatMoney(k.amount), sub1: `${k.count || 0} pending` };
    case "renewalRate":
      return { value: `${k.percent || 0}%`, sub1: "" };
    default:
      return { value: "—", sub1: "" };
  }
}

// Short relative time for the activity feed, e.g. "2h ago".
function formatWhen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

// Format an ISO date into the workspace's short display, e.g. "Jan 15, 2026".
function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// Relative note for a next-billing / renewal date, e.g. "in 243 days".
function relativeNote(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((x) => x[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Map a backend policy row to the exact shape the table renders, with safe
// fallbacks so a partially-filled policy never breaks the UI.
function toPolicyRow(p) {
  const start = formatDate(p.coverageStart);
  const end = formatDate(p.coverageEnd);
  const period = start && end ? `${start} - ${end}` : start || end || "-";
  const carrier = p.carrierName || "-";
  return {
    uuid: p.id,
    id: p.policyNumber || p.id,
    holder: p.holderName || p.contactName || "-",
    contact: p.contactName || "",
    type: p.policyType || "-",
    carrier,
    carrierMark: p.carrierMark || initials(carrier).charAt(0) || "☂",
    period,
    premium: Number(p.premium) || 0,
    status: p.status || "Pending",
    billing: formatDate(p.nextBilling) || "-",
    billingNote: p.nextBilling ? relativeNote(p.nextBilling) : "",
    agent: p.agentName || "Unassigned",
  };
}

// Windowed page-number list, keeping the existing pagination look but driven by
// the real total.
function pageWindow(current, totalPages) {
  const pages = [];
  const max = 7;
  if (totalPages <= max) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  let start = Math.max(2, current - 1);
  let end = Math.min(totalPages - 1, current + 1);
  if (current <= 3) {
    start = 2;
    end = 4;
  } else if (current >= totalPages - 2) {
    start = totalPages - 3;
    end = totalPages - 1;
  }
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

const EMPTY_CELL_STYLE = {
  textAlign: "center",
  padding: "36px 16px",
  color: "#64748b",
};

export default function InsuranceWorkspace() {
  const [activeTab, setActiveTab] = useState("Policies");
  const [search, setSearch] = useState("");

  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalPolicyId, setModalPolicyId] = useState(null);
  // Bumped on every open so the modal remounts fresh (no stale header / stuck
  // loading state carried over from a previous open).
  const [modalNonce, setModalNonce] = useState(0);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeTab !== "Policies") return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      insuranceApi
        .listPolicies({ search: search.trim() || undefined, page, limit })
        .then((res) => {
          if (cancelled) return;
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setPolicies(data.map(toPolicyRow));
          setTotal(Number(res?.total ?? data.length) || 0);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setPolicies([]);
          setTotal(0);
          setError(e?.message || "Failed to load policies");
          setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, page, limit, refreshTick, activeTab]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);
  const pages = useMemo(
    () => pageWindow(safePage, totalPages),
    [safePage, totalPages],
  );

  const openCreate = () => {
    setModalMode("create");
    setModalPolicyId(null);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openView = (id) => {
    setModalMode("view");
    setModalPolicyId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openEdit = (id) => {
    setModalMode("edit");
    setModalPolicyId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);

  // Keep the current page within range after the list shrinks (e.g. deleting the
  // last row on the last page), so the table and footer don't desync.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Live KPIs / breakdowns / activity. Refetched after policy changes and when
  // returning to a tab, so the top and bottom cards stay current.
  useEffect(() => {
    let cancelled = false;
    insuranceApi
      .getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        /* keep the last-good stats on a transient error */
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick, activeTab]);

  return (
    <div className="insurance-ws">
      <div className="insurance-ws-header">
        <div>
          <h1>Insurance Workspace</h1>
          <p>Manage your entire insurance lifecycle from quote to claim and renewal.</p>
        </div>

        <div className="insurance-ws-header-actions">
          <label className="insurance-ws-global-search">
            <Search size={15} />
            <input placeholder="Search policies, claims, clients, documents..." />
            <kbd>⌘ K</kbd>
          </label>
          <button className="insurance-ws-new" onClick={openCreate}>
            <Plus size={15} />
            New
          </button>
        </div>
      </div>

      <div className="insurance-ws-stat-grid">
        {STAT_CONFIG.map(({ key, label, sub, Icon, tone }) => {
          const { value, sub1 } = statCardValue(key, stats);
          return (
            <div className="insurance-ws-stat-card" key={key}>
              <div className={`insurance-ws-stat-icon ${tone}`}>
                <Icon size={18} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
              {sub1 && <small>{sub1}</small>}
              {sub && <small>{sub}</small>}
            </div>
          );
        })}
      </div>

      <nav className="insurance-ws-tabs">
        {[
          "Overview",
          "Policies",
          "Claims",
          "Quotes",
          "Renewals",
          "Carriers",
          "Commissions",
          "Documents",
          "Reports",
        ].map((tab) => (
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

      {activeTab === "Policies" && (
      <section className="insurance-ws-policies">
        <div className="insurance-ws-section-head">
          <div>
            <h2>{activeTab}</h2>
            <p>
              {activeTab === "Policies"
                ? "View and manage all insurance policies"
                : `${activeTab} workspace is ready for the next implementation step.`}
            </p>
          </div>

          <div className="insurance-ws-section-actions">
            <button><Upload size={14} /> Import</button>
            <button><Download size={14} /> Export</button>
            <button><Settings2 size={14} /></button>
            <button className="primary" onClick={openCreate}><Plus size={14} /> New Policy</button>
          </div>
        </div>

        <div className="insurance-ws-filters">
          <label>
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search policies..."
            />
          </label>

          {[
            "Status · All Statuses",
            "Policy Type · All Types",
            "Carrier · All Carriers",
            "Agent · All Agents",
            "Date Range · All Time",
            "More Filters",
          ].map((item) => (
            <button key={item}>{item}<ChevronDown size={14} /></button>
          ))}

          <button className="reset"><RotateCcw size={13} /> Reset</button>

          <span>View</span>
          <button><Table2 size={13} /> Table</button>
          <button><List size={13} /></button>
          <button><CalendarDays size={13} /></button>
        </div>

        <div className="insurance-ws-table-wrap">
          <table className="insurance-ws-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Policy #</th>
                <th>Policyholder</th>
                <th>Policy Type</th>
                <th>Carrier</th>
                <th>Coverage Period</th>
                <th>Premium</th>
                <th>Status</th>
                <th>Next Billing</th>
                <th>Agent</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={EMPTY_CELL_STYLE}>Loading policies...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} style={EMPTY_CELL_STYLE}>{error}</td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={11} style={EMPTY_CELL_STYLE}>
                    {search.trim()
                      ? "No policies match your search."
                      : "No policies yet. Create your first policy to get started."}
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.uuid}>
                    <td><input type="checkbox" /></td>
                    <td className="policy-id">{policy.id}</td>

                    <td>
                      <div className="insurance-ws-two-line">
                        <strong>{policy.holder}</strong>
                        <span>{policy.contact}</span>
                      </div>
                    </td>

                    <td>{policy.type}</td>

                    <td>
                      <div className="insurance-ws-carrier">
                        <span>{policy.carrierMark}</span>
                        <strong>{policy.carrier}</strong>
                      </div>
                    </td>

                    <td>{policy.period}</td>

                    <td>
                      <div className="insurance-ws-two-line premium">
                        <strong>
                          ${policy.premium.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                        <span>Annual</span>
                      </div>
                    </td>

                    <td>
                      <span className={`insurance-ws-status ${policy.status.toLowerCase()}`}>
                        {policy.status}
                      </span>
                    </td>

                    <td>
                      <div className="insurance-ws-two-line billing">
                        <strong>{policy.billing}</strong>
                        {policy.billingNote && <span>{policy.billingNote}</span>}
                      </div>
                    </td>

                    <td>
                      <div className="insurance-ws-agent">
                        <span>
                          {policy.agent
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        {policy.agent}
                      </div>
                    </td>

                    <td>
                      <div className="insurance-ws-row-actions">
                        <Eye
                          size={14}
                          style={{ cursor: "pointer" }}
                          onClick={() => openView(policy.uuid)}
                        />
                        <Pencil
                          size={14}
                          style={{ cursor: "pointer" }}
                          onClick={() => openEdit(policy.uuid)}
                        />
                        <MoreVertical
                          size={14}
                          style={{ cursor: "pointer" }}
                          onClick={() => openView(policy.uuid)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="insurance-ws-pagination">
          <span>
            {total === 0
              ? "No policies"
              : `Showing ${from} to ${to} of ${total.toLocaleString("en-US")} policies`}
          </span>
          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {pages.map((n, i) =>
              n === "..." ? (
                <span key={`gap-${i}`}>...</span>
              ) : (
                <button
                  key={n}
                  className={n === safePage ? "active" : ""}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ),
            )}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </section>
      )}

      {activeTab === "Overview" && (
        <OverviewSection stats={stats} onGoTo={setActiveTab} />
      )}

      {activeTab === "Claims" && <ClaimsSection />}

      {activeTab === "Quotes" && <QuotesSection />}

      {activeTab === "Renewals" && <RenewalsSection />}

      {activeTab === "Carriers" && <CarriersSection />}

      {activeTab === "Commissions" && <CommissionsSection />}

      {activeTab === "Reports" && <ReportsSection />}

      {activeTab === "Documents" && <DocumentsSection />}

      {/* Policies-by-Type / Activity / Renewals cards belong to the Policies and
          Overview views (both driven by the stats payload). */}
      {(activeTab === "Policies" || activeTab === "Overview") && (
      <div className="insurance-ws-bottom">
        <div className="insurance-ws-bottom-card type-card">
          <div className="insurance-ws-card-head">
            <strong>Policies by Type</strong>
            <span>This Month⌄</span>
          </div>

          <div className="insurance-ws-type-layout">
            <div className="insurance-ws-donut">
              <b>
                {(stats?.totalPolicies || 0).toLocaleString("en-US")}
                <small>Total Policies</small>
              </b>
            </div>

            <div className="insurance-ws-legend">
              {(stats?.policiesByType || []).length === 0 ? (
                <p>
                  <span>No policies yet</span>
                </p>
              ) : (
                stats.policiesByType.map((t, i) => (
                  <p key={t.type}>
                    <i className={TYPE_TONES[i % TYPE_TONES.length]} />
                    <span>{t.type}</span>
                    <strong>
                      {t.percent}% ({t.count})
                    </strong>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="insurance-ws-bottom-card">
          <div className="insurance-ws-card-head">
            <strong>Recent Activity</strong>
            <span>All Activity⌄</span>
          </div>

          <div className="insurance-ws-activity-list">
            {(stats?.recentActivity || []).length === 0 ? (
              <div className="insurance-ws-activity-row">
                <div>
                  <small>No recent activity</small>
                </div>
              </div>
            ) : (
              stats.recentActivity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind] || ReceiptText;
                return (
                  <div
                    className="insurance-ws-activity-row"
                    key={`${a.kind}-${a.when}-${i}`}
                  >
                    <span>
                      <Icon size={13} />
                    </span>
                    <div>
                      <strong>{a.title}</strong>
                      {a.subtitle && <small>{a.subtitle}</small>}
                    </div>
                    <time>{formatWhen(a.when)}</time>
                  </div>
                );
              })
            )}
          </div>

          <button className="insurance-ws-link-btn">View all activity →</button>
        </div>

        <div className="insurance-ws-bottom-card">
          <div className="insurance-ws-card-head">
            <strong>Upcoming Renewals</strong>
            <span>Next 30 Days⌄</span>
          </div>

          <div className="insurance-ws-renewals">
            {(stats?.upcomingRenewals || []).length === 0 ? (
              <div>
                <div>
                  <small>No renewals in the next 30 days</small>
                </div>
              </div>
            ) : (
              stats.upcomingRenewals.map((r) => (
                <div key={r.id || r.policyNumber}>
                  <Umbrella size={13} />
                  <div>
                    <strong>{r.customer || "-"}</strong>
                    <small>{r.policyType || "-"}</small>
                  </div>
                  <span>{r.policyNumber}</span>
                  <span>{formatDate(r.date)}</span>
                  <div className="amount">
                    <strong>{formatMoney(r.premium)}</strong>
                    <small>
                      {r.daysLeft <= 0
                        ? "due"
                        : `in ${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"}`}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="insurance-ws-link-btn">View all renewals →</button>
        </div>
      </div>
      )}

      <PolicyModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        policyId={modalPolicyId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
