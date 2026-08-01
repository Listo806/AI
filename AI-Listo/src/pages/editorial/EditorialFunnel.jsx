import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, BadgeCheck, ShieldCheck } from "lucide-react";
import { trackEvent } from "../../utils/track";
import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import CostComparison from "./CostComparison";
import "./Editorial.css";

// The invitation-style CTA card. Lives in the sticky sidebar on desktop and as a
// single inline block on mobile. Deliberately soft: an invitation to explore,
// not a promotional banner. No pricing in the buttons.
function CtaCard({ where }) {
  return (
    <div className="ed-cta-card">
      <h3>Ready to see Cortexa in action?</h3>
      <p>
        See how an Agentic AI Revenue Operating System can help automate
        conversations, qualify leads, and turn more opportunities into revenue.
      </p>
      <Link
        to="/trial"
        className="ed-cta-primary"
        onClick={() => trackEvent("editorial_cta_click", { where, cta: "trial" })}
      >
        Start your free trial <ArrowRight size={16} />
      </Link>
      <Link
        to="/pricing"
        className="ed-cta-secondary"
        onClick={() => trackEvent("editorial_cta_click", { where, cta: "plans" })}
      >
        View plans
      </Link>
    </div>
  );
}

// Long-form buyer's guide in a premium editorial layout: a single article column
// with a quiet, sticky CTA sidebar on the right (desktop). The article is the
// focus; the sidebar simply offers a next step whenever the reader is ready.
export default function EditorialFunnel() {
  useEffect(() => {
    trackEvent("editorial_view", { page: "hidden_cost" });
  }, []);

  return (
    <div className="ed-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to="/" className="ed-brand" aria-label="Cortexa home">
            <img src={headlogo} alt="Cortexa" />
          </Link>
          <Link
            to="/trial"
            className="ed-header-cta"
            onClick={() => trackEvent("editorial_cta_click", { where: "header", cta: "trial" })}
          >
            Start free trial
          </Link>
        </div>
      </header>

      <div className="ed-layout">
        <article className="ed-article">
          {/* Opening */}
          <div className="ed-block ed-block-lead">
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
          </div>

          <div className="ed-block">
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

          <div className="ed-block">
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

          <div className="ed-block">
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
            <p>
              The goal isn't simply faster implementation. It's reaching business
              value sooner. Companies invest in technology because they want
              better sales performance. The sooner those improvements begin, the
              sooner the investment starts producing value.
            </p>
          </div>

          <div className="ed-block">
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
            <p>
              Transparent pricing is only part of the equation. Businesses also
              want predictable deployments, clear expectations, and the ability to
              evaluate a new platform without committing to a large implementation
              project before seeing results.
            </p>
          </div>

          <div className="ed-block">
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
            <div id="comparison">
              <CostComparison />
            </div>
          </div>

          <div className="ed-block">
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
            <p className="ed-pull">
              The future may belong to the platform that helps businesses spend
              less time managing software and more time growing revenue.
            </p>
          </div>

          {/* Mobile-only invitation (the sticky sidebar is desktop-only) */}
          <div className="ed-inline-cta">
            <CtaCard where="inline_mobile" />
          </div>
        </article>

        <aside className="ed-aside">
          <div className="ed-aside-sticky">
            <CtaCard where="sidebar" />
          </div>
        </aside>
      </div>

      <footer className="ed-footer">
        <div className="ed-footer-inner">
          <img src={footlogo} alt="Cortexa" className="ed-footlogo" />
          <div className="ed-footer-links">
            <Link to="/pricing">Pricing</Link>
            <Link to="/features">Features</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy-policy">Privacy</Link>
          </div>
          <span className="ed-footer-note">
            <ShieldCheck size={14} /> Estimates are illustrative.
          </span>
        </div>
      </footer>
    </div>
  );
}
