import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/crm-dashboard.css";

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="crm-root">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="crm-main">
        <header className="crm-header">
          <div className="crm-header-left">
            <button 
              className="crm-mobile-menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </header>
        <main className="crm-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
