import React from "react";
import {
  ArrowRight,
  MessageSquare,
  BookOpen,
  Settings,
  HelpCircle,
  UserPlus,
  CreditCard,
  LogIn,
  Network,
  Users,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import styles from "./SetupGuide.module.css";
import dashboardImg from "../../assets/cortexa/setup.png";
import setupiconImg from "../../assets/cortexa/setupicon.png";

export default function SetupGuide() {
  const steps = [
    {
      number: "1",
      title: "Create Your Account",
      text: "Sign up in less than a minute. No long forms, no hassle. Prepare your CORTEXA workspace.",
      cta: "Account setup",
      primaryColor: "#4F46E5",
      bgColor: "#EEF2FF",
      icon: <UserPlus size={30} />,
    },
    {
      number: "2",
      title: "Complete Checkout",
      text: "Choose your plan and complete checkout to activate your CORTEXA account.",
      cta: "Billing setup",
      primaryColor: "#3B82F6",
      bgColor: "#EFF6FF",
      icon: <CreditCard size={30} />,
    },
    {
      number: "3",
      title: "Log In to Your Dashboard",
      text: "Access your CORTEXA dashboard and explore your new command center.",
      cta: "Dashboard access",
      primaryColor: "#06B6D4",
      bgColor: "#ECFEFF",
      icon: <LogIn size={30} />,
    },
    {
      number: "4",
      title: "Connect Your Lead Sources",
      text: "Connect your websites, WhatsApp, ad accounts, listings, and more to start capturing leads.",
      cta: "Connect sources",
      primaryColor: "#2563EB",
      bgColor: "#EFF6FF",
      icon: <Network size={30} />,
    },
    {
      number: "5",
      title: "Invite Your Team",
      text: "Add team members, set permissions, and assign roles so your team can collaborate smoothly.",
      cta: "Team setup",
      primaryColor: "#6366F1",
      bgColor: "#F5F3FF",
      icon: <Users size={30} />,
    },
    {
      number: "6",
      title: "Start Closing More Deals",
      text: "Use CORTEXA to organize leads, manage follow-ups, track pipeline activity, and close more deals.",
      cta: "Start working",
      primaryColor: "#1D4ED8",
      bgColor: "#EFF6FF",
      icon: <TrendingUp size={30} />,
    },
  ];

  return (
    <div className={styles.page}>
      <main className={styles.mainContainer}>
        <div className={styles.topNav}>
          <span>Home</span> &gt; <span>Get Started</span> &gt;{" "}
          <span className={styles.activeNav}>Setup Guide</span>
        </div>

        <div className={styles.badgeWrapper}>
          <span className={styles.badge}>SETUP GUIDE</span>
        </div>

        <section className={styles.titleSection}>
          <h1>Connect. Set Up. Get Ready.</h1>
          <p>
            Follow these simple steps to get your CORTEXA workspace ready.
            Create an account,
            <br />
            activate your workspace, log in, connect your lead sources, invite
            your team,
            <br />
            and start working in minutes.
          </p>
        </section>

        <section className={styles.dashboardPreview}>
          <div className={styles.mockupContainer}>
            <img
              src={dashboardImg}
              alt="Dashboard Preview"
              className={styles.previewImg}
            />
          </div>
        </section>

        <section className={styles.stepsIntro}>
          <h2>6 Simple Steps to Get Started</h2>
          <p>
            Follow these steps and your CORTEXA workspace will be ready to
            manage leads,
            <br />
            automate follow-ups, and organize your real estate business.
          </p>
        </section>

        <section className={styles.stepsGrid}>
          {steps.map((step) => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.cardHeaderRow}>
                <div 
                  className={styles.stepNumberBadge}
                  style={{ backgroundColor: step.primaryColor }}
                >
                  {step.number}
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.iconAndTextContainer}>
                  <div 
                    className={styles.stepIconPlaceholder}
                    style={{ backgroundColor: step.bgColor, color: step.primaryColor }}
                  >
                    {step.icon}
                  </div>
                  
                  <div className={styles.stepTextContent}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <HashLink 
                      to="/#" 
                      className={styles.stepCta}
                      style={{ color: step.primaryColor }}
                    >
                      <span>{step.cta}</span>
                      <ArrowRight size={14} />
                    </HashLink>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.helpBanner}>
          <div className={styles.helpLeft}>
            <img
              src={setupiconImg}
              alt="message icon"
              className={styles.tipIcon}
            />
            <div className={styles.helpTextContent}>
              <h3>Need Help Getting Started?</h3>
              <p>
                Our support team is here to help with setup, access, imports,
                integrations, and workflow preparation.
              </p>
              <button className={styles.contactBtn}>
                <MessageSquare size={16} />
                <span>Contact Support</span>
              </button>
            </div>
          </div>

          <div className={styles.helpRightList}>
            <div className={styles.helpItem}>
              <MessageSquare size={18} className={styles.helpItemIcon} />
              <span>Live chat support</span>
            </div>
            <div className={styles.helpItem}>
              <BookOpen size={18} className={styles.helpItemIcon} />
              <span>Step-by-step onboarding</span>
            </div>
            <div className={styles.helpItem}>
              <Settings size={18} className={styles.helpItemIcon} />
              <span>Workspace setup guidance</span>
            </div>
          </div>
        </section>

        <footer className={styles.footerTip}>
          <Lightbulb size={26} className={styles.tipIcon} />
          <span>
            <strong>Tip:</strong> Most customers can complete the basic setup
            process in under 15 minutes.
          </span>
        </footer>
      </main>
    </div>
  );
}