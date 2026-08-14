import apiClient from "./apiClient";

function buildEcommerceQuery(params = {}) {
  const p = new URLSearchParams();

  const keys = [
    "tab",
    "q",
    "plan",
    "billing",
    "paymentStatus",
    "source",
    "language",
    "country",
    "usersRole",
    "seatStatus",
    "from",
    "to",
    "limit",
    "offset",
  ];

  for (const key of keys) {
    const value = params[key];

    if (value != null && value !== "" && value !== "all") {
      p.set(key, String(value));
    }
  }

  const qs = p.toString();

  return qs ? `?${qs}` : "";
}

const BASE = "/ecommerce/customers-hub";

/* =========================================================
   LIST + SUMMARY
   ========================================================= */

export function getEcommerceCustomers(params = {}) {
  return apiClient.request(
    `${BASE}${buildEcommerceQuery(params)}`
  );
}

export function getEcommerceSummary(params = {}) {
  return apiClient.request(
    `${BASE}/summary${buildEcommerceQuery(params)}`
  );
}

/* =========================================================
   CUSTOMER DETAIL
   ========================================================= */

export function getEcommerceCustomerDetail(id) {
  return apiClient.request(
    `${BASE}/${id}`
  );
}

/* =========================================================
   NOTES
   ========================================================= */

export function getEcommerceCustomerNotes(id) {
  return apiClient.request(
    `${BASE}/${id}/notes`
  );
}

export async function addEcommerceCustomerNote(id, note) {
  const res = await apiClient.request(
    `${BASE}/${id}/notes`,
    {
      method: "POST",
      body: JSON.stringify({
        note,
      }),
    }
  );

  return res?.data ?? res;
}

export function deleteEcommerceCustomerNote(id, noteId) {
  return apiClient.request(
    `${BASE}/${id}/notes/${noteId}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   PLAN
   ========================================================= */

export function changeEcommerceCustomerPlan(
  id,
  {
    plan,
    billingCycle,
  } = {}
) {
  return apiClient.request(
    `${BASE}/${id}/change-plan`,
    {
      method: "POST",
      body: JSON.stringify({
        plan,
        billingCycle,
      }),
    }
  );
}

/* =========================================================
   UPDATE CUSTOMER
   ========================================================= */

export function updateEcommerceCustomer(
  id,
  payload = {}
) {
  return apiClient.request(
    `${BASE}/${id}/update`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/* =========================================================
   SEND EMAIL
   ========================================================= */

export function sendEcommerceCustomerEmail(
  id,
  {
    subject,
    message,
  } = {}
) {
  return apiClient.request(
    `${BASE}/${id}/email`,
    {
      method: "POST",
      body: JSON.stringify({
        subject,
        message,
      }),
    }
  );
}

/* =========================================================
   TEAM / SEATS
   ========================================================= */

export function getEcommerceCustomerTeam(id) {
  return apiClient.request(
    `${BASE}/${id}/team`
  );
}

export function addEcommerceCustomerTeamMember(
  id,
  payload = {}
) {
  return apiClient.request(
    `${BASE}/${id}/team/members`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function changeEcommerceCustomerMemberRole(
  id,
  memberId,
  role
) {
  return apiClient.request(
    `${BASE}/${id}/team/members/${memberId}/role`,
    {
      method: "POST",
      body: JSON.stringify({
        role,
      }),
    }
  );
}

export function setEcommerceCustomerMemberSeat(
  id,
  memberId,
  assigned
) {
  return apiClient.request(
    `${BASE}/${id}/team/members/${memberId}/seat`,
    {
      method: "POST",
      body: JSON.stringify({
        assigned,
      }),
    }
  );
}

export function removeEcommerceCustomerTeamMember(
  id,
  memberId
) {
  return apiClient.request(
    `${BASE}/${id}/team/members/${memberId}`,
    {
      method: "DELETE",
    }
  );
}

export function transferEcommerceCustomerOwnership(
  id,
  newOwnerId
) {
  return apiClient.request(
    `${BASE}/${id}/team/transfer-ownership`,
    {
      method: "POST",
      body: JSON.stringify({
        newOwnerId,
      }),
    }
  );
}

/* =========================================================
   DEACTIVATE / DELETE
   ========================================================= */

export function deactivateEcommerceCustomer(id) {
  return apiClient.request(
    `${BASE}/${id}/deactivate`,
    {
      method: "POST",
    }
  );
}

export function deleteEcommerceCustomer(id) {
  return apiClient.request(
    `${BASE}/${id}`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   IMPORT
   ========================================================= */

export function importEcommerceCustomers(
  customers = []
) {
  return apiClient.request(
    `${BASE}/import`,
    {
      method: "POST",
      body: JSON.stringify({
        customers,
      }),
    }
  );
}

/* =========================================================
   CREATE CUSTOMER
   ========================================================= */

export function createEcommerceCustomer(
  payload = {}
) {
  return apiClient.request(
    BASE,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/* =========================================================
   PLAN CONFIG
   ========================================================= */

export function getEcommercePlanConfig() {
  return apiClient.request(
    `${BASE}/plan-config`
  );
}

export function setEcommercePlanConfig(
  planId,
  body = {}
) {
  return apiClient.request(
    `${BASE}/plan-config/${planId}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function resetEcommercePlanConfig(planId) {
  return apiClient.request(
    `${BASE}/plan-config/${planId}/reset`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   EXPORT CSV
   ========================================================= */

export async function exportEcommerceCustomersCsv(
  params = {}
) {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    "https://backend.cortexaaicrm.com/api";

  const token = localStorage.getItem(
    "listo_access_token"
  );

  const res = await fetch(
    `${apiBase}${BASE}/export.csv${buildEcommerceQuery(
      params
    )}`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  );

  if (!res.ok) {
    throw new Error(
      `Export failed (${res.status})`
    );
  }

  const blob = await res.blob();

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "ecommerce-customers.csv";

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}