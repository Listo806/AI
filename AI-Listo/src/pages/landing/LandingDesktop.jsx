import { useState, useEffect } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
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
  CheckCircle2,
  Link2,
  Check,
  Grid,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Infinity,
  BadgeDollarSign,
  UserRoundPlus,
  BriefcaseBusiness,
  BadgePercent,
  CalendarDays,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import "./LandingDesktop.css";

import footdarklogo from "../../assets/cortexa/footlogo.png";
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

import x3xImg from "../../assets/cortexa/3x.png";
import powerfulImg from "../../assets/cortexa/powerful.png";
import workspaceImg from "../../assets/cortexa/workspace.png";
import workspaceImgES from "../../assets/cortexa/workspaceES.png";
import workspaceImgPT from "../../assets/cortexa/workspacePT.png";

import sect2 from "../../assets/cortexa/sect2.png";
import sect2ES from "../../assets/cortexa/sect2es.png";
import sect2PT from "../../assets/cortexa/sect2pt.png";

import aiosIntegrationSalesforce from "../../assets/cortexa/aios-integration-salesforce.png";
import aiosIntegrationGoogle from "../../assets/cortexa/aios-integration-google.png";
import aiosIntegrationMicrosoft from "../../assets/cortexa/aios-integration-microsoft.png";
import aiosIntegrationWhatsapp from "../../assets/cortexa/aios-integration-whatsapp.png";
import aiosIntegrationMail from "../../assets/cortexa/aios-integration-mail.png";
import aiosIntegrationMore from "../../assets/cortexa/aios-integration-more.png";

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

      trustSectionTitlePre: "Everything You Need. ",
      trustSectionTitlePost: "Built to Grow Revenue.",
      trustSectionSub:
        "One connected platform. Every feature works together to help you capture more leads, close more deals, and ",
      trustSectionSub1: "grow your business",
      trustSectionSub2: " — while ",
      trustSectionSub3: "keeping more capital in your business.",

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
            "Manage conversations",
            "Use templates",
          ],
        },

        leads: {
          title: "Leads",
          items: [
            "Capture from any source",
            "Auto-assign, tag & score",
            "Organize & manage leads",
            "Keep your pipeline full",
          ],
        },

        pipeline: {
          title: "Pipeline",
          items: [
            "Visual deal pipeline",
            "Drag, drop & move deals",
            "Set reminders & tasks",
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
          title: "Cortexa AI",
          items: [
            "AI assistant for your business",
            "Answers & suggests actions",
            "Helps with daily tasks",
            "Works across your data",
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
            "Keep your database clean",
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
            "Automate key workflows",
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
      revenueOverviewCta: "Start Your Free Trial",
      revenueOverviewNoCard: "No credit card required",
      revenueOverviewCancel: "Cancel anytime",

      aiosV2Eyebrow: "ALL-IN-ONE REVENUE OPERATING SYSTEM",
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

      heroTitleLine1: "Agentic",
      heroTitleLine2: "AI",
      heroTitleLine3: "Revenue",
      heroTitleLine31: "Operating System",
      heroTitleLine4: "Built to Turn",
      heroTitleLine5: "Conversations",
      heroTitleLine6: "Into Revenue.",
      heroSubtitle:
        "Capture, follow up, and close — all in one system. Connect all your apps so your listings, leads, and data flow into one place automatically.",
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
      heroNoCard: "14-Day Free Trial",
      heroFreeForever: "Starting at $7",
      heroUnlock: "Unlock potential today!",
      heroTag1: "One AI Platform. Everything Connected.",
      heroTag2: "AI-Assisted Follow-Up Workflows",
      heroTag3: "Customer Follow-Up Workflows",
      heroTag4: "Pipeline Intelligence That Closes",
      heroTag5: "WhatsApp Integration Built-in",
      heroTag6: "Secure. Reliable. Built for Real Estate.",
      heroHead: "Built to Help Businesses Automate, Operate and Grow Revenue",

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
      topHighlight: "Agentic AI revenue operating system",
      topLine3:
        "for bussinesses tired of complicated, overpriced CRM software.",
      pricing: "Pricing",

      finalTitle: "Connect Your Entire Workflow",
      finalDesc: "Leads. Opportunities. Deals. All in your",
      finalDesc1: "Revenue OS",

      footerDescription: "AI Leads.   AI Qualifies.  AI CLoses.",

      startFreeTrial: "Get Started",
      startYourFreeTrial: "Start Your Free Trial →",

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

      trustSectionTitlePre: "Todo lo que necesitas. ",
      trustSectionTitlePost: "Diseñado para aumentar tus ingresos.",
      trustSectionSub:
        "Una plataforma conectada. Cada función trabaja en conjunto para ayudarte a captar más leads, cerrar más negocios y ",
      trustSectionSub1: "hacer crecer tu negocio",
      trustSectionSub2: " — mientras ",
      trustSectionSub3: "mantienes más capital en tu negocio.",

      trustFeatures: {
        dashboard: {
          title: "Panel",
          items: [
            "Vista general en tiempo real",
            "Seguimiento de leads y negocios",
            "Métricas clave de un vistazo",
            "Supervisa el rendimiento del equipo",
          ],
        },

        whatsapp: {
          title: "WhatsApp",
          items: [
            "Totalmente integrado",
            "Conecta mediante código QR",
            "Gestiona conversaciones",
            "Usa plantillas",
          ],
        },

        leads: {
          title: "Leads",
          items: [
            "Captación desde cualquier fuente",
            "Asignación, etiquetado y puntuación automáticos",
            "Organiza y gestiona tus leads",
            "Mantén tu pipeline lleno",
          ],
        },

        pipeline: {
          title: "Pipeline",
          items: [
            "Pipeline visual de negocios",
            "Arrastra, suelta y mueve negocios",
            "Configura recordatorios y tareas",
            "Enfócate en lo que genera cierres",
          ],
        },

        properties: {
          title: "Propiedades",
          items: [
            "Añade y gestiona propiedades",
            "Comparte por WhatsApp o mediante un enlace",
            "Haz seguimiento de visitas y consultas",
            "Organiza por estado, tipo y precio",
          ],
        },

        cortexa: {
          title: "Cortexa AI",
          items: [
            "Asistente de IA para tu negocio",
            "Responde y sugiere acciones",
            "Te ayuda con las tareas diarias",
            "Funciona con todos tus datos",
          ],
        },

        analytics: {
          title: "Analítica",
          items: [
            "Informes avanzados",
            "Haz seguimiento de fuentes e ingresos",
            "Mide el rendimiento",
            "Toma decisiones basadas en datos",
          ],
        },

        contacts: {
          title: "Contactos",
          items: [
            "Guarda todos tus contactos",
            "Consulta conversaciones y notas",
            "Segmenta y filtra fácilmente",
            "Mantén limpia tu base de datos",
          ],
        },

        workspace: {
          title: "Espacio de trabajo del equipo",
          badge: "NUEVO",
          items: [
            "Tableros de tareas estilo Kanban",
            "Asigna leads y tareas",
            "Haz seguimiento del rendimiento individual",
            "Feed de actividad en tiempo real",
          ],
        },

        apps: {
          title: "Apps e integraciones",
          items: [
            "Conecta tus herramientas favoritas",
            "Automatiza flujos de trabajo clave",
            "Ahorra tiempo y trabaja de forma más inteligente",
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
      revenueOverviewCta: "Comienza Tu Prueba Gratis",
      revenueOverviewNoCard: "No se requiere tarjeta de crédito",
      revenueOverviewCancel: "Cancela cuando quieras",

      aiosV2Eyebrow: "SISTEMA OPERATIVO DE INGRESOS TODO EN UNO",
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

      heroTitleLine1: "Agentic",
      heroTitleLine2: "IA",
      heroTitleLine3: "de Ingresos",
      heroTitleLine31: "Sistema Operativo",
      heroTitleLine4: "Diseñado para convertir",
      heroTitleLine5: "las conversaciones",
      heroTitleLine6: "en ingresos.",
      heroSubtitle:
        "Captura, da seguimiento y cierra — todo en un solo sistema. Conecta todas tus aplicaciones para que tus propiedades, leads y datos fluyan automáticamente en un solo lugar.",
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
      heroNoCard: "Prueba gratuita de 14 días",
      heroFreeForever: "Desde $7",
      heroUnlock: "¡Desbloquea tu potencial hoy!",
      heroTag1: "Una plataforma de IA. Todo conectado.",
      heroTag2: "Flujos de seguimiento asistidos por IA",
      heroTag3: "Flujos de seguimiento de clientes",
      heroTag4: "Inteligencia de pipeline que cierra ventas",
      heroTag5: "Integración de WhatsApp incorporada",
      heroTag6: "Segura. Confiable. Diseñada para el sector inmobiliario.",
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
      topHighlight: "Sistema operativo de ingresos con IA agéntica",
      topLine3:
        "simple para empresas cansadas de software CRM complicado y demasiado costoso.",
      pricing: "Precios",

      finalTitle: "Conecta Todo Tu Flujo de Trabajo",
      finalDesc: "Leads. Oportunidades. Negocios. Todo en tu ",
      finalDesc1: "Revenue OS",

      footerDescription: "AI Leads. AI Califica. AI Cierra.",

      startFreeTrial: "Comenzar",
      startYourFreeTrial: "Comienza Tu Prueba Gratis →",

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

      trustSectionTitlePre: "Tudo o que você precisa. ",
      trustSectionTitlePost: "Feito para aumentar sua receita.",
      trustSectionSub:
        "Uma plataforma conectada. Cada recurso trabalha em conjunto para ajudar você a captar mais leads, fechar mais negócios e ",
      trustSectionSub1: "fazer seu negócio crescer",
      trustSectionSub2: " — enquanto ",
      trustSectionSub3: "mantém mais capital no seu negócio.",

      trustFeatures: {
        dashboard: {
          title: "Painel",
          items: [
            "Visão geral em tempo real",
            "Acompanhe leads e negócios",
            "Métricas principais de forma rápida",
            "Monitore o desempenho da equipe",
          ],
        },

        whatsapp: {
          title: "WhatsApp",
          items: [
            "Totalmente integrado",
            "Conecte via código QR",
            "Gerencie conversas",
            "Use modelos",
          ],
        },

        leads: {
          title: "Leads",
          items: [
            "Capte leads de qualquer fonte",
            "Atribuição, etiquetagem e pontuação automáticas",
            "Organize e gerencie seus leads",
            "Mantenha seu pipeline cheio",
          ],
        },

        pipeline: {
          title: "Pipeline",
          items: [
            "Pipeline visual de negócios",
            "Arraste, solte e mova negócios",
            "Defina lembretes e tarefas",
            "Concentre-se no que gera fechamentos",
          ],
        },

        properties: {
          title: "Imóveis",
          items: [
            "Adicione e gerencie imóveis",
            "Compartilhe pelo WhatsApp ou por link",
            "Acompanhe visualizações e consultas",
            "Organize por status, tipo e preço",
          ],
        },

        cortexa: {
          title: "Cortexa AI",
          items: [
            "Assistente de IA para o seu negócio",
            "Responde e sugere ações",
            "Ajuda nas tarefas diárias",
            "Funciona com todos os seus dados",
          ],
        },

        analytics: {
          title: "Analytics",
          items: [
            "Relatórios avançados",
            "Acompanhe fontes e receita",
            "Meça o desempenho",
            "Tome decisões baseadas em dados",
          ],
        },

        contacts: {
          title: "Contatos",
          items: [
            "Armazene todos os seus contatos",
            "Visualize conversas e notas",
            "Segmente e filtre facilmente",
            "Mantenha seu banco de dados organizado",
          ],
        },

        workspace: {
          title: "Espaço de trabalho da equipe",
          badge: "NOVO",
          items: [
            "Quadros de tarefas no estilo Kanban",
            "Atribua leads e tarefas",
            "Acompanhe o desempenho individual",
            "Feed de atividades em tempo real",
          ],
        },

        apps: {
          title: "Apps e integrações",
          items: [
            "Conecte suas ferramentas favoritas",
            "Automatize fluxos de trabalho importantes",
            "Economize tempo e trabalhe de forma mais inteligente",
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
      revenueOverviewCta: "Comece Seu Teste Grátis",
      revenueOverviewNoCard: "Nenhum cartão de crédito necessário",
      revenueOverviewCancel: "Cancele quando quiser",

      aiosV2Eyebrow: "SISTEMA OPERACIONAL DE RECEITA TUDO EM UM",
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

      heroTitleLine1: "Agentic",
      heroTitleLine2: "IA",
      heroTitleLine3: "de Receita",
      heroTitleLine31: "Sistema Operacional",
      heroTitleLine4: "Criado para transformar",
      heroTitleLine5: "conversas",
      heroTitleLine6: "em receita.",

      heroSubtitle:
        "Capture, acompanhe e feche — tudo em um único sistema. Conecte todos os seus aplicativos para que seus imóveis, leads e dados fluam automaticamente em um só lugar.",
      herotextabove:
        "A IA organiza. A IA qualifica. Você faz o acompanhamento. Você fecha.",
      heroCheck5: "Seu agente de IA encontra e qualifica leads automaticamente",
      heroCheck6:
        "Tu agente de IA encuentra, capta y califica clientes potenciales automáticamente.",
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
      heroNoCard: "Teste grátis de 14 dias",
      heroFreeForever: "A partir de US$ 7",
      heroUnlock: "Desbloqueie seu potencial hoje!",
      heroTag1: "Uma plataforma de IA. Tudo conectado.",
      heroTag2: "Fluxos de acompanhamento assistidos por IA",
      heroTag3: "Fluxos de acompanhamento de clientes",
      heroTag4: "Inteligência de pipeline que fecha negócios",
      heroTag5: "Integração nativa com WhatsApp",
      heroTag6: "Segura. Confiável. Feita para o mercado imobiliário.",
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
      topHighlight: "Sistema operacional de receita com IA agéntica",
      topLine3:
        "simples para empresas cansadas de softwares de CRM complicados e caros.",
      pricing: "Preços",

      finalTitle: "Conecte Todo o Seu Fluxo de Trabalho",
      finalDesc: "Leads. Oportunidades. Negócios. Tudo no seu ",
      finalDesc1: "Revenue OS",

      footerDescription: "IA Gera Leads. IA Qualifica. IA Fecha.",

      startFreeTrial: "Começar",
      startYourFreeTrial: "Comece Seu Teste Grátis →",

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
              // Testimonials section removed (was illustrative/sample content); skip its nav link.
              if (ids[i] === "testimonials") return null;

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
            <a className="nav-menu" href="/editorial/the-end-of-legacy-crm">
              Cost Calculator
            </a>
          </nav>

          <div className="cx-actions">
            <a href="/trial?flow=free-access&plan=free" className="cx-btn cx-btn-primary- small">
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
                <span className="hero-head1 hero-head">AI REVENUE OS</span>
                <br />
                <span className="hero-head">{tr.heroHead}</span>
              </div>
              <h1 className="hero-title">
                <span className="text-os">{tr.heroTitleLine2}</span>{" "}
                {tr.heroTitleLine3}
                <br />
                {tr.heroTitleLine31} <br />
                {tr.heroTitleLine4} <br />
                {tr.heroTitleLine5} <br />
                <span> {tr.heroTitleLine6}</span>
              </h1>
              <div className="hero-checks">
                <p>{tr.herotextabove}</p>
              </div>
              <div className="hero-inline hero-inline-free-access">
                <a
                  href="/trial?flow=free-access&plan=free"
                  className="hero-btn hero-btn-trial hero-btn-free-access-main"
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
              <img src={herorightImg} />
              <i>
                Product demo — the names, numbers, and activity shown are sample
                data for illustration only, not real customer results.
              </i>
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
        <img src={currentSect2} alt="features" />
      </section>
      <section id="analytics" className="cx-hero pt-50">
        <img src={currentSec2} alt="analytics" />
        <i>
          Product demo — the names, numbers, and activity shown are sample data
          for illustration only, not real customer results.
        </i>
      </section>
      <section id="workspace">
        <div className="aios-container">
          <img src={workspace} alt="workspace" />
        </div>
      </section>
      <section id="whatsapp" className="cx-hero pt-50">
        <img src={currentSec3} alt="" />
      </section>

      <section className="aios-section aios-v2-section">
        <div className="aios-v2-container">
          <div className="aios-v2-header">
            <div className="aios-v2-eyebrow">{tr.aiosV2Eyebrow}</div>

            <h2 className="aios-v2-title">
              <span>{tr.aiosV2TitleLead} </span>
              <strong>{tr.aiosV2TitleAccent}</strong>
            </h2>

            <p className="aios-v2-subtitle">{tr.aiosV2Subtitle}</p>
          </div>

          <div className="aios-v2-grid">
            <article className="aios-v2-card">
              <div className="aios-v2-card-icon">
                <User size={34} strokeWidth={2.4} />
              </div>
              <h3>{tr.aiosV2Cards[0].title}</h3>
              <div className="aios-v2-card-line" />
              <p>{tr.aiosV2Cards[0].desc}</p>

              <div className="aios-v2-preview aios-v2-crm-preview">
                {[
                  ["John Smith", "New Lead"],
                  ["Sarah Johnson", "Follow-Up"],
                  ["Mike Brown", "Client"],
                ].map((row, index) => (
                  <div className="aios-v2-person-row" key={row[0]}>
                    <span className={`aios-v2-avatar avatar-${index + 1}`}>
                      {row[0]
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <b>{row[0]}</b>
                    <small>{row[1]}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="aios-v2-card">
              <div className="aios-v2-card-icon">
                <Workflow size={34} strokeWidth={2.4} />
              </div>
              <h3>{tr.aiosV2Cards[1].title}</h3>
              <div className="aios-v2-card-line" />
              <p>{tr.aiosV2Cards[1].desc}</p>

              <div className="aios-v2-preview aios-v2-pipeline-preview">
                {[
                  ["New", "$125K"],
                  ["Qualified", "$210K"],
                  ["Proposal", "$175K"],
                  ["Won", "$320K"],
                ].map((item, index) => (
                  <div
                    className={`aios-v2-pipeline-col p${index + 1}`}
                    key={item[0]}
                  >
                    <b>{item[0]}</b>
                    <span>
                      <i />
                    </span>
                    <small>{item[1]}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="aios-v2-card">
              <div className="aios-v2-card-icon">
                <BarChart3 size={34} strokeWidth={2.4} />
              </div>
              <h3>{tr.aiosV2Cards[2].title}</h3>
              <div className="aios-v2-card-line" />
              <p>{tr.aiosV2Cards[2].desc}</p>

              <div className="aios-v2-preview aios-v2-dashboard-preview">
                <div className="aios-v2-dash-stats">
                  <div className="aios-v2-dash-stat">
                    <span>Revenue</span>
                    <strong>$1.25M</strong>
                    <small>▲ 18%</small>
                  </div>

                  <div className="aios-v2-dash-stat">
                    <span>Deals</span>
                    <strong>156</strong>
                    <small>▲ 15%</small>
                  </div>
                </div>

                <div className="aios-v2-mini-chart">
                  <span className="aios-v2-chart-grid grid-1" />
                  <span className="aios-v2-chart-grid grid-2" />
                  <span className="aios-v2-chart-grid grid-3" />

                  <svg
                    viewBox="0 0 210 105"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="smartChartFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6d3df5"
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="100%"
                          stopColor="#6d3df5"
                          stopOpacity="0.015"
                        />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="
                          4,92
                          27,73
                          49,81
                          70,57
                          92,64
                          115,39
                          136,48
                          158,22
                          181,31
                          206,5
                          206,105
                          4,105
                        "
                      fill="url(#smartChartFill)"
                    />

                    <polyline
                      points="
                            4,92
                            27,73
                            49,81
                            70,57
                            92,64
                            115,39
                            136,48
                            158,22
                            181,31
                            206,5
                          "
                      fill="none"
                      stroke="#5733ef"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </article>

            <article className="aios-v2-card">
              <div className="aios-v2-card-icon">
                <CheckCircle2 size={34} strokeWidth={2.4} />
              </div>
              <h3>{tr.aiosV2Cards[3].title}</h3>
              <div className="aios-v2-card-line" />
              <p>{tr.aiosV2Cards[3].desc}</p>

              <div className="aios-v2-preview aios-v2-workflow-preview">
                {[
                  ["Task Assignment", "Done"],
                  ["Follow-Up Reminder", "In Progress"],
                  ["Deal Update", "Pending"],
                  ["Approval Request", "Done"],
                ].map((row, index) => (
                  <div className="aios-v2-workflow-row" key={row[0]}>
                    <CheckCircle2 size={13} />
                    <span>{row[0]}</span>
                    <small className={`workflow-status s${index + 1}`}>
                      {row[1]}
                    </small>
                  </div>
                ))}
              </div>
            </article>

            <article className="aios-v2-card">
              <div className="aios-v2-card-icon">
                <Puzzle size={34} strokeWidth={2.4} />
              </div>
              <h3>{tr.aiosV2Cards[4].title}</h3>
              <div className="aios-v2-card-line" />
              <p>{tr.aiosV2Cards[4].desc}</p>

              <div className="aios-v2-preview aios-v2-integrations-preview">
                {[
                  [aiosIntegrationSalesforce, "Salesforce"],
                  [aiosIntegrationGoogle, "Google"],
                  [aiosIntegrationMicrosoft, "Microsoft"],
                  [aiosIntegrationWhatsapp, "WhatsApp"],
                  [aiosIntegrationMail, "Email"],
                  [aiosIntegrationMore, "More integrations"],
                ].map(([src, alt]) => (
                  <span className="aios-v2-integration-tile" key={alt}>
                    <img src={src} alt={alt} />
                  </span>
                ))}
              </div>
            </article>
          </div>

          <div className="how-v2-block">
            <h2 className="how-v2-title">{tr.howTitle}</h2>
            <div className="how-v2-underline" />

            <div className="how-v2-grid">
              {tr.howV2Steps.map((step, index) => {
                const StepIcon = [Link2, Workflow, TrendingUp][index];

                return (
                  <div className="how-v2-step-wrap" key={step.title}>
                    <article className="how-v2-card">
                      <div className="how-v2-number">{index + 1}</div>
                      <div className="how-v2-icon">
                        <StepIcon size={32} strokeWidth={2.5} />
                      </div>
                      <div className="how-v2-content">
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                      </div>
                    </article>

                    {index < tr.howV2Steps.length - 1 && (
                      <div className="how-v2-arrow">→</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="aios-v2-benefits">
            {tr.aiosV2Benefits.map((item, index) => {
              const BenefitIcon = [ShieldCheck, Eye, Zap, Target][index];

              return (
                <div className="aios-v2-benefit" key={item.title}>
                  <div className="aios-v2-benefit-icon">
                    <BenefitIcon size={28} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="aios-v2-bottom">
            <strong>{tr.aiosV2BottomLead}</strong>{" "}
            <span>{tr.aiosV2BottomAccent}</span>
          </p>
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
          <img src={powerfulImg} alt="diagram" />

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
            <button className="cx-pwr-footer-btn">
              <span>{tr.btnText}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="smart smart-v2">
        <div className="smart-v2-container">
          <div className="smart-v2-head">
            <span className="smart-v2-badge">{tr.smartV2Badge}</span>

            <h2 className="smart-v2-title">
              <span>{tr.smartV2Title1}</span>
              <br />
              <span>{tr.smartV2Title2} </span>
              <strong>{tr.smartV2TitleAccent}</strong>
            </h2>

            <p className="smart-v2-subtitle">{tr.smartV2Subtitle}</p>
          </div>

          <div className="smart-v2-steps">
            {tr.smartV2Steps.map((step, index) => (
              <div className="smart-v2-step-wrap" key={step.title}>
                <div className="smart-v2-step">
                  <div className="smart-v2-step-number">{index + 1}</div>
                  <div className="smart-v2-step-copy">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>

                {index < tr.smartV2Steps.length - 1 && (
                  <div className="smart-v2-step-arrow">
                    <span />
                    <ChevronRight size={22} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="smart-v2-main-grid">
            <article className="smart-v2-panel smart-v2-source-panel">
              <h3>Lead Source Overview</h3>

              <div className="smart-v2-source-content">
                <div className="smart-v2-source-list">
                  {[
                    ["Website", "1,248", "globe"],
                    ["Google Ads", "842", "google"],
                    ["Facebook Ads", "624", "facebook"],
                    ["Referrals", "312", "referral"],
                    ["Other Sources", "198", "other"],
                  ].map(([label, value, type]) => (
                    <div className="smart-v2-source-row" key={label}>
                      <span className={`smart-v2-source-icon ${type}`}>
                        {type === "google"
                          ? "G"
                          : type === "facebook"
                            ? "f"
                            : "◉"}
                      </span>
                      <b>{label}</b>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="smart-v2-leads-donut-wrap">
                  <div className="smart-v2-leads-donut">
                    <div>
                      <strong>3,224</strong>
                      <span>Total Leads</span>
                    </div>
                  </div>
                  <p className="smart-v2-leads-growth">▣ +28%</p>
                  <small>vs last 30 days</small>
                </div>
              </div>
            </article>

            <article className="smart-v2-panel smart-v2-pipeline-panel">
              <div className="smart-v2-panel-top">
                <div>
                  <h3>Pipeline Overview</h3>
                  <span>Total Pipeline Value</span>
                  <strong>$2.48M</strong>
                </div>
                <div className="smart-v2-growth">
                  <b>+32.9% ↑</b>
                  <small>vs last 30 days</small>
                </div>
              </div>

              <div className="smart-v2-pipeline-stages">
                {[
                  ["New Leads", "128", "$320K"],
                  ["Qualified", "64", "$540K"],
                  ["Proposal", "32", "$680K"],
                  ["Negotiation", "16", "$420K"],
                  ["Closed Won", "8", "$520K"],
                ].map(([label, value, amount]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{amount}</small>
                  </div>
                ))}
              </div>

              <div className="smart-v2-pipeline-chart">
                <span className="smart-v2-chart-label">$3M</span>
                <span className="smart-v2-chart-label l2">$2M</span>
                <span className="smart-v2-chart-label l3">$1M</span>

                <svg
                  viewBox="0 0 520 160"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="smartRevenueArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#7c3aed"
                        stopOpacity="0.38"
                      />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <polygon
                    points="15,132 65,108 115,95 165,84 215,73 265,98 315,76 365,91 415,61 465,78 510,43 510,150 15,150"
                    fill="url(#smartRevenueArea)"
                  />

                  <polyline
                    points="15,132 65,108 115,95 165,84 215,73 265,98 315,76 365,91 415,61 465,78 510,43"
                    fill="none"
                    stroke="#7c4dff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {[
                    [15, 132],
                    [65, 108],
                    [115, 95],
                    [165, 84],
                    [215, 73],
                    [265, 98],
                    [315, 76],
                    [365, 91],
                    [415, 61],
                    [465, 78],
                    [510, 43],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3.5" fill="#9b6cff" />
                  ))}
                </svg>

                <div className="smart-v2-months">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </article>

            <article className="smart-v2-panel smart-v2-task-panel">
              <h3>Upcoming & Tasks</h3>

              <div className="smart-v2-task-columns">
                <div className="smart-v2-upcoming-card">
                  <h4>Upcoming Appointments</h4>

                  {[
                    ["Project Discovery Call", "Today, 10:00 AM"],
                    ["Demo Presentation", "Tomorrow, 2:00 PM"],
                    ["Proposal Review", "May 16, 11:00 AM"],
                  ].map(([title, time]) => (
                    <div className="smart-v2-appointment" key={title}>
                      <span>
                        <Clock4 size={15} />
                      </span>
                      <p>
                        <b>{title}</b>
                        <small>{time}</small>
                      </p>
                    </div>
                  ))}

                  <a href="#calendar">
                    View Calendar <ChevronRight size={15} />
                  </a>
                </div>

                <div className="smart-v2-tasks-card">
                  <div className="smart-v2-tasks-head">
                    <h4>Tasks</h4>
                    <span>12</span>
                  </div>

                  {[
                    ["Follow up with John S.", "High", "high"],
                    ["Send proposal to ACME", "High", "high"],
                    ["Prepare demo", "Medium", "medium"],
                    ["Contract review", "Medium", "medium"],
                    ["Check in with Sarah", "Low", "low"],
                  ].map(([task, priority, tone]) => (
                    <div className="smart-v2-task-row" key={task}>
                      <i />
                      <span>{task}</span>
                      <small className={tone}>● {priority}</small>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="smart-v2-benefits">
            {tr.smartV2Benefits.map((item, index) => {
              const BenefitIcon = [Eye, GitMerge, Workflow, ChartNoAxesColumn][
                index
              ];

              return (
                <div className="smart-v2-benefit" key={item.title}>
                  <div className="smart-v2-benefit-icon">
                    <BenefitIcon size={29} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="smart-v2-cta">
            <a href="/trial?flow=free-access&plan=free">
              {tr.smartV2Cta}
              <ArrowRight size={20} />
            </a>
          </div>

          <p className="smart-v2-bottom">{tr.smartV2Bottom}</p>
        </div>
      </section>

      <section id="pipeline" className="cx-hero pt-50">
        <img src={currentSec4} alt="" />
        <i>
          Product demo — the names, numbers, and activity shown are sample data
          for illustration only, not real customer results.
        </i>
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
            <a href="/trial?flow=free-access&plan=free" className="revenue-action-btn">
              {tr.heroCTA}
            </a>
          </div>

          <div className="revenue-action-benefits">
            {tr.revenueActionBenefits.map((item, index) => {
              const RevenueIcon = [
                Target,
                CircleDollarSign,
                Workflow,
                ChartNoAxesColumn,
              ][index];
              return (
                <div className="revenue-action-benefit" key={item.title}>
                  <div className="revenue-action-icon">
                    <RevenueIcon size={30} strokeWidth={2.1} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cx-strip revenue-overview-section">
        <div className="revenue-overview-shell">
          <div className="revenue-overview-copy">
            <span className="revenue-overview-eyebrow">
              {tr.revenueOverviewEyebrow}
            </span>
            <h2>{tr.revenueOverviewTitle}</h2>
            <p>{tr.revenueOverviewSub}</p>
            <a href="/trial?flow=free-access&plan=free" className="revenue-overview-btn">
              {tr.revenueOverviewCta} <ArrowRight size={18} />
            </a>
            <div className="revenue-overview-checks">
              <span>
                <CheckCircle2 size={16} />
                {tr.revenueOverviewNoCard}
              </span>
              <span>
                <CheckCircle2 size={16} />
                {tr.revenueOverviewCancel}
              </span>
            </div>
          </div>

          <div className="revenue-dashboard">
            <aside className="revenue-dashboard-sidebar">
              <div className="revenue-dashboard-brand">
                <span>⬡</span>CORTEXA
              </div>
              {[
                ["⌂", "Overview", true],
                ["♙", "Leads"],
                ["⌘", "Pipeline"],
                ["◎", "Contacts"],
                ["✓", "Tasks"],
                ["▣", "Appointments"],
                ["▥", "Reports"],
                ["◇", "Documents"],
                ["⌘", "Integrations"],
                ["⚙", "Settings"],
              ].map(([icon, label, active]) => (
                <div
                  className={`revenue-dashboard-nav ${active ? "active" : ""}`}
                  key={label}
                >
                  <span>{icon}</span>
                  {label}
                </div>
              ))}

              <div className="revenue-sidebar-team-card">
                <span>Team Members</span>
                <strong>24</strong>
                <small>Active users</small>
                <Users2 size={14} />
              </div>
            </aside>

            <div className="revenue-dashboard-main">
              <div className="revenue-dashboard-top">
                <h3>Dashboard Overview</h3>
                <span className="revenue-dashboard-date">
                  <Clock4 size={13} /> May 1 – May 31, 2025{" "}
                  <ChevronRight size={12} />
                </span>
              </div>

              <div className="revenue-dashboard-kpis">
                {[
                  [
                    "Total Revenue",
                    "$2,742,500",
                    "+22%",
                    "green",
                    BadgeDollarSign,
                  ],
                  ["New Leads", "1,325", "+10%", "purple", UserRoundPlus],
                  ["Opportunities", "87", "+15%", "blue", BriefcaseBusiness],
                  ["Win Rate", "24%", "+6%", "green", BadgePercent],
                ].map(([label, value, growth, tone, KpiIcon], index) => (
                  <div className="revenue-dashboard-kpi" key={label}>
                    <div className={`revenue-kpi-icon ${tone}`}>
                      <KpiIcon size={14} strokeWidth={2} />
                    </div>

                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>▲ {growth} vs last month</small>

                    <div className={`revenue-mini-line ${tone}`}>
                      <svg
                        viewBox="0 0 150 42"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id={`kpiArea-${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="currentColor"
                              stopOpacity="0.24"
                            />
                            <stop
                              offset="100%"
                              stopColor="currentColor"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>

                        <polygon
                          points="2,34 18,29 33,31 48,24 64,27 80,18 95,23 110,15 126,18 148,7 148,42 2,42"
                          fill={`url(#kpiArea-${index})`}
                        />
                        <polyline
                          points="2,34 18,29 33,31 48,24 64,27 80,18 95,23 110,15 126,18 148,7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              <div className="revenue-dashboard-middle">
                <div className="revenue-pipeline-card">
                  <h4>Pipeline Overview</h4>
                  <span>Total Pipeline Value</span>
                  <strong>$5,630,000</strong>
                  <div className="revenue-bars">
                    {[
                      ["New", "38%", 38],
                      ["Qualified", "24%", 60],
                      ["Proposal", "33%", 82],
                      ["Negotiation", "17%", 56],
                      ["Closed Won", "8%", 32],
                    ].map(([label, percent, height]) => (
                      <div key={label}>
                        <i style={{ height: `${height}%` }} />
                        <span>{label}</span>
                        <b>{percent}</b>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="revenue-task-card">
                  <h4>Tasks Overview</h4>
                  <div className="revenue-task-content">
                    <div className="revenue-task-donut">
                      <div>
                        <strong>128</strong>
                        <span>Total Tasks</span>
                      </div>
                    </div>
                    <div className="revenue-task-legend">
                      <span>
                        <i className="done" />
                        Completed <b>58</b>
                      </span>
                      <span>
                        <i className="progress" />
                        In Progress <b>36</b>
                      </span>
                      <span>
                        <i className="pending" />
                        Pending <b>24</b>
                      </span>
                      <span>
                        <i className="overdue" />
                        Overdue <b>10</b>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="revenue-dashboard-bottom">
                <div className="revenue-bottom-card revenue-appointments-card">
                  <div className="revenue-bottom-title">
                    <span>Appointments</span>
                    <CalendarDays size={13} />
                  </div>
                  <small>Upcoming This Week</small>
                  <strong>14</strong>
                  <small>Meetings & Appointments</small>
                </div>

                <div className="revenue-bottom-card">
                  <span>Top Activities</span>
                  <small>
                    Calls <b>48 ▲ 12%</b>
                  </small>
                  <small>
                    Emails <b>126 ▲ 20%</b>
                  </small>
                  <small>
                    Meetings <b>24 ▲ 8%</b>
                  </small>
                </div>

                <div className="revenue-bottom-card revenue-performance-card">
                  <span>Team Performance</span>
                  <small>This Month</small>
                  <strong>92%</strong>
                  <div className="revenue-goal-row">
                    <small>Goal Progress</small>
                    <i className="revenue-progress">
                      <b />
                    </i>
                  </div>
                </div>
              </div>
            </div>
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
              <span className="cx-trust-titl">{tr.trustSectionSub3}</span>
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
              <span className="cx-trust-titl">{tr.trustSectionSub3}</span>
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
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
        <div className="cx-final-box">
          <h2 className="cx-title-lg" style={{ color: "#fff" }}>
            {tr.finalTitle}
          </h2>

          <p className="cx-sub">
            {tr.finalDesc} <span className="text-os">{tr.finalDesc1}</span>
          </p>

          <a href="/trial?flow=free-access&plan=free" className="cx-btn cx-btn-secondary">
            <Zap size={22} />
            {tr.heroCTA}
          </a>

          <i>
            Product demo — the names, numbers, and activity shown are sample
            data for illustration only, not real customer results.
          </i>
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
                <img
                  src={footdarklogo}
                  alt="Cortexa"
                  className="landing-logo"
                />

                <p>{tr.footerDescription}</p>

                <a href="/trial?flow=free-access&plan=free" className="btn-primary">
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
                  <li>
                    <a href="/editorial/the-end-of-legacy-crm">
                      Cost Calculator
                    </a>
                  </li>
                </ul>
              </div>

              <div className="footer-col">
                <h3>{tr.getStarted}</h3>
                <ul>
                  <li>
                    <a href="/trial?flow=free-access&plan=free">{tr.getStarted}</a>
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