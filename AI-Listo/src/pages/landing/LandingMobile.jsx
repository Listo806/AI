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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { HashLink } from "react-router-hash-link";
import "./LandingMobile.css";

import headlogoImg from "../../assets/cortexa/headlogotran.png";
import landingDashImg from "../../assets/cortexa/mobile/m_dash1.png";
import dashboardMockupImg from "../../assets/cortexa/img_desktop_none.png";
import featurechart from "../../assets/cortexa/mobile/featurechart.png";
import powerfulM from "../../assets/cortexa/mobile/powerfulM.png";
import workspaceImg from "../../assets/cortexa/mobile/workspaceM.png";
import workspaceImgES from "../../assets/cortexa/mobile/workspaceESM.png";
import workspaceImgPT from "../../assets/cortexa/mobile/workspacePTM.png";

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
      badge: "AI-POWERED",
      badge1: "REAL ESTATE AGENTS & TEAMS",
      heroTitle1: "Get Instant Leads.",
      heroTitle2: "Close More Deals.",
      heroTitle3: "24/7 with AI.",
      heroDesc:
        "All-in-one AI platform that helps you capture more leads, follow up instantly, close more deals, and grow revenue on autopilot.",
      login: "Log in",
      trial: "Get Started",
      nav: [
        "Features",
        "AI Assistant",
        "AI Automation",
        "Pipeline",
        "Analytics",
        "Testimonials",
      ],
      pricing: "Pricing",
      watchDemo: "Watch Demo",
      trusted: "Built for real estate agents.",

      benefitsSubtitle: "WHAT CORTEXA DOES FOR YOU",
      benefitsTitle1: "Everything You Need.",
      benefitsTitle2: "All in One Place.",
      followUpTitle: "Automated Follow-Ups",
      followUpDesc:
        "Automatically follows up on new leads so fewer slip through the cracks.",
      setterTitle: "AI Appointment Setter",
      setterDesc:
        "Qualifies leads, books appointments, and moves opportunities forward.",
      pipelineTitle: "Pipeline Management",
      pipelineDesc:
        "See your entire pipeline at a glance and never lose track of a deal.",
      analyticsTitle: "Real-Time Analytics",
      analyticsDesc:
        "Track performance in real time and make data-driven decisions.",
      whatsappTitle: "WhatsApp Integration",
      whatsappDesc: "Chat with leads where they are and close faster.",

      platformSubtitle: "A REAL ESTATE PLATFORM",
      platformTitle: "BUILT FOR REAL ESTATE",
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

      flowSubtitle: "FROM FIRST LEAD TO CLOSING",
      flowTitle: "Everything is handled inside one system.",
      flowLabel1: "Ads",
      flowLabel2: "OS",
      flowLabel3: "WhatsApp",
      flowLabel4: "AI",
      flowText1: "Capture",
      flowText2: "Engage",
      flowText3: "Nurture",
      flowText4: "Close",

      setterSectionSubtitle: "AI APPOINTMENT SETTER",
      setterSectionTitle1: "Close Deals Faster",
      setterSectionTitle2: "with AI",
      setterSectionDesc:
        "AI qualifies leads, books appointments, and moves opportunities forward while your team focuses on closing.",
      bookAppointmentTitle: "Book Appointment",
      selectDateLabel: "Select Date",
      selectTimeLabel: "Select Time",
      confirmBtnText: "Confirm Appointment",

      ctaSubtitle: "AI ASSISTANT",
      ctaTitle1: "Turn your data into",
      ctaTitle2: "deals — with AI",
      ctaTitle3: "working for you 24/7.",
      ctaStat1Label: "ROI",
      ctaStat2Label: "REVENUE INCREASE",
      ctaStat3Label: "AGENTS GROWING",
      ctaButtonText: "Start Your Free Trial",
      underCTA: "One-time setup fee: $97",

      faqSubtitle: "FAQS",
      faqTitle: "Everything you need to know",
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

      finalCtaSubtitle: "AUTOMATE YOUR SUCCESS",
      finalCtaTitle1: "Get More Leads.",
      finalCtaTitle2: "Close More Deals.",
      finalCtaTitle3: "Grow Your Business.",
      finalCtaDesc:
        "Join real estate professionals who are growing with CORTEXA.",
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
      vsTitleLeft: "OTHER TOOLS OFTEN COME WITH",
      leftCost1: "High setup fees",
      leftCost2: "Add-ons and upgrades you pay for separately",
      leftCost3: "Multiple disconnected tools",
      leftCost4: "Complex onboarding that slows your team down",
      leftCost5: "Hidden costs that add up over time",
      vsTitleRight: "OUR ALL-IN-ONE WORKSPACE",
      rightBenefit1: "Simple setup fee",
      rightBenefit2: "Everything included. No add-ons.",
      rightBenefit3: "One connected workspace",
      rightBenefit4: "Faster implementation",
      rightBenefit5: "Transparent pricing. No surprises.",
      stat2Title: "",

      titlePre: "Reporting that ",
      titleActive: "actually ",
      titleActive1: "works.",
      subtitle: "In-app. Live. Actionable.",
      card1Title: "Live Performance",
      card1Right: "Live Performance Dashboards",
      card2Title: "Customer Report",
      card2Right: "Custom Reports in Seconds",
      card3Title: "Analytics Overview",
      card3Right: "Visual Insights That Drive Action",
      card4Title: "Pipeline Overview",
      card4Right: "Team & Pipeline Visibility",
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
        "Your AI Agent finds, captures, and qualifies leads automatically",
      heroCheck7: "Multi-chanel outreach via calls, texts, Whatsapp & more",
      heroCheck8: "Automated follow-ups and appointment booking run 24/7",
      heroCheck9:
        "Pipeline Intelligence, revenue forecasting, one connected dashboard.",

      powerbadge: "INTEGRATION",
      powertitle: "Connect your apps",

      workspacelang1: "Team",
      workspacelang2: "Revenue",
      workspacelang3: "Workspace",
    },

    es: {
      badge: "IMPULSADO POR IA",
      badge1: "AGENTES Y EQUIPOS INMOBILIARIOS",
      heroTitle1: "Obtén Más Leads.",
      heroTitle2: "Cierra Más Ventas.",
      heroTitle3: "24/7 con IA.",
      heroDesc:
        "Plataforma de IA todo en uno que te ayuda a captar más clientes potenciales, dar seguimiento al instante, cerrar más ventas y aumentar los ingresos en piloto automático.",
      login: "Iniciar sesión",
      trial: "Comenzar",
      nav: [
        "Funciones",
        "Asistente IA",
        "Automatización IA",
        "Pipeline",
        "Analítica",
        "Testimonios",
      ],
      pricing: "Precios",
      watchDemo: "Ver Demo",
      trusted: "Creado para agentes inmobiliarios.",
      benefitsSubtitle: "LO QUE CORTEXA HACE POR TI",
      benefitsTitle1: "Todo lo que necesitas.",
      benefitsTitle2: "En un solo lugar.",
      followUpTitle: "Seguimientos Automatizados",
      followUpDesc:
        "Hace seguimiento automático de los nuevos leads para que menos se escapen.",
      setterTitle: "Agendador de Citas con IA",
      setterDesc: "Califica leads, agenda citas y avanza las oportunidades.",
      pipelineTitle: "Gestión de Pipeline",
      pipelineDesc:
        "Mira todo tu pipeline de un vistazo y nunca pierdas el rastro de un trato.",
      analyticsTitle: "Analítica en Tiempo Real",
      analyticsDesc:
        "Realiza un seguimiento del rendimiento en tiempo real y toma decisiones basadas en datos.",
      whatsappTitle: "Integración con WhatsApp",
      whatsappDesc:
        "Chatea con tus leads donde ellos estén y cierra ventas más rápido.",

      platformSubtitle: "UNA PLATAFORMA INMOBILIARIA",
      platformTitle: "HECHA PARA BIENES RAÍCES",
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

      flowSubtitle: "DESDE EL PRIMER LEAD HASTA EL CIERRE",
      flowTitle: "Todo se maneja dentro de un solo sistema.",
      flowLabel1: "Anuncios",
      flowLabel2: "OS",
      flowLabel3: "WhatsApp",
      flowLabel4: "IA",
      flowText1: "Capturar",
      flowText2: "Interactuar",
      flowText3: "Nutrir",
      flowText4: "Cerrar",

      setterSectionSubtitle: "AGENDADOR DE CITAS CON IA",
      setterSectionTitle1: "Cierra Tratos Más Rápido",
      setterSectionTitle2: "con IA",
      setterSectionDesc:
        "La IA califica leads, agenda citas y avanza las oportunidades mientras tu equipo se enfoca en cerrar.",
      bookAppointmentTitle: "Agendar Cita",
      selectDateLabel: "Seleccionar Fecha",
      selectTimeLabel: "Seleccionar Hora",
      confirmBtnText: "Confirmar Cita",

      ctaSubtitle: "ASISTENTE IA",
      ctaTitle1: "Convierte tus datos en",
      ctaTitle2: "ventas — con la IA",
      ctaTitle3: "trabajando para ti 24/7.",
      ctaStat1Label: "ROI",
      ctaStat2Label: "AUMENTO DE INGRESOS",
      ctaStat3Label: "AGENTES CRECIENDO",
      ctaButtonText: "Comienza Tu Prueba Gratis",
      underCTA: "Tarifa única de configuración: $97",

      faqSubtitle: "PREGUNTAS FRECUENTES",
      faqTitle: "Todo lo que necesitas saber",
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

      finalCtaSubtitle: "AUTOMATIZA TU ÉXITO",
      finalCtaTitle1: "Obtén Más Leads.",
      finalCtaTitle2: "Cierra Más Tratos.",
      finalCtaTitle3: "Haz Crecer Tu Negocio.",
      finalCtaDesc:
        "Únete a profesionales inmobiliarios que están creciendo con CORTEXA.",
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
      vsTitleLeft: "OTRAS HERRAMIENTAS SUELEN INCLUIR",
      leftCost1: "Altas tarifas de configuración",
      leftCost2: "Complementos y actualizaciones que pagas por separado",
      leftCost3: "Múltiples herramientas desconectadas",
      leftCost4: "Onboarding complejo que frena a tu equipo",
      leftCost5: "Costos ocultos que se acumulan con el tiempo",
      vsTitleRight: "NUESTRO ESPACIO TODO EN UNO",
      rightBenefit1: "Tarifa de configuración simple",
      rightBenefit2: "Todo incluido. Sin complementos.",
      rightBenefit3: "Un espacio de trabajo conectado",
      rightBenefit4: "Implementación más rápida",
      rightBenefit5: "Precios transparentes. Sin sorpresas.",
      stat2Title: "",

      titlePre: "Informes que ",
      titleActive: "realmente ",
      titleActive1: "funcionan.",
      subtitle: "En la aplicación. En vivo. Accionable.",
      card1Title: "Rendimiento en Vivo",
      card1Right: "Paneles de Rendimiento en Vivo",
      card2Title: "Informe de Clientes",
      card2Right: "Informes Personalizados en Segundos",
      card3Title: "Resumen Analítico",
      card3Right: "Información Visual que Impulsa la Acción",
      card4Title: "Resumen de Pipeline",
      card4Right: "Visibilidad del Equipo y Pipeline",
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
        "Tu agente de IA encuentra, captura y califica leads automáticamente.",
      heroCheck7:
        "Alcance multicanal a través de llamadas, mensajes de texto, WhatsApp y más.",
      heroCheck8:
        "Los seguimientos automatizados y la reserva de citas funcionan las 24 horas del día, los 7 días de la semana.",
      heroCheck9:
        "Inteligencia de pipeline, previsión de ingresos y un panel de control unificado.",

      powerbadge: "INTEGRACIÓN",
      powertitle: "Conecta tus aplicaciones",

      workspacelang1: "Equipo",
      workspacelang2: "Ingresos",
      workspacelang3: "Espacio de trabajo",
    },

    pt: {
      badge: "POTENCIALIZADO POR IA",
      badge1: "CORRETORES E EQUIPES IMOBILIÁRIAS",
      heroTitle1: "Mais Leads.",
      heroTitle2: "Mais Negócios.",
      heroTitle3: "24/7 com IA.",
      heroDesc:
        "Plataforma de IA tudo-em-um que ajuda você a captar mais leads, fazer o acompanhamento instantaneamente, fechar mais negócios e aumentar a receita no piloto automático.",
      login: "Entrar",
      trial: "Começar",
      nav: [
        "Recursos",
        "Assistente IA",
        "Automação IA",
        "Pipeline",
        "Analytics",
        "Depoimentos",
      ],
      pricing: "Preços",
      watchDemo: "Ver Demo",
      trusted: "Feito para agentes imobiliários.",
      benefitsSubtitle: "O QUE A CORTEXA FAZ POR VOCÊ",
      benefitsTitle1: "Tudo o que você precisa.",
      benefitsTitle2: "Em um só lugar.",
      followUpTitle: "Acompanhamentos Automatizados",
      followUpDesc:
        "Acompanha automaticamente os novos leads para que menos escapem.",
      setterTitle: "Agendador de Reuniões com IA",
      setterDesc:
        "Qualifica leads, agenda reuniões e faz os negócios avançarem.",
      pipelineTitle: "Gestão de Pipeline",
      pipelineDesc:
        "Visualize todo o seu pipeline em um relance e nunca perca um negócio de vista.",
      analyticsTitle: "Analytics em Tempo Real",
      analyticsDesc:
        "Acompanhe o desempenho em tempo real e tome decisões baseadas em dados.",
      whatsappTitle: "Integração com WhatsApp",
      whatsappDesc:
        "Converse com os leads onde eles estão e feche negócios mais rápido.",

      platformSubtitle: "UMA PLATAFORMA IMOBILIÁRIA",
      platformTitle: "CONSTRUÍDA PARA O SETOR IMOBILIÁRIO",
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

      flowSubtitle: "DO PRIMEIRO LEAD AO FECHAMENTO",
      flowTitle: "Tudo é gerenciado dentro de um único sistema.",
      flowLabel1: "Anúncios",
      flowLabel2: "OS",
      flowLabel3: "WhatsApp",
      flowLabel4: "IA",
      flowText1: "Capturar",
      flowText2: "Engajar",
      flowText3: "Nutrir",
      flowText4: "Fechar",

      setterSectionSubtitle: "AGENDADOR DE REUNIÕES COM IA",
      setterSectionTitle1: "Feche Negócios Mais Rápido",
      setterSectionTitle2: "com IA",
      setterSectionDesc:
        "A IA qualifica leads, agenda reuniões e faz as oportunidades avançarem enquanto sua equipe se concentra em fechar.",
      bookAppointmentTitle: "Agendar Reunião",
      selectDateLabel: "Selecionar Data",
      selectTimeLabel: "Selecionar Horário",
      confirmBtnText: "Confirmar Reunião",

      ctaSubtitle: "ASSISTENTE IA",
      ctaTitle1: "Transforme seus dados em",
      ctaTitle2: "negócios — con a IA",
      ctaTitle3: "trabalhando para você 24/7.",
      ctaStat1Label: "ROI",
      ctaStat2Label: "AUMENTO DE RECEITA",
      ctaStat3Label: "AGENTES CRESCENDO",
      ctaButtonText: "Comece Seu Teste Grátis",
      underCTA: "Taxa única de configuração: $97",

      faqSubtitle: "PERGUNTAS FREQUENTES",
      faqTitle: "Tudo o que você precisa saber",
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

      finalCtaSubtitle: "AUTOMATIZE SEU SUCESSO",
      finalCtaTitle1: "Consiga Mais Leads.",
      finalCtaTitle2: "Feche Mais Negócios.",
      finalCtaTitle3: "Cresça Seu Negócio.",
      finalCtaDesc:
        "Junte-se a profissionais do setor imobiliário que estão crescendo com a CORTEXA.",
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
      vsTitleLeft: "OUTRAS FERRAMENTAS COSTUMAM INCLUIR",
      leftCost1: "Altas taxas de configuração",
      leftCost2: "Adicionais e atualizações pagos separadamente",
      leftCost3: "Múltiplas ferramentas desconectadas",
      leftCost4: "Integração complexa que desacelera sua equipe",
      leftCost5: "Custos ocultos que se acumulam com el tempo",
      vsTitleRight: "NOSSO ESPAÇO TUDO-EM-UM",
      rightBenefit1: "Taxa de configuração simples",
      rightBenefit2: "Tudo incluído. Sem adicionais.",
      rightBenefit3: "Um espaço de trabalho conectado",
      rightBenefit4: "Implementação mais rápida",
      rightBenefit5: "Preços transparentes. Sem surpresas.",
      stat2Title: "",

      titlePre: "Relatórios que ",
      titleActive: "realmente ",
      titleActive1: "funcionam.",
      subtitle: "No aplicativo. Ao vivo. Prático.",
      card1Title: "Desempenho ao Vivo",
      card1Right: "Painéis de Desempenho ao Vivo",
      card2Title: "Relatório de Clientes",
      card2Right: "Relatórios Personalizados em Segundos",
      card3Title: "Visão Geral Analítica",
      card3Right: "Insights Visuais que Impulsionam a Ação",
      card4Title: "Visão Geral do Pipeline",
      card4Right: "Visibilidade da Equipe e Pipeline",
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
        "Tu agente de IA encuentra, capta y califica clientes potenciales automáticamente.",
      heroCheck7:
        "Alcance multicanal por meio de chamadas, mensagens de texto, WhatsApp e muito mais",
      heroCheck8:
        "Os acompanhamentos automatizados e o agendamento de compromissos funcionam 24 horas por dia, 7 dias por semana.",
      heroCheck9:
        "Inteligência de pipeline, previsão de receita e um painel de controle unificado.",

      powerbadge: "INTEGRAÇÃO",
      powertitle: "Conecte seus aplicativos",

      workspacelang1: "Equipe",
      workspacelang2: "Receita",
      workspacelang3: "Espaço de trabalho",
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
        <div className="m-badge">
          {tr.badge}
          <br />
          {tr.badge1}
        </div>
        <h1 className="m-title">
          {tr.heroTitle1}
          <br />
          {tr.heroTitle2} <br />
          <span>{tr.heroTitle3}</span>
        </h1>
        <p className="m-description">{tr.heroDesc}</p>
        <div className="m-hero-actions">
          <a href="/trial" className="m-primary-btn">
            <Zap size={18} />
            <div className="trial-wrap">
              <span>{tr.ctaButtonText}</span>
              <p className="m-bottom-subtext">{tr.finalCtaSubBtn1}!</p>
            </div>
            <ArrowRight size={18} />
          </a>
          <p className="m-under-cta">{tr.underCTA}</p>
          {/*<button className="m-secondary-btn">
            <Play size={18} />
            {tr.watchDemo}
          </button>*/}
          <div className="hero-checks">
            {[tr.heroCheck6, tr.heroCheck7, tr.heroCheck8, tr.heroCheck9].map(
              (item, index) => (
                <div className="check-item" key={index}>
                  <span className="check">
                    <CheckCircle size={18} />
                  </span>
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="m-trust">
          <div className="m-trust-text">
            {tr.trusted}
          </div>
        </div>
        {/* dashboard image */}
        <div className="m-dashboard">
          <img src={landingDashImg} alt="" />
          <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
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

          <div className="cx-mob-list-section">
            <div className="cx-mob-list-heading heading-red">
              <XCircle size={20} />
              <h5>{tr.vsTitleLeft}</h5>
            </div>
            <ul className="cx-mob-ul">
              <li>
                <div className="cx-mob-li-left">
                  <XCircle size={14} className="icon-red" />
                  <span>{tr.leftCost1}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <XCircle size={14} className="icon-red" />
                  <span>{tr.leftCost2}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <XCircle size={14} className="icon-red" />
                  <span>{tr.leftCost3}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <XCircle size={14} className="icon-red" />
                  <span>{tr.leftCost4}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <XCircle size={14} className="icon-red" />
                  <span>{tr.leftCost5}</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="line"></div>
          <div className="cx-mob-list-section">
            <div className="cx-mob-list-heading heading-blue">
              <CheckCircle2 size={20} />
              <h5>{tr.vsTitleRight}</h5>
            </div>
            <ul className="cx-mob-ul blue">
              <li>
                <div className="cx-mob-li-left">
                  <CheckCircle2 size={14} className="icon-blue" />
                  <span>{tr.rightBenefit1}</span>
                </div>
                <strong className="cx-val-blue">$97</strong>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <CheckCircle2 size={14} className="icon-blue" />
                  <span>{tr.rightBenefit2}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <CheckCircle2 size={14} className="icon-blue" />
                  <span>{tr.rightBenefit3}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <CheckCircle2 size={14} className="icon-blue" />
                  <span>{tr.rightBenefit4}</span>
                </div>
              </li>
              <li>
                <div className="cx-mob-li-left">
                  <CheckCircle2 size={14} className="icon-blue" />
                  <span>{tr.rightBenefit5}</span>
                </div>
              </li>
            </ul>
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
            <h3>{tr.followUpTitle}</h3>
            <p>{tr.followUpDesc}</p>
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
            <h3>{tr.setterTitle}</h3>
            <p>{tr.setterDesc}</p>
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
            <h3>{tr.pipelineTitle}</h3>
            <p>{tr.pipelineDesc}</p>
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
            <h3>{tr.analyticsTitle}</h3>
            <p>{tr.analyticsDesc}</p>
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

      {/* REAL ESTATE PLATFORM SECTION */}
      <section className="m-platform">
        <div className="m-platform-header">
          <p className="m-platform-subtitle">{tr.platformSubtitle}</p>
          <h2 className="m-platform-title">{tr.platformTitle}</h2>
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
          <i>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
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
      <section className="m-flow">
        <div className="m-flow-header">
          <p className="m-flow-subtitle">{tr.flowSubtitle}</p>
          <h2 className="m-flow-title">{tr.flowTitle}</h2>
        </div>

        <div className="m-flow-container">
          <div className="m-flow-steps-row">
            <div className="m-flow-node">
              <div className="m-node-circle m-node-ads">
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
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
              </div>
              <span className="m-node-label">{tr.flowLabel1}</span>
            </div>

            <div className="m-flow-arrow">
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
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>

            <div className="m-flow-node">
              <div className="m-node-circle m-node-crm">
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
              <span className="m-node-label">{tr.flowLabel2}</span>
            </div>

            <div className="m-flow-arrow">
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
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>

            <div className="m-flow-node">
              <div className="m-node-circle m-node-whatsapp">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.256 5.261 0 11.725 0c3.132.001 6.077 1.22 8.29 3.433 2.213 2.212 3.43 5.158 3.43 8.29 0 6.465-5.256 11.722-11.714 11.722-2.006-.001-3.974-.515-5.727-1.497L0 24zm6.106-4.66c1.651.98 3.278 1.497 4.904 1.499 5.378 0 9.754-4.374 9.758-9.75.002-2.605-1.01-5.053-2.85-6.895C16.082 2.35 13.64 1.336 11.73 1.336c-5.385 0-9.762 4.376-9.766 9.751-.001 1.706.461 3.376 1.339 4.898L2.308 21.72l6.009-1.577h-.154z" />
                </svg>
              </div>
              <span className="m-node-label">{tr.flowLabel3}</span>
            </div>

            <div className="m-flow-arrow">
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
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>

            <div className="m-flow-node">
              <div className="m-node-circle m-node-ai">
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
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              </div>
              <span className="m-node-label">{tr.flowLabel4}</span>
            </div>
          </div>

          <div className="m-flow-text-row">
            <span className="m-text-phase">{tr.flowText1}</span>
            <span className="m-text-arrow">→</span>
            <span className="m-text-phase">{tr.flowText2}</span>
            <span className="m-text-arrow">→</span>
            <span className="m-text-phase">{tr.flowText3}</span>
            <span className="m-text-arrow">→</span>
            <span className="m-text-phase">{tr.flowText4}</span>
          </div>
        </div>
      </section>
      <section className="reporting">
        <div className="cx-rep-container">
          <div className="cx-rep-header">
            <h2 className="cx-rep-title">
              {tr.titlePre}
              <span className="cx-rep-purple">{tr.titleActive}</span>
              {tr.titleActive1}
            </h2>
            <p className="cx-rep-subtitle">{tr.subtitle}</p>
          </div>

          <div className="cx-rep-grid">
            <div className="cx-rep-row">
              <div className="cx-rep-card">
                <div className="cx-card-inside">
                  <span className="cx-card-label">{tr.card1Title}</span>
                  <div className="cx-mock-chart-line">
                    <div className="cx-chart-y-axis">
                      <span>100K</span>
                      <span>75K</span>
                      <span>50K</span>
                      <span>25K</span>
                      <span>0</span>
                    </div>
                    <div className="cx-line-graphic-container">
                      <svg viewBox="0 0 300 100" className="cx-svg-line">
                        <path
                          d="M10,80 L70,55 L130,48 L190,70 L250,42 L280,35 L320,15"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2"
                        />
                        <circle cx="10" cy="80" r="3" fill="#4f46e5" />
                        <circle cx="70" cy="55" r="3" fill="#4f46e5" />
                        <circle cx="130" cy="48" r="3" fill="#4f46e5" />
                        <circle cx="190" cy="70" r="3" fill="#4f46e5" />
                        <circle cx="250" cy="42" r="3" fill="#4f46e5" />
                        <circle cx="280" cy="35" r="3" fill="#4f46e5" />
                      </svg>
                    </div>
                    <div className="cx-chart-x-axis">
                      <span>Jan 1</span>
                      <span>Jan 8</span>
                      <span>Jan 15</span>
                      <span>Jan 22</span>
                      <span>Jan 29</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cx-rep-text-side">
                <h3>{tr.card1Right}</h3>
              </div>
            </div>

            <div className="cx-rep-row">
              <div className="cx-rep-card">
                <div className="cx-card-inside">
                  <span className="cx-card-label">{tr.card2Title}</span>
                  <table className="cx-rep-table">
                    <thead>
                      <tr>
                        <th className="text-left">{tr.thCustomer}</th>
                        <th className="text-center">{tr.thDeals}</th>
                        <th className="text-right">{tr.thRevenue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left font-grey">Brookstone</td>
                        <td className="text-center">8</td>
                        <td className="text-right">$24,600</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey">Riverside</td>
                        <td className="text-center">6</td>
                        <td className="text-right">$18,350</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey">Summit</td>
                        <td className="text-center">4</td>
                        <td className="text-right">$12,960</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey">Westview</td>
                        <td className="text-center">3</td>
                        <td className="text-right">$9,420</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="cx-rep-text-side">
                <h3>{tr.card2Right}</h3>
              </div>
            </div>

            <div className="cx-rep-row">
              <div className="cx-rep-card">
                <div className="cx-card-inside">
                  <span className="cx-card-label">{tr.card3Title}</span>
                  <div className="cx-mock-chart-bar">
                    <div className="cx-chart-y-axis">
                      <span>100K</span>
                      <span>75K</span>
                      <span>50K</span>
                      <span>25K</span>
                      <span>0</span>
                    </div>
                    <div className="cx-bar-graphic-container">
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "35%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "25%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "30%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill filled-blue"
                          style={{ height: "60%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "40%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill filled-purple"
                          style={{ height: "80%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "75%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "32%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill filled-purple"
                          style={{ height: "85%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "45%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill filled-blue-bright"
                          style={{ height: "90%" }}
                        ></div>
                      </div>
                      <div className="cx-bar-col">
                        <div
                          className="cx-bar-fill"
                          style={{ height: "55%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="cx-chart-x-axis padding-left-bars">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cx-rep-text-side">
                <h3>{tr.card3Right}</h3>
              </div>
            </div>

            <div className="cx-rep-row">
              <div className="cx-rep-card">
                <div className="cx-card-inside">
                  <span className="cx-card-label">{tr.card4Title}</span>
                  <table className="cx-rep-table-pipeline">
                    <thead>
                      <tr>
                        <th className="text-left">{tr.thStage}</th>
                        <th className="text-right">{tr.thDeals}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left font-grey flex-cell">
                          <CheckCircle2 size={14} className="cx-pipe-check" />
                          <span>{tr.stageNew}</span>
                        </td>
                        <td className="text-right font-bold">320</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey flex-cell">
                          <CheckCircle2 size={14} className="cx-pipe-check" />
                          <span>{tr.stageContacted}</span>
                        </td>
                        <td className="text-right font-bold">210</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey flex-cell">
                          <CheckCircle2 size={14} className="cx-pipe-check" />
                          <span>{tr.stageQualified}</span>
                        </td>
                        <td className="text-right font-bold">150</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey flex-cell">
                          <CheckCircle2 size={14} className="cx-pipe-check" />
                          <span>{tr.stageProposal}</span>
                        </td>
                        <td className="text-right font-bold">96</td>
                      </tr>
                      <tr>
                        <td className="text-left font-grey flex-cell">
                          <CheckCircle2 size={14} className="cx-pipe-check" />
                          <span>{tr.stageClosed}</span>
                        </td>
                        <td className="text-right font-bold">54</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="cx-rep-text-side">
                <h3>{tr.card4Right}</h3>
              </div>
            </div>
          </div>
        </div>
        <i style={{ display: "block", fontSize: "11px", opacity: 0.7, marginTop: "10px", textAlign: "center" }}>Product demo — the names, numbers, and activity shown are sample data for illustration only, not real customer results.</i>
      </section>
      <section id="m-workspace">
        <div className="aios-container">
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
          </h2>
          <p className="m-setter-desc">{tr.setterSectionDesc}</p>
        </div>

        <div className="m-calendar-card">
          <div className="m-calendar-card-header">
            <h3>{tr.bookAppointmentTitle}</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="m-sparkle-icon"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>

          <div className="m-calendar-body-layout">
            <div className="m-cal-left">
              <label className="m-cal-label">{tr.selectDateLabel}</label>
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
              <label className="m-cal-label">{tr.selectTimeLabel}</label>
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
          <p className="m-final-cta-subtitle">{tr.ctaSubtitle}</p>
          <h2 className="m-final-cta-title">
            {tr.ctaTitle1}
            <br />
            {tr.ctaTitle2}
            <br />
            <span>{tr.ctaTitle3}</span>
          </h2>
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
            {tr.ctaButtonText}
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
          <p className="m-under-cta">{tr.underCTA}</p>
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
          <p className="m-bottom-subtitle">{tr.finalCtaSubtitle}</p>
          <h2 className="m-bottom-title">
            {tr.finalCtaTitle1}
            <br />
            {tr.finalCtaTitle2}
            <br />
            <span>{tr.finalCtaTitle3}</span>
          </h2>
          <p className="m-bottom-desc">{tr.finalCtaDesc}</p>

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
                <p className="m-bottom-subtext">{tr.finalCtaSubBtn1}!</p>
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
            <p className="m-under-cta">{tr.underCTA}</p>
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
