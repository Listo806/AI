import React from "react";
import "./Common.css";
import { Link } from "react-router-dom";
import headlogo from "../../assets/cortexa/pheadlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";

import messImg from "../../assets/cortexa/mess.png";
import saleImg from "../../assets/cortexa/sale.png";
import operImg from "../../assets/cortexa/oper.png";
import aiImg from "../../assets/cortexa/ai.png";
import homeImg from "../../assets/cortexa/home.png";
import autoImg from "../../assets/cortexa/auto.png";

import icon1Img from "../../assets/cortexa/icon1.png";
import icon2Img from "../../assets/cortexa/icon2.png";
import icon3Img from "../../assets/cortexa/icon3.png";
import icon4Img from "../../assets/cortexa/icon4.png";
import userImg from "../../assets/cortexa/user.png";

import social1 from "../../assets/cortexa/social1.png";
import social2 from "../../assets/cortexa/social2.png";
import social3 from "../../assets/cortexa/social3.png";
import social4 from "../../assets/cortexa/social4.png";
import { Check, Users } from "lucide-react";
export default function PricingPage() {
  const featureSections = [
    {
      icon: saleImg,
      title: "AI SALES ENGINE",
      items: [
        "AI lead scoring & real-time qualification",
        "AI-recommended next actions",
        "AI conversation handling (engages & nurtures leads automatically)",
        "Automated follow-ups",
        "Smart pipelines (auto-updating)",
        "Predictive deal insights (identify high-converting leads)",
      ],
    },
    {
      icon: messImg,
      title: "MULTI-CHANNEL MESSAGING",
      items: [
        "WhatsApp (primary channel)",
        "Instagram DMs (fully integrated)",
        "Unified inbox with full lead context",
        "Cross-channel conversation sync",
        "Real-time notifications & alerts",
        "Full conversation history per lead",
      ],
    },
    {
      icon: homeImg,
      title: "DEAL INTELLIGENCE",
      items: [
        "Buyer–property matching",
        "Listing performance analytics",
        "Mapbox-powered insights",
        "AI-generated property descriptions",
        "Real-time performance dashboards",
        "Funnel tracking (lead → deal → close)",
        "ROI & revenue insights",
      ],
    },
    {
      icon: operImg,
      title: "OPERATIONS & SCALE",
      items: [
        "Centralized dashboard (run everything in one place)",
        "Team collaboration",
        "Role-based access & permissions",
        "Conversion & revenue analytics",
        "Mobile CRM (PWA)",
        "Zapier & webhooks",
      ],
    },
    {
      icon: aiImg,
      title: "AI AGENT",
      items: [
        "Handles conversations 24/7 automatically",
        "Instant WhatsApp replies (24/7)",
        "Qualifies leads using your rules",
        "Books directly to your calendar",
        "Automatically nurtures cold and warm leads",
        "Keeps your pipeline moving even when you’re offline",
        "Automatic follow-ups",
      ],
    },
    {
      icon: autoImg,
      title: "AUTOMATION & CONVERSION ENGINE",
      items: [
        "AI captures and qualifies leads instantly",
        "AI responds 24/7 (WhatsApp + Instagram)",
        "AI books appointments automatically",
        "AI follows up until the deal closes",
        "Smart pipelines update in real time",
        "Never miss a lead again",
      ],
    },
  ];

  const powerItems = [
    {
      icon: icon1Img,
      title: "Capture more leads",
      text: "AI finds, engages, and qualifies the right leads automatically.",
    },
    {
      icon: icon2Img,
      title: "Convert more deals",
      text: "Smart follow-ups, insights, and automation close more deals for you.",
    },
    {
      icon: icon3Img,
      title: "Operate with clarity",
      text: "Real-time dashboards and analytics so you always know what’s working.",
    },
    {
      icon: icon4Img,
      title: "Scale effortlessly",
      text: "AI handles the heavy lifting so you can focus on growing your business.",
    },
  ];

  return (
    <div className="pricing-page">
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <img src={headlogo} alt="Cortexa" className="cx-logo-img" />
          </div>

          <nav className="nav">
            <a href="/features">Features</a>
            <a href="/pricing" className="active">
              Pricing
            </a>
            <a href="/about">About Us</a>
            <a href="/contact">Contact</a>
          </nav>

          <div className="actions">
            <a href="/login">Log in</a>
            <a href="/trial" className="trial">
              Start Free Trial
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="container hero">
          <div className="hero-text">
            <h1>The smarter way to run your real estate business.</h1>
            <p>
              One platform. Everything you need to capture, engage, and close
              more deals.
              <br />
              Built for modern agents and teams who want results.
            </p>
          </div>

          <div className="content">
            <div className="features">
              {featureSections.map((section) => (
                <div key={section.title} className="feature-card">
                  <div className="feature-title">
                    <span className="icon">
                      {" "}
                      <img src={section.icon} alt="Cortexa" />
                    </span>
                    <h3>{section.title}</h3>
                  </div>

                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>
                        <span className="check">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <aside className="sidebar">
              <h2>Enterprise</h2>

              <div className="price-box">
                <div>
                  <span>Get started</span>
                  <strong>$97</strong>
                </div>
                <p>One-time setup fee</p>
              </div>

              <a href="/trial" className="btn-primary full">
                Start My Free Trial
              </a>

              <p className="fill">
                <Users size={18} /> 3 users included
              </p>
              <p className="fill fillcheck">
                <Check size={18} /> Add team <br/>members anytime
              </p>
            </aside>
          </div>

          <div className="bottom-section">
            <div className="bottom-grid">
              <div>
                <p className="tagline">
                  THE ONLY AI CRM BUILT 100% FOR REAL ESTATE.
                </p>

                <h2>
                  One software. Every tool.
                  <br />
                  <span>Everything real estate agents need to succeed.</span>
                </h2>

                <p className="desc">
                  No more switching between apps. Cortexa brings every lead,
                  conversation, property, and deal into one place.
                </p>
              </div>

              {powerItems.map((item) => (
                <div key={item.title} className="power-item">
                  <div className="icon">
                    <img src={item.icon} alt="Cortexa" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}

              <div className="power-final">
                <p>
                  Built for real estate.
                  <br />
                  Made to scale.
                  <br />
                  Designed to win.
                </p>
                <h3>That’s the power of Cortexa.</h3>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer-final">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={footlogo} alt="Cortexa" className="cx-logo-img" />
              <p>
                The AI-powered Real Estate CRM <br/>Close more deals — Automatically.
              </p>
              <div className="footer-tags">
                <span><img src={social1} alt="Social" /></span>
                <span><img src={social2} alt="Social" /></span>
                <span><img src={social3} alt="Social" /></span>
                <span><img src={social4} alt="Social" /></span>
              </div>
            </div>

            <div className="footer-col">
              <h3>Product</h3>
              <ul>
                <li>
                  <a href="/features">Features</a>
                </li>
                <li>
                  <a href="/pricing">Pricing</a>
                </li>
                <li>
                  <a href="/dashboard/integrations">Integrations</a>
                </li>
                <li>
                  <a href="/analytics">Changelog</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Company</h3>
              <ul>
                <li>
                  <a href="/about">About us</a>
                </li>
                <li>
                  <a href="/signin">Blog</a>
                </li>
                <li>
                  <a href="/crm">Careers</a>
                </li>
                <li>
                  <a href="/contact">Contact</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Resources</h3>
              <ul>
                <li>
                  <a href="/help">Help Center</a>
                </li>
                <li>
                  <a href="/contact">Guides</a>
                </li>
                <li>
                  <a href="/contact">Community</a>
                </li>
                <li>
                  <a href="/help/api">API Docs</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Legal</h3>
              <ul>
                <li>
                  <a href="/terms">Terms of Service</a>
                </li>
                <li>
                  <a href="/privacy-policy">Privacy Policy</a>
                </li>
                <li>
                  <a href="/refund-policy">Refund Policy</a>
                </li>
                <li>
                  <a href="/cancellation">Cancellation Policy</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Get Started</h3>
              <ul>
                <li>
                  <a href="/login">Login</a>
                </li>
                <li>
                  <a href="/trial" className="btn-primary">
                    Start Free Trial
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="copt-right text-center">&copy; 2026 Corrtexa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
