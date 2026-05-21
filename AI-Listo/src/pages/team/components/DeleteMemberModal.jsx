import { X } from 'lucide-react';

export default function DeleteMemberModal({
  open,
  onClose,
  member,
  onConfirm,
  removing,
}) {
  if (!open || !member) return null;

  return (
    <div
      className="team-modal-overlay"
      onClick={onClose}
    >
      <div
        className="team-modal team-delete-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="team-modal-header">

          <div>
            <h3 className="team-modal-title">
              Remove Member
            </h3>

            <p className="team-modal-subtitle">
              This action cannot be undone
            </p>
          </div>

          <button
            className="team-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        {/* CONTENT */}
        <div className="team-delete-content">

          <div className="team-delete-user">

            <img
              src={
                member.avatar ||
                'https://ui-avatars.com/api/?name=' +
                  member.name
              }
              alt=""
              className="team-delete-avatar"
            />

            <div>

              <p className="team-delete-name">
                {member.name}
              </p>

              <p className="team-delete-email">
                {member.email}
              </p>

            </div>

          </div>

          <p className="team-delete-warning">
            Are you sure you want to remove this
            member from the team workspace?
          </p>

        </div>

        {/* FOOTER */}
        <div className="team-modal-footer">

          <button
            type="button"
            className="team-secondary-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="team-danger-btn"
            onClick={onConfirm}
            disabled={removing}
          >
            {removing
              ? 'Removing...'
              : 'Remove Member'}
          </button>

        </div>

      </div>
    </div>
  );
}