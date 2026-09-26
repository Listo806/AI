import { useState, useEffect } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
import { Link, useLocation } from "react-router-dom";
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
  PieChart,
  Building2,
  Shield,
  Landmark,
  ShoppingCart,
  Headphones,
  ChevronRight,
  HeartPulse,
  Stethoscope,
  Magnet,
  Bell,
  UsersRound,
  ClipboardList,
  CircleCheckBig,
  Target,
  Phone,
  MessagesSquare
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { trackEvent } from "../../utils/track";
import { HashLink } from "react-router-hash-link";
import "./LandingMobile.css";

import headlogoImg from "../../assets/cortexa/headlogotran.png";
import landingDashImg from "../../assets/cortexa/mobile/cortexa-agentic-crm-dashboard-mobile.webp";
import dashboardMockupImg from "../../assets/cortexa/mobile/cortexa-mobile-dashboard.webp";
import featurechart from "../../assets/cortexa/mobile/featurechart.png";
import powerfulM from "../../assets/cortexa/mobile/powerfulM.png";
import workspaceImg from "../../assets/cortexa/mobile/cortexa-team-revenue-workspace-en.webp";
import workspaceImgES from "../../assets/cortexa/mobile/cortexa-team-revenue-workspace-es.webp";
import workspaceImgPT from "../../assets/cortexa/mobile/cortexa-team-revenue-workspace-pt.webp";
import bgreportingImg from "../../assets/cortexa/mobile/bg_reporting.png";
import webSolutionsPhoneImg from "../../assets/cortexa/mobile/cortexa-web-solutions-phone.webp";
import clinicOperationsManagerImg from "../../assets/cortexa/mobile/clinic-operations-manager.png";
import salesDirectorImg from "../../assets/cortexa/mobile/sales-director.png";
import businessOwnerImg from "../../assets/cortexa/mobile/business-owner.png";
import connectedCustomerJourneyImg from "../../assets/cortexa/mobile/cortexa-connected-customer-journey.webp";
import cortexaAiAgentIcon from "../../assets/cortexa/mobile/cortexa-ai-agent-icon.png";

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

