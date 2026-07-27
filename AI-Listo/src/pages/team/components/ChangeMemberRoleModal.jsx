import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";

export default function ChangeMemberRoleModal({
  open,
  member,
  updating,
  onClose,
  onSubmit,
}) {
  const [role, setRole] = useState("agent");

  useEffect(() => {
    if (!open) return;

    setRole(String(member?.role || "agent").toLowerCase());
  }, [open, member]);

  if (!open || !member) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSubmit?.({
      memberId: member.id || member._id,
      role,
    });
  };

  return (
    <div className="team-modal-overlay" onClick={onClose}>
      <div
        className="team-role-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="team-role-modal-header">
          <div>
            <div className="team-role-modal-icon">
              <Shield size={20} />
            </div>

            <div>
              <h3>Change Member Role</h3>
              <p>Update access for {member.name || member.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="team-icon-btn"
            onClick={onClose}
            disabled={updating}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="team-role-modal-body">
            <div className="team-role-member">
              <img
                src={member.avatar || "https://i.pravatar.cc/150"}
                alt={member.name || "Team member"}
              />

              <div>
                <strong>{member.name || "Unnamed Member"}</strong>
                <span>{member.email}</span>
              </div>
            </div>

            <div className="team-role-field">
              <label htmlFor="member-role">Role</label>

              <select
                id="member-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={updating}
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="team-role-summary">
              <strong>Selected role</strong>
              <span>{role}</span>
            </div>
          </div>

          <div className="team-role-modal-actions">
            <button
              type="button"
              className="team-secondary-btn"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="team-primary-btn"
              disabled={updating || role === member.role?.toLowerCase()}
            >
              {updating ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
