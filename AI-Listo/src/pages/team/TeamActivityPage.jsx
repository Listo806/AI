import {
  Activity,
  MessageSquare,
  Phone,
  UserPlus,
  CheckCircle2,
  Bot,
  ArrowUpRight,
} from "lucide-react";

import "./activity.css";

export default function TeamActivityPage() {
  const activities = [
    {
      user: "Sarah Johnson",
      action: "Closed a new enterprise deal",
      time: "2 min ago",
      type: "deal",
      icon: CheckCircle2,
    },
    {
      user: "Michael Chen",
      action: "Responded to 14 leads",
      time: "12 min ago",
      type: "message",
      icon: MessageSquare,
    },
    {
      user: "Emma Davis",
      action: "Scheduled a follow-up call",
      time: "28 min ago",
      type: "call",
      icon: Phone,
    },
    {
      user: "Daniel Lee",
      action: "Invited a new team member",
      time: "1 hour ago",
      type: "member",
      icon: UserPlus,
    },
    {
      user: "AI Assistant",
      action: "Generated weekly analytics summary",
      time: "2 hours ago",
      type: "ai",
      icon: Bot,
    },
  ];

  return (
    <div className="team-activity-page">
      {/* HEADER */}
      <div className="team-performance-header heading_page">
        <Activity />
        <h1 className="team-page-title">Team Activity</h1>
      </div>
      
      {/* STATS */}

      <div className="team-activity-stats">
        <div className="team-activity-stat-card">
          <span>Total Activities</span>
          <h2>1,284</h2>
          <p>+14% this week</p>
        </div>

        <div className="team-activity-stat-card">
          <span>Messages Sent</span>
          <h2>824</h2>
          <p>Realtime tracking enabled</p>
        </div>

        <div className="team-activity-stat-card">
          <span>Calls Scheduled</span>
          <h2>98</h2>
          <p>+22% conversion rate</p>
        </div>

        <div className="team-activity-stat-card">
          <span>AI Actions</span>
          <h2>312</h2>
          <p>Automation running smoothly</p>
        </div>
      </div>

      {/* ACTIVITY FEED */}

      <div className="team-card">
        <div className="team-card-header">
          <div>
            <h3 className="team-card-title">Recent Team Activities</h3>

            <p className="team-card-description">
              Latest updates from your organization
            </p>
          </div>
        </div>

        <div className="team-activity-table">
          <div className="team-activity-table-head">
            <div>User</div>
            <div>Activity</div>
            <div>Time</div>
          </div>

          <div className="team-activity-table-body">
            {activities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div key={index} className="team-activity-row">
                  {/* USER */}

                  <div className="team-activity-user">
                    <div className="team-activity-avatar">
                      <Icon size={18} />
                    </div>

                    <div>
                      <div className="team-activity-user-name">
                        {activity.user}
                      </div>

                      <div className="team-activity-user-role">Team Member</div>
                    </div>
                  </div>

                  {/* ACTIVITY */}

                  <div className="team-activity-action">{activity.action}</div>

                  {/* TIME */}

                  <div className="team-activity-time">
                    <span>{activity.time}</span>

                    <div className="team-activity-arrow">
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
