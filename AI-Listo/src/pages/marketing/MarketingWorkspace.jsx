import React, { useEffect, useState } from "react";
import { icons as lucideIcons } from "lucide-react";
import "./MarketingWorkspace.css";
import marketingApi from "../../api/marketingApi";
import MktCampaignModal from "./MktCampaignModal";
import { money, formatDate, relativeTime } from "../sales/salesFormat";

// Marketing Workspace, wired to real /marketing data. Campaigns and the Overview
// dashboard are live in this slice; the other tabs are placeholders for the next
// slices. No hard-coded campaigns, KPIs, charts or activity — every figure is
// computed server-side from the account's records, and no external ad-platform
// metric is ever fabricated.

const iconAliases = { linkedin: "BriefcaseBusiness", facebook: "Users", google: "Search", search: "Search", "pause-circle": "CirclePause" };
const toPascal = (name = "") => name.split("-").filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
function I({ name, size = 16 }) {
  const iconName = iconAliases[name] || toPascal(name);
  const LucideIcon = lucideIcons[iconName] || lucideIcons.Circle;
  return <LucideIcon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

const statTones = ["blue", "green", "amber", "purple", "teal", "rose", "indigo"];
const STAT_CONFIG = [
  ["send", "Active Campaigns", "active"],
  ["users-round", "Total Leads (This Month)", "leads"],
  ["mail", "Email Open Rate", "open"],
  ["mouse-pointer-2", "Click Through Rate", "ctr"],
  ["flag", "Conversions (This Month)", "conv"],
  ["circle-dollar-sign", "Cost Per Lead", "cpl"],
  ["chart-no-axes-combined", "ROI (This Month)", "roi"],
];
const tabs = [
  ["settings", "Overview"],
  ["badge-dollar-sign", "Campaigns"],
  ["users", "Audiences"],
  ["mail", "Email & SMS"],
  ["panels-top-left", "Forms & Landing Pages"],
  ["network", "Automation"],
  ["file-text", "Content"],
  ["file-chart-column", "Reports"],
  ["target", "Attribution"],
];
const STATUS_OPTS = ["Draft", "Scheduled", "Active", "Paused", "Completed", "Canceled", "Archived"];
const TYPE_OPTS = ["Product Launch", "Webinar", "Nurture", "Paid Search", "Brand Awareness", "Promotion", "Traffic", "Content Offer", "Event", "Other"];

function statValue(key, s) {
  switch (key) {
    case "active": return { value: (s?.activeCampaigns?.count ?? 0).toLocaleString("en-US"), sub: "Currently active" };
    case "leads": return { value: (s?.totalLeads?.count ?? 0).toLocaleString("en-US"), sub: s?.totalLeads?.count ? "Unique leads this month" : "No leads yet" };
    case "open": return { value: s?.emailOpenRate?.percent != null ? `${s.emailOpenRate.percent}%` : "—", sub: s?.emailOpenRate?.delivered ? "Unique opens / delivered" : "No email data yet" };
    case "ctr": return { value: s?.clickThroughRate?.percent != null ? `${s.clickThroughRate.percent}%` : "—", sub: s?.clickThroughRate?.delivered ? "Unique clicks / delivered" : "No email data yet" };
    case "conv": return { value: (s?.conversions?.count ?? 0).toLocaleString("en-US"), sub: "This month" };
    case "cpl": return { value: s?.costPerLead?.amount != null ? money(s.costPerLead.amount) : "—", sub: s?.costPerLead?.leads ? "Spend / leads" : "No leads to attribute" };
    case "roi": return { value: s?.roi?.percent != null ? `${s.roi.percent}%` : "—", sub: s?.roi?.revenue ? "Revenue vs spend" : "No attributed revenue yet" };
    default: return { value: "—", sub: "" };
  }
}

function Donut({ title, rows, total, empty }) {
  const list = rows || [];
  return (
    <div className="mkw-panel">
      <div className="mkw-panel-head"><b>{title}</b><select><option>This Month</option></select></div>
      <div className="mkw-donut-body">
        <div className="mkw-donut"><div><strong>{(total ?? 0).toLocaleString("en-US")}</strong><span>Total Leads</span></div></div>
        <div className="mkw-legend">
          {list.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>{empty}</p>
          ) : list.map((r, i) => (
            <p key={r.label}><i className={`d${i}`} /><span>{r.label}</span><b>{r.count}</b></p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MktDashboard({ stats }) {
  const top = stats?.topCampaigns || [];
  const activity = stats?.recentActivity || [];
  const upcoming = stats?.upcomingCampaigns || [];
  const leadsByChannel = stats?.leadsByChannel || [];
  const totalLeads = stats?.totalLeads?.count ?? 0;
  const leadsOverTime = stats?.leadsOverTime || [];

  return (
    <div className="mkw-bottom">
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Leads Over Time</b><select><option>This Month</option></select></div>
        {leadsOverTime.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, padding: "24px 4px" }}>No lead data yet. This chart fills in as leads and conversions are recorded.</p>
        ) : (
          <div className="line-legend">
            <span><i className="blue" />Total Leads <b>{totalLeads}</b></span>
            <span><i className="green" />Converted Leads <b>{stats?.conversions?.count ?? 0}</b></span>
          </div>
        )}
      </div>
      <Donut title="Leads by Channel" rows={leadsByChannel} total={totalLeads} empty="No lead data yet" />
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Top Performing Campaigns</b><select><option>By spend</option></select></div>
        <div className="rank-list">
          {top.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No campaigns yet</p>
          ) : top.map((c, i) => (
            <p key={`${c.name}-${i}`}>
              <b>{i + 1}</b>
              <span><strong>{c.name || "Untitled"}</strong><small>{money(c.spend)} spend</small></span>
              <em>{c.leads} leads<i style={{ width: `${Math.max(10, 90 - i * 12)}%` }} /></em>
            </p>
          ))}
        </div>
      </div>
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Recent Activity</b><select><option>All Activity</option></select></div>
        <div className="mini-list mkw-activity-list">
          {activity.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No recent activity</p>
          ) : activity.map((item, i) => (
            <p key={`${item.action}-${i}`}>
              <span className="mkw-mini-icon blue"><I name="activity" size={14} /></span>
              <span><b>{item.action}</b><small>{item.subject || ""}</small></span>
              <time>{relativeTime(item.at)}</time>
            </p>
          ))}
        </div>
      </div>
      <div className="mkw-panel">
        <div className="mkw-panel-head"><b>Upcoming Campaigns</b><select><option>Scheduled</option></select></div>
        <div className="mini-list mkw-upcoming-list">
          {upcoming.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No scheduled campaigns</p>
          ) : upcoming.map((item, i) => (
            <p key={`${item.name}-${i}`}>
              <span className="mkw-mini-icon email"><I name="calendar-days" size={14} /></span>
              <span><b>{item.name}</b><small>{item.campaignType || ""}</small></span>
              <time>{formatDate(item.startDate)}</time>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketingWorkspace() {
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [modalId, setModalId] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debounced, status, type, channel, limit]);

  useEffect(() => {
    let alive = true;
    marketingApi.getStats().then((s) => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, [refreshTick]);

  useEffect(() => {
    if (tab !== "Campaigns") return undefined;
    let alive = true;
    setLoading(true);
    marketingApi.listCampaigns({
      search: debounced || undefined, status: status || undefined,
      campaignType: type || undefined, channel: channel || undefined, page, limit,
    })
      .then((res) => { if (!alive) return; setRows(res?.data || []); setTotal(res?.total || 0); setError(""); setLoading(false); })
      .catch(() => { if (!alive) return; setError("Could not load campaigns."); setLoading(false); });
    return () => { alive = false; };
  }, [tab, debounced, status, type, channel, page, limit, refreshTick]);

  const openModal = (mode, id = null) => { setModalMode(mode); setModalId(id); setNonce((n) => n + 1); setModalOpen(true); };
  const handleSaved = () => setRefreshTick((t) => t + 1);
  const reset = () => { setSearch(""); setStatus(""); setType(""); setChannel(""); };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const initials = (n) => String(n || "").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mkw-page">
      <div className="mkw-header">
        <div>
          <h1>Marketing Workspace</h1>
          <p>Plan, execute, and optimize campaigns that drive growth.</p>
        </div>
        <div className="mkw-header-actions">
          <div className="mkw-global-search">
            <I name="search" /><input placeholder="Search campaigns, audiences, contacts..." /><kbd>⌘ K</kbd>
          </div>
          <button className="primary" onClick={() => openModal("create")}>
            <I name="plus" />Create<I name="chevron-down" size={13} />
          </button>
        </div>
      </div>

      <div className="mkw-stats">
        {STAT_CONFIG.map(([icon, label, key], i) => {
          const { value, sub } = statValue(key, stats);
          return (
            <div className={`mkw-stat mkw-stat-${statTones[i]}`} key={key}>
              <div><span>{label}</span><em><I name={icon} size={19} /></em></div>
              <strong>{value}</strong>
              <small>{sub}</small>
            </div>
          );
        })}
      </div>

      <div className="mkw-tabs">
        {tabs.map((t) => (
          <button key={t[1]} className={tab === t[1] ? "active" : ""} onClick={() => setTab(t[1])}><I name={t[0]} />{t[1]}</button>
        ))}
      </div>

      {tab === "Overview" ? (
        <MktDashboard stats={stats} />
      ) : tab === "Campaigns" ? (
        <>
          <div className="mkw-section-head">
            <div><h2>Campaigns</h2><p>Manage and track all your marketing campaigns</p></div>
            <div>
              <button><I name="upload" />Import</button>
              <button><I name="download" />Export</button>
              <button><I name="settings-2" /></button>
              <button className="primary" onClick={() => openModal("create")}><I name="plus" />New Campaign</button>
            </div>
          </div>
          <div className="mkw-filters">
            <label><I name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." /></label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Statuses</option>{STATUS_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}</select>
            <select value={type} onChange={(e) => setType(e.target.value)}><option value="">All Types</option>{TYPE_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}</select>
            <input className="mkw-channel-filter" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Channel" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 13 }} />
            <button className="reset" onClick={reset}>↻ Reset</button>
          </div>
          <div className="mkw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>Campaign Name</th><th>Type</th><th>Channel</th><th>Audience</th><th>Status</th>
                  <th>Budget</th><th>Spent</th><th>Leads</th><th>Conv. Rate</th><th>ROI</th><th>Start Date</th><th>Owner</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} style={ST.cell}>Loading…</td></tr>
                ) : error ? (
                  <tr><td colSpan={14} style={{ ...ST.cell, color: "#b91c1c" }}>{error}</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={14} style={ST.cell}>No campaigns yet. Create your first campaign to get started.</td></tr>
                ) : rows.map((c, i) => (
                  <tr key={c.id}>
                    <td><input type="checkbox" /></td>
                    <td><b>{c.name || "-"}</b></td>
                    <td>{c.campaignType || "-"}</td>
                    <td><div className="channels">{String(c.channel || "").split(/[\s,]+/).filter(Boolean).map((x, j) => (<span key={j}><I name={x} size={14} /></span>))}</div></td>
                    <td><b>{c.audienceName || "-"}</b></td>
                    <td><span className={`pill ${String(c.status || "").toLowerCase()}`}>{c.status || "-"}</span></td>
                    <td>{c.budget != null ? money(c.budget) : "-"}</td>
                    <td>{money(c.spend)}</td>
                    <td>{c.leads ?? 0}</td>
                    <td>{c.leads ? `${((c.conversions / c.leads) * 100).toFixed(1)}%` : "-"}</td>
                    <td>-</td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{c.ownerName ? <span className={`avatar a${i % 4}`}>{initials(c.ownerName)}</span> : "-"}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => openModal("view", c.id)}><I name="eye" size={14} /></button>
                        <button onClick={() => openModal("edit", c.id)}><I name="pencil" size={14} /></button>
                        <button onClick={() => openModal("view", c.id)}><I name="ellipsis-vertical" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mkw-pagination">
              <span>Showing {from} to {to} of {total.toLocaleString("en-US")} campaigns</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                <button className="active">{page}</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </div>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value="20">20 / page</option><option value="50">50 / page</option><option value="100">100 / page</option>
              </select>
            </div>
          </div>
          <MktDashboard stats={stats} />
        </>
      ) : (
        <div className="placeholder">
          <I name={tabs.find((x) => x[1] === tab)?.[0] || "megaphone"} size={40} />
          <h2>{tab}</h2>
          <p>{tab} workspace is ready for the next implementation step.</p>
        </div>
      )}

      <MktCampaignModal
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

const ST = { cell: { textAlign: "center", padding: 24, color: "#64748b" } };
