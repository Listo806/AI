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
      positive: true,
      subtext: "Expected closings this quarter",
      icon: DollarSign,
      iconBg: "bg-green-light",
      iconColor: "text-green-strong",
    },
    {
      title: "Conversion Rate",
      value: "21.8%",
      delta: "3.2%",
      positive: true,
      subtext: "Lead-to-close conversion",
      icon: TrendingUp,
      iconBg: "bg-orange-light",
      iconColor: "text-orange-strong",
    },
    {
      title: "AI Close Rate",
      value: "31%",
      delta: "8.1%",
      positive: true,
      subtext: "Deals assisted by AI",
      icon: ShieldCheck,
      iconBg: "bg-purple-light",
      iconColor: "text-purple-strong",
    },
    {
      title: "Appointments",
      value: "148",
      delta: "26",
      positive: true,
      subtext: "Showings booked this period",
      icon: CalendarCheck,
      iconBg: "bg-blue-light",
      iconColor: "text-blue-strong",
    },
    {
      title: "Avg Time to Close",
      value: "18 Days",
      delta: "4 days",
      positive: false,
      subtext: "Average deal cycle",
      icon: Clock3,
      iconBg: "bg-red-light",
      iconColor: "text-red-strong",
    },
    {
      title: "Lead Quality Score",
      value: "2m 34s",
      delta: "384",
      positive: true,
      subtext: "Average speed to lead",
      icon: Target,
      iconBg: "bg-cyan-light",
      iconColor: "text-cyan-strong",
    },
    {
      title: "ROAS",
      value: "4.62x",
      delta: "22.1%",
      positive: true,
      subtext: "Revenue return on ad spend",
      icon: Percent,
      iconBg: "bg-pink-light",
      iconColor: "text-pink-strong",
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
    {
      source: "WhatsApp",
      leads: 123,
      conversion: 58,
      revenue: 920000,
      fill: "#2563eb",
    },
    {
      source: "Instagram",
      leads: 92,
      conversion: 19,
      revenue: 910000,
      fill: "#7c3aed",
    },
    {
      source: "Website",
      leads: 74,
      conversion: 17,
      revenue: 539000,
      fill: "#ea580c",
    },
    {
      source: "Marketplace",
      leads: 41,
      conversion: 15,
      revenue: 200000,
      fill: "#0d9488",
    },
    {
      source: "Referrals",
      leads: 16,
      conversion: 17,
      revenue: 510000,
      fill: "#16a34a",
    },
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

  return (
    <div className="analytics-page">
      <div className="heading_page">
        <BarChart3 className="header-icon" size={20} />
        <h1>Analytics Overview</h1>
      </div>
      <p className="sub_head">Monitor revenue, conversation performance, AI effectiveness, ROI and pipeline intelligence in real time.</p>
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
            <Download size={15} /> CSV
          </button>
          <button className="btn-secondary">
            <FileDown size={15} /> PDF
          </button>
          <button className="btn-primary">
            <Zap size={15} fill="currentColor" /> Run AI Revenue Analysis
          </button>
        </div>
      </header>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="filter-select-wrapper">
          <select>
            <option>All Agents</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <div className="filter-select-wrapper">
          <select>
            <option>All Teams</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <div className="filter-select-wrapper">
          <select>
            <option>All Sources</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <div className="filter-select-wrapper">
          <select>
            <option>All Cities</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <div className="filter-select-wrapper">
          <select>
            <option>All Property Types</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <div className="filter-select-wrapper">
          <select>
            <option>All Pipeline Stages</option>
          </select>
          <ChevronDown size={12} />
        </div>
        <button className="clear-filter-btn">
          <RefreshCw size={14} /> Clear Filters
        </button>
      </div>

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
                <div className="kpi-body">
                  <span className="kpi-title">{kpi.title}</span>
                  <span className="kpi-value">{kpi.value}</span>
                  <span className={`kpi-badge ${kpi.positive ? "pos" : "neg"}`}>
                    {kpi.title === "Lead Quality Score"
                      ? "↓"
                      : kpi.positive
                        ? "↑"
                        : "↓"}{" "}
                    {kpi.delta}
                  </span>
                </div>
              </div>
              <p className="kpi-subtext">{kpi.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* KPI ROW 2 */}
      <div className="kpi-grid-row2">
        {kpisRow2.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="kpi-card-detailed">
              <div className="kpi-det-left">
                <div
                  className={`kpi-det-icon-wrapper ${kpi.iconBg} ${kpi.iconColor}`}
                >
                  <Icon size={20} className={kpi.iconColor} />
                </div>
                <div className="kpi-det-right">
                  <span className="kpi-det-title">{kpi.title}</span>
                  <div className="kpi-det-value-wrap">
                    <span className="kpi-det-value">{kpi.value}</span>
                    <span
                      className={`kpi-det-badge ${kpi.positive ? "pos" : "neg"}`}
                    >
                      {kpi.positive ? "↓" : "↑"} {kpi.delta}
                    </span>
                  </div>
                  <p className="kpi-det-subtext">{kpi.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROW 3: REVENUE + LEAD SOURCE + PIPELINE LEAKAGE */}
      <div className="charts-grid-3col">
        {/* Revenue Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <BarChart3 size={18} className="text-royal-blue" />
              <h3>Revenue Performance</h3>
            </div>
            <div className="card-toggle">
              <button className="active">Revenue</button>
              <button>Closings</button>
            </div>
          </div>
          <p className="card-subtitle">Revenue & closing trends over time</p>
          <div className="chart-container-fixed">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

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
            <div className="chart-container-half">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadSources}
                  margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
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
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                    {leadSources.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lead-source-list">
              <div className="list-header-row">
                <span>Source</span>
                <span>Leads</span>
                <span>Conversion</span>
                <span>Revenue</span>
              </div>
              {leadSources.map((src, i) => (
                <div key={i} className="list-item-row">
                  <div className="src-name-dot">
                    <span
                      className="dot"
                      style={{ backgroundColor: src.fill }}
                    ></span>
                    <span className="name">{src.source}</span>
                  </div>
                  <span className="val font-semibold">{src.leads}</span>
                  <span className="val text-gray-500">{src.conversion}%</span>
                  <span className="val font-bold text-gray-800">
                    {money(src.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Leakage Analysis */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <AlertTriangle size={18} className="text-royal-blue" />
              <h3>Pipeline Leakage Analysis</h3>
            </div>
            <a href="#all" className="card-link text-royal-blue">
              View All Sources →
            </a>
          </div>
          <p className="card-subtitle">
            Identtfy dently deals ine shopping in the pipeline
          </p>

          <div className="pipeline-funnel-wrapper">
            <div className="funnel-table-header">
              <span>Leeds</span>
              <span className="text-right">Conversion</span>
              <span className="text-right">Drsp Off</span>
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
                            backgroundColor: i === 4 ? "#2563eb" : "#bfdbfe",
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
              <span>Overall Conversion</span>
              <span className="total-conv-val text-royal-blue">6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: AI PERFORMANCE + WHATSAPP + LOST REASONS + TEAM */}
      <div className="charts-grid-4col">
        {/* AI Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <Bot size={18} className="text-royal-blue" />
              <h3>AI Performance</h3>
            </div>
          </div>
          <p className="card-subtitle">
            Track AI replies and appointments over time
          </p>
          <div className="chart-container-mini">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aiPerformance}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
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
                <Line
                  type="monotone"
                  dataKey="replies"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mini-stats-row">
            <div className="mini-stat-box">
              <div className="mini-stat-icon1"><ShieldCheck  size={16} /></div>
              <div>
                <span>AI Replies This Period</span>
                <h4>438</h4>
              </div>
            </div>
            <div className="mini-stat-box">
              <div className="mini-stat-icon2"><CalendarCheck  size={16} /></div>
              <div>
              <span>Appointments Booked</span>
              <h4>101</h4>
              </div>
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
          <div className="whatsapp-stats-grid">
            <div className="wa-box">
              <span>WhatsApp Leads</span>
              <h4>246</h4>
            </div>
            <div className="wa-box">
              <span>AI Replies Sent</span>
              <h4>382</h4>
            </div>
            <div className="wa-box">
              <span>Unread Conversation</span>
              <h4>27</h4>
            </div>
            <div className="wa-box">
              <span>Booked From WhatsApp</span>
              <h4>63</h4>
            </div>
            <div className="wa-box">
              <span>WhatsApp Close Rate</span>
              <h4>24.3%</h4>
            </div>
            <div className="wa-box">
              <span>Human Replies Sent</span>
              <h4>118</h4>
            </div>
          </div>
          <a href="#wa" className="wa-workspace-link text-royal-blue">
            Open WhatsApp Workspace →
          </a>
        </div>

        {/* Lost Deal Reasons */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <AlertTriangle size={18} className="text-red-strong" />
              <h3>Lost Deal Reasons</h3>
            </div>
          </div>
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
        </div>

        {/* Team Performance */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <Users size={18} className="text-royal-blue" />
              <h3>Team Performance</h3>
            </div>
            <a href="#team" className="card-link text-royal-blue">
              View Full Report →
            </a>
          </div>
          <div className="team-performance-list">
            <div className="team-header-row">
              <span>Agent</span>
              <span>Close Rate</span>
              <span>Response Time</span>
              <span>Deals</span>
              <span>Revenue</span>
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
        </div>
      </div>

      {/* ROW 5: AI INSIGHTS & FORECAST */}
      <div className="insights-forecast-grid">
        {/* AI Revenue Insights */}
        <div className="dashboard-card insights-card">
          <div className="card-header">
            <div className="card-header-left">
              <Sparkles size={18} className="text-royal-blue" />
              <h3>AI Revenue Insights</h3>
            </div>
          </div>
          <p className="card-subtitle">
            Actionable insights generated by Cortesa AI
          </p>

          <div className="insights-list-row">
            <div className="insight-item-box">
              <div className="insight-icon-title">
                <div className="insight-icon-wrap green"><MessageCircle size={20} className="text-green-strong" /></div>
                <h4>WhatsApp is outperforming of other sources</h4>
              </div>
              <p>
                WhatsApp leads we converting 2.4x higher than Instagram traffic.
              </p>
              <a href="#action" className="text-royal-blue">
                Open WhatsApp Leads →
              </a>
            </div>

            <div className="insight-item-box">
              <div className="insight-icon-title">
                <div className="insight-icon-wrap orange"><Target size={20} className="text-orange-strong" /></div>
                <h4>Pipeline leakage in Showing stage</h4>
              </div>
              <p>
                41% of cheuring stage leads are vet rooching follow up within 24
                hours.
              </p>
              <a href="#action" className="text-royal-blue">
                Review Showing Pipeline →
              </a>
            </div>

            <div className="insight-item-box">
              <div className="insight-icon-title">
                <div className="insight-icon-wrap purple"><Zap size={20} className="text-purple-strong" /></div>
                <h4>AI follw-up automation lacremed appointments</h4>
              </div>
              <p>
                AI igameisest replies improves benving rotes for TM this week.
              </p>
              <a href="#action" className="text-royal-blue">
                Open AI Performance →
              </a>
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
              AI forecasts 18 additiod closiogs over the neat period based on
              active plocline velaocy and lead quatity signals.
            </p>

            <div className="forecast-metrics">
              <div className="m-box">
                <span>Forecasted Revenue:</span>
                <h3>$1.25M</h3>
              </div>
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
  );
}
