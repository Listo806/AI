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
    setAddSeatConfirmOpen(true);
  };

  const handleAddSeatConfirmed = async () => {
    if (!selectedTeamId || addingSeat) return;
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
      showSeatToast(error?.message || "Could not add a seat.", "error");
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

      <TeamBillingCard
        onInvite={handleOpenInvite}
        onAddSeat={handleAddSeatClick}
        addingSeat={addingSeat}
        billing={{
          plan: team?.name || "Team Workspace",
          status: "Active",
          includedSeats: seatInfo?.total || 0,
          activeSeats: seatInfo?.used || 0,
          additionalSeats: 0,
          nextInvoice: 0,
        }}
      />
      {/* =================================================
        TOOLBAR
      ================================================= */}

      <TeamToolbar
        search={search}
        onSearch={setSearch}
        onInvite={handleOpenInvite}
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
          onInvite={handleOpenInvite}
          onChangeRole={handleOpenChangeRole}
        />
        {/*<div className="team-main-grid-right">
          
        </div>*/}
      </div>

      <div className="team-bottom-grid">
        <TeamPerformanceCard leaderboard={leaderboard} />
        <TeamActivityCard activity={activities} teamId={selectedTeamId} />
        {/*<TeamNotificationsCard notifications={notifications} />*/}
        <TeamInsightsCard insights={insights} />
        <TeamQuickActionsCard selectedTeamId={selectedTeamId} />
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
          onClick={() => !addingSeat && setAddSeatConfirmOpen(false)}
        >
          <div style={SEAT_CARD} onClick={(e) => e.stopPropagation()}>
            <h3 style={SEAT_TITLE}>Add Team Seat</h3>
            <p style={SEAT_TEXT}>
              Each additional team member costs $97/month and will be added to
              your existing subscription.
            </p>
            <div style={SEAT_ROW}>
              <button
                type="button"
                style={SEAT_BTN_SECONDARY}
                onClick={() => setAddSeatConfirmOpen(false)}
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
