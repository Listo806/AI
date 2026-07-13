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
  if (loading) {
    return (
      <div className="cx-wa-connect-state">
        <RefreshCw className="cx-wa-spin" size={20} />
        Loading WhatsApp status...
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
          <h4>WhatsApp Connected</h4>
          <p>This connection is shared with the WhatsApp Inbox.</p>
          <div className="cx-wa-connected-meta">
            <span>
              <Smartphone size={15} />
              {phone || "Connected device"}
            </span>
            <span>
              {socketConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
              {socketConnected ? "Realtime online" : "Realtime reconnecting"}
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
          {disconnecting ? "Disconnecting..." : "Disconnect"}
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
            QR Connection <span>(Recommended)</span>
          </h4>
          <p>Connect the WhatsApp account your AI Agent will use.</p>
          <ol className="cx-wa-connect-steps">
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices</li>
            <li>Tap “Link a Device”</li>
            <li>Scan the QR code shown here</li>
          </ol>
          <div className="cx-wa-connect-security">
            <MessageSquare size={18} />
            <div>
              <strong>One shared WhatsApp connection</strong>
              <p>The same session powers AI Agent and WhatsApp Inbox.</p>
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
                    <strong>Generating QR code...</strong>
                    <span>This can take a few seconds.</span>
                  </>
                ) : (
                  <>
                    <Smartphone size={34} />
                    <strong>Ready to connect</strong>
                    <span>Click Connect WhatsApp to generate a QR code.</span>
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
              Refresh QR
            </button>

            <button
              className="cx-wa-primary-btn"
              onClick={onConnect}
              disabled={connecting}
              type="button"
            >
              {connecting ? "Waiting for scan..." : "Connect WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
