import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AICenterOverview() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.request("/ai-center/overview");
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message || t("aiCenter.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [data]);

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
        <i data-lucide="layout-dashboard" />
        {t("aiCenter.pageTitle")}
      </h1>
      <p className="ai-center-page-subtitle">
        {t("aiCenter.pageSubtitle")}
      </p>

      <section className="ai-center-section">
        <h2>{t("aiCenter.statusSummary")}</h2>
        <div className="ai-center-kpi-row">
          <div className="ai-center-stat-card">
            <div className="stat-value">{data?.ai_auto_reply?.enabled ? t("aiCenter.on") : t("aiCenter.off")}</div>
            <div className="stat-label">{t("aiCenter.aiAutoReply")}</div>
            {data?.ai_auto_reply?.tone && (
              <div className="stat-label" style={{ marginTop: "4px", textTransform: "capitalize" }}>
                {data.ai_auto_reply.tone}
              </div>
            )}
          </div>
          <div className="ai-center-stat-card">
            <div className="stat-value">{data?.ai_appointment_setter?.enabled ? t("aiCenter.on") : t("aiCenter.off")}</div>
            <div className="stat-label">{t("aiCenter.aiSetter")}</div>
          </div>
          <div className="ai-center-stat-card">
            <div className="stat-value">{(data?.active_channels?.length ?? 0) > 0 ? data.active_channels.length : "—"}</div>
            <div className="stat-label">{t("aiCenter.activeChannels")}</div>
            {(data?.active_channels?.length ?? 0) > 0 ? (
              <div className="stat-label" style={{ marginTop: "4px" }}>
                {data.active_channels.join(", ")}
              </div>
            ) : (
              <div className="stat-label" style={{ marginTop: "4px", color: "var(--text-muted)" }}>{t("aiCenter.noneConnected")}</div>
            )}
          </div>
          <div className="ai-center-stat-card">
            <div className="stat-value">{(data?.connected_calendars?.length ?? 0) > 0 ? data.connected_calendars.length : "—"}</div>
            <div className="stat-label">{t("aiCenter.connectedCalendars")}</div>
            {(data?.connected_calendars?.length ?? 0) === 0 && (
              <div className="stat-label" style={{ marginTop: "4px", color: "var(--text-muted)" }}>{t("aiCenter.connectInIntegrations")}</div>
            )}
          </div>
        </div>
      </section>

      <section className="ai-center-section">
        <h2>{t("aiCenter.recentActions")}</h2>
        {data?.recent_ai_actions?.length ? (
          <div className="ai-center-table-wrap">
            <table className="ai-center-table">
              <thead>
                <tr>
                  <th>{t("aiCenter.colTime")}</th>
                  <th>{t("aiCenter.colAction")}</th>
                  <th>{t("aiCenter.colLead")}</th>
                  <th>{t("aiCenter.colChannel")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_ai_actions.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{new Date(a.timestamp).toLocaleString()}</td>
                    <td>{a.action}</td>
                    <td className="muted">{a.lead_id ? `${a.lead_id.slice(0, 8)}…` : "—"}</td>
                    <td>{a.channel ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ai-center-empty">{t("aiCenter.noRecentActions")}</div>
        )}
      </section>
    </div>
  );
}
