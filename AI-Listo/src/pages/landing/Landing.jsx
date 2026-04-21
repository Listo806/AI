import { useState } from "react";
import "./Landing.css";

import heroImg from "../../assets/cortexa/hero-dashboard.png";
import analyticsImg from "../../assets/cortexa/analytics.png";
import pipelineImg from "../../assets/cortexa/pipeline.png";
import leadImg from "../../assets/cortexa/lead.png";
import finalImg from "../../assets/cortexa/final.png";
import logoImg from "../../assets/cortexa/logo.png";
import whatsappImg from "../../assets/cortexa/whatsapp.png";
import feaImg1 from "../../assets/cortexa/featured1.png";
import feaImg2 from "../../assets/cortexa/featured2.png";
import feaImg3 from "../../assets/cortexa/featured3.png";
import feaImg4 from "../../assets/cortexa/featured4.png";

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const header = document.querySelector(".cx-header");
    const headerHeight = header ? header.offsetHeight : 80;

    const y =
      el.getBoundingClientRect().top +
      window.pageYOffset -
      headerHeight;

    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const faqItems = [
    {
      q: "Do I need a credit card to start?",
      a: "No. You can start your free trial without entering a credit card if you want to test the experience first.",
    },
    {
      q: "Can I manage leads from multiple channels?",
      a: "Yes. CORTEXA centralizes WhatsApp, Instagram, website forms, and more.",
    },
    {
      q: "Does CORTEXA help automate follow-ups?",
      a: "Yes. AI Auto Reply and AI Setter handle follow-ups and booking automatically.",
    },
    {
      q: "Can teams use CORTEXA together?",
      a: "Yes. Teams can collaborate, assign tasks, and track everything in real time.",
    },
    {
      q: "Is this only for real estate?",
      a: "No. It works best for real estate but also supports service and sales businesses.",
    },
  ];
  const [activeFAQ, setActiveFAQ] = useState(0);

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? -1 : index);
  };

  return (
    <div id="cortexa-ai-crm-landing">
      <header className="cx-header">
        <div className="cx-header-inner">

          <div className="cx-left">
            <img src={logoImg} alt="Cortexa" className="cx-logo-img" />
          </div>

          <nav className="cx-nav">
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("ai-setter")}>AI</button>
            <button onClick={() => scrollTo("whatsapp")}>Integrations</button>
            <button onClick={() => scrollTo("pricing")}>Pricing</button>
            <button onClick={() => scrollTo("trial")}>Resources</button>
          </nav>

          <div className="cx-actions">
            <a href="/sign-in" className="cx-login">Log in</a>
            <a href="#trial" className="cx-btn cx-btn-primary small">
              Start Free Trial
            </a>
          </div>

        </div>
      </header>  
      <div className="cx-wrap">

        {/* ================= HERO ================= */}
        <section className="cx-hero">
          <div className="cx-hero-grid">

            <div>
              <span className="cx-eyebrow">AI CRM Platform</span>

              <h1 className="cx-title-xl">
                Build a CRM your team <span className="cx-highlight">actually works from</span>
              </h1>

              <p className="cx-sub">
                Manage leads, conversations, and deals from one powerful system.
                From WhatsApp messaging to AI automation, everything is connected.
                Track performance, respond instantly, and close faster — all in one place.
              </p>

              <div className="cx-btns">
                <a href="#trial" className="cx-btn cx-btn-primary">
                  Start Your Free Trial
                </a>
              </div>

              <div className="cx-note">No credit card required</div>

              {/* PROOF (bạn đang thiếu đoạn này trước đó) */}
              <div className="cx-proof">
                <div className="cx-proof-badges">
                  <div className="cx-avatar" />
                  <div className="cx-avatar" />
                  <div className="cx-avatar" />
                  <div className="cx-avatar" />
                </div>
                <div className="cx-proof-text">
                  Loved by high-performing teams and modern real estate operators
                </div>
              </div>
            </div>

            <div className="cx-shot">
              <img
                src={heroImg}
                alt="hero"
              />
            </div>

          </div>

          {/* LOGOS ROW (bạn thiếu trước đó) */}
          <div className="cx-logos">
            {["WhatsApp", "Instagram", "Listings", "Leads", "AI Setter", "Analytics"].map((x) => (
              <div className="cx-logo" key={x}>{x}</div>
            ))}
          </div>
        </section>

        {/* ================= COMPARISON (BẠN THIẾU) ================= */}
        <section className="cx-comp cx-center">
          <h2 className="cx-title-md">
            Dashboards you work from, not just look at
          </h2>

          <div className="cx-comp-grid">

            <div className="cx-comp-col">
              <h4>Without CORTEXA</h4>
              <ul className="cx-list neg">
                <li>Leads scattered across apps and spreadsheets</li>
                <li>Slow manual follow-ups and missed messages</li>
                <li>No real-time visibility into your pipeline</li>
                <li>Hard to know what your team is doing</li>
              </ul>
            </div>

            <div className="cx-comp-col">
              <h4>With CORTEXA</h4>
              <ul className="cx-list pos">
                <li>Everything in one powerful dashboard</li>
                <li>Instant WhatsApp replies and AI automation</li>
                <li>Live pipeline updates and performance tracking</li>
                <li>Know exactly what’s happening and what to do next</li>
              </ul>
            </div>

          </div>
        </section>

        {/* ================= STACK SECTION ================= */}
        <section className="cx-stack-wrap">

          <div className="cx-center cx-grid-intro">
            <span className="cx-eyebrow">Reporting & Workflow</span>
            <h2 className="cx-title-lg">
              Reporting that actually works like your business
            </h2>
          </div>

          <div className="cx-stack-block">

            <div className="cx-stack-row">
              <div className="cx-copy">
                <span className="cx-eyebrow">Analytics</span>
                <h3 className="cx-title-md">See problems. Fix them fast.</h3>
                <p>Track leads, conversions, response times...</p>
              </div>
              <div className="cx-shot soft">
                <img src={analyticsImg} alt="" />
              </div>
            </div>

            <div className="cx-stack-row reverse">
              <div className="cx-shot soft">
                <img src={pipelineImg} alt="" />
              </div>
              <div className="cx-copy">
                <span className="cx-eyebrow">Pipeline</span>
                <h3 className="cx-title-md">One dashboard for every deal</h3>
                <p>Manage pipeline in one view...</p>
              </div>
            </div>

            <div className="cx-stack-row">
              <div className="cx-copy">
                <span className="cx-eyebrow">Collaboration</span>
                <h3 className="cx-title-md">Share everything easily</h3>
                <p>Team visibility in real time...</p>
              </div>
              <div className="cx-shot soft">
                <img src={leadImg} alt="" />
              </div>
            </div>

          </div>
        </section>

        {/* ================= STRIP CTA ================= */}
        <section className="cx-strip">
          <div className="cx-strip-inner">
            <div>
              <h2 className="cx-title-md" style={{ color: "#fff" }}>
                Your CRM shouldn’t slow you down.
              </h2>

              <p className="cx-sub">
                Join teams using CORTEXA...
              </p>

              <div className="cx-btns">
                <a href="#trial" className="cx-btn cx-btn-primary">
                  Start Free Trial
                </a>
              </div>
            </div>

            <div className="cx-phone">
              <img src={whatsappImg} alt="" />
            </div>
          </div>
        </section>

        {/* ================= AI FEATURES ================= */}
        <section className="cx-section">
          <div className="cx-center cx-grid-intro">
            <h2 className="cx-title-lg">Turn your data into decisions</h2>
          </div>

          <div className="cx-grid4">
              {[
                {
                  eyebrow: "AI Assistant",
                  title: "Instant answers from your dashboard",
                  desc:
                    "Get insights, summaries, and recommendations in seconds. Ask anything about your leads, pipeline, properties, or team performance.",
                  img: feaImg1,
                  alt: "CORTEXA AI assistant",
                },
                {
                  eyebrow: "Analytics",
                  title: "Track performance in real time",
                  desc:
                    "Monitor conversion rates, response times, and activity across your business. Know what’s working and where to improve instantly.",
                  img: feaImg2,
                  alt: "CORTEXA performance analytics",
                },
                {
                  eyebrow: "AI Auto Reply",
                  title: "Automate your follow-ups",
                  desc:
                    "Never miss a lead. Send instant, personalized replies across your channels and nurture opportunities automatically.",
                  img: feaImg3,
                  alt: "CORTEXA AI auto reply",
                },
                {
                  eyebrow: "AI Setter",
                  title: "Close deals faster with AI",
                  desc:
                    "AI qualifies leads, books appointments, and moves opportunities forward while your team focuses on closing.",
                  img: feaImg4,
                  alt: "CORTEXA AI setter",
                },
              ].map((item, index) => (
                <div className="cx-card" key={index}>
                  <div>
                    <span className="cx-eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>

                  <div className="cx-shot">
                    <img src={item.img} alt={item.alt} />
                  </div>
                </div>
              ))}
            </div>
        </section>

        {/* ================= TRUST ================= */}
        <section className="cx-trust cx-center">
          <h2 className="cx-title-md">Built to operate with confidence</h2>

          <div className="cx-trust-grid">

            {[
              ["Secure workflows"],
              ["Live performance visibility"],
              ["Scalable system"],
              ["AI-driven efficiency"]
            ].map(([t]) => (
              <div className="cx-trust-item" key={t}>
                <h4>{t}</h4>
              </div>
            ))}

          </div>
        </section>

        {/* ================= FAQ (FIXED REACT VERSION) ================= */}
        <section className="cx-faq cx-center">
          <h2 className="cx-title-lg">FAQs</h2>

          <div className="cx-faq-list">

            {[
              ["Do I need a credit card?", "No credit card required."],
              ["Can I manage leads?", "Yes across all channels."],
              ["Does it automate follow-ups?", "Yes AI handles it."],
              ["Can teams use it?", "Yes multi-user support."],
              ["Is it only for real estate?", "Works for many industries."]
            ].map((item, index) => (
              <div
                className={`cx-faq-item ${activeFAQ === index ? "active" : ""}`}
                key={index}
              >
                <button
                  className="cx-faq-q"
                  onClick={() => toggleFAQ(index)}
                >
                  {item[0]} <span>+</span>
                </button>

                {activeFAQ === index && (
                  <div className="cx-faq-a">
                    {item[1]}
                  </div>
                )}
              </div>
            ))}

          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="cx-final" id="trial">
          <div className="cx-final-box">

            <h2 className="cx-title-lg" style={{ color: "#fff" }}>
              Start closing more deals with CORTEXA
            </h2>

            <p className="cx-sub">
              One powerful AI CRM for leads, WhatsApp, automation...
            </p>

            <a className="cx-btn cx-btn-secondary">
              Start Free Trial
            </a>
            <div className="cx-final-shot">
              <img src={finalImg} alt="" />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}