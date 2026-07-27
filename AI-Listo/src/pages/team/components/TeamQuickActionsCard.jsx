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
    route: "/manage-permissions",
  },
  {
    icon: Settings,
    label: "Manage Teams",
    route: "/team-settings",
  },
  {
    icon: Sparkles,
    label: "View Pending Invites",
    route: "/dashboard/team/ai-insights",
  },
  {
    icon: BarChart3,
    label: "Activity Log",
    route: "/dashboard/team/activity?type=team",
  },
];

export default function TeamQuickActionsCard() {
  const navigate = useNavigate();
  return (
    <div className="team-card team-quick-actions-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Quick Actions</h3>

          <p className="team-card-subtitle">Operational control center</p>
        </div>
      </div>

      <div className="team-quick-actions-list">
        {actions.map((item, index) => {
          const Icon = item.icon;

          return (
            <button key={index} className="team-quick-action-item" onClick={() => navigate(item.route)}>
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