// Intrinsic pixel sizes of the localized Team Revenue Workspace image.
const WORKSPACE_SIZE = { en: [862, 1474], es: [858, 1480], pt: [856, 1578] };

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
  const { pathname } = useLocation();
  const localePrefix = localePrefixFromPath(pathname);
  const lp = (path) => withLocalePrefix(localePrefix, path);
  const trackCta = (ctaId, ctaText) => () =>
    trackEvent("primary_cta_click", {
      cta_id: ctaId,
      cta_text: ctaText,
      page_path: pathname,
      language: lang,
    });

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
      "en": {
          "heroTitle1": "Agentic CRM built to",
          "heroTitle11": "automate and scale",
          "heroTitle2": "your business",
          "heroTitle3": "workflow.",
          "heroDesc": "AI organizes. AI qualifies. You follow up. You close.",
          "heroTopBanner1": "Agentic CRM",
          "heroTopBanner2": "for businesses tired of complicated, overpriced CRM software.",
          "login": "Log in",
          "nav": [
              "Features",
              "AI Assistant",
              "AI Workflows",
              "Pipeline",
              "Analytics",
              "Testimonials"
          ],
          "pricing": "Pricing",
          "webSolutions": "Web & Software Development Systems Integration",
          "aiosSectionTitle": "Team ",
          "aiosSectionTitle1": "Revenue ",
          "aiosSectionTitle2": "Workspace",
          "ctaButtonText": "Get Started!",
          "heroNoCard": "14-Day Trial",
          "heroFreeForever": "Starting at $11",
          "faqSubtitle": "Straight answers about the AI agent, workspaces, setup, connections, your team, and getting started.",
          "faqTitle": "Frequently Asked Questions",
          "faq": [
              {
                  "q": "What is Cortexa, and what does its AI agent do?",
                  "a": "Cortexa is an intelligent CRM and business operating system. Its AI agent can respond to customer inquiries, capture contact information, qualify interest, schedule appointments, support follow-up, and move each conversation into the correct CRM and pipeline process based on the rules you configure."
              },
              {
                  "q": "Which Cortexa workspace should I use for my business?",
                  "a": "Choose the workspace that most closely matches how your business operates. Each workspace includes the appropriate terminology, customer records, workflows, pipelines, and operating tools for that type of business. One workspace is included with your account. Additional workspaces may be added separately if your business requires them."
              },
              {
                  "q": "How does the guided setup work after I choose a workspace?",
                  "a": "After selecting your workspace, Cortexa guides you through the essential setup inside your account. You will enter your business information, services or products, hours, team responsibilities, customer entry points, qualification rules, conversion goals, appointment settings, follow-up requirements, and human-handoff instructions. You can save your progress and return to complete the setup at any time."
              },
              {
                  "q": "Can Cortexa connect with my website, business phone, WhatsApp, forms, and marketing pages?",
                  "a": "Yes. Cortexa can connect supported customer entry points to your AI agent and CRM workflow. This can include your website, business phone, WhatsApp, forms, landing pages, and advertising-traffic pages. The objective is to capture the contact, record the source, create the correct CRM record, select the appropriate pipeline, and move the customer toward a conversion or human handoff."
              },
              {
                  "q": "What are Cortexa Web Solutions, and when would I need them?",
                  "a": "Cortexa Web Solutions are optional professional services for businesses that need help updating, improving, building, or connecting their website to Cortexa. Our team can review your current website, recommend the necessary changes, and help connect customer entry points to your AI agent, CRM, campaign tracking, pipeline, appointments, checkout, quotes, demos, support, and human handoff. Web Solutions and custom implementation are quoted separately according to your requirements."
              },
              {
                  "q": "Can my team manage assignments, follow-ups, notes, and customer handoffs together?",
                  "a": "Yes. The Team Workspace gives authorized team members a shared place to manage assignments, priorities, internal notes, customer follow-ups, deadlines, and department handoffs. Everyone works from the same current customer information while permissions determine what each person can access or change."
              },
              {
                  "q": "Does the AI agent replace my staff or transfer conversations when a person is needed?",
                  "a": "The AI agent handles the customer interactions and routine work you authorize it to manage. It can answer common questions, capture information, qualify interest, schedule appointments, and support follow-up. When a conversation requires judgment, approval, specialized assistance, or personal attention, Cortexa can transfer it to the appropriate team member according to your configured rules."
              },
              {
                  "q": "Can I connect the applications and tools my business already uses?",
                  "a": "Cortexa supports a growing directory of applications and connection methods, including supported integrations, APIs, webhooks, Zapier, and other supported automation tools. Available functionality depends on the application and your Cortexa plan. Visit Apps & Integrations inside your account to review the available connections."
              },
              {
                  "q": "How do the activation fee and 14-day trial work?",
                  "a": "A non-refundable activation fee is required to activate your account and begin the 14-day trial. The applicable activation fee, trial period, first recurring billing date, and monthly subscription price are displayed before you complete checkout. If you cancel before the first recurring billing date, the monthly subscription will not be charged. The activation fee remains non-refundable."
              },
              {
                  "q": "What happens if I need help configuring or connecting everything?",
                  "a": "The guided setup is available inside your account, and you may submit an assistance request whenever you need help. Our team can review your configuration, identify missing information, and respond through your account. Custom configuration, website work, and technical implementation are optional paid services and will be quoted separately before any paid work begins."
              }
          ],
          "finalCtaTitle1": "Connect Your",
          "finalCtaTitle2": "Entire Workflow",
          "finalCtaDesc": "AI Leads. AI Qualifies. AI Closes. All in your ",
          "finalCtaBrand": "Agentic CRM.",
          "marketsSubtitle": "EXPLORE OUR MARKETS",
          "marketsRegionLabel": "Our Regions",
          "viewAllCountriesText": "View All Countries",
          "regionLatAm": "Latin America",
          "regionUSA": "USA",
          "regionEurope": "Europe",
          "regionEuropeUs": "Europe & United States",
          "footerDesc": "The all-in-one AI platform that captures leads, automates follow-ups and closes more deals — 24/7.",
          "colProduct": "Product",
          "colGetStarted": "Get Started",
          "colConnect": "Connect",
          "colSupport": "Support",
          "colLegal": "Legal",
          "fFeatures": "Features",
          "fAiAssistant": "AI Assistant",
          "fAutomations": "Automations",
          "fIntegrations": "Integrations",
          "fAnalytics": "Analytics",
          "fPricing": "Pricing",
          "fStart": "Get Started",
          "fLogin": "Login",
          "fSetup": "Setup Guide",
          "fConnectApps": "Connect Your Apps",
          "fImportCrm": "Import Your CRM",
          "fImportCsv": "Import CSV / Excel",
          "fZapier": "Zapier & Automations",
          "fApiWebhooks": "API & Webhooks",
          "fSupport247": "24/7 Support",
          "fHelpCenter": "Help Center",
          "fContact": "Contact Us",
          "fAbout": "About Us",
          "fTerms": "Terms & Conditions",
          "fPrivacy": "Privacy Policy",
          "fRefund": "Refund Policy",
          "fCancel": "Cancellation Policy",
          "copyright": "© 2026 Cortexa AI. All rights reserved.",
          "termsOfService": "Terms of Service",
          "powerbadge": "INTEGRATION",
          "powertitle": "Connect your apps",
          "workspacesSection": {
              "eyebrow": "CORTEXA WORKSPACES",
              "titleLine1": "Specialized Workspaces.",
              "titleLine2": "One Connected",
              "titleLine3": "Intelligent CRM.",
              "description": "Cortexa includes dedicated workspaces for different industries and business operations. Each workspace brings the appropriate tools, terminology, customer journey, and workflows into one connected intelligent CRM.",
              "includesTitle": "EVERY WORKSPACE INCLUDES",
              "items": [
                  "AI Conversations",
                  "Leads",
                  "Clients or Patients",
                  "Pipeline",
                  "Calendar",
                  "Automations",
                  "Analytics",
                  "Integrations"
              ]
          },
                    "workspaceChooser": {
                  "title": "Find the workspace designed for how your business operates.",
                  "items": [
                      "Business Suite",
                      "Sales",
                      "Insurance",
                      "Financial Services",
                      "E-Commerce",
                      "Customer Service"
                  ]
              },
              "moreWorkspaces": {
                  "eyebrow": "MORE SPECIALIZED WORKSPACES",
                  "items": ["Real Estate", "Team Workspace", "Lead Generator", "Aesthetic & Wellness", "Clinic & Medical"],
                  "selected": "SELECTED"
              },
              "selectedWorkspaceDetail": {
                  "eyebrow": "SELECTED WORKSPACE",
                  "title": "Clinic & Medical",
                  "description": "Manage patient inquiries, consultations, appointments, clinical activity, care plans, follow-up, and clinic operations from one connected workspace.",
                  "items": ["Patients", "Consultations", "Clinical Notes", "Follow-Up"],
                  "preview": "Preview Workspace",
                  "connected": "Your workspace connects directly to your CRM, AI agent, customer data, appointments, workflows, and revenue operation.",
                  "explore": "Explore Cortexa Workspaces",
                  "note": "One workspace included. Add more as your business grows."
              },
              "guidedSetup": {
                  "eyebrow": "GUIDED CORTEXA SETUP",
                  "title": "Get your workspace configured, connected, and ready to work.",
                  "description": "Cortexa guides you through the essential setup steps inside your account, so your AI agent, customer entry points, CRM, pipeline, appointments, and team handoff work together correctly.",
                  "steps": [
                      {"title": "Configure Your Business", "description": "Add your business details, services, hours, team, and conversion goals."},
                      {"title": "Connect Customer Entry Points", "description": "Connect your website, business phone, WhatsApp, forms, and marketing pages."},
                      {"title": "Train Your AI Agent", "description": "Define how it responds, qualifies, schedules, and transfers conversations."},
                      {"title": "Test and Launch", "description": "Verify lead capture, source tracking, CRM records, pipeline routing, appointments, and conversions."}
                  ],
                  "helpTitle": "Need help getting connected?",
                  "helpDescription": "Our team can review your setup and help connect your AI agent, website, phone, WhatsApp, CRM, appointments, checkout, tracking, and human handoff.",
                  "request": "Request Setup Assistance",
                  "guide": "View Setup Guide",
                  "note": "Optional setup and website services are quoted separately."
              },
              "workspaceClosing": {
                  "title1": "You have the right workspace.",
                  "title2": "Now let’s make it",
                  "titleAccent": "work for your business.",
                  "description": "A workspace is the part of Cortexa built around the way a specific type of business operates. It brings the customer records, workflows, pipeline, appointments, automation, and AI-agent tools that business needs into one connected place.",
                  "quote": "Choose the workspace that fits your business. Then make it yours.",
                  "eyebrow": "FROM SELECTION TO A CONNECTED SYSTEM",
                  "paragraph1": "Once selected, the guided setup helps you define your services, hours, team responsibilities, customer entry points, qualification rules, conversion goals, appointments, follow-up, and human handoff.",
                  "paragraph2": "Your website, business phone, forms, advertising traffic, and WhatsApp can connect to the same managed process so the AI agent, CRM, pipeline, checkout, appointments, and team work together from the first conversation to the next appropriate action.",
                  "paragraph3a": "You can complete the setup yourself. If your website needs to be updated, built, or connected to your workspace, our",
                  "webSolutions": "Web & Software Development Systems Integration",
                  "paragraph3b": "team can review what you have and provide a separate implementation quote.",
                  "cta": "Explore Web Solutions",
                  "note": "Optional setup and website implementation services are quoted separately."
              },
              "teamWorkspaceShowcase": {
                  "eyebrow": "CORTEXA TEAM WORKSPACE",
                  "title": "Keep your team aligned, accountable, and working from the same information.",
                  "description": "Manage assignments, customer follow-ups, priorities, internal communication, and handoffs from one shared workspace—without losing customer context.",
                  "benefits": [
                      {"title": "Clear ownership", "desc": "Assign work and know who is responsible."},
                      {"title": "Shared customer context", "desc": "Keep conversations, notes, status, and next steps visible."},
                      {"title": "Stronger execution", "desc": "Coordinate follow-ups, approvals, deadlines, and handoffs."}
                  ],
                  "closing": "One team. One shared customer record.",
                  "cta": "Explore Team Workspace",
                  "note": "Built for owners, managers, sales, customer service, and operations."
              },
              "webSolutionsShowcase": {
                  "eyebrow": "CORTEXA WEB SOLUTIONS",
                  "title": "Connect your website to the way your business works.",
                  "description": "Your website should do more than display information. Cortexa Web Solutions can connect it directly to your AI agent, CRM, pipeline, appointments, checkout, tracking, support, and team—so every customer reaches the right next step.",
                  "benefits": [
                      {"title": "Lead with your AI agent", "desc": "Give customers immediate assistance, capture their information, understand what they need, and guide them toward the correct action."},
                      {"title": "Build around your conversion goals", "desc": "Create clear paths for purchases, appointments, quotes, viewings, demos, support requests, and human handoffs."},
                      {"title": "Connect every customer entry point", "desc": "Bring website forms, advertising traffic, business phone, and WhatsApp into the same managed Cortexa process."}
                  ]
              },
              "webSolutionsConnected": {
                  "eyebrow": "CORTEXA WEB SOLUTIONS",
                  "title": "Connect your website to the way your business works.",
                  "description": "Your website should do more than display information. Cortexa Web Solutions can connect it directly to your AI agent, CRM, pipeline, appointments, checkout, tracking, support, and team—so every customer reaches the right next step.",
                  "entryEyebrow": "CONNECTED CUSTOMER ENTRY POINTS",
                  "entries": ["Website Forms", "Phone", "Advertising", "WhatsApp"],
                  "existingTitle": "Already have a website?",
                  "existingDescription": "We can improve it, connect it, and make it work with your selected Cortexa workspace.",
                  "cta": "Explore Web Solutions",
                  "note": "Custom website and implementation services are quoted separately."
              },
              "customerExperiences": {
                  "eyebrow": "CUSTOMER EXPERIENCES",
                  "title": "Put Cortexa to Work Across Your Business.",
                  "description": "Choose the right workspace, configure your AI agent, connect your customer entry points, and give your team one intelligent system for managing what happens next.",
                  "testimonials": [
                      {
                          "quote": "Cortexa brought our customer inquiries, appointments, and follow-up into one clear process. Our team can see what needs attention without moving between disconnected systems.",
                          "role": "Clinic Operations Manager",
                          "workspace": "Clinic & Medical Workspace"
                      },
                      {
                          "quote": "The AI agent gives customers an immediate response and captures the information our team needs before a person steps in. That has made every conversation more organized.",
                          "role": "Sales Director",
                          "workspace": "Sales Workspace"
                      },
                      {
                          "quote": "We finally have a workspace that reflects how our business actually operates. The guided setup made it clear what to connect and how every customer should move forward.",
                          "role": "Business Owner",
                          "workspace": "Business Suite"
                      }
                  ],
                  "ctaTitle": "Ready to build a more connected way to operate?",
                  "cta": "Get Started",
                  "explore": "Explore Cortexa Workspaces"
              },
              "connectedJourney": {
                  "eyebrow": "ONE CONNECTED CUSTOMER JOURNEY",
                  "title": "Every customer entry point. One intelligent business flow.",
                  "description": "Cortexa connects how customers discover you, communicate with your business, enter your CRM, move through the correct workspace, and reach the right conversion or human handoff.",
                  "closing": "From first contact to the next best action—everything stays connected.",
                  "cta": "Explore the Cortexa Platform"
              },
              "appointmentAutomation": {
                  "eyebrow": "APPOINTMENT AUTOMATION",
                  "title": "Your AI Agent Books Appointments 24/7.",
                  "description": "Cortexa checks your real-time availability, offers appropriate times, books or reschedules appointments, updates your calendar and CRM, and keeps your team informed—even when no one is available to respond.",
                  "customer": "Customer", "agent": "Cortexa AI Agent",
                  "messages": ["I’d like to schedule a consultation Friday afternoon.", "I have 2:30 PM or 4:00 PM available. Which works better?", "2:30 PM.", "You’re booked for Friday at 2:30 PM."],
                  "confirmed": "Appointment Confirmed", "time": "Friday • 2:30 PM",
                  "meta": "Calendar updated • CRM updated • Confirmation sent",
                  "benefits": ["Checks your availability in real time", "Books, reschedules, and confirms appointments", "Sends reminders and keeps customer records updated"]
              }
      },
      "es": {
          "heroTitle1": "CRM agéntico creado para",
          "heroTitle11": "automatizar y escalar",
          "heroTitle2": "el flujo de trabajo",
          "heroTitle3": "de tu negocio.",
          "heroDesc": "La IA organiza. La IA califica. Tú haces seguimiento. Tú cierras.",
          "heroTopBanner1": "CRM agéntico",
          "heroTopBanner2": "para negocios cansados de software CRM complicado y costoso.",
          "login": "Iniciar sesión",
          "nav": [
              "Funciones",
              "Asistente IA",
              "Flujos de trabajo IA",
              "Pipeline",
              "Analítica",
              "Testimonios"
          ],
          "pricing": "Precios",
          "webSolutions": "Desarrollo Web y de Software e Integración de Sistemas",
          "ctaButtonText": "¡Comenzar!",
          "heroNoCard": "Prueba de 14 días",
          "heroFreeForever": "Desde $11",
          "faqSubtitle": "Respuestas claras sobre el agente de IA, los espacios de trabajo, la configuración, las conexiones, tu equipo y cómo comenzar.",
          "faqTitle": "Preguntas Frecuentes",
          "faq": [
              {
                  "q": "¿Qué es Cortexa y qué hace su agente de IA?",
                  "a": "Cortexa es un CRM inteligente y un sistema operativo empresarial. Su agente de IA puede responder consultas de clientes, capturar información de contacto, calificar el interés, programar citas, apoyar el seguimiento y mover cada conversación al proceso correcto de CRM y pipeline según las reglas que configures."
              },
              {
                  "q": "¿Qué espacio de trabajo de Cortexa debo usar para mi negocio?",
                  "a": "Elige el espacio de trabajo que mejor se adapte a la forma en que opera tu negocio. Cada espacio incluye la terminología, los registros de clientes, los flujos de trabajo, los pipelines y las herramientas operativas apropiadas para ese tipo de negocio. Se incluye un espacio de trabajo con tu cuenta. Se pueden agregar espacios adicionales por separado si tu negocio los necesita."
              },
              {
                  "q": "¿Cómo funciona la configuración guiada después de elegir un espacio de trabajo?",
                  "a": "Después de seleccionar tu espacio de trabajo, Cortexa te guía por la configuración esencial dentro de tu cuenta. Introducirás la información de tu negocio, servicios o productos, horarios, responsabilidades del equipo, puntos de entrada de clientes, reglas de calificación, objetivos de conversión, configuración de citas, requisitos de seguimiento e instrucciones de transferencia humana. Puedes guardar tu progreso y volver para completar la configuración en cualquier momento."
              },
              {
                  "q": "¿Puede Cortexa conectarse con mi sitio web, teléfono comercial, WhatsApp, formularios y páginas de marketing?",
                  "a": "Sí. Cortexa puede conectar los puntos de entrada de clientes compatibles con tu agente de IA y el flujo de trabajo del CRM. Esto puede incluir tu sitio web, teléfono comercial, WhatsApp, formularios, landing pages y páginas de tráfico publicitario. El objetivo es capturar el contacto, registrar la fuente, crear el registro correcto en el CRM, seleccionar el pipeline adecuado y llevar al cliente hacia una conversión o una transferencia humana."
              },
              {
                  "q": "¿Qué son Cortexa Web Solutions y cuándo las necesitaría?",
                  "a": "Cortexa Web Solutions son servicios profesionales opcionales para empresas que necesitan ayuda para actualizar, mejorar, crear o conectar su sitio web con Cortexa. Nuestro equipo puede revisar tu sitio actual, recomendar los cambios necesarios y ayudar a conectar los puntos de entrada de clientes con tu agente de IA, CRM, seguimiento de campañas, pipeline, citas, checkout, cotizaciones, demos, soporte y transferencia humana. Web Solutions y la implementación personalizada se cotizan por separado según tus requisitos."
              },
              {
                  "q": "¿Puede mi equipo gestionar asignaciones, seguimientos, notas y transferencias de clientes en conjunto?",
                  "a": "Sí. Team Workspace ofrece a los miembros autorizados del equipo un lugar compartido para gestionar asignaciones, prioridades, notas internas, seguimientos de clientes, plazos y transferencias entre departamentos. Todos trabajan con la misma información actual del cliente, mientras que los permisos determinan a qué puede acceder o qué puede cambiar cada persona."
              },
              {
                  "q": "¿El agente de IA reemplaza a mi personal o transfiere conversaciones cuando se necesita una persona?",
                  "a": "El agente de IA gestiona las interacciones con clientes y el trabajo rutinario que autorices. Puede responder preguntas comunes, capturar información, calificar el interés, programar citas y apoyar el seguimiento. Cuando una conversación requiere criterio, aprobación, asistencia especializada o atención personal, Cortexa puede transferirla al miembro adecuado del equipo según las reglas configuradas."
              },
              {
                  "q": "¿Puedo conectar las aplicaciones y herramientas que mi negocio ya utiliza?",
                  "a": "Cortexa admite un directorio creciente de aplicaciones y métodos de conexión, incluidas integraciones compatibles, APIs, webhooks, Zapier y otras herramientas de automatización compatibles. La funcionalidad disponible depende de la aplicación y de tu plan de Cortexa. Visita Apps & Integrations dentro de tu cuenta para revisar las conexiones disponibles."
              },
              {
                  "q": "¿Cómo funcionan la tarifa de activación y la prueba de 14 días?",
                  "a": "Se requiere una tarifa de activación no reembolsable para activar tu cuenta y comenzar la prueba de 14 días. La tarifa de activación aplicable, el período de prueba, la primera fecha de facturación recurrente y el precio de la suscripción mensual se muestran antes de completar el checkout. Si cancelas antes de la primera fecha de facturación recurrente, no se cobrará la suscripción mensual. La tarifa de activación sigue siendo no reembolsable."
              },
              {
                  "q": "¿Qué sucede si necesito ayuda para configurar o conectar todo?",
                  "a": "La configuración guiada está disponible dentro de tu cuenta y puedes enviar una solicitud de asistencia cuando necesites ayuda. Nuestro equipo puede revisar tu configuración, identificar información faltante y responder a través de tu cuenta. La configuración personalizada, el trabajo del sitio web y la implementación técnica son servicios opcionales de pago y se cotizarán por separado antes de comenzar cualquier trabajo pagado."
              }
          ],
          "finalCtaTitle1": "Conecta",
          "finalCtaTitle2": "Todo Tu Flujo de Trabajo",
          "finalCtaDesc": "La IA capta leads. La IA califica. La IA cierra. Todo en tu ",
          "finalCtaBrand": "CRM agéntico.",
          "marketsSubtitle": "EXPLORA NUESTROS MERCADOS",
          "marketsRegionLabel": "Nuestras Regiones",
          "viewAllCountriesText": "Ver Todos los Países",
          "regionLatAm": "América Latina",
          "regionUSA": "EE. UU.",
          "regionEurope": "Europa",
          "regionEuropeUs": "Europa y Estados Unidos",
          "footerDesc": "La plataforma de IA todo en uno que captura leads, automatiza el seguimiento y cierra más tratos, 24/7.",
          "colProduct": "Producto",
          "colGetStarted": "Comenzar",
          "colConnect": "Conectar",
          "colSupport": "Soporte",
          "colLegal": "Legal",
          "fFeatures": "Características",
          "fAiAssistant": "Asistente de IA",
          "fAutomations": "Automatizaciones",
          "fIntegrations": "Integraciones",
          "fAnalytics": "Analítica",
          "fPricing": "Precios",
          "fStart": "Comenzar",
          "fLogin": "Iniciar Sesión",
          "fSetup": "Guía de Configuración",
          "fConnectApps": "Conectar tus Apps",
          "fImportCrm": "Importar tu CRM",
          "fImportCsv": "Importar CSV / Excel",
          "fZapier": "Zapier y Automatizaciones",
          "fApiWebhooks": "API y Webhooks",
          "fSupport247": "Soporte 24/7",
          "fHelpCenter": "Centro de Ayuda",
          "fContact": "Contáctanos",
          "fAbout": "Nosotros",
          "fTerms": "Términos y Condiciones",
          "fPrivacy": "Política de Privacidad",
          "fRefund": "Política de Reembolso",
          "fCancel": "Política de Cancelación",
          "copyright": "© 2026 Cortexa AI. Todos los derechos reservados.",
          "termsOfService": "Términos de Servicio",
          "powerbadge": "INTEGRACIÓN",
          "powertitle": "Conecta tus aplicaciones",
          "workspacesSection": {
              "eyebrow": "ESPACIOS DE TRABAJO CORTEXA",
              "titleLine1": "Espacios Especializados.",
              "titleLine2": "Un CRM Inteligente",
              "titleLine3": "Totalmente Conectado.",
              "description": "Cortexa incluye espacios de trabajo dedicados para diferentes industrias y operaciones empresariales. Cada espacio incorpora las herramientas, la terminología, el recorrido del cliente y los flujos de trabajo adecuados en un CRM inteligente y conectado.",
              "includesTitle": "CADA ESPACIO DE TRABAJO INCLUYE",
              "items": [
                  "Conversaciones con IA",
                  "Leads",
                  "Clientes o Pacientes",
                  "Pipeline",
                  "Calendario",
                  "Automatizaciones",
                  "Analítica",
                  "Integraciones"
              ]
          },
                    "workspaceChooser": {
                  "title": "Encuentra el espacio de trabajo diseñado para la forma en que opera tu negocio.",
                  "items": [
                      "Suite Empresarial",
                      "Ventas",
                      "Seguros",
                      "Servicios Financieros",
                      "Comercio Electrónico",
                      "Servicio al Cliente"
                  ]
              },
              "moreWorkspaces": {
                  "eyebrow": "MÁS ESPACIOS DE TRABAJO ESPECIALIZADOS",
                  "items": ["Bienes Raíces", "Espacio de Equipo", "Generador de Leads", "Estética y Bienestar", "Clínica y Medicina"],
                  "selected": "SELECCIONADO"
              },
              "selectedWorkspaceDetail": {
                  "eyebrow": "ESPACIO DE TRABAJO SELECCIONADO",
                  "title": "Clínica y Medicina",
                  "description": "Gestiona consultas de pacientes, consultas médicas, citas, actividad clínica, planes de atención, seguimiento y operaciones de la clínica desde un espacio de trabajo conectado.",
                  "items": ["Pacientes", "Consultas", "Notas Clínicas", "Seguimiento"],
                  "preview": "Vista Previa del Espacio",
                  "connected": "Tu espacio de trabajo se conecta directamente con tu CRM, agente de IA, datos de clientes, citas, flujos de trabajo y operaciones de ingresos.",
                  "explore": "Explorar Espacios de Cortexa",
                  "note": "Un espacio de trabajo incluido. Agrega más a medida que tu negocio crece."
              },
              "guidedSetup": {
                  "eyebrow": "CONFIGURACIÓN GUIADA DE CORTEXA",
                  "title": "Configura y conecta tu espacio de trabajo para empezar a trabajar.",
                  "description": "Cortexa te guía por los pasos esenciales de configuración dentro de tu cuenta para que tu agente de IA, puntos de entrada de clientes, CRM, pipeline, citas y transferencia al equipo funcionen correctamente.",
                  "steps": [
                      {"title": "Configura Tu Negocio", "description": "Agrega los datos de tu negocio, servicios, horarios, equipo y objetivos de conversión."},
                      {"title": "Conecta los Puntos de Entrada", "description": "Conecta tu sitio web, teléfono comercial, WhatsApp, formularios y páginas de marketing."},
                      {"title": "Entrena Tu Agente de IA", "description": "Define cómo responde, califica, programa y transfiere conversaciones."},
                      {"title": "Prueba y Lanza", "description": "Verifica la captura de leads, seguimiento de fuentes, registros del CRM, enrutamiento del pipeline, citas y conversiones."}
                  ],
                  "helpTitle": "¿Necesitas ayuda para conectarte?",
                  "helpDescription": "Nuestro equipo puede revisar tu configuración y ayudarte a conectar tu agente de IA, sitio web, teléfono, WhatsApp, CRM, citas, checkout, seguimiento y transferencia humana.",
                  "request": "Solicitar Ayuda de Configuración",
                  "guide": "Ver Guía de Configuración",
                  "note": "Los servicios opcionales de configuración y sitio web se cotizan por separado."
              },
              "workspaceClosing": {
                  "title1": "Tienes el espacio de trabajo adecuado.",
                  "title2": "Ahora hagamos que",
                  "titleAccent": "funcione para tu negocio.",
                  "description": "Un espacio de trabajo es la parte de Cortexa creada alrededor de la forma en que opera un tipo específico de negocio. Reúne los registros de clientes, flujos de trabajo, pipeline, citas, automatización y herramientas del agente de IA que ese negocio necesita en un solo lugar conectado.",
                  "quote": "Elige el espacio de trabajo que se adapte a tu negocio. Luego hazlo tuyo.",
                  "eyebrow": "DE LA SELECCIÓN A UN SISTEMA CONECTADO",
                  "paragraph1": "Una vez seleccionado, la configuración guiada te ayuda a definir tus servicios, horarios, responsabilidades del equipo, puntos de entrada de clientes, reglas de calificación, objetivos de conversión, citas, seguimiento y transferencia humana.",
                  "paragraph2": "Tu sitio web, teléfono comercial, formularios, tráfico publicitario y WhatsApp pueden conectarse al mismo proceso gestionado para que el agente de IA, CRM, pipeline, checkout, citas y equipo trabajen juntos desde la primera conversación hasta la siguiente acción adecuada.",
                  "paragraph3a": "Puedes completar la configuración por tu cuenta. Si tu sitio web necesita actualizarse, crearse o conectarse a tu espacio de trabajo, nuestro equipo de",
                  "webSolutions": "Desarrollo Web y de Software e Integración de Sistemas",
                  "paragraph3b": "puede revisar lo que tienes y proporcionar una cotización de implementación por separado.",
                  "cta": "Explorar Soluciones Web",
                  "note": "Los servicios opcionales de configuración e implementación web se cotizan por separado."
              },
              "teamWorkspaceShowcase": {
                  "eyebrow": "ESPACIO DE TRABAJO EN EQUIPO CORTEXA",
                  "title": "Mantén a tu equipo alineado, responsable y trabajando con la misma información.",
                  "description": "Gestiona asignaciones, seguimientos de clientes, prioridades, comunicación interna y transferencias desde un espacio de trabajo compartido, sin perder el contexto del cliente.",
                  "benefits": [
                      {"title": "Responsabilidad clara", "desc": "Asigna el trabajo y sabe quién es responsable."},
                      {"title": "Contexto compartido del cliente", "desc": "Mantén visibles las conversaciones, notas, estados y próximos pasos."},
                      {"title": "Mejor ejecución", "desc": "Coordina seguimientos, aprobaciones, fechas límite y transferencias."}
                  ],
                  "closing": "Un equipo. Un registro de cliente compartido.",
                  "cta": "Explorar Espacio de Equipo",
                  "note": "Creado para propietarios, gerentes, ventas, servicio al cliente y operaciones."
              },
              "webSolutionsShowcase": {
                  "eyebrow": "SOLUCIONES WEB CORTEXA",
                  "title": "Conecta tu sitio web con la forma en que funciona tu negocio.",
                  "description": "Tu sitio web debería hacer más que mostrar información. Cortexa Web Solutions puede conectarlo directamente con tu agente de IA, CRM, pipeline, citas, checkout, seguimiento, soporte y equipo, para que cada cliente llegue al siguiente paso correcto.",
                  "benefits": [
                      {"title": "Lidera con tu agente de IA", "desc": "Brinda asistencia inmediata a los clientes, captura su información, comprende lo que necesitan y guíalos hacia la acción correcta."},
                      {"title": "Construye alrededor de tus objetivos de conversión", "desc": "Crea rutas claras para compras, citas, cotizaciones, visitas, demostraciones, solicitudes de soporte y transferencias humanas."},
                      {"title": "Conecta cada punto de entrada del cliente", "desc": "Integra formularios web, tráfico publicitario, teléfono comercial y WhatsApp en el mismo proceso gestionado de Cortexa."}
                  ]
              },
              "webSolutionsConnected": {
                  "eyebrow": "SOLUCIONES WEB CORTEXA",
                  "title": "Conecta tu sitio web con la forma en que funciona tu negocio.",
                  "description": "Tu sitio web debería hacer más que mostrar información. Cortexa Web Solutions puede conectarlo directamente con tu agente de IA, CRM, pipeline, citas, checkout, seguimiento, soporte y equipo, para que cada cliente llegue al siguiente paso correcto.",
                  "entryEyebrow": "PUNTOS DE ENTRADA DEL CLIENTE CONECTADOS",
                  "entries": ["Formularios web", "Teléfono", "Publicidad", "WhatsApp"],
                  "existingTitle": "¿Ya tienes un sitio web?",
                  "existingDescription": "Podemos mejorarlo, conectarlo y hacer que funcione con tu espacio de trabajo Cortexa seleccionado.",
                  "cta": "Explorar Soluciones Web",
                  "note": "Los servicios personalizados de sitio web e implementación se cotizan por separado."
              },
              "customerExperiences": {
                  "eyebrow": "EXPERIENCIAS DE CLIENTES",
                  "title": "Pon Cortexa a Trabajar en Todo Tu Negocio.",
                  "description": "Elige el espacio de trabajo adecuado, configura tu agente de IA, conecta los puntos de entrada de clientes y brinda a tu equipo un sistema inteligente para gestionar lo que sucede después.",
                  "testimonials": [
                      {
                          "quote": "Cortexa reunió nuestras consultas de clientes, citas y seguimientos en un proceso claro. Nuestro equipo puede ver qué necesita atención sin moverse entre sistemas desconectados.",
                          "role": "Gerente de Operaciones Clínicas",
                          "workspace": "Espacio Clínica y Medicina"
                      },
                      {
                          "quote": "El agente de IA brinda a los clientes una respuesta inmediata y captura la información que nuestro equipo necesita antes de que intervenga una persona. Eso ha hecho que cada conversación sea más organizada.",
                          "role": "Director de Ventas",
                          "workspace": "Espacio de Ventas"
                      },
                      {
                          "quote": "Finalmente tenemos un espacio de trabajo que refleja cómo funciona realmente nuestro negocio. La configuración guiada dejó claro qué conectar y cómo debe avanzar cada cliente.",
                          "role": "Propietario del Negocio",
                          "workspace": "Business Suite"
                      }
                  ],
                  "ctaTitle": "¿Listo para crear una forma de operar más conectada?",
                  "cta": "Comenzar",
                  "explore": "Explorar Espacios de Cortexa",
                  "note": "Reemplaza los testimonios de ejemplo con declaraciones verificadas de clientes antes de publicar."
              },
              "connectedJourney": {
                  "eyebrow": "UN RECORRIDO DEL CLIENTE CONECTADO",
                  "title": "Cada punto de entrada del cliente. Un flujo empresarial inteligente.",
                  "description": "Cortexa conecta cómo los clientes te descubren, se comunican con tu negocio, ingresan a tu CRM, avanzan por el espacio de trabajo correcto y llegan a la conversión adecuada o a una transferencia humana.",
                  "closing": "Desde el primer contacto hasta la siguiente mejor acción, todo permanece conectado.",
                  "cta": "Explorar la Plataforma Cortexa"
              },
              "appointmentAutomation": {
                  "eyebrow": "AUTOMATIZACIÓN DE CITAS",
                  "title": "Tu Agente de IA Reserva Citas 24/7.",
                  "description": "Cortexa consulta tu disponibilidad en tiempo real, ofrece horarios adecuados, reserva o reprograma citas, actualiza tu calendario y CRM, y mantiene informado a tu equipo incluso cuando nadie está disponible para responder.",
                  "customer": "Cliente", "agent": "Agente de IA Cortexa",
                  "messages": ["Me gustaría programar una consulta el viernes por la tarde.", "Tengo disponibilidad a las 2:30 PM o 4:00 PM. ¿Qué horario te conviene más?", "2:30 PM.", "Tu cita está reservada para el viernes a las 2:30 PM."],
                  "confirmed": "Cita Confirmada", "time": "Viernes • 2:30 PM",
                  "meta": "Calendario actualizado • CRM actualizado • Confirmación enviada",
                  "benefits": ["Consulta tu disponibilidad en tiempo real", "Reserva, reprograma y confirma citas", "Envía recordatorios y mantiene actualizados los registros de clientes"]
              }
      },
      "pt": {
          "heroTitle1": "CRM agêntico criado para",
          "heroTitle11": "automatizar e escalar",
          "heroTitle2": "o fluxo de trabalho",
          "heroTitle3": "do seu negócio.",
          "heroDesc": "A IA organiza. A IA qualifica. Você faz o acompanhamento. Você fecha.",
          "heroTopBanner1": "CRM agêntico",
          "heroTopBanner2": "para empresas cansadas de software de CRM complicado e caro.",
          "login": "Entrar",
          "nav": [
              "Recursos",
              "Assistente IA",
              "Fluxos de trabalho IA",
              "Pipeline",
              "Analytics",
              "Depoimentos"
          ],
          "pricing": "Preços",
          "webSolutions": "Desenvolvimento Web e de Software e Integração de Sistemas",
          "aiosSectionTitle": "Espaço de Trabalho",
          "aiosSectionTitle1": "de Receita",
          "aiosSectionTitle2": "para Equipes",
          "ctaButtonText": "Começar!",
          "heroNoCard": "Teste de 14 dias",
          "heroFreeForever": "A partir de US$ 11",
          "faqSubtitle": "Respostas diretas sobre o agente de IA, espaços de trabalho, configuração, conexões, sua equipe e como começar.",
          "faqTitle": "Perguntas Frequentes",
          "faq": [
              {
                  "q": "O que é a Cortexa e o que seu agente de IA faz?",
                  "a": "A Cortexa é um CRM inteligente e um sistema operacional empresarial. Seu agente de IA pode responder a dúvidas de clientes, capturar informações de contato, qualificar o interesse, agendar compromissos, apoiar o acompanhamento e direcionar cada conversa para o processo correto de CRM e pipeline com base nas regras que você configurar."
              },
              {
                  "q": "Qual espaço de trabalho da Cortexa devo usar para o meu negócio?",
                  "a": "Escolha o espaço de trabalho que mais se aproxima da forma como sua empresa opera. Cada espaço inclui a terminologia, os registros de clientes, os fluxos de trabalho, os pipelines e as ferramentas operacionais adequadas para esse tipo de negócio. Um espaço de trabalho está incluído na sua conta. Espaços adicionais podem ser adicionados separadamente se sua empresa precisar deles."
              },
              {
                  "q": "Como funciona a configuração guiada depois que escolho um espaço de trabalho?",
                  "a": "Depois de selecionar seu espaço de trabalho, a Cortexa orienta você pela configuração essencial dentro da sua conta. Você informará os dados da empresa, serviços ou produtos, horários, responsabilidades da equipe, pontos de entrada de clientes, regras de qualificação, metas de conversão, configurações de compromissos, requisitos de acompanhamento e instruções de transferência para atendimento humano. Você pode salvar seu progresso e voltar para concluir a configuração a qualquer momento."
              },
              {
                  "q": "A Cortexa pode se conectar ao meu site, telefone comercial, WhatsApp, formulários e páginas de marketing?",
                  "a": "Sim. A Cortexa pode conectar pontos de entrada de clientes compatíveis ao seu agente de IA e ao fluxo de trabalho do CRM. Isso pode incluir seu site, telefone comercial, WhatsApp, formulários, landing pages e páginas de tráfego publicitário. O objetivo é capturar o contato, registrar a origem, criar o registro correto no CRM, selecionar o pipeline apropriado e conduzir o cliente até uma conversão ou transferência para atendimento humano."
              },
              {
                  "q": "O que são as Cortexa Web Solutions e quando eu precisaria delas?",
                  "a": "Cortexa Web Solutions são serviços profissionais opcionais para empresas que precisam de ajuda para atualizar, melhorar, criar ou conectar seu site à Cortexa. Nossa equipe pode analisar seu site atual, recomendar as mudanças necessárias e ajudar a conectar os pontos de entrada de clientes ao seu agente de IA, CRM, rastreamento de campanhas, pipeline, compromissos, checkout, orçamentos, demos, suporte e transferência para atendimento humano. Web Solutions e implementações personalizadas são orçadas separadamente de acordo com suas necessidades."
              },
              {
                  "q": "Minha equipe pode gerenciar atribuições, acompanhamentos, notas e transferências de clientes em conjunto?",
                  "a": "Sim. O Team Workspace oferece aos membros autorizados da equipe um local compartilhado para gerenciar atribuições, prioridades, notas internas, acompanhamentos de clientes, prazos e transferências entre departamentos. Todos trabalham com as mesmas informações atualizadas do cliente, enquanto as permissões determinam o que cada pessoa pode acessar ou alterar."
              },
              {
                  "q": "O agente de IA substitui minha equipe ou transfere conversas quando uma pessoa é necessária?",
                  "a": "O agente de IA cuida das interações com clientes e do trabalho rotineiro que você autorizar. Ele pode responder a perguntas comuns, capturar informações, qualificar o interesse, agendar compromissos e apoiar o acompanhamento. Quando uma conversa exige julgamento, aprovação, assistência especializada ou atenção pessoal, a Cortexa pode transferi-la para o membro apropriado da equipe de acordo com as regras configuradas."
              },
              {
                  "q": "Posso conectar os aplicativos e ferramentas que minha empresa já utiliza?",
                  "a": "A Cortexa oferece suporte a um diretório crescente de aplicativos e métodos de conexão, incluindo integrações compatíveis, APIs, webhooks, Zapier e outras ferramentas de automação compatíveis. A funcionalidade disponível depende do aplicativo e do seu plano Cortexa. Visite Apps & Integrations dentro da sua conta para revisar as conexões disponíveis."
              },
              {
                  "q": "Como funcionam a taxa de ativação e o teste de 14 dias?",
                  "a": "Uma taxa de ativação não reembolsável é necessária para ativar sua conta e iniciar o teste de 14 dias. A taxa de ativação aplicável, o período de teste, a primeira data de cobrança recorrente e o preço da assinatura mensal são exibidos antes de você concluir o checkout. Se você cancelar antes da primeira data de cobrança recorrente, a assinatura mensal não será cobrada. A taxa de ativação permanece não reembolsável."
              },
              {
                  "q": "O que acontece se eu precisar de ajuda para configurar ou conectar tudo?",
                  "a": "A configuração guiada está disponível dentro da sua conta, e você pode enviar uma solicitação de assistência sempre que precisar de ajuda. Nossa equipe pode revisar sua configuração, identificar informações ausentes e responder pela sua conta. Configuração personalizada, trabalho no site e implementação técnica são serviços pagos opcionais e serão orçados separadamente antes do início de qualquer trabalho pago."
              }
          ],
          "finalCtaTitle1": "Conecte",
          "finalCtaTitle2": "Todo o Seu Fluxo de Trabalho",
          "finalCtaDesc": "A IA gera leads. A IA qualifica. A IA fecha. Tudo no seu ",
          "finalCtaBrand": "CRM agêntico.",
          "marketsSubtitle": "EXPLORE NOSSOS MERCADOS",
          "marketsRegionLabel": "Nossas Regiões",
          "viewAllCountriesText": "Ver Todos os Países",
          "regionLatAm": "América Latina",
          "regionUSA": "EUA",
          "regionEurope": "Europa",
          "regionEuropeUs": "Europa e Estados Unidos",
          "footerDesc": "A plataforma de IA tudo-em-um que captura leads, automatiza acompanhamentos e fecha mais negócios — 24/7.",
          "colProduct": "Produto",
          "colGetStarted": "Começar",
          "colConnect": "Conectar",
          "colSupport": "Suporte",
          "colLegal": "Legal",
          "fFeatures": "Recursos",
          "fAiAssistant": "Assistente de IA",
          "fAutomations": "Automatizações",
          "fIntegrations": "Integrações",
          "fAnalytics": "Análise",
          "fPricing": "Preços",
          "fStart": "Começar",
          "fLogin": "Login",
          "fSetup": "Guia de Configuração",
          "fConnectApps": "Conectar Seus Apps",
          "fImportCrm": "Importar Seu CRM",
          "fImportCsv": "Importar CSV / Excel",
          "fZapier": "Zapier & Automatizações",
          "fApiWebhooks": "API & Webhooks",
          "fSupport247": "Suporte 24/7",
          "fHelpCenter": "Central de Ajuda",
          "fContact": "Fale Conosco",
          "fAbout": "Sobre Nós",
          "fTerms": "Termos & Condições",
          "fPrivacy": "Política de Privacidade",
          "fRefund": "Política de Reembolso",
          "fCancel": "Política de Cancelamento",
          "copyright": "© 2026 Cortexa AI. Todos os direitos reservados.",
          "termsOfService": "Termos de Serviço",
          "powerbadge": "INTEGRAÇÃO",
          "powertitle": "Conecte seus aplicativos",
          "workspacesSection": {
              "eyebrow": "ESPAÇOS DE TRABALHO CORTEXA",
              "titleLine1": "Espaços Especializados.",
              "titleLine2": "Um CRM Inteligente",
              "titleLine3": "Totalmente Conectado.",
              "description": "A Cortexa inclui espaços de trabalho dedicados para diferentes setores e operações empresariais. Cada espaço reúne as ferramentas, a terminologia, a jornada do cliente e os fluxos de trabalho adequados em um CRM inteligente e conectado.",
              "includesTitle": "CADA ESPAÇO DE TRABALHO INCLUI",
              "items": [
                  "Conversas com IA",
                  "Leads",
                  "Clientes ou Pacientes",
                  "Pipeline",
                  "Calendário",
                  "Automações",
                  "Análises",
                  "Integrações"
              ]
          },
                    "workspaceChooser": {
                  "title": "Encontre o espaço de trabalho desenvolvido para a forma como sua empresa opera.",
                  "items": [
                      "Suíte Empresarial",
                      "Vendas",
                      "Seguros",
                      "Serviços Financeiros",
                      "E-Commerce",
                      "Atendimento ao Cliente"
                  ]
              },
              "moreWorkspaces": {
                  "eyebrow": "MAIS ESPAÇOS DE TRABALHO ESPECIALIZADOS",
                  "items": ["Imobiliário", "Espaço da Equipe", "Gerador de Leads", "Estética e Bem-Estar", "Clínica e Medicina"],
                  "selected": "SELECIONADO"
              },
              "selectedWorkspaceDetail": {
                  "eyebrow": "ESPAÇO DE TRABALHO SELECIONADO",
                  "title": "Clínica e Medicina",
                  "description": "Gerencie consultas de pacientes, consultas médicas, agendamentos, atividades clínicas, planos de cuidados, acompanhamento e operações da clínica em um único espaço de trabalho conectado.",
                  "items": ["Pacientes", "Consultas", "Notas Clínicas", "Acompanhamento"],
                  "preview": "Visualizar Espaço de Trabalho",
                  "connected": "Seu espaço de trabalho se conecta diretamente ao CRM, agente de IA, dados de clientes, agendamentos, fluxos de trabalho e operações de receita.",
                  "explore": "Explorar Espaços da Cortexa",
                  "note": "Um espaço de trabalho incluído. Adicione mais conforme sua empresa cresce."
              },
              "guidedSetup": {
                  "eyebrow": "CONFIGURAÇÃO GUIADA CORTEXA",
                  "title": "Configure e conecte seu espaço de trabalho para começar.",
                  "description": "A Cortexa orienta você pelas etapas essenciais de configuração dentro da sua conta para que seu agente de IA, pontos de entrada de clientes, CRM, pipeline, agendamentos e transferência para a equipe funcionem corretamente.",
                  "steps": [
                      {"title": "Configure Sua Empresa", "description": "Adicione os dados da empresa, serviços, horários, equipe e metas de conversão."},
                      {"title": "Conecte os Pontos de Entrada", "description": "Conecte seu site, telefone comercial, WhatsApp, formulários e páginas de marketing."},
                      {"title": "Treine Seu Agente de IA", "description": "Defina como ele responde, qualifica, agenda e transfere conversas."},
                      {"title": "Teste e Lance", "description": "Verifique a captura de leads, rastreamento de origem, registros do CRM, roteamento do pipeline, agendamentos e conversões."}
                  ],
                  "helpTitle": "Precisa de ajuda para conectar?",
                  "helpDescription": "Nossa equipe pode revisar sua configuração e ajudar a conectar seu agente de IA, site, telefone, WhatsApp, CRM, agendamentos, checkout, rastreamento e transferência humana.",
                  "request": "Solicitar Ajuda de Configuração",
                  "guide": "Ver Guia de Configuração",
                  "note": "Serviços opcionais de configuração e site são cotados separadamente."
              },
              "workspaceClosing": {
                  "title1": "Você tem o espaço de trabalho certo.",
                  "title2": "Agora vamos fazê-lo",
                  "titleAccent": "funcionar para sua empresa.",
                  "description": "Um espaço de trabalho é a parte da Cortexa criada em torno da forma como um tipo específico de empresa opera. Ele reúne registros de clientes, fluxos de trabalho, pipeline, agendamentos, automação e ferramentas do agente de IA de que essa empresa precisa em um único lugar conectado.",
                  "quote": "Escolha o espaço de trabalho que combina com sua empresa. Depois, torne-o seu.",
                  "eyebrow": "DA SELEÇÃO A UM SISTEMA CONECTADO",
                  "paragraph1": "Depois de selecionado, a configuração guiada ajuda você a definir serviços, horários, responsabilidades da equipe, pontos de entrada de clientes, regras de qualificação, metas de conversão, agendamentos, acompanhamento e transferência humana.",
                  "paragraph2": "Seu site, telefone comercial, formulários, tráfego de publicidade e WhatsApp podem se conectar ao mesmo processo gerenciado para que o agente de IA, CRM, pipeline, checkout, agendamentos e equipe trabalhem juntos desde a primeira conversa até a próxima ação adequada.",
                  "paragraph3a": "Você pode concluir a configuração por conta própria. Se o seu site precisar ser atualizado, criado ou conectado ao seu espaço de trabalho, nossa equipe de",
                  "webSolutions": "Desenvolvimento Web e de Software e Integração de Sistemas",
                  "paragraph3b": "pode revisar o que você tem e fornecer uma cotação de implementação separada.",
                  "cta": "Explorar Soluções Web",
                  "note": "Serviços opcionais de configuração e implementação de site são cotados separadamente."
              },
              "teamWorkspaceShowcase": {
                  "eyebrow": "ESPAÇO DE TRABALHO EM EQUIPE CORTEXA",
                  "title": "Mantenha sua equipe alinhada, responsável e trabalhando com as mesmas informações.",
                  "description": "Gerencie atribuições, acompanhamentos de clientes, prioridades, comunicação interna e transferências em um espaço de trabalho compartilhado, sem perder o contexto do cliente.",
                  "benefits": [
                      {"title": "Responsabilidade clara", "desc": "Atribua o trabalho e saiba quem é responsável."},
                      {"title": "Contexto compartilhado do cliente", "desc": "Mantenha conversas, notas, status e próximos passos visíveis."},
                      {"title": "Execução mais forte", "desc": "Coordene acompanhamentos, aprovações, prazos e transferências."}
                  ],
                  "closing": "Uma equipe. Um registro de cliente compartilhado.",
                  "cta": "Explorar Espaço de Equipe",
                  "note": "Criado para proprietários, gerentes, vendas, atendimento ao cliente e operações."
              },
              "webSolutionsShowcase": {
                  "eyebrow": "SOLUÇÕES WEB CORTEXA",
                  "title": "Conecte seu site à forma como sua empresa funciona.",
                  "description": "Seu site deve fazer mais do que exibir informações. A Cortexa Web Solutions pode conectá-lo diretamente ao seu agente de IA, CRM, pipeline, agendamentos, checkout, rastreamento, suporte e equipe, para que cada cliente chegue à próxima etapa correta.",
                  "benefits": [
                      {"title": "Lidere com seu agente de IA", "desc": "Ofereça assistência imediata aos clientes, capture suas informações, entenda o que precisam e oriente-os para a ação correta."},
                      {"title": "Construa em torno de suas metas de conversão", "desc": "Crie caminhos claros para compras, agendamentos, cotações, visitas, demonstrações, solicitações de suporte e transferências humanas."},
                      {"title": "Conecte cada ponto de entrada do cliente", "desc": "Reúna formulários do site, tráfego de publicidade, telefone comercial e WhatsApp no mesmo processo gerenciado da Cortexa."}
                  ]
              },
              "webSolutionsConnected": {
                  "eyebrow": "SOLUÇÕES WEB CORTEXA",
                  "title": "Conecte seu site à forma como sua empresa funciona.",
                  "description": "Seu site deve fazer mais do que exibir informações. A Cortexa Web Solutions pode conectá-lo diretamente ao seu agente de IA, CRM, pipeline, agendamentos, checkout, rastreamento, suporte e equipe, para que cada cliente chegue à próxima etapa correta.",
                  "entryEyebrow": "PONTOS DE ENTRADA DO CLIENTE CONECTADOS",
                  "entries": ["Formulários do site", "Telefone", "Publicidade", "WhatsApp"],
                  "existingTitle": "Já tem um site?",
                  "existingDescription": "Podemos melhorá-lo, conectá-lo e fazê-lo funcionar com o espaço de trabalho Cortexa selecionado.",
                  "cta": "Explorar Soluções Web",
                  "note": "Serviços personalizados de site e implementação são cotados separadamente."
              },
              "customerExperiences": {
                  "eyebrow": "EXPERIÊNCIAS DE CLIENTES",
                  "title": "Coloque a Cortexa para Trabalhar em Toda a Sua Empresa.",
                  "description": "Escolha o espaço de trabalho certo, configure seu agente de IA, conecte os pontos de entrada de clientes e ofereça à sua equipe um sistema inteligente para gerenciar o que acontece em seguida.",
                  "testimonials": [
                      {
                          "quote": "A Cortexa reuniu nossas consultas de clientes, agendamentos e acompanhamentos em um processo claro. Nossa equipe consegue ver o que precisa de atenção sem alternar entre sistemas desconectados.",
                          "role": "Gerente de Operações Clínicas",
                          "workspace": "Espaço Clínica e Medicina"
                      },
                      {
                          "quote": "O agente de IA oferece aos clientes uma resposta imediata e captura as informações de que nossa equipe precisa antes que uma pessoa intervenha. Isso tornou cada conversa mais organizada.",
                          "role": "Diretor de Vendas",
                          "workspace": "Espaço de Vendas"
                      },
                      {
                          "quote": "Finalmente temos um espaço de trabalho que reflete como nossa empresa realmente funciona. A configuração guiada deixou claro o que conectar e como cada cliente deve avançar.",
                          "role": "Proprietário da Empresa",
                          "workspace": "Business Suite"
                      }
                  ],
                  "ctaTitle": "Pronto para criar uma forma mais conectada de operar?",
                  "cta": "Começar",
                  "explore": "Explorar Espaços da Cortexa",
                  "note": "Substitua os depoimentos de exemplo por declarações verificadas de clientes antes de publicar."
              },
              "connectedJourney": {
                  "eyebrow": "UMA JORNADA DO CLIENTE CONECTADA",
                  "title": "Cada ponto de entrada do cliente. Um fluxo empresarial inteligente.",
                  "description": "A Cortexa conecta como os clientes descobrem sua empresa, se comunicam com ela, entram no seu CRM, avançam pelo espaço de trabalho correto e chegam à conversão certa ou ao atendimento humano.",
                  "closing": "Do primeiro contato à próxima melhor ação, tudo permanece conectado.",
                  "cta": "Explorar a Plataforma Cortexa"
              },
              "appointmentAutomation": {
                  "eyebrow": "AUTOMAÇÃO DE AGENDAMENTOS",
                  "title": "Seu Agente de IA Agenda Compromissos 24/7.",
                  "description": "A Cortexa verifica sua disponibilidade em tempo real, oferece horários adequados, agenda ou remarca compromissos, atualiza seu calendário e CRM e mantém sua equipe informada mesmo quando ninguém está disponível para responder.",
                  "customer": "Cliente", "agent": "Agente de IA Cortexa",
                  "messages": ["Gostaria de agendar uma consulta na sexta-feira à tarde.", "Tenho 14:30 ou 16:00 disponíveis. Qual horário funciona melhor?", "14:30.", "Seu horário está confirmado para sexta-feira às 14:30."],
                  "confirmed": "Agendamento Confirmado", "time": "Sexta-feira • 14:30",
                  "meta": "Calendário atualizado • CRM atualizado • Confirmação enviada",
                  "benefits": ["Verifica sua disponibilidade em tempo real", "Agenda, remarca e confirma compromissos", "Envia lembretes e mantém os registros dos clientes atualizados"]
              }
      }
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

  const workspaceIncludeIcons = [
    MessageCircle,
    UserCheck,
    Users2,
    BarChart3,
    CalendarDays,
    Workflow,
    PieChart,
    Link2,
  ];

  const workspaceIncludeClasses = [
    "blue",
    "cyan",
    "purple",
    "royal",
    "sky",
    "violet",
    "blue",
    "royal",
  ];

  const workspaceChooserIcons = [
    Building2,
    TrendingUp,
    Shield,
    Landmark,
    ShoppingCart,
    Headphones,
  ];

  const workspaceChooserColors = [
    "blue",
    "purple",
    "green",
    "pink",
    "royal",
    "orange",
  ];

  const moreWorkspaceIcons = [
    Home,
    Users2,
    Magnet,
    HeartPulse,
    Stethoscope,
  ];

  const selectedWorkspaceIcons = [
    UserCheck,
    CalendarDays,
    FileText,
    Bell,
  ];

  const selectedWorkspaceColors = ["cyan", "blue", "violet", "purple"];

  const guidedSetupIcons = [
    Building2,
    Link2,
    Bot,
    Play,
  ];

  const guidedSetupColors = ["blue", "purple", "cyan", "pink"];

  const moreWorkspaceColors = [
    "green",
    "purple",
    "blue",
    "pink",
    "cyan",
  ];

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
        <a href={lp("/")}>
          <img
            src={headlogoImg}
            alt="Cortexa Agentic CRM"
            className="m-logo"
            width="293"
            height="70"
          />
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
              "m-workspace", // Pipeline: the Team Revenue Workspace section
              "analytics",
              "testimonials",
            ];
            // Testimonials section removed; skip its nav link.
            if (ids[i] === "testimonials") return null;

            return (
              <HashLink className="nav-menu" key={i} smooth to={lp(`/#${ids[i]}`)}>
                {n}
              </HashLink>
            );
          })}

          <a href={lp("/pricing")} onClick={trackCta("drawer_pricing", tr.pricing)}>{tr.pricing}</a>
          <a href={lp("/editorial/the-end-of-legacy-crm")}>Cost Calculator</a>
          <a href="/web-solutions" onClick={trackCta("drawer_web_solutions", tr.webSolutions)}>{tr.webSolutions}</a>
          {isAuthenticated() ? (
            <Link to="/dashboard/home" className="m-login-btn">
              <LogIn /> Dashboard
            </Link>
          ) : (
            <Link to={lp("/sign-in")} className="m-login-btn">
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
        </h1>

        <p className="m-description">{tr.heroDesc}</p>
        <div className="m-hero-actions">
          <a
            href={lp("/trial?flow=free-access&plan=free")}
            className="m-hero-cta m-hero-cta-trial m-hero-free-access-main"
            onClick={trackCta("hero_get_started", tr.ctaButtonText)}
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

        </div>

        {/* dashboard image */}
        <div className="m-dashboard">
          <img
            src={landingDashImg}
            alt="Cortexa Agentic CRM dashboard with AI command center, lead, pipeline and revenue metrics"
            width="733"
            height="519"
            fetchpriority="high"
          />
        </div>
      </section>

      {/* SPECIALIZED WORKSPACES */}
      <section id="features" className="m-specialized-workspaces">
        <div className="m-specialized-workspaces-inner">
          <div className="m-specialized-eyebrow">
            <span className="m-specialized-line" />
            <span className="m-specialized-eyebrow-text">
              {tr.workspacesSection.eyebrow}
            </span>
            <span className="m-specialized-line" />
          </div>

          <h2 className="m-specialized-title">
            <span>{tr.workspacesSection.titleLine1}</span>
            <span>{tr.workspacesSection.titleLine2}</span>
            <span>{tr.workspacesSection.titleLine3}</span>
          </h2>

          <p className="m-specialized-description">
            {tr.workspacesSection.description}
          </p>

          <h3 className="m-specialized-includes-title">
            {tr.workspacesSection.includesTitle}
          </h3>

          <div className="m-specialized-list">
            {tr.workspacesSection.items.map((item, index) => {
              const Icon = workspaceIncludeIcons[index];

              return (
                <div className="m-specialized-item" key={item}>
                  <div
                    className={`m-specialized-icon m-specialized-icon-${workspaceIncludeClasses[index]}`}
                  >
                    <Icon size={34} strokeWidth={1.9} aria-hidden="true" />
                  </div>

                  <span className="m-specialized-item-label">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORKSPACE CHOOSER */}
      <section className="m-workspace-chooser">
        <div className="m-workspace-chooser-inner">
          <h2 className="m-workspace-chooser-title">
            {tr.workspaceChooser.title}
          </h2>

          <div className="m-workspace-chooser-list">
            {tr.workspaceChooser.items.map((item, index) => {
              const Icon = workspaceChooserIcons[index];

              return (
                <div className="m-workspace-chooser-item" key={item}>
                  <div className="m-workspace-chooser-left">
                    <div
                      className={`m-workspace-chooser-icon m-workspace-chooser-icon-${workspaceChooserColors[index]}`}
                    >
                      <Icon size={35} strokeWidth={1.9} aria-hidden="true" />
                    </div>

                    <span className="m-workspace-chooser-label">{item}</span>
                  </div>

                  <ChevronRight
                    className="m-workspace-chooser-arrow"
                    size={32}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MORE SPECIALIZED WORKSPACES */}
      <section className="m-more-workspaces">
        <div className="m-more-workspaces-inner">
          <p className="m-more-workspaces-eyebrow">{tr.moreWorkspaces.eyebrow}</p>

          <div className="m-more-workspaces-list">
            {tr.moreWorkspaces.items.map((item, index) => {
              const Icon = moreWorkspaceIcons[index];
              const isSelected = index === 4;

              return (
                <div
                  className={`m-more-workspaces-item ${isSelected ? "selected" : ""}`}
                  key={item}
                >
                  <div className="m-more-workspaces-left">
                    <div
                      className={`m-more-workspaces-icon m-more-workspaces-icon-${moreWorkspaceColors[index]}`}
                    >
                      <Icon size={35} strokeWidth={1.9} aria-hidden="true" />
                    </div>

                    <div className="m-more-workspaces-copy">
                      <span className="m-more-workspaces-label">{item}</span>
                      {isSelected && (
                        <span className="m-more-workspaces-selected">
                          {tr.moreWorkspaces.selected}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight
                    className="m-more-workspaces-arrow"
                    size={32}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SELECTED WORKSPACE DETAIL */}
      <section className="m-selected-workspace-detail">
        <div className="m-selected-workspace-detail-inner">
          <div className="m-selected-workspace-hero-icon">
            <Stethoscope size={70} strokeWidth={1.75} aria-hidden="true" />
          </div>

          <p className="m-selected-workspace-eyebrow">
            {tr.selectedWorkspaceDetail.eyebrow}
          </p>

          <h2 className="m-selected-workspace-title">
            {tr.selectedWorkspaceDetail.title}
          </h2>

          <p className="m-selected-workspace-description">
            {tr.selectedWorkspaceDetail.description}
          </p>

          <div className="m-selected-workspace-links">
            {tr.selectedWorkspaceDetail.items.map((item, index) => {
              const Icon = selectedWorkspaceIcons[index];

              return (
                <div className="m-selected-workspace-link" key={item}>
                  <div className="m-selected-workspace-link-left">
                    <Icon
                      className={`m-selected-workspace-link-icon m-selected-workspace-link-icon-${selectedWorkspaceColors[index]}`}
                      size={34}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </div>
                  <ChevronRight size={28} strokeWidth={1.8} aria-hidden="true" />
                </div>
              );
            })}
          </div>

          <a className="m-selected-workspace-preview" href="#m-workspace">
            {tr.selectedWorkspaceDetail.preview}
            <ArrowRight size={22} strokeWidth={2} aria-hidden="true" />
          </a>

          <div className="m-selected-workspace-divider" />

          <p className="m-selected-workspace-connected">
            {tr.selectedWorkspaceDetail.connected}
          </p>

          <a className="m-selected-workspace-explore" href="#m-workspace">
            <span>{tr.selectedWorkspaceDetail.explore}</span>
            <ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" />
          </a>

          <p className="m-selected-workspace-note">
            {tr.selectedWorkspaceDetail.note}
          </p>
        </div>
      </section>

      {/* GUIDED CORTEXA SETUP */}
      <section className="m-guided-setup">
        <div className="m-guided-setup-inner">
          <div className="m-guided-setup-eyebrow">
            <span />
            <strong>{tr.guidedSetup.eyebrow}</strong>
            <span />
          </div>

          <h2 className="m-guided-setup-title">{tr.guidedSetup.title}</h2>

          <p className="m-guided-setup-description">
            {tr.guidedSetup.description}
          </p>

          <div className="m-guided-setup-steps">
            {tr.guidedSetup.steps.map((step, index) => {
              const Icon = guidedSetupIcons[index];

              return (
                <div className="m-guided-setup-step" key={step.title}>
                  <div className="m-guided-setup-number">{index + 1}</div>

                  <div
                    className={`m-guided-setup-icon m-guided-setup-icon-${guidedSetupColors[index]}`}
                  >
                    <Icon size={34} strokeWidth={1.9} aria-hidden="true" />
                  </div>

                  <div className="m-guided-setup-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="m-guided-setup-help">
            <h3>{tr.guidedSetup.helpTitle}</h3>
            <p>{tr.guidedSetup.helpDescription}</p>

            <a className="m-guided-setup-request" href={lp("/contact")}>
              <span>{tr.guidedSetup.request}</span>
              <ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" />
            </a>

            <a className="m-guided-setup-guide" href={lp("/setup-guide")}>
              {tr.guidedSetup.guide}
            </a>

            <p className="m-guided-setup-note">{tr.guidedSetup.note}</p>
          </div>
        </div>
      </section>

      {/* WORKSPACE CLOSING / CONNECTED SYSTEM */}
      <section className="m-workspace-closing">
        <div className="m-workspace-closing-inner">
          <h2 className="m-workspace-closing-title">
            <span>{tr.workspaceClosing.title1}</span>
            <span>{tr.workspaceClosing.title2}</span>
            <span className="m-workspace-closing-accent">
              {tr.workspaceClosing.titleAccent}
            </span>
          </h2>

          <p className="m-workspace-closing-description">
            {tr.workspaceClosing.description}
          </p>

          <div className="m-workspace-closing-short-divider" />

          <blockquote className="m-workspace-closing-quote">
            <span className="m-workspace-quote-mark m-workspace-quote-open">“</span>
            <p>{tr.workspaceClosing.quote}</p>
            <span className="m-workspace-quote-mark m-workspace-quote-close">”</span>
          </blockquote>

          <div className="m-workspace-connected-system">
            <p className="m-workspace-connected-eyebrow">
              {tr.workspaceClosing.eyebrow}
            </p>

            <p className="m-workspace-connected-paragraph">
              {tr.workspaceClosing.paragraph1}
            </p>

            <div className="m-workspace-connected-divider" />

            <p className="m-workspace-connected-paragraph">
              {tr.workspaceClosing.paragraph2}
            </p>

            <div className="m-workspace-connected-divider" />

            <p className="m-workspace-connected-paragraph">
              {tr.workspaceClosing.paragraph3a}{" "}
              <a
                href="/web-solutions"
                className="m-workspace-web-link"
                onClick={trackCta("workspace_closing_web_solutions_link", tr.workspaceClosing.webSolutions)}
              >
                {tr.workspaceClosing.webSolutions}
              </a>{" "}
              {tr.workspaceClosing.paragraph3b}
            </p>

            <a
              href="/web-solutions"
              className="m-workspace-web-cta"
              onClick={trackCta("workspace_closing_web_solutions", tr.workspaceClosing.cta)}
            >
              <span>{tr.workspaceClosing.cta}</span>
              <ArrowRight size={22} strokeWidth={2.2} aria-hidden="true" />
            </a>

            <p className="m-workspace-web-note">
              {tr.workspaceClosing.note}
            </p>
          </div>
        </div>
      </section>

      {/* TEAM WORKSPACE + WEB SOLUTIONS SHOWCASE */}
      <section className="m-team-workspace-showcase">
        <div className="m-team-workspace-showcase-inner">
          <div className="m-showcase-eyebrow m-team-showcase-eyebrow">
            <span className="m-showcase-eyebrow-line" />
            <span>{tr.teamWorkspaceShowcase.eyebrow}</span>
            <span className="m-showcase-eyebrow-line" />
          </div>

          <h2 className="m-team-showcase-title">
            {tr.teamWorkspaceShowcase.title}
          </h2>

          <p className="m-team-showcase-description">
            {tr.teamWorkspaceShowcase.description}
          </p>

          <div className="m-team-showcase-benefits">
            {tr.teamWorkspaceShowcase.benefits.map((item, index) => {
              const Icon = [UsersRound, ClipboardList, CircleCheckBig][index];
              const tone = ["blue", "purple", "teal"][index];

              return (
                <div className="m-team-showcase-benefit" key={item.title}>
                  <div className={`m-team-showcase-icon m-team-showcase-icon-${tone}`}>
                    <Icon size={36} strokeWidth={1.9} aria-hidden="true" />
                  </div>

                  <div className="m-team-showcase-benefit-copy">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="m-team-showcase-closing">
            {tr.teamWorkspaceShowcase.closing}
          </h2>

          <a href="/dashboard/team" className="m-team-showcase-cta">
            <span>{tr.teamWorkspaceShowcase.cta}</span>
            <ArrowRight size={24} strokeWidth={2} aria-hidden="true" />
          </a>

          <p className="m-team-showcase-note">
            {tr.teamWorkspaceShowcase.note}
          </p>
        </div>
      </section>

      <section className="m-web-solutions-showcase">
        <div className="m-web-solutions-showcase-inner">
          <p className="m-web-solutions-showcase-eyebrow">
            {tr.webSolutionsShowcase.eyebrow}
          </p>

          <h2 className="m-web-solutions-showcase-title">
            {tr.webSolutionsShowcase.title}
          </h2>

          <p className="m-web-solutions-showcase-description">
            {tr.webSolutionsShowcase.description}
          </p>

          <div className="m-web-solutions-showcase-benefits">
            {tr.webSolutionsShowcase.benefits.map((item, index) => {
              const Icon = [Sparkles, Target, Link2][index];
              const tone = ["purple", "blue", "purple"][index];

              return (
                <div className="m-web-solutions-showcase-benefit" key={item.title}>
                  <div className={`m-web-solutions-showcase-icon m-web-solutions-showcase-icon-${tone}`}>
                    <Icon size={38} strokeWidth={1.9} aria-hidden="true" />
                  </div>

                  <div className="m-web-solutions-showcase-copy">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="m-web-connected-showcase">
        <div className="m-web-connected-showcase-inner">
          <div className="m-showcase-eyebrow m-web-connected-eyebrow">
            <span className="m-showcase-eyebrow-line" aria-hidden="true" />
            <span>{tr.webSolutionsConnected.eyebrow}</span>
            <span className="m-showcase-eyebrow-line" aria-hidden="true" />
          </div>

          <h2 className="m-web-connected-title">{tr.webSolutionsConnected.title}</h2>
          <p className="m-web-connected-description">{tr.webSolutionsConnected.description}</p>

          <div className="m-web-connected-phone">
            <img
              src={webSolutionsPhoneImg}
              alt="Cortexa Web Solutions mobile website with AI Agent"
              width="490"
              height="960"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="m-web-connected-entry-eyebrow">{tr.webSolutionsConnected.entryEyebrow}</p>

          <div className="m-web-connected-entry-grid">
            {tr.webSolutionsConnected.entries.map((label, index) => {
              const Icon = [FileText, Phone, MessagesSquare, MessageCircle][index];
              return (
                <div className="m-web-connected-entry" key={label}>
                  <Icon size={30} strokeWidth={1.9} aria-hidden="true" />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="m-web-connected-existing">
            <h3>{tr.webSolutionsConnected.existingTitle}</h3>
            <p>{tr.webSolutionsConnected.existingDescription}</p>
          </div>

          <a
            href="/web-solutions"
            className="m-web-connected-cta"
            onClick={trackCta("web_connected_web_solutions", tr.webSolutionsConnected.cta)}
          >
            <span>{tr.webSolutionsConnected.cta}</span>
            <ArrowRight size={25} strokeWidth={1.8} aria-hidden="true" />
          </a>

          <p className="m-web-connected-note">{tr.webSolutionsConnected.note}</p>
        </div>
      </section>

      {/* CUSTOMER EXPERIENCES */}
      <section className="m-customer-experiences">
        <div className="m-customer-experiences-inner">
          <div className="m-customer-experiences-topline" aria-hidden="true" />

          <p className="m-customer-experiences-eyebrow">
            {tr.customerExperiences.eyebrow}
          </p>

          <h2 className="m-customer-experiences-title">
            {tr.customerExperiences.title}
          </h2>

          <p className="m-customer-experiences-description">
            {tr.customerExperiences.description}
          </p>

          <div className="m-customer-testimonials">
            {tr.customerExperiences.testimonials.map((item, index) => {
              const avatar = [
                clinicOperationsManagerImg,
                salesDirectorImg,
                businessOwnerImg,
              ][index];

              return (
                <article className="m-customer-testimonial" key={item.role}>
                  {index > 0 && (
                    <div
                      className="m-customer-testimonial-divider"
                      aria-hidden="true"
                    />
                  )}

                  <div className="m-customer-quote-mark" aria-hidden="true">
                    “
                  </div>

                  <blockquote className="m-customer-testimonial-quote">
                    {item.quote}
                  </blockquote>

                  <img
                    className="m-customer-testimonial-avatar"
                    src={avatar}
                    alt=""
                    aria-hidden="true"
                    width={[234, 220, 220][index]}
                    height={[234, 220, 220][index]}
                    loading="lazy"
                    decoding="async"
                  />

                  <h3 className="m-customer-testimonial-role">{item.role}</h3>
                  <p className="m-customer-testimonial-workspace">
                    {item.workspace}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="m-customer-experiences-cta-block">
            <h2 className="m-customer-experiences-cta-title">
              {tr.customerExperiences.ctaTitle}
            </h2>

            <Link
              to={lp("/sign-up")}
              className="m-customer-experiences-cta"
              onClick={trackCta("customer_experiences_get_started", tr.customerExperiences.cta)}
            >
              <span>{tr.customerExperiences.cta}</span>
              <ArrowRight size={28} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            <a href="#features" className="m-customer-experiences-explore">
              {tr.customerExperiences.explore}
            </a>

          </div>
        </div>
      </section>

      {/* ONE CONNECTED CUSTOMER JOURNEY */}
      <section id="automation" className="m-connected-journey">
        <div className="m-connected-journey-inner">
          <p className="m-connected-journey-eyebrow">
            {tr.connectedJourney.eyebrow}
          </p>

          <h2 className="m-connected-journey-title">
            {tr.connectedJourney.title}
          </h2>

          <p className="m-connected-journey-description">
            {tr.connectedJourney.description}
          </p>

          <div className="m-connected-journey-diagram">
            <img
              src={connectedCustomerJourneyImg}
              alt="Cortexa connected customer journey: website, advertising, phone and WhatsApp leads flow through the AI agent into the CRM, the right workspace and pipeline"
              width="655"
              height="2322"
              loading="lazy"
              decoding="async"
            />
          </div>

          <h2 className="m-connected-journey-closing">
            {tr.connectedJourney.closing}
          </h2>

          <Link to={lp("/features")} className="m-connected-journey-cta">
            <span>{tr.connectedJourney.cta}</span>
            <ArrowRight size={28} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section id="m-workspace">
        <div className="aios-container">
          <div className="aios-container-title">
            {tr.aiosSectionTitle}
            <br />
            {tr.aiosSectionTitle1}
            <br />
            {tr.aiosSectionTitle2}
          </div>
          <img
            src={workspace}
            alt="Cortexa Team Revenue Workspace connecting tasks, leads, appointments, messages and notes"
            width={(WORKSPACE_SIZE[lang] || WORKSPACE_SIZE.en)[0]}
            height={(WORKSPACE_SIZE[lang] || WORKSPACE_SIZE.en)[1]}
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
      

      {/* APPOINTMENT AUTOMATION */}
      <section id="ai-assistant" className="m-appointment-automation">
        <div className="m-appointment-automation-inner">
          <p className="m-appointment-automation-eyebrow">{tr.appointmentAutomation.eyebrow}</p>
          <h2 className="m-appointment-automation-title">{tr.appointmentAutomation.title}</h2>
          <p className="m-appointment-automation-description">{tr.appointmentAutomation.description}</p>

          <div className="m-appointment-chat">
            {tr.appointmentAutomation.messages.map((message, index) => {
              const isAgent = index === 1 || index === 3;
              return (
                <div className={`m-appointment-message ${isAgent ? "agent" : "customer"}`} key={index}>
                  <div className={`m-appointment-avatar ${isAgent ? "agent" : "customer"}`}>
                    {isAgent ? (
                      <img
                        src={cortexaAiAgentIcon}
                        alt=""
                        aria-hidden="true"
                        className="m-appointment-agent-icon"
                        width="84"
                        height="80"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <UserCheck size={25} strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="m-appointment-bubble">
                    <span className="m-appointment-speaker">
                      {isAgent ? tr.appointmentAutomation.agent : tr.appointmentAutomation.customer}
                    </span>
                    <p>{message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="m-appointment-confirmed">
            <div className="m-appointment-confirmed-icon"><Check size={36} strokeWidth={3} /></div>
            <div className="m-appointment-confirmed-divider" />
            <div className="m-appointment-confirmed-copy">
              <h3>{tr.appointmentAutomation.confirmed}</h3>
              <p>{tr.appointmentAutomation.time}</p>
              <span>{tr.appointmentAutomation.meta}</span>
            </div>
          </div>

          <div className="m-appointment-benefits">
            {tr.appointmentAutomation.benefits.map((item, index) => {
              const BenefitIcon = index === 0 ? CalendarDays : index === 1 ? Workflow : ClipboardList;
              return (
                <div className="m-appointment-benefit" key={item}>
                  <div className="m-appointment-benefit-icon"><BenefitIcon size={36} strokeWidth={1.8} /></div>
                  <p>{item}</p>
                </div>
              );
            })}
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
          <img
            src={powerfulM}
            alt="Apps that connect with Cortexa, including WhatsApp, Gmail, Slack, HubSpot, Salesforce and Zapier"
            width="448"
            height="440"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
      {/* TESTIMONIALS SECTION */}

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
            {tr.finalCtaDesc} <span className="text-blue">{tr.finalCtaBrand}</span>
          </p>

          <div className="m-bottom-action-wrapper">
            <a
              href={lp("/trial?flow=free-access&plan=free")}
              className="m-bottom-primary-btn"
              onClick={trackCta("final_get_started", tr.ctaButtonText)}
            >
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
                <span>{tr.ctaButtonText}</span>
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
              alt="Cortexa Agentic CRM mobile dashboard with AI command center, top leads and revenue trend"
              className="m-bottom-preview-img"
              width="793"
              height="1365"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* EXPLORE OUR MARKETS SECTION */}
      <section id="markets" className="m-markets">
        <div className="m-markets-header">
          <p className="m-markets-subtitle">{tr.marketsSubtitle}</p>
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
                  <img src={`https://flagcdn.com/w40/br.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/mx.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/ar.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/cl.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/co.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/pe.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/ec.png`} alt="" loading="lazy" decoding="async" />
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

            {/* ================= EUROPE & UNITED STATES ================= */}
            <div className="m-region-group-header">
              <Globe />
              <span>{tr.regionEuropeUs || `${tr.regionEurope} & ${tr.regionUSA}`}</span>
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
                  <img src={`https://flagcdn.com/w40/gb.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/es.png`} alt="" loading="lazy" decoding="async" />
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
                  <img src={`https://flagcdn.com/w40/pt.png`} alt="" loading="lazy" decoding="async" />
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

            {/* UNITED STATES */}
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
                  <img src={`https://flagcdn.com/w40/us.png`} alt="" loading="lazy" decoding="async" />
                  <span className="m-market-name">United States</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
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
              </div>
            </div>

            {/* CANADA */}
            <div
              className={`m-market-row-block ${activeMarket === "ca" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "ca" ? null : "ca")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/ca.png`} alt="" loading="lazy" decoding="async" />
                  <span className="m-market-name">Canada</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"].map(
                    (c) => (
                      <a
                        key={c}
                        href={`/canada/${c.toLowerCase().replace(/ /g, "-")}`}
                        className="m-city-lnk"
                      >
                        <MapPin size={15} /> {c}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* AUSTRALIA */}
            <div
              className={`m-market-row-block ${activeMarket === "au" ? "open" : ""}`}
            >
              <div
                className="m-market-item"
                onClick={() =>
                  setActiveMarket(activeMarket === "au" ? null : "au")
                }
              >
                <div className="m-market-left">
                  <img src={`https://flagcdn.com/w40/au.png`} alt="" loading="lazy" decoding="async" />
                  <span className="m-market-name">Australia</span>
                </div>
                <span className="m-arrow-icon">▼</span>
              </div>
              <div className="m-cities-dropdown">
                <div className="m-cities-grid">
                  {["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"].map(
                    (c) => (
                      <a
                        key={c}
                        href={`/australia/${c.toLowerCase().replace(/ /g, "-")}`}
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
            <a href="#markets">
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
            <img
              src={headlogoImg}
              alt="Cortexa Agentic CRM"
              className="m-logo"
              width="293"
              height="70"
              loading="lazy"
              decoding="async"
            />
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
            <a href={lp("/features")}>{tr.fFeatures}</a>
            <HashLink smooth to={lp("/features#ai-assistant")}>
              {tr.fAiAssistant}
            </HashLink>
            <HashLink smooth to={lp("/features#automations")}>
              {tr.fAutomations}
            </HashLink>
            <a href={lp("/integrations")}>{tr.fIntegrations}</a>
            <HashLink smooth to={lp("/features#analytics")}>
              {tr.fAnalytics}
            </HashLink>
            <a href={lp("/pricing")} onClick={trackCta("footer_pricing", tr.fPricing)}>{tr.fPricing}</a>
            <a href={lp("/editorial/the-end-of-legacy-crm")}>Cost Calculator</a>
            <a href="/web-solutions" onClick={trackCta("footer_web_solutions", tr.webSolutions)}>{tr.webSolutions}</a>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colGetStarted}</h4>
            <a href={lp("/trial?flow=free-access&plan=free")} onClick={trackCta("footer_get_started", tr.fStart)}>{tr.fStart}</a>
            <a href={lp("/sign-in")}>{tr.fLogin}</a>
            <a href={lp("/setup-guide")}>{tr.fSetup}</a>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colConnect}</h4>
            <HashLink smooth to={lp("/integrations#connect-apps")}>
              {tr.fConnectApps}
            </HashLink>
            <HashLink smooth to={lp("/integrations#import-crm")}>
              {tr.fImportCrm}
            </HashLink>
            <HashLink smooth to={lp("/integrations#import-csv")}>
              {tr.fImportCsv}
            </HashLink>
            <HashLink smooth to={lp("/integrations#zapier-automations")}>
              {tr.fZapier}
            </HashLink>
            <HashLink smooth to={lp("/integrations#api-webhooks")}>
              {tr.fApiWebhooks}
            </HashLink>
          </div>

          <div className="m-footer-column">
            <h4>{tr.colSupport}</h4>
            <a href={lp("/support")}>{tr.fSupport247}</a>
            <a href={lp("/help")}>{tr.fHelpCenter}</a>
            <a href={lp("/contact")}>{tr.fContact}</a>
            <a href={lp("/about")}>{tr.fAbout}</a>
          </div>

          <div className="m-footer-column full-width-mobile">
            <h4>{tr.colLegal}</h4>
            <a href={lp("/terms")}>{tr.fTerms}</a>
            <a href={lp("/privacy-policy")}>{tr.fPrivacy}</a>
            <a href={lp("/refund-policy")}>{tr.fRefund}</a>
            <a href={lp("/cancellation")}>{tr.fCancel}</a>
          </div>
        </div>

        <div className="m-footer-bottom">
          <p className="m-footer-copy-text">{tr.copyright}</p>
          <div className="m-footer-bottom-links">
            <a href={lp("/privacy-policy")}>{tr.fPrivacy}</a>
            <span className="m-divider">|</span>
            <a href={lp("/terms")}>{tr.termsOfService}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}