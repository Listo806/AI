import apiClient from "./apiClient";

export const getWhatsappStatus = () =>
  apiClient.get("/whatsapp-qr/status");

export const connectWhatsapp = () =>
  apiClient.post("/whatsapp-qr/connect");

export const disconnectWhatsapp = () =>
  apiClient.post("/whatsapp-qr/disconnect");

export const refreshWhatsapp = () =>
  apiClient.get("/whatsapp-qr/status");