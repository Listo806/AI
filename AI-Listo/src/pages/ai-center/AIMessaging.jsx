import { useEffect } from "react";
import "./ai-center.css";

export default function AIMessaging() {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, []);

  return (
    <div className="ai-center-page">
      <h1 className="ai-center-page-title">
        <i data-lucide="send" />
        AI Messaging & Follow-Ups
      </h1>
      <p className="ai-center-page-subtitle">
        Follow-ups, reminders, nurture messages, and re-engagement. No cold outreach, ads, or bulk campaigns.
      </p>

      <section className="ai-center-section">
        <h2>Scope</h2>
        <p>
          This module controls AI-driven follow-ups, reminders, and nurture sequences. Cold outreach, ads, and bulk campaigns are not included.
        </p>
        <p className="ai-center-metrics-empty" style={{ marginTop: "16px" }}>
          Configure follow-ups and nurture sequences here.
        </p>
      </section>
    </div>
  );
}
