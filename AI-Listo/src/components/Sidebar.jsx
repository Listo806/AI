import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Initialize Lucide icons when component mounts or updates
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Navigation items with Lucide icon names and translation keys
  const navItems = [
    { path: "/dashboard", icon: "home", labelKey: "nav.dashboard" },
    { path: "/dashboard/leads", icon: "users", labelKey: "nav.leads" },
    { path: "/dashboard/whatsapp", icon: "message-circle", labelKey: "nav.whatsapp" },
    { path: "/dashboard/instagram", icon: "camera", labelKey: "nav.instagram" },
    { path: "/dashboard/pipeline", icon: "git-branch", labelKey: "nav.pipeline" },
    { path: "/dashboard/properties", icon: "building", labelKey: "nav.properties" },
    { path: "/dashboard/contacts", icon: "contact", labelKey: "nav.contacts" },
    { path: "/dashboard/ai-assistant", icon: "bot", labelKey: "nav.aiAssistant" },
    { path: "/dashboard/ai-automations", icon: "zap", labelKey: "nav.aiAutomations" },
    { path: "/dashboard/analytics", icon: "bar-chart-3", labelKey: "nav.analytics" },
    { path: "/dashboard/team", icon: "users-2", labelKey: "nav.team" },
    { path: "/dashboard/integrations", icon: "plug", labelKey: "nav.integrations" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside className={`crm-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Logo and Site Name */}
        <div className="crm-sidebar-header">
          {/* Desktop Toggle Button - Inside Sidebar (left of logo when expanded) */}
          {/* <button
            className="crm-sidebar-toggle-inside"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            ☰
          </button> */}
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
              <i data-lucide={item.icon} className="crm-nav-icon"></i>
              {!isCollapsed && <span className="crm-nav-label">{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer - Account Info */}
        {/* <div className="crm-sidebar-footer">
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
        </div> */}
      </aside>
    </>
  );
}
