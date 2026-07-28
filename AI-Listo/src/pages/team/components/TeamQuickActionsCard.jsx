import {
  Users,
  Shuffle,
  ShieldCheck,
  Settings,
  Sparkles,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const actions = [
  {
    icon: ShieldCheck,
    label: "Manage Roles & Permissions",
    route: "#",
  },
  {
    icon: Settings,
    label: "Manage Teams",
    route: "/dashboard/team/manage",
  },
  {
    icon: Sparkles,
    label: "View Pending Invites",
    route: "/dashboard/team/invites",
  },
  {
    icon: BarChart3,
    label: "Activity Log",
    route: "/dashboard/team/activity?type=team",
  },
];

export default function TeamQuickActionsCard({ selectedTeamId }) {
  const navigate = useNavigate();

  const handleAction = (item) => {
    if (item.route === "/dashboard/team/invites") {
      navigate(
        `${item.route}?teamId=${encodeURIComponent(selectedTeamId || "")}`,
      );

      return;
    }

    navigate(item.route);
  };

  return (
    <div className="team-card team-quick-actions-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Quick Actions</h3>

          <p className="team-card-subtitle">Operational control center</p>
        </div>
      </div>

      <div className="team-quick-actions-list">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className="team-quick-action-item"
              onClick={() => handleAction(item)}
            >
              <div className="team-quick-action-left">
                <div className="team-quick-action-icon">
                  <Icon size={18} />
                </div>

                <span>{item.label}</span>
              </div>

              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
