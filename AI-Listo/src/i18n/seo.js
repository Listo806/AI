// Page titles, meta descriptions and social-sharing text for every public page,
// keyed by the locale-stripped path ("/", "/es", "/pt" all resolve to "/") and
// language. The build writes these into each page's HTML (scripts/build-seo.mjs)
// and src/seo/head.js keeps them in place while the customer navigates.
//
// The English text follows the client's approved Cortexa SEO document. Spanish
// and Portuguese are faithful translations of it, pending the client's review.
// The product name is always "Cortexa Agentic CRM". A page never describes
// Cortexa as a real-estate-only CRM: real estate is one workspace among several.
//
// Optional per-language fields: `ogTitle`, `ogDescription`, `twitterTitle` and
// `twitterDescription`, for pages whose social preview differs from the title.
// Anything not mapped falls back to DEFAULT_SEO, which is only ever used on
// pages that are not in search results.

const BRAND = "Cortexa";

export const DEFAULT_SEO = {
  en: {
    title: "Cortexa Agentic CRM",
    description:
      "Connect leads, WhatsApp conversations, AI agents, workflows, pipelines, appointments, analytics, and specialized business workspaces in one intelligent CRM.",
  },
  es: {
    title: "Cortexa Agentic CRM",
    description:
      "Conecta leads, conversaciones de WhatsApp, agentes de IA, flujos de trabajo, pipelines, citas, analíticas y espacios de trabajo especializados para tu negocio en un solo CRM inteligente.",
  },
  pt: {
    title: "Cortexa Agentic CRM",
    description:
      "Conecte leads, conversas no WhatsApp, agentes de IA, fluxos de trabalho, pipelines, agendamentos, análises e espaços de trabalho especializados para o seu negócio em um único CRM inteligente.",
  },
};

