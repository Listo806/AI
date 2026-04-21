import { useState } from "react";
import "./Landing.css";

import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import sec2Img from "../../assets/cortexa/Cortexa sec 2.png";
import sec3Img from "../../assets/cortexa/Cortexa sec 3.png";
import sec4Img from "../../assets/cortexa/Cortexa sec 4.png";
import bottomImg from "../../assets/cortexa/Cortexa sec bottom.png";
import footerImg from "../../assets/cortexa/Cortexa sec footer.png";

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
      <p className="top-head">Meet Your AI CRM. Maximize human productivity with your custom AI teammates.</p>
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
            
            <a href="#trial" className="cx-btn cx-btn-primary small">
              Start Free Trial
            </a>
            <a href="/sign-in" className="cx-login">Log in</a>
          </div>

        </div>
      </header>  
      <div className="cx-wrap-full">

        {/* ================= HERO ================= */}
        <section id="features" className="cx-hero">
            <img src={heroImg} alt="" />
        </section>
        <section className="cx-comp cx-center pt-20">
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
        <section id="ai-setter" className="cx-hero">
            <img src={sec2Img} alt="" />
        </section>
        <section id="whatsapp" className="cx-hero">
            <img src={sec3Img} alt="" />
        </section>
        <section id="pricing" className="cx-hero">
            <img src={sec4Img} alt="" />
        </section>
        <section className="cx-strip pt-20">
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
        <section className="cx-section pt-20">
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
        <section className="cx-trust cx-center pt-20">
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
        <section className="cx-faq cx-center pt-20">
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
        <section id="trial" className="cx-hero">
            <img src={bottomImg} alt="" />
        </section>
        <section id="footer" className="cx-hero">
            <img src={footerImg} alt="" />
        </section>
      </div>
     
    </div>
  );
}