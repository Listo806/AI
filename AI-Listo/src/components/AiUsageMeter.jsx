import { useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";

// Compact Free-plan usage panel: shows this month's AI conversations against the
// plan limit (plus integrations and WhatsApp connections) with an upgrade CTA.
// Renders nothing for paid accounts, while loading, or if usage is unavailable —
// so it is always safe to drop onto any dashboard page.
function Bar({ label, used, limit }) {
  const unlimited = limit == null;
  const u = Number(used) || 0;
  const pct = unlimited ? 6 : Math.min(100, Math.round((u / Math.max(1, limit)) * 100));
  const color = unlimited ? "#2563eb" : pct >= 100 ? "#dc2626" : pct >= 80 ? "#ea580c" : "#2563eb";
  return (
    <div style={{ flex: "1 1 180px", minWidth: 160 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "#475569", fontWeight: 600 }}>{label}</span>
        <span style={{ color: "#64748b" }}>
          {u} / {unlimited ? "unlimited" : limit}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
    </div>
  );
}

export default function AiUsageMeter() {
  const { isFree, usage, limits } = usePlan();
  const navigate = useNavigate();

  if (!isFree || !usage) return null;

  const aiLimit = limits?.aiConversationsPerMonth ?? 50;
  const aiUsed = usage?.aiConversationsThisMonth ?? 0;
  const atLimit = aiLimit != null && aiUsed >= aiLimit;

  return (
    <div className="box-plan" 
      style={{
        margin: "0 0 20px",
        padding: "14px 18px",
        border: `1px solid ${atLimit ? "#fecaca" : "#e5e7eb"}`,
        borderRadius: 12,
        background: atLimit ? "#fef2f2" : "#f9fafb",
      }}
    >
      <div className="box-plan-head" 
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 14, color: "#374151" }}>
          <strong style={{ color: "#111827" }}>Free plan</strong>
          {atLimit
            ? "  •  You've reached this month's AI conversation limit. New leads are still captured, and you can reply manually."
            : "  •  Your Cortexa AI usage this month"}
        </div>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Upgrade Plan
        </button>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Bar label="AI conversations" used={aiUsed} limit={aiLimit} />
        <Bar label="Integrations" used={usage?.integrationsConnected ?? 0} limit={limits?.integrations ?? 1} />
        <Bar label="WhatsApp connections" used={usage?.whatsappConnections ?? 0} limit={limits?.whatsappConnections ?? 1} />
      </div>
    </div>
  );
}
