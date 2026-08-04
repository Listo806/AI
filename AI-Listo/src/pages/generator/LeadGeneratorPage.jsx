import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [saveSearchActive, setSaveSearchActive] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([1, 2]);

  const topMetrics = [
    {
      title: t("generator.metricGeneratedLeads"),
      value: "1,342",
      sub: t("generator.metricGeneratedLeadsSub"),
      type: "blue",
      icon: <Users size={20} />,
    },
    {
      title: t("generator.metricAiQualified"),
      value: "687",
      sub: t("generator.metricAiQualifiedSub"),
      type: "green",
      icon: <Bot size={20} />,
    },
    {
      title: t("generator.metricHotOpportunities"),
      value: "213",
      sub: t("generator.metricHotOpportunitiesSub"),
      type: "red",
      icon: <Flame size={20} />,
    },
    {
      title: t("generator.metricEnrichedLeads"),
      value: "1,089",
      sub: t("generator.metricEnrichedLeadsSub"),
      type: "purple",
      icon: <Layers size={20} />,
    },
    {
      title: t("generator.metricCampaignReady"),
      value: "356",
      sub: t("generator.metricCampaignReadySub"),
      type: "orange",
      icon: <TrendingUp size={20} />,
    },
    {
      title: t("generator.metricMovedToCrm"),
      value: "124",
      sub: t("generator.metricMovedToCrmSub"),
      type: "cyan",
      icon: <CheckCircle2 size={20} />,
    },
    {
      title: t("generator.metricAvgAiScore"),
      value: "78%",
      sub: t("generator.metricAvgAiScoreSub"),
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
        <h1>{t("generator.pageTitle")}</h1>
      </div>
      <p className="sub_head">
        {t("generator.subheading")}
      </p>
      <div className="page-header">
        <div className="header-actions">
          <button className="btn-icon-text">
            <Download size={15} /> {t("generator.export")}
          </button>
          <button className="btn-icon-text">
            <Eye size={15} /> {t("generator.savedSearches")}
          </button>
          <button className="btn-icon-text">
            <Activity size={15} /> {t("generator.campaignDrafts")}
          </button>
          <button className="btn-primary">
            <Sparkles size={15} fill="white" /> {t("generator.generateNewLeads")}
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
          {t("generator.configTitle")}
        </h3>
        <div className="inputs-form-grid">
          <div className="form-field-group">
            <label>{t("generator.labelProductOffer")}</label>
            <div className="input-select-wrapper">
              <select defaultValue={t("generator.optRealEstateInvestmentPack")}>
                <option>{t("generator.optRealEstateInvestmentPack")}</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelCountry")}</label>
            <div className="input-select-wrapper">
              <select defaultValue="Ecuador">
                <option>Ecuador</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelCity")}</label>
            <div className="input-select-wrapper">
              <select defaultValue="Quito">
                <option>Quito</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>
              {t("generator.labelArea")} <span>{t("generator.optional")}</span>
            </label>
            <div className="input-select-wrapper">
              <select defaultValue="Cumbayá, Tumbaco">
                <option>Cumbayá, Tumbaco</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelIndustry")}</label>
            <div className="input-select-wrapper">
              <select defaultValue={t("generator.optRealEstate")}>
                <option>{t("generator.optRealEstate")}</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelBusinessType")}</label>
            <div className="input-select-wrapper">
              <select defaultValue={t("generator.optRealEstateAgencies")}>
                <option>{t("generator.optRealEstateAgencies")}</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>
        </div>
        <div className="inputs-form-grid-1">
          <div className="form-field-group">
            <label>{t("generator.labelGoal")}</label>
            <div className="input-select-wrapper">
              <select defaultValue={t("generator.optFindInvestmentAgencies")}>
                <option>{t("generator.optFindInvestmentAgencies")}</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelContactChannels")}</label>
            <div className="channels-chips-group">
              <span className="channel-chip active-blue">WhatsApp</span>
              <span className="channel-chip active-blue">{t("common.email")}</span>
              <span className="channel-chip active-blue">{t("common.phone")}</span>
              <span className="channel-chip active-blue">Instagram</span>
              <ChevronDown
                size={13}
                style={{ color: "#64748b", marginLeft: "2px" }}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelNumberOfLeads")}</label>
            <div className="input-select-wrapper">
              <select defaultValue="50">
                <option>50</option>
                <option>100</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelMinimumAiScore")}</label>
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
              {t("generator.labelAiSearchInstructions")} <span>{t("generator.optional")}</span>
            </label>
            <div className="input-select-wrapper">
              <input placeholder={t("generator.aiInstructionsPlaceholder")} />
              <Pencil size={14} className="input-right-icon" />
            </div>
          </div>
        </div>

        <div className="config-action-bottom-row">
          <button className="advanced-options-trigger">
            {t("generator.advancedOptions")} <ChevronDown size={14} />
          </button>
          <button className="btn-primary" style={{ padding: "0 24px" }}>
            <ToolCase size={14} /> {t("generator.generateNewLeads")}
          </button>
          <div className="right-action-cluster">
            <div className="toggle-control-label">
              <span>{t("generator.saveThisSearch")}</span>
              <div
                className={`switch-toggle-component ${saveSearchActive ? "active-green" : ""}`}
                onClick={() => setSaveSearchActive(!saveSearchActive)}
              ></div>
            </div>
            <button className="btn-clear-form">{t("generator.clear")}</button>
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
                {t("generator.sourceFocusTitle")}
              </h3>
              <div className="sources-selection-flex-list">
                {[
                  { label: t("generator.sourcePublicWebSearch"), icon: <Globe size={18} /> },
                  {
                    label: t("generator.sourceBusinessPlaces"),
                    icon: <Building2 size={18} />,
                  },
                  { label: t("generator.sourceRealEstatePages"), icon: <MapPin size={18} /> },
                  { label: t("generator.sourceDeveloperWebsites"), icon: <Layers size={18} /> },
                  { label: t("generator.sourcePublicListings"), icon: <List size={18} /> },
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
                {t("generator.sourcesDisclaimer")}
              </p>
            </div>

            {/* 3. SEARCH PROGRESS */}
            <div className="inner-process-card">
              <h3 className="section-block-title">{t("generator.searchProgressTitle")}</h3>
              <div className="pipeline-progress-steps-line">
                <div className="pipeline-line-connector-back"></div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon done-state">
                    <CheckCircle2 size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    {t("generator.progressSearching")}
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon active-state">
                    <Search size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    {t("generator.progressAnalyzing")}
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon current-process-state">
                    <Filter size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    {t("generator.progressRemovingDuplicates")}
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon pending-orange-state">
                    <Sparkles size={15} />
                  </div>
                  <span className="pipeline-step-caption-text">
                    {t("generator.progressScoring")}
                  </span>
                </div>

                <div className="pipeline-single-node-step">
                  <div className="pipeline-node-circle-icon final-count-state">
                    5
                  </div>
                  <span className="pipeline-step-caption-text">
                    {t("generator.progressReady")}
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
            <h3 className="sidebar-card-headline-title">{t("generator.liveSummary")}</h3>
            <div className="analytics-color-legend-list">
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.sourcesChecked")}</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#16a34a" }}
                >
                  24
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.resultsFound")}</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#16a34a" }}
                >
                  186
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.qualifiedLeads")}</span>
                <span
                  className="legend-count-value-number"
                  style={{ color: "#ea580c" }}
                >
                  32
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">
                  {t("generator.duplicatesRemoved")}
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
              <span style={{ color: "#16a34a" }}>●</span> {t("generator.jobId", { id: "#LG-2024-0587" })}
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
                {t("generator.leadsFound", { count: 32 })}{" "}
                <Sparkles size={16} color="#ea580c" fill="#ea580c" />
              </h3>

              <div className="table-right-utilities-cluster">
                <div className="dropdown-filter-select-inline">
                  <span>{t("generator.sortBy")}</span>
                  <select defaultValue={t("generator.sortAiScoreHighLow")}>
                    <option>{t("generator.sortAiScoreHighLow")}</option>
                  </select>
                </div>

                <button className="btn-table-util-filter">
                  <Filter size={14} /> {t("generator.filters")}
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
                        <span>{t("generator.aiScore")}</span>
                        <div className="ai-score-ring-mini mid-green">
                          {lead.aiScore}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Column 5: Interests & Budget */}
                  <div className="lead-intent-interests-paragraph">
                    <span style={{ color: "#64748b", fontSize: "11px" }}>
                      {t("generator.interestedIn")}
                    </span>
                    {lead.interest}
                    <span>{t("generator.budget", { value: lead.budget })}</span>
                  </div>

                  {/* Column 6: Routing Source & Action Elements */}
                  <div>
                    <div className="lead-origin-source-routing-block">
                      <span style={{ color: "#64748b", fontSize: "11px" }}>
                        {t("generator.source")}
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
                        {t("generator.suggestedAction")}
                      </span>
                      <div style={{ fontSize: "11px", marginBottom: "4px" }}>
                        {lead.action}
                      </div>
                    </div>
                    <div className="table-row-actions-group">
                      <button className="btn-save-row-lead">
                        <Toolbox size={12} />
                        {t("common.save")}
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
                {t("generator.selectedCount", { count: selectedLeads.length })}{" "}
                <button onClick={() => setSelectedLeads([])}>
                  {t("generator.clearSelection")}
                </button>
              </div>

              <div className="bulk-action-buttons-cluster">
                <button className="btn-footer-secondary-util">
                  <Trash2 size={14} /> {t("generator.ignoreDuplicates")}
                </button>
                <button className="btn-footer-action-blue-submit">
                  <Save size={14} /> {t("generator.saveSelected", { count: selectedLeads.length })}
                </button>
                <button className="btn-footer-action-green-submit">
                  <NotepadTextDashed size={14} /> {t("generator.saveAllQualified", { count: 32 })}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="right-analytics-sidebar-panel lower-split-dashboard-grid-1-right">
          {/* AI Score Insights Card */}
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">{t("generator.aiScoreInsights")}</h3>
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
                  <p>{t("generator.qualifiedLeads")}</p>
                </div>
              </div>

              <div className="analytics-color-legend-list">
                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator hot-red"></div>
                    <span>{t("generator.rangeHot")}</span>
                  </div>
                  <span className="legend-count-value-number">10</span>
                </div>

                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator warm-orange"></div>
                    <span>{t("generator.rangeWarm")}</span>
                  </div>
                  <span className="legend-count-value-number">17</span>
                </div>

                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator cold-blue"></div>
                    <span>{t("generator.rangeCold")}</span>
                  </div>
                  <span className="legend-count-value-number">5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities Found Distribution Card */}
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">{t("generator.topCitiesFound")}</h3>
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
              {t("generator.viewAllCities")} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
