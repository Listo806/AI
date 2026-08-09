/**
 * Platform API - Marketplace, VA, and Admin endpoints
 * Used for platform authentication and admin controls (separate from CRM).
 */
import apiClient from "./apiClient";

// Set the plan on the logged-in account (used after the exit-popup signup, when
// the user picks a plan on the pricing page). Never creates a second account.
// Returns { success, plan, billingCycle, free }.
export async function selectAccountPlan({ plan, billingCycle } = {}) {
  return apiClient.request(`/trial/select-plan`, {
    method: "POST",
    body: JSON.stringify({ plan, billingCycle }),
  });
}

// Current team's plan limits and usage against them. Returns
// { plan, planLabel, isFree, limits, usage }. Paid plans report null limits
// (unlimited). Used by the usage indicators and upgrade nudges.
export async function getPlanUsage() {
  return apiClient.request(`/plans/usage`);
}

// ============================================================================
// PLATFORM LISTINGS (Agent/Owner/User - submit without CRM)
// ============================================================================

export async function getMyPlatformListings() {
  const res = await apiClient.request("/platform/listings");
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function createPlatformListing(data) {
  const res = await apiClient.request("/platform/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// ============================================================================
// VA LISTINGS (VA_UPLOADER/VA - always PENDING_REVIEW)
// ============================================================================

export async function getMyVaListings() {
  const res = await apiClient.request("/va/listings");
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function createVaListing(data) {
  const res = await apiClient.request("/va/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function updateVaListing(id, data) {
  const res = await apiClient.request(`/va/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN LISTINGS (Super Admin / Admin)
// ============================================================================

export async function getAdminListings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.origin) params.append("origin", filters.origin);
  if (filters.createdBy) params.append("createdBy", filters.createdBy);
  if (filters.title) params.append("title", filters.title);
  if (filters.uploaderEmail)
    params.append("uploaderEmail", filters.uploaderEmail);
  const qs = params.toString();
  const res = await apiClient.request(`/admin/listings${qs ? "?" + qs : ""}`);
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminListingById(id) {
  const res = await apiClient.request(`/admin/listings/${id}`);
  return res?.data || res;
}

export async function updateAdminListingStatus(
  id,
  status,
  rejectionReason = null,
) {
  const body = { status };
  if (rejectionReason != null) body.rejectionReason = rejectionReason;
  const res = await apiClient.request(`/admin/listings/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res?.data || res;
}

export async function updateAdminListing(id, { teamId }) {
  const res = await apiClient.request(`/admin/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ teamId: teamId || null }),
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN USERS (Super Admin / Admin) - Full CRUD
// ============================================================================

export async function getAdminUsers(role = null) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await apiClient.request(`/admin/users${qs}`);
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminUserById(id) {
  const res = await apiClient.request(`/admin/users/${id}`);
  return res?.data || res;
}

// --- Sign-ups & Customers (email automation admin) ---

const SIGNUP_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://backend.cortexaaicrm.com/api";

function buildSignupQuery({ limit, offset, q, paymentStatus, offer, language } = {}) {
  const p = new URLSearchParams();
  if (limit != null) p.set("limit", String(limit));
  if (offset != null) p.set("offset", String(offset));
  if (q) p.set("q", q);
  if (paymentStatus && paymentStatus !== "all") p.set("paymentStatus", paymentStatus);
  if (offer && offer !== "all") p.set("offer", offer);
  if (language && language !== "all") p.set("language", language);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

// Download a CSV export of sign-ups/customers (respects the current filters).
export async function exportSignupsCsv(kind, opts = {}) {
  const path =
    kind === "customers"
      ? "/admin/customers/export.csv"
      : "/admin/signups/export.csv";
  const token = localStorage.getItem("listo_access_token");
  const res = await fetch(`${SIGNUP_API_BASE}${path}${buildSignupQuery(opts)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${kind}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Everyone who submitted the registration form, with attribution. Returns
// { data, total, limit, offset }.
export async function getAdminSignups(opts = {}) {
  return apiClient.request(`/admin/signups${buildSignupQuery(opts)}`);
}

// Only users who completed payment. Same shape as getAdminSignups.
export async function getAdminCustomers(opts = {}) {
  return apiClient.request(`/admin/customers${buildSignupQuery(opts)}`);
}

// One sign-up with its email history: { user, emails }.
export async function getAdminSignupDetail(id) {
  return apiClient.request(`/admin/signups/${id}`);
}

// Soft-delete a sign-up (hide from lists + deactivate). Returns { deleted }.
export async function deleteAdminSignup(id) {
  return apiClient.request(`/admin/signups/${id}`, { method: "DELETE" });
}

// Sign-up to purchase funnel totals, optionally by date range and dimension.
// Returns { signups, purchases, conversionRate, groupBy, breakdown }.
export async function getAdminFunnel({ from, to, groupBy } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (groupBy && groupBy !== "none") p.set("groupBy", groupBy);
  const qs = p.toString();
  return apiClient.request(`/admin/funnel${qs ? "?" + qs : ""}`);
}

// Recent platform email delivery log: { data }.
export async function getAdminEmailLog(limit = 100) {
  return apiClient.request(`/admin/email/log?limit=${encodeURIComponent(limit)}`);
}

// Send a test of any lifecycle email to any address (no real payment needed).
// Returns { ok, status, reason } or { ok:false, error }.
export async function sendAdminTestEmail({ to, template, language } = {}) {
  return apiClient.request(`/admin/email/test-send`, {
    method: "POST",
    body: JSON.stringify({ to, template, language }),
  });
}

export async function createAdminUser(payload) {
  const res = await apiClient.request("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminUser(id, payload) {
  const res = await apiClient.request(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminUserRole(id, role) {
  const res = await apiClient.request(`/admin/users/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  return res?.data || res;
}

export async function deleteAdminUser(id) {
  const res = await apiClient.request(`/admin/users/${id}`, {
    method: "DELETE",
  });
  return res?.data || res;
}

// Permanently delete a user (hard delete). The backend blocks this with a 409
// if the user owns a workspace that still has other active members, so ownership
// must be transferred first. Returns { deleted } on success.
export async function hardDeleteAdminUser(id) {
  const res = await apiClient.request(`/admin/users/${id}/permanent`, {
    method: "DELETE",
  });
  return res?.data || res;
}

// ============================================================================
// ADMIN TEAMS (Super Admin / Admin) - Full CRUD + members
// ============================================================================

export async function getAdminTeams() {
  const res = await apiClient.request("/admin/teams");
  return Array.isArray(res?.data) ? res.data : res?.data || [];
}

export async function getAdminTeamById(id) {
  const res = await apiClient.request(`/admin/teams/${id}`);
  return res?.data || res;
}

export async function createAdminTeam(payload) {
  const res = await apiClient.request("/admin/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function updateAdminTeam(id, payload) {
  const res = await apiClient.request(`/admin/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res?.data || res;
}

export async function deleteAdminTeam(id) {
  const res = await apiClient.request(`/admin/teams/${id}`, {
    method: "DELETE",
  });
  return res?.data || res;
}

export async function addAdminTeamMember(teamId, userId) {
  const res = await apiClient.request(
    `/admin/teams/${teamId}/members/${userId}`,
    {
      method: "POST",
    },
  );
  return res?.data || res;
}

export async function removeAdminTeamMember(teamId, userId) {
  const res = await apiClient.request(
    `/admin/teams/${teamId}/members/${userId}`,
    {
      method: "DELETE",
    },
  );
  return res?.data || res;
}
/* ======================================================
 OWNER TEAMS
====================================================== */

export async function getTeamDashboard(teamId) {
  const res = await apiClient.request(`/teams/${teamId}/dashboard`);

  console.log("getTeamDashboard RAW", res);

  return res;
}

export async function getMyTeams() {
  const res = await apiClient.request("/teams");

  console.log("getMyTeams RAW", res);

  return Array.isArray(res) ? res : res?.data || [];
}

export async function getTeam(id) {
  const res = await apiClient.request(`/teams/${id}`);

  return res?.data || res;
}

export async function getTeamSeats(teamId) {
  const res = await apiClient.request(`/teams/${teamId}/seats`);

  return res?.data || res;
}

// Plan-based seat limit + usage (Feature B). Reflects what actually gates invites.
export async function getTeamSeatUsage(teamId) {
  const res = await apiClient.request(`/teams/${teamId}/seat-usage`);

  return res?.data ?? res;
}

// Public: look up a pending invitation by token (no auth). Used by /accept-invite.
export async function lookupTeamInvitation(token) {
  return await apiClient.request(
    `/teams/invitations/${encodeURIComponent(token)}`,
  );
}

// Accept a team invitation as the signed-in user.
export async function acceptTeamInvitation(token) {
  return await apiClient.request(
    `/teams/invitations/${encodeURIComponent(token)}/accept`,
    { method: "POST" },
  );
}

export async function createTeam(payload) {
  const res = await apiClient.request("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

export async function updateTeam(teamId, payload) {
  const res = await apiClient.request(`/teams/${teamId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res?.data ?? res;
}

export async function inviteTeamMemberByEmail(teamId, payload) {
  const body = {
    email: payload?.email?.trim?.() || "",
    role: payload?.role || "agent",
    name: payload?.name?.trim?.() || undefined,
  };

  const res = await apiClient.request(`/teams/${teamId}/members/invite`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return res?.data ?? res;
}

export async function addTeamMember(teamId, userId) {
  const res = await apiClient.request(`/teams/${teamId}/members/${userId}`, {
    method: "POST",
  });
  return res?.data ?? res;
}

export async function removeTeamMember(teamId, userId) {
  const res = await apiClient.request(`/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
  return res?.data ?? res;
}

export async function deleteTeam(teamId) {
  const res = await apiClient.request(`/teams/${teamId}`, {
    method: "DELETE",
  });
  return res?.data ?? res;
}

export async function getTeamNotifications(teamId) {
  const res = await apiClient.request(`/teams/${teamId}/notifications`, {
    method: "GET",
  });
  return res?.data ?? res;
}

export async function getTeamMembers(teamId, params = {}) {
  const qs = new URLSearchParams();

  if (params.page) {
    qs.append("page", String(params.page));
  }

  if (params.limit) {
    qs.append("limit", String(params.limit));
  }

  if (params.search) {
    qs.append("search", params.search);
  }

  if (params.filter) {
    qs.append("filter", params.filter);
  }

  if (params.role) {
    qs.append("role", params.role);
  }

  if (params.sort) {
    qs.append("sort", params.sort);
  }

  const queryString = qs.toString();

  const res = await apiClient.request(
    `/teams/${teamId}/members${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
    },
  );

  console.log("TEAM MEMBERS API RAW", res);

  return res?.data || res;
}

export async function getTeamMembersDashboard(teamId, params = {}) {
  const qs = new URLSearchParams();

  if (params.page) {
    qs.append("page", String(params.page));
  }

  if (params.limit) {
    qs.append("limit", String(params.limit));
  }

  if (params.search) {
    qs.append("search", params.search);
  }

  if (params.filter && params.filter !== "all") {
    qs.append("filter", params.filter);
  }

  if (params.role) {
    qs.append("role", params.role);
  }

  if (params.sort) {
    qs.append("sort", params.sort);
  }

  const queryString = qs.toString();

  const res = await apiClient.request(
    `/teams/${teamId}/members${queryString ? `?${queryString}` : ""}`,
  );

  console.log("member Dashboard:", res);

  /*
    backend return:
    {
      data: [],
      pagination: {}
    }
  */

  return res?.data || res;
}

export async function getTeamAIInsights(teamId) {
  const res = await apiClient.request(`/teams/${teamId}/ai-insights`);

  return res?.data || res;
}

export async function getTeamActivities(teamId, params = {}) {
  const qs = new URLSearchParams();

  if (params.page) qs.append("page", String(params.page));
  if (params.limit) qs.append("limit", String(params.limit));
  if (params.search) qs.append("search", params.search);
  if (params.type) qs.append("type", params.type);
  if (params.userId) qs.append("userId", params.userId);

  if (params.dateFrom) qs.append("dateFrom", params.dateFrom);

  if (params.dateTo) qs.append("dateTo", params.dateTo);

  if (params.sort) qs.append("sort", params.sort);

  const queryString = qs.toString();

  const res = await apiClient.request(
    `/teams/${teamId}/activities${queryString ? `?${queryString}` : ""}`,
  );

  return res;
}

export async function updateMemberRole(teamId, memberId, role) {
  const res = await apiClient.request(
    `/teams/${teamId}/members/${memberId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );

  return res?.data ?? res;
}

export async function getPendingTeamInvites(
  teamId,
  params = {},
) {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  const qs = new URLSearchParams();

  if (params.page) {
    qs.set("page", String(params.page));
  }

  if (params.limit) {
    qs.set("limit", String(params.limit));
  }

  if (params.search?.trim()) {
    qs.set("search", params.search.trim());
  }

  if (
    params.role &&
    params.role !== "all"
  ) {
    qs.set("role", params.role);
  }

  const queryString = qs.toString();

  const res = await apiClient.request(
    `/teams/${teamId}/invitations${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      method: "GET",
    },
  );

  console.log(
    "PENDING TEAM INVITES RAW",
    res,
  );

  return res;
}

export async function resendTeamInvite(
  teamId,
  invitationId,
) {
  const response =
    await apiClient.request(
      `/teams/${teamId}/invitations/${invitationId}/resend`,
      {
        method: "POST",
      },
    );

  return response?.data || response;
}

export async function cancelTeamInvite(
  teamId,
  invitationId,
) {
  const response =
    await apiClient.request(
      `/teams/${teamId}/invitations/${invitationId}`,
      {
        method: "DELETE",
      },
    );

  return response?.data || response;
}