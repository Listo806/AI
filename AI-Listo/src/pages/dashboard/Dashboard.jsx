import React, { useEffect, useState } from "react";
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

export default function CortexaDashboard() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );

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
  const confidenceSparkData = [
    { v: 50 },
    { v: 65 },
    { v: 55 },
    { v: 78 },
    { v: 70 },
    { v: 92 },
  ];
  const riskSparkData = [
    { v: 30 },
    { v: 45 },
    { v: 35 },
    { v: 60 },
    { v: 40 },
    { v: 55 },
  ];

  const miniKpis = [
    {
      title: "New Leads",
      value: "18",
      delta: "12.4%",
      positive: true,
      subtext: "3 from WhatsApp • 2 from Website",
      icon: <Users size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: "vs last week",
    },
    {
      title: "Active Deals",
      value: "$148K",
      delta: "2",
      positive: true,
      subtext: "2 deals likely to close this week",
      icon: <Briefcase size={16} className="text-purple" />,
      iconBg: "bg-light-purple",
      intime: "deals",
    },
    {
      title: "Revenue",
      value: "$24.6K",
      delta: "8.1%",
      positive: true,
      subtext: "1 closing scheduled today",
      icon: <DollarSign size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: "vs last week",
    },
    {
      title: "Conversion Rate",
      value: "21.8%",
      delta: "1.3%",
      positive: false,
      subtext: "Warm leads need follow-up",
      icon: <Percent size={16} className="text-orange" />,
      iconBg: "bg-light-orange",
      intime: "vs last week",
    },
    {
      title: "AI Conversations",
      value: "327",
      delta: "41",
      positive: true,
      subtext: "AI handled 142 replies today",
      icon: <MessageCircle size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: "today",
    },
    {
      title: "Appointments",
      value: "18",
      delta: "6",
      positive: true,
      subtext: "Showings & closings scheduled",
      icon: <Calendar size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: "this week",
    },
  ];

  const secondaryKpis = [
    {
      title: "First Response Time",
      value: "2m 34s",
      delta: "18%",
      positive: true,
      icon: <Clock3 size={16} className="text-royal-blue" />,
      intime: "vs last week",
    },
    {
      title: "Follow-up Completion",
      value: "78%",
      delta: "11%",
      positive: true,
      icon: <CheckCircle2 size={16} className="text-green" />,
      intime: "vs last week",
    },
    {
      title: "Lead Quality Score",
      value: "87/100",
      delta: "9",
      positive: true,
      icon: <Award size={16} className="text-purple" />,
      intime: "vs last week",
    },
    {
      title: "Pipeline Velocity",
      value: "1.42x",
      delta: "15%",
      positive: true,
      icon: <Activity size={16} className="text-royal-blue" />,
      intime: "vs last week",
    },
    {
      title: "Revenue at Risk",
      value: "$18.7K",
      delta: "23%",
      positive: true,
      icon: <AlertTriangle size={16} className="text-orange" />,
      intime: "vs last week",
    },
    {
      title: "WhatsApp Response",
      value: "94%",
      delta: "8%",
      positive: true,
      icon: <MessageCircle size={16} className="text-green" />,
      intime: "vs last week",
    },
  ];

  const revenueTrendData = [
    { day: "Mon", trend: 18000 },
    { day: "Tue", trend: 25000 },
    { day: "Wed", trend: 20000 },
    { day: "Thu", trend: 36000 },
    { day: "Fri", trend: 28000 },
    { day: "Sat", trend: 22000 },
    { day: "Sun", trend: 32000 },
  ];

  const leadSources = [
    {
      source: "WhatsApp",
      leads: 96,
      conversion: 28,
      revenue: 920000,
      color: "#2563eb",
      icon: <MessageCircle size={12} className="text-green" />,
    },
    {
      source: "Instagram",
      leads: 62,
      conversion: 19,
      revenue: 410000,
      color: "#7c3aed",
      icon: <Camera size={12} style={{ color: "#d946ef" }} />,
    },
    {
      source: "Website",
      leads: 54,
      conversion: 16,
      revenue: 360000,
      color: "#ea580c",
      icon: <Globe size={12} className="text-royal-blue" />,
    },
    {
      source: "Marketplace",
      leads: 42,
      conversion: 14,
      revenue: 280000,
      color: "#0d9488",
      icon: <Briefcase size={12} className="text-orange" />,
    },
    {
      source: "Referral",
      leads: 36,
      conversion: 31,
      revenue: 510000,
      color: "#16a34a",
      icon: <Users size={12} className="text-purple" />,
    },
    {
      source: "Google Ads",
      leads: 28,
      conversion: 17,
      revenue: 300000,
      color: "#eab308",
      icon: <Search size={12} style={{ color: "#eab308" }} />,
    },
    {
      source: "Meta Ads",
      leads: 21,
      conversion: 15,
      revenue: 250000,
      color: "#3b82f6",
      icon: <SlidersHorizontal size={12} className="text-royal-blue" />,
    },
  ];

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
              <div className="control-btn" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={15} />
                <span>Filters</span>
              </div>

              <div className="notification-icon">
                <Bell size={18} />
                <span className="notif-badge">8</span>
              </div>

              <button className="btn-export">
                <Download size={15} />
                Export
                <ChevronDown size={14} />
              </button>
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

              <div className="notification-icon">
                <Bell size={18} />
                <span className="notif-badge">8</span>
              </div>

              <button className="btn-export">
                <Download size={15} />
                Export
                <ChevronDown size={14} />
              </button>
            </>
          )}
        </div>
      </header>
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
              You have <span className="highlight-blue">3</span> high-intent
              leads ready to close.
            </h2>
            <p>
              Next best action:{" "}
              <span className="clickable-link">Call Maria Lopez</span> now
            </p>
            <div className="banner-alert-tag">
              🔥 2 leads require immediate follow-up
            </div>
          </div>
        </div>

        <div className="banner-right">
          <div className="banner-right-top">
            <div className="mini-insight-card">
              <div className="card-lbl">AI Confidence</div>
              <div className="card-val-group">
                <h3 className="text-green">92%</h3>
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
              <div className="card-lbl">Revenue at Risk</div>
              <div className="card-val-group">
                <h3 className="text-orange">$18.7K</h3>
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
              <Phone size={16} />
              <div>
                <div className="card-lbl">Next Best Action</div>
                <h4>Call Maria Lopez</h4>
              </div>
            </div>
          </div>
          <div className="banner-action-row">
            <button className="banner-btn text-dark">
              <Phone size={16} /> Call
            </button>
            <button className="banner-btn btn-whatsapp-color">
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button className="banner-btn btn-assign-color">
              <Users size={16} /> Assign
            </button>
            <button className="banner-btn btn-followup-color">
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
                {/* ĐÃ FIX: Đổi class sang className ở dòng dưới đây */}
                <span
                  className={`kpi-indicator-badge ${kpi.positive ? "pos" : "neg"}`}
                >
                  {kpi.positive ? "↑" : "↓"} {kpi.delta}
                </span>{" "}
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
              <button>Leads</button>
              <button>Appointments</button>
              <button className="active">Revenue</button>
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
            {[
              {
                name: "Maria Lopez",
                intent: "Luxury Buyer",
                prob: "87%",
                img: "https://i.pravatar.cc/150?img=41",
              },
              {
                name: "Carlos Vega",
                intent: "Appointment",
                prob: "79%",
                img: "https://i.pravatar.cc/150?img=60",
              },
              {
                name: "Daniela Ortiz",
                intent: "Financing Ready",
                prob: "82%",
                img: "https://i.pravatar.cc/150?img=45",
              },
              {
                name: "Pablo Torres",
                intent: "Property Interested",
                prob: "76%",
                img: "https://i.pravatar.cc/150?img=11",
              },
              {
                name: "Sofia Reyes",
                intent: "High Intent",
                prob: "72%",
                img: "https://i.pravatar.cc/150?img=23",
              },
            ].map((lead, idx) => (
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
      </section>

      {/* DATA LOGS AND TIMELINES */}
      <section className="dashboard-logs-row grid-3-col">
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
            {[
              {
                title: "Leads going cold (no activity > 48h)",
                count: 12,
                icon: <Clock3 size={12} className="text-muted" />,
              },
              {
                title: "Deals stuck in stage > 7 days",
                count: 8,
                icon: <Layers size={12} className="text-muted" />,
              },
              {
                title: "Missed follow-ups",
                count: 6,
                icon: <AlertTriangle size={12} className="text-orange" />,
              },
              {
                title: "Unanswered WhatsApp messages",
                count: 27,
                icon: <MessageCircle size={12} className="text-green" />,
              },
            ].map((risk, idx) => (
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
            {[
              { text: "Maria Lopez viewed 3 new listings", time: "9m ago" },
              { text: "Carlos Vega opened WhatsApp message", time: "22m ago" },
              {
                text: "AI qualified Daniela Ortiz as financing-ready",
                time: "35m ago",
              },
              { text: "Pablo Torres moved to Offer stage", time: "1h ago" },
              { text: "Sofia Reyes scheduled showing", time: "1h 20m ago" },
            ].map((log, idx) => (
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
              {[
                { name: "New", count: "12", value: "$48K" },
                { name: "Qualified", count: "9", value: "$67K" },
                { name: "Showing", count: "5", value: "$91K" },
                { name: "Offer", count: "3", value: "$114K" },
                { name: "Closed", count: "2", value: "$24.6K" },
              ].map((stage, idx) => (
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
              {[
                { name: "New", count: "12", value: "$48K" },
                { name: "Qualified", count: "9", value: "$67K" },
                { name: "Showing", count: "5", value: "$91K" },
                { name: "Offer", count: "3", value: "$114K" },
                { name: "Closed", count: "2", value: "$24.6K" },
              ].map((stage, idx) => (
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
            {[
              { stage: "Leads", count: "120", percent: "100%", width: "100%" },
              { stage: "Qualified", count: "82", percent: "68%", width: "80%" },
              { stage: "Showings", count: "39", percent: "32%", width: "60%" },
              { stage: "Offers", count: "19", percent: "16%", width: "40%" },
              { stage: "Closed", count: "8", percent: "7%", width: "20%" },
            ].map((item, idx) => (
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
            {[
              {
                label: "WhatsApp Connected",
                status: "Active",
                color: "green",
                icon: <MessageCircle size={12} className="text-green" />,
              },
              {
                label: "AI Replies",
                status: "Active",
                color: "green",
                icon: <CheckCircle2 size={12} className="text-green" />,
              },
              {
                label: "Tasks Generated",
                status: "156",
                color: "gray",
                icon: <FileText size={12} className="text-muted" />,
              },
              {
                label: "Follow-ups Completed",
                status: "78%",
                color: "green",
                icon: <Activity size={12} className="text-royal-blue" />,
              },
              {
                label: "Missed Actions",
                status: "5",
                color: "orange",
                icon: <AlertTriangle size={12} className="text-orange" />,
              },
            ].map((health, idx) => (
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
          <div className="action-todo-list">
            <div className="todo-row-item">
              <div className="todo-details">
                <span className="todo-txt">
                  <CheckCircle2
                    size={13}
                    className="text-muted"
                    style={{ marginRight: 4 }}
                  />{" "}
                  Call Maria Lopez
                </span>
                <span className="tag-urgent">Urgent</span>
              </div>
              <span className="todo-time">Today</span>
            </div>
            <div className="todo-row-item">
              <span className="todo-txt">
                <CheckCircle2
                  size={13}
                  className="text-muted"
                  style={{ marginRight: 4 }}
                />{" "}
                Send property options to Carlos Vega
              </span>
              <span className="todo-time text-blue" style={{ fontSize: "9px" }}>
                Today • 3:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Closings */}
        <div className="content-card">
          <div className="card-top-header ">
            <Calendar size={12} />
            <h5>Upcoming Closings</h5>
          </div>
          <div className="closing-list-wrapper">
            {[
              {
                label: "Showing — Maria Lopez",
                time: "Today • 4:00 PM",
                icon: <Calendar size={12} className="text-muted" />,
              },
              {
                label: "Closing call — Sofia Reyes",
                time: "Today • 6:30 PM",
                icon: <Briefcase size={12} className="text-muted" />,
              },
              {
                label: "Negotiation review — Pablo Torres",
                time: "Tomorrow • 9:00 AM",
                icon: <FileText size={12} className="text-muted" />,
              },
              {
                label: "Final walk-through — Carlos Vega",
                time: "Tomorrow • 2:00 PM",
                icon: <CheckCircle2 size={12} className="text-muted" />,
              },
            ].map((item, idx) => (
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
                <h3>14</h3>
              </div>
              <div className="counter-box urgent-border">
                <span className="text-red">Urgent Tasks</span>
                <h3 className="text-red">7</h3>
              </div>
            </div>
            <button className="btn-run-analysis">
              Run AI Dashboard Review <Zap size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
