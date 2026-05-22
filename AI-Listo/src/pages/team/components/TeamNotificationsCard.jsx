import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  CreditCard,
  Sparkles,
  Clock3,
} from "lucide-react";

const notifications = [
  {
    icon: AlertTriangle,
    color: "warning",
    title: "Seat limit approaching",
    time: "2 seats remaining",
  },
  {
    icon: CheckCircle2,
    color: "success",
    title: "New member invitation accepted",
    time: "5 minutes ago",
  },
  // {
    // icon: Bell,
    // color: "info",
    // title: "Leads requiring follow-up",
    // time: "12 pending leads",
  // },
  {
    icon: CreditCard,
    color: "purple",
    title: "Billing payment successful",
    time: "Today at 09:24 AM",
  },
  {
    icon: Sparkles,
    color: "info",
    title: "AI review completed",
    time: "Performance insights updated",
  },
  {
    icon: Clock3,
    color: "danger",
    title: "Team inactivity warning",
    time: "3 members inactive",
  },
];

export default function TeamNotificationsCard() {
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
        {notifications.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={index} className="team-notification-item">
              <div className={`team-notification-icon ${item.color}`}>
                <Icon size={18} />
              </div>

              <div className="team-notification-content">
                <div className="team-notification-title">{item.title}</div>

                <div className="team-notification-time">{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
