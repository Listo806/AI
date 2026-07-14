import React, { useEffect, useState } from "react";
import "./Common.css";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import {
  Menu,
  X,
  Check,
  ShieldCheck,
  Layers,
  Activity,
  CircleDollarSign,
  UserPlus,
  Wrench,
  Building2,
  Bot,
  MessageSquare,
  GitFork,
  Home,
  Users,
  ShieldAlert,
  Zap,
  BarChart3,
  Target,
  TrendingUp,
  Crosshair,
  Gem,
  RefreshCw,
  User,
  Settings,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import headlogoM from "../../assets/cortexa/headlogotran.png";
import social1 from "../../assets/cortexa/social1.png";
import social2 from "../../assets/cortexa/social2.png";
import social3 from "../../assets/cortexa/social3.png";
import social4 from "../../assets/cortexa/social4.png";

const t = {
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      about: "About Us",
      contact: "Contact",
      login: "Log in",
      trial: "Start Free Trial",
    },

    footer: {
      desc: "The AI-powered Real Estate CRM. Close more deals — Automatically.",
      col1: "Product",
      col1_items: ["Features", "Pricing", "Integrations", "Changelog"],
      col2: "Company",
      col2_items: ["About us", "Blog", "Careers", "Contact"],
      col3: "Resources",
      col3_items: ["Help Center", "Guides", "Community", "API Docs"],
      col4: "Legal",
      col4_items: ["Terms of Service", "Privacy Policy", "Refund Policy"],
      col5: "Get Started",
      col5_items: ["Login", "Start Free Trial"],
    },

    pricingLabel: "PRICING PLANS",
    pricingMainTitlePre: "All-In-One Real Estate CRM. ",
    pricingMainTitlePost: "Simple Pricing. Maximum Results.",
    pricingSubText:
      "Your tools should support your growth, not drain it. CORTEXA AIOS gives you the essential system to capture leads, follow up, book appointments, and manage revenue without adding thousands in upfront costs.",
    pricingAlertBold: "Keep more capital in your business.",
    pricingAlertText:
      " Start with the system you need, without enterprise-level setup fees, confusing add-ons, or software costs that eat into your monthly gains.",
    pricingFeatures: {
      ai: {
        title: "AI-Powered Everything",
        desc: "Your 24/7 AI Assistant handles conversations, follow-ups, appointments and more.",
      },
      automate: {
        title: "Automate. Follow Up. Close More.",
        desc: "Never miss a lead again. Instant responses and smart follow-ups convert more leads into clients.",
      },
      conversion: {
        title: "Increase in Lead Conversion Rate",
        desc: "Run your leads, follow-ups, and pipeline in one connected workspace.",
      },
      realestate: {
        title: "Built for Real Estate",
        desc: "Purpose-built for real estate professionals. From lead to close, all in one place.",
      },
    },

    plansBadgePopular: "MOST POPULAR",
    plansBtnTrial: "Start My Free Trial",
    plansPerMonth: "/month",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 user",
        desc: "Perfect for solo agents.",
        price: "$197",
        features: [
          "1 user included",
          "All features included",
          "AI Agent Automation",
          "24/7 Support",
        ],
      },
      team: {
        name: "Team",
        users: "3 users",
        desc: "Great for small teams.",
        price: "$347",
        features: [
          "3 users included",
          "All features included",
          "AI Agent Automation",
          "24/7 Support",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 users",
        desc: "Built for growing teams.",
        price: "$497",
        features: [
          "5 users included",
          "All features included",
          "AI Agent Automation",
          "24/7 Support",
        ],
      },
    },
    plansFooter: {
      setup: {
        value: "$97",
        title: "One-Time Setup Fee",
        desc: "Get fully set up and ready to grow.",
      },
      user: {
        value: "$97",
        title: "Per Additional User",
        desc: "Add team members anytime.",
      },
      contract: {
        title: "No Long-Term Contracts Cancel Anytime",
        desc: "Flexibility you can count on.",
      },
    },

    compareTitle: "See Exactly What You Get",
    compareSubtitle:
      "Other platforms charge extra for the tools and features you actually need.",
    compareThFeature: "WHAT YOU GET",
    compareThOther: "OTHER PLATFORMS\nBig Plans + Add-ons + Seats",
    compareThCost: "TYPICAL ADD-ON COST\n(Additional)",
    compareThCortexa: "CORTEXA AIOS\nEverything Included",
    compareIncluded: "Included",
    compareUnlimitedAiTitle: "Unlimited AI usage.",
    compareUnlimitedAiDesc: "No credit system.\nNo surprise AI bills.",
    compareNoPenaltiesTitle: "No contact-based penalties.",
    compareNoPenaltiesDesc: "Grow your database\nwithout restrictions.",
    compareOneTimeSetup: "ONE-TIME SETUP FEE\nTypical for big plans",
    compareSetupSetup: "$97\nOne-time setup",
    compareEstimatedCost: "ESTIMATED MONTHLY COST\nFor most businesses",
    compareEstimatedOther: "$2,500 – $7,500+",
    compareEstimatedOther1:
      "$2,500 – $5,000+ /month\nAnd it still may not include everything.",
    compareEstimatedCortexa: "$197 /month\nEverything included",

    compareRows: [
      { f: "CRM & Contact Management", o: "Included in higher plans", c: "-" },
      { f: "Leads & Pipeline Management", o: "Included, but tiered", c: "-" },
      {
        f: "Email & SMS Campaigns",
        o: "Included, but tiered by plan",
        c: "$50 – $150 /mo",
      },
      {
        f: "Marketing Automation",
        o: "Included, but limited in lower plans",
        c: "$100 – $300 /mo",
      },
      {
        f: "AI Agent (24/7)",
        o: "Add-on or higher tier only",
        c: "$300 – $1,000 /mo",
      },
      {
        f: "WhatsApp Automation",
        o: "Usually integration or add-on",
        c: "$50 – $150 /mo",
      },
      {
        f: "Appointment Booking",
        o: "Add-on or higher tier only",
        c: "$50 – $115 /mo",
      },
      {
        f: "Web Forms & Landing Pages",
        o: "Limited in lower plans",
        c: "$50 – $75 /mo",
      },
      {
        f: "Reporting & Analytics",
        o: "Advanced reporting in higher tiers",
        c: "$100 – $250 /mo",
      },
      {
        f: "Sales Automation",
        o: "Sales automation in higher tiers",
        c: "$75 – $200 /mo",
      },
      {
        f: "Tasks & Reminders",
        o: "Included, but limited",
        c: "$25 – $75 /mo",
      },
      {
        f: "Team Collaboration",
        o: "Seat-based, higher cost",
        c: "$25 – $75 /user/mo",
      },
      {
        f: "Document & File Management",
        o: "Often limited storage",
        c: "$25 – $100 /mo",
      },
      {
        f: "Workflow Automation",
        o: "Advanced workflows in higher tiers",
        c: "$100 – $250 /mo",
      },
      {
        f: "Industry-Specific Setup",
        o: "Custom work or expensive add-on",
        c: "$500 – $2,500+ (one-time)",
      },
      {
        f: "Onboarding & Training",
        o: "Often add-on or paid service",
        c: "$500 – $2,000+ (one-time)",
      },
      {
        f: "Integration (Popular Apps)",
        o: "Many require paid integrations",
        c: "$50 – $300 /mo",
      },
      {
        f: "Lead Generation (Done For You)",
        o: "Separate add-on or external service",
        c: "$197 – $1,000+ /mo",
      },
      {
        f: "AI Usage & Credits",
        o: "AI credits, usage limits, and overage charges",
        c: "$197 – $1,000+ /mo\n(varies by usage)",
        badge: "NEW",
      },
      {
        f: "Marketing Contact Fees",
        o: "Charged as your contact database grows",
        c: "$225 – $180+ /mo\n(varies by contact volume)",
        badge: "NEW",
      },
      {
        f: "Transactional Emails",
        o: "Often sold as a separate add-on service",
        c: "$600+ /mo",
        badge: "NEW",
      },
      {
        f: "Custom Fields & Properties",
        o: "Additional limits require expansion packs or upgrades",
        c: "$70 – $220+ /mo",
        badge: "NEW",
      },
      {
        f: "Advanced Reporting & Dashboards",
        o: "Reporting limits often require higher plans or add-ons",
        c: "$200+ /mo",
        badge: "NEW",
      },
      {
        f: "Team & User Growth Limits",
        o: "Expansion packs required as teams grow",
        c: "$200+ /mo",
        badge: "NEW",
      },
    ],

    vsCompOtherTitle: "WITH OTHER PLATFORMS",
    vsCompOther1: "High monthly cost with multiple add-ons",
    vsCompOther2: "Various types of fees can be applied.",
    vsCompOther3: "Complex setup and long onboarding",
    vsCompOther4: "Pay more as you add seats, features, and tools",
    vsCompOther5: "By the time you get going, you have spent a lot of money",
    vsCompOtherTotalTitle: "Typical Total Investment to Get Started",
    vsCompOtherTotalVal: "more expensive",
    vsCompOtherTotalSub: "(Setup + First Month)",
    vsCompOtherTotalNote: "And it still may not include everything.",

    vsCompVs: "VS.",

    vsCompCortexaTitle: "WITH CORTEXA AIOS",
    vsCompCortexa1: "One system with everything you need",
    vsCompCortexa2: "$97 one-time setup fee",
    vsCompCortexa3: "$197/month - everything included",
    vsCompCortexa4: "Add agents (users) for $97/month",
    vsCompCortexa5: "Start today and start making revenue",
    vsCompCortexaTotalTitle: "Total Investment to Get Started",
    vsCompCortexaTotalVal: "$294",
    vsCompCortexaTotalSub: "(Setup + First Month for 1 Agent)",

    vsCompBottomHeader: "More Leads. More Appointments. More Closings.",
    vsCompBottomSub: "Increase the conversion rate of potential customers.",
    vsCompBottomFeat1: "No hidden fees",
    vsCompBottomFeat2: "Cancel anytime",
    vsCompBottomFeat3: "Built for real estate",
    vsCompBottomBtn: "Start My Free Trial",
  },
  es: {
    nav: {
      features: "Características",
      pricing: "Precios",
      about: "Nosotros",
      contact: "Contacto",
      login: "Iniciar sesión",
      trial: "Prueba Gratis",
    },

    footer: {
      desc: "El CRM inmobiliario potenciado por IA. Cierra más tratos — Automáticamente.",
      col1: "Producto",
      col1_items: ["Características", "Precios", "Integrations", "Changelog"],
      col2: "Compañía",
      col2_items: ["Sobre nosotros", "Blog", "Carreras", "Contacto"],
      col3: "Recursos",
      col3_items: ["Centro de ayuda", "Guías", "Comunidad", "Docs de API"],
      col4: "Legal",
      col4_items: [
        "Términos de servicio",
        "Política de privacidad",
        "Política de reembolso",
      ],
      col5: "Comenzar",
      col5_items: ["Login", "Prueba Gratis"],
    },

    pricingLabel: "PLANES DE PRECIOS",
    pricingMainTitlePre: "CRM Inmobiliario Todo en Uno. ",
    pricingMainTitlePost: "Precios Simples. Máximos Resultados.",
    pricingSubText:
      "Sus herramientas deben apoyar su crecimiento, no agotarlo. CORTEXA AIOS le brinda el sistema esencial para capturar prospectos, hacer seguimiento, programar citas y administrar los ingresos sin agregar miles en costos iniciales.",
    pricingAlertBold: "Mantenga más capital en su negocio.",
    pricingAlertText:
      " Comience con el sistema que necesita, sin tarifas de configuración a nivel de gran empresa, complementos confusos o costos de software que reduzcan sus ganancias mensuales.",
    pricingFeatures: {
      ai: {
        title: "Todo Impulsado por IA",
        desc: "Su asistente de IA disponible las 24 horas, los 7 días de la semana, se encarga de las conversaciones, los seguimientos, las citas y más.",
      },
      automate: {
        title: "Automatice. Siga de cerca. Cierre más.",
        desc: "No vuelva a perder un prospecto. Las respuestas instantáneas y los seguimientos inteligentes convierten más prospectos en clientes.",
      },
      conversion: {
        value: "3X",
        title: "Aumento en la Tasa de Conversión",
        desc: "Gestiona tus clientes potenciales, seguimientos y flujo de ventas en un solo espacio de trabajo conectado.",
      },
      realestate: {
        title: "Creado para Bienes Raíces",
        desc: "Diseñado especialmente para profesionales inmobiliarios. Desde el prospecto hasta el cierre, todo en un solo lugar.",
      },
    },

    plansBadgePopular: "MÁS POPULAR",
    plansBtnTrial: "Iniciar Mi Prueba Gratuita",
    plansPerMonth: "/mes",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 usuario",
        desc: "Perfecto para agentes independientes.",
        price: "$197",
        features: [
          "1 usuario incluido",
          "Todas las funciones incluidas",
          "Automatización con Agente de IA",
          "Soporte 24/7",
        ],
      },
      team: {
        name: "Team",
        users: "3 usuarios",
        desc: "Ideal para equipos pequeños.",
        price: "$347",
        features: [
          "3 usuarios incluidos",
          "Todas las funciones incluidas",
          "Automatización con Agente de IA",
          "Soporte 24/7",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 usuarios",
        desc: "Creado para equipos en crecimiento.",
        price: "$497",
        features: [
          "5 usuarios incluidos",
          "Todas las funciones incluidas",
          "Automatización con Agente de IA",
          "Soporte 24/7",
        ],
      },
    },
    plansFooter: {
      setup: {
        value: "$97",
        title: "Tarifa de Configuración Única",
        desc: "Regístrese por completo y prepárese para crecer.",
      },
      user: {
        value: "$97",
        title: "Por Usuario Adicional",
        desc: "Añada miembros al equipo en cualquier momento.",
      },
      contract: {
        title: "Sin Contratos a Largo Plazo Cancele en Cualquier Momento",
        desc: "Flexibilidad con la que puede contar.",
      },
    },

    compareTitle: "Vea Exactamente Lo Que Recibe",
    compareSubtitle:
      "Otras plataformas cobran un extra por las herramientas y funciones que realmente necesita.",
    compareThFeature: "LO QUE RECIBE",
    compareThOther: "OTRAS PLATAFORMAS\nPlanes Grandes + Complementos + Cupos",
    compareThCost: "COSTO HABITUAL\n(Adicional)",
    compareThCortexa: "CORTEXA AIOS\nTodo Incluido",
    compareIncluded: "Incluido",
    compareUnlimitedAiTitle: "Uso ilimitado de IA.",
    compareUnlimitedAiDesc:
      "Sin sistema de créditos.\nSin sorpresas en facturas de IA.",
    compareNoPenaltiesTitle: "Sin penalizaciones por contactos.",
    compareNoPenaltiesDesc: "Haga crecer su base de datos\nsin restricciones.",
    compareOneTimeSetup:
      "TARIFA DE CONFIGURACIÓN ÚNICA\nHabitual en planes grandes",
    compareSetupSetup: "$97\nConfiguración única",
    compareEstimatedCost: "COSTO MENSUAL ESTIMADO\nPara la mayoría de empresas",
    compareEstimatedOther: "$2,500 – $7,500+",
    compareEstimatedOther1:
      "$2,500 – $5,000+ /mes\nY aún así podría no incluir todo.",
    compareEstimatedCortexa: "$197 /mes\nTodo incluido",

    compareRows: [
      {
        f: "Gestión de CRM y Contactos",
        o: "Incluido en planes superiores",
        c: "-",
      },
      {
        f: "Gestión de Prospectos y Embudos",
        o: "Incluido, pero por niveles",
        c: "-",
      },
      {
        f: "Campañas de Email y SMS",
        o: "Incluido, pero por niveles según plan",
        c: "$50 – $150 /mes",
      },
      {
        f: "Automatización de Marketing",
        o: "Incluido, pero limitado en planes inferiores",
        c: "$100 – $300 /mes",
      },
      {
        f: "Agente de IA (24/7)",
        o: "Solo complemento o nivel superior",
        c: "$300 – $1,000 /mes",
      },
      {
        f: "Automatización de WhatsApp",
        o: "Normalmente integración o complemento",
        c: "$50 – $150 /mes",
      },
      {
        f: "Reserva de Citas",
        o: "Solo complemento o nivel superior",
        c: "$50 – $115 /mes",
      },
      {
        f: "Formularios Web y Landing Pages",
        o: "Limitado en planes inferiores",
        c: "$50 – $75 /mes",
      },
      {
        f: "Informes y Analítica",
        o: "Informes avanzados en niveles superiores",
        c: "$100 – $250 /mes",
      },
      {
        f: "Automatización de Ventas",
        o: "Automatización en niveles superiores",
        c: "$75 – $200 /mes",
      },
      {
        f: "Tareas y Recordatorios",
        o: "Incluido, pero limitado",
        c: "$25 – $75 /mes",
      },
      {
        f: "Colaboración en Equipo",
        o: "Por usuario, mayor costo",
        c: "$25 – $75 /usuario/mes",
      },
      {
        f: "Gestión de Documentos y Archivos",
        o: "A menudo almacenamiento limitado",
        c: "$25 – $100 /mes",
      },
      {
        f: "Automatización de Flujos",
        o: "Flujos avanzados en niveles superiores",
        c: "$100 – $250 /mes",
      },
      {
        f: "Configuración Específica",
        o: "Trabajo personalizado o complemento costoso",
        c: "$500 – $2,500+ (único)",
      },
      {
        f: "Onboarding y Capacitación",
        o: "A menudo servicio de pago",
        c: "$500 – $2,000+ (único)",
      },
      {
        f: "Integración (Apps Populares)",
        o: "Muchas requieren integraciones de pago",
        c: "$50 – $300 /mes",
      },
      {
        f: "Generación de Prospectos",
        o: "Complemento separado o servicio externo",
        c: "$197 – $1,000+ /mes",
      },
      {
        f: "Créditos y Uso de IA",
        o: "Límites de uso y cargos por exceso",
        c: "$197 – $1,000+ /mes\n(varía según el uso)",
        badge: "NUEVO",
      },
      {
        f: "Tarifas por Contactos",
        o: "Se cobra a medida que crece la base de datos",
        c: "$225 – $180+ /mes\n(varía según el volumen)",
        badge: "NUEVO",
      },
      {
        f: "Correos Transaccionales",
        o: "A menudo vendido por separado",
        c: "$600+ /mes",
        badge: "NUEVO",
      },
      {
        f: "Campos Personalizados",
        o: "Límites adicionales requieren paquetes de expansión",
        c: "$70 – $220+ /mes",
        badge: "NUEVO",
      },
      {
        f: "Informes Avanzados",
        o: "Límites de informes requieren planes superiores",
        c: "$200+ /mes",
        badge: "NUEVO",
      },
      {
        f: "Límites de Crecimiento de Equipo",
        o: "Paquetes de expansión al crecer el equipo",
        c: "$200+ /mes",
        badge: "NUEVO",
      },
    ],

    vsCompOtherTitle: "CON OTRAS PLATAFORMAS",
    vsCompOther1: "Alto costo mensual con múltiples complementos",
    vsCompOther2:
      "Se pueden aplicar diversos tipos de tarifas.",
    vsCompOther3: "Configuración compleja y larga capacitación inicial",
    vsCompOther4:
      "Pague más a medida que agrega usuarios, funciones y herramientas",
    vsCompOther5: "Para cuando empiece a funcionar,has gastado mucho dinero",
    vsCompOtherTotalTitle: "Inversión Total Típica para Comenzar",
    vsCompOtherTotalVal: "Más caro",
    vsCompOtherTotalSub: "(Configuración + Primer Mes)",
    vsCompOtherTotalNote: "Y es posible que aún no incluya todo.",

    vsCompVs: "VS.",

    vsCompCortexaTitle: "CON CORTEXA AIOS",
    vsCompCortexa1: "Un sistema con todo lo que necesita",
    vsCompCortexa2: "Tarifa de configuración única de $97",
    vsCompCortexa3: "$197/mes - todo incluido",
    vsCompCortexa4: "Agregue agentes (usuarios) por $97/mes",
    vsCompCortexa5: "Comience hoy mismo y comience a generar ingresos",
    vsCompCortexaTotalTitle: "Inversión Total para Comenzar",
    vsCompCortexaTotalVal: "$294",
    vsCompCortexaTotalSub: "(Configuración + Primer Mes para 1 Agente)",

    vsCompBottomHeader: "Más Prospectos. Más Citas. Más Cierres.",
    vsCompBottomSub:
      "Aumente la tasa de conversión de clientes potenciales.",
    vsCompBottomFeat1: "Sin tarifas ocultas",
    vsCompBottomFeat2: "Cancele en cualquier momento",
    vsCompBottomFeat3: "Diseñado para el sector inmobiliario",
    vsCompBottomBtn: "Iniciar Mi Prueba Gratuita",
  },
  pt: {
    nav: {
      features: "Recursos",
      pricing: "Preços",
      about: "Sobre Nós",
      contact: "Contato",
      login: "Entrar",
      trial: "Teste Grátis",
    },

    footer: {
      desc: "O CRM Imobiliário alimentado por IA. Feche mais negócios — Automaticamente.",
      col1: "Produto",
      col1_items: ["Recursos", "Preços", "Integrações", "Changelog"],
      col2: "Empresa",
      col2_items: ["Sobre nós", "Blog", "Carreiras", "Contato"],
      col3: "Recursos",
      col3_items: ["Central de Ajuda", "Guias", "Comunidade", "Docs da API"],
      col4: "Legal",
      col4_items: [
        "Terms de Serviço",
        "Política de Privacidade",
        "Política de Reembolso",
      ],
      col5: "Começar",
      col5_items: ["Login", "Teste Grátis"],
    },

    pricingLabel: "PLANOS DE PREÇOS",
    pricingMainTitlePre: "CRM Imobiliário Tudo-Em-Um. ",
    pricingMainTitlePost: "Preços Simples. Resultados Máximos.",
    pricingSubText:
      "Suas ferramentas devem apoiar o seu crescimento, não esgotá-lo. O CORTEXA AIOS oferece o sistema essencial para capturar leads, fazer acompanhamento, agendar reuniões e gerenciar receitas sem adicionar milhares em custos iniciais.",
    pricingAlertBold: "Mantenha mais capital na sua empresa.",
    pricingAlertText:
      " Comece com o sistema que você precisa, sem taxas de configuração de nível empresarial, complementos confusos ou custos de software que corroam seus ganhos mensais.",
    pricingFeatures: {
      ai: {
        title: "Tudo Impulsionado por IA",
        desc: "Seu Assistente de IA 24/7 gerencia conversas, acompanhamentos, agendamentos e muito mais.",
      },
      automate: {
        title: "Automatize. Acompanhe. Feche Mais.",
        desc: "Nunca mais perca um lead. Respostas instantâneas e acompanhamentos inteligentes convertem mais leads em clientes.",
      },
      conversion: {
        value: "3X",
        title: "Aumento na Taxa de Conversão de Leads",
        desc: "Gerencie seus leads, acompanhamentos e pipeline em um único espaço de trabalho integrado.",
      },
      realestate: {
        title: "Feito para o Setor Imobiliário",
        desc: "Desenvolvido especificamente para profissionais do mercado imobiliário. Do lead ao fechamento, tudo em um só lugar.",
      },
    },

    plansBadgePopular: "MAIS POPULAR",
    plansBtnTrial: "Iniciar Meu Teste Gratuito",
    plansPerMonth: "/mês",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 usuário",
        desc: "Perfeito para corretores autônomos.",
        price: "$197",
        features: [
          "1 usuário incluso",
          "Todos os recursos inclusos",
          "Automação com Agente de IA",
          "Suporte 24/7",
        ],
      },
      team: {
        name: "Team",
        users: "3 usuários",
        desc: "Excelente para equipes pequenas.",
        price: "$347",
        features: [
          "3 usuários inclusos",
          "Todos os recursos inclusos",
          "Automação com Agente de IA",
          "Suporte 24/7",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 usuários",
        desc: "Desenvolvido para equipes em crescimento.",
        price: "$497",
        features: [
          "5 usuários inclusos",
          "Todos os recursos inclusos",
          "Automação com Agente de IA",
          "Suporte 24/7",
        ],
      },
    },
    plansFooter: {
      setup: {
        value: "$97",
        title: "Taxa Única de Configuração",
        desc: "Fique totalmente configurado e pronto para crescer.",
      },
      user: {
        value: "$97",
        title: "Por Usuário Adicional",
        desc: "Adicione membros à equipe a qualquer momento.",
      },
      contract: {
        title: "Sem Contratos de Longo Prazo Cancele a Qualquer Momento",
        desc: "Flexibilidade com a que você pode contar.",
      },
    },

    compareTitle: "Veja Exatamente O Que Você Recebe",
    compareSubtitle:
      "Outras plataformas cobram extra pelas ferramentas e recursos que você realmente precisa.",
    compareThFeature: "O QUE VOCÊ RECEBE",
    compareThOther:
      "OUTRAS PLATAFORMAS\nPlanos Grandes + Complementos + Usuários",
    compareThCost: "CUSTO TRADICIONAL\n(Adicional)",
    compareThCortexa: "CORTEXA AIOS\nTudo Incluso",
    compareIncluded: "Incluso",
    compareUnlimitedAiTitle: "Uso ilimitado de IA.",
    compareUnlimitedAiDesc:
      "Sem sistema de créditos.\nSem surpresas nas faturas de IA.",
    compareNoPenaltiesTitle: "Sem penalidades por contatos.",
    compareNoPenaltiesDesc: "Aumente seu banco de dados\nsem restrições.",
    compareOneTimeSetup:
      "TAXA ÚNICA DE CONFIGURAÇÃO\nTradicional em planos grandes",
    compareSetupSetup: "$97\nTaxa única",
    compareEstimatedCost: "CUSTO MENSAL ESTIMADO\nPara a maioria das empresas",
    compareEstimatedOther: "$2.500 – $7.500+",
    compareEstimatedOther1:
      "$2.500 – $5.000+ /mês\nE ainda assim pode não incluir tudo.",
    compareEstimatedCortexa: "$197 /mês\nTudo incluso",

    compareRows: [
      {
        f: "CRM e Gestão de Contatos",
        o: "Incluso em planos superiores",
        c: "-",
      },
      { f: "Gestão de Leads e Funis", o: "Incluso, mas por níveis", c: "-" },
      {
        f: "Campanhas de E-mail e SMS",
        o: "Incluso, mas por nível de plano",
        c: "$50 – $150 /mês",
      },
      {
        f: "Automação de Marketing",
        o: "Incluso, mas limitado em planos baixos",
        c: "$100 – $300 /mês",
      },
      {
        f: "Agente de IA (24/7)",
        o: "Apenas complemento ou nível superior",
        c: "$300 – $1.000 /mês",
      },
      {
        f: "Automação de WhatsApp",
        o: "Geralmente integração ou complemento",
        c: "$50 – $150 /mês",
      },
      {
        f: "Agendamento de Reuniões",
        o: "Apenas complemento ou nível superior",
        c: "$50 – $115 /mês",
      },
      {
        f: "Formulários Web e Landing Pages",
        o: "Limitado em planos inferiores",
        c: "$50 – $75 /mês",
      },
      {
        f: "Relatórios e Análises",
        o: "Relatórios avançados em níveis superiores",
        c: "$100 – $250 /mês",
      },
      {
        f: "Automação de Vendas",
        o: "Automação em níveis superiores",
        c: "$75 – $200 /mês",
      },
      {
        f: "Tarefas e Lembretes",
        o: "Incluso, mas limitado",
        c: "$25 – $75 /mês",
      },
      {
        f: "Colaboração em Equipe",
        o: "Por usuário, custo maior",
        c: "$25 – $75 /usuário/mês",
      },
      {
        f: "Gestão de Documentos e Arquivos",
        o: "Geralmente armazenamento limitado",
        c: "$25 – $100 /mês",
      },
      {
        f: "Automação de Fluxos",
        o: "Fluxos avançados em níveis superiores",
        c: "$100 – $250 /mês",
      },
      {
        f: "Configuração Específica",
        o: "Trabalho personalizado ou complemento caro",
        c: "$500 – $2.500+ (único)",
      },
      {
        f: "Onboarding e Treinamento",
        o: "Geralmente serviço adicional pago",
        c: "$500 – $2.000+ (único)",
      },
      {
        f: "Integração (Apps Populares)",
        o: "Muitos exigem integrações pagas",
        c: "$50 – $300 /mês",
      },
      {
        f: "Geração de Leads",
        o: "Complemento separado ou serviço externo",
        c: "$197 – $1.000+ /mês",
      },
      {
        f: "Créditos e Uso de IA",
        o: "Créditos de IA e cobranças por excesso",
        c: "$197 – $1.000+ /mês\n(varia por uso)",
        badge: "NOVO",
      },
      {
        f: "Taxas por Contatos de Marketing",
        o: "Cobrado conforme o banco de dados cresce",
        c: "$225 – $180+ /mês\n(varia por volume)",
        badge: "NOVO",
      },
      {
        f: "E-mails Transacionais",
        o: "Geralmente vendido como serviço separado",
        c: "$600+ /mês",
        badge: "NOVO",
      },
      {
        f: "Campos Personalizados",
        o: "Limites extras exigem pacotes de expansão",
        c: "$70 – $220+ /mês",
        badge: "NOVO",
      },
      {
        f: "Painéis e Relatórios Avançados",
        o: "Limites exigem planos superiores",
        c: "$200+ /mês",
        badge: "NOVO",
      },
      {
        f: "Limites de Crescimento de Equipe",
        o: "Pacotes de expansão necessários",
        c: "$200+ /mês",
        badge: "NOVO",
      },
    ],

    vsCompOtherTitle: "COM OUTRAS PLATAFORMAS",
    vsCompOther1: "Alto custo mensal com múltiplos add-ons",
    vsCompOther2:
      "Diferentes tipos de taxas podem ser aplicados.",
    vsCompOther3: "Configuração complexa e integração demorada",
    vsCompOther4:
      "Pague mais conforme adiciona usuários, recursos e ferramentas",
    vsCompOther5: "No momento em que você começar, você gastou muito dinheiro",
    vsCompOtherTotalTitle: "Investimento Total Típico para Começar",
    vsCompOtherTotalVal: "Mais caro",
    vsCompOtherTotalSub: "(Configuração + Primeiro Mês)",
    vsCompOtherTotalNote: "E ainda pode não incluir tudo.",

    vsCompVs: "VS.",

    vsCompCortexaTitle: "COM CORTEXA AIOS",
    vsCompCortexa1: "Um sistema com tudo o que você precisa",
    vsCompCortexa2: "Taxa de configuração única de $97",
    vsCompCortexa3: "$197/mês - tudo incluso",
    vsCompCortexa4: "Adicione agentes (usuários) por $97/mês",
    vsCompCortexa5: "Comece hoje e comece a faturar",
    vsCompCortexaTotalTitle: "Investimento Total para Começar",
    vsCompCortexaTotalVal: "$294",
    vsCompCortexaTotalSub: "(Configuração + Primeiro Mês para 1 Agente)",

    vsCompBottomHeader: "Mais Leads. Mais Agendamentos. Mais Fechamentos.",
    vsCompBottomSub: "Aumente a taxa de conversão de clientes em potencial.",
    vsCompBottomFeat1: "Sem taxas ocultas",
    vsCompBottomFeat2: "Cancele a qualquer momento",
    vsCompBottomFeat3: "Feito para o mercado imobiliário",
    vsCompBottomBtn: "Iniciar Meu Teste Grátis",
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("cortexa_lang", newLang);
    setLangOpen(false);
  };

  const tr = t[lang];

  const renderNewLineText = (text) => {
    return text.split("\n").map((str, index) => (
      <React.Fragment key={index}>
        {str}
        {index < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };
  return (
    <div className="pricing-page">
      {isMobile ? (
        <header className="m-header">
          <div className="m-logo-block">
            <a href="/">
              <img src={headlogoM} alt="Cortexa" className="cx-logo-img" />
            </a>
          </div>

          <div className="m-header-right">
            <div className="m-lang-wrapper">
              <button
                type="button"
                className="m-lang-btn"
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                }}
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
                </svg>
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
              <Menu size={26} color="#ffffff" />
            </button>
          </div>
        </header>
      ) : (
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <a href="/">
                <img src={headlogo} alt="Cortexa" className="cx-logo-img" />
              </a>
            </div>
            <nav className="nav">
              <HashLink smooth to="/features">
                {tr.nav.features}
              </HashLink>
              <a href="/pricing" className="active">
                {tr.nav.pricing}
              </a>
              <a href="/about">{tr.nav.about}</a>
              <a href="/contact">{tr.nav.contact}</a>
            </nav>
            <div className="actions">
              <a href="/sign-in" className="login-link">
                {tr.nav.login}
              </a>
              <div className="lang-wrapper">
                <div
                  className="lang-toggle"
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
                  </svg>
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
              <a href="/trial" className="trial-btn">
                {tr.nav.trial}
              </a>
            </div>
          </div>
        </header>
      )}
      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {isMobile && (
        <div className={`m-drawer ${menuOpen ? "open" : ""}`}>
          <div className="m-drawer-top">
            <div className="m-logo-block">
              <img src={headlogoM} alt="Cortexa" className="cx-logo-img" />
            </div>
            <button className="m-close" onClick={() => setMenuOpen(false)}>
              <X size={24} color="#ffffff" />
            </button>
          </div>

          <div className="m-drawer-nav" onClick={() => setMenuOpen(false)}>
            <HashLink className="nav-menu" smooth to="/features">
              {tr.nav.features}
            </HashLink>
            <a href="/pricing" className="active">
              {tr.nav.pricing}
            </a>
            <a href="/about">{tr.nav.about}</a>
            <a href="/contact">{tr.nav.contact}</a>
          </div>

          <div className="m-drawer-actions">
            <a href="/trial" className="m-trial-btn">
              {tr.nav.trial}
            </a>
            <a className="m-login-btn" href="/sign-in">
              {tr.nav.login}
            </a>
          </div>
        </div>
      )}
      <main className="main-content">
        <section className="cx-pricing cx-center">
          <div className="cx-pricing-header">
            <span className="cx-pricing-tag">{tr.pricingLabel}</span>
            <h2 className="cx-pricing-title">
              {tr.pricingMainTitlePre}
              <span className="cx-pricing-title-blue">
                {tr.pricingMainTitlePost}
              </span>
            </h2>
            <p className="cx-pricing-subtitle">{tr.pricingSubText}</p>
          </div>

          <div className="cx-pricing-alert-bar">
            <p className="cx-pricing-alert-text">
              <span className="cx-pricing-alert-bold">
                {tr.pricingAlertBold}
              </span>
              {tr.pricingAlertText}
            </p>
          </div>

          <div className="cx-pricing-grid">
            <div className="cx-pricing-card">
              <div className="cx-pricing-icon-wrapper">
                <Bot size={44} strokeWidth={2} />
              </div>
              <h3 className="cx-pricing-card-title">
                {tr.pricingFeatures.ai.title}
              </h3>
              <p className="cx-pricing-card-desc">
                {tr.pricingFeatures.ai.desc}
              </p>
            </div>

            <div className="cx-pricing-card">
              <div className="cx-pricing-icon-wrapper">
                <RefreshCw size={44} strokeWidth={2} />
              </div>
              <h3 className="cx-pricing-card-title">
                {tr.pricingFeatures.automate.title}
              </h3>
              <p className="cx-pricing-card-desc">
                {tr.pricingFeatures.automate.desc}
              </p>
            </div>

            <div className="cx-pricing-card">
              <div className="cx-pricing-stat-wrapper">
                <div className="cx-pricing-icon-inline">
                  <BarChart3 size={44} strokeWidth={2} />
                </div>
                
              </div>
              <h3 className="cx-pricing-card-title">
                {tr.pricingFeatures.conversion.title}
              </h3>
              <p className="cx-pricing-card-desc">
                {tr.pricingFeatures.conversion.desc}
              </p>
            </div>

            <div className="cx-pricing-card">
              <div className="cx-pricing-icon-wrapper">
                <Building2 size={44} strokeWidth={2} />
              </div>
              <h3 className="cx-pricing-card-title">
                {tr.pricingFeatures.realestate.title}
              </h3>
              <p className="cx-pricing-card-desc">
                {tr.pricingFeatures.realestate.desc}
              </p>
            </div>
          </div>
        </section>

        <div className="cx-plans-container">
          <div className="cx-plans-grid">
            <div className="cx-plans-card">
              <div className="cx-plans-card-header">
                <div className="cx-plans-icon-box">
                  <User size={54} strokeWidth={1.8} />
                </div>
                <div className="cx-plans-meta">
                  <h3 className="cx-plans-name">{tr.plansData.solo.name}</h3>
                  <span className="cx-plans-users">
                    {tr.plansData.solo.users}
                  </span>
                  <p className="cx-plans-desc">{tr.plansData.solo.desc}</p>
                </div>
              </div>
              <div className="cx-plans-price-block">
                <span className="cx-plans-amount">
                  {tr.plansData.solo.price}
                </span>
                <span className="cx-plans-period">{tr.plansPerMonth}</span>
              </div>
              <ul className="cx-plans-features">
                {tr.plansData.solo.features.map((feat, i) => (
                  <li key={i} className="cx-plans-feature-item">
                    <CheckCircle className="cx-check-icon-purple" size={18} />{" "}
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/trial" className="cx-plans-btn">
                <Zap size={14} fill="currentColor" /> {tr.plansBtnTrial}
              </a>
            </div>

            <div className="cx-plans-card cx-plans-popular">
              <div className="cx-plans-badge">{tr.plansBadgePopular}</div>
              <div className="cx-plans-card-header">
                <div className="cx-plans-icon-box">
                  <Users size={54} strokeWidth={1.8} />
                </div>
                <div className="cx-plans-meta">
                  <h3 className="cx-plans-name">{tr.plansData.team.name}</h3>
                  <span className=" cx-plans-users">
                    {tr.plansData.team.users}
                  </span>
                  <p className="cx-plans-desc">{tr.plansData.team.desc}</p>
                </div>
              </div>
              <div className="cx-plans-price-block">
                <span className="cx-plans-amount">
                  {tr.plansData.team.price}
                </span>
                <span className="cx-plans-period">{tr.plansPerMonth}</span>
              </div>
              <ul className="cx-plans-features">
                {tr.plansData.team.features.map((feat, i) => (
                  <li key={i} className="cx-plans-feature-item">
                    <CheckCircle className="cx-check-icon-purple" size={18} />{" "}
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/trial" className="cx-plans-btn">
                <Zap size={14} fill="currentColor" /> {tr.plansBtnTrial}
              </a>
            </div>

            <div className="cx-plans-card">
              <div className="cx-plans-card-header">
                <div className="cx-plans-icon-box">
                  <BarChart3 size={54} strokeWidth={1.8} />
                </div>
                <div className="cx-plans-meta">
                  <h3 className="cx-plans-name">{tr.plansData.growth.name}</h3>
                  <span className="cx-plans-users">
                    {tr.plansData.growth.users}
                  </span>
                  <p className="cx-plans-desc">{tr.plansData.growth.desc}</p>
                </div>
              </div>
              <div className="cx-plans-price-block">
                <span className="cx-plans-amount">
                  {tr.plansData.growth.price}
                </span>
                <span className="cx-plans-period">{tr.plansPerMonth}</span>
              </div>
              <ul className="cx-plans-features">
                {tr.plansData.growth.features.map((feat, i) => (
                  <li key={i} className="cx-plans-feature-item">
                    <CheckCircle className="cx-check-icon-purple" size={18} />{" "}
                    {feat}
                  </li>
                ))}
              </ul>
              <a href="/trial" className="cx-plans-btn">
                <Zap size={14} fill="currentColor" /> {tr.plansBtnTrial}
              </a>
            </div>
          </div>

          <div className="cx-plans-footer-grid">
            <div className="cx-plans-footer-card">
              <div className="cx-plans-footer-icon-box">
                <Settings size={42} strokeWidth={2} />
              </div>
              <div className="cx-plans-footer-info">
                <div className="cx-plans-footer-value">
                  {tr.plansFooter.setup.value}
                </div>
                <h4 className="cx-plans-footer-title">
                  {tr.plansFooter.setup.title}
                </h4>
                <p className="cx-plans-footer-desc">
                  {tr.plansFooter.setup.desc}
                </p>
              </div>
            </div>

            <div className="cx-plans-footer-card">
              <div className="cx-plans-footer-icon-box">
                <UserPlus size={42} strokeWidth={2} />
              </div>
              <div className="cx-plans-footer-info">
                <div className="cx-plans-footer-value">
                  {tr.plansFooter.user.value}
                </div>
                <h4 className="cx-plans-footer-title">
                  {tr.plansFooter.user.title}
                </h4>
                <p className="cx-plans-footer-desc">
                  {tr.plansFooter.user.desc}
                </p>
              </div>
            </div>

            <div className="cx-plans-footer-card">
              <div className="cx-plans-footer-icon-box">
                <ShieldCheck size={42} strokeWidth={2} />
              </div>
              <div className="cx-plans-footer-info">
                <h4 className=" cx-plans-footer-title-large">
                  {tr.plansFooter.contract.title}
                </h4>
                <p className="cx-plans-footer-desc">
                  {tr.plansFooter.contract.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="cx-compare-container">
          <div className="cx-compare-header">
            <h2 className="cx-compare-title">{tr.compareTitle}</h2>
            <p className="cx-compare-subtitle">{tr.compareSubtitle}</p>
          </div>

          <div className="cx-compare-table-wrapper">
            <table className="cx-compare-table">
              <thead>
                <tr>
                  <th className="cx-th-feature">{tr.compareThFeature}</th>
                  <th className="cx-th-other">
                    {renderNewLineText(tr.compareThOther)}
                  </th>
                  <th className="cx-th-cost">
                    {renderNewLineText(tr.compareThCost)}
                  </th>
                  <th className="cx-th-cortexa">
                    {renderNewLineText(tr.compareThCortexa)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tr.compareRows.map((row, idx) => {
                  const isSpecialRow = idx >= 18;
                  return (
                    <tr
                      key={idx}
                      className={isSpecialRow ? "cx-row-special" : ""}
                    >
                      <td className="cx-td-feature">
                        <div className="cx-feature-cell">
                          {isSpecialRow ? (
                            <span className="cx-icon-close">✓</span>
                          ) : (
                            <HelpCircle size={16} className="cx-icon-help" />
                          )}
                          <span className="cx-feature-text">
                            {row.f}
                            {row.badge && (
                              <span className="cx-compare-badge">
                                {row.badge}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="cx-td-other">{row.o}</td>
                      <td className="cx-td-cost">{renderNewLineText(row.c)}</td>
                      <td className="cx-td-cortexa">
                        {idx === 18 ? (
                          <div className="cx-cortexa-info-cell">
                            <span className="cx-cortexa-info-title">
                              {tr.compareUnlimitedAiTitle}
                            </span>
                            <span className="cx-cortexa-info-desc">
                              {renderNewLineText(tr.compareUnlimitedAiDesc)}
                            </span>
                          </div>
                        ) : idx === 19 ? (
                          <div className="cx-cortexa-info-cell">
                            <span className="cx-cortexa-info-title">
                              {tr.compareNoPenaltiesTitle}
                            </span>
                            <span className="cx-cortexa-info-desc">
                              {renderNewLineText(tr.compareNoPenaltiesDesc)}
                            </span>
                          </div>
                        ) : (
                          <div className="cx-cortexa-included-box">
                            <CheckCircle2 size={18} className="cx-icon-check" />
                            <span className="cx-included-text">
                              {tr.compareIncluded}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                <tr className="cx-row-summary">
                  <td className="cx-td-feature cx-summary-title">
                    {renderNewLineText(tr.compareOneTimeSetup)}
                  </td>
                  <td className="cx-td-other font-bold">
                    {renderNewLineText(tr.compareEstimatedOther.split("\n")[0])}
                  </td>
                  <td className="cx-td-cost">-</td>
                  <td className="cx-td-cortexa cx-summary-cortexa-highlight">
                    {renderNewLineText(tr.compareSetupSetup)}
                  </td>
                </tr>

                <tr className="cx-row-summary">
                  <td className="cx-td-feature cx-summary-title">
                    {renderNewLineText(tr.compareEstimatedCost)}
                  </td>
                  <td className="cx-td-other cx-summary-other-cost">
                    {renderNewLineText(tr.compareEstimatedOther1)}
                  </td>
                  <td className="cx-td-cost">-</td>
                  <td className="cx-td-cortexa cx-summary-cortexa-main-highlight">
                    {renderNewLineText(tr.compareEstimatedCortexa)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="cx-comparison-container">
          {/* Top Split Comparison Cards */}
          <div className="cx-split-comparison">
            {/* Left Side: Other Platforms */}
            <div className="cx-comp-side-card cx-side-other">
              <h3 className="cx-comp-side-title">{tr.vsCompOtherTitle}</h3>
              <ul className="cx-comp-list">
                <li>
                  <div className="cx-circle-icon-x">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompOther1}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-x">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompOther2}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-x">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompOther3}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-x">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompOther4}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-x">
                    <X size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompOther5}</span>
                </li>
              </ul>

              <div className="cx-investment-inner-box cx-inner-box-other">
                <p className="cx-inner-box-label">{tr.vsCompOtherTotalTitle}</p>
                <p className="cx-inner-box-value">{tr.vsCompOtherTotalVal}</p>
                <p className="cx-inner-box-sub">{tr.vsCompOtherTotalSub}</p>
                <p className="cx-inner-box-note">{tr.vsCompOtherTotalNote}</p>
              </div>
            </div>

            {/* Middle VS Badge */}
            <div className="cx-comp-vs-badge">
              <span>{tr.vsCompVs}</span>
            </div>

            {/* Right Side: Cortexa AIOS */}
            <div className="cx-comp-side-card cx-side-cortexa">
              <h3 className="cx-comp-side-title">{tr.vsCompCortexaTitle}</h3>
              <ul className="cx-comp-list">
                <li>
                  <div className="cx-circle-icon-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompCortexa1}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompCortexa2}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompCortexa3}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompCortexa4}</span>
                </li>
                <li>
                  <div className="cx-circle-icon-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>{tr.vsCompCortexa5}</span>
                </li>
              </ul>

              <div className="cx-investment-inner-box cx-inner-box-cortexa">
                <p className="cx-inner-box-label">
                  {tr.vsCompCortexaTotalTitle}
                </p>
                <p className="cx-inner-box-value">{tr.vsCompCortexaTotalVal}</p>
                <p className="cx-inner-box-sub">{tr.vsCompCortexaTotalSub}</p>
              </div>
            </div>
          </div>

          {/* Bottom Conversion Banner */}
          <div className="cx-conversion-footer-banner">
            <div className="cx-footer-left-content">
              <div className="cx-footer-bar-icon-container">
                <BarChart3 size={24} className="cx-bar-icon" />
              </div>
              <div className="cx-footer-text-block">
                <h4 className="cx-footer-header-text">
                  {tr.vsCompBottomHeader}
                </h4>
                <p className="cx-footer-sub-text">{tr.vsCompBottomSub}</p>
                <div className="cx-footer-ticks-row desktop">
                  <div className="cx-tick-item">
                    <div className="cx-mini-tick">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span>{tr.vsCompBottomFeat1}</span>
                  </div>
                  <div className="cx-tick-item">
                    <div className="cx-mini-tick">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span>{tr.vsCompBottomFeat2}</span>
                  </div>
                  <div className="cx-tick-item">
                    <div className="cx-mini-tick">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span>{tr.vsCompBottomFeat3}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="cx-footer-ticks-row mobile">
              <div className="cx-tick-item">
                <div className="cx-mini-tick">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span>{tr.vsCompBottomFeat1}</span>
              </div>
              <div className="cx-tick-item">
                <div className="cx-mini-tick">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span>{tr.vsCompBottomFeat2}</span>
              </div>
              <div className="cx-tick-item">
                <div className="cx-mini-tick">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span>{tr.vsCompBottomFeat3}</span>
              </div>
            </div>
            <a href="/trial" className="cx-footer-cta-button">
              <Zap size={16} fill="currentColor" className="cx-btn-bolt-icon" />
              {tr.vsCompBottomBtn}
            </a>
          </div>
        </div>
      </main>

      <footer className="footer-section">
        <div className="footer-inner-wrap">
          <div className="footer-main-grid">
            {isMobile ? (
              <div className="footer-brand-column">
                <img src={headlogoM} alt="Cortexa" className="footer-logo-img" />
                <p className="footer-brand-desc">{tr.footer.desc}</p>
                <div className="footer-social-row">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </div>
            ):(
              <div className="footer-brand-column">
                <img src={headlogo} alt="Cortexa" className="footer-logo-img" />
                <p className="footer-brand-desc">{tr.footer.desc}</p>
                <div className="footer-social-row">
                  <img src={social1} alt="Social" />
                  <img src={social2} alt="Social" />
                  <img src={social3} alt="Social" />
                  <img src={social4} alt="Social" />
                </div>
              </div>
            )}

            <div className="footer-links-column">
              <h3>{tr.footer.col1}</h3>
              <ul>
                <li>
                  <HashLink smooth to="/features">
                    {tr.footer.col1_items[0]}
                  </HashLink>
                </li>
                <li>
                  <a href="/pricing">{tr.footer.col1_items[1]}</a>
                </li>
                <li>
                  <a href="/integrations">{tr.footer.col1_items[2]}</a>
                </li>
                <li>
                  <a href="/changelog">{tr.footer.col1_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3>{tr.footer.col2}</h3>
              <ul>
                <li>
                  <a href="/about">{tr.footer.col2_items[0]}</a>
                </li>
                <li>
                  <a href="/blog">{tr.footer.col2_items[1]}</a>
                </li>
                <li>
                  <a href="/careers">{tr.footer.col2_items[2]}</a>
                </li>
                <li>
                  <a href="/contact">{tr.footer.col2_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3>{tr.footer.col3}</h3>
              <ul>
                <li>
                  <a href="/help">{tr.footer.col3_items[0]}</a>
                </li>
                <li>
                  <a href="/guides">{tr.footer.col3_items[1]}</a>
                </li>
                <li>
                  <a href="/community">{tr.footer.col3_items[2]}</a>
                </li>
                <li>
                  <a href="/api-docs">{tr.footer.col3_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3>{tr.footer.col4}</h3>
              <ul>
                <li>
                  <a href="/terms">{tr.footer.col4_items[0]}</a>
                </li>
                <li>
                  <a href="/privacy">{tr.footer.col4_items[1]}</a>
                </li>
                <li>
                  <a href="/refund">{tr.footer.col4_items[2]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h3>{tr.footer.col5}</h3>
              <ul>
                <li>
                  <a href="/sign-in">{tr.footer.col5_items[0]}</a>
                </li>
                <li>
                  <a href="/trial" className="footer-cta-btn">
                    {tr.footer.col5_items[1]}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-copyright-bar">
            <p>&copy; 2026 Cortexa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
