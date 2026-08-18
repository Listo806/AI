import { ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getStatus(remainingPercent) {
  if (remainingPercent <= 10) {
    return {
      key: "critical",
      text: remainingPercent <= 0 ? "AI Units depleted" : "Almost out of AI Units",
    };
  }

  if (remainingPercent <= 25) {
    return { key: "low", text: "Running low on AI Units" };
  }

  if (remainingPercent <= 50) {
    return { key: "watch", text: "AI Units are getting lower" };
  }

  return { key: "healthy", text: "Plenty of AI Units remaining" };
}

export default function AiUsageMeter() {
  const { isFree, usage, limits } = usePlan();
  const navigate = useNavigate();

  // Free-plan component only. Paid / Unlimited customers never see it.
  if (!isFree || !usage) return null;

  const aiLimit = Number(limits?.aiConversationsPerMonth ?? 50);
  const aiUsed = Math.max(0, Number(usage?.aiConversationsThisMonth ?? 0));
  const safeLimit = Number.isFinite(aiLimit) && aiLimit > 0 ? aiLimit : 50;

  const remaining = Math.max(0, safeLimit - aiUsed);
  const usedPercent = clamp(Math.round((aiUsed / safeLimit) * 100), 0, 100);
  const remainingPercent = clamp(100 - usedPercent, 0, 100);
  const status = getStatus(remainingPercent);

  const goToUpgrade = () => {
    // Reuse the existing pricing / paid-plan upgrade flow.
    navigate("/pricing");
  };

  return (
    <section
      className={`cx-free-ai-units cx-free-ai-units--${status.key}`}
      aria-label="Free plan AI Units Remaining"
    >
      <div className="cx-free-ai-units__top">
        <div className="cx-free-ai-units__balance">
          <div className="cx-free-ai-units__eyebrow">AI UNITS REMAINING</div>

          <div className="cx-free-ai-units__numbers">
            <strong>{remaining}</strong>
            <span>/ {safeLimit}</span>
          </div>

          <div className="cx-free-ai-units__usage-copy">
            {usedPercent}% used this month
          </div>

          <div className="cx-free-ai-units__status">{status.text}</div>
        </div>

        <div className="cx-free-ai-units__upgrade-wrap">
          <button
            type="button"
            className="cx-free-ai-units__upgrade-btn"
            onClick={goToUpgrade}
          >
            <ArrowUp size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>Upgrade your plan</span>
          </button>
          <p>Get more AI Units and power your business.</p>
        </div>
      </div>

      <div className="cx-free-ai-units__meter-wrap">
        <div
          className="cx-free-ai-units__meter"
          role="progressbar"
          aria-label="AI Units used this month"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={usedPercent}
        >
          <div
            className="cx-free-ai-units__marker"
            style={{ left: `${usedPercent}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="cx-free-ai-units__scale" aria-hidden="true">
          <span>0</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>{safeLimit}</span>
        </div>
      </div>
    </section>
  );
}
