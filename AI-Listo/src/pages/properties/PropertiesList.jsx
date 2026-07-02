import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./properties.css";

import {
  Search,
  ChevronDown,
  Download,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Home,
  CheckCircle2,
  DollarSign,
  MoreVertical,
  BedDouble,
  Bath,
  Maximize,
  Pipette,
  Calendar,
  RotateCcw,
  Clock3,
  FileText,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Flame,
  Bot,
  Percent,
} from "lucide-react";
import { getProperties } from "../../api/propertiesApi";
import { useApiErrorHandler } from "../../utils/useApiErrorHandler";

/** Format a numeric price into a compact currency string. */
function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Compact currency for totals (e.g. $24.8M). */
function formatCompactCurrency(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
}

/** Build a single-line address from the property fields the backend returns. */
function formatAddress(p) {
  return (
    [p.address, p.city, p.state, p.zipCode].filter(Boolean).join(", ") || "—"
  );
}

/** Map a backend status to the display label + css class used by the card. */
function statusView(status) {
  switch ((status || "").toLowerCase()) {
    case "published":
      return { label: "Active", listing: "Active", cls: "active" };
    case "draft":
      return { label: "Draft", listing: "Under Review", cls: "under-review" };
    case "sold":
      return { label: "Sold", listing: "Under Review", cls: "under-review" };
    case "rented":
      return { label: "Rented", listing: "Under Review", cls: "under-review" };
    case "archived":
      return { label: "Archived", listing: "Under Review", cls: "under-review" };
    default:
      return { label: status || "—", listing: status || "—", cls: "active" };
  }
}

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleError } = useApiErrorHandler();

  // Filter controls (applied client-side over the loaded inventory)
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [notice, setNotice] = useState(null);

  const clearFilters = () => {
    setQ("");
    setCityFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setDateFilter("all");
  };

  const notAvailable = (feature) =>
    setNotice(
      `${feature} isn't connected to a backend engine yet, so it can't run. It stays in the layout per the approved design.`
    );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Pull a healthy page so the inventory summary reflects real data.
        const res = await getProperties({ limit: 100 });
        if (!active) return;
        setProperties(Array.isArray(res.items) ? res.items : []);
        setTotal(res.total || (res.items ? res.items.length : 0));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load properties");
        handleError(err, "Failed to load properties");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Derived, real inventory numbers (no fabricated figures).
  const derived = useMemo(() => {
    const counts = { active: 0, review: 0, draft: 0, inactive: 0 };
    let totalValue = 0;
    for (const p of properties) {
      const s = (p.status || "").toLowerCase();
      if (s === "published") counts.active += 1;
      else if (s === "draft") counts.draft += 1;
      else if (s === "archived") counts.inactive += 1;
      else counts.review += 1;
      totalValue += Number(p.price) || 0;
    }
    return { counts, totalValue };
  }, [properties]);

  const metrics = [
    {
      title: "Total Properties",
      value: String(total),
      icon: <Home size={20} />,
      className: "blue",
    },
    {
      title: "Active Listings",
      value: String(derived.counts.active),
      icon: <CheckCircle2 size={20} />,
      className: "green",
    },
    {
      title: "Total Value",
      value: formatCompactCurrency(derived.totalValue),
      icon: <DollarSign size={20} />,
      className: "purple",
    },
    // Approved layout keeps these cards visible; no backend metric yet, so
    // they show a neutral value until an endpoint exists.
    {
      title: "Hot Properties",
      value: "0",
      icon: <Flame size={20} />,
      className: "orange",
    },
    {
      title: "AI Optimized",
      value: "0",
      icon: <Bot size={20} />,
      className: "cyan",
    },
    {
      title: "Conversion Rate",
      value: "0%",
      icon: <Percent size={20} />,
      className: "green",
    },
  ];

  const inventoryTotal = properties.length;
  const pct = (n) =>
    inventoryTotal > 0 ? Math.round((n / inventoryTotal) * 100) : 0;

  // Option lists derived from the live inventory
  const cityOptions = useMemo(
    () =>
      [...new Set(properties.map((p) => p.city).filter(Boolean))].sort(),
    [properties]
  );
  const typeOptions = useMemo(
    () =>
      [...new Set(properties.map((p) => p.listingType || p.type).filter(Boolean))].sort(),
    [properties]
  );
  const statusOptions = useMemo(
    () => [...new Set(properties.map((p) => p.status).filter(Boolean))].sort(),
    [properties]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const min = minPrice !== "" ? Number(minPrice) : null;
    const max = maxPrice !== "" ? Number(maxPrice) : null;
    const now = Date.now();
    const cutoffs = { "30d": 30, "90d": 90, "365d": 365 };
    return properties.filter((p) => {
      if (needle) {
        const hay = [p.title, p.address, p.city, p.state, p.zipCode, p.mlsId]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (cityFilter !== "all" && p.city !== cityFilter) return false;
      if (typeFilter !== "all" && (p.listingType || p.type) !== typeFilter)
        return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      const price = Number(p.price) || 0;
      if (min != null && price < min) return false;
      if (max != null && price > max) return false;
      if (dateFilter !== "all" && cutoffs[dateFilter]) {
        const created = p.createdAt ? new Date(p.createdAt).getTime() : null;
        if (!created || now - created > cutoffs[dateFilter] * 86400000)
          return false;
      }
      return true;
    });
  }, [properties, q, cityFilter, typeFilter, statusFilter, minPrice, maxPrice, dateFilter]);

  // Client-side CSV export of the currently filtered inventory
  const exportCsv = () => {
    const cols = [
      "title", "address", "city", "state", "zipCode", "price",
      "status", "bedrooms", "bathrooms", "squareFeet", "createdAt",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [cols.join(",")].concat(
      filtered.map((p) => cols.map((c) => esc(p[c])).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "property-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="properties-page">
      <div className="heading_page">
        <Home className="header-icon" size={20} />
        <h1>AI Property Inventory</h1>
        <p className="next_head">Command Center</p>
        <Sparkles size={16} color="#2563eb" />
      </div>
      <p className="sub_head">
        Manage, analyze and optimize your property listing with AI intelligence
      </p>
      <div className="page-header">
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => notAvailable("Analyze Properties")}
          >
            <Sparkles size={16} color="#2563eb" /> Analyze Properties
          </button>
          <button
            className="btn btn-primary"
            onClick={() => notAvailable("Auto-Optimize Listings")}
          >
            <Pipette size={16} />
            Auto-Optimize Listings
          </button>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <Download size={16} className="blue" /> Export Property Report
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            margin: "8px 0",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#fef9c3",
            color: "#854d0e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>
            <AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> {notice}
          </span>
          <button
            className="btn btn-secondary"
            style={{ height: "26px", padding: "0 10px" }}
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* METRICS ROW */}
      <div className="metrics-grid">
        {metrics.map((item, idx) => (
          <div className="metric-card" key={idx}>
            <div className={`metric-icon ${item.className}`}>{item.icon}</div>
            <div className="metric-info">
              <span>{item.title}</span>
              <h2>{item.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS CONTROL ROW */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={16} color="#94a3b8" />
          <input
            placeholder="Search properties, addresses, MLS ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="filter-select-wrapper search-date">
          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last 12 months</option>
          </select>
          <Calendar size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">All Cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            placeholder="Min Price"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input
            placeholder="Max Price"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <button
          className="btn btn-secondary"
          style={{ height: "38px" }}
          onClick={clearFilters}
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
        <button
          className="btn btn-primary"
          style={{ height: "38px", padding: "0 20px" }}
          title="Filters apply as you type"
        >
          <Search size={14} />
          Search
        </button>
        <button
          className="btn btn-secondary export"
          style={{ height: "38px" }}
          onClick={exportCsv}
        >
          <Download size={15} className="blue" /> Export
        </button>

        <div className="view-toggle-group">
          <button
            className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-layout">
        {/* LEFT COMPONENT: PROPERTIES LIST */}
        <div className="properties-grid">
          {loading && (
            <div className="properties-empty">Loading properties…</div>
          )}
          {!loading && error && (
            <div className="properties-empty">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="properties-empty">
              {properties.length === 0
                ? "No properties yet."
                : "No properties match the current filters."}
            </div>
          )}
          {!loading &&
            !error &&
            filtered.map((property) => {
              const sv = statusView(property.status);
              return (
                <div
                  className="property-card"
                  key={property.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/dashboard/properties/${property.id}`)}
                >
                  <div className="card-image-wrapper">
                    {property.thumbnailUrl ? (
                      <img
                        src={property.thumbnailUrl}
                        alt={property.title || "Property"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          background: "#e2e8f0",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                        }}
                      >
                        No image
                      </div>
                    )}
                    <span className={`badge-status ${sv.cls}`}>{sv.label}</span>
                    <button
                      className="card-actions-trigger"
                      title="Edit property"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/properties/${property.id}/edit`);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="card-body">
                    <div className="price-row">
                      <h3>{formatPrice(property.price)}</h3>
                    </div>

                    {property.title && (
                      <p className="property-title">{property.title}</p>
                    )}
                    <p className="property-address">{formatAddress(property)}</p>

                    <div className="property-specs">
                      {property.bedrooms != null && (
                        <div className="spec-item">
                          <BedDouble size={14} /> {property.bedrooms}
                        </div>
                      )}
                      {property.bathrooms != null && (
                        <div className="spec-item">
                          <Bath size={14} /> {property.bathrooms}
                        </div>
                      )}
                      {property.squareFeet != null && (
                        <div className="spec-item">
                          <Maximize size={14} /> {property.squareFeet} sqft
                        </div>
                      )}
                    </div>

                    <div className="agent-footer">
                      <div className="agent-info">
                        <MapPin size={14} color="#94a3b8" />
                        <div>
                          <p>{property.city || property.state || "—"}</p>
                        </div>
                      </div>
                      <span
                        className={`listing-status-tag ${sv.cls === "active" ? "active" : "review"}`}
                      >
                        {sv.listing}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* RIGHT COMPONENT: SIDEBAR PLATFORM PANEL */}
        <div className="sidebar-panel">
          {/* SECTION 1: INVENTORY HEALTH */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>
                <ShieldCheck size={18} className="blue" />
                Inventory Health
              </h3>
            </div>

            <div className="health-chart-wrapper">
              <div className="chart-wrap">
                <div className="donut-chart-mock">
                  <div className="chart-center">
                    <h4>{inventoryTotal}</h4>
                    <span>Total</span>
                  </div>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-label">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Active</span>
                    </div>
                    <span className="legend-value">
                      {derived.counts.active} ({pct(derived.counts.active)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <Clock3 size={14} color="#ea580c" />
                      <span>Under Review</span>
                    </div>
                    <span className="legend-value">
                      {derived.counts.review} ({pct(derived.counts.review)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <FileText size={14} color="#64748b" />
                      <span>Draft</span>
                    </div>
                    <span className="legend-value">
                      {derived.counts.draft} ({pct(derived.counts.draft)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <AlertCircle size={14} color="#dc2626" />
                      <span>Archived</span>
                    </div>
                    <span className="legend-value">
                      {derived.counts.inactive} ({pct(derived.counts.inactive)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="section-footer-link">
              <a
                href="/dashboard/analytics"
                className="section-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/dashboard/analytics");
                }}
              >
                View Full Analysis <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
