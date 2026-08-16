import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Target, Lock } from "lucide-react";

import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import LeadGeneratorPage from "./LeadGeneratorPage";

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

/**
 * Gates the Lead Generator.
 *
 * The old $147 purchase pop-up has been removed — Lead Generator will move to the
 * standard $97/month workspace add-on flow, wired later. For now:
 *   - Platform support (super_admin) can open it for review.
 *   - Teams that already own the legacy add-on keep access (no paid customer is cut off).
 *   - Everyone else sees a neutral, honest "locked" state with no purchase prompt.
 */
export default function LeadGeneratorGate() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | locked | unlocked

  const isSupport = ["super_admin", "super-admin"].includes(
    String(user?.role || "").toLowerCase(),
  );

  useEffect(() => {
    let alive = true;
    // Platform support is unlocked immediately without needing an entitlement.
    if (isSupport) {
      setStatus("unlocked");
      return () => {};
    }
    (async () => {
      try {
        const data = unwrap(await apiClient.request("/subscriptions/my-addons"));
        if (!alive) return;
        // Grandfather any team that already owns the add-on; otherwise locked.
        setStatus(data?.leadGenerator ? "unlocked" : "locked");
      } catch (_e) {
        if (!alive) return;
        setStatus("locked"); // fail closed
      }
    })();
    return () => {
      alive = false;
    };
  }, [isSupport]);

  if (status === "loading") {
    return <div style={{ padding: 40, color: "#6b7280" }}>{t("common.loading")}</div>;
  }

  if (status === "unlocked") {
    return <LeadGeneratorPage />;
  }

  // Locked state: neutral, no purchase pop-up. The paid flow will be the standard
  // $97 workspace add-on once it is wired.
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          maxWidth: 460,
          width: "100%",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#f1f5f9",
            color: "#64748b",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            position: "relative",
          }}
        >
          <Target size={26} />
          <span
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={13} />
          </span>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          {t("generator.addOnTitle")}
        </h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
          Lead Generator is a paid workspace add-on. It is not part of your current plan.
          It will be available through the workspace add-on system soon.
        </p>
      </div>
    </div>
  );
}
