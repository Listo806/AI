import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  CircleCheckBig,
  FileText,
  FolderKanban,
  Home,
  Landmark,
  LineChart,
  Megaphone,
  Menu,
  MessageSquareText,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Stethoscope,
  Users,
  Workflow,
  Wrench,
  X,
  Zap,
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
import "./Editorial.css";

const ARTICLE_SECTIONS = [
  { id: "new-era", label: "We Have Entered a New Era" },
  { id: "old-way", label: "The Cost of Doing Business the Old Way" },
  { id: "missed-leads", label: "Every Missed Lead Represents Lost Revenue" },
  { id: "ai-rules", label: "Artificial Intelligence Changes the Rules" },
  { id: "revenue-os", label: "From CRM to AI Revenue Operating System" },
  { id: "every-industry", label: "Every Industry Can Benefit From AI" },
  {
    id: "competitive-advantage",
    label: "Businesses That Embrace AI Will Build Competitive Advantages",
  },
  { id: "introducing-cortexa", label: "Introducing Cortexa AI CRM" },
  {
    id: "team-workspace",
    label: "One Team. One Workspace. One Connected Business.",
  },
  {
    id: "move-first",
    label: "The Future Belongs to Businesses That Move First",
  },
  { id: "transform-business", label: "Ready to Transform Your Business?" },
];

