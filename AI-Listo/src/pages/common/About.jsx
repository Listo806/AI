import React from "react";
import styles from "./About.module.css";
import {
  ScatterChart,
  Timer,
  Puzzle,
  Crosshair,
  Zap,
  BarChart3,
  Users,
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
            The intelligence layer behind <br />modern <span>real estate operations.</span>
          </h1>
          <p>
            CORTEXA was built to unify leads, listings, conversations, automations, analytics, and team workflows into one intelligent operating system for real estate professionals.
          </p>
          <p>
            Our mission is simple: bring modern AI and connected systems into a fragmented industry to make daily work simpler, faster, and more effective.
          </p>
        </div>

        <img src={aboutTopImg} alt="AI Command Center" className={styles.aboutTop} />
      </section>

      {/* Problem Section */}
      <section className={styles.aboutProblemSection}>
        <h2>
          Why CORTEXA exists
        </h2>
        <p>
          Real estate doesn’t just have a lead problem — it has an <strong>operations problem.</strong><br />
          Leads, listings, inboxes, calendars, teams, and follow-up tools often live in separate places. <br />
          That fragmentation creates delays, missed opportunities, and unnecessary complexity.
        </p>

        <div className={styles.aboutProblemGrid}>
          {problemCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={styles.aboutProblemCard}>
                <div className={styles.problemCardIconWrap}>
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

      {/* Connect Section */}
      <section className={styles.aboutConnectSection}>
        <div className={styles.aboutConnectText}>
          <h2>How CORTEXA connects the business</h2>
          <p>
            CORTEXA brings every part of your workflow into one connected system. <br />
            Information flows in, intelligence does the work, and actions flow out — automatically.
          </p>
        </div>

        <img src={aboutCenterImg} alt="Cortexa Integration Map" className={styles.aboutCenter} />
      </section>

      {/* What CORTEXA Does Section */}
      <section className={styles.aboutWhatSection}>
        <h2>What CORTEXA helps teams do</h2>
        <div className={styles.aboutWhatGrid}>
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={styles.aboutWhatCard}>
                <div className={styles.aboutWhatIcon}>
                  <Icon size={28} />
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
            Built for real estate professionals. <br />
            Designed to make the entire business <span>think and move as one.</span>
          </h2>
          <p>
            We believe technology should simplify the complex, not add to it. <br />
            CORTEXA connects AI, data, communications, and workflow systems so you can spend less time managing tools and more time helping clients and closing deals.
          </p>
        </div>

        <img src={aboutBottomImg} alt="Real Estate Core Visual" className={styles.aboutBottom} />
      </section>
    </main>
  );
}