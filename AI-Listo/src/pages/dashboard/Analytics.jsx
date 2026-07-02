import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  BarChart3,
  DollarSign,
  Users,
  AlertTriangle,
  Sparkles,
  Zap,
  CalendarCheck,
  Globe,
  Target,
  Download,
  MessageCircle,
  Percent,
  Calendar,
  ChevronDown,
  User,
  Filter,
  Timer,
  Clock,
  PieChartIcon,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  useFeatureNotice,
  FeatureNoticeBanner,
} from "../../components/FeatureNotice";
import "./analytics.css";
import {
  getDashboardSummary,
  getDashboardExtended,
  rangeToDates,
  prevRangeToDates,
  DATE_RANGES,
} from "../../api/analyticsApi";
import { useApiErrorHandler } from "../../utils/useApiErrorHandler";
import {
  EmptyState,
  FilterDropdown,
  InitialsAvatar,
  downloadCsv,
  fmtMoney,
  fmtHours,
  SOURCE_COLORS,
} from "./dashboardShared";

const money = fmtMoney;

export default function CortexaAnalyticsDashboard() {
  const { handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const { notice, setNotice, notAvailable } = useFeatureNotice();

  const [range, setRange] = useState("30d");
  const [compare, setCompare] = useState(true);
  const [ext, setExt] = useState(null);
  const [prevExt, setPrevExt] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cur = rangeToDates(range);
        const prev = prevRangeToDates(range);
        const [e, pe, s] = await Promise.all([
          getDashboardExtended(cur).catch(() => null),
          compare ? getDashboardExtended(prev).catch(() => null) : Promise.resolve(null),
          getDashboardSummary().catch(() => null),
        ]);
        if (active) {
          setExt(e);
          setPrevExt(pe);
          setSummary(s);
        }
      } catch (err) {
        if (active) handleError(err, "Failed to load analytics");
      }
    })();
    return () => {
      active = false;
    };
  }, [range, compare]);

  const E = ext || {};
  const P = prevExt || {};
  const K = E.kpis || {};
  const PK = P.kpis || {};
  const WA = E.whatsapp || {};
  const trends = E.trends || {};
  const sDeals = (summary || {}).deals || {};

  const leadsInPeriod = (trends.leadsByDay || []).reduce((s, d) => s + d.count, 0);
  const prevLeads = ((P.trends || {}).leadsByDay || []).reduce((s, d) => s + d.count, 0);
  const srcs = E.leadSources || [];
  const convertedInPeriod = srcs.reduce((s, x) => s + x.converted, 0);
  const convRate = leadsInPeriod > 0 ? Math.round((convertedInPeriod / leadsInPeriod) * 100) : null;

  const delta = (cur, prev) => {
    if (!compare || cur == null || prev == null || prev === 0) return null;
    const d = Math.round(((cur - prev) / Math.abs(prev)) * 100);
    return { text: `${Math.abs(d)}%`, up: d >= 0 };
  };

  // Approved KPI layout: all eight cards stay visible; every metric now has a
  // backend source (/crm/dashboard/extended). Missing data shows a neutral state.
  const kpisRow1 = [
    {
      title: "Projected Revenue",
      value: money(K.projectedRevenue),
      subtext: "stage-weighted open pipeline",
      icon: DollarSign, iconBg: "bg-green-light", iconColor: "text-green-strong",
      delta: delta(K.projectedRevenue, PK.projectedRevenue),
    },
    {
      title: "New Leads",
      value: String(leadsInPeriod),
      subtext: (DATE_RANGES.find((r) => r.key === range) || {}).label?.toLowerCase() || "period",
      icon: User, iconBg: "bg-blue-light", iconColor: "text-blue-strong",
      delta: delta(leadsInPeriod, prevLeads),
    },
    {
      title: "Conversion Rate",
      value: convRate != null ? `${convRate}%` : "0%",
      subtext: "leads to converted",
      icon: Filter, iconBg: "bg-cyan-light", iconColor: "text-cyan-strong",
    },
    {
      title: "Appointments Booked",
      value: String(K.appointmentsBooked ?? 0),
      subtext: K.appointmentsBooked ? "meetings logged" : "No data available",
      icon: CalendarCheck, iconBg: "bg-pink-light", iconColor: "text-pink-strong",
      delta: delta(K.appointmentsBooked, PK.appointmentsBooked),
    },
    {
      title: "Avg Speed to Lead",
      value: fmtHours(K.speedToLeadHours),
      subtext: K.speedToLeadHours != null ? "first contact time" : "No data available",
      icon: Timer, iconBg: "bg-orange-light", iconColor: "text-orange-strong",
    },
    {
      title: "Avg Time to Close",
      value: K.avgTimeToCloseDays != null ? `${Math.round(K.avgTimeToCloseDays)} Days` : "—",
      subtext: K.avgTimeToCloseDays != null ? "deal open to won" : "No data available",
      icon: Clock, iconBg: "bg-red-light", iconColor: "text-red-strong",
    },
    {
      title: "Pipeline Value",
      value: money(sDeals.pipelineValue),
      subtext: "open deals",
      icon: PieChartIcon, iconBg: "bg-blue-light", iconColor: "text-blue-strong",
    },
    {
      title: "Follow-Up Completion",
      value: K.followUp && K.followUp.pct != null ? `${K.followUp.pct}%` : "0%",
      subtext:
        K.followUp && K.followUp.total
          ? `${K.followUp.completed}/${K.followUp.total} tasks`
          : "No data available",
      icon: CheckCircle, iconBg: "bg-green-light", iconColor: "text-green-strong",
    },
  ];
  const kpisRow1Ref = useRef([]);
  kpisRow1Ref.current = kpisRow1;

  // CSV export of the full live dataset (client-side), honoring filters
  const exportAnalyticsCsv = () => {
    const rows = [["metric", "value", "note"]].concat(
      kpisRow1Ref.current.map((k) => [k.title, k.value, k.subtext || ""])
    );
    rows.push([]);
    rows.push(["Lead source", "leads", "conversion %"]);
    srcs.forEach((s) => rows.push([s.source, s.leads, s.conversionRate]));
    rows.push([]);
    rows.push(["Pipeline stage", "deals", "conversion %"]);
    (E.pipelineLeakage || []).forEach((s) => rows.push([s.stage, s.deals, s.conversionPct ?? ""]));
    rows.push([]);
    rows.push(["Agent", "deals", "won", "close rate %", "revenue", "avg response h"]);
    (E.teamPerformance || []).forEach((a) =>
      rows.push([a.name, a.deals, a.won, a.closeRatePct ?? "", a.revenue, a.avgResponseHours ?? ""])
    );
    downloadCsv("analytics-kpis.csv", rows);
  };

  const leadSources = srcs.map((s, i) => ({
    name: s.source,
    value: s.leads,
    percentage:
      leadsInPeriod > 0 ? `${Math.round((s.leads / leadsInPeriod) * 100)}%` : "0%",
    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));

  const pipelineStages = (E.pipelineLeakage || []).map((s) => ({
    name: s.stage.charAt(0).toUpperCase() + s.stage.slice(1),
    count: s.deals,
    conversion: s.conversionPct != null ? `${s.conversionPct}%` : "—",
    drop:
      s.deltaPct != null ? `${s.deltaPct > 0 ? "+" : ""}${s.deltaPct}%` : "—",
    width: s.conversionPct != null ? `${Math.max(4, s.conversionPct)}%` : "4%",
  }));

  const lostReasons = (E.lostReasons || []).map((r) => ({
    reason: r.reason,
    count: r.count,
    percentage: r.pct,
    width: `${Math.max(4, r.pct)}%`,
  }));

  const teamPerformance = (E.teamPerformance || []).map((a) => ({
    name: a.name,
    rate: a.closeRatePct != null ? `${a.closeRatePct}%` : "—",
    width: a.closeRatePct != null ? `${a.closeRatePct}%` : "0%",
    color: (a.closeRatePct || 0) >= 50 ? "green" : "blue",
    time: a.avgResponseHours != null ? fmtHours(a.avgResponseHours) : "—",
    deals: a.deals,
    revenue: money(a.revenue),
  }));

  const whatsappChartData = (WA.byDay || []).map((d) => ({
    day: d.date,
    conversations: d.conversations,
  }));

  const dateLabel = (() => {
    const p = E.period;
    if (!p) return (DATE_RANGES.find((r) => r.key === range) || {}).label || "";
    const f = (x) =>
      new Date(x).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${f(p.startDate)} – ${f(p.endDate)}`;
  })();

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
          <FilterDropdown
            icon={<Calendar size={16} className="text-gray-icon" />}
            label={dateLabel}
            value={range}
            options={DATE_RANGES.map((r) => ({ value: r.key, label: r.label }))}
            onChange={(v) => setRange(v || "30d")}
          />

          <div className="select-wrapper">
            <select
              className="control-select"
              value={compare ? "on" : "off"}
              onChange={(e) => setCompare(e.target.value === "on")}
            >
              <option value="on">vs Previous Period</option>
              <option value="off">No comparison</option>
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>

          <button className="btn-secondary" onClick={exportAnalyticsCsv}>
            <Download size={15} /> Export
          </button>
          <button className="btn-primary" onClick={() => notAvailable("Run AI Revenue Analysis")}>
            <Zap size={15} fill="currentColor" /> Run AI Revenue Analysis
          </button>
        </div>
      </header>
      <FeatureNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      {/* KPI ROW 1 */}
      <div className="kpi-grid-row1">
        {kpisRow1.map((kpi, i) => {
          const Icon = kpi.icon;
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
                  {kpi.delta ? (
                    <span className={`kpi-badge ${kpi.delta.up ? "pos" : "neg"}`}>
                      {kpi.delta.up ? "↑" : "↓"} {kpi.delta.text}
                    </span>
                  ) : null}
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
              {leadSources.length === 0 ? (
                <EmptyState />
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={leadSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div className="donut-center-text">
                <span className="total-number">{leadsInPeriod}</span>
                <span className="total-label">Total Leads</span>
              </div>
            </div>

            <div className="lead-source-list-v2">
              {leadSources.length === 0 ? <EmptyState /> : null}
              {leadSources.map((src, i) => (
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
              ))}
            </div>
          </div>

          {/* Footer Link */}
          <div className="card-footer-action">
            <button className="btn-view-all" onClick={() => navigate("/dashboard/leads")}>
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
            Identify deals slipping in the pipeline
          </p>

          <div className="pipeline-funnel-wrapper">
            <div className="funnel-table-header">
              <span>Stage</span>
              <span className="text-center">Deals</span>
              <span className="text-right">Conversion</span>
              <span className="text-right">vs Prev.</span>
            </div>
            <div className="funnel-bars-container">
              {pipelineStages.length === 0 ? <EmptyState /> : null}
              {pipelineStages.map((stage, i) => (
                <div key={i} className="funnel-row">
                  <div className="funnel-label-bar">
                    <span className="stage-name">{stage.name}</span>
                    <div className="funnel-bar-bg">
                      <div
                        className="funnel-bar-fill"
                        style={{ width: stage.width, backgroundColor: "#2563eb" }}
                      ></div>
                    </div>
                    <span className="stage-count">{stage.count}</span>
                  </div>
                  <span className="funnel-percent">{stage.conversion}</span>
                  <span
                    className={`funnel-drop ${stage.drop !== "—" && stage.drop.startsWith("-") ? "text-red-strong" : "text-gray-400"}`}
                  >
                    {stage.drop}
                  </span>
                </div>
              ))}
            </div>
            <div className="funnel-footer">
              <button className="btn-view-all" onClick={() => navigate("/dashboard/pipeline")}>
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
              {whatsappChartData.length === 0 ? (
                <EmptyState label="No WhatsApp activity in this period" />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={whatsappChartData}
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
              {/* Card 1 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Conversations</span>
                <span className="metric-value">{WA.conversations ?? "—"}</span>
              </div>

              {/* Card 2 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies Sent</span>
                <span className="metric-value">{WA.repliesSent ?? "—"}</span>
              </div>

              {/* Card 3 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies This Period</span>
                <span className="metric-value">{WA.repliesPeriod ?? "—"}</span>
              </div>

              {/* Card 4 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Appointments Booked</span>
                <span className="metric-value">{K.appointmentsBooked ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Footer Action Link */}
          <div className="funnel-footer">
            <button className="btn-view-all" onClick={() => navigate("/dashboard/whatsapp")}>
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
          <p className="card-subtitle">Why deals did not close</p>
          <div className="lost-reasons-list">
            <div className="lost-header-row">
              <span>Reason</span>
              <span></span>
              <span className="text-right">Lost Deals</span>
              <span className="text-right">% of Total</span>
            </div>
            {lostReasons.length === 0 ? (
              <EmptyState label="No lost deals in this period" />
            ) : null}
            {lostReasons.map((item, i) => (
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
            ))}
          </div>
          <div className="funnel-footer">
            <button className="btn-view-all" onClick={() => navigate("/dashboard/pipeline")}>
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
          <p className="card-subtitle">How your team is performing</p>
          <div className="team-performance-list">
            <div className="team-header-row">
              <span>Agent</span>
              <span>Close Rate</span>
              <span>Response Time</span>
              <span>Deals</span>
              <span className="text-right">Revenue</span>
            </div>
            {teamPerformance.length === 0 ? <EmptyState /> : null}
            {teamPerformance.map((agent, i) => (
              <div key={i} className="team-item-row">
                <span className="agent-name">
                  <InitialsAvatar name={agent.name} size={24} />
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
            ))}
          </div>
          <div className="funnel-footer">
            <button className="btn-view-all" onClick={() => navigate("/dashboard/team")}>
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
              <button className="btn-view-all" onClick={() => navigate("/dashboard/ai-center")}>
                View all insights <ArrowRight size={14} />
              </button>
            </div>
            <p className="card-subtitle">
              Actionable insights generated by Cortexa AI
            </p>

            <div className="insights-list-row">
              <div className="insight-item-box">
                <div className="insight-icon-title">
                  <div className="insight-left-wrap">
                    <div className="insight-icon-wrap green">
                      <MessageCircle size={16} className="text-green-strong" />
                    </div>
                    <div className="insight-icon-box-wrap">
                      <h4>Compare performance across your lead sources</h4>
                      <p>Review which channels convert best for your team.</p>
                  </div>
                  </div>
                  <a href="/dashboard/whatsapp" className="text-royal-blue" onClick={(e) => { e.preventDefault(); navigate("/dashboard/whatsapp"); }}>
                    Open WhatsApp Leads →
                  </a>
                </div>
              </div>

              <div className="insight-item-box">
                <div className="insight-icon-title">
                  <div className="insight-left-wrap">
                    <div className="insight-icon-wrap orange">
                      <Target size={20} className="text-orange-strong" />
                    </div>
                    <div className="insight-icon-box-wrap">
                      <h4>Keep showings moving to a close</h4>
                      <p>
                        Follow up within 24 hours to increase your close rate.
                      </p>
                    </div>
                  </div>
                  <a href="/dashboard/pipeline" className="text-royal-blue" onClick={(e) => { e.preventDefault(); navigate("/dashboard/pipeline"); }}>
                    Reviewing Showings →
                  </a>
                </div>
              </div>

              <div className="insight-item-box">
                <div className="insight-icon-title">
                  <div className="insight-left-wrap">
                    <div className="insight-icon-wrap purple">
                      <Zap size={20} className="text-purple-strong" />
                    </div>
                    <div className="insight-icon-box-wrap">
                      <h4>AI follow up can boost appointments</h4>
                      <p>
                        Enable AI follow-up to re-engage cold leads automatically.
                      </p>
                    </div>
                  </div>
                  <a href="/dashboard/ai-auto-reply" className="text-royal-blue" onClick={(e) => { e.preventDefault(); navigate("/dashboard/ai-auto-reply"); }}>
                    Open AI Automation →
                  </a>
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
                  <h3>—</h3>
                </div>
                <p className="forecast-desc">
                  Revenue forecasting connects once historical deal data is
                  available.
                </p>
              </div>

              <button className="btn-forecast-action" onClick={() => notAvailable("AI Forecast")}>
                Generate AI Forecast →
              </button>
            </div>

            <div className="forecast-chart-graphic">
              <div className="bar white-bar" style={{ height: "30%" }}></div>
              <div className="bar white-bar" style={{ height: "45%" }}></div>
              <div className="bar white-bar" style={{ height: "60%" }}></div>
              <div className="bar white-bar" style={{ height: "50%" }}></div>
              <div className="bar blue-bar" style={{ height: "75%" }}></div>
              <div
                className="bar blue-bar animate-pulse"
                style={{ height: "90%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 5: AI INSIGHTS & FORECAST */}
      <div className="insights-forecast-grid"><span className="dot-bottom"></span>All data is updated in real-time</div>
    </div>
  );
}
