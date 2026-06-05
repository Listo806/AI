import React from "react";
import {
  User,
  CreditCard,
  LogIn,
  Share2,
  Users,
  Rocket,
  Calendar,
  MessageSquare,
  CheckCircle,
  PlayCircle,
  ArrowRight,
  Home,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import styles from "./SetupGuide.module.css";

export default function SetupGuide() {
  const steps = [
    {
      number: "1",
      title: "Create Your Account",
      text: "Sign up in less than a minute. Enter your basic information and create your CORTEXA account.",
      cta: "Get Started",
      icon: User,
      color: "#6D5BFF",
      bg: "#F0ECFF",
    },
    {
      number: "2",
      title: "Complete Checkout",
      text: "Activate your account through the secure checkout flow and unlock access to your CRM workspace.",
      cta: "View Pricing",
      icon: CreditCard,
      color: "#2F6BFF",
      bg: "#EEF4FF",
    },
    {
      number: "3",
      title: "Log In to Your Dashboard",
      text: "Access your CORTEXA dashboard and explore your lead command center, pipeline, and AI tools.",
      cta: "Go to Login",
      icon: LogIn,
      color: "#0EA66B",
      bg: "#EAFBF2",
    },
    {
      number: "4",
      title: "Connect Your Lead Sources",
      text: "Connect websites, WhatsApp, ad accounts, listings, forms, and other lead sources into one workflow.",
      cta: "Learn How",
      icon: Share2,
      color: "#F97316",
      bg: "#FFF3EA",
    },
    {
      number: "5",
      title: "Invite Your Team",
      text: "Add team members, set permissions, assign roles, and keep your agents working from one place.",
      cta: "Add Team",
      icon: Users,
      color: "#7C3AED",
      bg: "#F3EEFF",
    },
    {
      number: "6",
      title: "Start Closing More Deals",
      text: "Let CORTEXA help with follow-ups, reminders, lead tracking, and pipeline movement while your team focuses on closing.",
      cta: "See It in Action",
      icon: Rocket,
      color: "#2563EB",
      bg: "#EEF4FF",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>C</div>
          <div>
            <div className={styles.logoText}>CORTEXA</div>
            <div className={styles.logoSub}>AI POWERED. 24/7. REAL RESULTS.</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="/#features" className={styles.navLink}>Features</a>
          <a href="/#ai-assistant" className={styles.navLink}>AI Assistant</a>
          <a href="/#automations" className={styles.navLink}>Automations</a>
          <a href="/integrations" className={styles.navLink}>Integrations</a>
          <a href="/#analytics" className={styles.navLink}>Analytics</a>
          <a href="/pricing" className={styles.navLink}>Pricing</a>
        </nav>

        <div className={styles.headerActions}>
          <a href="/login" className={styles.loginBtn}>Log In</a>
          <a href="/trial" className={styles.primaryBtn}>Start Free Trial</a>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.breadcrumb}>
            <a href="/" className={styles.breadcrumbLink}>
              <Home size={14} /> Home
            </a>
            <ChevronRight size={14} />
            <span>Get Started</span>
            <ChevronRight size={14} />
            <strong>Setup Guide</strong>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Your CORTEXA <span className={styles.gradientText}>Setup Guide</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Get up and running in minutes. Follow these simple steps to launch your AI CRM and start closing more deals.
              </p>

              <div className={styles.heroButtons}>
                <a href="/trial" className={styles.bigPrimaryBtn}>
                  Start Your Free Trial <ArrowRight size={18} />
                </a>
                <a href="/#demo" className={styles.demoBtn}>
                  <PlayCircle size={20} /> View Demo
                </a>
              </div>
            </div>

            <div className={styles.mockupCard}>
              <div className={styles.mockupSidebar}>
                {["⌕", "⌂", "▣", "☰", "◌", "▤", "◎", "⚙"].map((item, index) => (
                  <div key={index} className={styles.mockupIcon}>{item}</div>
                ))}
              </div>

              <div className={styles.mockupContent}>
                <div className={styles.mockupTop}>
                  <strong>CORTEXA Dashboard</strong>
                  <span>○ − ×</span>
                </div>

                <div className={styles.statRow}>
                  <MiniStat label="New Leads" value="426" change="+18%" />
                  <MiniStat label="Active Deals" value="$148K" change="+22%" />
                  <MiniStat label="Revenue" value="$24.6K" change="+15%" />
                  <MiniStat label="Appointments" value="18" change="+12%" />
                </div>

                <div className={styles.mockupLower}>
                  <div className={styles.pipelineBox}>
                    <h4>Pipeline Overview</h4>
                    <div className={styles.funnel}>
                      <div className={styles.funnelBar} style={{ width: "92%", background: "#2563EB" }} />
                      <div className={styles.funnelBar} style={{ width: "78%", background: "#14B8A6" }} />
                      <div className={styles.funnelBar} style={{ width: "62%", background: "#22C55E" }} />
                      <div className={styles.funnelBar} style={{ width: "46%", background: "#F59E0B" }} />
                      <div className={styles.funnelBar} style={{ width: "30%", background: "#EF4444" }} />
                    </div>
                  </div>

                  <div className={styles.activityBox}>
                    <h4>AI Activity</h4>
                    <MetricLine label="Follow-ups sent" value="142" />
                    <MetricLine label="Conversations" value="327" />
                    <MetricLine label="Appointments booked" value="18" />
                    <MetricLine label="Deals closed" value="7" />
                  </div>

                  <div className={styles.chartBox}>
                    <h4>Revenue Trend</h4>
                    <div className={styles.chartLine}>
                      <TrendingUp size={72} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stepsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>6 Simple Steps to Get Started</h2>
            <p className={styles.sectionText}>
              Follow these steps and you’ll be ready to manage leads, automate follow-ups, and close more deals 24/7.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className={styles.stepCard}>
                  <div className={styles.stepNumber} style={{ background: step.color }}>
                    {step.number}
                  </div>

                  <div className={styles.stepIconCircle} style={{ background: step.bg }}>
                    <Icon size={38} color={step.color} strokeWidth={2} />
                  </div>

                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>

                  <a href={getStepLink(step.number)} className={styles.stepCta}>
                    {step.cta} <ArrowRight size={15} />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.helpSection}>
          <div className={styles.helpIllustration}>
            <div className={styles.chatBubbleMain}>
              <MessageSquare size={44} />
            </div>
            <div className={styles.chatBubbleSmallOne} />
            <div className={styles.chatBubbleSmallTwo} />
          </div>

          <div className={styles.helpCopy}>
            <h2 className={styles.helpTitle}>Need Help Getting Started?</h2>
            <p className={styles.helpText}>
              Our support team is here for you. Book a demo call or reach out anytime.
            </p>

            <div className={styles.helpButtons}>
              <a href="/book-demo" className={styles.bigPrimaryBtn}>
                <Calendar size={18} /> Book a Demo
              </a>
              <a href="/contact" className={styles.outlineBtn}>
                <MessageSquare size={18} /> Contact Support
              </a>
            </div>
          </div>

          <div className={styles.helpList}>
            <HelpItem text="Live chat support" />
            <HelpItem text="Step-by-step onboarding" />
            <HelpItem text="Simple setup process" />
          </div>
        </section>

        <div className={styles.tipBox}>
          <span className={styles.tipIcon}>💡</span>
          <strong>Tip:</strong>
          <span> Most customers can be fully set up and running in under 15 minutes.</span>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value, change }) {
  return (
    <div className={styles.miniStat}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change} vs last week</small>
    </div>
  );
}

function MetricLine({ label, value }) {
  return (
    <div className={styles.metricLine}>
      <span>{label}</span>
      <strong>{value} ↑</strong>
    </div>
  );
}

function HelpItem({ text }) {
  return (
    <div className={styles.helpItem}>
      <CheckCircle size={20} />
      <span>{text}</span>
    </div>
  );
}

function getStepLink(number) {
  const links = {
    "1": "/trial",
    "2": "/pricing",
    "3": "/login",
    "4": "/integrations",
    "5": "/trial",
    "6": "/#demo",
  };
  return links[number] || "/";
}