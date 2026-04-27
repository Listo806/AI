import React from "react";
import {
  Brain,
  Network,
  Zap,
  BarChart3,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Workflow,
  Target,
} from "lucide-react";
import "./Common.css";

export default function About() {
  return (
    <main className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="sub_container hero-grid">

          <div className="hero-left">
            <p className="label">About Cortexa</p>

            <h1>
              The AI brain behind modern real estate operations.
            </h1>

            <p className="desc">
              Cortexa connects leads, listings, conversations, automations,
              and analytics into one intelligent CRM system.
            </p>

            <div className="cta-group">
              <a className="btn-primary" href="/signup">
                Start Free Trial <ArrowRight size={16} />
              </a>

              <a className="btn-secondary" href="/features">
                Explore Features
              </a>
            </div>
          </div>

          <div className="hero-right">
            <div className="brain-card">

              <div className="brain-icon">
                <Brain size={50} />
              </div>

              <div className="flow-box">Leads, listings, messages</div>
              <div className="arrow">↓</div>
              <div className="flow-box dark">AI processes & automates</div>
              <div className="arrow">↓</div>
              <div className="flow-box green">Faster deals & insights</div>

            </div>
          </div>

        </div>
      </section>

      {/* WHY */}
      <section className="section">
        <div className="sub_container center">
          <h2>Real estate has a systems problem, not a lead problem.</h2>
          <p>
            Leads come from many channels but are rarely connected in one system.
          </p>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="section">
        <div className="sub_container grid-3">

          <div className="card">
            <MessageCircle />
            <h3>Leads get scattered</h3>
            <p>Messages and forms are disconnected.</p>
          </div>

          <div className="card">
            <Workflow />
            <h3>Follow-up delays</h3>
            <p>Manual work slows everything down.</p>
          </div>

          <div className="card">
            <BarChart3 />
            <h3>No clear data</h3>
            <p>Hard to know what is working.</p>
          </div>

        </div>
      </section>

      {/* INTELLIGENCE */}
      <section className="dark-section">
        <div className="sub_container split">

          <div>
            <h2>Cortexa thinks with your business.</h2>
            <p>
              AI organizes, automates, and recommends next actions.
            </p>
          </div>

          <div className="list">
            {[
              "Capture every lead",
              "Analyze conversations",
              "Trigger workflows",
              "Track deals",
              "Generate insights",
            ].map((t, i) => (
              <div key={i} className="list-item">
                <Network />
                <span>{t}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="sub_container cta-box">
          <h2>Ready to connect your business to the brain?</h2>
          <p>Start your free trial today.</p>

          <a href="/signup" className="btn-white">
            Start Free Trial <ArrowRight size={16} />
          </a>
        </div>
      </section>

    </main>
  );
}