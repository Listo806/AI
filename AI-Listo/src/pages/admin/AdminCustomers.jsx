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
  Globe,
  BriefcaseBusiness,
  Rocket,
  UserRound,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plug,
  Copy,
  MapPin,
  MessageCircle,
  Gauge,
  ShoppingCart,
  CalendarDays,
  Hourglass,
  CircleCheckBig,
  TriangleAlert,
  CircleX,
  Layers3,
  Bookmark,
  Send,
  Languages,
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
  sendCustomerEmail,
  getEmailTemplateCatalog,
  previewCustomerTemplateEmail,
  sendCustomerTemplateEmail,
  getCustomerTeam,
  addCustomerTeamMember,
  changeCustomerMemberRole,
  setCustomerMemberSeat,
  removeCustomerTeamMember,
  transferCustomerOwnership,
  getPlanConfig,
  setPlanConfig,
  resetPlanConfig,
} from "../../api/platformApi";
import aiUnitsApi from "../../api/aiUnitsApi";
import AdminPlans from "./AdminPlans";
import "../platform/platform.css";
import "./AdminCustomers.css";

const TABS = [
  { key: "all", label: "All Customers", Icon: Users },
  { key: "registered", label: "Registered (Sign-ups)", Icon: UserCheck },
  { key: "free", label: "Free", Icon: Gift },
  { key: "checkout_pending", label: "Checkout Pending", Icon: Hourglass },
  { key: "trialing", label: "Trialing", Icon: Hourglass },
  { key: "active", label: "Active Paid", Icon: CircleCheckBig },
  { key: "past_due", label: "Past Due", Icon: TriangleAlert },
  { key: "canceled", label: "Canceled", Icon: CircleX },
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free ($0)" },
  { value: "solo", label: "Solo ($197)" },
  { value: "business", label: "Business ($347)" },
  { value: "scale", label: "Scale ($497)" },
];

// Plan filter only: also lets admins isolate incomplete registrations. NOT added
// to PLAN_OPTIONS because that feeds the assign-plan modals, where "no plan" is not
// an assignable plan.
const PLAN_FILTER_OPTIONS = [
  ...PLAN_OPTIONS,
  { value: "registered", label: "Registered - No Plan" },
];

const DONUT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#06b6d4",
  "#ef4444",
  "#94a3b8",
];
const AVATAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0d9488",
  "#ea580c",
  "#db2777",
  "#0891b2",
  "#4f46e5",
  "#16a34a",
];

const STATUS_LABEL = {
  active: "Active",
  free: "Free",
  checkout_pending: "Checkout Pending",
  trialing: "Trialing",
  registered: "Registered",
  past_due: "Past Due",
  canceled: "Canceled",
  failed: "Failed",
};

const normalizeCustomerPlan = (customer) => {
  const raw = customer?.selected_plan || customer?.plan_id || "";

  const plan = String(raw).trim().toLowerCase();

  if (plan === "team") return "business";
  if (plan === "growth") return "scale";

  return plan;
};

const getCustomerPlanLabel = (customer) => {
  const plan = normalizeCustomerPlan(customer);

  if (plan === "free") return "Free";
  if (plan === "solo") return "Solo";
  if (plan === "business") return "Business";
  if (plan === "scale") return "Scale";

  return customer?.plan_label || "Registered";
};

const getCustomerStatusLabel = (customer, status) => {
  const plan = normalizeCustomerPlan(customer);

  const hasPlan = ["free", "solo", "business", "scale"].includes(plan);

  if (status === "registered") {
    return hasPlan ? "Checkout Pending" : "Registered - No Plan";
  }

  return STATUS_LABEL[status] || status;
};

const usd = (n) =>
  n == null || isNaN(Number(n))
    ? "—"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
const fmtTime = (d) =>
  !d
    ? ""
    : new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
const fmtDateTime = (d) => (!d ? "—" : `${fmtDate(d)} ${fmtTime(d)}`);
const relDays = (d) => {
  if (!d) return "";
  const days = Math.round((new Date(d).getTime() - Date.now()) / 86400000);
  if (isNaN(days)) return "";
  if (days === 0) return "today";
  return days > 0
    ? `in ${days} day${days !== 1 ? "s" : ""}`
    : `${-days} day${days !== -1 ? "s" : ""} ago`;
};
const initials = (name, email) => {
  const base = String(name || "").trim();
  if (base) {
    const p = base.split(/\s+/);
    return (
      ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() ||
      base[0].toUpperCase()
    );
  }
  return (
    String(email || "?")
      .trim()[0]
      ?.toUpperCase() || "?"
  );
};
const avatarColor = (seed) => {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// Registration country display: flag emoji + English country name derived from
// the stored ISO-3166 alpha-2 code. Falls back to the raw code, then to "Unknown".
let REGION_NAMES = null;
try {
  REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  REGION_NAMES = null;
}
const flagEmoji = (code) => {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(
    ...[...cc].map((ch) => 127397 + ch.charCodeAt(0)),
  );
};
const countryName = (code) => {
  const cc = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return cc || "";
  try {
    return (REGION_NAMES && REGION_NAMES.of(cc)) || cc;
  } catch {
    return cc;
  }
};
function CountryCell({ code }) {
  if (!code) return <span className="cxc-muted">Unknown</span>;
  const flag = flagEmoji(code);
  const name = countryName(code);
  return (
    <span className="cxc-country" title={name}>
      {flag ? `${flag} ` : ""}
      {name}
    </span>
  );
}

// CSV parsing for import
function parseCsv(text) {
  const rows = [];
  let field = "",
    row = [],
    q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else q = false;
      } else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}
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

