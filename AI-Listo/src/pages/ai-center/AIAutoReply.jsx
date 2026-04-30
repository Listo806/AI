import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIAutoReply() {
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.request("/ai-center/auto-reply", {
        method: "PUT",
        body: JSON.stringify({ enabled, tone }),
      });
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
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

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="message-circle" />
        AI Auto-Reply
      </h1>
      <p className="ai-center-page-subtitle">
        Zero-config inbound AI responses. When ON, AI responds using CRM context and routes complex cases to a human.
      </p>

      <section className="ai-center-section">
        <h2>Controls</h2>
        <div className="ai-center-toggle-row">
          <input
            type="checkbox"
            id="ai-auto-reply-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <label htmlFor="ai-auto-reply-toggle">
            AI Auto-Reply: {enabled ? "ON" : "OFF"}
          </label>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "var(--text)" }}>
            Tone
          </label>
          <select
            className="ai-center-select"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="sales">Sales</option>
          </select>
        </div>
        <div className="ai-center-actions">
          <button
            type="button"
            className="crm-btn crm-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}
