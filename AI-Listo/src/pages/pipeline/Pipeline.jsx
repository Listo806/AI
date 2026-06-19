import React from "react";
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
  const stats = [
    {
      title: "Total Deals",
      value: "42",
      change: "↑ 8 this month",
      icon: <Users size={20} />,
      className: "blue",
      changeClass: "text-green",
    },
    {
      title: "Pipeline Value",
      value: "$2.4M",
      change: "↑ 12% vs last month",
      icon: <DollarSign size={20} />,
      className: "green",
      changeClass: "text-green",
    },
    {
      title: "Won This Month",
      value: "$680K",
      change: "↑ 15% vs last month",
      icon: <CheckCircle2 size={20} />,
      className: "purple",
      changeClass: "text-green",
    },
    {
      title: "Active Negotiations",
      value: "9",
      change: "3 stuck deals",
      icon: <Flame size={20} />,
      className: "orange",
      changeClass: "text-orange",
    },
    {
      title: "AI Close Score",
      value: "91%",
      change: "↑ 6% vs last month",
      icon: <Bot size={20} />,
      className: "cyan",
      changeClass: "text-green",
    },
    {
      title: "Revenue At Risk",
      value: "$310K",
      change: "↑ 18% vs last month",
      icon: <AlertTriangle size={20} />,
      className: "pink",
      changeClass: "text-red",
    },
  ];

  const columns = [
    {
      id: "new",
      title: "New",
      count: 7,
      amount: "$420K",
      insight: "3 need initial contact",
      deals: [
        {
          name: "Maria Fernandez",
          property: "Modern Luxury Villa",
          amount: "$450,000",
          score: "68%",
          tag: "Hot",
          action: "Call now",
          time: "1 min ago",
          avatarClass: "avatar-purple",
          avatarInitials: "M",
        },
        {
          name: "Andres Lopez",
          property: "Downtown Apartment",
          amount: "$185,000",
          score: "58%",
          tag: "Warm",
          action: "Send market report",
          time: "2 min ago",
          avatarClass: "avatar-blue",
          avatarInitials: "A",
        },
      ],
    },
    {
      id: "qualified",
      title: "Qualified",
      count: 7,
      amount: "$1.2M",
      insight: "2 buyers ready to view",
      deals: [
        {
          name: "Carlos Mendoza",
          property: "Beachfront Condo",
          amount: "$320,000",
          score: "91%",
          tag: "Hot",
          action: "Schedule tour",
          time: "2 min ago",
          avatarClass: "avatar-green",
          avatarInitials: "C",
        },
        {
          name: "Ninja Test Lead",
          property: "Family Home in Suburbs",
          amount: "$950,000",
          score: "77%",
          tag: "Warm",
          action: "Send financing options",
          time: "2 min ago",
          avatarClass: "avatar-sky",
          avatarInitials: "N",
        },
      ],
    },
    {
      id: "proposal",
      title: "Proposal",
      count: 6,
      amount: "$750K",
      insight: "2 proposals pending",
      deals: [
        {
          name: "Makoto Kawamoto",
          property: "Luxury Penthouse",
          amount: "$910,000",
          score: "84%",
          tag: "Hot",
          action: "Follow up",
          time: "45 min ago",
          avatarClass: "avatar-purple",
          avatarInitials: "M",
        },
        {
          name: "Sofia Martinez",
          property: "Golf Course Condo",
          amount: "$675,000",
          score: "93%",
          tag: "Hot",
          action: "Call owner",
          time: "1 hour ago",
          avatarClass: "avatar-orange",
          avatarInitials: "S",
        },
      ],
    },
    {
      id: "negotiation",
      title: "Negotiation",
      count: 5,
      amount: "$680K",
      insight: "3 close to closing",
      deals: [
        {
          name: "David Costa",
          property: "Suburban Home",
          amount: "$340,000",
          score: "100%",
          tag: "Won",
          action: "Send offer",
          time: "2 hours ago",
          avatarClass: "avatar-green",
          avatarInitials: "D",
        },
        {
          name: "Javier Torres",
          property: "Investment Property",
          amount: "$295,000",
          score: "72%",
          tag: "Warm",
          action: "Last buyer check-in",
          time: "3 hours ago",
          avatarClass: "avatar-orange",
          avatarInitials: "J",
        },
      ],
    },
    {
      id: "won",
      title: "Won",
      count: 2,
      amount: "$680K",
      insight: "Celebrate & upsell",
      deals: [
        {
          name: "Ana Neves",
          property: "City Loft",
          amount: "$210,000",
          score: "100%",
          tag: "Won",
          action: "Closed",
          time: "2 days ago",
          nextStep: "Upsell opportunity",
          avatarClass: "avatar-red",
          avatarInitials: "A",
        },
        {
          name: "John Smith",
          property: "Lakeview Condo",
          amount: "$470,000",
          score: "100%",
          tag: "Won",
          action: "Closed",
          time: "3 days ago",
          nextStep: "Referral request",
          avatarClass: "avatar-dark",
          avatarInitials: "JS",
        },
      ],
    },
    {
      id: "lost",
      title: "Lost",
      count: 2,
      amount: "$210K",
      insight: "Re-target & learn",
      deals: [
        {
          name: "Robert Wilson",
          property: "Downtown Unit",
          amount: "$110,000",
          score: "29%",
          tag: "Lost",
          action: "Chose competitor",
          time: "2 days ago",
          avatarClass: "avatar-red",
          avatarInitials: "R",
        },
        {
          name: "Emily Clark",
          property: "Suburban Townhome",
          amount: "$100,000",
          score: "22%",
          tag: "Lost",
          action: "Timing",
          time: "3 days ago",
          avatarClass: "avatar-pink",
          avatarInitials: "E",
        },
      ],
    },
  ];
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
            />
          </div>
          <button className="secondary-btn filter-btn">
            <SlidersHorizontal size={15} /> Filters
          </button>
          <button className="secondary-btn active-view-btn">
            <Sparkles size={15} /> AI Pipeline View
          </button>
          <button className="secondary-btn">
            <Download size={15} /> Export
          </button>
          <button className="primary-btn">
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
            <select defaultValue="">
              <option value="">All Stages</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 4. Priorities Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <AlertCircle size={15} />
            <select defaultValue="">
              <option value="">All Priorities</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>

        {/* 5. AI Scores Filter */}
        <div className="secondary-btn dropdown-filter">
          <div>
            <Sparkles size={15} />
            <select defaultValue="">
              <option value="">All AI Scores</option>
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
        {stats.map((card, idx) => (
          <div className="pipeline-stat-card-item" key={idx}>
            <div className={`stat-card-icon-box ${card.className}`}>
              {card.icon}
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
        {columns.map((col) => (
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
                <div className="kanban-deal-card-item" key={dIdx}>
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
                    <button className="deal-card-footer-action-trigger-btn">
                      <Sparkles size={12} /> Score
                    </button>
                    <button className="deal-card-footer-action-trigger-btn">
                      <ArrowUpRight size={12} /> Move
                    </button>
                  </div>
                </div>
              ))}

              <button className="kanban-column-add-deal-inline-trigger-btn">
                <Plus size={14} /> Add Deal
              </button>
            </div>
          </div>
        ))}
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
                4 at-risk deals need attention
              </span>
            </div>
            <button className="intelligence-view-all-navigation-link">
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="risk-queue-table-rows-wrapper">
            {[
              {
                name: "Luxury Penthouse",
                val: "$910K",
                reason: "Stale for 8 days",
                status: "High",
              },
              {
                name: "Beachfront Condo",
                val: "$320K",
                reason: "No response",
                status: "High",
              },
              {
                name: "Golf Course Condo",
                val: "$675K",
                reason: "Funding delay",
                status: "Medium",
              },
              {
                name: "Downtown Apartment",
                val: "$185K",
                reason: "Unanswered calls",
                status: "Medium",
              },
            ].map((row, rIdx) => (
              <div className="risk-queue-table-row-item" key={rIdx}>
                <span className="risk-table-cell-property-name">
                  {row.name}
                </span>
                <strong className="risk-table-cell-deal-value">
                  {row.val}
                </strong>
                <span className="risk-table-cell-risk-reason-desc">
                  {row.reason}
                </span>
                <span
                  className={`risk-table-cell-severity-badge status-${row.status.toLowerCase()}`}
                >
                  {row.status}
                </span>
                <button className="risk-table-cell-action-review-trigger-btn">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2: REVENUE FORECAST */}
        <div className="bottom-intelligence-card-panel">
          <div className="intelligence-card-header-row">
            <div className="flex items-center gap-2">
              <LineChartIcon size={18} className="intelligence-header-icon" />
              <h3 className="intelligence-card-main-title">Revenue Forecast</h3>
            </div>
            <button className="secondary-btn compact-dropdown-trigger">
              This Month <ChevronDown size={14} />
            </button>
          </div>

          <div className="revenue-forecast-metrics-grid-quad">
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Forecasted Revenue
              </span>
              <strong className="forecast-quad-card-large-numeric">
                $1.1M
              </strong>
              <span className="forecast-quad-card-trend-subtext text-green">
                ↑ 14% vs last month
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Forecasted Closings
              </span>
              <strong className="forecast-quad-card-large-numeric">12</strong>
              <span className="forecast-quad-card-trend-subtext text-green">
                ↑ 20% vs last month
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">
                Pipeline Velocity
              </span>
              <strong className="forecast-quad-card-large-numeric">
                1.42x
              </strong>
              <span className="forecast-quad-card-trend-subtext text-green">
                ↑ 18% vs last week
              </span>
            </div>
            <div className="revenue-forecast-metric-quad-card">
              <span className="forecast-quad-card-label">Close Confidence</span>
              <strong className="forecast-quad-card-large-numeric">87%</strong>
              <span className="forecast-quad-card-trend-subtext text-green">
                High Confidence
              </span>
            </div>
          </div>

          <p className="revenue-forecast-footer-explanatory-text">
            AI predicts $1.1M in revenue with 87% confidence based on current
            pipeline health, deal velocity, and engagement signals.
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
            {[
              { title: "AI Score Refresh", state: "Active" },
              { title: "Auto Prioritization", state: "Active" },
              { title: "Follow-Up Tasks", state: "Active" },
              { title: "Pipeline Sync", state: "Active" },
              { title: "Risk Detection", state: "Active" },
            ].map((item, iIdx) => (
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
                <div className="inspector-deal-avatar-circle avatar-purple">
                  M
                </div>
                <div className="inspector-deal-wrap">
                  <h4 className="inspector-deal-client-name">
                    Makoto Kawamoto
                  </h4>
                  <span className="inspector-deal-property-title">
                    Luxury Penthouse
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <strong className="inspector-deal-financial-value">
                      $910,000
                    </strong>
                    <span className="deal-card-temperature-tag tag-hot">
                      Hot
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
                    84%
                  </strong>
                </div>
                <div className="inspector-metric-horizontal-progress-bar-bg">
                  <div
                    className="inspector-metric-horizontal-progress-fill"
                    style={{ width: "84%" }}
                  ></div>
                </div>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">Risk</span>
                <strong className="inspector-metric-card-large-value text-red mt-1 tag-hot">
                  High
                </strong>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">Stage</span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="column-status-dot dot-proposal"></span>
                  <strong className="inspector-metric-card-standard-text tag-purple">
                    Proposal
                  </strong>
                </div>
              </div>

              <div className="ofmobile inspector-metric-box-card">
                <span className="inspector-metric-card-label">Next Action</span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} /> <span>Follow up</span>
                </div>
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} /> 45 min ago
                </span>
              </div>
            </div>
            <div className="mobile inspector-metric-box-card">
              <span className="inspector-metric-card-label">Next Action</span>
              <div className="follow-up-right">
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} /> 45 min ago
                </span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} /> <span>Follow up</span>
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
              <div className="inspector-activity-log-row-item">
                <span className="activity-log-dot-indicator blue-dot"></span>
                <span className="activity-log-description-text">
                  AI score updated to 84%
                </span>
                <span className="activity-log-relative-timestamp">
                  45 min ago
                </span>
              </div>
              <div className="inspector-activity-log-row-item">
                <span className="activity-log-dot-indicator green-dot"></span>
                <span className="activity-log-description-text">
                  Email opened: Property Proposal
                </span>
                <span className="activity-log-relative-timestamp">
                  2 hours ago
                </span>
              </div>
              <div className="inspector-activity-log-row-item">
                <span className="activity-log-dot-indicator purple-dot"></span>
                <span className="activity-log-description-text">
                  Property proposal sent
                </span>
                <span className="activity-log-relative-timestamp">
                  1 day ago
                </span>
              </div>
            </div>
          </div>

          <div className="inspector-ai-next-steps-actions-column">
            <span className="inspector-section-small-overhead-label">
              AI Suggested Next Steps
            </span>
            <div className="inspector-ai-action-steps-rows-stack mt-2">
              <div className="inspector-ai-action-step-row-item">
                <span className="ai-step-title-text">
                  Schedule follow-up call
                </span>
                <span className="ai-step-impact-badge impact-high">
                  High impact
                </span>
              </div>
              <div className="inspector-ai-action-step-row-item">
                <span className="ai-step-title-text">
                  Send budget range analysis
                </span>
                <span className="ai-step-impact-badge impact-medium">
                  Medium impact
                </span>
              </div>
              <div className="inspector-ai-action-step-row-item">
                <span className="ai-step-title-text">
                  Share similar sold comps
                </span>
                <span className="ai-step-impact-badge impact-medium">
                  Medium impact
                </span>
              </div>
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
    </div>
  );
}
