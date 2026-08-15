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
} from "../../../api/platformApi";

import apiClient from "../../../api/apiClient";

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

export async function fetchTeamSeats(teamId) {
  return await getTeamSeats(teamId);
}

export async function fetchTeamSeatUsage(teamId) {
  return await getTeamSeatUsage(teamId);
}

/* ======================================================
 SEAT BILLING
====================================================== */

export async function purchaseSeat() {
  return await apiClient.request("/subscriptions/seats/add", {
    method: "POST",
  });
}

export async function removeSeatBilling() {
  return await apiClient.request("/subscriptions/seats/remove", {
    method: "POST",
  });
}

/* ======================================================
 CREATE / UPDATE TEAM
====================================================== */

export async function createNewTeam(payload) {
  return await createTeam(payload);
}

export async function updateExistingTeam(teamId, payload) {
  return await updateTeam(teamId, payload);
}

export async function removeTeam(teamId) {
  return await deleteTeam(teamId);
}

/* ======================================================
 MEMBERS
====================================================== */

export async function inviteMember(teamId, payload) {
  console.log("INVITE MEMBER API", {
    teamId,
    payload,
  });

  return await inviteTeamMemberByEmail(teamId, payload);
}

export async function addMember(teamId, userId) {
  return await addTeamMember(teamId, userId);
}

export async function removeMember(teamId, userId) {
  return await removeTeamMember(teamId, userId);
}

export const fetchTeamNotifications = async (teamId) => {
  return await getTeamNotifications(teamId);
};

export async function fetchTeamMembers(teamId, params) {
  return await getTeamMembers(teamId, params);
}

export async function fetchTeamMembersDashboard(teamId, params) {
  return await getTeamMembersDashboard(teamId, params);
}

export async function fetchTeamAIInsights(teamId) {
  return await getTeamAIInsights(teamId);
}

export async function fetchTeamActivities(teamId, params) {
  return await getTeamActivities(teamId, params);
}

export async function updateTeamMemberRole(
  teamId,
  memberId,
  role
) {
  return await updateMemberRole(teamId, memberId, role);
}

/* ======================================================
 TEAM SEAT LIMIT
====================================================== */

export async function updateTeamSeatLimit(
  teamId,
  seatLimit
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
      "Seat limit must be at least 1"
    );
  }

  return await updateTeam(teamId, {
    seatLimit: nextSeatLimit,
  });
}

/* ======================================================
 PENDING INVITES
====================================================== */

export async function fetchPendingTeamInvites(
  teamId,
  params
) {
  return await getPendingTeamInvites(
    teamId,
    params
  );
}

export async function resendPendingTeamInvite(
  teamId,
  invitationId
) {
  return await resendTeamInvite(
    teamId,
    invitationId
  );
}

export async function cancelPendingTeamInvite(
  teamId,
  invitationId
) {
  return await cancelTeamInvite(
    teamId,
    invitationId
  );
}

/* ======================================================
 TEAM WORKSPACE HELPERS
====================================================== */

const teamWorkspaceBase = (teamId) =>
  `/teams/${teamId}/workspace`;

const buildTeamWorkspaceQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const queryString =
    searchParams.toString();

  return queryString
    ? `?${queryString}`
    : "";
};

/* ======================================================
 TEAM WORKSPACE — OVERVIEW
====================================================== */

export async function fetchTeamWorkspaceOverview(
  teamId
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  return await apiClient.request(
    teamWorkspaceBase(teamId)
  );
}

/* ======================================================
 TEAM WORKSPACE — TASKS
====================================================== */

export async function fetchTeamWorkspaceTasks(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery(params);

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/tasks${query}`
  );
}

/* ======================================================
 MY TASKS
====================================================== */

export async function fetchMyTeamWorkspaceTasks(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  return await fetchTeamWorkspaceTasks(
    teamId,
    {
      ...params,
      my: true,
    }
  );
}

/* ======================================================
 CREATE TASK
====================================================== */

export async function createTeamWorkspaceTask(
  teamId,
  payload
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!payload?.name?.trim()) {
    throw new Error(
      "Task name is required"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/* ======================================================
 UPDATE TASK
====================================================== */

export async function updateTeamWorkspaceTask(
  teamId,
  taskId,
  payload
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!taskId) {
    throw new Error(
      "Task ID is required"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

/* ======================================================
 DELETE TASK
====================================================== */

export async function deleteTeamWorkspaceTask(
  teamId,
  taskId
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!taskId) {
    throw new Error(
      "Task ID is required"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/tasks/${taskId}`,
    {
      method: "DELETE",
    }
  );
}

/* ======================================================
 BOARD / TASK STATUS
====================================================== */

