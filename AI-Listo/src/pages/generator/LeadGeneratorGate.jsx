import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, MapPin, Search, Send, X } from "lucide-react";

import apiClient from "../../api/apiClient";
import LeadGeneratorPage from "./LeadGeneratorPage";

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

/**
 * Gates the Lead Generator behind the paid add-on. If the current team owns the
 * add-on the real module renders; otherwise the upgrade modal is shown over a
 * dimmed backdrop and the module stays locked. The actual $147 purchase updates
 * the Paddle subscription — that call is wired in handlePurchase once the Paddle
 * add-on price and keys exist; until then we show an honest pending notice
 * rather than pretending the purchase completed.
 */
export default function LeadGeneratorGate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | locked | unlocked
  const [purchasing, setPurchasing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = unwrap(
          await apiClient.request("/subscriptions/my-addons"),
        );
        if (!alive) return;
        setStatus(data?.leadGenerator ? "unlocked" : "locked");
      } catch (_e) {
        if (!alive) return;
        setStatus("locked"); // fail closed
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handlePurchase = async () => {
    setPurchasing(true);
    setNotice("");
    try {
      // Adds the $147/month add-on to the team's Paddle subscription server-side
      // and records the entitlement, so the gate unlocks immediately on success.
      await apiClient.request("/subscriptions/addons/lead-generator/purchase", {
        method: "POST",
      });
      setStatus("unlocked");
    } catch (e) {
      setNotice(
        e?.message ||
          t("generator.purchaseError"),
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (status === "loading") {
    return <div style={{ padding: 40, color: "#6b7280" }}>{t("common.loading")}</div>;
  }

  if (status === "unlocked") {
    return <LeadGeneratorPage />;
  }

  const benefits = [
    { icon: <MapPin size={18} />, text: t("generator.benefitLocation") },
    { icon: <Search size={18} />, text: t("generator.benefitQualified") },
    { icon: <Send size={18} />, text: t("generator.benefitFollowUp") },
  ];

  return (
    <div style={{ minHeight: "70vh" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,17,21,0.55)",
          backdropFilter: "blur(2px)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            width: "min(440px, 94vw)",
            padding: 28,
            boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            title={t("common.close")}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#eef3ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Target size={26} />
            </div>
          </div>

          <h2
            style={{
              textAlign: "center",
              margin: "0 0 8px",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {t("generator.addOnTitle")}
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13.5,
              margin: "0 0 20px",
              lineHeight: 1.5,
            }}
          >
            {t("generator.addOnDescription")}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {benefits.map((b, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ color: "#2563eb", flexShrink: 0 }}>{b.icon}</span>
                <span style={{ fontSize: 13.5, color: "#374151" }}>{b.text}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#111827" }}>
              $147
            </span>
            <span style={{ fontSize: 14, color: "#6b7280" }}>{t("generator.perMonth")}</span>
          </div>

          {notice && (
            <div
              style={{
                fontSize: 12.5,
                color: "#9b6a00",
                background: "#fff7e6",
                border: "1px solid #ffe2a8",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {notice}
            </div>
          )}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={purchasing}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14.5,
              fontWeight: 700,
              color: "#ffffff",
              background: "#2563eb",
              border: "none",
              borderRadius: 10,
              cursor: purchasing ? "default" : "pointer",
              opacity: purchasing ? 0.7 : 1,
            }}
          >
            {purchasing ? t("generator.pleaseWait") : t("generator.addToPlan")}
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
              margin: "10px 0 0",
            }}
          >
            {t("generator.billingNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
