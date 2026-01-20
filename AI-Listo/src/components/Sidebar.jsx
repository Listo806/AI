import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onClose, isCollapsed = false }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Navigation items with emoji icons and translation keys
  const navItems = [
    { path: "/dashboard", icon: "🏠", labelKey: "nav.dashboard" },
    { path: "/dashboard/leads", icon: "👥", labelKey: "nav.leads" },
    { path: "/dashboard/whatsapp", icon: "💬", labelKey: "nav.whatsapp" },
    { path: "/dashboard/instagram", icon: "📸", labelKey: "nav.instagram" },
    { path: "/dashboard/pipeline", icon: "📋", labelKey: "nav.pipeline" },
    { path: "/dashboard/properties", icon: "🏡", labelKey: "nav.properties" },
    { path: "/dashboard/contacts", icon: "👤", labelKey: "nav.contacts" },
    { path: "/dashboard/ai-assistant", icon: "🤖", labelKey: "nav.aiAssistant" },
    { path: "/dashboard/ai-automations", icon: "⚙️", labelKey: "nav.aiAutomations" },
    { path: "/dashboard/analytics", icon: "📊", labelKey: "nav.analytics" },
    { path: "/dashboard/team", icon: "👥", labelKey: "nav.team" },
    { path: "/dashboard/integrations", icon: "🔌", labelKey: "nav.integrations" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside className={`crm-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo and Site Name */}
        <div className="crm-sidebar-header">
          <img 
            src="https://cdn.prod.website-files.com/69167a6a46fd073f4a958199/6921521d6cd18daedff74085_fb6918ba4a8709dd126682d90c8e31f1_ai_house_logo.avif"
            alt="Listo Qasa Logo"
            className="crm-sidebar-logo"
          />
          {!isCollapsed && <span className="crm-sidebar-brand">Listo Qasa</span>}
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
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="crm-nav-label">{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer - Account Info */}
        <div className="crm-sidebar-footer">
          <div className="crm-user-info">
            <div className="crm-user-avatar">
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="crm-user-details">
                <div className="crm-user-name">{user?.email || 'User'}</div>
                <div className="crm-user-role">{user?.role || 'user'}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
