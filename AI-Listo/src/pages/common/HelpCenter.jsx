import React, { useState } from "react";
import styles from "./Help.module.css";
import {
  Search,
  Rocket,
  MessageCircle,
  CloudUpload,
  GitBranch,
  CreditCard,
  Lock,
  Users,
  Home,
  Layers,
  Users2,
  FileText,
  Video,
  Bell,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from "lucide-react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const quickChips = [
    { label: "Getting Started", icon: Rocket, color: "#2563EB" },
    { label: "WhatsApp Setup", icon: MessageCircle, color: "#059669" },
    { label: "Import Leads", icon: CloudUpload, color: "#7C3AED" },
    { label: "Pipeline & Deals", icon: GitBranch, color: "#EA580C" },
    { label: "Billing", icon: CreditCard, color: "#2563EB" },
    { label: "Login Issues", icon: Lock, color: "#DC2626" },
  ];

  const helpCards = [
    {
      title: "Getting Started",
      text: "Set up your workspace and get your agent fast.",
      icon: Rocket,
      articles: "9 articles",
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      title: "WhatsApp Setup",
      text: "Connect WhatsApp and automate conversations.",
      icon: MessageCircle,
      articles: "6 articles",
      color: "#059669",
      bg: "#EAFBF2",
    },
    {
      title: "Leads & Contacts",
      text: "Manage leads, contacts, and follow-ups.",
      icon: Users,
      articles: "12 articles",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      title: "Listings & Properties",
      text: "Create, edit, and manage your listings.",
      icon: Home,
      articles: "10 articles",
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      title: "Pipeline & Deals",
      text: "Track inquiries and manage opportunities.",
      icon: GitBranch,
      articles: "14 articles",
      color: "#EA580C",
      bg: "#FFF7ED",
    },
    {
      title: "Apps & Integrations",
      text: "Connect tools, websites, and automation.",
      icon: Layers,
      articles: "8 articles",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      title: "Team & Seats",
      text: "Invite team members and manage access.",
      icon: Users2,
      articles: "7 articles",
      color: "#F97316",
      bg: "#FFF3EA",
    },
    {
      title: "Billing & Plans",
      text: "View plans, subscriptions, and payment management.",
      icon: CreditCard,
      articles: "6 articles",
      color: "#059669",
      bg: "#EAFBF2",
    },
  ];

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  return (
    <main className={styles.supportPage}>
      <section className={styles.supportHero}>
        <div className={styles.supportBadge}>
          <BookOpen size={16} />
          CORTEXA OS HELP CENTER
        </div>
        
        <div className={styles.supportAiBox}>
          <form className={styles.supportAskBox} onSubmit={handleSearch}>
            <Search className={styles.aiChatIcon} size={20} />
            <input
              type="text"
              className={styles.aiInput}
              placeholder="Search guides, tutorials, setup steps, and workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </section>

      {/* Quick Chips Section */}
      <section className={styles.supportIssueSection}>
        <div className={styles.supportChipGrid}>
          {quickChips.map((chip, index) => {
            const Icon = chip.icon;
            return (
              <button key={index} className={styles.supportIssueChip}>
                <div style={{ color: chip.color, display: "flex", alignItems: "center" }}>
                  <Icon size={18} />
                </div>
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid Section (8 Cards) */}
      <section className={styles.supportHelpSection}>
        <div className={styles.supportGridStyle}>
          {helpCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className={styles.helpCardItem}>
                <div className={styles.cardMainContent}>
                  <div
                    className={styles.supportCardIcon}
                    style={{ background: card.bg, color: card.color }}
                  >
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>
                </div>
                
                <div className={styles.cardFooterBar}>
                  <a href="#guides" className={styles.viewGuidesLink}>
                    View guides <ArrowRight size={14} />
                  </a>
                  <span className={styles.articleCountText}>{card.articles}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Bar Section */}
      <section className={styles.supportBottomBar}>
        <BottomAction
          icon={<FileText size={24} />}
          title="Popular Articles"
          text="Browse top guides and frequently read articles."
          iconBg="#EEF5FF"
          iconColor="#2563EB"
        />

        <BottomAction
          icon={<Video size={24} />}
          title="Video Tutorials"
          text="Watch step-by-step videos and product walkthroughs."
          iconBg="#F1EDFF"
          iconColor="#6D5BFF"
        />

        <BottomAction
          icon={<Bell size={24} />}
          title="Need Instant Help?"
          text="Open 24/7 AI Support for quick answers anytime."
          iconBg="#EAFBF2"
          iconColor="#059669"
          isAiLink={true}
        />
      </section>
    </main>
  );
}

function BottomAction({ icon, title, text, iconBg, iconColor, isAiLink }) {
  return (
    <div className={styles.bottomAction}>
      <div className={styles.bottomIcon} style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>

      <div className={styles.bottomActionTextWrap}>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      {isAiLink ? (
        <a href="#ai-support" className={styles.openAiSupportLink}>
          Open AI Support <ArrowRight size={14} />
        </a>
      ) : (
        <ChevronRight size={20} className={styles.arrowRightIcon} />
      )}
    </div>
  );
}