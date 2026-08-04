import { X, AlertTriangle, Sparkles, Brain, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function TeamAIInsightsModal({
  open,
  onClose,
  loading,
  error,
  insights,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="team-ai-modal-overlay">
      <div className="team-ai-modal">
        {/* HEADER */}

        <div className="team-ai-header">
          <div>
            <h2>{t("team.aiInsightsModal.title", "AI Team Insights")}</h2>

            <p>
              {t(
                "team.aiInsightsModal.subtitle",
                "CORTEXA AI analyzed your team activity, lead ownership, pipeline activity, and performance signals."
              )}
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
            {t("team.aiInsightsModal.loading", "Loading AI insights...")}
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
                <h3>{t("team.aiInsightsModal.healthScore", "Team Health Score")}</h3>

                <p>
                  {t(
                    "team.aiInsightsModal.healthScoreDescription",
                    "AI-generated performance & collaboration rating"
                  )}
                </p>
              </div>
            </div>

            {/* SUMMARY */}

            <div className="team-ai-section">
              <div className="team-ai-section-title">
                <Brain size={16} />
                {t("team.aiInsightsModal.summary", "Summary")}
              </div>

              <p>{insights.summary}</p>
            </div>

            {/* RISKS */}

            <div className="team-ai-section">
              <div className="team-ai-section-title">
                <ShieldAlert size={16} />
                {t("team.aiInsightsModal.risks", "Risks")}
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
                {t("team.aiInsightsModal.recommendations", "Recommendations")}
              </div>

              <ul>
                {(insights.recommendations || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            {/* ACTIONS */}

            <div className="team-ai-actions">
              <button
                type="button"
                className="team-ai-action-btn"
                onClick={() => {
                  navigate("/dashboard/team/members");
                }}
              >
                {t("team.aiInsightsModal.openTeamMembers", "Open Team Members")}
              </button>

              <button
                type="button"
                className="team-ai-action-btn"
              >
                {t("team.aiInsightsModal.notificationsComingSoon", "Notifications page coming soon.")}
              </button>

              <button
                type="button"
                className="team-ai-action-btn"
                onClick={onClose}
              >
                {t("team.aiInsightsModal.openTeamDashboard", "Open Team Dashboard")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
