import React, { useEffect, useMemo, useState } from "react";
import "./CustomerServiceWorkspace.css";
import customerServiceApi from "../../api/customerServiceApi";
import CsTicketModal from "./CsTicketModal";
import CsTicketDetail from "./CsTicketDetail";
import CsCustomersSection from "./CsCustomersSection";
import CsKnowledgeBaseSection from "./CsKnowledgeBaseSection";
import CsSlaEscalationsSection from "./CsSlaEscalationsSection";
import CsAutomationSection from "./CsAutomationSection";
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

  return (
    <div className="csw-page">
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
          <div className="csw-section-head">
            <div>
              <h2>Tickets</h2>
              <p>View, manage and resolve customer tickets</p>
            </div>
            <div>
              <button><I name="upload" />Import</button>
              <button><I name="download" />Export</button>
              <button><I name="settings-2" /></button>
              <button className="primary" onClick={() => openModal("create")}>
                <I name="plus" />New Ticket
              </button>
            </div>
          </div>
          <div className="csw-filters">
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
          <div className="csw-table-wrap">
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
          <CsDashboard stats={stats} />
        </>
      ) : tab === "Customers" ? (
        <CsCustomersSection />
      ) : tab === "Knowledge Base" ? (
        <CsKnowledgeBaseSection />
      ) : tab === "SLA & Escalations" ? (
        <CsSlaEscalationsSection />
      ) : tab === "Automation" ? (
        <CsAutomationSection />
      ) : (
        <div className="placeholder">
          <I name={tabs.find((x) => x[1] === tab)?.[0] || "headphones"} size={40} />
          <h2>{tab}</h2>
          <p>{tab} workspace is ready for the next implementation step.</p>
        </div>
      )}

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
    </div>
  );
}
