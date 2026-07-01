import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/apiClient";
import "./pipeline.css";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Plus,
  Calendar,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Sparkles,
  Send,
  Users,
  Bot,
  Clock3,
  TrendingUp,
  Flame,
  ArrowRight,
  Brain,
  Settings2,
  Home,
  Smile,
  Paperclip,
  ImageIcon,
  Mic,
  ArrowUpRight,
  LayoutDashboard,
  Building2,
  Contact2,
  KanbanSquare,
  Megaphone,
  LineChartIcon,
  CheckSquare,
  HelpCircle,
  Settings,
  Bell,
  LogOut,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  GitFork,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
export default function PipelinePage() {
  const [pipelineStats, setPipelineStats] = useState([]);
  const [pipelineColumns, setPipelineColumns] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [movingDealId, setMovingDealId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedDealEvents, setSelectedDealEvents] = useState([]);
  const [selectedDealLoading, setSelectedDealLoading] = useState(false);
  const [riskQueue, setRiskQueue] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [automationHealth, setAutomationHealth] = useState([]);
  const [forecastRange, setForecastRange] = useState("month");
  const [showFilters, setShowFilters] = useState(false);
  const [scoringDealId, setScoringDealId] = useState(null);

  const [pipelineFilters, setPipelineFilters] = useState({
    stage: "all",
    risk: "all",
    tag: "all",
    minValue: "",
  });

  const [createDealForm, setCreateDealForm] = useState({
    name: "",
    value: "",
    stage: "new",
    notes: "",
  });
  const statIcons = {
    users: <Users size={20} />,
    dollar: <DollarSign size={20} />,
    check: <CheckCircle2 size={20} />,
    flame: <Flame size={20} />,
    bot: <Bot size={20} />,
    alert: <AlertTriangle size={20} />,
  };

  const fetchPipelineDashboard = async () => {
    try {
      setPipelineLoading(true);

      const response = await apiClient.request(
        `/pipeline/dashboard?forecastRange=${forecastRange}`,
        {
          method: "GET",
        },
      );

      const data = response?.data || response || {};

      setPipelineStats(Array.isArray(data.stats) ? data.stats : []);
      setPipelineColumns(Array.isArray(data.columns) ? data.columns : []);
      setRiskQueue(Array.isArray(data.riskQueue) ? data.riskQueue : []);
      setForecast(data.forecast || null);
      setAutomationHealth(
        Array.isArray(data.automationHealth) ? data.automationHealth : [],
      );
      const columns = Array.isArray(data.columns) ? data.columns : [];
      const firstDeal = columns.flatMap((col) => col.deals || [])[0] || null;

      if (!selectedDeal && firstDeal) {
        setSelectedDeal(firstDeal);
        fetchDealEvents(firstDeal.id);
      }
    } catch (err) {
      console.error("Fetch pipeline dashboard error:", err);
    } finally {
      setPipelineLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineDashboard();
  }, [forecastRange]);

  const moveDealToNextStage = async (deal, currentStage) => {
    const stageOrder = [
      "new",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ];
    const index = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[index + 1];

    if (!deal?.id || !nextStage) return;

    try {
      setMovingDealId(deal.id);

      await apiClient.request(`/pipeline/deals/${deal.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          stage: nextStage,
        }),
      });

      fetchPipelineDashboard();
    } catch (err) {
      console.error("Move deal error:", err);
    } finally {
      setMovingDealId(null);
    }
  };

  const visibleColumns = pipelineColumns
    .filter((column) => {
      return (
        pipelineFilters.stage === "all" || column.id === pipelineFilters.stage
      );
    })
    .map((column) => {
      const keyword = search.trim().toLowerCase();

      return {
        ...column,
        deals: (column.deals || []).filter((deal) => {
          const matchesSearch = !keyword
            ? true
            : [deal.name, deal.property, deal.amount, deal.tag, deal.stage]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));

          const matchesRisk =
            pipelineFilters.risk === "all" ||
            String(deal.risk || "").toLowerCase() === pipelineFilters.risk;

          const matchesTag =
            pipelineFilters.tag === "all" ||
            String(deal.tag || "").toLowerCase() === pipelineFilters.tag;

          const matchesValue =
            !pipelineFilters.minValue ||
            Number(deal.value || 0) >= Number(pipelineFilters.minValue || 0);

          return matchesSearch && matchesRisk && matchesTag && matchesValue;
        }),
      };
    });
  const createDeal = async (e) => {
    e.preventDefault();

    try {
      await apiClient.request("/pipeline/deals", {
        method: "POST",
        body: JSON.stringify({
          name: createDealForm.name,
          value: Number(createDealForm.value || 0),
          stage: createDealForm.stage,
          notes: createDealForm.notes,
        }),
      });

      setShowCreateDealModal(false);

      setCreateDealForm({
        name: "",
        value: "",
        stage: "new",
        notes: "",
      });

      fetchPipelineDashboard();
    } catch (err) {
      console.error("Create deal error:", err);
    }
  };
  const fetchDealEvents = async (dealId) => {
    if (!dealId) return;

    try {
      setSelectedDealLoading(true);

      const response = await apiClient.request(
        `/pipeline/deals/${dealId}/events`,
        {
          method: "GET",
        },
      );

      const data = response?.data || response || {};
      setSelectedDealEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      console.error("Fetch deal events error:", err);
      setSelectedDealEvents([]);
    } finally {
      setSelectedDealLoading(false);
    }
  };
  const selectDeal = (deal) => {
    setSelectedDeal(deal);
    fetchDealEvents(deal.id);
  };
  const reviewRiskDeal = (dealId) => {
    const allDeals = pipelineColumns.flatMap((col) => col.deals || []);
    const matchedDeal = allDeals.find(
      (deal) => String(deal.id) === String(dealId),
    );

    if (!matchedDeal) return;

    selectDeal(matchedDeal);

    setTimeout(() => {
      document
        .querySelector(".selected-deal-bottom-drilldown-inspector-panel")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  };
  const renderTrend = (trend, fallback = "→ 0%") => {
    if (!trend) return fallback;
    if (typeof trend === "string") return trend;
    return trend.text || fallback;
  };

  const getTrendClass = (trend, fallback = "text-slate") => {
    if (!trend || typeof trend === "string") return fallback;
    return trend.className || fallback;
  };
  const exportPipelineCsv = () => {
    const rows = visibleColumns.flatMap((column) =>
      (column.deals || []).map((deal) => ({
        stage: column.title,
        name: deal.name || "",
        contact: deal.property || "",
        amount: deal.amount || "",
        value: deal.value || 0,
        score: deal.score || "",
        tag: deal.tag || "",
        risk: deal.risk || "",
        nextAction: deal.action || "",
        updated: deal.time || "",
      })),
    );

    const headers = [
      "Stage",
      "Deal Name",
      "Contact",
      "Amount",
      "Raw Value",
      "AI Score",
      "Tag",
      "Risk",
      "Next Action",
      "Updated",
    ];

    const csv = [
      headers,
      ...rows.map((row) => [
        row.stage,
        row.name,
        row.contact,
        row.amount,
        row.value,
        row.score,
        row.tag,
        row.risk,
        row.nextAction,
        row.updated,
      ]),
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pipeline-deals.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const scoreDeal = async (deal) => {
    if (!deal?.id) return;

    try {
      setScoringDealId(deal.id);

      const response = await apiClient.request(
        `/pipeline/deals/${deal.id}/score`,
        {
          method: "POST",
        },
      );

      const result = response?.data || response;

      setSelectedDeal((prev) =>
        prev?.id === deal.id
          ? {
              ...prev,
              score: `${result.score || 0}%`,
              tag: result.tag || prev.tag,
              risk: result.risk || prev.risk,
              suggestedSteps: result.nextActions || prev.suggestedSteps,
              aiReason: result.reason || prev.aiReason,
            }
          : prev,
      );

      await fetchDealEvents(deal.id);
      await fetchPipelineDashboard();
    } catch (err) {
      console.error("Score deal error:", err);
    } finally {
      setScoringDealId(null);
    }
  };
  const confidenceData = [{ v: 80 }, { v: 85 }, { v: 83 }, { v: 92 }];
  const riskData = [{ v: 100 }, { v: 150 }, { v: 280 }, { v: 310 }];
  const closingData = [{ v: 500 }, { v: 700 }, { v: 900 }, { v: 1100 }];
  return (
    <div className="pipeline-container-layout pipeline-page">
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>Pipeline & Deals</h1>
      </div>
      <p className="sub_head">
        Tract opportunities, AI deal flow, revenue risk, and close probability
        in real time.
      </p>
      <header className="pipeline-page-header">
        <div className="header-global-actions">
          <div className="header-search-input-wrapper">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search deals..."
              className="global-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`secondary-btn filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
          <button className="secondary-btn active-view-btn">
            <Sparkles size={15} /> AI Pipeline View
          </button>
          <button className="secondary-btn" onClick={exportPipelineCsv}>
            <Download size={15} /> Export
          </button>
          <button
            className="primary-btn"
            onClick={() => setShowCreateDealModal(true)}
          >
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </header>

      {/* CONTROLS & DRILLDOWN FILTER BAR */}
      <section className="pipeline-horizontal-filters">
        {/* 1. Date Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <Calendar size={15} />
            <select defaultValue="may12-may18">
              <option value="may12-may18">May 12 – May 18, 2025</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 2. Sources Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <Layers size={15} />
            <select defaultValue="">
              <option value="">All Sources</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 3. Stages Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <GitFork size={15} />
            <select
              value={pipelineFilters.stage}
              onChange={(e) =>
                setPipelineFilters((prev) => ({
                  ...prev,
                  stage: e.target.value,
                }))
              }
            >
              <option value="all">All Stages</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 4. Priorities Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <AlertCircle size={15} />
            <select
              value={pipelineFilters.risk}
              onChange={(e) =>
                setPipelineFilters((prev) => ({
                  ...prev,
                  risk: e.target.value,
                }))
              }
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 5. AI Scores Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <Sparkles size={15} />
            <select
              value={pipelineFilters.tag}
              onChange={(e) =>
                setPipelineFilters((prev) => ({ ...prev, tag: e.target.value }))
              }
            >
              <option value="all">All AI Scores</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 6. Agents Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <UserCheck size={15} />
            <select defaultValue="">
              <option value="">All Agents</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
      </section>

      {/* SUMMARY STATS GRID */}
      <section className="pipeline-stats-cards-grid">
        {pipelineStats.map((card, idx) => (
          <div className="pipeline-stat-card-item" key={idx}>
            <div className={`stat-card-icon-box ${card.className}`}>
              {statIcons[card.iconKey]}
            </div>
            <div className="stat-card-content-wrapper">
              <span className="stat-card-label-title">{card.title}</span>
              <h2 className="stat-card-numeric-value">{card.value}</h2>
              <span className={`stat-card-trend-indicator ${card.changeClass}`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* AI INSIGHTS NOTIFICATION BANNER */}
      <section className="ai-intelligence-insight-banner">
        <div className="ai-banner-left-info">
          <div className="ai-sparkle-avatar-glow">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="ai-banner-text-details">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="ai-banner-header-title">
                AI Pipeline Intelligence
              </h3>
              <span className="ai-intelligence-active-badge">Active</span>
            </div>
            <p className="ai-banner-description">
              Cortexa analyzes your pipeline, detects revenue risk, and
              recommends next best actions to accelerate deal velocity.
            </p>
          </div>
        </div>

        <div className="ai-banner-metrics-container">
          <div className="ai-metric-column-box">
            <span className="ai-metric-box-label">AI Confidence</span>
            <div className="ai-metric-content-wrapper">
              <div className="ai-metric-value-group">
                <strong className="ai-metric-box-value">92%</strong>
                <span className="ai-metric-pill-green">High</span>
              </div>

              <div className="ai-mini-chart-inline">
                <ResponsiveContainer width="100%" height={24}>
                  <LineChart data={confidenceData}>
                    <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="#22c55e"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="ai-metric-column-box">
            <span className="ai-metric-box-label">Revenue At Risk</span>
            <div className="ai-metric-content-wrapper">
              <div className="ai-metric-value-group">
                <strong className="ai-metric-box-value">$310K</strong>
                <span className="ai-metric-pill-red">High</span>
              </div>

              <div className="ai-mini-chart-inline">
                <ResponsiveContainer width="100%" height={24}>
                  <LineChart data={riskData}>
                    <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="ai-metric-column-box">
            <span className="ai-metric-box-label">Expected Closings</span>
            <div className="ai-metric-content-wrapper">
              <div className="ai-metric-value-group">
                <strong className="ai-metric-box-value">$1.1M</strong>
                <span className="ai-metric-pill-blue">This Month</span>
              </div>

              <div className="ai-mini-chart-inline">
                <ResponsiveContainer width="100%" height={24}>
                  <LineChart data={closingData}>
                    <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="ai-banner-action-buttons-group">
          <button className="ai-action-primary-trigger-btn">
            <Sparkles size={14} /> Analyze Pipeline
          </button>
          <button className="ai-action-secondary-trigger-btn">
            <Bot size={14} /> Auto-Prioritize Deals
          </button>
          <button className="ai-action-secondary-trigger-btn">
            <Download size={14} /> Export Report
          </button>
        </div>
      </section>

      {/* KANBAN BOARD SECTION */}
      <section className="pipeline-kanban-board-scrollable-container">
        {pipelineLoading ? (
          <div className="pipeline-loading-state">
            <RefreshCw size={18} className="spin" />
            Loading pipeline...
          </div>
        ) : (
          visibleColumns.map((col) => (
            <div className="kanban-stage-column-wrapper" key={col.id}>
              <div className="kanban-column-header-details">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className={`column-status-dot dot-${col.id}`}></span>
                    <h3 className="column-stage-title-text">{col.title}</h3>
                  </div>

                  <button className="deal-card-context-menu-trigger">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              <div className="kanban-sub flex items-center gap-2 text-xs text-slate-500">
                <span className="column-deals-counter-badge">
                  {col.count} deals
                </span>
                <span className="column-header-divider">•</span>
                <span className="column-aggregate-financial-sum">
                  {col.amount}
                </span>
              </div>

              <div className="kanban-column-ai-insight-strip">
                <span>AI Insight: {col.insight}</span>
              </div>

              <div className="kanban-cards-vertical-stack">
                {col.deals.map((deal, dIdx) => (
                  <div
                    className={`kanban-deal-card-item ${
                      selectedDeal?.id === deal.id ? "active" : ""
                    }`}
                    key={deal.id}
                    onClick={() => selectDeal(deal)}
                  >
                    <div className="deal-card-header-top-row">
                      <div
                        className={`deal-card-avatar-circle ${deal.avatarClass}`}
                      >
                        {deal.avatarInitials}
                      </div>

                      <div className="deal-card-lead-identity">
                        <div className="flex justify-between items-start w-full">
                          <h4 className="deal-card-client-name">{deal.name}</h4>

                          <span
                            className={`deal-card-temperature-tag tag-${deal.tag.toLowerCase()}`}
                          >
                            {deal.tag}
                          </span>
                        </div>
                        <span className="deal-card-property-title">
                          {deal.property}
                        </span>
                        <strong className="deal-card-financial-value">
                          {deal.amount}
                        </strong>
                      </div>
                    </div>

                    <div className="deal-card-ai-score-metric-row">
                      <div className="flex justify-between items-center mb-1">
                        <span className="ai-score-label-text">AI Score</span>
                        <span className="ai-score-numeric-percentage">
                          {deal.score}
                        </span>
                      </div>
                      <div className="ai-score-horizontal-progress-bar-bg">
                        <div
                          className="ai-score-horizontal-progress-fill-active"
                          style={{ width: deal.score }}
                        ></div>
                      </div>
                    </div>

                    <div className="deal-card-recommended-next-action-box">
                      <div className="flex justify-between items-center">
                        <span className="next-action-label-title">
                          Next Best Action
                        </span>
                        <span className="next-action-timestamp-clock">
                          <Clock3 size={11} /> {deal.time}
                        </span>
                      </div>
                      <span className="next-action-description-text">
                        <Clock3 size={11} /> {deal.action}
                      </span>
                      {/*{deal.nextStep && (
                      <div className="deal-card-extended-next-step-strip">
                       <span className="extended-step-label">Next Step:</span>
                        <span className="extended-step-desc">
                          {deal.nextStep}
                        </span>
                      </div>
                    )}*/}
                    </div>

                    <div className="deal-card-bottom-interactive-action-triggers">
                      <button
                        className="deal-card-footer-action-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          scoreDeal(deal);
                        }}
                        disabled={scoringDealId === deal.id}
                      >
                        <Sparkles size={12} />
                        {scoringDealId === deal.id ? "Scoring..." : "Score"}
                      </button>
                      <button
                        className="deal-card-footer-action-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDealToNextStage(deal, col.id);
                        }}
                        disabled={movingDealId === deal.id || col.id === "lost"}
                      >
                        <ArrowUpRight size={12} />
                        {movingDealId === deal.id ? "Moving..." : "Move"}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="kanban-column-add-deal-inline-trigger-btn"
                  onClick={() => {
                    setCreateDealForm((prev) => ({
                      ...prev,
                      stage: col.id,
                    }));
                    setShowCreateDealModal(true);
                  }}
                >
                  <Plus size={14} /> Add Deal
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* SPLIT BOTTOM INTELLIGENCE GRID */}
      <section className="pipeline-bottom-split-intelligence-grid">
        {/* PANEL 1: AI DEAL RISK QUEUE */}
        <div className="bottom-intelligence-card-panel">
          <div className="intelligence-card-header-row">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="intelligence-header-icon" />
              <h3 className="intelligence-card-main-title">
                AI Deal Risk Queue
              </h3>
              <span className="intelligence-card-sub-header-counter">
                {riskQueue.length} at-risk deals need attention
              </span>
            </div>
            <button className="intelligence-view-all-navigation-link">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="risk-queue-table-rows-wrapper">
            {riskQueue.length ? (
              riskQueue.map((row) => (
                <div className="risk-queue-table-row-item" key={row.id}>
                  <span className="risk-table-cell-property-name">
                    {row.name}
                  </span>
                  <strong className="risk-table-cell-deal-value">
                    {row.value}
                  </strong>
                  <span className="risk-table-cell-risk-reason-desc">
                    {row.reason}
                  </span>
                  <span
                    className={`risk-table-cell-severity-badge status-${String(
                      row.status || "medium",
                    ).toLowerCase()}`}
                  >
                    {row.status}
                  </span>
                  <button
                    className="risk-table-cell-action-review-trigger-btn"
                    onClick={() => reviewRiskDeal(row.id)}
                  >
                    Review
                  </button>
                </div>
              ))
            ) : (
              <div className="risk-queue-table-row-item">
                <span className="risk-table-cell-property-name">
                  No at-risk deals
                </span>
                <strong className="risk-table-cell-deal-value">$0</strong>
                <span className="risk-table-cell-risk-reason-desc">
                  Pipeline healthy
                </span>
                <span className="risk-table-cell-severity-badge status-medium">
                  Low
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: REVENUE FORECAST */}
        <div className="bottom-intelligence-card-panel">
          <div className="intelligence-card-header-row">
            <div className="flex items-center gap-2">
              <LineChartIcon size={18} className="intelligence-header-icon" />
              <h3 className="intelligence-card-main-title">Revenue Forecast</h3>
            </div>
            <div className="secondary-btn compact-dropdown-trigger">
              <select
                value={forecastRange}
                onChange={(e) => setForecastRange(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          <div className="revenue-forecast-metrics-grid-quad">
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Forecasted Revenue
              </span>
              <strong className="forecast-quad-card-large-numeric">
                {forecast?.forecastedRevenue || "$0"}
              </strong>
              <span
                className={`forecast-quad-card-trend-subtext ${getTrendClass(
                  forecast?.forecastedRevenueTrend,
                )}`}
              >
                {renderTrend(forecast?.forecastedRevenueTrend)}
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Forecasted Closings
              </span>
              <strong className="forecast-quad-card-large-numeric">
                {forecast?.forecastedClosings || 0}
              </strong>
              <span
                className={`forecast-quad-card-trend-subtext ${getTrendClass(
                  forecast?.forecastedClosingsTrend,
                )}`}
              >
                {renderTrend(forecast?.forecastedClosingsTrend)}
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Pipeline Velocity
              </span>
              <strong className="forecast-quad-card-large-numeric">
                {forecast?.pipelineVelocity || "0x"}
              </strong>
              <span
                className={`forecast-quad-card-trend-subtext ${getTrendClass(
                  forecast?.pipelineVelocityTrend,
                )}`}
              >
                {renderTrend(forecast?.pipelineVelocityTrend)}
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">Close Confidence</span>
              <strong className="forecast-quad-card-large-numeric">
                {forecast?.closeConfidence || "0%"}
              </strong>
              <span
                className={`forecast-quad-card-trend-subtext ${getTrendClass(
                  forecast?.closeConfidenceTrend,
                )}`}
              >
                {renderTrend(
                  forecast?.closeConfidenceTrend,
                  "→ Medium Confidence",
                )}
              </span>
            </div>
          </div>

          <p className="revenue-forecast-footer-explanatory-text">
            {forecast?.description || "No forecast available yet."}
          </p>
        </div>

        {/* PANEL 3: AUTOMATION HEALTH */}
        <div className="bottom-intelligence-card-panel">
          <div className="intelligence-card-header-row">
            <div className="flex items-center gap-2">
              <Settings size={18} className="intelligence-header-icon" />
              <h3 className="intelligence-card-main-title">
                Automation Health
              </h3>
            </div>
            <span className="automation-global-status-indicator-pill">
              <span className="live-status-dot-green"></span> All Systems
              Operational
            </span>
          </div>

          <div className="automation-health-list-rows-stack">
            {automationHealth.map((item, iIdx) => (
              <div className="automation-health-row-item" key={iIdx}>
                <div className="flex items-center gap-2">
                  <CheckSquare
                    size={14}
                    className="automation-item-check-icon"
                  />
                  <span className="automation-health-item-title-text">
                    {item.title}
                  </span>
                </div>
                <span className="automation-health-item-status-active-badge">
                  {item.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELECTED DEAL BOTTOM DRILLDOWN VIEW CARD */}
      <section className="selected-deal-bottom-drilldown-inspector-panel">
        <div className="inspector-panel-grid-layout">
          <div className="select-deal">
            <div className="inspector-left-identity-column">
              <span className="inspector-section-small-overhead-label">
                Selected Deal
              </span>
              <div className="flex items-start gap-3 mt-2">
                <div
                  className={`inspector-deal-avatar-circle ${selectedDeal?.avatarClass || "avatar-purple"}`}
                >
                  {selectedDeal?.avatarInitials || "D"}
                </div>
                <div className="inspector-deal-wrap">
                  <h4 className="inspector-deal-client-name">
                    {selectedDeal?.name || "Select a deal"}
                  </h4>

                  <span className="inspector-deal-property-title">
                    {selectedDeal?.property || "No deal selected"}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <strong className="inspector-deal-financial-value">
                      {selectedDeal?.amount || "$0"}
                    </strong>
                    <span
                      className={`deal-card-temperature-tag tag-${String(selectedDeal?.tag || "warm").toLowerCase()}`}
                    >
                      {selectedDeal?.tag || "Warm"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="inspector-center-metrics-column">
              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">AI Score</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="inspector-metric-card-large-value">
                    {selectedDeal?.score || "0%"}
                  </strong>
                </div>
                <div className="inspector-metric-horizontal-progress-bar-bg">
                  <div
                    className="inspector-metric-horizontal-progress-fill"
                    style={{ width: selectedDeal?.score || "0%" }}
                  ></div>
                </div>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">Risk</span>
                <strong className="inspector-metric-card-large-value text-red mt-1 tag-hot">
                  {selectedDeal?.risk || "Low"}
                </strong>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">Stage</span>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`column-status-dot dot-${selectedDeal?.stage || "new"}`}
                  ></span>
                  <strong className="inspector-metric-card-standard-text tag-purple">
                    {selectedDeal?.stage || "new"}
                  </strong>
                </div>
              </div>

              <div className="ofmobile inspector-metric-box-card">
                <span className="inspector-metric-card-label">Next Action</span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} />{" "}
                  <span>{selectedDeal?.action || "No action"}</span>
                </div>
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} />{" "}
                  {selectedDeal?.time || "Recently updated"}
                </span>
              </div>
            </div>
            <div className="mobile inspector-metric-box-card">
              <span className="inspector-metric-card-label">Next Action</span>
              <div className="follow-up-right">
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} />{" "}
                  {selectedDeal?.time || "Recently updated"}
                </span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} />{" "}
                  <span>{selectedDeal?.action || "No action"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="inspector-deal-activity-log-column">
            <div className="flex justify-between items-center mb-2">
              <span className="inspector-section-small-overhead-label">
                Deal Activity
              </span>
              <button className="intelligence-view-all-navigation-link text-xs">
                View All
              </button>
            </div>
            <div className="inspector-activity-logs-mini-stack">
              {selectedDealLoading ? (
                <div className="inspector-activity-log-row-item">
                  <span className="activity-log-dot-indicator blue-dot"></span>
                  <span className="activity-log-description-text">
                    Loading activity...
                  </span>
                </div>
              ) : selectedDealEvents.length ? (
                selectedDealEvents.map((event) => (
                  <div
                    className="inspector-activity-log-row-item"
                    key={event.id}
                  >
                    <span className="activity-log-dot-indicator blue-dot"></span>
                    <span className="activity-log-description-text">
                      {event.metadata?.title || "Deal activity"}
                    </span>
                    <span className="activity-log-relative-timestamp">
                      {event.timeAgo || "Recently updated"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="inspector-activity-log-row-item">
                  <span className="activity-log-dot-indicator green-dot"></span>
                  <span className="activity-log-description-text">
                    No activity yet.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="inspector-ai-next-steps-actions-column">
            <span className="inspector-section-small-overhead-label">
              AI Suggested Next Steps
            </span>
            {selectedDeal?.aiReason && (
              <p className="inspector-ai-reason-text">
                {selectedDeal.aiReason}
              </p>
            )}
            <div className="inspector-ai-action-steps-rows-stack mt-2">
              {(selectedDeal?.suggestedSteps || []).length ? (
                selectedDeal.suggestedSteps.map((step, index) => (
                  <div
                    className="inspector-ai-action-step-row-item"
                    key={index}
                  >
                    <span className="ai-step-title-text">{step.title}</span>
                    <span
                      className={`ai-step-impact-badge impact-${String(
                        step.impact || "medium",
                      ).toLowerCase()}`}
                    >
                      {step.impactLabel || "Medium impact"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="inspector-ai-action-step-row-item">
                  <span className="ai-step-title-text">
                    No AI suggestions yet
                  </span>
                  <span className="ai-step-impact-badge impact-medium">
                    Pending
                  </span>
                </div>
              )}
            </div>
            <button className="inspector-ai-action-primary-trigger-cta-btn">
              Send AI Suggestions
            </button>
          </div>
        </div>
      </section>

      {/* BOTTOM REVENUE COMMAND CENTER BAR */}
      <section className="revenue-command-center-sticky-bottom-bar">
        <div className="command-center-left flex items-center gap-4">
          <div className="command-center-sparkle-avatar-box">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="command-center-wrap">
            <h3 className="command-center-main-title">
              Revenue Command Center
            </h3>
            <p className="command-center-sub-description">
              Track deal flow, detect revenue risk, and get AI-powered
              recommendations to maximize conversions and accelerate closings.
            </p>
          </div>
        </div>
        <button className="command-center-run-review-cta-btn">
          <Sparkles size={16} fill="currentColor" /> Run AI Deal Review
        </button>
      </section>
      {showCreateDealModal && (
        <div className="pipeline-modal-overlay">
          <div className="pipeline-modal">
            <div className="pipeline-modal-header">
              <h3>Create New Deal</h3>

              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setShowCreateDealModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createDeal}>
              <div className="pipeline-modal-body">
                <div className="pipeline-form-grid">
                  <div className="pipeline-form-field full">
                    <label>Deal Name</label>
                    <input
                      required
                      value={createDealForm.name}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Example: Luxury villa buyer"
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>Value</label>
                    <input
                      type="number"
                      value={createDealForm.value}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          value: e.target.value,
                        })
                      }
                      placeholder="250000"
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>Stage</label>
                    <select
                      value={createDealForm.stage}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          stage: e.target.value,
                        })
                      }
                    >
                      <option value="new">New</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div className="pipeline-form-field full">
                    <label>Notes</label>
                    <textarea
                      rows="4"
                      value={createDealForm.notes}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add deal notes..."
                    />
                  </div>
                </div>
              </div>

              <div className="pipeline-modal-footer">
                <button
                  type="button"
                  className="pipeline-btn-cancel"
                  onClick={() => setShowCreateDealModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="pipeline-btn-save">
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
