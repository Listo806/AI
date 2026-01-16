import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/crm-dashboard.css";

export default function DashboardLayout({ title, children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPropertiesPage = location.pathname === '/properties';
  const currentType = searchParams.get('type') || '';

  // Show Buy/Rent only on Properties page (CRM)
  const shouldShowBuyRent = isPropertiesPage;

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
            <h1>{title}</h1>
          </div>
          {shouldShowBuyRent && (
            <div className="crm-header-links">
              {isPropertiesPage && (
                <a 
                  href="/properties" 
                  className={`crm-header-link ${!currentType ? 'active' : ''}`}
                >
                  All
                </a>
              )}
              <a 
                href="/properties?type=sale" 
                className={`crm-header-link ${currentType === 'sale' ? 'active' : ''}`}
              >
                Buy
              </a>
              <a 
                href="/properties?type=rent" 
                className={`crm-header-link ${currentType === 'rent' ? 'active' : ''}`}
              >
                Rent
              </a>
            </div>
          )}
        </header>
        <main className="crm-content">{children}</main>
      </div>
    </div>
  );
}