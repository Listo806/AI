import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Sparkles,
  Bot,
  CalendarCheck,
  Globe,
  Clock3,
  Download,
  MessageCircle,
  Megaphone,
  FileDown,
  RefreshCw,
  Percent,
  LayoutDashboard,
  Briefcase,
  Home,
  Contact,
  ShieldCheck,
  CheckSquare,
  Calendar,
  Layers,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Filter,
  Timer,
  Clock,
  PieChartIcon,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import {
  getAnalyticsDashboard,
  getDashboardSummary,
  getActivityMetrics,
  getOwnerLeads,
} from "../../api/analyticsApi";
import { fetchTeams, fetchTeamDashboard } from "../team/services/team.service";
import { downloadCsv } from "../../utils/helpers";

import "./analytics.css";

function money(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

/** Colors reused for the lead-source donut/legend */
const SOURCE_COLORS = [
  "#0ea5e9",
  "#d946ef",
  "#3b82f6",
  "#f97316",
  "#64748b",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const NO_DATA = "—";

function rangeToDays(range) {
  if (range === "today") return 1;
  if (range === "7d") return 7;
  return 30;
}

function periodLabel(range) {
  if (range === "today") return "Today";
  if (range === "7d") return "Last 7 days";
  return "Last 30 days";
}

function dateRangeLabel(range) {
  const days = rangeToDays(range);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString(
    "en-US",
    opts
  )}, ${end.getFullYear()}`;
}

function shortDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CortexaAnalyticsDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((t) => t + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dash, setDash] = useState(null); // getAnalyticsDashboard(range)
  const [summary, setSummary] = useState(null); // getDashboardSummary()
  const [activity, setActivity] = useState(null); // getActivityMetrics(range)
  const [leadsList, setLeadsList] = useState([]); // getOwnerLeads() – for lead-source aggregation
  const [teamStats, setTeamStats] = useState(null); // team dashboard stats – real revenue/pipeline

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, summaryRes, activityRes] = await Promise.all([
          getAnalyticsDashboard(range),
          getDashboardSummary(),
          getActivityMetrics(range),
        ]);
        if (cancelled) return;
        setDash(dashRes || null);
        setSummary(summaryRes || null);
        setActivity(activityRes || null);

        // Owner leads require CRM access and may be forbidden – never let it break the page.
        try {
          const leads = await getOwnerLeads(500);
          if (!cancelled) setLeadsList(Array.isArray(leads) ? leads : []);
        } catch (_e) {
          if (!cancelled) setLeadsList([]);
        }

        // Team revenue/pipeline stats power the money KPIs. A user with no
        // team (or a 403) must degrade those tiles to "—", never break the page.
        try {
          const teams = await fetchTeams();
          const teamId = teams?.[0]?.id;
          const teamDash = teamId ? await fetchTeamDashboard(teamId) : null;
          if (!cancelled) setTeamStats(teamDash?.stats || null);
        } catch (_e) {
          if (!cancelled) setTeamStats(null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, refreshTick]);

  // ---- Derived data (real backend fields with safe fallbacks) ----
  const leads = dash?.leads || null;
  const byStatus = leads?.byStatus || null;
  const metrics = summary?.data?.metrics || null; // { leads_total, leads_new, leads_active, leads_closed, conversations_total, conversations_unread, ai_actions_today }
  const totalLeads = leads?.total ?? 0;
  const label = periodLabel(range);

  const kpisRow1 = [
    {
      title: "Projected Revenue",
      value: teamStats ? money(teamStats.revenue) : NO_DATA, // teamStats.revenue (real won-deal value)
      delta: null,
      subtext: label,
      icon: DollarSign,
      iconBg: "bg-green-light",
      iconColor: "text-green-strong",
    },
    {
      title: "New Leads",
      value: leads ? String(leads.created ?? 0) : NO_DATA, // leads.created (in period)
      delta: null,
      subtext: label,
      icon: User,
      iconBg: "bg-blue-light",
      iconColor: "text-blue-strong",
    },
    {
      title: "Conversion Rate",
      value: leads ? `${Number(leads.conversionRate || 0).toFixed(1)}%` : NO_DATA, // leads.conversionRate
      delta: null,
      subtext: label,
      icon: Filter,
      iconBg: "bg-cyan-light",
      iconColor: "text-cyan-strong",
    },
    {
      title: "Appointments Booked",
      value: NO_DATA, // no backend source
      delta: null,
      subtext: label,
      icon: CalendarCheck,
      iconBg: "bg-pink-light",
      iconColor: "text-pink-strong",
    },
    {
      title: "Avg Speed to Lead",
      value: NO_DATA, // no backend source
      delta: null,
      subtext: label,
      icon: Timer,
      iconBg: "bg-orange-light",
      iconColor: "text-orange-strong",
    },
    {
      title: "Avg Time to Close",
      value: NO_DATA, // no backend source (averageTimeToConvert not returned)
      delta: null,
      subtext: label,
      icon: Clock,
      iconBg: "bg-red-light",
      iconColor: "text-red-strong",
    },
    {
      title: "Pipeline Value",
      value: teamStats ? money(teamStats.totalPipeline) : NO_DATA, // teamStats.totalPipeline (real pipeline value)
      delta: null,
      subtext: label,
      icon: PieChartIcon,
      iconBg: "bg-blue-light",
      iconColor: "text-blue-strong",
    },
    {
      title: "Follow-Up Completion",
      value: leads
        ? totalLeads > 0
          ? `${Math.round(((byStatus?.contacted || 0) / totalLeads) * 100)}%`
          : "0%"
        : NO_DATA, // derived: contacted / total leads
      delta: null,
      subtext: label,
      icon: CheckCircle,
      iconBg: "bg-green-light",
      iconColor: "text-green-strong",
    },
  ];

  // Lead Source Intelligence – aggregate real owner leads by `source`
  const sourceAgg = {};
  (leadsList || []).forEach((l) => {
    const src = (l?.source && String(l.source).trim()) || "Unknown";
    sourceAgg[src] = (sourceAgg[src] || 0) + 1;
  });
  const totalSourceLeads = (leadsList || []).length;
  const leadSources = Object.entries(sourceAgg)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      percentage: totalSourceLeads
        ? `${((value / totalSourceLeads) * 100).toFixed(1)}%`
        : "0%",
      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));

  // Pipeline Leakage – real lead funnel from leads.byStatus
  const pipelineStages = leads
    ? [
        { name: "Leads", count: totalLeads },
        { name: "Contacted", count: byStatus?.contacted || 0 },
        { name: "Qualified", count: byStatus?.qualified || 0 },
        { name: "Converted", count: byStatus?.converted || 0 },
        { name: "Lost", count: byStatus?.lost || 0 },
      ]
    : [];
  const funnelMax = Math.max(1, ...pipelineStages.map((s) => s.count));

  // Activity over time – real activity.eventsByDay (feeds the area chart)
  const activityData = (activity?.eventsByDay || []).map((d) => ({
    day: shortDate(d.date),
    conversations: d.count,
  }));

  // No backend source for these – kept empty (graceful empty state)
  const lostReasons = [];
  const teamPerformance = [];

  // Build a CSV from the already-loaded analytics data (no fabricated values).
  function exportData() {
    const rows = [];

    // Lead metrics
    if (leads) {
      rows.push(["Lead Metrics"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Total Leads", totalLeads]);
      rows.push(["New / Created", leads.created ?? 0]);
      rows.push([
        "Conversion Rate",
        `${Number(leads.conversionRate || 0).toFixed(1)}%`,
      ]);
    }

    // Lead status breakdown
    if (byStatus) {
      rows.push([]);
      rows.push(["Lead Status Breakdown"]);
      rows.push(["Status", "Count"]);
      rows.push(["New", byStatus.new ?? 0]);
      rows.push(["Contacted", byStatus.contacted ?? 0]);
      rows.push(["Qualified", byStatus.qualified ?? 0]);
      rows.push(["Converted", byStatus.converted ?? 0]);
      rows.push(["Lost", byStatus.lost ?? 0]);
    }

    // Lead sources (aggregated from owner leads by .source)
    if (leadSources.length > 0) {
      rows.push([]);
      rows.push(["Lead Sources"]);
      rows.push(["Source", "Count", "Percentage"]);
      leadSources.forEach((s) => {
        rows.push([s.name, s.value, s.percentage]);
      });
    }

    // Activity by day
    const events = activity?.eventsByDay || [];
    if (events.length > 0) {
      rows.push([]);
      rows.push(["Activity By Day"]);
      rows.push(["Date", "Events"]);
      events.forEach((d) => {
        rows.push([d.date, d.count ?? 0]);
      });
    }

    downloadCsv("analytics-export.csv", rows);
  }

  const infoStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#64748b",
    padding: "8px 0",
    margin: "0 0 8px",
  };
  const errorStyle = { ...infoStyle, color: "#dc2626" };
  const emptyStyle = {
    fontSize: 12,
    color: "#94a3b8",
    padding: "12px 0",
    textAlign: "center",
  };

  return (
    <div className="analytics-page">
      <div className="heading_page">
        <BarChart3 className="header-icon" size={20} />
        <h1>Analytics Overview</h1>
      </div>
      <p className="sub_head">
        Monitor revenue, conversation performance, AI effectiveness, ROI and
        pipeline intelligence in real time.
      </p>
      <header className="main-header">
        <div className="header-controls">
          <div className="date-picker-wrapper">
            <span>{dateRangeLabel(range)}</span>
            <Calendar size={16} className="text-gray-icon" />
          </div>

          <div className="select-wrapper">
            <select
              className="control-select"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>

          <button className="btn-secondary" onClick={exportData}>
            <Download size={15} /> Export
          </button>
          <button className="btn-primary" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </header>

      {loading && (
        <div style={infoStyle}>
          <RefreshCw size={14} /> Loading analytics…
        </div>
      )}
      {error && (
        <div style={errorStyle}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* KPI ROW 1 */}
      <div className="kpi-grid-row1">
        {kpisRow1.map((kpi, i) => {
          const Icon = kpi.icon;

          const hasDelta = kpi.delta != null;
          const isUp = kpi.type ? kpi.type.startsWith("up") : true;
          const arrow = isUp ? "↑" : "↓";

          const badgeClass = "kpi-badge pos";

          return (
            <div key={i} className="kpi-card-mini">
              <div className="kpi-header">
                <div
                  className={`kpi-icon-container ${kpi.iconBg} ${kpi.iconColor}`}
                >
                  <Icon size={20} />
                </div>
                <span className="kpi-title">{kpi.title}</span>
              </div>
              <div className="kpi-body">
                <span className="kpi-value">{kpi.value}</span>
                <div className="kpi-footer-meta">
                  <span className={badgeClass}>
                    {hasDelta ? `${arrow} ${kpi.delta}` : NO_DATA}
                  </span>
                  <span className="kpi-subtext">{kpi.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROW 3: REVENUE + LEAD SOURCE + PIPELINE LEAKAGE */}
      <div className="charts-grid-3col">

        {/* Lead Source Intelligence */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <Globe size={18} className="text-royal-blue" />
              <h3>Lead Source Intelligence</h3>
            </div>
          </div>
          <p className="card-subtitle">
            Compare lead volume, conversion rate, and revenue
          </p>

          <div className="lead-source-layout">
            <div className="chart-container-donut">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={
                      50
                    }
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center-text">
                <span className="total-number">{totalSourceLeads}</span>
                <span className="total-label">Total Leads</span>
              </div>
            </div>

            <div className="lead-source-list-v2">
              {leadSources.length === 0 ? (
                <span style={emptyStyle}>No lead source data</span>
              ) : (
                leadSources.map((src, i) => (
                  <div key={i} className="list-item-row-v2">
                    <div className="src-name-dot">
                      <span
                        className="dot-indicator"
                        style={{ backgroundColor: src.fill }}
                      ></span>
                      <span className="src-name">{src.name}</span>
                    </div>
                    <div className="src-values">
                      <span className="val-count">{src.value}</span>
                      <span className="val-percent">({src.percentage})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Link */}
          <div className="card-footer-action">
            <button
              className="btn-view-all"
              onClick={() => navigate("/dashboard/leads")}
            >
              View all sources <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Pipeline Leakage Analysis */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <AlertTriangle size={18} className="text-royal-blue" />
              <h3>Pipeline Leakage Analysis</h3>
            </div>
          </div>
          <p className="card-subtitle">
            Identify where deals are dropping off in the pipeline
          </p>

          <div className="pipeline-funnel-wrapper">
            <div className="funnel-table-header">
              <span>Stage</span>
              <span className="text-center">Deals</span>
              <span className="text-right">Conversion</span>
              <span className="text-right">vs Prev.</span>
            </div>
            <div className="funnel-bars-container">
              {pipelineStages.map((stage, i) => {
                const width = `${Math.round((stage.count / funnelMax) * 100)}%`;
                const conversion =
                  totalLeads > 0
                    ? `${Math.round((stage.count / totalLeads) * 100)}%`
                    : "0%";
                const prev = i > 0 ? pipelineStages[i - 1].count : null;
                const drop =
                  i > 0 && prev > 0
                    ? `${Math.round(((stage.count - prev) / prev) * 100)}%`
                    : "-";
                return (
                  <div key={i} className="funnel-row">
                    <div className="funnel-label-bar">
                      <span className="stage-name">{stage.name}</span>
                      <div className="funnel-bar-bg">
                        <div
                          className="funnel-bar-fill"
                          style={{
                            width: width,
                            backgroundColor: i === 4 ? "#2563eb" : "#2563eb",
                          }}
                        ></div>
                      </div>
                      <span className="stage-count">{stage.count}</span>
                    </div>
                    <span className="funnel-percent">{conversion}</span>
                    <span
                      className={`funnel-drop ${drop !== "-" ? "text-red-strong" : "text-gray-400"}`}
                    >
                      {drop}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="funnel-footer">
              <button
                className="btn-view-all"
                onClick={() => navigate("/dashboard/pipeline")}
              >
                View full pipeline <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Analytics */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <MessageCircle size={18} className="text-green-strong" />
              <h3>WhatsApp Analytics</h3>
            </div>
          </div>
          <p className="card-subtitle">
            Your WhatsApp conversation performance
          </p>
          <div className="wa-analytics-layout">
            <div className="wa-chart-container">
              {activityData.length === 0 ? (
                <div style={{ ...emptyStyle, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  No activity in this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={activityData}
                    margin={{ top: 0, right: 0, left: -30, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorConversations"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="wa-metrics-grid">
              {/* Card 1 – real summary metric: conversations_total */}
              <div className="wa-metric-card">
                <span className="metric-title">Conversations</span>
                <span className="metric-value">
                  {metrics ? metrics.conversations_total ?? 0 : NO_DATA}
                </span>
                <span className="metric-badge pos">{NO_DATA}</span>
              </div>

              {/* Card 2 – no backend source */}
              <div className="wa-metric-card">
                <span className="metric-title">Replies Sent</span>
                <span className="metric-value">{NO_DATA}</span>
                <span className="metric-badge pos">{NO_DATA}</span>
              </div>

              {/* Card 3 – no backend source */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies This Period</span>
                <span className="metric-value">{NO_DATA}</span>
              </div>

              {/* Card 4 – no backend source */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Appointments Booked</span>
                <span className="metric-value">{NO_DATA}</span>
              </div>
            </div>
          </div>

          {/* Footer Action Link */}
          <div className="funnel-footer">
            <button
              className="btn-view-all"
              onClick={() => navigate("/dashboard/whatsapp")}
            >
              Open WhatsApp Workspace <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4: AI PERFORMANCE + WHATSAPP + LOST REASONS + TEAM */}
      <div className="charts-grid-4col">
        {/* Lost Deal Reasons */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <AlertTriangle size={18} className="text-red-strong" />
              <h3>Lost Deal Reasons</h3>
            </div>
          </div>
          <p className="card-subtitle">Why deals didnot close</p>
          <div className="lost-reasons-list">
            <div className="lost-header-row">
              <span>Reason</span>
              <span></span>
              <span className="text-right">Last Deals</span>
              <span className="text-right">% of Total</span>
            </div>
            {lostReasons.length === 0 ? (
              <span style={emptyStyle}>No data available</span>
            ) : (
              lostReasons.map((item, i) => (
                <div key={i} className="lost-item-row">
                  <span className="reason-text">{item.reason}</span>
                  <div className="reason-progress-bar">
                    <div className="bar-fill" style={{ width: item.width }}></div>
                  </div>
                  <span className="count-text font-semibold">{item.count}</span>
                  <span className="percent-text font-semibold">
                    {item.percentage}%
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="funnel-footer">
            <button
              className="btn-view-all"
              onClick={() => navigate("/dashboard/pipeline")}
            >
              View all reasons <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Team Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <Users size={18} className="text-royal-blue" />
              <h3>Team Performance</h3>
            </div>
          </div>
          <p className="card-subtitle">How your team is performance</p>
          <div className="team-performance-list">
            <div className="team-header-row">
              <span>Agent</span>
              <span>Close Rate</span>
              <span>Response Time</span>
              <span>Deals</span>
              <span className="text-right">Revenue</span>
            </div>
            {teamPerformance.length === 0 ? (
              <span style={emptyStyle}>No data available</span>
            ) : (
              teamPerformance.map((agent, i) => (
                <div key={i} className="team-item-row">
                  <span className="agent-name">
                    <img
                      src="https://i.pravatar.cc/150"
                      className="team-avatar"
                    />
                    <span>{agent.name}</span>
                  </span>
                  <div className="rate-progress-wrapper">
                    <span className="rate-val font-semibold">{agent.rate}</span>
                    <div className="mini-progress-bg">
                      <div
                        className={`mini-progress-fill ${agent.color}`}
                        style={{ width: agent.width }}
                      ></div>
                    </div>
                  </div>
                  <span className="time-val text-gray-400">{agent.time}</span>
                  <span className="deals-val font-semibold">{agent.deals}</span>
                  <span className="rev-val font-bold text-gray-800">
                    {agent.revenue}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="funnel-footer">
            <button
              className="btn-view-all"
              onClick={() => navigate("/dashboard/team")}
            >
              View full team report <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="dashboard-card-2">
          {/* AI Revenue Insights */}
          <div className="insights-card">
            <div className="card-header">
              <div className="card-header-left">
                <Sparkles size={18} className="text-royal-blue" />
                <h3>AI Revenue Insights</h3>
              </div>
              <button
                className="btn-view-all"
                onClick={() => navigate("/dashboard/leads")}
              >
                View all insights <ArrowRight size={14} />
              </button>
            </div>
            <p className="card-subtitle">
              Actionable insights generated by Cortesa AI
            </p>

            <div className="insights-list-row">
              <div className="insight-item-box">
                <div className="insight-icon-title">
                  <div className="insight-left-wrap">
                    <div className="insight-icon-wrap">
                      <Sparkles size={16} className="text-royal-blue" />
                    </div>
                    <div className="insight-icon-box-wrap">
                      <h4>AI insights coming soon</h4>
                      <p>
                        Automated revenue insights aren't available yet. This
                        section will populate once the feature is live.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Predictive Revenue Forecast */}
          <div className="forecast-dark-card">
            <div className="forecast-content">
              <div className="forecast-header">
                <BarChart3 size={20} className="text-blue-400" />
                <h3>Predictive Revenue Forecast</h3>
              </div>
              <p className="forecast-desc">
                AI forecasts based on your pipeline and performance
              </p>

              <div className="forecast-metrics">
                <div className="m-box">
                  <h3>{NO_DATA}</h3>
                </div>
                <p className="forecast-desc">Estimated revenue next 30 days</p>
                <p className="top-opp">
                  Top Opportunity: {NO_DATA}
                </p>
              </div>

              <p className="forecast-desc">
                Predictive forecasting is coming soon.
              </p>
            </div>

            <div className="forecast-chart-graphic">
              <div className="bar white-bar" style={{ height: "20%" }}></div>
              <div className="bar white-bar" style={{ height: "20%" }}></div>
              <div className="bar white-bar" style={{ height: "20%" }}></div>
              <div className="bar white-bar" style={{ height: "20%" }}></div>
              <div className="bar white-bar" style={{ height: "20%" }}></div>
              <div className="bar white-bar" style={{ height: "20%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: AI INSIGHTS & FORECAST */}
      <div className="insights-forecast-grid"><span className="dot-bottom"></span>All data is updated in real-time</div>
    </div>
  );
}
