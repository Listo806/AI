import { Trophy, Clock3, Target, TrendingUp, Sparkles } from "lucide-react";

const ICONS = {
  "Top Performer": Trophy,
  "Fastest Response": Clock3,
  "Most Leads Closed": Target,
  "Highest Pipeline": TrendingUp,
  "Highest AI Score": Sparkles,
};
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function TeamPerformanceCard({ leaderboard = [] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="team-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">
            {t("team.performanceCard.title", "Team Performance")}
          </h3>

          <p className="team-card-description">
            {t("team.performanceCard.description", "Top metrics from your team")}
          </p>
        </div>

        <button className="team-link-btn" onClick={() => navigate("/dashboard/team/performance")}>
          {t("team.performanceCard.viewFullReport", "View Full Report")}
        </button>
      </div>

      <div className="team-performance-list">
        {!leaderboard?.length && (
          <div className="team-empty-state">
            {t("team.performanceCard.emptyState", "No performance data yet")}
          </div>
        )}

        {leaderboard?.map((item, index) => {
          const Icon = ICONS[item.label] || Trophy;

          return (
            <div
              key={item.id || item._id || `${item.label}-${index}`}
              className="team-performance-item"
            >
              {/* LEFT */}

              <div className="team-performance-left">
                <div className="team-performance-icon">
                  <Icon size={18} />
                </div>
                <div className="team-performance-label">{item.label}</div>

                <div className="team-performance-name">{item.name}</div>
              </div>

              {/* RIGHT */}

              <div className="team-performance-value">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