function CtaCard({ where, bottom = false }) {
  return (
    <div className={`ed-cta-card ed-ai-cta-card${bottom ? " is-bottom" : ""}`}>
      <span className="ed-cta-eyebrow">Ready to grow with AI?</span>
      <h3>
        See how Cortexa helps your business operate smarter and respond faster.
      </h3>

      <div className="ed-cta-rule" />

      <ul className="ed-cta-benefits">
        <li>
          <MessageSquareText size={21} />
          <span>
            <strong>Instant Engagement</strong>
            Respond to leads and customers around the clock.
          </span>
        </li>
        <li>
          <Workflow size={21} />
          <span>
            <strong>Intelligent Automation</strong>
            Keep follow-up and workflows moving automatically.
          </span>
        </li>
        <li>
          <LineChart size={21} />
          <span>
            <strong>Revenue Visibility</strong>
            Understand performance and act on opportunities faster.
          </span>
        </li>
        <li>
          <Users size={21} />
          <span>
            <strong>Built for Every Business</strong>
            Support your team without adding operational complexity.
          </span>
        </li>
      </ul>

      <Link
        to="/trial"
        className="ed-cta-primary ed-cta-primary-blue"
        onClick={() =>
          trackEvent("editorial_cta_click", {
            page: "how_ai_is_transforming_every_business",
            where,
            cta: "trial",
          })
        }
      >
        Start your free trial
      </Link>

      <Link
        to="/pricing"
        className="ed-cta-secondary ed-view-plans-btn"
        onClick={() =>
          trackEvent("editorial_cta_click", {
            page: "how_ai_is_transforming_every_business",
            where,
            cta: "plans",
          })
        }
      >
        View Plans
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

function EditorialImage({ src, alt, caption, variant = "" }) {
  return (
    <figure className={`ed-ai-image ${variant}`}>
      <img src={src} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export default function EditorialBusinessAI() {
  const [activeId, setActiveId] = useState(ARTICLE_SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sectionIds = useMemo(
    () => ARTICLE_SECTIONS.map((section) => section.id),
    [],
  );

  useEffect(() => {
    document.title = "How AI Is Transforming Every Business | Cortexa AI CRM";

    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") || "";

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    meta.setAttribute(
      "content",
      "Discover how AI Revenue Operating Systems are transforming customer engagement, operations, and business growth across every industry.",
    );

    trackEvent("editorial_view", {
      page: "how_ai_is_transforming_every_business",
    });

    return () => {
      if (meta) meta.setAttribute("content", previousDescription);
    };
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
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="ed-page ed-ai-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to="/" className="ed-brand" aria-label="Cortexa home"></Link>

          <nav className="ed-main-nav" aria-label="Editorial navigation">
            <a href="#revenue-os">Platform</a>
            <a href="#ai-rules">Solutions</a>
            <a href="#every-industry">Resources</a>
            <a href="#introducing-cortexa">Company</a>
            <a href="#transform-business">Get Started</a>
          </nav>

          <Link
            to="/trial"
            className="ed-header-cta"
            onClick={() =>
              trackEvent("editorial_cta_click", {
                page: "how_ai_is_transforming_every_business",
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
            <a href="#revenue-os" onClick={closeMobileNav}>
              Platform
            </a>
            <a href="#ai-rules" onClick={closeMobileNav}>
              Solutions
            </a>
            <a href="#every-industry" onClick={closeMobileNav}>
              Resources
            </a>
            <a href="#introducing-cortexa" onClick={closeMobileNav}>
              Company
            </a>
            <a href="#transform-business" onClick={closeMobileNav}>
              Get Started
            </a>
            <Link to="/trial" onClick={closeMobileNav}>
              Start free trial
            </Link>
          </div>
        )}
      </header>

      <main>
        <div className="ed-breadcrumb-wrap">
          <div className="ed-breadcrumb">
            <span>Editorial</span>
            <b>/</b>
            <span>AI Business Growth</span>
          </div>
        </div>

        <section className="ed-hero ed-ai-hero">
          <div className="ed-hero-heading">
            <span className="ed-ai-hero-kicker">
              AI Business Transformation
            </span>
            <h1>
              Improve Revenue by Optimizing Your Business Operating System
            </h1>
            <p className="ed-ai-hero-subtitle">
              Why the Future Belongs to AI Revenue Operating Systems
            </p>

            <p className="ed-byline">
              August 3, 2026 by <strong>Cortexa Editorial Team</strong>
              <span>|</span>
              Last reviewed: August 3, 2026
            </p>
          </div>

          <div className="ed-hero-divider" aria-hidden="true" />

          <div className="ed-hero-cover ed-ai-hero-cover">
            <div className="ed-hero-cover-frame">
              <span className="ed-ai-cover-label">
                The next operating model
              </span>
              <p>
                Businesses are moving from manual processes and disconnected
                tools to intelligent systems that respond, automate, and grow.
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
            <section className="ed-section ed-introduction" id="new-era">
              <span className="ed-section-kicker">A new business era</span>
              <h2>We Have Entered a New Era</h2>
              <p>
                For decades, businesses relied on the same formula for growth:
                hire more employees, spend more on advertising, generate more
                leads, and hope sales teams could keep up with demand. While
                that model worked for many years, customer expectations have
                fundamentally changed.
              </p>
              <p>
                Today's customers expect immediate responses. They expect
                businesses to be available around the clock, answer questions
                instantly, follow up consistently, and provide a seamless buying
                experience. When those expectations aren't met, customers rarely
                wait—they simply move on to a competitor.
              </p>
              <p>
                Artificial intelligence is changing that equation. Instead of
                simply helping businesses work harder, AI is helping businesses
                work smarter, automating repetitive tasks, accelerating customer
                engagement, and creating opportunities that traditional systems
                often miss.
              </p>
              <blockquote className="ed-pull-quote">
                The businesses embracing AI today are not simply becoming more
                efficient—they are redefining how modern companies operate.
              </blockquote>

              <EditorialImage
                src={whyImg}
                alt="Cortexa AI business dashboard"
                caption="A connected view of customer activity, automation, pipeline, and revenue performance."
                variant="is-dashboard"
              />
            </section>

            <section className="ed-section" id="old-way">
              <h2>The Cost of Doing Business the Old Way</h2>
              <p>
                Many businesses continue operating with disconnected systems and
                manual processes.
              </p>

              <div className="ed-ai-process-list">
                <span>A lead submits a form.</span>
                <span>Hours pass before anyone responds.</span>
                <span>Phone calls are missed after business hours.</span>
                <span>
                  Sales representatives manually send follow-up emails.
                </span>
                <span>
                  Customer information is spread across spreadsheets, inboxes,
                  calendars, and multiple software platforms.
                </span>
              </div>

              <p>None of these individual problems seem catastrophic.</p>
              <p>
                Collectively, however, they create lost revenue every single
                day.
              </p>
              <p>
                Studies consistently show that businesses responding to leads
                quickly dramatically improve their chances of converting
                prospects into customers. Yet many organizations still rely on
                processes designed long before customers expected instant
                communication.
              </p>
              <blockquote>
                In today's competitive environment, speed has become a
                competitive advantage.
              </blockquote>
            </section>

            <section className="ed-section" id="missed-leads">
              <h2>Every Missed Lead Represents Lost Revenue</h2>
              <p>Every inquiry represents an opportunity.</p>

              <ul className="ed-ai-opportunity-list">
                <li>Someone visits your website.</li>
                <li>Someone submits a contact form.</li>
                <li>Someone calls your office.</li>
                <li>Someone asks a question through social media.</li>
              </ul>

              <p>
                Those interactions represent potential customers who have
                already expressed interest.
              </p>
              <p>The question becomes simple:</p>
              <blockquote>How quickly can your business respond?</blockquote>
              <p>
                If the answer is hours—or worse, the next business day—your
                competitors may already have earned that customer's business.
              </p>
              <p>
                Businesses often invest heavily in marketing to generate leads
                while unintentionally losing those same leads because follow-up
                happens too slowly.
              </p>
              <p>Revenue isn't only generated by acquiring more traffic.</p>
              <p>
                <strong>
                  Revenue is generated by converting more of the opportunities
                  you already have.
                </strong>
              </p>

              <EditorialImage
                src={why1Img}
                alt="Cortexa AI conversations and appointment automation"
                caption="AI can respond, qualify, and move interested prospects toward the next step."
                variant="is-conversation"
              />
            </section>

            <section className="ed-section" id="ai-rules">
              <span className="ed-section-kicker">Intelligent automation</span>
              <h2>Artificial Intelligence Changes the Rules</h2>
              <p>
                Artificial intelligence allows businesses to automate many of
                the repetitive tasks that traditionally required constant manual
                attention.
              </p>
              <p>
                Instead of waiting for employees to respond, AI can engage
                prospects immediately.
              </p>

              <div className="ed-ai-capability-grid">
                {[
                  ["Answer frequently asked questions", MessageSquareText],
                  ["Qualify potential customers", Sparkles],
                  ["Schedule appointments", CalendarDays],
                  ["Organize customer information", Users],
                  ["Trigger follow-up sequences", Workflow],
                  ["Notify teams about high-value opportunities", Zap],
                ].map(([label, Icon]) => (
                  <div className="ed-ai-capability" key={label}>
                    <Icon size={22} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <p>
                Rather than replacing employees, AI enables employees to spend
                more time building relationships and solving complex problems
                while automation handles routine work.
              </p>
              <blockquote>
                The result is faster response times, more consistent customer
                experiences, and greater operational efficiency.
              </blockquote>
            </section>

            <section className="ed-section" id="revenue-os">
              <h2>From CRM to AI Revenue Operating System</h2>
              <p>
                Traditional CRM software was originally designed to organize
                customer information.
              </p>
              <p>That was an important innovation.</p>
              <p>
                But organizing information alone no longer creates a competitive
                advantage.
              </p>
              <p>
                Modern businesses increasingly require systems that actively
                contribute to revenue growth.
              </p>
              <p>
                An AI Revenue Operating System goes beyond storing customer
                records.
              </p>
              <p>
                It helps businesses engage customers automatically, manage
                communication, streamline operations, and support sales teams
                with intelligent automation that operates continuously.
              </p>
              <blockquote className="ed-pull-quote">
                Instead of becoming another database, it becomes an active
                participant in business growth.
              </blockquote>

              <EditorialImage
                src={why2Img}
                alt="Cortexa unified AI Revenue Operating System"
                caption="Customer communication, AI automation, workflows, and revenue activity connected in one operating system."
                variant="is-platform"
              />
            </section>

            <section className="ed-section" id="every-industry">
              <h2>Every Industry Can Benefit From AI</h2>
              <div className="ed-ai-section-rule" aria-hidden="true" />

              <p>
                Artificial intelligence is no longer limited to technology
                companies.
              </p>
              <p>
                Businesses across nearly every industry are adopting automation
                to improve customer experience and operational performance.
              </p>

              <div className="ed-ai-industry-grid ed-ai-industry-grid-detailed">
                {[
                  {
                    icon: Home,
                    title: "Real Estate Agencies",
                    text: "Respond to inquiries instantly and close more deals.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Insurance Agencies",
                    text: "Nurture leads, automate renewals, and deliver better experiences.",
                  },
                  {
                    icon: Calculator,
                    title: "Accounting Firms",
                    text: "Automate client communication and simplify appointment scheduling.",
                  },
                  {
                    icon: Landmark,
                    title: "Financial Organizations",
                    text: "Organize client communication and stay compliant with automated workflows.",
                  },
                  {
                    icon: ShoppingCart,
                    title: "E-commerce Businesses",
                    text: "Recover more sales and delight customers.",
                  },
                  {
                    icon: Megaphone,
                    title: "Marketing Agencies",
                    text: "Qualify leads, automate campaigns, and scale results.",
                  },
                  {
                    icon: Stethoscope,
                    title: "Healthcare Providers",
                    text: "Simplify appointment booking and improve patient communication.",
                  },
                  {
                    icon: Wrench,
                    title: "Home Service Companies",
                    text: "Respond faster, schedule jobs, and keep your pipeline full every day.",
                  },
                  {
                    icon: BriefcaseBusiness,
                    title: "Consulting Firms",
                    text: "Streamline client onboarding and manage projects with greater visibility.",
                  },
                  {
                    icon: Store,
                    title: "Retail Businesses",
                    text: "Increase loyalty and drive repeat sales with personalized conversations.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <article key={title}>
                    <span className="ed-ai-industry-icon" aria-hidden="true">
                      <Icon size={34} strokeWidth={1.8} />
                    </span>
                    <span className="ed-ai-industry-divider" aria-hidden="true" />
                    <span className="ed-ai-industry-copy">
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className="ed-section" id="competitive-advantage">
              <h2>
                Businesses That Embrace AI Will Build Competitive Advantages
              </h2>
              <p>Every major technological shift creates two groups.</p>

              <div className="ed-ai-two-paths">
                <div>
                  <span>01</span>
                  <strong>Businesses that adapt early.</strong>
                </div>
                <div>
                  <span>02</span>
                  <strong>Businesses that eventually catch up.</strong>
                </div>
              </div>

              <p>
                Artificial intelligence represents one of the most significant
                shifts in business operations since cloud computing.
              </p>
              <p>
                Organizations implementing AI today are improving productivity,
                increasing responsiveness, reducing manual workloads, and
                creating better customer experiences.
              </p>
              <p>The competitive advantage isn't simply using AI.</p>
              <blockquote>
                The advantage comes from integrating AI throughout the customer
                journey.
              </blockquote>

              <EditorialImage
                src={why3Img}
                alt="Cortexa AI onboarding and business automation"
                caption="A guided path from setup to active AI-assisted operations."
                variant="is-workflow"
              />
            </section>

            <section
              className="ed-section ed-ai-intro-cortexa"
              id="introducing-cortexa"
            >
              <span className="ed-section-kicker">One connected platform</span>
              <h2>Introducing Cortexa AI CRM</h2>
              <p>Cortexa AI CRM was built around a simple idea:</p>
              <blockquote className="ed-pull-quote">
                Businesses should spend less time managing software and more
                time growing revenue.
              </blockquote>
              <p>
                Rather than requiring multiple disconnected platforms, Cortexa
                brings customer management, AI automation, communication,
                pipeline management, analytics, and business intelligence
                together in one unified platform.
              </p>
              <p>
                Instead of simply recording customer activity, the platform
                helps businesses engage, organize, and grow more effectively.
              </p>
              <p>
                Whether you're a small business, a growing company, or an
                established organization, AI can help you respond faster,
                operate more efficiently, and create stronger customer
                relationships.
              </p>

              <EditorialImage
                src={why4Img}
                alt="Cortexa AI CRM platform"
                caption="Cortexa connects AI conversations, workflows, pipeline, teams, and analytics."
                variant="is-cortexa"
              />

              <div className="ed-ai-inline-cta">
                <CtaCard where="article_middle" />
              </div>
            </section>

            <section className="ed-section ed-team-workspace-section" id="team-workspace">
              <span className="ed-section-kicker">Team Workspace</span>
              <h2>
                The Future of Team Collaboration
              </h2>

              <div className="ed-team-workspace-rule" aria-hidden="true" />

              <p>Growing businesses need more than a CRM.</p>
              <p>
                They need a shared workspace where every department can
                collaborate without switching between disconnected tools,
                spreadsheets, emails, calendars, and multiple applications.
              </p>

              <ul className="ed-team-needs">
                <li>
                  <CircleCheckBig size={20} aria-hidden="true" />
                  <span>
                    <strong>Sales teams</strong> need to manage opportunities.
                  </span>
                </li>
                <li>
                  <CircleCheckBig size={20} aria-hidden="true" />
                  <span>
                    <strong>Marketing teams</strong> need campaign visibility.
                  </span>
                </li>
                <li>
                  <CircleCheckBig size={20} aria-hidden="true" />
                  <span>
                    <strong>Managers</strong> need real-time business insights.
                  </span>
                </li>
                <li>
                  <CircleCheckBig size={20} aria-hidden="true" />
                  <span>
                    <strong>Customer support teams</strong> need complete
                    customer history.
                  </span>
                </li>
                <li>
                  <CircleCheckBig size={20} aria-hidden="true" />
                  <span>
                    <strong>Operations teams</strong> need organized workflows
                    that keep projects, people, and business processes moving
                    forward.
                  </span>
                </li>
              </ul>

              <div className="ed-team-workspace-highlight">
                <span className="ed-team-workspace-highlight-icon" aria-hidden="true">
                  <Users size={34} strokeWidth={1.8} />
                </span>
                <p>
                  <strong>
                    Cortexa brings Team Workspace directly into your AI Revenue
                    Operating System,
                  </strong>{" "}
                  connecting your people, customers, projects, workflows, and AI
                  Agent inside one intelligent platform.
                </p>
              </div>

              <p>
                Instead of separating collaboration from customer management and
                revenue operations, every part of your business works together
                from one connected workspace.
              </p>
              <p>
                <strong>Cortexa Team Workspace</strong> brings your AI Agent,
                customer conversations, leads, pipelines, appointments, notes,
                documents, tasks, projects, workflows, analytics, and team
                collaboration together in one connected platform.
              </p>
              <p>
                Instead of switching between multiple applications, every
                department works from the same shared workspace.
              </p>

              <ul className="ed-team-workspace-items">
                <li>
                  <MessageSquareText size={23} aria-hidden="true" />
                  <span><strong>Conversations</strong> stay connected.</span>
                </li>
                <li>
                  <FolderKanban size={23} aria-hidden="true" />
                  <span><strong>Projects</strong> stay organized.</span>
                </li>
                <li>
                  <CircleCheckBig size={23} aria-hidden="true" />
                  <span><strong>Tasks</strong> move forward.</span>
                </li>
                <li>
                  <FileText size={23} aria-hidden="true" />
                  <span>
                    <strong>Documents</strong> stay attached to the right
                    opportunity.
                  </span>
                </li>
              </ul>

              <p>
                Your AI Agent keeps everyone informed with real-time activity,
                recommendations, reminders, and business insights that help your
                team focus on what matters most.
              </p>
              <p>
                Whether your team is managing customers, projects, internal
                operations, or business growth, everyone works from the same
                information, the same workflows, and the same business
                objectives.
              </p>

              <blockquote className="ed-pull-quote">
                That’s how modern businesses collaborate faster, stay organized,
                and grow together.
              </blockquote>
            </section>

            <section className="ed-section" id="move-first">
              <h2>The Future Belongs to Businesses That Move First</h2>
              <p>Artificial intelligence is no longer an emerging trend.</p>
              <p>
                It is becoming a core component of modern business operations.
              </p>
              <p>
                The question is no longer whether AI will change how businesses
                grow.
              </p>
              <p>
                The question is whether businesses will embrace that change
                before competitors do.
              </p>
              <p>
                Companies that adopt intelligent automation today position
                themselves to serve customers better, improve operational
                efficiency, and create sustainable long-term growth.
              </p>
              <p>
                The future of business won't simply belong to companies that
                work harder.
              </p>
              <blockquote className="ed-pull-quote">
                It will belong to companies that work smarter.
              </blockquote>

              <EditorialImage
                src={why5Img}
                alt="Cortexa team and revenue workspace"
                caption="AI-supported teams can work from one shared view of conversations, tasks, pipeline, and performance."
                variant="is-team"
              />
            </section>

            <section
              className="ed-section ed-ai-final-section"
              id="transform-business"
            >
              <span className="ed-section-kicker">Your next step</span>
              <h2>Ready to Transform Your Business?</h2>
              <p>
                Whether your goal is generating more leads, responding faster,
                automating repetitive tasks, or building a more efficient
                organization, an AI Revenue Operating System can help position
                your business for long-term growth.
              </p>
              <p>
                Discover how Cortexa AI CRM can help your business operate
                smarter, respond faster, and grow with AI.
              </p>

              <div className="ed-ai-final-callout">
                <Bot size={32} />
                <div>
                  <strong>Start Your Free Trial Today.</strong>
                  <span>
                    Put AI-powered conversations, automation, and revenue
                    intelligence to work for your business.
                  </span>
                </div>
              </div>

              <CtaCard where="article_bottom" bottom />
            </section>
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
            <ShieldCheck size={14} /> AI-powered growth for modern businesses.
          </span>
        </div>
      </footer>
    </div>
  );
}