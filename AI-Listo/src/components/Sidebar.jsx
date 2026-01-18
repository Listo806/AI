import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="crm-sidebar-overlay" onClick={onClose} />}
      <aside className={`crm-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="crm-logo">AI CRM</div>
        <nav className="crm-nav">
          {/* Main Navigation */}
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
            end
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/dashboard/leads" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Leads
          </NavLink>
          <NavLink 
            to="/dashboard/pipeline" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Pipeline
          </NavLink>
          <NavLink 
            to="/dashboard/properties" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Properties
          </NavLink>
          <NavLink 
            to="/dashboard/contacts" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Contacts
          </NavLink>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

          {/* AI Section */}
          <NavLink 
            to="/dashboard/ai-assistant" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            AI Assistant
          </NavLink>
          <NavLink 
            to="/dashboard/ai-automations" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            AI Automations
          </NavLink>
          <NavLink 
            to="/dashboard/analytics" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Analytics
          </NavLink>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

          {/* Management Section */}
          <NavLink 
            to="/dashboard/team" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Team
          </NavLink>
          <NavLink 
            to="/dashboard/integrations" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Integrations
          </NavLink>
          <NavLink 
            to="/dashboard/billing" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Billing
          </NavLink>
          <NavLink 
            to="/dashboard/settings" 
            className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
            onClick={onClose}
          >
            Settings
          </NavLink>
        </nav>
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
