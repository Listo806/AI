import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  CheckCircle2,
  KeyRound,
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
  pairingCode,
  connected,
  phone,
  loading,
  connecting,
  disconnecting,
  socketConnected,
  error,
  onConnect,
  onConnectWithCode,
  onDisconnect,
  onRefreshQr,
}) {
  const { t } = useTranslation();

  // Mobile (touch-primary phones/tablets) connect by phone number and get a code,
  // since a QR cannot be scanned on the same device. Desktop keeps the QR.
  const [isMobile, setIsMobile] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [changeNumber, setChangeNumber] = useState(false);

  useEffect(() => {
    const coarse =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(Boolean(coarse));
  }, []);

  // When a fresh pairing code arrives, drop out of the "change number" view.
  useEffect(() => {
    if (pairingCode) setChangeNumber(false);
  }, [pairingCode]);

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

  if (isMobile) {
    const showCode = Boolean(pairingCode) && !changeNumber;
    const formattedCode =
      pairingCode && pairingCode.length === 8
        ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
        : pairingCode || "";
    return (
      <div className="cx-wa-connect-card">
        {error && <div className="cx-wa-connect-error">{error}</div>}

        <div className="cx-wa-connect-guide">
          <h4>
            {t(
              "aiCenter.whatsappConnect.phoneConnection",
              "Connect by phone number",
            )}
          </h4>
          <p>
            {t(
              "aiCenter.whatsappConnect.phoneConnectionDesc",
              "Link the WhatsApp account your AI Agent will use, right from this phone. No QR to scan.",
            )}
          </p>
          <ol className="cx-wa-connect-steps">
            <li>
              {t(
                "aiCenter.whatsappConnect.phoneStep1",
                "Enter your WhatsApp number with the country code",
              )}
            </li>
            <li>
              {t(
                "aiCenter.whatsappConnect.phoneStep2",
                "Open WhatsApp, then Settings and Linked Devices",
              )}
            </li>
            <li>
              {t(
                "aiCenter.whatsappConnect.phoneStep3",
                "Tap Link a device, then Link with phone number instead",
              )}
            </li>
            <li>
              {t(
                "aiCenter.whatsappConnect.phoneStep4",
                "Enter the code shown here",
              )}
            </li>
          </ol>
        </div>

        {showCode ? (
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              <KeyRound size={15} />
              {t("aiCenter.whatsappConnect.yourCode", "Your connection code")}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "0.18em",
                fontFamily: "ui-monospace, Menlo, monospace",
                color: "#0f172a",
              }}
            >
              {formattedCode}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                margin: "12px auto 16px",
                maxWidth: 330,
                lineHeight: 1.5,
              }}
            >
              {t(
                "aiCenter.whatsappConnect.enterCodeHint",
                "In WhatsApp, open Linked Devices, tap Link a device, then Link with phone number instead, and enter this code.",
              )}
            </p>
            <button
              className="cx-wa-secondary-btn"
              type="button"
              onClick={() => setChangeNumber(true)}
            >
              {t(
                "aiCenter.whatsappConnect.useDifferentNumber",
                "Use a different number",
              )}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (onConnectWithCode) onConnectWithCode(phoneInput);
            }}
            style={{
              marginTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder={t(
                "aiCenter.whatsappConnect.phonePlaceholder",
                "Phone number with country code, e.g. +593987654321",
              )}
              style={{
                padding: "12px 14px",
                border: "1px solid #d8dde5",
                borderRadius: 10,
                fontSize: 15,
                width: "100%",
              }}
            />
            <button
              className="cx-wa-primary-btn"
              type="submit"
              disabled={connecting}
            >
              {connecting
                ? t(
                    "aiCenter.whatsappConnect.generatingCode",
                    "Generating code...",
                  )
                : t("aiCenter.whatsappConnect.getCode", "Get connection code")}
            </button>
          </form>
        )}
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
