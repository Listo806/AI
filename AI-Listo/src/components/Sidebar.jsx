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
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
          onClick={onClose}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/properties" 
          className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
          onClick={onClose}
        >
          Properties
        </NavLink>
        {/* Mobile Buy/Rent Links */}
        <div className="crm-nav-buy-rent">
          <NavLink 
            to="/properties?type=sale" 
            className="crm-nav-link crm-nav-link-buy"
            onClick={onClose}
          >
            Buy
          </NavLink>
          <NavLink 
            to="/properties?type=rent" 
            className="crm-nav-link crm-nav-link-rent"
            onClick={onClose}
          >
            Rent
          </NavLink>
        </div>
        <NavLink 
          to="/leads" 
          className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
          onClick={onClose}
        >
          Leads
        </NavLink>
        <NavLink 
          to="/pipeline" 
          className={({ isActive }) => isActive ? 'crm-nav-link active' : 'crm-nav-link'}
          onClick={onClose}
        >
          Pipeline
        </NavLink>
        <NavLink 
          to="/settings" 
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