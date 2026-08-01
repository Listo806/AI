import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import {
  ArrowRight,
  Calculator,
  Clock,
  BadgeCheck,
  Zap,
  ShieldCheck,
  Check,
} from "lucide-react";
import { trackEvent } from "../../utils/track";
import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import HiddenCostCalculator from "./HiddenCostCalculator";
import "./Editorial.css";

// "Unified platform vs a stack of tools" comparison. The legacy column is kept
// defensible (how capabilities are commonly tiered/sold as add-ons), not rigged.
const COMPARE_ROWS = [
  { cap: "CRM & contact management", legacy: "Core subscription", cortexa: true },
  { cap: "AI assistant & agent", legacy: "Add-on or higher tier", cortexa: true },
  { cap: "Lead qualification & follow-up", legacy: "Higher tier or manual", cortexa: true },
  { cap: "Appointment booking", legacy: "Add-on or separate tool", cortexa: true },
  { cap: "WhatsApp messaging", legacy: "Third-party integration", cortexa: true },
  { cap: "Team workspace", legacy: "Separate tool", cortexa: true },
  { cap: "Documents", legacy: "Separate tool", cortexa: true },
  { cap: "Automation & workflows", legacy: "Higher tier or add-on", cortexa: true },
  { cap: "Setup", legacy: "Implementation project", cortexa: "$97 one-time" },
  { cap: "Time to value", legacy: "Weeks to months", cortexa: "~48 hours" },
];

