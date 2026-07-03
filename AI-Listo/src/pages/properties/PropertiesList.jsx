import React, { useEffect, useMemo, useState } from "react";
import "./properties.css";
import {
  getProperties,
  getPropertiesDashboard,
  createProperty,
} from "../../api/propertiesApi";
import {
  Search,
  ChevronDown,
  Download,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Home,
  CheckCircle2,
  DollarSign,
  Flame,
  Bot,
  Percent,
  MoreVertical,
  BedDouble,
  Bath,
  Maximize,
  ArrowUpRight,
  Pipette,
  Calendar,
  RotateCcw,
  Clock3,
  FileText,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function PropertiesPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [dateRange, setDateRange] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);

  const [propertyForm, setPropertyForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    type: "sale",
    propertyType: "house",
    status: "draft",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
  });

  const handleCreateProperty = async (e) => {
    e.preventDefault();

    try {
      setSavingProperty(true);

      await createProperty({
        title: propertyForm.title,
        description: propertyForm.description || null,
        address: propertyForm.address || null,
        city: propertyForm.city || null,
        state: propertyForm.state || null,
        zipCode: propertyForm.zipCode || null,
        price: propertyForm.price ? Number(propertyForm.price) : null,
        type: propertyForm.type,
        propertyType: propertyForm.propertyType,
        status: propertyForm.status,
        bedrooms: propertyForm.bedrooms ? Number(propertyForm.bedrooms) : null,
        bathrooms: propertyForm.bathrooms
          ? Number(propertyForm.bathrooms)
          : null,
        squareFeet: propertyForm.squareFeet
          ? Number(propertyForm.squareFeet)
          : null,
        listingType: "marketplace",
      });

      setShowAddModal(false);

      setPropertyForm({
        title: "",
        description: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        price: "",
        type: "sale",
        propertyType: "house",
        status: "draft",
        bedrooms: "",
        bathrooms: "",
        squareFeet: "",
      });

      await loadProperties();
      await loadDashboard();
    } catch (error) {
      console.error("Create property failed:", error);
    } finally {
      setSavingProperty(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await getPropertiesDashboard({
        range: dateRange,
      });

      setDashboard(data);
    } catch (error) {
      console.error("Load properties dashboard failed:", error);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);

      const data = await getProperties({
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
        limit: 50,
        offset: 0,
      });

      setProperties(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
    } catch (error) {
      console.error("Load properties failed:", error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadProperties();
  }, [dateRange]);

  const formatTrend = (item) => {
    const trend = item?.trend;

    if (!trend) return "—";

    return `${trend.symbol} ${trend.changePercent}% vs ${dashboard?.compareLabel || "previous period"}`;
  };

  const metrics = [
    {
      title: "Total Properties",
      value: dashboard?.totalProperties?.value ?? 0,
      trend: dashboard?.totalProperties?.trend?.text || "→ 0% all time",
      trendType: dashboard?.totalProperties?.trend?.direction || "flat",
      icon: <Home size={20} />,
      className: "blue",
    },
    {
      title: "Active Listings",
      value: dashboard?.activeListings?.value ?? 0,
      trend: dashboard?.activeListings?.trend?.text || "→ 0% all time",
      trendType: dashboard?.activeListings?.trend?.direction || "flat",
      icon: <CheckCircle2 size={20} />,
      className: "green",
    },
    {
      title: "Total Value",
      value: `$${Number(dashboard?.totalValue?.value || 0).toLocaleString()}`,
      trend: dashboard?.totalValue?.trend?.text || "→ 0% all time",
      trendType: dashboard?.totalValue?.trend?.direction || "flat",
      icon: <DollarSign size={20} />,
      className: "purple",
    },
    {
      title: "Hot Properties",
      value: dashboard?.hotProperties?.value ?? 0,
      trend: dashboard?.hotProperties?.trend?.text || "→ 0% coming soon",
      trendType: dashboard?.hotProperties?.trend?.direction || "flat",
      icon: <Flame size={20} />,
      className: "orange",
    },
    {
      title: "AI Optimized",
      value: dashboard?.aiOptimized?.value ?? 0,
      trend: dashboard?.aiOptimized?.trend?.text || "→ 0% coming soon",
      trendType: dashboard?.aiOptimized?.trend?.direction || "flat",
      icon: <Bot size={20} />,
      className: "cyan",
    },
    {
      title: "Conversion Rate",
      value: `${dashboard?.conversionRate?.value ?? 0}%`,
      trend: dashboard?.conversionRate?.trend?.text || "→ 0% all time",
      trendType: dashboard?.conversionRate?.trend?.direction || "flat",
      icon: <Percent size={20} />,
      className: "green",
    },
  ];

  const propertiesList = [
    {
      price: "$1,250,000",
      address: "123 Luxury Way, Beverly Hills, CA 90210",
      aiScore: "92",
      beds: 4,
      baths: 5,
      sqft: "3,456 sqft",
      revenue: "$125K",
      leads: 28,
      status: "HOT PROPERTY",
      statusClass: "hot",
      agentName: "Sarah Johnson",
      agentTeam: "Luxury Team",
      agentAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      listingStatus: "Active",
    },
    {
      price: "$850,000",
      address: "456 Ocean Drive, Miami, FL 33139",
      aiScore: "88",
      beds: 3,
      baths: 3,
      sqft: "2,100 sqft",
      revenue: "$85K",
      leads: 19,
      status: "AI OPTIMIZED",
      statusClass: "ai-optimized",
      agentName: "Mike Rodriguez",
      agentTeam: "Coastal Team",
      agentAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
      listingStatus: "Active",
    },
    {
      price: "$620,000",
      address: "789 Maple Street, Austin, TX 78701",
      aiScore: "65",
      beds: 3,
      baths: 2,
      sqft: "1,850 sqft",
      revenue: "$45K",
      leads: 12,
      status: "UNDER REVIEW",
      statusClass: "under-review",
      agentName: "Emily Davis",
      agentTeam: "Central Team",
      agentAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
      listingStatus: "Under Review",
    },
    {
      price: "$450,000",
      address: "321 Pine Avenue, Seattle, WA 98101",
      aiScore: "78",
      beds: 2,
      baths: 2,
      sqft: "1,200 sqft",
      revenue: "$32K",
      leads: 8,
      status: "ACTIVE",
      statusClass: "active",
      agentName: "David Chen",
      agentTeam: "Northwest Team",
      agentAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
      listingStatus: "Active",
    },
  ];

  const matchedLeads = [
    {
      name: "John Smith",
      location: "Miami, FL",
      budget: "$800K - $1.2M",
      count: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    },
    {
      name: "Sarah Williams",
      location: "Austin, TX",
      budget: "$500K - $750K",
      count: 3,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    },
    {
      name: "Michael Brown",
      location: "Seattle, WA",
      budget: "$400K - $600K",
      count: 4,
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    },
  ];

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
          <button className="btn btn-secondary">
            <Sparkles size={16} color="#2563eb" /> Analyze Properties
          </button>
          <button className="btn btn-primary">
            <Pipette size={16} />
            Auto-Optimize Listings
          </button>
          <button className="btn btn-secondary">
            <Download size={16} className="blue" /> Export Property Report
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-grid">
        {metrics.map((item, idx) => (
          <div className="metric-card" key={idx}>
            <div className={`metric-icon ${item.className}`}>{item.icon}</div>
            <div className="metric-info">
              <span>{item.title}</span>
              <h2>{item.value}</h2>
              <span className={`metric-trend ${item.trendType}`}>
                {item.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS CONTROL ROW */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={16} color="#94a3b8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties, addresses, MLS ID..."
          />
        </div>

        <div className="filter-select-wrapper search-date">
          <select
            className="filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This month</option>
          </select>
          <Calendar size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="all">
            <option value="all">All Cities</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="all">
            <option value="all">All Types</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="all">
            <option value="all">All Status</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input placeholder="Min Price" />
        </div>
        <div className="search-box price" style={{ maxWidth: "120px" }}>
          <input placeholder="Max Price" />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="all">
            <option value="all">All AI Scores</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="all">
            <option value="all">All Agents/Teams</option>
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>

        <button
          className="btn btn-secondary"
          style={{ height: "38px" }}
          onClick={() => {
            setSearch("");
            setType("");
            setStatus("");
            setTimeout(loadProperties, 0);
          }}
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
        <button
          className="btn btn-primary"
          style={{ height: "38px", padding: "0 20px" }}
          onClick={loadProperties}
        >
          <Search size={14} />
          Search
        </button>
        <button className="btn btn-secondary export" style={{ height: "38px" }}>
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
          {loading ? (
            <div className="property-card">
              <div className="card-body">Loading properties...</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="property-card">
              <div className="card-body">No properties found.</div>
            </div>
          ) : (
            properties.map((property) => (
              <div className="property-card" key={idx}>
                <div className="card-image-wrapper">
                  {/* Fallback pattern representing images in mockup */}
                  {property.thumbnailUrl ? (
                    <img
                      src={property.thumbnailUrl}
                      alt={property.title}
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
                      Property Image Layout
                    </div>
                  )}
                  <span
                    className={`badge-status ${property.status === "published" ? "active" : "under-review"}`}
                  >
                    {(property.status || "draft")
                      .replace("_", " ")
                      .toUpperCase()}
                  </span>
                  <button className="card-actions-trigger">
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="card-body">
                  <div className="price-row">
                    <h3>
                      {property.price
                        ? `$${Number(property.price).toLocaleString()}`
                        : "No price"}
                    </h3>
                    <div className="ai-score-badge">
                      <strong
                        className={`score-number ${parseInt(property.aiScore) > 80 ? "high" : "medium"}`}
                      >
                        {property.aiScore}
                      </strong>
                      <span>AI Score</span>
                    </div>
                  </div>

                  <p className="property-address">
                    {[
                      property.address,
                      property.city,
                      property.state,
                      property.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address"}
                  </p>

                  <div className="property-specs">
                    <div className="spec-item">
                      <BedDouble size={14} /> {property.bedrooms || 0}
                    </div>
                    <div className="spec-item">
                      <Bath size={14} /> {property.bathrooms || 0}
                    </div>
                    <div className="spec-item">
                      <Maximize size={14} />{" "}
                      {property.squareFeet
                        ? `${property.squareFeet} sqft`
                        : "—"}
                    </div>
                  </div>

                  <div className="financials-row">
                    <div className="financial-item">
                      <span>Revenue Potential</span>
                      <strong className="green-text">{property.revenue}</strong>
                    </div>
                    <div
                      className="financial-item"
                      style={{ textAlign: "right" }}
                    >
                      <span>Matched Leads</span>
                      <strong className="text-align-right">
                        {property.leads} ↗
                      </strong>
                    </div>
                  </div>

                  <div className="agent-footer">
                    <div className="agent-info">
                      <img
                        src={property.agentAvatar}
                        alt={property.agentName}
                        className="agent-avatar"
                      />
                      <div>
                        <h5>{property.agentName}</h5>
                        <p>{property.agentTeam}</p>
                      </div>
                    </div>
                    <span
                      className={`listing-status-tag ${property.listingStatus === "Active" ? "active" : "review"}`}
                    >
                      {property.listingStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
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
                    <h4>248</h4>
                    <span>Total</span>
                  </div>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-label">
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Active</span>
                    </div>
                    <span className="legend-value">186 (75%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <Clock3 size={14} color="#ea580c" />
                      <span>Under Review</span>
                    </div>
                    <span className="legend-value">32 (13%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <FileText size={14} color="#64748b" />
                      <span>Draft</span>
                    </div>
                    <span className="legend-value">18 (7%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label">
                      <AlertCircle size={14} color="#dc2626" />
                      <span>Inactive</span>
                    </div>
                    <span className="legend-value">12 (5%)</span>
                  </div>
                </div>
              </div>
              <div className="inventory-score-box">
                <div className="score-info">
                  <h5>Inventory Score</h5>
                  <div className="score-display">
                    82 <span className="score-max">/100</span>
                  </div>
                  <span className="score-status">Excellent</span>
                </div>
                <div className="score-trend">
                  <span className="trend-up-text">↑ 12 points</span>
                  <p>vs last month</p>
                </div>
              </div>
            </div>
            <div className="section-footer-link">
              <a href="#view-analysis" className="section-link">
                View Full Analysis <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* SECTION 2: MATCHED LEADS */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>
                <Users size={18} className="blue" />
                Matched Leads
              </h3>
              <a href="#view-all-leads" className="section-link">
                View All Leads
                <ArrowRight size={13} />
              </a>
            </div>

            <div className="matched-leads-list">
              {matchedLeads.map((lead, index) => (
                <div className="matched-lead-item" key={index}>
                  <div className="lead-left-content">
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="lead-avatar-img"
                    />
                    <div className="lead-details">
                      <h4>{lead.name}</h4>
                      <p>
                        <MapPin size={12} color="#94a3b8" /> {lead.location}
                      </p>
                    </div>
                  </div>

                  <div className="lead-right-meta">
                    <span className="budget">Budget: {lead.budget}</span>
                    <span className="matches-count">
                      Matched properties: <strong>{lead.count}</strong>
                    </span>
                  </div>
                  <button className="btn-match-view">
                    View Matches
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showAddModal && (
        <div className="modal-overlay">
          <div className="property-modal">
            <div className="modal-header">
              <h3>Add Property</h3>
              <button onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateProperty} className="property-form">
              <input
                required
                placeholder="Property title"
                value={propertyForm.title}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />

              <input
                placeholder="Address"
                value={propertyForm.address}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
              />

              <div className="form-grid-2">
                <input
                  placeholder="City"
                  value={propertyForm.city}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder="State"
                  value={propertyForm.state}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-grid-2">
                <input
                  type="number"
                  placeholder="Price"
                  value={propertyForm.price}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />

                <input
                  placeholder="Zip code"
                  value={propertyForm.zipCode}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-grid-2">
                <select
                  value={propertyForm.type}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>

                <select
                  value={propertyForm.propertyType}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      propertyType: e.target.value,
                    }))
                  }
                >
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="villa">Villa</option>
                  <option value="office">Office</option>
                </select>
              </div>

              <div className="form-grid-3">
                <input
                  type="number"
                  placeholder="Beds"
                  value={propertyForm.bedrooms}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      bedrooms: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  placeholder="Baths"
                  value={propertyForm.bathrooms}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      bathrooms: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  placeholder="Sqft"
                  value={propertyForm.squareFeet}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({
                      ...prev,
                      squareFeet: e.target.value,
                    }))
                  }
                />
              </div>

              <textarea
                placeholder="Description"
                value={propertyForm.description}
                onChange={(e) =>
                  setPropertyForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProperty}
                >
                  {savingProperty ? "Saving..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