function Donut({ data }) {
  const total = (data || []).reduce((s, d) => s + (d.count || 0), 0) || 1;
  const r = 40,
    c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width="80" height="80" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
      <g transform="translate(48,48) rotate(-90)">
        <circle r={r} fill="none" stroke="#eef2f7" strokeWidth="13" />
        {(data || []).map((d, i) => {
          const frac = (d.count || 0) / total;
          const el = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="13"
              strokeDasharray={`${frac * c} ${c - frac * c}`}
              strokeDashoffset={-acc * c}
            />
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
          {(rows || []).length === 0 && (
            <div className="cxc-muted" style={{ fontSize: 12 }}>
              No data
            </div>
          )}
          {(rows || []).map((r, i) => (
            <div className="cxc-legend-row" key={r.key}>
              <span
                className="cxc-dot"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="cxc-legend-key">{r.key}</span>
              <span className="cxc-legend-val">{r.count.toLocaleString()}</span>
              <span className="cxc-legend-pct">
                {Math.round((r.count / total) * 100)}%
              </span>
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
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={`cxc-menu ${className || ""}`}>
      {children}
    </div>
  );
}

// Combined "Users & Seats" filter: the roles group and the seat-status group in
// one dropdown (replaces the two separate selects) per the approved reference.
// Still drives the same two backend params (usersRole, seatStatus), so a role
// and a seat status can both be active at once.
const USS_ROLE_OPTS = [
  { v: "owner", label: "Owner" },
  { v: "admin", label: "Admin" },
  { v: "agent", label: "Agent / User" },
  { v: "owner_only", label: "Owner Only" },
  { v: "has_additional", label: "Has Additional Users" },
  { v: "multiple", label: "Multiple Users" },
];
const USS_SEAT_OPTS = [
  { v: "available", label: "Seats Available" },
  { v: "full", label: "Seats Full" },
  { v: "one_user", label: "1 User" },
  { v: "multiple_users", label: "Multiple Users" },
  { v: "unused", label: "Unused Seats" },
];

function UsersSeatsFilter({ usersRole, seatStatus, setFilter }) {
  const [open, setOpen] = useState(false);
  const roleLabel = USS_ROLE_OPTS.find((o) => o.v === usersRole)?.label;
  const seatLabel = USS_SEAT_OPTS.find((o) => o.v === seatStatus)?.label;
  const summary =
    [roleLabel, seatLabel].filter(Boolean).join(" · ") || "Users & Seats";
  const active = usersRole !== "all" || seatStatus !== "all";
  return (
    <div className="cxc-uss">
      <button
        type="button"
        className={`cxc-select cxc-uss-btn ${active ? "active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        title="Users & Seats"
      >
        <Users size={14} />
        <span className="cxc-uss-label">{summary}</span>
        <ChevronDown size={14} />
      </button>
      <Menu open={open} onClose={() => setOpen(false)} className="cxc-uss-menu">
        <div className="cxc-uss-head">Users &amp; Seats</div>
        <button
          className={`cxc-uss-item ${usersRole === "all" && seatStatus === "all" ? "sel" : ""}`}
          onClick={() => {
            setFilter("usersRole", "all");
            setFilter("seatStatus", "all");
          }}
        >
          All Users &amp; Seats
        </button>
        {USS_ROLE_OPTS.map((o) => (
          <button
            key={o.v}
            className={`cxc-uss-item ${usersRole === o.v ? "sel" : ""}`}
            onClick={() => setFilter("usersRole", o.v)}
          >
            {o.label}
          </button>
        ))}
        <div className="cxc-uss-div" />
        <button
          className={`cxc-uss-item ${seatStatus === "all" ? "sel" : ""}`}
          onClick={() => setFilter("seatStatus", "all")}
        >
          All Seat Statuses
        </button>
        {USS_SEAT_OPTS.map((o) => (
          <button
            key={o.v}
            className={`cxc-uss-item ${seatStatus === o.v ? "sel" : ""}`}
            onClick={() => setFilter("seatStatus", o.v)}
          >
            {o.label}
          </button>
        ))}
      </Menu>
    </div>
  );
}

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  // Stable Country-filter options: captured from the unfiltered view so picking a
  // country never collapses the dropdown to only that country (this filter exists
  // to compare countries, so you must be able to switch between them freely).
  const [countryOpts, setCountryOpts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({
    q: "",
    plan: "all",
    billing: "all",
    paymentStatus: "all",
    source: "all",
    language: "all",
    country: "all",
    usersRole: "all",
    seatStatus: "all",
    from: "",
    to: "",
  });
  const [moreFilters, setMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState({ id: null, tab: "overview" });
  const [showAdd, setShowAdd] = useState(false);
  const [changePlanFor, setChangePlanFor] = useState(null);
  const [sendEmailFor, setSendEmailFor] = useState(null);
  const [templateEmailFor, setTemplateEmailFor] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulkMenu, setBulkMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [rowMenu, setRowMenu] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      ...filters,
      tab,
      limit: rowsPerPage,
      offset: (page - 1) * rowsPerPage,
    };
    Promise.all([getCustomersHub(params), getCustomersSummary(params)])
      .then(([list, sum]) => {
        setRows(list?.data || []);
        setTotal(list?.total || 0);
        setSummary(sum || null);
        // Refresh the Country dropdown options only from the unfiltered view, so
        // selecting a country keeps the full list available to switch between.
        if ((filters.country || "all") === "all") {
          const cs = sum?.breakdowns?.country;
          if (Array.isArray(cs)) setCountryOpts(cs);
        }
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), tab, page, rowsPerPage]);
  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (k, v) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const clearFilters = () => {
    setPage(1);
    setFilters({
      q: "",
      plan: "all",
      billing: "all",
      paymentStatus: "all",
      source: "all",
      language: "all",
      country: "all",
      usersRole: "all",
      seatStatus: "all",
      from: "",
      to: "",
    });
  };

  const toggleSelect = (id) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((p) => {
      const n = new Set(p);
      allChecked
        ? rows.forEach((r) => n.delete(r.id))
        : rows.forEach((r) => n.add(r.id));
      return n;
    });
  const selectedRows = rows.filter((r) => selected.has(r.id));

  const onExport = () =>
    exportCustomersHubCsv({ ...filters, tab }).catch(() =>
      alert("Export failed."),
    );

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const customers = csvToCustomers(parseCsv(await file.text()));
      if (!customers.length) {
        alert("No rows with an email column were found.");
        return;
      }
      const res = await importCustomers(customers);
      const r = res?.data ?? res;
      alert(
        `Import finished.\nCreated: ${r?.created ?? 0}\nUpdated: ${r?.updated ?? 0}\nSkipped: ${r?.skipped ?? 0}`,
      );
      load();
    } catch (err) {
      alert(err?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const onDelete = async (row) => {
    if (
      !window.confirm(
        `Delete this customer from the list?\n\n${row.email}\n\nRemoves them from Customers and blocks access. Payment records are kept.`,
      )
    )
      return;
    try {
      await deleteCustomerHub(row.id);
      load();
    } catch {
      alert("Could not delete.");
    }
  };
  const onDeactivate = async (row) => {
    if (
      !window.confirm(
        `Deactivate ${row.email}? They keep their data but cannot sign in.`,
      )
    )
      return;
    try {
      await deactivateCustomer(row.id);
      load();
    } catch {
      alert("Could not deactivate.");
    }
  };

  const bulkEmail = () => {
    const emails = selectedRows.map((r) => r.email).filter(Boolean);
    if (!emails.length) return;
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails.join(","))}`;
    setBulkMenu(false);
  };
  const bulkExportSelected = () => {
    if (!selectedRows.length) return;
    const fields = [
      "email",
      "name",
      "phone",
      "language",
      "plan_label",
      "billing",
      "status",
      "source_label",
      "ltv",
    ];
    const header = fields.join(",");
    const body = selectedRows
      .map((r) =>
        fields
          .map((f) => {
            const v = r[f] == null ? "" : String(r[f]);
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
    setBulkMenu(false);
  };
  const bulkAction = async (fn, label) => {
    if (!selectedRows.length) return;
    if (
      !window.confirm(`${label} ${selectedRows.length} selected customer(s)?`)
    )
      return;
    for (const r of selectedRows) {
      try {
        await fn(r.id);
      } catch {
        /* continue */
      }
    }
    setSelected(new Set());
    setBulkMenu(false);
    load();
  };

  const oneSelected = () => {
    if (selectedRows.length !== 1) {
      alert("Select exactly one customer for this action.");
      return null;
    }
    return selectedRows[0];
  };

  const kpis = summary?.kpis;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  // Keep the current page in range if the total shrinks (delete, bulk actions,
  // import, refresh) so the admin is never stranded on an empty out-of-range page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageList = () => {
    const out = [];
    const add = (n) => out.push(n);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) add(i);
      return out;
    }
    add(1);
    if (page > 3) add("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i += 1
    )
      add(i);
    if (page < totalPages - 2) add("…");
    add(totalPages);
    return out;
  };

  const planBreakdown = Array.isArray(summary?.breakdowns?.plan)
    ? summary.breakdowns.plan
    : [];

  const getPlanCount = (...aliases) => {
    const normalizedAliases = aliases.map((v) =>
      String(v).trim().toLowerCase(),
    );

    const match = planBreakdown.find((item) => {
      // Match on the stable machine id first (free/solo/business/scale); the
      // display label (e.g. "Solo ($197)") is not a reliable key.
      const id = String(item?.id ?? "")
        .trim()
        .toLowerCase();
      if (id && normalizedAliases.includes(id)) return true;
      const key = String(
        item?.key ?? item?.plan ?? item?.label ?? item?.name ?? "",
      )
        .trim()
        .toLowerCase();

      return normalizedAliases.includes(key);
    });

    return Number(match?.count ?? match?.value ?? 0) || 0;
  };

  const customersByPlan = [
    {
      key: "free",
      label: "FREE",
      count: getPlanCount("free"),
      price: "Free accounts",
      Icon: UserRound,
      tone: "free",
    },
    {
      key: "solo",
      label: "SOLO",
      count: getPlanCount("solo"),
      price: "$197 / month",
      Icon: UserRound,
      tone: "solo",
    },
    {
      key: "business",
      label: "BUSINESS",
      count: getPlanCount("business", "team"),
      price: "$347 / month",
      Icon: BriefcaseBusiness,
      tone: "business",
    },
    {
      key: "scale",
      label: "SCALE",
      count: getPlanCount("scale", "growth"),
      price: "$497 / month",
      Icon: Rocket,
      tone: "scale",
    },
  ];

  const activeCustomersByPlan = customersByPlan.reduce(
    (sum, planItem) => sum + planItem.count,
    0,
  );

  return (
    <div className="cxc-page">
      {/* cxc-scale shrinks the whole page ~6% per client; kept OFF the modals
          below so their full-screen overlays are never scaled down. */}
      <div className="cxc-scale">
        {/* Header */}
        <div className="cxc-header">
          <div>
            <h1 className="cxc-title">Customers</h1>
            <p className="cxc-sub">
              All registered accounts, subscriptions, and plans — everything in
              one place.
            </p>
          </div>
          <div className="cxc-header-actions">
            <button className="cxc-btn" onClick={onExport}>
              <Download size={15} /> Export CSV
            </button>
            <label className="cxc-btn" style={{ cursor: "pointer" }}>
              <Upload size={15} />{" "}
              {importing ? "Importing…" : "Import Customers"}
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onImportFile}
                disabled={importing}
                style={{ display: "none" }}
              />
            </label>
            <button
              className="cxc-btn cxc-btn-primary"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={15} /> Add Customer
            </button>
          </div>
        </div>

        {/* KPI cards (full width) */}
        <div className="cxc-kpis">
          <Kpi
            variant="blue"
            icon={<Users size={18} />}
            label="Total Registered"
            value={kpis ? kpis.totalRegistered.toLocaleString() : "—"}
            sub={kpis ? `+${kpis.newThisWeek} this week` : ""}
            subClass="pos"
          />
          <Kpi
            variant="green"
            icon={<UserCheck size={18} />}
            label="Active Customers"
            value={kpis ? kpis.activeCustomers.toLocaleString() : "—"}
            sub={kpis ? `${kpis.activePctOfTotal}% of total` : ""}
            subClass="pos"
          />
          <Kpi
            variant="purple"
            icon={<DollarSign size={18} />}
            label="MRR (Monthly Recurring)"
            value={kpis ? usd(kpis.mrr) : "—"}
            sub="Monthly recurring"
          />
          <Kpi
            variant="amber"
            icon={<TrendingUp size={18} />}
            label="ARR (Annual Recurring)"
            value={kpis ? usd(kpis.arr) : "—"}
            sub="Annual recurring"
          />
          <Kpi
            variant="teal"
            icon={<Percent size={18} />}
            label="Conversion Rate"
            value={kpis ? `${kpis.conversionRate}%` : "—"}
            sub="Registered → Paid"
          />
          <Kpi
            variant="gold"
            icon={<Gift size={18} />}
            label="Free Accounts"
            value={kpis ? kpis.freeAccounts.toLocaleString() : "—"}
            sub={kpis ? `${kpis.freePctOfTotal}% of total` : ""}
            subClass="muted"
          />
        </div>

        {/* Analytics: funnel + breakdowns — moved ABOVE tabs/filters per client */}
        <div className="cxc-analytics">
          <div className="cxc-card cxc-plan-customers-card">
            <div className="cxc-plan-customers-head">
              <div>
                <h2>Customers by Plan</h2>
                <p>Customers by their selected plan.</p>
              </div>

              <div className="cxc-active-customers-pill">
                <Users size={15} />
                <strong>
                  {activeCustomersByPlan.toLocaleString()} Customers
                </strong>
              </div>
            </div>

            <div className="cxc-plan-customers-grid">
              {customersByPlan.map(
                ({ key, label, count, price, Icon, tone }) => (
                  <div
                    key={key}
                    className={`cxc-plan-customer-card cxc-plan-customer-card--${tone}`}
                  >
                    <div className="cxc-plan-customer-top">
                      <div className="cxc-plan-customer-icon">
                        <Icon size={27} />
                      </div>
                      <strong>{label}</strong>
                    </div>

                    <div className="cxc-plan-customer-count">
                      {count.toLocaleString()}
                    </div>

                    <div className="cxc-plan-customer-price">{price}</div>
                  </div>
                ),
              )}
            </div>
          </div>
          <DonutCard title="By Source" rows={summary?.breakdowns?.source} />
          <DonutCard title="By Offer" rows={summary?.breakdowns?.plan} />
          <DonutCard title="By Language" rows={summary?.breakdowns?.language} />
        </div>

        {/* Tabs + filters panel */}
        <div className="cxc-panel">
          <div className="cxc-tabs">
            {TABS.map((tb) => {
              const TabIcon = tb.Icon;
              return (
                <button
                  key={tb.key}
                  className={`cxc-tab cxc-tab--${tb.key} ${tab === tb.key ? "active" : ""}`}
                  onClick={() => {
                    setPage(1);
                    setTab(tb.key);
                  }}
                >
                  <span className="cxc-tab-icon" aria-hidden="true">
                    <TabIcon size={20} />
                  </span>
                  <span className="cxc-tab-label">{tb.label}</span>
                  {summary?.tabs?.[tb.key] != null && (
                    <span className="cxc-tab-count">
                      {summary.tabs[tb.key].toLocaleString()}
                    </span>
                  )}
                  <ChevronRight
                    className="cxc-tab-mobile-arrow"
                    size={20}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="cxc-filters">
            <div className="cxc-search">
              <Search size={15} color="#94a3b8" />
              <input
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
                placeholder="Search by name, email or company"
              />
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--plan">
              <Layers3
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.plan}
                onChange={(e) => setFilter("plan", e.target.value)}
              >
                <option value="all">All Plans</option>
                {PLAN_FILTER_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--cycle">
              <CalendarDays
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.billing}
                onChange={(e) => setFilter("billing", e.target.value)}
              >
                <option value="all">All Cycles</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--status">
              <Bookmark
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.paymentStatus}
                onChange={(e) => setFilter("paymentStatus", e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="registered">Registered</option>
                <option value="free">Free</option>
                <option value="checkout_pending">Checkout Pending</option>
                <option value="trialing">Trialing</option>
                <option value="active">Active</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--source">
              <Send
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.source}
                onChange={(e) => setFilter("source", e.target.value)}
              >
                <option value="all">All Sources</option>
                {(summary?.breakdowns?.source || []).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.key}
                  </option>
                ))}
              </select>
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--language">
              <Languages
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.language}
                onChange={(e) => setFilter("language", e.target.value)}
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            <div className="cxc-mobile-filter cxc-mobile-filter--country">
              <Globe
                className="cxc-mobile-filter-icon"
                size={18}
                aria-hidden="true"
              />
              <select
                className="cxc-select"
                value={filters.country}
                onChange={(e) => setFilter("country", e.target.value)}
              >
                <option value="all">All Countries</option>
                {countryOpts.map((cnt) => (
                  <option key={cnt.key} value={cnt.key}>
                    {cnt.key === "Unknown"
                      ? "Unknown"
                      : `${flagEmoji(cnt.key)} ${countryName(cnt.key)}`}
                  </option>
                ))}
              </select>
            </div>

            <UsersSeatsFilter
              usersRole={filters.usersRole}
              seatStatus={filters.seatStatus}
              setFilter={setFilter}
            />

            {moreFilters && (
              <>
                <input
                  className="cxc-select"
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilter("from", e.target.value)}
                  title="From"
                />
                <input
                  className="cxc-select"
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilter("to", e.target.value)}
                  title="To"
                />
              </>
            )}
          </div>

          <div className="cxc-filter-actions">
            <button
              className="cxc-btn cxc-btn-sm"
              onClick={() => setMoreFilters((v) => !v)}
            >
              <Filter size={14} />{" "}
              {moreFilters ? "Fewer Filters" : "More Filters"}
            </button>

            <button
              className="cxc-btn cxc-btn-ghost cxc-btn-sm"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

            <div className="cxc-menu-wrap">
              <button
                className="cxc-btn"
                onClick={() => setBulkMenu((v) => !v)}
              >
                Bulk Actions ({selected.size} selected){" "}
                <ChevronDown size={14} />
              </button>
              <Menu
                open={bulkMenu}
                onClose={() => setBulkMenu(false)}
                className="down"
              >
                <button className="cxc-menu-item" onClick={bulkExportSelected}>
                  Export selected
                </button>
                <button className="cxc-menu-item" onClick={bulkEmail}>
                  Send email
                </button>
                <button
                  className="cxc-menu-item"
                  onClick={() => bulkAction(deactivateCustomer, "Deactivate")}
                >
                  Deactivate
                </button>
                <button
                  className="cxc-menu-item danger"
                  onClick={() => bulkAction(deleteCustomerHub, "Delete")}
                >
                  Delete
                </button>
              </Menu>
            </div>

            <button
              className="cxc-btn"
              onClick={() => {
                const c = oneSelected();
                if (c) setChangePlanFor(c);
              }}
            >
              Change Plan
            </button>

            <button
              className="cxc-btn"
              onClick={() => {
                const c = oneSelected();
                if (c) setDetail({ id: c.id, tab: "payments" });
              }}
            >
              Update Payment
            </button>

            <button
              className="cxc-btn"
              onClick={() => {
                const c = oneSelected();
                if (c) setDetail({ id: c.id, tab: "subscription" });
              }}
            >
              Add Seat / User
            </button>

            <button
              className="cxc-btn"
              onClick={() => {
                const c = oneSelected();
                if (c) setTemplateEmailFor(c);
              }}
              disabled={!selected.size}
            >
              Send Email
            </button>

            <button className="cxc-btn" onClick={onExport}>
              Export
            </button>

            <div className="cxc-menu-wrap">
              <button
                className="cxc-btn"
                onClick={() => setMoreMenu((v) => !v)}
              >
                More <ChevronDown size={14} />
              </button>
              <Menu
                open={moreMenu}
                onClose={() => setMoreMenu(false)}
                className="down"
              >
                <label className="cxc-menu-item" style={{ cursor: "pointer" }}>
                  Import customers
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      setMoreMenu(false);
                      onImportFile(e);
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <button
                  className="cxc-menu-item"
                  onClick={() => {
                    setMoreMenu(false);
                    setShowPlans(true);
                  }}
                >
                  Manage plans
                </button>
                <button
                  className="cxc-menu-item"
                  onClick={() => {
                    setMoreMenu(false);
                    setShowPlans(true);
                  }}
                >
                  Create plan
                </button>
                <button
                  className="cxc-menu-item"
                  onClick={() => {
                    setMoreMenu(false);
                    load();
                  }}
                >
                  Refresh
                </button>
              </Menu>
            </div>
          </div>
        </div>

        {/* Table (full width) */}
        <div className="cxc-panel">
          <div className="cxc-table-wrap">
            <table className="cxc-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Customer</th>
                  <th>
                    Plan &amp; Pricing<small>Billing Cycle</small>
                  </th>
                  <th>Seats / Users</th>
                  <th>Next Billing</th>
                  <th>Payment Status</th>
                  <th>Source</th>
                  <th>Country</th>
                  <th>
                    Registered<small>Date &amp; Time</small>
                  </th>
                  <th>Last Active</th>
                  <th>
                    LTV<small>Total Revenue</small>
                  </th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={12} style={{ padding: 20, color: "#64748b" }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ padding: 20, color: "#64748b" }}>
                      No customers match these filters.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((r) => {
                    const st = r.status;
                    return (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        <td>
                          <div className="cxc-cust-cell">
                            <div
                              className="cxc-avatar"
                              style={{ background: avatarColor(r.email) }}
                            >
                              {initials(r.name, r.email)}
                            </div>
                            <div>
                              <div className="cxc-cust-name">
                                {r.name || "—"}
                              </div>
                              <div className="cxc-cust-email">{r.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cxc-plan-badge">
                            {getCustomerPlanLabel(r)}
                            {normalizeCustomerPlan(r) === "business" && (
                              <span className="cxc-pop">POPULAR</span>
                            )}
                          </div>

                          {normalizeCustomerPlan(r) === "free" ? (
                            <div className="cxc-sub-date">No billing</div>
                          ) : ["solo", "business", "scale"].includes(
                              normalizeCustomerPlan(r),
                            ) ? (
                            <div className="cxc-muted" style={{ fontSize: 12 }}>
                              {usd(
                                r.recurring_amount ||
                                  (normalizeCustomerPlan(r) === "solo"
                                    ? 197
                                    : normalizeCustomerPlan(r) === "business"
                                      ? 347
                                      : 497),
                              )}{" "}
                              /{" "}
                              {r.billing_cycle === "annual" ||
                              r.billing === "annual"
                                ? "year"
                                : "month"}
                            </div>
                          ) : (
                            <div className="cxc-sub-date" />
                          )}
                        </td>
                        <td className="cxc-mono">
                          {r.seat_count ?? 0} / {r.seats_limit ?? "—"}
                        </td>
                        <td>
                          {r.next_billing ? (
                            <>
                              {fmtDate(r.next_billing)}
                              <div className="cxc-sub-date">
                                {relDays(r.next_billing)}
                              </div>
                            </>
                          ) : (
                            <span className="cxc-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`cxc-badge ${st}`}>
                            {getCustomerStatusLabel(r, st)}
                          </span>
                        </td>
                        <td>{r.source_label || "—"}</td>
                        <td>
                          <CountryCell code={r.country} />
                        </td>
                        <td>
                          {fmtDate(r.registered_at || r.created_at)}
                          <div className="cxc-sub-date">
                            {fmtTime(r.registered_at || r.created_at)}
                          </div>
                        </td>
                        <td>
                          {r.last_seen_at ? (
                            <>
                              {fmtDate(r.last_seen_at)}
                              <div className="cxc-sub-date">
                                {fmtTime(r.last_seen_at)}
                              </div>
                            </>
                          ) : (
                            <span className="cxc-muted">—</span>
                          )}
                        </td>
                        <td className="cxc-ltv">{usd(r.ltv)}</td>
                        <td>
                          <div className="cxc-row-actions">
                            <button
                              className="cxc-btn cxc-btn-sm"
                              onClick={() =>
                                setDetail({ id: r.id, tab: "overview" })
                              }
                            >
                              <Eye size={14} /> View
                            </button>
                            <div className="cxc-menu-wrap">
                              <button
                                className="cxc-icon-btn"
                                title="More"
                                onClick={() =>
                                  setRowMenu(rowMenu === r.id ? null : r.id)
                                }
                              >
                                <MoreHorizontal size={15} />
                              </button>
                              <Menu
                                open={rowMenu === r.id}
                                onClose={() => setRowMenu(null)}
                                className="up-right down"
                              >
                                <button
                                  className="cxc-menu-item"
                                  onClick={() => {
                                    setRowMenu(null);
                                    setDetail({ id: r.id, tab: "overview" });
                                  }}
                                >
                                  Edit customer
                                </button>
                                <button
                                  className="cxc-menu-item"
                                  onClick={() => {
                                    setRowMenu(null);
                                    setChangePlanFor(r);
                                  }}
                                >
                                  Change plan
                                </button>
                                <button
                                  className="cxc-menu-item"
                                  onClick={() => {
                                    setRowMenu(null);
                                    setDetail({ id: r.id, tab: "payments" });
                                  }}
                                >
                                  View payments
                                </button>
                                <button
                                  className="cxc-menu-item"
                                  onClick={() => {
                                    setRowMenu(null);
                                    onDeactivate(r);
                                  }}
                                >
                                  Deactivate
                                </button>
                                <button
                                  className="cxc-menu-item danger"
                                  onClick={() => {
                                    setRowMenu(null);
                                    onDelete(r);
                                  }}
                                >
                                  Delete
                                </button>
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
              {total
                ? `Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(page * rowsPerPage, total)} of ${total.toLocaleString()} customers`
                : "No customers"}
            </div>
            <div className="cxc-pages">
              <button
                className="cxc-page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                «
              </button>
              {pageList().map((n, i) =>
                n === "…" ? (
                  <span
                    key={`e${i}`}
                    className="cxc-muted"
                    style={{ padding: "0 4px" }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    className={`cxc-page-btn ${n === page ? "active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                className="cxc-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                »
              </button>
            </div>
            <div className="cxc-rows">
              Rows per page:
              <select
                className="cxc-select"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100, 200, 500, 1000].map((n) => (
                  <option key={n} value={n}>
                    {n.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* end cxc-scale */}

      {detail.id && (
        <CustomerModal
          id={detail.id}
          tab={detail.tab}
          onClose={() => setDetail({ id: null, tab: "overview" })}
          onSelectTab={(t) => setDetail((d) => ({ ...d, tab: t }))}
          onChanged={load}
          onChangePlan={(c) => setChangePlanFor(c)}
          onSendEmail={(c) => setSendEmailFor(c)}
          onSendTemplateEmail={(c) => setTemplateEmailFor(c)}
        />
      )}

      {showAdd && (
        <AddCustomerModal onClose={() => setShowAdd(false)} onSuccess={load} />
      )}
      {sendEmailFor && (
        <SendEmailModal
          customer={sendEmailFor}
          onClose={() => setSendEmailFor(null)}
        />
      )}
      {templateEmailFor && (
        <SendTemplateEmailModal
          customer={templateEmailFor}
          onClose={() => setTemplateEmailFor(null)}
        />
      )}
      {changePlanFor && (
        <ChangePlanModal
          customer={changePlanFor}
          onClose={() => setChangePlanFor(null)}
          onSuccess={load}
        />
      )}
      {showPlans && <ManagePlansModal onClose={() => setShowPlans(false)} />}
    </div>
  );
}

/* ---------------- Centered Customer Details modal (matches reference) ---------------- */

function UsageBar({
  label,
  used,
  limit,
  display,
  icon,
  tone = "purple",
  showIcon = true,
}) {
  const unlimited = limit == null;
  const safeUsed = Number(used || 0);
  const safeLimit = Number(limit || 0);
  const pct = unlimited
    ? 0
    : Math.min(100, Math.round((safeUsed / Math.max(1, safeLimit)) * 100));

  return (
    <div
      className={`cxc-usage-item cxc-usage-item--${tone}`}
      style={
        !showIcon
          ? { gridTemplateColumns: "minmax(0, 1fr) auto" }
          : undefined
      }
    >
      {showIcon && <div className="cxc-usage-icon">{icon}</div>}

      <div className="cxc-usage-main">
        <div className="cxc-usage-top">
          <span className="lbl">{label}</span>
          <span className="val">
            {display || `${safeUsed} of ${unlimited ? "unlimited" : safeLimit}`}
          </span>
        </div>

        <div className="cxc-usage-track">
          <div className="cxc-usage-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <span className="cxc-usage-pct">{unlimited ? "—" : `${pct}%`}</span>
    </div>
  );
}

const CUST_TABS = [
  { key: "overview", label: "Overview", icon: <Info size={15} /> },
  {
    key: "subscription",
    label: "Subscription",
    icon: <CreditCard size={15} />,
  },
  { key: "payments", label: "Payments", icon: <Receipt size={15} /> },
  { key: "activity", label: "Activity", icon: <ActivityIcon size={15} /> },
  { key: "notes", label: "Notes", icon: <StickyNote size={15} /> },
  { key: "team", label: "Team & Seats", icon: <Users size={15} /> },
  { key: "ai", label: "AI Usage", icon: <Zap size={15} /> },
  { key: "integrations", label: "Integrations", icon: <Plug size={15} /> },
];

function PayStatusBadge({ status }) {
  const ok =
    status === "succeeded" || status === "completed" || status === "paid";
  return (
    <span className={`cxc-badge ${ok ? "active" : "registered"}`}>
      {ok ? "Payment succeeded" : status || "—"}
    </span>
  );
}

function CustomerModal({
  id,
  tab,
  onClose,
  onSelectTab,
  onChanged,
  onChangePlan,
  onSendEmail,
  onSendTemplateEmail,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", language: "en" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);
  const [mobileAddingNote, setMobileAddingNote] = useState(false);
  const activeTab = tab || "overview";

  const reload = useCallback(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCustomerDetail(id)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    reload();
  }, [reload]);

  const [aiUnits, setAiUnits] = useState(null);
  useEffect(() => {
    if (!id) {
      setAiUnits(null);
      return;
    }
    let alive = true;
    aiUnitsApi
      .getAdminByUser(id)
      .then((r) => {
        if (alive) setAiUnits(r);
      })
      .catch(() => {
        if (alive) setAiUnits(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const setTab = (t) => onSelectTab && onSelectTab(t);
  const c = data?.customer;
  const sub = data?.subscription;
  const usage = data?.usage;
  const payments = data?.payments || [];
  const activity = data?.activity || [];
  const notes = data?.notes || [];

  useEffect(() => {
    if (c)
      setForm({
        name: c.name || "",
        phone: c.phone || "",
        language: c.language || "en",
      });
  }, [c?.id]);

  const startEdit = () => {
    setTab("overview");
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    if (c)
      setForm({
        name: c.name || "",
        phone: c.phone || "",
        language: c.language || "en",
      });
  };
  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await updateCustomerInfo(id, form);
      setEditing(false);
      onChanged && onChanged();
      reload();
    } catch (e) {
      alert(e?.message || "Could not save the changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const submitNote = async () => {
    const t = noteText.trim();
    if (!t) return;
    try {
      await addCustomerNote(id, t);
      setNoteText("");
      reload();
    } catch {
      alert("Could not add note.");
    }
  };
  const removeNote = async (nid) => {
    try {
      await deleteCustomerNote(id, nid);
      reload();
    } catch {
      /* ignore */
    }
  };
  const doDeactivate = async () => {
    if (!window.confirm("Deactivate this customer?")) return;
    await deactivateCustomer(id);
    onChanged && onChanged();
    reload();
    setMoreOpen(false);
  };
  const doDelete = async () => {
    if (!window.confirm("Delete this customer? Payment records are kept."))
      return;
    await deleteCustomerHub(id);
    setMoreOpen(false);
    onChanged && onChanged();
    onClose();
  };
  const updatePayment = () =>
    alert(
      "The card is held securely by Paddle. Send the customer their billing link to update it, or change it in the Paddle dashboard.",
    );
  const addSeat = () => setTab("team");
  const copyCustomerId = () => {
    if (c?.id && navigator?.clipboard)
      navigator.clipboard.writeText(c.id).catch(() => {});
  };

  const paymentMethod = c?.paddle_customer_id ? "Card on file · Paddle" : "—";
  const statusLabel = c
    ? getCustomerStatusLabel(
        { ...c, plan_id: sub?.planId, plan_label: sub?.plan },
        c.status,
      )
    : "—";
  const planPrice = !sub
    ? "—"
    : sub.isFree
      ? "$0"
      : `${usd(sub.recurringAmount)} / ${sub.billingCycle === "annual" ? "year" : "month"}`;
  const planUsageRows = [
    {
      label: "Users / Seats",
      used: c?.seat_count ?? 0,
      limit: sub?.seatsLimit ?? 0,
      tone: "purple",
      icon: <Users size={20} />,
    },
    {
      label: "AI conversations",
      used: usage?.usage?.aiConversationsThisMonth ?? 0,
      limit: usage?.limits?.aiConversationsPerMonth ?? null,
      tone: "blue",
      icon: <MessageCircle size={20} />,
    },
    {
      label: "Integrations",
      used: usage?.usage?.integrationsConnected ?? 0,
      limit: usage?.limits?.integrations ?? null,
      tone: "green",
      icon: <Plug size={20} />,
    },
  ];

  const PlanUsage = ({ mobile = false }) => (
    <div className={mobile ? "cxc-new-usage-list" : ""}>
      {planUsageRows.map((r) => (
        <UsageBar
          key={r.label}
          label={r.label}
          used={r.used}
          limit={r.limit}
          tone={r.tone}
          icon={r.icon}
          showIcon={mobile}
        />
      ))}
    </div>
  );

  const AiUnitsCard = ({ mobile = false }) => (
    <div className={mobile ? "cxc-mobile-ai-grid" : "cxc-ai-summary-grid"}>
      {!aiUnits ? (
        <div className="cxc-muted">—</div>
      ) : aiUnits.noTeam ? (
        <div className="cxc-muted">No workspace yet.</div>
      ) : aiUnits.unlimited ? (
        <div className="cxc-ai-metric">
          <span>Total remaining</span>
          <strong>Unlimited</strong>
          <small>{aiUnits.plan}</small>
        </div>
      ) : (
        <>
          <div className="cxc-ai-metric cxc-ai-metric--remaining">
            <span>Total remaining</span>

            <strong>{aiUnits.totalRemaining ?? 0}</strong>

            {mobile && (
              <div className="cxc-ai-metric-icon">
                <Gauge size={24} strokeWidth={2} />
              </div>
            )}
          </div>

          <div className="cxc-ai-metric cxc-ai-metric--free">
            <span>Free</span>

            <strong>
              {aiUnits.freeRemaining ?? 0} / {aiUnits.freeAllowance ?? 0}
            </strong>

            {mobile && (
              <div className="cxc-ai-metric-icon">
                <Gift size={24} strokeWidth={2} />
              </div>
            )}
          </div>

          <div className="cxc-ai-metric cxc-ai-metric--purchased">
            <span>Purchased</span>

            <strong>{aiUnits.purchased ?? 0}</strong>

            {mobile && (
              <div className="cxc-ai-metric-icon">
                <ShoppingCart size={24} strokeWidth={2} />
              </div>
            )}
          </div>

          <div className="cxc-ai-metric cxc-ai-metric--reset">
            <span>Resets</span>

            <strong>{aiUnits.cycleReset || "—"}</strong>

            {mobile && (
              <div className="cxc-ai-metric-icon">
                <CalendarDays size={24} strokeWidth={2} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const MoreActionsMenu = ({ mobile = false }) => (
    <div className={`cxc-menu-wrap ${mobile ? "cxc-mobile-more-wrap" : ""}`}>
      <button
        className={mobile ? "cxc-mobile-more-btn" : "cxc-new-action-btn"}
        onClick={() => setMoreOpen((v) => !v)}
        disabled={!c}
      >
        <MoreHorizontal size={16} /> More Actions <ChevronDown size={14} />
      </button>
      <Menu
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        className="up-right down"
      >
        <button
          className="cxc-menu-item"
          onClick={() => {
            setMoreOpen(false);
            onChangePlan && onChangePlan(c);
          }}
        >
          Change plan
        </button>
        <button className="cxc-menu-item" onClick={doDeactivate}>
          Deactivate
        </button>
        <button className="cxc-menu-item danger" onClick={doDelete}>
          Delete
        </button>
      </Menu>
    </div>
  );

  const OverviewFallback = () => (
    <div className="cxc-muted" style={{ padding: 24 }}>
      No subscription details.
    </div>
  );

  return (
    <div className="cxc-modal-overlay cxc-detail-overlay" onClick={onClose}>
      <div
        className="cxc-cust-modal cxc-cust-modal-new"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <div className="cxc-detail-loading">Loading…</div>}
        {!loading && !c && (
          <div className="cxc-detail-loading">Customer not found.</div>
        )}

        {!loading && c && (
          <>
            {/* DESKTOP */}
            <div className="cxc-detail-desktop">
              <div className="cxc-detail-titlebar">
                <div className="cxc-detail-title">
                  <Users size={18} /> Customer Details
                </div>
                <button className="cxc-detail-close" onClick={onClose}>
                  <X size={22} />
                </button>
              </div>

              <div className="cxc-detail-hero">
                <div
                  className="cxc-detail-avatar"
                  style={{ background: avatarColor(c.email) }}
                >
                  {initials(c.name, c.email)}
                </div>
                <div className="cxc-detail-identity">
                  <div className="cxc-detail-name-line">
                    <h2>{c.name || "—"}</h2>
                    <span className="cxc-verified">✓</span>
                  </div>
                  <div className="cxc-detail-badges">
                    <span className={`cxc-badge ${c.status}`}>
                      {statusLabel}
                    </span>
                    <span className="cxc-detail-plan-pill">
                      {sub?.plan || getCustomerPlanLabel(c)}
                    </span>
                  </div>
                  <div className="cxc-detail-contact-line">
                    <span>
                      <Mail size={14} /> {c.email}
                    </span>
                    {c.phone && (
                      <span>
                        <Phone size={14} /> {c.phone}
                      </span>
                    )}
                    <span>
                      <Globe size={14} /> <CountryCell code={c.country} />
                    </span>
                  </div>
                  <button className="cxc-detail-id" onClick={copyCustomerId}>
                    Customer ID: {c.id} <Copy size={13} />
                  </button>
                </div>
                <div className="cxc-detail-actions">
                  <button
                    className="cxc-detail-send"
                    onClick={() =>
                      onSendTemplateEmail
                        ? onSendTemplateEmail(c)
                        : onSendEmail && onSendEmail(c)
                    }
                  >
                    <Mail size={15} /> Send Email
                  </button>
                  <button
                    className="cxc-new-action-btn"
                    onClick={() => onChangePlan && onChangePlan(c)}
                  >
                    <RefreshCw size={15} /> Change Plan
                  </button>
                  <button className="cxc-new-action-btn" onClick={startEdit}>
                    <Pencil size={15} /> Edit Customer
                  </button>
                  <MoreActionsMenu />
                </div>
              </div>

              <div className="cxc-detail-tabs">
                {CUST_TABS.map((t) => (
                  <button
                    key={t.key}
                    className={activeTab === t.key ? "active" : ""}
                    onClick={() => setTab(t.key)}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="cxc-detail-body">
                {editing && (
                  <div className="cxc-new-edit-panel">
                    <input
                      className="cxc-input"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Full name"
                    />
                    <input
                      className="cxc-input"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="Phone"
                    />
                    <select
                      className="cxc-input"
                      value={form.language}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, language: e.target.value }))
                      }
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                    </select>
                    <button className="cxc-btn" onClick={cancelEdit}>
                      Cancel
                    </button>
                    <button
                      className="cxc-btn cxc-btn-primary"
                      onClick={saveEdit}
                      disabled={savingEdit}
                    >
                      {savingEdit ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                )}

                {activeTab === "overview" && (
                  <>
                    <div className="cxc-overview-cards">
                      <section className="cxc-overview-card tone-blue">
                        <div className="cxc-overview-card-title">
                          <LayersIcon /> PLAN & BILLING
                        </div>
                        <div className="cxc-overview-main-label">Plan</div>
                        <div className="cxc-overview-main-value">
                          {sub?.plan || "—"} <span>{planPrice}</span>
                        </div>
                        <div className="cxc-overview-main-label">
                          Billing Cycle
                        </div>
                        <strong>
                          {sub?.isFree
                            ? "—"
                            : sub?.billingCycle === "annual"
                              ? "Annual"
                              : "Monthly"}
                        </strong>
                        <div className="cxc-overview-main-label">
                          Seats / Users
                        </div>
                        <strong>
                          {c.seat_count ?? 0} / {sub?.seatsLimit ?? "—"}
                        </strong>
                        <button onClick={() => onChangePlan && onChangePlan(c)}>
                          Change Plan <ChevronRight size={14} />
                        </button>
                      </section>
                      <section className="cxc-overview-card tone-green">
                        <div className="cxc-overview-card-title">
                          <CreditCard size={17} /> PAYMENT STATUS
                        </div>
                        <div className="cxc-overview-main-label">Status</div>
                        <span className={`cxc-badge ${c.status}`}>
                          {statusLabel}
                        </span>
                        <div className="cxc-overview-main-label">
                          Payment Method
                        </div>
                        <strong>{paymentMethod}</strong>
                        <div className="cxc-overview-main-label">
                          Source / Offer
                        </div>
                        <strong>
                          {c.source_label || "—"} / {c.offer_used || "standard"}
                        </strong>
                        <button onClick={updatePayment}>
                          Update Payment Method <ChevronRight size={14} />
                        </button>
                      </section>
                      <section className="cxc-overview-card tone-purple">
                        <div className="cxc-overview-card-title">
                          <CalendarIcon /> NEXT BILLING
                        </div>
                        <div className="cxc-overview-main-label">
                          Next Billing Date
                        </div>
                        <strong className="cxc-big-date">
                          {sub?.nextBillingDate
                            ? fmtDate(sub.nextBillingDate)
                            : "—"}
                        </strong>
                        <div className="cxc-overview-main-label">Started</div>
                        <strong>
                          {fmtDate(sub?.startDate)}
                          <small>{fmtTime(sub?.startDate)}</small>
                        </strong>
                        <button onClick={() => setTab("subscription")}>
                          View Subscription <ChevronRight size={14} />
                        </button>
                      </section>
                      <section className="cxc-overview-card tone-orange">
                        <div className="cxc-overview-card-title">
                          <Zap size={17} /> AI UNITS
                        </div>
                        <AiUnitsCard />
                        <button onClick={() => setTab("ai")}>
                          Manage AI Units <ChevronRight size={14} />
                        </button>
                      </section>
                      <section className="cxc-overview-card tone-teal">
                        <div className="cxc-overview-card-title">
                          <Users size={17} /> USAGE & SEATS
                        </div>
                        <PlanUsage />
                        <button onClick={() => setTab("team")}>
                          View Usage <ChevronRight size={14} />
                        </button>
                      </section>
                    </div>

                    <div className="cxc-overview-bottom">
                      <section className="cxc-wide-panel cxc-activity-panel">
                        <div className="cxc-new-panel-head">
                          <span>
                            <ActivityIcon size={17} /> RECENT ACTIVITY
                          </span>
                          <button onClick={() => setTab("activity")}>
                            View All Activity
                          </button>
                        </div>
                        <div className="cxc-new-activity-list">
                          {activity.length === 0 ? (
                            <div className="cxc-new-empty">
                              No activity yet.
                            </div>
                          ) : (
                            activity.slice(0, 4).map((a, i) => (
                              <div className="cxc-new-activity-row" key={i}>
                                <span className="cxc-activity-dot">
                                  <ActivityIcon size={14} />
                                </span>
                                <div>
                                  <strong>{a.label}</strong>
                                  <small>{fmtDateTime(a.at)}</small>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <button
                          className="cxc-full-log"
                          onClick={() => setTab("activity")}
                        >
                          View Full Activity Log <ChevronRight size={14} />
                        </button>
                      </section>
                      <div className="cxc-overview-right-stack">
                        <section className="cxc-wide-panel cxc-payments-panel">
                          <div className="cxc-new-panel-head">
                            <span>
                              <CreditCard size={17} /> PAYMENT HISTORY
                            </span>
                            <button onClick={() => setTab("payments")}>
                              View All Payments
                            </button>
                          </div>
                          {payments.length === 0 ? (
                            <div className="cxc-new-payment-empty">
                              <DollarSign size={22} />
                              <div>
                                <strong>No payments yet.</strong>
                                <small>
                                  This customer has not made any payments.
                                </small>
                              </div>
                            </div>
                          ) : (
                            payments.slice(0, 3).map((p) => (
                              <div key={p.id} className="cxc-new-payment-row">
                                <span>
                                  {fmtDate(p.payment_date || p.created_at)}
                                </span>
                                <strong>{usd(p.amount)}</strong>
                                <PayStatusBadge status={p.status} />
                              </div>
                            ))
                          )}
                        </section>
                        <section className="cxc-wide-panel cxc-notes-panel">
                          <div className="cxc-new-panel-head">
                            <span>
                              <StickyNote size={17} /> NOTES
                            </span>
                            <button onClick={() => setTab("notes")}>
                              + Add Note
                            </button>
                          </div>
                          {notes.length === 0 ? (
                            <div className="cxc-new-note-empty">
                              <StickyNote size={20} />
                              <div>
                                <strong>No notes yet.</strong>
                                <small>
                                  Add notes to keep track of important customer
                                  details.
                                </small>
                              </div>
                            </div>
                          ) : (
                            notes.slice(0, 2).map((n) => (
                              <div className="cxc-qa-note" key={n.id}>
                                {n.note}
                                <small>
                                  {n.author_name || "Admin"} ·{" "}
                                  {fmtDate(n.created_at)}
                                </small>
                              </div>
                            ))
                          )}
                        </section>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "subscription" && (
                  <div className="cxc-new-tab-panel">
                    {sub ? (
                      <>
                        <h3>Subscription</h3>
                        <div className="cxc-new-kv">
                          <span>Plan</span>
                          <strong>{sub.plan}</strong>
                          <span>Price</span>
                          <strong>{planPrice}</strong>
                          <span>Billing Cycle</span>
                          <strong>{sub.isFree ? "—" : sub.billingCycle}</strong>
                          <span>Started</span>
                          <strong>{fmtDateTime(sub.startDate)}</strong>
                          <span>Next Billing</span>
                          <strong>{fmtDateTime(sub.nextBillingDate)}</strong>
                        </div>
                        <button
                          className="cxc-btn cxc-btn-primary"
                          onClick={() => onChangePlan && onChangePlan(c)}
                        >
                          Change Plan
                        </button>
                      </>
                    ) : (
                      <OverviewFallback />
                    )}
                  </div>
                )}
                {activeTab === "payments" && (
                  <div className="cxc-new-tab-panel">
                    <h3>Payments</h3>
                    {payments.length === 0 ? (
                      <div className="cxc-new-empty">No recorded payments.</div>
                    ) : (
                      payments.map((p) => (
                        <div className="cxc-new-payment-row" key={p.id}>
                          <span>
                            {fmtDateTime(p.payment_date || p.created_at)}
                          </span>
                          <strong>
                            {usd(p.amount)} {p.currency || "USD"}
                          </strong>
                          <PayStatusBadge status={p.status} />
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "activity" && (
                  <div className="cxc-new-tab-panel">
                    <h3>Customer Activity</h3>
                    {activity.length === 0 ? (
                      <div className="cxc-new-empty">No activity yet.</div>
                    ) : (
                      activity.map((a, i) => (
                        <div className="cxc-new-activity-row" key={i}>
                          <span className="cxc-activity-dot">
                            <ActivityIcon size={14} />
                          </span>
                          <div>
                            <strong>{a.label}</strong>
                            <small>{fmtDateTime(a.at)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "notes" && (
                  <div className="cxc-new-tab-panel">
                    <h3>Customer Notes</h3>
                    <div className="cxc-new-note-form">
                      <input
                        className="cxc-input"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add an internal note"
                      />
                      <button
                        className="cxc-btn cxc-btn-primary"
                        onClick={submitNote}
                      >
                        Add
                      </button>
                    </div>
                    {notes.length === 0 ? (
                      <div className="cxc-new-empty">No notes yet.</div>
                    ) : (
                      notes.map((n) => (
                        <div className="cxc-note-row" key={n.id}>
                          <div>{n.note}</div>
                          <small>
                            {n.author_name || "Admin"} ·{" "}
                            {fmtDateTime(n.created_at)}
                          </small>
                          <button
                            className="cxc-linkbtn"
                            onClick={() => removeNote(n.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "team" && <TeamSeatsPanel customerId={id} />}
                {activeTab === "ai" && (
                  <div className="cxc-new-tab-panel">
                    <h3>AI Usage</h3>
                    <AiUnitsCard />
                    <div style={{ marginTop: 20 }}>
                      <PlanUsage />
                    </div>
                  </div>
                )}
                {activeTab === "integrations" && (
                  <div className="cxc-new-tab-panel">
                    <h3>Integrations</h3>
                    <PlanUsage />
                    <p className="cxc-muted">
                      Integration usage is shown from the customer usage
                      summary.
                    </p>
                  </div>
                )}
              </div>

              <div className="cxc-detail-footer">
                <button className="cxc-btn" onClick={onClose}>
                  Close
                </button>
                <div />
                <MoreActionsMenu />
              </div>
            </div>

            {/* TABLET + MOBILE : 2-step layout */}
            <div className="cxc-detail-mobile">
              <div className="cxc-mobile-detail-head">
                <button
                  onClick={mobileStep === 1 ? onClose : () => setMobileStep(1)}
                >
                  <ChevronLeft size={24} />
                </button>
                <strong>Customer Details</strong>
                <span>
                  {mobileStep === 2 ? "2 of 2" : <MoreHorizontal size={22} />}
                </span>
              </div>

              {mobileStep === 1 ? (
                <div className="cxc-mobile-step">
                  <section className="cxc-mobile-profile-card">
                    <div className="cxc-mobile-profile-top">
                      <div
                        className="cxc-mobile-avatar"
                        style={{ background: avatarColor(c.email) }}
                      >
                        {initials(c.name, c.email)}
                      </div>
                      <div>
                        <h2>{c.name || "—"}</h2>
                        <div className="cxc-detail-badges">
                          <span className={`cxc-badge ${c.status}`}>
                            {statusLabel}
                          </span>
                          <span className="cxc-detail-plan-pill">
                            {sub?.plan || getCustomerPlanLabel(c)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="cxc-mobile-send"
                        onClick={() =>
                          onSendTemplateEmail
                            ? onSendTemplateEmail(c)
                            : onSendEmail && onSendEmail(c)
                        }
                      >
                        <Mail size={16} /> Send Email
                      </button>
                    </div>
                    <div className="cxc-mobile-contact">
                      <span>
                        <Mail size={16} />
                        {c.email}
                      </span>
                      {c.phone && (
                        <span>
                          <Phone size={16} />
                          {c.phone}
                        </span>
                      )}
                      <span>
                        <MapPin size={16} />
                        {countryName(c.country) || "Unknown"}
                      </span>
                      <button onClick={copyCustomerId}>
                        <CreditCard size={15} /> Customer ID: {c.id}
                      </button>
                    </div>
                  </section>

                  <section className="cxc-mobile-dark-card">
                    <h3>
                      <span className="cxc-mobile-card-icon purple">
                        <Info size={18} />
                      </span>
                      Account Overview
                    </h3>
                    <div className="cxc-mobile-kv">
                      <span>Plan</span>
                      <strong className="blue">{sub?.plan || "—"}</strong>
                      <span>Price</span>
                      <strong className="green">{planPrice}</strong>
                      <span>Seats / Users</span>
                      <strong>
                        {c.seat_count ?? 0} / {sub?.seatsLimit ?? "—"}
                      </strong>
                      <span>Status</span>
                      <strong>
                        <span className={`cxc-badge ${c.status}`}>
                          {statusLabel}
                        </span>
                      </strong>
                      <span>Started</span>
                      <strong>{fmtDate(sub?.startDate)}</strong>
                      <span>Next Billing Date</span>
                      <strong>
                        {sub?.nextBillingDate
                          ? fmtDate(sub.nextBillingDate)
                          : "—"}
                      </strong>
                      <span>Payment Method</span>
                      <strong>{paymentMethod}</strong>
                      <span>Source / Offer</span>
                      <strong>
                        {c.source_label || "—"} / {c.offer_used || "standard"}
                      </strong>
                    </div>
                  </section>

                  <section className="cxc-mobile-dark-card">
                    <h3>
                      <span className="cxc-mobile-card-icon purple">
                        <Zap size={18} />
                      </span>
                      Quick Actions
                    </h3>
                    <div className="cxc-mobile-action-list">
                      <button onClick={() => onChangePlan && onChangePlan(c)}>
                        <RefreshCw size={20} />
                        Change Plan
                        <ChevronRight size={20} />
                      </button>
                      <button onClick={updatePayment}>
                        <CreditCard size={20} />
                        Update Payment Method
                        <ChevronRight size={20} />
                      </button>
                      <button onClick={addSeat}>
                        <Users size={20} />
                        Add Seat / User
                        <ChevronRight size={20} />
                      </button>
                      <button
                        onClick={() =>
                          onSendTemplateEmail
                            ? onSendTemplateEmail(c)
                            : onSendEmail && onSendEmail(c)
                        }
                      >
                        <Mail size={20} />
                        Send Email
                        <ChevronRight size={20} />
                      </button>
                      <button className="danger" onClick={doDeactivate}>
                        <Users size={20} />
                        Deactivate Customer
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </section>

                  <section className="cxc-mobile-dark-card">
                    <div className="cxc-mobile-section-head">
                      <h3>
                        <span className="cxc-mobile-card-icon purple">
                          <StickyNote size={18} />
                        </span>
                        Customer Notes
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMobileAddingNote((v) => !v)}
                      >
                        {mobileAddingNote ? "Cancel" : "+ Add Note"}
                      </button>
                    </div>

                    {mobileAddingNote && (
                      <div className="cxc-mobile-note-form">
                        <textarea
                          className="cxc-input"
                          rows={3}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add an internal note"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="cxc-btn cxc-btn-primary"
                          disabled={!noteText.trim()}
                          onClick={async () => {
                            await submitNote();
                            if (noteText.trim()) setMobileAddingNote(false);
                          }}
                        >
                          Save Note
                        </button>
                      </div>
                    )}

                    {notes.length === 0 ? (
                      <p className="cxc-mobile-muted">
                        No notes yet for this customer.
                      </p>
                    ) : (
                      notes.slice(0, 2).map((n) => (
                        <div className="cxc-mobile-note" key={n.id}>
                          <strong>{n.note}</strong>
                          <small>
                            {n.author_name || "Admin"} ·{" "}
                            {fmtDateTime(n.created_at)}
                          </small>
                        </div>
                      ))
                    )}
                  </section>

                  <button
                    className="cxc-mobile-next"
                    onClick={() => setMobileStep(2)}
                  >
                    Next: Usage, Payments & Activity <ChevronRight size={22} />
                  </button>
                </div>
              ) : (
                <div className="cxc-mobile-step">
                  <section className="cxc-mobile-dark-card cxc-mobile-outline purple">
                    <div className="cxc-mobile-section-head">
                      <h3>
                        <span className="cxc-mobile-card-icon purple">
                          <Users size={18} />
                        </span>
                        Plan Usage
                      </h3>
                      <button onClick={() => setTab("team")}>
                        View All <ChevronRight size={16} />
                      </button>
                    </div>
                    <PlanUsage mobile />
                  </section>
                  <section className="cxc-mobile-dark-card cxc-mobile-outline green">
                    <h3>
                      <span className="cxc-mobile-card-icon green">
                        <Zap size={18} />
                      </span>
                      AI Units
                    </h3>
                    <AiUnitsCard mobile />
                  </section>
                  <section className="cxc-mobile-dark-card cxc-mobile-outline amber">
                    <div className="cxc-mobile-section-head">
                      <h3>
                        <span className="cxc-mobile-card-icon amber">
                          <CreditCard size={18} />
                        </span>
                        Recent Payments
                      </h3>
                      <button onClick={() => setTab("payments")}>
                        View All <ChevronRight size={16} />
                      </button>
                    </div>
                    {payments.length === 0 ? (
                      <div className="cxc-mobile-empty-pay">
                        <DollarSign size={28} />
                        <strong>No payments yet.</strong>
                        <span>This customer has no payment history.</span>
                      </div>
                    ) : (
                      payments.slice(0, 3).map((p) => (
                        <div className="cxc-mobile-payment" key={p.id}>
                          <span>{fmtDate(p.payment_date || p.created_at)}</span>
                          <strong>{usd(p.amount)}</strong>
                        </div>
                      ))
                    )}
                  </section>
                  <section className="cxc-mobile-dark-card cxc-mobile-outline pink">
                    <div className="cxc-mobile-section-head">
                      <h3>
                        <span className="cxc-mobile-card-icon pink">
                          <ActivityIcon size={18} />
                        </span>
                        Customer Activity
                      </h3>
                      <button onClick={() => setTab("activity")}>
                        View All <ChevronRight size={16} />
                      </button>
                    </div>
                    {activity.length === 0 ? (
                      <p className="cxc-mobile-muted">No activity yet.</p>
                    ) : (
                      activity.slice(0, 3).map((a, i) => (
                        <div className="cxc-mobile-activity" key={i}>
                          <span>
                            <Mail size={17} />
                          </span>
                          <div>
                            <strong>{a.label}</strong>
                            <small>{fmtDateTime(a.at)}</small>
                          </div>
                          <ChevronRight size={18} />
                        </div>
                      ))
                    )}
                  </section>
                  <button className="cxc-mobile-edit" onClick={startEdit}>
                    <Pencil size={19} /> Edit Customer
                  </button>
                  <MoreActionsMenu mobile />
                  <div className="cxc-mobile-bottom-nav">
                    <button onClick={() => setMobileStep(1)}>
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <button onClick={onClose}>Done ✓</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LayersIcon() {
  return <BriefcaseBusiness size={17} />;
}
function CalendarIcon() {
  return <CalendarGlyph />;
}
function CalendarGlyph() {
  return <span className="cxc-calendar-glyph">▣</span>;
}

/* ---------------- Modals ---------------- */

function ChangePlanModal({ customer, onClose, onSuccess }) {
  const [plan, setPlan] = useState(
    customer?.plan_id && customer.plan_id !== "unselected"
      ? customer.plan_id
      : "free",
  );
  const [cycle, setCycle] = useState(
    customer?.billing === "annual" ? "annual" : "monthly",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await changeCustomerPlan(customer.id, { plan, billingCycle: cycle });
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      setError(e?.message || "Could not change plan.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div
        className="cxc-modal cxc-theme-modal cxc-change-plan-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cxc-modal-head">
          <h3 className="cxc-modal-title">Change Plan</h3>
          <button className="cxc-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cxc-note" style={{ marginBottom: 12 }}>
          {customer.name || customer.email}
        </div>
        <div className="cxc-field">
          <label>Plan</label>
          <select
            className="cxc-input"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="cxc-field">
          <label>Billing cycle</label>
          <select
            className="cxc-input"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            disabled={plan === "free"}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        {error && <div className="cxc-error">{error}</div>}
        <div className="cxc-note">
          Updates the account configuration. For a live Paddle subscriber the
          billing change in Paddle is a separate step.
        </div>
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cxc-btn cxc-btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Saving…" : "Change Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCustomerModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "free",
    language: "en",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createCustomer(form);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      setError(e?.message || "Could not add the customer.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head">
          <h3 className="cxc-modal-title">Add Customer</h3>
          <button className="cxc-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cxc-field">
          <label>Full name</label>
          <input
            className="cxc-input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="cxc-field">
          <label>Email address</label>
          <input
            className="cxc-input"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="cxc-field">
          <label>Phone</label>
          <input
            className="cxc-input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="cxc-field">
          <label>Plan</label>
          <select
            className="cxc-input"
            value={form.plan}
            onChange={(e) => set("plan", e.target.value)}
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="cxc-field">
          <label>Language</label>
          <select
            className="cxc-input"
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
        {error && <div className="cxc-error">{error}</div>}
        <div className="cxc-note">
          Creates an account with a random password. Paid plans are recorded as
          registered until the customer pays.
        </div>
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cxc-btn cxc-btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Adding…" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamSeatsPanel({ customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState({
    open: false,
    email: "",
    name: "",
    role: "agent",
  });
  const ROLES = ["admin", "manager", "agent", "viewer"];

  const load = useCallback(() => {
    setLoading(true);
    getCustomerTeam(customerId)
      .then((d) => {
        setData(d?.data ?? d);
        setErr("");
      })
      .catch((e) => setErr(e?.message || "Could not load the team."))
      .finally(() => setLoading(false));
  }, [customerId]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    setErr("");
    try {
      await fn();
      load();
    } catch (e) {
      setErr(e?.message || "Action failed.");
      setBusy(false);
    }
  };
  const submitAdd = async () => {
    if (!add.email.trim()) {
      setErr("Enter an email address.");
      return;
    }
    await act(async () => {
      await addCustomerTeamMember(customerId, {
        email: add.email,
        name: add.name,
        role: add.role,
      });
      setAdd({ open: false, email: "", name: "", role: "agent" });
    });
  };

  if (loading)
    return (
      <section className="cxc-cust-block">
        <div className="cxc-muted" style={{ fontSize: 13 }}>
          Loading team…
        </div>
      </section>
    );

  const seats = data?.seats || { limit: 0, used: 0, available: 0 };
  const members = data?.members || [];

  return (
    <>
      <div className="cxc-cust-grid3" style={{ marginBottom: 16 }}>
        <div className="cxc-cust-block cxc-seat-stat">
          <div className="cxc-block-title">Total Seats</div>
          <div className="cxc-seat-num">{seats.limit}</div>
        </div>
        <div className="cxc-cust-block cxc-seat-stat">
          <div className="cxc-block-title">Seats Used</div>
          <div className="cxc-seat-num">{seats.used}</div>
        </div>
        <div className="cxc-cust-block cxc-seat-stat">
          <div className="cxc-block-title">Seats Available</div>
          <div
            className="cxc-seat-num"
            style={{ color: seats.available > 0 ? "#16a34a" : "#dc2626" }}
          >
            {seats.available}
          </div>
        </div>
      </div>

      <section className="cxc-cust-block">
        <div className="cxc-block-title cxc-block-title--link">
          Team Members
          <button
            className="cxc-btn cxc-btn-primary cxc-btn-sm"
            onClick={() => setAdd((a) => ({ ...a, open: !a.open }))}
          >
            <Plus size={13} /> Add User
          </button>
        </div>
        {err && (
          <div className="cxc-error" style={{ marginBottom: 10 }}>
            {err}
          </div>
        )}
        {add.open && (
          <div className="cxc-edit-grid" style={{ marginBottom: 12 }}>
            <div className="cxc-field">
              <label>Email</label>
              <input
                className="cxc-input"
                value={add.email}
                onChange={(e) =>
                  setAdd((a) => ({ ...a, email: e.target.value }))
                }
                placeholder="user@company.com"
              />
            </div>
            <div className="cxc-field">
              <label>Name</label>
              <input
                className="cxc-input"
                value={add.name}
                onChange={(e) =>
                  setAdd((a) => ({ ...a, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="cxc-field">
              <label>Role</label>
              <select
                className="cxc-input"
                value={add.role}
                onChange={(e) =>
                  setAdd((a) => ({ ...a, role: e.target.value }))
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="cxc-field">
              <label>&nbsp;</label>
              <button
                className="cxc-btn cxc-btn-primary"
                disabled={busy}
                onClick={submitAdd}
              >
                {busy ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        )}
        <div className="cxc-table-wrap">
          <table className="cxc-table cxc-team-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Seat</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={7} className="cxc-muted" style={{ padding: 16 }}>
                    No team members yet.
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="cxc-cust-name">
                      {m.name || "—"}
                      {m.isOwner && (
                        <span
                          className="cxc-pop"
                          style={{
                            marginLeft: 6,
                            background: "#e0edff",
                            color: "#1d4ed8",
                          }}
                        >
                          OWNER
                        </span>
                      )}
                    </div>
                    <div className="cxc-cust-email">{m.email}</div>
                  </td>
                  <td>
                    {m.isOwner ? (
                      "Owner"
                    ) : (
                      <select
                        className="cxc-select"
                        value={m.role}
                        disabled={busy}
                        onChange={(e) =>
                          act(() =>
                            changeCustomerMemberRole(
                              customerId,
                              m.id,
                              e.target.value,
                            ),
                          )
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {m.isOwner ? (
                      <span className="cxc-badge active">Seat</span>
                    ) : (
                      <button
                        className={`cxc-btn cxc-btn-sm ${m.seatAssigned ? "" : "cxc-btn-ghost"}`}
                        disabled={busy}
                        onClick={() =>
                          act(() =>
                            setCustomerMemberSeat(
                              customerId,
                              m.id,
                              !m.seatAssigned,
                            ),
                          )
                        }
                      >
                        {m.seatAssigned ? "Remove seat" : "Assign seat"}
                      </button>
                    )}
                  </td>
                  <td>
                    <span
                      className={`cxc-badge ${m.status === "active" ? "active" : ""}`}
                    >
                      {m.status
                        ? m.status.charAt(0).toUpperCase() + m.status.slice(1)
                        : "—"}
                    </span>
                  </td>
                  <td>{m.lastActive ? fmtDate(m.lastActive) : "—"}</td>
                  <td>{m.joinedAt ? fmtDate(m.joinedAt) : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {!m.isOwner && (
                      <div className="cxc-row-actions">
                        <button
                          className="cxc-btn cxc-btn-sm"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => transferCustomerOwnership(customerId, m.id),
                              `Transfer ownership to ${m.email}? They become the account owner and the current owner becomes an admin.`,
                            )
                          }
                        >
                          Make owner
                        </button>
                        <button
                          className="cxc-btn cxc-btn-sm cxc-btn-danger"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => removeCustomerTeamMember(customerId, m.id),
                              `Remove ${m.email} from this account?`,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SendEmailModal({ customer, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }
    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendCustomerEmail(customer.id, { subject, message });
      setSent(true);
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e?.message || "Could not send the email.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div
        className="cxc-modal cxc-theme-modal cxc-send-email-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cxc-modal-head">
          <h3 className="cxc-modal-title">Send Email</h3>
          <button className="cxc-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cxc-field">
          <label>To</label>
          <input className="cxc-input" value={customer.email} disabled />
        </div>
        <div className="cxc-field">
          <label>Subject</label>
          <input
            className="cxc-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        <div className="cxc-field">
          <label>Message</label>
          <textarea
            className="cxc-input"
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message…"
            style={{ resize: "vertical" }}
          />
        </div>
        {error && <div className="cxc-error">{error}</div>}
        {sent && (
          <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            Email sent.
          </div>
        )}
        <div className="cxc-note">
          Sends through your SendGrid integration from the platform sender
          address.
        </div>
        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="cxc-btn cxc-btn-primary"
            onClick={submit}
            disabled={sending || sent}
          >
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

const LANG_LABEL = { en: "English", es: "Spanish", pt: "Portuguese" };
const newIdemKey = () =>
  (typeof window !== "undefined" && window.crypto?.randomUUID?.()) ||
  `k-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Manual per-customer template sender: pick an approved template, auto-selects the
// customer's language + first name, preview, then send ONE email through the same
// production SendGrid pipeline. Guards against accidental double sends.
// Unified Send Email composer: the admin picks EITHER an approved template
// (auto language + first name + live preview) OR "Write my own email" (a
// free-form subject + message). Both send through the same SendGrid pipeline
// and are logged as a manual send that never affects the automatic onboarding.
const CUSTOM_EMAIL = "__custom__";
function SendTemplateEmailModal({ customer, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, status, reason, custom }
  const [error, setError] = useState("");
  const [idemKey, setIdemKey] = useState(newIdemKey());

  const isCustom = template === CUSTOM_EMAIL;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getEmailTemplateCatalog();
        if (alive) setCatalog(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setError("Could not load the template list.");
      } finally {
        if (alive) setLoadingCat(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Fetch the preview whenever a TEMPLATE is chosen. Selecting "Write my own
  // email" clears the preview and shows the free-form fields instead. A new
  // choice = a fresh idempotency key (so re-choosing is an intentional new
  // send), while a double click on Send reuses the same key and is deduped.
  useEffect(() => {
    setResult(null);
    setError("");
    if (!template || isCustom) {
      setPreview(null);
      return;
    }
    let alive = true;
    setLoadingPrev(true);
    setIdemKey(newIdemKey());
    (async () => {
      try {
        const res = await previewCustomerTemplateEmail(customer.id, template);
        if (!alive) return;
        if (res?.ok) setPreview(res);
        else {
          setPreview(null);
          setError(res?.error || "Could not render this template.");
        }
      } catch (e) {
        if (alive) {
          setPreview(null);
          setError(e?.message || "Could not render this template.");
        }
      } finally {
        if (alive) setLoadingPrev(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [template, isCustom, customer.id]);

  const groups = catalog.reduce((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  const submit = async () => {
    if (sending || result?.ok) return;
    setError("");
    // Free-form "write my own email".
    if (isCustom) {
      if (!subject.trim()) {
        setError("Please enter a subject.");
        return;
      }
      if (!message.trim()) {
        setError("Please enter a message.");
        return;
      }
      setSending(true);
      try {
        await sendCustomerEmail(customer.id, { subject, message });
        setResult({ ok: true, to: customer.email, custom: true });
      } catch (e) {
        setError(e?.message || "The email could not be sent.");
      } finally {
        setSending(false);
      }
      return;
    }
    // Approved template.
    if (!template || !preview?.ok) return;
    setSending(true);
    try {
      const res = await sendCustomerTemplateEmail(customer.id, {
        template,
        idempotencyKey: idemKey,
      });
      setResult(res);
      if (!res?.ok && res?.status !== "duplicate") {
        setError(res?.reason || res?.error || "The email could not be sent.");
      }
    } catch (e) {
      setError(e?.message || "The email could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const sentOk = result?.ok;
  const isDup = result?.status === "duplicate";
  const canSend = isCustom
    ? Boolean(subject.trim() && message.trim())
    : Boolean(template && preview?.ok && !loadingPrev);

  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div
        className="cxc-modal cxc-theme-modal cxc-send-email-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(680px, 94vw)", maxWidth: "94vw" }}
      >
        <div className="cxc-modal-head">
          <h3 className="cxc-modal-title">Send Email</h3>
          <button className="cxc-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="cxc-field">
          <label>To</label>
          <input className="cxc-input" value={customer.email || ""} disabled />
        </div>

        <div className="cxc-field">
          <label>Template — or write your own</label>
          <select
            className="cxc-select"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            disabled={loadingCat}
          >
            <option value="">
              {loadingCat ? "Loading templates…" : "Choose…"}
            </option>
            <option value={CUSTOM_EMAIL}>✍️ Write my own email</option>
            {Object.keys(groups).map((cat) => (
              <optgroup key={cat} label={cat}>
                {groups[cat].map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {isCustom && (
          <>
            <div className="cxc-field">
              <label>Subject</label>
              <input
                className="cxc-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
            </div>
            <div className="cxc-field">
              <label>Message</label>
              <textarea
                className="cxc-input"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message…"
                style={{ resize: "vertical" }}
              />
            </div>
          </>
        )}

        {loadingPrev && <div className="cxc-note">Rendering preview…</div>}

        {!isCustom && preview?.ok && (
          <div className="cxc-field">
            <label>Preview</label>
            <div
              style={{
                border: "1px solid var(--cxc-line,#e6e8f0)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  background: "#f8fafc",
                  borderBottom: "1px solid #eef0f4",
                }}
              >
                <div>
                  <b>Customer:</b> {preview.customerName || "—"}
                </div>
                <div>
                  <b>Email:</b> {preview.email}
                </div>
                <div>
                  <b>Template:</b>{" "}
                  {catalog.find((t) => t.name === template)?.label || template}
                </div>
                <div>
                  <b>Language:</b>{" "}
                  {LANG_LABEL[preview.language] || preview.language}{" "}
                  <span style={{ color: "#8a90a0" }}>
                    (from the customer's language)
                  </span>
                </div>
                <div>
                  <b>Subject:</b> {preview.subject}
                </div>
              </div>
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                style={{
                  width: "100%",
                  height: 380,
                  border: 0,
                  background: "#fff",
                }}
                sandbox=""
              />
            </div>
          </div>
        )}

        {error && <div className="cxc-error">{error}</div>}
        {sentOk && (
          <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            {result.custom
              ? `Email sent to ${result.to}.`
              : `Email sent to ${result.to} in ${LANG_LABEL[result.language] || result.language}.`}
          </div>
        )}
        {isDup && (
          <div style={{ color: "#b45309", fontSize: 13, fontWeight: 600 }}>
            {result.reason || "Already sent — duplicate ignored."}
          </div>
        )}

        <div className="cxc-note">
          {isCustom
            ? "Sends your own subject and message to this customer through the SendGrid sender. Logged as a manual send; it does not affect the automatic onboarding emails."
            : "Sends one email in the customer's language using the same production templates and SendGrid sender. Logged as a manual send; it does not affect the automatic onboarding emails."}
        </div>

        <div className="cxc-modal-foot">
          <button className="cxc-btn" onClick={onClose}>
            {sentOk ? "Close" : "Cancel"}
          </button>
          <button
            className="cxc-btn cxc-btn-primary"
            onClick={submit}
            disabled={!canSend || sending || sentOk}
          >
            {sending ? "Sending…" : sentOk ? "Sent" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagePlansModal({ onClose }) {
  return (
    <div className="cxc-modal-overlay" onClick={onClose}>
      <div className="cxc-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="cxc-modal-head">
          <h3 className="cxc-modal-title">Plan management</h3>
          <button className="cxc-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <PlanConfigEditor />
        <div
          style={{
            margin: "16px 0 8px",
            padding: "8px 12px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            fontSize: 12,
            color: "#92400e",
          }}
        >
          Below are the legacy billing-plan records. The live pricing tiers
          customers check out on are Free, Solo, Business, and Scale.
        </div>
        <AdminPlans />
      </div>
    </div>
  );
}

/* Plan limits & features editor (real enforcement) */
const LIMIT_LABELS = {
  aiConversationsPerMonth: "AI conversations / month",
  automationWorkflows: "Automation workflows",
  integrations: "Integrations",
  whatsappConnections: "WhatsApp connections",
};
const FEATURE_LABELS = {
  crm: "CRM",
  aiAgent: "AI agent",
  automations: "Automations",
  emailSmsMarketing: "Email & SMS marketing",
  calendar: "Calendar",
  reports: "Reports",
  advancedAnalytics: "Advanced analytics",
  teamWorkspace: "Team workspace",
  advancedAutomations: "Advanced automations",
  workflowsSequences: "Workflows & sequences",
  customFields: "Custom fields",
  advancedPermissions: "Advanced permissions",
  whiteLabel: "White label",
  customObjects: "Custom objects",
  aiWhatsapp: "AI on WhatsApp",
  aiBooking: "AI appointment booking",
  aiAppointmentSetter: "AI appointment setter",
  advancedAiAgent: "Advanced AI agent",
  leadGenerator: "Lead Generator",
  premiumIntegrations: "Premium integrations",
};
const flabel = (map, k) => map[k] || k;

function PlanConfigEditor() {
  const [plans, setPlans] = useState([]);
  const [enforced, setEnforced] = useState(["free"]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    getPlanConfig()
      .then((d) => {
        setPlans(d?.plans || []);
        setEnforced(d?.enforcedPlanIds || ["free"]);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const update = (pid, patch) =>
    setPlans((prev) =>
      prev.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    );
  const save = async (p) => {
    setSavingId(p.id);
    try {
      await setPlanConfig(p.id, { limits: p.limits, features: p.features });
      await new Promise((r) => setTimeout(r, 120));
      load();
    } catch (e) {
      alert(e?.message || "Could not save.");
    } finally {
      setSavingId(null);
    }
  };
  const reset = async (p) => {
    if (!window.confirm(`Reset ${p.label} to defaults?`)) return;
    setSavingId(p.id);
    try {
      await resetPlanConfig(p.id);
      load();
    } catch {
      /* ignore */
    } finally {
      setSavingId(null);
    }
  };
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
        Plan limits &amp; features
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
        Controls what the app enforces (usage caps and locked features). Prices
        are set in Paddle and read-only. Only the Free plan is enforced today.
      </div>
      {loading && (
        <div className="cxc-muted" style={{ fontSize: 13 }}>
          Loading…
        </div>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {plans.map((p) => (
          <div
            key={p.id}
            style={{
              flex: "1 1 320px",
              minWidth: 280,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong>{p.label}</strong>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {p.isFree
                  ? "$0"
                  : `$${p.pricing.intro} start · $${p.pricing.monthly}/mo`}
                {enforced.includes(p.id) && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "1px 6px",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    enforced
                  </span>
                )}
              </span>
            </div>
            {Object.keys(p.limits || {}).map((k) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {flabel(LIMIT_LABELS, k)}
                </span>
                <input
                  className="cxc-input"
                  style={{ width: 110 }}
                  type="number"
                  min="0"
                  placeholder="unlimited"
                  value={p.limits[k] == null ? "" : p.limits[k]}
                  onChange={(e) =>
                    update(p.id, {
                      limits: {
                        ...p.limits,
                        [k]:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
            <details>
              <summary
                style={{
                  fontSize: 12,
                  color: "#2563eb",
                  cursor: "pointer",
                  margin: "6px 0",
                }}
              >
                Feature access
              </summary>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                {Object.keys(p.features || {}).map((k) => (
                  <label
                    key={k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      color: "#475569",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!p.features[k]}
                      onChange={(e) =>
                        update(p.id, {
                          features: { ...p.features, [k]: e.target.checked },
                        })
                      }
                    />
                    {flabel(FEATURE_LABELS, k)}
                  </label>
                ))}
              </div>
            </details>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="cxc-btn cxc-btn-primary cxc-btn-sm"
                disabled={savingId === p.id}
                onClick={() => save(p)}
              >
                {savingId === p.id ? "Saving…" : "Save"}
              </button>
              {p.overridden && (
                <button
                  className="cxc-btn cxc-btn-sm"
                  disabled={savingId === p.id}
                  onClick={() => reset(p)}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
