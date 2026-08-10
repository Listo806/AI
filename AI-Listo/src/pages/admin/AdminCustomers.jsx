import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Percent,
  Gift,
  Search,
  Download,
  Upload,
  Plus,
  Eye,
  Pencil,
  MoreHorizontal,
  X,
  Mail,
  Phone,
  CreditCard,
  Filter,
  ChevronDown,
  Info,
  Receipt,
  Activity as ActivityIcon,
  StickyNote,
} from "lucide-react";
import {
  getCustomersHub,
  getCustomersSummary,
  getCustomerDetail,
  addCustomerNote,
  deleteCustomerNote,
  changeCustomerPlan,
  deactivateCustomer,
  deleteCustomerHub,
  exportCustomersHubCsv,
  importCustomers,
  createCustomer,
  updateCustomerInfo,
  getPlanConfig,
  setPlanConfig,
  resetPlanConfig,
} from "../../api/platformApi";
import AdminPlans from "./AdminPlans";
import "../platform/platform.css";
import "./AdminCustomers.css";

const TABS = [
  { key: "all", label: "All Customers" },
  { key: "registered", label: "Registered (Sign-ups)" },
  { key: "free", label: "Free" },
  { key: "trialing", label: "Trialing" },
  { key: "active", label: "Active Paid" },
  { key: "past_due", label: "Past Due" },
  { key: "canceled", label: "Canceled" },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free ($0)" },
  { value: "solo", label: "Solo ($197)" },
  { value: "business", label: "Business ($347)" },
  { value: "scale", label: "Scale ($497)" },
];

const DONUT_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#06b6d4", "#ef4444", "#94a3b8"];
const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#ea580c", "#db2777", "#0891b2", "#4f46e5", "#16a34a"];

const STATUS_LABEL = {
  active: "Active", free: "Free", trialing: "Trialing", registered: "Registered",
  past_due: "Past Due", canceled: "Canceled", failed: "Failed",
};

const usd = (n) =>
  n == null || isNaN(Number(n))
    ? "—"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (!d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));
const fmtTime = (d) => (!d ? "" : new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
const fmtDateTime = (d) => (!d ? "—" : `${fmtDate(d)} ${fmtTime(d)}`);
const relDays = (d) => {
  if (!d) return "";
  const days = Math.round((new Date(d).getTime() - Date.now()) / 86400000);
  if (isNaN(days)) return "";
  if (days === 0) return "today";
  return days > 0 ? `in ${days} day${days !== 1 ? "s" : ""}` : `${-days} day${days !== -1 ? "s" : ""} ago`;
};
const initials = (name, email) => {
  const base = String(name || "").trim();
  if (base) {
    const p = base.split(/\s+/);
    return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || base[0].toUpperCase();
  }
  return String(email || "?").trim()[0]?.toUpperCase() || "?";
};
const avatarColor = (seed) => {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// CSV parsing for import
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}
function csvToCustomers(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const idx = (names) => header.findIndex((h) => names.includes(h));
  const map = {
    email: idx(["email", "email address"]), name: idx(["name", "full name"]),
    phone: idx(["phone", "phone number"]), plan: idx(["plan", "plan_id", "plan_label"]),
    language: idx(["language", "lang"]), source: idx(["source", "source_label", "signup_source"]),
  };
  const out = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const get = (k) => (map[k] >= 0 ? String(r[map[k]] || "").trim() : "");
    const email = get("email");
    if (!email) continue;
    out.push({ email, name: get("name") || undefined, phone: get("phone") || undefined, plan: get("plan") || undefined, language: get("language") || undefined, source: get("source") || undefined });
  }
  return out;
}

function Donut({ data }) {
  const total = (data || []).reduce((s, d) => s + (d.count || 0), 0) || 1;
  const r = 40, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
      <g transform="translate(48,48) rotate(-90)">
        <circle r={r} fill="none" stroke="#eef2f7" strokeWidth="13" />
        {(data || []).map((d, i) => {
          const frac = (d.count || 0) / total;
          const el = (
            <circle key={i} r={r} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="13"
              strokeDasharray={`${frac * c} ${c - frac * c}`} strokeDashoffset={-acc * c} />
          );
          acc += frac;
          return el;
        })}
      </g>
    </svg>
  );
}

