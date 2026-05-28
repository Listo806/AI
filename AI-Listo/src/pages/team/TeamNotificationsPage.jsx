import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  CreditCard,
  Sparkles,
  UserPlus,
  UserMinus,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

import "./notifications.css";

const notifications = [
  {
    id: 1,
    type: "team_created",
    title: "New workspace created successfully",
    description: "Marketing Growth Team was initialized",
    time: "2 min ago",
  },

  {
    id: 2,
    type: "member_added",
    title: "New member joined the workspace",
    description: "Emma Davis was invited to Sales Team",
    time: "12 min ago",
  },

  {
    id: 3,
    type: "billing",
    title: "Monthly subscription processed",
    description: "Pro Team plan renewed successfully",
    time: "1 hour ago",
  },

  {
    id: 4,
    type: "member_removed",
    title: "Member removed from workspace",
    description: "Access permissions were revoked",
    time: "3 hours ago",
  },

  {
    id: 5,
    type: "security",
    title: "Security verification required",
    description: "New login detected from another device",
    time: "5 hours ago",
  },
];

const notificationConfig = {
  team_created: {
    icon: CheckCircle2,
    className: "success",
  },

  member_added: {
    icon: UserPlus,
    className: "success",
  },

  member_removed: {
    icon: UserMinus,
    className: "danger",
  },

  billing: {
    icon: CreditCard,
    className: "billing",
  },

  security: {
    icon: ShieldAlert,
    className: "warning",
  },

  default: {
    icon: Bell,
    className: "info",
  },
};

export default function TeamNotificationsPage() {
  return (
    <div className="team-notifications-page">
      {/* HEADER */}
      <div className="team-performance-header heading_page">
        <Bell />
        <h1 className="team-page-title">Team Notifications</h1>
      </div>
      
      {/* STATS */}

      <div className="team-notifications-stats">
        <div className="team-notifications-stat-card">
          <span>Total Notifications</span>
          <h2>1,248</h2>
          <p>+18% this week</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Unread Alerts</span>
          <h2>18</h2>
          <p>Requires attention</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Billing Events</span>
          <h2>42</h2>
          <p>All payments successful</p>
        </div>

        <div className="team-notifications-stat-card">
          <span>Security Events</span>
          <h2>3</h2>
          <p>No suspicious activity</p>
        </div>
      </div>

      {/* TABLE */}

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Workspace Notifications</h3>

            <p className="team-card-description">
              Latest alerts and updates from your team
            </p>
          </div>
        </div>

        <div className="team-notifications-table">
          <div className="team-notifications-table-head">
            <div>Notification</div>
            <div>Category</div>
            <div>Time</div>
          </div>

          <div className="team-notifications-table-body">
            {notifications.map((item) => {
              const config =
                notificationConfig[item.type] || notificationConfig.default;

              const Icon = config.icon;

              return (
                <div key={item.id} className="team-notifications-row">
                  {/* LEFT */}

                  <div className="team-notifications-main">
                    <div
                      className={`team-notifications-icon ${config.className}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div>
                      <div className="team-notifications-title">
                        {item.title}
                      </div>

                      <div className="team-notifications-description">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* CATEGORY */}

                  <div
                    className={`team-notifications-badge ${config.className}`}
                  >
                    {item.type.replaceAll("_", " ")}
                  </div>

                  {/* TIME */}

                  <div className="team-notifications-time">
                    <span>{item.time}</span>

                    <div className="team-notifications-arrow">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
