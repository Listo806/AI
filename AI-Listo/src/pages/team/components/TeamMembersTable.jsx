import { useState, useEffect } from "react";

import {
  MoreVertical,
  Trash2,
  Shield,
  Briefcase,
  Sparkles,
  Plus,
  Eye, Send, UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLE_STYLES } from "../utils/teamConstants";

export default function TeamMembersTable({ members, onRemove, onInvite }) {
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

  if (isMobile) {
    return (
      <div className="mobile-cards-container">
        {members?.map((user, index) => (
          <div key={user.id || index} className="m-user-card">
            
            <div className="m-card-top">
              
              <div className="m-user-header">
                <div className="m-avatar-wrap">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="m-avatar" />
                  ) : (
                    <div className="m-avatar-placeholder">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="m-user-info">
                  <div className="m-user-title-row">
                    <span className="m-user-name">{user.name || user.email}</span>
                    {user.role && <span className="m-tag m-tag-role">{user.role}</span>}
                    {user.status && <span className="m-tag m-tag-status">{user.status}</span>}
                  </div>
                  
                  {(user.type || user.temperature || user.aiMatch) && (
                    <div className="m-tags-row">
                      {user.type && <span className="m-sub-tag">{user.type}</span>}
                      {user.temperature && <span className="m-sub-tag m-cold">{user.temperature}</span>}
                      {user.aiMatch && <span className="m-sub-tag m-ai-score">{user.aiMatch}</span>}
                    </div>
                  )}
                </div>

                <div className="m-active-status">Active</div>
              </div>

              <div className="m-stats-grid">
                <div className="m-stat-item">
                  <span className="m-stat-val">{user.leadsCount ?? 0}</span>
                  <span className="m-stat-lbl">Leads</span>
                </div>
                <div className="m-stat-item">
                  <span className="m-stat-val">${user.pipeline ?? 0}</span>
                  <span className="m-stat-lbl">Pipeline</span>
                </div>
                <div className="m-stat-item">
                  <span className="m-stat-val">{user.aiScore ?? 0}%</span>
                  <span className="m-stat-lbl">AI Score</span>
                </div>
              </div>

            </div>

            <div className="m-card-actions">
              <button className="m-action-btn">
                <Eye size={18} />
                <span>View</span>
              </button>
              <button className="m-action-btn">
                <Send size={16} />
                <span>Message</span>
              </button>
              <button className="m-action-btn">
                <UserPlus size={18} />
                <span>Assign Leads</span>
              </button>
            </div>

          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="team-card">
      {/* HEADER */}
      <div className="team-card-header">
        <div>
          <h3 className="team-card-title">Team Members</h3>

          <p className="team-card-description">
            {members?.length || 0} members total
          </p>
        </div>
        <button
          className="team-ai-review-btn"
          onClick={() => navigate("/dashboard/team/members")}
        >
          <span>View All</span>
        </button>
      </div>

      {/* BODY */}
      <div className="team-members-modern">
        {members?.map((member) => {
          const memberId = member._id || member.id;

          const roleStyle =
            ROLE_STYLES[member.role?.toLowerCase()] || ROLE_STYLES.agent;

          return (
            <div key={memberId} className="team-member-card">
              {/* USER */}
              <div className="team-member-user">
                <img
                  src={member.avatar || "https://i.pravatar.cc/150"}
                  alt=""
                  className="team-member-avatar"
                />

                <div className="team-member-user-content">
                  {/* NAME */}
                  <div className="team-member-email">{member.name}</div>

                  {/* EMAIL */}
                  <div className="team-member-subtext">{member.email}</div>
                </div>
              </div>
              {/* ROLE */}
              <div className="team-member-name">
                <span
                  className="team-role-badge"
                  style={{
                    background: roleStyle.bg,
                    color: roleStyle.text,
                  }}
                >
                  {member.role}
                </span>
              </div>
              {/* LEADS */}
              <div className="team-stat-mini">
                <strong>{member.totalLeads || 0}</strong>

                <span>Leads</span>
              </div>

              {/* PIPELINE */}
              <div className="team-stat-mini">
                <strong>
                  ${Number(member.pipelineValue || 0).toLocaleString()}
                </strong>

                <span>Pipeline</span>
              </div>

              {/* AI SCORE */}
              <div className="team-stat-mini">
                <strong className="team-ai-score">
                  {member.aiScore || 0}%
                </strong>

                <span>AI Score</span>
              </div>

              {/* ACTIONS */}
              <div className="team-member-actions">
                <button
                  className="team-icon-btn"
                  onClick={() =>
                    setOpenMenu(openMenu === memberId ? null : memberId)
                  }
                >
                  <MoreVertical size={18} />
                </button>

                {openMenu === memberId && (
                  <div className="team-member-menu">
                    <button className="team-member-menu-item">
                      <Shield size={16} />
                      <span>Change Role</span>
                    </button>

                    <button className="team-member-menu-item">
                      <Briefcase size={16} />
                      <span>Assign Leads</span>
                    </button>

                    <button className="team-member-menu-item">
                      <Sparkles size={16} />
                      <span>AI Review</span>
                    </button>

                    <button
                      onClick={() => onRemove(member)}
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
