import React from "react";
import { LayoutDashboard, Bot, Users, Menu, GitBranch } from "lucide-react";

export default function BottomNav({ onToggleSidebar, currentTab, setCurrentTab }) {
  return (
    <div className="cortexa-bottom-nav">

      <button 
        className={`nav-item ${currentTab === "/dashboard/home" ? "active" : ""}`}
        onClick={() => setCurrentTab("/dashboard/home")}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </button>

      <button 
        className={`nav-item ${currentTab?.startsWith("/dashboard/leads") ? "active" : ""}`}
        onClick={() => setCurrentTab("/dashboard/leads")}
      >
        <Users size={20} />
        <span>Leads</span>
      </button>

      <button 
        className={`nav-item ${currentTab?.startsWith("/dashboard/pipeline") ? "active" : ""}`}
        onClick={() => setCurrentTab("/dashboard/pipeline")}
      >
        <GitBranch size={20} />
        <span>Pipeline</span>
      </button>

      <button 
        className={`nav-item ${currentTab?.startsWith("/dashboard/ai") ? "active" : ""}`}
        onClick={() => setCurrentTab("/dashboard/ai-center")}
      >
        <Bot size={20} />
        <span>AI</span>
      </button>  

      <button className="nav-item" onClick={onToggleSidebar}>
        <Menu size={20} />
        <span>More</span>
      </button>
    </div>
  );
}