import { X } from 'lucide-react';

export default function InviteMemberModal({
  open,
  onClose,
  inviteEmail,
  setInviteEmail,
  onInvite,
  inviting,
}) {
  if (!open) return null;

  return (
    <div
      className="team-modal-overlay"
      onClick={onClose}
    >
      <div
        className="team-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="team-modal-header">

          <div>
            <h3 className="team-modal-title">
              Invite Team Member
            </h3>

            <p className="team-modal-subtitle">
              Add a new member to your workspace
            </p>
          </div>

          <button
            className="team-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        {/* FORM */}
        <form onSubmit={onInvite}>

          <div className="team-form-group">

            <label className="team-label">
              Email Address
            </label>

            <input
              type="email"
              placeholder="john@example.com"
              className="team-input"
              value={inviteEmail}
              onChange={(e) =>
                setInviteEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="team-modal-footer">

            <button
              type="button"
              className="team-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="team-primary-btn"
              disabled={inviting}
            >
              {inviting
                ? 'Sending Invite...'
                : 'Send Invite'}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}