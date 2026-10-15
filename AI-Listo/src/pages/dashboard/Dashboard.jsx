import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
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
  PieChart,
  Pie,
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
  CheckCircle,
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
  ChevronRight,
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
  Send,
  Sparkles,
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
import apiClient from "../../api/apiClient";

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
  const { user } = useAuth();
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

  // AI Command Center actions
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignMembers, setAssignMembers] = useState([]);
  const [assignLeadId, setAssignLeadId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [followUpForm, setFollowUpForm] = useState({
    date: "",
    time: "",
    note: "",
  });
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [commandActionMessage, setCommandActionMessage] = useState("");
  const [selectedCommandLeadId, setSelectedCommandLeadId] = useState("");
  const [commandPrompt, setCommandPrompt] = useState("");

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
  const [upcoming, setUpcoming] = useState([]); // getUpcomingAppointments()
  const [tasksData, setTasksData] = useState(null);
  const [contactsStats, setContactsStats] = useState(null);
  const [aiFeed, setAiFeed] = useState(null);
  const [commandMetrics, setCommandMetrics] = useState(null);
  const [taskLoadError, setTaskLoadError] = useState(false);
  const [aiLoadError, setAiLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load the three core dashboard sources independently. One failing API
        // must not blank the entire dashboard or turn failed metrics into confirmed zeros.
        const [dashResult, summaryResult, activityResult] = await Promise.allSettled([
          getAnalyticsDashboard(range),
          getDashboardSummary(),
          getActivityMetrics(range),
        ]);
        if (cancelled) return;

        const dashRes = dashResult.status === "fulfilled" ? dashResult.value : null;
        const summaryRes = summaryResult.status === "fulfilled" ? summaryResult.value : null;
        const activityRes = activityResult.status === "fulfilled" ? activityResult.value : null;

        setDash(dashRes || null);
        setSummary(summaryRes || null);
        setActivity(activityRes || null);

        if (!dashRes && !summaryRes && !activityRes) {
          const firstError = [dashResult, summaryResult, activityResult].find(
            (result) => result.status === "rejected",
          );
          throw firstError?.reason || new Error(t("dashboard.loadError"));
        }

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

        // Existing backend endpoints are team-scoped and use authenticated user membership.
        // Keep failures distinct from an empty successful response.
        const selectedTeamId = user?.teamId || user?.team_id || null;
        // Fetch every task page. A first-page sample is not a reliable workspace total.
        const loadAllTasks = async (teamId) => {
          const endpoint = `/teams/${encodeURIComponent(teamId)}/workspace/tasks`;
          const first = await apiClient.request(`${endpoint}?page=1&limit=100`);
          if (!Array.isArray(first?.data)) throw new Error("Unexpected tasks response");
          const totalPages = Math.max(1, Number(first.pagination?.totalPages || 1));
          if (totalPages > 100) throw new Error("Task result exceeds dashboard pagination safety limit");
          const pages = await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) =>
            apiClient.request(`${endpoint}?page=${i + 2}&limit=100`)));
          const rows = [...first.data];
          pages.forEach((page) => {
            if (!Array.isArray(page?.data)) throw new Error("Incomplete tasks response");
            rows.push(...page.data);
          });
          if (first.pagination?.total != null && rows.length !== Number(first.pagination.total))
            throw new Error("Tasks changed during pagination; retry to refresh totals");
          return { data: rows, pagination: { total: rows.length } };
        };
        const aiDays = range === "today" ? 1 : range === "7d" ? 7 : 30;
        const aiSince = new Date(Date.now() - aiDays * 86400000).toISOString();
        const [taskResult, aiResult, contactsResult] = await Promise.allSettled([
          selectedTeamId ? loadAllTasks(selectedTeamId) : Promise.reject(new Error("No active team selected")),
          apiClient.request(`/ai-center/agent/activity-feed?page=1&limit=100&since=${encodeURIComponent(aiSince)}`),
          apiClient.request("/contacts/stats"),
        ]);
        if (cancelled) return;
        setTasksData(taskResult.status === "fulfilled" ? taskResult.value : null);
        setTaskLoadError(taskResult.status !== "fulfilled");
        setAiFeed(aiResult.status === "fulfilled" ? aiResult.value : null);
        setContactsStats(contactsResult.status === "fulfilled" ? contactsResult.value : null);
        setAiLoadError(aiResult.status !== "fulfilled");

        // Purpose-built endpoint: tasks, AI history, channels and automation runs
        // are independently sourced; no guessed zeros on API failure.
        try {
          const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
          const data = await apiClient.request(`/analytics/command-center?days=${days}`);
          if (!cancelled) setCommandMetrics(data || null);
        } catch (_e) {
          if (!cancelled) setCommandMetrics(null);
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
  const taskRows = Array.isArray(commandMetrics?.tasks?.rows) ? commandMetrics.tasks.rows : Array.isArray(tasksData?.data) ? tasksData.data : null;
  const aiRows = Array.isArray(commandMetrics?.ai?.history) ? commandMetrics.ai.history : Array.isArray(aiFeed?.items) ? aiFeed.items : null;
  const taskIsOpen = (task) => !["completed", "done", "cancelled", "canceled", "closed"].includes(String(task?.status || "").toLowerCase());
  // The backend limits task pages to 100. Never present a partial page as the complete team total.
  const taskPageIncomplete = !commandMetrics?.tasks && tasksData?.pagination?.total > (taskRows?.length ?? 0);
  const pendingTasks = taskRows && !taskPageIncomplete ? taskRows.filter(taskIsOpen) : null;
  const openTaskTotal = commandMetrics?.tasks?.open ?? pendingTasks?.length ?? null;
  const overdueTasks = pendingTasks?.filter(task => task.dueDate && new Date(task.dueDate).getTime() < Date.now()) ?? null;
  const overdueTaskTotal = commandMetrics?.tasks?.overdue ?? overdueTasks?.length ?? null;
  const followupsDue = pendingTasks?.filter(task => /follow.?up/i.test(String(task.taskType || "") + " " + String(task.name || "")) && task.dueDate && new Date(task.dueDate).getTime() <= Date.now()) ?? null;
  const followupTotal = commandMetrics?.tasks?.followups_due ?? followupsDue?.length ?? null;
  const aiFailed = commandMetrics?.ai?.failed ?? aiFeed?.overview?.failed ?? null;
  const aiCompleted = commandMetrics?.ai?.completed ?? aiFeed?.overview?.completed ?? null;
  // A total without matching feed rows must not be presented as an empty history.
  const aiRecent = aiRows?.slice(0, 5) ?? null;
  const attentionTotal = [metrics?.conversations_unread, overdueTaskTotal, followupTotal, aiFailed].every(v => v != null)
    ? Number(metrics.conversations_unread) + Number(overdueTaskTotal) + Number(followupTotal) + Number(aiFailed)
    : null;
  const period = periodLabel(range, t);
  const hasLeads = (leadsList || []).length > 0;

  const followUpPct =
    leads && totalLeads > 0
      ? `${Math.round(((byStatus?.contacted || 0) / totalLeads) * 100)}%`
      : leads
        ? "0%"
        : NO_DATA;

  // Activity trend feeds the Lead Activity Trend chart and the CSV export.
  const eventsByDay =
    activity?.eventsByDay || dash?.activity?.eventsByDay || [];

  // Command Center KPI row. Only use verified fields from existing API responses.
  // A missing API value stays unknown (—), never an invented zero.
  const miniKpis = [
    {title: t("dashboard.newContacts", "New Contacts"), value: contactsStats?.newContacts == null ? NO_DATA : String(contactsStats.newContacts), subtext: period, icon: <Users size={19}/>, iconBg:"bg-light-blue", intime:period},
    {title: t("dashboard.aiConversations", "AI Conversations"), value: metrics?.conversations_total == null ? NO_DATA : String(metrics.conversations_total), subtext: period, icon:<MessageCircle size={19}/>, iconBg:"bg-light-purple", intime:period},
    {title: t("dashboard.appointments", "Appointments"), value: calStats?.total == null ? NO_DATA : String(calStats.total), subtext:t("dashboard.upcoming", "Upcoming"), icon:<Calendar size={19}/>, iconBg:"bg-light-green", intime:period},
    {title: t("dashboard.pendingTasks", "Pending Tasks"), value: openTaskTotal == null ? NO_DATA : String(openTaskTotal), subtext:t("dashboard.currentlyOpen", "Currently open"), icon:<CheckCircle2 size={19}/>, iconBg:"bg-light-orange", intime:period},
    {title: t("dashboard.followUpsDue", "Follow-Ups Due"), value: followupTotal == null ? NO_DATA : String(followupTotal), subtext:t("dashboard.dueNow", "Due now"), icon:<Clock3 size={19}/>, iconBg:"bg-light-blue", intime:period},
    {title: t("dashboard.aiActionsCompleted", "AI Actions Completed"), value: aiCompleted == null ? NO_DATA : String(aiCompleted), subtext:period, icon:<Activity size={19}/>, iconBg:"bg-light-purple", intime:period},
  ];
  // Existing export code expects secondaryKpis; the redesigned Dashboard shows
  // one six-card KPI row, so no unsupported second row is rendered.
  const secondaryKpis = [];

  // Revenue & Lead Trend chart => real daily activity counts (labelled Leads,
  // NOT Revenue — there is no revenue source).
  // eventsByDay represents lead activity, not conversations/appointments/tasks.
  // Do not relabel it as those metrics. Until their time series is provided,
  // render the explicit unavailable state rather than fabricated chart points.
  const revenueTrendData = Array.isArray(commandMetrics?.activity?.series) ? commandMetrics.activity.series : [];

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

  const leadSourceTotal = leadSources.reduce(
    (sum, item) => sum + Number(item.leads || 0),
    0,
  );

  const dashboardPipelineStages = [
    {
      key: "new",
      label: t("dashboard.statusNew"),
      count: byStatus?.new ?? NO_DATA,
      color: "#2563eb",
    },
    {
      key: "qualified",
      label: t("dashboard.statusQualified"),
      count: byStatus?.qualified ?? NO_DATA,
      color: "#16a34a",
    },
    {
      key: "showing",
      label: t("dashboard.stageShowing"),
      count: NO_DATA,
      color: "#f59e0b",
    },
    {
      key: "offer",
      label: t("dashboard.stageOffer"),
      count: NO_DATA,
      color: "#f97316",
    },
    {
      key: "closed",
      label: t("dashboard.stageClosed"),
      count: NO_DATA,
      color: "#22c55e",
    },
  ];

  const dashboardPipelineMax = Math.max(
    1,
    ...dashboardPipelineStages
      .filter((item) => typeof item.count === "number")
      .map((item) => Number(item.count || 0)),
  );

  const dashboardInsightRows = [
    {
      icon: <Target size={14} />,
      tone: "purple",
      label: t("dashboard.leadSourcePerformance"),
      value: leadSources[0]?.source || t("dashboard.noLeadSourceData"),
    },
    {
      icon: <Clock3 size={14} />,
      tone: "blue",
      label: t("dashboard.followUpCompletion"),
      value: followUpPct,
    },
    {
      icon: <MessageCircle size={14} />,
      tone: "green",
      label: t("dashboard.unansweredConversations"),
      value:
        metrics?.conversations_unread != null
          ? String(metrics.conversations_unread)
          : NO_DATA,
    },
    {
      icon: <AlertTriangle size={14} />,
      tone: "orange",
      label: t("dashboard.leadsMarkedLost"),
      value: byStatus?.lost != null ? String(byStatus.lost) : NO_DATA,
    },
  ];

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
    assignedTo: a?.assignedTo?.name || a?.assignedToName || a?.assignee?.name || a?.owner?.name || NO_DATA,
  }));

  // Pipeline Funnel => real lead funnel from leads.byStatus.
  const funnelStages = leads
    ? [
        { stage: t("dashboard.funnelLeads"), count: totalLeads },
        {
          stage: t("dashboard.contactedLabel"),
          count: byStatus?.contacted || 0,
        },
        {
          stage: t("dashboard.statusQualified"),
          count: byStatus?.qualified || 0,
        },
        {
          stage: t("dashboard.statusConverted"),
          count: byStatus?.converted || 0,
        },
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
  const urgentCount = (leadsList || []).filter(
    (l) => l?.aiTier === "HOT",
  ).length;

  // Banner narrative values (real counts, no fabricated names).
  const bannerNewLeads =
    metrics?.leads_new ?? byStatus?.new ?? leads?.created ?? null;

  // Command Center targets the newest NEW lead first. If there is no lead with
  // status=new, fall back to the newest available lead.
  const commandCenterLead =
    [...(leadsList || [])]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .sort(
        (a, b) => Number(b?.status === "new") - Number(a?.status === "new"),
      )[0] || null;

  const selectedCommandLead =
    (leadsList || []).find(
      (lead) => String(lead?.id) === String(selectedCommandLeadId),
    ) ||
    commandCenterLead ||
    null;

  const handleCommandCall = async () => {
    const phone = String(commandCenterLead?.phone || "").trim();

    if (!phone) {
      setCommandActionMessage("No phone number available.");
      return;
    }

    setCommandActionMessage("");

    // Log the call action without blocking the native phone action.
    if (commandCenterLead?.id) {
      apiClient
        .request(`/leads/${commandCenterLead.id}/contact`, {
          method: "POST",
          body: JSON.stringify({ actionType: "call" }),
        })
        .catch((err) => console.error("Failed to log call action:", err));
    }

    window.location.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
  };

  const openCommandAssign = async () => {
    setAssignError("");
    setAssignLeadId(commandCenterLead?.id ? String(commandCenterLead.id) : "");
    setAssignUserId("");
    setAssignMembers([]);
    setShowAssignModal(true);
    try {
      // Resolve membership from the active lead's team rather than navigating
      // to a separate Team Workspace. Never silently use a different team.
      const teamsResponse = await apiClient.request("/teams");
      const teams = Array.isArray(teamsResponse) ? teamsResponse :
        (Array.isArray(teamsResponse?.data) ? teamsResponse.data : teamsResponse?.data?.items || []);
      const activeTeamId = commandCenterLead?.teamId || commandCenterLead?.team_id ||
        user?.activeTeamId || user?.teamId;
      const team = teams.find(item => String(item.id) === String(activeTeamId));
      if (!team) {
        setAssignError("Could not determine the selected workspace team. Select a lead belonging to your active workspace.");
        return;
      }
      const response = await apiClient.request(`/teams/${team.id}/members`);
      const payload = response?.data || response;
      setAssignMembers(Array.isArray(payload) ? payload : payload?.members || payload?.items || []);
    } catch (err) {
      setAssignError(err?.message || "Could not load workspace members.");
    }
  };

  const saveCommandAssign = async (event) => {
    event.preventDefault();
    if (!assignLeadId || !assignUserId || assignBusy) return;
    setAssignBusy(true);
    setAssignError("");
    try {
      await apiClient.request(`/leads/${assignLeadId}`, {
        method: "PUT",
        body: JSON.stringify({ assignedTo: assignUserId }),
      });
      setShowAssignModal(false);
      setCommandActionMessage("Lead assigned successfully.");
      refresh();
    } catch (err) {
      setAssignError(err?.message || "Failed to assign lead.");
    } finally {
      setAssignBusy(false);
    }
  };

  const openCommandFollowUp = () => {
    // Always open the modal. Do not block the UI if the lead list is still
    // loading or no automatic Command Center lead could be resolved.
    setCommandActionMessage("");
    setFollowUpForm({ date: "", time: "", note: "" });
    setSelectedCommandLeadId(commandCenterLead?.id || "");
    setShowFollowUpModal(true);
  };

  const saveCommandFollowUp = async (e) => {
    e.preventDefault();

    if (savingFollowUp) return;

    if (!selectedCommandLead?.id) {
      setCommandActionMessage("Please select a lead for this follow-up.");
      return;
    }

    if (!followUpForm.date || !followUpForm.time) {
      setCommandActionMessage("Please select a follow-up date and time.");
      return;
    }

    try {
      setSavingFollowUp(true);
      setCommandActionMessage("");

      const scheduledAt = `${followUpForm.date}T${followUpForm.time}`;
      const note = String(followUpForm.note || "").trim();

      // Keep the lead's CRM state in sync with the scheduled follow-up.
      await apiClient.request(`/leads/${selectedCommandLead.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "follow-up" }),
      });

      // Add a real lead timeline/activity record.
      await apiClient.request(`/leads/${selectedCommandLead.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "lead.follow_up_scheduled",
          metadata: {
            title: "Follow-up scheduled",
            sub: `${followUpForm.date} at ${followUpForm.time}${note ? ` — ${note}` : ""}`,
            date: followUpForm.date,
            time: followUpForm.time,
            scheduledAt,
            note,
          },
        }),
      });

      // If this lead is linked to a Contact, also mirror the record to the
      // Contact activity feed. Failure here must not undo the lead follow-up.
      if (selectedCommandLead.contactId) {
        try {
          await apiClient.request(
            `/contacts/${selectedCommandLead.contactId}/activities`,
            {
              method: "POST",
              body: JSON.stringify({
                type: "follow_up",
                title: "Follow-up scheduled",
                sub: `${followUpForm.date} at ${followUpForm.time}${note ? ` — ${note}` : ""}`,
              }),
            },
          );
        } catch (contactErr) {
          console.error("Failed to mirror follow-up to contact:", contactErr);
        }
      }

      setShowFollowUpModal(false);
      setFollowUpForm({ date: "", time: "", note: "" });
      setCommandActionMessage("Follow-up saved.");
      refresh();
    } catch (err) {
      console.error("Save Command Center follow-up error:", err);
      setCommandActionMessage(err?.message || "Failed to save follow-up.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Export the real, loaded dashboard data to CSV (KPIs, lead-status
  // breakdown, lead sources, activity-by-day). No fabricated values.
  const exportData = () => {
    const rows = [];
    rows.push([t("dashboard.csvExportTitle")]);
    rows.push([t("dashboard.csvPeriod"), period]);
    rows.push([t("dashboard.csvGenerated"), new Date().toISOString()]);
    rows.push([]);

    rows.push([
      t("dashboard.csvKpi"),
      t("dashboard.csvValue"),
      t("dashboard.csvWindow"),
    ]);
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
    if (leadSources.length === 0)
      rows.push([t("dashboard.noLeadSourceData"), ""]);
    leadSources.forEach((s) => rows.push([s.source, s.leads]));
    rows.push([]);

    rows.push([t("dashboard.csvDate"), t("dashboard.csvActivityEvents")]);
    if (eventsByDay.length === 0)
      rows.push([t("dashboard.csvNoActivityInPeriod"), ""]);
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
      <p className="sub_head">{t("dashboard.subheading", "Your conversations, schedule, tasks and AI activity in one place.")}</p>
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

      {/* FREE PLAN AI UNITS — shown only for Free accounts by AiUsageMeter */}
      <AiUsageMeter />

      {/* AI COMMAND CENTER */}
      <section className="ai-command-banner">
        <div className="banner-left">
          <div className="command-center-heading-row">
            <div className="ai-avatar-glow">
              <div className="ai-bot-icon">🤖</div>
            </div>

            <div className="ai-message-ctx">
              <span className="command-center-label">
                Command Center
              </span>

              <h2 className="command-center-question">
                How can I help you?
              </h2>
            </div>
          </div>

          <div className="command-center-assistant">
            <div className="command-center-prompts">
              <button type="button" onClick={() => navigate("/dashboard/analytics")}><TrendingUp size={15}/><span>AI Activity</span></button>
              <button type="button" onClick={() => navigate("/dashboard/leads")}><AlertTriangle size={15}/><span>Needs Attention</span></button>
              <button type="button" onClick={() => navigate("/dashboard/calendar")}><Calendar size={15}/><span>Appointments</span></button>
              <button type="button" onClick={openCommandFollowUp}><CheckCircle2 size={15}/><span>Tasks</span></button>
            </div>
          </div>

          <div className="command-center-input-row">
            <input
              type="text"
              value={commandPrompt}
              onChange={(e) => setCommandPrompt(e.target.value)}
              placeholder={t("dashboard.commandCenterPlaceholder")}
              aria-label={t("dashboard.commandCenterPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate("/dashboard/ai-cortexa");
                }
              }}
            />

            <button
              type="button"
              aria-label="Open AI Agent"
              onClick={() => navigate("/dashboard/ai-cortexa")}
            >
              <Send size={15} />
            </button>
          </div>

          <div className="command-next-best-action">
            <Sparkles size={18} />
            <div>
              <strong>{t("dashboard.nextBestAction")}</strong>
              <span>{commandCenterLead ? t("dashboard.followUpNewestLeads") : "No pending actions"}</span>
            </div>
            <ChevronRight size={22} className="command-next-chevron" />
          </div>
        </div>

        <div className="banner-right">
          <div className="banner-right-top">
            <div className="mini-insight-card">
              <div className="card-lbl">AI Actions</div>
              <div className="card-val-group">
                <span className="command-mini-accent accent-green" />
                <h3>{aiCompleted == null ? NO_DATA : aiCompleted}</h3>
              </div>
            </div>

            <div className="mini-insight-card">
              <div className="card-lbl">Needs Attention</div>
              <div className="card-val-group">
                <span className="command-mini-accent accent-orange" />
                <h3>{attentionTotal == null ? NO_DATA : attentionTotal}</h3>
              </div>
            </div>

            <div className="mini-insight-card next-action-card">
              <Phone size={16} />
              <div>
                <div className="card-lbl">{t("dashboard.nextBestAction")}</div>
                <h4>{commandCenterLead ? t("dashboard.followUpWithNewLeads") : "No pending actions"}</h4>
              </div>
            </div>
          </div>

          <div className="banner-action-row">
            <button
              className="banner-btn text-dark"
              onClick={handleCommandCall}
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
              onClick={openCommandAssign}
            >
              <Users size={16} /> {t("dashboard.assign")} <ChevronDown size={14} />
            </button>

            <button
              className="banner-btn btn-followup-color"
              onClick={openCommandFollowUp}
            >
              <Calendar size={16} /> {t("dashboard.followUp")}
            </button>
          </div>

          <span className="dashboard-assign-helper">{t("dashboard.assignWithinWorkspace", "Assign within your active workspace")}</span>
          {commandActionMessage && (
            <div className="command-action-message">{commandActionMessage}</div>
          )}
        </div>
      </section>

      {showAssignModal && (
        <div className="command-followup-overlay" onMouseDown={e => {
          if (e.target === e.currentTarget && !assignBusy) setShowAssignModal(false);
        }}>
          <div className="command-followup-modal" role="dialog" aria-modal="true" aria-label="Assign lead">
            <div className="command-followup-header">
              <div><h3>Assign Lead</h3><p>Assign a lead within your active workspace</p></div>
              <button type="button" className="command-followup-close" disabled={assignBusy} onClick={() => setShowAssignModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={saveCommandAssign}>
              <label className="command-followup-lead"><span>Lead</span>
                <select required value={assignLeadId} onChange={e => setAssignLeadId(e.target.value)}>
                  <option value="">Select a lead</option>
                  {leadsList.map(lead => <option key={lead.id} value={lead.id}>{lead.name || lead.email || "Unnamed lead"}</option>)}
                </select>
              </label>
              <label className="command-followup-lead"><span>Assign to</span>
                <select required value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                  <option value="">Select workspace member</option>
                  {assignMembers.map(member => <option key={member.userId || member.id} value={member.userId || member.id}>{member.name || member.email || "Team member"}</option>)}
                </select>
              </label>
              {assignError && <p role="alert" className="command-action-message">{assignError}</p>}
              <button className="banner-btn btn-assign-color" type="submit" disabled={assignBusy || !assignLeadId || !assignUserId}>{assignBusy ? "Saving..." : "Assign"}</button>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div
          className="command-followup-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingFollowUp) {
              setShowFollowUpModal(false);
            }
          }}
        >
          <div
            className="command-followup-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="command-followup-header">
              <div>
                <h3>Schedule Follow-Up</h3>
                <p>
                  {selectedCommandLead?.name ||
                    "Select a lead/contact to schedule a follow-up"}
                </p>
              </div>
              <button
                type="button"
                className="command-followup-close"
                onClick={() => setShowFollowUpModal(false)}
                disabled={savingFollowUp}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCommandFollowUp}>
              <label className="command-followup-lead">
                <span>Lead / Contact</span>
                <select
                  value={selectedCommandLeadId}
                  onChange={(e) => setSelectedCommandLeadId(e.target.value)}
                  required
                >
                  <option value="">Select lead/contact</option>
                  {(leadsList || []).map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name || lead.email || lead.phone || "Unnamed lead"}
                      {lead.phone ? ` — ${lead.phone}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {(leadsList || []).length === 0 && (
                <div className="command-followup-empty">
                  No lead available for follow-up.
                </div>
              )}

              <div className="command-followup-grid">
                <label>
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) =>
                      setFollowUpForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  <span>Follow-up time</span>
                  <input
                    type="time"
                    value={followUpForm.time}
                    onChange={(e) =>
                      setFollowUpForm((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="command-followup-note">
                <span>Note</span>
                <textarea
                  rows="4"
                  placeholder="Add a follow-up note..."
                  value={followUpForm.note}
                  onChange={(e) =>
                    setFollowUpForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="command-followup-actions">
                <button
                  type="button"
                  className="command-followup-cancel"
                  onClick={() => setShowFollowUpModal(false)}
                  disabled={savingFollowUp}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="command-followup-save"
                  disabled={savingFollowUp || !selectedCommandLead?.id}
                >
                  {savingFollowUp ? "Saving..." : "Save Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIMARY KPI CARDS */}
      <section className="kpi-row-grid kpi-row-primary grid-6-col">
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
                <span className="kpi-indicator-badge kpi-window-label">
                  {kpi.intime}
                </span>
              </div>
            </div>

            <div className="kpi-meta-content">
              <p className="kpi-helper-txt">{kpi.subtext}</p>
            </div>

            <div className="kpi-mobile-meta-line">
              <span>{kpi.intime}</span>
              <span className="kpi-mobile-meta-dot" aria-hidden="true">
                •
              </span>
              <span>{kpi.subtext}</span>
            </div>

            <ChevronRight
              className="kpi-mobile-chevron"
              size={22}
              aria-hidden="true"
            />
          </div>
        ))}
      </section>

      {/* SECONDARY KPI CARDS */}
      <section className="kpi-row-grid kpi-row-secondary grid-6-col">
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
            <ChevronRight
              className="kpi-mobile-chevron"
              size={22}
              aria-hidden="true"
            />
          </div>
        ))}
      </section>

      <div className="dashboard-design-grid">
      {/* DASHBOARD ANALYTICS */}
      <section className="dashboard-chart-row dashboard-overview-analytics">
        {/* Lead Activity Trend */}
        <div className="content-card dashboard-overview-trend">
          <div className="card-top-header">
            <div className="title-left">
              <TrendingUp size={16} className="text-royal-blue" />
              <h3>{t("dashboard.activityTrend", "Activity Trend")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/analytics")}
            >
              {t("dashboard.viewAll")} →
            </a>
          </div>

          <div className="overview-chart-legend">
            <span>
              <i className="legend-new" />
              {t("dashboard.conversations", "Conversations")}
            </span>
            <span>
              <i className="legend-converted" />
              {t("dashboard.appointments", "Appointments")}
            </span>
            <span>
              <i className="legend-completed" />
              {t("dashboard.completedTasks", "Completed Tasks")}
            </span>
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
                {t("dashboard.activityBreakdownUnavailable", "Activity breakdown unavailable for this period")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={revenueTrendData}
                  margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="dashboardRev"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#2563eb"
                        stopOpacity={0.16}
                      />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
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
                  <Area type="monotone" dataKey="conversations" name={t("dashboard.conversations", "Conversations")} stroke="#2563eb" strokeWidth={2} fillOpacity={0.1} fill="#2563eb" />
                  <Area type="monotone" dataKey="appointments" name={t("dashboard.appointments", "Appointments")} stroke="#16a34a" strokeWidth={2} fillOpacity={0.08} fill="#16a34a" />
                  <Area type="monotone" dataKey="completedTasks" name={t("dashboard.completedTasks", "Completed Tasks")} stroke="#a855f7" strokeWidth={2} fillOpacity={0.08} fill="#a855f7" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="content-card dashboard-overview-source">
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

          <div className="overview-source-layout">
            <div className="overview-source-chart">
              {leadSources.length === 0 ? (
                <div className="dashboard-source-empty" role="status">
                  {t("dashboard.noActivityInThisPeriod", "No activity in this period")}
                </div>
              ) : <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    dataKey="leads"
                    nameKey="source"
                    innerRadius={49}
                    outerRadius={70}
                    paddingAngle={1}
                    stroke="none"
                  >
                    {leadSources.map((entry, idx) => (
                      <Cell key={`source-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>}

              <div className="overview-source-total">
                <strong>{leadSourceTotal}</strong>
                <span>{t("dashboard.csvTotal")}</span>
              </div>
            </div>

            <div className="overview-source-list">
              {leadSources.slice(0, 5).map((item) => {
                const percentage =
                  leadSourceTotal > 0
                    ? Math.round(
                        (Number(item.leads || 0) / leadSourceTotal) * 100,
                      )
                    : 0;

                return (
                  <div key={item.source} className="overview-source-row">
                    <span>
                      <i
                        style={{
                          backgroundColor: item.color,
                        }}
                      />

                      {item.source}
                    </span>

                    <strong>
                      {percentage}% ({item.leads})
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="content-card dashboard-overview-pipeline">
          <div className="card-top-header">
            <div className="title-left">
              <Briefcase size={16} className="text-royal-blue" />
              <h3>{t("dashboard.pipelineByStage")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/pipeline")}
            >
              {t("dashboard.viewPipeline")} →
            </a>
          </div>

          <div className="overview-pipeline-list">
            {dashboardPipelineStages.length === 0 && (
              <p className="dashboard-workspace-empty" role="status">
                {t("dashboard.noLeadData", "No pipeline records for this workspace")}
              </p>
            )}
            {dashboardPipelineStages.map((stage) => {
              const hasCount = typeof stage.count === "number";
              const width = hasCount && dashboardPipelineMax > 0
                ? `${Math.round((Number(stage.count || 0) / dashboardPipelineMax) * 100)}%`
                : "0%";

              return (
                <div key={stage.key} className="overview-pipeline-row">
                  <span className="overview-stage-name">{stage.label}</span>
                  <strong>{stage.count}</strong>
                  <div className="overview-stage-track">
                    {hasCount && Number(stage.count) > 0 && (
                      <span
                        style={{
                          width,
                          backgroundColor: stage.color,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overview-pipeline-total">
            <span>{t("dashboard.activePipelineValue")}</span>
            <strong>
              {teamStats ? money(teamStats.totalPipeline) : NO_DATA}
            </strong>
          </div>
        </div>

        {/* AI Insights */}
        <div className="content-card dashboard-overview-insights">
          <div className="card-top-header">
            <div className="title-left">
              <Zap size={16} className="text-purple" />
              <h3>{t("leads.aiInsights")}</h3>
            </div>
            <a
              className="card-text-link"
              style={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard/ai-cortexa")}
            >
              {t("dashboard.viewAll")} →
            </a>
          </div>

          <div className="overview-insights-list">
            {dashboardInsightRows.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className={`overview-insight-row tone-${item.tone}`}
              >
                <span className="overview-insight-icon">{item.icon}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.value}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Communication, attention, schedule and review: source-backed overview */}
      <section className="dashboard-operations-redesign" aria-label="Dashboard operations overview">
        <div className="content-card dashboard-operations-panel">
          <div className="card-top-header">
            <div className="title-left"><MessageCircle size={17} className="text-purple"/><h3>{t("dashboard.communicationOverview")}</h3></div>
            <button type="button" className="card-text-link dashboard-link-button" onClick={() => navigate("/dashboard/conversations")}>{t("dashboard.viewConversations", "View Conversations")} →</button>
          </div>
          <div className="dashboard-communication-list">
            {[
              {name:t("dashboard.calls"), icon:<Phone size={17}/>, tone:"blue", count:commandMetrics?.channels?.calls},
              {name:"WhatsApp", icon:<MessageCircle size={17}/>, tone:"green", count:commandMetrics?.channels?.whatsapp},
              {name:t("dashboard.email"), icon:<Send size={17}/>, tone:"blue", count:commandMetrics?.channels?.email},
              {name:t("dashboard.websiteChat"), icon:<MessageCircle size={17}/>, tone:"purple", count:commandMetrics?.channels?.websiteChat},
            ].map(channel => (
              <div className="dashboard-communication-row" key={channel.name}>
                <span><i className={`dashboard-channel-icon tone-${channel.tone}`}>{channel.icon}</i>{channel.name}</span>
                <strong title={t("dashboard.channelTooltip")}>{channel.count ?? NO_DATA}</strong>
              </div>
            ))}
          </div>
          {!commandMetrics?.channels && <p className="dashboard-data-footnote">{t("dashboard.channelUnavailable")}</p>}
        </div>
        <div className="content-card dashboard-operations-panel">
          <div className="card-top-header">
            <div className="title-left"><AlertTriangle size={17} className="text-orange"/><h3>{t("dashboard.needsAttention")}</h3></div>
            <button type="button" className="card-text-link dashboard-link-button" onClick={() => navigate("/dashboard/conversations")}>{t("dashboard.viewAll")} →</button>
          </div>
          <div className="dashboard-attention-list">
            {[
              {name:t("dashboard.unansweredConversations"), icon:<MessageCircle size={16}/>, tone:"green", count:metrics?.conversations_unread},
              {name:t("dashboard.overdueTasks"), icon:<CheckCircle size={16}/>, tone:"orange", count:overdueTaskTotal},
              {name:t("dashboard.followUpsDue"), icon:<Clock3 size={16}/>, tone:"blue", count:followupTotal},
              {name:t("dashboard.failedAiActions"), icon:<AlertTriangle size={16}/>, tone:"red", count:aiFailed},
            ].map(item => <div className="dashboard-attention-row" key={item.name}><span><i className={`dashboard-channel-icon tone-${item.tone}`}>{item.icon}</i>{item.name}</span><strong>{item.count == null ? NO_DATA : item.count}</strong></div>)}
          </div>
          {attentionTotal == null && <p className="dashboard-data-footnote">{t("dashboard.unavailableMetrics")}</p>}
        </div>
        <div className="content-card dashboard-operations-panel dashboard-schedule-panel">
          <div className="card-top-header">
            <div className="title-left"><Calendar size={17} className="text-royal-blue"/><h3>{t("dashboard.upcomingSchedule")}</h3></div>
            <button type="button" className="card-text-link dashboard-link-button" onClick={() => navigate("/dashboard/calendar")}>{t("dashboard.viewCalendar")} →</button>
          </div>
          {upcomingList.length ? (
            <div className="dashboard-schedule-scroll"><table className="dashboard-schedule-table"><thead><tr><th>{t("dashboard.time")}</th><th>{t("dashboard.event")}</th><th>{t("dashboard.assignedTo")}</th><th>{t("dashboard.status")}</th></tr></thead><tbody>
              {upcomingList.map((item, idx) => <tr key={idx}><td>{item.when}</td><td>{item.title}</td><td>{item.assignedTo ?? NO_DATA}</td><td><span className="dashboard-schedule-status">{item.status}</span></td></tr>)}
            </tbody></table></div>
          ) : <div className="dashboard-schedule-empty-state" role="status"><Calendar size={29}/><strong>{t("dashboard.noUpcomingAppointments")}</strong><span>{t("dashboard.appointmentsAppearHere")}</span></div>}
        </div>
        <div className="content-card dashboard-ai-review-panel">
          <div className="card-top-header"><div className="title-left"><TrendingUp size={19}/><h3>{t("dashboard.aiDashboardReview")}</h3></div></div>
          <p>{t("dashboard.reviewActivity")}</p>
          <div className="dashboard-ai-wave" aria-hidden="true"><svg viewBox="0 0 320 72" preserveAspectRatio="none"><path d="M0 45 C60 -2 105 75 170 34 S260 6 320 26" fill="none" stroke="#4d72ff" strokeWidth="2"/><path d="M0 59 C75 15 100 82 180 42 S265 12 320 8" fill="none" stroke="#9447ff" strokeWidth="2"/></svg></div>
          <button type="button" className="dashboard-run-ai-button" onClick={() => navigate("/dashboard/ai-cortexa")}><Sparkles size={16}/>{t("dashboard.runAiReview")}</button>
        </div>
      </section>

        <div className="content-card dashboard-tasks-panel">
          <div className="card-top-header"><div className="title-left"><CheckCircle size={17} className="text-royal-blue"/><h3>{t("dashboard.tasksAndFollowups")}</h3></div><button type="button" className="card-text-link dashboard-link-button" onClick={() => navigate("/dashboard/leads")}>{t("dashboard.viewAll")} →</button></div>
          <div className="dashboard-schedule-scroll"><table className="dashboard-schedule-table"><thead><tr><th>{t("dashboard.task")}</th><th>{t("dashboard.assignedTo")}</th><th>{t("dashboard.due")}</th><th>{t("dashboard.status")}</th></tr></thead><tbody>{pendingTasks?.slice(0, 5).map(task => <tr key={task.id}><td>{task.name || NO_DATA}</td><td>{task.assignee || NO_DATA}</td><td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : NO_DATA}</td><td>{task.status || NO_DATA}</td></tr>)}</tbody></table></div>
          {!pendingTasks?.length && <div className="dashboard-table-empty"><CheckCircle size={28}/><strong>{(!commandMetrics?.tasks && taskLoadError) || taskPageIncomplete ? t("dashboard.taskTotalsUnavailable") : t("dashboard.noPendingTasks")}</strong><span>{(!commandMetrics?.tasks && taskLoadError) ? t("dashboard.checkTeamAccess") : taskPageIncomplete ? t("dashboard.taskPageIncomplete") : t("dashboard.noOpenTasks")}</span></div>}
        </div>
        <div className="content-card dashboard-ai-actions-panel">
          <div className="card-top-header"><div className="title-left"><Sparkles size={17} className="text-purple"/><h3>{t("dashboard.recentAiActions")}</h3></div><button type="button" className="card-text-link dashboard-link-button" onClick={() => navigate("/dashboard/ai-cortexa")}>{t("dashboard.viewAll")} →</button></div>
          <div className="dashboard-schedule-scroll"><table className="dashboard-schedule-table"><thead><tr><th>{t("dashboard.dateAndTime")}</th><th>{t("dashboard.action")}</th><th>{t("dashboard.status")}</th><th>{t("dashboard.details")}</th></tr></thead><tbody>{aiRecent?.map(action => <tr key={action.id}><td>{action.timestamp ? new Date(action.timestamp).toLocaleString() : NO_DATA}</td><td>{action.title || action.action || NO_DATA}</td><td>{action.statusLabel || action.status || NO_DATA}</td><td>{action.description || NO_DATA}</td></tr>)}</tbody></table></div>
          {!aiRecent?.length && <div className="dashboard-table-empty"><Activity size={27}/><strong>{(!commandMetrics?.ai && aiLoadError) ? t("dashboard.aiActivityLoadFailed") : aiCompleted > 0 ? t("dashboard.aiHistoryUnavailable", "AI actions were counted but their history is unavailable") : t("dashboard.noAiActions")}</strong><span>{(!commandMetrics?.ai && aiLoadError) || aiCompleted > 0 ? t("dashboard.retryAiFeed", "Refresh to retry loading the activity feed") : t("dashboard.aiActionsAppear")}</span></div>}
        </div>
        <div className="content-card dashboard-health-panel">
          <div className="card-top-header"><div className="title-left"><Activity size={17} className="text-royal-blue"/><h3>{t("dashboard.automationHealth")}</h3></div><span className="dashboard-health-period">{period}</span></div>
          <div className="dashboard-attention-list">{[{name:t("dashboard.successfulRuns", "Successful Runs"),icon:<CheckCircle size={16}/>,count:commandMetrics?.automation?.successful},{name:t("dashboard.failedRuns", "Failed Runs"),icon:<AlertTriangle size={16}/>,count:commandMetrics?.automation?.failed},{name:t("dashboard.needsAttention", "Needs Attention"),icon:<AlertTriangle size={16}/>,count:commandMetrics?.automation?.needsAttention}].map(item=><div className="dashboard-attention-row" key={item.name}><span>{item.icon}{item.name}</span><strong>{item.count == null ? NO_DATA : item.count}</strong></div>)}</div>
        </div>
      </div>

      {/* DASHBOARD OPERATIONS */}
      <section className="dashboard-logs-row dashboard-overview-operations">
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
                  <div className="timeline-marker-dot" />
                  <span className="timeline-log-txt">{log.text}</span>
                  <span className="timeline-time-stamp">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Deals by Stage */}
        <div className="content-card dashboard-overview-stage-summary">
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
              {dashboardPipelineStages.map((stage) => (
                <div key={stage.key} className="stage-column-item">
                  <span className="stage-head-lbl">{stage.label}</span>
                </div>
              ))}
            </div>

            <div className="stage-stats-columns">
              {dashboardPipelineStages.map((stage) => (
                <div key={stage.key} className="stage-column-item">
                  <h4>{stage.count}</h4>
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
              <span style={emptyStyle}>
                {t("dashboard.noRecommendedActions")}
              </span>
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
                    {action.urgent && (
                      <span className="tag-urgent">
                        {t("dashboard.urgent")}
                      </span>
                    )}
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
              <span style={emptyStyle}>
                {t("dashboard.noUpcomingClosings")}
              </span>
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
                    <span
                      className="tag-urgent"
                      style={{
                        background: "transparent",
                        color: "#94a3b8",
                        padding: 0,
                      }}
                    >
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
              {t("dashboard.refreshDashboardData", "Refresh Dashboard Data")}{" "}
              <Zap size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
