import { X, AlertTriangle, Sparkles, Brain, ShieldAlert } from "lucide-react";

export default function TeamAIInsightsModal({
  open,
  onClose,
  loading,
  error,
  insights,
}) {
  if (!open) return null;

  return (
    <div className="team-ai-modal-overlay">
      <div className="team-ai-modal">
        {/* HEADER */}

        <div className="team-ai-header">
          <div>
            <h2>AI Team Insights</h2>

            <p>
              CORTEXA AI analyzed your team activity, lead ownership, pipeline
              activity, and performance signals.
            </p>
          </div>

          <button onClick={onClose} className="team-ai-close">
            <X size={18} />
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="team-ai-loading">
            <Sparkles size={18} />
            Loading AI insights...
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="team-ai-error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* CONTENT */}

        {!loading && insights && (
          <div className="team-ai-content">
            {/* SCORE */}

            <div className="team-ai-score-card">
              <div className="team-ai-score">
                {insights.teamHealthScore || 0}
              </div>

              <div>
                <h3>Team Health Score</h3>

                <p>AI-generated performance & collaboration rating</p>
              </div>
            </div>

            {/* SUMMARY */}

            <div className="team-ai-section">
              <div className="team-ai-section-title">
                <Brain size={16} />
                Summary
              </div>

              <p>{insights.summary}</p>
            </div>

            {/* RISKS */}

            <div className="team-ai-section">
              <div className="team-ai-section-title">
                <ShieldAlert size={16} />
                Risks
              </div>

              <ul>
                {(insights.risks || []).map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>

            {/* RECOMMENDATIONS */}

            <div className="team-ai-section">
              <div className="team-ai-section-title">
                <Sparkles size={16} />
                Recommendations
              </div>

              <ul>
                {(insights.recommendations || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* ACTIONS */}

            <div className="team-ai-actions">
              {(insights.nextActions || []).map((action, index) => (
                <button
                  key={index}
                  className="team-ai-action-btn"
                  onClick={() => {
                    window.location.href = action.route;
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
