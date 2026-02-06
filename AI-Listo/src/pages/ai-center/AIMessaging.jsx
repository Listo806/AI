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
          This module will control AI-driven follow-ups, reminders, and nurture sequences. Explicitly excluded: cold outreach, ads, and bulk campaigns.
        </p>
        <div className="ai-center-empty" style={{ marginTop: "24px" }}>
          Placeholder — logic and controls coming in a future phase.
        </div>
      </section>
    </div>
  );
}
