import { useEffect, useState } from "react";
import "./Common.css";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { Menu, X } from "lucide-react";
import headlogo from "../../assets/cortexa/pheadlogo.png";
import headlogoM from "../../assets/cortexa/headlogotran.png";
import footlogo from "../../assets/cortexa/p-flogo.png";

import messImg from "../../assets/cortexa/mess.png";
import saleImg from "../../assets/cortexa/sale.png";
import operImg from "../../assets/cortexa/oper.png";
import aiImg from "../../assets/cortexa/ai.png";
import homeImg from "../../assets/cortexa/home.png";
import autoImg from "../../assets/cortexa/auto.png";

import icon1Img from "../../assets/cortexa/icon1.png";
import icon2Img from "../../assets/cortexa/icon2.png";
import icon3Img from "../../assets/cortexa/icon3.png";
import icon4Img from "../../assets/cortexa/icon4.png";
import userImg from "../../assets/cortexa/user.png";

import social1 from "../../assets/cortexa/social1.png";
import social2 from "../../assets/cortexa/social2.png";
import social3 from "../../assets/cortexa/social3.png";
import social4 from "../../assets/cortexa/social4.png";
import { Check, Users } from "lucide-react";

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
    hero: {
      title: "The smarter way to run your real estate business.",
      desc: "One platform. Everything you need to capture, engage, and close more deals. Built for modern agents and teams who want results.",
    },
    sidebar: {
      title: "CORTEXA AIOS",
      getStarted: "Get started",
      setupFee: "One-time setup fee",
      btn: "Start My Free Trial",
      users: "3 users included",
      addTeam: "Add team members anytime",
    },
    bottom: {
      tagline: "THE ONLY AI CRM BUILT 100% FOR REAL ESTATE.",
      title1: "One software. Every tool.",
      title2: "Everything real estate agents need to succeed.",
      desc: "No more switching between apps. Cortexa brings every lead, conversation, property, and deal into one place.",
      finalLine1: "Built for real estate.",
      finalLine2: "Made to scale.",
      finalLine3: "Designed to win.",
      finalTitle: "That’s the power of Cortexa.",
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
    hero: {
      title: "La forma más inteligente de gestionar tu negocio inmobiliario.",
      desc: "Una plataforma. Todo lo que necesitas para captar, interactuar y cerrar más acuerdos. Creado para agentes y equipos modernos que buscan resultados.",
    },
    sidebar: {
      title: "CORTEXA AIOS",
      getStarted: "Comenzar",
      setupFee: "Tarifa de configuración única",
      btn: "Iniciar Mi Prueba Gratis",
      users: "3 usuarios incluidos",
      addTeam: "Añade miembros en cualquier momento",
    },
    bottom: {
      tagline: "EL ÚNICO CRM DE IA CREADO 100% PARA BIENES RAÍCES.",
      title1: "Un software. Todas las herramientas.",
      title2: "Todo lo que los agentes inmobiliarios necesitan para triunfar.",
      desc: "Olvídate de cambiar entre aplicaciones. Cortexa reúne cada lead, conversación, propiedad y acuerdo en un solo lugar.",
      finalLine1: "Creado para bienes raíces.",
      finalLine2: "Hecho para escalar.",
      finalLine3: "Diseñado para ganar.",
      finalTitle: "Ese es el poder de Cortexa.",
    },
    footer: {
      desc: "El CRM inmobiliario potenciado por IA. Cierra más tratos — Automáticamente.",
      col1: "Producto",
      col1_items: [
        "Características",
        "Precios",
        "Integraciones",
        "Historial de cambios",
      ],
      col2: "Compañía",
      col2_items: ["Sobre nosotros", "Blog", "Carreras", "Contacto"],
      col3: "Análisis",
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
    hero: {
      title: "A maneira mais inteligente de gerir seu negócio imobiliário.",
      desc: "Uma plataforma. Tudo o que você precisa para capturar, engajar e fechar mais negócios. Desenvolvido para corretores e equipes modernas que querem resultados.",
    },
    sidebar: {
      title: "CORTEXA AIOS",
      getStarted: "Começar",
      setupFee: "Taxa única de configuração",
      btn: "Iniciar Meu Teste Grátis",
      users: "3 usuários inclusos",
      addTeam: "Adicione membros a qualquer momento",
    },
    bottom: {
      tagline: "O ÚNICO CRM COM IA DESENVOLVIDO 100% PARA O SETOR IMOBILIÁRIO.",
      title1: "Um software. Todas as ferramentas.",
      title2: "Tudo o que os corretores precisam para vencer.",
      desc: "Chega de alternar entre aplicativos. O Cortexa reúne cada lead, conversa, imóvel e negócio em um só lugar.",
      finalLine1: "Feito para o setor imobiliário.",
      finalLine2: "Criado para escalar.",
      finalLine3: "Desenhado para vencer.",
      finalTitle: "Esse é o poder do Cortexa.",
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
        "Termos de Serviço",
        "Política de Privacidade",
        "Política de Reembolso",
      ],
      col5: "Começar",
      col5_items: ["Login", "Teste Grátis"],
    },
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

  const featureSections = {
    en: [
      {
        icon: saleImg,
        title: "AI SALES ENGINE",
        items: [
          "AI lead scoring & real-time qualification",
          "AI-recommended next actions",
          "AI conversation handling (engages & nurtures leads automatically)",
          "Automated follow-ups",
          "Smart pipelines (auto-updating)",
          "Predictive deal insights (identify high-converting leads)",
        ],
      },
      {
        icon: messImg,
        title: "MULTI-CHANNEL MESSAGING",
        items: [
          "WhatsApp (primary channel)",
          "Instagram DMs (fully integrated)",
          "Unified inbox with full lead context",
          "Cross-channel conversation sync",
          "Real-time notifications & alerts",
          "Full conversation history per lead",
        ],
      },
      {
        icon: homeImg,
        title: "DEAL INTELLIGENCE",
        items: [
          "Buyer–property matching",
          "Listing performance analytics",
          "Mapbox-powered insights",
          "AI-generated property descriptions",
          "Real-time performance dashboards",
          "Funnel tracking (lead → deal → close)",
          "ROI & revenue insights",
        ],
      },
      {
        icon: operImg,
        title: "OPERATIONS & SCALE",
        items: [
          "Centralized dashboard (run everything in one place)",
          "Team collaboration",
          "Role-based access & permissions",
          "Conversion & revenue analytics",
          "Mobile CRM (PWA)",
          "Zapier & webhooks",
        ],
      },
      {
        icon: aiImg,
        title: "AI AGENT",
        items: [
          "Handles conversations 24/7 automatically",
          "Instant WhatsApp replies (24/7)",
          "Qualifies leads using your rules",
          "Books directly to your calendar",
          "Automatically nurtures cold and warm leads",
          "Keeps your pipeline moving even when you’re offline",
          "Automatic follow-ups",
        ],
      },
      {
        icon: autoImg,
        title: "AUTOMATION & CONVERSION ENGINE",
        items: [
          "AI captures and qualifies leads instantly",
          "AI responds 24/7 (WhatsApp + Instagram)",
          "AI books appointments automatically",
          "AI follows up until the deal closes",
          "Smart pipelines update in real time",
          "Never miss a lead again",
        ],
      },
    ],
    es: [
      {
        icon: saleImg,
        title: "MOTOR DE VENTAS CON IA",
        items: [
          "Calificación de leads y puntuación con IA en tiempo real",
          "Próximas acciones recomendadas por IA",
          "Gestión de conversaciones con IA (capta y nutre leads automáticamente)",
          "Seguimientos automatizados",
          "Pipelines inteligentes (actualización automática)",
          "Información predictiva de acuerdos (identifica leads de alta conversión)",
        ],
      },
      {
        icon: messImg,
        title: "MENSAJERÍA MULTICANAL",
        items: [
          "WhatsApp (canal principal)",
          "DMs de Instagram (completamente integrado)",
          "Bandeja de entrada unificada con contexto completo del lead",
          "Sincronización de conversaciones entre canales",
          "Notificaciones y alertas en tiempo real",
          "Historial completo de conversaciones por lead",
        ],
      },
      {
        icon: homeImg,
        title: "INTELIGENCIA DE ACUERDOS",
        items: [
          "Emparejamiento comprador-propiedad",
          "Análisis de rendimiento de listados",
          "Información impulsada por Mapbox",
          "Descripciones de propiedades generadas por IA",
          "Tableros de rendimiento en tiempo real",
          "Seguimiento del embudo (lead → acuerdo → cierre)",
          "Información de ROI e ingresos",
        ],
      },
      {
        icon: operImg,
        title: "OPERACIONES Y ESCALA",
        items: [
          "Tablero centralizado (gestiona todo en un solo lugar)",
          "Colaboración en equipo",
          "Acceso y permisos basados en roles",
          "Análisis de conversión e ingresos",
          "CRM móvil (PWA)",
          "Zapier y webhooks",
        ],
      },
      {
        icon: aiImg,
        title: "AGENTE DE IA",
        items: [
          "Gestiona conversaciones 24/7 automáticamente",
          "Respuestas instantáneas de WhatsApp (24/7)",
          "Califica leads usando tus propias reglas",
          "Reserva directamente en tu calendario",
          "Nutre automáticamente leads fríos y templados",
          "Mantiene tu pipeline en movimiento incluso cuando estás desconectado",
          "Seguimientos automáticos",
        ],
      },
      {
        icon: autoImg,
        title: "MOTOR DE AUTOMATIZACIÓN Y CONVERSIÓN",
        items: [
          "La IA captura y califica leads al instante",
          "La IA responde 24/7 (WhatsApp + Instagram)",
          "La IA programa citas automáticamente",
          "La IA realiza el seguimiento hasta que se cierra el trato",
          "Pipelines inteligentes que se actualizan en tiempo real",
          "No vuelvas a perder un lead",
        ],
      },
    ],
    pt: [
      {
        icon: saleImg,
        title: "MOTOR DE VENDAS COM IA",
        items: [
          "Pontuação e qualificação de leads com IA em tempo real",
          "Próximas ações recomendadas por IA",
          "Gestão de conversas com IA (engaja e nutre leads automaticamente)",
          "Acompanhamentos automatizados",
          "Pipelines inteligentes (atualização automática)",
          "Insights preditivos de negócios (identifique leads de alta conversão)",
        ],
      },
      {
        icon: messImg,
        title: "MENSAGEM MULTICANAL",
        items: [
          "WhatsApp (canal principal)",
          "DMs do Instagram (totalmente integrado)",
          "Caixa de entrada unificada com contexto completo do lead",
          "Sincronização de conversas entre canais",
          "Notificações e alertas em tempo real",
          "Histórico completo de conversas por lead",
        ],
      },
      {
        icon: homeImg,
        title: "INTELIGÊNCIA DE NEGÓCIOS",
        items: [
          "Correspondência entre comprador e imóvel",
          "Análise de desempenho de anúncios",
          "Insights alimentados por Mapbox",
          "Descrições de imóveis geradas por IA",
          "Painéis de desempenho em tempo real",
          "Rastreamento de funil (lead → negócio → fechamento)",
          "Insights de ROI e receita",
        ],
      },
      {
        icon: operImg,
        title: "OPERAÇÕES E ESCALA",
        items: [
          "Painel centralizado (gerencie tudo em um só lugar)",
          "Colaboração em equipe",
          "Acesso e permissões baseados em funções",
          "Análise de conversão e receita",
          "CRM móvel (PWA)",
          "Zapier e webhooks",
        ],
      },
      {
        icon: aiImg,
        title: "AGENTE DE IA",
        items: [
          "Atende conversas 24/7 automaticamente",
          "Respostas instantâneas no WhatsApp (24/7)",
          "Qualifica leads usando suas regras",
          "Agenda diretamente no seu calendário",
          "Nutre automaticamente leads frios e mornos",
          "Mantém seu pipeline andando mesmo quando você está offline",
          "Acompanhamentos automáticos",
        ],
      },
      {
        icon: autoImg,
        title: "MOTOR DE AUTOMAÇÃO E CONVERSÃO",
        items: [
          "IA captura e qualifica leads instantaneamente",
          "IA responde 24/7 (WhatsApp + Instagram)",
          "IA agenda compromissos automaticamente",
          "IA faz o acompanhamento até o fechamento do negócio",
          "Pipelines inteligentes atualizados em tempo real",
          "Nunca mais perca um lead",
        ],
      },
    ],
  };

  const powerItems = {
    en: [
      {
        icon: icon1Img,
        title: "Capture more leads",
        text: "AI finds, engages, and qualifies the right leads automatically.",
      },
      {
        icon: icon2Img,
        title: "Convert more deals",
        text: "Smart follow-ups, insights, and automation close more deals for you.",
      },
      {
        icon: icon3Img,
        title: "Operate with clarity",
        text: "Real-time dashboards and analytics so you always know what’s working.",
      },
      {
        icon: icon4Img,
        title: "Scale effortlessly",
        text: "AI handles the heavy lifting so you can focus on growing your business.",
      },
    ],
    es: [
      {
        icon: icon1Img,
        title: "Capta más leads",
        text: "La IA encuentra, interactúa y califica a los leads adecuados automáticamente.",
      },
      {
        icon: icon2Img,
        title: "Convierte más acuerdos",
        text: "Seguimientos inteligentes, insights y automatización cierran más tratos por ti.",
      },
      {
        icon: icon3Img,
        title: "Opera con claridad",
        text: "Tableros y análisis en tiempo real para que siempre sepas qué está funcionando.",
      },
      {
        icon: icon4Img,
        title: "Escala sin esfuerzo",
        text: "La IA se encarga del trabajo pesado para que te concentres en hacer crecer tu negocio.",
      },
    ],
    pt: [
      {
        icon: icon1Img,
        title: "Capture mais leads",
        text: "A IA encontra, engaja e qualifica os leads certos automaticamente.",
      },
      {
        icon: icon2Img,
        title: "Converta mais negócios",
        text: "Acompanhamentos inteligentes, insights e automação fecham mais negócios para você.",
      },
      {
        icon: icon3Img,
        title: "Opere com clareza",
        text: "Painéis em tempo real e análises para que você sempre saiba o que está funcionando.",
      },
      {
        icon: icon4Img,
        title: "Escale sem esforço",
        text: "A IA cuida do trabalho pesado para você focar no crescimento do seu negócio.",
      },
    ],
  };

  const currentFeatures = featureSections[lang] || featureSections.en;
  const currentPowerItems = powerItems[lang] || powerItems.en;

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
          <div className="container header-inner">
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
              <a href="/sign-in">{tr.nav.login}</a>
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
                    <div className="lang-item" onClick={() => handleLangChange("en")}>
                      English
                    </div>
                    <div className="lang-item" onClick={() => handleLangChange("es")}>
                      Español
                    </div>
                    <div className="lang-item" onClick={() => handleLangChange("pt")}>
                      Português
                    </div>
                  </div>
                )}
              </div>
              <a href="/trial" className="trial">
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

      <main className="main">
        <section className="container hero">
          <div className="hero-text">
            <h1>{tr.hero.title}</h1>
            <p>{tr.hero.desc}</p>
          </div>

          <div className="content">
            <div className="features">
              {currentFeatures.map((section) => (
                <div key={section.title} className="feature-card">
                  <div className="feature-title">
                    <span className="icon">
                      <img src={section.icon} alt="Cortexa" />
                    </span>
                    <h3>{section.title}</h3>
                  </div>

                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>
                        <span className="check">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <aside className="sidebar">
              <h2>{tr.sidebar.title}</h2>

              <div className="price-box">
                <div>
                  <span>{tr.sidebar.getStarted}</span>
                  <strong>$67</strong>
                </div>
                <p>{tr.sidebar.setupFee}</p>
              </div>

              <a href="/trial" className="btn-primary full">
                {tr.sidebar.btn}
              </a>

              <p className="fill fillcheck">
                <Check size={18} /> {tr.sidebar.addTeam}
              </p>
            </aside>
          </div>

          <div className="bottom-section">
            <div className="bottom-grid">
              <div>
                <p className="tagline">{tr.bottom.tagline}</p>

                <h2>
                  {tr.bottom.title1}
                  <br />
                  <span>{tr.bottom.title2}</span>
                </h2>

                <p className="desc">{tr.bottom.desc}</p>
              </div>

              {currentPowerItems.map((item) => (
                <div key={item.title} className="power-item">
                  <div className="icon">
                    <img src={item.icon} alt="Cortexa" />
                  </div>
                  <div className="content-wrap">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}

              <div className="power-final">
                <p>
                  {tr.bottom.finalLine1}
                  <br />
                  {tr.bottom.finalLine2}
                  <br />
                  {tr.bottom.finalLine3}
                </p>
                <h3>{tr.bottom.finalTitle}</h3>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer-final">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={footlogo} alt="Cortexa" className="cx-logo-img" />
              <p>{tr.footer.desc}</p>
              <div className="footer-tags">
                <span>
                  <img src={social1} alt="Social" />
                </span>
                <span>
                  <img src={social2} alt="Social" />
                </span>
                <span>
                  <img src={social3} alt="Social" />
                </span>
                <span>
                  <img src={social4} alt="Social" />
                </span>
              </div>
            </div>

            <div className="footer-col">
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
                  <a href="/analytics">{tr.footer.col1_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>{tr.footer.col2}</h3>
              <ul>
                <li>
                  <a href="/about">{tr.footer.col2_items[0]}</a>
                </li>
                <li>
                  <a href="/signin">{tr.footer.col2_items[1]}</a>
                </li>
                <li>
                  <a href="/crm">{tr.footer.col2_items[2]}</a>
                </li>
                <li>
                  <a href="/contact">{tr.footer.col2_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>{tr.footer.col3}</h3>
              <ul>
                <li>
                  <a href="/help">{tr.footer.col3_items[0]}</a>
                </li>
                <li>
                  <a href="/setup-guide">{tr.footer.col3_items[1]}</a>
                </li>
                <li>
                  <a href="/contact">{tr.footer.col3_items[2]}</a>
                </li>
                <li>
                  <a href="/help/api">{tr.footer.col3_items[3]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>{tr.footer.col4}</h3>
              <ul>
                <li>
                  <a href="/terms">{tr.footer.col4_items[0]}</a>
                </li>
                <li>
                  <a href="/privacy-policy">{tr.footer.col4_items[1]}</a>
                </li>
                <li>
                  <a href="/refund-policy">{tr.footer.col4_items[2]}</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>{tr.footer.col5}</h3>
              <ul>
                <li>
                  <a href="/sign-in">{tr.footer.col5_items[0]}</a>
                </li>
                <li>
                  <a href="/trial" className="btn-primary">
                    {tr.footer.col5_items[1]}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="copt-right text-center">
            &copy; 2026 Corrtexa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
