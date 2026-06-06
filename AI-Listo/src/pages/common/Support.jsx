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
  ArrowRight, // Đảm bảo import ArrowRight bị thiếu ở file cũ
  User,
  Briefcase,
  Clock,
  CheckCircle,
  ScatterChart,
  Timer,
  Puzzle,
  Crosshair,
  Zap, // Đảm bảo import Zap bị thiếu ở file cũ
  BarChart3, // Đảm bảo import BarChart3 bị thiếu ở file cũ
  Building2,
} from "lucide-react";

export default function SupportHub() {
  const issueChips = [
    ["Login & Access", Lock],
    ["Billing Issue", CreditCard],
    ["WhatsApp Support", MessageCircle],
    ["Import Leads Problem", CloudUpload],
    ["Listings Not Showing", Home],
    ["Apps & Integrations", Link2],
    ["Invite Team Member", Users],
    ["Report a Bug", Bug],
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
              <div>
                <Paperclip size={24} />
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
          {issueChips.map(([label, Icon]) => (
            <button key={label} className={styles.supportIssueChip}>
              <Icon size={21} />
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


/* =========================================================
   2. HELP CENTER PAGE
========================================================= */
export function HelpCenterPage() {
  const categories = [
    {
      title: "Getting Started",
      text: "Set up your workspace and get up to speed fast.",
      count: "8 guides",
      icon: Rocket,
      bg: "#EEF5FF",
      color: "#2563EB",
    },
    {
      title: "WhatsApp Setup",
      text: "Connect WhatsApp and automate conversations.",
      count: "6 guides",
      icon: MessageCircle,
      bg: "#EAFBF2",
      color: "#22C55E",
    },
    {
      title: "Leads & Contacts",
      text: "Manage leads, contacts, and follow-ups.",
      count: "12 articles",
      icon: Users,
      bg: "#F1EDFF",
      color: "#6D5BFF",
    },
    {
      title: "Listings & Properties",
      text: "Create, edit, and manage your listings.",
      count: "10 articles",
      icon: Home,
      bg: "#EEF5FF",
      color: "#2563EB",
    },
    {
      title: "Pipeline & Deals",
      text: "Track stages and manage opportunities.",
      count: "14 articles",
      icon: Funnel,
      bg: "#FFF3EA",
      color: "#F97316",
    },
    {
      title: "Apps & Integrations",
      text: "Connect tools, webhooks, and automations.",
      count: "9 guides",
      icon: Link2,
      bg: "#F1EDFF",
      color: "#6D5BFF",
    },
    {
      title: "Team & Seats",
      text: "Invite members and manage access.",
      count: "7 guides",
      icon: Users,
      bg: "#FFF3EA",
      color: "#F97316",
    },
    {
      title: "Billing & Plans",
      text: "Invoices, subscriptions, and plan management.",
      count: "6 articles",
      icon: CreditCard,
      bg: "#EAFBF2",
      color: "#059669",
    },
  ];

  const filters = [
    ["Getting Started", Rocket],
    ["WhatsApp Setup", MessageCircle],
    ["Import Leads", CloudUpload],
    ["Pipeline & Deals", Funnel],
    ["Billing", CreditCard],
    ["Login Issues", Shield],
  ];

  return (
    <main className={styles.helpPage}>
      <PublicHeader />

      <section className={styles.helpHero}>
        <div className={styles.helpBadge}>
          <BookOpen size={18} />
          CORTEXA OS HELP CENTER
        </div>

        <h1 className={styles.helpTitle}>
          Learn every part of your <span>CORTEXA OS.</span>
        </h1>

        <p className={styles.helpSubtitle}>
          Browse setup guides, tutorials, workflows, and best practices for running
          your real estate business inside CORTEXA.
        </p>

        <div className={styles.helpSearchBox}>
          <Search size={26} />
          <span>Search guides, tutorials, setup steps, and workflows...</span>
        </div>

        <div className={styles.helpFilterRow}>
          {filters.map(([label, Icon]) => (
            <button key={label}>
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.helpCategoryGrid}>
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <div key={category.title} className={styles.helpCategoryCard}>
              <div 
                className={styles.helpCategoryIcon} 
                style={{ background: category.bg, color: category.color }}
              >
                <Icon size={40} />
              </div>

              <div>
                <h3>{category.title}</h3>
                <p>{category.text}</p>

                <div className={styles.helpCardBottom}>
                  <a href="/help-center">
                    View guides <ArrowRight size={17} />
                  </a>
                  <span>{category.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className={styles.helpBottomBar}>
        <BottomAction
          icon={<BookOpen size={30} />}
          title="Popular Articles"
          text="Browse top guides and frequently read articles."
        />

        <BottomAction
          icon={<PlaySquare size={30} />}
          title="Video Tutorials"
          text="Watch step-by-step videos and product walkthroughs."
        />

        <BottomAction
          icon={<Headphones size={30} />}
          title="Need Instant Help?"
          text="Open 24-7 AI Support for quick answers anytime."
        />
      </section>

      <div className={styles.helpTrustLine}>
        <ShieldCheck size={20} />
        Trusted by thousands of teams. Your data is secure and never shared.
      </div>
    </main>
  );
}


/* =========================================================
   3. CONTACT PAGE
========================================================= */
export function ContactPage() {
  const helpItems = [
    "Account support",
    "Billing questions",
    "Technical issues",
    "Sales & partnerships",
    "General inquiries",
  ];

  return (
    <main className={styles.contactPage}>
      <PublicHeader />

      <section className={styles.contactHero}>
        <div className={styles.contactBadge}>
          <Mail size={18} />
          CONTACT CORTEXA
        </div>

        <h1 className={styles.contactTitle}>
          Get in touch with the <span>CORTEXA</span> team.
        </h1>

        <p className={styles.contactSubtitle}>
          Send us your question and we’ll route it to the right team as quickly as possible.
        </p>
      </section>

      <section className={styles.contactGrid}>
        <form className={styles.contactFormBox}>
          <Field label="Full Name" icon={<User size={19} />} placeholder="Enter your full name" />
          <Field label="Email" icon={<Mail size={19} />} placeholder="Enter your email address" />
          <Field label="Company (Optional)" icon={<Briefcase size={19} />} placeholder="Enter your company name" />

          <div className={styles.contactFieldGroup}>
            <label>Reason for Contact</label>

            <div className={styles.contactSelectRow}>
              <MessageCircle size={19} />
              <span>Select a reason</span>
              <ChevronDown size={18} />
            </div>

            <div className={styles.contactReasonMenu}>
              <span>Account Support</span>
              <span>Billing Question</span>
              <span>Sales & Partnerships</span>
              <span>Technical Issue</span>
              <span>General Inquiry</span>
            </div>
          </div>

          <div className={styles.contactFieldGroup}>
            <label>Message</label>

            <div className={styles.contactMessageBox}>
              <Paperclip size={19} />
              <span>Tell us how we can help you...</span>
            </div>
          </div>

          <button type="button" className={styles.contactSendButton}>
            <Send size={20} />
            Send Message
          </button>
        </form>

        <aside className={styles.contactSideColumn}>
          <InfoCard
            icon={<Mail size={34} />}
            title="Support Email"
            text="support@cortexacrm.com"
            color="#2563EB"
            bg="#EEF5FF"
          />

          <InfoCard
            icon={<Clock size={34} />}
            title="Response Time"
            text="Usually within 24 hours"
            color="#6D5BFF"
            bg="#F1EDFF"
          />

          <div className={styles.contactHelpCard}>
            <div className={styles.contactHelpIcon}>
              <Headphones size={34} />
            </div>

            <h3>What can we help with?</h3>

            {helpItems.map((item) => (
              <div key={item} className={styles.contactHelpItem}>
                <CheckCircle size={18} />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.contactBottomBar}>
        <BottomAction
          icon={<Mail size={30} />}
          title="Support Email"
          text="support@cortexacrm.com"
        />

        <BottomAction
          icon={<Clock size={30} />}
          title="Response Time"
          text="Usually within 24 hours"
        />

        <BottomAction
          icon={<Headphones size={30} />}
          title="Need instant help?"
          text="Open 24-7 AI Support"
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


/* =========================================================
   4. ABOUT PAGE
========================================================= */
export function AboutPage() {
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
      <PublicHeader />

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

        <div className={styles.aboutCommandVisual}>
          <div className={styles.aboutVisualTitle}>CORTEXA AI COMMAND CENTER</div>

          <div className={styles.aboutVisualGrid}>
            <div className={styles.aboutSignalColumn}>
              <MiniMetric label="New Leads" value="248" />
              <MiniMetric label="Active Deals" value="$2.48M" />
              <MiniMetric label="Revenue" value="$680K" />
              <MiniMetric label="Conversations" value="326" />
            </div>

            <div className={styles.aboutCenterBrain}>
              <Bot size={76} />
            </div>

            <div className={styles.aboutPipelinePanel}>
              <h4>Pipeline Overview</h4>
              <div className={styles.aboutFunnel} style={{ width: "100%" }} />
              <div className={styles.aboutFunnel} style={{ width: "82%" }} />
              <div className={styles.aboutFunnel} style={{ width: "64%" }} />
              <div className={styles.aboutFunnel} style={{ width: "48%" }} />
              <p>Total Pipeline Value</p>
              <strong>$2.48M</strong>
            </div>
          </div>

          <div className={styles.aboutVisualBottom}>
            <MiniBox title="AI Workflows" value="Active" />
            <MiniBox title="AI Confidence" value="92%" />
            <MiniBox title="Next Best Action" value="Follow up with Maria Lopez" />
          </div>
        </div>
      </section>

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
                <Icon size={42} />
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.aboutConnectSection}>
        <div>
          <span>HOW CORTEXA CONNECTS EVERYTHING</span>
          <h2>One operating system for your entire real estate workflow.</h2>
          <p>
            CORTEXA connects your channels, syncs your data, and turns scattered
            activity into coordinated action.
          </p>
        </div>

        <div className={styles.aboutConnectVisual}>
          <div className={styles.aboutLeftApps}>
            {["WhatsApp", "Website Forms", "Listings", "Ads", "Email"].map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>

          <div className={styles.aboutCenterCore}>
            <Bot size={52} />
            <strong>CORTEXA</strong>
          </div>

          <div className={styles.aboutRightApps}>
            {["Calendar", "Teams", "CSV / Excel", "API / Webhooks", "CRM / Contacts"].map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.aboutWhatSection}>
        <span>WHAT CORTEXA DOES</span>

        <div className={styles.aboutWhatGrid}>
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className={styles.aboutWhatCard}>
                <div className={styles.aboutWhatIcon}>
                  <Icon size={46} />
                </div>

                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.aboutFinalSection}>
        <div>
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

        <div className={styles.aboutCityVisual}>
          <Building2 size={72} />
          <Bot size={56} />
        </div>
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


/* =========================================================
   SHARED PUBLIC HEADER
========================================================= */
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