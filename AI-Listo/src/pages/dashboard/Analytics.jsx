import React, { useState } from "react";
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

import "./analytics.css";

function money(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function CortexaAnalyticsDashboard() {
  const kpisRow1 = [
    {
      title: "Projected Revenue",
      value: "$2.48M",
      delta: "18.4%",
      type: "up-good",
      subtext: "vs May 5 – May 11",
      icon: DollarSign,
      iconBg: "bg-green-light",
      iconColor: "text-green-strong",
    },
    {
      title: "New Leads",
      value: "248",
      delta: "15.7%",
      type: "up-good",
      subtext: "vs May 5 – May 11",
      icon: User,
      iconBg: "bg-blue-light",
      iconColor: "text-blue-strong",
    },
    {
      title: "Conversion Rate",
      value: "21.8%",
      delta: "3.2%",
      type: "up-good",
      subtext: "vs May 5 – May 11",
      icon: Filter,
      iconBg: "bg-cyan-light",
      iconColor: "text-cyan-strong",
    },
    {
      title: "Appointments Booked",
      value: "148",
      delta: "16.4%",
      type: "up-good",
      subtext: "vs May 5 – May 11",
      icon: CalendarCheck,
      iconBg: "bg-pink-light",
      iconColor: "text-pink-strong",
    },
    {
      title: "Avg Speed to Lead",
      value: "2m 34s",
      delta: "8.6%",
      type: "down-good",
      subtext: "vs May 5 – May 11",
      icon: Timer,
      iconBg: "bg-orange-light",
      iconColor: "text-orange-strong",
    },
    {
      title: "Avg Time to Close",
      value: "18 Days",
      delta: "4 days",
      type: "down-good",
      subtext: "vs May 5 – May 11",
      icon: Clock,
      iconBg: "bg-red-light",
      iconColor: "text-red-strong",
    },
    {
      title: "Pipeline Value",
      value: "$5.72M",
      delta: "12.1%",
      type: "up-good",
      subtext: "vs May 5 – May 11",
      icon: PieChartIcon,
      iconBg: "bg-blue-light",
      iconColor: "text-blue-strong",
    },
    {
      title: "Follow-Up Completion",
      value: "68%",
      delta: "9.3%",
      type: "up-good", 
      subtext: "vs May 5 – May 11",
      icon: CheckCircle,
      iconBg: "bg-green-light",
      iconColor: "text-green-strong",
    },
  ];

  const kpisRow2 = [
    {
      title: "Ad Spend",
      value: "$53,420",
      delta: "6.2%",
      positive: true,
      subtext: "Total campaign spend",
      icon: Megaphone,
      iconColor: "text-blue-spend",
      iconBg: "bg-blue-light",
    },
    {
      title: "Cost Per Lead",
      value: "$12.48",
      delta: "8.5%",
      positive: false,
      subtext: "Average CPL",
      icon: Target,
      iconColor: "text-red-cpl",
      iconBg: "bg-red-light",
    },
    {
      title: "Cost Per Appointment",
      value: "$48.21",
      delta: "5.1%",
      positive: true,
      subtext: "Cost to book a showing",
      icon: Calendar,
      iconColor: "text-purple-cpa",
      iconBg: "bg-purple-light",
    },
    {
      title: "Cost Per Closing",
      value: "$342.65",
      delta: "7.7%",
      positive: true,
      subtext: "Cost to close a deal",
      icon: DollarSign,
      iconColor: "text-darkblue-cpc",
      iconBg: "bg-cyan-light",
    },
  ];

  const revenueTrend = [
    { month: "Jan", revenue: 180000 },
    { month: "Feb", revenue: 240000 },
    { month: "Mar", revenue: 210000 },
    { month: "Apr", revenue: 310000 },
    { month: "May", revenue: 510000 },
    { month: "Jun", revenue: 600000 },
  ];

  const leadSources = [
    { name: "WhatsApp", value: 96, percentage: "38.7%", fill: "#0ea5e9" },
    { name: "Instagram", value: 52, percentage: "21.0%", fill: "#d946ef" },
    { name: "Website", value: 46, percentage: "18.5%", fill: "#3b82f6" },
    { name: "Marketplace", value: 28, percentage: "11.3%", fill: "#f97316" },
    { name: "Referrals", value: 26, percentage: "10.5%", fill: "#64748b" },
  ];

  const pipelineStages = [
    { name: "Leeds", count: 218, conversion: "156%", drop: "-" },
    { name: "Qualified", count: 218, conversion: "68%", drop: "-32%" },
    { name: "Showings", count: 216, conversion: "37%", drop: "-32%" },
    { name: "Offers", count: 54, conversion: "17%", drop: "-22%" },
    { name: "Closings", count: 16, conversion: "6%", drop: "-11%" },
  ];

  const aiPerformance = [
    { day: "Mon", replies: 42, appointments: 8 },
    { day: "Tue", replies: 51, appointments: 11 },
    { day: "Wed", replies: 67, appointments: 15 },
    { day: "Thu", replies: 74, appointments: 18 },
    { day: "Fri", replies: 83, appointments: 21 },
    { day: "Sat", replies: 58, appointments: 12 },
    { day: "Sun", replies: 63, appointments: 14 },
  ];

  const lostReasons = [
    { reason: "No response", count: 42, percentage: 28, width: "85%" },
    { reason: "Price too high", count: 31, percentage: 20, width: "65%" },
    { reason: "Wrong location", count: 22, percentage: 15, width: "45%" },
    { reason: "Financing issue", count: 18, percentage: 12, width: "35%" },
    { reason: "Bought elsewhere", count: 15, percentage: 10, width: "30%" },
    { reason: "Not qualified", count: 12, percentage: 8, width: "20%" },
    {
      reason: "Agent did not follow up",
      count: 10,
      percentage: 7,
      width: "15%",
    },
  ];

  const teamPerformance = [
    {
      name: "Sofia Reyes",
      rate: "27%",
      time: "5m",
      deals: 18,
      revenue: "$640,000",
      color: "bg-green-strong",
      width: "80%",
    },
    {
      name: "Carlos Vega",
      rate: "27%",
      time: "4m",
      deals: 14,
      revenue: "$450,000",
      color: "bg-green-strong",
      width: "70%",
    },
    {
      name: "Maria Lopez",
      rate: "24%",
      time: "5m",
      deals: 11,
      revenue: "$310,000",
      color: "bg-green-strong",
      width: "60%",
    },
    {
      name: "Diego Ruiz",
      rate: "21%",
      time: "6m",
      deals: 9,
      revenue: "$270,000",
      color: "bg-green-strong",
      width: "50%",
    },
    {
      name: "Ana Torres",
      rate: "19%",
      time: "8m",
      deals: 7,
      revenue: "$210,000",
      color: "bg-green-strong",
      width: "40%",
    },
  ];
  const whatsappChartData = [
    { day: "Mon", conversations: 34 },
    { day: "Tue", conversations: 49 },
    { day: "Wed", conversations: 44 },
    { day: "Thu", conversations: 55 },
    { day: "Fri", conversations: 78 },
    { day: "Sat", conversations: 69 },
    { day: "Sun", conversations: 84 },
  ];
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

          <button className="btn-secondary">
            <Download size={15} /> Export
          </button>
          <button className="btn-primary">
            <Zap size={15} fill="currentColor" /> Run AI Revenue Analysis
          </button>
        </div>
      </header>

      {/* KPI ROW 1 */}
      <div className="kpi-grid-row1">
        {kpisRow1.map((kpi, i) => {
          const Icon = kpi.icon;

          const isUp = kpi.type.startsWith("up");
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
                    {arrow} {kpi.delta}
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
            <button className="btn-view-all">
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
              <button className="btn-view-all">
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
              <div className="wa-metric-card">
                <span className="metric-title">Conversations</span>
                <span className="metric-value">246</span>
                <span className="metric-badge pos">↑ 14.6%</span>
              </div>

              {/* Card 2 */}
              <div className="wa-metric-card">
                <span className="metric-title">Replies Sent</span>
                <span className="metric-value">382</span>
                <span className="metric-badge pos">↑ 12.1%</span>
              </div>

              {/* Card 3 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Replies This Period</span>
                <span className="metric-value">438</span>
              </div>

              {/* Card 4 */}
              <div className="wa-metric-card no-badge">
                <span className="metric-title">Appointments Booked</span>
                <span className="metric-value">101</span>
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
            <button className="btn-view-all">
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
            <button className="btn-view-all">
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
                      <h4>WhatsApp is outperforming of other sources</h4>
                      <p>You're converting 2.4x higher than Instagram traffic.</p>
                  </div>
                  </div>
                  <a href="#action" className="text-royal-blue">
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
                      <h4>41% of showing are not converting</h4>
                      <p>
                        Follow up within 24 hours to increase your close rate.
                      </p>
                    </div>
                  </div>
                  <a href="#action" className="text-royal-blue">
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
                  <a href="#action" className="text-royal-blue">
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
                  <h3>$1.25M</h3>
                </div>
                <p className="forecast-desc">Estimated revenue next 30 days</p>
                <p className="top-opp">
                  Top Opportunity: Conerotau Agortment – $420K
                </p>
              </div>

              <button className="btn-forecast-action">
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
