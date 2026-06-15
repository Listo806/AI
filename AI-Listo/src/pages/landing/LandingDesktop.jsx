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
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import "./LandingDesktop.css";

import footlogo from "../../assets/cortexa/p-flogo.png";
import CountriesCitiesSection from "./CountriesCitiesSection";
import herorightImg from "../../assets/cortexa/hero_right.png";
import trialmobileImg from "../../assets/cortexa/img_desktop_none.png";
import headlogotranImg from "../../assets/cortexa/headlogotran.png";
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

      trial: "Start Free Trial",
      login: "Log in",

      aiosBadge: "ONE CONNECTED WORKSPACE",
      aiosBadge1: "One",
      aiosTitle: "Not a Stack of Add-Ons.",
      aiosDesc1:
        "Most platforms make real estate teams piece together separate products for AI, CRM, marketing, reporting, automation, communication, and data.",
      aiosDesc2:
        "CORTEXA AIOS brings it all into one connected workspace built specifically for real estate — so your team can capture leads, qualify prospects, automate follow-ups, manage pipelines, book appointments, track performance, and stay aligned without juggling multiple tools.",
      aiosCol1Title: "EVERYTHING WORKS TOGETHER FROM DAY ONE.",
      aiosCol2Title: "BUILT TO IMPROVE WHAT MATTERS.",
      aiosLeftItem1: "Your AI Agent handles conversations 24/7.",
      aiosLeftItem2:
        "Your CRM keeps every lead, contact, property, and deal organized.",
      aiosLeftItem3: "Your WhatsApp automation keeps follow-ups moving.",
      aiosLeftItem4:
        "Your pipeline shows exactly where every opportunity stands.",
      aiosLeftItem5: "Your analytics show what's working.",
      aiosLeftItem6:
        "Your team workspace keeps agents, managers, and admins on the same page.",
      aiosNoItem1: "No complicated product menu.",
      aiosNoItem2: "No hidden module maze.",
      aiosNoItem3: "No paying extra just to make the system complete.",
      aiosFooterText:
        "Just one AI-powered operating system built to help real estate teams respond faster, serve clients better, close more deals, and grow with confidence.",
      aiosRightItem1: "Lead response speed",
      aiosRightItem2: "Follow-up consistency",
      aiosRightItem3: "Customer experience",
      aiosRightItem4: "Appointment booking",
      aiosRightItem5: "Pipeline visibility",
      aiosRightItem6: "Team productivity",
      aiosRightItem7: "Lead conversion",
      aiosRightItem8: "Customer retention",
      aiosRightItem9: "Revenue opportunities",
      aiosStatNumber: "35-50%",
      aiosStatLabel: "POTENTIAL PERFORMANCE IMPROVEMENT",
      aiosStatDesc:
        "Across response speed, follow-up consistency, productivity, and conversion opportunities when your team operates from one connected platform.",

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

      trustTitle: "Built to operate with confidence",
      trust: [
        "Generate More Qualified Leads.",
        "See Every Deal Before It Slips.",
        "Forecast Revenue Before Month-End.",
        "Automate Follow-Ups That Close.",
      ],

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
        btn: "Start Your Free Trial →",
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
        btn: "Start Free Trial",
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
      stripBtn: "Start Your Free Trial →",
      stripTrust: "No risk. Cancel anytime.",
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
      roiBtn: "Start Free Trial",
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
        "Your CRM, AI Agent, dashboards, follow-ups, and lead workflow — connected in one real estate AI operating system.",
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
      heroCTA: "Start Your Free Trial",
      heroUnlock: "Unlock potential today!",
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

      topLine1: "Meet Your AI OS. ",
      topLine2: "Powered by",
      topHighlight: "AI Agents",
      topLine3: "that capture, follow up, and close your leads automatically.",
      pricing: "Pricing",

      finalTitle: "Automate Your Entire Workflow",
      finalDesc:
        "CORTEXA captures leads, automates follow-ups, updates your pipeline, and keeps your team moving — so you can focus on closing deals",
      reinforcement: "No credit card required",

      footerDescription:
        "The AI-powered CRM that helps you capture leads, automate follow-ups, and close more deals — faster.",

      startFreeTrial: "Start Free Trial",
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
      trial: "Prueba gratis",
      login: "Iniciar sesión",

      aiosBadge: "UN ESPACIO DE TRABAJO CONECTADO",
      aiosBadge1: "Uno",
      aiosTitle: "No es una pila de herramientas.",
      aiosDesc1:
        "La mayoría de las plataformas obligan a los equipos inmobiliarios a combinar productos separados para IA, CRM, marketing, informes, automatización, comunicación y datos.",
      aiosDesc2:
        "CORTEXA AIOS lo reúne todo en un único espacio de trabajo conectado, diseñado específicamente para el sector inmobiliario, de modo que su equipo pueda captar clientes potenciales, calificar prospectos, automatizar seguimientos, gestionar embudos, programar citas, realizar un seguimiento del rendimiento y mantenerse alineado sin tener que compaginar múltiples herramientas.",
      aiosCol1Title: "TODO FUNCIONA CONJUNTO DESDE EL PRIMER DÍA.",
      aiosCol2Title: "CONSTRUIDO PARA MEJORAR LO QUE IMPORTA.",
      aiosLeftItem1:
        "Su Agente de IA maneja las conversaciones las 24 horas, los 7 días de la semana.",
      aiosLeftItem2:
        "Su CRM mantiene organizados cada cliente potencial, contacto, propiedad y trato.",
      aiosLeftItem3:
        "Su automatización de WhatsApp mantiene los seguimientos en movimiento.",
      aiosLeftItem4:
        "Su embudo de ventas muestra exactamente dónde se encuentra cada oportunidad.",
      aiosLeftItem5: "Sus analíticas muestran lo que está funcionando.",
      aiosLeftItem6:
        "El espacio de trabajo de su equipo mantiene a los agentes, gerentes y administradores en la misma página.",
      aiosNoItem1: "Sin menús de productos complicados.",
      aiosNoItem2: "Sin laberintos de módulos ocultos.",
      aiosNoItem3: "Sin pagar extra solo para completar el sistema.",
      aiosFooterText:
        "Solo un sistema operativo impulsado por IA diseñado para ayudar a los equipos inmobiliarios a responder más rápido, atender mejor a los clientes, cerrar más tratos y crecer con confianza.",
      aiosRightItem1: "Velocidad de respuesta de leads",
      aiosRightItem2: "Consistencia en el seguimiento",
      aiosRightItem3: "Experiencia del cliente",
      aiosRightItem4: "Reserva de citas",
      aiosRightItem5: "Visibilidad del pipeline",
      aiosRightItem6: "Productividad del equipo",
      aiosRightItem7: "Conversión de leads",
      aiosRightItem8: "Retención de clientes",
      aiosRightItem9: "Oportunidades de ingresos",
      aiosStatNumber: "35-50%",
      aiosStatLabel: "MEJORA POTENCIAL DEL RENDIMIENTO",
      aiosStatDesc:
        "En velocidad de respuesta, consistencia de seguimiento, productividad y oportunidades de conversión cuando su equipo opera desde una plataforma conectada.",

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

      trustTitle: "Construido para operar con confianza",
      trust: [
        "Genera más leads calificados.",
        "Ve cada oportunidad antes de que se escape.",
        "Pronostica los ingresos antes de fin de mes.",
        "Automatiza los seguimientos que convierten.",
      ],

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
        btn: "Empieza tu prueba gratuita →",
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
        btn: "Prueba gratis",
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
      stripBtn: "Empieza tu prueba gratis →",
      stripTrust: "Sin riesgo. Cancela en cualquier momento.",
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
      roiBtn: "Prueba gratis",
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
        "Tu CRM, agente IA, paneles, seguimientos y flujo de trabajo conectados en un único sistema operativo inmobiliario.",
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
      heroCTA: "Comienza tu prueba gratuita",
      heroUnlock: "¡Desbloquea tu potencial hoy!",
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

      topLine1: "Conoce tu OS con IA.",
      topLine2: "Impulsado por",
      topHighlight: "Agentes de IA",
      topLine3:
        "que capturan, dan seguimiento y cierran tus leads automáticamente.",
      pricing: "Precios",

      finalTitle: "Automatize todo o seu fluxo de trabalho",
      finalDesc:
        "A CORTEXA captura leads, automatiza acompanhamentos, atualiza seu pipeline e mantém sua equipe em movimento, para que você possa se concentrar em fechar mais negócios",
      reinforcement: "No se requiere tarjeta de crédito",

      footerDescription:
        "El CRM impulsado por IA que te ayuda a captar clientes potenciales, automatizar seguimientos y cerrar más negocios más rápido.",

      startFreeTrial: "Comenzar prueba gratuita",
      startYourFreeTrial: "Comienza tu prueba gratuita →",

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
      trial: "Teste grátis",
      login: "Entrar",

      aiosBadge: "UM ESPAÇO DE TRABALHO CONECTADO",
      aiosBadge1: "Um",
      aiosTitle: "Não é uma pilha de ferramentas.",
      aiosDesc1:
        "A maioria das plataformas faz com que as equipes imobiliárias juntem produtos separados para IA, CRM, marketing, relatórios, automação, comunicação e dados.",
      aiosDesc2:
        "O CORTEXA AIOS traz tudo isso para um espaço de trabalho conectado, construído especificamente para o mercado imobiliário — para que sua equipe possa capturar leads, qualificar prospects, automatizar acompanhamentos, gerenciar pipelines, agendar compromissos, rastrear o desempenho e manter-se alinhada sem fazer malabarismos com várias ferramentas.",
      aiosCol1Title: "TUDO FUNCIONA JUNTO DESDE O PRIMEIRO DIA.",
      aiosCol2Title: "CONSTRUÍDO PARA MELHORAR O QUE IMPORTA.",
      aiosLeftItem1: "Seu Agente de IA lida com conversas 24/7.",
      aiosLeftItem2:
        "Seu CRM mantém todos os leads, contatos, imóveis e negócios organizados.",
      aiosLeftItem3:
        "Sua automação de WhatsApp mantém os acompanhamentos em movimento.",
      aiosLeftItem4:
        "Seu pipeline mostra exatamente onde está cada oportunidade.",
      aiosLeftItem5: "Suas análises mostram o que está funcionando.",
      aiosLeftItem6:
        "O espaço de trabalho da sua equipe mantém corretores, gerentes e administradores na mesma página.",
      aiosNoItem1: "Sem menu de produtos complicado.",
      aiosNoItem2: "Sem labirinto de módulos ocultos.",
      aiosNoItem3: "Sem pagar extra apenas para deixar o sistema completo.",
      aiosFooterText:
        "Apenas um sistema operacional baseado em IA desenvolvido para ajudar as equipes imobiliárias a responder mais rápido, atender melhor os clientes, fechar mais negócios e crescer com confiança.",
      aiosRightItem1: "Velocidade de resposta de leads",
      aiosRightItem2: "Consistência no acompanhamento",
      aiosRightItem3: "Experiência do cliente",
      aiosRightItem4: "Agendamento de compromissos",
      aiosRightItem5: "Visibilidade do pipeline",
      aiosRightItem6: "Produtividade da equipe",
      aiosRightItem7: "Conversão de leads",
      aiosRightItem8: "Retenção de clientes",
      aiosRightItem9: "Oportunidades de receita",
      aiosStatNumber: "35-50%",
      aiosStatLabel: "MELHORIA POTENCIAL DE DESEMPENHO",
      aiosStatDesc:
        "Em velocidade de resposta, consistência de acompanhamento, produtividade e oportunidades de conversão quando sua equipe opera a partir de uma única plataforma conectada.",

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

      trustTitle: "Construído para operar com confiança",
      trust: [
        "Gere mais leads qualificados.",
        "Veja cada oportunidade antes que ela escape.",
        "Preveja a receita antes do fim do mês.",
        "Automatize acompanhamentos que fecham negócios.",
      ],

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
        btn: "Comece seu teste gratuito →",
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
        btn: "Teste grátis",
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
      stripBtn: "Comece seu teste grátis →",
      stripTrust: "Sem risco. Cancele a qualquer momento.",
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
      roiBtn: "Teste grátis",
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
        "Seu CRM, Agente IA, dashboards, follow-ups e fluxo de trabalho conectados em um único sistema operacional imobiliário.",

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
      heroCTA: "Inicie seu teste gratuito",
      heroUnlock: "Desbloqueie seu potencial hoje!",
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

      topLine1: "Conheça o seu OS com IA.",
      topLine2: "Impulsionado por",
      topHighlight: "Agentes de IA",
      topLine3:
        "que capturam, fazem follow-up e fecham seus leads automaticamente.",
      pricing: "Preços",

      finalTitle: "Comece a crescer com IA hoje",
      finalDesc:
        "Capture mais leads, automatize acompanhamentos e feche mais negócios com automação impulsionada por IA.",
      reinforcement: "Não é necessário cartão de crédito",

      footerDescription:
        "O CRM com IA que ajuda você a capturar leads, automatizar acompanhamentos e fechar mais negócios mais rápido.",

      startFreeTrial: "Iniciar teste gratuito",
      startYourFreeTrial: "Comece seu teste gratuito →",

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
  return (
    <div id="cortexa-ai-crm-landing">
      <div className="hero-text">
        <h2 className="hero-title">
          {tr.topLine1}
          {tr.topLine2} <span className="highlight">{tr.topHighlight}</span>{" "}
          {tr.topLine3}
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
              <div className="social-badge-container">
                <div className="avatar-group">
                  {avatars.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`User avatar ${index + 1}`}
                      className="badge-avatar"
                    />
                  ))}
                </div>

                <div className="badge-content">
                  <div className="stars-row">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="star-icon"
                        viewBox="0 0 24 24"
                        fill="#FFB800"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <p className="badge-text">
                    Trusted by 10,000+ real estate agents worldwide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-image">
              <img src={herorightImg} />
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
        <div className="cx-aios-header cx-center">
          <span className="cx-aios-badge">{tr.aiosBadge}</span>
          <h2 className="cx-aios-main-title">
            {tr.aiosBadge1} <span className="highlight-purple">AIOS</span>.{" "}
            {tr.aiosTitle}
          </h2>
          <p className="cx-aios-lead-text">{tr.aiosDesc1}</p>
          <p className="cx-aios-sub-text">
            <strong>CORTEXA AIOS</strong>{" "}
            {tr.aiosDesc2.replace("CORTEXA AIOS", "")}
          </p>
        </div>

        <div className="cx-aios-grid-container">
          <div className="cx-aios-column cx-aios-left-col">
            <h3 className="cx-column-title">{tr.aiosCol1Title}</h3>

            <div className="cx-aios-list">
              <div className="cx-aios-item">
                <Brain className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>AI Agent</strong>{" "}
                  {tr.aiosLeftItem1.replace("Your AI Agent", "")}
                </p>
              </div>
              <div className="cx-aios-item">
                <Users className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>CRM</strong>{" "}
                  {tr.aiosLeftItem2.replace("Your CRM", "")}
                </p>
              </div>
              <div className="cx-aios-item">
                <MessagesSquare className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>WhatsApp automation</strong>{" "}
                  {tr.aiosLeftItem3.replace("Your WhatsApp automation", "")}
                </p>
              </div>
              <div className="cx-aios-item">
                <GitMerge className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>pipeline</strong>{" "}
                  {tr.aiosLeftItem4.replace("Your pipeline", "")}
                </p>
              </div>
              <div className="cx-aios-item">
                <PieChart className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>analytics</strong>{" "}
                  {tr.aiosLeftItem5.replace("Your analytics", "")}
                </p>
              </div>
              <div className="cx-aios-item">
                <UserCheck className="cx-aios-icon-purple" size={20} />
                <p>
                  Your <strong>team workspace</strong>{" "}
                  {tr.aiosLeftItem6.replace("Your team workspace", "")}
                </p>
              </div>
            </div>

            <div className="cx-aios-no-box">
              <div className="cx-no-item">
                <XCircle className="cx-no-icon" size={20} />
                <span>{tr.aiosNoItem1}</span>
              </div>
              <div className="cx-no-item">
                <XCircle className="cx-no-icon" size={20} />
                <span>{tr.aiosNoItem2}</span>
              </div>
              <div className="cx-no-item">
                <XCircle className="cx-no-icon" size={20} />
                <span>{tr.aiosNoItem3}</span>
              </div>
            </div>

            <p className="cx-aios-col-footer">
              Just one{" "}
              <span className="highlight-purple">
                AI-powered operating system
              </span>{" "}
              {tr.aiosFooterText.replace(
                "Just one AI-powered operating system",
                "",
              )}
            </p>
          </div>

          <div className="cx-aios-column cx-aios-right-col">
            <h3 className="cx-column-title">{tr.aiosCol2Title}</h3>

            <div className="cx-split-right-container">
              <div className="cx-check-list-vertical">
                {[
                  tr.aiosRightItem1,
                  tr.aiosRightItem2,
                  tr.aiosRightItem3,
                  tr.aiosRightItem4,
                  tr.aiosRightItem5,
                  tr.aiosRightItem6,
                  tr.aiosRightItem7,
                  tr.aiosRightItem8,
                  tr.aiosRightItem9,
                ].map((text, idx) => (
                  <div className="cx-check-item-row" key={idx}>
                    <CheckCircle className="cx-check-icon-purple" size={18} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="cx-stat-box-display">
                <div className="cx-stat-large-num">{tr.aiosStatNumber}</div>
                <div className="cx-stat-badge-title">{tr.aiosStatLabel}</div>
                <div className="cx-stat-divider-line"></div>
                <p className="cx-stat-description-text">{tr.aiosStatDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="analytics" className="cx-hero pt-50">
        <img src={currentSec2} alt="" />
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
      </section>

      <section className="roi-section pt-50">
        <div className="roi-container">
          <h2 className="roi-title">{tr.roiTitle}</h2>
          <p className="roi-sub">{tr.roiSub}</p>
          <div className="roi-cta">
            <a href="/trial" className="roi-btn">
              {tr.roiBtn}
            </a>
          </div>
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
              <p className="cta-trust">{tr.stripTrust}</p>
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
        <svg width="0" height="0" style={{ position: "absolute", opacity: 0 }}>
          <linearGradient
            id="icon-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </svg>
        <div className="land-container">
          <h2 className="cx-title-md">{tr.trustTitle}</h2>

          <div className="cx-divider">
            <span className="cx-star">✦</span>
          </div>

          <div className="cx-trust-grid">
            {tr.trust.map((t, i) => (
              <div className="cx-trust-item" key={i}>
                <div className="cx-icon-wrapper">{trustIcons[i]}</div>
                <h4>{t}</h4>
              </div>
            ))}
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
        </div>
      </section>
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
        <div className="cx-final-box">
          <img src={headlogotranImg} className="cx-logo-img" />
          <h2 className="cx-title-lg" style={{ color: "#fff" }}>
            {tr.finalTitle}
          </h2>

          <p className="cx-sub">{tr.finalDesc}</p>

          <a href="/trial" className="cx-btn cx-btn-secondary">
            <Zap size={22} />
            Start free trial
          </a>
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
