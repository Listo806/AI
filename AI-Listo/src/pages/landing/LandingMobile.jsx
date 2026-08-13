import { useState, useEffect } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Play,
  ArrowRight,
  Zap,
  Globe,
  MapPin,
  ArrowUp,
  LogIn,
  Bot,
  MessageCircle,
  LayoutDashboard,
  GitMerge,
  Link2,
  UserCheck,
  Users,
  Home,
  XCircle,
  CheckCircle2,
  TrendingUp,
  CheckCircle,
  BarChart3,
  ChartNoAxesCombined,
  GitFork,
  Users2,
  FileText,
  Sparkles,
  Infinity,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Contact2,
  Funnel,
  Mail,
  CalendarDays,
  Workflow,
  CircleDollarSign,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { HashLink } from "react-router-hash-link";
import "./LandingMobile.css";

import headlogoImg from "../../assets/cortexa/headlogotran.png";
import landingDashImg from "../../assets/cortexa/mobile/m_dash1.png";
import dashboardMockupImg from "../../assets/cortexa/mobile/im_auto.png";
import featurechart from "../../assets/cortexa/mobile/featurechart.png";
import powerfulM from "../../assets/cortexa/mobile/powerfulM.png";
import workspaceImg from "../../assets/cortexa/mobile/workspaceM.png";
import workspaceImgES from "../../assets/cortexa/mobile/workspaceESM.png";
import workspaceImgPT from "../../assets/cortexa/mobile/workspacePTM.png";
import bgreportingImg from "../../assets/cortexa/mobile/bg_reporting.png";

function ReportingSection({ tr }) {
  const copy = tr.reportingSection;

  const pipelineRows = [
    { name: "Alex Johnson", value: "$48,100", stage: copy.stageNew },
    { name: "David Kim", value: "$36,000", stage: copy.stageContacted },
    { name: "David Brown", value: "$19,000", stage: copy.stageProposal },
    { name: "Jane Brown", value: "$17,000", stage: copy.stageWon },
  ];

  const teamRows = [
    { name: "Sophia Moore", action: copy.updatedDeal, time: "2m" },
    { name: "Daniel Kim", action: copy.addedNote, time: "15m" },
    { name: "Olivia Martinez", action: copy.commented, time: "1h" },
    { name: "James Wilson", action: copy.changedStage, time: "2h" },
  ];

  return (
    <section className="cx-reporting-section">
      <div className="cx-reporting-container">
        <div className="cx-reporting-eyebrow">
          <BarChart3 size={19} />
          <span>{copy.eyebrow}</span>
        </div>
        <div className="cx-reporting-intro-wrap">
          <div className="cx-reporting-intro">
            <h2>
              {copy.titleLine1}
              <br />
              {copy.titleLine2}
              {copy.titleHighlight}
            </h2>
          </div>
          {/*<div className="cx-reporting-intro-right">
            <img src={bgreportingImg} alt="CORTEXA" className="background" />
          </div>*/}
        </div>

        <div className="cx-reporting-wrap">
          {/*<div className="cx-reporting-feature-list">
            <p>{copy.description}</p>
            {copy.features.map((feature, index) => {
              const icons = [ChartNoAxesCombined, GitFork, Users2, FileText];
              const Icon = icons[index];

              return (
                <article className="cx-reporting-feature" key={feature.title}>
                  <div className="cx-reporting-feature-icon-wrap">
                    <div className="cx-reporting-feature-icon">
                      <Icon size={16} />
                    </div>
                    <h3>{feature.title}</h3>
                  </div>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>*/}

          <div className="cx-reporting-showcase">
            <article className="cx-report-card cx-performance-card">
              <div className="cx-report-card-head">
                <strong>{copy.performanceTitle}</strong>
                <span>•••</span>
              </div>

              <div className="cx-report-kpis">
                <div>
                  <span>{copy.conversionRate}</span>
                  <strong>34.8%</strong>
                  <small>↑ 12.4%</small>
                </div>
                <div>
                  <span>{copy.revenueGenerated}</span>
                  <strong>$18,450</strong>
                  <small>↑ 9.1%</small>
                </div>
                <div>
                  <span>{copy.responseTime}</span>
                  <strong>2.4h</strong>
                  <small>↓ 8.3%</small>
                </div>
              </div>

              <div className="cx-report-line-chart">
                <svg
                  viewBox="0 0 520 150"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#7c3aed"
                        stopOpacity="0.25"
                      />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M5,120 L45,100 L85,82 L125,104 L165,60 L205,92 L245,67 L285,43 L325,60 L365,48 L405,30 L455,20 L515,6 L515,150 L5,150 Z"
                    fill="url(#reportFill)"
                  />
                  <polyline
                    points="5,120 45,100 85,82 125,104 165,60 205,92 245,67 285,43 325,60 365,48 405,30 455,20 515,6"
                    fill="none"
                    stroke="#6d28d9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="cx-report-growth">
                  ↑ 22%<small>{copy.lastSevenDays}</small>
                </span>
              </div>

              <div className="cx-report-insight">
                <Sparkles size={18} />
                <div>
                  <strong>{copy.aiInsight}</strong>
                </div>
              </div>
              <p>{copy.insightText}</p>
            </article>

            <article className="cx-report-card cx-pipeline-card">
              <div className="cx-report-card-head">
                <strong>{copy.pipelineTitle}</strong>
                <span>•••</span>
              </div>

              <div className="cx-pipeline-stages">
                <span className="blue">
                  {copy.stageNew}
                  <small>12 {copy.deals}</small>
                </span>
                <span className="purple">
                  {copy.stageContacted}
                  <small>8 {copy.deals}</small>
                </span>
                <span className="yellow">
                  {copy.stageProposal}
                  <small>6 {copy.deals}</small>
                </span>
                <span className="green">
                  {copy.stageWon}
                  <small>5 {copy.deals}</small>
                </span>
              </div>

              <div className="cx-pipeline-list">
                {pipelineRows.map((row, index) => (
                  <div className="cx-pipeline-row" key={`${row.name}-${index}`}>
                    <img
                      src="https://i.pravatar.cc/150"
                      alt="Team member"
                      className="cx-mini-avatar"
                    />
                    <strong>{row.name}</strong>
                    <span>{row.value}</span>
                    <em>{row.stage}</em>
                  </div>
                ))}
              </div>

              <button type="button" className="cx-report-button">
                {copy.viewPipeline} <ArrowRight size={16} />
              </button>
            </article>

            <article className="cx-report-card cx-team-card">
              <div className="cx-report-card-head">
                <strong>{copy.teamActivityTitle}</strong>
                <button type="button">+ {copy.invite}</button>
              </div>

              <div className="cx-team-activity-list">
                {teamRows.map((row, index) => (
                  <div
                    className="cx-team-activity-row"
                    key={`${row.name}-${index}`}
                  >
                    <img
                      src="https://i.pravatar.cc/149"
                      alt="Team member"
                      className="cx-mini-avatar"
                    />
                    <div>
                      <strong>{row.name}</strong>
                      <small>{row.action}</small>
                    </div>
                    <time>{row.time} ago</time>
                    <i />
                  </div>
                ))}
              </div>

              <button type="button" className="cx-report-link">
                {copy.viewActivity} <ArrowRight size={15} />
              </button>
            </article>

            <article className="cx-report-card cx-revenue-card">
              <div className="cx-report-card-head">
                <strong>{copy.revenueReportTitle}</strong>
                <span>{copy.thisMonth}⌄</span>
              </div>

              <div className="cx-revenue-kpis">
                <div>
                  <span>{copy.totalRevenue}</span>
                  <strong>$28,450</strong>
                  <small>↑ 18.6%</small>
                </div>
                <div>
                  <span>{copy.dealsClosed}</span>
                  <strong>24</strong>
                  <small>↑ 26.3%</small>
                </div>
                <div>
                  <span>{copy.averageDeal}</span>
                  <strong>$1,185</strong>
                  <small>↑ 11.4%</small>
                </div>
              </div>

              <div className="cx-revenue-bars">
                {[42, 62, 76, 55, 88].map((height, index) => (
                  <div key={index}>
                    <span style={{ height: `${height}%` }} />
                    <small>
                      {["May 1", "May 8", "May 15", "May 22", "May 29"][index]}
                    </small>
                  </div>
                ))}
              </div>

              <button type="button" className="cx-report-link">
                {copy.downloadReport} <ArrowRight size={15} />
              </button>
            </article>
          </div>
        </div>

        <div className="cx-reporting-footer">
          <div>
            <h2>
              {copy.footerTitle}
              <br />
              {copy.footerTitle1}
              <br />
              {copy.footerTitle2}
            </h2>
            <p className="fdes">{copy.footerDescription}</p>
            <a href="/trial" className="trial-wrap">
              <div className="trial-wrap-in">
                <span>{tr.ctaButtonText}</span>
                <p className="m-bottom-subtext">{tr.finalCtaSubBtn1}!</p>
              </div>
              <ArrowRight size={18} />
            </a>
            
          </div>
        </div>
      </div>
    </section>
  );
}

