import React, { useEffect, useMemo, useState } from "react";
import "./CustomerServiceWorkspace.css";
import customerServiceApi from "../../api/customerServiceApi";
import CsTicketModal from "./CsTicketModal";
import CsTicketDetail from "./CsTicketDetail";
import CsCustomersSection from "./CsCustomersSection";
import CsKnowledgeBaseSection from "./CsKnowledgeBaseSection";
import CsSlaEscalationsSection from "./CsSlaEscalationsSection";
import CsAutomationSection from "./CsAutomationSection";
import CsSurveysSection from "./CsSurveysSection";
import CsReportsSection from "./CsReportsSection";
import CsImportModal from "./CsImportModal";
import { relativeTime } from "../sales/salesFormat";

// Customer Service Workspace, wired to real /customer-service data. Only Tickets and
// the Overview dashboard are live in this slice; the other tabs are placeholders for
// the next slices. No hard-coded tickets, KPIs, charts or activity — every figure is
// computed server-side from the authenticated account's records.

const I = ({ name, size = 16 }) => (
  <i data-lucide={name} style={{ width: size, height: size }} />
);

const statTones = ["blue", "green", "purple", "amber", "gold", "indigo"];
const channelIconMap = {
  Web: "globe-2",
  Email: "mail",
  Portal: "monitor",
  Chat: "message-circle",
  Phone: "phone",
  WhatsApp: "message-circle",
};

const tabs = [
  ["settings", "Overview"],
  ["badge-help", "Tickets"],
  ["users", "Customers"],
  ["library", "Knowledge Base"],
  ["alarm-clock", "SLA & Escalations"],
  ["network", "Automation"],
  ["file-chart-column", "Reports"],
  ["clipboard-check", "Surveys"],
];

const STATUS_OPTS = ["Open", "In Progress", "Pending", "On Hold", "Resolved", "Closed"];
const PRIORITY_OPTS = ["Low", "Medium", "High", "Urgent"];
const CHANNEL_OPTS = ["Web", "Email", "Portal", "Chat", "Phone", "WhatsApp"];
const CATEGORY_OPTS = [
  "Account Access",
  "Billing & Payments",
  "Technical Issue",
  "Feature Request",
  "Integration",
  "How-To / Support",
  "Other",
];
const SLA_OPTS = ["On Track", "At Risk", "Breached", "Completed"];

function pct(count, total) {
  if (!total) return "0%";
  return `${((Number(count) / Number(total)) * 100).toFixed(1)}%`;
}

// Colors match the legend dots (.csw-legend .d0..d4) so ring segments line up with
// the labels. Extra tones cover >5 groups.
const DONUT_COLORS = ["#2563eb", "#7c3aed", "#f59e0b", "#22c55e", "#ef4444", "#0891b2", "#64748b"];

