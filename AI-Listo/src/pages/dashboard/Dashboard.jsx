import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFeatureNotice,
  FeatureNoticeBanner,
} from "../../components/FeatureNotice";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

import {
  LayoutDashboard,
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  MessageCircle,
  Calendar,
  Clock3,
  CheckCircle2,
  Target,
  Zap,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Bell,
  Download,
  Phone,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Menu,
  ChevronDown,
  Briefcase,
  Layers,
  Settings,
  HelpCircle,
  FileText,
  Activity,
  Award,
  Globe,
  Camera,
  Shuffle,
} from "lucide-react";

import "./dashboard.css";
import {
  getDashboardSummary,
  getAnalyticsDashboard,
} from "../../api/analyticsApi";
import { useApiErrorHandler } from "../../utils/useApiErrorHandler";

const money = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000)
    return `$${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  return `$${v.toLocaleString("en-US")}`;
};

export default function CortexaDashboard() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );
  const { handleError } = useApiErrorHandler();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getAnalyticsDashboard("30d").catch(() => null),
        ]);
        if (!active) return;
        setSummary(s);
        setAnalytics(a);
      } catch (err) {
        if (active) handleError(err, "Failed to load dashboard");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { notice, setNotice, notAvailable } = useFeatureNotice();
  const [trendMode, setTrendMode] = useState("revenue");
  // No backend source for these sparklines; empty rather than fabricated curves.
  const confidenceSparkData = [];
  const riskSparkData = [];

  // Live figures from /crm/dashboard/summary + /analytics/dashboard.
  const S = summary || {};
  const A = analytics || {};
  const sLeads = S.leads || {};
  const sDeals = S.deals || {};
  const sProps = S.properties || {};
  const byStage = sDeals.byStage || {};
  const convRate = A.leads?.conversionRate;

  const miniKpis = [
    {
      title: "New Leads",
      value: String(sLeads.new ?? 0),
      subtext: `${sLeads.total ?? 0} total leads`,
      icon: <Users size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: "last 7 days",
    },
    {
      title: "Qualified Leads",
      value: String(sLeads.qualified ?? 0),
      subtext: `${sLeads.contacted ?? 0} contacted`,
      icon: <CheckCircle2 size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: "current",
    },
    {
      title: "Pipeline Value",
      value: money(sDeals.pipelineValue),
      subtext: `${sDeals.total ?? 0} active deals`,
      icon: <Briefcase size={16} className="text-purple" />,
      iconBg: "bg-light-purple",
      intime: "open",
    },
    {
      title: "Won Revenue",
      value: money(sDeals.wonValue),
      subtext: `${byStage.won ?? 0} closed won`,
      icon: <DollarSign size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: "to date",
    },
    {
      title: "Conversion Rate",
      value: convRate != null ? `${convRate}%` : "—",
      subtext: "leads to converted",
      icon: <Percent size={16} className="text-orange" />,
      iconBg: "bg-light-orange",
      intime: "last 30 days",
    },
    {
      title: "Properties",
      value: String(sProps.total ?? 0),
      subtext: `${sProps.published ?? 0} published`,
      icon: <Layers size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: "listed",
    },
  ];

  // No backend source for these on /crm/dashboard/summary or /analytics/dashboard.
  // Kept empty rather than showing fabricated figures; they render as empty sections.
  const secondaryKpis = [];
  const leadSources = [];

  // Trend chart: "Leads" mode has a real source (activity.eventsByDay from
  // /analytics/dashboard); revenue/appointments have none yet and stay empty.
  const eventsByDay = A.activity?.eventsByDay || [];
  const revenueTrendData =
    trendMode === "leads"
      ? eventsByDay.map((d) => ({ day: d.date, trend: d.count }))
      : [];

  // CSV export of the live dashboard figures (client-side)
  const exportDashboardCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["metric", "value"]];
    miniKpis.forEach((k) => rows.push([k.title, k.value]));
    rows.push(["Conversion Rate", convRate != null ? `${convRate}%` : ""]);
    rows.push(["Pipeline Value", sDeals.pipelineValue ?? ""]);
    Object.entries(byStage).forEach(([k, v]) => rows.push([`Deals: ${k}`, v]));
    const blob = new Blob(
      [rows.map((r) => r.map(esc).join(",")).join("\n")],
      { type: "text/csv" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dashboard-summary.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Real deal-stage figures from summary.deals.byStage (counts only; no per-stage $).
  const dealsByStageArr = [
    { name: "New", count: String(byStage.new ?? 0), value: "" },
    { name: "Qualified", count: String(byStage.qualified ?? 0), value: "" },
    { name: "Proposal", count: String(byStage.proposal ?? 0), value: "" },
    { name: "Negotiation", count: String(byStage.negotiation ?? 0), value: "" },
    { name: "Won", count: String(byStage.won ?? 0), value: "" },
  ];
  const _funnelTotal = Number(sLeads.total ?? 0) || 0;
  const _pct = (n) =>
    _funnelTotal > 0 ? Math.round(((Number(n) || 0) / _funnelTotal) * 100) : 0;
  const pipelineFunnelArr = [
    { stage: "Leads", count: String(sLeads.total ?? 0), percent: "100%", width: "100%" },
    { stage: "Qualified", count: String(byStage.qualified ?? 0), percent: `${_pct(byStage.qualified)}%`, width: `${_pct(byStage.qualified)}%` },
    { stage: "Proposal", count: String(byStage.proposal ?? 0), percent: `${_pct(byStage.proposal)}%`, width: `${_pct(byStage.proposal)}%` },
    { stage: "Negotiation", count: String(byStage.negotiation ?? 0), percent: `${_pct(byStage.negotiation)}%`, width: `${_pct(byStage.negotiation)}%` },
    { stage: "Won", count: String(byStage.won ?? 0), percent: `${_pct(byStage.won)}%`, width: `${_pct(byStage.won)}%` },
  ];
  // No backend source for these panels; empty rather than fabricated.
  const aiPriorityQueue = [];
  const riskAlerts = [];
  const liveTracking = [];
  const automationHealth = [];
  const upcomingClosings = [];

  const CustomXAxisTick = ({ x, y, payload }) => {
    const matchedSource = leadSources.find(
      (src) => src.source === payload.value,
    );
    return (
      <g transform={`translate(${x - 6},${y + 6})`}>
        {matchedSource ? matchedSource.icon : null}
      </g>
    );
  };

  return (
    <div className="dashboard-container dashboard-page">
      <div className="heading_page">
        <Layers className="header-icon" size={20} />
        <h1>Dashboard Overview</h1>
      </div>
      <p className="sub_head">
        Real-time overview of your pipeline, performance, and AI activity.
      </p>
      <header className="dashboard-header">
        <div className="header-actions">
          {isMobile ? (
            <>
              <div className="control-btn">
                <Calendar size={15} />
                <span>This Week</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Users size={15} />
                <span>All Teams</span>
                <ChevronDown size={14} />
              </div>   
              <div className="control-btn" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={15} />
                <span></span>
              </div>
            </>
          ) : (
            <>
              <div className="control-btn">
                <Calendar size={15} />
                <span>This Week</span>
              </div>

              <div className="control-btn">
                <Users size={15} />
                <span>All Teams</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Layers size={15} />
                <span>All Sources</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Users size={15} />
                <span>All Agents</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Layers size={15} />
                <span>All Stages</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <SlidersHorizontal size={15} />
                <span>Filters</span>
              </div>

              {/*<div className="notification-icon">
                <Bell size={18} />
                <span className="notif-badge">8</span>
              </div>*/}

              <button className="btn-export" onClick={exportDashboardCsv}>
                <Download size={15} />
                Export
                <ChevronDown size={14} />
              </button>
            </>
          )}
        </div>
      </header>
      <FeatureNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
      {isMobile && showFilters && (
        <>
          <div
            className="filter-overlay"
            onClick={() => setShowFilters(false)}
          />

          <div className="mobile-filter-drawer">
            <div className="drawer-header">
              <h3>Filters</h3>

              <button
                className="drawer-close"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              
              <div className="control-btn">
                <Layers size={15} />
                <span>All Sources</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Users size={15} />
                <span>All Agents</span>
                <ChevronDown size={14} />
              </div>

              <div className="control-btn">
                <Layers size={15} />
                <span>All Stages</span>
                <ChevronDown size={14} />
              </div>
              <button className="btn-export" onClick={exportDashboardCsv}>
                <Download size={15} />
                Export
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </>
      )}
      {/* AI COMMAND CENTER */}
      <section className="ai-command-banner">
        <div className="banner-left">
          <div className="ai-avatar-glow">
            <div className="ai-bot-icon">🤖</div>
          </div>
          <div className="ai-message-ctx">
            <span>AI Command Center</span>
            <h2>
              You have{" "}
              <span className="highlight-blue">{sLeads.qualified ?? 0}</span>{" "}
              qualified leads in your pipeline.
            </h2>
            <p>
              {sLeads.new ?? 0} new leads in the last 7 days.
            </p>
          </div>
        </div>

        <div className="banner-right">
          <div className="banner-right-top">
            <div className="mini-insight-card">
              <div className="card-lbl">Total Leads</div>
              <div className="card-val-group">
                <h3 className="text-green">{sLeads.total ?? 0}</h3>
                <div className="mini-sparkline-container">
                  <ResponsiveContainer width="100%" height={25}>
                    <AreaChart
                      data={confidenceSparkData}
                      margin={{ top: 2, bottom: 2, left: 2, right: 2 }}
                    >
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#22c55e"
                        strokeWidth={1.5}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="mini-insight-card">
              <div className="card-lbl">Pipeline Value</div>
              <div className="card-val-group">
                <h3 className="text-orange">{money(sDeals.pipelineValue)}</h3>
                <div className="mini-sparkline-container">
                  <ResponsiveContainer width="100%" height={25}>
                    <AreaChart
                      data={riskSparkData}
                      margin={{ top: 2, bottom: 2, left: 2, right: 2 }}
                    >
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#ea580c"
                        strokeWidth={1.5}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="mini-insight-card next-action-card">
              <Briefcase size={16} />
              <div>
                <div className="card-lbl">Active Deals</div>
                <h4>{sDeals.total ?? 0}</h4>
              </div>
            </div>
          </div>
          <div className="banner-action-row">
            <button className="banner-btn text-dark" onClick={() => notAvailable("Call")}>
              <Phone size={16} /> Call
            </button>
            <button className="banner-btn btn-whatsapp-color" onClick={() => navigate("/dashboard/whatsapp")}>
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button className="banner-btn btn-assign-color" onClick={() => notAvailable("Assign")}>
              <Users size={16} /> Assign
            </button>
            <button className="banner-btn btn-followup-color" onClick={() => notAvailable("Follow-up")}>
              <Calendar size={16} /> Follow-up
            </button>
          </div>
        </div>
      </section>

      {/* PRIMARY KPI CARDS */}
      <section className="kpi-row-grid grid-6-col">
        {miniKpis.map((kpi, idx) => (
          <div key={idx} className="kpi-mini-card version-primary">
            <div className="kpi-main-row">
              <div className={`kpi-icon-wrapper ${kpi.iconBg}`}>{kpi.icon}</div>
              <div className="kpi-main-right">
                <span className="kpi-lbl">{kpi.title}</span>
                <h2 className="kpi-main-val">{kpi.value}</h2>
                {kpi.delta ? (
                  <span
                    className={`kpi-indicator-badge ${kpi.positive ? "pos" : "neg"}`}
                  >
                    {kpi.positive ? "↑" : "↓"} {kpi.delta}
                  </span>
                ) : null}{" "}
                <span className="kpi-indicator-badge">{kpi.intime}</span>
              </div>
            </div>
            <div className="kpi-meta-content">
              <p className="kpi-helper-txt">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </section>

      {/* SECONDARY KPI CARDS */}
      <section className="kpi-row-grid grid-6-col">
        {secondaryKpis.map((kpi, idx) => (
          <div
            key={idx}
            className="kpi-mini-card version-secondary subtle-border"
          >
            <div className="kpi-main-row">
              <div className="kpi-icon-wrapper clean-icon">{kpi.icon}</div>
              <div className="kpi-flex-body">
                <span className="kpi-lbl">{kpi.title}</span>
                <h3 className="kpi-sub-val">{kpi.value}</h3>
                {/* ĐÃ FIX: Đổi class sang className ở dòng dưới đây */}
                <div>
                  <span className="kpi-indicator-badge pos">
                    ↑ {kpi.delta}{" "}
                  </span>{" "}
                  <span className="kpi-indicator-badge">{kpi.intime}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* CHARTS AND QUEUE */}
      <section className="dashboard-chart-row grid-3-col">
        {/* Revenue & Lead Trend */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <TrendingUp size={16} className="text-royal-blue" />
              <h3>Revenue & Lead Trend</h3>
            </div>
            <div className="pill-toggles">
              <button className={trendMode === "leads" ? "active" : ""} onClick={() => setTrendMode("leads")}>Leads</button>
              <button className={trendMode === "appointments" ? "active" : ""} onClick={() => notAvailable("Appointments trend")}>Appointments</button>
              <button className={trendMode === "revenue" ? "active" : ""} onClick={() => setTrendMode("revenue")}>Revenue</button>
            </div>
          </div>
          <div className="chart-viewbox">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={revenueTrendData}
                margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashboardRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="trend"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashboardRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Target size={16} className="text-royal-blue" />
              <h3>Lead Source Performance</h3>
            </div>
            <a href="#all-sources" className="card-text-link">
              View All Sources →
            </a>
          </div>
          <div className="split-layout-grid">
            <div className="chart-half">
              <ResponsiveContainer width="100%" height={195}>
                <BarChart
                  data={leadSources}
                  margin={{ top: 5, right: 5, left: -25, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="source"
                    tickLine={false}
                    axisLine={false}
                    tick={<CustomXAxisTick />}
                    interval={0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                  />
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                    {leadSources.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-list-half">
              <div className="list-tbl-header">
                <span>Source</span>
                <span className="text-right">Conv.</span>
                <span className="text-right">Revenue</span>
              </div>
              {leadSources.map((item, idx) => (
                <div key={idx} className="list-tbl-row">
                  <span className="src-label-dot">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    {item.source}
                  </span>
                  <span className="text-right text-gray">
                    {item.conversion}%
                  </span>
                  <span className="text-right font-bold">
                    $
                    {item.revenue >= 1000
                      ? `${item.revenue / 1000}K`
                      : item.revenue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Priority Queue */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Zap size={16} className="text-orange" />
              <h3>AI Priority Queue</h3>
            </div>
            <a href="#view-all" className="card-text-link">
              View All →
            </a>
          </div>
          <div className="queue-list-wrapper">
            <div className="list-tbl-header">
              <span>Lead</span>
              <span className="text-left">Intent</span>
              <span className="text-left">Probability</span>
              <span>Next Action</span>
            </div>
            {aiPriorityQueue.map((lead, idx) => (
              <div key={idx} className="queue-item-row">
                <div className="lead-meta-profile">
                  <img src={lead.img} alt={lead.name} className="mini-avatar" />
                  <div className="meta-name">
                    <h4>{lead.name}</h4>
                  </div>
                </div>
                <span className="meta-intent">{lead.intent}</span>
                <span className="prob-badge">{lead.prob}</span>
                <div className="action-icon-shortcuts">
                  <button className="shortcut-btn black-btn">
                    <Phone size={12} />
                  </button>
                  <button className="shortcut-btn green-btn">
                    <MessageCircle size={12} />
                  </button>
                  <button className="shortcut-btn white-btn">
                    <Users size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      {/*</section>

      <section className="dashboard-logs-row grid-3-col">*/}
        {/* Today's Revenue Risk */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <AlertTriangle size={16} className="text-red" />
              <h3>Today's Revenue Risk</h3>
            </div>
            <a href="#view-all" className="card-text-link">
              View All →
            </a>
          </div>
          <div className="risk-alerts-list">
            {riskAlerts.map((risk, idx) => (
              <div key={idx} className="risk-item-row">
                <span className="risk-title-lbl">
                  {risk.icon} {risk.title}
                </span>
                <span className="risk-count-badge">{risk.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live AI Tracking */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <ShieldCheck size={16} className="text-royal-blue" />
              <h3>Live AI Tracking</h3>
            </div>
            <a href="#view-all" className="card-text-link">
              View All →
            </a>
          </div>
          <div className="tracking-timeline-list">
            {liveTracking.map((log, idx) => (
              <div key={idx} className="timeline-item-row">
                <div className="timeline-marker-dot"></div>
                <span className="timeline-log-txt">{log.text}</span>
                <span className="timeline-time-stamp">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Deals by Stage */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Briefcase size={16} className="text-royal-blue" />
              <h3>Active Deals by Stage</h3>
            </div>
            <a href="#pipeline" className="card-text-link">
              View Pipeline →
            </a>
          </div>
          <div className="deals-by-stage-box">
            <div className="stage-stats-columns">
              {dealsByStageArr.map((stage, idx) => (
                <div key={idx} className="stage-column-item">
                  <span className="stage-head-lbl">{stage.name}</span>
                </div>
              ))}
            </div>
            <div className="stage-progress-bar-wrapper">
              <div
                className="bar-chunk chunk-new"
                style={{ width: "25%" }}
              ></div>
              <div
                className="bar-chunk chunk-qualified"
                style={{ width: "20%" }}
              ></div>
              <div
                className="bar-chunk chunk-showing"
                style={{ width: "25%" }}
              ></div>
              <div
                className="bar-chunk chunk-offer"
                style={{ width: "15%" }}
              ></div>
              <div
                className="bar-chunk chunk-closed"
                style={{ width: "15%" }}
              ></div>
            </div>
            <div className="stage-stats-columns">
              {dealsByStageArr.map((stage, idx) => (
                <div key={idx} className="stage-column-item">
                  <h4>{stage.count}</h4>
                  <span>{stage.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM FOOTER UTILITIES */}
      <section className="dashboard-footer-grid grid-5-col">
        {/* Pipeline Funnel */}
        <div className="content-card">
          <div className="card-top-header">
            <AlertTriangle size={18} />
            <h5>Pipeline Funnel</h5>
          </div>
          <div className="funnel-vertical-stack">
            {pipelineFunnelArr.map((item, idx) => (
              <div key={idx} className="funnel-layer-bar">
                <span className="layer-name">{item.stage}</span>
                <div className="layer-graphic-track">
                  <div
                    className="layer-fill"
                    style={{ width: item.width }}
                  ></div>
                </div>
                <span className="layer-metrics">
                  {item.count}{" "}
                  <span className="text-gray">({item.percent})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Automation Health */}
        <div className="content-card">
          <div className="card-top-header">
            <Clock3 size={16} />
            <h5>Automation Health</h5>
          </div>
          <div className="health-status-list">
            {automationHealth.map((health, idx) => (
              <div key={idx} className="health-row-item">
                <span className="health-lbl">
                  {health.icon} {health.label}
                </span>
                <span className={`status-pill ${health.color}`}>
                  {health.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Actions */}
        <div className="content-card">
          <div className="card-top-header">
            <Shuffle size={16} />
            <h5>Next Actions</h5>
          </div>
          <div className="action-todo-list"></div>
        </div>

        {/* Upcoming Closings */}
        <div className="content-card">
          <div className="card-top-header ">
            <Calendar size={12} />
            <h5>Upcoming Closings</h5>
          </div>
          <div className="closing-list-wrapper">
            {upcomingClosings.map((item, idx) => (
              <div key={idx} className="closing-row-item">
                <div className="closing-details">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="closing-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Action Center */}
        <div className="content-card action-center-dark-card">
          <div className="dark-card-body">
            <div className="card-head-title">
              <Zap size={16} className="text-orange" />
              <h4>AI Action Center</h4>
            </div>
            <p className="dark-card-desc">
              Cortexa analyzes your pipeline, detects risks, and recommends
              actions to close more deals.
            </p>
            <div className="dark-card-counter-row">
              <div className="counter-box">
                <span>Recommends Actions</span>
                <h3>—</h3>
              </div>
              <div className="counter-box urgent-border">
                <span className="text-red">Urgent Tasks</span>
                <h3 className="text-red">—</h3>
              </div>
            </div>
            <button className="btn-run-analysis" onClick={() => notAvailable("Run AI Dashboard Review")}>
              Run AI Dashboard Review <Zap size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
