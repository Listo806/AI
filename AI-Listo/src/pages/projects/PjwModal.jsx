import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Reusable large centered Work Modal for the Projects workspace.
 * One shell is used for every create/edit/detail flow (projects, tasks,
 * milestones, deliverables, expenses).
 */
export default function PjwModal({ open, title, subtitle, onClose, footer, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pjw-modal-bg" onMouseDown={() => onClose?.()}>
      <div
        className={`pjw-modal ${wide ? "pjw-modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header>
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" aria-label="Close" onClick={() => onClose?.()}>
            <X size={18} />
          </button>
        </header>

        <div className="pjw-modal-body">{children}</div>

        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
