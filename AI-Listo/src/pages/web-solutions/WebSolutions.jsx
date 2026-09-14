import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  Database,
  GitBranch,
  Globe2,
  MessageCircle,
  Monitor,
  Phone,
  Settings,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import { useAuth } from "../../context/AuthContext";
import "./WebSolutions.css";

const COPY = {
  en: {
    nav: {
      features: "Features",
      aiAssistant: "AI Assistant",
      aiWorkflows: "AI Workflows",
      pipeline: "Pipeline",
      analytics: "Analytics",
      pricing: "Pricing",
      costCalculator: "Cost Calculator",
      webSolutions: "Web Solutions",
      getStarted: "Get Started",
      dashboard: "Dashboard",
      login: "Log in",
    },
    hero: {
      eyebrow: "CORTEXA WEB SOLUTIONS",
      title1: "Connect your website to the systems",
      title2: "that move your business forward.",
      p1: "Your website is often where customer interest begins. Cortexa Web Solutions helps ensure those interactions continue directly into your AI agent, CRM, pipeline, appointments, checkout, quotes, viewings, demos, or support.",
      p2: "If your website does not have the right WhatsApp, phone, tracking, or AI connections, our team can review the existing experience and configure the missing entry points.",
    },
    connect: {
      title: "What we connect",
      p1: "A website works best when every visitor has a clear path into your AI-assisted conversion flow. We connect your website to the right channels, systems, and workflows so no opportunity is lost.",
      p2: "WhatsApp must enter the AI-assisted conversion flow rather than an unmanaged inbox. This ensures conversations are captured, qualified, and routed like every other lead.",
    },
    flow: {
      title: "A complete connection, not just another button.",
      desc: "From first click to final conversion, we make sure every touchpoint on your website is connected to the right system, with the right data, in the right order.",
    },
    plans: {
      title: "Service levels based on what your website needs.",
      desc: "Choose the right level of support for your goals. All services are one-time professional services, with a clear scope and deliverables.",
      oneTime: "one-time",
      request: "Request a Review",
      disclaimer: "Cortexa Web Solutions are optional one-time professional services and are separate from your Cortexa software subscription. Custom implementation is quoted based on your website and connection requirements. Third-party costs are billed separately.",
    },
    footer: {
      copyright: "© 2024 Cortexa. All rights reserved.",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
    },
    connections: [
      ["Website and landing pages", "Connect your main website and campaign landing pages."],
      ["Campaign and source tracking", "Track where enquiries come from across all channels."],
      ["WhatsApp and business phone", "Integrate WhatsApp and phone into your AI-assisted conversion flow."],
      ["Pipelines and workflows", "Route leads to the correct pipeline and automate next steps."],
      ["Cortexa AI Agent", "Route website enquiries directly to your AI agent."],
      ["Appointments, checkout and quotes", "Connect bookings, checkout, and quote requests to your CRM."],
      ["CRM lead capture", "Capture and create leads in your CRM automatically."],
      ["Human handoff", "Ensure a smooth handoff to your team when needed."],
    ],
    flowSteps: [
      "Website, advertisement, phone or WhatsApp",
      "Cortexa AI Agent",
      "Contact captured",
      "CRM record created",
      "Source recorded",
      "Correct pipeline",
      "Conversion or human handoff",
    ],
    planData: [
      ["connection-setup", "Connection Setup", 147, ["WhatsApp or phone CTA", "AI-agent connection", "Lead capture", "CRM routing", "Connection testing"]],
      ["website-optimization", "Website Optimization", 297, ["Website review", "Several UX and CTA improvements", "Entry-point integration", "Tracking and pipeline routing", "Complete funnel testing"]],
      ["full-transformation", "Full Transformation", 547, ["Substantial redesign", "New pages or sections", "Responsive optimization", "Complete AI/CRM integration", "Launch support"]],
    ],
  },

  es: {
    nav: {
      features: "Funciones",
      aiAssistant: "Asistente IA",
      aiWorkflows: "Flujos de IA",
      pipeline: "Pipeline",
      analytics: "Analítica",
      pricing: "Precios",
      costCalculator: "Calculadora de Costes",
      webSolutions: "Soluciones Web",
      getStarted: "Comenzar",
      dashboard: "Panel",
      login: "Iniciar sesión",
    },
    hero: {
      eyebrow: "SOLUCIONES WEB CORTEXA",
      title1: "Conecta tu sitio web con los sistemas",
      title2: "que impulsan tu negocio.",
      p1: "Tu sitio web suele ser el lugar donde comienza el interés del cliente. Cortexa Web Solutions ayuda a que esas interacciones continúen directamente hacia tu agente de IA, CRM, pipeline, citas, checkout, cotizaciones, visitas, demos o soporte.",
      p2: "Si tu sitio web no cuenta con las conexiones correctas de WhatsApp, teléfono, seguimiento o IA, nuestro equipo puede revisar la experiencia actual y configurar los puntos de entrada que faltan.",
    },
    connect: {
      title: "Lo que conectamos",
      p1: "Un sitio web funciona mejor cuando cada visitante tiene un camino claro hacia tu flujo de conversión asistido por IA. Conectamos tu sitio web con los canales, sistemas y flujos adecuados para que no se pierda ninguna oportunidad.",
      p2: "WhatsApp debe entrar en el flujo de conversión asistido por IA en lugar de funcionar como una bandeja sin gestionar. Así, las conversaciones se capturan, califican y enrutan como cualquier otro lead.",
    },
    flow: {
      title: "Una conexión completa, no solo otro botón.",
      desc: "Desde el primer clic hasta la conversión final, nos aseguramos de que cada punto de contacto de tu sitio web esté conectado al sistema correcto, con los datos correctos y en el orden correcto.",
    },
    plans: {
      title: "Niveles de servicio según lo que necesita tu sitio web.",
      desc: "Elige el nivel de soporte adecuado para tus objetivos. Todos los servicios son profesionales y de pago único, con alcance y entregables claros.",
      oneTime: "pago único",
      request: "Solicitar una revisión",
      disclaimer: "Cortexa Web Solutions son servicios profesionales opcionales de pago único y están separados de tu suscripción de software Cortexa. La implementación personalizada se cotiza según los requisitos de tu sitio web y sus conexiones. Los costes de terceros se facturan por separado.",
    },
    footer: {
      copyright: "© 2024 Cortexa. Todos los derechos reservados.",
      privacy: "Privacidad",
      terms: "Términos",
      contact: "Contacto",
    },
    connections: [
      ["Sitios web y landing pages", "Conecta tu sitio web principal y las landing pages de tus campañas."],
      ["Seguimiento de campañas y fuentes", "Identifica de dónde provienen las consultas en todos tus canales."],
      ["WhatsApp y teléfono empresarial", "Integra WhatsApp y teléfono en tu flujo de conversión asistido por IA."],
      ["Pipelines y flujos de trabajo", "Dirige los leads al pipeline correcto y automatiza los siguientes pasos."],
      ["Agente IA de Cortexa", "Dirige las consultas del sitio web directamente a tu agente de IA."],
      ["Citas, checkout y cotizaciones", "Conecta reservas, checkout y solicitudes de cotización con tu CRM."],
      ["Captura de leads en CRM", "Captura y crea leads automáticamente en tu CRM."],
      ["Transferencia a una persona", "Garantiza una transferencia fluida a tu equipo cuando sea necesario."],
    ],
    flowSteps: [
      "Sitio web, anuncio, teléfono o WhatsApp",
      "Agente IA de Cortexa",
      "Contacto capturado",
      "Registro CRM creado",
      "Fuente registrada",
      "Pipeline correcto",
      "Conversión o transferencia humana",
    ],
    planData: [
      ["connection-setup", "Configuración de Conexión", 147, ["CTA de WhatsApp o teléfono", "Conexión con agente IA", "Captura de leads", "Enrutamiento CRM", "Pruebas de conexión"]],
      ["website-optimization", "Optimización del Sitio Web", 297, ["Revisión del sitio web", "Mejoras de UX y CTA", "Integración de puntos de entrada", "Seguimiento y enrutamiento del pipeline", "Prueba completa del embudo"]],
      ["full-transformation", "Transformación Completa", 547, ["Rediseño sustancial", "Nuevas páginas o secciones", "Optimización responsive", "Integración completa IA/CRM", "Soporte de lanzamiento"]],
    ],
  },

  pt: {
    nav: {
      features: "Recursos",
      aiAssistant: "Assistente IA",
      aiWorkflows: "Fluxos de IA",
      pipeline: "Pipeline",
      analytics: "Análises",
      pricing: "Preços",
      costCalculator: "Calculadora de Custos",
      webSolutions: "Soluções Web",
      getStarted: "Começar",
      dashboard: "Painel",
      login: "Entrar",
    },
    hero: {
      eyebrow: "SOLUÇÕES WEB CORTEXA",
      title1: "Conecte seu site aos sistemas",
      title2: "que impulsionam o seu negócio.",
      p1: "Seu site costuma ser onde o interesse do cliente começa. O Cortexa Web Solutions ajuda a garantir que essas interações continuem diretamente para seu agente de IA, CRM, pipeline, agendamentos, checkout, orçamentos, visitas, demos ou suporte.",
      p2: "Se o seu site não tiver as conexões corretas de WhatsApp, telefone, rastreamento ou IA, nossa equipe pode revisar a experiência atual e configurar os pontos de entrada que estão faltando.",
    },
    connect: {
      title: "O que conectamos",
      p1: "Um site funciona melhor quando cada visitante tem um caminho claro para o seu fluxo de conversão assistido por IA. Conectamos seu site aos canais, sistemas e fluxos corretos para que nenhuma oportunidade seja perdida.",
      p2: "O WhatsApp deve entrar no fluxo de conversão assistido por IA, em vez de ficar em uma caixa de entrada sem gerenciamento. Assim, as conversas são capturadas, qualificadas e encaminhadas como qualquer outro lead.",
    },
    flow: {
      title: "Uma conexão completa, não apenas mais um botão.",
      desc: "Do primeiro clique à conversão final, garantimos que cada ponto de contato do seu site esteja conectado ao sistema certo, com os dados certos e na ordem certa.",
    },
    plans: {
      title: "Níveis de serviço de acordo com o que seu site precisa.",
      desc: "Escolha o nível de suporte ideal para seus objetivos. Todos os serviços são profissionais e de pagamento único, com escopo e entregas claramente definidos.",
      oneTime: "pagamento único",
      request: "Solicitar uma análise",
      disclaimer: "Cortexa Web Solutions são serviços profissionais opcionais de pagamento único e separados da sua assinatura do software Cortexa. A implementação personalizada é cotada de acordo com os requisitos do seu site e das conexões. Custos de terceiros são cobrados separadamente.",
    },
    footer: {
      copyright: "© 2024 Cortexa. Todos os direitos reservados.",
      privacy: "Privacidade",
      terms: "Termos",
      contact: "Contato",
    },
    connections: [
      ["Sites e landing pages", "Conecte seu site principal e as landing pages das campanhas."],
      ["Rastreamento de campanhas e fontes", "Acompanhe de onde vêm as consultas em todos os canais."],
      ["WhatsApp e telefone comercial", "Integre WhatsApp e telefone ao seu fluxo de conversão assistido por IA."],
      ["Pipelines e fluxos de trabalho", "Direcione leads para o pipeline correto e automatize os próximos passos."],
      ["Agente IA Cortexa", "Direcione consultas do site diretamente para seu agente de IA."],
      ["Agendamentos, checkout e orçamentos", "Conecte reservas, checkout e solicitações de orçamento ao seu CRM."],
      ["Captura de leads no CRM", "Capture e crie leads automaticamente no seu CRM."],
      ["Transferência humana", "Garanta uma transferência tranquila para sua equipe quando necessário."],
    ],
    flowSteps: [
      "Site, anúncio, telefone ou WhatsApp",
      "Agente IA Cortexa",
      "Contato capturado",
      "Registro no CRM criado",
      "Fonte registrada",
      "Pipeline correto",
      "Conversão ou transferência humana",
    ],
    planData: [
      ["connection-setup", "Configuração de Conexão", 147, ["CTA de WhatsApp ou telefone", "Conexão com agente IA", "Captura de leads", "Roteamento no CRM", "Teste da conexão"]],
      ["website-optimization", "Otimização do Site", 297, ["Revisão do site", "Melhorias de UX e CTA", "Integração dos pontos de entrada", "Rastreamento e roteamento do pipeline", "Teste completo do funil"]],
      ["full-transformation", "Transformação Completa", 547, ["Redesign substancial", "Novas páginas ou seções", "Otimização responsiva", "Integração completa IA/CRM", "Suporte ao lançamento"]],
    ],
  },
};

