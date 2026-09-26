import { useState, useEffect } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { trackEvent } from "../../utils/track";
import {
  UserPlus,
  RefreshCcw,
  DollarSign,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Zap,
  MessageCircleCheck,
  ShieldX,
  ChartColumn,
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
  FileText,
  PieChart,
  ShieldCheck,
  User,
  Bot,
  Send,
  Home,
  Workflow,
  MessageSquare,
  Sparkles,
  Users2,
  Puzzle,
  CheckCircle2,
  Link2,
  Check,
  Grid,
  ChevronRight,
  CreditCard,
  Infinity,
  CalendarDays,
  Stethoscope,
  ShoppingCart,
  Headphones,
  HeartPulse,
  ClipboardList,
  BellRing,
  Building2,
  Landmark,
  Magnet,
  Globe2,
  ChevronDown,
  Phone,
  BookOpen,
  Play,
  LifeBuoy,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import "./LandingDesktop.css";

import footdarklogo from "../../assets/cortexa/footlogo.png";
import CountriesCitiesSection from "./CountriesCitiesSection";
import herorightImg from "../../assets/cortexa/cortexa-agentic-crm-dashboard.webp";
import trialmobileImg from "../../assets/cortexa/cortexa-dashboard-preview-wide.webp";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import heroImgES from "../../assets/cortexa/hero-es.png";
import heroImgPT from "../../assets/cortexa/hero-pt.png";

import sec2Img from "../../assets/cortexa/cortexa-reporting-analytics-pipeline-en.webp";
import sec2ImgES from "../../assets/cortexa/cortexa-reporting-analytics-pipeline-es.webp";
import sec2ImgPT from "../../assets/cortexa/cortexa-reporting-analytics-pipeline-pt.webp";

import sec3Img from "../../assets/cortexa/cortexa-ai-insights-workflows-en.webp";
import sec3ImgES from "../../assets/cortexa/cortexa-ai-insights-workflows-es.webp";
import sec3ImgPT from "../../assets/cortexa/cortexa-ai-insights-workflows-pt.webp";

import sec4Img from "../../assets/cortexa/cortexa-deals-pipeline-en.webp";
import sec4ImgES from "../../assets/cortexa/cortexa-deals-pipeline-es.webp";
import sec4ImgPT from "../../assets/cortexa/cortexa-deals-pipeline-pt.webp";

import sec5Img from "../../assets/cortexa/Cortexa sec 5.png";
import sec5ImgES from "../../assets/cortexa/sec5ES.png";
import sec5ImgPT from "../../assets/cortexa/sec5PT.png";

import customerJourneyEN from "../../assets/cortexa/cortexa-customer-journey-en.webp";
import customerJourneyES from "../../assets/cortexa/cortexa-customer-journey-es.webp";
import customerJourneyPT from "../../assets/cortexa/cortexa-customer-journey-pt.webp";

import aiSetterImg from "../../assets/cortexa/aiSetter.png";
import aiSetterImgES from "../../assets/cortexa/aiSetterES.png";
import aiSetterImgPT from "../../assets/cortexa/aiSetterPT.png";
import customerClinicManagerImg from "../../assets/cortexa/customer-clinic-manager.jpg";
import customerSalesDirectorImg from "../../assets/cortexa/customer-sales-director.jpg";
import customerBusinessOwnerImg from "../../assets/cortexa/customer-business-owner.jpg";

import powerfulImg from "../../assets/cortexa/cortexa-app-integrations.webp";
import workspaceImg from "../../assets/cortexa/workspace.png";
import workspaceImgES from "../../assets/cortexa/workspaceES.png";
import workspaceImgPT from "../../assets/cortexa/workspacePT.png";

import sect2 from "../../assets/cortexa/sect2.png";
import sect2ES from "../../assets/cortexa/sect2es.png";
import sect2PT from "../../assets/cortexa/sect2pt.png";

// Locale-aware links. /es, /pt and /es-ec visitors keep their language when they
// follow a link to one of the public pages that exist under every locale prefix.
// Anything else (web-solutions, e-commerce, dashboard, country/city pages) exists
// only unprefixed and is returned unchanged. Query strings and hashes are kept.
const LOCALE_PREFIXES = ["es-ec", "es", "pt"];
const LOCALIZED_ROUTES = new Set([
  "/", "/sign-in", "/sign-up", "/forgot-password", "/privacy-policy",
  "/refund-policy", "/terms", "/cancellation", "/contact", "/help", "/about",
  "/support", "/features", "/integrations", "/setup-guide", "/pricing",
  "/editorial/the-end-of-legacy-crm", "/editorial/business", "/trial", "/checkout",
]);
function localePrefixFromPath(pathname) {
  const first = String(pathname || "/").split("/").filter(Boolean)[0];
  return first && LOCALE_PREFIXES.includes(first) ? `/${first}` : "";
}
function withLocalePrefix(prefix, path) {
  if (!prefix) return path;
  const m = String(path).match(/^([^?#]*)(.*)$/);
  const base = m[1] || "/";
  if (!LOCALIZED_ROUTES.has(base)) return path;
  return `${prefix}${base === "/" ? "" : base}${m[2]}`;
}

// Intrinsic pixel sizes of the localized section images (width/height attributes
// reserve their space before they load; CSS still controls the display size).
const SEC3_SIZE = { en: [1918, 820], es: [1768, 889], pt: [1753, 897] };
const SEC4_SIZE = { en: [1823, 863], es: [1411, 736], pt: [1411, 736] };

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

const CUSTOMER_EXPERIENCES_COPY = {
  en: {
    eyebrow: "CUSTOMER EXPERIENCES",
    titleLead: "Put Cortexa to Work",
    titleAccent: "Across Your Business.",
    subtitle:
      "Choose the right workspace, configure your AI agent, connect your customer entry points, and give your team one intelligent system for managing what happens next.",
    sampleLabel: "SAMPLE TESTIMONIAL",
    testimonials: [
      {
        quote:
          "Cortexa brought our customer inquiries, appointments, and follow-up into one clear process. Our team can see what needs attention without moving between disconnected systems.",
        role: "Clinic Operations Manager",
        workspace: "Clinic & Medical Workspace",
      },
      {
        quote:
          "The AI agent gives customers an immediate response and captures the information our team needs before a person steps in. That has made every conversation more organized.",
        role: "Sales Director",
        workspace: "Sales Workspace",
      },
      {
        quote:
          "We finally have a workspace that reflects how our business actually operates. The guided setup made it clear what to connect and how every customer should move forward.",
        role: "Business Owner",
        workspace: "Business Suite",
      },
    ],
    ready: "Ready to build a more connected way to operate?",
    cta: "Get Started",
    explore: "Explore Cortexa Workspaces",
    note: "Replace sample testimonial copy with verified customer statements before publishing.",
  },
  es: {
    eyebrow: "EXPERIENCIAS DE CLIENTES",
    titleLead: "Pon Cortexa a Trabajar",
    titleAccent: "En Todo Tu Negocio.",
    subtitle:
      "Elige el workspace adecuado, configura tu agente de IA, conecta los puntos de entrada de tus clientes y brinda a tu equipo un sistema inteligente para gestionar lo que sucede después.",
    sampleLabel: "TESTIMONIO DE EJEMPLO",
    testimonials: [
      {
        quote:
          "Cortexa reunió nuestras consultas de clientes, citas y seguimientos en un proceso claro. Nuestro equipo puede ver qué necesita atención sin cambiar entre sistemas desconectados.",
        role: "Gerente de Operaciones de Clínica",
        workspace: "Workspace de Clínica y Medicina",
      },
      {
        quote:
          "El agente de IA ofrece a los clientes una respuesta inmediata y recopila la información que nuestro equipo necesita antes de que intervenga una persona. Esto ha hecho que cada conversación sea más organizada.",
        role: "Director de Ventas",
        workspace: "Workspace de Ventas",
      },
      {
        quote:
          "Por fin tenemos un workspace que refleja cómo funciona realmente nuestro negocio. La configuración guiada dejó claro qué conectar y cómo debe avanzar cada cliente.",
        role: "Propietario de Negocio",
        workspace: "Business Suite",
      },
    ],
    ready: "¿Listo para crear una forma de operar más conectada?",
    cta: "Comenzar",
    explore: "Explorar Workspaces de Cortexa",
    note: "Reemplaza los testimonios de ejemplo con declaraciones verificadas de clientes antes de publicar.",
  },
  pt: {
    eyebrow: "EXPERIÊNCIAS DE CLIENTES",
    titleLead: "Coloque a Cortexa para Trabalhar",
    titleAccent: "Em Todo o Seu Negócio.",
    subtitle:
      "Escolha o workspace certo, configure seu agente de IA, conecte os pontos de entrada dos clientes e dê à sua equipe um sistema inteligente para gerenciar o que acontece a seguir.",
    sampleLabel: "DEPOIMENTO DE EXEMPLO",
    testimonials: [
      {
        quote:
          "A Cortexa reuniu nossas consultas de clientes, agendamentos e acompanhamentos em um processo claro. Nossa equipe consegue ver o que precisa de atenção sem alternar entre sistemas desconectados.",
        role: "Gerente de Operações da Clínica",
        workspace: "Workspace Clínica e Médica",
      },
      {
        quote:
          "O agente de IA oferece aos clientes uma resposta imediata e captura as informações de que nossa equipe precisa antes que uma pessoa intervenha. Isso tornou cada conversa mais organizada.",
        role: "Diretor de Vendas",
        workspace: "Workspace de Vendas",
      },
      {
        quote:
          "Finalmente temos um workspace que reflete como nosso negócio realmente funciona. A configuração guiada deixou claro o que conectar e como cada cliente deve avançar.",
        role: "Proprietário de Negócio",
        workspace: "Business Suite",
      },
    ],
    ready: "Pronto para criar uma forma mais conectada de operar?",
    cta: "Começar",
    explore: "Explorar Workspaces da Cortexa",
    note: "Substitua os depoimentos de exemplo por declarações verificadas de clientes antes de publicar.",
  },
};

export default function Landing() {
  const { pathname } = useLocation();
  const isEcuadorFlow = pathname === "/es-ec" || pathname.startsWith("/es-ec/");
  const [lang, setLang] = useState(() => {
    if (isEcuadorFlow) return "es";
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(0);
  const { isAuthenticated } = useAuth();
  const localePrefix = localePrefixFromPath(pathname);
  const lp = (path) => withLocalePrefix(localePrefix, path);
  const navigate = useNavigate();
  const trackCta = (ctaId, ctaText) => () =>
    trackEvent("primary_cta_click", {
      cta_id: ctaId,
      cta_text: ctaText,
      page_path: pathname,
      language: lang,
    });

  useEffect(() => {
    if (isEcuadorFlow) sessionStorage.setItem("cortexa_market", "EC");
  }, [isEcuadorFlow]);

  const switchLocale = useLocaleSwitch();
  const handleLangChange = (newLang) => {
    setLang(newLang);
    setLangOpen(false);
    switchLocale(newLang);
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
        "AI Workflows",
        "Pipeline",
        "Analytics",
        "Testimonials",
      ],

      trial: "Get Started",
      login: "Log in",

      stripTitlebk: "Your CRM shouldn’t slow you down.",
      stripSubbk: "Join teams using CORTEXA...",


      faqEyebrow: "FREQUENTLY ASKED QUESTIONS",
      faqTitleLead: "Frequently",
      faqTitleAccent: "Asked Questions",
      faqSubtitle: "Straight answers about the AI agent, workspaces, setup, connections, your team, and getting started.",
      faq: [
        { q: "What is Cortexa, and what does its AI agent do?", a: "Cortexa is an intelligent CRM and business operating system. Its AI agent can respond to customer inquiries, capture contact information, qualify interest, schedule appointments, support follow-up, and move each conversation into the correct CRM and pipeline process based on the rules you configure." },
        { q: "Which Cortexa workspace should I use for my business?", a: "Choose the workspace that most closely matches how your business operates. Each workspace includes the appropriate terminology, customer records, workflows, pipelines, and operating tools for that type of business. One workspace is included with your account. Additional workspaces may be added separately if your business requires them." },
        { q: "How does the guided setup work after I choose a workspace?", a: "After selecting your workspace, Cortexa guides you through the essential setup inside your account. You will enter your business information, services or products, hours, team responsibilities, customer entry points, qualification rules, conversion goals, appointment settings, follow-up requirements, and human-handoff instructions. You can save your progress and return to complete the setup at any time." },
        { q: "Can Cortexa connect with my website, business phone, WhatsApp, forms, and marketing pages?", a: "Yes. Cortexa can connect supported customer entry points to your AI agent and CRM workflow. This can include your website, business phone, WhatsApp, forms, landing pages, and advertising-traffic pages. The objective is to capture the contact, record the source, create the correct CRM record, select the appropriate pipeline, and move the customer toward a conversion or human handoff." },
        { q: "What are Cortexa Web Solutions, and when would I need them?", a: "Cortexa Web Solutions are optional professional services for businesses that need help updating, improving, building, or connecting their website to Cortexa. Our team can review your current website, recommend the necessary changes, and help connect customer entry points to your AI agent, CRM, campaign tracking, pipeline, appointments, checkout, quotes, demos, support, and human handoff. Web Solutions and custom implementation are quoted separately according to your requirements." },
        { q: "Can my team manage assignments, follow-ups, notes, and customer handoffs together?", a: "Yes. The Team Workspace gives authorized team members a shared place to manage assignments, priorities, internal notes, customer follow-ups, deadlines, and department handoffs. Everyone works from the same current customer information while permissions determine what each person can access or change." },
        { q: "Does the AI agent replace my staff or transfer conversations when a person is needed?", a: "The AI agent handles the customer interactions and routine work you authorize it to manage. It can answer common questions, capture information, qualify interest, schedule appointments, and support follow-up. When a conversation requires judgment, approval, specialized assistance, or personal attention, Cortexa can transfer it to the appropriate team member according to your configured rules." },
        { q: "Can I connect the applications and tools my business already uses?", a: "Cortexa supports a growing directory of applications and connection methods, including direct integrations, APIs, webhooks, Zapier, and other supported automation tools. Available functionality depends on the application and your Cortexa plan. Visit Apps & Integrations inside your account to review the available connections." },
        { q: "How do the activation fee and 14-day trial work?", a: "A non-refundable activation fee is required to activate your account and begin the 14-day trial. The applicable activation fee, trial period, first recurring billing date, and monthly subscription price are displayed before you complete checkout. If you cancel before the first recurring billing date, the monthly subscription will not be charged. The activation fee remains non-refundable." },
        { q: "What happens if I need help configuring or connecting everything?", a: "The guided setup is available inside your account, and you may submit an assistance request whenever you need help. Our team can review your configuration, identify missing information, and respond through your account. Custom configuration, website work, and technical implementation are optional paid services and will be quoted separately before any paid work begins." },
      ],
      faqCtaTitle: "Still have a question about your business?",
      faqCta: "Contact Cortexa",
      faqCtaNote: "Our team can help you understand the platform before you get started.",
      finalTitle:
        "Automate your workflow with AI agents — powered by Cortexa Agentic CRM",
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

      revenueActionEyebrow: "TURN DATA INTO GROWTH",
      revenueActionTitleLead: "Turn Your Revenue Data",
      revenueActionTitleAccent: "Into Action.",
      revenueActionSub:
        "Bring your pipeline, customers, tasks, appointments and performance data together so your team can see what matters and act faster.",
      revenueActionBenefits: [
        {
          title: "CLEAR PRIORITIES",
          desc: "Know which opportunities need attention.",
        },
        {
          title: "CONNECTED DATA",
          desc: "Keep customer and pipeline information organized.",
        },
        {
          title: "SMARTER WORKFLOWS",
          desc: "Streamline internal processes and reduce repetitive work.",
        },
        {
          title: "REVENUE VISIBILITY",
          desc: "Understand performance from one connected dashboard.",
        },
      ],
      revenueOverviewEyebrow: "ONE DASHBOARD. COMPLETE VISIBILITY.",
      revenueOverviewTitle: "Your Revenue Overview",
      revenueOverviewSub:
        "Real-time insights across your pipeline, team, and performance — all in one place.",
      revenueOverviewCta: "Start Your 14-Day Trial",
      revenueOverviewNoCard: "No credit card required",
      revenueOverviewCancel: "Cancel anytime",

      aiosV2Eyebrow: "ALL-IN-ONE AGENTIC CRM",
      aiosV2TitleLead: "Connect. Organize.",
      aiosV2TitleAccent: "Grow Revenue.",
      aiosV2Subtitle:
        "Everything you need to manage your pipeline, customers, and operations in one powerful, easy-to-use platform.",
      aiosV2Cards: [
        {
          title: "CRM",
          desc: "Manage leads, contacts, accounts, and relationships in one central place.",
        },
        {
          title: "PIPELINE",
          desc: "Visualize your sales pipeline and move deals forward with confidence.",
        },
        {
          title: "SMART DASHBOARDS",
          desc: "Get real-time insights on your pipeline, team performance, and revenue.",
        },
        {
          title: "WORKFLOW MANAGEMENT",
          desc: "Automate tasks, approvals, and processes to keep your team productive.",
        },
        {
          title: "INTEGRATIONS",
          desc: "Connect the tools you already use and keep your data in sync.",
        },
      ],
      aiosV2Benefits: [
        {
          title: "One Connected System",
          desc: "All your data and tools working together.",
        },
        {
          title: "Clear Visibility",
          desc: "See what matters and act with confidence.",
        },
        {
          title: "Smarter Workflows",
          desc: "Automate processes and save valuable time.",
        },
        {
          title: "Better Results",
          desc: "Drive growth with better data and decisions.",
        },
      ],
      aiosV2BottomLead: "One platform. Your entire business.",
      aiosV2BottomAccent: "Built to grow revenue.",
      howV2Steps: [
        {
          title: "Connect Your Business",
          desc: "Connect your CRM, data, tools, and team in just a few clicks.",
        },
        {
          title: "Organize Your Operations",
          desc: "Bring your pipeline, contacts, tasks, and workflows together in one place.",
        },
        {
          title: "Turn Data Into Decisions",
          desc: "Get real-time insights, track performance, and make smarter decisions.",
        },
      ],

      heroTitleLine1: "Agentic CRM built to",
      heroTitleLine2: "automate and scale ",
      heroTitleLine3: "your business workflow.",
      heroTitleLine31: "workflow.",
      heroTitleLine4: "Built to Turn",
      heroTitleLine5: "Conversations",
      heroTitleLine6: "Into Revenue.",
      heroSubtitle:
        "Capture, follow up, and close — all in one system. Connect all your apps so your customers, leads, and data flow into one place automatically.",
      herotextabove: "AI organizes. AI qualifies. You follow up. You close.",
      heroCheck6:
        "Your AI Agent finds, captures, and qualifies leads automatically",
      heroCheck7: "Manage customer conversations across connected channels",
      heroCheck8: "AI-Assisted Follow-Up Workflows",
      heroCheck9:
        "Pipeline Intelligence, revenue forecasting, one connected dashboard.",
      heroCheck10: "Handles conversations, qualifies, and nurtures every lead",
      heroCheck11: "Books appointments directly on your calendar",
      heroCheck12: "See every lead, deal & opportunity in one dashboard",
      heroCTA: "Get Started!",
      heroFreeAccess: "Sign Up? — Get Free Access!",
      heroNoCard: "14-Day Trial",
      heroFreeForever: "Starting at $11",
      heroUnlock: "Unlock potential today!",
      heroTag1: "One AI Platform. Everything Connected.",
      heroTag2: "AI-Assisted Follow-Up Workflows",
      heroTag3: "Customer Follow-Up Workflows",
      heroTag4: "Pipeline Intelligence That Closes",
      heroTag5: "WhatsApp Integration Built-in",
      heroTag6: "Secure. Reliable. Built for Your Business.",
      heroHead: "All-in-One Business Operating System",

      smartV2Badge: "FROM LEAD TO REVENUE — ONE CONNECTED SYSTEM",
      smartV2Title1: "See Your Entire Revenue Operation.",
      smartV2Title2: "In",
      smartV2TitleAccent: "One Place.",
      smartV2Subtitle:
        "Connect your leads, customer data, pipeline, tasks, appointments, and analytics so your team always knows what needs attention next.",
      smartV2Steps: [
        {
          title: "CAPTURE",
          desc: "Organize leads and customer data in one place.",
        },
        {
          title: "MANAGE",
          desc: "Track opportunities, tasks, appointments and deal progress.",
        },
        {
          title: "GROW",
          desc: "Use pipeline and performance insights to make better decisions and close more business.",
        },
      ],
      smartV2Benefits: [
        {
          title: "ONE VIEW",
          desc: "All your leads, deals, tasks and appointments in one dashboard.",
        },
        {
          title: "CLEAR PIPELINE",
          desc: "Know exactly where every deal stands and what to focus on.",
        },
        {
          title: "SMARTER WORKFLOWS",
          desc: "Automate internal processes and keep your team aligned.",
        },
        {
          title: "BETTER DECISIONS",
          desc: "Real-time insights help you act faster and close more deals.",
        },
      ],
      smartV2Cta: "Run Your Revenue Operation From One Place",
      smartV2Bottom: "Manage Leads. Appointments. Deals. In One Place.",

      topLine1: "The simple ",
      topHighlight: "Agentic CRM",
      topLine3:
        "for businesses tired of complicated, overpriced CRM software.",
      pricing: "Pricing",
      webSolutions: "Web & Software Development Systems Integration",

      finalTitle: "Connect Your Entire Workflow",
      finalDesc: "Leads. Opportunities. Deals. All in your",
      finalDesc1: "Agentic CRM",

      footerDescription: "AI Leads.   AI Qualifies.  AI CLoses.",

      startFreeTrial: "Get Started",
      startYourFreeTrial: "Start Your 14-Day Trial →",

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
      rightStat1Up: "FOLLOW UP WITH EVERY LEAD AUTOMATICALLY",
      rightStat1Up1: "ONE CONNECTED WORKSPACE BUILT FOR REAL ESTATE PROS",
      rightStat1Main: "",
      rightStat1Title: "",
      rightStat1Desc:
        "Everything you need to manage leads, listings, and clients in one place.",

      badge: "Powerful Integrations",
      titlePre: "Works with ",
      titleActive: "tools you already use",
      subtitlePre:
        "Bring your leads, messages, calendars, tasks, files, and workflows ",
      subtitlePost: "into Cortexa and keep your work connected in one place.",
      feature1: "Sync in minutes",
      feature2: "Manage workflows",
      feature3: "Save time every day",
      feature4: "Keep your team aligned",
      footerTextPre:
        "Connect your apps, import your data, and manage your workflow inside Cortexa.",
      footerTextPost:
        "Manage everything from one place in Apps & Integrations.",
      btnText: "See Integrations",

      workspaceSection: {
        eyebrow: "CORTEXA WORKSPACES",
        titleLead: "Specialized Workspaces.",
        titleAccent: "One Connected Intelligent CRM.",
        subtitle: "Cortexa includes dedicated workspaces for different industries and business operations. Each workspace brings the appropriate tools, terminology, customer journey, and workflows into one connected intelligent CRM.",
        includesTitle: "EVERY WORKSPACE INCLUDES",
        includes: ["AI Conversations", "Leads", "Clients or Patients", "Pipeline", "Calendar", "Automations", "Analytics", "Integrations"],
        findLead: "Find the workspace designed for",
        findAccent: "how your business operates.",
        workspaces: ["Business Suite", "Sales", "Insurance", "Financial Services", "E-Commerce", "Customer Service", "Real Estate", "Team Workspace", "Lead Generator", "Aesthetic & Wellness", "Clinic & Medical"],
        clinicTitle: "Clinic & Medical",
        clinicDescription: "Manage patient inquiries, consultations, appointments, clinical activity, care plans, follow-up, and clinic operations from one connected workspace.",
        clinicFeatures: ["Patients", "Consultations", "Clinical Notes", "Follow-Up"],
        preview: "Preview Workspace",
        connected: "Your workspace connects directly to your CRM, AI agent, customer data, appointments, workflows, and revenue operation.",
        explore: "Explore Cortexa Workspaces",
        note: "One workspace included. Add more as your business grows.",
      },

      guidedSetup: {
        eyebrow: "GUIDED CORTEXA SETUP",
        titleLead: "Get your workspace",
        titleAccent: "configured, connected,",
        titleEnd: "and ready to work.",
        subtitle: "Cortexa guides you through the essential setup steps inside your account, so your AI agent, customer entry points, CRM, pipeline, appointments, and team handoff work together correctly.",
        steps: [
          { title: "Configure Your Business", desc: "Add your business details, services, hours, team, and conversion goals." },
          { title: "Connect Customer Entry Points", desc: "Connect your website, business phone, WhatsApp, forms, and marketing pages." },
          { title: "Train Your AI Agent", desc: "Define how it responds, qualifies, schedules, and transfers conversations." },
          { title: "Test and Launch", desc: "Verify lead capture, source tracking, CRM records, pipeline routing, appointments, and conversions." },
        ],
        panelTitle: "Put Your AI Agent to Work",
        panelSubtitle: "Connect your tools, train your agent, and start turning customer conversations into revenue.",
        progress: "2 of 4 steps complete",
        complete: "50% complete",
        panelSteps: [
          { title: "Connect Your AI Agent Number", desc: "Use an existing business number or activate a new one for customer calls and messages.", status: "Connected", action: "" },
          { title: "Train Your AI Agent", desc: "Teach your agent about your business, services, tone, qualification rules, and when to transfer to a human.", status: "In Progress", action: "Continue Training" },
          { title: "Configure Appointments & Lead Flow", desc: "Set availability, lead routing, follow-up, and pipeline behavior.", status: "Not Configured", action: "Configure" },
          { title: "Test & Launch", desc: "Run a real conversation, confirm the lead flow, and activate your AI agent.", status: "Ready to Test", action: "Test My AI Agent" },
        ],
        assistanceTitle: "Setup & Website Assistance",
        assistanceDesc: "Request help with AI agent setup, website connections, phone, WhatsApp, tracking, or customer entry points.",
        assistanceAction: "Request Assistance",
        helpTitle: "Need help getting connected?",
        helpDesc: "Submit an assistance request directly from Setup. Our team can review your configuration and help connect your AI agent, website, phone, WhatsApp, CRM, appointments, checkout, tracking, and human handoff.",
        helpNote: "Custom setup and website implementation are optional paid services quoted separately based on your requirements.",
        requestSetup: "Request Setup Assistance",
        viewGuide: "View Setup Guide",
      },

      webSolutionsSection: {
        titleLead: "You have the right workspace.",
        titleSecond: "Now let’s make it",
        titleAccent: "work for your business.",
        intro: "A workspace is the part of Cortexa built around the way a specific type of business operates. It brings the customer records, workflows, pipeline, appointments, automation, and AI-agent tools that business needs into one connected place.",
        quote: "Choose the workspace that fits your business. Then make it yours.",
        paragraph1: "Once selected, the guided setup helps you define your services, hours, team responsibilities, customer entry points, qualification rules, conversion goals, appointments, follow-up, and human handoff.",
        paragraph2: "Your website, business phone, forms, advertising traffic, and WhatsApp can connect to the same managed process so the AI agent, CRM, pipeline, checkout, appointments, and team work together from the first conversation to the next appropriate action.",
        paragraph3: "You can complete the setup yourself. If your website needs to be updated, built, or connected to your workspace, our Web Solutions team can review what you have and provide a separate implementation quote.",
        cta: "Explore Web Solutions",
        note: "Optional setup and website implementation services are quoted separately.",
      },

      webShowcaseV3: {
        eyebrow: "CORTEXA WEB SOLUTIONS",
        titleLead: "Connect your website to",
        titleAccent: "your business works.",
        titleMiddle: "the way",
        intro: "Your website should do more than display information. Cortexa Web Solutions can connect it directly to your AI agent, CRM, pipeline, appointments, checkout, tracking, support, and team—so every customer reaches the right next step.",
        benefits: [
          { title: "Lead with your AI agent", desc: "Give customers immediate assistance, capture their information, understand what they need, and guide them toward the correct action." },
          { title: "Build around your conversion goals", desc: "Create clear paths for purchases, appointments, quotes, viewings, demos, support requests, and human handoffs." },
          { title: "Connect every customer entry point", desc: "Bring website forms, advertising traffic, business phone, and WhatsApp into the same managed Cortexa process." },
        ],
        services: "Services", about: "About", resources: "Resources", contact: "Contact",
        startAgent: "Start with Our AI Agent", smarter: "SMARTER SOLUTIONS. BRIGHTER GROWTH.",
        heroTitle: "How can we help your business today?", heroDesc: "Get expert guidance, fast answers, and the right next step — powered by AI and a team that cares.",
        expert: "Expert Guidance", expertDesc: "Real answers. Real progress.", simpler: "Simpler Operations", simplerDesc: "From first contact to lasting customers.", productive: "A More Productive Team", productiveDesc: "Technology that works for you.",
        entryTitle: "MULTIPLE WAYS FOR CUSTOMERS TO REACH YOU", forms: "Website Forms", phone: "Phone", advertising: "Advertising", whatsapp: "WhatsApp",
        agent: "Cortexa AI Agent", welcome: "Welcome. Tell me what you need help with, and I’ll guide you to the right next step.", exploreServices: "Explore Services", appointment: "Book an Appointment", quote: "Request a Quote", support: "Get Support", captured: "Contact captured · Source recorded · CRM updated", message: "Type your message...", connected: "Website + Cortexa AI Agent + CRM",
        bottomLead: "Already have a website?", bottomAccent: "We can improve it, connect it, and make it work with your selected Cortexa workspace.", explore: "Explore Web Solutions", note: "Custom website and implementation services are quoted separately."
      },

      teamShowcase: { eyebrow: "CORTEXA TEAM WORKSPACE", title1: "Keep your team aligned,", title2: "accountable, and working", title3: "from the", accent: "same information.", subtitle: "The Team Workspace gives everyone a clear place to manage assignments, customer follow-ups, internal communication, priorities, and handoffs—without losing context between departments.", benefits: [{title:"Clear ownership",desc:"Assign work, define responsibility, and know who is handling every customer or task."},{title:"Shared customer context",desc:"Keep notes, conversations, activity, status, and next steps visible to the people who need them."},{title:"Stronger execution",desc:"Coordinate follow-ups, approvals, deadlines, and human handoffs from one organized workspace."}], explore:"Explore Team Workspace", seeHow:"See How Teams Work in Cortexa", panelTitle:"Team Workspace", panelSub:"Coordinate priorities, assignments, and customer follow-ups.", search:"Search customers, tasks, or team members...", createTask:"Create Team Task", assigned:"Assigned to Me", due:"Due Today", waiting:"Waiting on Team", priorities:"Team Priorities", activity:"Team Activity", handoffs:"Customer Handoffs", viewAll:"View All", task:"Task", customer:"Customer", owner:"Owner", dueDate:"Due Date", status:"Status", float:"One team. One shared customer record.", bottomLead:"Built for the people behind", bottomAccent:"every customer experience.", roles:["Owners","Managers","Sales","Customer Service","Operations"], bottomNote:"Everyone works from the same current information." },

      workspacelang1: "Team",
      workspacelang2: "Revenue",
      workspacelang3: "Workspace",
    },

    es: {
      top: "Conoce tu CRM con IA. Maximiza la productividad con asistentes inteligentes.",
      nav: [
        "Características",
        "Asistente de IA",
        "Flujos de trabajo IA",
        "Pipeline",
        "Análisis",
        "Testimonios",
      ],
      trial: "Comenzar",
      login: "Iniciar sesión",

      stripTitlebk: "Tu CRM no debería ralentizarte.",
      stripSubbk: "Únete a equipos que usan CORTEXA...",


      faqEyebrow: "PREGUNTAS FRECUENTES",
      faqTitleLead: "Preguntas",
      faqTitleAccent: "Frecuentes",
      faqSubtitle: "Respuestas claras sobre el agente de IA, los espacios de trabajo, la configuración, las conexiones, tu equipo y cómo empezar.",
      faq: [
        { q: "¿Qué es Cortexa y qué hace su agente de IA?", a: "Cortexa es un CRM inteligente y un sistema operativo empresarial. Su agente de IA puede responder consultas de clientes, capturar información de contacto, calificar el interés, programar citas, apoyar el seguimiento y mover cada conversación al proceso correcto de CRM y pipeline según las reglas que configures." },
        { q: "¿Qué espacio de trabajo de Cortexa debo usar para mi negocio?", a: "Elige el espacio de trabajo que más se ajuste a la forma en que opera tu negocio. Cada espacio incluye la terminología, los registros de clientes, los flujos de trabajo, los pipelines y las herramientas operativas apropiadas para ese tipo de negocio. Tu cuenta incluye un espacio de trabajo. Puedes añadir espacios adicionales por separado si tu negocio los necesita." },
        { q: "¿Cómo funciona la configuración guiada después de elegir un espacio de trabajo?", a: "Después de seleccionar tu espacio de trabajo, Cortexa te guía por la configuración esencial dentro de tu cuenta. Introducirás la información de tu negocio, servicios o productos, horarios, responsabilidades del equipo, puntos de entrada de clientes, reglas de calificación, objetivos de conversión, configuración de citas, requisitos de seguimiento e instrucciones de transferencia a una persona. Puedes guardar tu progreso y volver para completar la configuración en cualquier momento." },
        { q: "¿Puede Cortexa conectarse con mi sitio web, teléfono comercial, WhatsApp, formularios y páginas de marketing?", a: "Sí. Cortexa puede conectar los puntos de entrada de clientes compatibles con tu agente de IA y el flujo de trabajo del CRM. Esto puede incluir tu sitio web, teléfono comercial, WhatsApp, formularios, landing pages y páginas de tráfico publicitario. El objetivo es capturar el contacto, registrar la fuente, crear el registro correcto en el CRM, seleccionar el pipeline adecuado y mover al cliente hacia una conversión o transferencia humana." },
        { q: "¿Qué son Cortexa Web Solutions y cuándo las necesitaría?", a: "Cortexa Web Solutions son servicios profesionales opcionales para empresas que necesitan ayuda para actualizar, mejorar, crear o conectar su sitio web con Cortexa. Nuestro equipo puede revisar tu sitio actual, recomendar los cambios necesarios y ayudar a conectar los puntos de entrada de clientes con tu agente de IA, CRM, seguimiento de campañas, pipeline, citas, checkout, cotizaciones, demos, soporte y transferencia humana. Web Solutions y la implementación personalizada se cotizan por separado según tus requisitos." },
        { q: "¿Puede mi equipo gestionar asignaciones, seguimientos, notas y transferencias de clientes en conjunto?", a: "Sí. Team Workspace ofrece a los miembros autorizados un lugar compartido para gestionar asignaciones, prioridades, notas internas, seguimientos de clientes, fechas límite y transferencias entre departamentos. Todos trabajan con la misma información actual del cliente, mientras los permisos determinan lo que cada persona puede consultar o modificar." },
        { q: "¿El agente de IA reemplaza a mi personal o transfiere conversaciones cuando se necesita una persona?", a: "El agente de IA gestiona las interacciones con clientes y el trabajo rutinario que autorices. Puede responder preguntas comunes, capturar información, calificar interés, programar citas y apoyar el seguimiento. Cuando una conversación requiere criterio, aprobación, asistencia especializada o atención personal, Cortexa puede transferirla al miembro adecuado del equipo según las reglas configuradas." },
        { q: "¿Puedo conectar las aplicaciones y herramientas que mi negocio ya utiliza?", a: "Cortexa admite un directorio creciente de aplicaciones y métodos de conexión, incluidas integraciones directas, APIs, webhooks, Zapier y otras herramientas de automatización compatibles. La funcionalidad disponible depende de la aplicación y de tu plan de Cortexa. Visita Apps & Integrations dentro de tu cuenta para revisar las conexiones disponibles." },
        { q: "¿Cómo funcionan la tarifa de activación y la prueba de 14 días?", a: "Se requiere una tarifa de activación no reembolsable para activar tu cuenta y comenzar la prueba de 14 días. La tarifa aplicable, el período de prueba, la primera fecha de facturación recurrente y el precio mensual de la suscripción se muestran antes de completar el checkout. Si cancelas antes de la primera fecha de facturación recurrente, no se cobrará la suscripción mensual. La tarifa de activación sigue siendo no reembolsable." },
        { q: "¿Qué ocurre si necesito ayuda para configurar o conectar todo?", a: "La configuración guiada está disponible dentro de tu cuenta y puedes enviar una solicitud de asistencia cuando necesites ayuda. Nuestro equipo puede revisar tu configuración, identificar información faltante y responder a través de tu cuenta. La configuración personalizada, el trabajo web y la implementación técnica son servicios opcionales de pago y se cotizarán por separado antes de comenzar cualquier trabajo de pago." },
      ],
      faqCtaTitle: "¿Aún tienes una pregunta sobre tu negocio?",
      faqCta: "Contactar a Cortexa",
      faqCtaNote: "Nuestro equipo puede ayudarte a entender la plataforma antes de comenzar.",
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

      revenueActionEyebrow: "CONVIERTE DATOS EN CRECIMIENTO",
      revenueActionTitleLead: "Convierte Tus Datos de Ingresos",
      revenueActionTitleAccent: "En Acción.",
      revenueActionSub:
        "Reúne tu pipeline, clientes, tareas, citas y datos de rendimiento para que tu equipo vea lo que importa y actúe más rápido.",
      revenueActionBenefits: [
        {
          title: "PRIORIDADES CLARAS",
          desc: "Identifica qué oportunidades necesitan atención.",
        },
        {
          title: "DATOS CONECTADOS",
          desc: "Mantén organizada la información de clientes y pipeline.",
        },
        {
          title: "FLUJOS MÁS INTELIGENTES",
          desc: "Optimiza procesos internos y reduce el trabajo repetitivo.",
        },
        {
          title: "VISIBILIDAD DE INGRESOS",
          desc: "Comprende el rendimiento desde un panel conectado.",
        },
      ],
      revenueOverviewEyebrow: "UN PANEL. VISIBILIDAD COMPLETA.",
      revenueOverviewTitle: "Tu Resumen de Ingresos",
      revenueOverviewSub:
        "Información en tiempo real sobre tu pipeline, equipo y rendimiento — todo en un solo lugar.",
      revenueOverviewCta: "Comienza tu prueba de 14 días",
      revenueOverviewNoCard: "No se requiere tarjeta de crédito",
      revenueOverviewCancel: "Cancela cuando quieras",

      aiosV2Eyebrow: "CRM AGÉNTICO TODO EN UNO",
      aiosV2TitleLead: "Conecta. Organiza.",
      aiosV2TitleAccent: "Aumenta tus Ingresos.",
      aiosV2Subtitle:
        "Todo lo que necesitas para gestionar tu pipeline, clientes y operaciones en una plataforma potente y fácil de usar.",
      aiosV2Cards: [
        {
          title: "CRM",
          desc: "Gestiona leads, contactos, cuentas y relaciones en un solo lugar.",
        },
        {
          title: "PIPELINE",
          desc: "Visualiza tu pipeline de ventas y haz avanzar los negocios con confianza.",
        },
        {
          title: "PANELES INTELIGENTES",
          desc: "Obtén información en tiempo real sobre tu pipeline, equipo e ingresos.",
        },
        {
          title: "GESTIÓN DE FLUJOS",
          desc: "Automatiza tareas, aprobaciones y procesos para mantener a tu equipo productivo.",
        },
        {
          title: "INTEGRACIONES",
          desc: "Conecta las herramientas que ya utilizas y mantén tus datos sincronizados.",
        },
      ],
      aiosV2Benefits: [
        {
          title: "Un Sistema Conectado",
          desc: "Todos tus datos y herramientas trabajando juntos.",
        },
        {
          title: "Visibilidad Clara",
          desc: "Ve lo que importa y actúa con confianza.",
        },
        {
          title: "Flujos Más Inteligentes",
          desc: "Automatiza procesos y ahorra tiempo valioso.",
        },
        {
          title: "Mejores Resultados",
          desc: "Impulsa el crecimiento con mejores datos y decisiones.",
        },
      ],
      aiosV2BottomLead: "Una plataforma. Todo tu negocio.",
      aiosV2BottomAccent: "Diseñada para aumentar ingresos.",
      howV2Steps: [
        {
          title: "Conecta Tu Negocio",
          desc: "Conecta tu CRM, datos, herramientas y equipo en solo unos clics.",
        },
        {
          title: "Organiza Tus Operaciones",
          desc: "Reúne tu pipeline, contactos, tareas y flujos de trabajo en un solo lugar.",
        },
        {
          title: "Convierte Datos en Decisiones",
          desc: "Obtén información en tiempo real, mide el rendimiento y toma mejores decisiones.",
        },
      ],

      heroTitleLine1: "CRM agéntico creado para",
      heroTitleLine2: "automatizar y escalar ",
      heroTitleLine3: "el flujo de trabajo de tu negocio.",
      heroTitleLine31: "flujo de trabajo.",
      heroTitleLine4: "Diseñado para convertir",
      heroTitleLine5: "las conversaciones",
      heroTitleLine6: "en ingresos.",
      heroSubtitle:
        "Captura, da seguimiento y cierra — todo en un solo sistema. Conecta todas tus aplicaciones para que tus clientes, leads y datos fluyan automáticamente en un solo lugar.",
      herotextabove:
        "La IA organiza. La IA califica. Tú haces seguimiento. Tú cierras.",
      heroCheck5: "Tu agente de IA encuentra y califica leads automáticamente",
      heroCheck6:
        "Tu agente de IA encuentra, captura y califica leads automáticamente.",
      heroCheck7:
        "Gestiona las conversaciones con clientes a través de canales conectados",
      heroCheck8:
        "Flujos de seguimiento asistidos por IA",
      heroCheck9:
        "Inteligencia de pipeline, previsión de ingresos y un panel de control unificado.",
      heroCheck10: "Gestiona conversaciones, califica y nutre cada lead",
      heroCheck11: "Agenda citas directamente en tu calendario",
      heroCheck12: "Ve cada lead, venta y oportunidad en un solo panel",
      heroCTA: "¡Comenzar!",
      heroFreeAccess: "¿Regístrate? — ¡Obtén acceso gratis!",
      heroNoCard: "Prueba de 14 días",
      heroFreeForever: "Desde $11",
      heroUnlock: "¡Desbloquea tu potencial hoy!",
      heroTag1: "Una plataforma de IA. Todo conectado.",
      heroTag2: "Flujos de seguimiento asistidos por IA",
      heroTag3: "Flujos de seguimiento de clientes",
      heroTag4: "Inteligencia de pipeline que cierra ventas",
      heroTag5: "Integración de WhatsApp incorporada",
      heroTag6: "Segura. Confiable. Diseñada para tu negocio.",
      heroHead:
        "Diseñado para ayudar a las empresas a automatizar, operar y aumentar sus ingresos",

      smartV2Badge: "DEL LEAD A LOS INGRESOS — UN SISTEMA CONECTADO",
      smartV2Title1: "Ve Toda Tu Operación de Ingresos.",
      smartV2Title2: "En",
      smartV2TitleAccent: "Un Solo Lugar.",
      smartV2Subtitle:
        "Conecta tus leads, datos de clientes, pipeline, tareas, citas y analítica para que tu equipo siempre sepa qué necesita atención.",
      smartV2Steps: [
        {
          title: "CAPTURA",
          desc: "Organiza leads y datos de clientes en un solo lugar.",
        },
        {
          title: "GESTIONA",
          desc: "Controla oportunidades, tareas, citas y el progreso de cada negocio.",
        },
        {
          title: "CRECE",
          desc: "Usa el pipeline y los datos de rendimiento para tomar mejores decisiones y cerrar más negocios.",
        },
      ],
      smartV2Benefits: [
        {
          title: "UNA SOLA VISTA",
          desc: "Todos tus leads, negocios, tareas y citas en un solo panel.",
        },
        {
          title: "PIPELINE CLARO",
          desc: "Sabe exactamente dónde está cada negocio y en qué enfocarte.",
        },
        {
          title: "FLUJOS MÁS INTELIGENTES",
          desc: "Automatiza procesos internos y mantén a tu equipo alineado.",
        },
        {
          title: "MEJORES DECISIONES",
          desc: "La información en tiempo real te ayuda a actuar más rápido y cerrar más negocios.",
        },
      ],
      smartV2Cta: "Gestiona toda tu operación de ingresos desde un solo lugar",
      smartV2Bottom: "Gestiona leads. Citas. Negocios. Todo en un solo lugar.",

      topLine1: "El ",
      topHighlight: "CRM agéntico",
      topLine3:
        "para negocios cansados de software CRM complicado y costoso.",
      pricing: "Precios",
      webSolutions: "Desarrollo Web y de Software e Integración de Sistemas",

      finalTitle: "Conecta Todo Tu Flujo de Trabajo",
      finalDesc: "Leads. Oportunidades. Negocios. Todo en tu ",
      finalDesc1: "CRM agéntico",

      footerDescription: "AI Leads. AI Califica. AI Cierra.",

      startFreeTrial: "Comenzar",
      startYourFreeTrial: "Comienza tu prueba de 14 días →",

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
      rightStat1Up:
        "REALIZA UN SEGUIMIENTO AUTOMÁTICO DE CADA CLIENTE POTENCIAL",
      rightStat1Up1:
        "UN ESPACIO DE TRABAJO CONECTADO CREADO PARA PROFESIONALES INMOBILIARIOS",
      rightStat1Main: "",
      rightStat1Title: "",
      rightStat1Desc:
        "Todo lo que necesitas para gestionar clientes potenciales, propiedades y clientes en un solo lugar.",

      badge: "Integraciones Potentes",
      titlePre: "Funciona con las ",
      titleActive: "herramientas que ya usas",
      subtitlePre:
        "Lleva tus leads, mensajes, calendarios, tareas, archivos y flujos de trabajo ",
      subtitlePost:
        "en Cortexa y mantén tu trabajo conectado en un solo lugar.",
      feature1: "Sincroniza en minutos",
      feature2: "Gestiona tus flujos de trabajo",
      feature3: "Ahorra tiempo cada día",
      feature4: "Mantén a tu equipo alineado",
      footerTextPre:
        "Conecta tus aplicaciones, importa tus datos y gestiona tu flujo de trabajo dentro de Cortexa.",
      footerTextPost:
        "Gestiona todo desde un solo lugar en Apps e Integraciones.",
      btnText: "Ver Integraciones",

      workspaceSection: {
        eyebrow: "ESPACIOS DE TRABAJO CORTEXA",
        titleLead: "Espacios de trabajo especializados.",
        titleAccent: "Un CRM inteligente y conectado.",
        subtitle: "Cortexa incluye espacios de trabajo dedicados para diferentes industrias y operaciones empresariales. Cada espacio reúne las herramientas, la terminología, el recorrido del cliente y los flujos de trabajo adecuados en un CRM inteligente y conectado.",
        includesTitle: "CADA ESPACIO DE TRABAJO INCLUYE",
        includes: ["Conversaciones con IA", "Leads", "Clientes o pacientes", "Pipeline", "Calendario", "Automatizaciones", "Analítica", "Integraciones"],
        findLead: "Encuentra el espacio diseñado para",
        findAccent: "la forma en que opera tu negocio.",
        workspaces: ["Suite Empresarial", "Ventas", "Seguros", "Servicios Financieros", "Comercio Electrónico", "Servicio al Cliente", "Bienes Raíces", "Espacio de Equipo", "Generador de Leads", "Estética y Bienestar", "Clínica y Medicina"],
        clinicTitle: "Clínica y Medicina",
        clinicDescription: "Gestiona consultas de pacientes, consultas médicas, citas, actividad clínica, planes de atención, seguimiento y operaciones de la clínica desde un espacio conectado.",
        clinicFeatures: ["Pacientes", "Consultas", "Notas Clínicas", "Seguimiento"],
        preview: "Vista previa",
        connected: "Tu espacio se conecta directamente con tu CRM, agente de IA, datos de clientes, citas, flujos de trabajo y operación de ingresos.",
        explore: "Explorar espacios Cortexa",
        note: "Un espacio de trabajo incluido. Agrega más a medida que crece tu negocio.",
      },

      guidedSetup: {
        eyebrow: "CONFIGURACIÓN GUIADA DE CORTEXA",
        titleLead: "Configura y conecta",
        titleAccent: "tu espacio de trabajo",
        titleEnd: "para empezar a trabajar.",
        subtitle: "Cortexa te guía por los pasos esenciales de configuración dentro de tu cuenta para que tu agente de IA, los puntos de entrada de clientes, el CRM, el pipeline, las citas y la transferencia a tu equipo funcionen correctamente juntos.",
        steps: [
          { title: "Configura tu negocio", desc: "Añade los datos de tu negocio, servicios, horarios, equipo y objetivos de conversión." },
          { title: "Conecta los puntos de entrada de clientes", desc: "Conecta tu sitio web, teléfono empresarial, WhatsApp, formularios y páginas de marketing." },
          { title: "Entrena tu agente de IA", desc: "Define cómo responde, califica, programa citas y transfiere conversaciones." },
          { title: "Prueba y lanza", desc: "Verifica la captación de leads, el seguimiento de fuentes, los registros del CRM, el pipeline, las citas y las conversiones." },
        ],
        panelTitle: "Pon tu agente de IA a trabajar",
        panelSubtitle: "Conecta tus herramientas, entrena tu agente y empieza a convertir conversaciones con clientes en ingresos.",
        progress: "2 de 4 pasos completados", complete: "50% completado",
        panelSteps: [
          { title: "Conecta el número de tu agente de IA", desc: "Usa un número empresarial existente o activa uno nuevo para llamadas y mensajes de clientes.", status: "Conectado", action: "" },
          { title: "Entrena tu agente de IA", desc: "Enséñale sobre tu negocio, servicios, tono, reglas de calificación y cuándo transferir a una persona.", status: "En progreso", action: "Continuar entrenamiento" },
          { title: "Configura citas y flujo de leads", desc: "Define disponibilidad, enrutamiento de leads, seguimiento y comportamiento del pipeline.", status: "Sin configurar", action: "Configurar" },
          { title: "Prueba y lanza", desc: "Realiza una conversación real, confirma el flujo del lead y activa tu agente de IA.", status: "Listo para probar", action: "Probar mi agente de IA" },
        ],
        assistanceTitle: "Asistencia de configuración y sitio web", assistanceDesc: "Solicita ayuda con la configuración del agente de IA, conexiones del sitio web, teléfono, WhatsApp, seguimiento o puntos de entrada de clientes.", assistanceAction: "Solicitar asistencia",
        helpTitle: "¿Necesitas ayuda para conectarte?", helpDesc: "Envía una solicitud de asistencia directamente desde Configuración. Nuestro equipo puede revisar tu configuración y ayudarte a conectar tu agente de IA, sitio web, teléfono, WhatsApp, CRM, citas, checkout, seguimiento y transferencia humana.", helpNote: "La configuración personalizada y la implementación web son servicios opcionales de pago cotizados por separado según tus necesidades.", requestSetup: "Solicitar asistencia de configuración", viewGuide: "Ver guía de configuración",
      },

      webSolutionsSection: {
        titleLead: "Ya tienes el workspace adecuado.",
        titleSecond: "Ahora hagamos que",
        titleAccent: "funcione para tu negocio.",
        intro: "Un workspace es la parte de Cortexa creada en torno a la forma en que opera un tipo específico de negocio. Reúne los registros de clientes, workflows, pipeline, citas, automatización y herramientas del agente de IA que ese negocio necesita en un solo lugar conectado.",
        quote: "Elige el workspace que se adapte a tu negocio. Luego hazlo tuyo.",
        paragraph1: "Una vez seleccionado, la configuración guiada te ayuda a definir tus servicios, horarios, responsabilidades del equipo, puntos de entrada de clientes, reglas de calificación, objetivos de conversión, citas, seguimiento y transferencia humana.",
        paragraph2: "Tu sitio web, teléfono empresarial, formularios, tráfico publicitario y WhatsApp pueden conectarse al mismo proceso administrado para que el agente de IA, CRM, pipeline, checkout, citas y equipo trabajen juntos desde la primera conversación hasta la siguiente acción adecuada.",
        paragraph3: "Puedes completar la configuración por tu cuenta. Si tu sitio web necesita actualizarse, construirse o conectarse a tu workspace, nuestro equipo de Web Solutions puede revisar lo que tienes y proporcionar una cotización de implementación por separado.",
        cta: "Explorar Web Solutions",
        note: "Los servicios opcionales de configuración e implementación del sitio web se cotizan por separado.",
      },

      webShowcaseV3: {
        eyebrow: "SOLUCIONES WEB CORTEXA",
        titleLead: "Conecta tu sitio web con",
        titleAccent: "funciona tu negocio.",
        titleMiddle: "la forma en que",
        intro: "Tu sitio web debería hacer más que mostrar información. Cortexa Web Solutions puede conectarlo directamente con tu agente de IA, CRM, pipeline, citas, checkout, seguimiento, soporte y equipo, para que cada cliente llegue al siguiente paso correcto.",
        benefits: [
          { title: "Lidera con tu agente de IA", desc: "Brinda asistencia inmediata, captura la información del cliente, comprende lo que necesita y guíalo hacia la acción correcta." },
          { title: "Diseña según tus objetivos de conversión", desc: "Crea rutas claras para compras, citas, cotizaciones, visitas, demos, solicitudes de soporte y transferencias humanas." },
          { title: "Conecta cada punto de entrada del cliente", desc: "Integra formularios web, tráfico publicitario, teléfono comercial y WhatsApp en el mismo proceso administrado de Cortexa." },
        ],
        services: "Servicios", about: "Nosotros", resources: "Recursos", contact: "Contacto",
        startAgent: "Comenzar con nuestro agente de IA", smarter: "SOLUCIONES MÁS INTELIGENTES. MAYOR CRECIMIENTO.",
        heroTitle: "¿Cómo podemos ayudar a tu negocio hoy?", heroDesc: "Obtén orientación experta, respuestas rápidas y el siguiente paso correcto, impulsado por IA y un equipo que se preocupa.",
        expert: "Orientación experta", expertDesc: "Respuestas reales. Progreso real.", simpler: "Operaciones más simples", simplerDesc: "Del primer contacto a clientes duraderos.", productive: "Un equipo más productivo", productiveDesc: "Tecnología que trabaja para ti.",
        entryTitle: "MÚLTIPLES FORMAS PARA QUE LOS CLIENTES TE CONTACTEN", forms: "Formularios web", phone: "Teléfono", advertising: "Publicidad", whatsapp: "WhatsApp",
        agent: "Agente de IA Cortexa", welcome: "Cuéntame en qué necesitas ayuda y te guiaré al siguiente paso correcto.", exploreServices: "Explorar servicios", appointment: "Reservar una cita", quote: "Solicitar cotización", support: "Obtener soporte", captured: "Contacto capturado · Fuente registrada · CRM actualizado", message: "Escribe tu mensaje...", connected: "Sitio web + Agente de IA Cortexa + CRM",
        bottomLead: "¿Ya tienes un sitio web?", bottomAccent: "Podemos mejorarlo, conectarlo y hacer que funcione con el espacio de trabajo Cortexa que elijas.", explore: "Explorar Web Solutions", note: "Los servicios personalizados de sitio web e implementación se cotizan por separado."
      },

      teamShowcase: { eyebrow: "ESPACIO DE EQUIPO CORTEXA", title1: "Mantén a tu equipo alineado,", title2: "responsable y trabajando", title3: "con la", accent: "misma información.", subtitle: "Team Workspace ofrece a todos un lugar claro para gestionar asignaciones, seguimientos de clientes, comunicación interna, prioridades y transferencias sin perder contexto entre departamentos.", benefits: [{title:"Responsabilidad clara",desc:"Asigna trabajo, define responsabilidades y sabe quién gestiona cada cliente o tarea."},{title:"Contexto compartido del cliente",desc:"Mantén notas, conversaciones, actividad, estado y próximos pasos visibles para quienes los necesitan."},{title:"Ejecución más sólida",desc:"Coordina seguimientos, aprobaciones, plazos y transferencias humanas desde un espacio organizado."}], explore:"Explorar Team Workspace", seeHow:"Ver cómo trabajan los equipos en Cortexa", panelTitle:"Team Workspace", panelSub:"Coordina prioridades, asignaciones y seguimientos de clientes.", search:"Buscar clientes, tareas o miembros...", createTask:"Crear tarea", assigned:"Asignado a mí", due:"Para hoy", waiting:"Esperando al equipo", priorities:"Prioridades del equipo", activity:"Actividad del equipo", handoffs:"Transferencias de clientes", viewAll:"Ver todo", task:"Tarea", customer:"Cliente", owner:"Responsable", dueDate:"Fecha límite", status:"Estado", float:"Un equipo. Un registro compartido del cliente.", bottomLead:"Creado para las personas detrás de", bottomAccent:"cada experiencia del cliente.", roles:["Propietarios","Gerentes","Ventas","Atención al cliente","Operaciones"], bottomNote:"Todos trabajan con la misma información actualizada." },

      workspacelang1: "Equipo",
      workspacelang2: "Ingresos",
      workspacelang3: "Espacio de trabajo",
    },

    pt: {
      top: "Conheça seu CRM com IA. Maximize a produtividade com assistentes inteligentes.",
      nav: [
        "Recursos",
        "Assistente de IA",
        "Fluxos de trabalho IA",
        "Pipeline",
        "Análises",
        "Testemunhos",
      ],
      trial: "Começar",
      login: "Entrar",

      stripTitlebk: "Seu CRM não deve te atrasar.",
      stripSubbk: "Junte-se a equipes usando CORTEXA...",


      faqEyebrow: "PERGUNTAS FREQUENTES",
      faqTitleLead: "Perguntas",
      faqTitleAccent: "Frequentes",
      faqSubtitle: "Respostas diretas sobre o agente de IA, workspaces, configuração, conexões, sua equipe e como começar.",
      faq: [
        { q: "O que é a Cortexa e o que seu agente de IA faz?", a: "A Cortexa é um CRM inteligente e um sistema operacional de negócios. Seu agente de IA pode responder a dúvidas de clientes, capturar informações de contato, qualificar interesse, agendar compromissos, apoiar o acompanhamento e encaminhar cada conversa para o processo correto de CRM e pipeline com base nas regras que você configurar." },
        { q: "Qual workspace da Cortexa devo usar para o meu negócio?", a: "Escolha o workspace que mais se aproxima da forma como seu negócio opera. Cada workspace inclui a terminologia, os registros de clientes, os fluxos de trabalho, os pipelines e as ferramentas operacionais adequadas para esse tipo de negócio. Um workspace está incluído na sua conta. Workspaces adicionais podem ser adicionados separadamente se sua empresa precisar deles." },
        { q: "Como funciona a configuração guiada depois que eu escolho um workspace?", a: "Depois de selecionar seu workspace, a Cortexa orienta você pela configuração essencial dentro da sua conta. Você informará os dados da empresa, serviços ou produtos, horários, responsabilidades da equipe, pontos de entrada de clientes, regras de qualificação, metas de conversão, configurações de agendamento, requisitos de acompanhamento e instruções de atendimento humano. Você pode salvar o progresso e voltar para concluir a configuração a qualquer momento." },
        { q: "A Cortexa pode se conectar ao meu site, telefone comercial, WhatsApp, formulários e páginas de marketing?", a: "Sim. A Cortexa pode conectar pontos de entrada de clientes compatíveis ao seu agente de IA e ao fluxo do CRM. Isso pode incluir seu site, telefone comercial, WhatsApp, formulários, landing pages e páginas de tráfego de publicidade. O objetivo é capturar o contato, registrar a origem, criar o registro correto no CRM, selecionar o pipeline apropriado e conduzir o cliente para uma conversão ou atendimento humano." },
        { q: "O que são as Cortexa Web Solutions e quando eu precisaria delas?", a: "As Cortexa Web Solutions são serviços profissionais opcionais para empresas que precisam de ajuda para atualizar, melhorar, criar ou conectar seu site à Cortexa. Nossa equipe pode analisar seu site atual, recomendar as mudanças necessárias e ajudar a conectar os pontos de entrada de clientes ao seu agente de IA, CRM, rastreamento de campanhas, pipeline, agendamentos, checkout, orçamentos, demos, suporte e atendimento humano. Web Solutions e implementações personalizadas são cotadas separadamente de acordo com suas necessidades." },
        { q: "Minha equipe pode gerenciar atribuições, acompanhamentos, notas e transferências de clientes em conjunto?", a: "Sim. O Team Workspace oferece aos membros autorizados um local compartilhado para gerenciar atribuições, prioridades, notas internas, acompanhamentos de clientes, prazos e transferências entre departamentos. Todos trabalham com as mesmas informações atuais do cliente, enquanto as permissões determinam o que cada pessoa pode acessar ou alterar." },
        { q: "O agente de IA substitui minha equipe ou transfere conversas quando uma pessoa é necessária?", a: "O agente de IA cuida das interações com clientes e do trabalho rotineiro que você autorizar. Ele pode responder perguntas comuns, capturar informações, qualificar interesse, agendar compromissos e apoiar o acompanhamento. Quando uma conversa exige julgamento, aprovação, assistência especializada ou atenção pessoal, a Cortexa pode transferi-la para o membro apropriado da equipe de acordo com as regras configuradas." },
        { q: "Posso conectar os aplicativos e ferramentas que minha empresa já utiliza?", a: "A Cortexa oferece suporte a um diretório crescente de aplicativos e métodos de conexão, incluindo integrações diretas, APIs, webhooks, Zapier e outras ferramentas de automação compatíveis. A funcionalidade disponível depende do aplicativo e do seu plano Cortexa. Visite Apps & Integrations dentro da sua conta para consultar as conexões disponíveis." },
        { q: "Como funcionam a taxa de ativação e o teste de 14 dias?", a: "Uma taxa de ativação não reembolsável é necessária para ativar sua conta e iniciar o teste de 14 dias. A taxa de ativação aplicável, o período de teste, a primeira data de cobrança recorrente e o preço mensal da assinatura são exibidos antes da conclusão do checkout. Se você cancelar antes da primeira data de cobrança recorrente, a assinatura mensal não será cobrada. A taxa de ativação permanece não reembolsável." },
        { q: "O que acontece se eu precisar de ajuda para configurar ou conectar tudo?", a: "A configuração guiada está disponível dentro da sua conta, e você pode enviar uma solicitação de assistência sempre que precisar de ajuda. Nossa equipe pode revisar sua configuração, identificar informações ausentes e responder pela sua conta. Configuração personalizada, trabalho no site e implementação técnica são serviços pagos opcionais e serão cotados separadamente antes do início de qualquer trabalho pago." },
      ],
      faqCtaTitle: "Ainda tem alguma dúvida sobre o seu negócio?",
      faqCta: "Falar com a Cortexa",
      faqCtaNote: "Nossa equipe pode ajudar você a entender a plataforma antes de começar.",
      finalTitle:
        "Automatize seus processos com agentes de IA impulsionados pelo Cortexa Agentic CRM",
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

      revenueActionEyebrow: "TRANSFORME DADOS EM CRESCIMENTO",
      revenueActionTitleLead: "Transforme Seus Dados de Receita",
      revenueActionTitleAccent: "Em Ação.",
      revenueActionSub:
        "Reúna pipeline, clientes, tarefas, compromissos e dados de desempenho para que sua equipe veja o que importa e aja mais rápido.",
      revenueActionBenefits: [
        {
          title: "PRIORIDADES CLARAS",
          desc: "Saiba quais oportunidades precisam de atenção.",
        },
        {
          title: "DADOS CONECTADOS",
          desc: "Mantenha as informações de clientes e pipeline organizadas.",
        },
        {
          title: "FLUXOS MAIS INTELIGENTES",
          desc: "Simplifique processos internos e reduza tarefas repetitivas.",
        },
        {
          title: "VISIBILIDADE DE RECEITA",
          desc: "Entenda o desempenho em um único dashboard conectado.",
        },
      ],
      revenueOverviewEyebrow: "UM DASHBOARD. VISIBILIDADE COMPLETA.",
      revenueOverviewTitle: "Sua Visão Geral de Receita",
      revenueOverviewSub:
        "Insights em tempo real sobre pipeline, equipe e desempenho — tudo em um só lugar.",
      revenueOverviewCta: "Comece seu teste de 14 dias",
      revenueOverviewNoCard: "Nenhum cartão de crédito necessário",
      revenueOverviewCancel: "Cancele quando quiser",

      aiosV2Eyebrow: "CRM AGÊNTICO TUDO EM UM",
      aiosV2TitleLead: "Conecte. Organize.",
      aiosV2TitleAccent: "Aumente a Receita.",
      aiosV2Subtitle:
        "Tudo o que você precisa para gerenciar pipeline, clientes e operações em uma plataforma poderosa e fácil de usar.",
      aiosV2Cards: [
        {
          title: "CRM",
          desc: "Gerencie leads, contatos, contas e relacionamentos em um só lugar.",
        },
        {
          title: "PIPELINE",
          desc: "Visualize seu pipeline de vendas e avance negócios com confiança.",
        },
        {
          title: "DASHBOARDS INTELIGENTES",
          desc: "Veja insights em tempo real sobre pipeline, equipe e receita.",
        },
        {
          title: "GESTÃO DE FLUXOS",
          desc: "Automatize tarefas, aprovações e processos para manter sua equipe produtiva.",
        },
        {
          title: "INTEGRAÇÕES",
          desc: "Conecte as ferramentas que você já usa e mantenha seus dados sincronizados.",
        },
      ],
      aiosV2Benefits: [
        {
          title: "Um Sistema Conectado",
          desc: "Todos os seus dados e ferramentas trabalhando juntos.",
        },
        {
          title: "Visibilidade Clara",
          desc: "Veja o que importa e aja com confiança.",
        },
        {
          title: "Fluxos Mais Inteligentes",
          desc: "Automatize processos e economize tempo valioso.",
        },
        {
          title: "Melhores Resultados",
          desc: "Cresça com melhores dados e decisões.",
        },
      ],
      aiosV2BottomLead: "Uma plataforma. Todo o seu negócio.",
      aiosV2BottomAccent: "Criada para aumentar a receita.",
      howV2Steps: [
        {
          title: "Conecte Seu Negócio",
          desc: "Conecte seu CRM, dados, ferramentas e equipe em poucos cliques.",
        },
        {
          title: "Organize Suas Operações",
          desc: "Reúna pipeline, contatos, tarefas e fluxos de trabalho em um só lugar.",
        },
        {
          title: "Transforme Dados em Decisões",
          desc: "Veja insights em tempo real, acompanhe o desempenho e tome decisões melhores.",
        },
      ],

      heroTitleLine1: "CRM agêntico criado para",
      heroTitleLine2: "automatizar e escalar ",
      heroTitleLine3: "o fluxo de trabalho do seu negócio.",
      heroTitleLine31: "fluxo de trabalho.",
      heroTitleLine4: "Criado para transformar",
      heroTitleLine5: "conversas",
      heroTitleLine6: "em receita.",

      heroSubtitle:
        "Capture, acompanhe e feche — tudo em um único sistema. Conecte todos os seus aplicativos para que seus clientes, leads e dados fluam automaticamente em um só lugar.",
      herotextabove:
        "A IA organiza. A IA qualifica. Você faz o acompanhamento. Você fecha.",
      heroCheck5: "Seu agente de IA encontra e qualifica leads automaticamente",
      heroCheck6:
        "Seu agente de IA encontra, capta e qualifica clientes em potencial automaticamente.",
      heroCheck7:
        "Gerencie as conversas com clientes por meio de canais conectados",
      heroCheck8:
        "Fluxos de acompanhamento assistidos por IA",
      heroCheck9:
        "Inteligência de pipeline, previsão de receita e um painel de controle unificado.",
      heroCheck10: "Gerencia conversas, qualifica e nutre cada lead",
      heroCheck11: "Agenda compromissos diretamente no seu calendário",
      heroCheck12:
        "Veja todos os leads, negócios e oportunidades em um único painel",
      heroCTA: "Começar!",
      heroFreeAccess: "Cadastre-se? — Obtenha acesso grátis!",
      heroNoCard: "Teste de 14 dias",
      heroFreeForever: "A partir de US$ 11",
      heroUnlock: "Desbloqueie seu potencial hoje!",
      heroTag1: "Uma plataforma de IA. Tudo conectado.",
      heroTag2: "Fluxos de acompanhamento assistidos por IA",
      heroTag3: "Fluxos de acompanhamento de clientes",
      heroTag4: "Inteligência de pipeline que fecha negócios",
      heroTag5: "Integração nativa com WhatsApp",
      heroTag6: "Segura. Confiável. Feita para o seu negócio.",
      heroHead:
        "Desenvolvido para ajudar empresas a automatizar, operar e aumentar a receita",

      smartV2Badge: "DO LEAD À RECEITA — UM SISTEMA CONECTADO",
      smartV2Title1: "Veja Toda a Sua Operação de Receita.",
      smartV2Title2: "Em",
      smartV2TitleAccent: "Um Só Lugar.",
      smartV2Subtitle:
        "Conecte leads, dados de clientes, pipeline, tarefas, compromissos e análises para que sua equipe sempre saiba o que precisa de atenção.",
      smartV2Steps: [
        {
          title: "CAPTURE",
          desc: "Organize leads e dados de clientes em um só lugar.",
        },
        {
          title: "GERENCIE",
          desc: "Acompanhe oportunidades, tarefas, compromissos e o progresso dos negócios.",
        },
        {
          title: "CRESÇA",
          desc: "Use o pipeline e os insights de desempenho para tomar decisões melhores e fechar mais negócios.",
        },
      ],
      smartV2Benefits: [
        {
          title: "UMA VISÃO",
          desc: "Todos os leads, negócios, tarefas e compromissos em um único painel.",
        },
        {
          title: "PIPELINE CLARO",
          desc: "Saiba exatamente onde cada negócio está e no que focar.",
        },
        {
          title: "FLUXOS MAIS INTELIGENTES",
          desc: "Automatize processos internos e mantenha sua equipe alinhada.",
        },
        {
          title: "MELHORES DECISÕES",
          desc: "Insights em tempo real ajudam você a agir mais rápido e fechar mais negócios.",
        },
      ],
      smartV2Cta: "Gerencie toda a sua operação de receita em um só lugar",
      smartV2Bottom: "Gerencie leads. Agendamentos. Negócios. Tudo em um só lugar.",

      topLine1: "O ",
      topHighlight: "CRM agêntico",
      topLine3:
        "para empresas cansadas de software de CRM complicado e caro.",
      pricing: "Preços",
      webSolutions: "Desenvolvimento Web e de Software e Integração de Sistemas",

      finalTitle: "Conecte Todo o Seu Fluxo de Trabalho",
      finalDesc: "Leads. Oportunidades. Negócios. Tudo no seu ",
      finalDesc1: "CRM agêntico",

      footerDescription: "IA Gera Leads. IA Qualifica. IA Fecha.",

      startFreeTrial: "Começar",
      startYourFreeTrial: "Comece seu teste de 14 dias →",

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
      rightStat1Up: "FAÇA O ACOMPANHAMENTO AUTOMÁTICO DE CADA LEAD",
      rightStat1Up1:
        "UM ESPAÇO DE TRABALHO INTEGRADO CRIADO PARA PROFISSIONAIS DO MERCADO IMOBILIÁRIO",
      rightStat1Main: "",
      rightStat1Title: "",
      rightStat1Desc:
        "Tudo o que você precisa para gerenciar leads, imóveis e clientes em um só lugar.",

      badge: "Integrações Poderosas",
      titlePre: "Funciona com as ",
      titleActive: "ferramentas que você já usa",
      subtitlePre:
        "Traga seus leads, mensagens, calendários, tarefas, arquivos e fluxos de trabalho ",
      subtitlePost: "no Cortexa e mantenha seu trabalho conectado em um só lugar.",
      feature1: "Sincronize em minutos",
      feature2: "Gerencie seus fluxos de trabalho",
      feature3: "Economize tempo todos os dias",
      feature4: "Mantenha sua equipe alinhada",
      footerTextPre:
        "Conecte seus aplicativos, importe seus dados e gerencie seu fluxo de trabalho dentro do Cortexa.",
      footerTextPost: "Gerencie tudo em um só lugar em Apps e Integrações.",
      btnText: "Ver Integrações",

      workspaceSection: {
        eyebrow: "ESPAÇOS DE TRABALHO CORTEXA",
        titleLead: "Espaços de trabalho especializados.",
        titleAccent: "Um CRM inteligente e conectado.",
        subtitle: "A Cortexa inclui espaços de trabalho dedicados para diferentes setores e operações empresariais. Cada espaço reúne as ferramentas, a terminologia, a jornada do cliente e os fluxos de trabalho adequados em um CRM inteligente e conectado.",
        includesTitle: "CADA ESPAÇO DE TRABALHO INCLUI",
        includes: ["Conversas com IA", "Leads", "Clientes ou pacientes", "Pipeline", "Calendário", "Automações", "Análises", "Integrações"],
        findLead: "Encontre o espaço desenvolvido para",
        findAccent: "a forma como sua empresa opera.",
        workspaces: ["Suíte Empresarial", "Vendas", "Seguros", "Serviços Financeiros", "E-Commerce", "Atendimento ao Cliente", "Imobiliário", "Espaço da Equipe", "Gerador de Leads", "Estética e Bem-Estar", "Clínica e Medicina"],
        clinicTitle: "Clínica e Medicina",
        clinicDescription: "Gerencie contatos de pacientes, consultas, agendamentos, atividade clínica, planos de cuidados, acompanhamento e operações da clínica em um espaço conectado.",
        clinicFeatures: ["Pacientes", "Consultas", "Notas Clínicas", "Acompanhamento"],
        preview: "Visualizar espaço",
        connected: "Seu espaço se conecta diretamente ao CRM, agente de IA, dados de clientes, agendamentos, fluxos de trabalho e operação de receita.",
        explore: "Explorar espaços Cortexa",
        note: "Um espaço de trabalho incluído. Adicione mais conforme sua empresa cresce.",
      },

      guidedSetup: {
        eyebrow: "CONFIGURAÇÃO GUIADA CORTEXA",
        titleLead: "Configure e conecte", titleAccent: "seu espaço de trabalho", titleEnd: "para começar a trabalhar.",
        subtitle: "A Cortexa orienta você pelas etapas essenciais de configuração dentro da sua conta para que seu agente de IA, pontos de entrada de clientes, CRM, pipeline, agendamentos e transferência para a equipe funcionem corretamente em conjunto.",
        steps: [
          { title: "Configure sua empresa", desc: "Adicione os dados da empresa, serviços, horários, equipe e metas de conversão." },
          { title: "Conecte os pontos de entrada dos clientes", desc: "Conecte seu site, telefone comercial, WhatsApp, formulários e páginas de marketing." },
          { title: "Treine seu agente de IA", desc: "Defina como ele responde, qualifica, agenda e transfere conversas." },
          { title: "Teste e lance", desc: "Verifique a captura de leads, origem, registros do CRM, roteamento do pipeline, agendamentos e conversões." },
        ],
        panelTitle: "Coloque seu agente de IA para trabalhar", panelSubtitle: "Conecte suas ferramentas, treine seu agente e comece a transformar conversas com clientes em receita.", progress: "2 de 4 etapas concluídas", complete: "50% concluído",
        panelSteps: [
          { title: "Conecte o número do seu agente de IA", desc: "Use um número comercial existente ou ative um novo para chamadas e mensagens de clientes.", status: "Conectado", action: "" },
          { title: "Treine seu agente de IA", desc: "Ensine sobre sua empresa, serviços, tom, regras de qualificação e quando transferir para uma pessoa.", status: "Em andamento", action: "Continuar treinamento" },
          { title: "Configure agendamentos e fluxo de leads", desc: "Defina disponibilidade, roteamento de leads, acompanhamento e comportamento do pipeline.", status: "Não configurado", action: "Configurar" },
          { title: "Teste e lance", desc: "Faça uma conversa real, confirme o fluxo do lead e ative seu agente de IA.", status: "Pronto para testar", action: "Testar meu agente de IA" },
        ],
        assistanceTitle: "Assistência de configuração e site", assistanceDesc: "Solicite ajuda com a configuração do agente de IA, conexões do site, telefone, WhatsApp, rastreamento ou pontos de entrada de clientes.", assistanceAction: "Solicitar assistência",
        helpTitle: "Precisa de ajuda para se conectar?", helpDesc: "Envie uma solicitação de assistência diretamente pela Configuração. Nossa equipe pode revisar sua configuração e ajudar a conectar seu agente de IA, site, telefone, WhatsApp, CRM, agendamentos, checkout, rastreamento e transferência humana.", helpNote: "A configuração personalizada e a implementação do site são serviços opcionais pagos, cotados separadamente conforme suas necessidades.", requestSetup: "Solicitar assistência de configuração", viewGuide: "Ver guia de configuração",
      },

      webSolutionsSection: {
        titleLead: "Você tem o workspace certo.",
        titleSecond: "Agora vamos fazê-lo",
        titleAccent: "funcionar para o seu negócio.",
        intro: "Um workspace é a parte da Cortexa criada em torno da forma como um tipo específico de negócio opera. Ele reúne registros de clientes, workflows, pipeline, agendamentos, automação e ferramentas do agente de IA que esse negócio precisa em um único lugar conectado.",
        quote: "Escolha o workspace que se adapta ao seu negócio. Depois, torne-o seu.",
        paragraph1: "Depois de selecionado, a configuração guiada ajuda você a definir seus serviços, horários, responsabilidades da equipe, pontos de entrada dos clientes, regras de qualificação, metas de conversão, agendamentos, acompanhamento e transferência humana.",
        paragraph2: "Seu site, telefone comercial, formulários, tráfego de publicidade e WhatsApp podem se conectar ao mesmo processo gerenciado para que o agente de IA, CRM, pipeline, checkout, agendamentos e equipe trabalhem juntos desde a primeira conversa até a próxima ação apropriada.",
        paragraph3: "Você pode concluir a configuração por conta própria. Se o seu site precisar ser atualizado, criado ou conectado ao seu workspace, nossa equipe de Web Solutions pode revisar o que você tem e fornecer uma cotação de implementação separada.",
        cta: "Explorar Web Solutions",
        note: "Serviços opcionais de configuração e implementação do site são cotados separadamente.",
      },

      webShowcaseV3: {
        eyebrow: "SOLUÇÕES WEB CORTEXA",
        titleLead: "Conecte seu site à forma como",
        titleAccent: "seu negócio funciona.",
        titleMiddle: "",
        intro: "Seu site deve fazer mais do que exibir informações. A Cortexa Web Solutions pode conectá-lo diretamente ao seu agente de IA, CRM, pipeline, agendamentos, checkout, rastreamento, suporte e equipe, para que cada cliente chegue à próxima etapa correta.",
        benefits: [
          { title: "Lidere com seu agente de IA", desc: "Ofereça assistência imediata, capture as informações do cliente, entenda o que ele precisa e conduza-o à ação correta." },
          { title: "Construa em torno das suas metas de conversão", desc: "Crie caminhos claros para compras, agendamentos, orçamentos, visitas, demos, solicitações de suporte e transferências humanas." },
          { title: "Conecte todos os pontos de entrada do cliente", desc: "Reúna formulários do site, tráfego de publicidade, telefone comercial e WhatsApp no mesmo processo gerenciado da Cortexa." },
        ],
        services: "Serviços", about: "Sobre", resources: "Recursos", contact: "Contato",
        startAgent: "Começar com nosso agente de IA", smarter: "SOLUÇÕES MAIS INTELIGENTES. CRESCIMENTO MAIOR.",
        heroTitle: "Como podemos ajudar seu negócio hoje?", heroDesc: "Receba orientação especializada, respostas rápidas e a próxima etapa certa, com IA e uma equipe que se importa.",
        expert: "Orientação especializada", expertDesc: "Respostas reais. Progresso real.", simpler: "Operações mais simples", simplerDesc: "Do primeiro contato a clientes duradouros.", productive: "Uma equipe mais produtiva", productiveDesc: "Tecnologia que trabalha para você.",
        entryTitle: "VÁRIAS FORMAS PARA OS CLIENTES ENTRAREM EM CONTATO", forms: "Formulários do site", phone: "Telefone", advertising: "Publicidade", whatsapp: "WhatsApp",
        agent: "Agente de IA Cortexa", welcome: "Diga no que você precisa de ajuda e eu vou orientar você para a próxima etapa certa.", exploreServices: "Explorar serviços", appointment: "Agendar uma consulta", quote: "Solicitar orçamento", support: "Obter suporte", captured: "Contato capturado · Origem registrada · CRM atualizado", message: "Digite sua mensagem...", connected: "Site + Agente de IA Cortexa + CRM",
        bottomLead: "Já tem um site?", bottomAccent: "Podemos melhorá-lo, conectá-lo e fazê-lo funcionar com o workspace Cortexa selecionado.", explore: "Explorar Web Solutions", note: "Serviços personalizados de site e implementação são cotados separadamente."
      },

      teamShowcase: { eyebrow: "ESPAÇO DE EQUIPE CORTEXA", title1: "Mantenha sua equipe alinhada,", title2: "responsável e trabalhando", title3: "com as", accent: "mesmas informações.", subtitle: "O Team Workspace oferece a todos um lugar claro para gerenciar atribuições, acompanhamentos de clientes, comunicação interna, prioridades e transferências sem perder contexto entre departamentos.", benefits: [{title:"Responsabilidade clara",desc:"Atribua trabalho, defina responsabilidades e saiba quem cuida de cada cliente ou tarefa."},{title:"Contexto compartilhado do cliente",desc:"Mantenha notas, conversas, atividades, status e próximos passos visíveis para quem precisa."},{title:"Execução mais forte",desc:"Coordene acompanhamentos, aprovações, prazos e transferências humanas em um espaço organizado."}], explore:"Explorar Team Workspace", seeHow:"Veja como as equipes trabalham no Cortexa", panelTitle:"Team Workspace", panelSub:"Coordene prioridades, atribuições e acompanhamentos de clientes.", search:"Buscar clientes, tarefas ou membros...", createTask:"Criar tarefa", assigned:"Atribuído a mim", due:"Para hoje", waiting:"Aguardando equipe", priorities:"Prioridades da equipe", activity:"Atividade da equipe", handoffs:"Transferências de clientes", viewAll:"Ver tudo", task:"Tarefa", customer:"Cliente", owner:"Responsável", dueDate:"Data limite", status:"Status", float:"Uma equipe. Um registro compartilhado do cliente.", bottomLead:"Criado para as pessoas por trás de", bottomAccent:"cada experiência do cliente.", roles:["Proprietários","Gerentes","Vendas","Atendimento","Operações"], bottomNote:"Todos trabalham com as mesmas informações atualizadas." },

      workspacelang1: "Equipe",
      workspacelang2: "Receita",
      workspacelang3: "Espaço de trabalho",
    },
  };

  const tr = t[lang];
  const customerExperience = CUSTOMER_EXPERIENCES_COPY[lang] || CUSTOMER_EXPERIENCES_COPY.en;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const currentHero =
    lang === "es" ? heroImgES : lang === "pt" ? heroImgPT : heroImg;

  const currentSect2 =
    lang === "es" ? sect2ES : lang === "pt" ? sect2PT : sect2;

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

  const currentCustomerJourneyImg =
    lang === "es"
      ? customerJourneyES
      : lang === "pt"
        ? customerJourneyPT
        : customerJourneyEN;
  workspaceImg;
  const workspace =
    lang === "es"
      ? workspaceImgES
      : lang === "pt"
        ? workspaceImgPT
        : workspaceImg;
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

  return (
    <div id="cortexa-ai-crm-landing">
      <div className="hero-text">
        <p className="hero-title">
          <span className="highlight">{tr.topHighlight}</span> {tr.topLine3}
        </p>
      </div>
      <header className="cx-header">
        <div className="cx-header-inner">
          <div className="cx-left">
            <a href={lp("/")}>
              <img
                src={headlogoImg}
                className="cx-logo-img"
                alt="Cortexa Agentic CRM"
                width="258"
                height="52"
              />
            </a>
          </div>

          <nav className="cx-nav">
            {tr.nav.map((n, i) => {
              const ids = [
                "features",
                "ai-assistant",
                "whatsapp", // AI Workflows: the AI insights / workflows section
                "pipeline",
                "analytics",
                "testimonials",
              ];
              // Testimonials section removed (was illustrative/sample content); skip its nav link.
              if (ids[i] === "testimonials") return null;

              return (
                <HashLink
                  className="nav-menu"
                  key={i}
                  smooth
                  to={lp(`/#${ids[i]}`)}
                >
                  {n}
                </HashLink>
              );
            })}
            <a
              className="nav-menu"
              href={lp("/pricing")}
              onClick={trackCta("nav_pricing", tr.pricing)}
            >
              {tr.pricing}
            </a>
            <a className="nav-menu" href={lp("/editorial/the-end-of-legacy-crm")}>
              Cost Calculator
            </a>
            <a
              className="nav-menu nav-menu-web-solutions"
              href="/web-solutions"
              aria-label={tr.webSolutions}
              onClick={trackCta("nav_web_solutions", "Web & Software Development")}
            >
              <span>Web &amp; Software Development</span>
              <span>Systems Integration</span>
            </a>
          </nav>

          <div className="cx-actions">
            <a
              href={lp("/trial?flow=free-access&plan=free")}
              className="cx-btn cx-btn-primary- small"
              onClick={trackCta("header_get_started", tr.trial)}
            >
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
              <Link to={lp("/sign-in")} className="cx-login">
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
                <span className="hero-head">{tr.heroHead}</span>
              </div>
              <h1 className="hero-title">
                {tr.heroTitleLine1} <br />
                <span className="text-os">{tr.heroTitleLine2}</span><br />
                <span className="text-os">{tr.heroTitleLine3}</span>
              </h1>
              <div className="hero-checks hero-p">
                <p>{tr.herotextabove}</p>
              </div>
              <div className="hero-inline hero-inline-free-access">
                <a
                  href={lp("/trial?flow=free-access&plan=free")}
                  className="hero-btn hero-btn-trial hero-btn-free-access-main"
                  onClick={trackCta("hero_get_started", tr.heroCTA)}
                >
                  {tr.heroCTA}
                </a>
              </div>

              <div className="hero-free-access-meta">
                <span>
                  <CreditCard size={20} />
                  {tr.heroNoCard}
                </span>
                <i aria-hidden="true" />
                <span>
                  <Infinity size={24} />
                  {tr.heroFreeForever}
                </span>
              </div>
              <div className="hero-checks ul">
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
              <img
                src={herorightImg}
                alt="Cortexa Agentic CRM dashboard with AI command center, lead, pipeline and revenue metrics"
                width="989"
                height="765"
                fetchpriority="high"
              />
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

      {/* CORTEXA SPECIALIZED WORKSPACES */}
      <section id="features" className="cx-workspaces-showcase">
        <div className="cx-ws-decor cx-ws-decor-left" aria-hidden="true" />
        <div className="cx-ws-decor cx-ws-decor-right" aria-hidden="true" />

        <div className="cx-ws-shell">
          <div className="cx-ws-eyebrow">
            <span />
            <b>{tr.workspaceSection.eyebrow}</b>
            <span />
          </div>

          <h2 className="cx-ws-title">
            {tr.workspaceSection.titleLead}{" "}
            <strong>{tr.workspaceSection.titleAccent}</strong>
          </h2>
          <p className="cx-ws-subtitle">{tr.workspaceSection.subtitle}</p>

          <div className="cx-ws-includes-title">{tr.workspaceSection.includesTitle}</div>
          <div className="cx-ws-includes">
            {[
              MessageSquare,
              UserPlus,
              Users,
              BarChart3,
              CalendarDays,
              Workflow,
              PieChart,
              Puzzle,
            ].map((Icon, index) => (
              <div className="cx-ws-include" key={tr.workspaceSection.includes[index]}>
                <span className={`cx-ws-icon cx-ws-icon-${index + 1}`}>
                  <Icon size={30} strokeWidth={2} />
                </span>
                <span>{tr.workspaceSection.includes[index]}</span>
              </div>
            ))}
          </div>

          <h3 className="cx-ws-find-title">
            {tr.workspaceSection.findLead}{" "}
            <strong>{tr.workspaceSection.findAccent}</strong>
          </h3>

          <div className="cx-ws-grid">
            {[
              Building2,
              TrendingUp,
              ShieldCheck,
              Landmark,
              ShoppingCart,
              Headphones,
              Home,
              Users2,
              Magnet,
              HeartPulse,
              Stethoscope,
            ].map((Icon, index) => {
              const isClinic = index === 10;
              return (
                <div
                  className={`cx-ws-choice ${isClinic ? "is-active" : ""}`}
                  key={tr.workspaceSection.workspaces[index]}
                >
                  <span className={`cx-ws-choice-icon cx-ws-choice-icon-${index + 1}`}>
                    <Icon size={35} strokeWidth={2} />
                  </span>
                  <span>{tr.workspaceSection.workspaces[index]}</span>
                </div>
              );
            })}
          </div>

          <div className="cx-ws-detail">
            <div className="cx-ws-detail-brand">
              <span className="cx-ws-detail-main-icon"><Stethoscope size={46} strokeWidth={2} /></span>
              <b>{tr.workspaceSection.clinicTitle}</b>
            </div>

            <p className="cx-ws-detail-copy">{tr.workspaceSection.clinicDescription}</p>

            <div className="cx-ws-detail-features">
              {[User, ClipboardList, FileText, BellRing].map((Icon, index) => (
                <div className="cx-ws-detail-feature" key={tr.workspaceSection.clinicFeatures[index]}>
                  <span><Icon size={23} strokeWidth={2} /></span>
                  <small>{tr.workspaceSection.clinicFeatures[index]}</small>
                </div>
              ))}
              <a className="cx-ws-preview" href="/dashboard/clinic-medical">
                {tr.workspaceSection.preview} <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <p className="cx-ws-connected">{tr.workspaceSection.connected}</p>
          <a
            className="cx-ws-explore"
            href={lp("/trial?flow=free-access&plan=free")}
            onClick={trackCta("workspaces_get_started", tr.workspaceSection.explore)}
          >
            {tr.workspaceSection.explore} <ArrowRight size={18} />
          </a>
          <p className="cx-ws-note">{tr.workspaceSection.note}</p>
        </div>
      </section>
      {/* GUIDED CORTEXA SETUP */}
      <section className="cx-guided-setup">
        <div className="cx-setup-decor cx-setup-decor-left" aria-hidden="true" />
        <div className="cx-setup-decor cx-setup-decor-right" aria-hidden="true" />
        <div className="cx-setup-shell">
          <div className="cx-setup-main">
            <div className="cx-setup-copy">
              <div className="cx-setup-eyebrow"><span /><b>{tr.guidedSetup.eyebrow}</b><span /></div>
              <h2>{tr.guidedSetup.titleLead}<br/><strong>{tr.guidedSetup.titleAccent}</strong><br/>{tr.guidedSetup.titleEnd}</h2>
              <p className="cx-setup-intro">{tr.guidedSetup.subtitle}</p>
              <div className="cx-setup-left-steps">
                {tr.guidedSetup.steps.map((step, index) => {
                  const Icons = [Building2, Link2, Bot, Play];
                  const Icon = Icons[index];
                  return <div className="cx-setup-left-step" key={step.title}>
                    <span className="cx-setup-number">{index + 1}</span>
                    <span className={`cx-setup-step-icon s${index + 1}`}><Icon size={27} /></span>
                    <div><b>{step.title}</b><p>{step.desc}</p></div>
                  </div>;
                })}
              </div>
            </div>

            <div className="cx-setup-panel">
              <div className="cx-setup-panel-head">
                <span className="cx-setup-spark"><Sparkles size={28}/></span>
                <div><h3>{tr.guidedSetup.panelTitle}</h3><p>{tr.guidedSetup.panelSubtitle}</p></div>
                <div className="cx-setup-panel-lang"><Globe2 size={17}/> EN <ChevronDown size={14}/><span>A</span></div>
              </div>
              <div className="cx-setup-progress"><b>{tr.guidedSetup.progress}</b><span><i /></span><small>{tr.guidedSetup.complete}</small></div>
              <div className="cx-setup-panel-steps">
                {tr.guidedSetup.panelSteps.map((step,index)=>{
                  const Icons=[Phone,BookOpen,CalendarDays,Play]; const Icon=Icons[index];
                  return <div className="cx-setup-panel-step" key={step.title}>
                    <span className="cx-setup-row-num">{index+1}</span><span className={`cx-setup-row-icon r${index+1}`}><Icon size={24}/></span>
                    <div className="cx-setup-row-copy"><b>{step.title}</b><p>{step.desc}</p></div>
                    <span className={`cx-setup-status status-${index+1}`}>{index===0||index===3?<CheckCircle2 size={14}/>:null}{step.status}</span>
                    {step.action && <a href="/dashboard/ai-cortexa-setup" className={`cx-setup-row-action a${index+1}`}>{step.action}</a>}
                    <ChevronDown className="cx-setup-chevron" size={17}/>
                  </div>
                })}
              </div>
              <div className="cx-setup-assistance">
                <span><Headphones size={30}/></span><div><b>{tr.guidedSetup.assistanceTitle}</b><p>{tr.guidedSetup.assistanceDesc}</p></div>
                <a href="/web-solutions" onClick={trackCta("setup_assistance_web_solutions", tr.guidedSetup.assistanceAction)}>{tr.guidedSetup.assistanceAction}<ArrowRight size={16}/></a>
              </div>
            </div>
          </div>

          <div className="cx-setup-help">
            <span className="cx-setup-help-icon"><LifeBuoy size={43}/></span>
            <div><h3>{tr.guidedSetup.helpTitle}</h3><p>{tr.guidedSetup.helpDesc}</p><small>{tr.guidedSetup.helpNote}</small></div>
            <div className="cx-setup-help-actions"><a href="/web-solutions" onClick={trackCta("setup_request_web_solutions", tr.guidedSetup.requestSetup)}>{tr.guidedSetup.requestSetup}<ArrowRight size={18}/></a><a href="/dashboard/ai-cortexa-setup">{tr.guidedSetup.viewGuide}</a></div>
          </div>
        </div>
      </section>

      {/* WEB SOLUTIONS BRIDGE */}
      <section className="cx-web-solutions-bridge">
        <div className="cx-web-bridge-shell">
          <h2>
            {tr.webSolutionsSection.titleLead}
            <br />
            {tr.webSolutionsSection.titleSecond}{" "}
            <strong>{tr.webSolutionsSection.titleAccent}</strong>
          </h2>

          <p className="cx-web-bridge-intro">{tr.webSolutionsSection.intro}</p>

          <blockquote className="cx-web-bridge-quote">
            <span className="cx-web-bridge-quote-mark cx-web-bridge-quote-left">“</span>
            <strong>{tr.webSolutionsSection.quote}</strong>
            <span className="cx-web-bridge-quote-mark cx-web-bridge-quote-right">”</span>
          </blockquote>

          <div className="cx-web-bridge-copy">
            <p>{tr.webSolutionsSection.paragraph1}</p>
            <p>{tr.webSolutionsSection.paragraph2}</p>
            <p>{tr.webSolutionsSection.paragraph3}</p>
          </div>

          <a
            className="cx-web-bridge-cta"
            href="/web-solutions"
            onClick={trackCta("web_bridge_web_solutions", tr.webSolutionsSection.cta)}
          >
            {tr.webSolutionsSection.cta}
          </a>
          <small>{tr.webSolutionsSection.note}</small>
        </div>
      </section>

      <section id="analytics" className="cx-hero pt-50">
        <img
          src={currentSec2}
          alt="Cortexa reporting, analytics, pipeline and team activity dashboards"
          width="1774"
          height="887"
          loading="lazy"
          decoding="async"
        />
      </section>
      <section id="workspace" className="cx-team-showcase">
        <div className="cx-team-shell">
          <div className="cx-team-main">
            <div className="cx-team-copy">
              <div className="cx-team-eyebrow"><span />{tr.teamShowcase.eyebrow}<span /></div>
              <h2>{tr.teamShowcase.title1}<br />{tr.teamShowcase.title2}<br />{tr.teamShowcase.title3} <strong>{tr.teamShowcase.accent}</strong></h2>
              <p className="cx-team-intro">{tr.teamShowcase.subtitle}</p>
              <div className="cx-team-benefits">
                {[Users2, ClipboardList, CheckCircle2].map((Icon, i) => (
                  <div className="cx-team-benefit" key={tr.teamShowcase.benefits[i].title}>
                    <span className={`cx-team-benefit-icon cx-team-benefit-${i + 1}`}><Icon size={31} /></span>
                    <div><h3>{tr.teamShowcase.benefits[i].title}</h3><p>{tr.teamShowcase.benefits[i].desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="cx-team-actions">
                <a className="cx-team-primary" href="/dashboard/team">{tr.teamShowcase.explore} <ArrowRight size={18}/></a>
                <a className="cx-team-link" href={lp("/editorial/business")}>{tr.teamShowcase.seeHow} <ArrowRight size={17}/></a>
              </div>
            </div>

            <div className="cx-team-browser">
              <div className="cx-team-browser-dots"><i/><i/><i/></div>
              <div className="cx-team-app">
                <div className="cx-team-app-head">
                  <div className="cx-team-brand"><b><i className="cx-team-brand-mark"><span /></i><em>CORTEXA</em></b><span><strong>{tr.teamShowcase.panelTitle}</strong><small>{tr.teamShowcase.panelSub}</small></span></div>
                  <div className="cx-team-search">⌕ &nbsp; {tr.teamShowcase.search}</div>
                  <button>{tr.teamShowcase.createTask}</button>
                </div>
                <div className="cx-team-stats">
                  {[[User, tr.teamShowcase.assigned, '8'],[CalendarDays, tr.teamShowcase.due, '5'],[Users2, tr.teamShowcase.waiting, '3']].map(([Icon,label,n]) => <div className="cx-team-stat" key={label}><Icon size={27}/><span><small>{label}</small><b>{n}</b></span><ChevronRight size={18}/></div>)}
                </div>
                <div className="cx-team-data-grid">
                  <div className="cx-team-table-card">
                    <h3>{tr.teamShowcase.priorities}<a>{tr.teamShowcase.viewAll} →</a></h3>
                    <div className="cx-team-table-head"><span>□ &nbsp; {tr.teamShowcase.task}</span><span>{tr.teamShowcase.customer}</span><span>{tr.teamShowcase.owner}</span><span>{tr.teamShowcase.dueDate}</span><span>{tr.teamShowcase.status}</span></div>
                    {[
                      ['Follow up with Acme consultation','Acme Co.','Sophia','Apr 24, 2024','Due Today'],
                      ['Approve website implementation quote','BrightHome Properties','Marcus','Apr 25, 2024','Review'],
                      ['Prepare onboarding for Rivera Clinic','Rivera Clinic','Elena','Apr 26, 2024','In Progress'],
                      ['Resolve checkout assistance request','Maple & Main','Daniel','Apr 24, 2024','High Priority']
                    ].map((r,i)=><div className="cx-team-table-row" key={r[0]}><span>□ &nbsp; <b>{r[0]}</b></span><span>{r[1]}</span><span className="cx-team-owner"><i>{r[2][0]}</i>{r[2]}</span><span>{r[3]}</span><span><em className={`cx-team-status s${i}`}>{r[4]}</em></span></div>)}
                  </div>
                  <div className="cx-team-activity">
                    <h3>{tr.teamShowcase.activity}<a>{tr.teamShowcase.viewAll} →</a></h3>
                    {[['S','Sophia reassigned a follow-up','Acme Co.','2h ago'],['M','Marcus approved the proposal','BrightHome Properties','3h ago'],['E','Elena added an internal note','Rivera Clinic','5h ago'],['D','Daniel completed the handoff','Maple & Main','1d ago']].map(r=><div className="cx-team-activity-row" key={r[1]}><i>{r[0]}</i><span><b>{r[1]}</b><small>{r[2]}</small></span><time>{r[3]}</time></div>)}
                  </div>
                </div>
                <div className="cx-team-handoffs"><h3>{tr.teamShowcase.handoffs}<a>{tr.teamShowcase.viewAll} →</a></h3>{[['Acme Co.','Sales','Customer Service','Completed','Apr 22, 2024'],['Rivera Clinic','Operations','Client Success','In Progress','Apr 24, 2024'],['Maple & Main','Customer Service','Operations','Pending','Apr 25, 2024']].map((r,i)=><div className="cx-team-handoff-row" key={r[0]}>{r.map((v,j)=><span key={v}>{j===3?<em className={`cx-team-status h${i}`}>{v}</em>:v}</span>)}</div>)}</div>
                <div className="cx-team-float"><Users2 size={28}/><b>{tr.teamShowcase.float}</b></div>
              </div>
            </div>
          </div>
          <div className="cx-team-bottom">
            <strong>{tr.teamShowcase.bottomLead}<br/><span>{tr.teamShowcase.bottomAccent}</span></strong>
            {[['♛',tr.teamShowcase.roles[0]],['♚',tr.teamShowcase.roles[1]],['▥',tr.teamShowcase.roles[2]],['◉',tr.teamShowcase.roles[3]],['⚙',tr.teamShowcase.roles[4]]].map(r=><div className="cx-team-role" key={r[1]}><b>{r[0]}</b><span>{r[1]}</span></div>)}
            <p>{tr.teamShowcase.bottomNote}</p>
          </div>
        </div>
      </section>
      <section id="whatsapp" className="cx-hero pt-50">
        <img
          src={currentSec3}
          alt="Cortexa AI assistant, analytics, follow-up workflows and appointment booking"
          width={(SEC3_SIZE[lang] || SEC3_SIZE.en)[0]}
          height={(SEC3_SIZE[lang] || SEC3_SIZE.en)[1]}
          loading="lazy"
          decoding="async"
        />
      </section>

      <section className="aios-section aios-v2-section cx-web-showcase-v3">
        <div className="cx-web-v3-shell">
          <div className="cx-web-v3-copy">
            <div className="cx-web-v3-eyebrow"><span />{tr.webShowcaseV3.eyebrow}<span /></div>
            <h2>{tr.webShowcaseV3.titleLead}<br/>{tr.webShowcaseV3.titleMiddle}{tr.webShowcaseV3.titleMiddle ? " " : ""}<strong>{tr.webShowcaseV3.titleAccent}</strong></h2>
            <p className="cx-web-v3-intro">{tr.webShowcaseV3.intro}</p>
            <div className="cx-web-v3-benefits">
              {tr.webShowcaseV3.benefits.map((item, index) => {
                const icons = [Sparkles, Target, Link2];
                const Icon = icons[index];
                const tone = ["purple", "blue", "violet"][index];
                return <div className="cx-web-v3-benefit" key={item.title}><span className={`cx-web-v3-benefit-icon ${tone}`}><Icon size={31}/></span><div><h3>{item.title}</h3><p>{item.desc}</p></div></div>;
              })}
            </div>
          </div>
          <div className="cx-web-v3-visual">
            <div className="cx-web-v3-browser">
              <div className="cx-web-v3-browser-dots"><i/><i/><i/></div>
              <div className="cx-web-v3-site-nav"><div className="cx-web-v3-northstar"><span className="cx-web-v3-nmark">A</span><div><b>Northstar</b><small>BUSINESS SERVICES</small></div></div><div className="cx-web-v3-navlinks"><span>{tr.webShowcaseV3.services}</span><span>{tr.webShowcaseV3.about}</span><span>{tr.webShowcaseV3.resources}</span><span>{tr.webShowcaseV3.contact}</span></div><button>{tr.webShowcaseV3.startAgent}</button></div>
              <div className="cx-web-v3-site-hero"><small>{tr.webShowcaseV3.smarter}</small><h3>{tr.webShowcaseV3.heroTitle}</h3><p>{tr.webShowcaseV3.heroDesc}</p><button>{tr.webShowcaseV3.startAgent} <ArrowRight size={16}/></button><div className="cx-web-v3-hero-art"><span>People.<br/>Process.<br/>Progress.</span></div></div>
              <div className="cx-web-v3-site-features"><div><FileText/><b>{tr.webShowcaseV3.expert}</b><small>{tr.webShowcaseV3.expertDesc}</small></div><div><Link2/><b>{tr.webShowcaseV3.simpler}</b><small>{tr.webShowcaseV3.simplerDesc}</small></div><div><Users2/><b>{tr.webShowcaseV3.productive}</b><small>{tr.webShowcaseV3.productiveDesc}</small></div></div>
            </div>
            <div className="cx-web-v3-entry-block"><div className="cx-web-v3-entry-main"><div className="cx-web-v3-entry-title">{tr.webShowcaseV3.entryTitle}</div><div className="cx-web-v3-entry-row"><div><FileText/><span>{tr.webShowcaseV3.forms}</span></div><div><Phone/><span>{tr.webShowcaseV3.phone}</span></div><div><MessagesSquare/><span>{tr.webShowcaseV3.advertising}</span></div><div><MessageSquare/><span>{tr.webShowcaseV3.whatsapp}</span></div></div></div><div className="cx-web-v3-connected"><span><Cpu size={27}/></span><b>{tr.webShowcaseV3.connected}</b></div></div>
            <div className="cx-web-v3-phone"><div className="cx-web-v3-phone-notch"/><div className="cx-web-v3-phone-brand"><span className="cx-web-v3-mini-mark">A</span><b>Northstar</b><i>☰</i></div><small>{tr.webShowcaseV3.smarter}</small><h4>{tr.webShowcaseV3.heroTitle}</h4><p>{tr.webShowcaseV3.heroDesc}</p><button>{tr.webShowcaseV3.startAgent} →</button><div className="cx-web-v3-phone-art">People.<br/>Process.<br/>Progress.</div></div>
            <div className="cx-web-v3-agent"><div className="cx-web-v3-agent-head"><Sparkles size={22}/><b>{tr.webShowcaseV3.agent}</b><span>•••　−</span></div><div className="cx-web-v3-agent-msg"><span><Sparkles size={18}/></span><p>{tr.webShowcaseV3.welcome}</p></div><div className="cx-web-v3-agent-actions"><div><FileText/><span>{tr.webShowcaseV3.exploreServices}</span><ChevronRight/></div><div><CalendarDays/><span>{tr.webShowcaseV3.appointment}</span><ChevronRight/></div><div><Link2/><span>{tr.webShowcaseV3.quote}</span><ChevronRight/></div><div><Headphones/><span>{tr.webShowcaseV3.support}</span><ChevronRight/></div></div><div className="cx-web-v3-captured"><CheckCircle2/>{tr.webShowcaseV3.captured}</div><div className="cx-web-v3-chat-input"><span>{tr.webShowcaseV3.message}</span><b><Send size={15}/></b></div></div>
          </div>
          <div className="cx-web-v3-bottom"><h3>{tr.webShowcaseV3.bottomLead} <strong>{tr.webShowcaseV3.bottomAccent}</strong></h3><a href="/web-solutions" onClick={trackCta("web_showcase_web_solutions", tr.webShowcaseV3.explore)}>{tr.webShowcaseV3.explore} <ArrowRight size={19}/></a><p>{tr.webShowcaseV3.note}</p></div>
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
            {tr.titlePre}
            <span>{tr.titleActive}</span>
          </h2>

          <p className="cx-pwr-subtitle">
            {tr.subtitlePre}
            <strong>{tr.subtitlePost}</strong>
          </p>

          <div className="cx-pwr-features-line">
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick">
                <Check size={14} className="cx-pwr-check" />
              </div>
              <span>{tr.feature1}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick">
                <Check size={14} className="cx-pwr-check" />
              </div>
              <span>{tr.feature2}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick">
                <Check size={14} className="cx-pwr-check" />
              </div>
              <span>{tr.feature3}</span>
            </div>
            <div className="cx-pwr-f-divider"></div>
            <div className="cx-pwr-f-item">
              <div className="cx-mini-tick">
                <Check size={14} className="cx-pwr-check" />
              </div>
              <span>{tr.feature4}</span>
            </div>
          </div>
          <img
            src={powerfulImg}
            alt="Apps that connect with Cortexa, including WhatsApp, Gmail, Google Calendar, Slack, HubSpot, Salesforce and Zapier"
            width="1177"
            height="271"
            loading="lazy"
            decoding="async"
          />

          <div className="cx-pwr-footer-banner">
            <div className="cx-pwr-footer-left">
              <div className="cx-pwr-grid-icon-box">
                <Grid size={20} />
              </div>
              <p className="cx-pwr-footer-text">
                <strong>{tr.footerTextPre}</strong>
                <br />
                <span>{tr.footerTextPost}</span>
              </p>
            </div>
            <button
              className="cx-pwr-footer-btn"
              onClick={() => navigate(lp("/integrations"))}
            >
              <span>{tr.btnText}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section id="pipeline" className="cx-hero pt-50">
        <img
          src={currentSec4}
          alt="Cortexa deals pipeline with AI deal scores, stages and next best actions"
          width={(SEC4_SIZE[lang] || SEC4_SIZE.en)[0]}
          height={(SEC4_SIZE[lang] || SEC4_SIZE.en)[1]}
          loading="lazy"
          decoding="async"
        />
      </section>

      <section className="roi-section revenue-action-section pt-50">
        <div className="revenue-action-container">
          <div className="revenue-action-head">
            <span className="revenue-action-eyebrow">
              {tr.revenueActionEyebrow}
            </span>
            <h2 className="revenue-action-title">
              {tr.revenueActionTitleLead}{" "}
              <strong>{tr.revenueActionTitleAccent}</strong>
            </h2>
            <p className="revenue-action-sub">{tr.revenueActionSub}</p>
            <a
              href={lp("/trial?flow=free-access&plan=free")}
              className="revenue-action-btn"
              onClick={trackCta("revenue_action_get_started", tr.heroCTA)}
            >
              {tr.heroCTA}
            </a>
          </div>

        </div>
      </section>

      <section id="ai-assistant" className="cx-customer-experiences">
        <div className="cx-customer-experiences-shell">
          <div className="cx-customer-experiences-eyebrow">
            <span />
            {customerExperience.eyebrow}
            <span />
          </div>

          <h2 className="cx-customer-experiences-title">
            {customerExperience.titleLead}{" "}
            <span>{customerExperience.titleAccent}</span>
          </h2>

          <p className="cx-customer-experiences-subtitle">
            {customerExperience.subtitle}
          </p>

          <div className="cx-customer-testimonials">
            {customerExperience.testimonials.map((item, index) => {
              const avatars = [
                customerClinicManagerImg,
                customerSalesDirectorImg,
                customerBusinessOwnerImg,
              ];

              return (
                <article className="cx-customer-testimonial" key={`${item.role}-${index}`}>
                  <div className="cx-customer-sample-label">
                    {customerExperience.sampleLabel}
                  </div>

                  <div className="cx-customer-quote-mark">“</div>

                  <blockquote>{item.quote}</blockquote>

                  <div className="cx-customer-quote-line" />

                  <div className="cx-customer-person">
                    <img
                      src={avatars[index]}
                      alt=""
                      width="102"
                      height="102"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <strong>{item.role}</strong>
                      <span>{item.workspace}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="cx-customer-experiences-cta">
            <p>{customerExperience.ready}</p>
            <a
              href={lp("/trial?flow=free-access&plan=free")}
              className="cx-customer-get-started"
              onClick={trackCta("customer_experiences_get_started", customerExperience.cta)}
            >
              <span>{customerExperience.cta}</span>
              <ArrowRight size={24} />
            </a>
            <a href="#features" className="cx-customer-explore">
              {customerExperience.explore}
            </a>
          </div>
        </div>
      </section>
      {/* TRUST */}
      <section className="cx-trust cx-center pt-50 cx-customer-journey-image-section">
        <div className="cx-customer-journey-image-wrap">
          <img
            src={currentCustomerJourneyImg}
            alt="Cortexa connected customer journey: website, advertising, phone and WhatsApp leads flow through the AI agent into the CRM, the right workspace and pipeline"
            className="cx-customer-journey-image"
            width="1672"
            height="941"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="cx-faq cx-center pt-50">
        <div className="cx-faq-shell">
          <div className="cx-faq-eyebrow">
            <span />{tr.faqEyebrow}<span />
          </div>
          <h2 className="cx-faq-title">
            {tr.faqTitleLead} <span>{tr.faqTitleAccent}</span>
          </h2>
          <p className="cx-faq-subtitle">{tr.faqSubtitle}</p>

          <div className="cx-faq-list">
            {tr.faq.map((item, index) => {
              const isOpen = activeFAQ === index;
              return (
                <div className={`cx-faq-item ${isOpen ? "active" : ""}`} key={index}>
                  <button
                    type="button"
                    className="cx-faq-q"
                    onClick={() => setActiveFAQ(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="cx-faq-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  <div className="cx-faq-a" hidden={!isOpen}>{item.a}</div>
                </div>
              );
            })}
          </div>

          <div className="cx-faq-contact">
            <h3>{tr.faqCtaTitle}</h3>
            <a href={lp("/contact")} className="cx-faq-contact-btn">
              {tr.faqCta} <ArrowRight size={18} />
            </a>
            <p>{tr.faqCtaNote}</p>
          </div>
        </div>
      </section>
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
        <div className="cx-final-box">
          <h2 className="cx-title-lg" style={{ color: "#fff" }}>
            {tr.finalTitle}
          </h2>

          <p className="cx-sub">
            {tr.finalDesc} <span className="text-os">{tr.finalDesc1}</span>
          </p>

          <a
            href={lp("/trial?flow=free-access&plan=free")}
            className="cx-btn cx-btn-secondary"
            onClick={trackCta("final_get_started", tr.heroCTA)}
          >
            <Zap size={22} />
            {tr.heroCTA}
          </a>

          <i>
            Product demo — the names, numbers, and activity shown are sample
            data for illustration only, not real customer results.
          </i>
          <div className="cx-final-shot">
            <img
              src={trialmobileImg}
              className="desktop-none"
              alt="Cortexa Agentic CRM dashboard preview"
              width="1914"
              height="822"
              loading="lazy"
              decoding="async"
            />
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
                <img
                  src={footdarklogo}
                  alt="Cortexa Agentic CRM"
                  className="landing-logo"
                  width="293"
                  height="58"
                  loading="lazy"
                  decoding="async"
                />

                <p>{tr.footerDescription}</p>

                <a
                  href={lp("/trial?flow=free-access&plan=free")}
                  className="btn-primary"
                  onClick={trackCta("footer_get_started", tr.heroCTA)}
                >
                  <Zap size={18} />
                  {tr.heroCTA}
                </a>

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
                    <HashLink smooth to={lp("/features")}>
                      {tr.features}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/features#ai-assistant")}>
                      {tr.aiAssistant}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/features#automations")}>
                      {tr.automations}
                    </HashLink>
                  </li>
                  <li>
                    <a href={lp("/integrations")}>{tr.integrations}</a>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/features#analytics")}>
                      {tr.analytics}
                    </HashLink>
                  </li>
                  <li>
                    <a href={lp("/pricing")} onClick={trackCta("footer_pricing", tr.pricing)}>{tr.pricing}</a>
                  </li>
                  <li>
                    <a href={lp("/editorial/the-end-of-legacy-crm")}>
                      Cost Calculator
                    </a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.getStarted}</h3>
                <ul>
                  <li>
                    <a href={lp("/trial?flow=free-access&plan=free")} onClick={trackCta("footer_col_get_started", tr.getStarted)}>{tr.getStarted}</a>
                  </li>
                  <li>
                    <a href={lp("/sign-in")}>{tr.login}</a>
                  </li>
                  <li>
                    <a href={lp("/setup-guide")}>{tr.setupGuide}</a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.connect}</h3>
                <ul>
                  <li>
                    <HashLink smooth to={lp("/integrations#connect-apps")}>
                      {tr.connectApps}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/integrations#import-crm")}>
                      {tr.importCrm}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/integrations#import-csv")}>
                      {tr.importCsv}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/integrations#zapier-automations")}>
                      {tr.zapierAutomation}
                    </HashLink>
                  </li>
                  <li>
                    <HashLink smooth to={lp("/integrations#api-webhooks")}>
                      {tr.apiWebhooks}
                    </HashLink>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.support}</h3>
                <ul>
                  <li>
                    <a href={lp("/support")}>{tr.support247}</a>
                  </li>
                  <li>
                    <a href={lp("/help")}>{tr.helpCenter}</a>
                  </li>
                  <li>
                    <a href={lp("/contact")}>{tr.contactUs}</a>
                  </li>
                  <li>
                    <a href={lp("/about")}>{tr.aboutUs}</a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.legal}</h3>
                <ul>
                  <li>
                    <a href={lp("/terms")}>{tr.terms}</a>
                  </li>
                  <li>
                    <a href={lp("/privacy-policy")}>{tr.privacyPolicy}</a>
                  </li>
                  <li>
                    <a href={lp("/refund-policy")}>{tr.refundPolicy}</a>
                  </li>
                  <li>
                    <a href={lp("/cancellation")}>{tr.cancellationPolicy}</a>
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