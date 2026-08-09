import { useCallback, useEffect, useState } from "react";
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
} from "../../api/platformApi";
import AdminPlans from "./AdminPlans";
import "../platform/platform.css";
import "./admin.css";

// Minimal CSV parser (handles quoted fields + commas/newlines) for the import.
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch === "\r") { /* skip */ }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

// Turn a parsed CSV (with a header row) into customer objects, matching common
// column names loosely so exports from this page can be re-imported.
function csvToCustomers(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h).trim().toLowerCase());
  const idx = (names) => header.findIndex((h) => names.includes(h));
  const map = {
    email: idx(["email", "email address"]),
    name: idx(["name", "full name"]),
    phone: idx(["phone", "phone number"]),
    plan: idx(["plan", "plan_id", "plan_label"]),
    language: idx(["language", "lang"]),
    source: idx(["source", "source_label", "signup_source"]),
  };
  const out = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const get = (k) => (map[k] >= 0 ? String(r[map[k]] || "").trim() : "");
    const email = get("email");
    if (!email) continue;
    out.push({
      email,
      name: get("name") || undefined,
      phone: get("phone") || undefined,
      plan: get("plan") || undefined,
      language: get("language") || undefined,
      source: get("source") || undefined,
    });
  }
  return out;
}

const PAGE_SIZE = 10;

const TABS = [
  { key: "all", label: "All Customers" },
  { key: "registered", label: "Registered (Sign-ups)" },
  { key: "free", label: "Free" },
  { key: "trialing", label: "Trialing" },
  { key: "active", label: "Active Paid" },
  { key: "past_due", label: "Past Due" },
  { key: "canceled", label: "Canceled" },
];

const STATUS_STYLE = {
  active: { bg: "#dcfce7", color: "#166534", label: "Active" },
  free: { bg: "#eff6ff", color: "#1d4ed8", label: "Free" },
  trialing: { bg: "#fef9c3", color: "#854d0e", label: "Trialing" },
  registered: { bg: "#f1f5f9", color: "#475569", label: "Registered" },
  past_due: { bg: "#fee2e2", color: "#b91c1c", label: "Past Due" },
  canceled: { bg: "#f3f4f6", color: "#6b7280", label: "Canceled" },
};

const PLAN_OPTIONS = [
  { value: "free", label: "Free ($0)" },
  { value: "solo", label: "Solo ($197)" },
  { value: "business", label: "Business ($347)" },
  { value: "scale", label: "Scale ($497)" },
];

