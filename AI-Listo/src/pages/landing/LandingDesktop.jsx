import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  UserPlus,
  RefreshCcw,
  DollarSign,
  BarChart3,
  Brain,
  Plug,
  ArrowRight,
  CheckCircle,
  Zap,
  MessageCircleCheck,
  ShieldX,
  ChartColumn,
  XCircle,
  Clock,
  EyeOff,
  Flame,
  Users,
  HelpCircle,
  GitMerge,
  Cpu,
  Target,
  TrendingUp,
  UserCheck,
  MessagesSquare,
  Eye,
  ChartNoAxesColumn,
  MessageSquareMore,
  Rocket,
  FileText,
  GitFork,
  PieChart,
  ShieldCheck,
  MoveRight,
  LockKeyhole,
  RotateCcw,
  Clock4,
  ChartNoAxesCombined,
  User,
  Bot,
  Send,
  Home,
  Workflow,
  TriangleAlert,
  LayoutDashboard,
  MessageSquare,
  Hourglass,
  Sparkles,
  Contact2,
  Users2,
  Puzzle,
  CheckCircle2, Link2, Check, Grid, ChevronRight,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import "./LandingDesktop.css";

import footlogo from "../../assets/cortexa/p-flogo.png";
import CountriesCitiesSection from "./CountriesCitiesSection";
import herorightImg from "../../assets/cortexa/hero_right.png";
import trialmobileImg from "../../assets/cortexa/img_desktop_none.png";
import headlogotranImg from "../../assets/cortexa/headlogotran.png";
import logotranImg from "../../assets/cortexa/logotran.png";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import heroImgES from "../../assets/cortexa/hero-es.png";
import heroImgPT from "../../assets/cortexa/hero-pt.png";

import sec2Img from "../../assets/cortexa/Cortexa sec 2.png";
import sec2ImgES from "../../assets/cortexa/sec2ES.png";
import sec2ImgPT from "../../assets/cortexa/sec2PT.png";

import sec3Img from "../../assets/cortexa/Cortexa sec 3.png";
import sec3ImgES from "../../assets/cortexa/sec3ES.png";
import sec3ImgPT from "../../assets/cortexa/sec3PT.png";

import sec4Img from "../../assets/cortexa/Cortexa sec 4.png";
import sec4ImgES from "../../assets/cortexa/sec4ES.png";
import sec4ImgPT from "../../assets/cortexa/sec4PT.png";

import sec5Img from "../../assets/cortexa/Cortexa sec 5.png";
import sec5ImgES from "../../assets/cortexa/sec5ES.png";
import sec5ImgPT from "../../assets/cortexa/sec5PT.png";

import feaImg1 from "../../assets/cortexa/featured1.png";
import feaImg2 from "../../assets/cortexa/featured2.png";
import feaImg3 from "../../assets/cortexa/featured3.png";
import feaImg4 from "../../assets/cortexa/featured4.png";
import finalImg from "../../assets/cortexa/final.png";

import aiSetterImg from "../../assets/cortexa/aiSetter.png";
import aiSetterImgES from "../../assets/cortexa/aiSetterES.png";
import aiSetterImgPT from "../../assets/cortexa/aiSetterPT.png";

import testimonialsImg from "../../assets/cortexa/testimonials.png";
import testimonialsImgES from "../../assets/cortexa/testimonialsES.png";
import testimonialsImgPT from "../../assets/cortexa/testimonialsPT.png";

import smart1Img from "../../assets/cortexa/smart1.png";
import smart2Img from "../../assets/cortexa/smart2.png";
import smart3Img from "../../assets/cortexa/smart3.png";

import x3xImg from "../../assets/cortexa/3x.png";
import featurechartImg from "../../assets/cortexa/feature-chart.jpg";
import powerfulImg from "../../assets/cortexa/powerful.png";
import workspaceImg from "../../assets/cortexa/workspace.png";
import workspaceImgES from "../../assets/cortexa/workspaceES.png";
import workspaceImgPT from "../../assets/cortexa/workspacePT.png";

