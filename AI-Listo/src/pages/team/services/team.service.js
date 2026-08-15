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
import apiClient from '../../../api/apiClient';

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

// Seat add-on billing ($97/month/seat). These hit the subscriptions endpoints,
// which charge/adjust the Paddle add-on and raise or lower the effective seat
// limit for the current user's team.
export async function purchaseSeat() {
  return await apiClient.request('/subscriptions/seats/add', { method: 'POST' });
}

export async function removeSeatBilling() {
  return await apiClient.request('/subscriptions/seats/remove', {
    method: 'POST',
  });
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

/* ======================================================
 TEAM WORKSPACE — PROJECTS / TASKS / TIME TRACKING
====================================================== */

const teamWorkspaceBase = (teamId) =>
  `/teams/${teamId}/workspace`;

const buildTeamWorkspaceQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  return queryString
    ? `?${queryString}`
    : "";
};


/* ======================================================
 WORKSPACE OVERVIEW
====================================================== */

export async function fetchTeamWorkspaceOverview(
  teamId
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  return await apiClient.request(
    teamWorkspaceBase(teamId)
  );
}


/* ======================================================
 TASKS
====================================================== */

export async function fetchTeamWorkspaceTasks(
  teamId,
  params = {}
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  return await apiClient.request(
    `${teamWorkspaceBase(teamId)}/tasks${buildTeamWorkspaceQuery(
      params
    )}`
  );
}


export async function createTeamWorkspaceTask(
  teamId,
  payload
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  return await apiClient.request(
    `${teamWorkspaceBase(teamId)}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function updateTeamWorkspaceTask(
  teamId,
  taskId,
  payload
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  if (!taskId) {
    throw new Error("Task ID is required");
  }

  return await apiClient.request(
    `${teamWorkspaceBase(teamId)}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}


export async function deleteTeamWorkspaceTask(
  teamId,
  taskId
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  if (!taskId) {
    throw new Error("Task ID is required");
  }

  return await apiClient.request(
    `${teamWorkspaceBase(teamId)}/tasks/${taskId}`,
    {
      method: "DELETE",
    }
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
    throw new Error("Team ID is required");
  }

  return await fetchTeamWorkspaceTasks(
    teamId,
    {
      ...params,

      // Backend lấy current logged-in user từ JWT.
      my: true,
    }
  );
}


/* ======================================================
 BOARD

 Board dùng CHÍNH task API ở trên.
 Không tạo bảng / data Board riêng.

 Khi kéo task sang column khác:
 updateTeamWorkspaceTask(teamId, taskId, {
   status: "in_progress"
 })

 Sau đó Tasks / Board / Calendar đều dùng chung data.
====================================================== */

export async function moveTeamWorkspaceTask(
  teamId,
  taskId,
  status
) {
  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      status,
    }
  );
}


/* ======================================================
 PROGRESS
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
 ASSIGNEE
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
 DUE DATE

 Calendar sử dụng dueDate từ cùng task record.
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
 PRIORITY
====================================================== */

export async function updateTeamWorkspaceTaskPriority(
  teamId,
  taskId,
  priority
) {
  return await updateTeamWorkspaceTask(
    teamId,
    taskId,
    {
      priority,
    }
  );
}


/* ======================================================
 TIME TRACKING
====================================================== */

export async function logTeamWorkspaceTime(
  teamId,
  taskId,
  payload
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  if (!taskId) {
    throw new Error("Task ID is required");
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
 PROJECTS
====================================================== */

export async function fetchTeamWorkspaceProjects(
  teamId
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  return await apiClient.request(
    `${teamWorkspaceBase(
      teamId
    )}/projects`
  );
}


export async function createTeamWorkspaceProject(
  teamId,
  payload
) {
  if (!teamId) {
    throw new Error("Team ID is required");
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

export async function searchTeamWorkspace(
  teamId,
  query,
  params = {}
) {
  return await fetchTeamWorkspaceTasks(
    teamId,
    {
      ...params,
      q: query,
    }
  );
}

