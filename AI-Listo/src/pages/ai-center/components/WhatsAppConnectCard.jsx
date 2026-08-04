import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./WhatsAppConnectCard.css";

export default function WhatsAppConnectCard({
  qr,
  connected,
  phone,
  loading,
  connecting,
  disconnecting,
  socketConnected,
  error,
  onConnect,
  onDisconnect,
  onRefreshQr,
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="cx-wa-connect-state">
        <RefreshCw className="cx-wa-spin" size={20} />
        {t("aiCenter.whatsappConnect.loadingStatus", "Loading WhatsApp status...")}
      </div>
    );
  }

  if (connected) {
    return (
      <div className="cx-wa-connected-card">
        <div className="cx-wa-connected-icon">
          <CheckCircle2 size={26} />
        </div>
        <div className="cx-wa-connected-copy">
          <h4>
            {t("aiCenter.whatsappConnect.connectedTitle", "WhatsApp Connected")}
          </h4>
          <p>
            {t(
              "aiCenter.whatsappConnect.connectedSubtitle",
              "This connection is shared with the WhatsApp Inbox.",
            )}
          </p>
          <div className="cx-wa-connected-meta">
            <span>
              <Smartphone size={15} />
              {phone ||
                t("aiCenter.whatsappConnect.connectedDevice", "Connected device")}
            </span>
            <span>
              {socketConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
              {socketConnected
                ? t("aiCenter.whatsappConnect.realtimeOnline", "Realtime online")
                : t(
                    "aiCenter.whatsappConnect.realtimeReconnecting",
                    "Realtime reconnecting",
                  )}
            </span>
          </div>
        </div>
        <button
          className="cx-wa-disconnect-btn"
          onClick={onDisconnect}
          disabled={disconnecting}
          type="button"
        >
          <Unplug size={16} />
          {disconnecting
            ? t("aiCenter.whatsappConnect.disconnecting", "Disconnecting...")
            : t("aiCenter.whatsappConnect.disconnect", "Disconnect")}
        </button>
      </div>
    );
  }

  return (
    <div className="cx-wa-connect-card">
      {error && <div className="cx-wa-connect-error">{error}</div>}

      <div className="cx-wa-connect-grid">
        <div className="cx-wa-connect-guide">
          <h4>
            {t("aiCenter.whatsappConnect.qrConnection", "QR Connection")}{" "}
            <span>
              {t("aiCenter.whatsappConnect.recommended", "(Recommended)")}
            </span>
          </h4>
          <p>
            {t(
              "aiCenter.whatsappConnect.connectDescription",
              "Connect the WhatsApp account your AI Agent will use.",
            )}
          </p>
          <ol className="cx-wa-connect-steps">
            <li>
              {t(
                "aiCenter.whatsappConnect.step1",
                "Open WhatsApp on your phone",
              )}
            </li>
            <li>
              {t(
                "aiCenter.whatsappConnect.step2",
                "Go to Settings → Linked Devices",
              )}
            </li>
            <li>{t("aiCenter.whatsappConnect.step3", "Tap “Link a Device”")}</li>
            <li>
              {t(
                "aiCenter.whatsappConnect.step4",
                "Scan the QR code shown here",
              )}
            </li>
          </ol>
          <div className="cx-wa-connect-security">
            <MessageSquare size={18} />
            <div>
              <strong>
                {t(
                  "aiCenter.whatsappConnect.sharedConnectionTitle",
                  "One shared WhatsApp connection",
                )}
              </strong>
              <p>
                {t(
                  "aiCenter.whatsappConnect.sharedConnectionDesc",
                  "The same session powers AI Agent and WhatsApp Inbox.",
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="cx-wa-connect-qr-column">
          <div className={`cx-wa-qr-frame ${qr ? "has-qr" : ""}`}>
            {qr ? (
              <QRCodeCanvas value={qr} size={176} level="M" />
            ) : (
              <div className="cx-wa-qr-placeholder">
                {connecting ? (
                  <>
                    <RefreshCw className="cx-wa-spin" size={30} />
                    <strong>
                      {t(
                        "aiCenter.whatsappConnect.generatingQr",
                        "Generating QR code...",
                      )}
                    </strong>
                    <span>
                      {t(
                        "aiCenter.whatsappConnect.generatingQrHint",
                        "This can take a few seconds.",
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Smartphone size={34} />
                    <strong>
                      {t(
                        "aiCenter.whatsappConnect.readyToConnect",
                        "Ready to connect",
                      )}
                    </strong>
                    <span>
                      {t(
                        "aiCenter.whatsappConnect.readyToConnectHint",
                        "Click Connect WhatsApp to generate a QR code.",
                      )}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="cx-wa-connect-actions">
            <button
              className="cx-wa-secondary-btn"
              onClick={onRefreshQr}
              disabled={!connecting}
              type="button"
            >
              {t("aiCenter.whatsappConnect.refreshQr", "Refresh QR")}
            </button>

            <button
              className="cx-wa-primary-btn"
              onClick={onConnect}
              disabled={connecting}
              type="button"
            >
              {connecting
                ? t("aiCenter.whatsappConnect.waitingForScan", "Waiting for scan...")
                : t("aiCenter.whatsappConnect.connectWhatsapp", "Connect WhatsApp")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
