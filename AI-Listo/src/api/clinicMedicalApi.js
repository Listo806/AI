import apiClient from "./apiClient";

const q = (params={}) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  });
  const x=s.toString();
  return x ? `?${x}` : "";
};

export const clinicMedicalApi = {
  dashboard: () => apiClient.get("/clinic-medical/dashboard"),
  patients: (params) => apiClient.get(`/clinic-medical/patients${q(params)}`),
  patientStats: () => apiClient.get("/clinic-medical/patients/stats"),
  patient: (id) => apiClient.get(`/clinic-medical/patients/${id}`),
  createPatient: (body) => apiClient.post("/clinic-medical/patients", body),
  updatePatient: (id,body) => apiClient.patch(`/clinic-medical/patients/${id}`,body),
  archivePatient: (id) => apiClient.patch(`/clinic-medical/patients/${id}/archive`,{}),
  consultations: (patientId) => apiClient.get(`/clinic-medical/patients/${patientId}/consultations`),
  consultation: (id) => apiClient.get(`/clinic-medical/consultations/${id}`),
  createConsultation: (body) => apiClient.post("/clinic-medical/consultations",body),
  saveConsultation: (id,body) => apiClient.patch(`/clinic-medical/consultations/${id}`,body),
  completeConsultation: (id,body) => apiClient.post(`/clinic-medical/consultations/${id}/complete`,body),
  providers: () => apiClient.get("/clinic-medical/providers"),
};
