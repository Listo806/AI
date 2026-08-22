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
  ShieldCheck,
  Search
} from "lucide-react";

export default function SupportHub() {
  const [query, setQuery] = useState("");
  const issueChips = [
    ["Login & Access", Lock, "#111827"],
    ["Billing Issues", CreditCard, "#111827"],
    ["WhatsApp Support", MessageCircle, "#111827"],
    ["Import Leads Problem", CloudUpload, "#111827"],
    ["Listings Not Showing", Home, "#111827"],
    ["Apps & Integrations", Link2, "#111827"],
    ["Invite Team Member", Users, "#111827"],
    ["Report a Bug", Bug, "#111827"],
  ];
  
  const supportCards = [
    {
      title: "Troubleshoot a Problem",
      text: "Get step-by-step help to solve issues fast.",
      icon: Wrench,
    },
    {
      title: "Escalate to Support",
      text: "Connect with a real human when you need expert help.",
      icon: Headphones,
    },
    {
      title: "Track a Request",
      text: "Check the status of your open requests and past tickets.",
      icon: ClipboardCheck,
    },
    {
      title: "Account & Billing",
      text: "Get help with billing, plans, payments, and account access.",
      icon: CreditCard,
    },
  ];

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    console.log("AI câu hỏi của user:", query);
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
            <Search className={styles.aiChatIcon} size={20} />

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
          {issueChips.map(([label, Icon, color]) => (
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
                <div className={styles.supportCardIcon}>
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
        <BottomActionSP
          icon={<Mail size={30} />}
          title="Email Support"
          text="We'll get back to you."
        />

        <BottomActionSP
          icon={<PlusSquare size={30} />}
          title="Open Support Ticket"
          text="Submit a request and track progress."
        />

        <BottomActionSP
          icon={<BookOpen size={30} />}
          title="Help Center"
          text="Guides, tutorials and resources."
        />
      </section>

      <div className={styles.supportSecurityFooter}>
        <ShieldCheck size={17} />
        <span>Your data is secure with enterprise-grade protection.</span>
      </div>
    </main>
  );
}

function BottomActionSP({ icon, title, text }) {
  return (
    <div className={styles.bottomAction}>
      <div className={styles.bottomIcon}>{icon}</div>

      <div className={styles.bottomActionTextWrap}>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <ChevronRight size={24} className={styles.arrowRightIcon} />
    </div>
  );
}