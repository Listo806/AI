import React, { useEffect, useState } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
import "./Common.css";
import { Link, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { trackEvent } from "../../utils/track";
import { useAuth } from "../../context/AuthContext";
import { selectAccountPlan } from "../../api/platformApi";
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
  LockKeyhole,
} from "lucide-react";

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

    pricingMainTitlePre: "Your Automation ",
    pricingMainTitlePost: "Begins Here",
    pricingSubText: "Leads.",
    pricingSubText1: "Qualifies.",
    pricingSubText2: "Closes.",
    pricingFeatures: {
      ai: {
        title: "AI-Powered Everything",
        desc: "Your 24/7 AI Assistant handles conversations, follow-ups, appointments and more.",
      },
      automate: {
        title: "Automate. Follow Up. Close More.",
        desc: "Automatic, smart follow-ups help you respond faster and convert more leads into clients.",
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
    plansBtnTrial: "Choose plan",
    plansPerMonth: "/month",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 user",
        desc: "Perfect for solo agents.",
        price: "$197",
        features: [
          "CRM & Contact Management",
          "Leads & Pipeline Management",
          "AI Agent (24/7)",
          "WhatsApp Automation",
          "Reporting & Analytics",
          "Team Collaboration",
          "Tasks & Reminders",
          "Document & File Management",
          "Workflow Automation",
          "Integrations (Popular Apps)",
          "Email & SMS Campaigns",
          "24/7 Support",
        ],
      },
      team: {
        name: "Team",
        users: "3 users",
        desc: "Great for small teams.",
        price: "$347",
        features: [
          "CRM & Contact Management",
          "Leads & Pipeline Management",
          "AI Agent (24/7)",
          "WhatsApp Automation",
          "Reporting & Analytics",
          "Team Collaboration",
          "Tasks & Reminders",
          "Document & File Management",
          "Workflow Automation",
          "Integrations (Popular Apps)",
          "Email & SMS Campaigns",
          "24/7 Support",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 users",
        desc: "Built for growing teams.",
        price: "$497",
        features: [
          "CRM & Contact Management",
          "Leads & Pipeline Management",
          "AI Agent (24/7)",
          "WhatsApp Automation",
          "Reporting & Analytics",
          "Team Collaboration",
          "Tasks & Reminders",
          "Document & File Management",
          "Workflow Automation",
          "Integrations (Popular Apps)",
          "Email & SMS Campaigns",
          "24/7 Support",
        ],
      },
    },
    plansFooter: {
      setup: {
        title: "No long-term contracts",
        desc: "Cancel anytime",
      },
      user: {
        title: "Secure and reliable",
        desc: "Your data is protected",
      },
      contract: {
        title: "Add users anytime",
        desc: "Scale as you grow",
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
    compareEstimatedOther: "Varies by provider",
    compareEstimatedOther1:
      "Varies by provider\nAnd it may not include everything.",
    compareEstimatedCortexa: "$197 /month\nEverything included",

    compareRows: [
      { f: "CRM & Contact Management", o: "Included in higher plans", c: "-" },
      { f: "Leads & Pipeline Management", o: "Included, but tiered", c: "-" },
      {
        f: "Email & SMS Campaigns",
        o: "Included, but tiered by plan",
        c: "Varies",
      },
      {
        f: "Marketing Automation",
        o: "Included, but limited in lower plans",
        c: "Varies",
      },
      {
        f: "AI Agent (24/7)",
        o: "Add-on or higher tier only",
        c: "Varies",
      },
      {
        f: "WhatsApp Automation",
        o: "Usually integration or add-on",
        c: "Varies",
      },
      {
        f: "Appointment Booking",
        o: "Add-on or higher tier only",
        c: "Varies",
      },
      {
        f: "Web Forms & Landing Pages",
        o: "Limited in lower plans",
        c: "Varies",
      },
      {
        f: "Reporting & Analytics",
        o: "Advanced reporting in higher tiers",
        c: "Varies",
      },
      {
        f: "Sales Automation",
        o: "Sales automation in higher tiers",
        c: "Varies",
      },
      {
        f: "Tasks & Reminders",
        o: "Included, but limited",
        c: "Varies",
      },
      {
        f: "Team Collaboration",
        o: "Seat-based, higher cost",
        c: "Varies",
      },
      {
        f: "Document & File Management",
        o: "Often limited storage",
        c: "Varies",
      },
      {
        f: "Workflow Automation",
        o: "Advanced workflows in higher tiers",
        c: "Varies",
      },
      {
        f: "Industry-Specific Setup",
        o: "Custom work or expensive add-on",
        c: "Varies",
      },
      {
        f: "Onboarding & Training",
        o: "Often add-on or paid service",
        c: "Varies",
      },
      {
        f: "Integration (Popular Apps)",
        o: "Many require paid integrations",
        c: "Varies",
      },
      {
        f: "Lead Generation (Done For You)",
        o: "Separate add-on or external service",
        c: "Varies",
      },
      {
        f: "AI Usage & Credits",
        o: "AI credits, usage limits, and overage charges",
        c: "Varies",
        badge: "NEW",
      },
      {
        f: "Marketing Contact Fees",
        o: "Charged as your contact database grows",
        c: "Varies",
        badge: "NEW",
      },
      {
        f: "Transactional Emails",
        o: "Often sold as a separate add-on service",
        c: "Varies",
        badge: "NEW",
      },
      {
        f: "Custom Fields & Properties",
        o: "Additional limits require expansion packs or upgrades",
        c: "Varies",
        badge: "NEW",
      },
      {
        f: "Advanced Reporting & Dashboards",
        o: "Reporting limits often require higher plans or add-ons",
        c: "Varies",
        badge: "NEW",
      },
      {
        f: "Team & User Growth Limits",
        o: "Expansion packs required as teams grow",
        c: "Varies",
        badge: "NEW",
      },
    ],
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

    pricingMainTitlePre: "Tu automatización ",
    pricingMainTitlePost: "comienza aquí",
    pricingSubText: "Clientes potenciales.",
    pricingSubText1: "Califica.",
    pricingSubText2: "Cierra.",
    pricingFeatures: {
      ai: {
        title: "Todo Impulsado por IA",
        desc: "Su asistente de IA disponible las 24 horas, los 7 días de la semana, se encarga de las conversaciones, los seguimientos, las citas y más.",
      },
      automate: {
        title: "Automatice. Siga de cerca. Cierre más.",
        desc: "Los seguimientos automáticos e inteligentes le ayudan a responder más rápido y convertir más prospectos en clientes.",
      },
      conversion: {
        value: "",
        title: "Aumento en la Tasa de Conversión",
        desc: "Gestiona tus clientes potenciales, seguimientos y flujo de ventas en un solo espacio de trabajo conectado.",
      },
      realestate: {
        title: "Creado para Bienes Raíces",
        desc: "Diseñado especialmente para profesionales inmobiliarios. Desde el prospecto hasta el cierre, todo en un solo lugar.",
      },
    },

    plansBadgePopular: "MÁS POPULAR",
    plansBtnTrial: "Elige un plan",
    plansPerMonth: "/mes",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 usuario",
        desc: "Perfecto para agentes independientes.",
        price: "$197",
        features: [
          "CRM y Gestión de Contactos",
          "Gestión de Prospectos y Pipeline",
          "Agente de IA (24/7)",
          "Automatización de WhatsApp",
          "Informes y Analítica",
          "Colaboración en Equipo",
          "Tareas y Recordatorios",
          "Gestión de Documentos y Archivos",
          "Automatización de Flujos",
          "Integraciones (Apps Populares)",
          "Campañas de Email y SMS",
          "Soporte 24/7",
        ],
      },
      team: {
        name: "Team",
        users: "3 usuarios",
        desc: "Ideal para equipos pequeños.",
        price: "$347",
        features: [
          "CRM y Gestión de Contactos",
          "Gestión de Prospectos y Pipeline",
          "Agente de IA (24/7)",
          "Automatización de WhatsApp",
          "Informes y Analítica",
          "Colaboración en Equipo",
          "Tareas y Recordatorios",
          "Gestión de Documentos y Archivos",
          "Automatización de Flujos",
          "Integraciones (Apps Populares)",
          "Campañas de Email y SMS",
          "Soporte 24/7",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 usuarios",
        desc: "Creado para equipos en crecimiento.",
        price: "$497",
        features: [
          "CRM y Gestión de Contactos",
          "Gestión de Prospectos y Pipeline",
          "Agente de IA (24/7)",
          "Automatización de WhatsApp",
          "Informes y Analítica",
          "Colaboración en Equipo",
          "Tareas y Recordatorios",
          "Gestión de Documentos y Archivos",
          "Automatización de Flujos",
          "Integraciones (Apps Populares)",
          "Campañas de Email y SMS",
          "Soporte 24/7",
        ],
      },
    },
    plansFooter: {
      setup: {
        title: "Sin contratos a largo plazo",
        desc: "Cancela cuando quieras",
      },
      user: {
        title: "Seguro y confiable",
        desc: "Tus datos están protegidos",
      },
      contract: {
        title: "Agrega usuarios en cualquier momento",
        desc: "Escala a medida que creces",
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
    compareEstimatedOther: "Varies by provider",
    compareEstimatedOther1:
      "Varía según el proveedor\nY aún así podría no incluir todo.",
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
        c: "Varies",
      },
      {
        f: "Automatización de Marketing",
        o: "Incluido, pero limitado en planes inferiores",
        c: "Varies",
      },
      {
        f: "Agente de IA (24/7)",
        o: "Solo complemento o nivel superior",
        c: "Varies",
      },
      {
        f: "Automatización de WhatsApp",
        o: "Normalmente integración o complemento",
        c: "Varies",
      },
      {
        f: "Reserva de Citas",
        o: "Solo complemento o nivel superior",
        c: "Varies",
      },
      {
        f: "Formularios Web y Landing Pages",
        o: "Limitado en planes inferiores",
        c: "Varies",
      },
      {
        f: "Informes y Analítica",
        o: "Informes avanzados en niveles superiores",
        c: "Varies",
      },
      {
        f: "Automatización de Ventas",
        o: "Automatización en niveles superiores",
        c: "Varies",
      },
      {
        f: "Tareas y Recordatorios",
        o: "Incluido, pero limitado",
        c: "Varies",
      },
      {
        f: "Colaboración en Equipo",
        o: "Por usuario, mayor costo",
        c: "Varies",
      },
      {
        f: "Gestión de Documentos y Archivos",
        o: "A menudo almacenamiento limitado",
        c: "Varies",
      },
      {
        f: "Automatización de Flujos",
        o: "Flujos avanzados en niveles superiores",
        c: "Varies",
      },
      {
        f: "Configuración Específica",
        o: "Trabajo personalizado o complemento costoso",
        c: "Varies",
      },
      {
        f: "Onboarding y Capacitación",
        o: "A menudo servicio de pago",
        c: "Varies",
      },
      {
        f: "Integración (Apps Populares)",
        o: "Muchas requieren integraciones de pago",
        c: "Varies",
      },
      {
        f: "Generación de Prospectos",
        o: "Complemento separado o servicio externo",
        c: "Varies",
      },
      {
        f: "Créditos y Uso de IA",
        o: "Límites de uso y cargos por exceso",
        c: "Varies",
        badge: "NUEVO",
      },
      {
        f: "Tarifas por Contactos",
        o: "Se cobra a medida que crece la base de datos",
        c: "Varies",
        badge: "NUEVO",
      },
      {
        f: "Correos Transaccionales",
        o: "A menudo vendido por separado",
        c: "Varies",
        badge: "NUEVO",
      },
      {
        f: "Campos Personalizados",
        o: "Límites adicionales requieren paquetes de expansión",
        c: "Varies",
        badge: "NUEVO",
      },
      {
        f: "Informes Avanzados",
        o: "Límites de informes requieren planes superiores",
        c: "Varies",
        badge: "NUEVO",
      },
      {
        f: "Límites de Crecimiento de Equipo",
        o: "Paquetes de expansión al crecer el equipo",
        c: "Varies",
        badge: "NUEVO",
      },
    ],
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

    pricingMainTitlePre: "Sua automação ",
    pricingMainTitlePost: "começa aqui",
    pricingSubText:
      "Suas ferramentas devem apoiar o seu crescimento, não esgotá-lo. O CORTEXA AIOS oferece o sistema essencial para capturar leads, fazer acompanhamento, agendar reuniões e gerenciar receitas sem adicionar milhares em custos iniciais.",
    pricingSubText: "Leads.",
    pricingSubText1: "Qualifica.",
    pricingSubText2: "Fecha.",
    pricingFeatures: {
      ai: {
        title: "Tudo Impulsionado por IA",
        desc: "Seu Assistente de IA 24/7 gerencia conversas, acompanhamentos, agendamentos e muito mais.",
      },
      automate: {
        title: "Automatize. Acompanhe. Feche Mais.",
        desc: "Acompanhamentos automáticos e inteligentes ajudam você a responder mais rápido e converter mais leads em clientes.",
      },
      conversion: {
        value: "",
        title: "Aumento na Taxa de Conversão de Leads",
        desc: "Gerencie seus leads, acompanhamentos e pipeline em um único espaço de trabalho integrado.",
      },
      realestate: {
        title: "Feito para o Setor Imobiliário",
        desc: "Desenvolvido especificamente para profissionais do mercado imobiliário. Do lead ao fechamento, tudo em um só lugar.",
      },
    },

    plansBadgePopular: "MAIS POPULAR",
    plansBtnTrial: "Escolha um plano",
    plansPerMonth: "/mês",
    plansData: {
      solo: {
        name: "Solo",
        users: "1 usuário",
        desc: "Perfeito para corretores autônomos.",
        price: "$197",
        features: [
          "CRM e Gestão de Contatos",
          "Gestão de Leads e Pipeline",
          "Agente de IA (24/7)",
          "Automação do WhatsApp",
          "Relatórios e Análises",
          "Colaboração em Equipe",
          "Tarefas e Lembretes",
          "Gestão de Documentos e Arquivos",
          "Automação de Fluxos",
          "Integrações (Apps Populares)",
          "Campanhas de E-mail e SMS",
          "Suporte 24/7",
        ],
      },
      team: {
        name: "Team",
        users: "3 usuários",
        desc: "Excelente para equipes pequenas.",
        price: "$347",
        features: [
          "CRM e Gestão de Contatos",
          "Gestão de Leads e Pipeline",
          "Agente de IA (24/7)",
          "Automação do WhatsApp",
          "Relatórios e Análises",
          "Colaboração em Equipe",
          "Tarefas e Lembretes",
          "Gestão de Documentos e Arquivos",
          "Automação de Fluxos",
          "Integrações (Apps Populares)",
          "Campanhas de E-mail e SMS",
          "Suporte 24/7",
        ],
      },
      growth: {
        name: "Growth",
        users: "5 usuários",
        desc: "Desenvolvido para equipes em crescimento.",
        price: "$497",
        features: [
          "CRM e Gestão de Contatos",
          "Gestão de Leads e Pipeline",
          "Agente de IA (24/7)",
          "Automação do WhatsApp",
          "Relatórios e Análises",
          "Colaboração em Equipe",
          "Tarefas e Lembretes",
          "Gestão de Documentos e Arquivos",
          "Automação de Fluxos",
          "Integrações (Apps Populares)",
          "Campanhas de E-mail e SMS",
          "Suporte 24/7",
        ],
      },
    },
    plansFooter: {
      setup: {
        title: "Sem contratos de longo prazo",
        desc: "Cancele a qualquer momento",
      },
      user: {
        title: "Seguro e confiável",
        desc: "Seus dados estão protegidos",
      },
      contract: {
        title: "Adicione usuários a qualquer momento",
        desc: "Escale conforme seu crescimento",
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
    compareEstimatedOther: "Varies by provider",
    compareEstimatedOther1:
      "Varia conforme o provedor\nE ainda assim pode não incluir tudo.",
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
        c: "Varies",
      },
      {
        f: "Automação de Marketing",
        o: "Incluso, mas limitado em planos baixos",
        c: "Varies",
      },
      {
        f: "Agente de IA (24/7)",
        o: "Apenas complemento ou nível superior",
        c: "Varies",
      },
      {
        f: "Automação de WhatsApp",
        o: "Geralmente integração ou complemento",
        c: "Varies",
      },
      {
        f: "Agendamento de Reuniões",
        o: "Apenas complemento ou nível superior",
        c: "Varies",
      },
      {
        f: "Formulários Web e Landing Pages",
        o: "Limitado em planos inferiores",
        c: "Varies",
      },
      {
        f: "Relatórios e Análises",
        o: "Relatórios avançados em níveis superiores",
        c: "Varies",
      },
      {
        f: "Automação de Vendas",
        o: "Automação em níveis superiores",
        c: "Varies",
      },
      {
        f: "Tarefas e Lembretes",
        o: "Incluso, mas limitado",
        c: "Varies",
      },
      {
        f: "Colaboração em Equipe",
        o: "Por usuário, custo maior",
        c: "Varies",
      },
      {
        f: "Gestão de Documentos e Arquivos",
        o: "Geralmente armazenamento limitado",
        c: "Varies",
      },
      {
        f: "Automação de Fluxos",
        o: "Fluxos avançados em níveis superiores",
        c: "Varies",
      },
      {
        f: "Configuração Específica",
        o: "Trabalho personalizado ou complemento caro",
        c: "Varies",
      },
      {
        f: "Onboarding e Treinamento",
        o: "Geralmente serviço adicional pago",
        c: "Varies",
      },
      {
        f: "Integração (Apps Populares)",
        o: "Muitos exigem integrações pagas",
        c: "Varies",
      },
      {
        f: "Geração de Leads",
        o: "Complemento separado ou serviço externo",
        c: "Varies",
      },
      {
        f: "Créditos e Uso de IA",
        o: "Créditos de IA e cobranças por excesso",
        c: "Varies",
        badge: "NOVO",
      },
      {
        f: "Taxas por Contatos de Marketing",
        o: "Cobrado conforme o banco de dados cresce",
        c: "Varies",
        badge: "NOVO",
      },
      {
        f: "E-mails Transacionais",
        o: "Geralmente vendido como serviço separado",
        c: "Varies",
        badge: "NOVO",
      },
      {
        f: "Campos Personalizados",
        o: "Limites extras exigem pacotes de expansão",
        c: "Varies",
        badge: "NOVO",
      },
      {
        f: "Painéis e Relatórios Avançados",
        o: "Limites exigem planos superiores",
        c: "Varies",
        badge: "NOVO",
      },
      {
        f: "Limites de Crescimento de Equipe",
        o: "Pacotes de expansão necessários",
        c: "Varies",
        badge: "NOVO",
      },
    ],
  },
};

