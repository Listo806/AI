import React from "react";
import {
  UserPlus,
  CreditCard,
  LogIn,
  Network,
  Users,
  Rocket,
  MessageCircle,
  ShieldCheck,
  Headphones,
  Lightbulb,
  ArrowRight,
  Home,
  User,
  Calendar,
  BarChart3,
  Settings,
  RefreshCw,
  ChevronRight,
  X,
  PlayCircle,
  TrendingUp,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

import { HashLink } from "react-router-hash-link";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import styles from "./SetupGuide.module.css";

export default function SetupGuide() {
  const steps = [
    {
      number: "1",
      title: "Create Your Account",
      text: "Sign up in less than a minute. No long forms, no hassle. Prepare your CORTEXA workspace.",
      cta: "Account setup",
      icon: User,
      color: "#6D5BFF",
      bg: "#F0ECFF",
    },
    {
      number: "2",
      title: "Complete Checkout",
      text: "Choose your plan and complete checkout to activate your CORTEXA account.",
      cta: "Billing setup",
      icon: CreditCard,
      color: "#2F6BFF",
      bg: "#EEF4FF",
    },
    {
      number: "3",
      title: "Log In to Your Dashboard",
      text: "Access your CORTEXA dashboard and explore your new command center.",
      cta: "Dashboard access",
      icon: LogIn,
      color: "#0EA66B",
      bg: "#EAFBF2",
    },
    {
      number: "4",
      title: "Connect Your Lead Sources",
      text: "Connect your websites, WhatsApp, ad accounts, listings, and more to start capturing leads.",
      cta: "Connect sources",
      icon: Network,
      color: "#F97316",
      bg: "#FFF3EA",
    },
    {
      number: "5",
      title: "Invite Your Team",
      text: "Add team members, set permissions, and assign roles so your team can collaborate smoothly.",
      cta: "Team setup",
      icon: Users,
      color: "#7C3AED",
      bg: "#F3EEFF",
    },
    {
      number: "6",
      title: "Start Closing More Deals",
      text: "Use CORTEXA to organize leads, manage follow-ups, track pipeline activity, and close more deals.",
      cta: "Start working",
      icon: Rocket,
      color: "#2563EB",
      bg: "#EEF4FF",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.logoWrap}>
          <img src={headlogoImg} className="cx-logo-img" />
        </a>

        <nav className={styles.nav}>
          <HashLink className={styles.navLink} smooth to="/#features">Features</HashLink>
          <HashLink className={styles.navLink} smooth to="/#ai-assistant">AI Assistant</HashLink>
          <HashLink className={styles.navLink} smooth to="/#automations">Automations</HashLink>
          <a href="/integrations" className={styles.navLink}>Integrations</a>
          <HashLink className={styles.navLink} smooth to="/#analytics">Analytics</HashLink>
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
              <div className={styles.pageLabel}>SETUP GUIDE</div>
              <h1 className={styles.heroTitle}>
                Your CORTEXA <span className={styles.gradientText}>Setup Guide</span>
              </h1>

              <p className={styles.heroSubtitle}>
                Get up and running in minutes. Follow these simple steps to prepare
              your CRM workspace, connect your lead sources, invite your team,
              and start managing deals clearly.
              </p>

            </div>
            <DashboardPreview />
            {/*<div className={styles.mockupCard}>
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
            </div>*/}
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

                  <a href={getStepLink(step.number)} className={styles.stepCta} style={{ color: step.color }}>
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
              Our support team is here to help with setup, account access, data import,
            integrations, and workflow preparation.
            </p>

            <div className={styles.helpButtons}>
              <a href="/support" className={styles.outlineBtn}>
                <MessageSquare size={18} /> Contact Support
              </a>
            </div>
          </div>

          <div className={styles.helpList}>
            <HelpItem text="Live chat support" />
            <HelpItem text="Step-by-step onboarding" />
            <HelpItem text="Workspace setup guidance" />
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
      <ShieldCheck size={20} />
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

function DashboardPreview() {
  return (
    <div className={styles.dashboardMock}>
      <aside className={styles.mockSidebar}>
        <Home size={18} />
        <User size={18} />
        <Users size={18} />
        <MessageCircle size={18} />
        <Calendar size={18} />
        <BarChart3 size={18} />
        <Settings size={18} />
      </aside>

      <div className={styles.mockMain}>
        <div className={styles.mockTop}>
          <strong>CORTEXA Dashboard</strong>

          <div className={styles.mockActions}>
            <RefreshCw size={16} />
            <span />
            <X size={17} />
          </div>
        </div>

        <div className={styles.mockStats}>
          <StatCard label="New Leads" value="426" growth="+18% vs last week" />
          <StatCard label="Active Deals" value="$148K" growth="+22% vs last week" />
          <StatCard label="Revenue" value="$24.6K" growth="+15% vs last week" />
          <StatCard label="Appointments" value="18" growth="+21% vs last week" />
        </div>

        <div className={styles.mockGrid}>
          <div className={styles.mockPanel}>
            <h4>Pipeline Overview</h4>
            <div className={styles.mockGridContent}>
              <div className={styles.funnelWrap}>
                <div className={styles.funnelLine} style={{ width: "86%", background: "#0969E8" }} />
                <div className={styles.funnelLine} style={{ width: "72%", background: "#1677FF" }} />
                <div className={styles.funnelLine} style={{ width: "58%", background: "#22C55E" }} />
                <div className={styles.funnelLine} style={{ width: "44%", background: "#F97316" }} />
                <div className={styles.funnelLine} style={{ width: "30%", background: "#EC4899" }} />
              </div>

              <div className={styles.legend}>
                <LegendDot color="#0969E8" label="New Leads" value="426" />
                <LegendDot color="#1677FF" label="Contacted" value="180" />
                <LegendDot color="#22C55E" label="Qualified" value="98" />
                <LegendDot color="#F97316" label="Proposal" value="42" />
                <LegendDot color="#EC4899" label="Won" value="18" />
              </div>
            </div>
          </div>

          <div className={styles.mockPanel}>
            <h4>AI Activity</h4>

            <ActivityRow label="Follow-ups sent" value="142" />
            <ActivityRow label="Conversations" value="327" />
            <ActivityRow label="Appointments booked" value="18" />
            <ActivityRow label="Deals closed" value="7" />
          </div>

          <div className={styles.mockPanel}>
            <div className={styles.panelHeader}>
              <h4>Revenue Trend</h4>
              <span>This Month</span>
            </div>

            <div className={styles.chartArea}>
              <div className={styles.chartGrid} />
              <svg viewBox="0 0 220 130" preserveAspectRatio="none" className={styles.chartSvg}>
                <path
                  d="M5 110 L28 72 L50 90 L75 48 L98 64 L125 32 L148 48 L170 18 L188 30 L215 5"
                  fill="none"
                  stroke="#5B4DFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, growth }) {
  return (
    <div className={styles.statCard}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{growth}</small>
    </div>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div className={styles.legendRow}>
      <span
        className={styles.legendDot}
        style={{ background: color }}
      />
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function ActivityRow({ label, value }) {
  return (
    <div className={styles.activityRow}>
      <span>{label}</span>
      <strong>{value} ↑</strong>
    </div>
  );
}
