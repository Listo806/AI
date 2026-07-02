import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Consistent "no data yet" state that keeps the approved container visible. */
export function EmptyState({ label = "No data available" }) {
  return (
    <div
      style={{
        padding: "18px 8px",
        textAlign: "center",
        color: "#94a3b8",
        fontSize: 12,
      }}
    >
      {label}
    </div>
  );
}

/**
 * Dropdown that reuses the approved .control-btn look.
 * options: [{ value, label }]; value null = "All".
 */
export function FilterDropdown({ icon, label, value, options, onChange, allLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const current =
    value == null
      ? allLabel || label
      : (options.find((o) => o.value === value) || {}).label || String(value);
  const items = allLabel ? [{ value: null, label: allLabel }, ...options] : options;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="control-btn" onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer" }}>
        {icon}
        <span>{current}</span>
        <ChevronDown size={14} />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,.12)",
            minWidth: 170,
            maxHeight: 260,
            overflowY: "auto",
            padding: 4,
          }}
        >
          {items.map((o, i) => (
            <div
              key={i}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                padding: "7px 10px",
                borderRadius: 6,
                fontSize: 12.5,
                cursor: "pointer",
                background:
                  (o.value == null && value == null) || o.value === value ? "#eff6ff" : "transparent",
                color: "#0f172a",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  (o.value == null && value == null) || o.value === value ? "#eff6ff" : "transparent")
              }
            >
              {o.label}
            </div>
          ))}
          {items.length === 0 && <EmptyState />}
        </div>
      )}
    </div>
  );
}

/** Small initials avatar replacing third-party placeholder images. */
export function InitialsAvatar({ name, size = 26 }) {
  const initials = String(name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#e0e7ff",
        color: "#3730a3",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

/** CSV download helper shared by both pages. */
export function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], {
    type: "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const fmtMoney = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (Math.abs(v) >= 1000)
    return `$${(v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  return `$${v.toLocaleString("en-US")}`;
};

export const fmtHours = (h) => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
};

export const SOURCE_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#64748b",
];
