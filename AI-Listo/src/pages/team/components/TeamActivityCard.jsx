import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function TeamActivityCard({ activity }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="team-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">{t("team.activityCard.title", "Recent Activity")}</h3>
          <p className="team-card-description">{t("team.activityCard.description", "Latest team updates")}</p>
        </div>
        <button
          type="button"
          className="team-link-btn "
          onClick={() => {
            navigate("/dashboard/team/activity?type=team");
          }}
        >
          {t("team.activityCard.viewAll", "View All")}
        </button>
      </div>
      <div className="team-activity-list">
        {activity?.length ? (
          activity.map((item) => (
            <div
              key={item.id || item._id || item.email}
              className="team-activity-item"
            >
              <div className="team-activity-avatar-wrap">
                <img
                  src={item.avatar || "https://i.pravatar.cc/100"}
                  alt=""
                  className="team-activity-avatar"
                />
                <span className="team-activity-dot" />
              </div>
              <div className="team-activity-content">
                <div className="team-activity-message">{item.message}</div>
                <div className="team-activity-time">{item.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="team-empty-state">{t("team.activityCard.emptyState", "No recent activity")}</div>
        )}
      </div>
    </div>
  );
}