// path (locale-stripped) -> { en|es|pt: { title, description, og*?, twitter*? } }
export const SEO = {
  "/": {
    en: {
      title: "Cortexa Agentic CRM | AI Agents, Workflows & Automation",
      description:
        "Manage leads, WhatsApp conversations, pipelines, appointments, analytics, AI agents, and specialized workspaces in one connected Agentic CRM.",
      ogTitle: "Cortexa Agentic CRM",
      ogDescription:
        "Connect leads, WhatsApp conversations, AI agents, workflows, pipelines, appointments, analytics, and specialized business workspaces in one intelligent CRM.",
      twitterTitle: "Cortexa Agentic CRM",
      twitterDescription:
        "One connected CRM for leads, AI agents, WhatsApp, workflows, pipelines, appointments, analytics, and business workspaces.",
    },
    es: {
      title: "Cortexa Agentic CRM | Agentes de IA, flujos de trabajo y automatización",
      description:
        "Gestiona leads, conversaciones de WhatsApp, pipelines, citas, analíticas, agentes de IA y espacios de trabajo especializados en un solo Agentic CRM conectado.",
      ogTitle: "Cortexa Agentic CRM",
      ogDescription:
        "Conecta leads, conversaciones de WhatsApp, agentes de IA, flujos de trabajo, pipelines, citas, analíticas y espacios de trabajo especializados para tu negocio en un solo CRM inteligente.",
      twitterTitle: "Cortexa Agentic CRM",
      twitterDescription:
        "Un CRM conectado para leads, agentes de IA, WhatsApp, flujos de trabajo, pipelines, citas, analíticas y espacios de trabajo para tu negocio.",
    },
    pt: {
      title: "Cortexa Agentic CRM | Agentes de IA, fluxos de trabalho e automação",
      description:
        "Gerencie leads, conversas no WhatsApp, pipelines, agendamentos, análises, agentes de IA e espaços de trabalho especializados em um único Agentic CRM conectado.",
      ogTitle: "Cortexa Agentic CRM",
      ogDescription:
        "Conecte leads, conversas no WhatsApp, agentes de IA, fluxos de trabalho, pipelines, agendamentos, análises e espaços de trabalho especializados para o seu negócio em um único CRM inteligente.",
      twitterTitle: "Cortexa Agentic CRM",
      twitterDescription:
        "Um CRM conectado para leads, agentes de IA, WhatsApp, fluxos de trabalho, pipelines, agendamentos, análises e espaços de trabalho para o seu negócio.",
    },
  },

  "/features": {
    en: {
      title: `Features | ${BRAND} Agentic CRM`,
      description:
        "Explore Cortexa Agentic CRM features: AI lead qualification, WhatsApp follow-up, appointment booking, workflows, pipelines, analytics, and specialized workspaces.",
    },
    es: {
      title: `Funciones | ${BRAND} Agentic CRM`,
      description:
        "Descubre las funciones de Cortexa Agentic CRM: calificación de leads con IA, seguimiento por WhatsApp, agendamiento de citas, flujos de trabajo, pipelines, analíticas y espacios de trabajo especializados.",
    },
    pt: {
      title: `Recursos | ${BRAND} Agentic CRM`,
      description:
        "Conheça os recursos do Cortexa Agentic CRM: qualificação de leads com IA, follow-up no WhatsApp, agendamentos, fluxos de trabalho, pipelines, análises e espaços de trabalho especializados.",
    },
  },

  "/pricing": {
    en: {
      title: `Pricing: Solo, Business & Scale Plans | ${BRAND}`,
      description:
        "Compare the Solo, Business, and Scale plans of Cortexa Agentic CRM, with a one-time activation, a 14-day trial, and monthly or annual billing.",
    },
    es: {
      title: `Precios: planes Solo, Business y Scale | ${BRAND}`,
      description:
        "Compara los planes Solo, Business y Scale de Cortexa Agentic CRM, con una activación única, una prueba de 14 días y facturación mensual o anual.",
    },
    pt: {
      title: `Preços: planos Solo, Business e Scale | ${BRAND}`,
      description:
        "Compare os planos Solo, Business e Scale do Cortexa Agentic CRM, com uma ativação única, um teste de 14 dias e cobrança mensal ou anual.",
    },
  },

  "/integrations": {
    en: {
      title: `Integrations | ${BRAND} Agentic CRM`,
      description:
        "Connect Cortexa Agentic CRM with WhatsApp, Instagram, your website, and the business tools your team already uses.",
    },
    es: {
      title: `Integraciones | ${BRAND} Agentic CRM`,
      description:
        "Conecta Cortexa Agentic CRM con WhatsApp, Instagram, tu sitio web y las herramientas que tu equipo ya usa.",
    },
    pt: {
      title: `Integrações | ${BRAND} Agentic CRM`,
      description:
        "Conecte o Cortexa Agentic CRM ao WhatsApp, Instagram, seu site e às ferramentas que sua equipe já usa.",
    },
  },

  "/about": {
    en: {
      title: `About ${BRAND} | Agentic CRM & Software Development`,
      description:
        "Learn about Cortexa, the company behind Cortexa Agentic CRM and its web and software development and systems integration services.",
    },
    es: {
      title: `Acerca de ${BRAND} | Agentic CRM y desarrollo de software`,
      description:
        "Conoce Cortexa, la empresa detrás de Cortexa Agentic CRM y de sus servicios de desarrollo web y de software e integración de sistemas.",
    },
    pt: {
      title: `Sobre a ${BRAND} | Agentic CRM e desenvolvimento de software`,
      description:
        "Conheça a Cortexa, a empresa por trás do Cortexa Agentic CRM e dos seus serviços de desenvolvimento web e de software e integração de sistemas.",
    },
  },

  "/contact": {
    en: {
      title: `Contact | ${BRAND}`,
      description:
        "Contact the Cortexa team about Cortexa Agentic CRM, web and software development, or systems integration.",
    },
    es: {
      title: `Contacto | ${BRAND}`,
      description:
        "Contacta al equipo de Cortexa sobre Cortexa Agentic CRM, desarrollo web y de software o integración de sistemas.",
    },
    pt: {
      title: `Contato | ${BRAND}`,
      description:
        "Fale com a equipe da Cortexa sobre o Cortexa Agentic CRM, desenvolvimento web e de software ou integração de sistemas.",
    },
  },

  "/help": {
    en: {
      title: `Help Center | ${BRAND} Agentic CRM`,
      description: "Guides and answers to get the most out of Cortexa Agentic CRM.",
    },
    es: {
      title: `Centro de ayuda | ${BRAND} Agentic CRM`,
      description: "Guías y respuestas para aprovechar Cortexa Agentic CRM al máximo.",
    },
    pt: {
      title: `Central de ajuda | ${BRAND} Agentic CRM`,
      description: "Guias e respostas para aproveitar o Cortexa Agentic CRM ao máximo.",
    },
  },

  "/support": {
    en: {
      title: `Support | ${BRAND} Agentic CRM`,
      description: "Reach Cortexa support and find answers about your Cortexa Agentic CRM account.",
    },
    es: {
      title: `Soporte | ${BRAND} Agentic CRM`,
      description:
        "Contacta al soporte de Cortexa y encuentra respuestas sobre tu cuenta de Cortexa Agentic CRM.",
    },
    pt: {
      title: `Suporte | ${BRAND} Agentic CRM`,
      description:
        "Fale com o suporte da Cortexa e encontre respostas sobre a sua conta do Cortexa Agentic CRM.",
    },
  },

  "/setup-guide": {
    en: {
      title: `Setup Guide | ${BRAND} Agentic CRM`,
      description:
        "Set up your Cortexa AI agent step by step and connect it to your leads, WhatsApp, and pipeline.",
    },
    es: {
      title: `Guía de configuración | ${BRAND} Agentic CRM`,
      description:
        "Configura tu agente de IA de Cortexa paso a paso y conéctalo con tus leads, WhatsApp y pipeline.",
    },
    pt: {
      title: `Guia de configuração | ${BRAND} Agentic CRM`,
      description:
        "Configure seu agente de IA da Cortexa passo a passo e conecte-o aos seus leads, WhatsApp e pipeline.",
    },
  },

  "/sign-in": {
    en: { title: `Sign In | ${BRAND} Agentic CRM`, description: "Sign in to your Cortexa Agentic CRM account." },
    es: { title: `Iniciar sesión | ${BRAND} Agentic CRM`, description: "Inicia sesión en tu cuenta de Cortexa Agentic CRM." },
    pt: { title: `Entrar | ${BRAND} Agentic CRM`, description: "Entre na sua conta do Cortexa Agentic CRM." },
  },

  "/sign-up": {
    en: {
      title: `Create Your Account | ${BRAND} Agentic CRM`,
      description:
        "Create your Cortexa account and put AI agents, WhatsApp conversations, pipelines, and specialized workspaces to work for your business.",
    },
    es: {
      title: `Crea tu cuenta | ${BRAND} Agentic CRM`,
      description:
        "Crea tu cuenta de Cortexa y pon a trabajar para tu negocio agentes de IA, conversaciones de WhatsApp, pipelines y espacios de trabajo especializados.",
    },
    pt: {
      title: `Crie sua conta | ${BRAND} Agentic CRM`,
      description:
        "Crie sua conta Cortexa e coloque agentes de IA, conversas no WhatsApp, pipelines e espaços de trabalho especializados para trabalhar pelo seu negócio.",
    },
  },

  "/trial": {
    en: {
      title: `Get Started | ${BRAND} Agentic CRM`,
      description: "Create your Cortexa Agentic CRM account and choose the plan that fits your business.",
    },
    es: {
      title: `Comenzar | ${BRAND} Agentic CRM`,
      description: "Crea tu cuenta de Cortexa Agentic CRM y elige el plan que se adapta a tu negocio.",
    },
    pt: {
      title: `Começar | ${BRAND} Agentic CRM`,
      description: "Crie sua conta do Cortexa Agentic CRM e escolha o plano ideal para o seu negócio.",
    },
  },

  "/editorial/the-end-of-legacy-crm": {
    en: {
      title: `The End of Legacy CRM? | ${BRAND}`,
      description:
        "Why legacy CRMs hold growing businesses back, and how an agentic, AI-first CRM changes the way teams capture, follow up with, and convert leads.",
    },
    es: {
      title: `¿El fin del CRM tradicional? | ${BRAND}`,
      description:
        "Por qué los CRM tradicionales frenan a los negocios en crecimiento y cómo un CRM agéntico con IA cambia la forma en que los equipos captan, dan seguimiento y convierten leads.",
    },
    pt: {
      title: `O fim do CRM tradicional? | ${BRAND}`,
      description:
        "Por que os CRMs tradicionais travam empresas em crescimento e como um CRM agêntico com IA muda a forma como as equipes captam, acompanham e convertem leads.",
    },
  },

  "/editorial/business": {
    en: {
      title: `How AI Is Transforming Every Business | ${BRAND}`,
      description:
        "How AI is reshaping the way businesses capture, qualify, and convert customers.",
    },
    es: {
      title: `Cómo la IA está transformando cada negocio | ${BRAND}`,
      description:
        "Cómo la IA está transformando la forma en que los negocios captan, califican y convierten clientes.",
    },
    pt: {
      title: `Como a IA está transformando todo negócio | ${BRAND}`,
      description:
        "Como a IA está transformando a forma como as empresas captam, qualificam e convertem clientes.",
    },
  },

  // English only until the client approves Spanish and Portuguese text.
  "/web-solutions": {
    en: {
      title: "Web & Software Development | Systems Integration | Cortexa",
      description:
        "Cortexa designs, develops, modernizes, and connects websites, custom software, CRM, AI agents, APIs, payments, automation, and business systems.",
    },
  },

  "/web-solutions/free-review": {
    en: {
      title: `Free Professional Website & Technology Review | ${BRAND}`,
      description:
        "Send your website or tell us what you want to build. Cortexa reviews your experience, technology, missing functionality, integrations, and conversion opportunities for free.",
    },
  },

  "/web-solutions/checkout": {
    en: { title: `Checkout | ${BRAND} Web & Software Development`, description: "Complete your Cortexa development services payment." },
  },

  // The E-Commerce Subscription CRM is a separate product from the regular
  // E-Commerce Workspace. Held out of search until the client launches it.
  "/e-commerce": {
    en: {
      title: "E-Commerce Subscription CRM & Affiliate Platform | Cortexa",
      description:
        "Manage subscriptions, recurring billing, customers, affiliates, orders, fulfillment, integrations, recovery workflows, and analytics in one e-commerce CRM.",
    },
  },
  "/e-commerce/pricing": {
    en: {
      title: `E-Commerce CRM Pricing | ${BRAND}`,
      description: "Pricing for the Cortexa E-Commerce Subscription CRM and affiliate platform.",
    },
  },
  "/e-commerce/terms": {
    en: {
      title: `E-Commerce CRM Terms of Service | ${BRAND}`,
      description: "Terms of service for the Cortexa E-Commerce Subscription CRM and affiliate platform.",
    },
  },
  "/e-commerce/login": {
    en: { title: `Sign In | ${BRAND} E-Commerce CRM`, description: "Sign in to the Cortexa E-Commerce Subscription CRM." },
  },
  "/e-commerce/signup": {
    en: { title: `Get Started | ${BRAND} E-Commerce CRM`, description: "Create your Cortexa E-Commerce Subscription CRM account." },
  },
  "/e-commerce/checkout": {
    en: { title: `Checkout | ${BRAND} E-Commerce CRM`, description: "Complete your Cortexa E-Commerce Subscription CRM subscription." },
  },

  // Approved metadata for pages the SEO document plans but that do not exist
  // yet. They are not published anywhere until the pages are built and added
  // to src/seo/site.js.
  "/ai-sales-agent": {
    en: {
      title: "AI Sales Agent for Lead Follow-Up & Appointments | Cortexa",
      description:
        "Use an AI sales agent to respond to leads, qualify prospects, automate follow-up, book appointments, update contacts, and move deals through your CRM.",
    },
  },
  "/whatsapp-ai-agent": {
    en: {
      title: "WhatsApp AI Agent & CRM Automation | Cortexa",
      description:
        "Automate WhatsApp lead response, qualification, follow-up, appointment booking, contact updates, and pipeline activity with Cortexa Agentic CRM.",
    },
  },
  "/real-estate-ai-agent": {
    en: {
      title: "Real Estate Agentic CRM & AI Lead Follow-Up | Cortexa",
      description:
        "Manage property leads, WhatsApp conversations, follow-up, appointments, contacts, pipelines, and agent activity with Cortexa Real Estate CRM.",
    },
  },

  "/privacy-policy": {
    en: {
      title: `Privacy Policy | ${BRAND}`,
      description: "How Cortexa collects, uses, and protects personal data across Cortexa Agentic CRM and its services.",
    },
    es: {
      title: `Política de privacidad | ${BRAND}`,
      description: "Cómo Cortexa recopila, usa y protege los datos personales en Cortexa Agentic CRM y sus servicios.",
    },
    pt: {
      title: `Política de Privacidade | ${BRAND}`,
      description: "Como a Cortexa coleta, usa e protege dados pessoais no Cortexa Agentic CRM e em seus serviços.",
    },
  },

  "/terms": {
    en: {
      title: `Terms of Service | ${BRAND}`,
      description: "The terms that govern the use of Cortexa Agentic CRM and Cortexa services.",
    },
    es: {
      title: `Términos del servicio | ${BRAND}`,
      description: "Los términos que rigen el uso de Cortexa Agentic CRM y de los servicios de Cortexa.",
    },
    pt: {
      title: `Termos de Serviço | ${BRAND}`,
      description: "Os termos que regem o uso do Cortexa Agentic CRM e dos serviços da Cortexa.",
    },
  },

  "/refund-policy": {
    en: {
      title: `Refund Policy | ${BRAND}`,
      description: "How refunds work for Cortexa Agentic CRM plans and Cortexa services.",
    },
    es: {
      title: `Política de reembolso | ${BRAND}`,
      description: "Cómo funcionan los reembolsos de los planes de Cortexa Agentic CRM y de los servicios de Cortexa.",
    },
    pt: {
      title: `Política de Reembolso | ${BRAND}`,
      description: "Como funcionam os reembolsos dos planos do Cortexa Agentic CRM e dos serviços da Cortexa.",
    },
  },

  "/cancellation": {
    en: {
      title: `Cancellation Policy | ${BRAND}`,
      description: "How to cancel a Cortexa Agentic CRM subscription and what happens after cancellation.",
    },
    es: {
      title: `Política de cancelación | ${BRAND}`,
      description: "Cómo cancelar una suscripción de Cortexa Agentic CRM y qué ocurre después de la cancelación.",
    },
    pt: {
      title: `Política de Cancelamento | ${BRAND}`,
      description: "Como cancelar uma assinatura do Cortexa Agentic CRM e o que acontece após o cancelamento.",
    },
  },
};

// Resolve the best SEO entry for a locale-stripped path + language, always
// returning a complete set of fields (never blank). The social fields default
// to the page's own title and description.
export function resolveSeo(strippedPath, code) {
  const lang = code === "es" || code === "pt" ? code : "en";

  // Normalize a trailing editorial language suffix (/es, /pt) to its base path
  // so /editorial/.../es reuses the same entry.
  let key = strippedPath || "/";
  key = key.replace(/\/(es|pt)$/, "");

  if (key.length > 1 && key.endsWith("/")) {
    key = key.slice(0, -1);
  }

  const entry = SEO[key] || DEFAULT_SEO;
  const seo = entry[lang] || entry.en || DEFAULT_SEO.en;
  return {
    title: seo.title,
    description: seo.description,
    ogTitle: seo.ogTitle || seo.title,
    ogDescription: seo.ogDescription || seo.description,
    twitterTitle: seo.twitterTitle || seo.ogTitle || seo.title,
    twitterDescription: seo.twitterDescription || seo.ogDescription || seo.description,
  };
}
