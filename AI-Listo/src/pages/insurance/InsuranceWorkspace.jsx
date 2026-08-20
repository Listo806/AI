import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  ChevronRight as MobileChevronRight,
  Filter,
  Car,
  House,
  HeartPulse,
  Store,
  FolderOpen,
  Mail,
  CreditCard,
  Phone,
  UsersRound,
  FilePlus2,
  RefreshCcw,
  UserPlus,
  BarChart3,
  SlidersHorizontal,
  Headphones,
} from "lucide-react";
import "./InsuranceWorkspace.css";
import "./InsuranceWorkspace.mobile.css";
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
  const { t } = useTranslation();
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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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

  const mobilePrimaryTabs = [
    "Overview",
    "Policies",
    "Claims",
    "Quotes",
    "Renewals",
    "Carriers",
  ];
  const mobileMoreTabs = ["Commissions", "Documents", "Reports", "Connections", "Actions"];
  const mobileTabLabel = (tab) => {
    const key = String(tab || "").toLowerCase();
    return t(`insuranceWorkspace.tabs.${key}`, { defaultValue: tab });
  };

  const getConnectionStatus = (key) => {
    const source = stats?.connections || stats?.integrations || stats?.connectionHealth?.integrations || {};
    const raw = source?.[key] ?? source?.[String(key).toLowerCase()] ?? null;
    if (raw === true || raw?.connected === true || raw?.status === "connected" || raw?.active === true) return "connected";
    if (raw === false || raw?.connected === false || raw?.status === "disconnected") return "disconnected";
    return "unknown";
  };

  const getConnectionLabel = (key) => {
    const state = getConnectionStatus(key);
    if (state === "connected") return t("insuranceWorkspace.connections.connected", { defaultValue: "Connected" });
    if (state === "disconnected") return t("insuranceWorkspace.connections.notConnected", { defaultValue: "Not connected" });
    return t("insuranceWorkspace.connections.checkStatus", { defaultValue: "Check status" });
  };

  const getPolicyMobileIcon = (type = "") => {
    const v = String(type).toLowerCase();
    if (v.includes("auto") || v.includes("vehicle")) return Car;
    if (v.includes("home") || v.includes("property")) return House;
    if (v.includes("life") || v.includes("health")) return HeartPulse;
    if (v.includes("business") || v.includes("commercial")) return Store;
    if (v.includes("umbrella")) return Umbrella;
    return ShieldCheck;
  };

  return (
    <div className={`insurance-ws ${activeTab === "Overview" ? "is-overview" : ""}`}>
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
              <div className={`insurance-ws-stat-icon insurance-ws-stat-icon-mobile ${tone}`}>
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

      <nav className="insurance-ws-tabs insurance-ws-tabs-desktop">
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
            {mobileTabLabel(tab)}
          </button>
        ))}
      </nav>

      <div className="insurance-ws-tabs-mobile-wrap">
        <nav className="insurance-ws-tabs-mobile">
          {mobilePrimaryTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "active" : ""}
              onClick={() => {
                setActiveTab(tab);
                setMobileMoreOpen(false);
              }}
            >
              {mobileTabLabel(tab)}
            </button>
          ))}

          <button
            type="button"
            className={
              mobileMoreOpen || mobileMoreTabs.includes(activeTab)
                ? "more-open"
                : ""
            }
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((open) => !open)}
          >
            {t("insuranceWorkspace.tabs.more", { defaultValue: "More" })}
            <ChevronDown
              size={15}
              className={mobileMoreOpen ? "rotate" : ""}
            />
          </button>
        </nav>

        {mobileMoreOpen && (
          <div className="insurance-ws-tabs-mobile-more-menu">
            {mobileMoreTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "active" : ""}
                onClick={() => {
                  setActiveTab(tab);
                  setMobileMoreOpen(false);
                }}
              >
                {mobileTabLabel(tab)}
              </button>
            ))}
          </div>
        )}
      </div>

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
        <div className="insurance-ws-mobile-policy-tools">
          <label>
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search policies..."
            />
          </label>
          <button type="button">
            <Filter size={18} />
            {t("insuranceWorkspace.actions.filters")}
          </button>
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
            "Status · All",
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

        <div className="insurance-ws-mobile-policy-list">
          {loading ? (
            <div className="insurance-ws-mobile-empty">Loading policies...</div>
          ) : error ? (
            <div className="insurance-ws-mobile-empty error">{error}</div>
          ) : policies.length === 0 ? (
            <div className="insurance-ws-mobile-empty">
              {search.trim()
                ? "No policies match your search."
                : "No policies yet. Create your first policy to get started."}
            </div>
          ) : (
            policies.map((policy, index) => {
              const PolicyIcon = getPolicyMobileIcon(policy.type);
              return (
                <article
                  className={`insurance-ws-mobile-policy-card tone-${(index % 5) + 1}`}
                  key={policy.uuid}
                  onClick={() => openView(policy.uuid)}
                >
                  <div className="insurance-ws-mobile-policy-icon">
                    <PolicyIcon size={24} />
                  </div>

                  <div className="insurance-ws-mobile-policy-primary">
                    <strong>{policy.id}</strong>
                    <b>{policy.holder}</b>
                    <span><ShieldCheck size={12} /> {policy.type}</span>
                    <span><Store size={12} /> {policy.carrier}</span>
                  </div>

                  <div className="insurance-ws-mobile-policy-money">
                    <small>{t("insuranceWorkspace.fields.premium")}</small>
                    <strong>${policy.premium.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                    <small>{t("insuranceWorkspace.fields.coverage")}</small>
                    <span>{policy.period}</span>
                  </div>

                  <div className="insurance-ws-mobile-policy-status">
                    <small>{t("insuranceWorkspace.fields.status")}</small>
                    <strong className={`insurance-ws-status ${policy.status.toLowerCase()}`}>
                      {policy.status}
                    </strong>
                    <small>{t("insuranceWorkspace.fields.nextBilling")}</small>
                    <span>{policy.billing}</span>
                    <small>{t("insuranceWorkspace.fields.agent")}</small>
                    <b>{policy.agent}</b>
                  </div>

                  <MobileChevronRight className="insurance-ws-mobile-policy-arrow" size={22} />
                </article>
              );
            })
          )}
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

      {(activeTab === "Connections" || activeTab === "Actions") && (
        <>
          {activeTab === "Connections" && (
          <section className="insurance-ws-mobile-connections">
            <div className="insurance-ws-mobile-block-heading">
              <h2>{t("insuranceWorkspace.connections.title")}</h2>
              <p>{t("insuranceWorkspace.connections.subtitle")}</p>
            </div>

            <div className="insurance-ws-mobile-connection-list">
              <button type="button" className="purple" onClick={() => setActiveTab("Carriers")}>
                <span><ShieldCheck /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.carriers")}</strong>
                  <small>{t("insuranceWorkspace.connections.carriersSub")}</small>
                  <b>{t("insuranceWorkspace.connections.manage")}</b>
                </div>
                <em className="connection-status neutral">{t("insuranceWorkspace.connections.manage")}</em>
                <MobileChevronRight />
              </button>

              <button type="button" className="green" onClick={() => setActiveTab("Documents")}>
                <span><FolderOpen /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.documents")}</strong>
                  <small>{t("insuranceWorkspace.connections.documentsSub")}</small>
                  <b>{t("insuranceWorkspace.connections.manage")}</b>
                </div>
                <em className="connection-status neutral">{t("insuranceWorkspace.connections.manage")}</em>
                <MobileChevronRight />
              </button>

              <button type="button" className="amber" onClick={() => window.location.assign("/dashboard/integrations")}>
                <span><Mail /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.email")}</strong>
                  <small>{t("insuranceWorkspace.connections.emailSub")}</small>
                  <b>{t("insuranceWorkspace.connections.openIntegrations")}</b>
                </div>
                <em className={`connection-status ${getConnectionStatus("email")}`}>{getConnectionLabel("email")}</em>
                <MobileChevronRight />
              </button>

              <button type="button" className="blue" onClick={() => window.location.assign("/dashboard/integrations")}>
                <span><CreditCard /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.payments")}</strong>
                  <small>{t("insuranceWorkspace.connections.paymentsSub")}</small>
                  <b>{t("insuranceWorkspace.connections.openIntegrations")}</b>
                </div>
                <em className={`connection-status ${getConnectionStatus("payments")}`}>{getConnectionLabel("payments")}</em>
                <MobileChevronRight />
              </button>

              <button type="button" className="pink" onClick={() => window.location.assign("/dashboard/integrations")}>
                <span><Phone /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.messaging")}</strong>
                  <small>{t("insuranceWorkspace.connections.messagingSub")}</small>
                  <b>{t("insuranceWorkspace.connections.openIntegrations")}</b>
                </div>
                <em className={`connection-status ${getConnectionStatus("messaging")}`}>{getConnectionLabel("messaging")}</em>
                <MobileChevronRight />
              </button>

              <button type="button" className="cyan" onClick={() => window.location.assign("/dashboard/integrations")}>
                <span><UsersRound /></span>
                <div>
                  <strong>{t("insuranceWorkspace.connections.leads")}</strong>
                  <small>{t("insuranceWorkspace.connections.leadsSub")}</small>
                  <b>{t("insuranceWorkspace.connections.openIntegrations")}</b>
                </div>
                <em className={`connection-status ${getConnectionStatus("leads")}`}>{getConnectionLabel("leads")}</em>
                <MobileChevronRight />
              </button>
            </div>

            <div className="insurance-ws-mobile-connection-health">
              <span><ShieldCheck /></span>
              <div>
                <strong>{t("insuranceWorkspace.connections.healthTitle", { defaultValue: "Connection Health" })}</strong>
                <small>{t("insuranceWorkspace.connections.healthSubtitle", { defaultValue: "Review the live connection status for your workspace integrations." })}</small>
              </div>
              <button type="button" onClick={() => window.location.assign("/dashboard/integrations")}>
                {t("insuranceWorkspace.connections.viewStatus", { defaultValue: "View Status" })}
                <MobileChevronRight size={16} />
              </button>
            </div>
          </section>
          )}

          {activeTab === "Actions" && (
          <section className="insurance-ws-mobile-actions-hub">
            <div className="insurance-ws-mobile-block-heading">
              <h2>{t("insuranceWorkspace.quickActions.title")}</h2>
              <p>{t("insuranceWorkspace.quickActions.subtitle")}</p>
            </div>

            <div className="insurance-ws-mobile-action-grid">
              <button className="blue" type="button" onClick={openCreate}>
                <span><FilePlus2 /></span><div><strong>{t("insuranceWorkspace.quickActions.newPolicy")}</strong><small>{t("insuranceWorkspace.quickActions.newPolicySub")}</small></div>
              </button>
              <button className="purple" type="button" onClick={() => setActiveTab("Claims")}>
                <span><ClipboardList /></span><div><strong>{t("insuranceWorkspace.quickActions.newClaim")}</strong><small>{t("insuranceWorkspace.quickActions.newClaimSub")}</small></div>
              </button>
              <button className="green" type="button" onClick={() => setActiveTab("Quotes")}>
                <span><FileCheck2 /></span><div><strong>{t("insuranceWorkspace.quickActions.newQuote")}</strong><small>{t("insuranceWorkspace.quickActions.newQuoteSub")}</small></div>
              </button>
              <button className="amber" type="button" onClick={() => setActiveTab("Renewals")}>
                <span><RefreshCcw /></span><div><strong>{t("insuranceWorkspace.quickActions.newRenewal")}</strong><small>{t("insuranceWorkspace.quickActions.newRenewalSub")}</small></div>
              </button>
              <button className="pink" type="button" onClick={() => window.location.assign("/dashboard/contacts")}>
                <span><UserPlus /></span><div><strong>{t("insuranceWorkspace.quickActions.addPolicyholder")}</strong><small>{t("insuranceWorkspace.quickActions.addPolicyholderSub")}</small></div>
              </button>
              <button className="cyan" type="button" onClick={() => window.location.assign("/dashboard/contacts")}>
                <span><UsersRound /></span><div><strong>{t("insuranceWorkspace.quickActions.addClient")}</strong><small>{t("insuranceWorkspace.quickActions.addClientSub")}</small></div>
              </button>
              <button className="blue" type="button" onClick={() => setActiveTab("Documents")}>
                <span><FolderOpen /></span><div><strong>{t("insuranceWorkspace.quickActions.documents")}</strong><small>{t("insuranceWorkspace.quickActions.documentsSub")}</small></div>
              </button>
              <button className="green" type="button" onClick={() => setActiveTab("Claims")}>
                <span><ShieldCheck /></span><div><strong>{t("insuranceWorkspace.quickActions.manageClaims")}</strong><small>{t("insuranceWorkspace.quickActions.manageClaimsSub")}</small></div>
              </button>
              <button className="amber" type="button" onClick={() => setActiveTab("Renewals")}>
                <span><CalendarClock /></span><div><strong>{t("insuranceWorkspace.quickActions.upcomingRenewals")}</strong><small>{t("insuranceWorkspace.quickActions.upcomingRenewalsSub")}</small></div>
              </button>
              <button className="purple" type="button" onClick={() => setActiveTab("Commissions")}>
                <span><BadgeDollarSign /></span><div><strong>{t("insuranceWorkspace.quickActions.commissions")}</strong><small>{t("insuranceWorkspace.quickActions.commissionsSub")}</small></div>
              </button>
              <button className="pink" type="button" onClick={() => setActiveTab("Reports")}>
                <span><BarChart3 /></span><div><strong>{t("insuranceWorkspace.quickActions.reports")}</strong><small>{t("insuranceWorkspace.quickActions.reportsSub")}</small></div>
              </button>
              <button className="blue" type="button" onClick={() => window.location.assign("/dashboard/setup")}>
                <span><SlidersHorizontal /></span><div><strong>{t("insuranceWorkspace.quickActions.settings")}</strong><small>{t("insuranceWorkspace.quickActions.settingsSub")}</small></div>
              </button>
            </div>

            <div className="insurance-ws-mobile-support">
              <span><Headphones /></span>
              <div><strong>{t("insuranceWorkspace.quickActions.needHelp")}</strong><small>{t("insuranceWorkspace.quickActions.needHelpSub")}</small></div>
              <button type="button" onClick={() => window.location.assign("/dashboard/help-center")}>
                {t("insuranceWorkspace.quickActions.contactSupport")} <MobileChevronRight size={16}/>
              </button>
            </div>
          </section>
          )}
        </>
      )}

      {/* Policies-by-Type / Activity / Renewals cards belong to the Policies and
          Overview views (both driven by the stats payload). */}
      <div className="insurance-ws-mobile-intel-heading">
        <h2>{t("insuranceWorkspace.insuranceIntelligence")}</h2>
        <p>{t("insuranceWorkspace.intelligenceSubtitle")}</p>
      </div>
      <div className="insurance-ws-bottom">
        <div className="insurance-ws-bottom-card type-card">
          <div className="insurance-ws-card-head">
            <strong>Policies by Type</strong>
            <span>This Month<ChevronDown size={12} /></span>
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
            <span>All Activity<ChevronDown size={12} /></span>
          </div>

          <div className="insurance-ws-activity-list">
            {(stats?.recentActivity || []).length === 0 ? (
              <div className="insurance-ws-activity-row">
                <div>
                  <small>No recent activity</small>
                </div>
              </div>
            ) : (
              stats.recentActivity.slice(0, 4).map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind] || ReceiptText;
                return (
                  <div
                    className="insurance-ws-activity-row"
                    key={`${a.kind}-${a.when}-${i}`}
                  >
                    <span className={`insurance-ws-activity-icon activity-${String(a.kind || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
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
            <span>Next 30 Days<ChevronDown size={12} /></span>
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
