import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Calculator,
  LineChart,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { trackEvent } from "../../utils/track";
import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import whyImg from "../../assets/cortexa/why.jpg";
import why1Img from "../../assets/cortexa/why1.jpg";
import why2Img from "../../assets/cortexa/why2.jpg";
import why3Img from "../../assets/cortexa/why3.jpg";
import why4Img from "../../assets/cortexa/why4.jpg";
import why5Img from "../../assets/cortexa/why5.jpg";
import why6Img from "../../assets/cortexa/why5.jpg";
import CostComparison from "./CostComparison";
import "./Editorial.css";

const ARTICLE_SECTIONS = [
  { id: "legacy-crm", label: "The End of Legacy CRM?" },
  {
    id: "revenue-operations",
    label: "From Customer Relationship Management to Revenue Operations",
  },
  { id: "legacy-crm-tax", label: "The Legacy CRM Tax" },
  {
    id: "different-question",
    label: "Businesses Are Asking a Different Question",
  },
  { id: "transparent-setup", label: "Transparent Setup" },
  { id: "business-value", label: "Reaching Business Value Sooner" },
  {
    id: "one-platform",
    label: "One Platform vs. a Stack of Disconnected Tools",
  },
  {
    id: "crm-cost",
    label: "What Is Your CRM Really Costing You?",
  },
  { id: "migration", label: "Switching Doesn’t Have to Be Difficult" },
  { id: "forward-momentum", label: "From Follow-Up to Forward Momentum" },
  { id: "team-workspace", label: "Your Team, Connected Around Revenue" },
  { id: "reporting", label: "Reporting That Turns Into Revenue" },
  {
    id: "businesses",
    label: "Built for Businesses of Every Size and Industry",
  },
  { id: "dont-get-left-behind", label: "Don’t Get Left Behind" },
  {
    id: "next-generation",
    label: "The Next Generation of Revenue Operations",
  },
];

