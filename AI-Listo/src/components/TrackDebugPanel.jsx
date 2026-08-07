import { useEffect, useState, useCallback } from "react";

// On-page tracking QA overlay. Enable by adding ?trackdebug=1 to any URL (the
// flag then persists across the whole funnel journey via localStorage); disable
// with ?trackdebug=0. It lists every funnel event and conversion as it fires,
// with the exact data sent (value, currency, transaction id, offer, plan), so a
// full test can be verified and screenshotted from one place, without setting up
// Tag Assistant or GA4 DebugView. It never sends anything itself; it only reads
// the log written by src/utils/track.js.
const LOG_KEY = "cortexa_track_log";
const FLAG_KEY = "cortexa_trackdebug";

function resolveEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.has("trackdebug")) {
      const v = p.get("trackdebug");
      if (v === "0" || v === "off" || v === "false") {
        localStorage.removeItem(FLAG_KEY);
        return false;
      }
      localStorage.setItem(FLAG_KEY, "1");
      return true;
    }
    return localStorage.getItem(FLAG_KEY) === "1";
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
