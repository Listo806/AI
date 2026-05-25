import { useState } from "react";

import {
  MoreVertical,
  Trash2,
  Shield,
  Briefcase,
  Sparkles,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROLE_STYLES } from "../utils/teamConstants";

export default function TeamMembersTable({ members, onRemove, onInvite }) {
  const [openMenu, setOpenMenu] = useState(null);
  const navigate = useNavigate();
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