function EditorialVisual({ label, variant = "dashboard", children }) {
  return (
    <figure className={`ed-visual ed-visual-${variant}`}>
      <div className="ed-visual-inner">
        {children || (
          <>
            <span className="ed-visual-kicker">Cortexa editorial visual</span>
            <strong>{label}</strong>
            <span className="ed-visual-note">
              Replace this block with the approved Cortexa image.
            </span>
          </>
        )}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function CtaCard({ where }) {
  return (
    <div className="ed-cta-card">
      <span className="ed-cta-eyebrow">Ready to move beyond legacy CRM?</span>
      <h3>See how Cortexa helps turn conversations into revenue.</h3>

      <div className="ed-cta-rule" />

      <ul className="ed-cta-benefits">
        <li>
          <MessageSquareText size={21} />
          <span>
            <strong>AI-Powered Conversations</strong>
            Engage leads instantly across any channel.
          </span>
        </li>
        <li>
          <CalendarDays size={21} />
          <span>
            <strong>Automated Appointments</strong>
            Qualify leads and book meetings automatically.
          </span>
        </li>
        <li>
          <LineChart size={21} />
          <span>
            <strong>Revenue Intelligence</strong>
            See what is working and where to focus next.
          </span>
        </li>
        <li>
          <Users size={21} />
          <span>
            <strong>Built for Growth</strong>
            Scale your team and revenue without the chaos.
          </span>
        </li>
      </ul>

      <Link
        to="/trial"
        className="ed-cta-primary"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "trial" })
        }
      >
        Start your free trial
      </Link>

      <Link
        to="/pricing"
        className="ed-cta-secondary"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "plans" })
        }
      >
        View plans <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function Contents({ activeId, onNavigate }) {
  return (
    <nav className="ed-contents" aria-label="Article contents">
      <span className="ed-contents-title">[ Contents ]</span>
      <ol>
        {ARTICLE_SECTIONS.map((section, index) => (
          <li
            key={section.id}
            className={activeId === section.id ? "is-active" : ""}
          >
            <a href={`#${section.id}`} onClick={() => onNavigate(section.id)}>
              <span>{index + 1}.</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function EditorialFunnel() {
  const [activeId, setActiveId] = useState(ARTICLE_SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sectionIds = useMemo(
    () => ARTICLE_SECTIONS.map((section) => section.id),
    []
  );

  useEffect(() => {
    trackEvent("editorial_view", { page: "why_legacy_crm" });
  }, []);

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0, 0.15, 0.35, 0.65],
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="ed-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to="/" className="ed-brand" aria-label="Cortexa home">
            
          </Link>

          <nav className="ed-main-nav" aria-label="Editorial navigation">
            <a href="#one-platform">Platform</a>
            <a href="#forward-momentum">Solutions</a>
            <a href="#migration">Resources</a>
            <a href="#businesses">Company</a>
            <a href="#crm-cost">Pricing</a>
          </nav>

          <Link
            to="/trial"
            className="ed-header-cta"
            onClick={() =>
              trackEvent("editorial_cta_click", {
                where: "header",
                cta: "trial",
              })
            }
          >
            Start free trial
          </Link>

          <button
            type="button"
            className="ed-menu-button"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="ed-mobile-nav">
            <a href="#one-platform" onClick={closeMobileNav}>Platform</a>
            <a href="#forward-momentum" onClick={closeMobileNav}>Solutions</a>
            <a href="#migration" onClick={closeMobileNav}>Resources</a>
            <a href="#businesses" onClick={closeMobileNav}>Company</a>
            <a href="#crm-cost" onClick={closeMobileNav}>Pricing</a>
            <Link to="/trial" onClick={closeMobileNav}>Start free trial</Link>
          </div>
        )}
      </header>

      <main>
        <div className="ed-breadcrumb-wrap">
          <div className="ed-breadcrumb">
            <span>Editorial</span>
            <b>/</b>
            <span>Legacy CRMs</span>
          </div>
        </div>

        <section className="ed-hero" id="legacy-crm">
          <div className="ed-hero-heading">
            <h1>The End of Legacy CRM?</h1>

            <p className="ed-byline">
              July 24, 2026 by <strong>Julian S.</strong>
              <span>|</span>
              <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
              <span>,</span>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <span>|</span>
              Last reviewed: July 24, 2026
            </p>
          </div>

          <div className="ed-hero-divider" aria-hidden="true" />

          <div className="ed-hero-cover">
            <div className="ed-hero-cover-frame">
              <p>
                Why Businesses Are <br /> Re-Evaluating Salesforce,<br />  HubSpot, and the Rise<br /> 
                of Agentic AI Revenue<br />  Operating Systems
              </p>
            </div>
          </div>
        </section>

        <div className="ed-layout">
          <aside className="ed-contents-column">
            <div className="ed-sticky-column">
              <Contents
                activeId={activeId}
                onNavigate={(id) => setActiveId(id)}
              />
            </div>
          </aside>

          <article className="ed-article">
            <section className="ed-section ed-introduction">
              <p>
                For nearly two decades, platforms like Salesforce and HubSpot
                helped define what customer relationship management looked like.
                They gave businesses a place to organize contacts, manage
                pipelines, and keep track of customer interactions. They became
                the standard for sales organizations around the world.
              </p>
              <p>But business has changed.</p>
              <p>
                Customers expect instant responses. Sales teams are expected to
                move faster than ever. AI has gone from being a novelty to
                becoming a practical business tool. Yet many organizations still
                rely on systems originally designed to record activity rather
                than actively help move opportunities forward.
              </p>
              <p>As a result, more companies are asking a different question:</p>
              <blockquote>
                Is our CRM helping us grow—or are we spending too much time
                managing it?
              </blockquote>
              <p>
                That question has sparked a broader conversation across the
                industry. Businesses are evaluating whether traditional CRM
                platforms remain the best fit for an AI-driven sales environment,
                or whether newer AI-native platforms can simplify operations and
                accelerate growth.
              </p>
              <p>
                This isn’t about whether Salesforce or HubSpot are “bad” products.
                They’re mature platforms with broad capabilities and large
                ecosystems. The question is whether every business needs that
                level of complexity—or whether a different approach is a better
                match for today’s pace of business.
              </p>
              <p>The next generation isn’t focused solely on storing customer data.</p>
              <p><strong>It’s focused on helping teams generate revenue.</strong></p>
              <p>
                That’s where Agentic AI Revenue Operating Systems enter the
                conversation.
              </p>
              <p>
                Instead of requiring sales teams to spend hours updating records,
                juggling multiple tools, and manually following up with every
                lead, AI-native systems are designed to automate repetitive work,
                keep conversations moving, and support sales teams throughout the
                customer journey.
              </p>
              <p>The shift isn’t from one CRM vendor to another.</p>
              <blockquote>
                The shift is from managing records to operating revenue.
              </blockquote>

              <img src={whyImg} alt="CORTEXA" className="background" />
              <figcaption>Cortexa Revenue Intelligence dashboard</figcaption>
            </section>

            <section className="ed-section" id="revenue-operations">
              <h2>From Customer Relationship Management to Revenue Operations</h2>
              <p>Legacy CRM platforms were built to organize information.</p>
              <p>The next generation is being built to help businesses generate revenue.</p>
              <p>
                Traditional CRM systems excel at storing contacts, tracking
                opportunities, and documenting what happened yesterday.
              </p>
              <p>
                Modern AI-native Revenue Operating Systems are designed to help
                businesses decide what should happen next.
              </p>
              <p>Instead of simply storing leads, businesses are asking:</p>
              <ul>
                <li>Can AI qualify them?</li>
                <li>Can AI keep conversations moving?</li>
                <li>Can AI help automate follow-up?</li>
                <li>Can AI help book appointments?</li>
                <li>Can AI help teams generate more revenue with less manual work?</li>
              </ul>
              <p>
                The conversation is no longer about adding AI features to a CRM.
              </p>
              <p>
                It’s about building a business around AI-assisted revenue
                operations.
              </p>

              <img src={why1Img} alt="CORTEXA" className="background" />
              <figcaption>AI Agent qualification and automated appointment booking</figcaption>
            </section>

            <section className="ed-section" id="legacy-crm-tax">
              <h2>The Legacy CRM Tax</h2>
              <p>
                When companies evaluate software, they often compare monthly
                subscription prices.
              </p>
              <p>But the subscription is only one part of the equation.</p>
              <p>The larger question is:</p>
              <blockquote>
                What does it actually cost to implement, maintain, and operate
                the system over time?
              </blockquote>
              <p>
                Many businesses discover that the true cost of ownership includes
                far more than the monthly license. Depending on the platform,
                deployment and ongoing operations can involve implementation work,
                consulting, integrations, administrator time, employee training,
                and continued maintenance.
              </p>
              <p>Think of it as the Legacy CRM Tax.</p>
              <p>
                Not because every organization experiences every cost, but because
                the total investment often extends well beyond the software
                subscription itself.
              </p>
              <p>The real cost can include:</p>
              <ul className="ed-two-column-list">
                <li>Implementation and onboarding</li>
                <li>Employee training</li>
                <li>Custom integrations</li>
                <li>Administrative overhead</li>
                <li>Ongoing configuration</li>
                <li>Third-party tools</li>
                <li>Workflow maintenance</li>
                <li>Opportunity costs created by slow or manual processes</li>
              </ul>
              <p>
                Every hour spent maintaining software is an hour that isn’t spent
                serving customers or closing business.
              </p>
            </section>

            <section className="ed-section" id="different-question">
              <h2>Businesses Are Asking a Different Question</h2>
              <p>Businesses are beginning to ask a different question.</p>
              <p>
                Instead of paying employees to spend hours maintaining software...
              </p>
              <blockquote>Can software help employees generate more revenue?</blockquote>
              <p>
                That shift in thinking is one of the biggest reasons AI-native
                platforms are gaining attention across industries.
              </p>
              <p>Organizations aren’t simply looking for another CRM.</p>
              <p>They’re looking for a better operating model.</p>
              <blockquote className="ed-pull-quote">
                Businesses aren’t simply looking for another CRM. They’re looking
                for a better operating model.
              </blockquote>

              <img src={why2Img} alt="CORTEXA" className="background" />
              <figcaption>AI WhatsApp and automated customer conversations</figcaption>
            </section>

            <section className="ed-section" id="transparent-setup">
              <h2>Transparent Setup</h2>
              <p>
                Traditional enterprise software projects can involve significant
                upfront implementation costs, depending on the organization’s
                size, customizations, and deployment requirements.
              </p>
              <p>Cortexa takes a different approach.</p>

              <aside className="ed-editorial-callout" aria-label="One-time setup fee">
                <span className="ed-editorial-callout-label">
                  One-time setup fee
                </span>
                <p>
                  Cortexa begins with a simple <strong>$97 one-time setup fee</strong>,
                  giving businesses a transparent starting point without turning
                  onboarding into a large implementation project.
                </p>
              </aside>

              <p>
                A simple, transparent starting point designed to reduce friction
                and help businesses begin using an AI-native Revenue Operating
                System without committing to a large upfront implementation
                project.
              </p>
              <p>Transparent pricing is only part of the equation.</p>
              <p>Businesses also want predictable deployments.</p>
              <p>Clear expectations.</p>
              <p>Minimal surprises.</p>
              <p>
                And the ability to evaluate a new platform without committing to
                a large implementation project before seeing results.
              </p>
            </section>

            <section className="ed-section" id="business-value">
              <h2>Reaching Business Value Sooner</h2>
              <p>The goal isn’t simply faster implementation.</p>
              <p>It’s reaching business value sooner.</p>
              <p>
                Companies don’t buy software because they enjoy implementing
                software.
              </p>
              <p>
                They invest in technology because they want better sales
                performance, better customer experiences, and better operational
                efficiency.
              </p>
              <p>
                The sooner those improvements begin, the sooner the investment
                starts producing value.
              </p>

              <img src={why3Img} alt="CORTEXA" className="background" />
              <figcaption>Fast onboarding and WhatsApp QR connection</figcaption>
            </section>

            <section className="ed-section" id="one-platform">
              <h2>One Platform vs. a Stack of Disconnected Tools</h2>
              <p>
                Legacy systems often grow into several tools and add-ons that
                businesses must separately maintain, connect, and pay for.
              </p>
              <p>
                Cortexa brings the core revenue workflow together inside one
                connected platform.
              </p>
            </section>

            <section className="ed-section ed-cost-section" id="crm-cost">
              <div className="ed-cost-intro">
                <span className="ed-cost-kicker">[ The Real Cost ]</span>

                <h2>What Is Your CRM Really Costing You?</h2>

                <div className="ed-cost-rule" aria-hidden="true" />

                <h3>Monthly subscriptions are just the beginning.</h3>

                <p>
                  Comparing software subscriptions only tells part of the story.
                  See how Salesforce, HubSpot, and Cortexa compare across
                  implementation costs, AI capabilities, team collaboration, and
                  estimated Year 1 investment.
                </p>

                <div className="ed-cost-note">
                  <span className="ed-cost-note-icon" aria-hidden="true">
                    <Calculator size={37} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>
                      The numbers below reflect estimated total Year 1 investment
                      for a team of 5 users.
                    </strong>
                    <span>See how Cortexa delivers more — for less.</span>
                  </div>
                </div>
              </div>

              <div className="ed-comparison-transition">
                <span>Cost comparison</span>
                <h3>The Numbers Tell the Story</h3>
                <p>
                  Now let’s compare the estimated Year 1 investment—not only the
                  monthly subscription.
                </p>
              </div>

              <div className="ed-comparison-wrap">
                <CostComparison />
              </div>

              <p>
                Before making any technology decision, it’s worth looking beyond
                the monthly subscription.
              </p>
              <p>
                Looking only at monthly subscription pricing rarely tells the
                whole story.
              </p>
              <p>
                The real investment often includes implementation, consulting,
                administration, maintenance, integrations, and the ongoing effort
                required to keep the system operating efficiently.
              </p>
              <p>
                That’s exactly why businesses need to compare more than software
                prices.
              </p>
              <p>Not simply the monthly subscription...</p>
              <p>But the total cost of operating the CRM.</p>
              <p>The broader cost can include:</p>
              <ul className="ed-two-column-list">
                <li>Initial setup</li>
                <li>Consulting and implementation</li>
                <li>Training</li>
                <li>Administration</li>
                <li>Integrations</li>
                <li>Ongoing maintenance</li>
                <li>AI add-ons</li>
                <li>Operational effort</li>
              </ul>
              <p>Sometimes the biggest expense isn’t the software itself.</p>
              <blockquote>It’s everything required to keep it running.</blockquote>
            </section>

            <section className="ed-section ed-migration-section" id="migration">
              <span className="ed-section-kicker">Guided migration</span>
              <h2>Switching Doesn’t Have to Be Difficult</h2>
              <p className="ed-section-intro">
                Move from Salesforce, HubSpot, Jira, or ClickUp without starting
                over. Cortexa’s guided migration process helps bring your contacts,
                pipelines, projects, tasks, and workflows into one connected
                AI-powered platform.
              </p>

              <ul className="ed-migration-checklist">
                <li>Import contacts and customer data</li>
                <li>Import pipelines and opportunities</li>
                <li>Import projects and tasks</li>
                <li>Configure AI Agents and workflows</li>
                <li>Connect your integrations</li>
                <li>Get your team ready to work</li>
              </ul>
            </section>

            <section className="ed-section" id="forward-momentum">
              <h2>From Follow-Up to Forward Momentum</h2>
              <p>
                The value of an AI-native Revenue Operating System is not simply
                that it stores customer information.
              </p>
              <p>It helps keep opportunities moving.</p>
              <p>
                Cortexa’s AI can respond to new conversations, qualify leads,
                automate follow-up, support appointment booking, and hand the
                conversation to a team member when human assistance is needed.
              </p>
              <p>
                Instead of relying entirely on employees to remember every
                follow-up, the system helps ensure that opportunities continue
                moving through the revenue process.
              </p>
              <p>AI handles the repetitive work.</p>
              <p>
                Your team focuses on the conversations and decisions that require
                human attention.
              </p>

              <img src={why4Img} alt="CORTEXA" className="background" />
            </section>

            <section className="ed-section" id="team-workspace">
              <h2>Your Team, Connected Around Revenue</h2>
              <p>Revenue does not move through one department alone.</p>
              <p>
                Sales, service, management, operations, and support often need
                visibility into the same conversations, appointments, tasks,
                files, and opportunities.
              </p>
              <p>
                Cortexa’s Team Revenue Workspace gives teams a connected
                environment where they can collaborate, assign work, share
                information, monitor activity, and keep projects moving forward.
              </p>
              <p>
                The result is less fragmentation between systems and greater
                visibility across the work that supports revenue.
              </p>

              <img src={why5Img} alt="CORTEXA" className="background" />
              <figcaption>Team Revenue Workspace</figcaption>
            </section>

            <section className="ed-section" id="reporting">
              <h2>Reporting That Turns Into Revenue</h2>
              <p>Businesses do not need more disconnected reports.</p>
              <p>They need visibility that helps them make better decisions.</p>
              <p>
                Cortexa brings performance, pipeline activity, team visibility,
                lead movement, and revenue reporting together so businesses can
                understand what is happening and determine what should happen
                next.
              </p>
              <p>The objective is not reporting for the sake of reporting.</p>
              <p>
                It is using information to identify opportunities, improve
                performance, and keep revenue moving.
              </p>

              <img src={why6Img} alt="CORTEXA" className="background" />
              <figcaption>Reporting Turns to Revenue</figcaption>
            </section>

            <section className="ed-section" id="businesses">
              <h2>Built for Businesses of Every Size and Industry</h2>
              <p>
                Whether you run a real estate company, e-commerce store, agency,
                consulting firm, insurance business, financial company, or
                another growing organization, Cortexa’s Agentic AI Revenue
                Operating System is built to help turn conversations into revenue.
              </p>
              <p>
                The core platform is ready to support businesses that depend on
                customer communication, leads, appointments, pipelines,
                analytics, and team collaboration.
              </p>
              <p>
                Industry-specific modules can be added where needed, while most
                businesses can begin using the core platform immediately.
              </p>

              
            </section>

            <section className="ed-section" id="dont-get-left-behind">
              <h2>Don’t Get Left Behind</h2>
              <p>
                See how our integrated Revenue Operating System helps businesses
                automate faster, close more opportunities, and increase revenue.
              </p>

            </section>

            <section className="ed-section" id="next-generation">
              <h2>The Next Generation of Revenue Operations</h2>
              <p>
                Businesses searching for CRM software today aren’t simply looking
                for another database.
              </p>
              <p>They’re researching.</p>
              <p>They’re comparing.</p>
              <p>
                They’re reading editorials, buyer’s guides, and industry analysis
                before making decisions.
              </p>
              <p>
                More importantly, they’re asking a different question than they
                did just a few years ago.
              </p>
              <p>They aren’t asking:</p>
              <blockquote>“Which CRM has the most features?”</blockquote>
              <p>They’re asking:</p>
              <blockquote>
                “Which platform will help us generate more revenue with less
                manual work?”
              </blockquote>
              <p>
                That’s the conversation that AI-native Revenue Operating Systems
                are beginning to change.
              </p>
              <p>
                The goal is no longer to simply manage customer relationships.
              </p>
              <p>
                The goal is to help businesses qualify leads, automate
                conversations, support appointment booking, streamline follow-up,
                and operate revenue more intelligently.
              </p>
              <p>
                The future may not belong to the CRM with the longest feature
                list.
              </p>
              <p>
                Legacy platforms were built for an era in which teams recorded
                activity after it happened. Today’s businesses need systems that
                can participate in the work itself—responding faster, maintaining
                momentum, connecting teams, and helping leaders act on revenue
                signals while opportunities are still active.
              </p>
              <p>
                That is why the shift toward an Agentic AI Revenue Operating
                System is more than a software upgrade. It is a move from passive
                record keeping to an operating model designed around action,
                speed, and measurable growth.
              </p>
              <p>
                Businesses making that transition are not abandoning customer
                relationships. They are giving their teams a more intelligent way
                to manage and grow them.
              </p>
              <blockquote className="ed-pull-quote">
                The next generation of revenue technology will help businesses
                spend less time managing software—and more time creating forward
                momentum.
              </blockquote>
            </section>

            <div className="ed-inline-cta">
              <CtaCard where="inline_mobile" />
            </div>
          </article>

          <aside className="ed-cta-column">
            <div className="ed-sticky-column">
              <CtaCard where="sidebar" />
            </div>
          </aside>
        </div>
      </main>

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