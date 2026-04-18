import { useState } from 'react';
import './Landing.css';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import heroImg from "../../assets/cortexa/hero-dashboard.png";
import analyticsImg from "../../assets/cortexa/analytics.png";
import pipelineImg from "../../assets/cortexa/pipeline.png";
import leadImg from "../../assets/cortexa/lead.png";
import finalImg from "../../assets/cortexa/final.png";
import logoImg from "../../assets/cortexa/logo.png";

export default function Landing() {
  const scrollTo = (id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const header = document.querySelector(".cx-header");
      const headerHeight = header ? header.offsetHeight : 80;

      const y =
        el.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight;

      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      });
    };

  return (
    <div id="cortexa-ai-crm-landing">

      {/* HEADER */}
      <header className="cx-header">
          <div className="cx-header-inner">

            {/* LEFT */}
            <div className="cx-left">
              <img src={logoImg} alt="Cortexa" className="cx-logo-img" />
            </div>

            {/* CENTER NAV */}
            <nav className="cx-nav">
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("ai-setter")}>AI</button>
              <button onClick={() => scrollTo("whatsapp")}>Integrations</button>
              <button onClick={() => scrollTo("pricing")}>Pricing</button>
              <button onClick={() => scrollTo("trial")}>Resources</button>
            </nav>

            {/* RIGHT */}
            <div className="cx-actions">
              <a href="/sign-in" className="cx-login">Log in</a>
              <a href="#trial" className="cx-btn cx-btn-primary small">
                Start Free Trial
              </a>
            </div>

          </div>
        </header>

      {/* ================= HERO ================= */}
      <div className="cx-wrap">
        <section id="features" className="cx-hero">
            <div className="cx-hero-grid">

              <div>
                <span className="cx-eyebrow">AI CRM Platform</span>

                <h1 className="cx-title-xl">
                  Build a CRM your team <span className="cx-highlight">actually works from</span>
                </h1>

                <p className="cx-sub">
                  Manage leads, conversations, and deals from one powerful system.
                  From WhatsApp messaging to AI automation, everything is connected.
                </p>

                <div className="cx-btns">
                  <a href="#trial" className="cx-btn cx-btn-primary">
                    Start Your Free Trial
                  </a>
                </div>

                <div className="cx-note">No credit card required</div>
              </div>

              <div className="cx-shot">
                <img src={heroImg} alt="hero" />
              </div>

            </div>
          </section>

          {/* ================= AI SETTER (TARGET SCROLL) ================= */}
          <section id="ai-setter" className="cx-stack-wrap">
            <div className="cx-stack-block">

              <div className="cx-stack-row">
                <div className="cx-copy">
                  <span className="cx-eyebrow">AI Setter</span>
                  <h3 className="cx-title-md">Works 24/7, never misses a lead</h3>
                  <p>
                    AI tự động phản hồi, qualify và đặt lịch hẹn cho bạn.
                  </p>
                </div>

                <div className="cx-shot soft">
                  <img src={analyticsImg} alt="" />
                </div>
              </div>

            </div>
          </section>

          {/* ================= WHATSAPP SECTION ================= */}
          <section id="whatsapp" className="cx-stack-wrap">
            <div className="cx-stack-block">

              <div className="cx-stack-row reverse">
                <div className="cx-shot soft">
                  <img src={pipelineImg} alt="" />
                </div>

                <div className="cx-copy">
                  <span className="cx-eyebrow">WhatsApp CRM</span>
                  <h3 className="cx-title-md">All conversations in one place</h3>
                  <p>
                    Quản lý toàn bộ chat từ WhatsApp ngay trong CRM.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ================= OTHER CONTENT ================= */}
          <section id="pricing" className="cx-stack-wrap">
            <div className="cx-stack-block">

              <div className="cx-stack-row">
                <div className="cx-copy">
                  <span className="cx-eyebrow">Analytics</span>
                  <h3>Track everything in real time</h3>
                </div>

                <div className="cx-shot soft">
                  <img src={leadImg} alt="" />
                </div>
              </div>

            </div>
          </section>

          {/* ================= FINAL CTA ================= */}
          <section id="trial" className="cx-final">
            <div className="cx-final-box">

              <h2 className="cx-title-lg" style={{ color: "#fff" }}>
                Start closing more deals with CORTEXA
              </h2>

              <p className="cx-sub">
                AI CRM for leads, automation, analytics
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