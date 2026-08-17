import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import aiUnitsApi from "../api/aiUnitsApi";
import "./AIPowerHud.css";

/**
 * Admin-only control to preview the Free "AI Power" floating HUD on the
 * admin's OWN account, for UX review. It never changes the global rule:
 * Solo/Business/Scale and other unlimited customers still never see the HUD.
 * Renders nothing for non-admins.
 */
export default function AiHudPreviewToggle() {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    aiUnitsApi
      .getPreview()
      .then((r) => setEnabled(!!r?.enabled))
      .catch(() => setEnabled(false));
  }, [isAdmin]);

  if (!isAdmin || enabled === null) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await aiUnitsApi.setPreview(!enabled);
      setEnabled(!!r?.enabled);
      // Nudge the shared balance so the HUD appears/disappears immediately.
      window.dispatchEvent(new Event("cortexa:ai-units-refresh"));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={`aipwr-preview-toggle ${enabled ? "on" : ""}`}
      onClick={toggle}
      disabled={busy}
      title="Admin only — preview the Free AI Power HUD on your account. Does not affect customers."
    >
      AI HUD Preview: {enabled ? "On" : "Off"}
    </button>
  );
}
