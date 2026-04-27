import React, { useState } from "react";
import "./Common.css";

export default function SupportHub() {
  const [query, setQuery] = useState("");

  return (
    <div className="support-page">

      {/* HERO */}
      <div className="support-hero">
        <h1>How can we help?</h1>

        <div className="support-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about Cortexa..."
          />
          <button>Search</button>
        </div>

        <div className="support-pills">
          {["Billing", "Automations", "Integrations", "Leads", "AI", "Setup"].map(
            (item) => (
              <span key={item}>{item}</span>
            )
          )}
        </div>
      </div>

      {/* CARDS */}
      <div className="support-cards">
        {[
          { title: "Connect Integrations", desc: "WhatsApp, Email, Zapier, API and more" },
          { title: "CRM Setup", desc: "Leads, pipelines, automation workflows" },
          { title: "Billing & Plans", desc: "Subscriptions, payments, upgrades" },
          { title: "AI Automation", desc: "Follow-ups, qualification, booking" },
          { title: "Technical Support", desc: "Fix bugs or platform issues" },
          { title: "Contact Support", desc: "Reach our team directly" },
        ].map((card, i) => (
          <div className="support-card" key={i}>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* POPULAR QUESTIONS */}
      <div className="support-faq">
        <h2>Popular Questions</h2>

        <div className="faq-list">
          {[
            "How do I connect WhatsApp?",
            "How does AI follow-up work?",
            "How do I get leads?",
            "How do I cancel my subscription?",
            "How do I set up automation?",
          ].map((q, i) => (
            <div key={i} className="faq-item">
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="support-cta">
        <p>Still need help?</p>
        <button>Contact Support</button>
      </div>

    </div>
  );
}