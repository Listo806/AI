import { useState, useEffect } from "react";

import {
  MoreVertical,
  Trash2,
  Shield,
  Plus,
  Eye,
  Send,
  UserPlus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { ROLE_STYLES } from "../utils/teamConstants";

export default function TeamMembersTable({
  members,
  onRemove,
  onInvite,
  onChangeRole,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 900 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleOpenRoleModal = (member) => {
    setOpenMenu(null);
    onChangeRole?.(member);
  };

  if (isMobile) {
    return (
      <div className="mobile-cards-container">
        {members?.map((user, index) => {
          const memberId = user.id || user._id || index;

          return (
            <div key={memberId} className="m-user-card">
              <div className="m-card-top">
                <div className="m-user-header">
                  <div className="m-avatar-wrap">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "Team member"}
                        className="m-avatar"
                      />
                    ) : (
                      <div className="m-avatar-placeholder">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <div className="m-user-info">
                    <div className="m-user-title-row">
                      <span className="m-user-name">
                        {user.name || user.email}
                      </span>

                      {user.role && (
                        <span className="m-tag m-tag-role">{user.role}</span>
                      )}

                      <span
                        className={`m-tag m-tag-status ${
                          user.isActive ? "active" : "inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="m-stats-grid">
                  <div className="m-stat-item">
                    <span className="m-stat-val">{user.totalLeads ?? 0}</span>
                    <span className="m-stat-lbl">Leads</span>
                  </div>

                  <div className="m-stat-item">
                    <span className="m-stat-val">
                      ${Number(user.pipelineValue || 0).toLocaleString()}
                    </span>
                    <span className="m-stat-lbl">Pipeline</span>
                  </div>

                  <div className="m-stat-item">
                    <span className="m-stat-val">{user.aiScore ?? 0}%</span>
                    <span className="m-stat-lbl">AI Score</span>
                  </div>
                </div>
              </div>

              <div className="m-card-actions">
                <button
                  type="button"
                  className="m-action-btn"
                  onClick={() => navigate("/dashboard/team/members")}
                >
                  <Eye size={18} />
                  <span>View</span>
                </button>

                <button
                  type="button"
                  className="m-action-btn"
                  onClick={() => handleOpenRoleModal(user)}
                >
                  <Shield size={16} />
                  <span>Change Role</span>
                </button>

                <button type="button" className="m-action-btn">
                  <Send size={16} />
                  <span>Message</span>
                </button>

                <button type="button" className="m-action-btn">
                  <UserPlus size={18} />
                  <span>Assign Leads</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="team-card">
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Team Members</h3>

          <p className="team-card-description">
            {members?.length || 0} members shown
          </p>
        </div>

        <button
          type="button"
          className="team-ai-review-btn"
          onClick={() => navigate("/dashboard/team/members")}
        >
          <span>View All</span>
        </button>
      </div>

      <div className="team-members-modern">
        {members?.map((member) => {
          const memberId = member._id || member.id;

          const roleStyle =
            ROLE_STYLES[member.role?.toLowerCase()] || ROLE_STYLES.agent;

          return (
            <div key={memberId} className="team-member-card">
              <div className="team-member-user">
                <img
                  src={member.avatar || "https://i.pravatar.cc/150"}
                  alt={member.name || "Team member"}
                  className="team-member-avatar"
                />

                <div className="team-member-user-content">
                  <div className="team-member-email">
                    {member.name || "Unnamed Member"}
                  </div>

                  <div className="team-member-subtext">{member.email}</div>
                </div>
              </div>

              <div className="team-member-name">
                <span
                  className="team-role-badge"
                  style={{
                    background: roleStyle.bg,
                    color: roleStyle.text,
                  }}
                >
                  {member.role || "agent"}
                </span>
              </div>
              <div className="team-member-team">
                {member.teamName || "—"}
              </div>
              <div className="team-member-team">
                <span
                  className={`team-status-badge ${
                    member.isActive ? "active" : "inactive"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="team-member-team">
                {member.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </div>
              <div className="team-stat-mini">
                <strong>{member.totalLeads || 0}</strong>
                <span>Leads</span>
              </div>

              <div className="team-stat-mini">
                <strong>
                  ${Number(member.pipelineValue || 0).toLocaleString()}
                </strong>
                <span>Pipeline</span>
              </div>

              <div className="team-stat-mini">
                <strong className="team-ai-score">
                  {member.aiScore || 0}%
                </strong>
                <span>AI Score</span>
              </div>

              <div className="team-member-actions">
                <button
                  type="button"
                  className="team-icon-btn"
                  onClick={(event) => {
                    event.stopPropagation();

                    setOpenMenu((current) =>
                      current === memberId ? null : memberId,
                    );
                  }}
                >
                  <MoreVertical size={18} />
                </button>

                {openMenu === memberId && (
                  <div className="team-member-menu">
                    <button
                      type="button"
                      className="team-member-menu-item"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenRoleModal(member);
                      }}
                    >
                      <Shield size={16} />
                      <span>Change Role</span>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenu(null);
                        onRemove?.(member);
                      }}
                      className="team-member-menu-item danger"
                    >
                      <Trash2 size={16} />
                      <span>Remove Member</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="team-insights-footer">
        <button
          type="button"
          onClick={onInvite}
          className="team-insights-report-btn team-member"
        >
          <Plus size={16} />
          Invite New Member
        </button>
      </div>
    </div>
  );
}
