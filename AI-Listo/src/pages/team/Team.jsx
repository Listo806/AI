import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  Pencil,
  MoreVertical,
  CheckCircle2,
  Clock3,
  CalendarDays,
  FolderKanban,
  ListTodo,
  Users,
  Flag,
  Timer,
  FileText,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  FolderOpen,
  LayoutDashboard,
  Columns3,
  CircleUserRound,
  BarChart3,
} from "lucide-react";

import "./team.css";

/* =========================================================
  COMPONENTS
========================================================= */

import TeamHeader from "./components/TeamHeader";
import TeamStats from "./components/TeamStats";
import TeamToolbar from "./components/TeamToolbar";
import TeamMembersTable from "./components/TeamMembersTable";

import TeamPerformanceCard from "./components/TeamPerformanceCard";
import TeamActivityCard from "./components/TeamActivityCard";

import TeamInsightsCard from "./components/TeamInsightsCard";
import TeamBillingCard from "./components/TeamBillingCard";

import InviteMemberModal from "./components/InviteMemberModal";
import DeleteMemberModal from "./components/DeleteMemberModal";
import TeamNotificationsCard from "./components/TeamNotificationsCard";
import TeamQuickActionsCard from "./components/TeamQuickActionsCard";
import TeamAIInsightsModal from "./components/TeamAIInsightsModal";

import useTeamDashboard from "./hooks/useTeamDashboard";
import useTeamMembers from "./hooks/useTeamMembers";
import ChangeMemberRoleModal from "./components/ChangeMemberRoleModal";
import {
  fetchTeamAIInsights,
  updateTeamMemberRole,
  updateTeamSeatLimit,
  purchaseSeat,
  removeSeatBilling,
  fetchTeamWorkspaceOverview,
  fetchTeamWorkspaceTasks,
  fetchTeamWorkspaceProjects,
  createTeamWorkspaceTask,
  updateTeamWorkspaceTask,
  deleteTeamWorkspaceTask,
  moveTeamWorkspaceTask,
  logTeamWorkspaceTime,
  createTeamWorkspaceProject,
  fetchTeamWorkspaceProjectDetail,
  updateTeamWorkspaceProject,
  deleteTeamWorkspaceProject,
  fetchTeamWorkspaceFiles,
  uploadTeamWorkspaceFile,
  getTeamWorkspaceFileUrl,
  deleteTeamWorkspaceFile,
  fetchTeamWorkspaceTimeTracking,
  fetchTeamWorkspaceReports,
} from "./services/team.service";

/* Self-contained styles for the seat workflow modals (kept inline so they do
   not depend on external CSS). */
const SEAT_OVERLAY = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,17,21,0.5)",
  zIndex: 9998,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};
const SEAT_CARD = {
  background: "#ffffff",
  borderRadius: 14,
  width: "min(420px, 94vw)",
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};
const SEAT_TITLE = {
  margin: "0 0 10px",
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};
const SEAT_TEXT = {
  margin: "0 0 20px",
  fontSize: 14,
  lineHeight: 1.55,
  color: "#4b5563",
};
const SEAT_ROW = { display: "flex", justifyContent: "flex-end", gap: 10 };
const SEAT_BTN_SECONDARY = {
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  color: "#374151",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 9,
  cursor: "pointer",
};
const SEAT_BTN_PRIMARY = {
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 700,
  color: "#ffffff",
  background: "#2563eb",
  border: "none",
  borderRadius: 9,
  cursor: "pointer",
};

