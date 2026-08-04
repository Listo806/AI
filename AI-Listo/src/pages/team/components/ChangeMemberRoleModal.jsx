import { useEffect, useState } from "react";
import { Shield, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ChangeMemberRoleModal({
  open,
  member,
  updating,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
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
              <h3>{t("team.changeRoleModal.title", "Change Member Role")}</h3>
              <p>
                {t("team.changeRoleModal.subtitle", "Update access for {{name}}", {
                  name: member.name || member.email,
                })}
              </p>
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
                alt={member.name || t("team.changeRoleModal.memberAvatarAlt", "Team member")}
              />

              <div>
                <strong>
                  {member.name || t("team.changeRoleModal.unnamedMember", "Unnamed Member")}
                </strong>
                <span>{member.email}</span>
              </div>
            </div>

            <div className="team-role-field">
              <label htmlFor="member-role">{t("team.changeRoleModal.roleLabel", "Role")}</label>

              <select
                id="member-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={updating}
              >
                <option value="agent">{t("team.changeRoleModal.roleAgent", "Agent")}</option>
                <option value="manager">{t("team.changeRoleModal.roleManager", "Manager")}</option>
                <option value="admin">{t("team.changeRoleModal.roleAdmin", "Admin")}</option>
                <option value="viewer">{t("team.changeRoleModal.roleViewer", "Viewer")}</option>
              </select>
            </div>

            <div className="team-role-summary">
              <strong>{t("team.changeRoleModal.selectedRole", "Selected role")}</strong>
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
              {t("team.changeRoleModal.cancel", "Cancel")}
            </button>

            <button
              type="submit"
              className="team-primary-btn"
              disabled={updating || role === member.role?.toLowerCase()}
            >
              {updating
                ? t("team.changeRoleModal.updating", "Updating...")
                : t("team.changeRoleModal.updateRole", "Update Role")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