function DonutCard({ title, rows }) {
  const total = (rows || []).reduce((s, r) => s + (r.count || 0), 0) || 1;
  return (
    <div className="cxc-card">
      <div className="cxc-card-title">{title}</div>
      <div className="cxc-donut-body">
        <Donut data={rows} />
        <div className="cxc-legend">
          {(rows || []).length === 0 && <div className="cxc-muted" style={{ fontSize: 12 }}>No data</div>}
          {(rows || []).map((r, i) => (
            <div className="cxc-legend-row" key={r.key}>
              <span className="cxc-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="cxc-legend-key">{r.key}</span>
              <span className="cxc-legend-val">{r.count.toLocaleString()}</span>
              <span className="cxc-legend-pct">{Math.round((r.count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ variant, icon, label, value, sub, subClass }) {
  return (
    <div className={`cxc-kpi cxc-kpi--${variant}`}>
      <div className="cxc-kpi-top">
        <div className="cxc-kpi-icon">{icon}</div>
        <div className="cxc-kpi-label">{label}</div>
      </div>
      <div className="cxc-kpi-value">{value}</div>
      <div className={`cxc-kpi-sub ${subClass || "muted"}`}>{sub}</div>
    </div>
  );
}

function Menu({ open, onClose, children, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);
  if (!open) return null;
  return <div ref={ref} className={`cxc-menu ${className || ""}`}>{children}</div>;
}

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ q: "", plan: "all", billing: "all", paymentStatus: "all", source: "all", language: "all", from: "", to: "" });
  const [moreFilters, setMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState({ id: null, tab: "overview" });
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [changePlanFor, setChangePlanFor] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkMenu, setBulkMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [rowMenu, setRowMenu] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { ...filters, tab, limit: rowsPerPage, offset: (page - 1) * rowsPerPage };
    Promise.all([getCustomersHub(params), getCustomersSummary(params)])
      .then(([list, sum]) => {
        setRows(list?.data || []);
        setTotal(list?.total || 0);
        setSummary(sum || null);
      })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), tab, page, rowsPerPage]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const clearFilters = () => { setPage(1); setFilters({ q: "", plan: "all", billing: "all", paymentStatus: "all", source: "all", language: "all", from: "", to: "" }); };

  const toggleSelect = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((p) => { const n = new Set(p); allChecked ? rows.forEach((r) => n.delete(r.id)) : rows.forEach((r) => n.add(r.id)); return n; });
  const selectedRows = rows.filter((r) => selected.has(r.id));

  const onExport = () => exportCustomersHubCsv({ ...filters, tab }).catch(() => alert("Export failed."));

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const customers = csvToCustomers(parseCsv(await file.text()));
      if (!customers.length) { alert("No rows with an email column were found."); return; }
      const res = await importCustomers(customers);
      const r = res?.data ?? res;
      alert(`Import finished.\nCreated: ${r?.created ?? 0}\nUpdated: ${r?.updated ?? 0}\nSkipped: ${r?.skipped ?? 0}`);
      load();
    } catch (err) { alert(err?.message || "Import failed."); }
    finally { setImporting(false); }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Delete this customer from the list?\n\n${row.email}\n\nRemoves them from Customers and blocks access. Payment records are kept.`)) return;
    try { await deleteCustomerHub(row.id); load(); } catch { alert("Could not delete."); }
  };
  const onDeactivate = async (row) => {
    if (!window.confirm(`Deactivate ${row.email}? They keep their data but cannot sign in.`)) return;
    try { await deactivateCustomer(row.id); load(); } catch { alert("Could not deactivate."); }
  };

  const bulkEmail = () => {
    const emails = selectedRows.map((r) => r.email).filter(Boolean);
    if (!emails.length) return;
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
    setBulkMenu(false);
  };
  const bulkExportSelected = () => {
    if (!selectedRows.length) return;
    const fields = ["email", "name", "phone", "language", "plan_label", "billing", "status", "source_label", "ltv"];
    const header = fields.join(",");
    const body = selectedRows.map((r) => fields.map((f) => {
      const v = r[f] == null ? "" : String(r[f]);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(",")).join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "selected-customers.csv"; a.click(); URL.revokeObjectURL(url);
    setBulkMenu(false);
  };
  const bulkAction = async (fn, label) => {
    if (!selectedRows.length) return;
    if (!window.confirm(`${label} ${selectedRows.length} selected customer(s)?`)) return;
    for (const r of selectedRows) { try { await fn(r.id); } catch { /* continue */ } }
    setSelected(new Set()); setBulkMenu(false); load();
  };

  const oneSelected = () => {
    if (selectedRows.length !== 1) { alert("Select exactly one customer for this action."); return null; }
    return selectedRows[0];
  };

  const kpis = summary?.kpis;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  // Keep the current page in range if the total shrinks (delete, bulk actions,
  // import, refresh) so the admin is never stranded on an empty out-of-range page.
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const pageList = () => {
    const out = [];
    const add = (n) => out.push(n);
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i += 1) add(i); return out; }
    add(1);
    if (page > 3) add("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) add(i);
    if (page < totalPages - 2) add("…");
    add(totalPages);
    return out;
  };

  return (
    <div className="cxc-page">
      {/* cxc-scale shrinks the whole page ~6% per client; kept OFF the modals
          below so their full-screen overlays are never scaled down. */}
      <div className="cxc-scale">
      {/* Header */}
      <div className="cxc-header">
        <div>
          <h1 className="cxc-title">Customers</h1>
          <p className="cxc-sub">All registered accounts, subscriptions, and plans — everything in one place.</p>
        </div>
        <div className="cxc-header-actions">
          <button className="cxc-btn" onClick={onExport}><Download size={15} /> Export CSV</button>
          <label className="cxc-btn" style={{ cursor: "pointer" }}>
            <Upload size={15} /> {importing ? "Importing…" : "Import Customers"}
            <input type="file" accept=".csv,text/csv" onChange={onImportFile} disabled={importing} style={{ display: "none" }} />
          </label>
          <button className="cxc-btn cxc-btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Customer</button>
        </div>
      </div>

      {/* KPI cards (full width) */}
      <div className="cxc-kpis">
        <Kpi variant="blue" icon={<Users size={18} />} label="Total Registered" value={kpis ? kpis.totalRegistered.toLocaleString() : "—"} sub={kpis ? `+${kpis.newThisWeek} this week` : ""} subClass="pos" />
        <Kpi variant="green" icon={<UserCheck size={18} />} label="Active Customers" value={kpis ? kpis.activeCustomers.toLocaleString() : "—"} sub={kpis ? `${kpis.activePctOfTotal}% of total` : ""} subClass="pos" />
        <Kpi variant="purple" icon={<DollarSign size={18} />} label="MRR (Monthly Recurring)" value={kpis ? usd(kpis.mrr) : "—"} sub="Monthly recurring" />
        <Kpi variant="amber" icon={<TrendingUp size={18} />} label="ARR (Annual Recurring)" value={kpis ? usd(kpis.arr) : "—"} sub="Annual recurring" />
        <Kpi variant="teal" icon={<Percent size={18} />} label="Conversion Rate" value={kpis ? `${kpis.conversionRate}%` : "—"} sub="Registered → Paid" />
        <Kpi variant="gold" icon={<Gift size={18} />} label="Free Accounts" value={kpis ? kpis.freeAccounts.toLocaleString() : "—"} sub={kpis ? `${kpis.freePctOfTotal}% of total` : ""} subClass="muted" />
      </div>

      {/* Analytics: funnel + breakdowns — moved ABOVE tabs/filters per client */}
      <div className="cxc-analytics">
        <div className="cxc-card">
          <div className="cxc-card-title">Registration Funnel (this period)</div>
          <div className="cxc-funnel">
            {[
              { n: 1, label: "Registered", v: summary?.funnel?.registered },
              { n: 2, label: "Plan Selected", v: summary?.funnel?.planSelected },
              { n: 3, label: "Checkout Started", v: summary?.funnel?.checkoutStarted },
              { n: 4, label: "Payment Completed", v: summary?.funnel?.paymentCompleted },
            ].map((s, i) => {
              const base = summary?.funnel?.registered || 0;
              return (
                <div className="cxc-funnel-step" key={s.n}>
                  <div className="cxc-funnel-num">{s.n}</div>
                  <div className="cxc-funnel-label">{s.label}</div>
                  <div className="cxc-funnel-value">{(s.v ?? 0).toLocaleString()}</div>
                  {i > 0 && <div className="cxc-funnel-pct">{base ? Math.round(((s.v || 0) / base) * 1000) / 10 : 0}%</div>}
                </div>
              );
            })}
          </div>
        </div>
        <DonutCard title="By Source" rows={summary?.breakdowns?.source} />
        <DonutCard title="By Offer" rows={summary?.breakdowns?.plan} />
        <DonutCard title="By Language" rows={summary?.breakdowns?.language} />
      </div>

      {/* Tabs + filters panel */}
      <div className="cxc-panel">
        <div className="cxc-tabs">
          {TABS.map((tb) => (
            <button key={tb.key} className={`cxc-tab ${tab === tb.key ? "active" : ""}`} onClick={() => { setPage(1); setTab(tb.key); }}>
              {tb.label}
              {summary?.tabs?.[tb.key] != null && <span className="cxc-tab-count">{summary.tabs[tb.key].toLocaleString()}</span>}
            </button>
          ))}
        </div>
        <div className="cxc-filters">
          <div className="cxc-search">
            <Search size={15} color="#94a3b8" />
            <input value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Search by name, email or company" />
          </div>
          <select className="cxc-select" value={filters.plan} onChange={(e) => setFilter("plan", e.target.value)}>
            <option value="all">All Plans</option>
            {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="cxc-select" value={filters.billing} onChange={(e) => setFilter("billing", e.target.value)}>
            <option value="all">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <select className="cxc-select" value={filters.paymentStatus} onChange={(e) => setFilter("paymentStatus", e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="free">Free</option>
            <option value="trial">Trialing</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
          <select className="cxc-select" value={filters.source} onChange={(e) => setFilter("source", e.target.value)}>
            <option value="all">All Sources</option>
            {(summary?.breakdowns?.source || []).map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
          </select>
          <select className="cxc-select" value={filters.language} onChange={(e) => setFilter("language", e.target.value)}>
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
          </select>
          {moreFilters && (
            <>
              <input className="cxc-select" type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} title="From" />
              <input className="cxc-select" type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} title="To" />
            </>
          )}
        </div>
        <div className="cxc-filter-actions">
          <button className="cxc-btn cxc-btn-sm" onClick={() => setMoreFilters((v) => !v)}><Filter size={14} /> {moreFilters ? "Fewer Filters" : "More Filters"}</button>
          <button className="cxc-btn cxc-btn-ghost cxc-btn-sm" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Customer management toolbar (above the table) */}
      <div className="cxc-toolbar">
        <div className="cxc-menu-wrap">
          <button className="cxc-btn" onClick={() => setBulkMenu((v) => !v)}>Bulk Actions ({selected.size} selected) <ChevronDown size={14} /></button>
          <Menu open={bulkMenu} onClose={() => setBulkMenu(false)} className="down">
            <button className="cxc-menu-item" onClick={bulkExportSelected}>Export selected</button>
            <button className="cxc-menu-item" onClick={bulkEmail}>Send email</button>
            <button className="cxc-menu-item" onClick={() => bulkAction(deactivateCustomer, "Deactivate")}>Deactivate</button>
            <button className="cxc-menu-item danger" onClick={() => bulkAction(deleteCustomerHub, "Delete")}>Delete</button>
          </Menu>
        </div>
        <button className="cxc-btn" onClick={() => { const c = oneSelected(); if (c) setChangePlanFor(c); }}>Change Plan</button>
        <button className="cxc-btn" onClick={() => { const c = oneSelected(); if (c) setDetail({ id: c.id, tab: "payments" }); }}>Update Payment</button>
        <button className="cxc-btn" onClick={() => { const c = oneSelected(); if (c) setDetail({ id: c.id, tab: "subscription" }); }}>Add Seat / User</button>
        <button className="cxc-btn" onClick={bulkEmail} disabled={!selected.size}>Send Email</button>
        <button className="cxc-btn" onClick={onExport}>Export</button>
        <div className="cxc-menu-wrap">
          <button className="cxc-btn" onClick={() => setMoreMenu((v) => !v)}>More <ChevronDown size={14} /></button>
          <Menu open={moreMenu} onClose={() => setMoreMenu(false)} className="down">
            <label className="cxc-menu-item" style={{ cursor: "pointer" }}>
              Import customers
              <input type="file" accept=".csv,text/csv" onChange={(e) => { setMoreMenu(false); onImportFile(e); }} style={{ display: "none" }} />
            </label>
            <button className="cxc-menu-item" onClick={() => { setMoreMenu(false); setShowPlans(true); }}>Manage plans</button>
            <button className="cxc-menu-item" onClick={() => { setMoreMenu(false); setShowPlans(true); }}>Create plan</button>
            <button className="cxc-menu-item" onClick={() => { setMoreMenu(false); load(); }}>Refresh</button>
          </Menu>
        </div>
      </div>

      {/* Table (full width) */}
      <div className="cxc-panel">
        <div className="cxc-table-wrap">
          <table className="cxc-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th>Customer</th>
                <th>Plan &amp; Pricing<small>Billing Cycle</small></th>
                <th>Seats / Users</th>
                <th>Next Billing</th>
                <th>Payment Status</th>
                <th>Source</th>
                <th>Registered<small>Date &amp; Time</small></th>
                <th>Last Active</th>
                <th>LTV<small>Total Revenue</small></th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ padding: 20, color: "#64748b" }}>Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={11} style={{ padding: 20, color: "#64748b" }}>No customers match these filters.</td></tr>}
              {!loading && rows.map((r) => {
                const st = r.status;
                return (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                    <td>
                      <div className="cxc-cust-cell">
                        <div className="cxc-avatar" style={{ background: avatarColor(r.email) }}>{initials(r.name, r.email)}</div>
                        <div>
                          <div className="cxc-cust-name">{r.name || "—"}</div>
                          <div className="cxc-cust-email">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cxc-plan-badge">{r.plan_label}{r.plan_id === "business" && <span className="cxc-pop">POPULAR</span>}</div>
                      {r.plan_id !== "free" && r.plan_id !== "unselected"
                        ? <div className="cxc-muted" style={{ fontSize: 12 }}>{usd(r.recurring_amount)} / {r.billing === "annual" ? "year" : "month"}</div>
                        : <div className="cxc-sub-date">{r.billing === "free" ? "No billing" : ""}</div>}
                    </td>
                    <td className="cxc-mono">{r.seat_count ?? 0} / {r.seats_limit ?? "—"}</td>
                    <td>
                      {r.next_billing ? <>{fmtDate(r.next_billing)}<div className="cxc-sub-date">{relDays(r.next_billing)}</div></> : <span className="cxc-muted">—</span>}
                    </td>
                    <td><span className={`cxc-badge ${st}`}>{STATUS_LABEL[st] || st}</span></td>
                    <td>{r.source_label || "—"}</td>
                    <td>{fmtDate(r.registered_at || r.created_at)}<div className="cxc-sub-date">{fmtTime(r.registered_at || r.created_at)}</div></td>
                    <td>{r.last_seen_at ? <>{fmtDate(r.last_seen_at)}<div className="cxc-sub-date">{fmtTime(r.last_seen_at)}</div></> : <span className="cxc-muted">—</span>}</td>
                    <td className="cxc-ltv">{usd(r.ltv)}</td>
                    <td>
                      <div className="cxc-row-actions">
                        <button className="cxc-btn cxc-btn-sm" onClick={() => setDetail({ id: r.id, tab: "overview" })}><Eye size={14} /> View</button>
                        <div className="cxc-menu-wrap">
                          <button className="cxc-icon-btn" title="More" onClick={() => setRowMenu(rowMenu === r.id ? null : r.id)}><MoreHorizontal size={15} /></button>
                          <Menu open={rowMenu === r.id} onClose={() => setRowMenu(null)} className="up-right down">
                            <button className="cxc-menu-item" onClick={() => { setRowMenu(null); setEditCustomer(r); }}>Edit customer</button>
                            <button className="cxc-menu-item" onClick={() => { setRowMenu(null); setChangePlanFor(r); }}>Change plan</button>
                            <button className="cxc-menu-item" onClick={() => { setRowMenu(null); setDetail({ id: r.id, tab: "payments" }); }}>View payments</button>
                            <button className="cxc-menu-item" onClick={() => { setRowMenu(null); onDeactivate(r); }}>Deactivate</button>
                            <button className="cxc-menu-item danger" onClick={() => { setRowMenu(null); onDelete(r); }}>Delete</button>
                          </Menu>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="cxc-pagination">
          <div className="cxc-page-info">
            {total ? `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, total)} of ${total.toLocaleString()} customers` : "No customers"}
          </div>
          <div className="cxc-pages">
            <button className="cxc-page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>«</button>
            {pageList().map((n, i) => n === "…"
              ? <span key={`e${i}`} className="cxc-muted" style={{ padding: "0 4px" }}>…</span>
              : <button key={n} className={`cxc-page-btn ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>)}
            <button className="cxc-page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>»</button>
          </div>
          <div className="cxc-rows">
            Rows per page:
            <select className="cxc-select" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {[10, 20, 50, 100, 200, 500, 1000].map((n) => <option key={n} value={n}>{n.toLocaleString()}</option>)}
            </select>
          </div>
        </div>
      </div>
      </div>{/* end cxc-scale */}

      {detail.id && (
        <CustomerModal
          id={detail.id}
          tab={detail.tab}
          onClose={() => setDetail({ id: null, tab: "overview" })}
          onSelectTab={(t) => setDetail((d) => ({ ...d, tab: t }))}
          onChanged={load}
          onEdit={(c) => setEditCustomer(c)}
          onChangePlan={(c) => setChangePlanFor(c)}
        />
      )}

      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onSuccess={load} />}
      {editCustomer && <EditCustomerModal customer={editCustomer} onClose={() => setEditCustomer(null)} onSuccess={load} />}
      {changePlanFor && <ChangePlanModal customer={changePlanFor} onClose={() => setChangePlanFor(null)} onSuccess={load} />}
      {showPlans && <ManagePlansModal onClose={() => setShowPlans(false)} />}
    </div>
  );
}

