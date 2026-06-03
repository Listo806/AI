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
import TeamAIInsightsModal from "./components/TeamAIInsightsModal";
import { fetchTeamAIInsights } from "./services/team.service";
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

  const handleInvite = async ({ email, role }) => {
    const success = await inviteMember({
      email,
      role,
    });

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
        onSearch={setSearch}
        onInvite={() => setInviteModalOpen(true)}
        teams={teams}
        selectedTeam={selectedTeamId}
        setSelectedTeam={setSelectedTeamId}
        filter={filterDashboard}
        onFilter={setFilterDashboard}
        onRunAI={handleOpenAIInsights}
      />

      <div className="team-main-grid">
        <TeamMembersTable
          members={filteredMembers}
          loading={loading}
          onRemove={handleOpenDelete}
          onInvite={() => setInviteModalOpen(true)}
        />
        <div className="team-main-grid-right">
          <TeamBillingCard
            onInvite={() => setInviteModalOpen(true)}
            billing={{
              plan: team?.name || "Team Workspace",
              status: "Active",
              includedSeats: seatInfo?.total || 0,
              activeSeats: seatInfo?.used || 0,
              additionalSeats: 0,
              nextInvoice: 0,
            }}
          />
          <TeamInsightsCard insights={insights} />
        </div>
      </div>

      <div className="team-bottom-grid">
        <TeamPerformanceCard leaderboard={leaderboard} />
        <TeamActivityCard activity={activities} />
        <TeamNotificationsCard notifications={notifications} />
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
