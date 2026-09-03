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

  overview(month) {
    return get(
      `/admin/billing-calendar/overview${buildQuery({
        month,
      })}`
    );
  },

  // Alias
  getOverview(month) {
    return this.overview(month);
  },

  // =========================================================
  // MONTH
  // =========================================================

  month(month) {
    return get(
      `/admin/billing-calendar/month${buildQuery({
        month,
      })}`
    );
  },

  // Alias
  getMonth(month) {
    return this.month(month);
  },

  // =========================================================
  // DAY
  // =========================================================

  day(date, params = {}) {
    if (!date) {
      return Promise.reject(
        new Error("date is required")
      );
    }

    return get(
      `/admin/billing-calendar/day/${encodeURIComponent(
        date
      )}${buildQuery(params)}`
    );
  },

  // Alias
  getDay(date, params = {}) {
    return this.day(date, params);
  },

  // =========================================================
  // UPCOMING BILLING
  // =========================================================

  upcoming(params = {}) {
    return get(
      `/admin/billing-calendar/upcoming${buildQuery(
        params
      )}`
    );
  },

  // Alias
  getUpcoming(params = {}) {
    return this.upcoming(params);
  },

  // =========================================================
  // ACTIVITY
  // =========================================================

  activity(params = {}) {
    return get(
      `/admin/billing-calendar/activity${buildQuery(
        params
      )}`
    );
  },

  // Alias
  getActivity(params = {}) {
    return this.activity(params);
  },

  // =========================================================
  // EXCEPTIONS
  // =========================================================

  exceptions() {
    return get(
      "/admin/billing-calendar/exceptions"
    );
  },

  // Alias
  getExceptions() {
    return this.exceptions();
  },

  // =========================================================
  // RESCHEDULE SINGLE SUBSCRIPTION
  // =========================================================

  reschedule(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/reschedule`,
      payload
    );
  },

  // Alias
  rescheduleSubscription(subscriptionId, payload = {}) {
    return this.reschedule(
      subscriptionId,
      payload
    );
  },

  // =========================================================
  // BULK RESCHEDULE
  // =========================================================

  bulkReschedule(payload = {}) {
    return post(
      "/admin/billing-calendar/bulk/reschedule",
      payload
    );
  },

  // =========================================================
  // PAUSE SUBSCRIPTION
  // =========================================================

  pause(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/pause`,
      payload
    );
  },

  // Alias
  pauseSubscription(subscriptionId, payload = {}) {
    return this.pause(
      subscriptionId,
      payload
    );
  },

  // =========================================================
  // CANCEL SUBSCRIPTION
  // =========================================================

  cancel(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/cancel`,
      payload
    );
  },

  // Alias
  cancelSubscription(subscriptionId, payload = {}) {
    return this.cancel(
      subscriptionId,
      payload
    );
  },

  // =========================================================
  // SEND REMINDER
  // =========================================================

  reminder(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/reminder`,
      payload
    );
  },

  // Alias
  sendReminder(subscriptionId, payload = {}) {
    return this.reminder(
      subscriptionId,
      payload
    );
  },

  // =========================================================
  // RETRY PAYMENT
  // =========================================================

  retry(subscriptionId, payload = {}) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
    }

    return post(
      `/admin/billing-calendar/subscriptions/${encodeURIComponent(
        subscriptionId
      )}/retry`,
      payload
    );
  },

  // Alias
  retryPayment(subscriptionId, payload = {}) {
    return this.retry(
      subscriptionId,
      payload
    );
  },

  // =========================================================
  // OPTIONAL UPDATE
  // =========================================================

  updateSubscription(
    subscriptionId,
    payload = {}
  ) {
    if (!subscriptionId) {
      return Promise.reject(
        new Error("subscriptionId is required")
      );
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