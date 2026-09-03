import apiClient from "./apiClient";

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

const get = (endpoint) => apiClient.request(endpoint);

const post = (endpoint, body = {}) =>
  apiClient.request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

const billingCalendarApi = {
  // ============================================================
  // CALENDAR DATA
  // ============================================================

  overview: (month) =>
    get(
      `/admin/billing-calendar/overview${buildQuery({
        month,
      })}`,
    ),

  month: (month) =>
    get(
      `/admin/billing-calendar/month${buildQuery({
        month,
      })}`,
    ),

  day: (date, params = {}) =>
    get(
      `/admin/billing-calendar/day/${encodeURIComponent(date)}${buildQuery(
        params,
      )}`,
    ),

  // ============================================================
  // UPCOMING BILLING DAYS
  // ============================================================

  upcoming: (params = {}) =>
    get(
      `/admin/billing-calendar/upcoming${buildQuery(
        params,
      )}`,
    ),

  // ============================================================
  // RECENT BILLING ACTIVITY
  // ============================================================

  activity: (params = {}) =>
    get(
      `/admin/billing-calendar/activity${buildQuery(
        params,
      )}`,
    ),

  // ============================================================
  // BILLING EXCEPTIONS
  // ============================================================

  exceptions: () =>
    get("/admin/billing-calendar/exceptions"),

  exceptionRecords: (params = {}) =>
    get(
      `/admin/billing-calendar/exceptions/records${buildQuery(
        params,
      )}`,
    ),

  // ============================================================
  // RESCHEDULE
  // ============================================================

  bulkReschedule: (payload) =>
    post(
      "/admin/billing-calendar/bulk/reschedule",
      payload,
    ),

  reschedule: (subscriptionId, payload) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/reschedule`,
      payload,
    ),

  // ============================================================
  // SUBSCRIPTION ACTIONS
  // ============================================================

  pauseSubscription: (subscriptionId, payload = {}) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/pause`,
      payload,
    ),

  cancelSubscription: (subscriptionId, payload = {}) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/cancel`,
      payload,
    ),

  // ============================================================
  // REMINDER
  // ============================================================

  reminderTarget: (subscriptionId) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/reminder`,
      {},
    ),

  // ============================================================
  // FAILED PAYMENT / RETRY
  // ============================================================

  retryPayment: (subscriptionId) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/retry`,
      {},
    ),

  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction: (transactionId) =>
    get(
      `/admin/billing-calendar/transactions/${encodeURIComponent(
        transactionId,
      )}`,
    ),

  // ============================================================
  // REFUND
  // ============================================================

  refund: (subscriptionId, payload) =>
    post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId,
      )}/refund`,
      payload,
    ),

  // ============================================================
  // CUSTOMER HUB
  // ============================================================

  customerDetail: (customerId) =>
    get(
      `/admin/customers-hub/${encodeURIComponent(
        customerId,
      )}`,
    ),

  changeCustomerPlan: (customerId, payload) =>
    post(
      `/admin/customers-hub/${encodeURIComponent(
        customerId,
      )}/change-plan`,
      payload,
    ),

  sendCustomerEmail: (customerId, payload) =>
    post(
      `/admin/customers-hub/${encodeURIComponent(
        customerId,
      )}/email`,
      payload,
    ),
};

export default billingCalendarApi;