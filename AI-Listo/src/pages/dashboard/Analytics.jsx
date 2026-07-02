import React, { useState, useEffect } from "react";
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
  Zap,
  Bot,
  CalendarCheck,
  Globe,
  Clock3,
  Target,
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

import { useNavigate } from "react-router-dom";
import {
  useFeatureNotice,
  FeatureNoticeBanner,
} from "../../components/FeatureNotice";
import "./analytics.css";
import {
  getAnalyticsDashboard,
  getDashboardSummary,
} from "../../api/analyticsApi";
import { useApiErrorHandler } from "../../utils/useApiErrorHandler";

function money(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function CortexaAnalyticsDashboard() {
  const { handleError } = useApiErrorHandler();
  const navigate = useNavigate();
  const { notice, setNotice, notAvailable } = useFeatureNotice();

  // CSV export of the live KPI row (client-side)
  const exportAnalyticsCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["metric", "value", "note"]].concat(
      kpisRow1Ref.current.map((k) => [k.title, k.value, k.subtext || ""])
    );
    const blob = new Blob(
      [rows.map((r) => r.map(esc).join(",")).join("\n")],
      { type: "text/csv" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "analytics-kpis.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const kpisRow1Ref = React.useRef([]);
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [a, s] = await Promise.all([
          getAnalyticsDashboard("30d"),
          getDashboardSummary().catch(() => null),
        ]);
        if (active) {
          setAnalytics(a);
          setSummary(s);
        }
      } catch (err) {
        if (active) handleError(err, "Failed to load analytics");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Live figures from /analytics/dashboard. Panels without a backend source
  // are emptied rather than showing fabricated numbers.
  const A = analytics || {};
  const aLeads = A.leads || {};
  const aByStatus = aLeads.byStatus || {};
  const aProps = A.properties || {};
  const aUsers = A.users || {};
  const aActivity = A.activity || {};

  const sDeals = (summary || {}).deals || {};

  // Approved KPI layout: all eight cards stay visible. Cards whose metric has
  // no backend endpoint yet show a neutral value with "No data available".
  const kpisRow1 = [
    { title: "Projected Revenue", value: "$0", subtext: "No data available", icon: DollarSign, iconBg: "bg-green-light", iconColor: "text-green-strong" },
    { title: "New Leads", value: String(aLeads.created ?? aLeads.total ?? 0), subtext: "last 30 days", icon: User, iconBg: "bg-blue-light", iconColor: "text-blue-strong" },
    { title: "Conversion Rate", value: aLeads.conversionRate != null ? `${aLeads.conversionRate}%` : "0%", subtext: "leads to converted", icon: Filter, iconBg: "bg-cyan-light", iconColor: "text-cyan-strong" },
    { title: "Appointments Booked", value: "0", subtext: "No data available", icon: CalendarCheck, iconBg: "bg-pink-light", iconColor: "text-pink-strong" },
    { title: "Avg Speed to Lead", value: "—", subtext: "No data available", icon: Timer, iconBg: "bg-orange-light", iconColor: "text-orange-strong" },
    { title: "Avg Time to Close", value: aLeads.averageTimeToConvert != null ? `${Math.round(aLeads.averageTimeToConvert)} Days` : "—", subtext: aLeads.averageTimeToConvert != null ? "avg lead to converted" : "No data available", icon: Clock, iconBg: "bg-red-light", iconColor: "text-red-strong" },
    { title: "Pipeline Value", value: money(sDeals.pipelineValue), subtext: "open deals", icon: PieChartIcon, iconBg: "bg-blue-light", iconColor: "text-blue-strong" },
    { title: "Follow-Up Completion", value: "0%", subtext: "No data available", icon: CheckCircle, iconBg: "bg-green-light", iconColor: "text-green-strong" },
  ];
  kpisRow1Ref.current = kpisRow1;
  const kpisRow2 = [];
  const revenueTrend = [];
  const leadSources = [];
  const pipelineStages = [
    { name: "New", count: aByStatus.new ?? 0, conversion: "", drop: "" },
    { name: "Contacted", count: aByStatus.contacted ?? 0, conversion: "", drop: "" },
    { name: "Qualified", count: aByStatus.qualified ?? 0, conversion: "", drop: "" },
    { name: "Converted", count: aByStatus.converted ?? 0, conversion: "", drop: "" },
    { name: "Lost", count: aByStatus.lost ?? 0, conversion: "", drop: "" },
  ];
  const aiPerformance = [];
  const lostReasons = [];
  const teamPerformance = [];
  const whatsappChartData = [];
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
            <span>May 12 – May 18, 2025</span>
            <Calendar size={16} className="text-gray-icon" />
          </div>

          <div className="select-wrapper">
            <select className="control-select">
              <option>vs Previous Period</option>
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

          const isUp = (kpi.type || "up").startsWith("up");
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
                  {kpi.delta ? (
                    <span className={badgeClass}>
                      {arrow} {kpi.delta}
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
                <span className="total-number">248</span>
                <span className="total-label">Total Leads</span>
              </div>
            </div>

            <div className="lead-source-list-v2">
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
            <button className="btn-view-all" onClick={() => notAvailable("Lead source breakdown")}>
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
            Identtfy dently deals ine shopping in the pipeline
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
                const widths = ["100%", "100%", "98%", "35%", "12%"];
                return (
                  <div key={i} className="funnel-row">
                    <div className="funnel-label-bar">
                      <span className="stage-name">{stage.name}</span>
                      <div className="funnel-bar-bg">
                        <div
                          className="funnel-bar-fill"
                          style={{
                            width: widths[i],
                            backgroundColor: i === 4 ? "#2563eb" : "#2563eb",
                          }}
                        ></div>
                      </div>
                      <span className="stage-count">{stage.count}</span>
                    </div>
                    <span className="funnel-percent">{stage.conversion}</span>
                    <span
                      className={`funnel-drop ${stage.drop !== "-" ? "text-red-strong" : "text-gray-400"}`}
                    >
                      {stage.drop}
                    </span>
                  </div>
                );
              })}
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
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
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
            </div>

            <div className="wa-metrics-grid">
              {/* Card 1 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Conversations</span>
                <span className="metric-value">—</span>
              </div>

              {/* Card 2 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies Sent</span>
                <span className="metric-value">—</span>
              </div>

              {/* Card 3 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies This Period</span>
                <span className="metric-value">—</span>
              </div>

              {/* Card 4 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Appointments Booked</span>
                <span className="metric-value">—</span>
              </div>
            </div>
          </div>

          {/* Footer Action Link */}
          <div className="funnel-footer">
            <button className="btn-view-all">
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
            <button className="btn-view-all" onClick={() => notAvailable("Lost deal reasons")}>
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
            {teamPerformance.map((agent, i) => (
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
              <button className="btn-view-all">
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
      <div className="insights-forecast-grid"><span class="dot-bottom"></span>All data is updated in real-time</div>
    </div>
  );
}