const IconRenderer = ({ name, className }) => {
  const icons = {
    MessagesSquare: <MessagesSquare className={className} />,
    Clock: <Clock className={className} />,
    EyeOff: <EyeOff className={className} />,
    Flame: <Flame className={className} />,
    Users: <Users className={className} />,
    HelpCircle: <HelpCircle className={className} />,
    GitMerge: <GitMerge className={className} />,
    Cpu: <Cpu className={className} />,
    Target: <Target className={className} />,
    TrendingUp: <TrendingUp className={className} />,
    UserCheck: <UserCheck className={className} />,
    CheckCircle: <CheckCircle className={className} />,
  };
  return icons[name] || null;
};
const trustIcons = [
  <Target className="cx-icon" stroke="url(#icon-gradient)" />,
  <Eye className="cx-icon" stroke="url(#icon-gradient)" />,
  <TrendingUp className="cx-icon" stroke="url(#icon-gradient)" />,
  <Zap className="cx-icon" stroke="url(#icon-gradient)" />,
];
export default function Landing() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(0);
  const { isAuthenticated } = useAuth();

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("cortexa_lang", newLang);
    setLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".lang-wrapper")) {
        setLangOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const t = {
    en: {
      top: "Meet Your AI CRM. Maximize human productivity with your custom AI teammates.",

      nav: [
        "Features",
        "AI Assistant",
        "AI Automation",
        "Pipeline",
        "Analytics",
        "Testimonials",
      ],

      trial: "Get Started",
      login: "Log in",

      stripTitlebk: "Your CRM shouldn’t slow you down.",
      stripSubbk: "Join teams using CORTEXA...",

      featuresTitle: "Turn your data into decisions",

      cards: [
        {
          eyebrow: "AI Assistant",
          title: "Instant answers from your dashboard",
          desc: "Get insights, summaries, and recommendations in seconds. Ask anything about your leads, pipeline, properties, or team performance.",
        },
        {
          eyebrow: "Analytics",
          title: "Track performance in real time",
          desc: "Monitor conversion rates, response times, and activity across your business. Know what’s working and where to improve instantly.",
        },
        {
          eyebrow: "AI Follow up",
          title: "Automate your follow-ups",
          desc: "Never miss a lead. Send instant, personalized replies across your channels and nurture opportunities automatically.",
        },
        {
          eyebrow: "AI Appoitment Setter",
          title: "Close deals faster with AI",
          desc: "AI qualifies leads, books appointments, and moves opportunities forward while your team focuses on closing.",
        },
      ],

      trustSectionTitlePre: "Everything You Need. ",
      trustSectionTitlePost: "Built to Grow Revenue.",
      trustSectionSub:
        "One connected platform. Every feature works together to help you capture more leads, close more deals, and ",
      trustSectionSub1: "increase your lead conversion up to 3X ",
      trustSectionSub2: "— while ",
      trustSectionSub3: " keeping more capital in your business.",

      trustFeatures: {
        dashboard: {
          title: "Dashboard",
          items: [
            "Real-time overview",
            "Track leads & deals",
            "Key metrics at a glance",
            "Monitor team performance",
          ],
        },
        whatsapp: {
          title: "WhatsApp",
          items: [
            "Fully integrated",
            "Connect with QR code",
            "AI replies 24/7",
            "Broadcast & templates",
          ],
        },
        leads: {
          title: "Leads",
          items: [
            "Capture from any source",
            "Auto-assign, tag & score",
            "Qualify & nurture leads",
            "Never lose a lead",
          ],
        },
        pipeline: {
          title: "Pipeline",
          items: [
            "Visual deal pipeline",
            "Drag, drop & move deals",
            "Automated follow-ups",
            "Focus on what closes",
          ],
        },
        properties: {
          title: "Properties",
          items: [
            "Add & manage properties",
            "Share via WhatsApp or link",
            "Track views & inquiries",
            "Organize by status, type, price",
          ],
        },
        cortexa: {
          title: "CORTEXA AI",
          items: [
            "AI agent works 24/7",
            "Chats, books & follows up",
            "Qualifies leads instantly",
            "Works across channels",
          ],
        },
        analytics: {
          title: "Analytics",
          items: [
            "Powerful reports",
            "Track sources & revenue",
            "Measure performance",
            "Make data-driven decisions",
          ],
        },
        contacts: {
          title: "Contacts",
          items: [
            "Store all contacts",
            "View conversations & notes",
            "Segment & filter easily",
            "Keep database clean",
          ],
        },
        workspace: {
          title: "Team Workspace",
          badge: "NEW",
          items: [
            "Kanban-style task boards",
            "Assign leads & tasks",
            "Track individual performance",
            "Real-time activity feed",
          ],
        },
        apps: {
          title: "Apps & Integrations",
          items: [
            "Connect your favorite tools",
            "Sync & automate",
            "Save time & work smarter",
            "Everything works together",
          ],
        },
      },

      trustFooterBold: "ONE PLATFORM. REAL RESULTS. ",
      trustFooterText:
        "Everything you need in one system to capture more leads, close more deals, and ",

      faqTitle: "FAQs",

      faq: [
        {
          q: "What does CORTEXA actually do?",
          a: "CORTEXA automates your lead follow-ups, conversations, pipeline updates, and appointment scheduling — all in one system.",
        },
        {
          q: "How does the AI Assistant work?",
          a: "The AI responds instantly to leads, qualifies them, books appointments, and keeps every conversation moving automatically.",
        },
        {
          q: "Can I manage all my leads in one place?",
          a: "Yes. All your leads, messages, and deal stages are centralized in one dashboard so nothing gets lost.",
        },
        {
          q: "Does it update my pipeline automatically?",
          a: "Yes. As leads interact, the system moves them through your pipeline without manual input.",
        },
        {
          q: "Will I still need to follow up manually?",
          a: "No. CORTEXA is designed to handle follow-ups automatically while keeping leads engaged.",
        },
        {
          q: "Can my team use this together?",
          a: "Yes. You can add team members, assign leads, and manage deals collaboratively.",
        },
        {
          q: "What kind of businesses is this for?",
          a: "CORTEXA is built for real estate agents, teams, and any business that relies on lead generation and closing deals.",
        },
        {
          q: "What happens after a lead comes in?",
          a: "The system responds instantly, qualifies the lead, and pushes them toward booking or closing — automatically.",
        },
      ],

      finalTitle:
        "Automate your workflow with AI agents — powered by CORTEXA OS",
      finalDesc:
        "Capture leads, follow up instantly, and move every opportunity forward automatically inside one intelligent operating system.",
      footer: {
        desc: "The AI-powered CRM that helps teams close more deals, faster.",
        btn: "Get Started →",
        product: "Product",
        solutions: "Solutions",
        resources: "Resources",
        company: "Company",
        newsletter: "Stay updated",
        newsletterDesc: "Get the latest updates, CRM tips, and product news.",
        privacy: "We respect your privacy. Unsubscribe anytime.",
        status: "All systems operational",
      },
      strip: {
        title: "Your CRM shouldn’t slow you down.",
        sub: "Join teams using CORTEXA...",
        btn: "Get Started",
      },
      aiTitle: "AI Setter — Your 24/7 Appointment Engine",
      aisubTitle:
        "Responds instantly, qualifies buyers, and books appointments — automatically.",
      aipointTitle1: "Instant Responses",
      aipointText1: "Every message answered in seconds.",
      aipointTitle2: "Smart Qualification",
      aipointText2: "Filters serious buyers automatically.",
      aipointTitle3: "Automatic Booking",
      aipointText3: "Appointments scheduled without back-and-forth.",
      aialt: "AI Setter handling conversations and booking appointments",
      reinforcement:
        "Run your entire pipeline with AI — no extra hires, no missed opportunities.",
      beTitle: "What This Actually Does For You",
      besubTitle:
        "Automation handles the work. Communication never stops. Every lead keeps moving forward — without you chasing it.",
      beitem1: "Work Moves Automatically",
      beitem2: "Conversations Never Go Cold",
      beitem3: "Know Exactly What To Do Next",
      beitem4: "More Deals. Less Chasing.",
      beitemtext1:
        "Follow-ups, tracking, and organization run in the background.",
      beitemtext2:
        "Leads stay active with reminders, replies, and re-engagement.",
      beitemtext3: "See who needs attention and where your next move is.",
      beitemtext4: "Less manual work. Faster movement. Better outcomes.",
      bebottom: "Everything keeps moving — even when you’re not.",
      stripLabel: "Ready to grow?",
      stripTitle: "Start closing more deals — with AI working for you 24/7.",
      stripSub:
        "No extra hires. No missed leads. Just a smarter way to run your pipeline.",
      stripBtn: "Get Started →",
      stripBenefit1: "Get started in minutes",
      stripBenefit3: "Cancel anytime",
      stripCardTitle: "Pipeline Overview",
      stripCardPeriod: "This Month",
      stripRevenueGrowth: "▲ 28% vs last month",
      stripLeads: "Leads",
      stripDeals: "Deals",
      stripRevenue: "Revenue",
      stripAI: "AI Summary: You're on track to beat your monthly goal by 24%",

      roiTitle: "Cut Payroll. Scale With Your AI Agent.",
      roiSub:
        "AI responds instantly, follows up automatically, and keeps your pipeline moving 24/7.",
      roiBtn: "Get Started",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc:
        "CORTEXA transforms your lead handling into a revenue engine — automating follow-ups and deal flow to generate more closed deals.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Revenue Increase",
      roiStat2Desc:
        "More conversations. Faster responses. Zero missed leads — turning your pipeline into predictable revenue.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Hours Saved",
      roiStat3Desc:
        "AI replaces manual outreach, follow-ups, and admin work — freeing your time while your business keeps moving.",
      roiStat4Number: "< 30 Days",
      roiStat4Label: "Payback",
      roiStat4Desc:
        "Most users recover their investment within the first month from deals that would have otherwise been lost.",

      aiosBadgeTitle: "Meet Your",
      aiosBadgeHighlight: "AI OS",
      aiosSubtitle:
        "AI system built for real estate teams — captures more leads, follows up automatically, manages deals, and helps your team close more, all in one place.",
      aiosCards: [
        {
          title: "AI CRM",
          desc: "Manage every lead, client, property, and deal in one place.",
        },
        {
          title: "AI Agent",
          desc: "Responds, qualifies, and follows up automatically 24/7.",
        },
        {
          title: "Smart Dashboards",
          desc: "See your leads, pipeline, tasks, team, and performance clearly.",
        },
        {
          title: "Automated Follow-Up",
          desc: "Keep every prospect moving without chasing manually.",
        },
        {
          title: "Real Estate Workflow",
          desc: "Built around listings, buyers, sellers, agents, and deals.",
        },
      ],
      aiosCRMHeaders: ["Name", "Status", "Last Activity"],
      aiosCRMRows: [
        ["John Doe", "New", "2m ago"],
        ["Sarah Smith", "Contacted", "15m ago"],
        ["Mike Johnson", "Qualified", "1h ago"],
        ["Emma Brown", "Proposal", "2h ago"],
        ["David Wilson", "Closed", "1d ago"],
      ],
      aiosAgentGreeting: "Hi! I'm your AI Agent. How can I help today?",
      aiosAgentReply: "I'm looking for a 3 bedroom house.",
      aiosDashboardStats: {
        leads: "Leads",
        pipeline: "Pipeline",
        deals: "Deals",
      },
      aiosFollowups: [
        ["New Lead", "1 min"],
        ["AI Follow-Up", "1 hour"],
        ["Nurture Msg", "1 day"],
        ["Convert to Client", "3 days"],
      ],
      aiosProperty: {
        tag: "New Listing",
        address: "123 Ocean View Dr.",
        beds: "3",
        baths: "2",
        garage: "2",
      },

      howTitle: "How It Works",
      howSteps: [
        {
          title: "Connect Your Leads",
          desc: "Bring in leads from your website, ads, WhatsApp, forms, and campaigns.",
        },
        {
          title: "AI Responds 24/7",
          desc: "CORTEXA AI answers, qualifies, follows up, and keeps conversations moving.",
        },
        {
          title: "You Close More Deals",
          desc: "Your team works the hottest opportunities with better timing and less manual work.",
        },
      ],

      heroTitleLine1: "Get Instant Leads.",
      heroTitleLine2: "Close More Deals.",
      heroTitleLine3: "Run Your Real Estate Bussiness",
      heroTitleLine4: "with AI.",
      heroSubtitle:
        "Capture, follow up, and close — all in one system. Connect all your apps so your listings, leads, and data flow into one place automatically.",
      herotextabove:
        "All-in-one AI platform that helps you capture more leads, follow up instantly, close more deals, and grow revenue on autopilot.",
      heroCheck6:
        "Your AI Agent finds, captures, and qualifies leads automatically",
      heroCheck7: "Multi-chanel outreach via calls, texts, Whatsapp & more",
      heroCheck8: "Automated follow-ups and appointment booking run 24/7",
      heroCheck9:
        "Pipeline Intelligence, revenue forecasting, one connected dashboard.",
      heroCheck10: "Handles conversations, qualifies, and nurtures every lead",
      heroCheck11: "Books appointments directly on your calendar",
      heroCheck12: "See every lead, deal & opportunity in one dashboard",
      heroCTA: "Get Started",
      heroUnlock: "Unlock potential today!",
      underCTA: "One-time setup fee: $97",
      heroTag1: "One AI Platform. Everything Connected.",
      heroTag2: "AI Auto Follow-Ups 24/7",
      heroTag3: "Smart Nurturing That Converts",
      heroTag4: "Pipeline Intelligence That Closes",
      heroTag5: "WhatsApp Integration Built-in",
      heroTag6: "Secure. Reliable. Built for Real Estate.",
      heroHead: "Real Estate Agents & Teams",

      smartBadge: "FROM LEAD TO REVENUE — AUTOMATICALLY",

      smartTitle1: "Capture.",
      smartTitle2: "Nurture.",
      smartTitle3: "Close.",
      smartTitle4: "Repeat.",

      smartSubtitle:
        "CORTEXA connects your ads, website, WhatsApp, AI Agent, CRM, and analytics into one intelligent system that turns leads into closed deals.",

      captureTitle: "CAPTURE",
      captureDesc:
        "Leads come in from everywhere. CORTEXA captures them instantly.",

      convertTitle: "CONVERT",
      convertDesc:
        "AI qualifies, nurtures, and books appointments 24/7 on autopilot.",

      closeTitle: "CLOSE",
      closeDesc:
        "Pipeline, team, and analytics give complete visibility to close more deals.",

      smartBenefit1Title: "More Revenue",
      smartBenefit1Text: "Capture more leads and close more deals.",
      smartBenefit2Title: "Save Time",
      smartBenefit2Text: "Automate follow-ups and appointments.",
      smartBenefit3Title: "Empower Your Team",
      smartBenefit3Text: "Everyone knows what to do and when to do it.",
      smartBenefit4Title: "Data That Drives",
      smartBenefit4Text: "Real-time analytics to grow your business.",
      smartButton: "Turn Your Business Into An Automated Machine",
      smartBlock1: "Instant capture, Zero leads lose.",
      smartBlock2: "AI work 24/7. You close more.",
      smartBlock3: "See everything. Close more.",
      smartBottom: "More Leads. More Appointments. More Closings.",

      topLine1: "The simple ",
      topHighlight: "revenue operating system",
      topLine3:
        "for bussinesses tired of complicated, overpriced CRM software.",
      pricing: "Pricing",

      finalTitle: "Automate Your Entire Workflow",
      finalDesc:
        "CORTEXA captures leads, automates follow-ups, updates your pipeline, and keeps your team moving — so you can focus on closing deals",
      reinforcement: "No credit card required",

      footerDescription:
        "The AI-powered CRM that helps you capture leads, automate follow-ups, and close more deals — faster.",

      startFreeTrial: "Get Started",
      startYourFreeTrial: "Get Started →",

      tagAiPowered: "✨ AI-Powered",
      tagSecure: "🛡 Secure",
      tagAutomation: "⚡ Automation",
      tagInsights: "📊 Insights",

      product: "Product",
      features: "Features",
      aiAssistant: "AI Assistant",
      automations: "Automations",
      integrations: "Integrations",
      analytics: "Analytics",
      pricing: "Pricing",

      getStarted: "Get Started",
      createAccount: "Create Account",
      login: "Login",
      dashboard: "Dashboard",
      setupGuide: "Setup Guide",

      connect: "Connect",
      connectApps: "Connect Your Apps",
      importCrm: "Import Your CRM",
      importCsv: "Import CSV / Excel",
      zapierAutomation: "Zapier & Automations",
      apiWebhooks: "API & Webhooks",

      support: "Support",
      support247: "24/7 Support",
      helpCenter: "Help Center",
      contactUs: "Contact Us",
      aboutUs: "About Us",

      legal: "Legal",
      terms: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      refundPolicy: "Refund Policy",
      cancellationPolicy: "Cancellation Policy",

      heroTitlePre: "Built to ",
      heroTitleActive: "Grow Revenue",
      heroTitlePost: " — Not Manage Software.",
      heroDescPre:
        "Most platforms piece together separate tools for AI, CRM, marketing, reporting, automation, communication, and data — ",
      heroDescActive: "We bring it all into one connected workspace",
      heroDescPost:
        " so your team can capture leads, qualify prospects, automate follow-ups, manage pipelines, book appointments, track performance, and close more deals.",
      nodeLeadsTitle: "LEADS",
      nodeLeadsSub: "Capture & Qualify",
      nodeContactsTitle: "CONTACTS",
      nodeContactsSub: "Organize & Manage",
      nodePropertiesTitle: "PROPERTIES",
      nodePropertiesSub: "Manage Listings",
      nodeWhatsappTitle: "WHATSAPP",
      nodeWhatsappSub: "Automation",
      nodeDashboardTitle: "DASHBOARD",
      nodeAgentTitle: "AI AGENT",
      nodeAgentSub: "Conversations 24/7",
      nodeHybridTitle: "HYBRID CONNECTS",
      nodeHybridSub: "All Channels",
      nodePipelineTitle: "PIPELINE",
      nodePipelineSub: "Manage Deals",
      nodeAppointmentsTitle: "APPOINTMENTS",
      nodeAppointmentsSub: "Book & Schedule",
      nodeTasksTitle: "TASKS",
      nodeTasksSub: "Track & Follow Up",
      nodeDocumentsTitle: "DOCUMENTS",
      nodeDocumentsSub: "Store & Share",
      nodeAnalyticsTitle: "ANALYTICS",
      nodeAnalyticsSub: "Reports & Insights",
      nodeTeamTitle: "TEAM WORKSPACE",
      nodeTeamSub: "Collaborate & Assign",
      nodeAutomationsTitle: "AUTOMATIONS",
      nodeAutomationsSub: "Workflows & Triggers",
      nodeCommunicationTitle: "COMMUNICATION",
      nodeCommunicationSub: "Email, SMS, Calls",
      nodeIntegrationsTitle: "INTEGRATIONS",
      nodeIntegrationsSub: "Connect Your Tools",
      rightStat1Up: "UP TO",
      rightStat1Main: "3X",
      rightStat1Title: "",
      rightStat1Desc:
        "Everything you need to manage leads, listings, and clients in one place.",
      rightStat2Up: "UP TO",
      rightStat2Main: "20X",
      rightStat2Title: "LESS EXPENSIVE TO IMPLEMENT",
      vsTitleLeft: "OTHER PLATFORMS COST YOU MORE",
      vsTitleRight: "OUR ALL-IN-ONE WORKSPACE",
      vsText: "VS.",
      leftCost1: "High setup fees",
      leftCost2: "Add-ons and upgrades you pay for separately",
      leftCost3: "Multiple disconnected tools",
      leftCost4: "Complex onboarding that slows your team down",
      leftCost5: "Hidden costs that add up over time",
      rightBenefit1: "Simple setup fee",
      rightBenefit2: "Everything included. No add-ons.",
      rightBenefit3: "One connected workspace",
      rightBenefit4: "Faster implementation",
      rightBenefit5: "Transparent pricing. No surprises.",

      badge: "Powerful Integrations",
      titlePre: "Works with ",
      titleActive: "tools you already use",
      subtitlePre: "Bring your leads, messages, calendars, tasks, files, and workflows ",
      subtitlePost: "into Cortexa and let AI handle the busy work.",
      feature1: "Sync in minutes",
      feature2: "Automate workflows",
      feature3: "Save time every day",
      feature4: "Keep your team aligned",
      footerTextPre: "Connect your apps, import your data, and automate your workflow inside Cortexa.",
      footerTextPost: "Manage everything from one place in Apps & Integrations.",
      btnText: "See Integrations",

      workspacelang1: "Team",
      workspacelang2: "Revenue",
      workspacelang3: "Workspace",
    },

    es: {
      top: "Conoce tu CRM con IA. Maximiza la productividad con asistentes inteligentes.",
      nav: [
        "Características",
        "Asistente de IA",
        "AI Automatización",
        "Pipeline",
        "Análisis",
        "Testimonios",
      ],
      trial: "Comenzar",
      login: "Iniciar sesión",

      stripTitlebk: "Tu CRM no debería ralentizarte.",
      stripSubbk: "Únete a equipos que usan CORTEXA...",

      featuresTitle: "Convierte tus datos en decisiones",

      cards: [
        {
          eyebrow: "Asistente de IA",
          title: "Respuestas instantáneas desde tu panel",
          desc: "Obtén insights y recomendaciones en segundos sobre leads, pipeline y rendimiento.",
        },
        {
          eyebrow: "Análisis",
          title: "Rendimiento en tiempo real",
          desc: "Monitorea conversiones, respuestas y actividad de tu negocio.",
        },
        {
          eyebrow: "Seguimiento con IA",
          title: "Automatiza seguimientos",
          desc: "Nunca pierdas un lead. Responde automáticamente en todos tus canales.",
        },
        {
          eyebrow: "Agendador de citas con IA",
          title: "Cierra más rápido con IA",
          desc: "La IA califica leads, agenda citas y avanza oportunidades.",
        },
      ],

      trustSectionTitlePre: "Todo lo que necesitas. ",
      trustSectionTitlePost: "Creado para aumentar los ingresos.",
      trustSectionSub:
        "Una plataforma conectada. Todas las funciones trabajan juntas para ayudarte a captar más leads, cerrar más negocios y ",
      trustSectionSub1: "aumentar la conversión de leads hasta 3 veces ",
      trustSectionSub2: "— mientras ",
      trustSectionSub3: "mantienes más capital dentro de tu empresa.",
      trustFeatures: {
        dashboard: {
          title: "Tablero",
          items: [
            "Resumen en tiempo real",
            "Seguimiento de prospectos y acuerdos",
            "Métricas clave de un vistazo",
            "Monitorear el desempeño del equipo",
          ],
        },
        whatsapp: {
          title: "WhatsApp",
          items: [
            "Totalmente integrado",
            "Conéctese con código QR",
            "Respuestas de IA 24/7",
            "Difusión y plantillas",
          ],
        },
        leads: {
          title: "Prospectos",
          items: [
            "Captura desde cualquier fuente",
            "Asignación automática, etiquetas y puntuación",
            "Calificar y nutrir prospectos",
            "Nunca pierda un prospecto",
          ],
        },
        pipeline: {
          title: "Túnel de ventas",
          items: [
            "Túnel visual de acuerdos",
            "Arrastrar, soltar y mover acuerdos",
            "Seguimientos automatizados",
            "Enfócate en lo que cierra",
          ],
        },
        properties: {
          title: "Propiedades",
          items: [
            "Agregar y administrar propiedades",
            "Compartir por WhatsApp o enlace",
            "Seguimiento de visitas y consultas",
            "Organizar por estado, tipo, precio",
          ],
        },
        cortexa: {
          title: "CORTEXA AI",
          items: [
            "Agente de IA trabaja 24/7",
            "Chatea, reserva y hace seguimiento",
            "Califica prospectos al instante",
            "Funciona en todos los canales",
          ],
        },
        analytics: {
          title: "Analítica",
          items: [
            "Informes potentes",
            "Seguimiento de fuentes e ingresos",
            "Medir el rendimiento",
            "Tomar decisiones basadas en datos",
          ],
        },
        contacts: {
          title: "Contactos",
          items: [
            "Almacenar todos los contactos",
            "Ver conversaciones y notas",
            "Segmentar y filtrar fácilmente",
            "Mantener la base de datos limpia",
          ],
        },
        workspace: {
          title: "Espacio del equipo",
          badge: "NUEVO",
          items: [
            "Tableros de tarefas estilo Kanban",
            "Asignar prospectos y tareas",
            "Seguimiento del rendimiento individual",
            "Flujo de actividad en tiempo real",
          ],
        },
        apps: {
          title: "Apps e Integraciones",
          items: [
            "Conecta tus herramientas favoritas",
            "Sincronizar y automatizar",
            "Ahorre tiempo y trabaje de forma inteligente",
            "Todo funciona en conjunto",
          ],
        },
      },

      trustFooterBold: "UNA PLATAFORMA. RESULTADOS REALES. ",
      trustFooterText:
        "Todo lo que necesitas en un solo sistema para captar más leads, cerrar más negocios y ",

      faqTitle: "Preguntas frecuentes",

      faq: [
        {
          q: "¿Qué hace exactamente CORTEXA?",
          a: "CORTEXA automatiza el seguimiento de clientes potenciales, las conversaciones, las actualizaciones del embudo de ventas y la programación de citas, todo en un solo sistema.",
        },
        {
          q: "¿Cómo funciona el Asistente de IA?",
          a: "La IA responde instantáneamente a los clientes potenciales, los califica, agenda citas y mantiene la conversación en marcha automáticamente.",
        },
        {
          q: "¿Puedo gestionar todos mis clientes potenciales en un solo lugar?",
          a: "Sí. Todos tus clientes potenciales, mensajes y etapas del pipeline están centralizados en un panel para que no se pierda nada.",
        },
        {
          q: "¿Actualiza mi pipeline automáticamente?",
          a: "Sí. A medida que los clientes potenciales interactúan, el sistema los mueve a través de tu pipeline sin intervención manual.",
        },
        {
          q: "¿Aún tendré que hacer seguimiento manualmente?",
          a: "No. CORTEXA está diseñado para gestionar el seguimiento automáticamente y mantener a los clientes potenciales comprometidos.",
        },
        {
          q: "¿Puede mi equipo usarlo en conjunto?",
          a: "Sí. Puedes agregar miembros del equipo, asignar clientes potenciales y gestionar acuerdos de forma colaborativa.",
        },
        {
          q: "¿Para qué tipo de negocios es esto?",
          a: "CORTEXA está diseñado para agentes inmobiliarios, equipos y cualquier negocio que dependa de generación de leads y cierre de ventas.",
        },
        {
          q: "¿Qué sucede después de que llega un cliente potencial?",
          a: "El sistema responde al instante, califica al cliente potencial y lo impulsa hacia la reserva o el cierre automáticamente.",
        },
      ],

      finalTitle: "Automatiza todo tu flujo de trabajo",
      finalDesc:
        "CORTEXA capta clientes potenciales, automatiza los seguimientos, actualiza tu pipeline y mantiene a tu equipo en movimiento, para que puedas concentrarte en cerrar más negocios.",
      footer: {
        desc: "El CRM con IA que ayuda a los equipos a cerrar más ventas más rápido.",
        btn: "Comenzar →",
        product: "Producto",
        solutions: "Soluciones",
        resources: "Recursos",
        company: "Empresa",
        newsletter: "Mantente actualizado",
        newsletterDesc: "Recibe novedades, consejos y noticias del producto.",
        privacy:
          "Respetamos tu privacidad. Puedes darte de baja en cualquier momento.",
        status: "Todos los sistemas operativos",
      },
      strip: {
        title: "Tu CRM no debería ralentizarte.",
        sub: "Únete a equipos que usan CORTEXA...",
        btn: "Comenzar",
      },
      aiTitle:
        "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle:
        "Responde al instante, califica a los compradores y programa citas automáticamente.",

      aipointTitle1: "Respuestas instantáneas",
      aipointText1: "Cada mensaje se responde en segundos.",

      aipointTitle2: "Calificación inteligente",
      aipointText2: "Filtra automáticamente a los compradores serios.",

      aipointTitle3: "Reserva automática",
      aipointText3: "Citas programadas sin idas y venidas.",
      aialt: "IA que gestiona conversaciones y agenda citas automáticamente",
      reinforcement:
        "Gestiona todo tu pipeline con IA — sin contratar más personal y sin perder oportunidades.",
      beTitle: "Lo que esto realmente hace por ti",
      besubTitle:
        "La automatización hace el trabajo. La comunicación nunca se detiene. Cada lead sigue avanzando — sin que tengas que perseguirlo.",
      beitem1: "El trabajo avanza automáticamente",
      beitem2: "Las conversaciones nunca se enfrían",
      beitem3: "Sabe exactamente qué hacer después",
      beitem4: "Más negocios. Menos seguimiento manual.",

      beitemtext1:
        "Los seguimientos, el control y la organización funcionan en segundo plano.",
      beitemtext2:
        "Los leads se mantienen activos con recordatorios, respuestas y reactivaciones.",
      beitemtext3:
        "Ve quién necesita atención y cuál debe ser tu próximo paso.",
      beitemtext4: "Menos trabajo manual. Más rapidez. Mejores resultados.",
      bebottom: "Todo sigue avanzando — incluso cuando tú no estás.",

      stripLabel: "¿Listo para crecer?",
      stripTitle:
        "Empieza a cerrar más ventas — con IA trabajando para ti 24/7.",
      stripSub:
        "Sin contratar más personal. Sin perder leads. Solo una forma más inteligente de gestionar tu pipeline.",
      stripBtn: "Comenzar →",
      stripBenefit1: "Empieza en minutos",
      stripBenefit3: "Cancela en cualquier momento",
      stripCardTitle: "Resumen del pipeline",
      stripCardPeriod: "Este mes",
      stripRevenueGrowth: "▲ 28% vs el mes pasado",
      stripLeads: "Leads",
      stripDeals: "Ventas",
      stripRevenue: "Ingresos",
      stripAI:
        "Resumen IA: Estás en camino de superar tu objetivo mensual en un 24%",

      roiTitle: "Reduce los costos de nómina. Escala con tu agente de IA.",
      roiSub:
        "La IA responde al instante, realiza seguimientos automáticamente y mantiene tu pipeline en movimiento las 24 horas del día, los 7 días de la semana.",
      roiBtn: "Comenzar",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc:
        "CORTEXA transforma la gestión de tus leads en un motor de ingresos — automatizando seguimientos y el flujo de ventas para generar más cierres.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Incremento de ingresos",
      roiStat2Desc:
        "Más conversaciones. Respuestas más rápidas. Cero leads perdidos — convirtiendo tu pipeline en ingresos predecibles.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Horas ahorradas",
      roiStat3Desc:
        "La IA reemplaza el trabajo manual, seguimientos y tareas administrativas — liberando tu tiempo mientras tu negocio sigue avanzando.",
      roiStat4Number: "< 30 días",
      roiStat4Label: "Recuperación",
      roiStat4Desc:
        "La mayoría de los usuarios recuperan su inversión en el primer mes gracias a acuerdos que antes se habrían perdido.",

      aiosBadgeTitle: "Conoce Tu",
      aiosBadgeHighlight: "AI OS",
      aiosSubtitle:
        "Sistema de IA diseñado para equipos inmobiliarios: captura más clientes potenciales, realiza seguimientos automáticamente, gestiona operaciones y ayuda a tu equipo a cerrar más negocios, todo en un solo lugar.",
      aiosCards: [
        {
          title: "CRM IA",
          desc: "Gestiona clientes, propiedades y negocios en un solo lugar.",
        },
        {
          title: "Agente IA",
          desc: "Responde, califica y da seguimiento automáticamente.",
        },
        {
          title: "Paneles Inteligentes",
          desc: "Visualiza leads, pipeline, tareas y rendimiento.",
        },
        {
          title: "Seguimiento Automático",
          desc: "Mantén cada prospecto avanzando sin perseguirlo.",
        },
        {
          title: "Flujo Inmobiliario",
          desc: "Diseñado para propiedades, compradores y agentes.",
        },
      ],
      aiosCRMHeaders: ["Nombre", "Estado", "Última Actividad"],
      aiosCRMRows: [
        ["John Doe", "Nuevo", "2 min"],
        ["Sarah Smith", "Contactado", "15 min"],
        ["Mike Johnson", "Calificado", "1 h"],
        ["Emma Brown", "Propuesta", "2 h"],
        ["David Wilson", "Cerrado", "1 día"],
      ],
      aiosAgentGreeting: "¡Hola! Soy tu Agente IA. ¿Cómo puedo ayudarte hoy?",
      aiosAgentReply: "Estoy buscando una casa de 3 habitaciones.",
      aiosDashboardStats: {
        leads: "Leads",
        pipeline: "Pipeline",
        deals: "Negocios",
      },
      aiosFollowups: [
        ["Nuevo Lead", "1 min"],
        ["Seguimiento IA", "1 hora"],
        ["Mensaje Nutrición", "1 día"],
        ["Convertir Cliente", "3 días"],
      ],
      aiosProperty: {
        tag: "Nueva Propiedad",
        address: "123 Ocean View Dr.",
        beds: "3",
        baths: "2",
        garage: "2",
      },

      howTitle: "Cómo Funciona",
      howSteps: [
        {
          title: "Conecta Tus Leads",
          desc: "Recibe leads desde tu sitio web, anuncios, WhatsApp, formularios y campañas.",
        },
        {
          title: "La IA Responde 24/7",
          desc: "La IA de CORTEXA responde, califica y realiza seguimientos automáticamente.",
        },
        {
          title: "Cierras Más Negocios",
          desc: "Tu equipo trabaja las mejores oportunidades con menos esfuerzo manual.",
        },
      ],

      heroTitleLine1: "Obtén clientes potenciales al instante.",
      heroTitleLine2: "Cierra más ventas.",
      heroTitleLine3: "Gestiona tu negocio inmobiliario",
      heroTitleLine4: "con IA.",
      heroSubtitle:
        "Captura, da seguimiento y cierra — todo en un solo sistema. Conecta todas tus aplicaciones para que tus propiedades, leads y datos fluyan automáticamente en un solo lugar.",
      herotextabove:
        "Plataforma de IA todo en uno que te ayuda a captar más clientes potenciales, dar seguimiento al instante, cerrar más ventas y aumentar los ingresos en piloto automático.",
      heroCheck5: "Tu agente de IA encuentra y califica leads automáticamente",
      heroCheck6:
        "Tu agente de IA encuentra, captura y califica leads automáticamente.",
      heroCheck7:
        "Alcance multicanal a través de llamadas, mensajes de texto, WhatsApp y más.",
      heroCheck8:
        "Los seguimientos automatizados y la reserva de citas funcionan las 24 horas del día, los 7 días de la semana.",
      heroCheck9:
        "Inteligencia de pipeline, previsión de ingresos y un panel de control unificado.",
      heroCheck10: "Gestiona conversaciones, califica y nutre cada lead",
      heroCheck11: "Agenda citas directamente en tu calendario",
      heroCheck12: "Ve cada lead, venta y oportunidad en un solo panel",
      heroCTA: "Comenzar",
      heroUnlock: "¡Desbloquea tu potencial hoy!",
      underCTA: "Tarifa única de configuración: $97",
      heroTag1: "Una plataforma de IA. Todo conectado.",
      heroTag2: "Seguimientos automáticos con IA 24/7",
      heroTag3: "Nutrición inteligente que convierte",
      heroTag4: "Inteligencia de pipeline que cierra ventas",
      heroTag5: "Integración de WhatsApp incorporada",
      heroTag6: "Segura. Confiable. Diseñada para el sector inmobiliario.",
      heroHead: "Agentes y equipos inmobiliarios",

      smartBadge: "DEL LEAD A LOS INGRESOS — AUTOMÁTICAMENTE",

      smartTitle1: "Captura.",
      smartTitle2: "Nutre.",
      smartTitle3: "Cierra.",
      smartTitle4: "Repite.",

      smartSubtitle:
        "CORTEXA conecta anuncios, sitio web, WhatsApp, IA, CRM y analíticas en un solo sistema inteligente que convierte leads en ventas.",

      captureTitle: "CAPTAR",
      captureDesc:
        "Los leads llegan desde todas partes. CORTEXA los captura al instante.",

      convertTitle: "CONVERTIR",
      convertDesc: "La IA califica, nutre y agenda citas automáticamente 24/7.",

      closeTitle: "CERRAR",
      closeDesc: "Pipeline, equipo y analíticas te ayudan a cerrar más ventas.",

      smartBenefit1Title: "Más Ingresos",
      smartBenefit1Text: "Capta más leads y cierra más negocios.",
      smartBenefit2Title: "Ahorra Tiempo",
      smartBenefit2Text: "Automatiza seguimientos y citas.",
      smartBenefit3Title: "Impulsa Tu Equipo",
      smartBenefit3Text: "Todos saben qué hacer y cuándo hacerlo.",
      smartBenefit4Title: "Datos Que Impulsan",
      smartBenefit4Text: "Analíticas en tiempo real para crecer.",
      smartButton: "Convierte Tu Negocio En Una Máquina Automatizada",
      smartBlock1: "Captura instantánea. Cero oportunidades perdidas.",
      smartBlock2: "La IA trabaja 24/7. Tú cierras más ventas.",
      smartBlock3: "Ve todo. Cierra más ventas.",
      smartBottom: "Más oportunidades. Más citas. Más cierres.",

      topLine1: "El ",
      topHighlight: "sistema operativo de ingresos",
      topLine3:
        "simple para empresas cansadas de software CRM complicado y demasiado costoso.",
      pricing: "Precios",

      finalTitle: "Automatize todo o seu fluxo de trabalho",
      finalDesc:
        "A CORTEXA captura leads, automatiza acompanhamentos, atualiza seu pipeline e mantém sua equipe em movimento, para que você possa se concentrar em fechar mais negócios",
      reinforcement: "No se requiere tarjeta de crédito",

      footerDescription:
        "El CRM impulsado por IA que te ayuda a captar clientes potenciales, automatizar seguimientos y cerrar más negocios más rápido.",

      startFreeTrial: "Comenzar",
      startYourFreeTrial: "Comenzar →",

      tagAiPowered: "✨ Impulsado por IA",
      tagSecure: "🛡 Seguro",
      tagAutomation: "⚡ Automatización",
      tagInsights: "📊 Análisis",

      product: "Producto",
      features: "Funciones",
      aiAssistant: "Asistente IA",
      automations: "Automatizaciones",
      integrations: "Integraciones",
      analytics: "Analítica",
      pricing: "Precios",

      getStarted: "Comenzar",
      createAccount: "Crear cuenta",
      login: "Iniciar sesión",
      dashboard: "Panel",
      setupGuide: "Guía de configuración",

      connect: "Conectar",
      connectApps: "Conecta tus aplicaciones",
      importCrm: "Importa tu CRM",
      importCsv: "Importar CSV / Excel",
      zapierAutomation: "Zapier y automatizaciones",
      apiWebhooks: "API y Webhooks",

      support: "Soporte",
      support247: "Soporte 24/7",
      helpCenter: "Centro de ayuda",
      contactUs: "Contáctanos",
      aboutUs: "Sobre nosotros",

      legal: "Legal",
      terms: "Términos y condiciones",
      privacyPolicy: "Política de privacidad",
      refundPolicy: "Política de reembolso",
      cancellationPolicy: "Política de cancelación",

      heroTitlePre: "Creado para ",
      heroTitleActive: "Aumentar Ingresos",
      heroTitlePost: " — No para Administrar Software.",
      heroDescPre:
        "La mayoría de las plataformas combinan herramientas separadas para IA, CRM, marketing, informes, automatización, comunicación y datos — ",
      heroDescActive: "Lo traemos todo en un espacio de trabajo conectado",
      heroDescPost:
        " para que su equipo pueda captar leads, calificar prospectos, automatizar seguimientos, gestionar pipelines, programar citas, realizar un seguimiento del rendimiento y cerrar más tratos.",
      nodeLeadsTitle: "CLIENTES POTENCIALES",
      nodeLeadsSub: "Capturar y Calificar",
      nodeContactsTitle: "CONTACTOS",
      nodeContactsSub: "Organizar y Gestionar",
      nodePropertiesTitle: "PROPIEDADES",
      nodePropertiesSub: "Gestionar Listados",
      nodeWhatsappTitle: "WHATSAPP",
      nodeWhatsappSub: "Automatización",
      nodeDashboardTitle: "PANEL",
      nodeAgentTitle: "AGENTE DE IA",
      nodeAgentSub: "Conversaciones 24/7",
      nodeHybridTitle: "CONEXIONES HÍBRIDAS",
      nodeHybridSub: "Todos los Canales",
      nodePipelineTitle: "PIPELINE",
      nodePipelineSub: "Gestionar Tratos",
      nodeAppointmentsTitle: "CITAS",
      nodeAppointmentsSub: "Reservar y Programar",
      nodeTasksTitle: "TAREAS",
      nodeTasksSub: "Seguimiento",
      nodeDocumentsTitle: "DOCUMENTOS",
      nodeDocumentsSub: "Guardar y Compartir",
      nodeAnalyticsTitle: "ANALÍTICA",
      nodeAnalyticsSub: "Informes y Métricas",
      nodeTeamTitle: "ESPACIO DE EQUIPO",
      nodeTeamSub: "Colaborar y Asignar",
      nodeAutomationsTitle: "AUTOMATIZACIONES",
      nodeAutomationsSub: "Flujos y Disparadores",
      nodeCommunicationTitle: "COMUNICACIÓN",
      nodeCommunicationSub: "Email, SMS, Llamadas",
      nodeIntegrationsTitle: "INTEGRACIONES",
      nodeIntegrationsSub: "Conecta tus Herramientas",
      rightStat1Up: "HASTA",
      rightStat1Main: "3X",
      rightStat1Title: "",
      rightStat1Desc:
        "Todo lo que necesitas para gestionar clientes potenciales, propiedades y clientes en un solo lugar.",
      rightStat2Up: "HASTA",
      rightStat2Main: "20X",
      rightStat2Title: "MENOS COSTOSO DE IMPLEMENTAR",
      vsTitleLeft: "OTRAS PLATAFORMAS TE CUESTAN MÁS",
      vsTitleRight: "NUESTRO ESPACIO TODO EN UNO",
      vsText: "VS.",
      leftCost1: "Altas tarifas de configuración",
      leftCost2: "Complementos y actualizaciones que pagas por separado",
      leftCost3: "Múltiples herramientas desconectadas",
      leftCost4: "Onboarding complejo que frena a tu equipo",
      leftCost5: "Costos ocultos que se acumulan con el tiempo",
      rightBenefit1: "Tarifa de configuración simple",
      rightBenefit2: "Todo incluido. Sin complementos.",
      rightBenefit3: "Un espacio de trabajo conectado",
      rightBenefit4: "Implementación más rápida",
      rightBenefit5: "Precios transparentes. Sin sorpresas.",

      badge: "Integraciones Potentes",
      titlePre: "Funciona con las ",
      titleActive: "herramientas que ya usas",
      subtitlePre: "Lleva tus leads, mensajes, calendarios, tareas, archivos y flujos de trabajo ",
      subtitlePost: "a Cortexa y deja que la IA se encargue del trabajo pesado.",
      feature1: "Sincroniza en minutos",
      feature2: "Automatiza flujos de trabajo",
      feature3: "Ahorra tiempo cada día",
      feature4: "Mantén a tu equipo alineado",
      footerTextPre: "Conecta tus apps, importa tus datos y automatiza tu flujo de trabajo dentro de Cortexa.",
      footerTextPost: "Gestiona todo desde un solo lugar en Apps e Integraciones.",
      btnText: "Ver Integraciones",

      workspacelang1: "Equipo",
      workspacelang2: "Ingresos",
      workspacelang3: "Espacio de trabajo",
    },

    pt: {
      top: "Conheça seu CRM com IA. Maximize a produtividade com assistentes inteligentes.",
      nav: [
        "Recursos",
        "Assistente de IA",
        "AI Automação",
        "Pipeline",
        "Análises",
        "Testemunhos",
      ],
      trial: "Começar",
      login: "Entrar",

      stripTitlebk: "Seu CRM não deve te atrasar.",
      stripSubbk: "Junte-se a equipes usando CORTEXA...",
      featuresTitle: "Transforme dados em decisões",
      cards: [
        {
          eyebrow: "Assistente de IA",
          title: "Respostas instantâneas no painel",
          desc: "Insights e recomendações em segundos sobre leads e performance.",
        },
        {
          eyebrow: "Análises",
          title: "Performance em tempo real",
          desc: "Monitore conversões, respostas e atividades do negócio.",
        },
        {
          eyebrow: "Acompanhamento com IA",
          title: "Automação de follow-ups",
          desc: "Nunca perca leads. Respostas automáticas em todos canais.",
        },
        {
          eyebrow: "Agendador de compromissos com IA",
          title: "Feche mais rápido com IA",
          desc: "IA qualifica leads e agenda reuniões automaticamente.",
        },
      ],

      trustSectionTitlePre: "Tudo o que você precisa. ",
      trustSectionTitlePost: "Feito para Aumentar a Receita.",
      trustSectionSub:
        "Uma plataforma conectada. Todos os recursos trabalham juntos para ajudar você a captar mais leads, fechar mais negócios e ",
      trustSectionSub1: "aumentar a conversão de leads em até 3 vezes ",
      trustSectionSub2: "— enquanto ",
      trustSectionSub3: "mantém mais capital dentro da sua empresa.",
      trustFeatures: {
        dashboard: {
          title: "Painel",
          items: [
            "Visão geral em tempo real",
            "Acompanhar leads e negócios",
            "Métricas essenciais num relance",
            "Monitorar o desempenho da equipe",
          ],
        },
        whatsapp: {
          title: "WhatsApp",
          items: [
            "Totalmente integrado",
            "Conectar via código QR",
            "Respostas por IA 24/7",
            "Transmissão e modelos",
          ],
        },
        leads: {
          title: "Leads",
          items: [
            "Capturar de qualquer fonte",
            "Atribuição automática, tag e pontuação",
            "Qualificar e nutrir leads",
            "Nunca perca um lead",
          ],
        },
        pipeline: {
          title: "Funil de Vendas",
          items: [
            "Funil visual de negócios",
            "Arrastar, soltar e mover negócios",
            "Acompanhamentos automatizados",
            "Foco no que fecha negócio",
          ],
        },
        properties: {
          title: "Propriedades",
          items: [
            "Adicionar e gerenciar propriedades",
            "Compartilhar via WhatsApp ou link",
            "Rastrear visualizações e consultas",
            "Organizar por status, tipo, preço",
          ],
        },
        cortexa: {
          title: "CORTEXA AI",
          items: [
            "Agente de IA funciona 24/7",
            "Conversa, agenda e faz acompanhamento",
            "Qualifica leads instantaneamente",
            "Funciona em vários canais",
          ],
        },
        analytics: {
          title: "Análise",
          items: [
            "Relatórios poderosos",
            "Rastrear origens e receita",
            "Medir desempenho",
            "Tomar decisões baseadas em dados",
          ],
        },
        contacts: {
          title: "Contatos",
          items: [
            "Armazenar todos os contatos",
            "Ver conversas e notas",
            "Segmentar e filtrar facilmente",
            "Manter banco de dados limpo",
          ],
        },
        workspace: {
          title: "Espaço da Equipe",
          badge: "NOVO",
          items: [
            "Quadros de tarefas estilo Kanban",
            "Atribuir leads e tarefas",
            "Acompanhar desempenho individual",
            "Feed de atividades em tempo real",
          ],
        },
        apps: {
          title: "Apps e Integrações",
          items: [
            "Conecte suas ferramentas favoritas",
            "Sincronizar e automatizar",
            "Economize tempo e trabalhe de forma inteligente",
            "Tudo funciona em conjunto",
          ],
        },
      },

      trustFooterBold: "UMA PLATAFORMA. RESULTADOS REAIS. ",
      trustFooterText:
        "Tudo o que você precisa em um único sistema para captar mais leads, fechar mais negócios e ",

      faqTitle: "Perguntas frequentes",
      faq: [
        {
          q: "O que exatamente o CORTEXA faz?",
          a: "O CORTEXA automatiza o acompanhamento de leads, conversas, atualizações do pipeline e agendamento de compromissos, tudo em um único sistema.",
        },
        {
          q: "Como funciona o Assistente de IA?",
          a: "A IA responde instantaneamente aos leads, faz a qualificação, agenda compromissos e mantém a conversa fluindo automaticamente.",
        },
        {
          q: "Posso gerenciar todos os meus leads em um só lugar?",
          a: "Sim. Todos os seus leads, mensagens e etapas do pipeline ficam centralizados em um único painel para que nada se perca.",
        },
        {
          q: "Ele atualiza meu pipeline automaticamente?",
          a: "Sim. À medida que os leads interagem, o sistema os move pelo seu pipeline sem necessidade de intervenção manual.",
        },
        {
          q: "Ainda preciso fazer follow-up manualmente?",
          a: "Não. O CORTEXA foi projetado para gerenciar o follow-up automaticamente e manter os leads engajados.",
        },
        {
          q: "Minha equipe pode usar em conjunto?",
          a: "Sim. Você pode adicionar membros da equipe, atribuir leads e gerenciar negociações de forma colaborativa.",
        },
        {
          q: "Para que tipo de negócio isso serve?",
          a: "O CORTEXA é ideal para corretores imobiliários, equipes e qualquer negócio que dependa de geração de leads e fechamento de vendas.",
        },
        {
          q: "O que acontece depois que um lead chega?",
          a: "O sistema responde instantaneamente, qualifica o lead e o conduz automaticamente para o agendamento ou fechamento.",
        },
      ],

      finalTitle:
        "Automatize seus processos com agentes de IA impulsionados pelo CORTEXA OS",
      finalDesc:
        "Capture leads, faça acompanhamentos instantaneamente e avance cada oportunidade automaticamente dentro de um sistema operacional inteligente.",
      footer: {
        desc: "O CRM com IA que ajuda equipes a fechar mais negócios rapidamente.",
        btn: "Começar →",
        product: "Produto",
        solutions: "Soluções",
        resources: "Recursos",
        company: "Empresa",
        newsletter: "Fique atualizado",
        newsletterDesc: "Receba atualizações, dicas e novidades do produto.",
        privacy: "Respeitamos sua privacidade. Cancele a qualquer momento.",
        status: "Todos os sistemas operacionais",
      },
      strip: {
        title: "Seu CRM não deve te atrasar.",
        sub: "Junte-se a equipes usando CORTEXA...",
        btn: "Começar",
      },
      aiTitle:
        "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle:
        "Responde instantaneamente, qualifica os compradores e agenda compromissos automaticamente.",
      aipointTitle1: "Respostas instantâneas",
      aipointText1: "Cada mensagem é respondida em segundos.",
      aipointTitle2: "Qualificação inteligente",
      aipointText2: "Filtra automaticamente os compradores sérios.",
      aipointTitle3: "Agendamento automático",
      aipointText3: "Compromissos agendados sem idas e vindas.",
      aialt: "IA que gerencia conversas e agenda compromissos automaticamente",
      reinforcement:
        "Gerencie todo o seu pipeline com IA — sem contratar mais pessoas e sem perder oportunidades.",
      beTitle: "O que isso realmente faz por você",
      besubTitle:
        "A automação faz o trabalho. A comunicação nunca para. Cada lead continua avançando — sem que você precise correr atrás.",
      beitem1: "O trabalho avança automaticamente",
      beitem2: "As conversas nunca esfriam",
      beitem3: "Saiba exatamente o que fazer a seguir",
      beitem4: "Mais negócios. Menos trabalho de acompanhamento.",

      beitemtext1:
        "Acompanhamentos, rastreamento e organização funcionam em segundo plano.",
      beitemtext2:
        "Os leads permanecem ativos com lembretes, respostas e reengajamento.",
      beitemtext3:
        "Veja quem precisa de atenção e qual deve ser o seu próximo passo.",
      beitemtext4:
        "Menos trabalho manual. Mais agilidade. Melhores resultados.",
      bebottom: "Tudo continua avançando — mesmo quando você não está.",
      stripLabel: "Pronto para crescer?",
      stripTitle:
        "Comece a fechar mais negócios — com IA trabalhando para você 24/7.",
      stripSub:
        "Sem contratar mais pessoas. Sem perder leads. Apenas uma forma mais inteligente de gerenciar seu pipeline.",
      stripBtn: "Começar →",
      stripBenefit1: "Comece em minutos",
      stripBenefit3: "Cancele a qualquer momento",
      stripCardTitle: "Visão geral do pipeline",
      stripCardPeriod: "Este mês",
      stripRevenueGrowth: "▲ 28% em relação ao mês passado",
      stripLeads: "Leads",
      stripDeals: "Negócios",
      stripRevenue: "Receita",
      stripAI:
        "Resumo da IA: Você está no caminho para superar sua meta mensal em 24%",

      roiTitle:
        "Reduza os custos da folha de pagamento. Escale com seu agente de IA.",
      roiSub:
        "A IA responde instantaneamente, faz acompanhamentos automáticos e mantém seu pipeline em movimento 24 horas por dia, 7 dias por semana.",
      roiBtn: "Começar",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc:
        "O CORTEXA transforma a gestão de leads em um motor de receita — automatizando follow-ups e o fluxo de vendas para gerar mais fechamentos.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Aumento de receita",
      roiStat2Desc:
        "Mais conversas. Respostas mais rápidas. Zero leads perdidos — transformando seu pipeline em receita previsível.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Horas economizadas",
      roiStat3Desc:
        "A IA substitui tarefas manuais, follow-ups e trabalho administrativo — liberando seu tempo enquanto o negócio continua avançando.",
      roiStat4Number: "< 30 dias",
      roiStat4Label: "Retorno",
      roiStat4Desc:
        "A maioria dos usuários recupera o investimento no primeiro mês com negócios que antes seriam perdidos.",

      aiosBadgeTitle: "Conheça Seu",
      aiosBadgeHighlight: "AI OS",
      aiosSubtitle:
        "Sistema de IA desenvolvido para equipes imobiliárias — captura mais leads, faz acompanhamento automático, gerencia negociações e ajuda sua equipe a fechar mais negócios, tudo em um só lugar.",

      aiosCards: [
        {
          title: "CRM IA",
          desc: "Gerencie leads, clientes, imóveis e negócios em um só lugar.",
        },
        {
          title: "Agente IA",
          desc: "Responde, qualifica e acompanha automaticamente.",
        },
        {
          title: "Dashboards Inteligentes",
          desc: "Veja leads, pipeline, tarefas e desempenho claramente.",
        },
        {
          title: "Follow-Up Automático",
          desc: "Mantenha cada prospect avançando sem esforço manual.",
        },
        {
          title: "Fluxo Imobiliário",
          desc: "Criado para imóveis, compradores, vendedores e agentes.",
        },
      ],
      aiosCRMHeaders: ["Nome", "Status", "Última Atividade"],
      aiosCRMRows: [
        ["John Doe", "Novo", "2 min"],
        ["Sarah Smith", "Contatado", "15 min"],
        ["Mike Johnson", "Qualificado", "1 h"],
        ["Emma Brown", "Proposta", "2 h"],
        ["David Wilson", "Fechado", "1 dia"],
      ],
      aiosAgentGreeting: "Olá! Sou seu Agente IA. Como posso ajudar hoje?",
      aiosAgentReply: "Estou procurando uma casa com 3 quartos.",
      aiosDashboardStats: {
        leads: "Leads",
        pipeline: "Pipeline",
        deals: "Negócios",
      },
      aiosFollowups: [
        ["Novo Lead", "1 min"],
        ["Follow-Up IA", "1 hora"],
        ["Mensagem Nutrição", "1 dia"],
        ["Converter Cliente", "3 dias"],
      ],
      aiosProperty: {
        tag: "Novo Imóvel",
        address: "123 Ocean View Dr.",
        beds: "3",
        baths: "2",
        garage: "2",
      },

      howTitle: "Como Funciona",
      howSteps: [
        {
          title: "Conecte Seus Leads",
          desc: "Receba leads do seu site, anúncios, WhatsApp, formulários e campanhas.",
        },
        {
          title: "A IA Responde 24/7",
          desc: "A IA da CORTEXA responde, qualifica e acompanha automaticamente.",
        },
        {
          title: "Feche Mais Negócios",
          desc: "Sua equipe trabalha as melhores oportunidades com menos esforço manual.",
        },
      ],

      heroTitleLine1: "Receba leads instantaneamente.",
      heroTitleLine2: "Feche mais negócios.",
      heroTitleLine3: "Gerencie seu negócio imobiliário",
      heroTitleLine4: "com IA.",
      heroSubtitle:
        "Capture, acompanhe e feche — tudo em um único sistema. Conecte todos os seus aplicativos para que seus imóveis, leads e dados fluam automaticamente em um só lugar.",
      herotextabove:
        "Plataforma de IA tudo-em-um que ajuda você a captar mais leads, fazer o acompanhamento instantaneamente, fechar mais negócios e aumentar a receita no piloto automático.",
      heroCheck5: "Seu agente de IA encontra e qualifica leads automaticamente",
      heroCheck6:
        "Tu agente de IA encuentra, capta y califica clientes potenciales automáticamente.",
      heroCheck7:
        "Alcance multicanal por meio de chamadas, mensagens de texto, WhatsApp e muito mais",
      heroCheck8:
        "Os acompanhamentos automatizados e o agendamento de compromissos funcionam 24 horas por dia, 7 dias por semana.",
      heroCheck9:
        "Inteligência de pipeline, previsão de receita e um painel de controle unificado.",
      heroCheck10: "Gerencia conversas, qualifica e nutre cada lead",
      heroCheck11: "Agenda compromissos diretamente no seu calendário",
      heroCheck12:
        "Veja todos os leads, negócios e oportunidades em um único painel",
      heroCTA: "Começar",
      heroUnlock: "Desbloqueie seu potencial hoje!",
      underCTA: "Taxa única de configuração: $97",
      heroTag1: "Uma plataforma de IA. Tudo conectado.",
      heroTag2: "Acompanhamentos automáticos com IA 24/7",
      heroTag3: "Nutrição inteligente que converte",
      heroTag4: "Inteligência de pipeline que fecha negócios",
      heroTag5: "Integração nativa com WhatsApp",
      heroTag6: "Segura. Confiável. Feita para o mercado imobiliário.",
      heroHead: "Agentes e equipes imobiliárias",

      smartBadge: "DO LEAD À RECEITA — AUTOMATICAMENTE",

      smartTitle1: "Capture.",
      smartTitle2: "Nutra.",
      smartTitle3: "Feche.",
      smartTitle4: "Repita.",

      smartSubtitle:
        "A CORTEXA conecta anúncios, site, WhatsApp, IA, CRM e análises em um único sistema inteligente que transforma leads em vendas.",

      captureTitle: "CAPTAR",
      captureDesc:
        "Os leads chegam de todos os lugares. A CORTEXA captura instantaneamente.",

      convertTitle: "CONVERTER",
      convertDesc:
        "A IA qualifica, nutre e agenda compromissos automaticamente 24/7.",

      closeTitle: "FECHAR",
      closeDesc:
        "Pipeline, equipe e análises ajudam você a fechar mais negócios.",

      smartBenefit1Title: "Mais Receita",
      smartBenefit1Text: "Capture mais leads e feche mais negócios.",
      smartBenefit2Title: "Economize Tempo",
      smartBenefit2Text: "Automatize follow-ups e agendamentos.",
      smartBenefit3Title: "Fortaleça Sua Equipe",
      smartBenefit3Text: "Todos sabem o que fazer e quando fazer.",
      smartBenefit4Title: "Dados Que Impulsionam",
      smartBenefit4Text: "Análises em tempo real para crescer.",
      smartButton: "Transforme Seu Negócio Em Uma Máquina Automatizada",
      smartBlock1: "Captura instantânea. Nenhum lead perdido.",
      smartBlock2: "A IA trabalha 24/7. Você fecha mais negócios.",
      smartBlock3: "Veja tudo. Feche mais negócios.",
      smartBottom: "Mais leads. Mais agendamentos. Mais fechamentos.",

      topLine1: "O ",
      topHighlight: "sistema operacional de receita",
      topLine3:
        "simples para empresas cansadas de softwares de CRM complicados e caros.",
      pricing: "Preços",

      finalTitle: "Comece a crescer com IA hoje",
      finalDesc:
        "Capture mais leads, automatize acompanhamentos e feche mais negócios com automação impulsionada por IA.",
      reinforcement: "Não é necessário cartão de crédito",

      footerDescription:
        "O CRM com IA que ajuda você a capturar leads, automatizar acompanhamentos e fechar mais negócios mais rápido.",

      startFreeTrial: "Começar",
      startYourFreeTrial: "Começar →",

      tagAiPowered: "✨ Com tecnologia de IA",
      tagSecure: "🛡 Seguro",
      tagAutomation: "⚡ Automação",
      tagInsights: "📊 Insights",

      product: "Produto",
      features: "Recursos",
      aiAssistant: "Assistente de IA",
      automations: "Automações",
      integrations: "Integrações",
      analytics: "Análises",
      pricing: "Preços",

      getStarted: "Começar",
      createAccount: "Criar conta",
      login: "Entrar",
      dashboard: "Painel",
      setupGuide: "Guia de configuração",

      connect: "Conectar",
      connectApps: "Conecte seus aplicativos",
      importCrm: "Importe seu CRM",
      importCsv: "Importar CSV / Excel",
      zapierAutomation: "Zapier e Automações",
      apiWebhooks: "API e Webhooks",

      support: "Suporte",
      support247: "Suporte 24/7",
      helpCenter: "Central de ajuda",
      contactUs: "Fale conosco",
      aboutUs: "Sobre nós",

      legal: "Jurídico",
      terms: "Termos e Condições",
      privacyPolicy: "Política de Privacidade",
      refundPolicy: "Política de Reembolso",
      cancellationPolicy: "Política de Cancelamento",

      heroTitlePre: "Feito para ",
      heroTitleActive: "Aumentar a Receita",
      heroTitlePost: " — Não para Gerenciar Software.",
      heroDescPre:
        "A maioria das plataformas reúne ferramentas separadas para IA, CRM, marketing, relatórios, automação, comunicação e dados — ",
      heroDescActive: "Nós trazemos tudo para um espaço de trabalho conectado",
      heroDescPost:
        " para que sua equipe possa capturar leads, qualificar prospects, automatizar acompanhamentos, gerenciar pipelines, agendar compromissos, acompanhar o desempenho e fechar mais negócios.",
      nodeLeadsTitle: "LEADS",
      nodeLeadsSub: "Capturar e Qualificar",
      nodeContactsTitle: "CONTATOS",
      nodeContactsSub: "Organizar e Gerenciar",
      nodePropertiesTitle: "PROPRIEDADES",
      nodePropertiesSub: "Gerenciar Anúncios",
      nodeWhatsappTitle: "WHATSAPP",
      nodeWhatsappSub: "Automação",
      nodeDashboardTitle: "PAINEL",
      nodeAgentTitle: "AGENTE DE IA",
      nodeAgentSub: "Conversas 24/7",
      nodeHybridTitle: "CONEXÕES HÍBRIDAS",
      nodeHybridSub: "Todos os Canais",
      nodePipelineTitle: "PIPELINE",
      nodePipelineSub: "Gerenciar Negócios",
      nodeAppointmentsTitle: "COMPROMISSOS",
      nodeAppointmentsSub: "Reservar e Agendar",
      nodeTasksTitle: "TAREFAS",
      nodeTasksSub: "Acompanhamento",
      nodeDocumentsTitle: "DOCUMENTOS",
      nodeDocumentsSub: "Armazenar e Compartilhar",
      nodeAnalyticsTitle: "ANÁLISE",
      nodeAnalyticsSub: "Relatórios e Insights",
      nodeTeamTitle: "ESPAÇO DA EQUIPE",
      nodeTeamSub: "Colaborar e Atribuir",
      nodeAutomationsTitle: "AUTOMAÇÕES",
      nodeAutomationsSub: "Fluxos e Gatilhos",
      nodeCommunicationTitle: "COMUNICAÇÃO",
      nodeCommunicationSub: "E-mail, SMS, Chamadas",
      nodeIntegrationsTitle: "INTEGRAÇÕES",
      nodeIntegrationsSub: "Conecte Suas Ferramentas",
      rightStat1Up: "ATÉ",
      rightStat1Main: "3X",
      rightStat1Title: "",
      rightStat1Desc:
        "Tudo o que você precisa para gerenciar leads, imóveis e clientes em um só lugar.",
      rightStat2Up: "ATÉ",
      rightStat2Main: "20X",
      rightStat2Title: "MAIS BARATO PARA IMPLEMENTAR",
      vsTitleLeft: "OUTRAS PLATAFORMAS CUSTAM MAIS",
      vsTitleRight: "NOSSO ESPAÇO TUDO-EM-UM",
      vsText: "VS.",
      leftCost1: "Altas taxas de configuração",
      leftCost2: "Adicionais e atualizações pagos separadamente",
      leftCost3: "Múltiplas ferramentas desconectadas",
      leftCost4: "Integração complexa que desacelera sua equipe",
      leftCost5: "Custos ocultos que se acumulam com o tempo",
      rightBenefit1: "Taxa de configuração simples",
      rightBenefit2: "Tudo incluído. Sem adicionais.",
      rightBenefit3: "Um espaço de trabalho conectado",
      rightBenefit4: "Implementação mais rápida",
      rightBenefit5: "Preços transparentes. Sem surpresas.",

      badge: "Integrações Poderosas",
      titlePre: "Funciona com as ",
      titleActive: "ferramentas que você já usa",
      subtitlePre: "Traga seus leads, mensagens, calendários, tarefas, arquivos e fluxos de trabalho ",
      subtitlePost: "para o Cortexa e deixe a IA cuidar do trabalho pesado.",
      feature1: "Sincronize em minutos",
      feature2: "Automatize fluxos de trabalho",
      feature3: "Economize tempo todos os dias",
      feature4: "Mantenha sua equipe alinhada",
      footerTextPre: "Conecte seus apps, importe seus dados e automatize seu fluxo de trabalho dentro do Cortexa.",
      footerTextPost: "Gerencie tudo em um só lugar em Apps e Integrações.",
      btnText: "Ver Integrações",

      workspacelang1: "Equipe",
      workspacelang2: "Receita",
      workspacelang3: "Espaço de trabalho",
    },
  };

  const tr = t[lang];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const currentHero =
    lang === "es" ? heroImgES : lang === "pt" ? heroImgPT : heroImg;

  const currentSec2 =
    lang === "es" ? sec2ImgES : lang === "pt" ? sec2ImgPT : sec2Img;

  const currentSec3 =
    lang === "es" ? sec3ImgES : lang === "pt" ? sec3ImgPT : sec3Img;

  const currentSec4 =
    lang === "es" ? sec4ImgES : lang === "pt" ? sec4ImgPT : sec4Img;

  const currentSec5 =
    lang === "es" ? sec5ImgES : lang === "pt" ? sec5ImgPT : sec5Img;

  const currentaiSetterImg =
    lang === "es" ? aiSetterImgES : lang === "pt" ? aiSetterImgPT : aiSetterImg;
  workspaceImg  
  const workspace =
    lang === "es" ? workspaceImgES : lang === "pt" ? workspaceImgPT : workspaceImg;
  const currenttestimonialsImg =
    lang === "es"
      ? testimonialsImgES
      : lang === "pt"
        ? testimonialsImgPT
        : testimonialsImg;
  const flows = [
    {
      label: tr.smartFlow1Label,
      title: tr.smartFlow1Title,
      text: tr.smartFlow1Desc,
    },
    {
      label: tr.smartFlow2Label,
      title: tr.smartFlow2Title,
      text: tr.smartFlow2Desc,
    },
    {
      label: tr.smartFlow3Label,
      title: tr.smartFlow3Title,
      text: tr.smartFlow3Desc,
    },
  ];
  const avatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80",
  ];
  const featureKeys = [
    { key: "dashboard", Icon: LayoutDashboard },
    { key: "whatsapp", Icon: MessageSquare },
    { key: "leads", Icon: UserCheck },
    { key: "pipeline", Icon: Hourglass },
    { key: "properties", Icon: Home },
    { key: "cortexa", Icon: Sparkles },
    { key: "analytics", Icon: BarChart3 },
    { key: "contacts", Icon: Contact2 },
    { key: "workspace", Icon: Users2 },
    { key: "apps", Icon: Puzzle },
  ];

  return (
    <div id="cortexa-ai-crm-landing">
      <div className="hero-text">
        <h2 className="hero-title">
          {tr.topLine1}
          <span className="highlight">{tr.topHighlight}</span> {tr.topLine3}
        </h2>
      </div>
      <header className="cx-header">
        <div className="cx-header-inner">
          <div className="cx-left">
            <a href="/">
              <img src={headlogoImg} className="cx-logo-img" />
            </a>
          </div>

          <nav className="cx-nav">
            {tr.nav.map((n, i) => {
              const ids = [
                "features",
                "ai-assistant",
                "automation",
                "pipeline",
                "analytics",
                "testimonials",
              ];

              return (
                <HashLink
                  className="nav-menu"
                  key={i}
                  smooth
                  to={`/#${ids[i]}`}
                >
                  {n}
                </HashLink>
              );
            })}
            <a className="nav-menu" href="/pricing">
              {tr.pricing}
            </a>
          </nav>

          <div className="cx-actions">
            <a href="/trial" className="cx-btn cx-btn-primary- small">
              {tr.trial}
            </a>

            <div className="lang-wrapper">
              <div
                className="lang-toggle"
                onClick={() => setLangOpen(!langOpen)}
              >
                <span data-lang={lang}>
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
                  </svg>
                </span>
              </div>
              {langOpen && (
                <div className="lang-dropdown">
                  <div
                    className="lang-item"
                    onClick={() => handleLangChange("en")}
                  >
                    English
                  </div>
                  <div
                    className="lang-item"
                    onClick={() => handleLangChange("es")}
                  >
                    Español
                  </div>
                  <div
                    className="lang-item"
                    onClick={() => handleLangChange("pt")}
                  >
                    Português
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated() ? (
              <Link to="/dashboard/home" className="cx-login">
                Dashboard
              </Link>
            ) : (
              <Link to="/sign-in" className="cx-login">
                {tr.login}
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="hero mt-30-">
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-left-in">
              <div className="hero-dead-wrap">
                <span className="hero-head1 hero-head">AI POWERED</span>
                <br />
                <span className="hero-head">{tr.heroHead}</span>
              </div>
              <h1 className="hero-title">
                {tr.heroTitleLine1} <br /> {tr.heroTitleLine2}
                <br />
                <span> 24/7 </span>
                {tr.heroTitleLine4}
              </h1>
              <div className="hero-checks">
                <p>{tr.herotextabove}</p>
              </div>
              <div className="hero-inline">
                <a href="/trial" className="hero-btn">
                  <Zap size={21} />
                  {tr.heroCTA}
                </a>
                <p className="next-btn">
                  <LockKeyhole size={16} /> {tr.heroUnlock}
                </p>
              </div>
              <p className="underCTA">{tr.underCTA}</p>
              <div className="hero-checks">
                {[
                  tr.heroCheck6,
                  tr.heroCheck7,
                  tr.heroCheck8,
                  tr.heroCheck9,
                ].map((item, index) => (
                  <div className="check-item" key={index}>
                    <span className="check">
                      <CheckCircle size={18} />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-image">
              <img src={herorightImg} />
              <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
            </div>
          </div>
        </div>
        <div className="hero-tags">
          <div className="tags-item">
            <UserPlus className="icon blue" />
            <span>{tr.heroTag1}</span>
          </div>
          <div className="tags-item">
            <RefreshCcw className="icon purple" />
            <span>{tr.heroTag2}</span>
          </div>
          <div className="tags-item">
            <DollarSign className="icon green" />
            <span>{tr.heroTag3}</span>
          </div>
          <div className="tags-item">
            <ChartColumn className="icon green" />
            <span>{tr.heroTag4}</span>
          </div>
          <div className="tags-item">
            <MessageCircleCheck className="icon green" />
            <span>{tr.heroTag5}</span>
          </div>
          <div className="tags-item">
            <ShieldX className="icon green" />
            <span>{tr.heroTag6}</span>
          </div>
        </div>
      </section>

      {/* SECTION ONE CONNECTED WORKSPACE */}
      <section
        id="features"
        className="cx-aios-workspace cx-comp cx-center pt-50"
      >
        <div className="cx-feat-header">
          <h2 className="cx-feat-main-title">
            {tr.heroTitlePre}
            <span className="cx-feat-blue-text">{tr.heroTitleActive}</span>
            {tr.heroTitlePost}
          </h2>
          <p className="cx-feat-sub-title">
            {tr.heroDescPre}
            <span className="cx-feat-blue-dark-text">{tr.heroDescActive}</span>
            {tr.heroDescPost}
          </p>
        </div>

        <div className="cx-feat-main-grid">
          <div className="cx-feat-diagram-area">
            <img src={featurechartImg} alt="diagram" />
          </div>

          <div className="cx-feat-stats-sidebar">
            <div className="cx-sidebar-stat-block-top">
              <span className="cx-stat-up-tag">{tr.rightStat1Up}</span>
              <img src={x3xImg} alt="iamge" />
              <h4 className="cx-stat-title-label"></h4>
              <div className="cx-stat-blue-bar"></div>
              <p className="cx-stat-description-text">{tr.rightStat1Desc}</p>
            </div>
          </div>
        </div>
        <div className="cx-feat-wrap">
          <div className="cx-feat-comparison-table">
            <div className="cx-comp-col-left">
              <div className="cx-comp-title-row">
                <XCircle className="cx-comp-header-icon icon-red" size={24} />
                <h5>{tr.vsTitleLeft}</h5>
              </div>
              <ul className="cx-comp-list">
                <li>
                  <div className="cx-list-item-content">
                    <XCircle className="cx-li-icon icon-red-small" size={18} />
                    <span>{tr.leftCost1}</span>
                  </div>
                  <strong className="cx-cost-high">$2,500 - $7,500+</strong>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <XCircle className="cx-li-icon icon-red-small" size={18} />
                    <span>{tr.leftCost2}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <XCircle className="cx-li-icon icon-red-small" size={18} />
                    <span>{tr.leftCost3}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <XCircle className="cx-li-icon icon-red-small" size={18} />
                    <span>{tr.leftCost4}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <XCircle className="cx-li-icon icon-red-small" size={18} />
                    <span>{tr.leftCost5}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="cx-comp-vs-circle-wrapper">
              <div className="cx-comp-vertical-line"></div>
              <div className="cx-comp-vs-circle">
                <span>{tr.vsText}</span>
              </div>
            </div>

            <div className="cx-comp-col-right">
              <div className="cx-comp-title-row">
                <CheckCircle2
                  className="cx-comp-header-icon icon-blue"
                  size={24}
                />
                <h5>{tr.vsTitleRight}</h5>
              </div>
              <ul className="cx-comp-list">
                <li>
                  <div className="cx-list-item-content">
                    <CheckCircle2
                      className="cx-li-icon icon-blue-small"
                      size={18}
                    />
                    <span>{tr.rightBenefit1}</span>
                  </div>
                  <strong className="cx-cost-low">$97</strong>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <CheckCircle2
                      className="cx-li-icon icon-blue-small"
                      size={18}
                    />
                    <span>{tr.rightBenefit2}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <CheckCircle2
                      className="cx-li-icon icon-blue-small"
                      size={18}
                    />
                    <span>{tr.rightBenefit3}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <CheckCircle2
                      className="cx-li-icon icon-blue-small"
                      size={18}
                    />
                    <span>{tr.rightBenefit4}</span>
                  </div>
                </li>
                <li>
                  <div className="cx-list-item-content">
                    <CheckCircle2
                      className="cx-li-icon icon-blue-small"
                      size={18}
                    />
                    <span>{tr.rightBenefit5}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="cx-feat-stats-sidebar">
            <div className="cx-sidebar-stat-block-bottom">
              <span className="cx-stat-up-tag">{tr.rightStat2Up}</span>
              <div className="cx-stat-inline-row">
                <TrendingUp className="cx-stat-inline-icon" size={92} />
                <h3 className="cx-stat-giant-num">{tr.rightStat2Main}</h3>
              </div>
              <h4 className="cx-stat-title-label">{tr.rightStat2Title}</h4>
              <div className="cx-stat-blue-bar-short"></div>
            </div>
          </div>
        </div>
      </section>
      <section id="analytics" className="cx-hero pt-50">
        <img src={currentSec2} alt="" />
        <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
      </section>
      <section id="workspace">
        <div className="aios-container">
        <img src={workspace} alt="workspace" />         
        </div>
      </section>              
      <section id="whatsapp" className="cx-hero pt-50">
        <img src={currentSec3} alt="" />
      </section>

      <section className="aios-section ai-crm-section pt-20">
        <div className="aios-container">
          <div className="aios-header">
            <h2>
              {tr.aiosBadgeTitle} <span>{tr.aiosBadgeHighlight}</span>
            </h2>

            <p>{tr.aiosSubtitle}</p>
          </div>
          <div className="aios-grid">
            <div className="aios-card">
              <div className="aios-icon">
                <User size={34} />
              </div>
              <h3>{tr.aiosCards[0].title}</h3>
              <span />
              <p>{tr.aiosCards[0].desc}</p>

              <div className="aios-preview crm-preview">
                <div className="crm-header">
                  <User size={14} />
                  <span>{tr.aiosCRMHeaders[0]}</span>
                  <span>{tr.aiosCRMHeaders[1]}</span>
                  <span>{tr.aiosCRMHeaders[2]}</span>
                </div>

                {tr.aiosCRMRows.map((row, i) => (
                  <div className="crm-row" key={i}>
                    <User size={14} />
                    <span>{row[0]}</span>
                    <label>{row[1]}</label>
                    <small>{row[2]}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="aios-card">
              <div className="aios-icon">
                <Bot size={34} />
              </div>
              <h3>{tr.aiosCards[1].title}</h3>
              <span />
              <p>{tr.aiosCards[1].desc}</p>

              <div className="aios-preview chat-preview">
                <div className="bubble left">{tr.aiosAgentGreeting}</div>
                <div className="bubble left">{tr.aiosAgentReply}</div>
                <div className="bubble left nonedot">
                  <div className="crm-dot" />
                  <div className="crm-dot" />
                  <div className="crm-dot" />
                </div>
              </div>
            </div>
            <div className="aios-card">
              <div className="aios-icon">
                <BarChart3 size={34} />
              </div>
              <h3>{tr.aiosCards[2].title}</h3>
              <span />
              <p>{tr.aiosCards[2].desc}</p>

              <div className="aios-preview dashboard-preview">
                <div className="dashboard-stats">
                  <div className="dashboard-stat">
                    <span>{tr.aiosDashboardStats.leads}</span>
                    <strong>2,450</strong>
                    <small>+18%</small>
                  </div>
                  <div className="dashboard-stat">
                    <span>{tr.aiosDashboardStats.pipeline}</span>
                    <strong>$1.25M</strong>
                    <small>+24%</small>
                  </div>
                  <div className="dashboard-stat">
                    <span>{tr.aiosDashboardStats.deals}</span>
                    <strong>156</strong>
                    <small>+15%</small>
                  </div>
                </div>

                <div className="dashboard-bottom">
                  <div className="dashboard-line-chart">
                    <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient
                          id="dashboardGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7a5cff"
                            stopOpacity="0.35"
                          />
                          <stop
                            offset="100%"
                            stopColor="#7a5cff"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <path
                        d="
          M0 70
          L20 58
          L40 62
          L60 45
          L80 50
          L100 28
          L120 34
          L140 18
          L160 24
          L180 4
          L200 0
          L200 80
          L0 80
          Z"
                        fill="url(#dashboardGradient)"
                      />

                      <polyline
                        points="
          0,70
          20,58
          40,62
          60,45
          80,50
          100,28
          120,34
          140,18
          160,24
          180,4
          200,0"
                        fill="none"
                        stroke="#7a5cff"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>

                  <div className="dashboard-ring">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="48" className="ring-bg" />

                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        className="ring-progress"
                      />
                    </svg>

                    <span>{tr.aiosDashboardScore}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="aios-card">
              <div className="aios-icon">
                <Send size={34} />
              </div>
              <h3>{tr.aiosCards[3].title}</h3>
              <span />
              <p>{tr.aiosCards[3].desc}</p>

              <div className="aios-preview follow-preview">
                {tr.aiosFollowups.map((item, i) => (
                  <div className="follow-row" key={i}>
                    <span>
                      <CheckCircle size={12} /> {item[0]}
                    </span>
                    <label>{item[1]}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="aios-card">
              <div className="aios-icon">
                <Home size={34} />
              </div>
              <h3>{tr.aiosCards[4].title}</h3>
              <span />
              <p>{tr.aiosCards[4].desc}</p>
              <div className="aios-preview house-preview">
                <div className="property-image">
                  <div className="listing-tag">{tr.aiosProperty.tag}</div>
                </div>
                <div className="property-info">
                  <h5>{tr.aiosProperty.address}</h5>
                  <div className="info-wrap">
                    <strong>$1,250,000</strong>
                    <div className="property-meta">
                      <span>🛏 {tr.aiosProperty.beds}</span>
                      <span>🛁 {tr.aiosProperty.baths}</span>
                      <span>🚗 {tr.aiosProperty.garage}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="how-section">
        <div className="how-container">
          <h2 className="how-title">{tr.howTitle}</h2>
          <div className="unline"></div>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-number">1</div>
              <div className="how-icon">
                <Workflow size={44} />
              </div>
              <div className="how-content">
                <h3>{tr.howSteps[0].title}</h3>
                <p>{tr.howSteps[0].desc}</p>
              </div>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-card">
              <div className="how-number">2</div>
              <div className="how-icon">
                <Bot size={44} />
              </div>
              <div className="how-content">
                <h3>{tr.howSteps[1].title}</h3>
                <p>{tr.howSteps[1].desc}</p>
              </div>
            </div>
            <div className="how-arrow">→</div>
            <div className="how-card">
              <div className="how-number">3</div>
              <div className="how-icon">
                <TrendingUp size={44} />
              </div>
              <div className="how-content">
                <h3>{tr.howSteps[2].title}</h3>
                <p>{tr.howSteps[2].desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="powerful">
        <div className="cx-pwr-container">
          
          <div className="cx-pwr-badge-box">
            <div className="cx-pwr-badge">
              <Link2 size={14} />
              <span>{tr.badge}</span>
            </div>
          </div>

          <h2 className="cx-pwr-title">
            {tr.titlePre}<span>{tr.titleActive}</span>
          </h2>

          <p className="cx-pwr-subtitle">
            {tr.subtitlePre}<strong>{tr.subtitlePost}</strong>
          </p>

          <div className="cx-pwr-features-line">
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick"><Check size={14} className="cx-pwr-check" /></div>
              <span>{tr.feature1}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick"><Check size={14} className="cx-pwr-check" /></div>
              <span>{tr.feature2}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick"><Check size={14} className="cx-pwr-check" /></div>
              <span>{tr.feature3}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick"><Check size={14} className="cx-pwr-check" /></div>
              <span>{tr.feature4}</span>
            </div>
          </div>
          <img src={powerfulImg} alt="diagram" />       
          
          <div className="cx-pwr-footer-banner">
            <div className="cx-pwr-footer-left">
              <div className="cx-pwr-grid-icon-box">
                <Grid size={20} />
              </div>
              <p className="cx-pwr-footer-text">
                <strong>{tr.footerTextPre}</strong><br />
                <span>{tr.footerTextPost}</span>
              </p>
            </div>
            <button className="cx-pwr-footer-btn">
              <span>{tr.btnText}</span>
              <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </section>
  
      <section className="smart">
        <div className="smart-container">
          <div className="smart-head">
            <span className="smart-badge">{tr.smartBadge}</span>

            <h2>
              {tr.smartTitle1} {tr.smartTitle2} {tr.smartTitle3}{" "}
              <span>{tr.smartTitle4}</span>
            </h2>

            <p>{tr.smartSubtitle}</p>
          </div>

          <div className="smart-steps">
            <div className="smart-step">
              <div className="step-number">1</div>
              <div className="step-right-wrap">
                <h3>{tr.captureTitle}</h3>
                <p>{tr.captureDesc}</p>
              </div>
            </div>
            <div class="flow-arrow-container">
              <div class="arrow-line"></div>
              <div class="arrow-head"></div>
            </div>
            <div className="smart-step">
              <div className="step-number">2</div>
              <div className="step-right-wrap">
                <h3>{tr.convertTitle}</h3>
                <p>{tr.convertDesc}</p>
              </div>
            </div>
            <div class="flow-arrow-container">
              <div class="arrow-line"></div>
              <div class="arrow-head"></div>
            </div>
            <div className="smart-step">
              <div className="step-number">3</div>
              <div className="step-right-wrap">
                <h3>{tr.closeTitle}</h3>
                <p>{tr.closeDesc}</p>
              </div>
            </div>
          </div>

          <div className="smart-main-grid">
            <div className="capture-card">
              <img src={smart1Img} className="smart-img" />
            </div>

            <div className="convert-card">
              <img src={smart2Img} className="smart-img" />
            </div>

            <div className="close-card">
              <img src={smart3Img} className="smart-img" />
            </div>
          </div>
          <div className="smart-block">
            <div className="smart-block-card-wrap">
              <div className="smart-block-card">
                <Zap />
                <p>{tr.smartBlock1}</p>
              </div>
            </div>
            <div className="smart-block-card-wrap">
              <div className="smart-block-card">
                <Brain />
                <p>{tr.smartBlock2}</p>
              </div>
            </div>
            <div className="smart-block-card-wrap">
              <div className="smart-block-card">
                <Target />
                <p>{tr.smartBlock2}</p>
              </div>
            </div>
          </div>
          <div className="smart-benefits">
            <div>
              <RotateCcw size={20} />
              <div>
                <h4>{tr.smartBenefit1Title}</h4>
                <p>{tr.smartBenefit1Text}</p>
              </div>
            </div>

            <div>
              <Clock4 />
              <div>
                <h4>{tr.smartBenefit2Title}</h4>
                <p>{tr.smartBenefit2Text}</p>
              </div>
            </div>

            <div>
              <Users />
              <div>
                <h4>{tr.smartBenefit3Title}</h4>
                <p>{tr.smartBenefit3Text}</p>
              </div>
            </div>

            <div>
              <ChartNoAxesCombined />
              <div>
                <h4>{tr.smartBenefit4Title}</h4>
                <p>{tr.smartBenefit4Text}</p>
              </div>
            </div>
          </div>

          <div className="smart-cta">
            <a href="/trial">{tr.smartButton} →</a>
          </div>
          <p className="smart-bottom">{tr.smartBottom}</p>
        </div>
      </section>

      <section id="pipeline" className="cx-hero pt-50">
        <img src={currentSec4} alt="" />
        <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
      </section>

      <section className="roi-section pt-50">
        <div className="roi-container">
          <h2 className="roi-title">{tr.roiTitle}</h2>
          <p className="roi-sub">{tr.roiSub}</p>
          <div className="roi-cta">
            <a href="/trial" className="roi-btn">
              {tr.heroCTA}
            </a>
          </div>
          <p className="underCTA">{tr.underCTA}</p>
          <div className="roi-grid">
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat1Number}</p>
              <p className="roi-label">{tr.roiStat1Label}</p>
              <p className="roi-desc">{tr.roiStat1Desc}</p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat2Number}</p>
              <p className="roi-label">{tr.roiStat2Label}</p>
              <p className="roi-desc">{tr.roiStat2Desc}</p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat3Number}</p>
              <p className="roi-label">{tr.roiStat3Label}</p>
              <p className="roi-desc">{tr.roiStat3Desc}</p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat4Number}</p>
              <p className="roi-label">{tr.roiStat4Label}</p>
              <p className="roi-desc">{tr.roiStat4Desc}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="cx-strip pt-50 cta-section">
        <div className="cta-container">
          <div className="cta-box">
            <div className="cta-left">
              <p className="cta-label">{tr.stripLabel}</p>
              <h2 className="cta-title">{tr.stripTitle}</h2>
              <p className="cta-sub">{tr.stripSub}</p>
              <div className="cta-actions">
                <a href="/trial" className="cta-btn">
                  {tr.stripBtn}
                </a>
              </div>
              <p className="underCTA">{tr.underCTA}</p>
              <div className="cta-benefits">
                <div>
                  ⚡ <span>{tr.stripBenefit1}</span>
                </div>
                <div>
                  🔒 <span>{tr.stripBenefit3}</span>
                </div>
              </div>
            </div>
            <div className="cta-right">
              <div className="cta-card">
                <div className="cta-card-head">
                  <p>{tr.stripCardTitle}</p>
                  <span>{tr.stripCardPeriod}</span>
                </div>
                <div className="cta-revenue">
                  <p className="cta-money">$2,742,500</p>
                  <p className="cta-growth">{tr.stripRevenueGrowth}</p>
                </div>
                <div className="cta-graph"></div>
                <div className="cta-stats">
                  <div>
                    <p>{tr.stripLeads}</p>
                    <strong>1,293</strong>
                  </div>
                  <div>
                    <p>{tr.stripDeals}</p>
                    <strong>87</strong>
                  </div>
                  <div>
                    <p>{tr.stripRevenue}</p>
                    <strong>$893K</strong>
                  </div>
                </div>
                <div className="cta-ai">⚡ {tr.stripAI}</div>
              </div>
            </div>
            <div className="cta-glow"></div>
          </div>
        </div>
      </section>
      {/* FEATURES */}
      <section id="automation" className="cx-section pt-50">
        <div className="land-container">
          <div className="cx-center cx-grid-intro">
            <h2 className="cx-title-lg">{tr.featuresTitle}</h2>
          </div>
          <div className="cx-grid4">
            {[feaImg1, feaImg2, feaImg3, feaImg4].map((img, i) => (
              <div className="cx-card" key={i}>
                <div>
                  <span className={`cx-eyebrow cx-title-${i + 1}`}>
                    {tr.cards[i].eyebrow}
                  </span>
                  <h3>{tr.cards[i].title}</h3>
                  <p>{tr.cards[i].desc}</p>
                </div>
                <div className="cx-shot">
                  <img src={img} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="ai-assistant" className="cx-hero pt-50">
        <img src={currentaiSetterImg} alt="" />
      </section>
      {/* TRUST */}
      <section className="cx-trust cx-center pt-50">
        <div className="trust-container">
          <div className="cx-trust-header">
            <h2 className="cx-trust-title">
              {tr.trustSectionTitlePre}
              <span className="cx-trust-title-blue">
                {tr.trustSectionTitlePost}
              </span>
            </h2>
            <p className="cx-trust-subtitle">
              {tr.trustSectionSub}
              <span className="cx-trust-title-blue">{tr.trustSectionSub1}</span>
              {tr.trustSectionSub2}
              <span className="cx-trust-title-blue">{tr.trustSectionSub3}</span>
            </p>
          </div>

          <div className="cx-trust-grid">
            {featureKeys.map((f) => {
              const featureData = tr.trustFeatures[f.key];
              const IconComponent = f.Icon;
              return (
                <div key={f.key} className="cx-trust-card">
                  <div className="cx-trust-card-header">
                    <span className="cx-trust-card-icon">
                      <IconComponent size={20} strokeWidth={2.2} />
                    </span>
                    <h3 className="cx-trust-card-name">
                      {featureData.title}
                      {featureData.badge && (
                        <span className="cx-trust-card-badge">
                          {featureData.badge}
                        </span>
                      )}
                    </h3>
                  </div>
                  <ul className="cx-trust-card-list">
                    {featureData.items.map((item, index) => (
                      <li key={index} className="cx-trust-card-item">
                        <span className="cx-trust-check">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="cx-trust-footer">
            <div className="cx-trust-footer-icon">
              <Zap size={16} fill="currentColor" />
            </div>
            <p className="cx-trust-footer-text">
              <span className="cx-trust-footer-bold">{tr.trustFooterBold}</span>
              {tr.trustFooterText}
              <span className="cx-trust-title-blue">{tr.trustSectionSub1}</span>
              {tr.trustSectionSub2}
              <span className="cx-trust-title-blue">{tr.trustSectionSub3}</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="cx-faq cx-center pt-50">
        <h2 className="cx-title-lg">{tr.faqTitle}</h2>

        <div className="cx-faq-list">
          {tr.faq.map((item, index) => (
            <div
              className={`cx-faq-item ${activeFAQ === index ? "active" : ""}`}
              key={index}
            >
              <button className="cx-faq-q" onClick={() => setActiveFAQ(index)}>
                {item.q}
              </button>

              {activeFAQ === index && <div className="cx-faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>
      <section id="testimonials" className="cx-hero pt-50">
        <div className="img-container">
          <img src={currenttestimonialsImg} alt="" />
          <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
        </div>
      </section>
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
        <div className="cx-final-box">
          <img src={logotranImg} className="cx-logo-img" />
          <h2 className="cx-title-lg" style={{ color: "#fff" }}>
            {tr.finalTitle}
          </h2>

          <p className="cx-sub">{tr.finalDesc}</p>

          <a href="/trial" className="cx-btn cx-btn-secondary">
            <Zap size={22} />
            {tr.trial}
          </a>
          <p className="underCTA">{tr.underCTA}</p>
          <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
          <div className="cx-final-shot">
            <img src={trialmobileImg} className="desktop-none" />
          </div>
        </div>
      </section>

      <section>
        <footer className="footer-final">
          <div className="container">
            <div className="footer-location">
              <CountriesCitiesSection />
            </div>

            <div className="footer-grid footer-landing">
              <div className="footer-brand">
                <img src={footlogo} alt="Cortexa" className="landing-logo" />

                <p>{tr.footerDescription}</p>

                <a href="/trial" className="btn-primary">
                  {tr.startYourFreeTrial}
                </a>
                <p className="underCTA">{tr.underCTA}</p>
                <div className="footer-tags">
                  <span>{tr.tagAiPowered}</span>
                  <span>{tr.tagSecure}</span>
                  <span>{tr.tagAutomation}</span>
                  <span>{tr.tagInsights}</span>
                </div>
              </div>

              <div className="footer-col">
                <h3>{tr.product}</h3>
                <ul>
                  <li>
                    <HashLink smooth to="/features">
                      {tr.features}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/features#ai-assistant">
                      {tr.aiAssistant}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/features#automations">
                      {tr.automations}
                    </HashLink>
                  </li>
                  <li>
                    <a href="/integrations">{tr.integrations}</a>
                  </li>
                  <li>
                    <HashLink smooth to="/features#analytics">
                      {tr.analytics}
                    </HashLink>
                  </li>
                  <li>
                    <a href="/pricing">{tr.pricing}</a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.getStarted}</h3>
                <ul>
                  <li>
                    <a href="/trial">{tr.getStarted}</a>
                  </li>
                  <li>
                    <a href="/sign-in">{tr.login}</a>
                  </li>
                  <li>
                    <a href="/setup-guide">{tr.setupGuide}</a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.connect}</h3>
                <ul>
                  <li>
                    <HashLink smooth to="/integrations#connect-apps">
                      {tr.connectApps}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/integrations#import-crm">
                      {tr.importCrm}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/integrations#import-csv">
                      {tr.importCsv}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/integrations#zapier-automations">
                      {tr.zapierAutomation}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to="/integrations#api-webhooks">
                      {tr.apiWebhooks}
                    </HashLink>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.support}</h3>
                <ul>
                  <li>
                    <a href="/support">{tr.support247}</a>
                  </li>
                  <li>
                    <a href="/help">{tr.helpCenter}</a>
                  </li>
                  <li>
                    <a href="/contact">{tr.contactUs}</a>
                  </li>
                  <li>
                    <a href="/about">{tr.aboutUs}</a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.legal}</h3>
                <ul>
                  <li>
                    <a href="/terms">{tr.terms}</a>
                  </li>
                  <li>
                    <a href="/privacy-policy">{tr.privacyPolicy}</a>
                  </li>
                  <li>
                    <a href="/refund-policy">{tr.refundPolicy}</a>
                  </li>
                  <li>
                    <a href="/cancellation">{tr.cancellationPolicy}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

