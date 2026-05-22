import {
  Users,
  Shuffle,
  ShieldCheck,
  Settings,
  Sparkles,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const actions = [
  {
    icon: Users,
    label: "Assign Leads",
  },
  {
    icon: Shuffle,
    label: "Reassign Ownership",
  },
  {
    icon: ShieldCheck,
    label: "Manage Permissions",
  },
  {
    icon: Settings,
    label: "Team Settings",
  },
  {
    icon: Sparkles,
    label: "AI Team Review",
  },
  {
    icon: BarChart3,
    label: "View Analytics",
  },
];

export default function TeamQuickActionsCard() {
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
            <button key={index} className="team-quick-action-item">
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