// Build the ring fill from REAL data. A flat neutral track when there is no data,
// so the ring never depicts fabricated proportions.
function ringGradient(rows, total) {
  if (!total || !rows || rows.length === 0) return "#e5e7eb";
  let acc = 0;
  const segs = [];
  rows.forEach((r, i) => {
    const start = (acc / total) * 100;
    acc += Number(r.count) || 0;
    const end = (acc / total) * 100;
    segs.push(`${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${end}%`);
  });
  return `conic-gradient(${segs.join(", ")})`;
}
function initials(name) {
  return String(name || "")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statValue(key, stats) {
  switch (key) {
    case "open":
      return { value: (stats?.openTickets?.count ?? 0).toLocaleString("en-US"), sub: "Currently open" };
    case "resolved":
      return { value: (stats?.resolvedThisMonth?.count ?? 0).toLocaleString("en-US"), sub: "This month" };
    case "response":
      return { value: stats?.avgResponseTime?.label || "—", sub: "Goal: < 2h" };
    case "resolution":
      return { value: stats?.avgResolutionTime?.label || "—", sub: "Goal: < 24h" };
    case "csat": {
      const cs = stats?.customerSatisfaction;
      return {
        value: cs?.average != null ? `${cs.average} / ${cs.max ?? 5}` : "—",
        sub: cs?.count ? `Based on ${cs.count} ratings` : "No ratings yet",
      };
    }
    case "sla":
      return {
        value: stats?.slaCompliance?.percent != null ? `${stats.slaCompliance.percent}%` : "—",
        sub: "Goal: > 90%",
      };
    default:
      return { value: "—", sub: "" };
  }
}

const STAT_CONFIG = [
  ["users-round", "Open Tickets", "open"],
  ["circle-check-big", "Tickets Resolved (This Month)", "resolved"],
  ["clock-3", "Avg. Response Time", "response"],
  ["timer-reset", "Avg. Resolution Time", "resolution"],
  ["star", "Customer Satisfaction", "csat"],
  ["shield-check", "SLA Compliance", "sla"],
];

function Donut({ title, rows, total }) {
  const list = rows || [];
  return (
    <div className="csw-panel">
      <div className="csw-panel-head">
        <b>{title}</b>
        <select><option>This Month</option></select>
      </div>
      <div className="csw-donut-body">
        <div className="csw-donut" style={{ background: ringGradient(list, total) }}>
          <div>
            <strong>{(total ?? 0).toLocaleString("en-US")}</strong>
            <span>Total Tickets</span>
          </div>
        </div>
        <div className="csw-legend">
          {list.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No data yet</p>
          ) : (
            list.map((r, i) => (
              <p key={r.label}>
                <i className={`d${i}`} />
                <span>{r.label}</span>
                <b>{r.count} ({pct(r.count, total)})</b>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CsDashboard({ stats }) {
  const total = stats?.totalTickets ?? 0;
  const sla = stats?.slaPerformance || { onTrack: 0, atRisk: 0, breached: 0, completed: 0 };
  const slaTotal = sla.onTrack + sla.atRisk + sla.breached + sla.completed;
  const compliance = stats?.slaCompliance?.percent;
  const activity = stats?.recentActivity || [];
  const agents = stats?.topAgents || [];

  return (
    <div className="csw-bottom">
      <Donut title="Tickets by Status" rows={stats?.ticketsByStatus} total={total} />
      <Donut title="Tickets by Channel" rows={stats?.ticketsByChannel} total={total} />
      <div className="csw-panel csw-sla-panel">
        <div className="csw-panel-head">
          <b>SLA Performance</b>
          <select><option>This Month</option></select>
        </div>
        <div className="csw-sla-content">
          <div className="csw-sla-ring-wrap">
            <div className="csw-sla-ring">
              <div className="csw-sla-ring-center">
                <strong>{compliance != null ? `${compliance}%` : "—"}</strong>
                <span>SLA Compliance</span>
              </div>
            </div>
            <p className="goal">Goal: &gt; 90%</p>
          </div>
          <div className="csw-sla-legend">
            <p><i className="sla-dot on-track" /><span>On Track</span><b>{sla.onTrack} ({pct(sla.onTrack, slaTotal)})</b></p>
            <p><i className="sla-dot at-risk" /><span>At Risk</span><b>{sla.atRisk} ({pct(sla.atRisk, slaTotal)})</b></p>
            <p><i className="sla-dot breached" /><span>Breached</span><b>{sla.breached} ({pct(sla.breached, slaTotal)})</b></p>
          </div>
        </div>
      </div>
      <div className="csw-panel">
        <div className="csw-panel-head">
          <b>Recent Activity</b>
          <select><option>All Activity</option></select>
        </div>
        <div className="mini-list csw-activity-list">
          {activity.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No recent activity</p>
          ) : (
            activity.map((item, i) => (
              <p key={`${item.title}-${i}`}>
                <span className="csw-activity-icon blue">
                  <I name="ticket-check" size={14} />
                </span>
                <span className="csw-activity-copy">
                  <b>{item.title}</b>
                  <small>{item.subtitle}</small>
                </span>
                <time>{relativeTime(item.at)}</time>
              </p>
            ))
          )}
        </div>
      </div>
      <div className="csw-panel">
        <div className="csw-panel-head">
          <b>Top Performing Agents</b>
          <select><option>This Month</option></select>
        </div>
        <div className="agent-list">
          {agents.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No agent activity yet</p>
          ) : (
            agents.map((agent, i) => (
              <p key={agent.name}>
                <b>{i + 1}</b>
                <span className={`avatar a${i % 4}`}>{initials(agent.name)}</span>
                <span className="agent-name">{agent.name}</span>
                <small><b>{agent.resolved}</b></small>
                <small><b>{agent.avgResponseLabel || "—"}</b></small>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerServiceWorkspace() {
  const [tab, setTab] = useState("Overview");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [channel, setChannel] = useState("");
  const [category, setCategory] = useState("");
  const [slaStatus, setSlaStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, status, priority, channel, category, slaStatus, limit]);

  useEffect(() => {
    let alive = true;
    customerServiceApi.getStats().then((s) => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [refreshTick]);

  useEffect(() => {
    if (tab !== "Tickets") return undefined;
    let alive = true;
    setLoading(true);
    customerServiceApi
      .listTickets({
        search: debounced || undefined,
        status: status || undefined,
        priority: priority || undefined,
        channel: channel || undefined,
        category: category || undefined,
        slaStatus: slaStatus || undefined,
        page,
        limit,
      })
      .then((res) => {
        if (!alive) return;
        setTickets(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load tickets.");
        setLoading(false);
      });
    return () => { alive = false; };
  }, [tab, debounced, status, priority, channel, category, slaStatus, page, limit, refreshTick]);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [tab, tickets, stats, loading, modalOpen]);

  const openModal = (mode, id = null) => {
    setModalMode(mode);
    setModalId(id);
    setNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openDetail = (id) => {
    setDetailId(id);
    setDetailOpen(true);
  };
  const handleSaved = () => setRefreshTick((t) => t + 1);

  const goToWorkspaceTab = (nextTab) => {
    setTab(nextTab);
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Export the currently-filtered tickets to CSV. Data comes only from the
  // account-scoped list endpoint and respects the active filters. Paged up to a
  // safety cap; the user is told if the export was capped (no silent truncation).
  const [exporting, setExporting] = useState(false);
  const exportTickets = async () => {
    setExporting(true);
    try {
      const CAP_PAGES = 20; // up to 2000 rows
      const params = {
        search: debounced || undefined,
        status: status || undefined,
        priority: priority || undefined,
        channel: channel || undefined,
        category: category || undefined,
        slaStatus: slaStatus || undefined,
        limit: 100,
      };
      let all = [];
      let p = 1;
      let grandTotal = 0;
      for (; p <= CAP_PAGES; p++) {
        // eslint-disable-next-line no-await-in-loop
        const res = await customerServiceApi.listTickets({ ...params, page: p });
        grandTotal = res?.total || 0;
        const data = res?.data || [];
        all = all.concat(data);
        if (all.length >= grandTotal || data.length === 0) break;
      }
      const esc = (c) => {
        const s = c == null ? "" : String(c);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = ["Ticket ID", "Subject", "Customer", "Email", "Channel", "Category", "Priority", "Status", "SLA Status", "Assigned To", "Created"];
      const lines = [header.join(",")].concat(
        all.map((t) => [t.ticketNumber, t.subject, t.customerName, t.customerEmail, t.channel, t.category, t.priority, t.status, t.slaStatus, t.assignedAgentName, t.createdAt].map(esc).join(",")),
      );
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "customer-service-tickets.csv"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (all.length < grandTotal) {
        // eslint-disable-next-line no-alert
        alert(`Exported ${all.length} of ${grandTotal} tickets (capped). Narrow the filters to export the rest.`);
      }
    } catch {
      // eslint-disable-next-line no-alert
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const reset = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setChannel("");
    setCategory("");
    setSlaStatus("");
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const fmtCreated = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const mobileDescription = {
    Overview: "Deliver amazing support experiences and resolve issues faster.",
    Tickets: "Manage and respond to customer inquiries.",
    Customers: "Manage customer support relationships and history.",
    "Knowledge Base": "Manage support knowledge, guides and help content.",
    "SLA & Escalations": "Manage SLA targets, breaches and escalation rules.",
    Automation: "Automate ticket routing, alerts and support workflows.",
    Reports: "Analyze support performance and operational trends.",
    Surveys: "Gather customer feedback and satisfaction insights.",
  }[tab] || "Deliver amazing support experiences and resolve issues faster.";

  const ticketStatusCount = (label) => {
    const row = (stats?.ticketsByStatus || []).find(
      (item) => String(item?.label || "").toLowerCase() === String(label).toLowerCase(),
    );
    return Number(row?.count || 0);
  };

  const mobileChannelIcon = (value) => {
    const key = String(value || "").toLowerCase();
    if (key === "whatsapp") return "message-circle";
    if (key === "email") return "mail";
    if (key === "phone") return "phone";
    if (key === "chat") return "message-circle-more";
    if (key === "web") return "globe-2";
    return "ticket";
  };

  return (
    <div className="csw-page">
      <div className="csw-mobile-page-head">
        <div>
          <h1>Customer Service Workspace</h1>
          <p>{mobileDescription}</p>
        </div>
        <button type="button" className="csw-mobile-period">
          <I name="calendar-days" size={18} />
          <span>This Month</span>
          <I name="chevron-down" size={16} />
        </button>
      </div>

      <div className="csw-header">
        <div>
          <h1>Customer Service Workspace</h1>
          <p>Deliver amazing support experiences and resolve issues faster.</p>
        </div>
        <div className="csw-header-actions">
          <div className="csw-global-search">
            <I name="search" />
            <input placeholder="Search tickets, customers, agents, or KB..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="primary" onClick={() => openModal("create")}>
            <I name="plus" />
            New Ticket
            <I name="chevron-down" size={13} />
          </button>
        </div>
      </div>

      <h2 className="csw-mobile-overview-title">Overview</h2>
      <div className="csw-stats">
        {STAT_CONFIG.map(([icon, label, key], i) => {
          const { value, sub } = statValue(key, stats);
          return (
            <div className={`csw-stat csw-stat-${statTones[i]}`} key={key}>
              <div>
                <span>{label}</span>
                <em><I name={icon} size={19} /></em>
              </div>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          );
        })}
      </div>

      <div className="csw-tabs">
        {tabs.map((t) => (
          <button key={t[1]} className={tab === t[1] ? "active" : ""} onClick={() => setTab(t[1])}>
            <I name={t[0]} />
            {t[1]}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <CsDashboard stats={stats} />
      ) : tab === "Tickets" ? (
        <>
          <div className="csw-mobile-ticket-toolbar">
            <h2>Tickets</h2>
            <div className="csw-mobile-ticket-search-row">
              <label>
                <I name="search" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets, customers, agents..."
                />
              </label>
              <button type="button" onClick={() => setStatus(status ? "" : "Open")}>
                <I name="list-filter" size={18} />
                <span>Filter</span>
                {(status || priority || channel || category || slaStatus) && <b>1</b>}
              </button>
            </div>

            <div className="csw-mobile-ticket-statuses">
              <button className={!status ? "active" : ""} onClick={() => setStatus("")}>All</button>
              <button className={status === "Open" ? "active" : ""} onClick={() => setStatus("Open")}>
                Open <span className="blue">{ticketStatusCount("Open")}</span>
              </button>
              <button className={status === "In Progress" ? "active" : ""} onClick={() => setStatus("In Progress")}>
                In Progress <span className="amber">{ticketStatusCount("In Progress")}</span>
              </button>
              <button className={status === "On Hold" ? "active" : ""} onClick={() => setStatus("On Hold")}>
                On Hold <span className="orange">{ticketStatusCount("On Hold")}</span>
              </button>
              <button className={status === "Closed" ? "active" : ""} onClick={() => setStatus("Closed")}>
                Closed <span className="green">{ticketStatusCount("Closed")}</span>
              </button>
            </div>
          </div>

          <div className="csw-mobile-ticket-list">
            {loading ? (
              <div className="csw-mobile-empty">Loading…</div>
            ) : error ? (
              <div className="csw-mobile-empty error">{error}</div>
            ) : tickets.length === 0 ? (
              <div className="csw-mobile-empty">No tickets yet.</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  type="button"
                  key={ticket.id}
                  className={`csw-mobile-ticket-card priority-${String(ticket.priority || "medium").toLowerCase()}`}
                  onClick={() => openDetail(ticket.id)}
                >
                  <span className={`csw-mobile-ticket-icon channel-${String(ticket.channel || "web").toLowerCase()}`}>
                    <I name={mobileChannelIcon(ticket.channel)} size={26} />
                  </span>
                  <span className="csw-mobile-ticket-copy">
                    <span className="csw-mobile-ticket-meta">
                      <b>{ticket.ticketNumber || "Ticket"}</b>
                      <i>•</i>
                      <em>{ticket.status || "Open"}</em>
                    </span>
                    <strong>{ticket.subject || "-"}</strong>
                    <small>{ticket.customerName || "-"} {ticket.customerEmail ? ` · ${ticket.customerEmail}` : ""}</small>
                    <small className="muted">
                      <I name="clock-3" size={13} />
                      {relativeTime(ticket.lastActivityAt || ticket.createdAt) || "-"}
                      <I name="tag" size={13} />
                      {ticket.category || ticket.channel || "-"}
                    </small>
                  </span>
                  <span className={`csw-mobile-priority priority-${String(ticket.priority || "medium").toLowerCase()}`}>
                    {ticket.priority || "Medium"}
                  </span>
                  <I name="chevron-right" size={22} />
                </button>
              ))
            )}
          </div>

          <div className="csw-mobile-ticket-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><I name="chevron-left" /></button>
            <span>{page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><I name="chevron-right" /></button>
          </div>

          <div className="csw-mobile-ticket-quick">
            <button onClick={() => openModal("create")}><div><I name="file-plus-2" /></div><span><b>New Ticket</b><small>Create a new ticket</small></span></button>
            <button onClick={() => setStatus("Open")}><div><I name="user-round" /></div><span><b>My Tickets</b><small>View assigned to me</small></span></button>
            <button onClick={() => setSlaStatus("At Risk")}><div><I name="clock-3" /></div><span><b>SLA Alerts</b><small>{ticketStatusCount("At Risk")} tickets breaching</small></span></button>
            <button onClick={() => setStatus("Open")}><div><I name="circle-check-big" /></div><span><b>Unassigned</b><small>Open tickets</small></span></button>
          </div>

          <div className="csw-section-head csw-desktop-only">
            <div>
              <h2>Tickets</h2>
              <p>View, manage and resolve customer tickets</p>
            </div>
            <div>
              <button onClick={() => setImportOpen(true)}><I name="upload" />Import</button>
              <button onClick={exportTickets} disabled={exporting}><I name="download" />{exporting ? "Exporting…" : "Export"}</button>
              <button><I name="settings-2" /></button>
              <button className="primary" onClick={() => openModal("create")}>
                <I name="plus" />New Ticket
              </button>
            </div>
          </div>
          <div className="csw-filters csw-desktop-only">
            <label>
              <I name="search" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status</option>
              {STATUS_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Priority</option>
              {PRIORITY_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="">Channel</option>
              {CHANNEL_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Category</option>
              {CATEGORY_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <select value={slaStatus} onChange={(e) => setSlaStatus(e.target.value)}>
              <option value="">SLA Status</option>
              {SLA_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <button className="reset" onClick={reset}>↻ Reset</button>
          </div>
          <div className="csw-table-wrap csw-desktop-only">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={13} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={13} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={13} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No tickets yet. Create your first ticket to get started.</td></tr>
                ) : (
                  tickets.map((t, i) => (
                    <tr key={t.id}>
                      <td><input type="checkbox" /></td>
                      <td><a onClick={() => openDetail(t.id)} style={{ cursor: "pointer" }}>{t.ticketNumber || "-"}</a></td>
                      <td>{t.subject || "-"}</td>
                      <td>
                        <b>{t.customerName || "-"}</b>
                        {t.customerEmail && <small>{t.customerEmail}</small>}
                      </td>
                      <td>
                        <span className={`csw-channel csw-channel-${String(t.channel || "").toLowerCase()}`}>
                          <I name={channelIconMap[t.channel] || "circle"} size={14} />
                          {t.channel || "-"}
                        </span>
                      </td>
                      <td>{t.category || "-"}</td>
                      <td><span className={`pill ${String(t.priority || "").toLowerCase()}`}>{t.priority || "-"}</span></td>
                      <td><span className="pill blue">{t.status || "-"}</span></td>
                      <td>
                        {t.slaStatus ? (
                          <span className={`pill ${t.slaStatus === "At Risk" || t.slaStatus === "Breached" ? "red" : "green"}`}>{t.slaStatus}</span>
                        ) : "-"}
                      </td>
                      <td>
                        {t.assignedAgentName ? (
                          <>
                            <span className={`avatar a${i % 4}`}>{initials(t.assignedAgentName)}</span>
                            {t.assignedAgentName}
                          </>
                        ) : "Unassigned"}
                      </td>
                      <td>{fmtCreated(t.createdAt)}</td>
                      <td className="recent">{relativeTime(t.lastActivityAt) || "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => openDetail(t.id)}><I name="eye" size={14} /></button>
                          <button onClick={() => openModal("edit", t.id)}><I name="pencil" size={14} /></button>
                          <button onClick={() => openDetail(t.id)}><I name="ellipsis-vertical" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="csw-pagination">
              <span>Showing {from} to {to} of {total.toLocaleString("en-US")} tickets</span>
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
          <div className="csw-desktop-only"><CsDashboard stats={stats} /></div>
        </>
      ) : tab === "Customers" ? (
        <CsCustomersSection />
      ) : tab === "Knowledge Base" ? (
        <CsKnowledgeBaseSection />
      ) : tab === "SLA & Escalations" ? (
        <CsSlaEscalationsSection />
      ) : tab === "Automation" ? (
        <CsAutomationSection />
      ) : tab === "Surveys" ? (
        <CsSurveysSection />
      ) : tab === "Reports" ? (
        <CsReportsSection />
      ) : (
        <div className="placeholder">
          <I name={tabs.find((x) => x[1] === tab)?.[0] || "headphones"} size={40} />
          <h2>{tab}</h2>
          <p>{tab} workspace is ready for the next implementation step.</p>
        </div>
      )}

      <div className="csw-mobile-workspace-label">Workspaces</div>

      <div className="csw-mobile-workspace-tabs-wrap">
        <nav className="csw-mobile-workspace-nav">
          <button
            className={tab === "Overview" ? "active blue" : ""}
            onClick={() => goToWorkspaceTab("Overview")}
          >
            <I name="layout-grid" />
            <span>Overview</span>
          </button>

          <button
            className={tab === "Tickets" ? "active blue" : ""}
            onClick={() => goToWorkspaceTab("Tickets")}
          >
            <I name="ticket" />
            <span>Tickets</span>
          </button>

          <button
            className={tab === "Customers" ? "active blue" : ""}
            onClick={() => goToWorkspaceTab("Customers")}
          >
            <I name="users" />
            <span>Customers</span>
          </button>

          <button
            className={tab === "Knowledge Base" ? "active green" : ""}
            onClick={() => goToWorkspaceTab("Knowledge Base")}
          >
            <I name="library" />
            <span>Knowledge Base</span>
          </button>

          <button
            type="button"
            className={
              mobileMoreOpen ||
              ["SLA & Escalations", "Automation", "Reports", "Surveys"].includes(tab)
                ? "more-open"
                : ""
            }
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((open) => !open)}
          >
            <I name="ellipsis" />
            <span>More</span>
            <I name="chevron-down" size={14} />
          </button>
        </nav>

        {mobileMoreOpen && (
          <div className="csw-mobile-workspace-more-menu">
            <button
              className={tab === "SLA & Escalations" ? "active" : ""}
              onClick={() => goToWorkspaceTab("SLA & Escalations")}
            >
              <I name="alarm-clock" />
              <span>SLA & Escalations</span>
            </button>

            <button
              className={tab === "Automation" ? "active" : ""}
              onClick={() => goToWorkspaceTab("Automation")}
            >
              <I name="network" />
              <span>Automation</span>
            </button>

            <button
              className={tab === "Reports" ? "active" : ""}
              onClick={() => goToWorkspaceTab("Reports")}
            >
              <I name="file-chart-column" />
              <span>Reports</span>
            </button>

            <button
              className={tab === "Surveys" ? "active" : ""}
              onClick={() => goToWorkspaceTab("Surveys")}
            >
              <I name="clipboard-check" />
              <span>Surveys</span>
            </button>
          </div>
        )}
      </div>

      <CsTicketModal
        key={nonce}
        open={modalOpen}
        mode={modalMode}
        recordId={modalId}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      <CsTicketDetail
        open={detailOpen}
        ticketId={detailId}
        onClose={() => setDetailOpen(false)}
        onEdit={(id) => { setDetailOpen(false); openModal("edit", id); }}
        onChanged={handleSaved}
      />

      <CsImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={handleSaved}
      />
    </div>
  );
}
