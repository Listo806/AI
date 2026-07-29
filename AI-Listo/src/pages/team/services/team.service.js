import {
  getMyTeams,
  getTeam,
  getTeamMembers,
  getTeamSeats,
  createTeam,
  updateTeam,
  inviteTeamMemberByEmail,
  addTeamMember,
  removeTeamMember,
  deleteTeam,
  getTeamDashboard,
  getTeamNotifications,
  getTeamMembersDashboard,
  getTeamAIInsights,
  getTeamActivities,
  updateMemberRole,
  getPendingTeamInvites,
  resendTeamInvite,
  cancelTeamInvite,
  getTeamSeatUsage,
} from '../../../api/platformApi';

/* ======================================================
 TEAMS
====================================================== */
export const fetchTeamDashboard = async (teamId) => {
  return await getTeamDashboard(teamId);
};

export async function fetchTeams() {
  return await getMyTeams();
}

export async function fetchTeam(teamId) {
  return await getTeam(teamId);
}

export async function fetchTeamSeats(
  teamId
) {
  return await getTeamSeats(teamId);
}

// Plan-based seat limit + usage (Feature B): { limit, used, available }
export async function fetchTeamSeatUsage(teamId) {
  return await getTeamSeatUsage(teamId);
}

/* ======================================================
 CREATE / UPDATE TEAM
====================================================== */

export async function createNewTeam(
  payload
) {
  return await createTeam(payload);
}

export async function updateExistingTeam(
  teamId,
  payload
) {
  return await updateTeam(
    teamId,
    payload
  );
}

export async function removeTeam(teamId) {
  return await deleteTeam(teamId);
}

/* ======================================================
 MEMBERS
====================================================== */

export async function inviteMember(
  teamId,
  payload
) {
  console.log(
    'INVITE MEMBER API',
    {
      teamId,
      payload,
    }
  );

  return await inviteTeamMemberByEmail(
    teamId,
    payload
  );
}

export async function addMember(
  teamId,
  userId
) {
  return await addTeamMember(
    teamId,
    userId
  );
}

export async function removeMember(
  teamId,
  userId
) {
  return await removeTeamMember(
    teamId,
    userId
  );
}

export const fetchTeamNotifications =
  async (teamId) => {
    return await getTeamNotifications(
      teamId
    );
  };
  
export async function fetchTeamMembers(
  teamId,
  params
) {
  return await getTeamMembers(
    teamId,
    params
  );
}

export async function fetchTeamMembersDashboard(
  teamId,
  params
) {
  return await getTeamMembersDashboard(
    teamId,
    params
  );
}

export async function fetchTeamAIInsights(teamId) {
  return await getTeamAIInsights(teamId);
}

export async function fetchTeamActivities(teamId, params) {
  return await getTeamActivities(teamId, params);
}

export async function updateTeamMemberRole(teamId, memberId, role) {
  return await updateMemberRole(teamId, memberId, role);
}

export async function updateTeamSeatLimit(
  teamId,
  seatLimit,
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  const nextSeatLimit = Number(seatLimit);

  if (
    !Number.isFinite(nextSeatLimit) ||
    nextSeatLimit < 1
  ) {
    throw new Error(
      "Seat limit must be at least 1",
    );
  }

  return await updateTeam(teamId, {
    seatLimit: nextSeatLimit,
  });
}

export async function fetchPendingTeamInvites(
  teamId,
  params,
) {
  return await getPendingTeamInvites(
    teamId,
    params,
  );
}

export async function resendPendingTeamInvite(
  teamId,
  invitationId,
) {
  return await resendTeamInvite(
    teamId,
    invitationId,
  );
}

export async function cancelPendingTeamInvite(
  teamId,
  invitationId,
) {
  return await cancelTeamInvite(
    teamId,
    invitationId,
  );
}