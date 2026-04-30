/**
 * Controls which WhatsApp UI is shown (Twilio vs QR), aligned with backend flags
 * TWILIO_WHATSAPP_DISABLED / WHATSAPP_QR_ENABLED — frontend build-time switch.
 *
 * VITE_WHATSAPP_UI:
 *   - twilio (default) — /dashboard/whatsapp is the original Twilio page; QR at /dashboard/whatsapp-qr if needed
 *   - qr — /dashboard/whatsapp is the QR flow only (sidebar single "WhatsApp"); Twilio page hidden
 *   - both — both routes and both sidebar entries
 */
const raw = (import.meta.env.VITE_WHATSAPP_UI || 'twilio').toLowerCase();

export const whatsappUiMode =
  raw === 'qr' || raw === 'both' || raw === 'twilio' ? raw : 'twilio';

/** Main /dashboard/whatsapp renders QR component when true */
export const primaryRouteIsQr = whatsappUiMode === 'qr';

/** Show Twilio page at /dashboard/whatsapp (when not qr-only) */
export const showTwilioRoute =
  whatsappUiMode === 'twilio' || whatsappUiMode === 'both';

/** Show QR page somewhere */
export const showQrRoute = whatsappUiMode === 'qr' || whatsappUiMode === 'both';

/** Sidebar: show link to Twilio WhatsApp */
export const sidebarShowTwilio = showTwilioRoute && !primaryRouteIsQr;

/** Sidebar: show link to QR (path depends on primaryRouteIsQr) */
export const sidebarShowQr = showQrRoute && (whatsappUiMode === 'both');