const usd = (n) =>
  n == null || isNaN(Number(n))
    ? "—"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const fmtDateTime = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.registered;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div
      style={{
        flex: "1 1 150px",
        minWidth: 150,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "14px 16px",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {sub != null && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniBreakdown({ title, rows }) {
  const total = (rows || []).reduce((s, r) => s + (r.count || 0), 0) || 1;
  return (
    <div style={{ flex: "1 1 220px", minWidth: 220, border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{title}</div>
      {(rows || []).length === 0 && <div style={{ fontSize: 13, color: "#94a3b8" }}>No data</div>}
      {(rows || []).map((r) => (
        <div key={r.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, gap: 8 }}>
          <span style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.key}</span>
          <span style={{ color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>
            {r.count} ({Math.round((r.count / total) * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function FunnelPanel({ funnel }) {
  if (!funnel) return null;
  const steps = [
    { key: "registered", label: "Registered", value: funnel.registered },
    { key: "planSelected", label: "Plan Selected", value: funnel.planSelected },
    { key: "checkoutStarted", label: "Checkout Started", value: funnel.checkoutStarted },
    { key: "paymentCompleted", label: "Payment Completed", value: funnel.paymentCompleted },
  ];
  const base = funnel.registered || 0;
  return (
    <div style={{ flex: "2 1 360px", minWidth: 320, border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Registration Funnel (this period)</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ flex: "1 1 70px", minWidth: 70 }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{`${i + 1}. ${s.label}`}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{s.value ?? 0}</div>
            {i > 0 && (
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {base ? Math.round(((s.value || 0) / base) * 100) : 0}% of reg.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 };

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({
    q: "",
    plan: "all",
    billing: "all",
    paymentStatus: "all",
    source: "all",
    language: "all",
    from: "",
    to: "",
  });
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [detailId, setDetailId] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const query = { ...filters, tab, limit: PAGE_SIZE, offset };

  const load = useCallback(() => {
    setLoading(true);
    const params = { ...filters, tab, limit: PAGE_SIZE, offset };
    Promise.all([getCustomersHub(params), getCustomersSummary(params)])
      .then(([list, sum]) => {
        setRows(list?.data || []);
        setTotal(list?.total || 0);
        setSummary(sum || null);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), tab, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (k, v) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const clearFilters = () => {
    setOffset(0);
    setFilters({ q: "", plan: "all", billing: "all", paymentStatus: "all", source: "all", language: "all", from: "", to: "" });
  };

  const sources = summary?.breakdowns?.source?.map((s) => s.key) || [];

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  const onExport = async () => {
    try {
      await exportCustomersHubCsv({ ...filters, tab });
    } catch (_e) {
      alert("Export failed. Please try again.");
    }
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const customers = csvToCustomers(parseCsv(text));
      if (!customers.length) {
        alert("No rows with an email column were found in that CSV.");
        return;
      }
      const res = await importCustomers(customers);
      const r = res?.data ?? res;
      alert(
        `Import finished.\nCreated: ${r?.created ?? 0}\nUpdated: ${r?.updated ?? 0}\nSkipped: ${r?.skipped ?? 0}`,
      );
      load();
    } catch (err) {
      alert(err?.message || "Import failed. Please check the CSV and try again.");
    } finally {
      setImporting(false);
    }
  };

  const onDelete = async (row) => {
    if (
      !window.confirm(
        `Delete this customer from the list?\n\n${row.email}\n\nThis removes them from Customers and blocks access. Payment/accounting records are kept.`,
      )
    )
      return;
    try {
      await deleteCustomerHub(row.id);
      load();
    } catch (_e) {
      alert("Could not delete. Please try again.");
    }
  };

  const onDeactivate = async (row) => {
    if (!window.confirm(`Deactivate ${row.email}? They keep their account and data but cannot sign in.`)) return;
    try {
      await deactivateCustomer(row.id);
      load();
    } catch (_e) {
      alert("Could not deactivate. Please try again.");
    }
  };

  const kpis = summary?.kpis;

  return (
    <div className="platform-page" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Customers</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>
            All registered accounts, subscriptions, and plans — everything in one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="crm-btn crm-btn-secondary" onClick={onExport}>
            Export CSV
          </button>
          <label className="crm-btn crm-btn-secondary" style={{ cursor: "pointer", margin: 0 }}>
            {importing ? "Importing…" : "Import Customers"}
            <input type="file" accept=".csv,text/csv" onChange={onImportFile} disabled={importing} style={{ display: "none" }} />
          </label>
          <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setShowPlans(true)}>
            Manage Plans
          </button>
          <button type="button" className="crm-btn crm-btn-primary" onClick={() => setShowAdd(true)}>
            Add Customer
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Kpi label="Total Registered" value={kpis ? kpis.totalRegistered.toLocaleString() : "—"} />
        <Kpi label="Active Customers" value={kpis ? kpis.activeCustomers.toLocaleString() : "—"} />
        <Kpi label="MRR" value={kpis ? usd(kpis.mrr) : "—"} sub="Monthly recurring" />
        <Kpi label="ARR" value={kpis ? usd(kpis.arr) : "—"} sub="Annual recurring" />
        <Kpi label="Conversion Rate" value={kpis ? `${kpis.conversionRate}%` : "—"} sub="Registered → Paid" />
        <Kpi label="Free Accounts" value={kpis ? kpis.freeAccounts.toLocaleString() : "—"} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
        {TABS.map((tb) => {
          const count = summary?.tabs?.[tb.key];
          const activeTab = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => {
                setOffset(0);
                setTab(tb.key);
              }}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: activeTab ? 700 : 500,
                color: activeTab ? "#2563eb" : "#475569",
                borderBottom: activeTab ? "2px solid #2563eb" : "2px solid transparent",
              }}
            >
              {tb.label}
              {count != null && <span style={{ color: "#94a3b8", marginLeft: 6 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Search by name, email or company"
          style={{ ...inputStyle, width: 260, maxWidth: "100%" }}
        />
        <select value={filters.plan} onChange={(e) => setFilter("plan", e.target.value)} style={inputStyle}>
          <option value="all">All Plans</option>
          {PLAN_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={filters.billing} onChange={(e) => setFilter("billing", e.target.value)} style={inputStyle}>
          <option value="all">All Cycles</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
        <select value={filters.paymentStatus} onChange={(e) => setFilter("paymentStatus", e.target.value)} style={inputStyle}>
          <option value="all">All Statuses</option>
          <option value="registered">Registered</option>
          <option value="free">Free</option>
          <option value="trial">Trialing</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
        </select>
        <select value={filters.source} onChange={(e) => setFilter("source", e.target.value)} style={inputStyle}>
          <option value="all">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filters.language} onChange={(e) => setFilter("language", e.target.value)} style={inputStyle}>
          <option value="all">All Languages</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="pt">Portuguese</option>
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilter("from", e.target.value)} style={inputStyle} title="From" />
        <input type="date" value={filters.to} onChange={(e) => setFilter("to", e.target.value)} style={inputStyle} title="To" />
        <button type="button" className="crm-btn crm-btn-secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {/* Funnel + breakdowns */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <FunnelPanel funnel={summary?.funnel} />
        <MiniBreakdown title="By Source" rows={summary?.breakdowns?.source} />
        <MiniBreakdown title="By Plan" rows={summary?.breakdowns?.plan} />
        <MiniBreakdown title="By Language" rows={summary?.breakdowns?.language} />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "8px 12px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <strong style={{ fontSize: 13 }}>{selected.size} selected</strong>
          <button type="button" className="crm-btn crm-btn-secondary" onClick={onExport}>Export</button>
          <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b" }}>
              <th style={{ padding: "8px 8px" }}>
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: "8px 8px" }}>Customer</th>
              <th style={{ padding: "8px 8px" }}>Plan &amp; Pricing</th>
              <th style={{ padding: "8px 8px" }}>Seats</th>
              <th style={{ padding: "8px 8px" }}>Payment</th>
              <th style={{ padding: "8px 8px" }}>Source</th>
              <th style={{ padding: "8px 8px" }}>Registered</th>
              <th style={{ padding: "8px 8px" }}>Last Active</th>
              <th style={{ padding: "8px 8px" }}>LTV</th>
              <th style={{ padding: "8px 8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} style={{ padding: 16, color: "#64748b" }}>Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 16, color: "#64748b" }}>No customers match these filters.</td></tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={{ padding: "8px 8px" }}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.name || "—"}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{r.email}</div>
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    <div style={{ color: "#0f172a" }}>{r.plan_label}</div>
                    {r.plan_id !== "free" && r.plan_id !== "unselected" && (
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {usd(r.recurring_amount)}/{r.billing === "annual" ? "yr" : "mo"}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "8px 8px" }}>{r.seat_count ?? 0} / {r.seats_limit ?? "—"}</td>
                  <td style={{ padding: "8px 8px" }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: "8px 8px" }}>{r.source_label || "—"}</td>
                  <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>{fmtDate(r.registered_at || r.created_at)}</td>
                  <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}>{r.last_seen_at ? fmtDate(r.last_seen_at) : "—"}</td>
                  <td style={{ padding: "8px 8px", color: "#16a34a", fontWeight: 600 }}>{usd(r.ltv)}</td>
                  <td style={{ padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button type="button" className="crm-btn crm-btn-secondary" style={{ padding: "4px 10px" }} onClick={() => setDetailId(r.id)}>View</button>{" "}
                    <a className="crm-btn crm-btn-secondary" style={{ padding: "4px 10px", textDecoration: "none" }} href={`mailto:${r.email}`}>Email</a>{" "}
                    <button type="button" className="crm-btn" style={{ padding: "4px 10px", background: "#fff", color: "#b45309", border: "1px solid #fde68a" }} onClick={() => onDeactivate(r)}>Deactivate</button>{" "}
                    <button type="button" className="crm-btn" style={{ padding: "4px 10px", background: "#fff", color: "#b91c1c", border: "1px solid #fecaca" }} onClick={() => onDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <button type="button" className="crm-btn crm-btn-secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Prev</button>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {total ? `${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}` : "0"}
        </span>
        <button type="button" className="crm-btn crm-btn-secondary" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</button>
      </div>

      {detailId && (
        <CustomerDrawer id={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      )}

      {showPlans && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 24, overflowY: "auto" }}
          onClick={() => setShowPlans(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 980, maxWidth: "100%", background: "#fff", borderRadius: 12, padding: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
              <strong style={{ fontSize: 16 }}>Plan management</strong>
              <button type="button" onClick={() => setShowPlans(false)} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>
            <div style={{ margin: "0 12px 8px", padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
              These are the billing plan records. The live pricing tiers customers
              actually check out on are Free, Solo, Business, and Scale.
            </div>
            <AdminPlans />
          </div>
        </div>
      )}

      {showAdd && (
        <AddCustomerModal onClose={() => setShowAdd(false)} onSuccess={load} />
      )}
    </div>
  );
}

// ---- Add Customer modal ----------------------------------------------------

function AddCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "free", language: "en" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createCustomer(form);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || "Could not add the customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 24 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", background: "#fff", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Add Customer</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="text" placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Email address" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
          <select value={form.plan} onChange={(e) => set("plan", e.target.value)} style={inputStyle}>
            {PLAN_OPTIONS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
          </select>
          <select value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
          </select>
          {error && <div className="crm-error" style={{ fontSize: 13 }}>{error}</div>}
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            Creates an account with a random password. Paid plans are recorded as registered until the customer pays.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="crm-btn crm-btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Adding…" : "Add Customer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Right-side detail drawer ---------------------------------------------

function CustomerDrawer({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [changing, setChanging] = useState(false);
  const [planForm, setPlanForm] = useState({ plan: "", billingCycle: "monthly" });

  const reload = useCallback(() => {
    setLoading(true);
    getCustomerDetail(id)
      .then((d) => {
        setData(d);
        setPlanForm({
          plan: d?.customer?.plan_id && d.customer.plan_id !== "unselected" ? d.customer.plan_id : "free",
          billingCycle: d?.customer?.billing === "annual" ? "annual" : "monthly",
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const c = data?.customer;

  const submitPlan = async () => {
    setChanging(true);
    try {
      await changeCustomerPlan(id, planForm);
      await reload();
      onChanged && onChanged();
    } catch (e) {
      alert(e?.message || "Could not change plan.");
    } finally {
      setChanging(false);
    }
  };

  const submitNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    try {
      await addCustomerNote(id, text);
      setNoteText("");
      reload();
    } catch (_e) {
      alert("Could not add note.");
    }
  };

  const removeNote = async (noteId) => {
    try {
      await deleteCustomerNote(id, noteId);
      reload();
    } catch (_e) {
      /* ignore */
    }
  };

  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: "#0f172a", fontWeight: 500, textAlign: "right", wordBreak: "break-word" }}>{value ?? "—"}</span>
    </div>
  );

  const DRAWER_TABS = ["overview", "subscription", "payments", "activity", "notes"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, maxWidth: "100%", height: "100%", background: "#fff", overflowY: "auto", padding: 20, boxShadow: "-8px 0 24px rgba(0,0,0,0.08)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Customer Details</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        {loading && <div style={{ color: "#64748b" }}>Loading…</div>}
        {!loading && !c && <div style={{ color: "#64748b" }}>Customer not found.</div>}

        {!loading && c && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{c.name || "—"}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{c.email}</div>
              <div style={{ marginTop: 6 }}><StatusBadge status={c.status} /></div>
            </div>

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "1px solid #e5e7eb", marginBottom: 12 }}>
              {DRAWER_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    border: "none", background: "none", cursor: "pointer", padding: "6px 10px", fontSize: 13, textTransform: "capitalize",
                    fontWeight: tab === t ? 700 : 500, color: tab === t ? "#2563eb" : "#475569",
                    borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div>
                {row("Name", c.name)}
                {row("Email", c.email)}
                {row("Phone", c.phone)}
                {row("Account ID", c.id)}
                {row("Status", (STATUS_STYLE[c.status] || {}).label)}
                {row("Language", c.language)}
                {row("Registered", fmtDateTime(c.registered_at || c.created_at))}
                {row("Last Active", c.last_seen_at ? fmtDateTime(c.last_seen_at) : "—")}
                {row("Source", c.source_label)}
                {row("Plan", c.plan_label)}
                {row("Billing", c.billing)}
                {row("Seats", `${c.seat_count ?? 0} / ${c.seats_limit ?? "—"}`)}
                {row("LTV", usd(c.ltv))}
                {row("Offer used", c.offer_used)}
              </div>
            )}

            {tab === "subscription" && data?.subscription && (
              <div>
                {row("Plan", data.subscription.plan)}
                {row("Status", (STATUS_STYLE[data.subscription.status] || {}).label)}
                {row("Billing cycle", data.subscription.billingCycle || "—")}
                {row("Seats / users", data.subscription.seatsLimit)}
                {row("Intro / start", usd(data.subscription.introAmount))}
                {row("Recurring", data.subscription.isFree ? "—" : `${usd(data.subscription.recurringAmount)}/${data.subscription.billingCycle === "annual" ? "yr" : "mo"}`)}
                {row("Start date", fmtDate(data.subscription.startDate))}
                {row("Next billing", fmtDate(data.subscription.nextBillingDate))}
                {row("Paddle customer", data.subscription.paddleCustomerId)}
                {row("Paddle subscription", data.subscription.paddleSubscriptionId)}

                <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Change plan</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={planForm.plan} onChange={(e) => setPlanForm((f) => ({ ...f, plan: e.target.value }))} style={inputStyle}>
                      {PLAN_OPTIONS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                    <select value={planForm.billingCycle} onChange={(e) => setPlanForm((f) => ({ ...f, billingCycle: e.target.value }))} style={inputStyle} disabled={planForm.plan === "free"}>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                    <button type="button" className="crm-btn crm-btn-primary" onClick={submitPlan} disabled={changing}>
                      {changing ? "Saving…" : "Change Plan"}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                    Updates the account configuration. For a live Paddle subscriber, the Paddle billing change is a separate step.
                  </div>
                </div>
              </div>
            )}

            {tab === "payments" && (
              <div>
                {(!data?.payments || data.payments.length === 0) && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No recorded payments.</div>
                )}
                {(data?.payments || []).map((p) => (
                  <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{usd(p.amount)} {p.currency || "USD"}</strong>
                      <span style={{ color: "#64748b" }}>{p.status}</span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{fmtDateTime(p.payment_date || p.created_at)}</div>
                    {p.transaction_id && <div style={{ color: "#94a3b8", fontSize: 11, wordBreak: "break-all" }}>{p.transaction_id}</div>}
                  </div>
                ))}
              </div>
            )}

            {tab === "activity" && (
              <div>
                {(!data?.activity || data.activity.length === 0) && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No activity yet.</div>
                )}
                {(data?.activity || []).map((a, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <div style={{ color: "#0f172a" }}>{a.label}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{fmtDateTime(a.at)}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "notes" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" className="crm-btn crm-btn-primary" onClick={submitNote}>Add</button>
                </div>
                {(!data?.notes || data.notes.length === 0) && (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No notes yet.</div>
                )}
                {(data?.notes || []).map((n) => (
                  <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <div style={{ color: "#0f172a" }}>{n.note}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                      <span>{n.author_name || "Admin"} · {fmtDateTime(n.created_at)}</span>
                      <button type="button" onClick={() => removeNote(n.id)} style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", fontSize: 12 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Plan usage (real, tracked) */}
            {data?.usage && (
              <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Plan usage</div>
                {row("Plan", data.usage.planLabel)}
                {row("AI conversations (this month)", `${data.usage.usage?.aiConversationsThisMonth ?? 0}${data.usage.limits?.aiConversationsPerMonth != null ? ` / ${data.usage.limits.aiConversationsPerMonth}` : " / unlimited"}`)}
                {row("Integrations", `${data.usage.usage?.integrationsConnected ?? 0}${data.usage.limits?.integrations != null ? ` / ${data.usage.limits.integrations}` : " / unlimited"}`)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
