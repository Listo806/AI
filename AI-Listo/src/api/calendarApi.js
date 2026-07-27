import apiClient from "./apiClient";

function withRange(path, from, to) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return `${path}${q ? `?${q}` : ""}`;
}

export const fetchAppointments = (from, to) =>
  apiClient.request(withRange("/calendar/appointments", from, to));

export const fetchAppointmentStats = (from, to) =>
  apiClient.request(withRange("/calendar/stats", from, to));

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