// Long-form advertorial that tells the "end of legacy CRM" story and funnels the
// reader into the existing signup flow. The Hidden Cost Calculator is the
// centerpiece. Image placeholders mark where the client will drop screenshots.
export default function EditorialFunnel() {
  useEffect(() => {
    trackEvent("editorial_view", { page: "hidden_cost" });
  }, []);

  const ctaTrial = (where) => () =>
    trackEvent("editorial_cta_click", { where });

  return (
    <div className="ed-page">
      {/* Header */}
      <header className="ed-header">
        <div className="ed-container ed-header-inner">
          <Link to="/" className="ed-brand">
            <img src={headlogo} alt="Cortexa" />
          </Link>
          <Link to="/trial" className="ed-header-cta" onClick={ctaTrial("header")}>
            Start for $97 <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="ed-main">
        {/* Hero */}
        <section className="ed-hero">
          <div className="ed-container ed-narrow">
            <span className="ed-eyebrow">Editorial</span>
            <h1 className="ed-h1">
              The End of Legacy CRM? Why Businesses Are Re-Evaluating Salesforce,
              HubSpot, and the Rise of Agentic AI Revenue Operating Systems
            </h1>
            <p className="ed-lede">
              For nearly two decades, platforms like Salesforce and HubSpot
              helped define what customer relationship management looked like.
              They became the standard for sales organizations around the world.
              But business has changed.
            </p>
            <p>
              Customers expect instant responses. Sales teams are expected to
              move faster than ever. Yet many organizations still rely on systems
              designed to record activity rather than actively help move
              opportunities forward. So more companies are asking a different
              question:
            </p>
            <p className="ed-pull">
              Is our CRM helping us grow, or are we spending too much time
              managing it?
            </p>
            <div className="ed-hero-actions">
              <HashLink
                smooth
                to="#calculator"
                className="ed-btn ed-btn-primary"
                onClick={ctaTrial("hero_calculator")}
              >
                <Calculator size={18} /> Calculate your CRM cost
              </HashLink>
              <Link
                to="/trial"
                className="ed-btn ed-btn-ghost"
                onClick={ctaTrial("hero_trial")}
              >
                Start with Cortexa
              </Link>
            </div>
          </div>
        </section>

        {/* From CRM to Revenue Operations */}
        <section className="ed-section">
          <div className="ed-container ed-narrow">
            <h2>From Customer Relationship Management to Revenue Operations</h2>
            <p>
              Legacy CRM platforms were built to organize information. The next
              generation is being built to help businesses generate revenue.
              Traditional systems excel at storing contacts and documenting what
              happened yesterday. Modern AI-native Revenue Operating Systems are
              designed to help businesses decide what should happen next.
            </p>
            <p>Instead of simply storing leads, businesses are asking:</p>
            <ul className="ed-list">
              <li>Can AI qualify them?</li>
              <li>Can AI keep conversations moving?</li>
              <li>Can AI help automate follow-up?</li>
              <li>Can AI help book appointments?</li>
              <li>Can AI help teams generate more revenue with less manual work?</li>
            </ul>
            <p className="ed-pull">
              The shift isn't from one CRM vendor to another. The shift is from
              managing records to operating revenue.
            </p>

            <div className="ed-figure" aria-hidden="true">
              Screenshot / graphic placeholder
            </div>
          </div>
        </section>

        {/* The Legacy CRM Tax */}
        <section className="ed-section ed-section-alt">
          <div className="ed-container ed-narrow">
            <h2>The Legacy CRM Tax</h2>
            <p>
              When companies evaluate software, they often compare monthly
              subscription prices. But the subscription is only one part of the
              equation. The larger question is what it actually costs to
              implement, maintain, and operate the system over time.
            </p>
            <p>The real cost can include:</p>
            <ul className="ed-list ed-cols">
              <li>Implementation and onboarding</li>
              <li>Employee training</li>
              <li>Custom integrations</li>
              <li>Administrative overhead</li>
              <li>Ongoing configuration</li>
              <li>Third-party tools</li>
              <li>Workflow maintenance</li>
              <li>Opportunity cost of slow, manual processes</li>
            </ul>

            <div className="ed-callout">
              Businesses are beginning to ask a different question. Instead of
              paying employees to spend hours maintaining software, can software
              help employees generate more revenue? Organizations aren't simply
              looking for another CRM. They're looking for a better operating
              model.
            </div>
          </div>
        </section>

        {/* 48 Hours vs 48 Days */}
        <section className="ed-section">
          <div className="ed-container ed-narrow">
            <h2>48 Hours vs. 48 Days</h2>
            <p>
              Speed has become a competitive advantage. Businesses don't want to
              wait months before seeing value from new technology. That's the
              philosophy behind Cortexa Agentic AI Revenue OS: a streamlined
              onboarding designed to help businesses get started in days, not
              stretch projects into extended implementation cycles.
            </p>
            <div className="ed-stat-row">
              <div className="ed-stat">
                <Clock size={22} />
                <span className="ed-stat-num">48 Hours</span>
                <span className="ed-stat-cap">Cortexa: get started fast</span>
              </div>
              <div className="ed-stat ed-stat-muted">
                <span className="ed-stat-num">48 Days</span>
                <span className="ed-stat-cap">Legacy: plan, configure, wait</span>
              </div>
            </div>
            <p className="ed-muted">
              The goal isn't simply faster implementation. It's reaching business
              value sooner. Companies invest in technology because they want
              better sales performance. The sooner those improvements begin, the
              sooner the investment starts producing value.
            </p>
          </div>
        </section>

        {/* Transparent Setup */}
        <section className="ed-section ed-section-alt">
          <div className="ed-container ed-narrow">
            <h2>Transparent Setup</h2>
            <p>
              Traditional enterprise projects can involve significant upfront
              implementation costs. Cortexa takes a different approach: a simple,
              transparent starting point designed to reduce friction.
            </p>
            <div className="ed-price-callout">
              <BadgeCheck size={26} />
              <div>
                <span className="ed-price-num">$97</span>
                <span className="ed-price-cap">One-time setup fee</span>
              </div>
            </div>
            <p className="ed-muted">
              Transparent pricing is only part of the equation. Businesses also
              want predictable deployments, clear expectations, and the ability to
              evaluate a new platform without committing to a large implementation
              project before seeing results.
            </p>
          </div>
        </section>

        {/* Unified platform vs a stack of tools */}
        <section className="ed-section">
          <div className="ed-container ed-narrow">
            <h2>One platform vs a stack of tools</h2>
            <p>
              Legacy setups often mean paying for several tools and the ongoing
              work to keep them connected. An AI-native platform brings the
              pieces together, so more of what you need is included rather than
              bolted on.
            </p>
            <div className="ed-table-wrap">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>Typical legacy stack</th>
                    <th className="ed-table-cortexa">Cortexa</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((r) => (
                    <tr key={r.cap}>
                      <td>{r.cap}</td>
                      <td className="ed-td-muted">{r.legacy}</td>
                      <td className="ed-table-cortexa">
                        {r.cortexa === true ? (
                          <span className="ed-td-yes">
                            <Check size={15} /> Included
                          </span>
                        ) : (
                          r.cortexa
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="ed-muted ed-table-note">
              Legacy notes reflect how these capabilities are commonly tiered or
              sold as add-ons. Your actual plan may vary.
            </p>
          </div>
        </section>

        {/* Calculator intro + embed */}
        <section className="ed-section ed-section-alt">
          <div className="ed-container ed-narrow">
            <h2>What Is Your CRM Really Costing You?</h2>
            <p>
              Before making any technology decision, it's worth looking beyond
              the monthly subscription. Looking only at subscription pricing
              rarely tells the whole story. The real investment often includes
              implementation, consulting, administration, maintenance,
              integrations, and the ongoing effort required to keep the system
              operating efficiently.
            </p>
            <p className="ed-pull">
              Sometimes the biggest expense isn't the software itself. It's
              everything required to keep it running.
            </p>
          </div>

          <div className="ed-container">
            <HiddenCostCalculator />
          </div>
        </section>

        {/* Closing */}
        <section className="ed-section ed-section-dark">
          <div className="ed-container ed-narrow">
            <h2>The Next Generation of Revenue Operations</h2>
            <p>
              Businesses searching for CRM software today aren't simply looking
              for another database. They're researching and comparing before they
              decide. And they're asking a different question than they did a few
              years ago. Not "which CRM has the most features," but "which
              platform will help us generate more revenue with less manual work?"
            </p>
            <p>
              The goal is no longer to simply manage customer relationships. It's
              to help businesses qualify leads, automate conversations, support
              appointment booking, streamline follow-up, and operate revenue more
              intelligently.
            </p>
            <p className="ed-pull ed-pull-light">
              The future may belong to the platform that helps businesses spend
              less time managing software and more time growing revenue.
            </p>
            <div className="ed-hero-actions">
              <Link
                to="/trial"
                className="ed-btn ed-btn-primary"
                onClick={ctaTrial("closing_trial")}
              >
                <Zap size={18} fill="currentColor" /> Start with Cortexa for $97
              </Link>
              <Link
                to="/pricing"
                className="ed-btn ed-btn-ghost ed-btn-ghost-light"
                onClick={ctaTrial("closing_pricing")}
              >
                See plans
              </Link>
            </div>
          </div>
        </section>

        {/* Roadmap placeholders (future phases) */}
        <section className="ed-section">
          <div className="ed-container ed-narrow">
            <div className="ed-roadmap">
              <span className="ed-roadmap-tag">Coming next in this editorial</span>
              <div className="ed-roadmap-grid">
                <div className="ed-roadmap-item">Lead Leakage Calculator</div>
                <div className="ed-roadmap-item">
                  AI-assisted follow-up &amp; WhatsApp workflows
                </div>
                <div className="ed-roadmap-item">
                  Switching &amp; migration, common concerns
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="ed-footer">
        <div className="ed-container ed-footer-inner">
          <img src={footlogo} alt="Cortexa" className="ed-footlogo" />
          <div className="ed-footer-links">
            <Link to="/pricing">Pricing</Link>
            <Link to="/features">Features</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy-policy">Privacy</Link>
          </div>
          <span className="ed-footer-note">
            <ShieldCheck size={14} /> Estimates are illustrative and editable.
          </span>
        </div>
      </footer>
    </div>
  );
}
