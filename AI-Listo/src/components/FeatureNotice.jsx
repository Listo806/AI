import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Honest banner for controls whose feature has no backend yet.
 * Keeps the approved layout intact: the button stays visible and clickable,
 * but says so instead of pretending to work.
 */
export function useFeatureNotice() {
  const [notice, setNotice] = useState(null);
  const notAvailable = (feature) =>
    setNotice(
      `${feature} isn't connected to a backend engine yet, so it can't run. It stays in the layout per the approved design.`
    );
  return { notice, setNotice, notAvailable };
}

export function FeatureNoticeBanner({ notice, onDismiss }) {
  if (!notice) return null;
  return (
    <div
      style={{
        margin: "8px 0",
        padding: "8px 12px",
        borderRadius: "8px",
        background: "#fef9c3",
        color: "#854d0e",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span>
        <AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> {notice}
      </span>
      <button
        style={{
          height: "26px",
          padding: "0 10px",
          border: "1px solid #d6d3d1",
          borderRadius: "6px",
          background: "#fff",
          cursor: "pointer",
        }}
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