const CONNECTION_ICONS = [
  Monitor,
  BarChart3,
  MessageCircle,
  GitBranch,
  Bot,
  CalendarDays,
  Database,
  UsersRound,
];

const PLAN_ICONS = [Settings, BarChart3, Workflow];

export default function WebSolutions() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lang, setLang] = useState(
    () => localStorage.getItem("cortexa_lang") || "en",
  );
  const [langOpen, setLangOpen] = useState(false);

  const tr = COPY[lang] || COPY.en;

  const plans = tr.planData.map(([id, name, price, items], index) => ({
    id,
    name,
    price,
    items,
    icon: PLAN_ICONS[index],
  }));

  const connectionItems = tr.connections.map(([title, text], index) => ({
    title,
    text,
    icon: CONNECTION_ICONS[index],
  }));

  const flowSteps = tr.flowSteps;

  const changeLanguage = (nextLang) => {
    if (!COPY[nextLang]) return;

    setLang(nextLang);
    setLangOpen(false);

    // Keep the visitor on /web-solutions. The global locale switch hook
    // navigates to localized landing routes, so this page manages its own
    // language state instead.
    localStorage.setItem("cortexa_lang", nextLang);
    localStorage.setItem("cortexa_locale", nextLang);

    document.documentElement.lang =
      nextLang === "pt" ? "pt-BR" : nextLang;
  };

  useEffect(() => {
    const close = (event) => {
      if (!event.target.closest(".ws-language")) {
        setLangOpen(false);
      }
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const choosePlan = (plan) => {
    const params = new URLSearchParams({
      plan: plan.id,
      name: plan.name,
      price: String(plan.price),
    });

    navigate(`/web-solutions/checkout?${params.toString()}`);
  };

  return (
    <div className="ws-page">
      <header className="ws-header">
        <div className="ws-header-inner">
          <Link to="/" className="ws-brand" aria-label="Cortexa home">
            <img src={headlogoImg} alt="CORTEXA" />
          </Link>

          <nav className="ws-nav">
            <a href="/#features">{tr.nav.features}</a>
            <a href="/#ai-assistant">{tr.nav.aiAssistant}</a>
            <a href="/#automation">{tr.nav.aiWorkflows}</a>
            <a href="/#pipeline">{tr.nav.pipeline}</a>
            <a href="/#analytics">{tr.nav.analytics}</a>
            <a href="/pricing">{tr.nav.pricing}</a>
            <a href="/editorial/the-end-of-legacy-crm">{tr.nav.costCalculator}</a>
            <a className="active" href="/web-solutions">{tr.nav.webSolutions}</a>
            <a href="/trial?flow=free-access&plan=free">{tr.nav.getStarted}</a>
          </nav>

          <div className="ws-header-actions">
            <div className="ws-language">
              <button
                type="button"
                className="ws-language-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLangOpen((open) => !open);
                }}
                aria-expanded={langOpen}
                aria-label="Change language"
              >
                <Globe2 size={18} />
              </button>

              {langOpen && (
                <div className="ws-language-menu">
                  {["en", "es", "pt"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={lang === item ? "active" : ""}
                      onClick={() => changeLanguage(item)}
                    >
                      {item === "en"
                        ? "English"
                        : item === "es"
                          ? "Español"
                          : "Português"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a href={isAuthenticated ? "/dashboard/home" : "/sign-in"}>
              {isAuthenticated ? tr.nav.dashboard : tr.nav.login}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="ws-hero">
          <div className="ws-container">
            <span className="ws-eyebrow">{tr.hero.eyebrow}</span>
            <h1>
              {tr.hero.title1}
              <br />
              {tr.hero.title2}
            </h1>
            <p>
{tr.hero.p1}
            </p>
            <p>
{tr.hero.p2}
            </p>
          </div>
        </section>

        <section className="ws-connect-section">
          <div className="ws-container ws-connect-grid">
            <div className="ws-connect-copy">
              <h2>{tr.connect.title}</h2>
              <p>
{tr.connect.p1}
              </p>
              <p>
{tr.connect.p2}
              </p>
            </div>

            <div className="ws-connection-list">
              {connectionItems.map(({ icon: Icon, title, text }) => (
                <article key={title} className="ws-connection-item">
                  <div className="ws-connection-icon">
                    <Icon size={28} />
                  </div>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ws-flow-section">
          <div className="ws-container">
            <h2>{tr.flow.title}</h2>
            <p className="ws-flow-lead">
{tr.flow.desc}
            </p>

            <div className="ws-flow">
              {flowSteps.map((step, index) => (
                <React.Fragment key={step}>
                  <div className="ws-flow-step">{step}</div>
                  {index < flowSteps.length - 1 && (
                    <ArrowRight className="ws-flow-arrow" size={22} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="ws-plans-section">
          <div className="ws-container">
            <h2>{tr.plans.title}</h2>
            <p className="ws-plans-lead">
{tr.plans.desc}
            </p>

            <div className="ws-plans-grid">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <article className="ws-plan-card" key={plan.id}>
                    <div className="ws-plan-top">
                      <div className="ws-plan-icon">
                        <Icon size={30} />
                      </div>
                      <div>
                        <h3>{plan.name}</h3>
                        <div className="ws-plan-price">
                          <strong>${plan.price}</strong>
                          <span>{tr.plans.oneTime}</span>
                        </div>
                      </div>
                    </div>

                    <ul>
                      {plan.items.map((item) => (
                        <li key={item}>
                          <Check size={18} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button type="button" onClick={() => choosePlan(plan)}>
                      {tr.plans.request}
                    </button>
                  </article>
                );
              })}
            </div>

            <p className="ws-disclaimer">
{tr.plans.disclaimer}
            </p>
          </div>
        </section>
      </main>

      <footer className="ws-footer">
        <div className="ws-container ws-footer-inner">
          <Link to="/" className="ws-footer-brand">
            <img src={headlogoImg} alt="CORTEXA" />
          </Link>

          <nav>
            <a href="/#features">{tr.nav.features}</a>
            <a href="/#ai-assistant">{tr.nav.aiAssistant}</a>
            <a href="/#automation">{tr.nav.aiWorkflows}</a>
            <a href="/#pipeline">{tr.nav.pipeline}</a>
            <a href="/#analytics">{tr.nav.analytics}</a>
            <a href="/pricing">{tr.nav.pricing}</a>
            <a href="/editorial/the-end-of-legacy-crm">{tr.nav.costCalculator}</a>
            <a href="/web-solutions">{tr.nav.webSolutions}</a>
            <a href="/trial?flow=free-access&plan=free">{tr.nav.getStarted}</a>
          </nav>

          <div className="ws-footer-actions">
            <div className="ws-language ws-language-footer">
              <button
                type="button"
                className="ws-language-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLangOpen((open) => !open);
                }}
              >
                <Globe2 size={18} />
              </button>

              {langOpen && (
                <div className="ws-language-menu ws-language-menu-footer">
                  {["en", "es", "pt"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={lang === item ? "active" : ""}
                      onClick={() => changeLanguage(item)}
                    >
                      {item === "en"
                        ? "English"
                        : item === "es"
                          ? "Español"
                          : "Português"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              className="ws-footer-dashboard"
              href={isAuthenticated ? "/dashboard/home" : "/sign-in"}
            >
              {isAuthenticated ? tr.nav.dashboard : tr.nav.login}
            </a>
          </div>
        </div>

        <div className="ws-container ws-footer-bottom">
          <span>{tr.footer.copyright}</span>
          <div>
            <a href="/privacy">{tr.footer.privacy}</a>
            <a href="/terms">{tr.footer.terms}</a>
            <a href="mailto:support@cortexaaicrm.com">{tr.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}