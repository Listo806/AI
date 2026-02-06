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
    if (!window.confirm("Enable AI Appointment Setter? Billing may apply.")) return;
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
    if (!window.confirm("Disabling stops new AI bookings. Existing appointments remain unchanged. Continue?")) return;
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
        AI Appointment Setter
      </h1>
      <p className="ai-center-page-subtitle">
        AI can qualify leads and book appointments across connected channels. Enable to activate.
      </p>

      {!enabled ? (
        <section className="ai-center-section">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <span className="ai-center-badge ai-center-badge-neutral">Disabled</span>
          </div>
          <p style={{ marginBottom: "24px" }}>
            AI can qualify leads, book appointments, and works across connected channels. Requires activation.
          </p>
          <div className="ai-center-actions">
            <button
              type="button"
              className="crm-btn crm-btn-primary"
              onClick={enable}
              disabled={actionLoading}
            >
              Enable AI Appointment Setter
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
            <div className="ai-center-kpi-row">
              <div className="ai-center-stat-card">
                <div className="stat-value">{status?.appointments_booked_count ?? 0}</div>
                <div className="stat-label">Appointments Booked</div>
              </div>
              <div className="ai-center-stat-card">
                <div className="stat-value">{status?.conversion_rate ?? 0}%</div>
                <div className="stat-label">Conversion Rate</div>
              </div>
              <div className="ai-center-stat-card">
                <div className="stat-value">{status?.leads_qualified_count ?? 0}</div>
                <div className="stat-label">Leads Qualified by AI</div>
              </div>
              <div className="ai-center-stat-card">
                <div className="stat-value">{status?.escalated_to_human_count ?? 0}</div>
                <div className="stat-label">Escalated to Human</div>
              </div>
            </div>
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
                        <span className="ai-center-badge ai-center-badge-neutral">Coming soon</span>
                      ) : connected ? (
                        <span className="ai-center-badge ai-center-badge-success">Connected</span>
                      ) : (
                        <span className="ai-center-badge ai-center-badge-neutral">Not connected</span>
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
              Connected calendars: {(status?.connected_calendars?.length ?? 0)}
            </p>
            <Link to="/dashboard/integrations" className="crm-btn crm-btn-secondary">
              Manage Calendar
            </Link>
          </section>

          <section className="ai-center-section">
            <h2>Safety & Guardrails</h2>
            <ul className="ai-center-guardrails">
              <li>Cannot book outside availability</li>
              <li>Cannot override manual blocks</li>
              <li>Cannot cancel past events</li>
              <li>All actions logged</li>
            </ul>
          </section>

          <section className="ai-center-section">
            <h2>Module Control</h2>
            <p style={{ marginBottom: "16px", color: "var(--text-muted)" }}>
              Disabling stops new AI bookings. Existing appointments remain unchanged.
            </p>
            <button
              type="button"
              className="crm-btn crm-btn-secondary"
              onClick={disable}
              disabled={actionLoading}
            >
              Disable AI Appointment Setter
            </button>
          </section>
        </>
      )}
    </div>
  );
}
