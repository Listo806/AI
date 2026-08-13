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

  // Mobile: start a connection by phone number. The 8-character pairing code is
  // delivered over the /whatsapp-qr socket as a "pairing-code" event.
  connectWithCode(phone) {
    return request("/whatsapp-qr/pairing-code", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  disconnect() {
    return request("/whatsapp-qr/disconnect", {
      method: "POST",
    });
  },
};

export default whatsappSetupService;