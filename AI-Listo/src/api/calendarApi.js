import apiClient from "./apiClient";

function withParams(path, params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  const q = qs.toString();
  return `${path}${q ? `?${q}` : ""}`;
}

export const fetchAppointments = (from, to) =>
  apiClient.request(withParams("/calendar/appointments", { from, to }));

// Appointments linked to a single CRM record (contact/lead profile panel).
export const fetchAppointmentsForLead = (leadId) =>
  apiClient.request(withParams("/calendar/appointments", { leadId }));

export const fetchAppointmentsForContact = (contactId) =>
  apiClient.request(withParams("/calendar/appointments", { contactId }));

export const fetchAppointmentStats = (from, to) =>
  apiClient.request(withParams("/calendar/stats", { from, to }));

export const fetchTeamMembers = () =>
  apiClient.request("/calendar/team-members");

export const searchCrm = (q) =>
  apiClient.request(withParams("/calendar/crm-search", { q }));

// Properties/listings for the optional "Property" link on an appointment.
export const fetchProperties = () =>
  apiClient.request("/crm/owner/properties");

export const createAppointment = (payload) =>
  apiClient.request("/calendar/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAppointment = (id, payload) =>
  apiClient.request(`/calendar/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAppointment = (id) =>
  apiClient.request(`/calendar/appointments/${id}`, { method: "DELETE" });

// Activity log for one appointment (created / edited / rescheduled / canceled).
export const fetchAppointmentActivity = (id) =>
  apiClient.request(`/calendar/appointments/${id}/activity`);