function UnlimitedAISection({ tr }) {
  const copy = tr.unlimitedAISection;

  const features = [
    {
      key: "unlimited",
      icon: Infinity,
      rightIcon: Infinity,
      title: copy.unlimitedTitle,
      description: copy.unlimitedDescription,
    },
    {
      key: "credits",
      icon: CreditCard,
      rightIcon: XCircle,
      title: copy.noCreditsTitle,
      description: copy.noCreditsDescription,
    },
    {
      key: "bills",
      icon: ReceiptText,
      rightIcon: ReceiptText,
      title: copy.noBillsTitle,
      description: copy.noBillsDescription,
    },
    {
      key: "growth",
      icon: Zap,
      rightIcon: TrendingUp,
      title: copy.growthTitle,
      description: copy.growthDescription,
    },
  ];

  return (
    <section className="m-unlimited-ai">
      <div className="m-ai-usage-card">
        <div className="m-ai-usage-card-head">
          <span>{copy.usageLabel}</span>
          <strong>{copy.usageAvailable}</strong>
        </div>

        <div className="m-ai-usage-progress">
          <div className="m-ai-usage-progress-fill" style={{ width: "100%" }} />
        </div>

        <p>{copy.usageDescription}</p>
      </div>

      <div className="m-unlimited-ai-header">
        <h2>
          {copy.titleLine1}
          <br />

          <span>{copy.titleHighlight}</span>
          <br />

          {copy.titleLine3}
        </h2>

        <p>
          {copy.descriptionLine1}
          <br />
          {copy.descriptionLine2}
          <br />

          <strong>{copy.descriptionHighlight}</strong>
        </p>
      </div>

      <div className="m-unlimited-ai-list">
        {features.map((feature) => {
          const Icon = feature.icon;
          const RightIcon = feature.rightIcon;

          return (
            <article className="m-unlimited-ai-item" key={feature.key}>
              <div className="m-unlimited-ai-item-icon">
                <Icon size={30} />
              </div>

              <div className="m-unlimited-ai-item-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>

              <div className="m-unlimited-ai-item-divider" />

              <div className="m-unlimited-ai-item-right-icon">
                <RightIcon size={31} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="m-unlimited-ai-footer">
        <div className="m-unlimited-ai-footer-icon">
          <ShieldCheck size={34} />
        </div>

        <div>
          <strong>{copy.footerTitle}</strong>
          <p>{copy.footerHighlight}</p>
        </div>
      </div>
    </section>
  );
}

function EverythingIncludedSection({ tr }) {
  const copy = tr.everythingIncludedSection;

  const iconList = [
    Contact2,
    Funnel,
    Mail,
    Bot,
    MessageCircle,
    CalendarDays,
    BarChart3,
    Users2,
    Workflow,
    Sparkles,
    CircleDollarSign,
  ];

  return (
    <section className="m-everything-included">
      <div className="m-everything-included-inner">
        <div className="m-everything-eyebrow">
          <ShieldCheck size={18} />
          <span>{copy.eyebrow}</span>
        </div>

        <div className="m-everything-header">
          <h2>
            {copy.titleLine1} <span>{copy.titleHighlight}</span>
            <br />
            {copy.titleLine2}
          </h2>

          <p>{copy.description}</p>
        </div>

        <div className="m-everything-table">
          <div className="m-everything-table-head">
            <div>{copy.columnFeature}</div>

            <div>{copy.columnOthers}</div>

            <div className="m-everything-cortexa-head">
              <Bot size={26} />
              <span>
                CORTEXA
                <small>AIOS</small>
              </span>
            </div>
          </div>

          <div className="m-everything-table-body">
            {copy.rows.map((row, index) => {
              const Icon = iconList[index] || Sparkles;

              return (
                <article
                  className="m-everything-row"
                  key={`${row.feature}-${index}`}
                >
                  <div className="m-everything-feature">
                    <span className="m-everything-feature-icon">
                      <Icon size={24} />
                    </span>

                    <strong>{row.feature}</strong>
                  </div>

                  <div className="m-everything-other">
                    <span className="m-everything-x">
                      <X size={14} />
                    </span>

                    <p>{row.other}</p>
                  </div>

                  <div className="m-everything-included-value">
                    <span className="m-everything-check">
                      <Check size={15} />
                    </span>

                    <strong>{row.included}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="m-everything-footer">
          <div className="m-everything-footer-icon">
            <Zap size={34} />
          </div>

          <div>
            <strong>{copy.footerTitle}</strong>
            <p>{copy.footerDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default function LandingMobile() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeMarket, setActiveMarket] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const t = {
    en: {
      heroTitle1: "Agentic AI Revenue ",
      heroTitle11: "Operating System ",
      heroTitle2: "Built to Turn",
      heroTitle3: "Conversations",
      heroTitle4: "Into Revenue.",
      heroDesc: "AI organizes. AI qualifies. You follow up. You close.",
      heroTopBanner1: "Agentic AI",
      heroTopBanner2:
        "revenue operating system for businesses tired of complicated, overpriced CRM software.",
      login: "Log in",
      trial: "Get Started",
      nav: [
        "Features",
        "AI Assistant",
        "AI Workflows",
        "Pipeline",
        "Analytics",
        "Testimonials",
      ],
      pricing: "Pricing",
      watchDemo: "Watch Demo",
      trusted: "Built for businesses of all kinds.",

      benefitsSubtitle: "WHAT CORTEXA DOES FOR YOU",
      benefitsTitle1: "Everything You Need.",
      benefitsTitle2: "All in One Place.",
      followUpTitle: "Follow-Up Management",
      followUpDesc:
        "Organize follow-up tasks and keep track of every opportunity.",
      setterTitle: "Appointment Management",
      setterDesc:
        "Manage scheduling, appointments, and related customer activity in one place.",
      pipelineTitle: "Pipeline Management",
      pipelineDesc:
        "See your entire pipeline at a glance and never lose track of a deal.",
      analyticsTitle: "Real-Time Analytics",
      analyticsDesc:
        "Track performance in real time and make data-driven decisions.",
      whatsappTitle: "WhatsApp Integration",
      whatsappDesc: "Chat with leads where they are and close faster.",

      platformSubtitle: "A POWERFUL PLATFORM",
      platformTitle: "Built for Businesses",
      platformTitle1: "That Are Looking to",
      platformTitle2: "Maximize Their Revenue",
      platformDesc:
        "CORTEXA brings your leads, conversations, listings, appointments, and deals together in one smart system — powered by AI.",
      captureTitle: "Capture Leads",
      captureDesc: "From ads, websites, portals & more",
      engageTitle: "AI Engages Instantly",
      engageDesc: "Answers, qualifies & nurtures 24/7",
      syncTitle: "Data Syncs",
      syncDesc: "Everything organized in one place",
      pipelineMoveTitle: "Pipeline Moves Forward",
      pipelineMoveDesc: "AI + your team close more deals",
      closedDealsTitle: "More Closed Deals",
      closedDealsDesc: "Predictable growth on autopilot",

      howSubtitle: "HOW IT WORKS",
      howTitle: "Simple. Powerful. Automatically.",
      step1Title: "Lead Comes In",
      step1Desc: "From ads, website, listings, or referrals.",
      step2Title: "AI Responds Instantly",
      step2Desc: "Answers questions, qualifies and starts the conversation.",
      step3Title: "AI Nurtures & Follows Up",
      step3Desc:
        "Sends messages, books appointments, and keeps your pipeline warm.",
      step4Title: "Pipeline Updates",
      step4Desc: "Everything is tracked in real time.",
      step5Title: "You Close More Deals",
      step5Desc: "AI handles the busy work. You focus on closing.",

      flowNewTitle1: "DON’T GET",
      flowNewTitle2: "LEFT BEHIND.",
      flowNewDescription:
        "See how our integrated Revenue Operating System helps businesses automate faster, close more opportunities, and increase revenue.",
      flowNewButton: "Start Your Free Trial",

      aiosSectionTitle: "Team ",
      aiosSectionTitle1: "Revenue ",
      aiosSectionTitle2: "Workspace",

      setterSectionSubtitle: "APPOINTMENT MANAGEMENT",
      setterSectionTitle1: "Manage Your",
      setterSectionTitle2: "Appointments in One",
      setterSectionTitle3: "Connected Workspace.",
      setterSectionDesc:
        "Organize availability, bookings, and scheduling from one connected workspace. Keep appointments and customer activity easy to manage.",
      bookAppointmentTitle: "Book Appointment",
      confirmBtnText: "Confirm Appointment",

      ctaTitle1: "Built for",
      ctaTitle2: "businesses",
      ctaTitle3: "of every size",
      ctaTitle4: "and industry.",
      pipelinecta1: "Whether you run a",
      pipelinecta2: "and more",
      ctaTitleSub1: "Real Estate Company,",
      ctaTitleSub2: "E-commerce Store,",
      ctaTitleSub3: "Agency,",
      ctaTitleSub4: "Consulting Firm,",
      ctaTitleSub5: "Insurance,",
      ctaTitleSub6: "Finalcial Business,",
      ctaready: "Already using Cortexa?",
      ctaStat1Label: "ROI",
      ctaStat2Label: "REVENUE INCREASE",
      ctaStat3Label: "AGENTS GROWING",
      ctaButtonText: "Get Started, It’s Free!",
      heroFreeAccess: "Sign Up? — Get Free Access!",
      heroNoCard: "No credit card required.",
      heroFreeForever: "Free forever.",

      faqSubtitle: "FAQS",
      faqTitle: "Everything you need to know",
      faq: [
              {
                q: "What does CORTEXA actually do?",
                a: "CORTEXA brings your leads, contacts, pipeline, tasks, properties, analytics, team activity, and connected business tools into one centralized CRM workspace. It helps businesses organize customer relationships, manage opportunities, monitor performance, and keep their sales operation connected.",
              },
              {
                q: "How does the AI Assistant work?",
                a: "The CORTEXA AI Assistant helps users work with information already available in their workspace. It can help surface useful information, summarize activity, provide insights, and assist users with everyday CRM and business tasks while keeping the user in control.",
              },
              {
                q: "Can I manage all my leads in one place?",
                a: "Yes. Leads, contacts, notes, activities, pipeline stages, and related customer information can be organized in one centralized workspace, making it easier for your team to manage opportunities without switching between multiple systems.",
              },
              {
                q: "How do I manage my sales pipeline?",
                a: "CORTEXA provides a visual pipeline where you can organize opportunities, move deals between stages, assign responsibilities, create tasks and reminders, and monitor progress from one workspace.",
              },
              {
                q: "Can I connect the business tools I already use?",
                a: "Yes. CORTEXA supports integrations with compatible third-party business tools and services. Available integrations may vary, and customers remain responsible for their own third-party accounts, permissions, and applicable provider terms.",
              },
              {
                q: "Can my team use CORTEXA together?",
                a: "Yes. CORTEXA provides team workspace capabilities that help users share CRM information, assign tasks and leads, monitor activity, and coordinate work from the same platform. Available team capacity depends on the customer's plan.",
              },
              {
                q: "What kind of businesses is CORTEXA for?",
                a: "CORTEXA is designed for businesses and professional teams that need a centralized system for managing leads, contacts, sales pipelines, customer information, tasks, reporting, and day-to-day CRM operations.",
              },
              {
                q: "What happens after a lead is added to CORTEXA?",
                a: "The lead becomes part of your centralized CRM workspace, where your team can organize the record, assign responsibility, add notes and tasks, manage its pipeline stage, and track activity and progress.",
              },
            ],

      finalCtaSubtitle: "AUTOMATE YOUR SUCCESS",
      finalCtaTitle1: "Connect Your",
      finalCtaTitle2: "Entire Workflow",
      finalCtaTitle3: "",
      finalCtaDesc: "AI Leads. AI Qualifies. AI Closes. All in your ",
      finalCtaBtn: "Start Your Free Trial",
      finalCtaSubBtn: "",
      finalCtaSubBtn1: "Unlock potential today",

      marketsSubtitle: "EXPLORE OUR MARKETS",
      marketsTitle1: "We're helping agents",
      marketsTitle2: "close more deals",
      marketsTitle3: "across Latin America",
      marketsTitle4: "and the world.",
      marketsRegionLabel: "Our Regions",
      viewAllCountriesText: "View All Countries",
      regionLatAm: "Latin America",
      regionUSA: "USA",
      regionEurope: "Europe",

      footerDesc:
        "The all-in-one AI platform that captures leads, automates follow-ups and closes more deals — 24/7.",
      colProduct: "Product",
      colGetStarted: "Get Started",
      colConnect: "Connect",
      colSupport: "Support",
      colLegal: "Legal",
      fFeatures: "Features",
      fAiAssistant: "AI Assistant",
      fAutomations: "Automations",
      fIntegrations: "Integrations",
      fAnalytics: "Analytics",
      fPricing: "Pricing",
      fStart: "Get Started",
      fLogin: "Login",
      fSetup: "Setup Guide",
      fConnectApps: "Connect Your Apps",
      fImportCrm: "Import Your CRM",
      fImportCsv: "Import CSV / Excel",
      fZapier: "Zapier & Automations",
      fApiWebhooks: "API & Webhooks",
      fSupport247: "24/7 Support",
      fHelpCenter: "Help Center",
      fContact: "Contact Us",
      fAbout: "About Us",
      fTerms: "Terms & Conditions",
      fPrivacy: "Privacy Policy",
      fRefund: "Refund Policy",
      fCancel: "Cancellation Policy",
      copyright: "© 2026 Cortexa AI. All rights reserved.",
      termsOfService: "Terms of Service",

      heroTitlePre: "Built to ",
      heroTitleActive: "Grow Revenue",
      heroTitlePost: " — Not Manage Software.",
      heroSubPre: "We bring it all into ",
      heroSubActive: "one connected workspace.",
      nodeAgent: "AI AGENT",
      nodeWhatsapp: "WHATSAPP",
      nodeDashboard: "DASHBOARD",
      nodePipeline: "PIPELINE",
      nodeHybrid: "HYBRID CONNECTS",
      nodeLeads: "LEADS",
      nodeContacts: "CONTACTS",
      nodeProperties: "PROPERTIES",
      stat1Title: "",
      stat1Desc:
        "Everything you need to manage leads, listings, and clients in one place.",

      stat2Title: "",

      thCustomer: "Customer",
      thDeals: "Deals",
      thRevenue: "Revenue",
      thStage: "Stage",
      stageNew: "New Lead",
      stageContacted: "Contacted",
      stageQualified: "Qualified",
      stageProposal: "Proposal",
      stageClosed: "Closed Won",

      heroCheck6:
        "Capture, organize, and manage leads in one connected workspace",
      heroCheck7: "Connect your business tools and communication channels",
      heroCheck8: "Manage follow-up tasks, scheduling, and appointments in one place",
      heroCheck9:
        "Pipeline Intelligence, revenue forecasting, one connected dashboard.",

      powerbadge: "INTEGRATION",
      powertitle: "Connect your apps",

      workspacelang1: "Team",
      workspacelang2: "Revenue",
      workspacelang3: "Workspace",
      reportingSection: {
        eyebrow: "REPORTING & WORKFLOW",
        titleLine1: "Reporting",
        titleLine2: "Turns to ",
        titleHighlight: "Revenue.",
        description:
          "Track leads, conversions, response times, and team performance in real time. No more scattered data. Just clarity.",
        features: [
          {
            title: "Analytics",
            description: "Track leads and team performance in real time.",
          },
          {
            title: "Pipeline",
            description: "Manage every deal from one workspace.",
          },
          {
            title: "Team Visibility",
            description: "See what your team is doing instantly.",
          },
          {
            title: "Reports",
            description: "Custom reports that drive revenue.",
          },
        ],
        performanceTitle: "Performance Overview",
        conversionRate: "Conversion Rate",
        revenueGenerated: "Revenue Generated",
        responseTime: "Response Time",
        lastSevenDays: "vs last 7 days",
        aiInsight: "AI Insight",
        insightText: "Response times are improving. Keep it up!",
        pipelineTitle: "Pipeline",
        deals: "deals",
        stageNew: "New Lead",
        stageContacted: "Contacted",
        stageProposal: "Proposal",
        stageWon: "Closed Won",
        viewPipeline: "View Pipeline",
        teamActivityTitle: "Team Activity",
        invite: "Invite",
        updatedDeal: "Updated a deal",
        addedNote: "Added a note",
        commented: "Commented",
        changedStage: "Changed stage",
        viewActivity: "View all activity",
        revenueReportTitle: "Revenue Report",
        thisMonth: "This Month",
        totalRevenue: "Total Revenue",
        dealsClosed: "Deals Closed",
        averageDeal: "Avg. Deal Value",
        downloadReport: "Download Report",
        footerTitle: "CONNECT YOUR BUSINESSES.",
        footerTitle1: "START AUTOMATING",
        footerTitle2: "IN MINUTES.",
        footerDescription: "Your AI Agent is ready to work.",
        disclaimer:
          "Product demo — names, numbers, and activity shown are sample data for illustration only, not real customer results.",
      },
      unlimitedAISection: {
        usageLabel: "AI Usage",
        usageAvailable: "100% Available",
        usageDescription: "Unlimited AI usage included in your plan",
        titleLine1: "Unlimited AI",
        titleHighlight: "Usage Included",
        titleLine3: "in Every Plan",

        descriptionLine1: "No AI credits. No credit packs. No usage limits.",
        descriptionLine2:
          "No surprise AI bills. Use Cortexa as much as your business needs —",
        descriptionHighlight: "your monthly price stays predictable.",

        unlimitedTitle: "Unlimited AI",
        unlimitedDescription: "Use AI tools as much as you need.",

        noCreditsTitle: "No Credits",
        noCreditsDescription: "No credit packs. No top-ups.",

        noBillsTitle: "No Surprise Bills",
        noBillsDescription: "One predictable monthly price.",

        growthTitle: "Built for Growth",
        growthDescription: "Scale your business without limits.",

        footerTitle: "Powerful AI. Predictable pricing.",
        footerHighlight: "That’s the Cortexa way.",
      },
      everythingIncludedSection: {
        eyebrow: "EVERYTHING INCLUDED. NOTHING EXTRA.",

        titleLine1: "See",
        titleHighlight: "Exactly",
        titleLine2: "What You Get",

        description:
          "Other platforms charge extra for the tools and features your team actually needs. Cortexa includes everything—so you can focus on what matters: closing deals.",

        columnFeature: "WHAT YOU GET",
        columnOthers: "WITH OTHERS",

        rows: [
          {
            feature: "CRM & Contact Management",
            other: "Add-on or higher plan",
            included: "Included",
          },
          {
            feature: "Leads & Pipeline Management",
            other: "Add-on or separate tool",
            included: "Included",
          },
          {
            feature: "Email & SMS Campaigns",
            other: "Add-on or separate tool",
            included: "Included",
          },
          {
            feature: "AI Agent (24/7)",
            other: "Add-on or separate platform",
            included: "Included",
          },
          {
            feature: "WhatsApp Automation",
            other: "Add-on or extra integration",
            included: "Included",
          },
          {
            feature: "Appointment Booking",
            other: "Add-on or higher plan",
            included: "Included",
          },
          {
            feature: "Reporting & Analytics",
            other: "Add-on or higher tier",
            included: "Included",
          },
          {
            feature: "Team Collaboration",
            other: "Add-on or higher plan",
            included: "Included",
          },
          {
            feature: "Workflow Automation",
            other: "Add-on or separate tool",
            included: "Included",
          },
          {
            feature: "Unlimited AI Usage",
            other: "Usage limits or extra cost",
            included: "Unlimited. No extra cost.",
          },
          {
            feature: "Marketing Contact Fees",
            other: "Billed separately as usage grows",
            included: "No extra fees. Ever.",
          },
        ],

        footerTitle: "One platform. Everything included.",
        footerDescription: "No add-ons. No surprises. Just results.",
      },
    },

    es: {
      heroTitle1: "Sistema Operativo de ",
      heroTitle11: "Ingresos con IA Agéntica",
      heroTitle2: "Creado para Convertir",
      heroTitle3: "Conversaciones",
      heroTitle4: "en Ingresos.",
      heroDesc:
        "La IA organiza. La IA califica. Tú haces seguimiento. Tú cierras.",
      heroTopBanner1: "Agentic AI",
      heroTopBanner2:
        "sistema operativo de ingresos impulsado por IA para empresas cansadas de CRM complicados y demasiado costosos.",
      login: "Iniciar sesión",
      trial: "Comenzar",
      nav: [
        "Funciones",
        "Asistente IA",
        "Flujos de trabajo IA",
        "Pipeline",
        "Analítica",
        "Testimonios",
      ],
      pricing: "Precios",
      watchDemo: "Ver Demo",
      trusted: "Diseñada para empresas de todo tipo.",
      benefitsSubtitle: "LO QUE CORTEXA HACE POR TI",
      benefitsTitle1: "Todo lo que necesitas.",
      benefitsTitle2: "En un solo lugar.",
      followUpTitle: "Gestión de Seguimientos",
      followUpDesc:
        "Organiza las tareas de seguimiento y mantén el control de cada oportunidad.",
      setterTitle: "Gestión de Citas",
      setterDesc: "Gestiona la programación, las citas y la actividad relacionada con los clientes en un solo lugar.",
      pipelineTitle: "Gestión de Pipeline",
      pipelineDesc:
        "Mira todo tu pipeline de un vistazo y nunca pierdas el rastro de un trato.",
      analyticsTitle: "Analítica en Tiempo Real",
      analyticsDesc:
        "Realiza un seguimiento del rendimiento en tiempo real y toma decisiones basadas en datos.",
      whatsappTitle: "Integración con WhatsApp",
      whatsappDesc:
        "Chatea con tus leads donde ellos estén y cierra ventas más rápido.",

      platformSubtitle: "UNA PLATAFORMA POTENTE",
      platformTitle: "Diseñado para Empresas",
      platformTitle1: "Que Buscan",
      platformTitle2: "Maximizar sus Ingresos",
      platformDesc:
        "CORTEXA reúne tus leads, conversaciones, propiedades, citas y tratos en un solo sistema inteligente, impulsado por IA.",
      captureTitle: "Captura de Leads",
      captureDesc: "Desde anuncios, sitios web, portales y más",
      engageTitle: "IA Interactúa al Instante",
      engageDesc:
        "Responde, califica y nutre las 24 horas, los 7 días de la semana",
      syncTitle: "Sincronización de Datos",
      syncDesc: "Todo organizado en un solo lugar",
      pipelineMoveTitle: "El Pipeline Avanza",
      pipelineMoveDesc: "La IA y tu equipo cierran más tratos",
      closedDealsTitle: "Más Tratos Cerrados",
      closedDealsDesc: "Crecimiento predecible en piloto automático",

      howSubtitle: "CÓMO FUNCIONA",
      howTitle: "Simple. Potente. Automático.",
      step1Title: "Entrada de Leads",
      step1Desc: "Desde anuncios, sitio web, propiedades o referidos.",
      step2Title: "La IA Responde al Instante",
      step2Desc: "Responde preguntas, califica e inicia la conversación.",
      step3Title: "La IA Nutre y Hace Seguimiento",
      step3Desc: "Envía mensajes, agenda citas y mantiene tu pipeline activo.",
      step4Title: "Actualizaciones del Pipeline",
      step4Desc: "Todo se rastrea en tiempo real.",
      step5Title: "Tú Cierras Más Tratos",
      step5Desc:
        "La IA se encarga del trabajo pesado. Tú te enfocas en cerrar.",

      flowNewTitle1: "NO TE QUEDES",
      flowNewTitle2: "ATRÁS.",
      flowNewDescription:
        "Descubre cómo nuestro Sistema Operativo de Ingresos integrado ayuda a las empresas a automatizar más rápido, cerrar más oportunidades y aumentar sus ingresos.",
      flowNewButton: "Comienza Tu Prueba Gratis",

      setterSectionSubtitle: "GESTIÓN DE CITAS",
      setterSectionTitle1: "Gestiona Tus Citas",
      setterSectionTitle2: "en un Espacio de",
      setterSectionTitle3: "Trabajo Conectado.",
      setterSectionDesc:
        "Organiza la disponibilidad, las reservas y la programación desde un espacio de trabajo conectado. Mantén las citas y la actividad de los clientes fáciles de gestionar.",
      bookAppointmentTitle: "Agendar Cita",
      confirmBtnText: "Confirmar Cita",

      ctaTitle1: "Diseñado para",
      ctaTitle2: "empresas",
      ctaTitle3: "de todos los tamaños",
      ctaTitle4: "y sectores.",
      pipelinecta1: "Ya sea que dirijas una",
      pipelinecta2: "y mucho más",
      ctaTitleSub1: "Empresa Inmobiliaria,",
      ctaTitleSub2: "Tienda de Comercio Electrónico,",
      ctaTitleSub3: "Agencia,",
      ctaTitleSub4: "Consultora,",
      ctaTitleSub5: "Seguros,",
      ctaTitleSub6: "Empresa de Servicios Financieros,",
      ctaready: "¿Ya utilizas Cortexa?",
      ctaStat1Label: "ROI",
      ctaStat2Label: "AUMENTO DE INGRESOS",
      ctaStat3Label: "AGENTES CRECIENDO",
      ctaButtonText: "Empieza Gratis!",
      heroFreeAccess: "¿Regístrate? — ¡Obtén acceso gratis!",
      heroNoCard: "No se requiere tarjeta de crédito.",
      heroFreeForever: "Gratis para siempre.",

      faqSubtitle: "PREGUNTAS FRECUENTES",
      faqTitle: "Todo lo que necesitas saber",
      faq: [
              {
                q: "¿Qué hace exactamente CORTEXA?",
                a: "CORTEXA reúne tus leads, contactos, pipeline, tareas, propiedades, analítica, actividad del equipo y herramientas empresariales conectadas en un espacio de trabajo CRM centralizado. Ayuda a las empresas a organizar las relaciones con los clientes, gestionar oportunidades, supervisar el rendimiento y mantener conectadas sus operaciones de ventas.",
              },
              {
                q: "¿Cómo funciona el Asistente de IA?",
                a: "El Asistente de IA de CORTEXA ayuda a los usuarios a trabajar con la información que ya está disponible en su espacio de trabajo. Puede ayudar a mostrar información útil, resumir actividades, proporcionar insights y asistir a los usuarios con tareas cotidianas de CRM y del negocio, manteniendo siempre al usuario en control.",
              },
              {
                q: "¿Puedo gestionar todos mis leads en un solo lugar?",
                a: "Sí. Los leads, contactos, notas, actividades, etapas del pipeline y la información relacionada con los clientes pueden organizarse en un espacio de trabajo centralizado, facilitando que tu equipo gestione oportunidades sin cambiar entre múltiples sistemas.",
              },
              {
                q: "¿Cómo gestiono mi pipeline de ventas?",
                a: "CORTEXA proporciona un pipeline visual donde puedes organizar oportunidades, mover negocios entre etapas, asignar responsabilidades, crear tareas y recordatorios, y supervisar el progreso desde un solo espacio de trabajo.",
              },
              {
                q: "¿Puedo conectar las herramientas empresariales que ya utilizo?",
                a: "Sí. CORTEXA admite integraciones con herramientas y servicios empresariales de terceros compatibles. Las integraciones disponibles pueden variar, y los clientes siguen siendo responsables de sus propias cuentas de terceros, permisos y términos aplicables de cada proveedor.",
              },
              {
                q: "¿Puede mi equipo utilizar CORTEXA en conjunto?",
                a: "Sí. CORTEXA ofrece funciones de espacio de trabajo para equipos que permiten compartir información del CRM, asignar tareas y leads, supervisar la actividad y coordinar el trabajo desde la misma plataforma. La capacidad disponible para el equipo depende del plan del cliente.",
              },
              {
                q: "¿Para qué tipo de empresas está diseñado CORTEXA?",
                a: "CORTEXA está diseñado para empresas y equipos profesionales que necesitan un sistema centralizado para gestionar leads, contactos, pipelines de ventas, información de clientes, tareas, informes y operaciones diarias de CRM.",
              },
              {
                q: "¿Qué sucede después de añadir un lead a CORTEXA?",
                a: "El lead pasa a formar parte de tu espacio de trabajo CRM centralizado, donde tu equipo puede organizar el registro, asignar responsabilidades, añadir notas y tareas, gestionar su etapa del pipeline y realizar un seguimiento de la actividad y el progreso.",
              },
            ],

      finalCtaSubtitle: "AUTOMATIZA TU ÉXITO",
      finalCtaTitle1: "Conecta Tu",
      finalCtaTitle2: "Tu Flujo de Trabajo",
      finalCtaTitle3: "",
      finalCtaDesc:
        "La IA capta leads. La IA califica. La IA cierra. Todo en tu ",
      finalCtaBtn: "Comienza Tu Prueba Gratis",
      finalCtaSubBtn: "",
      finalCtaSubBtn1: "Desbloquea tu potencial hoy",

      marketsSubtitle: "EXPLORA NUESTROS MERCADOS",
      marketsTitle1: "Ayudamos a los agentes a",
      marketsTitle2: "cerrar más tratos",
      marketsTitle3: "en América Latina",
      marketsTitle4: "y el mundo.",
      marketsRegionLabel: "Nuestras Regiones",
      viewAllCountriesText: "Ver Todos los Países",
      regionLatAm: "América Latina",
      regionUSA: "EE. UU.",
      regionEurope: "Europa",

      footerDesc:
        "La plataforma de IA todo en uno que captura leads, automatiza el seguimiento y cierra más tratos, 24/7.",
      colProduct: "Producto",
      colGetStarted: "Comenzar",
      colConnect: "Conectar",
      colSupport: "Soporte",
      colLegal: "Legal",
      fFeatures: "Características",
      fAiAssistant: "Asistente de IA",
      fAutomations: "Automatizaciones",
      fIntegrations: "Integraciones",
      fAnalytics: "Analítica",
      fPricing: "Precios",
      fStart: "Comenzar",
      fLogin: "Iniciar Sesión",
      fSetup: "Guía de Configuración",
      fConnectApps: "Conectar tus Apps",
      fImportCrm: "Importar tu CRM",
      fImportCsv: "Importar CSV / Excel",
      fZapier: "Zapier y Automatizaciones",
      fApiWebhooks: "API y Webhooks",
      fSupport247: "Soporte 24/7",
      fHelpCenter: "Centro de Ayuda",
      fContact: "Contáctanos",
      fAbout: "Nosotros",
      fTerms: "Términos y Condiciones",
      fPrivacy: "Política de Privacidad",
      fRefund: "Política de Reembolso",
      fCancel: "Política de Cancelación",
      copyright: "© 2026 Cortexa AI. Todos los derechos reservados.",
      termsOfService: "Términos de Servicio",

      heroTitlePre: "Creado para ",
      heroTitleActive: "Aumentar Ingresos",
      heroTitlePost: " — No para Administrar Software.",
      heroSubPre: "Lo traemos todo en ",
      heroSubActive: "un espacio de trabajo conectado.",
      nodeAgent: "AGENTE DE IA",
      nodeWhatsapp: "WHATSAPP",
      nodeDashboard: "PANEL",
      nodePipeline: "PIPELINE",
      nodeHybrid: "CONEXIONES HÍBRIDAS",
      nodeLeads: "CLIENTES POTENCIALES",
      nodeContacts: "CONTACTOS",
      nodeProperties: "PROPIEDADES",
      stat1Title: "",
      stat1Desc:
        "Todo lo que necesitas para gestionar clientes potenciales, propiedades y clientes en un solo lugar.",

      stat2Title: "",

      thCustomer: "Cliente",
      thDeals: "Tratos",
      thRevenue: "Ingresos",
      thStage: "Etapa",
      stageNew: "Nuevo Lead",
      stageContacted: "Contactado",
      stageQualified: "Calificado",
      stageProposal: "Propuesta",
      stageClosed: "Cerrado Ganado",

      heroCheck6:
        "Captura, organiza y gestiona leads en un espacio de trabajo conectado.",
      heroCheck7:
        "Conecta tus herramientas empresariales y canales de comunicación.",
      heroCheck8:
        "Gestiona tareas de seguimiento, programación y citas en un solo lugar.",
      heroCheck9:
        "Inteligencia de pipeline, previsión de ingresos y un panel de control unificado.",

      powerbadge: "INTEGRACIÓN",
      powertitle: "Conecta tus aplicaciones",

      workspacelang1: "Equipo",
      workspacelang2: "Ingresos",
      workspacelang3: "Espacio de trabajo",

      reportingSection: {
        eyebrow: "INFORMES Y FLUJO DE TRABAJO",
        titleLine1: "Los informes",
        titleLine2: "se convierten en",
        titleHighlight: "ingresos.",
        description:
          "Controla clientes potenciales, conversiones, tiempos de respuesta y rendimiento del equipo en tiempo real. Sin datos dispersos. Solo claridad.",
        features: [
          {
            title: "Analítica",
            description:
              "Controla clientes potenciales y el rendimiento del equipo en tiempo real.",
          },
          {
            title: "Pipeline",
            description:
              "Gestiona cada negocio desde un solo espacio de trabajo.",
          },
          {
            title: "Visibilidad del equipo",
            description: "Ve al instante lo que está haciendo tu equipo.",
          },
          {
            title: "Informes",
            description: "Informes personalizados que impulsan los ingresos.",
          },
        ],
        performanceTitle: "Resumen de rendimiento",
        conversionRate: "Tasa de conversión",
        revenueGenerated: "Ingresos generados",
        responseTime: "Tiempo de respuesta",
        lastSevenDays: "vs últimos 7 días",
        aiInsight: "Insight de IA",
        insightText: "Los tiempos de respuesta están mejorando. ¡Sigue así!",
        pipelineTitle: "Pipeline",
        deals: "negocios",
        stageNew: "Nuevo lead",
        stageContacted: "Contactado",
        stageProposal: "Propuesta",
        stageWon: "Cerrado ganado",
        viewPipeline: "Ver pipeline",
        teamActivityTitle: "Actividad del equipo",
        invite: "Invitar",
        updatedDeal: "Actualizó un negocio",
        addedNote: "Añadió una nota",
        commented: "Comentó",
        changedStage: "Cambió la etapa",
        viewActivity: "Ver toda la actividad",
        revenueReportTitle: "Informe de ingresos",
        thisMonth: "Este mes",
        totalRevenue: "Ingresos totales",
        dealsClosed: "Negocios cerrados",
        averageDeal: "Valor medio",
        downloadReport: "Descargar informe",
        footerTitle: "CONECTA TU EMPRESA.",
        footerTitle1: "COMIENZA A AUTOMATIZAR",
        footerTitle2: "EN MINUTOS.",
        footerDescription: "Tu agente de IA está listo para trabajar.",
        disclaimer:
          "Demostración del producto: los nombres, cifras y actividades son datos de ejemplo, no resultados reales de clientes.",
      },
      unlimitedAISection: {
        usageLabel: "Uso de IA",
        usageAvailable: "100% Disponible",
        usageDescription: "Uso ilimitado de IA incluido en tu plan",
        titleLine1: "Uso Ilimitado de IA",
        titleHighlight: "Incluido",
        titleLine3: "en Todos los Planes",

        descriptionLine1:
          "Sin créditos de IA. Sin paquetes de créditos. Sin límites de uso.",
        descriptionLine2:
          "Sin facturas sorpresa por IA. Usa Cortexa tanto como tu negocio lo necesite —",
        descriptionHighlight: "tu precio mensual siempre será predecible.",

        unlimitedTitle: "IA Ilimitada",
        unlimitedDescription:
          "Utiliza las herramientas de IA tanto como necesites.",

        noCreditsTitle: "Sin Créditos",
        noCreditsDescription: "Sin paquetes de créditos. Sin recargas.",

        noBillsTitle: "Sin Facturas Sorpresa",
        noBillsDescription: "Un precio mensual predecible.",

        growthTitle: "Creado para Crecer",
        growthDescription: "Escala tu negocio sin límites.",

        footerTitle: "IA potente. Precios predecibles.",
        footerHighlight: "Así funciona Cortexa.",
      },
      everythingIncludedSection: {
        eyebrow: "TODO INCLUIDO. NADA EXTRA.",

        titleLine1: "Mira",
        titleHighlight: "Exactamente",
        titleLine2: "Lo Que Obtienes",

        description:
          "Otras plataformas cobran extra por las herramientas y funciones que tu equipo realmente necesita. Cortexa incluye todo para que puedas enfocarte en lo importante: cerrar negocios.",

        columnFeature: "LO QUE OBTIENES",
        columnOthers: "CON OTROS",

        rows: [
          {
            feature: "CRM y Gestión de Contactos",
            other: "Complemento o plan superior",
            included: "Incluido",
          },
          {
            feature: "Leads y Gestión de Pipeline",
            other: "Complemento o herramienta separada",
            included: "Incluido",
          },
          {
            feature: "Campañas de Email y SMS",
            other: "Complemento o herramienta separada",
            included: "Incluido",
          },
          {
            feature: "Agente de IA 24/7",
            other: "Complemento o plataforma separada",
            included: "Incluido",
          },
          {
            feature: "Automatización de WhatsApp",
            other: "Complemento o integración adicional",
            included: "Incluido",
          },
          {
            feature: "Gestiona Tus Citas",
            other: "Complemento o plan superior",
            included: "Incluido",
          },
          {
            feature: "Informes y Analítica",
            other: "Complemento o nivel superior",
            included: "Incluido",
          },
          {
            feature: "Colaboración de Equipo",
            other: "Complemento o plan superior",
            included: "Incluido",
          },
          {
            feature: "Automatización de Flujos",
            other: "Complemento o herramienta separada",
            included: "Incluido",
          },
          {
            feature: "Uso Ilimitado de IA",
            other: "Límites de uso o costo adicional",
            included: "Ilimitado. Sin costo extra.",
          },
          {
            feature: "Tarifas de Contactos de Marketing",
            other: "Cobrado por separado según el uso",
            included: "Sin tarifas adicionales.",
          },
        ],

        footerTitle: "Una plataforma. Todo incluido.",
        footerDescription: "Sin complementos. Sin sorpresas. Solo resultados.",
      },
    },

    pt: {
      heroTitle1: "Sistema Operacional de ",
      heroTitle11: "Receita com IA Agêntica",
      heroTitle2: "Criado para Transformar",
      heroTitle3: "Conversas",
      heroTitle4: "em Receita.",
      heroDesc: "A IA organiza. A IA qualifica. Você faz o acompanhamento. Você fecha.",
      heroTopBanner1: "Agentic AI",
      heroTopBanner2:
        "sistema operacional de receita com IA para empresas cansadas de CRMs complicados e caros.",
      login: "Entrar",
      trial: "Começar",
      nav: [
        "Recursos",
        "Assistente IA",
        "Fluxos de trabalho IA",
        "Pipeline",
        "Analytics",
        "Depoimentos",
      ],
      pricing: "Preços",
      watchDemo: "Ver Demo",
      trusted: "Desenvolvida para empresas de todos os tipos.",
      benefitsSubtitle: "O QUE A CORTEXA FAZ POR VOCÊ",
      benefitsTitle1: "Tudo o que você precisa.",
      benefitsTitle2: "Em um só lugar.",
      followUpTitle: "Gestão de Acompanhamentos",
      followUpDesc:
        "Organize tarefas de acompanhamento e mantenha o controle de cada oportunidade.",
      setterTitle: "Gestão de Compromissos",
      setterDesc:
        "Gerencie agendamentos, compromissos e atividades relacionadas aos clientes em um só lugar.",
      pipelineTitle: "Gestão de Pipeline",
      pipelineDesc:
        "Visualize todo o seu pipeline em um relance e nunca perca um negócio de vista.",
      analyticsTitle: "Analytics em Tempo Real",
      analyticsDesc:
        "Acompanhe o desempenho em tempo real e tome decisões baseadas em dados.",
      whatsappTitle: "Integração com WhatsApp",
      whatsappDesc:
        "Converse com os leads onde eles estão e feche negócios mais rápido.",

      platformSubtitle: "UMA PLATAFORMA PODEROSA",
      platformTitle: "Desenvolvido para Empresas",
      platformTitle1: "Que Buscam",
      platformTitle2: "Maximizar sua Receita",
      platformDesc:
        "A CORTEXA reúne seus leads, conversas, imóveis, reuniões e negócios em um único sistema inteligente — alimentado por IA.",
      captureTitle: "Capturar Leads",
      captureDesc: "De anúncios, sites, portais e muito mais",
      engageTitle: "IA Engaja Instantaneamente",
      engageDesc: "Responde, qualifica e cultiva 24/7",
      syncTitle: "Sincronização de Dados",
      syncDesc: "Tudo organizado em um só lugar",
      pipelineMoveTitle: "Pipeline Avança",
      pipelineMoveDesc: "IA + sua equipe fecham mais negócios",
      closedDealsTitle: "Mais Negócios Fechados",
      closedDealsDesc: "Crescimento previsível no piloto automático",

      howSubtitle: "COMO FUNCIONA",
      howTitle: "Simples. Poderoso. Automático.",
      step1Title: "O Lead Entra",
      step1Desc: "De anúncios, site, imóveis ou indicações.",
      step2Title: "A IA Responde Instantaneamente",
      step2Desc: "Responde perguntas, qualifica e inicia a conversa.",
      step3Title: "A IA Nutre & Acompanha",
      step3Desc:
        "Envia mensagens, agenda reuniões e mantém seu pipeline aquecido.",
      step4Title: "Atualizações do Pipeline",
      step4Desc: "Tudo é acompanhado em tempo real.",
      step5Title: "Você Fecha Mais Negócios",
      step5Desc: "A IA cuida do trabalho repetitivo. Você foca em fechar.",

      flowNewTitle1: "NÃO FIQUE",
      flowNewTitle2: "PARA TRÁS.",
      flowNewDescription:
        "Veja como nosso Sistema Operacional de Receita integrado ajuda empresas a automatizar mais rápido, fechar mais oportunidades e aumentar a receita.",
      flowNewButton: "Comece Seu Teste Grátis",

      aiosSectionTitle: "Espaço de Trabalho",
      aiosSectionTitle1: "de Receita",
      aiosSectionTitle2: "para Equipes",

      setterSectionSubtitle: "GESTÃO DE COMPROMISSOS",
      setterSectionTitle1: "Gerencie Seus Compromissos",
      setterSectionTitle2: "em um Espaço de Trabalho",
      setterSectionTitle3: "Conectado.",
      setterSectionDesc:
        "Organize disponibilidade, reservas e agendamentos em um espaço de trabalho conectado. Mantenha compromissos e atividades dos clientes fáceis de gerenciar.",
      bookAppointmentTitle: "Agendar Reunião",
      confirmBtnText: "Confirmar Reunião",

      ctaTitle1: "Desenvolvido para",
      ctaTitle2: "empresas",
      ctaTitle3: "de todos os tamanhos",
      ctaTitle4: "e setores.",
      pipelinecta1: "Seja você proprietário de uma",
      pipelinecta2: "e muito mais",
      ctaTitleSub1: "Imobiliária,",
      ctaTitleSub2: "Loja de E-commerce,",
      ctaTitleSub3: "Agência,",
      ctaTitleSub4: "Consultoria,",
      ctaTitleSub5: "Seguros,",
      ctaTitleSub6: "Empresa de Serviços Financeiros,",
      ctaready: "Já utiliza o Cortexa?",
      ctaStat1Label: "ROI",
      ctaStat2Label: "AUMENTO DE RECEITA",
      ctaStat3Label: "AGENTES CRESCENDO",
      ctaButtonText: "Comece Grátis!",
      heroFreeAccess: "Cadastre-se? — Obtenha acesso grátis!",
      heroNoCard: "Nenhum cartão de crédito necessário.",
      heroFreeForever: "Grátis para sempre.",

      faqSubtitle: "PERGUNTAS FREQUENTES",
      faqTitle: "Tudo o que você precisa saber",
      faq: [
              {
                q: "O que a CORTEXA realmente faz?",
                a: "A CORTEXA reúne seus leads, contatos, pipeline, tarefas, propriedades, análises, atividades da equipe e ferramentas de negócios conectadas em um único espaço de trabalho CRM centralizado. Ela ajuda empresas a organizar relacionamentos com clientes, gerenciar oportunidades, monitorar o desempenho e manter suas operações de vendas conectadas.",
              },
              {
                q: "Como funciona o Assistente de IA?",
                a: "O Assistente de IA da CORTEXA ajuda os usuários a trabalhar com informações que já estão disponíveis em seu espaço de trabalho. Ele pode ajudar a destacar informações úteis, resumir atividades, fornecer insights e auxiliar os usuários em tarefas diárias de CRM e negócios, mantendo o usuário no controle.",
              },
              {
                q: "Posso gerenciar todos os meus leads em um só lugar?",
                a: "Sim. Leads, contatos, notas, atividades, etapas do pipeline e informações relacionadas aos clientes podem ser organizados em um espaço de trabalho centralizado, facilitando para sua equipe gerenciar oportunidades sem precisar alternar entre vários sistemas.",
              },
              {
                q: "Como gerencio meu pipeline de vendas?",
                a: "A CORTEXA oferece um pipeline visual onde você pode organizar oportunidades, mover negócios entre etapas, atribuir responsabilidades, criar tarefas e lembretes e monitorar o progresso em um único espaço de trabalho.",
              },
              {
                q: "Posso conectar as ferramentas de negócios que já utilizo?",
                a: "Sim. A CORTEXA oferece suporte a integrações com ferramentas e serviços empresariais de terceiros compatíveis. As integrações disponíveis podem variar, e os clientes continuam responsáveis por suas próprias contas de terceiros, permissões e termos aplicáveis dos provedores.",
              },
              {
                q: "Minha equipe pode usar a CORTEXA em conjunto?",
                a: "Sim. A CORTEXA oferece recursos de espaço de trabalho em equipe que ajudam os usuários a compartilhar informações do CRM, atribuir tarefas e leads, monitorar atividades e coordenar o trabalho na mesma plataforma. A capacidade disponível para a equipe depende do plano do cliente.",
              },
              {
                q: "Para que tipo de empresas a CORTEXA foi criada?",
                a: "A CORTEXA foi desenvolvida para empresas e equipes profissionais que precisam de um sistema centralizado para gerenciar leads, contatos, pipelines de vendas, informações de clientes, tarefas, relatórios e operações diárias de CRM.",
              },
              {
                q: "O que acontece depois que um lead é adicionado à CORTEXA?",
                a: "O lead passa a fazer parte do seu espaço de trabalho CRM centralizado, onde sua equipe pode organizar o registro, atribuir responsabilidades, adicionar notas e tarefas, gerenciar sua etapa no pipeline e acompanhar atividades e progresso.",
              },
            ],

      finalCtaSubtitle: "AUTOMATIZE SEU SUCESSO",
      finalCtaTitle1: "Conecte Seu",
      finalCtaTitle2: "Seu Fluxo de Trabalho",
      finalCtaTitle3: "",
      finalCtaDesc: "A IA gera leads. A IA qualifica. A IA fecha. Tudo no seu ",
      finalCtaBtn: "Comece Seu Teste Grátis",
      finalCtaSubBtn: "",
      finalCtaSubBtn1: "Desbloqueie seu potencial hoje",

      marketsSubtitle: "EXPLORE NOSSOS MERCADOS",
      marketsTitle1: "Ajudamos corretores a",
      marketsTitle2: "fechar mais negócios",
      marketsTitle3: "na América Latina",
      marketsTitle4: "e no mundo.",
      marketsRegionLabel: "Nossas Regiões",
      viewAllCountriesText: "Ver Todos os Países",
      regionLatAm: "América Latina",
      regionUSA: "EUA",
      regionEurope: "Europa",

      footerDesc:
        "A plataforma de IA tudo-em-um que captura leads, automatiza acompanhamentos e fecha mais negócios — 24/7.",
      colProduct: "Produto",
      colGetStarted: "Começar",
      colConnect: "Conectar",
      colSupport: "Suporte",
      colLegal: "Legal",
      fFeatures: "Recursos",
      fAiAssistant: "Assistente de IA",
      fAutomations: "Automatizações",
      fIntegrations: "Integrações",
      fAnalytics: "Análise",
      fPricing: "Preços",
      fStart: "Começar",
      fLogin: "Login",
      fSetup: "Guia de Configuração",
      fConnectApps: "Conectar Seus Apps",
      fImportCrm: "Importar Seu CRM",
      fImportCsv: "Importar CSV / Excel",
      fZapier: "Zapier & Automatizações",
      fApiWebhooks: "API & Webhooks",
      fSupport247: "Suporte 24/7",
      fHelpCenter: "Central de Ajuda",
      fContact: "Fale Conosco",
      fAbout: "Sobre Nós",
      fTerms: "Termos & Condições",
      fPrivacy: "Política de Privacidade",
      fRefund: "Política de Reembolso",
      fCancel: "Política de Cancelamento",
      copyright: "© 2026 Cortexa AI. Todos os direitos reservados.",
      termsOfService: "Termos de Serviço",

      heroTitlePre: "Feito para ",
      heroTitleActive: "Aumentar a Receita",
      heroTitlePost: " — Não para Gerenciar Software.",
      heroSubPre: "Nós trazemos tudo para ",
      heroSubActive: "um espaço de trabalho conectado.",
      nodeAgent: "AGENTE DE IA",
      nodeWhatsapp: "WHATSAPP",
      nodeDashboard: "PAINEL",
      nodePipeline: "PIPELINE",
      nodeHybrid: "CONEXÕES HÍBRIDAS",
      nodeLeads: "LEADS",
      nodeContacts: "CONTATOS",
      nodeProperties: "PROPRIEDADES",
      stat1Title: "",
      stat1Desc:
        "Tudo o que você precisa para gerenciar leads, imóveis e clientes em um só lugar.",

      stat2Title: "",

      thCustomer: "Cliente",
      thDeals: "Negócios",
      thRevenue: "Receita",
      thStage: "Etapa",
      stageNew: "Novo Lead",
      stageContacted: "Contatado",
      stageQualified: "Qualificado",
      stageProposal: "Proposta",
      stageClosed: "Ganho Fechado",

      heroCheck6:
        "Capture, organize e gerencie leads em um espaço de trabalho conectado",
      heroCheck7:
        "Conecte suas ferramentas de negócios e canais de comunicação",
      heroCheck8:
        "Gerencie tarefas de acompanhamento, agendamentos e compromissos em um só lugar",
      heroCheck9:
        "Inteligência de pipeline, previsão de receita e um painel de controle unificado.",

      powerbadge: "INTEGRAÇÃO",
      powertitle: "Conecte seus aplicativos",

      workspacelang1: "Equipe",
      workspacelang2: "Receita",
      workspacelang3: "Espaço de trabalho",

      reportingSection: {
        eyebrow: "RELATÓRIOS E FLUXO DE TRABALHO",
        titleLine1: "Relatórios",
        titleLine2: "viram",
        titleHighlight: "receita.",
        description:
          "Acompanhe leads, conversões, tempos de resposta e desempenho da equipe em tempo real. Chega de dados espalhados. Apenas clareza.",
        features: [
          {
            title: "Análises",
            description:
              "Acompanhe leads e o desempenho da equipe em tempo real.",
          },
          {
            title: "Pipeline",
            description: "Gerencie cada negócio em um só espaço de trabalho.",
          },
          {
            title: "Visibilidade da equipe",
            description: "Veja instantaneamente o que sua equipe está fazendo.",
          },
          {
            title: "Relatórios",
            description: "Relatórios personalizados que geram receita.",
          },
        ],
        performanceTitle: "Visão geral do desempenho",
        conversionRate: "Taxa de conversão",
        revenueGenerated: "Receita gerada",
        responseTime: "Tempo de resposta",
        lastSevenDays: "vs últimos 7 dias",
        aiInsight: "Insight de IA",
        insightText: "Os tempos de resposta estão melhorando. Continue assim!",
        pipelineTitle: "Pipeline",
        deals: "negócios",
        stageNew: "Novo lead",
        stageContacted: "Contatado",
        stageProposal: "Proposta",
        stageWon: "Fechado ganho",
        viewPipeline: "Ver pipeline",
        teamActivityTitle: "Atividade da equipe",
        invite: "Convidar",
        updatedDeal: "Atualizou um negócio",
        addedNote: "Adicionou uma nota",
        commented: "Comentou",
        changedStage: "Alterou a etapa",
        viewActivity: "Ver toda a atividade",
        revenueReportTitle: "Relatório de receita",
        thisMonth: "Este mês",
        totalRevenue: "Receita total",
        dealsClosed: "Negócios fechados",
        averageDeal: "Valor médio",
        downloadReport: "Baixar relatório",
        footerTitle: "CONECTE SUA EMPRESA.",
        footerTitle1: "COMECE A AUTOMATIZAR",
        footerTitle2: "EM MINUTOS.",
        footerDescription: "Seu agente de IA está pronto para trabalhar.",
        disclaimer:
          "Demonstração do produto: nomes, números e atividades são dados de exemplo, não resultados reais de clientes.",
      },
      unlimitedAISection: {
        usageLabel: "Uso de IA",
        usageAvailable: "100% Disponível",
        usageDescription: "Uso ilimitado de IA incluído no seu plano",
        titleLine1: "Uso Ilimitado de IA",
        titleHighlight: "Incluído",
        titleLine3: "em Todos os Planos",

        descriptionLine1:
          "Sem créditos de IA. Sem pacotes de créditos. Sem limites de uso.",
        descriptionLine2:
          "Sem cobranças inesperadas de IA. Use o Cortexa o quanto sua empresa precisar —",
        descriptionHighlight: "seu preço mensal permanece previsível.",

        unlimitedTitle: "IA Ilimitada",
        unlimitedDescription: "Use as ferramentas de IA o quanto precisar.",

        noCreditsTitle: "Sem Créditos",
        noCreditsDescription: "Sem pacotes de créditos. Sem recargas.",

        noBillsTitle: "Sem Cobranças Surpresa",
        noBillsDescription: "Um preço mensal previsível.",

        growthTitle: "Criado para Crescer",
        growthDescription: "Escale sua empresa sem limites.",

        footerTitle: "IA poderosa. Preço previsível.",
        footerHighlight: "Esse é o jeito Cortexa.",
      },
      everythingIncludedSection: {
        eyebrow: "TUDO INCLUÍDO. NADA EXTRA.",

        titleLine1: "Veja",
        titleHighlight: "Exatamente",
        titleLine2: "O Que Você Recebe",

        description:
          "Outras plataformas cobram à parte pelas ferramentas e recursos que sua equipe realmente precisa. O Cortexa inclui tudo para que você possa focar no que importa: fechar negócios.",

        columnFeature: "O QUE VOCÊ RECEBE",
        columnOthers: "COM OUTROS",

        rows: [
          {
            feature: "CRM e Gestão de Contatos",
            other: "Complemento ou plano superior",
            included: "Incluído",
          },
          {
            feature: "Leads e Gestão de Pipeline",
            other: "Complemento ou ferramenta separada",
            included: "Incluído",
          },
          {
            feature: "Campanhas de E-mail e SMS",
            other: "Complemento ou ferramenta separada",
            included: "Incluído",
          },
          {
            feature: "Agente de IA 24/7",
            other: "Complemento ou plataforma separada",
            included: "Incluído",
          },
          {
            feature: "Automação do WhatsApp",
            other: "Complemento ou integração adicional",
            included: "Incluído",
          },
          {
            feature: "Agendamento de Compromissos",
            other: "Complemento ou plano superior",
            included: "Incluído",
          },
          {
            feature: "Relatórios e Análises",
            other: "Complemento ou nível superior",
            included: "Incluído",
          },
          {
            feature: "Colaboração em Equipe",
            other: "Complemento ou plano superior",
            included: "Incluído",
          },
          {
            feature: "Automação de Fluxos",
            other: "Complemento ou ferramenta separada",
            included: "Incluído",
          },
          {
            feature: "Uso Ilimitado de IA",
            other: "Limites de uso ou custo adicional",
            included: "Ilimitado. Sem custo extra.",
          },
          {
            feature: "Taxas de Contatos de Marketing",
            other: "Cobrado separadamente conforme o uso",
            included: "Sem taxas extras.",
          },
        ],

        footerTitle: "Uma plataforma. Tudo incluído.",
        footerDescription: "Sem adicionais. Sem surpresas. Apenas resultados.",
      },
    },
  };
  const switchLocale = useLocaleSwitch();
  const handleLangChange = (newLang) => {
    setLang(newLang);
    setLangOpen(false);
    switchLocale(newLang);
  };
  const tr = t[lang];
  const workspace =
    lang === "es"
      ? workspaceImgES
      : lang === "pt"
        ? workspaceImgPT
        : workspaceImg;

  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80",
  ];
  return (
    <div className="mobile-landing">
      {/* HEADER */}

      <header className="m-header">
        <a href="/">
          <img src={headlogoImg} alt="CORTEXA" className="m-logo" />
        </a>
        <div className="m-header-right">
          <div className="m-lang-wrapper">
            <button
              className="m-lang-btn"
              onClick={() => setLangOpen(!langOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                viewBox="0 0 24 24"
                fill="none"
                className="img-local"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12H22M12 2C9.43223 4.69615 8 8.27674 8 12C8 15.7233 9.43223 19.3038 12 22C14.5678 19.3038 16 15.7233 16 12C16 8.27674 14.5678 4.69615 12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>{" "}
            </button>

            {langOpen && (
              <div className="m-lang-dropdown">
                <button type="button" onClick={() => handleLangChange("en")}>
                  English
                </button>
                <button type="button" onClick={() => handleLangChange("es")}>
                  Español
                </button>
                <button type="button" onClick={() => handleLangChange("pt")}>
                  Português
                </button>
              </div>
            )}
          </div>

          <button className="m-menu-btn" onClick={() => setMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </div>
      </header>
      <button
        className={`m-scroll-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp size={22} color="#ffffff" strokeWidth={2.5} />
      </button>
      {/* DRAWER */}

      <div className={`m-drawer ${menuOpen ? "open" : ""}`}>
        <div className="m-drawer-top">
          <img src={headlogoImg} alt="" className="m-drawer-logo" />
          <button className="m-close" onClick={() => setMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="m-drawer-nav">
          {tr.nav.map((n, i) => {
            const ids = [
              "features",
              "ai-assistant",
              "automation",
              "pipeline",
              "analytics",
              "testimonials",
            ];
            // Testimonials section removed; skip its nav link.
            if (ids[i] === "testimonials") return null;

            return (
              <HashLink className="nav-menu" key={i} smooth to={`/#${ids[i]}`}>
                {n}
              </HashLink>
            );
          })}

          <a href="/pricing">{tr.pricing}</a>
          <a href="/editorial/the-end-of-legacy-crm">Cost Calculator</a>
          {isAuthenticated() ? (
            <Link to="/dashboard/home" className="m-login-btn">
              <LogIn /> Dashboard
            </Link>
          ) : (
            <Link to="/sign-in" className="m-login-btn">
              <LogIn /> {tr.login}
            </Link>
          )}
        </div>

        <div className="m-drawer-actions"></div>
      </div>

      {/* OVERLAY */}

      {menuOpen && (
        <div className="m-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* HERO */}

      <section className="m-hero">
        <div className="m-hero-banner">
          <Zap size={38} />

          <p>
            {tr.heroTopBanner1} {tr.heroTopBanner2}
          </p>
        </div>

        <h1 className="m-title">
          {tr.heroTitle1}
          <br />
          {tr.heroTitle11}
          <br />
          {tr.heroTitle2}
          <br />
          {tr.heroTitle3}
          <br />
          {tr.heroTitle4}
        </h1>

        <p className="m-description">{tr.heroDesc}</p>
        <div className="m-hero-actions">
          <a
            href="/trial?flow=free-access&plan=free"
            className="m-hero-cta m-hero-cta-trial m-hero-free-access-main"
          >
            {tr.ctaButtonText}
          </a>

          <div className="m-hero-free-access-meta">
            <span>
              <CreditCard size={23} />
              {tr.heroNoCard}
            </span>
            <i aria-hidden="true" />
            <span>
              <Infinity size={26} />
              {tr.heroFreeForever}
            </span>
          </div>

          <div className="hero-checks">
            {[tr.heroCheck6, tr.heroCheck7, tr.heroCheck8, tr.heroCheck9].map(
              (item, index) => (
                <div className="check-item" key={index}>
                  <span className="check">
                    <CheckCircle size={28} />
                  </span>
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="m-trust">
          <div className="m-trust-text">{tr.trusted}</div>
        </div>
        {/* dashboard image */}
        <div className="m-dashboard">
          <img src={landingDashImg} alt="" />
          <i>
            Product demo — the names, numbers, and activity shown are sample
            data for illustration only, not real customer results.
          </i>
        </div>
      </section>

      <section className="features">
        <div className="cx-mob-container">
          <div className="cx-mob-header">
            <h2 className="cx-mob-title">
              {tr.heroTitlePre}
              <span className="cx-mob-blue-light">{tr.heroTitleActive}</span>
              {tr.heroTitlePost}
            </h2>
            <p className="cx-mob-subtitle">
              {tr.heroSubPre}
              <span className="cx-mob-blue-bright">{tr.heroSubActive}</span>
            </p>
          </div>

          <div className="cx-mob-flow-chart">
            <img src={featurechart} alt="features chart" />
          </div>

          <div className="cx-mob-stat-block">
            <h4>{tr.stat1Title}</h4>
            <p>{tr.stat1Desc}</p>
          </div>
        </div>
      </section>
      {/* BENEFITS SECTION */}
      <section className="m-benefits" id="features">
        <div className="m-benefits-header">
          <p className="m-benefits-subtitle">{tr.benefitsSubtitle}</p>
          <h2 className="m-benefits-title">
            {tr.benefitsTitle1}
            <br />
            {tr.benefitsTitle2}
          </h2>
        </div>

        <div className="m-benefits-grid">
          <div className="m-benefit-card">
            <div className="m-benefit-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-benefit-icon"
              >
                <path d="M22 17v1c0 .5-.2 1-.6 1.4-.4.4-.9.6-1.4.6H4c-.5 0-1-.2-1.4-.6C2.2 19 2 18.5 2 18v-1" />
                <path d="M6 14h12" />
                <path d="M10 10h4" />
                <path d="m16 2-4 4-4-4" />
              </svg>
            </div>
            <div>
              <h3>{tr.followUpTitle}</h3>
              <p>{tr.followUpDesc}</p>
            </div>
          </div>

          <div className="m-benefit-card">
            <div className="m-benefit-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-benefit-icon"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <path d="M10 16h4" />
                <path d="M12 14v4" />
              </svg>
            </div>
            <div>
              <h3>{tr.setterTitle}</h3>
              <p>{tr.setterDesc}</p>
            </div>
          </div>

          <div className="m-benefit-card">
            <div className="m-benefit-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-benefit-icon"
              >
                <path d="M3 3v18h18" />
                <path d="m7 15 5-5 4 4 5-5" />
              </svg>
            </div>
            <div>
              <h3>{tr.pipelineTitle}</h3>
              <p>{tr.pipelineDesc}</p>
            </div>
          </div>

          <div className="m-benefit-card">
            <div className="m-benefit-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-benefit-icon"
              >
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </div>
            <div>
              <h3>{tr.analyticsTitle}</h3>
              <p>{tr.analyticsDesc}</p>
            </div>
          </div>
        </div>

        <div className="m-whatsapp-card">
          <div className="m-whatsapp-icon-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="m-whatsapp-icon"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.256 5.261 0 11.725 0c3.132.001 6.077 1.22 8.29 3.433 2.213 2.212 3.43 5.158 3.43 8.29 0 6.465-5.256 11.722-11.714 11.722-2.006-.001-3.974-.515-5.727-1.497L0 24zm6.106-4.66c1.651.98 3.278 1.497 4.904 1.499 5.378 0 9.754-4.374 9.758-9.75.002-2.605-1.01-5.053-2.85-6.895C16.082 2.35 13.64 1.336 11.73 1.336c-5.385 0-9.762 4.376-9.766 9.751-.001 1.706.461 3.376 1.339 4.898L2.308 21.72l6.009-1.577h-.154z" />
            </svg>
          </div>
          <div className="m-whatsapp-content">
            <h3>{tr.whatsappTitle}</h3>
            <p>{tr.whatsappDesc}</p>
          </div>
        </div>
      </section>
      <UnlimitedAISection tr={tr} />
      {/* REAL ESTATE PLATFORM SECTION */}
      <section className="m-platform">
        <div className="m-platform-header">
          <p className="m-platform-subtitle">{tr.platformSubtitle}</p>
          <h2 className="m-platform-title">
            {tr.platformTitle} <br /> {tr.platformTitle1} <br />{" "}
            {tr.platformTitle2}
          </h2>
          <p className="m-platform-desc">{tr.platformDesc}</p>
        </div>
        <div className="m-platform-list">
          <div className="m-platform-item">
            <div className="m-platform-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-platform-icon"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </div>
            <div className="m-platform-text">
              <h3>{tr.captureTitle}</h3>
              <p>{tr.captureDesc}</p>
            </div>
          </div>
          <div className="m-platform-item">
            <div className="m-platform-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-platform-icon"
              >
                <path d="m12 14 4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>
            </div>
            <div className="m-platform-text">
              <h3>{tr.engageTitle}</h3>
              <p>{tr.engageDesc}</p>
            </div>
          </div>
          <div className="m-platform-item">
            <div className="m-platform-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-platform-icon"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>
            <div className="m-platform-text">
              <h3>{tr.syncTitle}</h3>
              <p>{tr.syncDesc}</p>
            </div>
          </div>
          <div className="m-platform-item">
            <div className="m-platform-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-platform-icon"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="m-platform-text">
              <h3>{tr.pipelineMoveTitle}</h3>
              <p>{tr.pipelineMoveDesc}</p>
            </div>
          </div>
          <div className="m-platform-item">
            <div className="m-platform-icon-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-platform-icon"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 14.14 14.14" />
              </svg>
            </div>
            <div className="m-platform-text">
              <h3>{tr.closedDealsTitle}</h3>
              <p>{tr.closedDealsDesc}</p>
            </div>
          </div>
        </div>
        <div className="m-platform-dashboard">
          <img src={landingDashImg} alt="Dashboard mockup" />
          <i>
            Product demo — the names, numbers, and activity shown are sample
            data for illustration only, not real customer results.
          </i>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="m-how" id="automation">
        <div className="m-how-header">
          <p className="m-how-subtitle">{tr.howSubtitle}</p>
          <h2 className="m-how-title">{tr.howTitle}</h2>
        </div>

        <div className="m-how-timeline">
          <div className="m-timeline-line"></div>

          <div className="m-how-step">
            <div className="m-step-left">
              <div className="m-step-icon-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="m-step-right">
              <span className="m-step-number">1</span>
              <h3>{tr.step1Title}</h3>
              <p>{tr.step1Desc}</p>
            </div>
          </div>

          <div className="m-how-step">
            <div className="m-step-left">
              <div className="m-step-icon-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
            <div className="m-step-right">
              <span className="m-step-number">2</span>
              <h3>{tr.step2Title}</h3>
              <p>{tr.step2Desc}</p>
            </div>
          </div>

          <div className="m-how-step">
            <div className="m-step-left">
              <div className="m-step-icon-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="m-step-right">
              <span className="m-step-number">3</span>
              <h3>{tr.step3Title}</h3>
              <p>{tr.step3Desc}</p>
            </div>
          </div>

          <div className="m-how-step">
            <div className="m-step-left">
              <div className="m-step-icon-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
            </div>
            <div className="m-step-right">
              <span className="m-step-number">4</span>
              <h3>{tr.step4Title}</h3>
              <p>{tr.step4Desc}</p>
            </div>
          </div>

          <div className="m-how-step">
            <div className="m-step-left">
              <div className="m-step-icon-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 12 4 8H2" />
                  <path d="M14 22H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10" />
                  <path d="m14 14 3-3 3 3" />
                  <path d="M17 11v7" />
                </svg>
              </div>
            </div>
            <div className="m-step-right">
              <span className="m-step-number">5</span>
              <h3>{tr.step5Title}</h3>
              <p>{tr.step5Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM FLOW SECTION */}
      <section className="m-flow m-flow-new">
        <div className="m-flow-new-inner">
          <h2 className="m-flow-new-title">
            {tr.flowNewTitle1}
            <br />
            {tr.flowNewTitle2}
          </h2>

          <p className="m-flow-new-description">{tr.flowNewDescription}</p>

          <Link to="/trial" className="m-flow-new-button">
            <span>{tr.flowNewButton}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <ReportingSection tr={tr} />
      <section id="m-workspace">
        <div className="aios-container">
          <div className="aios-container-title">
            {tr.aiosSectionTitle}
            <br />
            {tr.aiosSectionTitle1}
            <br />
            {tr.aiosSectionTitle2}
          </div>
          <img src={workspace} alt="workspace" />
        </div>
      </section>
      {/* AI APPOINTMENT SETTER SECTION */}
      <section className="m-appointment-setter" id="ai-assistant">
        <div className="m-setter-header">
          <p className="m-setter-subtitle">{tr.setterSectionSubtitle}</p>
          <h2 className="m-setter-title">
            {tr.setterSectionTitle1}
            <br />
            <span>{tr.setterSectionTitle2}</span>
            <br />
            {tr.setterSectionTitle3}
          </h2>
          <p className="m-setter-desc">{tr.setterSectionDesc}</p>
        </div>

        <div className="m-calendar-card">
          <div className="m-calendar-card-header">
            <h3>{tr.bookAppointmentTitle}</h3>
            <CalendarDays size={15} />
          </div>

          <div className="m-calendar-body-layout">
            <div className="m-cal-left">
              <div className="m-cal-month-nav">
                <span className="m-cal-arrow">‹</span>
                <span className="m-cal-month-year">May 2024</span>
                <span className="m-cal-arrow">›</span>
              </div>

              <div className="m-cal-days-grid">
                <span className="m-day-name">Mo</span>
                <span className="m-day-name">Tu</span>
                <span className="m-day-name">We</span>
                <span className="m-day-name">Th</span>
                <span className="m-day-name">Fr</span>
                <span className="m-day-name">Sa</span>
                <span className="m-day-name">Su</span>

                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num empty"></span>
                <span className="m-day-num text-muted">3</span>
                <span className="m-day-num text-muted">4</span>
                <span className="m-day-num text-muted">5</span>
                <span className="m-day-num text-muted">6</span>
                <span className="m-day-num text-muted">7</span>
                <span className="m-day-num text-muted">8</span>
                <span className="m-day-num text-muted">9</span>
                <span className="m-day-num">10</span>
                <span className="m-day-num">11</span>
                <span className="m-day-num">12</span>
                <span className="m-day-num">13</span>
                <span className="m-day-num">14</span>
                <span className="m-day-num">15</span>
                <span className="m-day-num active">16</span>
                <span className="m-day-num">17</span>
                <span className="m-day-num">18</span>
                <span className="m-day-num">19</span>
                <span className="m-day-num">20</span>
                <span className="m-day-num">21</span>
                <span className="m-day-num">22</span>
                <span className="m-day-num">23</span>
                <span className="m-day-num">24</span>
                <span className="m-day-num">25</span>
                <span className="m-day-num">26</span>
                <span className="m-day-num">27</span>
                <span className="m-day-num text-muted">28</span>
                <span className="m-day-num text-muted">29</span>
                <span className="m-day-num text-muted">30</span>
              </div>
            </div>

            <div className="m-cal-right">
              <div className="m-time-slots">
                <div className="m-time-slot">9:00 AM</div>
                <div className="m-time-slot active">10:00 AM</div>
                <div className="m-time-slot">11:00 AM</div>
                <div className="m-time-slot">12:00 PM</div>
                <div className="m-time-slot">1:00 PM</div>
              </div>
            </div>
          </div>

          <button className="m-calendar-confirm-btn">
            {tr.confirmBtnText}
          </button>
        </div>
      </section>

      {/* FINAL DATA CTA SECTION */}
      <section className="m-final-cta" id="pipeline">
        <div className="m-final-cta-header">
          <h2 className="m-final-cta-title">
            {tr.ctaTitle1}
            <br />
            {tr.ctaTitle2}
            <br />
            <span>{tr.ctaTitle3}</span>
            <br />
            {tr.ctaTitle4}
          </h2>
          <h4>{tr.pipelinecta1}</h4>
          <h3 className="m-final-cta-t2">
            {tr.ctaTitleSub1}
            <br />
            {tr.ctaTitleSub2}
            <br />
            {tr.ctaTitleSub3}
            <br />
            {tr.ctaTitleSub4}
            <br />
            {tr.ctaTitleSub5}
            <br />
            {tr.ctaTitleSub6}
          </h3>
          <h4>{tr.pipelinecta2}</h4>
        </div>

        <div className="m-final-cta-action">
          <a href="/trial" className="m-final-purple-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="m-btn-zap"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <p>
              {tr.ctaButtonText}
              <br />
              <span>{tr.finalCtaSubBtn1}</span>
            </p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="m-btn-arrow"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
          <div className="m-final-foot">
            <p>{tr.ctaready}</p>
            <a href="/sign-in">{tr.fLogin}</a>
          </div>
        </div>
      </section>
      <section className="m-powerful">
        <div className="cx-mp-wrapper">
          <div className="cx-mp-badge-container">
            <div className="cx-mp-badge-outline">
              <div className="cx-mp-icon-circle">
                <Link2 size={12} />
              </div>
              <span className="cx-mp-badge-text">{tr.powerbadge}</span>
            </div>
          </div>

          <h2 className="cx-mp-heading">{tr.powertitle}</h2>
          <img src={powerfulM} alt="powerful" />
        </div>
      </section>
      {/* TESTIMONIALS SECTION */}

      <EverythingIncludedSection tr={tr} />
      {/* FAQ SECTION */}
      <section className="m-faq">
        <div className="m-faq-header">
          <p className="m-faq-subtitle">{tr.faqSubtitle}</p>
          <h2 className="m-faq-title">{tr.faqTitle}</h2>
        </div>

        <div className="m-faq-list">
          {tr.faq.map((item, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className={`m-faq-item ${isOpen ? "active" : ""}`}
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div className="m-faq-question-row">
                  <h3>{item.q}</h3>
                  <span className="m-faq-toggle-icon">
                    {isOpen ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                  </span>
                </div>
                <div className="m-faq-answer-wrapper">
                  <p className="m-faq-answer">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL BACKGROUND CTA BLOCK */}
      <section className="m-bottom-cta" id="analytics">
        <div className="m-bottom-cta-inner">
          <h2 className="m-bottom-title">
            {tr.finalCtaTitle1}
            <br />
            {tr.finalCtaTitle2}
          </h2>
          <p className="m-bottom-desc">
            {tr.finalCtaDesc} <span className="text-blue">Revenue OS.</span>
          </p>

          <div className="m-bottom-action-wrapper">
            <a href="/trial" className="m-bottom-primary-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="m-bottom-zap"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <div className="trial-wrap">
                <span>{tr.finalCtaBtn}</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="m-bottom-arrow"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
            
          </div>

          <div className="m-bottom-preview-container">
            <img
              src={dashboardMockupImg}
              alt="CORTEXA Mobile Dashboard"
              className="m-bottom-preview-img"
            />
          </div>
        </div>
      </section>

      {/* EXPLORE OUR MARKETS SECTION */}
      <section className="m-markets">
        <div className="m-markets-header">
          <p className="m-markets-subtitle">{tr.marketsSubtitle}</p>
          <h2 className="m-markets-title">
            {tr.marketsTitle1}
            <br />
            {tr.marketsTitle2}
            <br />
            {tr.marketsTitle3}
            <br />
            <span>{tr.marketsTitle4}</span>
          </h2>
        </div>

        <div className="m-markets-body">
          <label className="m-regions-label">{tr.marketsRegionLabel}</label>

          <div className="m-markets-list">
            {/* ================= LATIN AMERICA ================= */}
            <div className="m-region-group-header">
              <Globe />
              <span>{tr.regionLatAm}</span>
            </div>

            {/* BRAZIL */}
            <div
              className={`m-market-row-block ${activeMarket === "br" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "br" ? null : "br")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/br.png`} alt="flag" />
                  <span className="m-market-name">Brazil</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "São Paulo",
                    "Rio de Janeiro",
                    "Brasília",
                    "Belo Horizonte",
                    "Salvador",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/brazil/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* MEXICO */}
            <div
              className={`m-market-row-block ${activeMarket === "mx" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "mx" ? null : "mx")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/mx.png`} alt="flag" />
                  <span className="m-market-name">Mexico</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "Mexico City",
                    "Guadalajara",
                    "Monterrey",
                    "Puebla",
                    "Tijuana",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/mexico/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ARGENTINA */}
            <div
              className={`m-market-row-block ${activeMarket === "ar" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "ar" ? null : "ar")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/ar.png`} alt="flag" />
                  <span className="m-market-name">Argentina</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "Buenos Aires",
                    "Córdoba",
                    "Rosario",
                    "Mendoza",
                    "La Plata",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/argentina/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* CHILE */}
            <div
              className={`m-market-row-block ${activeMarket === "cl" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "cl" ? null : "cl")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/cl.png`} alt="flag" />
                  <span className="m-market-name">Chile</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "Santiago",
                    "Valparaíso",
                    "Concepción",
                    "La Serena",
                    "Antofagasta",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/chile/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* COLOMBIA */}
            <div
              className={`m-market-row-block ${activeMarket === "co" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "co" ? null : "co")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/co.png`} alt="flag" />
                  <span className="m-market-name">Colombia</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "Bogotá",
                    "Medellín",
                    "Cali",
                    "Barranquilla",
                    "Cartagena",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/colombia/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* PERU */}
            <div
              className={`m-market-row-block ${activeMarket === "pe" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "pe" ? null : "pe")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/pe.png`} alt="flag" />
                  <span className="m-market-name">Peru</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Lima", "Arequipa", "Trujillo", "Cusco", "Piura"].map(
                    (c) => (
                      <a
                        key={c}
                        href={`/peru/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* ECUADOR */}
            <div
              className={`m-market-row-block ${activeMarket === "ec" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "ec" ? null : "ec")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/ec.png`} alt="flag" />
                  <span className="m-market-name">Ecuador</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Quito", "Guayaquil", "Cuenca", "Manta", "Ambato"].map(
                    (c) => (
                      <a
                        key={c}
                        href={`/ecuador/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* ================= UNITED STATES ================= */}
            <div className="m-region-group-header">
              <Globe />
              <span>{tr.regionUSA}</span>
            </div>

            <div
              className={`m-market-row-block ${activeMarket === "us" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "us" ? null : "us")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/us.png`} alt="flag" />
                  <span className="m-market-name">United States</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid m-us-split">
                  <div className="m-us-col">
                    {[
                      "New York City",
                      "Boston",
                      "Miami",
                      "Orlando",
                      "Los Angeles",
                    ].map((c) => (
                      <a
                        key={c}
                        href={`/united-states/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ))}
                  </div>
                  <div className="m-us-col">
                    {[
                      "San Francisco",
                      "San Diego",
                      "Chicago",
                      "Dallas",
                      "Houston",
                      "Austin",
                    ].map((c) => (
                      <a
                        key={c}
                        href={`/united-states/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= EUROPE ================= */}
            <div className="m-region-group-header">
              <Globe />
              <span>{tr.regionEurope}</span>
            </div>

            {/* UNITED KINGDOM */}
            <div
              className={`m-market-row-block ${activeMarket === "gb" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "gb" ? null : "gb")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/gb.png`} alt="flag" />
                  <span className="m-market-name">United Kingdom</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {[
                    "London",
                    "Manchester",
                    "Birmingham",
                    "Liverpool",
                    "Leeds",
                  ].map((c) => (
                    <a
                      key={c}
                      href={`/united-kingdom/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* PORTUGAL */}
            <div
              className={`m-market-row-block ${activeMarket === "pt" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "pt" ? null : "pt")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/pt.png`} alt="flag" />
                  <span className="m-market-name">Portugal</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Lisbon", "Porto", "Braga", "Faro", "Coimbra"].map((c) => (
                    <a
                      key={c}
                      href={`/portugal/${c.toLowerCase().replace(/ /g, "-")}`}
                      className="m-city-lnk"
                    >
                      <MapPin size={15} /> {c}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* SPAIN */}
            <div
              className={`m-market-row-block ${activeMarket === "es" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "es" ? null : "es")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/es.png`} alt="flag" />
                  <span className="m-market-name">Spain</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"].map(
                    (c) => (
                      <a
                        key={c}
                        href={`/spain/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="m-view-all-countries">
            <a href="/markets">
              <Globe />
              <span>{tr.viewAllCountriesText}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* MOBILE FOOTER SECTION */}
      <footer className="m-footer">
        <div className="m-footer-brand">
          <div className="m-footer-logo">
            <img src={headlogoImg} alt="CORTEXA" className="m-logo" />
          </div>
          <p className="m-footer-description">{tr.footerDesc}</p>
        </div>

        <div className="m-footer-socials">
          <a href="#" className="m-social-btn" aria-label="Facebook">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          <a href="#" className="m-social-btn" aria-label="Instagram">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a href="#" className="m-social-btn" aria-label="LinkedIn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
          <a href="#" className="m-social-btn" aria-label="YouTube">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>

        <div className="m-footer-links-grid">
          <div className="m-footer-column">
            <h4>{tr.colProduct}</h4>
            <a href="/features">{tr.fFeatures}</a>
            <HashLink smooth to="/features#ai-assistant">
              {tr.fAiAssistant}
            </HashLink>
            <HashLink smooth to="/features#automations">
              {tr.fAutomations}
            </HashLink>
            <a href="/integrations">{tr.fIntegrations}</a>
            <HashLink smooth to="/features#analytics">
              {tr.fAnalytics}
            </HashLink>
            <a href="/pricing">{tr.fPricing}</a>
            <a href="/editorial/the-end-of-legacy-crm">Cost Calculator</a>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colGetStarted}</h4>
            <a href="/trial">{tr.fStart}</a>
            <a href="/sign-in">{tr.fLogin}</a>
            <a href="/setup-guide">{tr.fSetup}</a>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colConnect}</h4>
            <HashLink smooth to="/integrations#connect-apps">
              {tr.fConnectApps}
            </HashLink>
            <HashLink smooth to="/integrations#import-crm">
              {tr.fImportCrm}
            </HashLink>
            <HashLink smooth to="/integrations#import-csv">
              {tr.fImportCsv}
            </HashLink>
            <HashLink smooth to="/integrations#zapier-automations">
              {tr.fZapier}
            </HashLink>
            <HashLink smooth to="/integrations#api-webhooks">
              {tr.fApiWebhooks}
            </HashLink>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colSupport}</h4>
            <a href="/support">{tr.fSupport247}</a>
            <a href="/help">{tr.fHelpCenter}</a>
            <a href="/contact">{tr.fContact}</a>
            <a href="/about">{tr.fAbout}</a>
          </div>

          <div className="m-footer-column full-width-mobile">
            <h4>{tr.colLegal}</h4>
            <a href="/terms">{tr.fTerms}</a>
            <a href="/privacy-policy">{tr.fPrivacy}</a>
            <a href="/refund-policy">{tr.fRefund}</a>
            <a href="/cancellation">{tr.fCancel}</a>
          </div>
        </div>

        <div className="m-footer-bottom">
          <p className="m-footer-copy-text">{tr.copyright}</p>
          <div className="m-footer-bottom-links">
            <a href="/privacy-policy">{tr.fPrivacy}</a>
            <span className="m-divider">|</span>
            <a href="/terms">{tr.termsOfService}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}