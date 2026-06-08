import React from "react";
import styles from "./About.module.css";
import {
  ScatterChart,
  Timer,
  Puzzle,
  Crosshair,
  Building2,
  Zap,
  BarChart3,
  Users,
  Bot,
} from "lucide-react";
import aboutTopImg from "../../assets/cortexa/about_top.png";
import aboutBottomImg from "../../assets/cortexa/about_bottom.png";
import aboutCenterImg from "../../assets/cortexa/about_center.png";
export default function About() {
  const problemCards = [
    {
      title: "Scattered leads",
      text: "Leads arrive from everywhere — ads, websites, referrals, listings, and more. They get lost, duplicated, or forgotten.",
      icon: ScatterChart,
    },
    {
      title: "Slow follow-up",
      text: "Manual processes and inbox chaos create delays. Most leads cool down before anyone responds.",
      icon: Timer,
    },
    {
      title: "Disconnected tools",
      text: "CRMs, spreadsheets, calendars, messaging apps, and forms do not talk to each other or your team.",
      icon: Puzzle,
    },
  ];

  const featureCards = [
    {
      title: "Capture Every Lead",
      text: "Collect leads from every source instantly and keep your database clean, complete, and up to date.",
      icon: Crosshair,
    },
    {
      title: "Automate Follow-Up",
      text: "AI handles the right follow-up at the right time so every lead stays engaged and warm.",
      icon: Zap,
    },
    {
      title: "See What Matters",
      text: "Unified analytics show pipeline health, conversion trends, and performance that drives growth.",
      icon: BarChart3,
    },
    {
      title: "Coordinate the Team",
      text: "Align tasks, conversations, and deal progress across your entire team in real time.",
      icon: Users,
    },
  ];

  return (
    <main className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.aboutHero}>
        <div className={styles.aboutHeroText}>
          <div className={styles.aboutBadge}>ABOUT CORTEXA</div>
          <h1>
            The intelligence layer behind modern <span>real estate operations.</span>
          </h1>
          <p>
            CORTEXA unifies leads, listings, conversations, automations, analytics,
            and team workflows into one AI operating system built for real estate professionals.
          </p>
        </div>

        <img src={aboutTopImg} className={styles.aboutTop} />
      </section>

      {/* Problem Section */}
      <section className={styles.aboutProblemSection}>
        <h2>
          Real estate doesn’t have a lead problem. <br />
          It has an <span>operations problem.</span>
        </h2>
        <p>Leads come from many channels but are rarely connected in one system.</p>

        <div className={styles.aboutProblemGrid}>
          {problemCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={styles.aboutProblemCard}>
                <div className={styles.problemCardIconWrap}>
                  <Icon size={42} />
                </div>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connect Section */}
      <section className={styles.aboutConnectSection}>
        <div className={styles.aboutConnectText}>
          <span>HOW CORTEXA CONNECTS EVERYTHING</span>
          <h2>One operating system for your entire real estate workflow.</h2>
          <p>
            CORTEXA connects your channels, syncs your data, and turns scattered
            activity into coordinated action.
          </p>
        </div>

        <img src={aboutCenterImg} className={styles.aboutCenter} />
      </section>

      {/* What CORTEXA Does Section */}
      <section className={styles.aboutWhatSection}>
       
        <div className={styles.aboutWhatGrid}>
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={styles.aboutWhatCard}>
                <div className={styles.aboutWhatIcon}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Callout Section */}
      <section className={styles.aboutFinalSection}>
        <div className={styles.finalSectionText}>
          <h2>
            Built for real estate professionals. Designed to make the entire business{" "}
            <span>think and move as one.</span>
          </h2>
          <p>
            We believe technology should simplify the complex, not add to it.
            CORTEXA brings clarity, speed, and intelligence to every part of your
            real estate business.
          </p>
        </div>

        <img src={aboutBottomImg} className={styles.aboutBottom} />
      </section>
    </main>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className={styles.aboutMiniMetric}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>+17% vs last week</small>
    </div>
  );
}

function MiniBox({ title, value }) {
  return (
    <div className={styles.aboutMiniBox}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}