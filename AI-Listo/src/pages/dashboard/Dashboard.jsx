import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AiUsageMeter from "../../components/AiUsageMeter";
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
  RefreshCw,
} from "lucide-react";

import {
  getAnalyticsDashboard,
  getDashboardSummary,
  getActivityMetrics,
  getOwnerLeads,
  getCalendarStats,
  getUpcomingAppointments,
} from "../../api/analyticsApi";
import { fetchTeams, fetchTeamDashboard } from "../team/services/team.service";
import { downloadCsv } from "../../utils/helpers";
import LockedAi from "../../components/LockedAi";

import "./dashboard.css";

/** Placeholder shown for any widget that has no honest backend source. */
const NO_DATA = "—";

/** Format a numeric amount as a plain currency string. */
function money(v) {
  return `$${Number(v || 0).toLocaleString()}`;
}

/** Palette reused for lead-source bars/dots. */
const SOURCE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#16a34a",
  "#eab308",
  "#3b82f6",
];

/** Deterministic accent color for a self-contained initials avatar (no external images). */
function avatarColor(seed) {
  const s = String(seed || "");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return SOURCE_COLORS[hash % SOURCE_COLORS.length];
}

function periodLabel(range, t) {
  if (range === "today") return t("dashboard.periodToday");
  if (range === "7d") return t("dashboard.periodLast7Days");
  return t("dashboard.periodLast30Days");
}

function shortDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function relativeTime(value, t) {
  const then = new Date(value).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("dashboard.justNow");
  if (mins < 60) return t("dashboard.minutesAgo", { mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("dashboard.hoursAgo", { hrs });
  const days = Math.floor(hrs / 24);
  return t("dashboard.daysAgo", { days });
}

export default function CortexaDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // ---- Data fetching (real backend) --------------------------------------
  // `range` is driven by the period selector in the header; changing it
  // refetches. `refreshTick` lets action buttons (Run AI Review / Export
  // drawer refresh) re-run the same load without changing the range.
  const [range, setRange] = useState("30d");
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick((t) => t + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dash, setDash] = useState(null); // getAnalyticsDashboard(range)
  const [summary, setSummary] = useState(null); // getDashboardSummary()
  const [activity, setActivity] = useState(null); // getActivityMetrics(range)
  const [leadsList, setLeadsList] = useState([]); // getOwnerLeads() – CRM access only
  const [teamStats, setTeamStats] = useState(null); // team dashboard stats – real revenue/pipeline
  const [calStats, setCalStats] = useState(null); // getCalendarStats() – Appointments KPI
  const [upcoming, setUpcoming] = useState([]); // getUpcomingAppointments() – Upcoming Closings

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

        // Owner leads require CRM access (PRO PLUS+) and may 403 – never let
        // it break the page.
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

        // Calendar stats/appointments are team-scoped and 403 for users with no
        // team – degrade the Appointments KPI and Upcoming Closings to empty,
        // never break the page.
        try {
          const stats = await getCalendarStats();
          if (!cancelled) setCalStats(stats || null);
        } catch (_e) {
          if (!cancelled) setCalStats(null);
        }
        try {
          const appts = await getUpcomingAppointments(30);
          if (!cancelled) setUpcoming(Array.isArray(appts) ? appts : []);
        } catch (_e) {
          if (!cancelled) setUpcoming([]);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || t("dashboard.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [range, refreshTick]);

  // ---- Derived data (real fields, honest fallbacks) ----------------------
  const leads = dash?.leads || null;
  const byStatus = leads?.byStatus || null;
  const metrics = summary?.data?.metrics || null;
  const recentActivity = summary?.data?.recent_activity || [];
  const totalLeads = leads?.total ?? 0;
  const period = periodLabel(range, t);
  const hasLeads = (leadsList || []).length > 0;

  const followUpPct =
    leads && totalLeads > 0
      ? `${Math.round(((byStatus?.contacted || 0) / totalLeads) * 100)}%`
      : leads
        ? "0%"
        : NO_DATA;

  // Activity trend feeds the Lead Activity Trend chart and the CSV export.
  const eventsByDay = activity?.eventsByDay || dash?.activity?.eventsByDay || [];

  // PRIMARY KPI CARDS – New Leads / Conversion Rate / AI Conversations are
  // real; Active Deals value, Revenue and Appointments have no backend source.
  const miniKpis = [
    {
      title: t("dashboard.newLeads"),
      value: leads ? String(leads.created ?? 0) : NO_DATA, // leads.created (in period)
      subtext: t("dashboard.leadsCreatedInPeriod"),
      icon: <Users size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: period,
    },
    {
      title: t("dashboard.activeDeals"),
      value: teamStats ? money(teamStats.totalPipeline) : NO_DATA, // teamStats.totalPipeline (real pipeline value)
      subtext: teamStats ? t("dashboard.activePipelineValue") : t("dashboard.noDealValueData"),
      icon: <Briefcase size={16} className="text-purple" />,
      iconBg: "bg-light-purple",
      intime: period,
    },
    {
      title: t("dashboard.revenue"),
      value: teamStats ? money(teamStats.revenue) : NO_DATA, // teamStats.revenue (real won-deal value)
      subtext: teamStats ? t("dashboard.revenueFromWonDeals") : t("dashboard.noRevenueData"),
      icon: <DollarSign size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: period,
    },
    {
      title: t("dashboard.conversionRate"),
      value: leads ? `${Number(leads.conversionRate || 0).toFixed(1)}%` : NO_DATA, // leads.conversionRate
      subtext: t("dashboard.convertedVsTotalLeads"),
      icon: <Percent size={16} className="text-orange" />,
      iconBg: "bg-light-orange",
      intime: period,
    },
    {
      title: t("dashboard.aiConversations"),
      value: metrics ? String(metrics.conversations_total ?? 0) : NO_DATA, // metrics.conversations_total
      subtext: t("dashboard.totalConversations"),
      icon: <MessageCircle size={16} className="text-royal-blue" />,
      iconBg: "bg-light-blue",
      intime: t("dashboard.allTime"),
    },
    {
      title: t("dashboard.appointments"),
      value: calStats ? String(calStats.total ?? 0) : NO_DATA, // calStats.total (team calendar)
      subtext: calStats
        ? t("dashboard.confirmedPending", { confirmed: calStats.confirmed ?? 0, pending: calStats.pending ?? 0 })
        : t("dashboard.noAppointmentData"),
      icon: <Calendar size={16} className="text-green" />,
      iconBg: "bg-light-green",
      intime: t("dashboard.allTime"),
    },
  ];

  // SECONDARY KPI CARDS – only Follow-up Completion has an honest derivation.
  const secondaryKpis = [
    {
      title: t("dashboard.firstResponseTime"),
      value: NO_DATA, // no source
      icon: <Clock3 size={16} className="text-royal-blue" />,
      intime: period,
    },
    {
      title: t("dashboard.followUpCompletion"),
      value: followUpPct, // derived: contacted / total leads
      icon: <CheckCircle2 size={16} className="text-green" />,
      intime: period,
    },
    {
      title: t("dashboard.leadQualityScore"),
      value: NO_DATA, // no source
      icon: <Award size={16} className="text-purple" />,
      intime: period,
    },
    {
      title: t("dashboard.pipelineVelocity"),
      value: NO_DATA, // no source
      icon: <Activity size={16} className="text-royal-blue" />,
      intime: period,
    },
    {
      title: t("dashboard.revenueAtRisk"),
      value: NO_DATA, // no money source
      icon: <AlertTriangle size={16} className="text-orange" />,
      intime: period,
    },
    {
      title: t("dashboard.whatsappResponse"),
      value: NO_DATA, // no source
      icon: <MessageCircle size={16} className="text-green" />,
      intime: period,
    },
  ];

  // Revenue & Lead Trend chart => real daily activity counts (labelled Leads,
  // NOT Revenue — there is no revenue source).
  const revenueTrendData = eventsByDay.map((d) => ({
    day: shortDate(d.date),
    trend: d.count,
  }));

  // Lead Source Performance => aggregate real owner leads by source.
  const sourceAgg = {};
  (leadsList || []).forEach((l) => {
    const src = (l?.source && String(l.source).trim()) || "Unknown";
    sourceAgg[src] = (sourceAgg[src] || 0) + 1;
  });
  const leadSources = Object.entries(sourceAgg)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count], i) => {
      const color = SOURCE_COLORS[i % SOURCE_COLORS.length];
      return {
        source,
        leads: count,
        color,
        icon: <Globe size={12} style={{ color }} />,
      };
    });

  // AI Priority Queue => real owner leads (already sorted HOT-first by the API),
  // with their real AI score, label and name.
  const priorityQueue = (leadsList || []).slice(0, 5).map((l) => {
    const name = l?.name || t("dashboard.unnamedLead");
    return {
      name,
      intent: l?.aiScoreLabel || l?.aiTier || l?.status || NO_DATA,
      prob: l?.aiScore != null ? `${Math.round(Number(l.aiScore))}%` : NO_DATA,
      initial: name.trim().charAt(0).toUpperCase() || "?",
      color: avatarColor(name),
    };
  });

  // Today's Revenue Risk => honest lead-based risk signals from real counts.
  const riskRows = [
    {
      title: t("dashboard.unansweredConversations"),
      count:
        metrics?.conversations_unread != null
          ? metrics.conversations_unread
          : NO_DATA,
      icon: <MessageCircle size={12} className="text-green" />,
    },
    {
      title: t("dashboard.newLeadsAwaitingContact"),
      count: byStatus?.new != null ? byStatus.new : NO_DATA,
      icon: <Clock3 size={12} className="text-muted" />,
    },
    {
      title: t("dashboard.leadsNotYetQualified"),
      count: byStatus
        ? (byStatus.new || 0) + (byStatus.contacted || 0)
        : NO_DATA,
      icon: <Layers size={12} className="text-muted" />,
    },
    {
      title: t("dashboard.leadsMarkedLost"),
      count: byStatus?.lost != null ? byStatus.lost : NO_DATA,
      icon: <AlertTriangle size={12} className="text-orange" />,
    },
  ];

  // Live AI Tracking => real recent activity feed.
  const trackingLogs = (recentActivity || []).slice(0, 6).map((a) => ({
    text: a?.label || a?.type || t("dashboard.activityDefault"),
    time: relativeTime(a?.timestamp, t),
  }));

  // Upcoming Closings => real future appointments (next 30 days), team-scoped.
  const upcomingList = (upcoming || []).slice(0, 5).map((a) => ({
    title: a?.title || a?.attendeeName || t("dashboard.appointmentDefault"),
    when: shortDate(a?.startAt),
    status: a?.status || NO_DATA,
  }));

  // Pipeline Funnel => real lead funnel from leads.byStatus.
  const funnelStages = leads
    ? [
        { stage: t("dashboard.funnelLeads"), count: totalLeads },
        { stage: t("dashboard.contactedLabel"), count: byStatus?.contacted || 0 },
        { stage: t("dashboard.statusQualified"), count: byStatus?.qualified || 0 },
        { stage: t("dashboard.statusConverted"), count: byStatus?.converted || 0 },
        { stage: t("dashboard.statusLost"), count: byStatus?.lost || 0 },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelStages.map((s) => s.count));

  // Automation Health => real metric counts (honest labels).
  const automationHealth = [
    {
      label: t("dashboard.aiActionsToday"),
      status:
        metrics?.ai_actions_today != null
          ? String(metrics.ai_actions_today)
          : NO_DATA,
      color: "gray",
      icon: <Zap size={12} className="text-royal-blue" />,
    },
    {
      label: t("dashboard.followUpsCompleted"),
      status: followUpPct,
      color: "green",
      icon: <Activity size={12} className="text-royal-blue" />,
    },
    {
      label: t("dashboard.unreadConversations"),
      status:
        metrics?.conversations_unread != null
          ? String(metrics.conversations_unread)
          : NO_DATA,
      color: "orange",
      icon: <MessageCircle size={12} className="text-orange" />,
    },
    {
      label: t("dashboard.totalActivitiesPeriod"),
      status:
        activity?.totalEvents != null ? String(activity.totalEvents) : NO_DATA,
      color: "gray",
      icon: <FileText size={12} className="text-muted" />,
    },
    {
      label: t("dashboard.activeLeads"),
      status:
        metrics?.leads_active != null ? String(metrics.leads_active) : NO_DATA,
      color: "green",
      icon: <CheckCircle2 size={12} className="text-green" />,
    },
  ];

  // Next Actions => real per-lead recommended actions from the AI.
  const nextActions = (leadsList || [])
    .filter((l) => l?.recommendedAction)
    .slice(0, 4)
    .map((l) => ({
      text: `${l.recommendedAction} — ${l.name || t("dashboard.unnamedLead")}`,
      urgent: l?.aiTier === "HOT",
      time: l?.followUpRecommended ? t("dashboard.followUpDue") : period,
    }));

  // AI Action Center counters (real, only when lead data is available).
  const recommendedCount = (leadsList || []).filter(
    (l) => l?.recommendedAction,
  ).length;
  const urgentCount = (leadsList || []).filter((l) => l?.aiTier === "HOT").length;

  // Banner narrative values (real counts, no fabricated names).
  const bannerNewLeads =
    metrics?.leads_new ?? byStatus?.new ?? leads?.created ?? null;

  // Export the real, loaded dashboard data to CSV (KPIs, lead-status
  // breakdown, lead sources, activity-by-day). No fabricated values.
  const exportData = () => {
    const rows = [];
    rows.push([t("dashboard.csvExportTitle")]);
    rows.push([t("dashboard.csvPeriod"), period]);
    rows.push([t("dashboard.csvGenerated"), new Date().toISOString()]);
    rows.push([]);

    rows.push([t("dashboard.csvKpi"), t("dashboard.csvValue"), t("dashboard.csvWindow")]);
    [...miniKpis, ...secondaryKpis].forEach((k) =>
      rows.push([k.title, k.value, k.intime || ""]),
    );
    rows.push([]);

    rows.push([t("dashboard.csvLeadStatus"), t("dashboard.csvCount")]);
    if (byStatus) {
      rows.push([t("dashboard.csvTotal"), totalLeads]);
      rows.push([t("dashboard.statusNew"), byStatus.new || 0]);
      rows.push([t("dashboard.contactedLabel"), byStatus.contacted || 0]);
      rows.push([t("dashboard.statusQualified"), byStatus.qualified || 0]);
      rows.push([t("dashboard.statusConverted"), byStatus.converted || 0]);
      rows.push([t("dashboard.statusLost"), byStatus.lost || 0]);
    } else {
      rows.push([t("dashboard.csvNoLeadStatusData"), ""]);
    }
    rows.push([]);

    rows.push([t("dashboard.csvLeadSource"), t("dashboard.funnelLeads")]);
    if (leadSources.length === 0) rows.push([t("dashboard.noLeadSourceData"), ""]);
    leadSources.forEach((s) => rows.push([s.source, s.leads]));
    rows.push([]);

    rows.push([t("dashboard.csvDate"), t("dashboard.csvActivityEvents")]);
    if (eventsByDay.length === 0) rows.push([t("dashboard.csvNoActivityInPeriod"), ""]);
    eventsByDay.forEach((d) => rows.push([d.date, d.count]));

    downloadCsv(`cortexa-dashboard-${range}.csv`, rows);
  };

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
    <div className="dashboard-container dashboard-page">
      <div className="heading_page">
        <Layers className="header-icon" size={20} />
        <h1>{t("dashboard.dashboardOverview")}</h1>
      </div>
      <p className="sub_head">
        {t("dashboard.subheading")}
      </p>
      <AiUsageMeter />
      <header className="dashboard-header">
        <div className="header-actions">
          {isMobile ? (
            <>
              <div className="control-btn">
                <Calendar size={15} />
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  <option value="today">{t("dashboard.periodToday")}</option>
                  <option value="7d">{t("dashboard.periodLast7Days")}</option>
                  <option value="30d">{t("dashboard.periodLast30Days")}</option>
                </select>
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
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  <option value="today">{t("dashboard.periodToday")}</option>
                  <option value="7d">{t("dashboard.periodLast7Days")}</option>
                  <option value="30d">{t("dashboard.periodLast30Days")}</option>
                </select>
              </div>

              <div
                className="control-btn"
                onClick={() => setShowFilters(true)}
                style={{ cursor: "pointer" }}
              >
                <SlidersHorizontal size={15} />
                <span>{t("dashboard.filters")}</span>
              </div>

              {/*<div className="notification-icon">
                <Bell size={18} />
                <span className="notif-badge">8</span>
              </div>*/}

              <button className="btn-export" onClick={exportData}>
                <Download size={15} />
                {t("dashboard.export")}
                <ChevronDown size={14} />
              </button>
            </>
          )}
        </div>
      </header>
      {showFilters && (
        <>
          <div
            className="filter-overlay"
            onClick={() => setShowFilters(false)}
          />

          <div className="mobile-filter-drawer">
            <div className="drawer-header">
              <h3>{t("dashboard.filters")}</h3>

              <button
                className="drawer-close"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <button
                className="btn-export"
                onClick={() => {
                  exportData();
                  setShowFilters(false);
                }}
              >
                <Download size={15} />
                {t("dashboard.export")}
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div style={infoStyle}>
          <RefreshCw size={14} /> {t("dashboard.loadingDashboard")}
        </div>
      )}
      {error && (
        <div style={errorStyle}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* AI COMMAND CENTER */}
      <section className="ai-command-banner">
        <div className="banner-left">
          <div className="ai-avatar-glow">
            <div className="ai-bot-icon">🤖</div>
          </div>
          <div className="ai-message-ctx">
            <span>{t("dashboard.aiCommandCenter")}</span>
            <h2>
              {t("dashboard.bannerYouHave")}{" "}
              <span className="highlight-blue">
                {bannerNewLeads != null ? bannerNewLeads : NO_DATA}
              </span>{" "}
              {t("dashboard.bannerNewLeadsToReview")}
            </h2>
            <p>
              {t("dashboard.nextBestActionLabel")}{" "}
              <span
                className="clickable-link"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/dashboard/leads")}
              >
                {t("dashboard.followUpNewestLeads")}
              </span>
            </p>
            <div className="banner-alert-tag">
              {!metrics
                ? t("dashboard.livePipelineOverview")
                : metrics.conversations_unread > 0
                  ? t("dashboard.unreadConversationsNeedReply", { unread: metrics.conversations_unread })
                  : t("dashboard.allCaughtUp")}
            </div>
          </div>
        </div>

        <div className="banner-right">
          <LockedAi feature="aiActionCenter">
          <div className="banner-right-top">
            <div className="mini-insight-card">
              <div className="card-lbl">{t("dashboard.aiConfidence")}</div>
              <div className="card-val-group">
                <h3 className="text-green">{NO_DATA}</h3>
              </div>
            </div>
            <div className="mini-insight-card">
              <div className="card-lbl">{t("dashboard.revenueAtRisk")}</div>
              <div className="card-val-group">
                <h3 className="text-orange">{NO_DATA}</h3>
              </div>
            </div>
            <div className="mini-insight-card next-action-card">
              <Phone size={16} />
              <div>
                <div className="card-lbl">{t("dashboard.nextBestAction")}</div>
                <h4>{t("dashboard.followUpWithNewLeads")}</h4>
              </div>
            </div>
          </div>
          </LockedAi>
          <div className="banner-action-row">
            <button
              className="banner-btn text-dark"
              onClick={() => navigate("/dashboard/leads")}
            >
              <Phone size={16} /> {t("dashboard.call")}
            </button>
            <button
              className="banner-btn btn-whatsapp-color"
              onClick={() => navigate("/dashboard/whatsapp")}
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button
              className="banner-btn btn-assign-color"
              onClick={() => navigate("/dashboard/team")}
            >
              <Users size={16} /> {t("dashboard.assign")}
            </button>
            <button
              className="banner-btn btn-followup-color"
              onClick={() => navigate("/dashboard/leads")}
            >
              <Calendar size={16} /> {t("dashboard.followUp")}
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
                {kpi.delta != null && (
                  <>
                    <span
                      className={`kpi-indicator-badge ${kpi.positive ? "pos" : "neg"}`}
                    >
                      {kpi.positive ? "↑" : "↓"} {kpi.delta}
                    </span>{" "}
                  </>
                )}
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
                  {kpi.delta != null && (
                    <>
                      <span className="kpi-indicator-badge pos">
                        ↑ {kpi.delta}{" "}
                      </span>{" "}
                    </>
                  )}
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
              <h3>{t("dashboard.leadActivityTrend")}</h3>
            </div>
          </div>
          <div className="chart-viewbox">
            {revenueTrendData.length === 0 ? (
              <div
                style={{
                  ...emptyStyle,
                  height: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t("dashboard.noActivityInThisPeriod")}
              </div>
            ) : (
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
                    allowDecimals={false}
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
            )}
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Target size={16} className="text-royal-blue" />
              <h3>{t("dashboard.leadSourcePerformance")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/leads")}
            >
              {t("dashboard.viewAllSources")} →
            </a>
          </div>
          <div className="split-layout-grid">
            <div className="chart-half">
              {leadSources.length === 0 ? (
                <div
                  style={{
                    ...emptyStyle,
                    height: 195,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t("dashboard.noLeadSourceData")}
                </div>
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
                      allowDecimals={false}
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
              )}
            </div>
            <div className="table-list-half">
              <div className="list-tbl-header">
                <span>{t("dashboard.sourceHeader")}</span>
                <span className="text-right">{t("dashboard.convHeader")}</span>
                <span className="text-right">{t("dashboard.revenue")}</span>
              </div>
              {leadSources.length === 0 ? (
                <span style={emptyStyle}>{t("dashboard.noLeadSourceData")}</span>
              ) : (
                leadSources.map((item, idx) => (
                  <div key={idx} className="list-tbl-row">
                    <span className="src-label-dot">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      {item.source}
                    </span>
                    <span className="text-right text-gray">{NO_DATA}</span>
                    <span className="text-right font-bold">{NO_DATA}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Priority Queue */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Zap size={16} className="text-orange" />
              <h3>{t("dashboard.aiPriorityQueue")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/leads")}
            >
              {t("dashboard.viewAll")} →
            </a>
          </div>
          <LockedAi feature="aiActionCenter">
          <div className="queue-list-wrapper">
            <div className="list-tbl-header">
              <span>{t("dashboard.leadHeader")}</span>
              <span className="text-left">{t("dashboard.intentHeader")}</span>
              <span className="text-left">{t("dashboard.probabilityHeader")}</span>
              <span>{t("dashboard.nextActionHeader")}</span>
            </div>
            {priorityQueue.length === 0 ? (
              <span style={emptyStyle}>{t("dashboard.noLeadsAvailable")}</span>
            ) : (
              priorityQueue.map((lead, idx) => (
                <div key={idx} className="queue-item-row">
                  <div className="lead-meta-profile">
                    <span
                      className="mini-avatar"
                      aria-label={lead.name}
                      style={{
                        backgroundColor: lead.color,
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {lead.initial}
                    </span>
                    <div className="meta-name">
                      <h4>{lead.name}</h4>
                    </div>
                  </div>
                  <span className="meta-intent">{lead.intent}</span>
                  <span className="prob-badge">{lead.prob}</span>
                  <div className="action-icon-shortcuts">
                    <button
                      className="shortcut-btn black-btn"
                      onClick={() => navigate("/dashboard/leads")}
                    >
                      <Phone size={12} />
                    </button>
                    <button
                      className="shortcut-btn green-btn"
                      onClick={() => navigate("/dashboard/whatsapp")}
                    >
                      <MessageCircle size={12} />
                    </button>
                    <button
                      className="shortcut-btn white-btn"
                      onClick={() => navigate("/dashboard/team")}
                    >
                      <Users size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </LockedAi>
        </div>
      {/*</section>

      <section className="dashboard-logs-row grid-3-col">*/}
        {/* Today's Revenue Risk */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <AlertTriangle size={16} className="text-red" />
              <h3>{t("dashboard.todaysRevenueRisk")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/leads")}
            >
              {t("dashboard.viewAll")} →
            </a>
          </div>
          <div className="risk-alerts-list">
            {riskRows.map((risk, idx) => (
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
              <h3>{t("dashboard.liveAiTracking")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/whatsapp")}
            >
              {t("dashboard.viewAll")} →
            </a>
          </div>
          <div className="tracking-timeline-list">
            {trackingLogs.length === 0 ? (
              <span style={emptyStyle}>{t("dashboard.noRecentActivity")}</span>
            ) : (
              trackingLogs.map((log, idx) => (
                <div key={idx} className="timeline-item-row">
                  <div className="timeline-marker-dot"></div>
                  <span className="timeline-log-txt">{log.text}</span>
                  <span className="timeline-time-stamp">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Deals by Stage */}
        <div className="content-card">
          <div className="card-top-header">
            <div className="title-left">
              <Briefcase size={16} className="text-royal-blue" />
              <h3>{t("dashboard.activeDealsByStage")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/pipeline")}
            >
              {t("dashboard.viewPipeline")} →
            </a>
          </div>
          <div className="deals-by-stage-box">
            <div className="stage-stats-columns">
              {[
                { name: t("dashboard.statusNew") },
                { name: t("dashboard.statusQualified") },
                { name: t("dashboard.stageShowing") },
                { name: t("dashboard.stageOffer") },
                { name: t("dashboard.stageClosed") },
              ].map((stage, idx) => (
                <div key={idx} className="stage-column-item">
                  <span className="stage-head-lbl">{stage.name}</span>
                </div>
              ))}
            </div>
            {/* Deal-stage distribution bar removed: no per-stage deal data in
                the backend yet, so fixed widths would misrepresent the pipeline. */}
            <div className="stage-stats-columns">
              {[
                { name: "New" },
                { name: "Qualified" },
                { name: "Showing" },
                { name: "Offer" },
                { name: "Closed" },
              ].map((stage, idx) => (
                <div key={idx} className="stage-column-item">
                  {/* No deal-stage counts or deal values in the backend. */}
                  <h4>{NO_DATA}</h4>
                  <span>{NO_DATA}</span>
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
            <h5>{t("dashboard.pipelineFunnel")}</h5>
          </div>
          <div className="funnel-vertical-stack">
            {funnelStages.length === 0 ? (
              <span style={emptyStyle}>{t("dashboard.noLeadData")}</span>
            ) : (
              funnelStages.map((item, idx) => {
                const percent =
                  totalLeads > 0
                    ? `${Math.round((item.count / totalLeads) * 100)}%`
                    : "0%";
                const width = `${Math.round((item.count / funnelMax) * 100)}%`;
                return (
                  <div key={idx} className="funnel-layer-bar">
                    <span className="layer-name">{item.stage}</span>
                    <div className="layer-graphic-track">
                      <div
                        className="layer-fill"
                        style={{ width: width }}
                      ></div>
                    </div>
                    <span className="layer-metrics">
                      {item.count}{" "}
                      <span className="text-gray">({percent})</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Automation Health */}
        <div className="content-card">
          <div className="card-top-header">
            <Clock3 size={16} />
            <h5>{t("dashboard.automationHealthTitle")}</h5>
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
            <h5>{t("dashboard.nextActionsTitle")}</h5>
          </div>
          <div className="action-todo-list">
            {nextActions.length === 0 ? (
              <span style={emptyStyle}>{t("dashboard.noRecommendedActions")}</span>
            ) : (
              nextActions.map((action, idx) => (
                <div key={idx} className="todo-row-item">
                  <div className="todo-details">
                    <span className="todo-txt">
                      <CheckCircle2
                        size={13}
                        className="text-muted"
                        style={{ marginRight: 4 }}
                      />{" "}
                      {action.text}
                    </span>
                    {action.urgent && <span className="tag-urgent">{t("dashboard.urgent")}</span>}
                  </div>
                  <span className="todo-time">{action.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Closings */}
        <div className="content-card">
          <div className="card-top-header ">
            <Calendar size={12} />
            <h5>{t("dashboard.upcomingClosings")}</h5>
          </div>
          <div className="closing-list-wrapper">
            {upcomingList.length === 0 ? (
              <span style={emptyStyle}>{t("dashboard.noUpcomingClosings")}</span>
            ) : (
              upcomingList.map((item, idx) => (
                <div key={idx} className="todo-row-item">
                  <div className="todo-details">
                    <span className="todo-txt">
                      <Calendar
                        size={13}
                        className="text-muted"
                        style={{ marginRight: 4 }}
                      />{" "}
                      {item.title}
                    </span>
                    <span className="tag-urgent" style={{ background: "transparent", color: "#94a3b8", padding: 0 }}>
                      {item.status}
                    </span>
                  </div>
                  <span className="todo-time">{item.when}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Action Center */}
        <div className="content-card action-center-dark-card">
          <div className="dark-card-body">
            <div className="card-head-title">
              <Zap size={16} className="text-orange" />
              <h4>{t("dashboard.aiActionCenter")}</h4>
            </div>
            <p className="dark-card-desc">
              {t("dashboard.aiActionCenterDesc")}
            </p>
            <div className="dark-card-counter-row">
              <div className="counter-box">
                <span>{t("dashboard.recommendsActions")}</span>
                <h3>{hasLeads ? recommendedCount : NO_DATA}</h3>
              </div>
              <div className="counter-box urgent-border">
                <span className="text-red">{t("dashboard.urgentTasks")}</span>
                <h3 className="text-red">{hasLeads ? urgentCount : NO_DATA}</h3>
              </div>
            </div>
            <button
              className="btn-run-analysis"
              onClick={refresh}
              disabled={loading}
            >
              {t("dashboard.runAiDashboardReview")} <Zap size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
