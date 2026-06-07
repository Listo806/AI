import React from "react";
import styles from "./Support.module.css"; 
import headlogoImg from "../../assets/cortexa/headlogo.png";
import {
  Bot,
  Workflow,
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
  ShieldCheck,
  Globe,
  ChevronDown,
  ChevronRight,
  Search,
  Rocket,
  Funnel,
  Shield,
  PlaySquare,
  ArrowRight,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  ScatterChart,
  Timer,
  Puzzle,
  Crosshair,
  Zap, 
  BarChart3,
  Building2,
} from "lucide-react";

export default function SupportHub() {
  
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
      text: "Get step-by-step help to fix issues fast with AI guidance.",
      icon: Wrench,
      bg: "#EEF5FF",
      color: "#2563EB",
    },
    {
      title: "Escalate to Support Team",
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
      title: "Account & Billing Help",
      text: "Get help with billing, plans, payments, and account access.",
      icon: CreditCard,
      bg: "#FFF3EA",
      color: "#F97316",
    },
  ];

  return (
    <main className={styles.supportPage}>
      <PublicHeader />

      <section className={styles.supportHero}>
        <div className={styles.supportBadge}>
          <Bot size={18} />
          24-7 AI SUPPORT
        </div>

        <h1 className={styles.supportTitle}>
          Get instant help from <span>CORTEXA Support.</span>
        </h1>

        <p className={styles.supportSubtitle}>
          Our AI assistant can answer questions, troubleshoot issues, and escalate
          to our support team when needed.
        </p>

        <div className={styles.supportAiBox}>
          <div className={styles.supportTabs}>
            <button className={styles.supportActiveTab}>
              <Bot size={18} />
              Ask AI
            </button>

            <button className={styles.supportTab}>
              <Workflow size={18} />
              Support Workflows
            </button>

            <div className={styles.supportOnlineBadge}>
              <span />
              CORTEXA AI is online
              <ChevronDown size={15} />
            </div>
          </div>

          <div className={styles.supportAssistantRow}>
            <div className={styles.supportBotAvatar}>
              <Bot size={34} />
              <i />
            </div>

            <div>
              <h3>CORTEXA AI Assistant</h3>
              <p>Always here to help. Fast answers. Real support.</p>
            </div>
          </div>

          <div className={styles.supportAskBox}>
            <p>Describe your issue, ask a question, or tell us what you need help with...</p>

            <div className={styles.supportAskActions}>
              <div className={styles.supportWrap}>
                <Paperclip size={24} />
                <div className={styles.supportLine}></div>
                <Mic size={24} />
              </div>

              <button>
                <Send size={24} />
              </button>
            </div>
          </div>

          <div className={styles.supportSecurityLine}>
            <ShieldCheck size={17} />
            Your conversations are secure and only used to help resolve your issue.
          </div>
        </div>
      </section>

      <section className={styles.supportIssueSection}>
        <h2>Resolve common issues quickly</h2>

        <div className={styles.supportChipGrid}>
          {issueChips.map(([label, Icon, color, bg]) => (
            <button key={label} className={styles.supportIssueChip}>
              <div 
                className={styles.chipIconWrap} 
                style={{ color: color }}
              >
                <Icon size={18} />
              </div>
              {label}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      </section>

      <section className={styles.supportHelpSection}>
        <h2>What can CORTEXA Support help with?</h2>

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
          text="Get help via email. We’ll get back to you."
        />

        <BottomAction
          icon={<PlusSquare size={30} />}
          title="Open Support Ticket"
          text="Submit a request and track its progress."
        />

        <BottomAction
          icon={<BookOpen size={30} />}
          title="Need Help Learning the Platform?"
          text="Visit the Help Center for guides and tutorials."
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
      <div 
        className={styles.contactInfoIcon} 
        style={{ background: bg, color }}
      >
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

function PublicHeader() {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logoWrap}>
        <img src={headlogoImg} className="cx-logo-img" />
      </a>

      <div className={styles.headerRight}>
        <Globe size={22} />
        <span>EN</span>
        <ChevronDown size={16} />
        <div className={styles.avatar}>A</div>
      </div>
    </header>
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