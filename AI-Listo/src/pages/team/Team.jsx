import { useEffect, useMemo, useState } from "react";
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
    "Overview",
    "Projects",
    "Board",
    "Tasks",
    "My Tasks",
    "Calendar",
    "Time Tracking",
    "Files",
    "Team",
    "Reports",
  ];

  const [workspaceTab, setWorkspaceTab] = useState("Tasks");
  const [workspaceTaskView, setWorkspaceTaskView] = useState("table");

  const [workspaceOverview, setWorkspaceOverview] = useState(null);
  const [workspaceProjects, setWorkspaceProjects] = useState([]);
  const [workspaceTaskResponse, setWorkspaceTaskResponse] = useState({
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });

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

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const workspaceMembers = (filteredMembers || [])
    .map((member) => ({
      id: member?.userId || member?.user_id || member?.id,
      name: member?.name || member?.fullName || member?.email || "Team member",
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

  const loadWorkspaceData = async () => {
    try {
      setWorkspaceLoading(true);
      await Promise.all([loadWorkspaceOverview(), loadWorkspaceTasks()]);
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

      await Promise.all([loadWorkspaceOverview(), loadWorkspaceTasks()]);
    } catch (error) {
      console.error("MOVE TEAM TASK ERROR", error);
      window.alert(error?.message || "Could not update task status.");
    }
  };

  const addWorkspaceTaskTime = async (task) => {
    if (!selectedTeamId || !task?.id) return;

    const raw = window.prompt(`Minutes to log for "${task.name}"`, "30");

    if (raw === null) return;

    const minutes = Number(raw);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      window.alert("Enter a valid number of minutes.");
      return;
    }

    try {
      await logTeamWorkspaceTime(selectedTeamId, task.id, { minutes });

      await Promise.all([loadWorkspaceOverview(), loadWorkspaceTasks()]);
    } catch (error) {
      console.error("LOG TEAM TIME ERROR", error);
      window.alert(error?.message || "Could not log time.");
    }
  };

  const saveWorkspaceProject = async (event) => {
    event?.preventDefault?.();
    if (!selectedTeamId || !projectForm.name.trim()) return;

    try {
      setProjectSaving(true);

      await createTeamWorkspaceProject(selectedTeamId, {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null,
        priority: projectForm.priority,
        dueDate: projectForm.dueDate || null,
      });

      setProjectModalOpen(false);
      setProjectForm({
        name: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
      setNewMenuOpen(false);

      await loadWorkspaceOverview();
    } catch (error) {
      console.error("CREATE TEAM PROJECT ERROR", error);
      window.alert(error?.message || "Could not create project.");
    } finally {
      setProjectSaving(false);
    }
  };

  const calendarGroups = workspaceTasks.reduce((groups, task) => {
    const key = task?.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : "No due date";

    if (!groups[key]) groups[key] = [];
    groups[key].push(task);

    return groups;
  }, {});

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

  return (
    <div className="team-workspace">
      <div className="tw-new-header">
        <div>
          <h1>Team Workspace</h1>
          <p>Plan, organize, and execute internal projects with your team.</p>
        </div>
        <div className="tw-header-actions">
          <label className="tw-global-search">
            <Search size={15} />
            <input
              value={workspaceTaskSearch}
              onChange={(e) => setWorkspaceTaskSearch(e.target.value)}
              placeholder="Search tasks, projects, people..."
            />
          </label>
          <div style={{ position: "relative" }}>
            <button
              className="tw-new-btn"
              onClick={() => setNewMenuOpen((v) => !v)}
            >
              <Plus size={16} /> New
            </button>

            {newMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  minWidth: 170,
                  padding: 6,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 14px 35px rgba(15,23,42,.14)",
                  zIndex: 40,
                }}
              >
                <button
                  type="button"
                  onClick={openNewWorkspaceTask}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    textAlign: "left",
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  New Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectModalOpen(true);
                    setNewMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    textAlign: "left",
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  New Project
                </button>
              </div>
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
        {WORKSPACE_TABS.map((tab) => (
          <button
            key={tab}
            className={workspaceTab === tab ? "active" : ""}
            onClick={() => {
              setWorkspaceTab(tab);
              setWorkspaceTaskPage(1);

              if (tab === "Board") {
                setWorkspaceTaskView("board");
              } else if (tab === "Calendar") {
                setWorkspaceTaskView("calendar");
              } else if (tab === "Tasks" || tab === "My Tasks") {
                setWorkspaceTaskView("table");
              }
            }}
          >
            {tab}
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
              <button>
                <Upload size={14} /> Import
              </button>
              <button>
                <Download size={14} /> Export
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

            <span className="tw-view-label">View</span>

            <button
              className={workspaceTaskView === "table" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("table");
                if (workspaceTab === "Board" || workspaceTab === "Calendar") {
                  setWorkspaceTab("Tasks");
                }
              }}
            >
              <Table2 size={13} /> Table
            </button>

            <button
              className={workspaceTaskView === "board" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("board");
                setWorkspaceTab("Board");
              }}
            >
              <LayoutGrid size={13} /> Board
            </button>

            <button
              className={workspaceTaskView === "calendar" ? "active" : ""}
              onClick={() => {
                setWorkspaceTaskView("calendar");
                setWorkspaceTab("Calendar");
              }}
            >
              <CalendarDays size={13} /> Calendar
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
                          <div className="tw-row-actions">
                            <Eye
                              size={14}
                              onClick={() => openEditWorkspaceTask(task)}
                              style={{ cursor: "pointer" }}
                            />
                            <Pencil
                              size={14}
                              onClick={() => openEditWorkspaceTask(task)}
                              style={{ cursor: "pointer" }}
                            />
                            <MoreVertical
                              size={14}
                              onClick={() => removeWorkspaceTask(task)}
                              style={{ cursor: "pointer" }}
                            />
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
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(230px, 1fr))",
                gap: 12,
                overflowX: "auto",
                padding: 14,
              }}
            >
              {[
                ["pending", "Pending"],
                ["in_progress", "In Progress"],
                ["review", "Review"],
                ["completed", "Completed"],
              ].map(([status, label]) => {
                const items = workspaceTasks.filter(
                  (task) => task.status === status,
                );

                return (
                  <div
                    key={status}
                    style={{
                      minWidth: 230,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <strong>{label}</strong>
                      <span>{items.length}</span>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {items.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <strong style={{ display: "block", marginBottom: 5 }}>
                            {task.name}
                          </strong>
                          <small style={{ color: "#64748b" }}>
                            {task.project || "No project"}
                          </small>

                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              marginTop: 9,
                            }}
                          >
                            <span
                              className={`tw-pill priority-${String(task.priority || "medium").toLowerCase()}`}
                            >
                              {formatTaskStatus(task.priority)}
                            </span>
                            <span>{formatDate(task.dueDate)}</span>
                          </div>

                          <select
                            value={task.status}
                            onChange={(e) =>
                              changeWorkspaceTaskStatus(task, e.target.value)
                            }
                            style={{ width: "100%", marginTop: 10 }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      ))}

                      {!items.length && (
                        <div
                          style={{
                            color: "#94a3b8",
                            padding: 10,
                            textAlign: "center",
                          }}
                        >
                          No tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {workspaceTaskView === "calendar" && workspaceTab !== "My Tasks" && (
            <div style={{ padding: 14, display: "grid", gap: 12 }}>
              {Object.entries(calendarGroups)
                .sort(([a], [b]) => {
                  if (a === "No due date") return 1;
                  if (b === "No due date") return -1;
                  return a.localeCompare(b);
                })
                .map(([date, items]) => (
                  <div
                    key={date}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#f8fafc",
                        fontWeight: 700,
                      }}
                    >
                      {date === "No due date" ? date : formatDate(date)}
                    </div>

                    {items.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(220px, 1fr) 160px 120px 100px",
                          gap: 12,
                          alignItems: "center",
                          padding: "10px 12px",
                          borderTop: "1px solid #eef2f7",
                        }}
                      >
                        <div>
                          <strong>{task.name}</strong>
                          <div style={{ color: "#64748b", fontSize: 12 }}>
                            {task.project || "No project"}
                          </div>
                        </div>
                        <div>{task.assignee || "Unassigned"}</div>
                        <span
                          className={`tw-pill status-${String(task.status || "pending").replaceAll("_", "-")}`}
                        >
                          {formatTaskStatus(task.status)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditWorkspaceTask(task)}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {!workspaceTasks.length && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "#64748b",
                  }}
                >
                  No tasks to show on the calendar.
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {workspaceTab === "Overview" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Overview</h2>
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
        <section className="tw-tasks-section">
          <div className="tw-section-head">
            <div>
              <h2>Projects</h2>
              <p>Projects connected to the same task data.</p>
            </div>
            <button
              className="primary"
              onClick={() => setProjectModalOpen(true)}
            >
              <Plus size={14} /> New Project
            </button>
          </div>
          <div className="tw-table-wrap">
            <table className="tw-task-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                {workspaceProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="task-name">{project.name}</td>
                    <td>{formatTaskStatus(project.status || "active")}</td>
                    <td>{formatTaskStatus(project.priority || "medium")}</td>
                    <td>{project.ownerName || "—"}</td>
                    <td>{formatDate(project.dueDate)}</td>
                    <td>{Number(project.progress || 0)}%</td>
                    <td>
                      {project.completedTasks || 0}/{project.taskCount || 0}
                    </td>
                  </tr>
                ))}
                {!workspaceProjects.length && (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: 32,
                        color: "#64748b",
                      }}
                    >
                      No projects yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {workspaceTab === "Time Tracking" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Time Tracking</h2>
          <p style={{ color: "#64748b" }}>
            Logged time is connected to individual tasks, projects, team
            members, dashboard metrics, and reports.
          </p>
          <div className="tw-stat-strip" style={{ marginTop: 16 }}>
            <div className="tw-stat">
              <span>Hours Logged</span>
              <strong>
                {Number(workspaceMetrics.hoursLogged || 0).toLocaleString()}h
              </strong>
              <small>All tracked task time</small>
            </div>
          </div>
        </section>
      )}

      {workspaceTab === "Files" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Files</h2>
          <p style={{ color: "#64748b" }}>
            File associations are available in the backend schema for
            project/task-linked files. File upload UI will use the existing
            storage service.
          </p>
        </section>
      )}

      {workspaceTab === "Team" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Team</h2>
          <p style={{ color: "#64748b" }}>
            Team members below are the same members used for task assignments
            and workload calculations.
          </p>
          <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
            {workloadRows.map((member) => (
              <div key={member.id} className="tw-work-row">
                <span className="tw-avatar">
                  {String(member.name || member.email || "TM")
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>{member.name || member.email}</span>
                <i>
                  <b style={{ width: `${member.workloadPercent || 0}%` }} />
                </i>
                <em>{member.openTasks || 0} open</em>
              </div>
            ))}
          </div>
        </section>
      )}

      {workspaceTab === "Reports" && (
        <section className="tw-tasks-section" style={{ padding: 18 }}>
          <h2 style={{ marginTop: 0 }}>Reports</h2>
          <p style={{ color: "#64748b" }}>
            Reports use the same live task, project, workload, time tracking,
            and deadline metrics shown below.
          </p>
        </section>
      )}

      {[
        "Overview",
        "Reports",
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
            <button>View full calendar →</button>
          </div>
        </div>
      )}

      {/* =================================================
        MODALS
      ================================================= */}

      {taskModalOpen && (
        <div
          style={SEAT_OVERLAY}
          onClick={() => !taskSaving && setTaskModalOpen(false)}
        >
          <form
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
                <input
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
                <select
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
                <select
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
                <select
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
                <select
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
                <input
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
                <select
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
                <input
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
                <input
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
                <input
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
          onClick={() => !projectSaving && setProjectModalOpen(false)}
        >
          <form
            style={{ ...SEAT_CARD, width: "min(560px, 96vw)" }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveWorkspaceProject}
          >
            <h3 style={SEAT_TITLE}>New Project</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <span>Project name</span>
                <input
                  required
                  value={projectForm.name}
                  onChange={(e) =>
                    setProjectForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows="4"
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>

              <label>
                <span>Priority</span>
                <select
                  value={projectForm.priority}
                  onChange={(e) =>
                    setProjectForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  value={projectForm.dueDate}
                  onChange={(e) =>
                    setProjectForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  style={{ width: "100%", marginTop: 5 }}
                />
              </label>
            </div>

            <div style={{ ...SEAT_ROW, marginTop: 20 }}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                disabled={projectSaving}
                onClick={() => setProjectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={SEAT_BTN_PRIMARY}
                disabled={projectSaving}
              >
                {projectSaving ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
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
