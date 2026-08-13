import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./InsuranceWorkModal.css";

// ONE reusable large work modal for the Insurance Workspace (policy / claim /
// quote / renewal / carrier / commission detail all use this same shell). It is
// an overlay, so closing returns the user to the exact same spot with no page
// navigation. Generic clean design for V1; visuals get redesigned later.
export default function InsuranceWorkModal({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="iw-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="iw-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="iw-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="iw-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="iw-modal-body">{children}</div>

        {footer && <div className="iw-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