const pricingV3 = {
  en: {
    title: "Transparent pricing for every team.",
    monthly: "Billed monthly",
    annually: "Billed annually",
    save: "Save 20%",
    popular: "",
    toStart: "to start",
    forever: "Forever",
    keyFeatures: "FEATURES:",
    everythingFree: "FEATURES:",
    everythingSolo: "FEATURES:",
    everythingBusiness: "FEATURES:",
    ctaFree: "Get Started",
    ctaTrial: "Start Free Trial",
    then: "Then",
    perMonth: "/month",
    perYear: "/year",
    oneTimeActivation: "one-time activation",
    annualSavings: "20% savings vs.",
    atMonthlyPricing: "at monthly pricing",
    plans: {
      free: {
        name: "Zero Plan",
        desc: "Perfect to explore and get started.",
        price: "$0",
        users: "",
        features: [
          "AI Agent (Limited)",
          "Basic AI Chat",
          "Basic Dashboard",
          "Limited AI Conversations (50/mo)",
          "Basic Automations (5 workflows)",
          "Contact Management (Limited)",
          "1 App Integration",
          "Knowledge Base (Basic)",
          "Activity Timeline",
          "Task Management (Basic)",
          "Calendar & Appointments (Basic)",
          "Basic Reports & Insights",
          "Mobile Access",
          "Community Support",
        ],
      },
      solo: {
        name: "Solo Plan",
        desc: "Everything you need to start getting started.",
        price: "$7",
        users: "",
        features: [
          "Everything in Zero Plan, plus:",
          "Full CRM & Contact Management",
          "Lead & Pipeline Management",
          "Advanced Dashboard & Insights",
          "AI Chat (Standard)",
          "AI Conversations (250/mo)",
          "Workflow Builder (25/mo)",
          "Team Members (Up to 3 Users)",
          "Advanced Automations",
          "Calendar & Scheduling",
          "Documents & File Storage",
          "Custom Fields (Standard)",
          "Forms & Surveys",
          "Web Forms",
          "Integrations (Core)",
          "API Access (Limited)",
          "Mobile App Access",
          "Priority Support (Email)",
        ],
      },
      business: {
        name: "Business Plan",
        desc: "More tools. Smarter workflows. More power.",
        price: "$14",
        users: "3 users",
        features: [
          "Everything in Solo Plan, plus:",
          "Team Workspace (3 Users)",
          "Advanced Permissions & Roles",
          "Advanced Reports & Analytics",
          "Custom Dashboards",
          "Custom Objects & Fields",
          "Advanced Workflow Builder",
          "Multi-Pipeline Management",
          "AI Chat (Advanced)",
          "AI Conversations (1,000/mo)",
          "Lead Scoring & Qualification",
          "Smart Segmentation",
          "Documents & eSignatures",
          "Integrations (Zapier, Make, etc.)",
          "API Access (Standard)",
          "Advanced Search & Filters",
          "Priority Support (Email & Chat)",
        ],
      },
      scale: {
        name: "Scale Plan",
        desc: "All the power you need to grow without limits.",
        price: "$21",
        users: "5 users",
        features: [
          "Everything in Business Plan, plus:",
          "Team Workspace (5 Users)",
          "Unlimited AI Usage",
          "AI Chat (Premium)",
          "AI Conversations (Unlimited)",
          "Advanced Automations (Unlimited)",
          "Multi-Pipeline Management (Advanced)",
          "Advanced Lead Scoring",
          "Predictive Analytics",
          "Custom Integrations",
          "API Access (Advanced)",
          "White Label (Your Brand)",
          "Custom Domain",
          "SLA & Uptime Guarantee",
          "Priority Phone Support",
          "Dedicated Account Manager",
          "Onboarding & Implementation",
          "Premium Support (24/7)",
        ],
      },
    },
  },
  es: {
    title: "Precios transparentes para cada equipo.",
    monthly: "Facturado mensualmente",
    annually: "Facturado anualmente",
    save: "Ahorra 20%",
    popular: "",
    toStart: "para comenzar",
    forever: "Para siempre",
    keyFeatures: "CARACTERÍSTICAS:",
    everythingFree: "CARACTERÍSTICAS:",
    everythingSolo: "CARACTERÍSTICAS:",
    everythingBusiness: "CARACTERÍSTICAS:",
    ctaFree: "Comenzar",
    ctaTrial: "Iniciar prueba gratis",
    then: "Luego",
    perMonth: "/mes",
    perYear: "/año",
    oneTimeActivation: "activación única",
    annualSavings: "20% de ahorro vs.",
    atMonthlyPricing: "con precio mensual",
    plans: {
      free: {
        name: "Plan Zero",
        desc: "Perfecto para explorar y comenzar.",
        price: "$0",
        users: "",
        features: [
          "Agente de IA (Limitado)",
          "Chat básico con IA",
          "Panel básico",
          "Conversaciones con IA limitadas (50/mes)",
          "Automatizaciones básicas (5 flujos)",
          "Gestión de contactos (Limitada)",
          "Integración con 1 aplicación",
          "Base de conocimientos (Básica)",
          "Cronología de actividad",
          "Gestión de tareas (Básica)",
          "Calendario y citas (Básico)",
          "Informes e insights básicos",
          "Acceso móvil",
          "Soporte de la comunidad",
        ],
      },
      solo: {
        name: "Plan Solo",
        desc: "Todo lo que necesitas para empezar.",
        price: "$7",
        users: "",
        features: [
          "Todo lo del Plan Zero, más:",
          "CRM completo y gestión de contactos",
          "Gestión de leads y pipeline",
          "Panel e insights avanzados",
          "Chat con IA (Estándar)",
          "Conversaciones con IA (250/mes)",
          "Constructor de flujos (25/mes)",
          "Miembros del equipo (Hasta 3 usuarios)",
          "Automatizaciones avanzadas",
          "Calendario y programación",
          "Documentos y almacenamiento de archivos",
          "Campos personalizados (Estándar)",
          "Formularios y encuestas",
          "Formularios web",
          "Integraciones (Core)",
          "Acceso API (Limitado)",
          "Acceso a la aplicación móvil",
          "Soporte prioritario (Email)",
        ],
      },
      business: {
        name: "Plan Business",
        desc: "Más herramientas. Flujos más inteligentes. Más potencia.",
        price: "$14",
        users: "3 usuarios",
        features: [
          "Todo lo del Plan Solo, más:",
          "Espacio de trabajo del equipo (3 usuarios)",
          "Permisos y roles avanzados",
          "Informes y analítica avanzados",
          "Paneles personalizados",
          "Objetos y campos personalizados",
          "Constructor de flujos avanzado",
          "Gestión de múltiples pipelines",
          "Chat con IA (Avanzado)",
          "Conversaciones con IA (1.000/mes)",
          "Puntuación y calificación de leads",
          "Segmentación inteligente",
          "Documentos y firmas electrónicas",
          "Integraciones (Zapier, Make, etc.)",
          "Acceso API (Estándar)",
          "Búsqueda y filtros avanzados",
          "Soporte prioritario (Email y chat)",
        ],
      },
      scale: {
        name: "Plan Scale",
        desc: "Toda la potencia que necesitas para crecer sin límites.",
        price: "$21",
        users: "5 usuarios",
        features: [
          "Todo lo del Plan Business, más:",
          "Espacio de trabajo del equipo (5 usuarios)",
          "Uso ilimitado de IA",
          "Chat con IA (Premium)",
          "Conversaciones con IA (Ilimitadas)",
          "Automatizaciones avanzadas (Ilimitadas)",
          "Gestión de múltiples pipelines (Avanzada)",
          "Puntuación avanzada de leads",
          "Analítica predictiva",
          "Integraciones personalizadas",
          "Acceso API (Avanzado)",
          "Marca blanca (Tu marca)",
          "Dominio personalizado",
          "Garantía de SLA y disponibilidad",
          "Soporte telefónico prioritario",
          "Gerente de cuenta dedicado",
          "Onboarding e implementación",
          "Soporte Premium (24/7)",
        ],
      },
    },
  },
  pt: {
    title: "Preços transparentes para todas as equipes.",
    monthly: "Cobrado mensalmente",
    annually: "Cobrado anualmente",
    save: "Economize 20%",
    popular: "",
    toStart: "para começar",
    forever: "Para sempre",
    keyFeatures: "RECURSOS:",
    everythingFree: "RECURSOS:",
    everythingSolo: "RECURSOS:",
    everythingBusiness: "RECURSOS:",
    ctaFree: "Começar",
    ctaTrial: "Iniciar teste grátis",
    then: "Depois",
    perMonth: "/mês",
    perYear: "/ano",
    oneTimeActivation: "ativação única",
    annualSavings: "20% de economia vs.",
    atMonthlyPricing: "com preço mensal",
    plans: {
      free: {
        name: "Plano Zero",
        desc: "Perfeito para explorar e começar.",
        price: "$0",
        users: "",
        features: [
          "Agente de IA (Limitado)",
          "Chat básico com IA",
          "Dashboard básico",
          "Conversas com IA limitadas (50/mês)",
          "Automações básicas (5 fluxos)",
          "Gestão de contatos (Limitada)",
          "Integração com 1 aplicativo",
          "Base de conhecimento (Básica)",
          "Linha do tempo de atividades",
          "Gestão de tarefas (Básica)",
          "Calendário e compromissos (Básico)",
          "Relatórios e insights básicos",
          "Acesso móvel",
          "Suporte da comunidade",
        ],
      },
      solo: {
        name: "Plano Solo",
        desc: "Tudo o que você precisa para começar.",
        price: "$7",
        users: "",
        features: [
          "Tudo do Plano Zero, mais:",
          "CRM completo e gestão de contatos",
          "Gestão de leads e pipeline",
          "Dashboard e insights avançados",
          "Chat com IA (Padrão)",
          "Conversas com IA (250/mês)",
          "Construtor de fluxos (25/mês)",
          "Membros da equipe (Até 3 usuários)",
          "Automações avançadas",
          "Calendário e agendamento",
          "Documentos e armazenamento de arquivos",
          "Campos personalizados (Padrão)",
          "Formulários e pesquisas",
          "Formulários web",
          "Integrações (Core)",
          "Acesso à API (Limitado)",
          "Acesso ao aplicativo móvel",
          "Suporte prioritário (E-mail)",
        ],
      },
      business: {
        name: "Plano Business",
        desc: "Mais ferramentas. Fluxos mais inteligentes. Mais potência.",
        price: "$14",
        users: "3 usuários",
        features: [
          "Tudo do Plano Solo, mais:",
          "Workspace de equipe (3 usuários)",
          "Permissões e funções avançadas",
          "Relatórios e análises avançadas",
          "Dashboards personalizados",
          "Objetos e campos personalizados",
          "Construtor de fluxos avançado",
          "Gestão de múltiplos pipelines",
          "Chat com IA (Avançado)",
          "Conversas com IA (1.000/mês)",
          "Pontuação e qualificação de leads",
          "Segmentação inteligente",
          "Documentos e assinaturas eletrônicas",
          "Integrações (Zapier, Make, etc.)",
          "Acesso à API (Padrão)",
          "Pesquisa e filtros avançados",
          "Suporte prioritário (E-mail e chat)",
        ],
      },
      scale: {
        name: "Plano Scale",
        desc: "Toda a potência de que você precisa para crescer sem limites.",
        price: "$21",
        users: "5 usuários",
        features: [
          "Tudo do Plano Business, mais:",
          "Workspace de equipe (5 usuários)",
          "Uso ilimitado de IA",
          "Chat com IA (Premium)",
          "Conversas com IA (Ilimitadas)",
          "Automações avançadas (Ilimitadas)",
          "Gestão de múltiplos pipelines (Avançada)",
          "Pontuação avançada de leads",
          "Análises preditivas",
          "Integrações personalizadas",
          "Acesso à API (Avançado)",
          "White Label (Sua marca)",
          "Domínio personalizado",
          "Garantia de SLA e disponibilidade",
          "Suporte telefônico prioritário",
          "Gerente de conta dedicado",
          "Onboarding e implementação",
          "Suporte Premium (24/7)",
        ],
      },
    },
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });

  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
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

  const pv3 = pricingV3[lang] || pricingV3.en;

  const navigate = useNavigate();
  const { user } = useAuth();
  const cycle = billingCycle === "annually" ? "annual" : "monthly";

  const billingPrices = {
    solo: {
      activation: 7,
      monthly: 197,
      annual: 1891.2,
      monthlyAnnualized: 2364,
    },
    team: {
      activation: 14,
      monthly: 347,
      annual: 3331.2,
      monthlyAnnualized: 4164,
    },
    growth: {
      activation: 21,
      monthly: 497,
      annual: 4771.2,
      monthlyAnnualized: 5964,
    },
  };

  const formatUsd = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const getRecurringPrice = (planKey) => {
    const plan = billingPrices[planKey];
    if (!plan) return null;

    return {
      amount: cycle === "annual" ? plan.annual : plan.monthly,
      period: cycle === "annual" ? pv3.perYear : pv3.perMonth,
      savingsBase: plan.monthlyAnnualized,
    };
  };

  const renderPaidPrice = (planKey) => {
    const plan = billingPrices[planKey];
    const recurring = getRecurringPrice(planKey);

    return (
      <div className="cx-pricing-v3-paid-pricing">
        <div className="cx-pricing-v3-price">
          <strong>{formatUsd(plan.activation)}</strong>
          <span>{pv3.toStart}</span>
        </div>

        <div className="cx-pricing-v3-activation-label">
          {formatUsd(plan.activation)} {pv3.oneTimeActivation}
        </div>

        <div className="cx-pricing-v3-then-row" aria-label={pv3.then}>
          <span />
          <b>{pv3.then}</b>
          <span />
        </div>

        <div className="cx-pricing-v3-recurring">
          <strong>{formatUsd(recurring.amount)}</strong>
          <span>{recurring.period}</span>
        </div>

        {cycle === "annual" && (
          <div className="cx-pricing-v3-saving-detail">
            ({pv3.annualSavings} {formatUsd(recurring.savingsBase)}{pv3.perYear} {pv3.atMonthlyPricing})
          </div>
        )}
      </div>
    );
  };

  // New signup flow:
  // CTA -> Create Account -> Pricing -> Review / Checkout.
  //
  // The latest backend already exposes /trial/select-plan through
  // selectAccountPlan(), so preserve that developer integration.
  const onPlanCta = (e, planKey) => {
    trackEvent("plan_selected", {
      plan: planKey,
      billing_cycle: planKey === "free" ? "free" : cycle,
    });

    if (planKey !== "free") {
      const selectedPricing = billingPrices[planKey];
      localStorage.setItem(
        "pendingPricingSelection",
        JSON.stringify({
          plan: planKey,
          billingCycle: cycle,
          activationAmount: selectedPricing.activation,
          recurringAmount:
            cycle === "annual"
              ? selectedPricing.annual
              : selectedPricing.monthly,
          recurringFrequency: cycle === "annual" ? "year" : "month",
          currency: "USD",
        }),
      );
    }

    const hasRegisteredAccount = Boolean(
      user || localStorage.getItem("trialUserId"),
    );

    // Pricing can still be visited publicly. If there is no registered account,
    // account creation must happen FIRST. We intentionally do not send the user
    // directly to Checkout or bind the selected plan yet.
    if (!hasRegisteredAccount) {
      e.preventDefault();

      localStorage.setItem("pendingPlanIntent", planKey);
      localStorage.setItem(
        "pendingBillingCycle",
        planKey === "free" ? "free" : cycle,
      );

      navigate("/trial?from=pricing");
      return;
    }

    e.preventDefault();

    (async () => {
      try {
        const res = await selectAccountPlan({
          plan: planKey,
          billingCycle: planKey === "free" ? undefined : cycle,
        });

        const data = res?.data ?? res;
        const selectedPlan = data?.plan || planKey;

        localStorage.setItem("trialPlan", selectedPlan);
        localStorage.setItem(
          "signupFlowStage",
          planKey === "free" || data?.free
            ? "free_plan_selected"
            : "checkout",
        );

        if (planKey === "free" || data?.free) {
          navigate("/dashboard", { replace: true });
          return;
        }

        navigate(
          `/checkout?plan=${encodeURIComponent(selectedPlan)}&billing=${cycle}&source=trial`,
          { replace: true },
        );
      } catch (error) {
        console.error("PLAN SELECTION ERROR:", error);

        // Do not create a second registration. If the account exists but the
        // authenticated plan-update failed, keep the visitor on Pricing.
        alert(
          error?.message ||
            "Unable to save your selected plan. Please try again.",
        );
      }
    })();
  };

  return (
    <div className="pricing-page pricing-v3-page">
      <main className="main-content pricing-v3-main">
        <section className="cx-pricing-v3" aria-labelledby="pricing-v3-title">
          <div className="cx-pricing-v3-heading">
            <h1 id="pricing-v3-title">{pv3.title}</h1>

            <div
              className="cx-pricing-v3-billing"
              aria-label="Billing frequency"
            >
              <button
                type="button"
                className={billingCycle === "monthly" ? "active" : ""}
                onClick={() => setBillingCycle("monthly")}
              >
                {pv3.monthly}
              </button>

              <button
                type="button"
                className={`cx-pricing-v3-switch ${billingCycle === "annually" ? "annual" : ""}`}
                onClick={() =>
                  setBillingCycle((current) =>
                    current === "monthly" ? "annually" : "monthly",
                  )
                }
                aria-label={`${pv3.monthly} / ${pv3.annually}`}
                aria-pressed={billingCycle === "annually"}
              >
                <span />
              </button>

              <button
                type="button"
                className={billingCycle === "annually" ? "active" : ""}
                onClick={() => setBillingCycle("annually")}
              >
                {pv3.annually}
              </button>

              <span className="cx-pricing-v3-save">{pv3.save}</span>
            </div>
          </div>

          <div className="cx-pricing-v3-grid">
            <article className="cx-pricing-v3-card">
              <div className="cx-pricing-v3-card-top">
                <h2>{pv3.plans.free.name}</h2>
                <p className="cx-pricing-v3-desc">{pv3.plans.free.desc}</p>
                <div className="cx-pricing-v3-price n-flex cx-pricing-v3-free-price n-flex">
                  <strong>{pv3.plans.free.price}</strong>
                  <b>{pv3.forever}</b>
                </div>
                <Link
                  to="/trial?from=pricing"
                  className="cx-pricing-v3-cta cx-pricing-v3-cta-black"
                  onClick={(e) => onPlanCta(e, "free")}
                >
                  {pv3.ctaFree}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.keyFeatures}</h3>
                <ul>
                  {pv3.plans.free.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="cx-pricing-v3-card">
              <div className="cx-pricing-v3-card-top">
                <h2>{pv3.plans.solo.name}</h2>
                <p className="cx-pricing-v3-desc">{pv3.plans.solo.desc}</p>
                {renderPaidPrice("solo")}
                <Link
                  to="/trial?from=pricing"
                  className="cx-pricing-v3-cta"
                  onClick={(e) => onPlanCta(e, "solo")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.everythingFree}</h3>
                <ul>
                  {pv3.plans.solo.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="cx-pricing-v3-card cx-pricing-v3-card-business">
              <div className="cx-pricing-v3-card-top">
                <div className="cx-pricing-v3-name-row">
                  <h2>{pv3.plans.business.name}</h2>
                  {pv3.popular && (
                    <span className="cx-pricing-v3-popular">{pv3.popular}</span>
                  )}
                </div>
                <p className="cx-pricing-v3-desc">{pv3.plans.business.desc}</p>
                {renderPaidPrice("team")}
                <Link
                  to="/trial?from=pricing"
                  className="cx-pricing-v3-cta cx-pricing-v3-cta-business"
                  onClick={(e) => onPlanCta(e, "team")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.everythingSolo}</h3>
                <ul>
                  {pv3.plans.business.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="cx-pricing-v3-card">
              <div className="cx-pricing-v3-card-top">
                <h2>{pv3.plans.scale.name}</h2>
                <p className="cx-pricing-v3-desc">{pv3.plans.scale.desc}</p>
                {renderPaidPrice("growth")}
                <Link
                  to="/trial?from=pricing"
                  className="cx-pricing-v3-cta"
                  onClick={(e) => onPlanCta(e, "growth")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.everythingBusiness}</h3>
                <ul>
                  {pv3.plans.scale.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

        </section>
      </main>
    </div>
  );
}