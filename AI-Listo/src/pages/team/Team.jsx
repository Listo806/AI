import { useState } from "react";
import {
  Search, Plus, Download, Upload, SlidersHorizontal, RotateCcw,
  Eye, Pencil, MoreVertical, CheckCircle2, Clock3, CalendarDays,
  FolderKanban, ListTodo, Users, Flag, Timer, FileText, LayoutGrid,
  Table2, ChevronLeft, ChevronRight
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

  const workspaceTasks = [
    { id: 1, name: "Design system components", project: "Website Redesign", status: "In Progress", priority: "High", assignee: "Olivia Bennett", due: "May 20, 2025", progress: 65, logged: "8h 20m", estimate: "12h 00m", label: "Design", activity: "1h ago" },
    { id: 2, name: "Setup staging environment", project: "System Integration", status: "Completed", priority: "Medium", assignee: "Ethan Walker", due: "May 16, 2025", progress: 100, logged: "6h 15m", estimate: "6h 00m", label: "DevOps", activity: "3h ago" },
    { id: 3, name: "API endpoint development", project: "Mobile App", status: "In Progress", priority: "High", assignee: "Sophia Martinez", due: "May 22, 2025", progress: 40, logged: "10h 45m", estimate: "20h 00m", label: "Development", activity: "45m ago" },
    { id: 4, name: "Marketing plan Q2", project: "Marketing Campaign", status: "Review", priority: "Medium", assignee: "Liam Johnson", due: "May 25, 2025", progress: 80, logged: "5h 30m", estimate: "8h 00m", label: "Marketing", activity: "2h ago" },
    { id: 5, name: "Content strategy document", project: "Content Strategy", status: "In Progress", priority: "Low", assignee: "Isabella White", due: "May 19, 2025", progress: 30, logged: "3h 10m", estimate: "10h 00m", label: "Content", activity: "15m ago" },
    { id: 6, name: "Bug fixes and testing", project: "Mobile App", status: "In Progress", priority: "High", assignee: "Noah Davis", due: "May 18, 2025", progress: 70, logged: "9h 05m", estimate: "12h 00m", label: "Development", activity: "1h ago" },
    { id: 7, name: "Database optimization", project: "System Integration", status: "On Hold", priority: "Medium", assignee: "Ava Thompson", due: "May 30, 2025", progress: 10, logged: "1h 20m", estimate: "15h 00m", label: "DevOps", activity: "2d ago" },
    { id: 8, name: "User feedback analysis", project: "Website Redesign", status: "Pending", priority: "Low", assignee: "Mason Clark", due: "May 26, 2025", progress: 0, logged: "0h 00m", estimate: "6h 00m", label: "Research", activity: "1d ago" },
  ];

  const memberNames = (filteredMembers || []).slice(0, 7).map((m, index) => ({
    name:
      m?.name ||
      m?.fullName ||
      m?.email?.split("@")[0] ||
      `Team Member ${index + 1}`,
    value:
      Number(m?.workloadPercent ?? m?.productivity ?? m?.performance ?? 0) ||
      Math.max(45, 95 - index * 8),
  }));

  const dashboardStats = [
    ["Active Projects", stats?.activeProjects ?? 26, "12 in progress", "18%", FolderKanban],
    ["Tasks Assigned", stats?.tasksAssigned ?? 342, "78 overdue", "24%", ListTodo],
    ["Tasks Completed", stats?.tasksCompleted ?? 1152, "This month", "21%", CheckCircle2],
    ["Completion Rate", stats?.completionRate ? `${stats.completionRate}%` : "76.4%", "This month", "8.6%", Flag],
    ["On Time", stats?.onTimeRate ? `${stats.onTimeRate}%` : "89.1%", "Tasks completed on time", "6.4%", Clock3],
    ["Team Productivity", stats?.productivity ? `${stats.productivity}%` : "94.2%", "Average", "7.2%", Users],
    ["Hours Logged", stats?.hoursLogged ?? "1,856h", "This month", "13%", Timer],
    ["Workload Balance", stats?.workloadBalance ?? "Good", "No overload", "", LayoutGrid],
  ];

  return (
    <div className="team-workspace">
      <div className="tw-new-header">
        <div>
          <h1>Team Workspace</h1>
          <p>Plan, organize, and execute internal projects with your team.</p>
        </div>
        <div className="tw-header-actions">
          <label className="tw-global-search"><Search size={15}/><input placeholder="Search tasks, projects, people..." /></label>
          <button className="tw-new-btn"><Plus size={16}/> New</button>
        </div>
      </div>

      <div className="tw-stat-strip">
        {dashboardStats.map(([label, value, sub, change, Icon], index) => (
          <div className="tw-stat" key={label}>
            <div className={`tw-stat-icon i-${index}`}><Icon size={17}/></div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
            {change && <em>↑ {change} <b>vs last month</b></em>}
          </div>
        ))}
      </div>

      <div className="tw-tabs">
        {["Overview","Projects","Board","Tasks","My Tasks","Calendar","Time Tracking","Files","Team","Reports"].map((tab) => (
          <button key={tab} className={tab === "Tasks" ? "active" : ""}>{tab}</button>
        ))}
      </div>

      <section className="tw-tasks-section">
        <div className="tw-section-head">
          <div><h2>Tasks</h2><p>Manage and track all team tasks</p></div>
          <div className="tw-section-actions">
            <button><Upload size={14}/> Import</button>
            <button><Download size={14}/> Export</button>
            <button><SlidersHorizontal size={14}/></button>
            <button className="primary"><Plus size={14}/> New Task</button>
          </div>
        </div>

        <div className="tw-filters">
          <label><Search size={14}/><input placeholder="Search tasks..." /></label>
          {["Status · All Statuses","Priority · All Priorities","Assignee · All Assignees","Project · All Projects","Task Type · All Types","Any Time","More Filters"].map(x => <button key={x}>{x}</button>)}
          <button className="reset"><RotateCcw size={13}/> Reset</button>
          <span className="tw-view-label">View</span>
          <button><Table2 size={13}/> Table</button><button><LayoutGrid size={13}/> Board</button><button><CalendarDays size={13}/> Calendar</button>
        </div>

        <div className="tw-table-wrap">
          <table className="tw-task-table">
            <thead><tr>
              <th><input type="checkbox"/></th><th>Task Name</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th>Progress</th><th>Time Logged</th><th>Time Est.</th><th>Labels</th><th>Last Activity</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {workspaceTasks.map(task => (
                <tr key={task.id}>
                  <td><input type="checkbox"/></td><td className="task-name">{task.name}</td><td>{task.project}</td>
                  <td><span className={`tw-pill status-${task.status.toLowerCase().replaceAll(" ","-")}`}>{task.status}</span></td>
                  <td><span className={`tw-pill priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                  <td><span className="tw-assignee"><span className="tw-avatar">{task.assignee.split(" ").map(x=>x[0]).join("").slice(0,2)}</span>{task.assignee}</span></td>
                  <td>{task.due}</td>
                  <td><div className="tw-progress"><i><b style={{width:`${task.progress}%`}}/></i><span>{task.progress}%</span></div></td>
                  <td>{task.logged}</td><td>{task.estimate}</td><td><span className="tw-label">{task.label}</span></td>
                  <td className="tw-activity-time">{task.activity}</td>
                  <td><div className="tw-row-actions"><Eye size={14}/><Pencil size={14}/><MoreVertical size={14}/></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tw-pagination"><span>Showing 1 to 8 of 342 tasks</span><div><button><ChevronLeft size={14}/></button><button className="active">1</button><button>2</button><button>3</button><button>4</button><button>5</button><span>...</span><button>43</button><button><ChevronRight size={14}/></button></div><select defaultValue="20"><option value="20">20 / page</option></select></div>
      </section>

      <div className="tw-bottom-dashboard">
        <div className="tw-mini-card"><div className="tw-mini-head"><strong>Tasks by Status</strong><span>This Month⌄</span></div><div className="tw-donut status-donut"><b>342<small>Total Tasks</small></b></div><div className="tw-legend">{[["In Progress","112 (32.7%)"],["Completed","85 (24.9%)"],["Pending","68 (19.9%)"],["On Hold","42 (12.3%)"],["Review","25 (7.3%)"],["Cancelled","10 (2.9%)"]].map(x=><p key={x[0]}><i/>{x[0]}<span>{x[1]}</span></p>)}</div></div>
        <div className="tw-mini-card"><div className="tw-mini-head"><strong>Tasks by Priority</strong><span>This Month⌄</span></div><div className="tw-donut priority-donut"><b>342<small>Total Tasks</small></b></div><div className="tw-legend short">{[["High","124 (36.3%)"],["Medium","132 (38.6%)"],["Low","86 (25.1%)"]].map(x=><p key={x[0]}><i/>{x[0]}<span>{x[1]}</span></p>)}</div></div>
        <div className="tw-mini-card workload"><div className="tw-mini-head"><strong>Team Workload</strong><span>This Month⌄</span></div>{(memberNames.length ? memberNames : [{name:"Olivia Bennett",value:95},{name:"Ethan Walker",value:90},{name:"Sophia Martinez",value:85},{name:"Liam Johnson",value:75},{name:"Noah Davis",value:70},{name:"Ava Thompson",value:60},{name:"Mason Clark",value:45}]).map(m=><div className="tw-work-row" key={m.name}><span className="tw-avatar">{m.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><span>{m.name}</span><i><b style={{width:`${m.value}%`}}/></i><em>{m.value}%</em></div>)}</div>
        <TeamActivityCard activity={activities} teamId={selectedTeamId} />
        <div className="tw-mini-card deadlines"><div className="tw-mini-head"><strong>Upcoming Deadlines</strong><span>Next 7 Days⌄</span></div>{workspaceTasks.slice(0,5).map((t,i)=><div className="tw-deadline" key={t.id}><div><b>{t.name}</b><span>{t.project}</span></div><span>{t.due}</span><em>{i===4?"Today":`${i+1} days`}</em></div>)}<button>View full calendar →</button></div>
      </div>


      {/* =================================================
        MODALS
      ================================================= */}

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