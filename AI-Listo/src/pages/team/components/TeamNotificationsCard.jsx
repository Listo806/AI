import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  CreditCard,
  Sparkles,
  Clock3,
} from "lucide-react";

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Bell,
  billing: CreditCard,
  ai: Sparkles,
  danger: Clock3,
};

export default function TeamNotificationsCard({
  notifications = [],
}) {
  return (
    <div className="team-card team-notifications-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">
            Team Notifications
          </h3>

          <p className="team-card-subtitle">
            Latest workspace updates
          </p>
        </div>

        <button className="team-link-btn">
          View All
        </button>
      </div>

      <div className="team-notifications-list">
        {notifications.length === 0 ? (
          <div className="team-empty-state">
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => {
            const Icon =
              iconMap[item.type] || Bell;

            return (
              <div
                key={item.id}
                className="team-notification-item"
              >
                <div
                  className={`team-notification-icon ${item.type}`}
                >
                  <Icon size={18} />
                </div>

                <div className="team-notification-content">
                  <div className="team-notification-title">
                    {item.title}
                  </div>

                  <div className="team-notification-time">
                    {item.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}