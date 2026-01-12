import Sidebar from "../components/Sidebar";
import "../styles/crm-dashboard.css";

export default function DashboardLayout({ title, children }) {
  return (
    <div className="crm-root">
      <Sidebar />
      <div className="crm-main">
        <header className="crm-header"><h1>{title}</h1></header>
        <main className="crm-content">{children}</main>
      </div>
    </div>
  );
}