export async function moveTeamWorkspaceTask(
  teamId,
  taskId,
  status
) {
  if (!status) {
    throw new Error(
      "Task status is required"
    );
  }

  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      status,
    }
  );
}

/* ======================================================
 TASK PROGRESS
====================================================== */

export async function updateTeamWorkspaceTaskProgress(
  teamId,
  taskId,
  progress
) {
  const value = Number(progress);

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      "Progress must be between 0 and 100"
    );
  }

  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      progress: value,
    }
  );
}

/* ======================================================
 TASK ASSIGNEE
====================================================== */

export async function assignTeamWorkspaceTask(
  teamId,
  taskId,
  assigneeId
) {
  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      assigneeId:
        assigneeId || null,
    }
  );
}

/* ======================================================
 TASK DUE DATE
====================================================== */

export async function updateTeamWorkspaceTaskDueDate(
  teamId,
  taskId,
  dueDate
) {
  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      dueDate:
        dueDate || null,
    }
  );
}

/* ======================================================
 TASK PRIORITY
====================================================== */

export async function updateTeamWorkspaceTaskPriority(
  teamId,
  taskId,
  priority
) {
  if (!priority) {
    throw new Error(
      "Priority is required"
    );
  }

  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      priority,
    }
  );
}

/* ======================================================
 TIME TRACKING — LOG TIME
====================================================== */

export async function logTeamWorkspaceTime(
  teamId,
  taskId,
  payload = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!taskId) {
    throw new Error(
      "Task ID is required"
    );
  }

  const minutes = Number(
    payload?.minutes || 0
  );

  if (
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw new Error(
      "Minutes must be greater than 0"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/tasks/${taskId}/time`,
    {
      method: "POST",

      body: JSON.stringify({
        ...payload,
        minutes,
      }),
    }
  );
}

/* ======================================================
 TIME TRACKING — DETAIL PAGE
====================================================== */

export async function fetchTeamWorkspaceTimeTracking(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery(params);

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/time-tracking${query}`
  );
}

/* ======================================================
 TEAM WORKSPACE — PROJECTS
====================================================== */

export async function fetchTeamWorkspaceProjects(
  teamId
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/projects`
  );
}

/* ======================================================
 CREATE PROJECT
====================================================== */

export async function createTeamWorkspaceProject(
  teamId,
  payload
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!payload?.name?.trim()) {
    throw new Error(
      "Project name is required"
    );
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/projects`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/* ======================================================
 TEAM WORKSPACE — SEARCH
====================================================== */

export async function searchTeamWorkspace(
  teamId,
  query,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  return await fetchTeamWorkspaceTasks(
    teamId,
    {
      ...params,
      q: query,
    }
  );
}

/* ======================================================
 TEAM WORKSPACE — REPORTS / ANALYTICS
====================================================== */

export async function fetchTeamWorkspaceReports(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery(params);

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/reports${query}`
  );
}

/* ======================================================
 TEAM WORKSPACE — FILES
====================================================== */

export async function fetchTeamWorkspaceFiles(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery({
      teamId,
      ...params,
    });

  return await apiClient.request(
    `/integrations/storage/team-files${query}`
  );
}

/* ======================================================
 UPLOAD TEAM WORKSPACE FILE
====================================================== */

export async function uploadTeamWorkspaceFile(
  teamId,
  file,
  options = {}
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!file) {
    throw new Error(
      "File is required"
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "teamId",
    teamId
  );

  if (options.projectId) {
    formData.append(
      "projectId",
      options.projectId
    );
  }

  if (options.taskId) {
    formData.append(
      "taskId",
      options.taskId
    );
  }

  return await apiClient.request(
    "/integrations/storage/team-files/upload",
    {
      method: "POST",
      body: formData,
    }
  );
}

/* ======================================================
 GET TEAM WORKSPACE FILE URL
====================================================== */

export async function getTeamWorkspaceFileUrl(
  teamId,
  fileId,
  expiresIn = 3600
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!fileId) {
    throw new Error(
      "File ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery({
      teamId,
      expiresIn,
    });

  return await apiClient.request(
    `/integrations/storage/team-files/${fileId}/url${query}`
  );
}

/* ======================================================
 DELETE TEAM WORKSPACE FILE
====================================================== */

export async function deleteTeamWorkspaceFile(
  teamId,
  fileId
) {
  if (!teamId) {
    throw new Error(
      "Team ID is required"
    );
  }

  if (!fileId) {
    throw new Error(
      "File ID is required"
    );
  }

  const query =
    buildTeamWorkspaceQuery({
      teamId,
    });

  return await apiClient.request(
    `/integrations/storage/team-files/${fileId}${query}`,
    {
      method: "DELETE",
    }
  );
}