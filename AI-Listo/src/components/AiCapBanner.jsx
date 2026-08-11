import { usePlan } from "../context/PlanContext";
import { openFeatureAddOns } from "./FeatureAddOns";

// Free-plan notice shown when this month's AI conversation allowance is used up.
// The point (per the client) is that the AI going quiet must read as "limit
// reached", NOT "the AI broke": new leads are still captured and the user can
// reply manually. Renders nothing for paid accounts, while loading, or below the
// cap — so it is safe to drop at the top of any page.
export default function AiCapBanner() {
  const { isFree, usage, limits } = usePlan();
  if (!isFree || !usage) return null;

  const limit = limits?.aiConversationsPerMonth ?? 50;
  const used = usage?.aiConversationsThisMonth ?? 0;
  if (limit == null || used < limit) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        margin: "0 0 16px",
        padding: "14px 18px",
        border: "1px solid #fcd9a8",
        borderRadius: 12,
        background: "#fff7ed",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#9a3412" }}>
          You've used your {limit} AI conversations for this month.
        </div>
        <div style={{ fontSize: 13, color: "#9a3412cc", marginTop: 2 }}>
          Upgrade your plan to continue using AI conversations. New leads are still captured and you can reply manually.
        </div>
      </div>
      <button
        type="button"
        onClick={() => openFeatureAddOns()}
        style={{
          flexShrink: 0,
          padding: "9px 18px",
          borderRadius: 9,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Upgrade
      </button>
    </div>
  );
}
