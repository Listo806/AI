// Localized document titles + meta descriptions for public pages, keyed by the
// locale-stripped path (so "/", "/es", "/pt" all resolve to the same entry) and
// language. LocaleLayout applies these on every navigation. Anything not mapped
// falls back to DEFAULT_SEO, so a page never ends up with a raw/blank title.
//
// Kept in this single module (not the big translation JSON) on purpose: it is
// SEO copy, not UI strings, and isolating it avoids churn in the shared locale
// files. English is the source of truth; es/pt mirror it.

const BRAND = "Cortexa";

export const DEFAULT_SEO = {
  en: {
    title: "Cortexa — AI CRM for real estate teams",
    description:
      "Cortexa is the AI CRM that turns conversations into booked appointments for real estate teams. Capture, qualify, and follow up automatically.",
  },
  es: {
    title: "Cortexa — CRM con IA para equipos inmobiliarios",
    description:
      "Cortexa es el CRM con IA que convierte conversaciones en citas agendadas para equipos inmobiliarios. Capta, califica y da seguimiento automáticamente.",
  },
  pt: {
    title: "Cortexa — CRM com IA para equipes imobiliárias",
    description:
      "A Cortexa é o CRM com IA que transforma conversas em agendamentos para equipes imobiliárias. Capte, qualifique e faça o follow-up automaticamente.",
  },
};

