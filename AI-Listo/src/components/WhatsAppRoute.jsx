import { Navigate } from "react-router-dom";
import WhatsApp from "../pages/whatsapp/WhatsApp";
import WhatsAppQr from "../pages/whatsapp/WhatsAppQr";
import { primaryRouteIsQr } from "../config/whatsappUi";

/** /dashboard/whatsapp — Twilio or QR depending on VITE_WHATSAPP_UI */
export function WhatsAppPrimaryRoute() {
  return primaryRouteIsQr ? <WhatsAppQr /> : <WhatsApp />;
}

/** /dashboard/whatsapp-qr — duplicate of QR; when QR is primary, one URL only */
export function WhatsAppQrRoute() {
  if (primaryRouteIsQr) {
    return <Navigate to="/dashboard/whatsapp" replace />;
  }
  return <WhatsAppQr />;
}
