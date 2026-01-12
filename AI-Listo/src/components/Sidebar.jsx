import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="crm-sidebar">
      <div className="crm-logo">AI CRM</div>
      <nav className="crm-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/properties" className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>
          Properties
        </NavLink>
        <NavLink to="/leads" className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>
          Leads
        </NavLink>
        <NavLink to="/pipeline" className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>
          Pipeline
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}>
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
  );
}