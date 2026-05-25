import { useEffect, useState } from "react";
import { X, Mail, Shield } from "lucide-react";

export default function InviteMemberModal({
  open,
  onClose,

  inviteEmail,
  setInviteEmail,

  onInvite,
  inviting,
}) {
  const [role, setRole] = useState("agent");

  /* =====================================================
    RESET WHEN CLOSE
  ===================================================== */

  useEffect(() => {
    if (!open) {
      setRole("agent");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    await onInvite({
      email: inviteEmail,
      role,
    });
  };

  return (
    <div className="team-modal-overlay" onClick={onClose}>
      <div className="team-modal" onClick={(e) => e.stopPropagation()}>
        {/* =================================================
          HEADER
        ================================================= */}

        <div className="team-modal-header">
          <div>
            <h3 className="team-modal-title">Invite Team Member</h3>

            <p className="team-modal-subtitle">
              Add a new member to your workspace
            </p>
          </div>

          <button type="button" className="team-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* =================================================
          FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}

          <div className="team-form-group">
            <label className="team-label">Email Address</label>

            <div className="team-input-icon">
              <input
                type="email"
                placeholder="john@example.com"
                className="team-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ROLE */}

          <div className="team-form-group">
            <label className="team-label">Member Role</label>

            <div className="team-input-icon">
              <select
                className="team-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="agent">Agent</option>

                <option value="manager">Manager</option>

                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* INFO */}

          <div className="team-invite-note">
            Invited members will receive an email invitation to join your
            workspace.
          </div>

          {/* FOOTER */}

          <div className="team-modal-footer">
            <button
              type="button"
              className="team-secondary-btn"
              onClick={onClose}
              disabled={inviting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="team-primary-btn"
              disabled={inviting || !inviteEmail?.trim()}
            >
              {inviting ? "Sending Invite..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
