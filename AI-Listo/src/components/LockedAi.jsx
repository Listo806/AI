import { usePlan } from "../context/PlanContext";
import { openFeatureAddOns, FEATURE_TO_ADDON } from "./FeatureAddOns";

// For Free accounts, keeps a premium AI element VISIBLE (the client wants the
// capability discoverable) but clearly LOCKED: it dims the content, stamps an
// ADD-ON badge, and opens the Feature Add-Ons modal on click instead of running
// or revealing the AI action. Paid/legacy accounts get the child untouched.
export default function LockedAi({ feature, children, label = "ADD-ON" }) {
  const { isFree } = usePlan();
  if (!isFree) return children;

  const open = () => openFeatureAddOns(FEATURE_TO_ADDON[feature] || null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
      title="Upgrade to unlock"
      style={{ position: "relative", cursor: "pointer", borderRadius: 12 }}
    >
      <div style={{ opacity: 0.55, filter: "grayscale(0.4)", pointerEvents: "none" }}>
        {children}
      </div>
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 999,
          background: "#111827",
          color: "#fff",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        🔒 {label}
      </span>
    </div>
  );
}
