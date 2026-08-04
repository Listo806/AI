import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ROLE_STYLES } from "./utils/teamConstants";
import "./team.css";

import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
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
import {
  updateTeamMemberRole,
  fetchTeamSeatUsage,
} from "./services/team.service";
export default function TeamMembersPage() {
  const { t } = useTranslation();

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
    SEAT USAGE (plan-based, Feature B)
  ===================================================== */

  const [seatUsage, setSeatUsage] = useState(null);

  useEffect(() => {
    let active = true;
    if (!selectedTeamId) {
      setSeatUsage(null);
      return;
    }
    fetchTeamSeatUsage(selectedTeamId)
      .then((info) => {
        if (active) setSeatUsage(info || null);
      })
      .catch(() => {
        if (active) setSeatUsage(null);
      });
    return () => {
      active = false;
    };
    // Re-fetch when the member list changes (after invites/removals).
  }, [selectedTeamId, members]);

  const seatsFull =
    seatUsage &&
    Number.isFinite(Number(seatUsage.available)) &&
    Number(seatUsage.available) <= 0;
  /* =====================================================
    REMOVE MEMBER
  ===================================================== */

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    await removeMember(selectedMember.id);

    setSelectedMember(null);
  };

  const handleInvite = async (payload) => {
    const success = await inviteMember(payload);

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

      showToast(t("team.roleUpdated"), "success");

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

      showToast(error?.message || t("team.roleUpdateFailed"), "error");
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleExport = () => {
    const headers = [
      t("team.name"),
      t("team.email"),
      t("team.role"),
      t("team.status"),
      t("team.assignedLeads"),
      t("team.dealsWon"),
      t("team.pipelineValue"),
      t("team.aiScore"),
      t("team.lastActive"),
      t("team.seatUsage"),
    ];

    const rows = members.map((m) => [
      m.name || "",
      m.email || "",
      m.role || "",
      m.isActive ? t("team.active") : t("team.inactive"),
      m.totalLeads || 0,
      m.dealsWon || 0,
      m.pipelineValue || 0,
      `${m.aiScore || 0}%`,
      m.lastSeenAt || t("team.recently"),
      t("team.oneSeat"),
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
    if (!value) return t("team.noRecentActivity");

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("team.noRecentActivity");

    return date.toLocaleString();
  };

  const getMemberPermissions = (member) => {
    const role = String(member?.role || "").toLowerCase();

    if (role === "owner") {
      return [
        t("team.permFullWorkspace"),
        t("team.permManageTeam"),
        t("team.permBillingAccess"),
        t("team.permAiWorkspace"),
      ];
    }

    if (role === "manager") {
      return [
        t("team.permManageLeads"),
        t("team.permViewTeamActivity"),
        t("team.permAiWorkspace"),
      ];
    }

    if (role === "viewer") {
      return [
        t("team.permViewCrm"),
        t("team.permViewLeads"),
        t("team.permLimitedWorkspace"),
      ];
    }

    return [
      t("team.permCrmAccess"),
      t("team.permManageAssignedLeads"),
      t("team.permAiWorkspace"),
    ];
  };

  const getMemberStatus = (member) => {
    if (member?.isActive) return t("team.active");
    return t("team.inactive");
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
        <h1 className="team-page-title">{t("team.pageTitle")}</h1>
      </div>
      <div className="team-members-header-actions">
        {seatUsage && (
          <span
            className="team-seat-usage"
            style={{
              alignSelf: "center",
              marginRight: 8,
              fontSize: 13,
              fontWeight: 600,
              color: seatsFull ? "#dc2626" : "#475569",
            }}
          >
            {t("team.seatsUsedCount", {
              used: seatUsage.used,
              limit: seatUsage.limit,
            })}
          </span>
        )}

        <button
          type="button"
          className="team-secondary-btn"
          onClick={handleExport}
        >
          <Download size={16} />
          {t("team.exportCsv")}
        </button>

        <button
          type="button"
          className="team-primary-btn"
          onClick={() => setShowInviteModal(true)}
          disabled={seatsFull}
          title={seatsFull ? t("team.seatLimitReachedTitle") : undefined}
        >
          <Plus size={16} />
          {t("team.inviteMember")}
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
            placeholder={t("team.searchMembers")}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="team-filter-select"
        >
          <option value="all">{t("team.filterAllMembers")}</option>
          <option value="active">{t("team.active")}</option>
          <option value="manager">{t("team.roleManager")}</option>
          <option value="agent">{t("team.roleAgent")}</option>
          <option value="viewer">{t("team.roleViewer")}</option>
          <option value="high-performers">{t("team.filterHighPerformers")}</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="team-filter-select"
        >
          <option value={10}>{t("team.perPage", { size: 10 })}</option>
          <option value={20}>{t("team.perPage", { size: 20 })}</option>
          <option value={50}>{t("team.perPage", { size: 50 })}</option>
          <option value={100}>{t("team.perPage", { size: 100 })}</option>
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
                <th>{t("team.member")}</th>
                <th>{t("team.role")}</th>
                <th>{t("team.title")}</th>
                <th>{t("team.status")}</th>
                <th>{t("team.joined")}</th>
                <th>{t("team.assignedLeads")}</th>
                <th>{t("team.pipelineValue")}</th>
                <th>{t("team.lastActive")}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">{t("team.loading")}</td>
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
                        {member.isActive ? t("team.active") : t("team.inactive")}
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
                    <td></td>
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
        {t("team.showing")}
        <b> {members.length} </b>
        {t("team.ofLabel")}
        <b> {pagination.total} </b>
        {t("team.membersCountSuffix")}
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
              <h3>{t("team.memberDetails")}</h3>

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
                {t("team.memberRole")}
              </h4>

              <div className="team-drawer-role-field">
                <label htmlFor="drawer-member-role">{t("team.accountRole")}</label>

                <select
                  id="drawer-member-role"
                  value={String(selectedMember.role || "agent").toLowerCase()}
                  onChange={(event) =>
                    handleChangeMemberRole(event.target.value)
                  }
                  disabled={roleUpdating}
                  className="team-filter-select"
                >
                  <option value="agent">{t("team.roleAgent")}</option>
                  <option value="manager">{t("team.roleManager")}</option>
                  <option value="admin">{t("team.roleAdmin")}</option>
                  <option value="viewer">{t("team.roleViewer")}</option>
                </select>

                {roleUpdating && (
                  <span className="team-drawer-role-updating">
                    {t("team.updatingRole")}
                  </span>
                )}
              </div>
            </div>

            {/* PERMISSIONS */}
            <div className="team-member-section">
              <h4>
                <Shield size={16} />
                {t("team.permissions")}
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
                {t("team.activityLogs")}
              </h4>
              <div className="team-log-item">
                {t("team.logStatus", { status: getMemberStatus(selectedMember) })}
              </div>

              <div className="team-log-item">
                {t("team.logAssignedLeads", {
                  leads: selectedMember.totalLeads || 0,
                })}
              </div>

              <div className="team-log-item">
                {t("team.logDealsWon", { deals: selectedMember.dealsWon || 0 })}
              </div>

              <div className="team-log-item">
                {t("team.logLastActive", {
                  value: formatLastActive(selectedMember.lastSeenAt),
                })}
              </div>
            </div>

            {/* AI */}
            <div className="team-member-section">
              <h4>
                <Brain size={16} />
                {t("team.aiUsage")}
              </h4>

              <div className="team-ai-usage">
                {t("team.aiScoreValue", {
                  score: Number(selectedMember.aiScore || 0),
                })}
              </div>
            </div>

            {/* BILLING */}
            <div className="team-member-section">
              <h4>{t("team.billingSeat")}</h4>

              <div className="team-log-item">
                {selectedMember.isActive
                  ? t("team.oneActiveSeat")
                  : t("team.noActiveSeat")}
              </div>

              <div className="team-log-item">
                <span>{t("team.roleLabel")} </span>

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
              {t("team.removeMember")}
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
