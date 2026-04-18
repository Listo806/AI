import React from "react";
import "../styles/cortexa.css";

import heroImg from "../assets/cortexa/hero-dashboard.png";
import leadsImg from "../assets/cortexa/leads-page.png";
import teamImg from "../assets/cortexa/team-dashboard.png";
import aiImg from "../assets/cortexa/ai-insights.png";
import fullImg from "../assets/cortexa/full-system.png";

export default function CortexaLandingPage() {
  return (
    <div className="cx-page">
      {/* HERO */}
      <section className="cx-section">
        <div className="cx-wrap cx-grid-2">
          <div>
            <div className="cx-eyebrow">CORTEXA AI CRM</div>

            <h1>
              Build CRM dashboards your team can actually work from.
            </h1>

            <p className="cx-sub">
              Leads. Pipeline. WhatsApp. Analytics. All powered by AI in one
              system.
            </p>

            <div className="cx-actions">
              <a href="/signup" className="cx-btn primary">
                Get Started
              </a>
              <a href="/demo" className="cx-btn secondary">
                Watch Demo
              </a>
            </div>
          </div>

          <div className="cx-image">
            <img src={heroImg} alt="CORTEXA Dashboard" />
          </div>
        </div>
      </section>

      {/* LEADS */}
      <section className="cx-section">
        <div className="cx-wrap cx-grid-2 reverse">
          <div className="cx-image">
            <img src={leadsImg} alt="Leads Page" />
          </div>

          <div>
            <h2>Manage and convert leads in real time.</h2>

            <p className="cx-sub">
              Track, qualify, and close faster with full visibility on every
              lead.
            </p>
          </div>
        </div>
      </section>

      {/* TEAM DASHBOARD */}
      <section className="cx-section">
        <div className="cx-wrap cx-grid-2">
          <div>
            <h2>See your entire team performance instantly.</h2>

            <p className="cx-sub">
              Monitor speed-to-lead, conversations, and deal flow in one view.
            </p>
          </div>

          <div className="cx-image">
            <img src={teamImg} alt="Team Dashboard" />
          </div>
        </div>
      </section>

      {/* AI INSIGHTS */}
      <section className="cx-section">
        <div className="cx-wrap cx-grid-2 reverse">
          <div className="cx-image">
            <img src={aiImg} alt="AI Insights" />
          </div>

          <div>
            <h2>AI tells you what to do next.</h2>

            <p className="cx-sub">
              Get instant insights, follow-ups, and deal recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* FULL SYSTEM */}
      <section className="cx-section">
        <div className="cx-wrap center">
          <h2>Everything connected. One system.</h2>

          <div className="cx-image wide">
            <img src={fullImg} alt="Full System" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cx-section">
        <div className="cta">
          <h2>Start closing more deals with CORTEXA.</h2>

          <div className="cx-actions">
            <a href="/signup" className="cx-btn secondary">
              Get Started
            </a>
            <a href="/demo" className="cx-btn ghost">
              Watch Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}