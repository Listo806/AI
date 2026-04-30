import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import "./ai-center.css";

export default function AIActivityLogs() {
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
        <i data-lucide="scroll-text" />
        AI Activity & Logs
      </h1>
      <p className="ai-center-page-subtitle">
        Read-only audit trail for debugging, compliance, and trust.
      </p>

      <section className="ai-center-section">
        <h2>Activity Log</h2>
        {items.length ? (
          <div className="ai-center-table-wrap">
            <table className="ai-center-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Lead ID</th>
                  <th>Channel</th>
                  <th>Outcome</th>
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
          <div className="ai-center-empty">No AI activity recorded yet.</div>
        )}
      </section>
    </div>
  );
}
