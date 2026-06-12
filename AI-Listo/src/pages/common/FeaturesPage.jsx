import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  Bot,
  Zap,
  BarChart3,
  Sparkles,
  MessageSquare,
  GitMerge,
  Users,
  Target,
  Brain,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Menu, X,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import headlogoImg from "../../assets/cortexa/headlogo.png"; 
import headlogoM from "../../assets/cortexa/headlogotran.png";
import styles from "./FeaturesPage.module.css"; 

export default function FeaturesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const footerProductLinks = [
    { label: "Features", href: "/features" },
    { label: "AI Assistant", href: "/features#ai-assistant" },
    { label: "Automations", href: "/features#automations" },
    { label: "Integrations", href: "/integrations" },
    { label: "Analytics", href: "/features#analytics" },
  ];

  const coreFeatures = [
    {
      title: "AI Lead Capture",
      text: "Automatically pull leads from Meta, Google, forms, and listings instantly into your pipeline.",
      icon: Target,
      color: "#2563EB",
      bg: "#EEF4FF",
    },
    {
      title: "WhatsApp AI Follow-Up",
      text: "Engage instantly with smart auto-responses, scheduling assist, and continuous structured chat.",
      icon: MessageSquare,
      color: "#059669",
      bg: "#EAFBF2",
    },
    {
      title: "Pipeline Intelligence",
      text: "Track deal visual cards, contact velocity, transaction records, and real estate interaction logs.",
      icon: Layers,
      color: "#6D5BFF",
      bg: "#F0ECFF",
    },
    {
      title: "Smart CRM Automation",
      text: "Eliminate administrative bottlenecks. Route leads, assign team members, and trigger updates.",
      icon: Zap,
      color: "#F97316",
      bg: "#FFF3EA",
    },
    {
      title: "Team Workspace",
      text: "Manage multiple agents, permissions, shared calendars, and performance reports smoothly.",
      icon: Users,
      color: "#DB2777",
      bg: "#FCE7F3",
    },
    {
      title: "Analytics & Forecasting",
      text: "Deep analytical dashboard covering revenue, agent activity, and source conversions.",
      icon: BarChart3,
      color: "#0891B2",
      bg: "#ECFEFF",
    },
  ];

  return (
    <div className={styles.page}>
      {/* ================= PUBLIC NAVIGATION HEADER ================= */}
      {isMobile ? (
        <header className={styles.mHeader}>
          <div className={styles.mLogoBlock}>
            <a href="/"><img src={headlogoM} alt="Cortexa" className="cx-logo-img" /></a>
          </div>
          
          <div className={styles.mHeaderRight}>
            <button className={styles.mMenuBtn} onClick={() => setMenuOpen(true)}>
              <Menu size={26} color="#ffffff" />
            </button>
          </div>
        </header>
      ) : (
        /* Desktop Header  */
        <header className={styles.header}>
          <a href="/" className={styles.logoWrap}>
            <img src={headlogoImg} className="cx-logo-img" alt="CORTEXA Logo" />
          </a>

          <nav className={styles.nav}>
            <HashLink smooth to="/features" className={`${styles.navLink} ${styles.activeNav}`}>
              Features
            </HashLink>
            <HashLink smooth to="/features#ai-assistant" className={styles.navLink}>
              AI Assistant
            </HashLink>
            <HashLink smooth to="/features#automations" className={styles.navLink}>
              Automations
            </HashLink>
            <a href="/integrations" className={styles.navLink}>
              Integrations
            </a>
            <HashLink smooth to="/features#analytics" className={styles.navLink}>
              Analytics
            </HashLink>
          </nav>

          <div className={styles.headerActions}>
            <a href="/login" className={styles.loginBtn}>Log In</a>
            <a href="/start-trial" className={styles.primaryBtn}>Start Free Trial</a>
          </div>
        </header>
      )}

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {isMobile && (
        <div className={`${styles.mDrawer} ${menuOpen ? styles.open : ""}`}>
          <div className={styles.mDrawerTop}>
            <div className={styles.mLogoBlock}>
              <a href="/"><img src={headlogoM} alt="Cortexa" className="cx-logo-img" /></a>
            </div>
            <button className={styles.mClose} onClick={() => setMenuOpen(false)}>
              <X size={24} color="#ffffff" />
            </button>
          </div>
          
          <div className={styles.mDrawerNav} onClick={() => setMenuOpen(false)}>
            <HashLink className={styles.navMenu} smooth to="/features">Features</HashLink>
            <HashLink className={styles.navMenu} smooth to="/features#ai-assistant">AI Assistant</HashLink>
            <HashLink className={styles.navMenu} smooth to="/features#automations">AI Automation</HashLink>
            <a href="/integrations" className={styles.navMenu}>Integrations</a>
            <HashLink className={styles.navMenu} smooth to="/features#analytics">Analytics</HashLink>
          </div>
          
          <div className={styles.mDrawerActions}>
            <a href="/start-trial" className={styles.mDrawerTrialBtn}>Start Free Trial</a>
            <a className={styles.mDrawerLoginBtn} href="/login">Log in</a>
          </div>
        </div>
      )}

      <main>
        {/* ================= 1. HERO SECTION ================= */}
        <section className={styles.heroSection}>
          <div className={styles.badge}>
            <Sparkles size={14} /> Product Overview
          </div>
          <h1 className={styles.heroTitle}>CORTEXA Features</h1>
          <h2 className={styles.heroHeadline}>
            Everything real estate agents need to <br />
            <span className={styles.gradientText}>capture, manage, and close</span> more deals.
          </h2>
          <p className={styles.heroDescription}>
            CORTEXA brings leads, WhatsApp conversations, AI follow-up, pipeline intelligence, 
            automations, analytics, and team workflows into one clean real estate CRM.
          </p>
          <div className={styles.heroButtons}>
            <a href="/start-trial" className={styles.bigPrimaryBtn}>
              Start Free Trial <ArrowRight size={18} />
            </a>
            <a href="/integrations" className={styles.outlineBtn}>
              View Integrations <ArrowUpRight size={18} />
            </a>
          </div>
        </section>

        {/* ================= 2. CORE FEATURES SECTION ================= */}
        <section className={styles.coreSection}>
          <div className={styles.sectionHeader}>
            <h2>Complete Real Estate Pipeline Control</h2>
            <p>Every tool your brokerage needs to convert raw traffic into closed commissions.</p>
          </div>
          <div className={styles.coreGrid}>
            {coreFeatures.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className={styles.coreCard}>
                  <div className={styles.iconWrap} style={{ backgroundColor: item.bg, color: item.color }}>
                    <IconComponent size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 3. AI ASSISTANT SECTION ================= */}
        <section id="ai-assistant" className={styles.detailSection}>
          <div className={styles.detailGrid}>
            <div className={styles.detailText}>
              <div className={styles.sectionMarker} style={{ color: "#2563EB", background: "#EEF4FF" }}>
                <Brain size={16} /> AI Engine
              </div>
              <h2>24/7 AI Assistant Inside Your CRM</h2>
              <p className={styles.sectionPurpose}>
                Explain that the AI Assistant helps agents respond faster, qualify leads, 
                suggest next actions, summarize conversations, and support follow-up.
              </p>
              
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Helps qualify leads based on intent, budget, and timeline.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Suggests next-best actions to guide buyers closer to an offer.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Supports natural WhatsApp-style conversational responses.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Helps agents avoid missed opportunities during off-hours.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Works as a non-stop assistant integrated directly into your workflow.</span>
                </div>
              </div>
            </div>

            <div className={styles.visualPanel}>
              <div className={styles.mockChatBox}>
                <div className={styles.chatHeader}>
                  <Bot size={18} color="#2563EB" /> <span>CORTEXA AI Agent</span>
                  <span className={styles.statusDot}>Online</span>
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.msgLeft}>Is this property still available for viewing this Saturday?</div>
                  <div className={styles.msgRight}>Yes! I can lock in 2:00 PM for you, or would you prefer a morning slots?</div>
                  <div className={styles.aiTag}>Suggested Next Action: Send calendar link</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. AUTOMATIONS SECTION ================= */}
        <section id="automations" className={styles.detailSection} style={{ backgroundColor: "#F8FAFC" }}>
          <div className={styles.detailGrid} style={{ direction: "rtl" }}>
            <div className={styles.detailText} style={{ direction: "ltr" }}>
              <div className={styles.sectionMarker} style={{ color: "#F97316", background: "#FFF3EA" }}>
                <Zap size={16} /> Operations
              </div>
              <h2>Smart Workflows, Zero Redundant Work</h2>
              <p className={styles.sectionPurpose}>
                Explain that CORTEXA automates repetitive work so agents can focus on closing deals.
              </p>

              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Automated lead routing based on zip codes, value, or round-robin rules.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Automated follow-up reminders so hot opportunities never turn cold.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Instant pipeline stage updates when a client takes an action.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Team assignment workflows to balance workloads effortlessly.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Multi-channel WhatsApp/email-style follow-up flows.</span>
                </div>
              </div>
            </div>

            <div className={styles.visualPanel} style={{ direction: "ltr" }}>
              <div className={styles.mockWorkflow}>
                <div className={styles.flowNode}>New Lead Arrived ➔ Meta Ads</div>
                <div className={styles.flowLine}>↓</div>
                <div className={styles.flowNodeActive}>AI Assigned & Route ➔ Area Agent</div>
                <div className={styles.flowLine}>↓</div>
                <div className={styles.flowNode}>Instant WhatsApp Campaign Dispatched</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. ANALYTICS SECTION ================= */}
        <section id="analytics" className={styles.detailSection}>
          <div className={styles.detailGrid}>
            <div className={styles.detailText}>
              <div className={styles.sectionMarker} style={{ color: "#0891B2", background: "#ECFEFF" }}>
                <BarChart3 size={16} /> Intelligence
              </div>
              <h2>Data-Driven Pipeline Analytics</h2>
              <p className={styles.sectionPurpose}>
                Explain that CORTEXA gives agents visibility into leads, deals, pipeline, activity, and revenue forecasting.
              </p>

              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Detailed lead performance tracking across all digital sources.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Real-time pipeline value visibility to monitor potential commissions.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Conversion tracking pinpointing leaky steps in sales funnels.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Predictive revenue forecasting metrics using performance history.</span>
                </div>
                <div className={styles.bulletItem}>
                  <CheckCircle size={18} className={styles.checkIcon} />
                  <span>Team performance and actionable activity insights.</span>
                </div>
              </div>
            </div>

            <div className={styles.visualPanel}>
              <div className={styles.mockAnalyticsBox}>
                <div className={styles.analyticsRow}>
                  <span>Pipeline GCV Value</span>
                  <strong>$2,450,000</strong>
                </div>
                <div className={styles.chartBarWrap}>
                  <div className={styles.chartBar} style={{ width: "85%", backgroundColor: "#0891B2" }}></div>
                  <div className={styles.chartBar} style={{ width: "45%", backgroundColor: "#38BDF8" }}></div>
                </div>
                <div className={styles.analyticsMini}><TrendingUp size={14} /> Conversion Rate: +4.2%</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 6. FINAL CTA SECTION ================= */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to organize your real estate business with CORTEXA?</h2>
          <div className={styles.ctaButtons}>
            <a href="/start-trial" className={styles.bigPrimaryBtn}>
              Start Free Trial <ArrowRight size={18} />
            </a>
            <a href="/support" className={styles.outlineCtaBtn}>
              Contact Support
            </a>
          </div>
        </section>
      </main>

      {/* ================= PUBLIC FOOTER CONTAINS ALL COLUMNS ================= */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.brandColumn}>
            <img src={headlogoImg} className="cx-logo-img" alt="CORTEXA Logo" />
            <p>The AI-powered CRM that helps you capture leads, automate follow-ups, and close more deals faster.</p>
          </div>

          <div className={styles.footerColumn}>
            <h4>PRODUCT</h4>
            {footerProductLinks.map((link, idx) => (
              <HashLink smooth key={idx} to={link.href}>
                {link.label}
              </HashLink>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <h4>RESOURCES</h4>
            <a href="/setup-guide">Setup Guide</a>
            <a href="/help">Help Center</a>
            <a href="/contact">Community</a>
            <a href="/help/api">API Docs</a>
          </div>

          <div className={styles.footerColumn}>
            <h4>COMPANY</h4>
            <a href="/about">About Us</a>
            <a href="/">Blog</a>
            <a href="/">Careers</a>
            <a href="/contact">Contact</a>
          </div>

          <div className={styles.footerColumn}>
            <h4>LEGAL</h4>
            <a href="/terms">Terms of Service</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/refund-policy">Refund Policy</a>
            <a href="/cancellation">Cancellation Policy</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} CORTEXA. All rights reserved. Public Pre-auth Information Layout.</p>
        </div>
      </footer>
    </div>
  );
}