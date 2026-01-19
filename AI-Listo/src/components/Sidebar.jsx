import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Navigation items with emoji icons and labels
const navItems = [
  { path: "/dashboard", icon: "🏠", label: "Dashboard" },
  { path: "/dashboard/leads", icon: "👥", label: "Leads" },
  { path: "/dashboard/integrations", icon: "💬", label: "WhatsApp" },
  { path: "/dashboard/integrations", icon: "📸", label: "Instagram" },
  { path: "/dashboard/pipeline", icon: "📋", label: "Pipeline" },
  { path: "/dashboard/properties", icon: "🏡", label: "Properties" },
  { path: "/dashboard/contacts", icon: "👤", label: "Contacts" },
  { path: "/dashboard/ai-assistant", icon: "🤖", label: "AI Assistant" },
  { path: "/dashboard/ai-automations", icon: "⚙️", label: "AI Automations" },
  { path: "/dashboard/analytics", icon: "📊", label: "Analytics" },
  { path: "/dashboard/team", icon: "👥", label: "Team" },
  { path: "/dashboard/integrations", icon: "🔌", label: "Integrations" },
  { path: "/dashboard/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside className={`crm-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo and Site Name */}
        <div className="crm-sidebar-header">
          <img 
            src="https://cdn.prod.website-files.com/69167a6a46fd073f4a958199/6921521d6cd18daedff74085_fb6918ba4a8709dd126682d90c8e31f1_ai_house_logo.avif"
            alt="Listo Qasa Logo"
            className="crm-sidebar-logo"
          />
          <span className="crm-sidebar-brand">Listo Qasa</span>
        </div>

        <nav className="crm-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={`${item.path}-${index}`}
              to={item.path}
              className={({ isActive }) => 
                `crm-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
              end={item.path === "/dashboard"}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              <span className="crm-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer - Account Info & Logout */}
        <div className="crm-sidebar-footer">
          <div className="crm-user-info">
            <div className="crm-user-avatar">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <div className="crm-user-details">
              <div className="crm-user-name">{user?.email || 'User'}</div>
              <div className="crm-user-role">{user?.role || 'user'}</div>
            </div>
          </div>
          <button className="crm-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
