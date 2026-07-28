import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIAppointmentSetter() {
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
        if (!cancelled) setError(e.message || "Failed to load");
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
    if (!window.confirm("Enable AI Setter? Billing may apply.")) return;
    setActionLoading(true);
    try {
      await apiClient.request("/ai-center/appointment-setter/enable", { method: "POST" });
      const res = await apiClient.request("/ai-center/appointment-setter/status");
      setStatus(res);
    } catch (e) {
      setError(e.message || "Failed to enable");
    } finally {
      setActionLoading(false);
    }
  };

  const disable = async () => {
    if (!window.confirm("Disabling stops the AI from qualifying and escalating new leads. Continue?")) return;
    setActionLoading(true);
    try {
      await apiClient.request("/ai-center/appointment-setter/disable", { method: "POST" });
      const res = await apiClient.request("/ai-center/appointment-setter/status");
      setStatus(res);
    } catch (e) {
      setError(e.message || "Failed to disable");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-center-page">
        <div className="ai-center-empty">Loading...</div>
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
        AI Setter
      </h1>
      <p className="ai-center-page-subtitle">
        AI qualifies leads across connected channels and escalates them to a human to book. Enable to activate.
      </p>

      {!enabled ? (
        <section className="ai-center-section">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span className="ai-center-badge ai-center-badge-neutral">Disabled</span>
          </div>
          <p style={{ marginBottom: "24px" }}>
            AI qualifies leads across connected channels and escalates them to a human for booking. Automated booking is coming soon. Requires activation.
          </p>
          <div className="ai-center-actions">
            <button
              type="button"
              className="crm-btn crm-btn-primary"
              onClick={enable}
              disabled={actionLoading}
            >
              Enable AI Setter
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="ai-center-section">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span className="ai-center-badge ai-center-badge-success">ACTIVE</span>
            </div>
            <h2>Metrics</h2>
            {(() => {
              const qualified = status?.leads_qualified_count ?? 0;
              const escalated = status?.escalated_to_human_count ?? 0;
              const allZero = qualified === 0 && escalated === 0;
              if (allZero) {
                return (
                  <p className="ai-center-metrics-empty">No AI activity yet.</p>
                );
              }
              return (
                <div className="ai-center-kpi-row">
                  <div className="ai-center-stat-card">
                    <div className="stat-value">{qualified}</div>
                    <div className="stat-label">Leads Qualified by AI</div>
                  </div>
                  <div className="ai-center-stat-card">
                    <div className="stat-value">{escalated}</div>
                    <div className="stat-label">Escalated to Human</div>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="ai-center-section">
            <h2>Channel Status</h2>
            <ul className="ai-center-channel-list">
              {["whatsapp", "instagram", "sms", "messenger"].map((ch) => {
                const connected = (status?.connected_channels ?? []).includes(ch);
                const comingSoon = ch === "sms" || ch === "messenger";
                return (
                  <li key={ch}>
                    <span style={{ textTransform: "capitalize" }}>{ch}</span>
                    <span>
                      {comingSoon ? (
                        <span className="ai-center-badge ai-center-badge-neutral">Coming Soon</span>
                      ) : connected ? (
                        <span className="ai-center-badge ai-center-badge-success">Connected</span>
                      ) : (
                        <span className="ai-center-badge ai-center-badge-neutral">Not Connected</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ai-center-section">
            <h2>Calendar</h2>
            <p style={{ marginBottom: "16px" }}>
              {(status?.connected_calendars?.length ?? 0) === 0
                ? "Connect a calendar so your team can book escalated leads."
                : `Connected calendars: ${status.connected_calendars.length}`}
            </p>
            <Link to="/dashboard/integrations" className="crm-btn crm-btn-secondary">
              Manage Calendar
            </Link>
          </section>

          <section className="ai-center-section">
            <h2>Safety & Guardrails</h2>
            <ul className="ai-center-guardrails">
              <li>Qualifies leads against your rules only</li>
              <li>Escalates to a human for booking</li>
              <li>Never books or cancels on its own</li>
              <li>All actions logged</li>
            </ul>
          </section>

          <section className="ai-center-section">
            <h2>Module Control</h2>
            <p style={{ marginBottom: "16px", color: "var(--text-muted)" }}>
              Disabling stops the AI from qualifying and escalating new leads.
            </p>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={disable}
              disabled={actionLoading}
            >
              Disable AI Setter
            </button>
          </section>
        </>
      )}
    </div>
  );
}
