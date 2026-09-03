import apiClient from "./apiClient";

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();

  return query ? `?${query}` : "";
};

const get = (endpoint) => {
  return apiClient.request(endpoint);
};

const post = (endpoint, body = {}) => {
  return apiClient.request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

const patch = (endpoint, body = {}) => {
  return apiClient.request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

const billingCalendarApi = {
  // =========================================================
  // OVERVIEW
  // =========================================================

  getOverview(month) {
    return get(
      `/admin/billing-calendar/overview${buildQuery({
        month,
      })}`
    );
  },

  // =========================================================
  // CALENDAR MONTH
  // =========================================================

  getMonth(month) {
    return get(
      `/admin/billing-calendar/month${buildQuery({
        month,
      })}`
    );
  },

  // =========================================================
  // DAY DETAILS
  // =========================================================

  getDay(date, params = {}) {
    return get(
      `/admin/billing-calendar/day/${encodeURIComponent(date)}${buildQuery(
        params
      )}`
    );
  },

  // =========================================================
  // UPCOMING BILLING
  // =========================================================

  getUpcoming(params = {}) {
    return get(
      `/admin/billing-calendar/upcoming${buildQuery(params)}`
    );
  },

  // =========================================================
  // BILLING ACTIVITY
  // =========================================================

  getActivity(params = {}) {
    return get(
      `/admin/billing-calendar/activity${buildQuery(params)}`
    );
  },

  // =========================================================
  // BILLING EXCEPTIONS
  // =========================================================

  getExceptions() {
    return get(
      "/admin/billing-calendar/exceptions"
    );
  },

  // =========================================================
  // RESCHEDULE ONE SUBSCRIPTION
  // =========================================================

  rescheduleSubscription(subscriptionId, payload) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/reschedule`,
      payload
    );
  },

  // =========================================================
  // BULK RESCHEDULE
  // =========================================================

  bulkReschedule(payload) {
    return post(
      "/admin/billing-calendar/bulk/reschedule",
      payload
    );
  },

  // =========================================================
  // PAUSE SUBSCRIPTION
  // =========================================================

  pauseSubscription(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/pause`,
      payload
    );
  },

  // =========================================================
  // CANCEL SUBSCRIPTION
  // =========================================================

  cancelSubscription(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/cancel`,
      payload
    );
  },

  // =========================================================
  // SEND BILLING REMINDER
  // =========================================================

  sendReminder(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/reminder`,
      payload
    );
  },

  // =========================================================
  // RETRY FAILED PAYMENT
  // =========================================================

  retryPayment(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/retry`,
      payload
    );
  },

  // =========================================================
  // OPTIONAL STATUS UPDATE
  // =========================================================

  updateSubscription(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      throw new Error("subscriptionId is required");
    }

    return patch(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}`,
      payload
    );
  },
};

export default billingCalendarApi;