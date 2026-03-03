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
 * Dashboard summary (same as Dashboard page and Leads scope) – for KPI consistency
 */
export async function getDashboardSummary() {
  return apiClient.request('/crm/dashboard/summary');
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
export async function getOwnerLeads(limit = 500) {
  const res = await apiClient.request(`/crm/owner/leads?limit=${limit}`);
  const items = res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
  return Array.isArray(items) ? items : [];
}
