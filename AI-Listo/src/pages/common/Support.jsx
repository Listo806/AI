import React, { useState } from "react";
import styles from "./Support.module.css";
import {
  Bot,
  Lock,
  CreditCard,
  MessageCircle,
  CloudUpload,
  Home,
  Link2,
  Users,
  Bug,
  Wrench,
  Headphones,
  ClipboardCheck,
  Mail,
  PlusSquare,
  BookOpen,
  Send,
  Paperclip,
  Mic,
  ChevronRight,
} from "lucide-react";

export default function SupportHub() {
  const [query, setQuery] = useState("");
  const issueChips = [
    ["Login & Access", Lock, "#2563EB", "#EEF5FF"],
    ["Billing Issue", CreditCard, "#F97316", "#FFF3EA"],
    ["WhatsApp Support", MessageCircle, "#059669", "#EAFBF2"],
    ["Import Leads Problem", CloudUpload, "#DC2626", "#FEE2E2"],
    ["Listings Not Showing", Home, "#6D5BFF", "#F1EDFF"],
    ["Apps & Integrations", Link2, "#0891B2", "#ECFEFF"],
    ["Invite Team Member", Users, "#DB2777", "#FCE7F3"],
    ["Report a Bug", Bug, "#4B5563", "#F3F4F6"],
  ];
  const supportCards = [
    {
      title: "Troubleshoot a Problem",
      text: "Get step-by-step help to solve issues fast.",
      icon: Wrench,
      bg: "#EEF5FF",
      color: "#2563EB",
    },
    {
      title: "Escalate to Support",
      text: "Connect with a real human when you need expert help.",
      icon: Headphones,
      bg: "#F1EDFF",
      color: "#6D5BFF",
    },
    {
      title: "Track a Request",
      text: "Check the status of your open requests and past tickets.",
      icon: ClipboardCheck,
      bg: "#EAFBF2",
      color: "#059669",
    },
    {
      title: "Account & Billing",
      text: "Get help with billing, plans, payments, and account access.",
      icon: CreditCard,
      bg: "#FFF3EA",
      color: "#F97316",
    },
  ];
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    console.log("AI câu hỏi của user:", query);
    // API AI Chatbot here...
    setQuery("");
  };

  return (
    <main className={styles.supportPage}>
      <section className={styles.supportHero}>
        <div className={styles.supportBadge}>
          <Bot size={18} />
          24-7 AI Assist
        </div>
        <div className={styles.supportAiBox}>
          <form className={styles.supportAskBox} onSubmit={handleSend}>
            <MessageCircle className={styles.aiChatIcon} size={20} />

            <input
              type="text"
              className={styles.aiInput}
              placeholder="Ask AI for help..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className={styles.supportAskActions}>
              <button type="button" className={styles.actionIconButton}>
                <Paperclip size={20} />
              </button>
              <button type="button" className={styles.actionIconButton}>
                <Mic size={20} />
              </button>
              <button type="submit" className={styles.sendButtonActive}>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.supportIssueSection}>
        <div className={styles.supportChipGrid}>
          {issueChips.map(([label, Icon, color, bg]) => (
            <button key={label} className={styles.supportIssueChip}>
              <div className={styles.chipIconWrap} style={{ color: color }}>
                <Icon size={18} />
              </div>
              {label}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>

      <section className={styles.supportHelpSection}>
        <div className={styles.supportGridStyle}>
          {supportCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className={styles.supportCard}>
                <div
                  className={styles.supportCardIcon}
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon size={34} />
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

      <section className={styles.supportBottomBar}>
        <BottomAction
          icon={<Mail size={30} />}
          title="Email Support"
          text="We’ll get back to you."
        />

        <BottomAction
          icon={<PlusSquare size={30} />}
          title="Open Support Ticket"
          text="Submit a request and track progress."
        />

        <BottomAction
          icon={<BookOpen size={30} />}
          title="Help Center"
          text="Guides, tutorials and resources."
        />
      </section>
    </main>
  );
}

function Field({ label, icon, placeholder }) {
  return (
    <div className={styles.contactFieldGroup}>
      <label>{label}</label>

      <div className={styles.contactInputRow}>
        {icon}
        <span>{placeholder}</span>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text, color, bg }) {
  return (
    <div className={styles.contactInfoCard}>
      <div className={styles.contactInfoIcon} style={{ background: bg, color }}>
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
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

function BottomAction({ icon, title, text }) {
  return (
    <div className={styles.bottomAction}>
      <div className={styles.bottomIcon}>{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <ChevronRight size={24} />
    </div>
  );
}
