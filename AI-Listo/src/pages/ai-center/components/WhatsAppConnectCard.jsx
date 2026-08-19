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
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./WhatsAppConnectCard.css";
import whatsappPhoneMobileImg from "../../../assets/cortexa/cortexa-whatsapp-phone-mobile.png";

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
  setupDesktopLayout = false,
}) {
  const { t } = useTranslation();

  // Mobile (touch-primary phones/tablets) connect by phone number and get a code,
  // since a QR cannot be scanned on the same device. Desktop keeps the QR.
  const [isMobile, setIsMobile] = useState(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }

    return window.matchMedia("(pointer: coarse)").matches;
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [changeNumber, setChangeNumber] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");

  const phoneCountries = [
    { key: "US", code: "+1", flagCode: "us", label: "United States" },
    { key: "CA", code: "+1", flagCode: "ca", label: "Canada" },
    { key: "MX", code: "+52", flagCode: "mx", label: "Mexico" },
    { key: "BR", code: "+55", flagCode: "br", label: "Brazil" },
    { key: "AR", code: "+54", flagCode: "ar", label: "Argentina" },
    { key: "CL", code: "+56", flagCode: "cl", label: "Chile" },
    { key: "CO", code: "+57", flagCode: "co", label: "Colombia" },
    { key: "PE", code: "+51", flagCode: "pe", label: "Peru" },
    { key: "EC", code: "+593", flagCode: "ec", label: "Ecuador" },
    { key: "GB", code: "+44", flagCode: "gb", label: "United Kingdom" },
    { key: "ES", code: "+34", flagCode: "es", label: "Spain" },
    { key: "PT", code: "+351", flagCode: "pt", label: "Portugal" },
    { key: "AU", code: "+61", flagCode: "au", label: "Australia" },
  ];

  const selectedCountryData =
    phoneCountries.find((item) => item.key === selectedCountry) ||
    phoneCountries[0];

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

  if (connected && (!setupDesktopLayout || isMobile)) {
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

          <div className="cx-whatsapp-mobile-phone-art" aria-hidden="true">
            <img src={whatsappPhoneMobileImg} alt="" />
          </div>

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
            className="cx-wa-mobile-phone-form"
            onSubmit={(event) => {
              event.preventDefault();
              const cleaned = phoneInput.replace(/[^0-9+]/g, "");
              const fullNumber = cleaned.startsWith("+")
                ? cleaned
                : `${selectedCountryData.code}${cleaned.replace(/^0+/, "")}`;

              if (onConnectWithCode) onConnectWithCode(fullNumber);
            }}
          >
            <div className="cx-wa-phone-input-wrap">
              <label className="cx-wa-country-picker">
                <select
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  aria-label="Country code"
                >
                  {phoneCountries.map((country) => (
                    <option key={country.key} value={country.key}>
                      {country.label} {country.code}
                    </option>
                  ))}
                </select>

                <span className="cx-wa-country-picker-display">
                  <img
                    className="cx-wa-country-flag-img"
                    src={`https://flagcdn.com/w40/${selectedCountryData.flagCode}.png`}
                    alt=""
                  />
                  <strong>{selectedCountryData.code}</strong>
                  <ChevronDown size={16} />
                </span>
              </label>

              <input
                className="cx-wa-phone-number-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <button
              className="cx-wa-primary-btn cx-wa-mobile-code-btn"
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

  if (setupDesktopLayout && !isMobile) {
    const handleDesktopReconnect = async () => {
      if (connecting || disconnecting) return;

      try {
        if (connected) {
          await onDisconnect?.();
        }

        await onConnect?.();
      } catch (reconnectError) {
        console.error("WhatsApp reconnect failed:", reconnectError);
      }
    };

    return (
      <div className="cx-wa-setup-desktop">
        {error && <div className="cx-wa-connect-error">{error}</div>}

        <div className="cx-wa-setup-desktop-grid">
          <div className="cx-wa-setup-desktop-guide">
            <h4>
              {t(
                "aiCenter.desktopWhatsappEasySteps",
                "Connect in just 4 easy steps",
              )}
            </h4>

            <ol>
              <li>
                {t(
                  "aiCenter.desktopWhatsappStep1",
                  "Open WhatsApp on your phone",
                )}
              </li>
              <li>
                {t(
                  "aiCenter.desktopWhatsappStep2",
                  "Go to Settings → Linked Devices",
                )}
              </li>
              <li>
                {t(
                  "aiCenter.desktopWhatsappStep3",
                  "Tap “Link a Device”",
                )}
              </li>
              <li>
                {t(
                  "aiCenter.desktopWhatsappStep4",
                  "Scan the QR code",
                )}
              </li>
            </ol>
          </div>

          <div className="cx-wa-setup-desktop-qr-column">
            <div
              className={`cx-wa-setup-desktop-qr-frame ${
                qr ? "has-qr" : ""
              }`}
            >
              {qr ? (
                <QRCodeCanvas
                  value={qr}
                  size={176}
                  level="M"
                  includeMargin={false}
                />
              ) : connecting ? (
                <div className="cx-wa-setup-desktop-qr-placeholder">
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
                </div>
              ) : connected ? (
                <div className="cx-wa-setup-desktop-qr-placeholder is-connected">
                  <CheckCircle2 size={38} />
                  <strong>
                    {t(
                      "aiCenter.desktopWhatsappConnectedTitle",
                      "WhatsApp Connected",
                    )}
                  </strong>
                  <span>
                    {t(
                      "aiCenter.desktopWhatsappQrReconnectHint",
                      "Reconnect to generate a fresh QR code.",
                    )}
                  </span>
                </div>
              ) : (
                <div className="cx-wa-setup-desktop-qr-placeholder">
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
                </div>
              )}
            </div>

            {connecting && qr && (
              <button
                type="button"
                className="cx-wa-setup-desktop-refresh"
                onClick={onRefreshQr}
                disabled={!onRefreshQr}
              >
                <RefreshCw size={15} />
                {t("aiCenter.whatsappConnect.refreshQr", "Refresh QR")}
              </button>
            )}
          </div>

          <div className="cx-wa-setup-desktop-state">
            <div
              className={`cx-wa-setup-desktop-state-card ${
                connected ? "is-connected" : ""
              }`}
            >
              {connected ? (
                <CheckCircle2 size={29} />
              ) : socketConnected ? (
                <Wifi size={29} />
              ) : (
                <WifiOff size={29} />
              )}

              <div>
                <strong>
                  {connected
                    ? t(
                        "aiCenter.desktopWhatsappConnectedTitle",
                        "WhatsApp Connected",
                      )
                    : t(
                        "aiCenter.desktopWhatsappNotConnectedTitle",
                        "WhatsApp Not Connected",
                      )}
                </strong>

                <span>
                  {connected
                    ? t(
                        "aiCenter.desktopWhatsappConnectedDesc",
                        "Your AI Agent is ready to chat!",
                      )
                    : t(
                        "aiCenter.desktopWhatsappNotConnectedDesc",
                        "Connect WhatsApp so your AI Agent can chat with customers.",
                      )}
                </span>

                {connected && phone && (
                  <small>
                    <Smartphone size={14} />
                    {phone}
                  </small>
                )}
              </div>
            </div>

            <button
              type="button"
              className="cx-wa-setup-desktop-connect-btn"
              onClick={handleDesktopReconnect}
              disabled={connecting || disconnecting}
            >
              <RefreshCw
                size={16}
                className={connecting ? "cx-wa-spin" : ""}
              />
              {connecting
                ? t(
                    "aiCenter.whatsappConnect.waitingForScan",
                    "Waiting for scan...",
                  )
                : connected
                  ? t("aiCenter.desktopReconnect", "Reconnect")
                  : t("aiCenter.desktopConnect", "Connect")}
            </button>
          </div>
        </div>
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