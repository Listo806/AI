import React, { useState } from "react";
import "./generator.css";
import {
  Download,
  Sparkles,
  ChevronDown,
  Search,
  Eye,
  Activity,
  Globe,
  MapPin,
  Building2,
  Layers,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Filter,
  Grid,
  List,
  ExternalLink,
  Users,
  Bot,
  Flame,
  ArrowRight,
  TrendingUp,
  MoreVertical,
  Phone,
  Save,
  NotepadTextDashed,
  Toolbox,
  Pencil,
  ToolCase,
} from "lucide-react";

export default function LeadGeneratorPage() {
  const [saveSearchActive, setSaveSearchActive] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([1, 2]);

  const topMetrics = [
    {
      title: "Generated Leads",
      value: "1,342",
      sub: "↑ 28% this month",
      type: "blue",
      icon: <Users size={20} />,
    },
    {
      title: "AI Qualified",
      value: "687",
      sub: "↑ 51% of total",
      type: "green",
      icon: <Bot size={20} />,
    },
    {
      title: "Hot Opportunities",
      value: "213",
      sub: "↓ 16% this month",
      type: "red",
      icon: <Flame size={20} />,
    },
    {
      title: "Enriched Leads",
      value: "1,089",
      sub: "81% enriched",
      type: "purple",
      icon: <Layers size={20} />,
    },
    {
      title: "Campaign Ready",
      value: "356",
      sub: "↑ 22% this month",
      type: "orange",
      icon: <TrendingUp size={20} />,
    },
    {
      title: "Moved to CRM",
      value: "124",
      sub: "↑ 18% this month",
      type: "cyan",
      icon: <CheckCircle2 size={20} />,
    },
    {
      title: "Avg AI Score",
      value: "78%",
      sub: "↑ 6 pts this month",
      type: "star",
      icon: <Sparkles size={20} />,
    },
  ];

  const leadRecords = [
    {
      id: 1,
      name: "María López",
      badge: "New",
      email: "maria.lopez@email.com",
      phone: "+593 98 765 4321",
      role: "Renter",
      temp: "Warm",
      aiScore: "64%",
      interest: "2-bedroom apartment in La Carolina",
      budget: "$500 - $900",
      source: "Public Web Search",
      sourceUrl: "verpropiedades.com/alq...",
      action: "Send rental availability message",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
      id: 2,
      name: "Constructora Andina",
      badge: "New",
      email: "info@andina.com.ec",
      phone: "+593 2 222 3344",
      role: "Developer",
      temp: "Warm",
      aiScore: "71%",
      interest: "New condo project in Cumbayá",
      budget: "$150,000+",
      source: "Business / Places Search",
      sourceUrl: "andina.com.ec/proyectos",
      action: "Send new project information request",
      avatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150",
    },
    {
      id: 3,
      name: "Carlos Jiménez",
      badge: "New",
      email: "carlosj@gmail.com",
      phone: "+593 99 456 7890",
      role: "Seller",
      temp: "Hot",
      aiScore: "82%",
      interest: "Selling house in Tumbaco",
      budget: "$180,000 - $220,000",
      source: "Real Estate Pages",
      sourceUrl: "plusvalia.com/propiedad/...",
      action: "Send home valuation and listing proposal",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  ];

  const cityRankings = [
    { name: "Quito", count: 14 },
    { name: "Cumbayá", count: 7 },
    { name: "La Carolina", count: 5 },
    { name: "Tumbaco", count: 3 },
    { name: "Bellavista", count: 3 },
  ];

  const toggleLeadSelection = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((item) => item !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  return (
    <div className="generator-page">
      <div className="heading_page">
        <Sparkles className="header-icon" size={20} />
        <h1>New Lead Generator Pro</h1>
      </div>
      <p className="sub_head">
        Discover, score, and organize fresh opportunities outside your CRM.
      </p>
      <div className="page-header">
        <div className="header-actions">
          <button className="btn-icon-text">
            <Download size={15} /> Export
          </button>
          <button className="btn-icon-text">
            <Eye size={15} /> Saved Searches
          </button>
          <button className="btn-icon-text">
            <Activity size={15} /> Campaign Drafts
          </button>
          <button className="btn-primary">
            <Sparkles size={15} fill="white" /> Generate New Leads
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-summary-grid">
        {topMetrics.map((m, idx) => (
          <div className={`metric-mini-card ${m.type}`} key={idx}>
            <div className={`metric-mini-icon ${m.type}`}>{m.icon}</div>
            <div className="metric-mini-info">
              <span>{m.title}</span>
              <div className="metric-num-wrapper">
                <h2>{m.value}</h2>
                <p
                  className={
                    m.sub.includes("↑")
                      ? "text-up"
                      : m.sub.includes("↓")
                        ? "text-down"
                        : "text-sub"
                  }
                >
                  {m.sub.split(" ")[0]} <span>{m.sub.substring(2)}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 1. CONFIGURATION BLOCK */}
      <div className="config-section-container">
        <h3 className="section-block-title">
          1. Tell Cortexa What You're Looking For
        </h3>
        <div className="inputs-form-grid">
          <div className="form-field-group">
            <label>Product / Offer</label>
            <div className="input-select-wrapper">
              <select defaultValue="Real Estate Investment Pack">
                <option>Real Estate Investment Pack</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>Country</label>
            <div className="input-select-wrapper">
              <select defaultValue="Ecuador">
                <option>Ecuador</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>City</label>
            <div className="input-select-wrapper">
              <select defaultValue="Quito">
                <option>Quito</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>
              Area <span>(Optional)</span>
            </label>
            <div className="input-select-wrapper">
              <select defaultValue="Cumbayá, Tumbaco">
                <option>Cumbayá, Tumbaco</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>Industry</label>
            <div className="input-select-wrapper">
              <select defaultValue="Real Estate">
                <option>Real Estate</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>Business Type</label>
            <div className="input-select-wrapper">
              <select defaultValue="Real Estate Agencies">
                <option>Real Estate Agencies</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>
        </div>
        <div className="inputs-form-grid-1">
          <div className="form-field-group">
            <label>Goal</label>
            <div className="input-select-wrapper">
              <select defaultValue="Find investment-focused agencies">
                <option>Find investment-focused agencies</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>Contact Channels</label>
            <div className="channels-chips-group">
              <span className="channel-chip active-blue">WhatsApp</span>
              <span className="channel-chip active-blue">Email</span>
              <span className="channel-chip active-blue">Phone</span>
              <span className="channel-chip active-blue">Instagram</span>
              <ChevronDown
                size={13}
                style={{ color: "#64748b", marginLeft: "2px" }}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>Number of Leads</label>
            <div className="input-select-wrapper">
              <select defaultValue="50">
                <option>50</option>
                <option>100</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>Minimum AI Score</label>
            <div className="input-select-wrapper">
              <select defaultValue="70%">
                <option>70%</option>
                <option>85%</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>
              AI Search Instructions <span>(Optional)</span>
            </label>
            <div className="input-select-wrapper">
              <input placeholder="E.g., focus on agencies with 5+ agents, active on social media..." />
              <Pencil size={14} className="input-right-icon" />
            </div>
          </div>
        </div>

        <div className="config-action-bottom-row">
          <button className="advanced-options-trigger">
            Advanced Options <ChevronDown size={14} />
          </button>
          <button className="btn-primary" style={{ padding: "0 24px" }}>
            <ToolCase size={14} /> Generate New Leads
          </button>
          <div className="right-action-cluster">
            <div className="toggle-control-label">
              <span>Save this Search</span>
              <div
                className={`switch-toggle-component ${saveSearchActive ? "active-green" : ""}`}
                onClick={() => setSaveSearchActive(!saveSearchActive)}
              ></div>
            </div>
            <button className="btn-clear-form">Clear</button>
          </div>
        </div>
      </div>

      {/* LOWER GRID LAYOUT */}
      <div className="lower-split-dashboard-grid">
        {/* LEFT COLUMN: PROCESS & DATAGRID */}
        <div className="right-analytics">
          {/* 2 & 3: PROCESS & PIPELINE ROW */}
          <div className="process-management-row">
            {/* 2. SOURCE FOCUS */}
            <div className="inner-process-card">
              <h3 className="section-block-title green-theme">
                2. Source Focus (Where Cortexa will look)
              </h3>
              <div className="sources-selection-flex-list">
                {[
                  { label: "Public Web Search", icon: <Globe size={18} /> },
                  {
                    label: "Business / Places Search",
                    icon: <Building2 size={18} />,
                  },
                  { label: "Real Estate Pages", icon: <MapPin size={18} /> },
                  { label: "Developer Websites", icon: <Layers size={18} /> },
                  { label: "Public Listings", icon: <List size={18} /> },
                ].map((s, i) => (
                  <div className="source-checkbox-item-box" key={i}>
                    <CheckCircle2
                      size={18}
                      fill="#2563eb"
                      color="white"
                      className="source-box-check-indicator"
                    />
                    <div className="source-box-icon-center">{s.icon}</div>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="sources-disclaimer-notice-text">
                CORTEXA will investigate these public and approved sources.
              </p>
            </div>

            {/* 3. SEARCH PROGRESS */}
            <div className="inner-process-card">
              <h3 className="section-block-title">3. Search Progress</h3>
              <div className="pipeline-progress-steps-line">
                <div className="pipeline-line-connector-back"></div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon done-state">
                    <CheckCircle2 size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    Searching public sources...
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon active-state">
                    <Search size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    Analyzing results...
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon current-process-state">
                    <Filter size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    Removing duplicates...
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon pending-orange-state">
                    <Sparkles size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    Scoring leads...
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon final-count-state">
                    5
                  </div>
                  <span className="pipeline-step-caption-text">
                    Ready to review
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT ANALYTICS SIDEBAR PANEL */}
        <div className="right-analytics-sidebar-panel">
          {/* Live Summary Stats Card */}
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">Live Summary</h3>
            <div className="analytics-color-legend-list">
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">Sources Checked</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#16a34a" }}
                >
                  24
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">Results Found</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#16a34a" }}
                >
                  186
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">Qualified Leads</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#ea580c" }}
                >
                  32
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">
                  Duplicates Removed
                </span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#dc2626" }}
                >
                  64
                </span>
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ color: "#16a34a" }}>●</span> Job ID: #LG-2024-0587
            </div>
          </div>
        </div>
      </div>
      <div className="lower-split-dashboard-grid lower-split-dashboard-grid-1">
        <div className="lower-split-dashboard-grid-1-left">
          {/* 4. LEADS DATAGRID TABLE */}
          <div className="results-table-container-card">
            <div className="table-top-controls-bar">
              <h3 className="table-main-headline-title">
                4. Leads Found (32 Qualified){" "}
                <Sparkles size={16} color="#ea580c" fill="#ea580c" />
              </h3>

              <div className="table-right-utilities-cluster">
                <div className="dropdown-filter-select-inline">
                  <span>Sort by:</span>
                  <select defaultValue="AI Score (High to Low)">
                    <option>AI Score (High to Low)</option>
                  </select>
                </div>

                <button className="btn-table-util-filter">
                  <Filter size={14} /> Filters
                </button>

                <div className="layout-view-toggle-buttons-group">
                  <button className="btn-layout-grid-list-toggle">
                    <Grid size={14} />
                  </button>
                  <button className="btn-layout-grid-list-toggle active-blue-view">
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Line-Based Data Layout System */}
            <div className="clean-line-list-wrapper">
              {leadRecords.map((lead) => (
                <div
                  className={`lead-row-item-line ${selectedLeads.includes(lead.id) ? "row-selected-active" : ""}`}
                  key={lead.id}
                >
                  <div className="lead-profil-wrap">
                    {/* Column 1: Checkbox */}

                    {/* Column 2: Profile Identity */}
                    <div className="lead-profile-identity-block">
                      <div>
                        <input
                          type="checkbox"
                          className="row-selection-checkbox-input"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                      </div>
                      <img
                        src={lead.avatar}
                        alt={lead.name}
                        className="lead-photo-avatar-circle"
                      />
                      <div className="lead-text-details-stack">
                        <h4>
                          {lead.name}{" "}
                          {lead.badge && (
                            <span className="badge-new-arrival">
                              {lead.badge}
                            </span>
                          )}
                        </h4>
                        <p>{lead.email}</p>
                        <div className="lead-communications-link-row">
                          <Phone size={14} />
                          {lead.phone}
                          <span className="whatsapp-icon-inline-svg">●</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Custom Blue Agent Terminology */}
                    <div className="text-center">
                      <span className="agent-role-label-text">{lead.role}</span>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          className={`temperature-badge-pill ${lead.temp.toLowerCase()}`}
                        >
                          {lead.temp}
                        </span>
                      </div>
                      <div className="ai-score-percentage-capsule">
                        <span>AI Score</span>
                        <div className="ai-score-ring-mini mid-green">
                          {lead.aiScore}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Column 5: Interests & Budget */}
                  <div className="lead-intent-interests-paragraph">
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                      Interested In
                    </span>
                    {lead.interest}
                    <span>Budget: {lead.budget}</span>
                  </div>

                  {/* Column 6: Routing Source & Action Elements */}
                  <div>
                    <div className="lead-origin-source-routing-block">
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        Source
                      </span>
                      <div>{lead.source}</div>
                      <a href="#link" className="source-external-link-anchor">
                        {lead.sourceUrl} <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Column 7: Actions Button */}
                  <div>
                    <div className="suggested-action-next-step-block">
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        Suggested Action
                      </span>
                      <div style={{ fontSize: "11px", marginBottom: "4px" }}>
                        {lead.action}
                      </div>
                    </div>
                    <div className="table-row-actions-group">
                      <button className="btn-save-row-lead">
                        <Toolbox size={12} />
                        Save
                      </button>
                      <button className="btn-row-more-options">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Processing Action Footer Bar */}
            <div className="bulk-processing-footer-bar">
              <div className="bulk-selection-count-indicator-text">
                {selectedLeads.length} Selected{" "}
                <button onClick={() => setSelectedLeads([])}>
                  Clear Selection
                </button>
              </div>

              <div className="bulk-action-buttons-cluster">
                <button className="btn-footer-secondary-util">
                  <Trash2 size={14} /> Ignore Duplicates
                </button>
                <button className="btn-footer-action-blue-submit">
                  <Save size={14} /> Save Selected ({selectedLeads.length})
                </button>
                <button className="btn-footer-action-green-submit">
                  <NotepadTextDashed size={14} /> Save All Qualified (32)
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="right-analytics-sidebar-panel lower-split-dashboard-grid-1-right">
          {/* AI Score Insights Card */}
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">AI Score Insights</h3>
            <div className="ai-score-donut-chart-wrap">
              <div className="ai-score-donut-chart-graphic-box">
                <svg
                  width="100"
                  height="100"
                  className="donut-svg-canvas-wrapper"
                  viewBox="0 0 42 42"
                >
                  {/* Hot - 10/32 -> 31.25% */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    className="donut-segment hot-green-segment"
                    strokeDasharray="31.25 68.75"
                    strokeDashoffset="0"
                  />

                  {/* Warm - 17/32 -> 53.125% */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    className="donut-segment warm-orange-segment"
                    strokeDasharray="53.125 46.875"
                    strokeDashoffset="-31.25"
                  />

                  {/* Cold - 5/32 -> 15.625% */}
                  <circle
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    className="donut-segment cold-red-segment"
                    strokeDasharray="15.625 84.375"
                    strokeDashoffset="-84.375"
                  />
                </svg>
                <div className="donut-center-absolute-labels-stack">
                  <h3>32</h3>
                  <p>
                    Qualified
                    <br /> Leads
                  </p>
                </div>
              </div>

              <div className="analytics-color-legend-list">
                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator hot-red"></div>
                    <span>Hot (70-100)</span>
                  </div>
                  <span className="legend-count-value-number">10</span>
                </div>

                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator warm-orange"></div>
                    <span>Warm (40-69)</span>
                  </div>
                  <span className="legend-count-value-number">17</span>
                </div>

                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator cold-blue"></div>
                    <span>Cold (0-39)</span>
                  </div>
                  <span className="legend-count-value-number">5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities Found Distribution Card */}
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">Top Cities Found</h3>
            <div className="cities-distribution-ranking-list">
              {cityRankings.map((city, cIdx) => (
                <div className="city-ranking-row-item" key={cIdx}>
                  <div className="city-name-left-group">
                    <span className="city-bullet-icon-svg">○</span>
                    {city.name}
                  </div>
                  <span className="city-leads-count-metric-num">
                    {city.count}
                  </span>
                </div>
              ))}
            </div>

            <button className="sidebar-action-view-all-link-btn">
              View All Cities <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
