import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIActivityLogs() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.request("/ai-center/activity?limit=50");
        if (!cancelled) setItems(Array.isArray(res) ? res : []);
      } catch (e) {
        if (!cancelled) setError(e.message || t("aiCenter.failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

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
        <i data-lucide="scroll-text" />
        {t("aiCenter.pageTitle")}
      </h1>
      <p className="ai-center-page-subtitle">
        {t("aiCenter.pageSubtitle")}
      </p>

      <section className="ai-center-section">
        <h2>{t("aiCenter.activityLog")}</h2>
        {items.length ? (
          <div className="ai-center-table-wrap">
            <table className="ai-center-table">
              <thead>
                <tr>
                  <th>{t("aiCenter.colTimestamp")}</th>
                  <th>{t("aiCenter.colAction")}</th>
                  <th>{t("aiCenter.colLeadId")}</th>
                  <th>{t("aiCenter.colChannel")}</th>
                  <th>{t("aiCenter.colOutcome")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{new Date(a.timestamp).toLocaleString()}</td>
                    <td>{a.action}</td>
                    <td className="muted">{a.lead_id ? `${a.lead_id.slice(0, 8)}…` : "—"}</td>
                    <td>{a.channel ?? "—"}</td>
                    <td>{a.outcome ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ai-center-empty">{t("aiCenter.noActivity")}</div>
        )}
      </section>
    </div>
  );
}