// path (locale-stripped) -> { en|es|pt: { title, description } }
export const SEO = {
  "/": DEFAULT_SEO,
  "/features": {
    en: {
      title: `Features — ${BRAND}`,
      description:
        "Explore Cortexa's AI features: automatic lead qualification, WhatsApp follow-up, appointment booking, and a pipeline that runs itself.",
    },
    es: {
      title: `Funciones — ${BRAND}`,
      description:
        "Descubre las funciones de IA de Cortexa: calificación automática de leads, seguimiento por WhatsApp, agendamiento de citas y un pipeline que se gestiona solo.",
    },
    pt: {
      title: `Recursos — ${BRAND}`,
      description:
        "Conheça os recursos de IA da Cortexa: qualificação automática de leads, follow-up no WhatsApp, agendamento de reuniões e um funil que roda sozinho.",
    },
  },
  "/pricing": {
    en: {
      title: `Pricing — ${BRAND}`,
      description:
        "Simple pricing for Cortexa. Start your AI real estate CRM today and only pay for what your team needs.",
    },
    es: {
      title: `Precios — ${BRAND}`,
      description:
        "Precios simples de Cortexa. Empieza hoy tu CRM inmobiliario con IA y paga solo por lo que tu equipo necesita.",
    },
    pt: {
      title: `Preços — ${BRAND}`,
      description:
        "Preços simples da Cortexa. Comece hoje seu CRM imobiliário com IA e pague apenas pelo que sua equipe precisa.",
    },
  },
  "/integrations": {
    en: {
      title: `Integrations — ${BRAND}`,
      description:
        "Connect Cortexa to WhatsApp, Instagram, your website, and the tools your real estate team already uses.",
    },
    es: {
      title: `Integraciones — ${BRAND}`,
      description:
        "Conecta Cortexa con WhatsApp, Instagram, tu sitio web y las herramientas que tu equipo inmobiliario ya usa.",
    },
    pt: {
      title: `Integrações — ${BRAND}`,
      description:
        "Conecte a Cortexa ao WhatsApp, Instagram, seu site e às ferramentas que sua equipe imobiliária já usa.",
    },
  },
  "/about": {
    en: {
      title: `About — ${BRAND}`,
      description:
        "Learn about Cortexa and our mission to give every real estate team an AI agent that never misses a lead.",
    },
    es: {
      title: `Acerca de — ${BRAND}`,
      description:
        "Conoce Cortexa y nuestra misión de darle a cada equipo inmobiliario un agente de IA que nunca pierde un lead.",
    },
    pt: {
      title: `Sobre — ${BRAND}`,
      description:
        "Conheça a Cortexa e nossa missão de dar a cada equipe imobiliária um agente de IA que nunca perde um lead.",
    },
  },
  "/contact": {
    en: {
      title: `Contact — ${BRAND}`,
      description: "Get in touch with the Cortexa team. We're here to help.",
    },
    es: {
      title: `Contacto — ${BRAND}`,
      description: "Ponte en contacto con el equipo de Cortexa. Estamos para ayudarte.",
    },
    pt: {
      title: `Contato — ${BRAND}`,
      description: "Fale com a equipe da Cortexa. Estamos aqui para ajudar.",
    },
  },
  "/help": {
    en: {
      title: `Help Center — ${BRAND}`,
      description: "Guides and answers to get the most out of Cortexa.",
    },
    es: {
      title: `Centro de ayuda — ${BRAND}`,
      description: "Guías y respuestas para aprovechar Cortexa al máximo.",
    },
    pt: {
      title: `Central de ajuda — ${BRAND}`,
      description: "Guias e respostas para aproveitar a Cortexa ao máximo.",
    },
  },
  "/support": {
    en: {
      title: `Support — ${BRAND}`,
      description: "Reach Cortexa support and find answers fast.",
    },
    es: {
      title: `Soporte — ${BRAND}`,
      description: "Contacta al soporte de Cortexa y encuentra respuestas rápido.",
    },
    pt: {
      title: `Suporte — ${BRAND}`,
      description: "Fale com o suporte da Cortexa e encontre respostas rápido.",
    },
  },
  "/setup-guide": {
    en: {
      title: `Setup Guide — ${BRAND}`,
      description: "Set up your Cortexa AI agent step by step and go live in minutes.",
    },
    es: {
      title: `Guía de configuración — ${BRAND}`,
      description:
        "Configura tu agente de IA de Cortexa paso a paso y ponlo en marcha en minutos.",
    },
    pt: {
      title: `Guia de configuração — ${BRAND}`,
      description:
        "Configure seu agente de IA da Cortexa passo a passo e coloque no ar em minutos.",
    },
  },
  "/sign-in": {
    en: { title: `Sign In — ${BRAND}`, description: "Sign in to your Cortexa account." },
    es: {
      title: `Iniciar sesión — ${BRAND}`,
      description: "Inicia sesión en tu cuenta de Cortexa.",
    },
    pt: {
      title: `Entrar — ${BRAND}`,
      description: "Entre na sua conta Cortexa.",
    },
  },
  "/sign-up": {
    en: {
      title: `Start Free Trial — ${BRAND}`,
      description: "Create your Cortexa account and put your AI real estate agent to work.",
    },
    es: {
      title: `Prueba gratis — ${BRAND}`,
      description:
        "Crea tu cuenta de Cortexa y pon a trabajar a tu agente inmobiliario de IA.",
    },
    pt: {
      title: `Teste grátis — ${BRAND}`,
      description:
        "Crie sua conta Cortexa e coloque seu agente imobiliário de IA para trabalhar.",
    },
  },
  "/trial": {
    en: {
      title: `Start Free Trial — ${BRAND}`,
      description: "Start your Cortexa free trial today.",
    },
    es: {
      title: `Prueba gratis — ${BRAND}`,
      description: "Comienza hoy tu prueba gratuita de Cortexa.",
    },
    pt: {
      title: `Teste grátis — ${BRAND}`,
      description: "Comece hoje seu teste grátis da Cortexa.",
    },
  },
  "/editorial/the-end-of-legacy-crm": {
    en: {
      title: "The End of Legacy CRM — Cortexa",
      description:
        "Why legacy CRMs are failing real estate teams, and how an AI-first CRM changes the game.",
    },
    es: {
      title: "El fin del CRM tradicional — Cortexa",
      description:
        "Por qué los CRM tradicionales están fallando a los equipos inmobiliarios y cómo un CRM con IA cambia las reglas del juego.",
    },
    pt: {
      title: "O fim do CRM tradicional — Cortexa",
      description:
        "Por que os CRMs tradicionais estão falhando com as equipes imobiliárias e como um CRM com IA muda o jogo.",
    },
  },
  "/editorial/business": {
    en: {
      title: "How AI Is Transforming Every Business — Cortexa",
      description:
        "How AI is reshaping the way businesses capture, qualify, and convert customers.",
    },
    es: {
      title: "Cómo la IA está transformando cada negocio — Cortexa",
      description:
        "Cómo la IA está transformando la forma en que los negocios captan, califican y convierten clientes.",
    },
    pt: {
      title: "Como a IA está transformando todo negócio — Cortexa",
      description:
        "Como a IA está transformando a forma como as empresas captam, qualificam e convertem clientes.",
    },
  },
  "/privacy-policy": {
    en: { title: `Privacy Policy — ${BRAND}`, description: "Cortexa privacy policy." },
    es: {
      title: `Política de privacidad — ${BRAND}`,
      description: "Política de privacidad de Cortexa.",
    },
    pt: {
      title: `Política de Privacidade — ${BRAND}`,
      description: "Política de privacidade da Cortexa.",
    },
  },
  "/terms": {
    en: { title: `Terms of Service — ${BRAND}`, description: "Cortexa terms of service." },
    es: {
      title: `Términos del servicio — ${BRAND}`,
      description: "Términos del servicio de Cortexa.",
    },
    pt: {
      title: `Termos de Serviço — ${BRAND}`,
      description: "Termos de serviço da Cortexa.",
    },
  },
  "/refund-policy": {
    en: { title: `Refund Policy — ${BRAND}`, description: "Cortexa refund policy." },
    es: {
      title: `Política de reembolso — ${BRAND}`,
      description: "Política de reembolso de Cortexa.",
    },
    pt: {
      title: `Política de Reembolso — ${BRAND}`,
      description: "Política de reembolso da Cortexa.",
    },
  },
  "/cancellation": {
    en: {
      title: `Cancellation Policy — ${BRAND}`,
      description: "Cortexa cancellation policy.",
    },
    es: {
      title: `Política de cancelación — ${BRAND}`,
      description: "Política de cancelación de Cortexa.",
    },
    pt: {
      title: `Política de Cancelamento — ${BRAND}`,
      description: "Política de cancelamento da Cortexa.",
    },
  },
};

// Resolve the best SEO entry for a locale-stripped path + language, always
// returning a complete { title, description } (never blank).
export function resolveSeo(strippedPath, code) {
  const lang = code === "es" || code === "pt" ? code : "en";
  // Normalize a trailing editorial language suffix (/es, /pt) to its base path
  // so /editorial/.../es reuses the same entry.
  let key = strippedPath || "/";
  key = key.replace(/\/(es|pt)$/, "");
  if (key.length > 1 && key.endsWith("/")) key = key.slice(0, -1);
  const entry = SEO[key] || DEFAULT_SEO;
  return entry[lang] || entry.en || DEFAULT_SEO.en;
}
