import { useState } from "react";

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

/* =========================================================
  HOOKS
========================================================= */

import useTeamDashboard from "./hooks/useTeamDashboard";
import useTeamMembers from "./hooks/useTeamMembers";

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
    members,

    seatInfo,

    stats,
    activities,
    subscription,
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

    searchMembers,

    inviteMember,
    removeMember,
    toast,
  } = useTeamMembers({
    teamId: selectedTeamId,
    onReload: reloadDashboard,
  });

  /* =====================================================
    MODALS
  ===================================================== */

  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  /* =====================================================
    DELETE MEMBER
  ===================================================== */

  const handleOpenDelete = (member) => {
    setSelectedMember(member);

    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;

    await removeMember(selectedMember._id || selectedMember.id);

    setDeleteModalOpen(false);

    setSelectedMember(null);
  };

  /* =====================================================
    INVITE MEMBER
  ===================================================== */

  const handleInvite = async (e) => {
    e?.preventDefault?.();
    console.log(selectedTeamId);
    const success = await inviteMember();

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

  /* =====================================================
    RENDER
  ===================================================== */

  return (
    <div className="team-workspace">
      {/* =================================================
        HEADER
      ================================================= */}

      <TeamHeader
        teams={teams}
        selectedTeamId={selectedTeamId}
        onChangeTeam={setSelectedTeamId}
        team={team}
      />

      {/* =================================================
        STATS
      ================================================= */}

      <TeamStats stats={stats} />

      {/* =================================================
        TOOLBAR
      ================================================= */}

      <TeamToolbar
        search={search}
        onSearch={searchMembers}
        onInvite={() => setInviteModalOpen(true)}
        teams={teams}
        selectedTeam={selectedTeamId}
        setSelectedTeam={setSelectedTeamId}
      />

      <div className="team-main-grid">
        <TeamMembersTable
          members={members}
          loading={loading}
          onRemove={handleOpenDelete}
          onInvite={() => setInviteModalOpen(true)}
        />

        <TeamInsightsCard
          insights={[
            {
              title: "Seat Usage",
              description: `${seatInfo?.used || 0} of ${
                seatInfo?.total || 0
              } seats are currently in use.`,
            },
            {
              title: "Available Seats",
              description: `${
                seatInfo?.available || 0
              } seats remaining for this team.`,
            },
          ]}
        />

        <TeamBillingCard
          billing={{
            plan: team?.name || "Team Workspace",
            status: "Active",
            includedSeats: seatInfo?.total || 0,
            activeSeats: seatInfo?.used || 0,
            additionalSeats: 0,
            nextInvoice: 0,
          }}
        />
      </div>

      <div className="team-bottom-grid">
        <TeamPerformanceCard leaderboard={null} />
        <TeamActivityCard activity={activities} />
        <TeamNotificationsCard />
        <TeamQuickActionsCard />
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
