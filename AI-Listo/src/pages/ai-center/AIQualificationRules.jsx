import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIQualificationRules() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.request("/ai-center/qualification-rules");
        if (!cancelled) setData(res);
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
  }, []);

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

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="filter" />
        AI Qualification Rules
      </h1>
      <p className="ai-center-page-subtitle">
        Lead qualification logic, booking eligibility, and escalation thresholds.
      </p>

      <section className="ai-center-section">
        <h2>Active Ruleset</h2>
        <div className="ai-center-stat-card" style={{ maxWidth: "320px" }}>
          <div className="stat-value">{data?.name ?? "Default"}</div>
          <div className="stat-label">Ruleset name</div>
        </div>
        <p style={{ marginTop: "16px", color: "var(--text-muted)" }}>
          Last updated: {data?.updated_at ? new Date(data.updated_at).toLocaleString() : "—"}
        </p>
        <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
          Used by AI Setter and qualification modules.
        </p>
      </section>
    </div>
  );
}
