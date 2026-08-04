import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIAutoReply() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [tone, setTone] = useState("professional");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.request("/ai-center/auto-reply");
        if (!cancelled) {
          setData(res);
          setEnabled(res?.enabled ?? true);
          setTone(res?.tone ?? "professional");
        }
      } catch (e) {
        if (!cancelled) setError(e.message || t("aiCenter.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.request("/ai-center/auto-reply", {
        method: "PUT",
        body: JSON.stringify({ enabled, tone }),
      });
      setData(res);
    } catch (e) {
      setError(e.message || t("aiCenter.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-center-page">
        <div className="ai-center-empty">{t("aiCenter.loading")}</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="ai-center-page">
        <div className="ai-center-section">
          <p style={{ color: "var(--danger, #dc2626)" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="message-circle" />
        {t("aiCenter.title")}
      </h1>
      <p className="ai-center-page-subtitle">
        {t("aiCenter.subtitle")}
      </p>

      <section className="ai-center-section">
        <h2>{t("aiCenter.controls")}</h2>
        <div className="ai-center-toggle-row">
          <input
            type="checkbox"
            id="ai-auto-reply-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <label htmlFor="ai-auto-reply-toggle">
            {t("aiCenter.autoReplyLabel", { status: enabled ? t("aiCenter.on") : t("aiCenter.off") })}
          </label>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text)" }}>
            {t("aiCenter.toneLabel")}
          </label>
          <select
            className="ai-center-select"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">{t("aiCenter.toneProfessional")}</option>
            <option value="friendly">{t("aiCenter.toneFriendly")}</option>
            <option value="sales">{t("aiCenter.toneSales")}</option>
          </select>
        </div>
        <div className="ai-center-actions">
          <button
            type="button"
            className="crm-btn crm-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("aiCenter.saving") : t("aiCenter.save")}
          </button>
        </div>
      </section>
    </div>
  );
}
