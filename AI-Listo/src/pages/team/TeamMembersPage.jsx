import { useState } from "react";
import { ROLE_STYLES } from "./utils/teamConstants";
import "./team.css";

import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Trash2,
  Shield,
  Activity,
  Brain,
  Users,
} from "lucide-react";

import useTeamDashboard from "./hooks/useTeamDashboard";
import useTeamMembers from "./hooks/useTeamMembers";
import InviteMemberModal from "./components/InviteMemberModal";
import { updateTeamMemberRole } from "./services/team.service";
export default function TeamMembersPage() {
  /* =====================================================
    DASHBOARD
  ===================================================== */

  const { selectedTeamId, reloadDashboard } = useTeamDashboard();

  /* =====================================================
    MEMBERS
  ===================================================== */

  const {
    members,
    loading,

    search,
    setSearch,

    filter,
    setFilter,

    removeMember,

    inviteMember,
    inviting,

    inviteEmail,
    setInviteEmail,

    limit,
    setLimit,

    pagination,
    page,
    setPage,

    toast,
    showToast,

    reloadMembers,
    updateMemberRoleLocally,
  } = useTeamMembers({
    teamId: selectedTeamId,
    onReload: reloadDashboard,
    mode: "members",
  });

  /* =====================================================
    STATE
  ===================================================== */

  const [selectedMember, setSelectedMember] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  /* =====================================================
    REMOVE MEMBER
  ===================================================== */

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    await removeMember(selectedMember.id);

    setSelectedMember(null);
  };

  const handleInvite = async ({ email, role }) => {
    const success = await inviteMember({
      email,
      role,
    });

    if (success !== false) {
      setShowInviteModal(false);
    }
  };

  const handleChangeMemberRole = async (newRole) => {
    const memberId = selectedMember?.id || selectedMember?._id;

    if (!selectedTeamId || !memberId || !newRole) {
      return;
    }

    const previousRole = selectedMember.role || "agent";

    if (String(previousRole).toLowerCase() === String(newRole).toLowerCase()) {
      return;
    }

    try {
      setRoleUpdating(true);

      updateMemberRoleLocally(memberId, newRole);

      setSelectedMember((current) => {
        if (!current) return current;

        return {
          ...current,
          role: newRole,
        };
      });

      const response = await updateTeamMemberRole(
        selectedTeamId,
        memberId,
        newRole,
      );

      const updatedMember =
        response?.member || response?.data?.member || response?.data || null;

      const backendRole = updatedMember?.role || newRole;

      updateMemberRoleLocally(memberId, backendRole);

      setSelectedMember((current) => {
        if (!current) return current;

        return {
          ...current,
          ...(updatedMember || {}),
          role: backendRole,
        };
      });

      showToast("Member role updated successfully", "success");

      await Promise.all([reloadMembers(), reloadDashboard()]);
    } catch (error) {
      console.error("CHANGE MEMBER ROLE ERROR", error);

      updateMemberRoleLocally(memberId, previousRole);

      setSelectedMember((current) => {
        if (!current) return current;

        return {
          ...current,
          role: previousRole,
        };
      });

      showToast(error?.message || "Failed to update member role", "error");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Status",
      "Assigned Leads",
      "Deals Won",
      "Pipeline Value",
      "AI Score",
      "Last Active",
      "Seat Usage",
    ];

    const rows = members.map((m) => [
      m.name || "",
      m.email || "",
      m.role || "",
      m.isActive ? "Active" : "Inactive",
      m.totalLeads || 0,
      m.dealsWon || 0,
      m.pipelineValue || 0,
      `${m.aiScore || 0}%`,
      m.lastSeenAt || "Recently",
      "1 Seat",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "team-members.csv";
    link.click();

    URL.revokeObjectURL(url);
  };
  const pages = Array.from(
    {
      length: pagination.totalPages,
    },
    (_, i) => i + 1,
  );
  const formatLastActive = (value) => {
    if (!value) return "No recent activity";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No recent activity";

    return date.toLocaleString();
  };

  const getMemberPermissions = (member) => {
    const role = String(member?.role || "").toLowerCase();

    if (role === "owner") {
      return [
        "Full workspace access",
        "Manage team",
        "Billing access",
        "AI workspace",
      ];
    }

    if (role === "manager") {
      return ["Manage leads", "View team activity", "AI workspace"];
    }

    if (role === "viewer") {
      return ["View CRM", "View leads", "Limited workspace access"];
    }

    return ["CRM access", "Manage assigned leads", "AI workspace"];
  };

  const getMemberStatus = (member) => {
    if (member?.isActive) return "Active";
    return "Inactive";
  };

  const getRoleStyle = (role) => {
    return (
      ROLE_STYLES[String(role || "agent").toLowerCase()] || ROLE_STYLES.agent
    );
  };
  return (
    <div className="team-members-page team-workspace">
      {/* =================================================
        PAGE HEADER
      ================================================= */}

      <div className="team-members-header heading_page">
        <Users />
        <h1 className="team-page-title">Team Members</h1>
      </div>
      <div className="team-members-header-actions">
        <button
          type="button"
          className="team-secondary-btn"
          onClick={handleExport}
        >
          <Download size={16} />
          Export CSV
        </button>

        <button
          type="button"
          className="team-primary-btn"
          onClick={() => setShowInviteModal(true)}
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      {/* =================================================
        FILTERS
      ================================================= */}

      <div className="team-members-filters">
        <div className="team-search-box">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="team-filter-select"
        >
          <option value="all">All Members</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="manager">Manager</option>
          <option value="agent">Agent</option>
          <option value="viewer">Viewer</option>
          <option value="high-performers">High Performers</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="team-filter-select"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      {/* =================================================
        TABLE
      ================================================= */}

      <div className="team-card">
        <div className="team-table-wrapper">
          <table className="team-full-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Assigned Leads</th>
                <th>Pipeline Value</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading...</td>
                </tr>
              ) : (
                members?.map((member) => (
                  <tr
                    key={member._id || member.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMember(member);
                    }}
                  >
                    {/* MEMBER */}
                    <td>
                      <div className="team-table-user">
                        <img
                          src={member.avatar || "https://i.pravatar.cc/150"}
                          alt=""
                        />
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td>
                      <span
                        className="team-role-badge"
                        style={{
                          background: getRoleStyle(member.role).bg,
                          color: getRoleStyle(member.role).text,
                        }}
                      >
                        {member.role || "agent"}
                      </span>
                    </td>
                    <td>
                      <span className="team-member-team">
                        {member.teamName || "—"}
                      </span>
                    </td>
                    {/* STATUS */}
                    <td>
                      <span
                        className={`team-status-badge ${
                          member.isActive ? "active" : "inactive"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td>{member.totalLeads || 0}</td>
                    <td>
                      <strong>${Number(member.pipelineValue || 0).toLocaleString()}</strong>
                    </td>

                    {/* LAST ACTIVE */}
                    <td>{formatLastActive(member.lastSeenAt)}</td>

                    {/* ACTIONS */}
                    <td>
                      <button
                        type="button"
                        className="team-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="team-pagination">
          <button disabled={!pagination.hasPrevPage} onClick={() => setPage(1)}>
            «
          </button>

          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </button>

          {pages.map((p) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>

          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(pagination.totalPages)}
          >
            »
          </button>
        </div>
      )}
      <div className="team-table-info">
        Showing
        <b> {members.length} </b>
        of
        <b> {pagination.total} </b>
        members
      </div>

      {/* =================================================
        RIGHT DRAWER
      ================================================= */}

      {selectedMember && (
        <div
          className="team-member-drawer-overlay"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="team-member-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="team-member-drawer-header">
              <h3>Member Details</h3>

              <button
                type="button"
                className="team-icon-btn"
                onClick={() => setSelectedMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* PROFILE */}
            <div className="team-member-profile">
              <img
                src={selectedMember.avatar || "https://i.pravatar.cc/150"}
                alt=""
              />
              <h2>{selectedMember.name}</h2>
              <p>{selectedMember.email}</p>
            </div>

            {/* CHANGE ROLE */}

            <div className="team-member-section">
              <h4>
                <Shield size={16} />
                Member Role
              </h4>

              <div className="team-drawer-role-field">
                <label htmlFor="drawer-member-role">Account role</label>

                <select
                  id="drawer-member-role"
                  value={String(selectedMember.role || "agent").toLowerCase()}
                  onChange={(event) =>
                    handleChangeMemberRole(event.target.value)
                  }
                  disabled={roleUpdating}
                  className="team-filter-select"
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>

                {roleUpdating && (
                  <span className="team-drawer-role-updating">
                    Updating role...
                  </span>
                )}
              </div>
            </div>

            {/* PERMISSIONS */}
            <div className="team-member-section">
              <h4>
                <Shield size={16} />
                Permissions
              </h4>

              {getMemberPermissions(selectedMember).map((permission) => (
                <label key={permission}>
                  <input type="checkbox" checked readOnly />
                  {permission}
                </label>
              ))}
            </div>

            {/* ACTIVITY */}
            <div className="team-member-section">
              <h4>
                <Activity size={16} />
                Activity Logs
              </h4>
              <div className="team-log-item">
                Status: {getMemberStatus(selectedMember)}
              </div>

              <div className="team-log-item">
                Assigned leads: {selectedMember.totalLeads || 0}
              </div>

              <div className="team-log-item">
                Deals won: {selectedMember.dealsWon || 0}
              </div>

              <div className="team-log-item">
                Last active: {formatLastActive(selectedMember.lastSeenAt)}
              </div>
            </div>

            {/* AI */}
            <div className="team-member-section">
              <h4>
                <Brain size={16} />
                AI Usage
              </h4>

              <div className="team-ai-usage">
                AI Score: {Number(selectedMember.aiScore || 0)}%
              </div>
            </div>

            {/* BILLING */}
            <div className="team-member-section">
              <h4>Billing Seat</h4>

              <div className="team-log-item">
                {selectedMember.isActive
                  ? "1 Active Seat Attached"
                  : "No active seat"}
              </div>

              <div className="team-log-item">
                <span>Role: </span>

                <span
                  className="team-role-badge"
                  style={{
                    background: getRoleStyle(selectedMember.role).bg,
                    color: getRoleStyle(selectedMember.role).text,
                  }}
                >
                  {selectedMember.role || "agent"}
                </span>
              </div>
            </div>

            {/* REMOVE */}
            <button
              type="button"
              className="team-remove-btn"
              onClick={handleRemoveMember}
            >
              <Trash2 size={16} />
              Remove Member
            </button>
          </div>
        </div>
      )}
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onInvite={handleInvite}
        inviting={inviting}
      />
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
    </div>
  );
}
