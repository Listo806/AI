import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIAppointmentSetter() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.request("/ai-center/appointment-setter/status");
        if (!cancelled) setStatus(res);
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
  }, [status]);

  const enable = async () => {
    if (!window.confirm(t("aiCenter.confirmEnable"))) return;
    setActionLoading(true);
    try {
      await apiClient.request("/ai-center/appointment-setter/enable", { method: "POST" });
      const res = await apiClient.request("/ai-center/appointment-setter/status");
      setStatus(res);
    } catch (e) {
      setError(e.message || t("aiCenter.enableError"));
    } finally {
      setActionLoading(false);
    }
  };

  const disable = async () => {
    if (!window.confirm(t("aiCenter.confirmDisable"))) return;
    setActionLoading(true);
    try {
      await apiClient.request("/ai-center/appointment-setter/disable", { method: "POST" });
      const res = await apiClient.request("/ai-center/appointment-setter/status");
      setStatus(res);
    } catch (e) {
      setError(e.message || t("aiCenter.disableError"));
    } finally {
      setActionLoading(false);
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

  const enabled = status?.enabled ?? false;

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="calendar-check" />
        {t("aiCenter.pageTitle")}
      </h1>
      <p className="ai-center-page-subtitle">
        {t("aiCenter.pageSubtitle")}
      </p>

      {!enabled ? (
        <section className="ai-center-section">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span className="ai-center-badge ai-center-badge-neutral">{t("aiCenter.statusDisabled")}</span>
          </div>
          <p style={{ marginBottom: "24px" }}>
            {t("aiCenter.disabledDescription")}
          </p>
          <div className="ai-center-actions">
            <button
              type="button"
              className="crm-btn crm-btn-primary"
              onClick={enable}
              disabled={actionLoading}
            >
              {t("aiCenter.enableButton")}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="ai-center-section">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span className="ai-center-badge ai-center-badge-success">{t("aiCenter.statusActive")}</span>
            </div>
            <h2>{t("aiCenter.metrics")}</h2>
            {(() => {
              const qualified = status?.leads_qualified_count ?? 0;
              const escalated = status?.escalated_to_human_count ?? 0;
              const allZero = qualified === 0 && escalated === 0;
              if (allZero) {
                return (
                  <p className="ai-center-metrics-empty">{t("aiCenter.noActivityYet")}</p>
                );
              }
              return (
                <div className="ai-center-kpi-row">
                  <div className="ai-center-stat-card">
                    <div className="stat-value">{qualified}</div>
                    <div className="stat-label">{t("aiCenter.leadsQualifiedByAi")}</div>
                  </div>
                  <div className="ai-center-stat-card">
                    <div className="stat-value">{escalated}</div>
                    <div className="stat-label">{t("aiCenter.escalatedToHuman")}</div>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="ai-center-section">
            <h2>{t("aiCenter.channelStatus")}</h2>
            <ul className="ai-center-channel-list">
              {["whatsapp", "instagram", "sms", "messenger"].map((ch) => {
                const connected = (status?.connected_channels ?? []).includes(ch);
                const comingSoon = ch === "sms" || ch === "messenger";
                return (
                  <li key={ch}>
                    <span style={{ textTransform: "capitalize" }}>{ch}</span>
                    <span>
                      {comingSoon ? (
                        <span className="ai-center-badge ai-center-badge-neutral">{t("aiCenter.comingSoon")}</span>
                      ) : connected ? (
                        <span className="ai-center-badge ai-center-badge-success">{t("aiCenter.connected")}</span>
                      ) : (
                        <span className="ai-center-badge ai-center-badge-neutral">{t("aiCenter.notConnected")}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ai-center-section">
            <h2>{t("aiCenter.calendar")}</h2>
            <p style={{ marginBottom: "16px" }}>
              {(status?.connected_calendars?.length ?? 0) === 0
                ? t("aiCenter.connectCalendarPrompt")
                : t("aiCenter.connectedCalendars", { count: status.connected_calendars.length })}
            </p>
            <Link to="/dashboard/integrations" className="crm-btn crm-btn-secondary">
              {t("aiCenter.manageCalendar")}
            </Link>
          </section>

          <section className="ai-center-section">
            <h2>{t("aiCenter.safetyGuardrails")}</h2>
            <ul className="ai-center-guardrails">
              <li>{t("aiCenter.guardrailQualify")}</li>
              <li>{t("aiCenter.guardrailEscalate")}</li>
              <li>{t("aiCenter.guardrailNeverBooks")}</li>
              <li>{t("aiCenter.guardrailLogged")}</li>
            </ul>
          </section>

          <section className="ai-center-section">
            <h2>{t("aiCenter.moduleControl")}</h2>
            <p style={{ marginBottom: "16px", color: "var(--text-muted)" }}>
              {t("aiCenter.disableWarning")}
            </p>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={disable}
              disabled={actionLoading}
            >
              {t("aiCenter.disableButton")}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
