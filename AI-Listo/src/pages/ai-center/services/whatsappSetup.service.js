import apiClient from "../../../api/apiClient";

const unwrapResponse = (response) => {
  return response?.data ?? response ?? null;
};

const request = async (url, options = {}) => {
  const response = await apiClient.request(url, options);
  return unwrapResponse(response);
};

export const whatsappSetupService = {
  getStatus() {
    return request("/whatsapp-qr/status", {
      method: "GET",
    });
  },

  getPendingQr() {
    return request("/whatsapp-qr/pending-qr", {
      method: "GET",
    });
  },

  connect() {
    return request("/whatsapp-qr/connect", {
      method: "POST",
    });
  },

  disconnect() {
    return request("/whatsapp-qr/disconnect", {
      method: "POST",
    });
  },
};

export default whatsappSetupService;