import React from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildLocalizedPath } from "../i18n/locales";

// Full-page lock shown in place of a paid feature for Free accounts. The feature
// stays discoverable (the client wants it visible) but gated behind an upgrade.
// Dashboard routes are not locale-prefixed, so the pricing link is built from
// the active language via buildLocalizedPath.
export function FeatureLockScreen({
  title = "This feature is on a paid plan",
  description = "Upgrade your plan to unlock this feature. All your data and settings are kept exactly as they are.",
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const goUpgrade = () =>
    navigate(buildLocalizedPath("/pricing", i18n?.language || "en"));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#f3f4f6",
          marginBottom: "20px",
        }}
      >
        <Lock size={28} color="#111827" />
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: "22px", color: "#111827" }}>
        {title}
      </h2>
      <p
        style={{
          margin: "0 0 24px",
          maxWidth: "440px",
          fontSize: "15px",
          lineHeight: 1.5,
          color: "#6b7280",
        }}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={goUpgrade}
        style={{
          padding: "12px 28px",
          borderRadius: "10px",
          border: "none",
          background: "#111827",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        See plans &amp; upgrade
      </button>
    </div>
  );
}

// Small lock badge for a locked navigation item.
export function LockBadge({ size = 13 }) {
  return (
    <Lock
      size={size}
      color="#9ca3af"
      strokeWidth={2.2}
      style={{ flexShrink: 0, marginLeft: "auto" }}
      aria-label="Upgrade to unlock"
    />
  );
}

export default FeatureLockScreen;
