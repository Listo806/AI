import apiClient from "./apiClient";

const q = (params = {}) => {
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

  const queryString = search.toString();

  return queryString ? `?${queryString}` : "";
};

const request = (path, options = {}) => {
  return apiClient.request(path, options);
};

export const clinicMedicalApi = {
  dashboard() {
    return request("/clinic-medical/dashboard", {
      method: "GET",
    });
  },

  patients(params = {}) {
    return request(`/clinic-medical/patients${q(params)}`, {
      method: "GET",
    });
  },

  patientStats() {
    return request("/clinic-medical/patients/stats", {
      method: "GET",
    });
  },

  patient(id) {
    return request(
      `/clinic-medical/patients/${encodeURIComponent(id)}`,
      {
        method: "GET",
      },
    );
  },

  createPatient(body) {
    return request("/clinic-medical/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },

  updatePatient(id, body) {
    return request(
      `/clinic-medical/patients/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  },

  archivePatient(id) {
    return request(
      `/clinic-medical/patients/${encodeURIComponent(id)}/archive`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
  },

  consultations(patientId) {
    return request(
      `/clinic-medical/patients/${encodeURIComponent(
        patientId,
      )}/consultations`,
      {
        method: "GET",
      },
    );
  },

  consultation(id) {
    return request(
      `/clinic-medical/consultations/${encodeURIComponent(id)}`,
      {
        method: "GET",
      },
    );
  },

  createConsultation(body) {
    return request("/clinic-medical/consultations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  },

  saveConsultation(id, body) {
    return request(
      `/clinic-medical/consultations/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  },

  completeConsultation(id, body = {}) {
    return request(
      `/clinic-medical/consultations/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  },

  providers() {
    return request("/clinic-medical/providers", {
      method: "GET",
    });
  },
};

export default clinicMedicalApi;