import { useState } from "react";

import "./team.css";

import {
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Trash2,
  Shield,
  Activity,
  Brain,
} from "lucide-react";

import useTeamDashboard from "./hooks/useTeamDashboard";
import useTeamMembers from "./hooks/useTeamMembers";

export default function TeamMembersPage() {
  /* =====================================================
    DASHBOARD
  ===================================================== */

  const { selectedTeamId, reloadDashboard } = useTeamDashboard();

  /* =====================================================
    MEMBERS
  ===================================================== */

  const {
    members,
    loading,

    search,
    setSearch,

    filter,
    setFilter,

    removeMember,
  } = useTeamMembers({
    teamId: selectedTeamId,
    onReload: reloadDashboard,
  });

  /* =====================================================
    STATE
  ===================================================== */

  const [selectedMember, setSelectedMember] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  /* =====================================================
    REMOVE MEMBER
  ===================================================== */

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    await removeMember(selectedMember._id || selectedMember.id);

    setSelectedMember(null);
  };
  const handleExport = () => {
    const csvRows = members.map((m) => ({
      Name: m.name || "",
      Email: m.email || "",
      Role: m.role || "",
    }));

    console.log(csvRows);
  };
  /* =====================================================
    LOADING
  ===================================================== */

  if (loading) {
    return <div className="team-page-loading">Loading members...</div>;
  }

  /* =====================================================
    RENDER
  ===================================================== */

  return (
    <div className="team-members-page">
      {/* =================================================
        PAGE HEADER
      ================================================= */}

      <div className="team-members-header">
        <div>
          <h1 className="team-page-title">Team Members</h1>

          <p className="team-page-subtitle">
            Manage members, permissions and seats
          </p>
        </div>

        <div className="team-members-header-actions">
          <button
            type="button"
            className="team-secondary-btn"
            onClick={handleExport}
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            type="button"
            className="team-primary-btn"
            onClick={() => setShowInviteModal(true)}
          >
            <Plus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      {/* =================================================
        FILTERS
      ================================================= */}

      <div className="team-members-filters">
        <div className="team-search-box">
          <Search size={18} />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="team-filter-select"
        >
          <option value="all">All Members</option>

          <option value="active">Active</option>

          <option value="pending">Pending</option>

          <option value="managers">Managers</option>

          <option value="agents">Agents</option>

          <option value="high-performers">High Performers</option>
        </select>

        <button type="button" className="team-secondary-btn">
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* =================================================
        TABLE
      ================================================= */}

      <div className="team-card">
        <div className="team-table-wrapper">
          <table className="team-full-table">
            <thead>
              <tr>
                <th>Member</th>

                <th>Role</th>

                <th>Status</th>

                <th>Permissions</th>

                <th>Assigned Leads</th>

                <th>Performance</th>

                <th>Last Active</th>

                <th>Seat Usage</th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {members?.map((member) => (
                <tr
                  key={member._id || member.id}
                  onClick={() => setSelectedMember(member)}
                >
                  {/* MEMBER */}
                  <td>
                    <div className="team-table-user">
                      <img
                        src={member.avatar || "https://i.pravatar.cc/150"}
                        alt=""
                      />

                      <div>
                        <strong>{member.name}</strong>

                        <span>{member.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td>{member.role}</td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={`team-status-badge ${
                        member.isActive ? "active" : "inactive"
                      }`}
                    >
                      {member.isActive ? "Active" : "Pending"}
                    </span>
                  </td>

                  {/* PERMISSIONS */}
                  <td>CRM Access</td>

                  {/* LEADS */}
                  <td>{member.totalLeads || 0}</td>

                  {/* PERFORMANCE */}
                  <td>
                    <strong>{member.aiScore || 0}%</strong>
                  </td>

                  {/* LAST ACTIVE */}
                  <td>Recently</td>

                  {/* SEAT */}
                  <td>1 Seat</td>

                  {/* ACTIONS */}
                  <td>
                    <button
                      type="button"
                      className="team-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
        RIGHT DRAWER
      ================================================= */}

      {selectedMember && (
        <div
          className="team-member-drawer-overlay"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="team-member-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="team-member-drawer-header">
              <h3>Member Details</h3>

              <button
                type="button"
                className="team-icon-btn"
                onClick={() => setSelectedMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* PROFILE */}
            <div className="team-member-profile">
              <img
                src={selectedMember.avatar || "https://i.pravatar.cc/150"}
                alt=""
              />

              <h2>{selectedMember.name}</h2>

              <p>{selectedMember.email}</p>
            </div>

            {/* PERMISSIONS */}
            <div className="team-member-section">
              <h4>
                <Shield size={16} />
                Permissions
              </h4>

              <label>
                <input type="checkbox" defaultChecked />
                Manage Leads
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                Access Billing
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                AI Workspace
              </label>
            </div>

            {/* ACTIVITY */}
            <div className="team-member-section">
              <h4>
                <Activity size={16} />
                Activity Logs
              </h4>

              <div className="team-log-item">Updated CRM pipeline</div>

              <div className="team-log-item">Closed a lead</div>

              <div className="team-log-item">Exported report</div>
            </div>

            {/* AI */}
            <div className="team-member-section">
              <h4>
                <Brain size={16} />
                AI Usage
              </h4>

              <div className="team-ai-usage">
                AI Score: {selectedMember.aiScore}%
              </div>
            </div>

            {/* BILLING */}
            <div className="team-member-section">
              <h4>Billing Seat</h4>

              <div className="team-log-item">1 Active Seat Attached</div>
            </div>

            {/* REMOVE */}
            <button
              type="button"
              className="team-remove-btn"
              onClick={handleRemoveMember}
            >
              <Trash2 size={16} />
              Remove Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
