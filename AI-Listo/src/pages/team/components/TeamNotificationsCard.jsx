import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  CreditCard,
  Sparkles,
  Clock3,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";

const notificationConfig = {
  team_created: {
    icon: CheckCircle2,
    className: "success",
  },

  team_updated: {
    icon: Sparkles,
    className: "info",
  },

  member_added: {
    icon: UserPlus,
    className: "success",
  },

  member_removed: {
    icon: UserMinus,
    className: "danger",
  },

  member_deactivated: {
    icon: AlertTriangle,
    className: "warning",
  },

  billing: {
    icon: CreditCard,
    className: "billing",
  },

  default: {
    icon: Bell,
    className: "info",
  },
};

export default function TeamNotificationsCard({ notifications = [] }) {
  return (
    <div className="team-card team-notifications-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Team Notifications</h3>

          <p className="team-card-subtitle">Latest workspace updates</p>
        </div>

        <button className="team-link-btn">View All</button>
      </div>

      <div className="team-notifications-list">
        {notifications.length === 0 ? (
          <div className="team-empty-state">No notifications yet</div>
        ) : (
          notifications.map((item) => {
            const config =
              notificationConfig[item.type] || notificationConfig.default;

            const Icon = config.icon;

            return (
              <div key={item.id} className="team-notification-item">
                <div className={`team-notification-icon ${config.className}`}>
                  <Icon size={18} />
                </div>

                <div className="team-notification-content">
                  <div className="team-notification-title">{item.title}</div>

                  <div className="team-notification-time">{item.message}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
