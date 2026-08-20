/**
 * Analytics API – real backend data for Analytics page.
 * Uses /analytics/* and /crm/dashboard/summary for consistency with Dashboard.
 */
import apiClient from './apiClient';

const daysToQuery = (value) => {
  if (value === 'today') return 1;
  if (value === '7d') return 7;
  if (value === '30d') return 30;
  return 30;
};

/** Build startDate/endDate for backend (analytics uses startDate/endDate; dashboard uses these) */
function dateRangeFromDays(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days || 30));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Dashboard aggregate (metrics + recent activity) – for KPI consistency.
 * Returns { data: { metrics, recent_activity } }. NOTE: /crm/dashboard/summary
 * returns {leads,properties,deals,system} with no data.metrics, so the Dashboard
 * and Analytics pages (which read summary.data.metrics) need the aggregate shape.
 */
export async function getDashboardSummary() {
  return apiClient.request('/crm/dashboard/aggregate');
}

/**
 * Calendar appointment stats (team-scoped): { total, confirmed, pending, completed, canceled }
 */
export async function getCalendarStats() {
  return apiClient.request('/calendar/stats');
}

/**
 * Upcoming appointments for the next `days` days (team-scoped). Returns an array.
 */
export async function getUpcomingAppointments(days = 30) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + (days || 30));
  const res = await apiClient.request(
    `/calendar/appointments?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
  );
  return Array.isArray(res) ? res : res?.items ?? [];
}

/**
 * Analytics dashboard metrics for a date range (supports filters)
 * Backend accepts startDate/endDate; we pass them so 30d filter works.
 * Returns: leads, properties, subscriptions, teams, users, activity, period
 */
export async function getAnalyticsDashboard(dateRangeValue = '30d') {
  const days = daysToQuery(dateRangeValue);
  const { startDate, endDate } = dateRangeFromDays(days);
  return apiClient.request(`/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Lead metrics only (for funnel / period comparison). Backend uses startDate/endDate.
 */
export async function getLeadMetrics(dateRangeValue = '30d') {
  const days = daysToQuery(dateRangeValue);
  const { startDate, endDate } = dateRangeFromDays(days);
  return apiClient.request(`/analytics/leads?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Activity metrics (events by type, by day). Backend accepts days.
 */
export async function getActivityMetrics(dateRangeValue = '30d') {
  const days = daysToQuery(dateRangeValue);
  return apiClient.request(`/analytics/activity?days=${days}`);
}

/**
 * Owner leads list – for source/agent aggregation (CRM access required)
 */
/**
 * Leads list for Dashboard / AI Command Center.
 * Use the normal Leads endpoint instead of /crm/owner/leads
 * because /crm/owner/leads only allows owner/agent roles.
 */
export async function getOwnerLeads(limit = 500) {
  const res = await apiClient.request("/leads");

  console.log("[Dashboard] /leads response:", res);

  let items = [];

  if (Array.isArray(res)) {
    items = res;
  } else if (Array.isArray(res?.data)) {
    items = res.data;
  } else if (Array.isArray(res?.items)) {
    items = res.items;
  } else if (Array.isArray(res?.data?.items)) {
    items = res.data.items;
  } else if (Array.isArray(res?.leads)) {
    items = res.leads;
  } else if (Array.isArray(res?.data?.leads)) {
    items = res.data.leads;
  }

  console.log("[Dashboard] parsed leads:", items);

  return items.slice(0, Math.max(1, Number(limit) || 500));
}
