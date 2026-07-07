import React, { useEffect, useMemo, useState } from "react";
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
  SlidersHorizontal,
  Download,
  Phone,
  ShieldCheck,
  ChevronDown,
  Briefcase,
  Layers,
  Activity,
  Award,
  Timer,
  Shuffle,
} from "lucide-react";

import "./dashboard.css";
import {
  getDashboardSummary,
  getDashboardExtended,
  rangeToDates,
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

export default function CortexaDashboard() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );
  const { handleError } = useApiErrorHandler();
  const [summary, setSummary] = useState(null);
  const [ext, setExt] = useState(null);
  const [prevExt, setPrevExt] = useState(null);

  // Filters (date / team / source / agent / stage) — drive every panel below.
  const [range, setRange] = useState("7d");
  const [teamFilter, setTeamFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const [agentFilter, setAgentFilter] = useState(null);
  const [stageFilter, setStageFilter] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { startDate, endDate } = rangeToDates(range);
        const periodMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        const prevStart = new Date(new Date(startDate).getTime() - periodMs).toISOString();
        const filterArgs = {
          teamId: teamFilter,
          source: sourceFilter,
          agentId: agentFilter,
          stage: stageFilter,
        };
        const [s, e, pe] = await Promise.all([
          getDashboardSummary().catch(() => null),
          getDashboardExtended({ startDate, endDate, ...filterArgs }).catch(() => null),
          getDashboardExtended({ startDate: prevStart, endDate: startDate, ...filterArgs }).catch(() => null),
        ]);
        if (!active) return;
        setSummary(s);
        setExt(e);
        setPrevExt(pe);
      } catch (err) {
        if (active) handleError(err, "Failed to load dashboard");
      }
    })();
    return () => {
      active = false;
    };
  }, [range, teamFilter, sourceFilter, agentFilter, stageFilter]);

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
  const [trendMode, setTrendMode] = useState("leads");

  // Live figures from /crm/dashboard/summary + /crm/dashboard/extended.
  const S = summary || {};
  const E = ext || {};
  const sLeads = S.leads || {};
  const sDeals = S.deals || {};
  const sProps = S.properties || {};
  const byStage = (E.dealsByStage && E.dealsByStage.counts) || sDeals.byStage || {};
  const stageValues = (E.dealsByStage && E.dealsByStage.values) || {};
  const K = E.kpis || {};
  const WA = E.whatsapp || {};
  const trendsData = E.trends || {};
  const leadSourcesData = E.leadSources || [];
  const filterOptions = E.filterOptions || {};

  const openDealsCount = ["new", "qualified", "proposal", "negotiation"].reduce(
    (sum, s) => sum + (Number(byStage[s]) || 0),
    0,
  );
  const totalLeadsInPeriod = (trendsData.leadsByDay || []).reduce((s, d) => s + d.count, 0);

  // vs-previous-period comparisons (approved design shows a delta under each KPI)
  const P = prevExt || {};
  const prevByStage = (P.dealsByStage && P.dealsByStage.counts) || {};
  const prevStageValues = (P.dealsByStage && P.dealsByStage.values) || {};
  const prevLeadsInPeriod = ((P.trends || {}).leadsByDay || []).reduce((s, d) => s + d.count, 0);
  const prevWonInPeriod = ((P.trends || {}).revenueByDay || []).reduce((s, d) => s + d.value, 0);
  const prevConvRate =
    prevLeadsInPeriod > 0
      ? Math.round(((Number(prevByStage.won) || 0) / prevLeadsInPeriod) * 100)
      : null;
  const prevK = P.kpis || {};
  const prevWA = P.whatsapp || {};
  // invert=true for metrics where a lower value is better (response time,
  // days-to-close, revenue at risk) so a decrease reads as a positive delta.
  const vsPrev = (cur, prev, invert = false) => {
    if (cur == null) return {};
    // No comparable value in the previous period: still surface a comparison
    // marker per selected range instead of rendering the tile without one.
    if (prev == null || prev === 0) {
      return cur > 0 ? { delta: "new vs prev", positive: !invert } : {};
    }
    const d = Math.round(((cur - prev) / Math.abs(prev)) * 100);
    return { delta: `${Math.abs(d)}% vs prev`, positive: invert ? d <= 0 : d >= 0 };
  };
  const wonInPeriod = (trendsData.revenueByDay || []).reduce((s, d) => s + d.value, 0);
  // Conversion Rate = closed-won deals / total leads. Uses the cumulative total
  // lead count (not the period's new-lead count) as the denominator: won deals
  // are a cumulative figure, so dividing by a short period's new leads can
  // exceed 100% (e.g. 8 won / 2 new-this-week = 400%). Total leads keeps it a
  // real 0-100% lead-to-customer rate that matches the "N closed won" figure.
  const wonCountInPeriod = Number(byStage.won) || 0;
  const totalLeadsAll = Number(sLeads.total) || totalLeadsInPeriod || 0;
  const convRate =
    totalLeadsAll > 0 ? Math.round((wonCountInPeriod / totalLeadsAll) * 100) : null;
  // Single consistent label for every period-based figure, so cards don't mix
  // "current" / "this period" / "last 30 days". Snapshot cards (current pipeline
  // etc.) keep "current" on purpose.
  const periodLabel = (DATE_RANGES.find((r) => r.key === range) || {}).label?.toLowerCase() || "this period";

  const miniKpis = [
    {
      title: "New Leads",
      value: String(totalLeadsInPeriod || sLeads.new || 0),
      subtext: `${sLeads.total ?? 0} total leads`,
      icon: <Users size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: periodLabel,
      ...vsPrev(totalLeadsInPeriod, prevLeadsInPeriod),
    },
    {
      title: "Qualified Leads",
      value: String(sLeads.qualified ?? 0),
      subtext: `${sLeads.contacted ?? 0} contacted`,
      icon: <CheckCircle2 size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: "current",
      ...vsPrev(Number(byStage.qualified) || null, Number(prevByStage.qualified) || null),
    },
    {
      title: "Pipeline Value",
      value: money(sDeals.pipelineValue),
      subtext: `${openDealsCount} active deals`,
      icon: <Briefcase size={16} className="text-purple" />,
      iconBg: "bg-light-purple",
      intime: "open",
      ...vsPrev(
        ["new", "qualified", "proposal", "negotiation"].reduce((s, k) => s + (Number(stageValues[k]) || 0), 0) || null,
        ["new", "qualified", "proposal", "negotiation"].reduce((s, k) => s + (Number(prevStageValues[k]) || 0), 0) || null,
      ),
    },
    {
      title: "Won Revenue",
      value: money(wonInPeriod || sDeals.wonValue),
      subtext: `${byStage.won ?? 0} closed won`,
      icon: <DollarSign size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: wonInPeriod ? periodLabel : "to date",
      ...vsPrev(wonInPeriod || null, prevWonInPeriod || null),
    },
    {
      title: "Conversion Rate",
      value: convRate != null ? `${convRate}%` : "—",
      subtext: `${wonCountInPeriod} won / ${totalLeadsAll} leads`,
      icon: <Percent size={16} className="text-orange" />,
      iconBg: "bg-light-orange",
      intime: "overall",
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

  // Secondary KPI row — approved card set, every figure from the extended endpoint.
  const secondaryKpis = [
    {
      title: "First Response Time",
      value: fmtHours(K.speedToLeadHours),
      intime: K.speedToLeadHours != null ? `avg, ${periodLabel}` : "No data available",
      icon: <Timer size={16} className="text-orange" />,
      ...vsPrev(K.speedToLeadHours, prevK.speedToLeadHours, true),
    },
    {
      title: "Follow-up Completion",
      value: K.followUp && K.followUp.pct != null ? `${K.followUp.pct}%` : "—",
      intime:
        K.followUp && K.followUp.total
          ? `${K.followUp.completed}/${K.followUp.total} tasks`
          : "No data available",
      icon: <CheckCircle2 size={16} className="text-green" />,
      ...vsPrev(K.followUp && K.followUp.pct, prevK.followUp && prevK.followUp.pct),
    },
    {
      title: "Lead Quality Score",
      value: K.avgLeadScore != null ? String(K.avgLeadScore) : "—",
      intime: K.avgLeadScore != null ? "avg AI score / 100" : "No data available",
      icon: <Award size={16} className="text-royal-blue" />,
      ...vsPrev(K.avgLeadScore, prevK.avgLeadScore),
    },
    {
      title: "Pipeline Velocity",
      value: K.avgTimeToCloseDays != null ? `${Math.round(K.avgTimeToCloseDays)}d` : "—",
      intime: K.avgTimeToCloseDays != null ? "avg open → won" : "No data available",
      icon: <Activity size={16} className="text-purple" />,
      ...vsPrev(K.avgTimeToCloseDays, prevK.avgTimeToCloseDays, true),
    },
    {
      title: "Revenue at Risk",
      value: money(K.revenueAtRisk),
      intime: "deals stalled 14d+",
      icon: <AlertTriangle size={16} className="text-red" />,
      ...vsPrev(K.revenueAtRisk, prevK.revenueAtRisk, true),
    },
    {
      title: "WhatsApp Response",
      value: String(WA.repliesPeriod ?? 0),
      intime: `replies, ${periodLabel}`,
      icon: <MessageCircle size={16} className="text-green" />,
      ...vsPrev(WA.repliesPeriod, prevWA.repliesPeriod),
    },
  ];

  const leadSources = leadSourcesData.map((s, i) => ({
    source: s.source,
    leads: s.leads,
    conversion: s.conversionRate,
    revenue: s.revenue,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));

  // Trend chart: all three modes backed by /crm/dashboard/extended.
  const revenueTrendData = useMemo(() => {
    if (trendMode === "leads")
      return (trendsData.leadsByDay || []).map((d) => ({ day: d.date, trend: d.count }));
    if (trendMode === "appointments")
      return (trendsData.appointmentsByDay || []).map((d) => ({ day: d.date, trend: d.count }));
    return (trendsData.revenueByDay || []).map((d) => ({ day: d.date, trend: d.value }));
  }, [trendMode, trendsData]);

  // CSV export of every live figure, honoring the active filters.
  const exportDashboardCsv = () => {
    const rows = [["metric", "value"]];
    rows.push(["Period", (DATE_RANGES.find((r) => r.key === range) || {}).label || range]);
    if (sourceFilter) rows.push(["Source filter", sourceFilter]);
    if (agentFilter) rows.push(["Agent filter", agentFilter]);
    if (stageFilter) rows.push(["Stage filter", stageFilter]);
    miniKpis.forEach((k) => rows.push([k.title, k.value]));
    secondaryKpis.forEach((k) => rows.push([k.title, k.value]));
    Object.entries(byStage).forEach(([k, v]) => rows.push([`Deals: ${k}`, v]));
    rows.push([]);
    rows.push(["Lead source", "leads", "conversion %", "revenue"]);
    leadSources.forEach((s) => rows.push([s.source, s.leads, s.conversion, s.revenue]));
    rows.push([]);
    rows.push(["Trend day", trendMode]);
    revenueTrendData.forEach((d) => rows.push([d.day, d.trend]));
    downloadCsv("dashboard-summary.csv", rows);
  };

  const stageOrder = ["new", "qualified", "proposal", "negotiation", "won"];
  const dealsByStageArr = stageOrder.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    count: String(byStage[s] ?? 0),
    value: stageValues[s] ? money(stageValues[s]) : "",
  }));
  const stageTotal = stageOrder.reduce((sum, s) => sum + (Number(byStage[s]) || 0), 0);
  const stageWidth = (s) =>
    stageTotal > 0 ? `${Math.max(2, Math.round(((Number(byStage[s]) || 0) / stageTotal) * 100))}%` : "20%";

  const _funnelTotal = Number(sLeads.total ?? 0) || 0;
  // A deal in a later stage has passed through every earlier one, so each funnel
  // row counts deals at that stage or beyond — percentages only narrow downward.
  const _reachedFrom = (stage) => {
    const idx = stageOrder.indexOf(stage);
    return stageOrder.slice(idx).reduce((sum, s) => sum + (Number(byStage[s]) || 0), 0);
  };
  const _pct = (n) =>
    _funnelTotal > 0 ? Math.round(((Number(n) || 0) / _funnelTotal) * 100) : 0;
  const pipelineFunnelArr = [
    { stage: "Leads", count: String(sLeads.total ?? 0), percent: "100%", width: "100%" },
    ...["qualified", "proposal", "negotiation", "won"].map((s) => {
      const reached = _reachedFrom(s);
      return {
        stage: s.charAt(0).toUpperCase() + s.slice(1),
        count: String(reached),
        percent: `${_pct(reached)}%`,
        width: `${Math.max(2, _pct(reached))}%`,
      };
    }),
  ];

  const aiPriorityQueue = E.priorityQueue || [];
  const _queueScores = aiPriorityQueue.map((l) => Number(l.score)).filter((n) => !Number.isNaN(n) && n > 0);
  const aiConfidence = _queueScores.length
    ? Math.round(_queueScores.reduce((s, n) => s + n, 0) / _queueScores.length)
    : null;
  const nextBestLead = aiPriorityQueue.find((l) => l.phone) || aiPriorityQueue[0] || null;
  const riskAlertsData = E.riskAlerts || {};
  const riskAlerts = [
    { icon: <Clock3 size={14} className="text-orange" />, title: "Overdue follow-up tasks", count: riskAlertsData.overdueTasks ?? 0 },
    { icon: <Users size={14} className="text-blue-strong" />, title: "New leads uncontacted 48h+", count: riskAlertsData.uncontacted48h ?? 0 },
    { icon: <Briefcase size={14} className="text-cyan-strong" />, title: "Deals stalled 14 days+", count: riskAlertsData.stalledDeals14d ?? 0 },
  ];
  const liveTracking = (E.liveTracking || []).map((a) => ({
    text: a.label || a.title || a.type || "Activity",
    time: a.timestamp
      ? new Date(a.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      : "",
  }));
  const automationHealth = (E.automationHealth || []).map((h) => ({
    icon: h.status === "Active" || h.status === "Connected" ? "🟢" : "⚪",
    label: h.label,
    status: h.status,
    color: h.status === "Active" || h.status === "Connected" ? "green" : "gray",
  }));
  const upcomingClosings = (E.upcomingClosings || []).map((d) => ({
    icon: <Briefcase size={13} />,
    label: `${d.name} — ${money(d.value)}`,
    time: d.expectedCloseDate,
  }));
  const nextTasks = E.nextTasks || [];

  const recommendedActions = aiPriorityQueue.filter((l) => l.nextAction).length;

  const filterControls = (
    <>
      <FilterDropdown
        icon={<Calendar size={15} />}
        label="Date"
        value={range}
        options={DATE_RANGES.map((r) => ({ value: r.key, label: r.label }))}
        onChange={(v) => setRange(v || "7d")}
      />
      <FilterDropdown
        icon={<Users size={15} />}
        label="Teams"
        allLabel="All Teams"
        value={teamFilter}
        options={(filterOptions.teams || []).map((t) => ({ value: t.id, label: t.name }))}
        onChange={setTeamFilter}
      />
      <FilterDropdown
        icon={<Layers size={15} />}
        label="Sources"
        allLabel="All Sources"
        value={sourceFilter}
        options={(filterOptions.sources || []).map((s) => ({ value: s, label: s }))}
        onChange={setSourceFilter}
      />
      <FilterDropdown
        icon={<Users size={15} />}
        label="Agents"
        allLabel="All Agents"
        value={agentFilter}
        options={(filterOptions.agents || []).map((a) => ({ value: a.id, label: a.name }))}
        onChange={setAgentFilter}
      />
      <FilterDropdown
        icon={<Layers size={15} />}
        label="Stages"
        allLabel="All Stages"
        value={stageFilter}
        options={(filterOptions.stages || []).map((s) => ({ value: s, label: s }))}
        onChange={setStageFilter}
      />
    </>
  );

  const CustomXAxisTick = ({ x, y, payload }) => (
    <g transform={`translate(${x},${y + 10})`}>
      <text textAnchor="middle" fill="#94a3b8" fontSize={9}>
        {String(payload.value).slice(0, 8)}
      </text>
    </g>
  );

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
              <FilterDropdown
                icon={<Calendar size={15} />}
                label="Date"
                value={range}
                options={DATE_RANGES.map((r) => ({ value: r.key, label: r.label }))}
                onChange={(v) => setRange(v || "7d")}
              />
              <FilterDropdown
                icon={<Users size={15} />}
                label="Teams"
                allLabel="All Teams"
                value={teamFilter}
                options={(filterOptions.teams || []).map((t) => ({ value: t.id, label: t.name }))}
                onChange={setTeamFilter}
              />
              <div className="control-btn" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={15} />
                <span></span>
              </div>
            </>
          ) : (
            <>
              {filterControls}
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
              {filterControls}
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
              <div className="card-lbl">AI Confidence</div>
              <div className="card-val-group">
                <h3 className="text-green">{aiConfidence != null ? `${aiConfidence}%` : "—"}</h3>
                <div className="mini-sparkline-container">
                  <ResponsiveContainer width="100%" height={25}>
                    <AreaChart
                      data={(trendsData.leadsByDay || []).map((d) => ({ v: d.count }))}
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
                <h3 className="text-orange">{money(K.revenueAtRisk ?? 0)}</h3>
                <div className="mini-sparkline-container">
                  <ResponsiveContainer width="100%" height={25}>
                    <AreaChart
                      data={(trendsData.revenueByDay || []).map((d) => ({ v: d.value }))}
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
                <h4>{nextBestLead ? `Call ${nextBestLead.name}` : "—"}</h4>
              </div>
            </div>
          </div>
          <div className="banner-action-row">
            <button
              className="banner-btn text-dark"
              title={aiPriorityQueue.find((l) => l.phone) ? `Call ${aiPriorityQueue.find((l) => l.phone).name}` : undefined}
              onClick={() => {
                const target = aiPriorityQueue.find((l) => l.phone);
                if (target) {
                  window.location.href = `tel:${target.phone}`;
                } else {
                  notAvailable("Call");
                }
              }}
            >
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
                <div>
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
              <button className={trendMode === "appointments" ? "active" : ""} onClick={() => setTrendMode("appointments")}>Appointments</button>
              <button className={trendMode === "revenue" ? "active" : ""} onClick={() => setTrendMode("revenue")}>Revenue</button>
            </div>
          </div>
          <div className="chart-viewbox">
            {revenueTrendData.length === 0 ? (
              <EmptyState label={`No ${trendMode} data in this period`} />
            ) : null}
            <ResponsiveContainer width="100%" height={revenueTrendData.length === 0 ? 120 : 180}>
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
            <a
              href="/dashboard/analytics"
              className="card-text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/analytics");
              }}
            >
              View All Sources →
            </a>
          </div>
          <div className="split-layout-grid">
            <div className="chart-half">
              {leadSources.length === 0 ? (
                <EmptyState />
              ) : (
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
                    <Tooltip />
                    <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                      {leadSources.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="table-list-half">
              <div className="list-tbl-header">
                <span>Source</span>
                <span className="text-right">Conv.</span>
                <span className="text-right">Revenue</span>
              </div>
              {leadSources.length === 0 ? <EmptyState /> : null}
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
                    {money(item.revenue)}
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
            <a
              href="/dashboard/leads"
              className="card-text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/leads");
              }}
            >
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
            {aiPriorityQueue.length === 0 ? <EmptyState /> : null}
            {aiPriorityQueue.map((lead, idx) => (
              <div key={idx} className="queue-item-row">
                <div className="lead-meta-profile">
                  <InitialsAvatar name={lead.name} />
                  <div className="meta-name">
                    <h4>{lead.name}</h4>
                  </div>
                </div>
                <span className="meta-intent">
                  {lead.intent ? lead.intent.replace(/_/g, " ") : "—"}
                </span>
                <span className="prob-badge">
                  {lead.score != null ? `${lead.score}%` : "—"}
                </span>
                <div className="action-icon-shortcuts">
                  <span className="timeline-log-txt" style={{ fontSize: 11 }}>
                    {lead.nextAction || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Revenue Risk */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <AlertTriangle size={16} className="text-red" />
              <h3>Today's Revenue Risk</h3>
            </div>
            <a
              href="/dashboard/leads"
              className="card-text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/leads");
              }}
            >
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
            <a
              href="/dashboard/ai-logs"
              className="card-text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/ai-logs");
              }}
            >
              View All →
            </a>
          </div>
          <div className="tracking-timeline-list">
            {liveTracking.length === 0 ? <EmptyState /> : null}
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
            <a
              href="/dashboard/pipeline"
              className="card-text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/pipeline");
              }}
            >
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
              <div className="bar-chunk chunk-new" style={{ width: stageWidth("new") }}></div>
              <div className="bar-chunk chunk-qualified" style={{ width: stageWidth("qualified") }}></div>
              <div className="bar-chunk chunk-showing" style={{ width: stageWidth("proposal") }}></div>
              <div className="bar-chunk chunk-offer" style={{ width: stageWidth("negotiation") }}></div>
              <div className="bar-chunk chunk-closed" style={{ width: stageWidth("won") }}></div>
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
            {automationHealth.length === 0 ? <EmptyState /> : null}
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
          <div className="action-todo-list">
            {nextTasks.length === 0 ? <EmptyState label="No open tasks" /> : null}
            {nextTasks.map((t, idx) => (
              <div key={idx} className="health-row-item">
                <span className="health-lbl" style={{ fontSize: 12 }}>
                  {t.title} {t.leadName ? `· ${t.leadName}` : ""}
                </span>
                <span className="timeline-time-stamp">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Closings */}
        <div className="content-card">
          <div className="card-top-header ">
            <Calendar size={12} />
            <h5>Upcoming Closings</h5>
          </div>
          <div className="closing-list-wrapper">
            {upcomingClosings.length === 0 ? (
              <EmptyState label="No close dates set" />
            ) : null}
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
                <h3>{recommendedActions || "—"}</h3>
              </div>
              <div className="counter-box urgent-border">
                <span className="text-red">Urgent Tasks</span>
                <h3 className="text-red">{riskAlertsData.overdueTasks ?? "—"}</h3>
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
