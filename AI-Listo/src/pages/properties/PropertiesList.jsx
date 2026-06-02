import React, { useState } from "react";
import "./properties.css";

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

  const metrics = [
    {
      title: "Total Properties",
      value: "248",
      trend: "↑ 12% vs last month",
      trendType: "up",
      icon: <Home size={20} />,
      className: "blue",
    },
    {
      title: "Active Listings",
      value: "186",
      trend: "↑ 8% vs last month",
      trendType: "up",
      icon: <CheckCircle2 size={20} />,
      className: "green",
    },
    {
      title: "Total Value",
      value: "$24.8M",
      trend: "↑ 15% vs last month",
      trendType: "up",
      icon: <DollarSign size={20} />,
      className: "purple",
    },
    {
      title: "Hot Properties",
      value: "32",
      trend: "↑ 18% vs last month",
      trendType: "up",
      icon: <Flame size={20} />,
      className: "orange",
    },
    {
      title: "AI Optimized",
      value: "142",
      trend: "↑ 22% vs last month",
      trendType: "up",
      icon: <Bot size={20} />,
      className: "cyan",
    },
    {
      title: "Conversion Rate",
      value: "24.8%",
      trend: "↑ 6% vs last month",
      trendType: "up",
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
      </div>
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
          <input placeholder="Search properties, addresses, MLS ID..." />
        </div>

        <div className="filter-select-wrapper">
          <select className="filter-select" defaultValue="may">
            <option value="may">May 1, 2024 - May 31, 2024</option>
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

        <button className="btn btn-secondary" style={{ height: "38px" }}>
          <RotateCcw size={14} />
          Clear Filters
        </button>
        <button
          className="btn btn-primary"
          style={{ height: "38px", padding: "0 20px" }}
        >
          <Search size={14} />
          Search
        </button>
        <button className="btn btn-secondary" style={{ height: "38px" }}>
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
          {propertiesList.map((property, idx) => (
            <div className="property-card" key={idx}>
              <div className="card-image-wrapper">
                {/* Fallback pattern representing images in mockup */}
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
                <span className={`badge-status ${property.statusClass}`}>
                  {property.status}
                </span>
                <button className="card-actions-trigger">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="card-body">
                <div className="price-row">
                  <h3>{property.price}</h3>
                  <div className="ai-score-badge">
                    <strong
                      className={`score-number ${parseInt(property.aiScore) > 80 ? "high" : "medium"}`}
                    >
                      {property.aiScore}
                    </strong>
                    <span>AI Score</span>
                  </div>
                </div>

                <p className="property-address">{property.address}</p>

                <div className="property-specs">
                  <div className="spec-item">
                    <BedDouble size={14} /> {property.beds}
                  </div>
                  <div className="spec-item">
                    <Bath size={14} /> {property.baths}
                  </div>
                  <div className="spec-item">
                    <Maximize size={14} /> {property.sqft}
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
          ))}
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
    </div>
  );
}