/* ---------------- Centered Customer Details modal (matches reference) ---------------- */

function UsageBar({ label, used, limit, display }) {
  const unlimited = limit == null;
  const pct = unlimited ? 8 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const cls = unlimited ? "" : pct >= 100 ? "full" : pct >= 80 ? "warn" : "";
  return (
    <div className="cxc-usage-item">
      <div className="cxc-usage-top">
        <span className="lbl">{label}</span>
        <span className="val">{display || `${used} of ${unlimited ? "unlimited" : limit}`}</span>
      </div>
      <div className="cxc-usage-track"><div className={`cxc-usage-fill ${cls}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

const CUST_TABS = [
  { key: "overview", label: "Overview", icon: <Info size={15} /> },
  { key: "subscription", label: "Subscription", icon: <CreditCard size={15} /> },
  { key: "payments", label: "Payments", icon: <Receipt size={15} /> },
  { key: "activity", label: "Activity", icon: <ActivityIcon size={15} /> },
  { key: "notes", label: "Notes", icon: <StickyNote size={15} /> },
];

function PayStatusBadge({ status }) {
  const ok = status === "succeeded" || status === "completed" || status === "paid";
  return <span className={`cxc-badge ${ok ? "active" : "registered"}`}>{ok ? "Payment succeeded" : (status || "—")}</span>;
}

function CustomerModal({ id, tab, onClose, onSelectTab, onChanged, onEdit, onChangePlan }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const activeTab = tab || "overview";

  const reload = useCallback(() => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    getCustomerDetail(id).then((d) => setData(d)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { reload(); }, [reload]);

  const setTab = (t) => onSelectTab && onSelectTab(t);
  const c = data?.customer;
  const sub = data?.subscription;
  const usage = data?.usage;

  const submitNote = async () => {
    const t = noteText.trim();
    if (!t) return;
    try { await addCustomerNote(id, t); setNoteText(""); reload(); } catch { alert("Could not add note."); }
  };
  const removeNote = async (nid) => { try { await deleteCustomerNote(id, nid); reload(); } catch { /* ignore */ } };
  const doDeactivate = async () => { if (!window.confirm("Deactivate this customer?")) return; await deactivateCustomer(id); onChanged && onChanged(); reload(); setMoreOpen(false); };
  const doDelete = async () => { if (!window.confirm("Delete this customer? Payment records are kept.")) return; await deleteCustomerHub(id); setMoreOpen(false); onChanged && onChanged(); onClose(); };
  const updatePayment = () => alert("The card is held securely by Paddle. Send the customer their billing link to update it, or change it in the Paddle dashboard.");
  const addSeat = () => alert("Seats are set by the plan. Use Change Plan to adjust the seat allowance, or invite members from the Team page.");

  const paymentMethod = c?.paddle_customer_id
    ? <span>Card on file · Paddle <button className="cxc-linkbtn" onClick={updatePayment}>Update</button></span>
    : "—";

  const overviewRows = sub ? [
    ["Plan", <span className="cxc-plan-badge">{sub.plan}{sub.planId === "business" && <span className="cxc-pop">POPULAR</span>}</span>],
    ["Price", sub.isFree ? "$0" : `${usd(sub.recurringAmount)} / ${sub.billingCycle === "annual" ? "year" : "month"}`],
    ["Billing Cycle", sub.isFree ? "—" : (sub.billingCycle === "annual" ? "Annual" : "Monthly")],
    ["Seats / Users", `${c.seat_count ?? 0} / ${sub.seatsLimit}`],
    ["Payment Method", paymentMethod],
    ["Status", <span className={`cxc-badge ${c.status}`}>{STATUS_LABEL[c.status] || c.status}</span>],
    ["Started", fmtDate(sub.startDate)],
    ["Next Billing Date", sub.nextBillingDate ? `${fmtDate(sub.nextBillingDate)} (${relDays(sub.nextBillingDate)})` : "—"],
    ["Source / Offer", `${c.source_label || "—"} / ${c.offer_used || "standard"}`],
  ] : [];

  const payments = data?.payments || [];
  const activity = data?.activity || [];
  const notes = data?.notes || [];

  const PlanUsage = () => (
    <>
      <UsageBar label="Users / Seats" used={c.seat_count ?? 0} limit={sub?.seatsLimit} />
      <UsageBar label="AI conversations" used={usage?.usage?.aiConversationsThisMonth ?? 0} limit={usage?.limits?.aiConversationsPerMonth ?? null} />
      <UsageBar label="Integrations" used={usage?.usage?.integrationsConnected ?? 0} limit={usage?.limits?.integrations ?? null} />
    </>
  );

  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-cust-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-drawer-head">
          <strong style={{ fontSize: 16 }}>Customer Details</strong>
          <button className="cxc-drawer-close" onClick={onClose}>×</button>
        </div>

        {loading && <div className="cxc-cust-modal-body"><div className="cxc-muted" style={{ padding: 24 }}>Loading…</div></div>}
        {!loading && !c && <div className="cxc-cust-modal-body"><div className="cxc-muted" style={{ padding: 24 }}>Customer not found.</div></div>}

        {!loading && c && (
          <div className="cxc-cust-modal-body">
            {/* Left rail: identity + vertical tabs */}
            <aside className="cxc-cust-rail">
              <div className="cxc-cust-idcard">
                <div className="cxc-avatar" style={{ width: 48, height: 48, fontSize: 17, background: avatarColor(c.email) }}>{initials(c.name, c.email)}</div>
                <div className="cxc-cust-idmeta">
                  <div className="cxc-cust-idname">
                    <span className="nm">{c.name || "—"}</span>
                    <span className={`cxc-badge ${c.status}`}>{STATUS_LABEL[c.status] || c.status}</span>
                  </div>
                  {sub?.plan && <span className="cxc-cust-plantag">{sub.plan}</span>}
                </div>
              </div>
              <div className="cxc-cust-contacts">
                <div className="cxc-id-line"><Mail size={13} /> {c.email}</div>
                {c.phone && <div className="cxc-id-line"><Phone size={13} /> {c.phone}</div>}
                <div className="cxc-id-line cxc-mono">ID: {c.id}</div>
              </div>
              <nav className="cxc-cust-nav">
                {CUST_TABS.map((t) => (
                  <button key={t.key} className={`cxc-cust-navitem ${activeTab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <div className="cxc-cust-content">
              {activeTab === "overview" && (
                <>
                  <div className="cxc-cust-grid2">
                    <section className="cxc-cust-block">
                      <div className="cxc-block-title">Account Overview</div>
                      {sub
                        ? overviewRows.map(([k, v], i) => (
                            <div key={i} className="cxc-ov-row"><span className="k">{k}</span><span className="v">{v}</span></div>
                          ))
                        : <div className="cxc-muted" style={{ fontSize: 13 }}>No subscription details.</div>}
                    </section>

                    <section className="cxc-cust-block">
                      <div className="cxc-block-title">Quick Actions</div>
                      <div className="cxc-qa-grid">
                        <button className="cxc-btn cxc-btn-sm" onClick={() => onChangePlan && onChangePlan(c)}>Change Plan</button>
                        <button className="cxc-btn cxc-btn-sm" onClick={updatePayment}>Update Payment Method</button>
                        <button className="cxc-btn cxc-btn-sm" onClick={addSeat}>Add Seat / User</button>
                        <a className="cxc-btn cxc-btn-sm" href={`mailto:${c.email}`}><Mail size={13} /> Send Email</a>
                      </div>
                      <button className="cxc-btn cxc-btn-danger cxc-qa-deact" onClick={doDeactivate}>Deactivate Customer</button>

                      <div className="cxc-qa-notes-head">
                        <span className="cxc-block-title" style={{ margin: 0 }}>Customer Notes</span>
                        <button className="cxc-linkbtn" onClick={() => setTab("notes")}>+ Add Note</button>
                      </div>
                      {notes.length === 0
                        ? <div className="cxc-muted" style={{ fontSize: 12 }}>No notes yet for this customer.</div>
                        : <div className="cxc-qa-notes-list">
                            {notes.slice(0, 3).map((n) => (
                              <div key={n.id} className="cxc-qa-note">
                                <div>{n.note}</div>
                                <div className="cxc-sub-date">{n.author_name || "Admin"} · {fmtDate(n.created_at)}</div>
                              </div>
                            ))}
                          </div>}
                    </section>
                  </div>

                  <div className="cxc-cust-grid3">
                    <section className="cxc-cust-block">
                      <div className="cxc-block-title">Plan Usage</div>
                      <PlanUsage />
                    </section>

                    <section className="cxc-cust-block">
                      <div className="cxc-block-title cxc-block-title--link">Recent Payments <button className="cxc-linkbtn" onClick={() => setTab("payments")}>View All</button></div>
                      {payments.length === 0
                        ? <div className="cxc-muted" style={{ fontSize: 12 }}>No payments yet.</div>
                        : payments.slice(0, 4).map((p) => (
                            <div key={p.id} className="cxc-mini-row">
                              <span className="cxc-sub-date">{fmtDate(p.payment_date || p.created_at)}</span>
                              <strong>{usd(p.amount)}</strong>
                              <PayStatusBadge status={p.status} />
                            </div>
                          ))}
                    </section>

                    <section className="cxc-cust-block">
                      <div className="cxc-block-title cxc-block-title--link">Customer Activity <button className="cxc-linkbtn" onClick={() => setTab("activity")}>View All</button></div>
                      {activity.length === 0
                        ? <div className="cxc-muted" style={{ fontSize: 12 }}>No activity yet.</div>
                        : activity.slice(0, 5).map((a, i) => (
                            <div key={i} className="cxc-mini-row cxc-mini-row--act">
                              <span className="cxc-sub-date">{fmtDateTime(a.at)}</span>
                              <span>{a.label}</span>
                            </div>
                          ))}
                    </section>
                  </div>
                </>
              )}

              {activeTab === "subscription" && (
                <div className="cxc-cust-grid2">
                  <section className="cxc-cust-block">
                    <div className="cxc-block-title">Subscription</div>
                    {sub
                      ? overviewRows.map(([k, v], i) => (
                          <div key={i} className="cxc-ov-row"><span className="k">{k}</span><span className="v">{v}</span></div>
                        ))
                      : <div className="cxc-muted" style={{ fontSize: 13 }}>No subscription details.</div>}
                    <div style={{ marginTop: 12 }}>
                      <button className="cxc-btn cxc-btn-primary cxc-btn-sm" onClick={() => onChangePlan && onChangePlan(c)}>Change Plan</button>
                    </div>
                  </section>
                  <section className="cxc-cust-block">
                    <div className="cxc-block-title">Plan Usage</div>
                    <PlanUsage />
                  </section>
                </div>
              )}

              {activeTab === "payments" && (
                <section className="cxc-cust-block">
                  <div className="cxc-block-title">Payments</div>
                  {payments.length === 0 && <div className="cxc-muted" style={{ fontSize: 13 }}>No recorded payments.</div>}
                  {payments.map((p) => (
                    <div key={p.id} className="cxc-mini-row cxc-mini-row--pay">
                      <span className="cxc-sub-date">{fmtDateTime(p.payment_date || p.created_at)}</span>
                      <strong>{usd(p.amount)} {p.currency || "USD"}</strong>
                      <PayStatusBadge status={p.status} />
                    </div>
                  ))}
                </section>
              )}

              {activeTab === "activity" && (
                <section className="cxc-cust-block">
                  <div className="cxc-block-title">Customer Activity</div>
                  {activity.length === 0 && <div className="cxc-muted" style={{ fontSize: 13 }}>No activity yet.</div>}
                  {activity.map((a, i) => (
                    <div key={i} className="cxc-mini-row cxc-mini-row--act">
                      <span className="cxc-sub-date">{fmtDateTime(a.at)}</span>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </section>
              )}

              {activeTab === "notes" && (
                <section className="cxc-cust-block">
                  <div className="cxc-block-title">Customer Notes</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input className="cxc-input" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note" />
                    <button className="cxc-btn cxc-btn-primary" onClick={submitNote}>Add</button>
                  </div>
                  {notes.length === 0 && <div className="cxc-muted" style={{ fontSize: 13 }}>No notes yet.</div>}
                  {notes.map((n) => (
                    <div key={n.id} className="cxc-note-row">
                      <div>{n.note}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="cxc-sub-date">{n.author_name || "Admin"} · {fmtDateTime(n.created_at)}</span>
                        <button className="cxc-btn cxc-btn-ghost cxc-btn-sm" onClick={() => removeNote(n.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>
        )}

        <div className="cxc-drawer-foot cxc-cust-foot">
          <button className="cxc-btn" onClick={onClose}>Close</button>
          <div className="cxc-toolbar-spacer" />
          <button className="cxc-btn" onClick={() => c && onEdit && onEdit(c)} disabled={!c}><Pencil size={14} /> Edit Customer</button>
          <div className="cxc-menu-wrap">
            <button className="cxc-btn cxc-btn-primary" onClick={() => setMoreOpen((v) => !v)} disabled={!c}>More Actions <ChevronDown size={14} /></button>
            <Menu open={moreOpen} onClose={() => setMoreOpen(false)} className="up-right">
              <button className="cxc-menu-item" onClick={() => { setMoreOpen(false); onChangePlan && onChangePlan(c); }}>Change plan</button>
              <button className="cxc-menu-item" onClick={doDeactivate}>Deactivate</button>
              <button className="cxc-menu-item danger" onClick={doDelete}>Delete</button>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modals ---------------- */

function ChangePlanModal({ customer, onClose, onSuccess }) {
  const [plan, setPlan] = useState(customer?.plan_id && customer.plan_id !== "unselected" ? customer.plan_id : "free");
  const [cycle, setCycle] = useState(customer?.billing === "annual" ? "annual" : "monthly");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setSaving(true); setError("");
    try { await changeCustomerPlan(customer.id, { plan, billingCycle: cycle }); onSuccess && onSuccess(); onClose(); }
    catch (e) { setError(e?.message || "Could not change plan."); }
    finally { setSaving(false); }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head"><h3 className="cxc-modal-title">Change Plan</h3><button className="cxc-drawer-close" onClick={onClose}>×</button></div>
        <div className="cxc-note" style={{ marginBottom: 12 }}>{customer.name || customer.email}</div>
        <div className="cxc-field"><label>Plan</label>
          <select className="cxc-input" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="cxc-field"><label>Billing cycle</label>
          <select className="cxc-input" value={cycle} onChange={(e) => setCycle(e.target.value)} disabled={plan === "free"}>
            <option value="monthly">Monthly</option><option value="annual">Annual</option>
          </select>
        </div>
        {error && <div className="cxc-error">{error}</div>}
        <div className="cxc-note">Updates the account configuration. For a live Paddle subscriber the billing change in Paddle is a separate step.</div>
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>Cancel</button>
          <button className="cxc-btn cxc-btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Change Plan"}</button>
        </div>
      </div>
    </div>
  );
}

function EditCustomerModal({ customer, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: customer?.name || "", phone: customer?.phone || "", language: customer?.language || "en" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    setSaving(true); setError("");
    try { await updateCustomerInfo(customer.id, form); onSuccess && onSuccess(); onClose(); }
    catch (e) { setError(e?.message || "Could not save."); }
    finally { setSaving(false); }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head"><h3 className="cxc-modal-title">Edit Customer</h3><button className="cxc-drawer-close" onClick={onClose}>×</button></div>
        <div className="cxc-note" style={{ marginBottom: 12 }}>{customer.email}</div>
        <div className="cxc-field"><label>Full name</label><input className="cxc-input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="cxc-field"><label>Phone</label><input className="cxc-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="cxc-field"><label>Language</label>
          <select className="cxc-input" value={form.language} onChange={(e) => set("language", e.target.value)}>
            <option value="en">English</option><option value="es">Spanish</option><option value="pt">Portuguese</option>
          </select>
        </div>
        {error && <div className="cxc-error">{error}</div>}
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>Cancel</button>
          <button className="cxc-btn cxc-btn-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function AddCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "free", language: "en" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.email.trim()) { setError("Email is required."); return; }
    setSaving(true); setError("");
    try { await createCustomer(form); onSuccess && onSuccess(); onClose(); }
    catch (e) { setError(e?.message || "Could not add the customer."); }
    finally { setSaving(false); }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head"><h3 className="cxc-modal-title">Add Customer</h3><button className="cxc-drawer-close" onClick={onClose}>×</button></div>
        <div className="cxc-field"><label>Full name</label><input className="cxc-input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="cxc-field"><label>Email address</label><input className="cxc-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="cxc-field"><label>Phone</label><input className="cxc-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="cxc-field"><label>Plan</label>
          <select className="cxc-input" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
            {PLAN_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="cxc-field"><label>Language</label>
          <select className="cxc-input" value={form.language} onChange={(e) => set("language", e.target.value)}>
            <option value="en">English</option><option value="es">Spanish</option><option value="pt">Portuguese</option>
          </select>
        </div>
        {error && <div className="cxc-error">{error}</div>}
        <div className="cxc-note">Creates an account with a random password. Paid plans are recorded as registered until the customer pays.</div>
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>Cancel</button>
          <button className="cxc-btn cxc-btn-primary" onClick={submit} disabled={saving}>{saving ? "Adding…" : "Add Customer"}</button>
        </div>
      </div>
    </div>
  );
}

function ManagePlansModal({ onClose }) {
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head"><h3 className="cxc-modal-title">Plan management</h3><button className="cxc-drawer-close" onClick={onClose}>×</button></div>
        <PlanConfigEditor />
        <div style={{ margin: "16px 0 8px", padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
          Below are the legacy billing-plan records. The live pricing tiers customers check out on are Free, Solo, Business, and Scale.
        </div>
        <AdminPlans />
      </div>
    </div>
  );
}

/* Plan limits & features editor (real enforcement) */
const LIMIT_LABELS = { aiConversationsPerMonth: "AI conversations / month", automationWorkflows: "Automation workflows", integrations: "Integrations", whatsappConnections: "WhatsApp connections" };
const FEATURE_LABELS = {
  crm: "CRM", aiAgent: "AI agent", automations: "Automations", emailSmsMarketing: "Email & SMS marketing",
  calendar: "Calendar", reports: "Reports", advancedAnalytics: "Advanced analytics", teamWorkspace: "Team workspace",
  advancedAutomations: "Advanced automations", workflowsSequences: "Workflows & sequences", customFields: "Custom fields",
  advancedPermissions: "Advanced permissions", whiteLabel: "White label", customObjects: "Custom objects",
  aiWhatsapp: "AI on WhatsApp", aiBooking: "AI appointment booking", aiAppointmentSetter: "AI appointment setter",
  advancedAiAgent: "Advanced AI agent", leadGenerator: "Lead Generator", premiumIntegrations: "Premium integrations",
};
const flabel = (map, k) => map[k] || k;

function PlanConfigEditor() {
  const [plans, setPlans] = useState([]);
  const [enforced, setEnforced] = useState(["free"]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    getPlanConfig().then((d) => { setPlans(d?.plans || []); setEnforced(d?.enforcedPlanIds || ["free"]); }).catch(() => setPlans([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const update = (pid, patch) => setPlans((prev) => prev.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  const save = async (p) => { setSavingId(p.id); try { await setPlanConfig(p.id, { limits: p.limits, features: p.features }); await new Promise((r) => setTimeout(r, 120)); load(); } catch (e) { alert(e?.message || "Could not save."); } finally { setSavingId(null); } };
  const reset = async (p) => { if (!window.confirm(`Reset ${p.label} to defaults?`)) return; setSavingId(p.id); try { await resetPlanConfig(p.id); load(); } catch { /* ignore */ } finally { setSavingId(null); } };
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Plan limits &amp; features</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Controls what the app enforces (usage caps and locked features). Prices are set in Paddle and read-only. Only the Free plan is enforced today.</div>
      {loading && <div className="cxc-muted" style={{ fontSize: 13 }}>Loading…</div>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {plans.map((p) => (
          <div key={p.id} style={{ flex: "1 1 320px", minWidth: 280, border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>{p.label}</strong>
              <span style={{ fontSize: 11, color: "#64748b" }}>{p.isFree ? "$0" : `$${p.pricing.intro} start · $${p.pricing.monthly}/mo`}{enforced.includes(p.id) && <span style={{ marginLeft: 8, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>enforced</span>}</span>
            </div>
            {Object.keys(p.limits || {}).map((k) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#475569" }}>{flabel(LIMIT_LABELS, k)}</span>
                <input className="cxc-input" style={{ width: 110 }} type="number" min="0" placeholder="unlimited"
                  value={p.limits[k] == null ? "" : p.limits[k]}
                  onChange={(e) => update(p.id, { limits: { ...p.limits, [k]: e.target.value === "" ? null : Number(e.target.value) } })} />
              </div>
            ))}
            <details>
              <summary style={{ fontSize: 12, color: "#2563eb", cursor: "pointer", margin: "6px 0" }}>Feature access</summary>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {Object.keys(p.features || {}).map((k) => (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                    <input type="checkbox" checked={!!p.features[k]} onChange={(e) => update(p.id, { features: { ...p.features, [k]: e.target.checked } })} />
                    {flabel(FEATURE_LABELS, k)}
                  </label>
                ))}
              </div>
            </details>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="cxc-btn cxc-btn-primary cxc-btn-sm" disabled={savingId === p.id} onClick={() => save(p)}>{savingId === p.id ? "Saving…" : "Save"}</button>
              {p.overridden && <button className="cxc-btn cxc-btn-sm" disabled={savingId === p.id} onClick={() => reset(p)}>Reset</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
