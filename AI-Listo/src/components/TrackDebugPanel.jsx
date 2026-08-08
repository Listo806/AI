import { useEffect, useState, useCallback } from "react";

// On-page tracking QA overlay. It shows ONLY when the CURRENT page URL carries a
// truthy ?trackdebug value. There is no cookie, no localStorage, and no persisted
// flag of any kind, so a normal visitor on the bare site never sees it. Because
// this component mounts once at the app root and stays mounted across in-app
// navigation, the value read once at load keeps the panel visible through a
// multi-page test without persisting anything. It lists every funnel event and
// conversion as it fires with the exact data sent; it never sends anything
// itself, it only reads the log written by src/utils/track.js.
const LOG_KEY = "cortexa_track_log";
// Legacy key from an earlier build that persisted the flag; cleared on mount so
// it can never again make the panel appear on normal traffic.
const LEGACY_FLAG_KEY = "cortexa_trackdebug";

function resolveEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search);
    if (!p.has("trackdebug")) return false;
    const v = (p.get("trackdebug") || "").toLowerCase();
    return v !== "0" && v !== "off" && v !== "false";
  } catch (_e) {
    return false;
  }
}

const KEY_PARAMS = [
  "value",
  "currency",
  "transaction_id",
  "offer",
  "plan",
  "gclid",
  "campaign",
  "send_to",
  "cta",
  "source",
];

function fmtParams(params) {
  const parts = [];
  for (const k of KEY_PARAMS) {
    const v = params?.[k];
    if (v != null && v !== "") parts.push(`${k}=${v}`);
  }
  return parts.join("  ");
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch (_e) {
    return "";
  }
}

const TYPE_COLOR = {
  event: "#38bdf8",
  conversion: "#4ade80",
};

export default function TrackDebugPanel() {
  const [enabled] = useState(resolveEnabled);
  const [log, setLog] = useState([]);

  const refresh = useCallback(() => {
    try {
      setLog(JSON.parse(sessionStorage.getItem(LOG_KEY) || "[]"));
    } catch (_e) {
      setLog([]);
    }
  }, []);

  // Always clear any legacy persisted flag from earlier builds, even when the
  // panel is disabled, so a browser that once stored it stops showing the panel
  // on normal traffic after this deploy.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_FLAG_KEY);
    } catch (_e) {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const onTrack = () => refresh();
    window.addEventListener("cortexa-track", onTrack);
    return () => window.removeEventListener("cortexa-track", onTrack);
  }, [enabled, refresh]);

  if (!enabled) return null;

  const clear = () => {
    try {
      sessionStorage.removeItem(LOG_KEY);
    } catch (_e) {
      /* no-op */
    }
    setLog([]);
  };

  const rows = [...log].reverse();

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 2147483647,
        width: "min(380px, 92vw)",
        maxHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        color: "#e2e8f0",
        border: "1px solid #334155",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid #334155",
          background: "#111c33",
        }}
      >
        <strong style={{ fontSize: 12, letterSpacing: 0.3 }}>
          Tracking events
        </strong>
        <span style={{ color: "#64748b" }}>{log.length}</span>
        <button
          type="button"
          onClick={refresh}
          style={btnStyle}
          title="Refresh"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={clear}
          style={{ ...btnStyle, marginLeft: "auto" }}
          title="Clear the log"
        >
          Clear
        </button>
      </div>

      <div style={{ overflowY: "auto", padding: "6px 0" }}>
        {rows.length === 0 && (
          <div style={{ padding: "10px 12px", color: "#64748b" }}>
            No events yet. Browse the funnel and they will appear here.
          </div>
        )}
        {rows.map((e, i) => (
          <div
            key={i}
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ color: "#64748b" }}>{fmtTime(e.t)}</span>
              <span
                style={{
                  color: TYPE_COLOR[e.type] || "#e2e8f0",
                  fontWeight: 700,
                }}
              >
                {e.name}
              </span>
            </div>
            {fmtParams(e.params) && (
              <div style={{ color: "#94a3b8", wordBreak: "break-all" }}>
                {fmtParams(e.params)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit",
};
