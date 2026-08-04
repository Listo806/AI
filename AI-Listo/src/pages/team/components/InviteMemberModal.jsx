import { useEffect, useState } from "react";
import { X, Mail, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function InviteMemberModal({
  open,
  onClose,

  inviteEmail,
  setInviteEmail,

  onInvite,
  inviting,
}) {
  const { t } = useTranslation();
  const [role, setRole] = useState("agent");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  /* =====================================================
    RESET WHEN CLOSE
  ===================================================== */

  useEffect(() => {
    if (!open) {
      setRole("agent");
      setFirstName("");
      setLastName("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = [firstName, lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");

    await onInvite({
      email: inviteEmail,
      role,
      name,
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
            <h3 className="team-modal-title">
              {t("team.inviteModal.title", "Invite Team Member")}
            </h3>

            <p className="team-modal-subtitle">
              {t("team.inviteModal.subtitle", "Add a new member to your workspace")}
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
          {/* NAME */}

          <div className="team-form-group">
            <label className="team-label">{t("team.inviteModal.firstNameLabel", "First Name")}</label>

            <div className="team-input-icon">
              <input
                type="text"
                placeholder={t("team.inviteModal.firstNamePlaceholder", "John")}
                className="team-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          </div>

          <div className="team-form-group">
            <label className="team-label">{t("team.inviteModal.lastNameLabel", "Last Name")}</label>

            <div className="team-input-icon">
              <input
                type="text"
                placeholder={t("team.inviteModal.lastNamePlaceholder", "Doe")}
                className="team-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* EMAIL */}

          <div className="team-form-group">
            <label className="team-label">{t("team.inviteModal.emailLabel", "Email Address")}</label>

            <div className="team-input-icon">
              <input
                type="email"
                placeholder={t("team.inviteModal.emailPlaceholder", "john@example.com")}
                className="team-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* ROLE */}

          <div className="team-form-group">
            <label className="team-label">{t("team.inviteModal.roleLabel", "Member Role")}</label>

            <div className="team-input-icon">
              <select
                className="team-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="agent">{t("team.inviteModal.roleAgent", "Agent")}</option>

                <option value="manager">{t("team.inviteModal.roleManager", "Manager")}</option>

                <option value="admin">{t("team.inviteModal.roleAdmin", "Admin")}</option>
                <option value="viewer">{t("team.inviteModal.roleViewer", "Viewer")}</option>
              </select>
            </div>
          </div>

          {/* INFO */}

          <div className="team-invite-note">
            {t(
              "team.inviteModal.note",
              "Invited members will receive an email invitation to join your workspace."
            )}
          </div>

          {/* FOOTER */}

          <div className="team-modal-footer">
            <button
              type="button"
              className="team-secondary-btn"
              onClick={onClose}
              disabled={inviting}
            >
              {t("team.inviteModal.cancel", "Cancel")}
            </button>

            <button
              type="submit"
              className="team-primary-btn"
              disabled={inviting || !inviteEmail?.trim()}
            >
              {inviting
                ? t("team.inviteModal.sending", "Sending Invite...")
                : t("team.inviteModal.sendInvite", "Send Invite")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