export default function TeamWorkspace() {
  /* =====================================================
    DASHBOARD
  ===================================================== */

  const {
    loading,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    team,
    //members,
    seatInfo,
    stats,
    activities,
    subscription,
    insights,
    leaderboard,
    notifications,
    reloadDashboard,
  } = useTeamDashboard();

  /* =====================================================
    MEMBERS
  ===================================================== */

  const {
    inviteEmail,
    setInviteEmail,
    inviting,
    removing,

    search,
    setSearch,

    inviteMember,
    removeMember,

    toast,

    filter,
    setFilter,

    filterDashboard,
    setFilterDashboard,

    members: filteredMembers,

    reloadMembers,
    updateMemberRoleLocally,
  } = useTeamMembers({
    teamId: selectedTeamId,
    onReload: reloadDashboard,
    mode: "dashboard",
  });

  /* =====================================================
    MODALS
  ===================================================== */

  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const [aiInsights, setAiInsights] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [aiError, setAiError] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleMember, setRoleMember] = useState(null);
  const [addingSeat, setAddingSeat] = useState(false);
  const [addSeatConfirmOpen, setAddSeatConfirmOpen] = useState(false);
  const [addSeatError, setAddSeatError] = useState("");
  const [noSeatsOpen, setNoSeatsOpen] = useState(false);
  const [keepRemoveSeatOpen, setKeepRemoveSeatOpen] = useState(false);
  const [seatBusy, setSeatBusy] = useState(false);

  const [seatToast, setSeatToast] = useState(null);

  const showSeatToast = (message, type = "success") => {
    setSeatToast({
      message,
      type,
    });
    window.setTimeout(() => {
      setSeatToast(null);
    }, 3000);
  };
  const handleOpenDelete = (member) => {
    setSelectedMember(member);

    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;

    await removeMember(selectedMember._id || selectedMember.id);

    setDeleteModalOpen(false);
    setSelectedMember(null);

    // After removing a member, ask whether to keep the freed seat for someone
    // else or drop it (and its charge) from the subscription.
    setKeepRemoveSeatOpen(true);
  };

  /* =====================================================
    INVITE MEMBER
  ===================================================== */

  const handleInvite = async (payload) => {
    const success = await inviteMember(payload);

    if (success !== false) {
      setInviteModalOpen(false);
    }
  };

  /* =====================================================
     TEAM WORKSPACE LIVE DATA
     ===================================================== */

  const WORKSPACE_TABS = [
     { label: "Overview", icon: LayoutDashboard },
      { label: "Projects", icon: FolderKanban },
      { label: "Board", icon: Columns3 },
      { label: "Tasks", icon: ListTodo },
      { label: "My Tasks", icon: CircleUserRound },
      { label: "Calendar", icon: CalendarDays },
      { label: "Time Tracking", icon: Clock3 },
      { label: "Files", icon: FileText },
      { label: "Team", icon: Users },
      { label: "Reports", icon: BarChart3 },
  ];

  const [workspaceTab, setWorkspaceTab] = useState("Tasks");
  const [workspaceMobileMoreOpen, setWorkspaceMobileMoreOpen] = useState(false);
  const [workspaceTaskView, setWorkspaceTaskView] = useState("table");

  const [workspaceOverview, setWorkspaceOverview] = useState(null);
  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const [workspaceTaskResponse, setWorkspaceTaskResponse] = useState({
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });

  const [workspaceBoardTasks, setWorkspaceBoardTasks] = useState([]);
  const [workspaceBoardLoading, setWorkspaceBoardLoading] = useState(false);
  const [workspaceBoardDraggingId, setWorkspaceBoardDraggingId] = useState(null);
  const [workspaceBoardOverStatus, setWorkspaceBoardOverStatus] = useState(null);

  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceTaskPage, setWorkspaceTaskPage] = useState(1);
  const [workspaceTaskLimit, setWorkspaceTaskLimit] = useState(20);
  const [workspaceTaskSearch, setWorkspaceTaskSearch] = useState("");

  const [workspaceStatus, setWorkspaceStatus] = useState("all");
  const [workspacePriority, setWorkspacePriority] = useState("all");
  const [workspaceAssignee, setWorkspaceAssignee] = useState("all");
  const [workspaceProject, setWorkspaceProject] = useState("all");
  const [workspaceTaskType, setWorkspaceTaskType] = useState("all");
  const [workspaceDateFrom, setWorkspaceDateFrom] = useState("");
  const [workspaceDateTo, setWorkspaceDateTo] = useState("");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingWorkspaceTask, setEditingWorkspaceTask] = useState(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: "",
    projectId: "",
    status: "pending",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
    progress: 0,
    estimatedMinutes: 0,
    taskType: "task",
    labels: "",
  });

  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedWorkspaceTask, setSelectedWorkspaceTask] = useState(null);
  const [taskMoreOpenId, setTaskMoreOpenId] = useState(null);

  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeTask, setTimeTask] = useState(null);
  const [timeSaving, setTimeSaving] = useState(false);
  const [timeForm, setTimeForm] = useState({
    minutes: 30,
    note: "",
  });

  const [taskImporting, setTaskImporting] = useState(false);
  const [taskExporting, setTaskExporting] = useState(false);
  const taskImportInputRef = useRef(null);

  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const [workspaceGlobalSearch, setWorkspaceGlobalSearch] = useState("");
  const [workspaceGlobalSearchOpen, setWorkspaceGlobalSearchOpen] = useState(false);
  const [workspaceGlobalSearchLoading, setWorkspaceGlobalSearchLoading] = useState(false);
  const [workspaceGlobalTaskResults, setWorkspaceGlobalTaskResults] = useState([]);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [editingWorkspaceProject, setEditingWorkspaceProject] = useState(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [selectedWorkspaceProject, setSelectedWorkspaceProject] = useState(null);
  const [projectDeletingId, setProjectDeletingId] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectPriorityFilter, setProjectPriorityFilter] = useState("all");

  const emptyProjectForm = {
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    ownerId: "",
    startDate: "",
    dueDate: "",
    progress: 0,
  };

  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  /* =====================================================
     TEAM WORKSPACE CALENDAR
     Uses the same tasks/projects as the rest of Team Workspace.
     ===================================================== */
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState(null);


  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [workspaceFilesLoading, setWorkspaceFilesLoading] = useState(false);
  const [workspaceFileUploading, setWorkspaceFileUploading] = useState(false);
  const [workspaceFileSearch, setWorkspaceFileSearch] = useState("");
  const [workspaceFileProject, setWorkspaceFileProject] = useState("all");
  const [workspaceFileTask, setWorkspaceFileTask] = useState("all");
  const [workspaceFileTaskOptions, setWorkspaceFileTaskOptions] = useState([]);
  const workspaceFileInputRef = useRef(null);


  const [workspaceTimeData, setWorkspaceTimeData] = useState({
    summary: {},
    byMember: [],
    byProject: [],
    byTask: [],
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });
  const [workspaceTimeLoading, setWorkspaceTimeLoading] = useState(false);
  const [workspaceTimePage, setWorkspaceTimePage] = useState(1);
  const [workspaceTimeSearch, setWorkspaceTimeSearch] = useState("");
  const [workspaceTimeMember, setWorkspaceTimeMember] = useState("all");
  const [workspaceTimeProject, setWorkspaceTimeProject] = useState("all");
  const [workspaceTimeTask, setWorkspaceTimeTask] = useState("all");
  const [workspaceTimeDateFrom, setWorkspaceTimeDateFrom] = useState("");
  const [workspaceTimeDateTo, setWorkspaceTimeDateTo] = useState("");

  const [workspaceReports, setWorkspaceReports] = useState(null);
  const [workspaceReportsLoading, setWorkspaceReportsLoading] = useState(false);
  const [workspaceReportsExporting, setWorkspaceReportsExporting] = useState(false);
  const [workspaceReportDateFrom, setWorkspaceReportDateFrom] = useState("");
  const [workspaceReportDateTo, setWorkspaceReportDateTo] = useState("");

  const workspaceMembers = (filteredMembers || [])
    .map((member) => ({
      id: member?.userId || member?.user_id || member?.id,
      name: member?.name || member?.fullName || member?.email || "Team member",
      email: member?.email || member?.userEmail || "",
      role: member?.role || member?.teamRole || "member",
      status: member?.status || "active",
    }))
    .filter((member) => member.id);

  const taskQuery = {
    page: workspaceTaskPage,
    limit: workspaceTaskLimit,
    q: workspaceTaskSearch || undefined,
    status: workspaceStatus,
    priority: workspacePriority,
    assignee: workspaceAssignee,
    project: workspaceProject,
    taskType: workspaceTaskType,
    dateFrom: workspaceDateFrom || undefined,
    dateTo: workspaceDateTo || undefined,
    my: workspaceTab === "My Tasks" ? true : undefined,
  };

  const loadWorkspaceOverview = async () => {
    if (!selectedTeamId) {
      setWorkspaceOverview(null);
      setWorkspaceProjects([]);
      return;
    }

    const [overview, projects] = await Promise.all([
      fetchTeamWorkspaceOverview(selectedTeamId),
      fetchTeamWorkspaceProjects(selectedTeamId),
    ]);

    setWorkspaceOverview(overview || null);
    setWorkspaceProjects(projects?.data || projects || []);
  };

  const loadWorkspaceTasks = async () => {
    if (!selectedTeamId) {
      setWorkspaceTaskResponse({
        data: [],
        pagination: {
          page: 1,
          limit: workspaceTaskLimit,
          total: 0,
          totalPages: 1,
        },
      });
      return;
    }

    const tasks = await fetchTeamWorkspaceTasks(selectedTeamId, taskQuery);

    setWorkspaceTaskResponse(
      tasks || {
        data: [],
        pagination: {
          page: 1,
          limit: workspaceTaskLimit,
          total: 0,
          totalPages: 1,
        },
      },
    );
  };


  const loadWorkspaceBoardTasks = async () => {
    if (!selectedTeamId) {
      setWorkspaceBoardTasks([]);
      return;
    }

    try {
      setWorkspaceBoardLoading(true);

      const rows = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await fetchTeamWorkspaceTasks(selectedTeamId, {
          q: workspaceTaskSearch || undefined,
          priority: workspacePriority,
          assignee: workspaceAssignee,
          project: workspaceProject,
          taskType: workspaceTaskType,
          dateFrom: workspaceDateFrom || undefined,
          dateTo: workspaceDateTo || undefined,
          page,
          limit: 100,
        });

        rows.push(...(response?.data || []));
        totalPages = Math.max(
          1,
          Number(response?.pagination?.totalPages || 1),
        );
        page += 1;
      } while (page <= totalPages);

      setWorkspaceBoardTasks(rows);
    } catch (error) {
      console.error("TEAM BOARD DATA ERROR", error);
      setWorkspaceBoardTasks([]);
    } finally {
      setWorkspaceBoardLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceTab !== "Board" || !selectedTeamId) return;

    const timer = window.setTimeout(() => {
      loadWorkspaceBoardTasks();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    workspaceTab,
    selectedTeamId,
    workspaceTaskSearch,
    workspacePriority,
    workspaceAssignee,
    workspaceProject,
    workspaceTaskType,
    workspaceDateFrom,
    workspaceDateTo,
  ]);

  const loadWorkspaceData = async () => {
    try {
      setWorkspaceLoading(true);
      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
        workspaceTab === "Calendar" ? loadWorkspaceCalendar() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("TEAM WORKSPACE DATA ERROR", error);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTeamId) return;

    const timer = window.setTimeout(() => {
      loadWorkspaceData();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    selectedTeamId,
    workspaceTaskPage,
    workspaceTaskLimit,
    workspaceTaskSearch,
    workspaceStatus,
    workspacePriority,
    workspaceAssignee,
    workspaceProject,
    workspaceTaskType,
    workspaceDateFrom,
    workspaceDateTo,
    workspaceTab,
  ]);


  const loadWorkspaceTimeTracking = async () => {
    if (!selectedTeamId) return;
    try {
      setWorkspaceTimeLoading(true);
      const response = await fetchTeamWorkspaceTimeTracking(selectedTeamId, {
        page: workspaceTimePage,
        limit: 20,
        q: workspaceTimeSearch || undefined,
        member: workspaceTimeMember,
        project: workspaceTimeProject,
        task: workspaceTimeTask,
        dateFrom: workspaceTimeDateFrom || undefined,
        dateTo: workspaceTimeDateTo || undefined,
      });
      setWorkspaceTimeData(response || {
        summary: {},
        byMember: [],
        byProject: [],
        byTask: [],
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      });
    } catch (error) {
      console.error("TEAM TIME TRACKING ERROR", error);
    } finally {
      setWorkspaceTimeLoading(false);
    }
  };

  const loadWorkspaceReports = async () => {
    if (!selectedTeamId) return;
    try {
      setWorkspaceReportsLoading(true);
      const response = await fetchTeamWorkspaceReports(selectedTeamId, {
        dateFrom: workspaceReportDateFrom || undefined,
        dateTo: workspaceReportDateTo || undefined,
      });
      setWorkspaceReports(response || null);
    } catch (error) {
      console.error("TEAM REPORTS ERROR", error);
    } finally {
      setWorkspaceReportsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceTab !== "Time Tracking" || !selectedTeamId) return;
    const timer = window.setTimeout(loadWorkspaceTimeTracking, 200);
    return () => window.clearTimeout(timer);
  }, [
    workspaceTab,
    selectedTeamId,
    workspaceTimePage,
    workspaceTimeSearch,
    workspaceTimeMember,
    workspaceTimeProject,
    workspaceTimeTask,
    workspaceTimeDateFrom,
    workspaceTimeDateTo,
  ]);

  useEffect(() => {
    if (
      !["Reports", "Team"].includes(workspaceTab) ||
      !selectedTeamId
    ) {
      return;
    }

    const timer = window.setTimeout(loadWorkspaceReports, 200);
    return () => window.clearTimeout(timer);
  }, [
    workspaceTab,
    selectedTeamId,
    workspaceReportDateFrom,
    workspaceReportDateTo,
  ]);

  const workspaceTasks = workspaceTaskResponse?.data || [];
  const workspaceTaskPagination = workspaceTaskResponse?.pagination || {
    page: 1,
    limit: workspaceTaskLimit,
    total: 0,
    totalPages: 1,
  };

  const workspaceMetrics = workspaceOverview?.metrics || {};
  const statusBreakdown = workspaceOverview?.taskBreakdowns?.status || [];
  const priorityBreakdown = workspaceOverview?.taskBreakdowns?.priority || [];
  const workloadRows = workspaceOverview?.workload || [];
  const upcomingDeadlines = workspaceOverview?.upcomingDeadlines || [];

  const minutesToText = (minutes) => {
    const total = Math.max(0, Number(minutes || 0));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  };

  const formatTaskStatus = (value) =>
    String(value || "pending")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  const inputDateValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const deadlineDistance = (value) => {
    if (!value) return "";
    const due = new Date(value).getTime();
    if (!Number.isFinite(due)) return "";
    const diff = Math.ceil((due - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff} days`;
  };

  const reportActivityPresentation = (activity) => {
    const type = String(activity?.eventType || "").toLowerCase();
    const metadata = activity?.metadata || {};

    if (type.includes("time_logged")) {
      return {
        label: "Time logged",
        detail: `${metadata.title || "Task"}${metadata.minutes ? ` · ${minutesToText(metadata.minutes)}` : ""}`,
        Icon: Timer,
        tone: "blue",
      };
    }

    if (type.includes("completed")) {
      return {
        label: "Task completed",
        detail: metadata.title || "Task completed",
        Icon: CheckCircle2,
        tone: "green",
      };
    }

    if (type.includes("assigned")) {
      return {
        label: "Task assigned",
        detail: metadata.title || "Task assignment updated",
        Icon: Users,
        tone: "violet",
      };
    }

    if (type.includes("priority")) {
      return {
        label: "Priority changed",
        detail: metadata.title || "Task priority updated",
        Icon: Flag,
        tone: "orange",
      };
    }

    if (type.includes("due_date")) {
      return {
        label: "Due date changed",
        detail: metadata.title || "Task due date updated",
        Icon: CalendarDays,
        tone: "amber",
      };
    }

    if (type.includes("progress")) {
      return {
        label: "Progress updated",
        detail: metadata.title || "Task progress updated",
        Icon: ListTodo,
        tone: "cyan",
      };
    }

    if (type.includes("status")) {
      return {
        label: "Status changed",
        detail: metadata.title || "Task status updated",
        Icon: RotateCcw,
        tone: "indigo",
      };
    }

    if (type.includes("created")) {
      return {
        label: "Task created",
        detail: metadata.title || "New task created",
        Icon: Plus,
        tone: "blue",
      };
    }

    return {
      label: formatTaskStatus(
        String(activity?.eventType || "Activity")
          .replace("team.", "")
      ),
      detail: metadata.title || "Team workspace activity",
      Icon: ListTodo,
      tone: "slate",
    };
  };

  const workspaceReportTrend = Array.isArray(workspaceReports?.trend)
    ? workspaceReports.trend
    : [];

  const workspaceReportTrendMax = Math.max(
    1,
    ...workspaceReportTrend.flatMap((item) => [
      Number(item?.created || 0),
      Number(item?.completed || 0),
    ])
  );

  const reportTrendPoints = (key) => {
    if (!workspaceReportTrend.length) return "";

    const width = 680;
    const height = 190;
    const left = 18;
    const right = 18;
    const top = 16;
    const bottom = 18;
    const usableWidth = width - left - right;
    const usableHeight = height - top - bottom;

    return workspaceReportTrend
      .map((item, index) => {
        const x =
          left +
          (workspaceReportTrend.length === 1
            ? usableWidth / 2
            : (index / (workspaceReportTrend.length - 1)) * usableWidth);

        const value = Number(item?.[key] || 0);
        const y =
          top +
          usableHeight -
          (value / workspaceReportTrendMax) * usableHeight;

        return `${x},${y}`;
      })
      .join(" ");
  };

  const exportWorkspaceReports = async () => {
    if (!selectedTeamId || workspaceReportsExporting) return;

    try {
      setWorkspaceReportsExporting(true);

      let report = workspaceReports;

      // Fetch once more so the CSV always matches the active date filters.
      if (!report) {
        report = await fetchTeamWorkspaceReports(selectedTeamId, {
          dateFrom: workspaceReportDateFrom || undefined,
          dateTo: workspaceReportDateTo || undefined,
        });
      }

      if (!report) {
        throw new Error("No report data available");
      }

      const rows = [];

      rows.push(["TEAM WORKSPACE REPORT"]);
      rows.push([
        "Date From",
        workspaceReportDateFrom || "All time",
        "Date To",
        workspaceReportDateTo || "All time",
      ]);
      rows.push([]);

      rows.push(["SUMMARY"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Tasks Created", report?.summary?.tasksCreated || 0]);
      rows.push(["Tasks Completed", report?.summary?.tasksCompleted || 0]);
      rows.push(["Completion Rate", `${report?.summary?.completionRate || 0}%`]);
      rows.push(["On Time", `${report?.summary?.onTimeRate || 0}%`]);
      rows.push(["Average Progress", `${report?.summary?.avgProgress || 0}%`]);
      rows.push(["Hours Logged", report?.summary?.hoursLogged || 0]);
      rows.push([]);

      rows.push(["TASKS BY STATUS"]);
      rows.push(["Status", "Count"]);
      (report?.tasksByStatus || []).forEach((item) => {
        rows.push([formatTaskStatus(item.key), item.count || 0]);
      });
      rows.push([]);

      rows.push(["TASKS BY PRIORITY"]);
      rows.push(["Priority", "Count"]);
      (report?.tasksByPriority || []).forEach((item) => {
        rows.push([formatTaskStatus(item.key), item.count || 0]);
      });
      rows.push([]);

      rows.push(["MEMBER PERFORMANCE"]);
      rows.push([
        "Member",
        "Assigned",
        "Completed",
        "Completion Rate",
        "On Time Rate",
        "Average Progress",
        "Time Logged Minutes",
      ]);
      (report?.members || []).forEach((member) => {
        rows.push([
          member.name || "",
          member.assigned || 0,
          member.completed || 0,
          `${member.completionRate || 0}%`,
          `${member.onTimeRate || 0}%`,
          `${member.avgProgress || 0}%`,
          Number(member.loggedMinutes || 0),
        ]);
      });
      rows.push([]);

      rows.push(["PROJECT PERFORMANCE"]);
      rows.push([
        "Project",
        "Tasks",
        "Completed",
        "Average Progress",
        "Time Logged Minutes",
      ]);
      (report?.projects || []).forEach((project) => {
        rows.push([
          project.name || "",
          project.tasks || 0,
          project.completed || 0,
          `${project.avgProgress || 0}%`,
          Number(project.loggedMinutes || 0),
        ]);
      });
      rows.push([]);

      rows.push(["14 DAY TASK TREND"]);
      rows.push(["Date", "Created", "Completed"]);
      (report?.trend || []).forEach((item) => {
        rows.push([
          item.date || "",
          Number(item.created || 0),
          Number(item.completed || 0),
        ]);
      });
      rows.push([]);

      rows.push(["RECENT ACTIVITY"]);
      rows.push(["Activity", "Member", "Task", "Date"]);
      (report?.recentActivity || []).forEach((activity) => {
        const presentation = reportActivityPresentation(activity);
        rows.push([
          presentation.label,
          activity.userName || "",
          activity?.metadata?.title || "",
          activity.createdAt || "",
        ]);
      });
      rows.push([]);

      rows.push(["UPCOMING DEADLINES"]);
      rows.push(["Task", "Project", "Assignee", "Priority", "Due Date"]);
      (report?.upcomingDeadlines || []).forEach((task) => {
        rows.push([
          task.name || "",
          task.project || "",
          task.assignee || "",
          task.priority || "",
          task.dueDate || "",
        ]);
      });

      const csv = rows
        .map((row) => row.map(csvEscape).join(","))
        .join("\n");

      const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `team-workspace-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("EXPORT TEAM REPORT ERROR", error);
      window.alert(error?.message || "Could not export report.");
    } finally {
      setWorkspaceReportsExporting(false);
    }
  };


  const workspaceGlobalProjectResults = useMemo(() => {
    const query = workspaceGlobalSearch.trim().toLowerCase();

    if (!query) return [];

    return workspaceProjects
      .filter((project) =>
        [
          project?.name,
          project?.description,
          project?.ownerName,
          project?.status,
          project?.priority,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          ),
      )
      .slice(0, 6);
  }, [workspaceGlobalSearch, workspaceProjects]);

  const workspaceGlobalMemberResults = useMemo(() => {
    const query = workspaceGlobalSearch.trim().toLowerCase();

    if (!query) return [];

    return workspaceMembers
      .filter((member) =>
        [member?.name, member?.email]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          ),
      )
      .slice(0, 6);
  }, [workspaceGlobalSearch, workspaceMembers]);

  useEffect(() => {
    const query = workspaceGlobalSearch.trim();

    if (!query || !selectedTeamId) {
      setWorkspaceGlobalTaskResults([]);
      setWorkspaceGlobalSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setWorkspaceGlobalSearchLoading(true);

        const response = await fetchTeamWorkspaceTasks(
          selectedTeamId,
          {
            q: query,
            page: 1,
            limit: 8,
          },
        );

        if (!cancelled) {
          setWorkspaceGlobalTaskResults(
            Array.isArray(response?.data)
              ? response.data
              : [],
          );
        }
      } catch (error) {
        console.error("TEAM GLOBAL SEARCH ERROR", error);

        if (!cancelled) {
          setWorkspaceGlobalTaskResults([]);
        }
      } finally {
        if (!cancelled) {
          setWorkspaceGlobalSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [workspaceGlobalSearch, selectedTeamId]);

  const closeWorkspaceGlobalSearch = () => {
    setWorkspaceGlobalSearchOpen(false);
  };

  const openGlobalTaskResult = (task) => {
    closeWorkspaceGlobalSearch();
    setWorkspaceGlobalSearch("");

    setWorkspaceTaskSearch("");
    setWorkspaceStatus("all");
    setWorkspacePriority("all");
    setWorkspaceAssignee("all");
    setWorkspaceProject("all");
    setWorkspaceTaskType("all");
    setWorkspaceDateFrom("");
    setWorkspaceDateTo("");

    setWorkspaceTab("Tasks");
    setWorkspaceTaskView("table");

    openWorkspaceTaskDetail(task);
  };

  const openGlobalProjectResult = (project) => {
    closeWorkspaceGlobalSearch();
    setWorkspaceGlobalSearch("");
    setWorkspaceTab("Projects");
    setWorkspaceTaskView("table");
    openWorkspaceProjectDetail(project);
  };

  const openGlobalMemberResult = (member) => {
    closeWorkspaceGlobalSearch();
    setWorkspaceGlobalSearch("");

    setWorkspaceTaskSearch("");
    setWorkspaceStatus("all");
    setWorkspacePriority("all");
    setWorkspaceAssignee(member.id);
    setWorkspaceProject("all");
    setWorkspaceTaskType("all");
    setWorkspaceDateFrom("");
    setWorkspaceDateTo("");
    setWorkspaceTaskPage(1);
    setWorkspaceTaskView("table");
    setWorkspaceTab("Tasks");
  };

  const workspaceGlobalSearchHasResults =
    workspaceGlobalTaskResults.length > 0 ||
    workspaceGlobalProjectResults.length > 0 ||
    workspaceGlobalMemberResults.length > 0;

  const resetWorkspaceFilters = () => {
    setWorkspaceTaskSearch("");
    setWorkspaceStatus("all");
    setWorkspacePriority("all");
    setWorkspaceAssignee("all");
    setWorkspaceProject("all");
    setWorkspaceTaskType("all");
    setWorkspaceDateFrom("");
    setWorkspaceDateTo("");
    setWorkspaceTaskPage(1);
  };

  const openNewWorkspaceTask = () => {
    setEditingWorkspaceTask(null);
    setTaskForm({
      name: "",
      projectId: "",
      status: "pending",
      priority: "medium",
      assigneeId: "",
      dueDate: "",
      progress: 0,
      estimatedMinutes: 0,
      taskType: "task",
      labels: "",
    });
    setTaskModalOpen(true);
    setNewMenuOpen(false);
  };

  const openEditWorkspaceTask = (task) => {
    setEditingWorkspaceTask(task);
    setTaskForm({
      name: task?.name || "",
      projectId: task?.projectId || "",
      status: task?.status || "pending",
      priority: task?.priority || "medium",
      assigneeId: task?.assigneeId || "",
      dueDate: inputDateValue(task?.dueDate),
      progress: Number(task?.progress || 0),
      estimatedMinutes: Number(task?.estimatedMinutes || 0),
      taskType: task?.taskType || "task",
      labels: Array.isArray(task?.labels) ? task.labels.join(", ") : "",
    });
    setTaskModalOpen(true);
  };

  const saveWorkspaceTask = async (event) => {
    event?.preventDefault?.();
    if (!selectedTeamId || !taskForm.name.trim()) return;

    const payload = {
      name: taskForm.name.trim(),
      projectId: taskForm.projectId || null,
      status: taskForm.status,
      priority: taskForm.priority,
      assigneeId: taskForm.assigneeId || null,
      dueDate: taskForm.dueDate || null,
      progress: Number(taskForm.progress || 0),
      estimatedMinutes: Number(taskForm.estimatedMinutes || 0),
      taskType: taskForm.taskType || "task",
      labels: String(taskForm.labels || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    try {
      setTaskSaving(true);

      if (editingWorkspaceTask?.id) {
        await updateTeamWorkspaceTask(
          selectedTeamId,
          editingWorkspaceTask.id,
          payload,
        );
      } else {
        await createTeamWorkspaceTask(selectedTeamId, payload);
      }

      setTaskModalOpen(false);
      setEditingWorkspaceTask(null);
      await Promise.all([loadWorkspaceOverview(), loadWorkspaceTasks()]);
    } catch (error) {
      console.error("SAVE TEAM TASK ERROR", error);
      window.alert(error?.message || "Could not save task.");
    } finally {
      setTaskSaving(false);
    }
  };

  const removeWorkspaceTask = async (task) => {
    if (!selectedTeamId || !task?.id) return;

    if (!window.confirm(`Delete task "${task.name}"?`)) {
      return;
    }

    try {
      await deleteTeamWorkspaceTask(selectedTeamId, task.id);

      await Promise.all([loadWorkspaceOverview(), loadWorkspaceTasks()]);
    } catch (error) {
      console.error("DELETE TEAM TASK ERROR", error);
      window.alert(error?.message || "Could not delete task.");
    }
  };

  const changeWorkspaceTaskStatus = async (task, status) => {
    if (!selectedTeamId || !task?.id) return;

    try {
      await moveTeamWorkspaceTask(selectedTeamId, task.id, status);

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
        workspaceTab === "Board"
          ? loadWorkspaceBoardTasks()
          : Promise.resolve(),
        workspaceTab === "Reports"
          ? loadWorkspaceReports()
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("MOVE TEAM TASK ERROR", error);
      window.alert(error?.message || "Could not update task status.");
    }
  };

  const moveWorkspaceBoardTask = async (task, nextStatus) => {
    if (
      !selectedTeamId ||
      !task?.id ||
      !nextStatus ||
      task.status === nextStatus
    ) {
      setWorkspaceBoardDraggingId(null);
      setWorkspaceBoardOverStatus(null);
      return;
    }

    const previousTasks = workspaceBoardTasks;

    setWorkspaceBoardTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    setWorkspaceBoardDraggingId(null);
    setWorkspaceBoardOverStatus(null);

    try {
      await moveTeamWorkspaceTask(
        selectedTeamId,
        task.id,
        nextStatus,
      );

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
        loadWorkspaceBoardTasks(),
        workspaceTab === "Reports"
          ? loadWorkspaceReports()
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("BOARD MOVE TASK ERROR", error);
      setWorkspaceBoardTasks(previousTasks);
      window.alert(error?.message || "Could not move task.");
    }
  };

  const handleWorkspaceBoardDrop = (event, nextStatus) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("text/team-board-task-id") ||
      workspaceBoardDraggingId;

    const task = workspaceBoardTasks.find(
      (item) => String(item.id) === String(taskId),
    );

    if (task) {
      moveWorkspaceBoardTask(task, nextStatus);
    } else {
      setWorkspaceBoardDraggingId(null);
      setWorkspaceBoardOverStatus(null);
    }
  };


  const openWorkspaceTaskDetail = (task) => {
    setSelectedWorkspaceTask(task);
    setTaskDetailOpen(true);
    setTaskMoreOpenId(null);
  };

  const addWorkspaceTaskTime = (task) => {
    if (!task?.id) return;

    setTimeTask(task);
    setTimeForm({
      minutes: 30,
      note: "",
    });
    setTimeModalOpen(true);
    setTaskMoreOpenId(null);
  };

  const saveWorkspaceTaskTime = async (event) => {
    event?.preventDefault?.();

    if (!selectedTeamId || !timeTask?.id) return;

    const minutes = Number(timeForm.minutes || 0);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      window.alert("Minutes must be greater than 0.");
      return;
    }

    try {
      setTimeSaving(true);

      await logTeamWorkspaceTime(
        selectedTeamId,
        timeTask.id,
        {
          minutes,
          note: String(timeForm.note || "").trim() || null,
        },
      );

      setTimeModalOpen(false);
      setTimeTask(null);

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
      ]);
    } catch (error) {
      console.error("LOG TEAM TIME ERROR", error);
      window.alert(error?.message || "Could not log time.");
    } finally {
      setTimeSaving(false);
    }
  };

  const duplicateWorkspaceTask = async (task) => {
    if (!selectedTeamId || !task?.id) return;

    try {
      await createTeamWorkspaceTask(selectedTeamId, {
        name: `${task.name} Copy`,
        projectId: task.projectId || null,
        status: "pending",
        priority: task.priority || "medium",
        assigneeId: task.assigneeId || null,
        dueDate: task.dueDate || null,
        progress: 0,
        estimatedMinutes: Number(task.estimatedMinutes || 0),
        taskType: task.taskType || "task",
        labels: Array.isArray(task.labels) ? task.labels : [],
      });

      setTaskMoreOpenId(null);

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
      ]);
    } catch (error) {
      console.error("DUPLICATE TEAM TASK ERROR", error);
      window.alert(error?.message || "Could not duplicate task.");
    }
  };

  const csvEscape = (value) => {
    const text = value == null ? "" : String(value);

    return /[",\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  };

  const exportWorkspaceTasks = async () => {
    if (!selectedTeamId || taskExporting) return;

    try {
      setTaskExporting(true);

      const rows = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await fetchTeamWorkspaceTasks(
          selectedTeamId,
          {
            ...taskQuery,
            page,
            limit: 100,
          },
        );

        rows.push(...(response?.data || []));

        totalPages = Math.max(
          1,
          Number(response?.pagination?.totalPages || 1),
        );

        page += 1;
      } while (page <= totalPages);

      const headers = [
        "Task Name",
        "Project",
        "Status",
        "Priority",
        "Assignee",
        "Due Date",
        "Progress %",
        "Time Logged Minutes",
        "Estimated Minutes",
        "Task Type",
        "Labels",
        "Last Activity",
      ];

      const csvRows = rows.map((task) => [
        task.name,
        task.project || "",
        task.status || "",
        task.priority || "",
        task.assignee || "",
        task.dueDate || "",
        Number(task.progress || 0),
        Number(task.loggedMinutes || 0),
        Number(task.estimatedMinutes || 0),
        task.taskType || "task",
        Array.isArray(task.labels) ? task.labels.join("|") : "",
        task.updatedAt || "",
      ]);

      const csv = [
        headers.map(csvEscape).join(","),
        ...csvRows.map((row) => row.map(csvEscape).join(",")),
      ].join("\n");

      const blob = new Blob([`\uFEFF${csv}`], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `team-tasks-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("EXPORT TEAM TASKS ERROR", error);
      window.alert(error?.message || "Could not export tasks.");
    } finally {
      setTaskExporting(false);
    }
  };

  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;

        row.push(cell);

        if (row.some((value) => String(value).trim() !== "")) {
          rows.push(row);
        }

        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    row.push(cell);

    if (row.some((value) => String(value).trim() !== "")) {
      rows.push(row);
    }

    return rows;
  };

  const normalizeImportStatus = (value) => {
    const normalized = String(value || "pending")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    const map = {
      todo: "pending",
      to_do: "pending",
      pending: "pending",
      progress: "in_progress",
      in_progress: "in_progress",
      review: "review",
      on_hold: "on_hold",
      hold: "on_hold",
      completed: "completed",
      complete: "completed",
      done: "completed",
      cancelled: "cancelled",
      canceled: "cancelled",
    };

    return map[normalized] || "pending";
  };

  const importWorkspaceTasks = async (event) => {
    const file = event?.target?.files?.[0];

    if (!file || !selectedTeamId) return;

    try {
      setTaskImporting(true);

      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        throw new Error("CSV does not contain any task rows.");
      }

      const headers = rows[0].map((header) =>
        String(header || "")
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase(),
      );

      const indexOf = (...names) =>
        headers.findIndex((header) => names.includes(header));

      const nameIndex = indexOf("task name", "name", "title");
      const projectIndex = indexOf("project", "project name");
      const statusIndex = indexOf("status");
      const priorityIndex = indexOf("priority");
      const assigneeIndex = indexOf("assignee", "assigned to");
      const dueDateIndex = indexOf("due date", "due");
      const progressIndex = indexOf("progress %", "progress");
      const estimateIndex = indexOf(
        "estimated minutes",
        "time est.",
        "estimate",
      );
      const taskTypeIndex = indexOf("task type", "type");
      const labelsIndex = indexOf("labels", "label");

      if (nameIndex < 0) {
        throw new Error(
          'CSV must contain a "Task Name" column.',
        );
      }

      const dataRows = rows
        .slice(1)
        .filter((row) => String(row[nameIndex] || "").trim());

      if (!dataRows.length) {
        throw new Error("CSV does not contain any valid tasks.");
      }

      let created = 0;
      const failures = [];

      for (let offset = 0; offset < dataRows.length; offset += 10) {
        const batch = dataRows.slice(offset, offset + 10);

        const results = await Promise.allSettled(
          batch.map(async (row) => {
            const projectName =
              projectIndex >= 0
                ? String(row[projectIndex] || "").trim()
                : "";

            const assigneeName =
              assigneeIndex >= 0
                ? String(row[assigneeIndex] || "").trim()
                : "";

            const project =
              workspaceProjects.find(
                (item) =>
                  String(item.name || "").trim().toLowerCase() ===
                  projectName.toLowerCase(),
              ) || null;

            const assignee =
              workspaceMembers.find(
                (item) =>
                  String(item.name || "").trim().toLowerCase() ===
                  assigneeName.toLowerCase(),
              ) || null;

            const rawPriority =
              priorityIndex >= 0
                ? String(row[priorityIndex] || "medium")
                    .trim()
                    .toLowerCase()
                : "medium";

            const priority = [
              "low",
              "medium",
              "high",
              "urgent",
            ].includes(rawPriority)
              ? rawPriority
              : "medium";

            const labels =
              labelsIndex >= 0
                ? String(row[labelsIndex] || "")
                    .split(/[|;]/)
                    .map((label) => label.trim())
                    .filter(Boolean)
                : [];

            return createTeamWorkspaceTask(
              selectedTeamId,
              {
                name: String(row[nameIndex] || "").trim(),
                projectId: project?.id || null,
                status:
                  statusIndex >= 0
                    ? normalizeImportStatus(row[statusIndex])
                    : "pending",
                priority,
                assigneeId: assignee?.id || null,
                dueDate:
                  dueDateIndex >= 0 &&
                  String(row[dueDateIndex] || "").trim()
                    ? String(row[dueDateIndex]).trim()
                    : null,
                progress:
                  progressIndex >= 0
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          Number(row[progressIndex] || 0),
                        ),
                      )
                    : 0,
                estimatedMinutes:
                  estimateIndex >= 0
                    ? Math.max(
                        0,
                        Number(row[estimateIndex] || 0),
                      )
                    : 0,
                taskType:
                  taskTypeIndex >= 0
                    ? String(row[taskTypeIndex] || "task")
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "_")
                    : "task",
                labels,
              },
            );
          }),
        );

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            created += 1;
          } else {
            failures.push({
              row: offset + index + 2,
              error:
                result.reason?.message ||
                "Could not create task",
            });
          }
        });
      }

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
      ]);

      window.alert(
        failures.length
          ? `Imported ${created} task(s). ${failures.length} row(s) failed.`
          : `Imported ${created} task(s) successfully.`,
      );
    } catch (error) {
      console.error("IMPORT TEAM TASKS ERROR", error);
      window.alert(error?.message || "Could not import tasks.");
    } finally {
      setTaskImporting(false);

      if (taskImportInputRef.current) {
        taskImportInputRef.current.value = "";
      }
    }
  };


  const resetWorkspaceProjectForm = () => {
    setProjectForm(emptyProjectForm);
    setEditingWorkspaceProject(null);
  };

  const openNewWorkspaceProject = () => {
    resetWorkspaceProjectForm();
    setProjectModalOpen(true);
    setNewMenuOpen(false);
  };

  const openEditWorkspaceProject = (project) => {
    setEditingWorkspaceProject(project);
    setProjectForm({
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "active",
      priority: project?.priority || "medium",
      ownerId: project?.ownerId || "",
      startDate: inputDateValue(project?.startDate),
      dueDate: inputDateValue(project?.dueDate),
      progress: Number(project?.progress || 0),
    });
    setProjectModalOpen(true);
    setProjectDetailOpen(false);
  };

  const openWorkspaceProjectDetail = async (project) => {
    if (!selectedTeamId || !project?.id) return;

    try {
      setProjectDetailLoading(true);
      setSelectedWorkspaceProject({
        ...project,
        tasks: [],
        timeEntries: [],
      });
      setProjectDetailOpen(true);

      const detail = await fetchTeamWorkspaceProjectDetail(
        selectedTeamId,
        project.id,
      );

      setSelectedWorkspaceProject(detail || project);
    } catch (error) {
      console.error("LOAD PROJECT DETAIL ERROR", error);
      window.alert(error?.message || "Could not load project details.");
      setProjectDetailOpen(false);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const saveWorkspaceProject = async (event) => {
    event?.preventDefault?.();

    if (!selectedTeamId || !projectForm.name.trim()) return;

    const payload = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
      status: projectForm.status || "active",
      priority: projectForm.priority || "medium",
      ownerId: projectForm.ownerId || null,
      startDate: projectForm.startDate || null,
      dueDate: projectForm.dueDate || null,
      progress: Math.max(
        0,
        Math.min(100, Number(projectForm.progress || 0)),
      ),
    };

    try {
      setProjectSaving(true);

      let savedProject;

      if (editingWorkspaceProject?.id) {
        savedProject = await updateTeamWorkspaceProject(
          selectedTeamId,
          editingWorkspaceProject.id,
          payload,
        );
      } else {
        savedProject = await createTeamWorkspaceProject(
          selectedTeamId,
          payload,
        );
      }

      setProjectModalOpen(false);
      resetWorkspaceProjectForm();
      setNewMenuOpen(false);

      await Promise.all([
        loadWorkspaceOverview(),
        workspaceTab === "Reports"
          ? loadWorkspaceReports()
          : Promise.resolve(),
      ]);

      if (
        projectDetailOpen &&
        savedProject?.id &&
        selectedWorkspaceProject?.id === savedProject.id
      ) {
        await openWorkspaceProjectDetail(savedProject);
      }
    } catch (error) {
      console.error("SAVE TEAM PROJECT ERROR", error);
      window.alert(error?.message || "Could not save project.");
    } finally {
      setProjectSaving(false);
    }
  };

  const removeWorkspaceProject = async (project) => {
    if (!selectedTeamId || !project?.id || projectDeletingId) return;

    const confirmed = window.confirm(
      `Delete project "${project.name}"?\n\nTasks and time history will be kept and unassigned from the project.`,
    );

    if (!confirmed) return;

    try {
      setProjectDeletingId(project.id);

      await deleteTeamWorkspaceProject(
        selectedTeamId,
        project.id,
      );

      if (selectedWorkspaceProject?.id === project.id) {
        setProjectDetailOpen(false);
        setSelectedWorkspaceProject(null);
      }

      await Promise.all([
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
        workspaceTab === "Reports"
          ? loadWorkspaceReports()
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("DELETE TEAM PROJECT ERROR", error);
      window.alert(error?.message || "Could not delete project.");
    } finally {
      setProjectDeletingId(null);
    }
  };

  const goToProjectTasks = (project) => {
    setWorkspaceProject(project.id);
    setWorkspaceTaskPage(1);
    setWorkspaceTab("Tasks");
    setWorkspaceTaskView("table");
    setProjectDetailOpen(false);
  };

  const goToProjectFiles = (project) => {
    setWorkspaceFileProject(project.id);
    setWorkspaceFileTask("all");
    setWorkspaceTab("Files");
    setProjectDetailOpen(false);
  };

  const goToProjectTime = (project) => {
    setWorkspaceTimeProject(project.id);
    setWorkspaceTimeTask("all");
    setWorkspaceTimePage(1);
    setWorkspaceTab("Time Tracking");
    setProjectDetailOpen(false);
  };

  const filteredWorkspaceProjects = workspaceProjects.filter((project) => {
    const q = projectSearch.trim().toLowerCase();

    if (
      q &&
      ![
        project?.name,
        project?.description,
        project?.ownerName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    ) {
      return false;
    }

    if (
      projectStatusFilter !== "all" &&
      String(project?.status || "active").toLowerCase() !== projectStatusFilter
    ) {
      return false;
    }

    if (
      projectPriorityFilter !== "all" &&
      String(project?.priority || "medium").toLowerCase() !== projectPriorityFilter
    ) {
      return false;
    }

    return true;
  });


  const loadWorkspaceFiles = async () => {
    if (!selectedTeamId) {
      setWorkspaceFiles([]);
      return;
    }

    try {
      setWorkspaceFilesLoading(true);

      const [files, taskOptions] = await Promise.all([
        fetchTeamWorkspaceFiles(selectedTeamId, {
          q: workspaceFileSearch || undefined,
          projectId:
            workspaceFileProject !== "all" ? workspaceFileProject : undefined,
          taskId:
            workspaceFileTask !== "all" ? workspaceFileTask : undefined,
        }),
        fetchTeamWorkspaceTasks(selectedTeamId, {
          page: 1,
          limit: 100,
        }),
      ]);

      setWorkspaceFiles(Array.isArray(files) ? files : files?.data || []);
      setWorkspaceFileTaskOptions(taskOptions?.data || []);
    } catch (error) {
      console.error("LOAD TEAM FILES ERROR", error);
      setWorkspaceFiles([]);
    } finally {
      setWorkspaceFilesLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceTab !== "Files" || !selectedTeamId) return;

    const timer = window.setTimeout(() => {
      loadWorkspaceFiles();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    workspaceTab,
    selectedTeamId,
    workspaceFileSearch,
    workspaceFileProject,
    workspaceFileTask,
  ]);

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  const uploadWorkspaceFile = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || !selectedTeamId) return;

    try {
      setWorkspaceFileUploading(true);
      await uploadTeamWorkspaceFile(selectedTeamId, file, {
        projectId:
          workspaceFileProject !== "all" ? workspaceFileProject : undefined,
        taskId:
          workspaceFileTask !== "all" ? workspaceFileTask : undefined,
      });
      await loadWorkspaceFiles();
    } catch (error) {
      console.error("UPLOAD TEAM FILE ERROR", error);
      window.alert(error?.message || "Could not upload file.");
    } finally {
      setWorkspaceFileUploading(false);
      if (workspaceFileInputRef.current) {
        workspaceFileInputRef.current.value = "";
      }
    }
  };

  const openWorkspaceFile = async (file) => {
    if (!selectedTeamId || !file?.id) return;

    try {
      const response = await getTeamWorkspaceFileUrl(selectedTeamId, file.id);
      const url = response?.url || response;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("OPEN TEAM FILE ERROR", error);
      window.alert(error?.message || "Could not open file.");
    }
  };

  const removeWorkspaceFile = async (file) => {
    if (!selectedTeamId || !file?.id) return;
    if (!window.confirm(`Delete file "${file.originalName}"?`)) return;

    try {
      await deleteTeamWorkspaceFile(selectedTeamId, file.id);
      await loadWorkspaceFiles();
    } catch (error) {
      console.error("DELETE TEAM FILE ERROR", error);
      window.alert(error?.message || "Could not delete file.");
    }
  };

  const calendarDateKey = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadWorkspaceCalendar = async () => {
    if (!selectedTeamId) {
      setCalendarTasks([]);
      return;
    }

    try {
      setCalendarLoading(true);
      const rows = [];
      let page = 1;
      let totalPages = 1;

      do {
        const response = await fetchTeamWorkspaceTasks(selectedTeamId, {
          page,
          limit: 100,
        });
        rows.push(...(response?.data || []));
        totalPages = Math.max(1, Number(response?.pagination?.totalPages || 1));
        page += 1;
      } while (page <= totalPages);

      setCalendarTasks(rows);
    } catch (error) {
      console.error("TEAM CALENDAR ERROR", error);
      setCalendarTasks([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceTab !== "Calendar" || !selectedTeamId) return;
    loadWorkspaceCalendar();
  }, [workspaceTab, selectedTeamId]);

  const calendarEvents = useMemo(() => {
    const events = [];

    calendarTasks.forEach((task) => {
      const dateKey = calendarDateKey(task?.dueDate);
      if (!dateKey) return;
      events.push({
        id: `task-${task.id}`,
        type: "task",
        dateKey,
        title: task.name || "Untitled task",
        status: task.status || "pending",
        priority: task.priority || "medium",
        project: task.project || "No project",
        source: task,
      });
    });

    workspaceProjects.forEach((project) => {
      const startKey = calendarDateKey(project?.startDate);
      const dueKey = calendarDateKey(project?.dueDate);

      if (startKey) {
        events.push({
          id: `project-start-${project.id}`,
          type: "project-start",
          dateKey: startKey,
          title: project.name || "Untitled project",
          status: project.status || "active",
          priority: project.priority || "medium",
          project: "Project start",
          source: project,
        });
      }

      if (dueKey) {
        events.push({
          id: `project-due-${project.id}`,
          type: "project-due",
          dateKey: dueKey,
          title: project.name || "Untitled project",
          status: project.status || "active",
          priority: project.priority || "medium",
          project: "Project deadline",
          source: project,
        });
      }
    });

    return events;
  }, [calendarTasks, workspaceProjects]);

  const calendarMonthLabel = calendarDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = calendarDateKey(date);
      return {
        date,
        dateKey,
        currentMonth: date.getMonth() === month,
        events: calendarEvents.filter((event) => event.dateKey === dateKey),
      };
    });
  }, [calendarDate, calendarEvents]);

  const changeCalendarMonth = (offset) => {
    setCalendarDate((current) =>
      new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
    setCalendarSelectedDay(null);
  };

  const goCalendarToday = () => {
    const now = new Date();
    setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setCalendarSelectedDay(calendarDateKey(now));
  };

  const openCalendarEvent = (event) => {
    if (event.type === "task") {
      openWorkspaceTaskDetail(event.source);
      return;
    }
    openWorkspaceProjectDetail(event.source);
  };

  const moveTaskToCalendarDate = async (task, dateKey) => {
    if (!selectedTeamId || !task?.id || !dateKey) return;
    try {
      await updateTeamWorkspaceTask(selectedTeamId, task.id, {
        dueDate: dateKey,
      });
      await Promise.all([
        loadWorkspaceCalendar(),
        loadWorkspaceOverview(),
        loadWorkspaceTasks(),
      ]);
    } catch (error) {
      console.error("MOVE CALENDAR TASK ERROR", error);
      window.alert(error?.message || "Could not change the task due date.");
    }
  };


  const workspaceTeamPerformanceRows = useMemo(() => {
    const reportRows = Array.isArray(workspaceReports?.members)
      ? workspaceReports.members
      : [];

    const workloadMap = new Map(
      workloadRows.map((row) => [
        String(row.id || row.userId || row.user_id || ""),
        row,
      ]),
    );

    return workspaceMembers.map((member) => {
      const report =
        reportRows.find(
          (row) => String(row.id) === String(member.id),
        ) || {};

      const workload =
        workloadMap.get(String(member.id)) || {};

      const ownedProjects = workspaceProjects.filter(
        (project) =>
          String(project.ownerId || "") === String(member.id),
      ).length;

      return {
        ...member,
        assigned: Number(report.assigned || workload.totalTasks || 0),
        completed: Number(report.completed || workload.completedTasks || 0),
        completionRate: Number(report.completionRate || 0),
        onTimeRate: Number(report.onTimeRate || 0),
        avgProgress: Number(report.avgProgress || 0),
        loggedMinutes: Number(report.loggedMinutes || 0),
        workloadPercent: Number(workload.workloadPercent || 0),
        openTasks: Number(workload.openTasks || 0),
        ownedProjects,
      };
    });
  }, [
    workspaceMembers,
    workspaceReports,
    workloadRows,
    workspaceProjects,
  ]);

  const workspaceTeamTotals = useMemo(() => {
    return workspaceTeamPerformanceRows.reduce(
      (summary, member) => {
        summary.assigned += member.assigned;
        summary.completed += member.completed;
        summary.loggedMinutes += member.loggedMinutes;
        summary.openTasks += member.openTasks;
        return summary;
      },
      {
        assigned: 0,
        completed: 0,
        loggedMinutes: 0,
        openTasks: 0,
      },
    );
  }, [workspaceTeamPerformanceRows]);

  /* =====================================================
    LOADING
  ===================================================== */

  if (loading) {
    return <div className="team-page-loading">Loading team workspace...</div>;
  }

  const handleOpenAIInsights = async () => {
    setShowAIInsights(true);

    setAiLoading(true);

    setAiError(null);

    try {
      const data = await fetchTeamAIInsights(selectedTeamId);

      setAiInsights(data);
    } catch (err) {
      console.error(err);

      //setAiError("Unable to load AI team insights right now.");

      /* FALLBACK */

      setAiInsights({
        teamHealthScore: 0,

        summary:
          "AI insights are being prepared. Connect team activity, leads, and pipeline data to unlock full recommendations.",

        risks: [],

        recommendations: [],

        nextActions: [],
      });
    } finally {
      setAiLoading(false);
    }
  };
  const handleOpenChangeRole = (member) => {
    setRoleMember(member);
    setRoleModalOpen(true);
  };

  const handleCloseChangeRole = () => {
    if (roleUpdating) return;

    setRoleModalOpen(false);
    setRoleMember(null);
  };

  const handleChangeRole = async ({ memberId, role }) => {
    if (!selectedTeamId || !memberId || !role) {
      return false;
    }

    const previousRole = roleMember?.role || "agent";

    try {
      setRoleUpdating(true);

      updateMemberRoleLocally(memberId, role);

      const response = await updateTeamMemberRole(
        selectedTeamId,
        memberId,
        role,
      );

      const updatedMember =
        response?.member || response?.data?.member || response?.data || null;

      if (updatedMember?.role) {
        updateMemberRoleLocally(memberId, updatedMember.role);
      }

      setRoleModalOpen(false);
      setRoleMember(null);

      await Promise.all([reloadMembers(), reloadDashboard()]);

      return true;
    } catch (error) {
      console.error("CHANGE MEMBER ROLE ERROR", error);

      updateMemberRoleLocally(memberId, previousRole);

      return false;
    } finally {
      setRoleUpdating(false);
    }
  };

  // "Add a seat" opens a confirmation first (each seat is a $97/month charge).
  const handleAddSeatClick = () => {
    if (addingSeat) return;
    setAddSeatError("");
    setAddSeatConfirmOpen(true);
  };

  const handleAddSeatConfirmed = async () => {
    if (addingSeat) return;
    // An admin/test account that owns no team has no selectedTeamId, so the
    // button used to dead-click. Explain why, right in the modal, instead of
    // doing nothing.
    if (!selectedTeamId) {
      setAddSeatError("Select or create a team before adding a seat.");
      return;
    }
    setAddSeatError("");
    try {
      setAddingSeat(true);
      await purchaseSeat();
      await reloadDashboard();
      setAddSeatConfirmOpen(false);
      setNoSeatsOpen(false);
      showSeatToast(
        "Your subscription has been updated. You now have 1 available seat.",
        "success",
      );
    } catch (error) {
      console.error("ADD TEAM SEAT ERROR", error);
      // Keep the modal open and show the reason in place (e.g. the backend's
      // "No active Paddle subscription was found for this team.") so it never
      // looks like the button silently failed.
      setAddSeatError(error?.message || "Could not add a seat.");
    } finally {
      setAddingSeat(false);
    }
  };

  // Invite only when a seat is free; otherwise prompt to add one first.
  const handleOpenInvite = () => {
    const available = Number(seatInfo?.available ?? 0);
    if (available <= 0) {
      setNoSeatsOpen(true);
      return;
    }
    setInviteModalOpen(true);
  };

  const handleKeepSeat = () => setKeepRemoveSeatOpen(false);

  const handleRemoveSeat = async () => {
    if (seatBusy) return;
    try {
      setSeatBusy(true);
      await removeSeatBilling();
      await reloadDashboard();
      setKeepRemoveSeatOpen(false);
      showSeatToast("Seat removed from your subscription.", "success");
    } catch (error) {
      console.error("REMOVE TEAM SEAT ERROR", error);
      showSeatToast(error?.message || "Could not remove the seat.", "error");
    } finally {
      setSeatBusy(false);
    }
  };

  const memberNames = workloadRows.slice(0, 7).map((m) => ({
    name: m?.name || m?.email || "Team member",
    value: Number(m?.workloadPercent || 0),
  }));

  const dashboardStats = [
    [
      "Active Projects",
      workspaceMetrics.activeProjects ?? 0,
      "Currently active",
      "",
      FolderKanban,
    ],
    [
      "Tasks Assigned",
      workspaceMetrics.tasksAssigned ?? 0,
      "All team tasks",
      "",
      ListTodo,
    ],
    [
      "Tasks Completed",
      workspaceMetrics.tasksCompleted ?? 0,
      "Completed tasks",
      "",
      CheckCircle2,
    ],
    [
      "Completion Rate",
      `${Number(workspaceMetrics.completionRate || 0).toFixed(1)}%`,
      "All tasks",
      "",
      Flag,
    ],
    [
      "On Time",
      `${Number(workspaceMetrics.onTimeRate || 0).toFixed(1)}%`,
      "Completed on time",
      "",
      Clock3,
    ],
    [
      "Team Productivity",
      `${Number(workspaceMetrics.productivity || 0).toFixed(1)}%`,
      "Task completion average",
      "",
      Users,
    ],
    [
      "Hours Logged",
      `${Number(workspaceMetrics.hoursLogged || 0).toLocaleString()}h`,
      "Tracked time",
      "",
      Timer,
    ],
    [
      "Workload Balance",
      `${Number(workspaceMetrics.workloadBalance ?? 100)}%`,
      "Across active members",
      "",
      LayoutGrid,
    ],
  ];

  const mobileMainTabs = WORKSPACE_TABS.slice(0, 5);
  const mobileMoreTabs = WORKSPACE_TABS.slice(5);

  const switchWorkspaceTab = (label) => {
    setWorkspaceTab(label);
    setWorkspaceMobileMoreOpen(false);
    if (label === "Board") setWorkspaceTaskView("board");
    if (label === "Tasks" || label === "My Tasks") setWorkspaceTaskView("table");
    if (label === "Calendar") setWorkspaceTaskView("calendar");
  };

  const mobileBoardColumns = [
    { key: "pending", label: "To Do", tone: "blue", Icon: ListTodo },
    { key: "in_progress", label: "In Progress", tone: "green", Icon: LayoutGrid },
    { key: "review", label: "Review", tone: "orange", Icon: Search },
    { key: "completed", label: "Completed", tone: "purple", Icon: CheckCircle2 },
  ];

  const mobileTaskTone = (task, index = 0) => {
    const status = String(task?.status || "").toLowerCase();
    if (status === "in_progress") return "green";
    if (status === "review") return "orange";
    if (status === "completed") return "purple";
    if (status === "on_hold" || status === "blocked") return "purple";
    return ["blue", "green", "orange", "purple", "cyan"][index % 5];
  };

  const mobileProjectTone = (index = 0) => ["blue", "green", "orange", "purple", "cyan"][index % 5];

  return (
    <div className="team-workspace">
      <div className="tw-mobile-shell">
        <section className="tw-mobile-hero">
          <div className="tw-mobile-hero-icon"><Users size={32} /></div>
          <div className="tw-mobile-hero-copy">
            <h1>Team Workspace</h1>
            <p>Plan, organize, and execute internal projects with your team.</p>
          </div>
          <button type="button" className="tw-mobile-new" onClick={() => setNewMenuOpen((v) => !v)}>
            <Plus size={22} /> <span>New</span>
          </button>
        </section>

        <div className="tw-mobile-tabs-wrap">
          <nav className="tw-mobile-tabs">
            {mobileMainTabs.map(({ label, icon: TabIcon }) => (
              <button key={label} type="button" className={workspaceTab === label ? "active" : ""} onClick={() => switchWorkspaceTab(label)}>
                <TabIcon size={18} strokeWidth={1.9} />
                <span>{label}</span>
              </button>
            ))}
            <button type="button" className={`tw-mobile-more-tab ${workspaceMobileMoreOpen ? "more-open" : ""} ${mobileMoreTabs.some((tab) => tab.label === workspaceTab) ? "active more-active" : ""}`} onClick={() => setWorkspaceMobileMoreOpen((v) => !v)}>
              <MoreVertical size={18} /> <span>More</span>
            </button>
          </nav>
          {workspaceMobileMoreOpen && (
            <div className="sales-ws-tabs-mobile-more-menu tw-mobile-more-menu">
              {mobileMoreTabs.map(({ label, icon: TabIcon }) => (
                <button key={label} type="button" className={workspaceTab === label ? "active" : ""} onClick={() => switchWorkspaceTab(label)}>
                  <TabIcon size={15} /><span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {workspaceTab === "Overview" && (
          <section className="tw-mobile-page tw-mobile-overview">
            <header className="tw-mobile-overview-head">
              <div><LayoutGrid size={22}/><h2>Team Overview</h2></div>
              <p>Real-time overview of your team and project performance.</p>
            </header>
            <div className="tw-mobile-overview-list">
              {dashboardStats.map(([label, value, sub, change, Icon], index) => (
                <article className={`tw-mobile-overview-card tone-${mobileProjectTone(index)}`} key={label}>
                  <div className="tw-mobile-overview-icon"><Icon size={30}/></div>
                  <div className="tw-mobile-overview-value"><b>{label}</b><strong>{value}</strong><span>{sub}</span>{change ? <small>↑ {change}</small> : null}</div>
                </article>
              ))}
            </div>
          </section>
        )}

        {workspaceTab === "Projects" && (
          <section className="tw-mobile-page tw-mobile-projects">
            <header className="tw-mobile-section-head">
              <div className="tw-mobile-title"><FolderKanban size={24}/><div><h2>Projects</h2><p>Manage all team projects in one place.</p></div></div>
              <div className="tw-mobile-head-actions"><button type="button"><SlidersHorizontal size={17}/> Filters</button><button type="button"><RotateCcw size={17}/> Sort</button></div>
            </header>
            <label className="tw-mobile-search"><Search size={20}/><input value={projectSearch} onChange={(e)=>setProjectSearch(e.target.value)} placeholder="Search projects..."/></label>
            <div className="tw-mobile-project-list">
              {filteredWorkspaceProjects.slice(0,5).map((project,index)=>{
                const tasks=Number(project.taskCount||0); const completed=Number(project.completedTasks||0); const tone=mobileProjectTone(index);
                return <article className={`tw-mobile-project-card tone-${tone}`} key={project.id} onClick={()=>openWorkspaceProjectDetail(project)}>
                  <div className="tw-mobile-project-icon"><FolderKanban size={30}/></div>
                  <div className="tw-mobile-project-main"><h3>{project.name}</h3><p>{project.description || "No description"}</p><div className="tw-mobile-project-people"><span>{String(project.ownerName||"TM").split(" ").map(x=>x[0]).join("").slice(0,2)}</span><span className="ghost"><Users size={14}/></span></div></div>
                  <div className="tw-mobile-project-meta"><label>Progress</label><div className="tw-mobile-progress"><i><b style={{width:`${Math.min(100,Number(project.progress||0))}%`}}/></i><strong>{Number(project.progress||0)}%</strong></div><div className="tw-mobile-project-stats"><span><small>Tasks</small><b>{completed} / {tasks}</b></span><span><small>Team</small><b>{project.memberCount || project.teamCount || 1}</b></span><span><small>Due Date</small><b>{formatDate(project.dueDate)}</b></span></div></div>
                  <ChevronRight className="tw-mobile-card-arrow" size={24}/>
                </article>
              })}
            </div>
            <button type="button" className="tw-mobile-wide-new" onClick={openNewWorkspaceProject}><Plus size={19}/> New Project</button>
            <div className="tw-mobile-summary"><div><BarChart3 size={25}/><span><b>Projects Summary</b><small>Overview of all projects</small></span></div><strong>Total Projects <em>{workspaceProjects.length}</em></strong><section>{[['In Progress', workspaceProjects.filter(p=>String(p.status||'').toLowerCase()==='active').length],['On Track', workspaceProjects.filter(p=>Number(p.progress||0)>=50).length],['At Risk', workspaceProjects.filter(p=>String(p.priority||'').toLowerCase()==='urgent').length],['Completed', workspaceProjects.filter(p=>String(p.status||'').toLowerCase()==='completed').length]].map(([l,v],i)=><span className={`tone-${mobileProjectTone(i)}`} key={l}><small>{l}</small><b>{v}</b></span>)}</section></div>
          </section>
        )}

        {workspaceTab === "Board" && (
          <section className="tw-mobile-page tw-mobile-board">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><Columns3 size={24}/><div><h2>Board</h2><p>Visualize and manage project workflow.</p></div></div><div className="tw-mobile-head-actions"><button><SlidersHorizontal size={17}/> Filters</button><button><RotateCcw size={17}/> Sort</button></div></header>
            <div className="tw-mobile-board-list">
              {mobileBoardColumns.map(({key,label,tone,Icon})=>{const items=workspaceBoardTasks.filter(t=>String(t.status||'pending')===key);const overdue=items.filter(t=>t.dueDate && new Date(t.dueDate).getTime()<Date.now()).length;const high=items.filter(t=>['high','urgent'].includes(String(t.priority||'').toLowerCase())).length;return <article className={`tw-mobile-board-card tone-${tone}`} key={key}><div className="tw-mobile-board-icon"><Icon size={34}/></div><div className="tw-mobile-board-copy"><div><h3>{label}</h3><b>{items.length}</b></div><p>{key==='pending'?'Tasks that are planned but not yet started.':key==='in_progress'?'Tasks that are currently in progress.':key==='review'?'Tasks that are under review or approval.':'Tasks that have been completed.'}</p><small><Users size={15}/> {new Set(items.map(x=>x.assigneeId||x.assignee).filter(Boolean)).size} Assignees</small></div><div className="tw-mobile-board-metrics"><span><small>Tasks</small><b>{items.length}</b></span><span><small>Overdue</small><b className="danger">{overdue}</b></span><span><small>High Priority</small><b className="warn">{high}</b></span></div><ChevronRight size={24}/></article>})}
            </div>
            <div className="tw-mobile-board-summary"><div className="title"><BarChart3 size={24}/><span><b>Board Summary</b><small>Overview of all tasks by status</small></span><strong>Total Tasks <em>{workspaceBoardTasks.length}</em></strong></div><section>{mobileBoardColumns.map(({key,label,tone})=>{const n=workspaceBoardTasks.filter(t=>String(t.status||'pending')===key).length;const pct=workspaceBoardTasks.length?Math.round(n/workspaceBoardTasks.length*100):0;return <span className={`tone-${tone}`} key={key}><small>{label}</small><b>{n}</b><i className="tw-mobile-board-progress" aria-label={`${label} ${pct}%`}><u style={{width:`${pct}%`}}/></i><em>{pct}%</em></span>})}</section></div>
          </section>
        )}

        {workspaceTab === "Tasks" && (
          <section className="tw-mobile-page tw-mobile-tasks">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><ListTodo size={24}/><div><h2>Tasks</h2><p>Manage and track all team tasks</p></div></div><div className="tw-mobile-head-actions"><button onClick={()=>taskImportInputRef.current?.click()}><Upload size={17}/> Import</button><button onClick={exportWorkspaceTasks}><Download size={17}/> Export</button><button className="square"><SlidersHorizontal size={17}/><span>Filters</span></button></div></header>
            <label className="tw-mobile-search"><Search size={20}/><input value={workspaceTaskSearch} onChange={(e)=>setWorkspaceTaskSearch(e.target.value)} placeholder="Search tasks..."/></label>
            <div className="tw-mobile-filter-grid">
              <label className="tw-mobile-filter-control tone-blue">
                <ListTodo />
                <span><b>Status</b></span>
                <select
                  value={workspaceStatus}
                  onChange={(e) => { setWorkspaceStatus(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="tw-mobile-filter-control tone-orange">
                <Flag />
                <span><b>Priority</b></span>
                <select
                  value={workspacePriority}
                  onChange={(e) => { setWorkspacePriority(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks by priority"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="tw-mobile-filter-control tone-green">
                <Users />
                <span><b>Assignee</b></span>
                <select
                  value={workspaceAssignee}
                  onChange={(e) => { setWorkspaceAssignee(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks by assignee"
                >
                  <option value="all">All Assignees</option>
                  {workspaceMembers.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
                </select>
              </label>

              <label className="tw-mobile-filter-control tone-purple">
                <FolderKanban />
                <span><b>Project</b></span>
                <select
                  value={workspaceProject}
                  onChange={(e) => { setWorkspaceProject(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks by project"
                >
                  <option value="all">All Projects</option>
                  {workspaceProjects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
                </select>
              </label>

              <label className="tw-mobile-filter-control tone-cyan">
                <LayoutGrid />
                <span><b>Task Type</b></span>
                <select
                  value={workspaceTaskType}
                  onChange={(e) => { setWorkspaceTaskType(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks by type"
                >
                  <option value="all">All Types</option>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </label>

              <label className="tw-mobile-filter-control tone-red tw-mobile-date-filter">
                <CalendarDays />
                <span><b>Due Date</b></span>
                <input
                  type="date"
                  className={workspaceDateTo ? "has-value" : "is-empty"}
                  value={workspaceDateTo}
                  onChange={(e) => { setWorkspaceDateTo(e.target.value); setWorkspaceTaskPage(1); }}
                  aria-label="Filter tasks due by date"
                />
                {!workspaceDateTo && <small className="tw-mobile-date-placeholder">Any Date</small>}
              </label>
            </div>
            <div className="tw-mobile-filter-foot"><button onClick={resetWorkspaceFilters}><RotateCcw size={15}/> Reset Filters</button><span>Sort: Due Date (Soonest)</span></div>
            <div className="tw-mobile-task-list">{workspaceTasks.slice(0,5).map((task,index)=><article className={`tw-mobile-task-row tone-${mobileTaskTone(task,index)}`} key={task.id}><div className="tw-mobile-task-icon"><ListTodo size={27}/></div><div className="tw-mobile-task-main"><h3>{task.name}</h3><p>Project: <b>{task.project || 'No project'}</b></p><div><span className={`tw-pill status-${String(task.status||'pending').replaceAll('_','-')}`}>{formatTaskStatus(task.status)}</span><span className={`tw-pill priority-${String(task.priority||'medium').toLowerCase()}`}>{formatTaskStatus(task.priority)}</span><span className="tw-assignee"><span className="tw-avatar">{String(task.assignee||'TM').split(' ').map(x=>x[0]).join('').slice(0,2)}</span>{task.assignee||'Unassigned'}</span></div></div><div className="tw-mobile-task-meta"><span><CalendarDays/> {formatDate(task.dueDate)}</span><span><Users/> {Number(task.progress||0)}% <i><b style={{width:`${Number(task.progress||0)}%`}}/></i></span><span><Clock3/> {minutesToText(task.loggedMinutes||task.timeLoggedMinutes||0)}</span></div><button className="tw-mobile-dots"><MoreVertical size={18}/></button></article>)}</div>
            <div className="tw-mobile-simple-pagination"><span>{workspaceTaskPagination.page} of {workspaceTaskPagination.totalPages}</span><button disabled={workspaceTaskPagination.page>=workspaceTaskPagination.totalPages} onClick={()=>setWorkspaceTaskPage(p=>p+1)}><ChevronRight/></button></div>
          </section>
        )}

        {workspaceTab === "My Tasks" && (
          <section className="tw-mobile-page tw-mobile-my-tasks">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><CircleUserRound size={25}/><div><h2>My Tasks</h2><p>Your personal productivity center.</p></div></div><button className="tw-mobile-filter-icon"><SlidersHorizontal size={20}/></button></header>
            <div className="tw-mobile-my-tabs"><button className="active"><CalendarDays/> Today <b>{workspaceTasks.filter(t=>deadlineDistance(t.dueDate)==='Today').length}</b></button><button><Clock3/> Upcoming <b>{workspaceTasks.filter(t=>t.dueDate && new Date(t.dueDate).getTime()>Date.now()).length}</b></button><button><Flag/> Overdue <b>{workspaceTasks.filter(t=>t.dueDate && new Date(t.dueDate).getTime()<Date.now()).length}</b></button></div>
            <label className="tw-mobile-search"><Search size={20}/><input value={workspaceTaskSearch} onChange={(e)=>setWorkspaceTaskSearch(e.target.value)} placeholder="Search my tasks..."/><SlidersHorizontal size={18}/></label>
            <div className="tw-mobile-my-list">{workspaceTasks.slice(0,4).map((task,index)=><article className={`tw-mobile-my-card tone-${mobileTaskTone(task,index)}`} key={task.id}><div className="tw-mobile-task-icon"><ListTodo size={25}/></div><div className="tw-mobile-my-main"><div className="top"><h3>{task.name}</h3><span><CalendarDays/> {deadlineDistance(task.dueDate)||formatDate(task.dueDate)}</span></div><p>Project: <b>{task.project||'No project'}</b></p><small>{task.description||'Manage and complete this assigned task.'}</small><div className="chips"><span className={`tw-pill status-${String(task.status||'pending').replaceAll('_','-')}`}>{formatTaskStatus(task.status)}</span><span className={`tw-pill priority-${String(task.priority||'medium').toLowerCase()}`}>{formatTaskStatus(task.priority)}</span><span className="tw-assignee"><span className="tw-avatar">{String(task.assignee||'TM').split(' ').map(x=>x[0]).join('').slice(0,2)}</span>{task.assignee||'You'}</span><i><b style={{width:`${Number(task.progress||0)}%`}}/></i><em>{Number(task.progress||0)}%</em></div></div><button className="tw-mobile-circle-check" aria-label="complete task"/></article>)}</div>
            <button type="button" className="tw-mobile-wide-new" onClick={openNewWorkspaceTask}><Plus size={18}/> New Task</button>
          </section>
        )}
        {workspaceTab === "Calendar" && (
          <section className="tw-mobile-page tw-mobile-more-page tw-mobile-calendar-page">
            <header className="tw-mobile-section-head">
              <div className="tw-mobile-title"><CalendarDays size={25}/><div><h2>Calendar</h2><p>Tasks and project deadlines in one schedule.</p></div></div>
              <div className="tw-mobile-head-actions"><button type="button" onClick={()=>changeCalendarMonth(-1)}><ChevronLeft size={17}/></button><button type="button" onClick={goCalendarToday}>Today</button><button type="button" onClick={()=>changeCalendarMonth(1)}><ChevronRight size={17}/></button></div>
            </header>
            <div className="tw-mobile-more-summary"><div><CalendarDays/><span><small>Current month</small><strong>{calendarMonthLabel}</strong></span></div><b>{calendarEvents.length}<small>Events</small></b></div>
            <div className="tw-mobile-calendar-week">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day}>{day}</span>)}</div>
            <div className="tw-mobile-calendar-grid">{calendarDays.map(day=><button type="button" key={day.dateKey} className={`${day.currentMonth?"":"muted"} ${calendarSelectedDay===day.dateKey?"active":""}`} onClick={()=>setCalendarSelectedDay(day.dateKey)}><b>{day.date.getDate()}</b>{day.events.length>0&&<i>{day.events.length}</i>}</button>)}</div>
            <div className="tw-mobile-more-list">{calendarEvents.filter(event=>!calendarSelectedDay||event.dateKey===calendarSelectedDay).slice(0,6).map((event,index)=><button type="button" className={`tw-mobile-more-row tone-${mobileProjectTone(index)}`} key={event.id} onClick={()=>openCalendarEvent(event)}><span className="tw-mobile-more-row-icon"><CalendarDays/></span><span className="tw-mobile-more-row-copy"><strong>{event.title}</strong><small>{event.project} · {formatDate(event.dateKey)}</small></span><span className="tw-mobile-more-row-value">{formatTaskStatus(event.status)}</span><ChevronRight/></button>)}</div>
          </section>
        )}

        {workspaceTab === "Time Tracking" && (
          <section className="tw-mobile-page tw-mobile-more-page">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><Clock3 size={25}/><div><h2>Time Tracking</h2><p>Tracked time by member, project, and task.</p></div></div><button className="tw-mobile-filter-icon" type="button"><SlidersHorizontal size={19}/></button></header>
            <label className="tw-mobile-search"><Search size={20}/><input value={workspaceTimeSearch} onChange={(e)=>{setWorkspaceTimeSearch(e.target.value);setWorkspaceTimePage(1)}} placeholder="Search time entries..."/></label>
            <div className="tw-mobile-more-kpis">{[["Hours",`${Number(workspaceTimeData?.summary?.hoursLogged||0).toLocaleString()}h`],["Entries",workspaceTimeData?.summary?.entryCount||0],["Members",workspaceTimeData?.summary?.activeMembers||0],["Projects",workspaceTimeData?.summary?.projectsTracked||0]].map(([label,value],index)=><div className={`tone-${mobileProjectTone(index)}`} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
            <div className="tw-mobile-more-list">{(workspaceTimeData?.data||[]).slice(0,6).map((entry,index)=><article className={`tw-mobile-more-row tone-${mobileProjectTone(index)}`} key={entry.id}><span className="tw-mobile-more-row-icon"><Clock3/></span><span className="tw-mobile-more-row-copy"><strong>{entry.taskName||"Time entry"}</strong><small>{entry.memberName||"—"} · {entry.projectName||"No project"}</small></span><span className="tw-mobile-more-row-value">{minutesToText(entry.minutes)}</span></article>)}</div>
            <div className="tw-mobile-simple-pagination"><span>{workspaceTimePage} of {workspaceTimeData?.pagination?.totalPages||1}</span><button disabled={workspaceTimePage>=(workspaceTimeData?.pagination?.totalPages||1)} onClick={()=>setWorkspaceTimePage(p=>p+1)}><ChevronRight/></button></div>
          </section>
        )}

        {workspaceTab === "Files" && (
          <section className="tw-mobile-page tw-mobile-more-page">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><FileText size={25}/><div><h2>Files</h2><p>Files shared across team projects and tasks.</p></div></div><div className="tw-mobile-head-actions"><button type="button" onClick={()=>workspaceFileInputRef.current?.click()}><Upload size={17}/> Upload</button></div></header>
            <label className="tw-mobile-search"><Search size={20}/><input value={workspaceFileSearch} onChange={(e)=>setWorkspaceFileSearch(e.target.value)} placeholder="Search files..."/></label>
            <div className="tw-mobile-more-summary"><div><FolderOpen/><span><small>Workspace files</small><strong>{workspaceFiles.length} files</strong></span></div><b>{workspaceFiles.filter(file=>file.projectId).length}<small>Linked</small></b></div>
            <div className="tw-mobile-more-list">{workspaceFiles.slice(0,8).map((file,index)=><article className={`tw-mobile-more-row tone-${mobileProjectTone(index)}`} key={file.id}><span className="tw-mobile-more-row-icon"><FileText/></span><span className="tw-mobile-more-row-copy"><strong>{file.originalName}</strong><small>{file.projectName||"No project"} · {formatFileSize(file.size)}</small></span><div className="tw-mobile-more-actions"><button type="button" onClick={()=>openWorkspaceFile(file)}><Eye/></button><button type="button" onClick={()=>removeWorkspaceFile(file)}><Trash2/></button></div></article>)}</div>
          </section>
        )}

        {workspaceTab === "Team" && (
          <section className="tw-mobile-page tw-mobile-more-page">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><Users size={25}/><div><h2>Team</h2><p>Members, workload, delivery, and tracked time.</p></div></div><div className="tw-mobile-head-actions"><button type="button" onClick={handleOpenInvite}><Plus size={17}/> Invite</button></div></header>
            <div className="tw-mobile-more-kpis">{[["Members",workspaceMembers.length],["Assigned",workspaceTeamTotals.assigned],["Completed",workspaceTeamTotals.completed],["Hours",`${(workspaceTeamTotals.loggedMinutes/60).toFixed(1)}h`]].map(([label,value],index)=><div className={`tone-${mobileProjectTone(index)}`} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
            <div className="tw-mobile-more-list">{workspaceTeamPerformanceRows.slice(0,8).map((member,index)=><article className={`tw-mobile-more-row tone-${mobileProjectTone(index)}`} key={member.id}><span className="tw-mobile-more-avatar">{String(member.name||"TM").split(" ").map(x=>x[0]).join("").slice(0,2)}</span><span className="tw-mobile-more-row-copy"><strong>{member.name}</strong><small>{member.role||"Member"} · {member.completed||0}/{member.assigned||0} completed</small></span><span className="tw-mobile-more-row-value">{minutesToText(member.loggedMinutes)}</span></article>)}</div>
          </section>
        )}

        {workspaceTab === "Reports" && (
          <section className="tw-mobile-page tw-mobile-more-page tw-mobile-reports-page">
            <header className="tw-mobile-section-head"><div className="tw-mobile-title"><BarChart3 size={25}/><div><h2>Reports & Analytics</h2><p>Delivery, workload, activity, and time analytics.</p></div></div><div className="tw-mobile-head-actions"><button type="button" onClick={exportWorkspaceReports}><Download size={17}/> Export</button></div></header>
            <div className="tw-mobile-more-kpis six">{[["Created",workspaceReports?.summary?.tasksCreated||0],["Completed",workspaceReports?.summary?.tasksCompleted||0],["Completion",`${workspaceReports?.summary?.completionRate||0}%`],["On Time",`${workspaceReports?.summary?.onTimeRate||0}%`],["Progress",`${workspaceReports?.summary?.avgProgress||0}%`],["Hours",`${workspaceReports?.summary?.hoursLogged||0}h`]].map(([label,value],index)=><div className={`tone-${mobileProjectTone(index)}`} key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
            <div className="tw-mobile-report-panels"><article><div className="tw-mini-head"><strong>Task Status</strong><span>Live</span></div>{(workspaceReports?.statusBreakdown||statusBreakdown||[]).slice(0,5).map((row,index)=><div className="tw-mobile-report-line" key={row.status||row.label||index}><span>{formatTaskStatus(row.status||row.label)}</span><i><b style={{width:`${Math.min(100,Number(row.percentage||row.percent||0))}%`}}/></i><strong>{row.count||row.value||0}</strong></div>)}</article><article><div className="tw-mini-head"><strong>Recent Activity</strong><span>Live</span></div>{(workspaceReports?.recentActivity||[]).slice(0,5).map((activity,index)=><div className="tw-mobile-report-activity" key={activity.id||index}><span><ListTodo/></span><div><strong>{reportActivityPresentation(activity).label}</strong><small>{reportActivityPresentation(activity).detail}</small></div></div>)}</article></div>
          </section>
        )}

      </div>
      <div className="tw-new-header">
        <div>
          <h1>Team Workspace</h1>
          <p>Plan, organize, and execute internal projects with your team.</p>
        </div>
        <div className="tw-header-actions">
          <div
            className="tw-global-search-wrap"
            style={{
              position: "relative",
              flex: "1 1 360px",
              maxWidth: 520,
            }}
          >
            <label className="tw-global-search">
              <Search size={15} />
              <input
                value={workspaceGlobalSearch}
                onFocus={() => setWorkspaceGlobalSearchOpen(true)}
                onChange={(e) => {
                  setWorkspaceGlobalSearch(e.target.value);
                  setWorkspaceGlobalSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    closeWorkspaceGlobalSearch();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search tasks, projects, team members..."
              />

              {workspaceGlobalSearch && (
                <button
                  type="button"
                  title="Clear search"
                  onClick={(e) => {
                    e.preventDefault();
                    setWorkspaceGlobalSearch("");
                    setWorkspaceGlobalTaskResults([]);
                    setWorkspaceGlobalSearchOpen(false);
                  }}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#94a3b8",
                    padding: 2,
                    display: "inline-flex",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            {workspaceGlobalSearchOpen &&
              workspaceGlobalSearch.trim() && (
                <>
                  <button
                    type="button"
                    aria-label="Close search results"
                    onClick={closeWorkspaceGlobalSearch}
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 58,
                      border: 0,
                      background: "transparent",
                      cursor: "default",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 7px)",
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      maxHeight: "min(560px, 70vh)",
                      overflowY: "auto",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 13,
                      boxShadow:
                        "0 18px 48px rgba(15,23,42,.16)",
                      padding: 7,
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 9px 6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        Search Team Workspace
                      </span>

                      {workspaceGlobalSearchLoading && (
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: 10.5,
                          }}
                        >
                          Searching...
                        </span>
                      )}
                    </div>

                    {workspaceGlobalTaskResults.length > 0 && (
                      <div style={{ padding: "3px 0 7px" }}>
                        <div
                          style={{
                            padding: "5px 9px",
                            color: "#64748b",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          Tasks
                        </div>

                        {workspaceGlobalTaskResults.map((task) => (
                          <button
                            type="button"
                            key={`global-task-${task.id}`}
                            onClick={() => openGlobalTaskResult(task)}
                            style={{
                              width: "100%",
                              border: 0,
                              borderRadius: 9,
                              background: "transparent",
                              padding: "9px",
                              display: "grid",
                              gridTemplateColumns: "32px minmax(0,1fr) auto",
                              alignItems: "center",
                              gap: 9,
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span
                              style={{
                                width: 31,
                                height: 31,
                                borderRadius: 9,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#eff6ff",
                                color: "#2563eb",
                              }}
                            >
                              <ListTodo size={14} />
                            </span>

                            <span style={{ minWidth: 0 }}>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#0f172a",
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {task.name}
                              </strong>
                              <small
                                style={{
                                  display: "block",
                                  marginTop: 2,
                                  color: "#94a3b8",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {task.project || "No project"}
                                {task.assignee
                                  ? ` · ${task.assignee}`
                                  : ""}
                              </small>
                            </span>

                            <span
                              className={`tw-project-status ${String(
                                task.status || "pending",
                              ).replaceAll("_", "-")}`}
                            >
                              {formatTaskStatus(task.status)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {workspaceGlobalProjectResults.length > 0 && (
                      <div
                        style={{
                          padding: "5px 0 7px",
                          borderTop: workspaceGlobalTaskResults.length
                            ? "1px solid #f1f5f9"
                            : 0,
                        }}
                      >
                        <div
                          style={{
                            padding: "6px 9px",
                            color: "#64748b",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          Projects
                        </div>

                        {workspaceGlobalProjectResults.map((project) => (
                          <button
                            type="button"
                            key={`global-project-${project.id}`}
                            onClick={() =>
                              openGlobalProjectResult(project)
                            }
                            style={{
                              width: "100%",
                              border: 0,
                              borderRadius: 9,
                              background: "transparent",
                              padding: "9px",
                              display: "grid",
                              gridTemplateColumns: "32px minmax(0,1fr) auto",
                              alignItems: "center",
                              gap: 9,
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span
                              style={{
                                width: 31,
                                height: 31,
                                borderRadius: 9,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#f5f3ff",
                                color: "#7c3aed",
                              }}
                            >
                              <FolderKanban size={14} />
                            </span>

                            <span style={{ minWidth: 0 }}>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#0f172a",
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {project.name}
                              </strong>
                              <small
                                style={{
                                  display: "block",
                                  marginTop: 2,
                                  color: "#94a3b8",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {project.ownerName || "Unassigned"}
                                {project.dueDate
                                  ? ` · ${formatDate(project.dueDate)}`
                                  : ""}
                              </small>
                            </span>

                            <span
                              className={`tw-project-status ${String(
                                project.status || "active",
                              ).replaceAll("_", "-")}`}
                            >
                              {formatTaskStatus(project.status || "active")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {workspaceGlobalMemberResults.length > 0 && (
                      <div
                        style={{
                          padding: "5px 0 7px",
                          borderTop:
                            workspaceGlobalTaskResults.length ||
                            workspaceGlobalProjectResults.length
                              ? "1px solid #f1f5f9"
                              : 0,
                        }}
                      >
                        <div
                          style={{
                            padding: "6px 9px",
                            color: "#64748b",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          Team Members
                        </div>

                        {workspaceGlobalMemberResults.map((member) => (
                          <button
                            type="button"
                            key={`global-member-${member.id}`}
                            onClick={() =>
                              openGlobalMemberResult(member)
                            }
                            style={{
                              width: "100%",
                              border: 0,
                              borderRadius: 9,
                              background: "transparent",
                              padding: "9px",
                              display: "grid",
                              gridTemplateColumns: "32px minmax(0,1fr) auto",
                              alignItems: "center",
                              gap: 9,
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span className="tw-avatar">
                              {String(member.name || "TM")
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </span>

                            <span style={{ minWidth: 0 }}>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#0f172a",
                                  fontSize: 12,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {member.name}
                              </strong>
                              <small
                                style={{
                                  display: "block",
                                  marginTop: 2,
                                  color: "#94a3b8",
                                }}
                              >
                                Team member
                              </small>
                            </span>

                            <span
                              style={{
                                color: "#2563eb",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              View tasks
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!workspaceGlobalSearchLoading &&
                      !workspaceGlobalSearchHasResults && (
                        <div
                          style={{
                            padding: "30px 16px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          <Search
                            size={22}
                            style={{ marginBottom: 7 }}
                          />
                          <div
                            style={{
                              color: "#475569",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            No results found
                          </div>
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 11,
                            }}
                          >
                            Try another task, project, or member name.
                          </div>
                        </div>
                      )}
                  </div>
                </>
              )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              className="tw-new-btn"
              onClick={() => {
                setNewMenuOpen((value) => !value);
                closeWorkspaceGlobalSearch();
              }}
            >
              <Plus size={16} /> New
            </button>

            {newMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close new menu"
                  onClick={() => setNewMenuOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 38,
                    border: 0,
                    background: "transparent",
                    cursor: "default",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 7px)",
                    minWidth: 215,
                    padding: 7,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow:
                      "0 16px 40px rgba(15,23,42,.15)",
                    zIndex: 40,
                  }}
                >
                  <button
                    type="button"
                    onClick={openNewWorkspaceTask}
                    style={{
                      width: "100%",
                      padding: "9px",
                      textAlign: "left",
                      border: 0,
                      borderRadius: 9,
                      background: "transparent",
                      display: "grid",
                      gridTemplateColumns: "32px minmax(0,1fr)",
                      alignItems: "center",
                      gap: 9,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 31,
                        height: 31,
                        borderRadius: 9,
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ListTodo size={14} />
                    </span>
                    <span>
                      <strong
                        style={{
                          display: "block",
                          color: "#0f172a",
                          fontSize: 12,
                        }}
                      >
                        New Task
                      </strong>
                      <small
                        style={{
                          color: "#94a3b8",
                          fontSize: 10.5,
                        }}
                      >
                        Create and assign team work
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={openNewWorkspaceProject}
                    style={{
                      width: "100%",
                      padding: "9px",
                      textAlign: "left",
                      border: 0,
                      borderRadius: 9,
                      background: "transparent",
                      display: "grid",
                      gridTemplateColumns: "32px minmax(0,1fr)",
                      alignItems: "center",
                      gap: 9,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 31,
                        height: 31,
                        borderRadius: 9,
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FolderKanban size={14} />
                    </span>
                    <span>
                      <strong
                        style={{
                          display: "block",
                          color: "#0f172a",
                          fontSize: 12,
                        }}
                      >
                        New Project
                      </strong>
                      <small
                        style={{
                          color: "#94a3b8",
                          fontSize: 10.5,
                        }}
                      >
                        Organize tasks and deadlines
                      </small>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="tw-stat-strip">
        {dashboardStats.map(([label, value, sub, change, Icon], index) => (
          <div className="tw-stat" key={label}>
            <div className={`tw-stat-icon i-${index}`}>
              <Icon size={17} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
            {change && (
              <em>
                ↑ {change} <b>vs last month</b>
              </em>
            )}
          </div>
        ))}
      </div>

      <div className="tw-tabs">
        {WORKSPACE_TABS.map(({ label, icon: TabIcon }) => (
          <button
            key={label}
            type="button"
            className={workspaceTab === label ? "active" : ""}
            onClick={() => {
              setWorkspaceTab(label);

              if (label === "Board") {
                setWorkspaceTaskView("board");
              }

              if (label === "Tasks" || label === "My Tasks") {
                setWorkspaceTaskView("table");
              }

              if (label === "Calendar") {
                setWorkspaceTaskView("calendar");
              }
            }}
          >
            <TabIcon className="tw-tab-icon" size={15} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {["Tasks", "My Tasks", "Board", "Calendar"].includes(workspaceTab) && (
        <section className="tw-tasks-section">
          <div className="tw-section-head">
            <div>
              <h2>
                {workspaceTab === "My Tasks"
                  ? "My Tasks"
                  : workspaceTab === "Board"
                    ? "Board"
                    : workspaceTab === "Calendar"
                      ? "Calendar"
                      : "Tasks"}
              </h2>
              <p>
                {workspaceTab === "My Tasks"
                  ? "Tasks assigned to you"
                  : workspaceTab === "Board"
                    ? "Move tasks between statuses using the same task data"
                    : workspaceTab === "Calendar"
                      ? "Tasks organized automatically by due date"
                      : "Manage and track all team tasks"}
              </p>
            </div>
            <div className="tw-section-actions">
              <input
                ref={taskImportInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={importWorkspaceTasks}
              />
              <button
                type="button"
                onClick={() => taskImportInputRef.current?.click()}
                disabled={taskImporting}
              >
                <Upload size={14} /> {taskImporting ? "Importing..." : "Import"}
              </button>
              <button
                type="button"
                onClick={exportWorkspaceTasks}
                disabled={taskExporting}
              >
                <Download size={14} /> {taskExporting ? "Exporting..." : "Export"}
              </button>
              <button>
                <SlidersHorizontal size={14} />
              </button>
              <button className="primary" onClick={openNewWorkspaceTask}>
                <Plus size={14} /> New Task
              </button>
            </div>
          </div>

          <div className="tw-filters">
            <label>
              <Search size={14} />
              <input
                value={workspaceTaskSearch}
                onChange={(e) => setWorkspaceTaskSearch(e.target.value)}
                placeholder="Search tasks..."
              />
            </label>
            <select className="cxc-select" 
              value={workspaceStatus}
              onChange={(e) => {
                setWorkspaceStatus(e.target.value);
                setWorkspaceTaskPage(1);
              }}
            >
              <option value="all">Status · All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select className="cxc-select" 
              value={workspacePriority}
              onChange={(e) => {
                setWorkspacePriority(e.target.value);
                setWorkspaceTaskPage(1);
              }}
            >
              <option value="all">Priority · All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select className="cxc-select" 
              value={workspaceAssignee}
              onChange={(e) => {
                setWorkspaceAssignee(e.target.value);
                setWorkspaceTaskPage(1);
              }}
            >
              <option value="all">Assignee · All Assignees</option>
              {workspaceMembers.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <select className="cxc-select" 
              value={workspaceProject}
              onChange={(e) => {
                setWorkspaceProject(e.target.value);
                setWorkspaceTaskPage(1);
              }}
            >
              <option value="all">Project · All Projects</option>
              {workspaceProjects.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select className="cxc-select" 
              value={workspaceTaskType}
              onChange={(e) => {
                setWorkspaceTaskType(e.target.value);
                setWorkspaceTaskPage(1);
              }}
            >
              <option value="all">Task Type · All Types</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="meeting">Meeting</option>
              <option value="follow_up">Follow Up</option>
            </select>

            <input className="cxc-select" 
              type="date"
              value={workspaceDateFrom}
              onChange={(e) => {
                setWorkspaceDateFrom(e.target.value);
                setWorkspaceTaskPage(1);
              }}
              title="Due from"
            />
 
            <input className="cxc-select" 
              type="date"
              value={workspaceDateTo}
              onChange={(e) => {
                setWorkspaceDateTo(e.target.value);
                setWorkspaceTaskPage(1);
              }}
              title="Due to"
            />

            <button className="reset" onClick={resetWorkspaceFilters}>
              <RotateCcw size={13} /> Reset
            </button>

            <span className="tw-view-label"></span>

            <button
              className={workspaceTaskView === "table" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("table");
                if (workspaceTab === "Board" || workspaceTab === "Calendar") {
                  setWorkspaceTab("Tasks");
                }
              }}
            >
              <Table2 size={13} />
            </button>

            <button
              className={workspaceTaskView === "board" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("board");
                setWorkspaceTab("Board");
              }}
            >
              <LayoutGrid size={13} />
            </button>

            <button
              className={workspaceTaskView === "calendar" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("calendar");
                setWorkspaceTab("Calendar");
              }}
            >
              <CalendarDays size={13} />
            </button>
          </div>

          {(workspaceTaskView === "table" || workspaceTab === "My Tasks") && (
            <>
              <div className="tw-table-wrap">
                <table className="tw-task-table">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" />
                      </th>
                      <th>Task Name</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Progress</th>
                      <th>Time Logged</th>
                      <th>Time Est.</th>
                      <th>Labels</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {!workspaceLoading && workspaceTasks.length === 0 && (
                      <tr>
                        <td
                          colSpan="13"
                          style={{
                            textAlign: "center",
                            padding: 32,
                            color: "#6b7280",
                          }}
                        >
                          {workspaceTab === "My Tasks"
                            ? "No tasks are currently assigned to you."
                            : "No tasks yet. Create a task to start using Team Workspace."}
                        </td>
                      </tr>
                    )}

                    {workspaceTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td className="task-name">{task.name}</td>
                        <td>{task.project || "—"}</td>
                        <td>
                          <select
                            value={task.status || "pending"}
                            onChange={(e) =>
                              changeWorkspaceTaskStatus(task, e.target.value)
                            }
                            className={`tw-pill status-${String(
                              task.status || "pending",
                            )
                              .toLowerCase()
                              .replaceAll("_", "-")}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <span
                            className={`tw-pill priority-${String(task.priority || "medium").toLowerCase()}`}
                          >
                            {formatTaskStatus(task.priority)}
                          </span>
                        </td>
                        <td>
                          {task.assignee ? (
                            <span className="tw-assignee">
                              <span className="tw-avatar">
                                {String(task.assignee)
                                  .split(" ")
                                  .map((x) => x[0])
                                  .join("")
                                  .slice(0, 2)}
                              </span>
                              {task.assignee}
                            </span>
                          ) : (
                            "Unassigned"
                          )}
                        </td>
                        <td>{formatDate(task.dueDate)}</td>
                        <td>
                          <div className="tw-progress">
                            <i>
                              <b
                                style={{
                                  width: `${Number(task.progress || 0)}%`,
                                }}
                              />
                            </i>
                            <span>{Number(task.progress || 0)}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => addWorkspaceTaskTime(task)}
                            style={{
                              border: 0,
                              background: "transparent",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            title="Log time"
                          >
                            {minutesToText(task.loggedMinutes)}
                          </button>
                        </td>
                        <td>{minutesToText(task.estimatedMinutes)}</td>
                        <td>
                          {(task.labels || []).length
                            ? (task.labels || []).map((label) => (
                                <span className="tw-label" key={label}>
                                  {label}
                                </span>
                              ))
                            : "—"}
                        </td>
                        <td className="tw-activity-time">
                          {task.updatedAt
                            ? new Date(task.updatedAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          <div
                            className="tw-row-actions"
                            style={{ position: "relative" }}
                          >
                            <Eye
                              size={14}
                              onClick={() => openWorkspaceTaskDetail(task)}
                              style={{ cursor: "pointer" }}
                              title="View task"
                            />
                            <Pencil
                              size={14}
                              onClick={() => openEditWorkspaceTask(task)}
                              style={{ cursor: "pointer" }}
                              title="Edit task"
                            />
                            <MoreVertical
                              size={14}
                              onClick={() =>
                                setTaskMoreOpenId((current) =>
                                  current === task.id ? null : task.id,
                                )
                              }
                              style={{ cursor: "pointer" }}
                              title="More actions"
                            />

                            {taskMoreOpenId === task.id && (
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: 22,
                                  width: 175,
                                  padding: 6,
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 9,
                                  boxShadow:
                                    "0 12px 30px rgba(15,23,42,.14)",
                                  zIndex: 50,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => addWorkspaceTaskTime(task)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    border: 0,
                                    background: "transparent",
                                    textAlign: "left",
                                    padding: "8px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Log Time
                                </button>

                                <button
                                  type="button"
                                  onClick={() => duplicateWorkspaceTask(task)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    border: 0,
                                    background: "transparent",
                                    textAlign: "left",
                                    padding: "8px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Duplicate
                                </button>

                                {task.status !== "completed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeWorkspaceTaskStatus(
                                        task,
                                        "completed",
                                      )
                                    }
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      border: 0,
                                      background: "transparent",
                                      textAlign: "left",
                                      padding: "8px 9px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Mark Completed
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeWorkspaceTask(task)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    border: 0,
                                    background: "transparent",
                                    color: "#dc2626",
                                    textAlign: "left",
                                    padding: "8px 9px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="tw-pagination">
                <span>
                  {workspaceTaskPagination.total
                    ? `Showing ${(workspaceTaskPagination.page - 1) * workspaceTaskPagination.limit + 1} to ${Math.min(workspaceTaskPagination.page * workspaceTaskPagination.limit, workspaceTaskPagination.total)} of ${workspaceTaskPagination.total} tasks`
                    : "No tasks"}
                </span>
                <div>
                  <button
                    disabled={workspaceTaskPage <= 1}
                    onClick={() =>
                      setWorkspaceTaskPage((p) => Math.max(1, p - 1))
                    }
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button className="active">{workspaceTaskPage}</button>
                  <span>of {workspaceTaskPagination.totalPages}</span>
                  <button
                    disabled={
                      workspaceTaskPage >= workspaceTaskPagination.totalPages
                    }
                    onClick={() =>
                      setWorkspaceTaskPage((p) =>
                        Math.min(workspaceTaskPagination.totalPages, p + 1),
                      )
                    }
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <select
                  value={workspaceTaskLimit}
                  onChange={(e) => {
                    setWorkspaceTaskLimit(Number(e.target.value));
                    setWorkspaceTaskPage(1);
                  }}
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>{" "}
              {/* tw-pagination */}
            </>
          )}

          {workspaceTaskView === "board" && workspaceTab !== "My Tasks" && (
            <div
              className="tw-board-shell"
              style={{
                padding: 14,
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 15 }}>
                    Task Board
                  </strong>
                  <span style={{ color: "#64748b", fontSize: 12 }}>
                    Drag tasks between columns to update their status everywhere.
                  </span>
                </div>

                <span
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {workspaceBoardTasks.length} task
                  {workspaceBoardTasks.length === 1 ? "" : "s"}
                </span>
              </div>

              {workspaceBoardLoading ? (
                <div
                  style={{
                    padding: 42,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Loading board...
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(6, minmax(250px, 1fr))",
                    gap: 12,
                    minWidth: 1570,
                    alignItems: "start",
                  }}
                >
                  {[
                    {
                      status: "pending",
                      label: "Pending",
                      accent: "#64748b",
                      background: "#f8fafc",
                    },
                    {
                      status: "in_progress",
                      label: "In Progress",
                      accent: "#2563eb",
                      background: "#eff6ff",
                    },
                    {
                      status: "review",
                      label: "Review",
                      accent: "#7c3aed",
                      background: "#f5f3ff",
                    },
                    {
                      status: "on_hold",
                      label: "On Hold",
                      accent: "#d97706",
                      background: "#fffbeb",
                    },
                    {
                      status: "completed",
                      label: "Completed",
                      accent: "#16a34a",
                      background: "#ecfdf5",
                    },
                    {
                      status: "cancelled",
                      label: "Cancelled",
                      accent: "#dc2626",
                      background: "#fef2f2",
                    },
                  ].map((column) => {
                    const items = workspaceBoardTasks.filter(
                      (task) => task.status === column.status,
                    );

                    const isOver =
                      workspaceBoardOverStatus === column.status &&
                      workspaceBoardDraggingId;

                    return (
                      <section
                        key={column.status}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          if (workspaceBoardDraggingId) {
                            setWorkspaceBoardOverStatus(column.status);
                          }
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          if (workspaceBoardDraggingId) {
                            setWorkspaceBoardOverStatus(column.status);
                          }
                        }}
                        onDragLeave={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget,
                            )
                          ) {
                            setWorkspaceBoardOverStatus((current) =>
                              current === column.status ? null : current,
                            );
                          }
                        }}
                        onDrop={(event) =>
                          handleWorkspaceBoardDrop(
                            event,
                            column.status,
                          )
                        }
                        style={{
                          minWidth: 250,
                          minHeight: 300,
                          background: isOver
                            ? column.background
                            : "#f8fafc",
                          border: isOver
                            ? `2px dashed ${column.accent}`
                            : "1px solid #e5e7eb",
                          borderRadius: 13,
                          padding: 10,
                          transition:
                            "border-color .15s ease, background .15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 10,
                            padding: "2px 2px 7px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <i
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: column.accent,
                              }}
                            />
                            <strong style={{ fontSize: 12.5 }}>
                              {column.label}
                            </strong>
                          </span>

                          <span
                            style={{
                              minWidth: 24,
                              height: 24,
                              padding: "0 7px",
                              borderRadius: 999,
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#64748b",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {items.length}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: 8,
                            minHeight: 225,
                          }}
                        >
                          {items.map((task) => {
                            const dragging =
                              workspaceBoardDraggingId === task.id;

                            return (
                              <article
                                key={task.id}
                                draggable
                                onDragStart={(event) => {
                                  setWorkspaceBoardDraggingId(task.id);
                                  setWorkspaceBoardOverStatus(
                                    task.status,
                                  );

                                  event.dataTransfer.effectAllowed =
                                    "move";
                                  event.dataTransfer.setData(
                                    "text/team-board-task-id",
                                    String(task.id),
                                  );
                                }}
                                onDragEnd={() => {
                                  setWorkspaceBoardDraggingId(null);
                                  setWorkspaceBoardOverStatus(null);
                                }}
                                onClick={() =>
                                  openWorkspaceTaskDetail(task)
                                }
                                style={{
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 11,
                                  padding: 11,
                                  cursor: dragging
                                    ? "grabbing"
                                    : "grab",
                                  opacity: dragging ? 0.55 : 1,
                                  boxShadow:
                                    "0 1px 2px rgba(15,23,42,.03)",
                                  transition:
                                    "opacity .15s ease, box-shadow .15s ease, transform .15s ease",
                                }}
                                title="Drag to change status, or click to view task"
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: 8,
                                  }}
                                >
                                  <strong
                                    style={{
                                      color: "#0f172a",
                                      fontSize: 12.5,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {task.name}
                                  </strong>

                                  <button
                                    type="button"
                                    title="Edit task"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEditWorkspaceTask(task);
                                    }}
                                    style={{
                                      flex: "0 0 auto",
                                      width: 28,
                                      height: 28,
                                      border: "1px solid #e2e8f0",
                                      borderRadius: 8,
                                      background: "#fff",
                                      color: "#64748b",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Pencil size={13} />
                                  </button>
                                </div>

                                <small
                                  style={{
                                    display: "block",
                                    marginTop: 5,
                                    color: "#64748b",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {task.project || "No project"}
                                </small>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    flexWrap: "wrap",
                                    marginTop: 9,
                                  }}
                                >
                                  <span
                                    className={`tw-pill priority-${String(
                                      task.priority || "medium",
                                    ).toLowerCase()}`}
                                  >
                                    {formatTaskStatus(task.priority)}
                                  </span>

                                  {task.dueDate && (
                                    <span
                                      style={{
                                        color: "#64748b",
                                        fontSize: 10.5,
                                      }}
                                    >
                                      {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    marginTop: 11,
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      color: "#64748b",
                                      fontSize: 10.5,
                                      minWidth: 0,
                                    }}
                                  >
                                    {task.assignee ? (
                                      <>
                                        <span className="tw-avatar">
                                          {String(task.assignee)
                                            .split(" ")
                                            .map((part) => part[0])
                                            .join("")
                                            .slice(0, 2)}
                                        </span>
                                        <span
                                          style={{
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: 105,
                                          }}
                                        >
                                          {task.assignee}
                                        </span>
                                      </>
                                    ) : (
                                      "Unassigned"
                                    )}
                                  </span>

                                  <span
                                    style={{
                                      color: "#64748b",
                                      fontSize: 10.5,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {Number(task.progress || 0)}%
                                  </span>
                                </div>

                                <div
                                  className="tw-progress"
                                  style={{ marginTop: 7 }}
                                >
                                  <i style={{ width: "100%" }}>
                                    <b
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Number(task.progress || 0),
                                        )}%`,
                                      }}
                                    />
                                  </i>
                                </div>

                                <select
                                  value={task.status || "pending"}
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                  onChange={(event) => {
                                    event.stopPropagation();
                                    moveWorkspaceBoardTask(
                                      task,
                                      event.target.value,
                                    );
                                  }}
                                  style={{
                                    width: "100%",
                                    marginTop: 10,
                                    minHeight: 34,
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    padding: "0 8px",
                                    background: "#fff",
                                    color: "#334155",
                                    fontSize: 11.5,
                                  }}
                                >
                                  <option value="pending">
                                    Pending
                                  </option>
                                  <option value="in_progress">
                                    In Progress
                                  </option>
                                  <option value="review">
                                    Review
                                  </option>
                                  <option value="on_hold">
                                    On Hold
                                  </option>
                                  <option value="completed">
                                    Completed
                                  </option>
                                  <option value="cancelled">
                                    Cancelled
                                  </option>
                                </select>
                              </article>
                            );
                          })}

                          {!items.length && (
                            <div
                              style={{
                                minHeight: 110,
                                display: "grid",
                                placeItems: "center",
                                border: isOver
                                  ? `1px dashed ${column.accent}`
                                  : "1px dashed #dbe3ed",
                                borderRadius: 10,
                                color: isOver
                                  ? column.accent
                                  : "#94a3b8",
                                background: isOver
                                  ? "#fff"
                                  : "rgba(255,255,255,.45)",
                                padding: 12,
                                textAlign: "center",
                                fontSize: 11.5,
                              }}
                            >
                              {isOver
                                ? `Drop in ${column.label}`
                                : "No tasks"}
                            </div>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {workspaceTaskView === "calendar" && workspaceTab !== "My Tasks" && (
            <div className="tw-calendar-shell" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button className="cxc-select" type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
                  <button className="cxc-select" type="button" onClick={goCalendarToday}>Today</button>
                  <button className="cxc-select" type="button" onClick={() => changeCalendarMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
                </div>
                <strong style={{ fontSize: 18 }}>{calendarMonthLabel}</strong>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b" }}>
                  <span>● Task due</span>
                  <span>◆ Project date</span>
                </div>
              </div>

              {calendarLoading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading calendar...</div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", border: "1px solid #e5e7eb", borderBottom: 0, borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} style={{ padding: "9px 8px", background: "#f8fafc", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", borderRight: "1px solid #e5e7eb" }}>{day}</div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderLeft: "1px solid #e5e7eb", borderTop: "1px solid #e5e7eb" }}>
                    {calendarDays.map((day) => {
                      const isToday = day.dateKey === calendarDateKey(new Date());
                      const visibleEvents = day.events.slice(0, 3);
                      return (
                        <div
                          key={day.dateKey}
                          onClick={() => setCalendarSelectedDay(day.dateKey)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const taskId = event.dataTransfer.getData("text/team-task-id");
                            const task = calendarTasks.find((item) => String(item.id) === String(taskId));
                            if (task) moveTaskToCalendarDate(task, day.dateKey);
                          }}
                          style={{ minHeight: 126, padding: 7, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: day.currentMonth ? "#fff" : "#f8fafc", cursor: "pointer", overflow: "hidden" }}
                        >
                          <div style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700, marginBottom: 5, background: isToday ? "#2563eb" : "transparent", color: isToday ? "#fff" : day.currentMonth ? "#334155" : "#94a3b8" }}>{day.date.getDate()}</div>

                          {visibleEvents.map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              draggable={event.type === "task"}
                              onDragStart={(e) => { if (event.type === "task") e.dataTransfer.setData("text/team-task-id", String(event.source.id)); }}
                              onClick={(e) => { e.stopPropagation(); openCalendarEvent(event); }}
                              title={`${event.title} · ${event.project}`}
                              style={{ width: "100%", display: "block", textAlign: "left", border: 0, borderLeft: event.type === "task" ? "3px solid #2563eb" : "3px solid #7c3aed", background: event.type === "task" ? "#eff6ff" : "#f5f3ff", borderRadius: 5, padding: "5px 6px", marginBottom: 4, cursor: event.type === "task" ? "grab" : "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: "#334155" }}
                            >
                              {event.type !== "task" ? "◆ " : ""}{event.title}
                            </button>
                          ))}

                          {day.events.length > 3 && (
                            <small style={{ color: "#2563eb", fontWeight: 700 }}>+{day.events.length - 3} more</small>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {calendarSelectedDay && (
                    <div style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "11px 13px", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{formatDate(calendarSelectedDay)}</strong>
                        <button type="button" onClick={() => setCalendarSelectedDay(null)}><X size={14} /></button>
                      </div>
                      {(calendarEvents.filter((event) => event.dateKey === calendarSelectedDay)).map((event) => (
                        <div key={`selected-${event.id}`} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) 160px 120px auto", gap: 10, alignItems: "center", padding: "10px 13px", borderTop: "1px solid #eef2f7" }}>
                          <div><strong>{event.title}</strong><div style={{ fontSize: 12, color: "#64748b" }}>{event.project}</div></div>
                          <span>{event.type === "task" ? (event.source.assignee || "Unassigned") : "Project"}</span>
                          <span className={`tw-pill ${event.type === "task" ? `status-${String(event.status).replaceAll("_", "-")}` : ""}`}>{formatTaskStatus(event.status)}</span>
                          <button type="button" onClick={() => openCalendarEvent(event)}>{event.type === "task" ? "View Task" : "View Project"}</button>
                        </div>
                      ))}
                      {!calendarEvents.some((event) => event.dateKey === calendarSelectedDay) && (
                        <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No tasks or project deadlines on this date.</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {workspaceTab === "Overview" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2>Overview</h2>
          <p style={{ color: "#64748b" }}>
            Live project, task, workload, activity, and deadline data for this
            team.
          </p>
          <div className="tw-bottom-dashboard" style={{ marginTop: 16 }}>
            <div className="tw-mini-card">
              <div className="tw-mini-head">
                <strong>Active Projects</strong>
                <span>Live</span>
              </div>
              <strong style={{ fontSize: 28 }}>
                {workspaceMetrics.activeProjects || 0}
              </strong>
            </div>
            <div className="tw-mini-card">
              <div className="tw-mini-head">
                <strong>Open Tasks</strong>
                <span>Live</span>
              </div>
              <strong style={{ fontSize: 28 }}>
                {Math.max(
                  0,
                  Number(workspaceMetrics.tasksAssigned || 0) -
                    Number(workspaceMetrics.tasksCompleted || 0),
                )}
              </strong>
            </div>
          </div>
        </section>
      )}

      {workspaceTab === "Projects" && (
        <section className="tw-tasks-section tw-projects-section">
          <div className="tw-section-head">
            <div>
              <h2>Projects</h2>
              <p>
                Manage project delivery, ownership, tasks, files, deadlines,
                and tracked time.
              </p>
            </div>

            <button
              className="primary tw-new-btn"
              onClick={openNewWorkspaceProject}
            >
              <Plus size={14} /> New Project
            </button>
          </div>

          <div className="tw-project-toolbar">
            <label className="tw-project-search">
              <Search size={15} />
              <input
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
              />
            </label>

            <select
              className="cxc-select"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="cxc-select"
              value={projectPriorityFilter}
              onChange={(e) => setProjectPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              className="reset cxc-select"
              onClick={() => {
                setProjectSearch("");
                setProjectStatusFilter("all");
                setProjectPriorityFilter("all");
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div className="tw-project-summary-grid">
            <div>
              <span>Total Projects</span>
              <strong>{workspaceProjects.length}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>
                {
                  workspaceProjects.filter(
                    (project) =>
                      String(project.status || "active").toLowerCase() ===
                      "active",
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>
                {
                  workspaceProjects.filter(
                    (project) =>
                      String(project.status || "").toLowerCase() ===
                      "completed",
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Open Tasks</span>
              <strong>
                {workspaceProjects.reduce(
                  (total, project) =>
                    total +
                    Math.max(
                      0,
                      Number(project.taskCount || 0) -
                        Number(project.completedTasks || 0),
                    ),
                  0,
                )}
              </strong>
            </div>
          </div>

          <div className="tw-table-wrap">
            <table className="tw-task-table tw-project-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Tasks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredWorkspaceProjects.map((project) => {
                  const taskCount = Number(project.taskCount || 0);
                  const completedTasks = Number(project.completedTasks || 0);

                  return (
                    <tr key={project.id}>
                      <td>
                        <button
                          type="button"
                          className="tw-project-name-btn"
                          onClick={() => openWorkspaceProjectDetail(project)}
                        >
                          <span className="tw-project-folder-icon">
                            <FolderKanban size={15} />
                          </span>
                          <span>
                            <strong>{project.name}</strong>
                            <small>{project.description || "No description"}</small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <span
                          className={`tw-project-status ${String(
                            project.status || "active",
                          )
                            .toLowerCase()
                            .replaceAll("_", "-")}`}
                        >
                          {formatTaskStatus(project.status || "active")}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`tw-pill priority-${String(
                            project.priority || "medium",
                          ).toLowerCase()}`}
                        >
                          {formatTaskStatus(project.priority || "medium")}
                        </span>
                      </td>

                      <td>{project.ownerName || "Unassigned"}</td>

                      <td>{formatDate(project.startDate)}</td>

                      <td>
                        <div className="tw-project-due-cell">
                          <span>{formatDate(project.dueDate)}</span>
                          {project.dueDate &&
                            String(project.status || "").toLowerCase() !==
                              "completed" && (
                              <small>{deadlineDistance(project.dueDate)}</small>
                            )}
                        </div>
                      </td>

                      <td>
                        <div className="tw-project-progress">
                          <i>
                            <b
                              style={{
                                width: `${Math.min(
                                  100,
                                  Number(project.progress || 0),
                                )}%`,
                              }}
                            />
                          </i>
                          <span>{Number(project.progress || 0)}%</span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="tw-project-task-count"
                          onClick={() => goToProjectTasks(project)}
                        >
                          {completedTasks}/{taskCount}
                        </button>
                      </td>

                      <td>
                        <div className="tw-project-row-actions">
                          <button
                            type="button"
                            title="View project"
                            onClick={() => openWorkspaceProjectDetail(project)}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            title="Edit project"
                            onClick={() => openEditWorkspaceProject(project)}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="danger"
                            title="Delete project"
                            disabled={projectDeletingId === project.id}
                            onClick={() => removeWorkspaceProject(project)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredWorkspaceProjects.length && (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: 38,
                        color: "#64748b",
                      }}
                    >
                      {workspaceProjects.length
                        ? "No projects match the current filters."
                        : "No projects yet. Create your first project to organize team work."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {workspaceTab === "Time Tracking" && (
        <section className="tw-tasks-section">
          <div className="tw-section-head">
            <div>
              <h2>Time Tracking</h2>
              <p>Live tracked time by member, project, and task.</p>
            </div>
          </div>

          <div className="tw-filters">
            <label>
              <Search size={14}/>
              <input
                value={workspaceTimeSearch}
                onChange={(e) => { setWorkspaceTimeSearch(e.target.value); setWorkspaceTimePage(1); }}
                placeholder="Search time entries..."
              />
            </label>
            <select className="cxc-select" value={workspaceTimeMember}
              onChange={(e) => { setWorkspaceTimeMember(e.target.value); setWorkspaceTimePage(1); }}>
              <option value="all">All Members</option>
              {workspaceMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="cxc-select" value={workspaceTimeProject}
              onChange={(e) => { setWorkspaceTimeProject(e.target.value); setWorkspaceTimePage(1); }}>
              <option value="all">All Projects</option>
              {workspaceProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="cxc-select" value={workspaceTimeTask}
              onChange={(e) => { setWorkspaceTimeTask(e.target.value); setWorkspaceTimePage(1); }}>
              <option value="all">All Tasks</option>
              {workspaceFileTaskOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input className="cxc-select" type="date" value={workspaceTimeDateFrom}
              onChange={(e) => { setWorkspaceTimeDateFrom(e.target.value); setWorkspaceTimePage(1); }}/>
            <input className="cxc-select" type="date" value={workspaceTimeDateTo}
              onChange={(e) => { setWorkspaceTimeDateTo(e.target.value); setWorkspaceTimePage(1); }}/>
            <button className="reset" onClick={() => {
              setWorkspaceTimeSearch(""); setWorkspaceTimeMember("all");
              setWorkspaceTimeProject("all"); setWorkspaceTimeTask("all");
              setWorkspaceTimeDateFrom(""); setWorkspaceTimeDateTo(""); setWorkspaceTimePage(1);
            }}><RotateCcw size={13}/> Reset</button>
          </div>

          <div className="tw-stat-strip">
            {[
              ["Hours Logged", `${Number(workspaceTimeData?.summary?.hoursLogged || 0).toLocaleString()}h`, "Tracked time"],
              ["Entries", Number(workspaceTimeData?.summary?.entryCount || 0).toLocaleString(), "Time entries"],
              ["Members", Number(workspaceTimeData?.summary?.activeMembers || 0).toLocaleString(), "With tracked time"],
              ["Projects", Number(workspaceTimeData?.summary?.projectsTracked || 0).toLocaleString(), "With tracked time"],
              ["Tasks", Number(workspaceTimeData?.summary?.tasksTracked || 0).toLocaleString(), "With tracked time"],
            ].map(([label,value,sub]) => (
              <div className="tw-stat" key={label}>
                <span>{label}</span><strong>{value}</strong><small>{sub}</small>
              </div>
            ))}
          </div>

          <div className="tw-bottom-dashboard" style={{marginTop:16}}>
            <div className="tw-mini-card workload">
              <div className="tw-mini-head"><strong>Time by Member</strong><span>Live</span></div>
              {(workspaceTimeData?.byMember || []).slice(0,8).map((row) => (
                <div className="tw-work-row" key={row.id}>
                  <span className="tw-avatar">{String(row.name || "TM").split(" ").map(x=>x[0]).join("").slice(0,2)}</span>
                  <span>{row.name}</span><i><b style={{width:`${Math.min(100,(Number(row.minutes||0)/Math.max(1,...(workspaceTimeData?.byMember||[]).map(x=>Number(x.minutes||0))))*100)}%`}}/></i>
                  <em>{minutesToText(row.minutes)}</em>
                </div>
              ))}
            </div>
            <div className="tw-mini-card workload">
              <div className="tw-mini-head"><strong>Time by Project</strong><span>Live</span></div>
              {(workspaceTimeData?.byProject || []).slice(0,8).map((row) => (
                <div className="tw-work-row" key={row.id || row.name}>
                  <span>{row.name}</span><i><b style={{width:`${Math.min(100,(Number(row.minutes||0)/Math.max(1,...(workspaceTimeData?.byProject||[]).map(x=>Number(x.minutes||0))))*100)}%`}}/></i>
                  <em>{minutesToText(row.minutes)}</em>
                </div>
              ))}
            </div>
            <div className="tw-mini-card workload">
              <div className="tw-mini-head"><strong>Top Tasks by Time</strong><span>Live</span></div>
              {(workspaceTimeData?.byTask || []).slice(0,8).map((row) => (
                <div className="tw-work-row" key={row.id || row.name}>
                  <span>{row.name}</span><i><b style={{width:`${Math.min(100,(Number(row.minutes||0)/Math.max(1,...(workspaceTimeData?.byTask||[]).map(x=>Number(x.minutes||0))))*100)}%`}}/></i>
                  <em>{minutesToText(row.minutes)}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="tw-table-wrap" style={{marginTop:16}}>
            <table className="tw-task-table">
              <thead><tr><th>Member</th><th>Project</th><th>Task</th><th>Time</th><th>Note</th><th>Started</th><th>Logged</th></tr></thead>
              <tbody>
                {(workspaceTimeData?.data || []).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.memberName || "—"}</td><td>{entry.projectName || "—"}</td>
                    <td className="task-name">{entry.taskName || "—"}</td><td>{minutesToText(entry.minutes)}</td>
                    <td>{entry.note || "—"}</td>
                    <td>{entry.startedAt ? new Date(entry.startedAt).toLocaleString() : "—"}</td>
                    <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {!workspaceTimeLoading && !(workspaceTimeData?.data || []).length && (
                  <tr><td colSpan="7" style={{textAlign:"center",padding:32,color:"#64748b"}}>No time entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="tw-pagination">
            <span>{workspaceTimeData?.pagination?.total ? `${workspaceTimeData.pagination.total} time entries` : "No entries"}</span>
            <div>
              <button disabled={workspaceTimePage <= 1} onClick={() => setWorkspaceTimePage(p=>Math.max(1,p-1))}><ChevronLeft size={14}/></button>
              <button className="active">{workspaceTimePage}</button>
              <span>of {workspaceTimeData?.pagination?.totalPages || 1}</span>
              <button disabled={workspaceTimePage >= (workspaceTimeData?.pagination?.totalPages || 1)}
                onClick={() => setWorkspaceTimePage(p=>Math.min(workspaceTimeData?.pagination?.totalPages || 1,p+1))}><ChevronRight size={14}/></button>
            </div>
          </div>
        </section>
      )}

      {workspaceTab === "Files" && (
        <section className="tw-tasks-section">
          <div className="tw-section-head">
            <div>
              <h2>Files</h2>
              <p>Store and share files connected to this team's projects and tasks.</p>
            </div>
            <div className="tw-section-actions">
              <input
                ref={workspaceFileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={uploadWorkspaceFile}
              />
              <button
                className="primary"
                disabled={workspaceFileUploading}
                onClick={() => workspaceFileInputRef.current?.click()}
              >
                <Upload size={14}/>
                {workspaceFileUploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </div>

          <div className="tw-filters">
            <label>
              <Search size={14}/>
              <input
                value={workspaceFileSearch}
                onChange={(e) => setWorkspaceFileSearch(e.target.value)}
                placeholder="Search files..."
              />
            </label>

            <select
              className="cxc-select"
              value={workspaceFileProject}
              onChange={(e) => {
                setWorkspaceFileProject(e.target.value);
                setWorkspaceFileTask("all");
              }}
            >
              <option value="all">All Projects</option>
              {workspaceProjects.map((project) => (
                <option value={project.id} key={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              className="cxc-select"
              value={workspaceFileTask}
              onChange={(e) => setWorkspaceFileTask(e.target.value)}
            >
              <option value="all">All Tasks</option>
              {workspaceFileTaskOptions
                .filter((task) =>
                  workspaceFileProject === "all" ||
                  String(task.projectId || "") === String(workspaceFileProject)
                )
                .map((task) => (
                  <option value={task.id} key={task.id}>{task.name}</option>
                ))}
            </select>

            <button
              className="reset"
              onClick={() => {
                setWorkspaceFileSearch("");
                setWorkspaceFileProject("all");
                setWorkspaceFileTask("all");
              }}
            >
              <RotateCcw size={13}/> Reset
            </button>
          </div>

          <div className="tw-table-wrap">
            <table className="tw-task-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Project</th>
                  <th>Task</th>
                  <th>Uploaded By</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaceFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="task-name">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <FileText size={16}/>
                        {file.originalName}
                      </span>
                    </td>
                    <td>{file.projectName || "—"}</td>
                    <td>{file.taskName || "—"}</td>
                    <td>{file.uploadedBy || "—"}</td>
                    <td>{formatFileSize(file.size)}</td>
                    <td>{file.createdAt ? new Date(file.createdAt).toLocaleString() : "—"}</td>
                    <td>
                      <div className="tw-row-actions">
                        <Eye
                          size={14}
                          title="Open file"
                          style={{ cursor: "pointer" }}
                          onClick={() => openWorkspaceFile(file)}
                        />
                        <Download
                          size={14}
                          title="Open / download"
                          style={{ cursor: "pointer" }}
                          onClick={() => openWorkspaceFile(file)}
                        />
                        <MoreVertical
                          size={14}
                          title="Delete file"
                          style={{ cursor: "pointer" }}
                          onClick={() => removeWorkspaceFile(file)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {!workspaceFilesLoading && !workspaceFiles.length && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 36, color: "#64748b" }}>
                      No files yet. Upload a file and optionally associate it with a project or task.
                    </td>
                  </tr>
                )}

                {workspaceFilesLoading && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: 36, color: "#64748b" }}>
                      Loading files...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {workspaceTab === "Team" && (
        <section className="tw-tasks-section">
          <div className="tw-section-head">
            <div>
              <h2>Team</h2>
              <p>
                Live assignments, project ownership, workload, delivery,
                productivity, and tracked time for active team members.
              </p>
            </div>

            <div className="tw-section-actions">
              <button
                type="button"
                onClick={() => setWorkspaceTab("Reports")}
              >
                <Flag size={14} /> View Reports
              </button>

              <button
                type="button"
                className="primary"
                onClick={handleOpenInvite}
              >
                <Plus size={14} /> Invite Member
              </button>
            </div>
          </div>

          <div className="tw-stat-strip" style={{ marginBottom: 16 }}>
            {[
              [
                "Active Members",
                workspaceMembers.length,
                "Current team",
              ],
              [
                "Tasks Assigned",
                workspaceTeamTotals.assigned,
                "Across members",
              ],
              [
                "Tasks Completed",
                workspaceTeamTotals.completed,
                "Delivered work",
              ],
              [
                "Hours Logged",
                `${(
                  workspaceTeamTotals.loggedMinutes / 60
                ).toFixed(1)}h`,
                "Tracked time",
              ],
            ].map(([label, value, sub]) => (
              <div className="tw-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>

          <div className="tw-table-wrap">
            <table
              className="tw-task-table"
              style={{ minWidth: 1040 }}
            >
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th>Projects</th>
                  <th>Assigned</th>
                  <th>Open</th>
                  <th>Completed</th>
                  <th>Completion</th>
                  <th>On Time</th>
                  <th>Avg. Progress</th>
                  <th>Time Logged</th>
                  <th>Workload</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {workspaceTeamPerformanceRows.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <span className="tw-assignee">
                        <span className="tw-avatar">
                          {String(member.name || "TM")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </span>

                        <span
                          style={{
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <strong
                            style={{
                              color: "#0f172a",
                              fontSize: 12,
                            }}
                          >
                            {member.name}
                          </strong>

                          {member.email && (
                            <small
                              style={{
                                color: "#94a3b8",
                                fontSize: 10.5,
                              }}
                            >
                              {member.email}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>

                    <td>{formatTaskStatus(member.role || "member")}</td>

                    <td>{member.ownedProjects}</td>

                    <td>{member.assigned}</td>

                    <td>{member.openTasks}</td>

                    <td>{member.completed}</td>

                    <td>
                      <span className="tw-report-rate">
                        {member.completionRate.toFixed(1)}%
                      </span>
                    </td>

                    <td>{member.onTimeRate.toFixed(1)}%</td>

                    <td>
                      <div className="tw-report-progress-cell">
                        <i>
                          <b
                            style={{
                              width: `${Math.min(
                                100,
                                member.avgProgress,
                              )}%`,
                            }}
                          />
                        </i>
                        <span>{member.avgProgress.toFixed(1)}%</span>
                      </div>
                    </td>

                    <td>{minutesToText(member.loggedMinutes)}</td>

                    <td>
                      <div
                        className="tw-project-progress"
                        style={{ minWidth: 110 }}
                      >
                        <i style={{ width: 68 }}>
                          <b
                            style={{
                              width: `${Math.min(
                                100,
                                member.workloadPercent,
                              )}%`,
                            }}
                          />
                        </i>
                        <span>{member.workloadPercent}%</span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          background: "#fff",
                          padding: "6px 9px",
                          color: "#2563eb",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        onClick={() => openGlobalMemberResult(member)}
                      >
                        View Tasks
                      </button>
                    </td>
                  </tr>
                ))}

                {workspaceReportsLoading &&
                  !workspaceTeamPerformanceRows.length && (
                    <tr>
                      <td
                        colSpan="12"
                        style={{
                          textAlign: "center",
                          padding: 34,
                          color: "#64748b",
                        }}
                      >
                        Loading team performance...
                      </td>
                    </tr>
                  )}

                {!workspaceReportsLoading &&
                  !workspaceTeamPerformanceRows.length && (
                    <tr>
                      <td
                        colSpan="12"
                        style={{
                          textAlign: "center",
                          padding: 34,
                          color: "#64748b",
                        }}
                      >
                        No active team members yet.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>

          <div
            className="tw-bottom-dashboard"
            style={{ marginTop: 16 }}
          >
            <div className="tw-mini-card workload">
              <div className="tw-mini-head">
                <strong>Team Workload</strong>
                <span>Live</span>
              </div>

              {workspaceTeamPerformanceRows
                .slice(0, 8)
                .map((member) => (
                  <div className="tw-work-row" key={member.id}>
                    <span className="tw-avatar">
                      {String(member.name || "TM")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>{member.name}</span>
                    <i>
                      <b
                        style={{
                          width: `${Math.min(
                            100,
                            member.workloadPercent,
                          )}%`,
                        }}
                      />
                    </i>
                    <em>{member.openTasks} open</em>
                  </div>
                ))}

              {!workspaceTeamPerformanceRows.length && (
                <div
                  style={{
                    padding: 18,
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No workload data yet.
                </div>
              )}
            </div>

            <div className="tw-mini-card workload">
              <div className="tw-mini-head">
                <strong>Productivity</strong>
                <span>Live</span>
              </div>

              {workspaceTeamPerformanceRows
                .slice()
                .sort(
                  (a, b) =>
                    b.completionRate - a.completionRate,
                )
                .slice(0, 8)
                .map((member) => (
                  <div className="tw-work-row" key={member.id}>
                    <span className="tw-avatar">
                      {String(member.name || "TM")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>{member.name}</span>
                    <i>
                      <b
                        style={{
                          width: `${Math.min(
                            100,
                            member.completionRate,
                          )}%`,
                        }}
                      />
                    </i>
                    <em>
                      {member.completionRate.toFixed(1)}%
                    </em>
                  </div>
                ))}
            </div>

            <div className="tw-mini-card workload">
              <div className="tw-mini-head">
                <strong>Tracked Time</strong>
                <span>Live</span>
              </div>

              {workspaceTeamPerformanceRows
                .slice()
                .sort(
                  (a, b) =>
                    b.loggedMinutes - a.loggedMinutes,
                )
                .slice(0, 8)
                .map((member) => (
                  <div className="tw-work-row" key={member.id}>
                    <span className="tw-avatar">
                      {String(member.name || "TM")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <span>{member.name}</span>
                    <i>
                      <b
                        style={{
                          width: `${Math.min(
                            100,
                            (member.loggedMinutes /
                              Math.max(
                                1,
                                ...workspaceTeamPerformanceRows.map(
                                  (row) => row.loggedMinutes,
                                ),
                              )) *
                              100,
                          )}%`,
                        }}
                      />
                    </i>
                    <em>{minutesToText(member.loggedMinutes)}</em>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {workspaceTab === "Reports" && (
        <section className="tw-tasks-section tw-reports-section">
          <div className="tw-section-head tw-report-head">
            <div>
              <h2>Reports & Analytics</h2>
              <p>Live task, delivery, workload, activity, and time analytics.</p>
            </div>

            <div className="tw-section-actions tw-report-actions">
              <label className="tw-report-date">
                <span>From</span>
                <input
                  className="cxc-select"
                  type="date"
                  value={workspaceReportDateFrom}
                  onChange={(e) => setWorkspaceReportDateFrom(e.target.value)}
                />
              </label>

              <label className="tw-report-date">
                <span>To</span>
                <input
                  className="cxc-select"
                  type="date"
                  value={workspaceReportDateTo}
                  onChange={(e) => setWorkspaceReportDateTo(e.target.value)}
                />
              </label>

              <button
                className="tw-report-reset-btn"
                onClick={() => {
                  setWorkspaceReportDateFrom("");
                  setWorkspaceReportDateTo("");
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                className="tw-report-export-btn"
                onClick={exportWorkspaceReports}
                disabled={workspaceReportsExporting || workspaceReportsLoading}
              >
                <Download size={15} />
                {workspaceReportsExporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          <div className="tw-stat-strip tw-report-stat-strip">
            {[
              ["Tasks Created", workspaceReports?.summary?.tasksCreated || 0, "Total created"],
              ["Tasks Completed", workspaceReports?.summary?.tasksCompleted || 0, "Completed work"],
              ["Completion Rate", `${workspaceReports?.summary?.completionRate || 0}%`, "Delivery rate"],
              ["On Time", `${workspaceReports?.summary?.onTimeRate || 0}%`, "Completed on time"],
              ["Avg. Progress", `${workspaceReports?.summary?.avgProgress || 0}%`, "Across tasks"],
              ["Hours Logged", `${workspaceReports?.summary?.hoursLogged || 0}h`, "Tracked work"],
            ].map(([label, value, sub]) => (
              <div className="tw-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{sub}</small>
              </div>
            ))}
          </div>

          <div className="tw-report-trend-card">
            <div className="tw-report-card-head">
              <div>
                <strong>14-Day Task Trend</strong>
                <span>Created vs. completed tasks</span>
              </div>

              <div className="tw-report-trend-legend">
                <span className="created"><i /> Created</span>
                <span className="completed"><i /> Completed</span>
              </div>
            </div>

            {workspaceReportTrend.length ? (
              <>
                <div className="tw-report-chart">
                  <svg
                    viewBox="0 0 680 190"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Fourteen day task trend"
                  >
                    {[0, 1, 2, 3, 4].map((line) => {
                      const y = 16 + line * 39;
                      return (
                        <line
                          key={line}
                          x1="18"
                          x2="662"
                          y1={y}
                          y2={y}
                          className="tw-report-grid-line"
                        />
                      );
                    })}

                    <polyline
                      points={reportTrendPoints("created")}
                      className="tw-report-line created"
                    />

                    <polyline
                      points={reportTrendPoints("completed")}
                      className="tw-report-line completed"
                    />

                    {workspaceReportTrend.map((item, index) => {
                      const x =
                        18 +
                        (workspaceReportTrend.length === 1
                          ? 322
                          : (index / (workspaceReportTrend.length - 1)) * 644);

                      const createdY =
                        16 +
                        156 -
                        (Number(item.created || 0) / workspaceReportTrendMax) * 156;

                      const completedY =
                        16 +
                        156 -
                        (Number(item.completed || 0) / workspaceReportTrendMax) * 156;

                      return (
                        <g key={`${item.date}-${index}`}>
                          <circle
                            cx={x}
                            cy={createdY}
                            r="3.8"
                            className="tw-report-dot created"
                          />
                          <circle
                            cx={x}
                            cy={completedY}
                            r="3.8"
                            className="tw-report-dot completed"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="tw-report-chart-labels">
                  {workspaceReportTrend.map((item, index) => {
                    const showLabel =
                      index === 0 ||
                      index === workspaceReportTrend.length - 1 ||
                      index % 2 === 0;

                    return (
                      <span key={`${item.date}-label`}>
                        {showLabel
                          ? new Date(`${item.date}T00:00:00`).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )
                          : ""}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="tw-report-empty">
                No task trend data for this period.
              </div>
            )}
          </div>

          <div className="tw-report-grid">
            <div className="tw-mini-card tw-report-breakdown">
              <div className="tw-mini-head">
                <strong>Tasks by Status</strong>
                <span>Live</span>
              </div>

              <div className="tw-report-breakdown-list">
                {(workspaceReports?.tasksByStatus || []).map((item) => {
                  const total = Math.max(
                    1,
                    (workspaceReports?.tasksByStatus || []).reduce(
                      (sum, row) => sum + Number(row.count || 0),
                      0
                    )
                  );

                  const percent = Math.round(
                    (Number(item.count || 0) / total) * 100
                  );

                  return (
                    <div className="tw-report-breakdown-row" key={item.key}>
                      <div>
                        <span>{formatTaskStatus(item.key)}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <i>
                        <b style={{ width: `${percent}%` }} />
                      </i>
                    </div>
                  );
                })}

                {!(workspaceReports?.tasksByStatus || []).length && (
                  <div className="tw-report-empty compact">No status data.</div>
                )}
              </div>
            </div>

            <div className="tw-mini-card tw-report-breakdown">
              <div className="tw-mini-head">
                <strong>Tasks by Priority</strong>
                <span>Live</span>
              </div>

              <div className="tw-report-breakdown-list priority">
                {(workspaceReports?.tasksByPriority || []).map((item) => {
                  const total = Math.max(
                    1,
                    (workspaceReports?.tasksByPriority || []).reduce(
                      (sum, row) => sum + Number(row.count || 0),
                      0
                    )
                  );

                  const percent = Math.round(
                    (Number(item.count || 0) / total) * 100
                  );

                  return (
                    <div className="tw-report-breakdown-row" key={item.key}>
                      <div>
                        <span>{formatTaskStatus(item.key)}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <i>
                        <b style={{ width: `${percent}%` }} />
                      </i>
                    </div>
                  );
                })}

                {!(workspaceReports?.tasksByPriority || []).length && (
                  <div className="tw-report-empty compact">No priority data.</div>
                )}
              </div>
            </div>

            <div className="tw-mini-card workload tw-report-time-card">
              <div className="tw-mini-head">
                <strong>Time by Member</strong>
                <span>Live</span>
              </div>

              {(workspaceReports?.timeByMember || []).slice(0, 8).map((item) => (
                <div className="tw-work-row" key={item.id}>
                  <span>{item.name}</span>
                  <i>
                    <b
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(item.minutes || 0) /
                            Math.max(
                              1,
                              ...(workspaceReports?.timeByMember || []).map(
                                (row) => Number(row.minutes || 0)
                              )
                            )) *
                            100
                        )}%`,
                      }}
                    />
                  </i>
                  <em>{minutesToText(item.minutes)}</em>
                </div>
              ))}

              {!(workspaceReports?.timeByMember || []).length && (
                <div className="tw-report-empty compact">No tracked time.</div>
              )}
            </div>

            <div className="tw-mini-card workload tw-report-project-card">
              <div className="tw-mini-head">
                <strong>Project Delivery</strong>
                <span>Live</span>
              </div>

              {(workspaceReports?.projects || []).slice(0, 8).map((project) => (
                <div className="tw-work-row" key={project.id}>
                  <span>{project.name}</span>
                  <i>
                    <b style={{ width: `${Number(project.avgProgress || 0)}%` }} />
                  </i>
                  <em>
                    {project.completed}/{project.tasks}
                  </em>
                </div>
              ))}

              {!(workspaceReports?.projects || []).length && (
                <div className="tw-report-empty compact">No project data.</div>
              )}
            </div>
          </div>

          <div className="tw-report-table-card">
            <div className="tw-report-card-head">
              <div>
                <strong>Team Performance</strong>
                <span>Assignments, delivery, progress, and tracked time</span>
              </div>
            </div>

            <div className="tw-table-wrap">
              <table className="tw-task-table tw-report-table">
                <thead>
                  <tr>
                    <th>Team Member</th>
                    <th>Assigned</th>
                    <th>Completed</th>
                    <th>Completion</th>
                    <th>On Time</th>
                    <th>Avg. Progress</th>
                    <th>Time Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {(workspaceReports?.members || []).map((member) => (
                    <tr key={member.id}>
                      <td className="task-name">{member.name}</td>
                      <td>{member.assigned}</td>
                      <td>{member.completed}</td>
                      <td>
                        <span className="tw-report-rate">
                          {member.completionRate}%
                        </span>
                      </td>
                      <td>{member.onTimeRate}%</td>
                      <td>
                        <div className="tw-report-progress-cell">
                          <i>
                            <b
                              style={{
                                width: `${Math.min(
                                  100,
                                  Number(member.avgProgress || 0)
                                )}%`,
                              }}
                            />
                          </i>
                          <span>{member.avgProgress}%</span>
                        </div>
                      </td>
                      <td>{minutesToText(member.loggedMinutes)}</td>
                    </tr>
                  ))}

                  {!workspaceReportsLoading &&
                    !(workspaceReports?.members || []).length && (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            textAlign: "center",
                            padding: 32,
                            color: "#64748b",
                          }}
                        >
                          No report data yet.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="tw-report-lower-grid">
            <div className="tw-mini-card tw-report-activity-card">
              <div className="tw-mini-head">
                <strong>Recent Activity</strong>
                <span>Latest 20</span>
              </div>

              <div className="tw-report-activity-list">
                {(workspaceReports?.recentActivity || []).map((activity) => {
                  const presentation = reportActivityPresentation(activity);
                  const ActivityIcon = presentation.Icon;

                  return (
                    <div className="tw-report-activity-row" key={activity.id}>
                      <span
                        className={`tw-report-activity-icon ${presentation.tone}`}
                      >
                        <ActivityIcon size={15} />
                      </span>

                      <div className="tw-report-activity-main">
                        <div>
                          <strong>{presentation.label}</strong>
                          <span>{activity.userName || "Team member"}</span>
                        </div>
                        <p>{presentation.detail}</p>
                      </div>

                      <time>
                        {activity.createdAt
                          ? new Date(activity.createdAt).toLocaleString()
                          : "—"}
                      </time>
                    </div>
                  );
                })}

                {!(workspaceReports?.recentActivity || []).length && (
                  <div className="tw-report-empty">No recent task activity.</div>
                )}
              </div>
            </div>

            <div className="tw-mini-card tw-report-deadline-card">
              <div className="tw-mini-head">
                <strong>Upcoming Deadlines</strong>
                <span>Live</span>
              </div>

              <div className="tw-report-deadline-list">
                {(workspaceReports?.upcomingDeadlines || []).map((task) => (
                  <div className="tw-report-deadline-row" key={task.id}>
                    <span className={`tw-report-priority-dot ${task.priority || "medium"}`} />

                    <div>
                      <strong>{task.name}</strong>
                      <span>
                        {task.project || "No project"}
                        {task.assignee ? ` · ${task.assignee}` : ""}
                      </span>
                    </div>

                    <div className="tw-report-deadline-date">
                      <b>{formatDate(task.dueDate)}</b>
                      <em>{deadlineDistance(task.dueDate)}</em>
                    </div>
                  </div>
                ))}

                {!(workspaceReports?.upcomingDeadlines || []).length && (
                  <div className="tw-report-empty">No upcoming deadlines.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {[
        "Overview",
        "Tasks",
        "My Tasks",
        "Board",
        "Calendar",
      ].includes(workspaceTab) && (
        <div className="tw-bottom-dashboard">
          <div className="tw-mini-card">
            <div className="tw-mini-head">
              <strong>Tasks by Status</strong>
              <span>Live</span>
            </div>
            <div className="tw-donut status-donut">
              <b>
                {workspaceMetrics.tasksAssigned || 0}
                <small>Total Tasks</small>
              </b>
            </div>
            <div className="tw-legend">
              {statusBreakdown.map((x) => {
                const total = Number(workspaceMetrics.tasksAssigned || 0);
                const pct = total
                  ? ((Number(x.count || 0) / total) * 100).toFixed(1)
                  : "0.0";
                return (
                  <p key={x.key}>
                    <i />
                    {formatTaskStatus(x.key)}
                    <span>
                      {x.count} ({pct}%)
                    </span>
                  </p>
                );
              })}
              {!statusBreakdown.length && <p>No task data yet</p>}
            </div>
          </div>

          <div className="tw-mini-card">
            <div className="tw-mini-head">
              <strong>Tasks by Priority</strong>
              <span>Live</span>
            </div>
            <div className="tw-donut priority-donut">
              <b>
                {workspaceMetrics.tasksAssigned || 0}
                <small>Total Tasks</small>
              </b>
            </div>
            <div className="tw-legend short">
              {priorityBreakdown.map((x) => {
                const total = Number(workspaceMetrics.tasksAssigned || 0);
                const pct = total
                  ? ((Number(x.count || 0) / total) * 100).toFixed(1)
                  : "0.0";
                return (
                  <p key={x.key}>
                    <i />
                    {formatTaskStatus(x.key)}
                    <span>
                      {x.count} ({pct}%)
                    </span>
                  </p>
                );
              })}
              {!priorityBreakdown.length && <p>No priority data yet</p>}
            </div>
          </div>

          <div className="tw-mini-card workload">
            <div className="tw-mini-head">
              <strong>Team Workload</strong>
              <span>Live</span>
            </div>
            {memberNames.map((m) => (
              <div className="tw-work-row" key={m.name}>
                <span className="tw-avatar">
                  {m.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>{m.name}</span>
                <i>
                  <b style={{ width: `${m.value}%` }} />
                </i>
                <em>{m.value}%</em>
              </div>
            ))}
            {!memberNames.length && (
              <div style={{ padding: 16, color: "#6b7280" }}>
                No workload data yet.
              </div>
            )}
          </div>

          <TeamActivityCard activity={activities} teamId={selectedTeamId} />

          <div className="tw-mini-card deadlines">
            <div className="tw-mini-head">
              <strong>Upcoming Deadlines</strong>
              <span>Next 7 Days</span>
            </div>
            {upcomingDeadlines.map((t) => (
              <div className="tw-deadline" key={t.id}>
                <div>
                  <b>{t.name}</b>
                  <span>{t.project || "No project"}</span>
                </div>
                <span>{formatDate(t.dueDate)}</span>
                <em>{deadlineDistance(t.dueDate)}</em>
              </div>
            ))}
            {!upcomingDeadlines.length && (
              <div style={{ padding: 16, color: "#6b7280" }}>
                No upcoming deadlines.
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setWorkspaceTab("Calendar");
                setWorkspaceTaskView("calendar");
              }}
            >
              View full calendar →
            </button>
          </div>
        </div>
      )}

      {/* =================================================
        MODALS
      ================================================= */}

      {taskDetailOpen && selectedWorkspaceTask && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => setTaskDetailOpen(false)}
        >
          <div
            style={{
              ...SEAT_CARD,
              width: "min(680px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3 style={SEAT_TITLE}>
                  {selectedWorkspaceTask.name}
                </h3>
                <p style={{ ...SEAT_TEXT, marginBottom: 0 }}>
                  {selectedWorkspaceTask.project || "No project"}
                </p>
              </div>

              <span
                className={`tw-pill status-${String(
                  selectedWorkspaceTask.status || "pending",
                ).replaceAll("_", "-")}`}
              >
                {formatTaskStatus(selectedWorkspaceTask.status)}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 14,
                marginTop: 22,
              }}
            >
              {[
                [
                  "Priority",
                  formatTaskStatus(
                    selectedWorkspaceTask.priority,
                  ),
                ],
                [
                  "Assignee",
                  selectedWorkspaceTask.assignee ||
                    "Unassigned",
                ],
                [
                  "Due Date",
                  formatDate(selectedWorkspaceTask.dueDate),
                ],
                [
                  "Progress",
                  `${Number(
                    selectedWorkspaceTask.progress || 0,
                  )}%`,
                ],
                [
                  "Time Logged",
                  minutesToText(
                    selectedWorkspaceTask.loggedMinutes,
                  ),
                ],
                [
                  "Estimated Time",
                  minutesToText(
                    selectedWorkspaceTask.estimatedMinutes,
                  ),
                ],
                [
                  "Task Type",
                  formatTaskStatus(
                    selectedWorkspaceTask.taskType || "task",
                  ),
                ],
                [
                  "Last Activity",
                  selectedWorkspaceTask.updatedAt
                    ? new Date(
                        selectedWorkspaceTask.updatedAt,
                      ).toLocaleString()
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: 12,
                    background: "#f8fafc",
                    border: "1px solid #eef2f7",
                    borderRadius: 10,
                  }}
                >
                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {!!selectedWorkspaceTask.description && (
              <div style={{ marginTop: 18 }}>
                <strong>Description</strong>
                <p style={SEAT_TEXT}>
                  {selectedWorkspaceTask.description}
                </p>
              </div>
            )}

            {!!(selectedWorkspaceTask.labels || []).length && (
              <div style={{ marginTop: 18 }}>
                <strong>Labels</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {(selectedWorkspaceTask.labels || []).map(
                    (label) => (
                      <span className="tw-label" key={label}>
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                ...SEAT_ROW,
                marginTop: 22,
              }}
            >
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                onClick={() => {
                  setTaskDetailOpen(false);
                  addWorkspaceTaskTime(
                    selectedWorkspaceTask,
                  );
                }}
              >
                Log Time
              </button>

              <button
                type="button"
                style={SEAT_BTN_PRIMARY}
                onClick={() => {
                  setTaskDetailOpen(false);
                  openEditWorkspaceTask(
                    selectedWorkspaceTask,
                  );
                }}
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {timeModalOpen && timeTask && (
        <div
          style={SEAT_OVERLAY}
          onClick={() =>
            !timeSaving && setTimeModalOpen(false)
          }
        >
          <form
            style={{
              ...SEAT_CARD,
              width: "min(500px, 94vw)",
            }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveWorkspaceTaskTime}
          >
            <h3 style={SEAT_TITLE}>Log Time</h3>
            <p style={SEAT_TEXT}>
              Add tracked time to <strong>{timeTask.name}</strong>.
            </p>

            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <label>
                <span>Minutes</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={timeForm.minutes}
                  onChange={(e) =>
                    setTimeForm((form) => ({
                      ...form,
                      minutes: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    marginTop: 5,
                  }}
                />
              </label>

              <label>
                <span>Note</span>
                <textarea
                  rows="4"
                  placeholder="What did you work on?"
                  value={timeForm.note}
                  onChange={(e) =>
                    setTimeForm((form) => ({
                      ...form,
                      note: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    marginTop: 5,
                  }}
                />
              </label>

              <div
                style={{
                  padding: 11,
                  borderRadius: 9,
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Already logged:{" "}
                <strong style={{ color: "#111827" }}>
                  {minutesToText(timeTask.loggedMinutes)}
                </strong>
              </div>
            </div>

            <div
              style={{
                ...SEAT_ROW,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                disabled={timeSaving}
                onClick={() => setTimeModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={SEAT_BTN_PRIMARY}
                disabled={timeSaving}
              >
                {timeSaving ? "Saving..." : "Log Time"}
              </button>
            </div>
          </form>
        </div>
      )}

      {taskModalOpen && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => !taskSaving && setTaskModalOpen(false)}
        >
          <form className="form-cxc-select"
            style={{
              ...SEAT_CARD,
              width: "min(760px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveWorkspaceTask}
          >
            <h3 style={SEAT_TITLE}>
              {editingWorkspaceTask ? "Edit Task" : "New Task"}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Task name</span>
                <input className="cxc-select"
                  required
                  value={taskForm.name}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label>
                <span>Project</span>
                <select className="cxc-select"
                  value={taskForm.projectId}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, projectId: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="">No project</option>
                  {workspaceProjects.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Assignee</span>
                <select className="cxc-select"
                  value={taskForm.assigneeId}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, assigneeId: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((member) => (
                    <option value={member.id} key={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select className="cxc-select"
                  value={taskForm.status}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, status: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select className="cxc-select"
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input className="cxc-select"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label>
                <span>Task type</span>
                <select className="cxc-select"
                  value={taskForm.taskType}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, taskType: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="meeting">Meeting</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </label>

              <label>
                <span>Progress %</span>
                <input className="cxc-select"
                  type="number"
                  min="0"
                  max="100"
                  value={taskForm.progress}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, progress: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label>
                <span>Estimated time (minutes)</span>
                <input className="cxc-select"
                  type="number"
                  min="0"
                  value={taskForm.estimatedMinutes}
                  onChange={(e) =>
                    setTaskForm((f) => ({
                      ...f,
                      estimatedMinutes: e.target.value,
                    }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Labels (comma separated)</span>
                <input className="cxc-select"
                  value={taskForm.labels}
                  onChange={(e) =>
                    setTaskForm((f) => ({ ...f, labels: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>
            </div>

            <div style={{ ...SEAT_ROW, marginTop: 20 }}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                disabled={taskSaving}
                onClick={() => setTaskModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={SEAT_BTN_PRIMARY}
                disabled={taskSaving}
              >
                {taskSaving
                  ? "Saving..."
                  : editingWorkspaceTask
                    ? "Save Changes"
                    : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {projectModalOpen && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => {
            if (projectSaving) return;
            setProjectModalOpen(false);
            resetWorkspaceProjectForm();
          }}
        >
          <form
            className="tw-project-modal"
            style={{ ...SEAT_CARD, width: "min(720px, 96vw)" }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveWorkspaceProject}
          >
            <div className="tw-project-modal-head">
              <div>
                <h3 style={SEAT_TITLE}>
                  {editingWorkspaceProject ? "Edit Project" : "New Project"}
                </h3>
                <p>
                  {editingWorkspaceProject
                    ? "Update project delivery, ownership, dates, and progress."
                    : "Create a project and connect tasks, files, and tracked time."}
                </p>
              </div>

              <button
                type="button"
                className="tw-project-modal-close"
                disabled={projectSaving}
                onClick={() => {
                  setProjectModalOpen(false);
                  resetWorkspaceProjectForm();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="tw-project-form-grid">
              <label className="full">
                <span>Project name</span>
                <input
                  required
                  value={projectForm.name}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      name: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="full">
                <span>Description</span>
                <textarea
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      description: e.target.value,
                    }))
                  }
                  rows="4"
                  placeholder="Describe the project scope or objective..."
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={projectForm.status}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select
                  value={projectForm.priority}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      priority: e.target.value,
                    }))
                  }
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label>
                <span>Owner</span>
                <select
                  value={projectForm.ownerId}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      ownerId: e.target.value,
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Progress %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={projectForm.progress}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      progress: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      startDate: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  value={projectForm.dueDate}
                  onChange={(e) =>
                    setProjectForm((form) => ({
                      ...form,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div style={{ ...SEAT_ROW, marginTop: 20 }}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                disabled={projectSaving}
                onClick={() => {
                  setProjectModalOpen(false);
                  resetWorkspaceProjectForm();
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={SEAT_BTN_PRIMARY}
                disabled={projectSaving}
              >
                {projectSaving
                  ? "Saving..."
                  : editingWorkspaceProject
                    ? "Save Changes"
                    : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {projectDetailOpen && selectedWorkspaceProject && (
        <div
          className="tw-project-drawer-overlay"
          onClick={() => setProjectDetailOpen(false)}
        >
          <aside
            className="tw-project-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tw-project-drawer-head">
              <div className="tw-project-drawer-title">
                <span className="tw-project-drawer-icon">
                  <FolderKanban size={18} />
                </span>

                <div>
                  <h3>{selectedWorkspaceProject.name}</h3>
                  <p>
                    {selectedWorkspaceProject.description ||
                      "No project description"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProjectDetailOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            {projectDetailLoading ? (
              <div className="tw-project-drawer-loading">
                Loading project details...
              </div>
            ) : (
              <>
                <div className="tw-project-drawer-actions">
                  <button
                    type="button"
                    onClick={() =>
                      openEditWorkspaceProject(selectedWorkspaceProject)
                    }
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      goToProjectTasks(selectedWorkspaceProject)
                    }
                  >
                    <ListTodo size={14} /> Tasks
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      goToProjectFiles(selectedWorkspaceProject)
                    }
                  >
                    <FileText size={14} /> Files
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      goToProjectTime(selectedWorkspaceProject)
                    }
                  >
                    <Timer size={14} /> Time
                  </button>
                </div>

                <div className="tw-project-detail-stats">
                  <div>
                    <span>Total Tasks</span>
                    <strong>
                      {Number(selectedWorkspaceProject.taskCount || 0)}
                    </strong>
                  </div>

                  <div>
                    <span>Completed</span>
                    <strong>
                      {Number(selectedWorkspaceProject.completedTasks || 0)}
                    </strong>
                  </div>

                  <div>
                    <span>Open</span>
                    <strong>
                      {Number(selectedWorkspaceProject.openTasks || 0)}
                    </strong>
                  </div>

                  <div>
                    <span>Overdue</span>
                    <strong>
                      {Number(selectedWorkspaceProject.overdueTasks || 0)}
                    </strong>
                  </div>

                  <div>
                    <span>Hours Logged</span>
                    <strong>
                      {Number(
                        selectedWorkspaceProject.loggedHours ||
                          Number(
                            selectedWorkspaceProject.loggedMinutes || 0,
                          ) / 60,
                      ).toFixed(1)}
                      h
                    </strong>
                  </div>

                  <div>
                    <span>Progress</span>
                    <strong>
                      {Number(selectedWorkspaceProject.progress || 0)}%
                    </strong>
                  </div>
                </div>

                <div className="tw-project-info-grid">
                  <div>
                    <span>Status</span>
                    <strong>
                      {formatTaskStatus(
                        selectedWorkspaceProject.status || "active",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Priority</span>
                    <strong>
                      {formatTaskStatus(
                        selectedWorkspaceProject.priority || "medium",
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Owner</span>
                    <strong>
                      {selectedWorkspaceProject.ownerName || "Unassigned"}
                    </strong>
                  </div>

                  <div>
                    <span>Start Date</span>
                    <strong>
                      {formatDate(selectedWorkspaceProject.startDate)}
                    </strong>
                  </div>

                  <div>
                    <span>Due Date</span>
                    <strong>
                      {formatDate(selectedWorkspaceProject.dueDate)}
                    </strong>
                  </div>

                  <div>
                    <span>Updated</span>
                    <strong>
                      {selectedWorkspaceProject.updatedAt
                        ? new Date(
                            selectedWorkspaceProject.updatedAt,
                          ).toLocaleString()
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="tw-project-detail-section">
                  <div className="tw-project-detail-section-head">
                    <div>
                      <strong>Project Tasks</strong>
                      <span>
                        {(selectedWorkspaceProject.tasks || []).length} task(s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        goToProjectTasks(selectedWorkspaceProject)
                      }
                    >
                      View all
                    </button>
                  </div>

                  <div className="tw-project-detail-task-list">
                    {(selectedWorkspaceProject.tasks || [])
                      .slice(0, 8)
                      .map((task) => (
                        <div
                          className="tw-project-detail-task"
                          key={task.id}
                        >
                          <div>
                            <strong>{task.name || task.title}</strong>
                            <span>
                              {task.assignee || "Unassigned"} ·{" "}
                              {formatDate(task.dueDate)}
                            </span>
                          </div>

                          <div>
                            <span
                              className={`tw-project-status ${String(
                                task.status || "pending",
                              ).replaceAll("_", "-")}`}
                            >
                              {formatTaskStatus(task.status)}
                            </span>
                            <em>{minutesToText(task.loggedMinutes)}</em>
                          </div>
                        </div>
                      ))}

                    {!(selectedWorkspaceProject.tasks || []).length && (
                      <div className="tw-project-detail-empty">
                        No tasks are connected to this project yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="tw-project-detail-section">
                  <div className="tw-project-detail-section-head">
                    <div>
                      <strong>Recent Time Entries</strong>
                      <span>Work logged against this project</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        goToProjectTime(selectedWorkspaceProject)
                      }
                    >
                      View all
                    </button>
                  </div>

                  <div className="tw-project-time-list">
                    {(selectedWorkspaceProject.timeEntries || [])
                      .slice(0, 8)
                      .map((entry) => (
                        <div
                          className="tw-project-time-row"
                          key={entry.id}
                        >
                          <div>
                            <strong>{entry.userName || "Team member"}</strong>
                            <span>
                              {entry.taskName || "Project time"}
                              {entry.note ? ` · ${entry.note}` : ""}
                            </span>
                          </div>

                          <div>
                            <strong>{minutesToText(entry.minutes)}</strong>
                            <span>
                              {entry.createdAt
                                ? new Date(entry.createdAt).toLocaleString()
                                : "—"}
                            </span>
                          </div>
                        </div>
                      ))}

                    {!(selectedWorkspaceProject.timeEntries || []).length && (
                      <div className="tw-project-detail-empty">
                        No time has been logged to this project yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="tw-project-drawer-danger">
                  <button
                    type="button"
                    disabled={
                      projectDeletingId === selectedWorkspaceProject.id
                    }
                    onClick={() =>
                      removeWorkspaceProject(selectedWorkspaceProject)
                    }
                  >
                    <Trash2 size={15} />
                    Delete Project
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}


      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={handleInvite}
        inviting={inviting}
      />

      <DeleteMemberModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        member={selectedMember}
        onConfirm={handleConfirmDelete}
        removing={removing}
      />
      <ChangeMemberRoleModal
        open={roleModalOpen}
        member={roleMember}
        updating={roleUpdating}
        onClose={handleCloseChangeRole}
        onSubmit={handleChangeRole}
      />

      {addSeatConfirmOpen && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => {
            if (addingSeat) return;
            setAddSeatConfirmOpen(false);
            setAddSeatError("");
          }}
        >
          <div style={SEAT_CARD} onClick={(e) => e.stopPropagation()}>
            <h3 style={SEAT_TITLE}>Add Team Seat</h3>
            <p style={SEAT_TEXT}>
              Each additional team member costs $97/month and will be added to
              your existing subscription.
            </p>
            {addSeatError && (
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {addSeatError}
              </p>
            )}
            <div style={SEAT_ROW}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                onClick={() => {
                  setAddSeatConfirmOpen(false);
                  setAddSeatError("");
                }}
                disabled={addingSeat}
              >
                Cancel
              </button>
              <button
                type="button"
                style={SEAT_BTN_PRIMARY}
                onClick={handleAddSeatConfirmed}
                disabled={addingSeat}
              >
                {addingSeat ? "Adding..." : "Add Seat ($97/month)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {noSeatsOpen && (
        <div style={SEAT_OVERLAY} onClick={() => setNoSeatsOpen(false)}>
          <div style={SEAT_CARD} onClick={(e) => e.stopPropagation()}>
            <h3 style={SEAT_TITLE}>No seats available</h3>
            <p style={SEAT_TEXT}>
              Please add a seat before inviting another team member.
            </p>
            <div style={SEAT_ROW}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                onClick={() => setNoSeatsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={SEAT_BTN_PRIMARY}
                onClick={() => {
                  setAddSeatError("");
                  setNoSeatsOpen(false);
                  setAddSeatConfirmOpen(true);
                }}
              >
                Add Seat
              </button>
            </div>
          </div>
        </div>
      )}

      {keepRemoveSeatOpen && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => !seatBusy && setKeepRemoveSeatOpen(false)}
        >
          <div style={SEAT_CARD} onClick={(e) => e.stopPropagation()}>
            <h3 style={SEAT_TITLE}>Keep or remove this seat?</h3>
            <p style={SEAT_TEXT}>
              Keep this seat for another employee, or remove it from your
              subscription.
            </p>
            <div style={SEAT_ROW}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                onClick={handleKeepSeat}
                disabled={seatBusy}
              >
                Keep Seat
              </button>
              <button
                type="button"
                style={SEAT_BTN_PRIMARY}
                onClick={handleRemoveSeat}
                disabled={seatBusy}
              >
                {seatBusy ? "Removing..." : "Remove Seat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 30,
            right: 30,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 9999,
            minWidth: 280,
          }}
        >
          {toast.message}
        </div>
      )}
      {seatToast && (
        <div
          style={{
            position: "fixed",
            top: 30,
            right: 30,
            background: seatToast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 9999,
            minWidth: 280,
          }}
        >
          {seatToast.message}
        </div>
      )}
      <TeamAIInsightsModal
        open={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        loading={aiLoading}
        error={aiError}
        insights={aiInsights}
      />
    </div>
  );
}