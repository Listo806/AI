import { useState, useEffect, useCallback } from "react";
import { UserPlus, X, Mail, User, Shield, Check } from "lucide-react";
import { coreInviteTeamMember } from "../api/platformApi";
import "./InviteTeamModal.css";

const ROLES = [
  { value: "agent", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

/**
 * Core-CRM "Invite Team Member" modal. Opened from the persistent sidebar action
 * (window event `cortexa:open-invite-team`) and from the Day-3 onboarding email
 * CTA deep link (/dashboard/...?invite=team). Sends a real pending invitation +
 * email through the existing team backend, without the paid seat limit. It is NOT
 * the paid Team Workspace invite.
 */
export default function InviteTeamModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("agent");
    setBusy(false);
    setDone(null);
    setErr(null);
  };

  const close = useCallback(() => {
    setOpen(false);
    // Let the close animation/state settle before clearing.
    setTimeout(reset, 150);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      reset();
      setOpen(true);
    };
    window.addEventListener("cortexa:open-invite-team", onOpen);
    // Deep link from the Day-3 email CTA (…?invite=team): open on arrival, then
    // strip the param so a refresh doesn't reopen it.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("invite") === "team") {
        setOpen(true);
        params.delete("invite");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
        );
      }
    } catch {
      /* no-op */
    }
    return () => window.removeEventListener("cortexa:open-invite-team", onOpen);
  }, []);

  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const cleanEmail = email.trim();
      if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
        setErr("Please enter a valid email address.");
        return;
      }
      setBusy(true);
      setErr(null);
      try {
        await coreInviteTeamMember({ name, email: cleanEmail, role });
        setDone(cleanEmail);
      } catch (e2) {
        setErr(e2?.message || "Could not send the invitation. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [name, email, role],
  );

  if (!open) return null;

  return (
    <div className="itm-ov" onClick={close}>
      <div
        className="itm-modal"
        role="dialog"
        aria-label="Invite Team Member"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="itm-x" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        <div className="itm-head">
          <div className="itm-badge">
            <UserPlus size={22} />
          </div>
          <div>
            <h3>Invite a Team Member</h3>
            <p>Add a teammate to your account and start collaborating.</p>
          </div>
        </div>

        {done ? (
          <div className="itm-success">
            <div className="itm-success-ico">
              <Check size={26} />
            </div>
            <div className="itm-success-title">Invitation sent</div>
            <div className="itm-success-sub">
              We've emailed <b>{done}</b> a secure link to join your team.
            </div>
            <div className="itm-success-actions">
              <button
                className="itm-btn itm-btn-ghost"
                onClick={() => {
                  reset();
                }}
              >
                Invite another
              </button>
              <button className="itm-btn itm-btn-primary" onClick={close}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="itm-form" onSubmit={submit}>
            <label className="itm-label">Full Name</label>
            <div className="itm-field">
              <User size={16} className="itm-field-ico" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                autoFocus
              />
            </div>

            <label className="itm-label">Email Address</label>
            <div className="itm-field">
              <Mail size={16} className="itm-field-ico" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <label className="itm-label">Role</label>
            <div className="itm-field">
              <Shield size={16} className="itm-field-ico" />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="itm-hint">
              You can change roles and permissions anytime.
            </div>

            {err && <div className="itm-error">{err}</div>}

            <div className="itm-actions">
              <button
                type="button"
                className="itm-btn itm-btn-ghost"
                onClick={close}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="itm-btn itm-btn-primary"
                disabled={busy}
              >
                {busy ? "Sending…" : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
