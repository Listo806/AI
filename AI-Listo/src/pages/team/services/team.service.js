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

export async function fetchTeamMembers(
  teamId
) {
  return await getTeamMembers(teamId);
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
  email
) {
  console.log(
    'INVITE MEMBER API',
    {
      teamId,
      email,
    }
  );

  return await inviteTeamMemberByEmail(
    teamId,
    email
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