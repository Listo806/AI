import { useEffect, useState } from "react";
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
} from "lucide-react";

import headlogo from "../../assets/cortexa/pheadlogo.png";
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
    hero: {
      title: "The smarter way to run your real estate business.",
      desc: "One platform. Everything you need to capture, engage, and close more deals. Built for modern agents and teams who want results.",
    },
    badge: {
      title: "Clear Monthly Pricing.",
      title1: "No Games. No Surprises.",
      desc: "We believe in transparency. What you see is what you pay. No fine print. No overages. Just one powerful platform built to help you close more deals.",
    },
    sidebar: {
      getStarted: "Start today for",
      setupFee: "ONE-TIME SETUP FEE",
      btn: "Start My Free Trial",
      addTeam: "Add team members anytime",
    },
    bottom: {
      tagline: "THE ONLY AI CRM BUILT 100% FOR REAL ESTATE.",
      title1: "One software. Every tool.",
      title2: "Everything real estate agents need to succeed.",
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
    badge: {
      title: "Precios mensuales claros.",
      title1: "Sin juegos. Sin sorpresas.",
      desc: "Creemos en la transparencia. Lo que ves es lo que pagas. Sin letra pequeña. Sin excesos. Solo una plataforma poderosa creada para ayudarte a cerrar más acuerdos.",
    },
    sidebar: {
      getStarted: "Comienza hoy por",
      setupFee: "TARIFA DE CONFIGURACIÓN ÚNICA",
      btn: "Iniciar Mi Prueba Gratis",
      addTeam: "Añade miembros en cualquier momento",
    },
    bottom: {
      tagline: "EL ÚNICO CRM DE IA CREADO 100% PARA BIENES RAÍCES.",
      title1: "Un software. Todas las herramientas.",
      title2: "Todo lo que los agentes inmobiliarios necesitan para triunfar.",
      finalLine1: "Creado para bienes raíces.",
      finalLine2: "Hecho para escalar.",
      finalLine3: "Diseñado para ganar.",
      finalTitle: "Ese es el poder de Cortexa.",
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
    badge: {
      title: "Preços Mensais Claros.",
      title1: "Sem Jogos. Sem Surpresas.",
      desc: "Acreditamos em transparência. O que você vê é o que você paga. Sem letras miúdas. Sem excessos. Apenas uma plataforma poderosa construída para ajudar você a fechar mais negócios.",
    },
    sidebar: {
      getStarted: "Comece hoje por",
      setupFee: "TAXA ÚNICA DE CONFIGURAÇÃO",
      btn: "Iniciar Meu Teste Grátis",
      addTeam: "Adicione membros a qualquer momento",
    },
    bottom: {
      tagline: "O ÚNICO CRM COM IA DESENVOLVIDO 100% PARA O SETOR IMOBILIÁRIO.",
      title1: "Um software. Todas as ferramentas.",
      title2: "Tudo o que os corretores precisam para vencer.",
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
        "Terms de Serviço",
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

  const horizontalGridFeatures = {
    en: [
      {
        id: 1,
        text: "No confusing AI credit systems",
        icon: <Layers size={34} color="#0022ff" />,
      },
      {
        id: 2,
        text: "No surprise usage fees",
        icon: <Activity size={34} color="#0022ff" />,
      },
      {
        id: 3,
        text: "No hidden fees",
        icon: <CircleDollarSign size={34} color="#0022ff" />,
      },
      {
        id: 4,
        text: "Add team members anytime",
        icon: <UserPlus size={34} color="#0022ff" />,
      },
      {
        id: 5,
        text: "One-time setup fee",
        icon: <Wrench size={34} color="#0022ff" />,
      },
      {
        id: 6,
        text: "Built for real estate",
        icon: <Building2 size={34} color="#0022ff" />,
      },
    ],
    es: [
      {
        id: 1,
        text: "Sin sistemas confusos de créditos de IA",
        icon: <Layers size={34} color="#0022ff" />,
      },
      {
        id: 2,
        text: "Sin tarifas sorpresivas por uso",
        icon: <Activity size={34} color="#0022ff" />,
      },
      {
        id: 3,
        text: "Sin tarifas ocultas",
        icon: <CircleDollarSign size={34} color="#0022ff" />,
      },
      {
        id: 4,
        text: "Añade miembros en cualquier momento",
        icon: <UserPlus size={34} color="#0022ff" />,
      },
      {
        id: 5,
        text: "Tarifa de configuración única",
        icon: <Wrench size={34} color="#0022ff" />,
      },
      {
        id: 6,
        text: "Creado para bienes raíces",
        icon: <Building2 size={34} color="#0022ff" />,
      },
    ],
    pt: [
      {
        id: 1,
        text: "Sem sistemas confusos de créditos de IA",
        icon: <Layers size={34} color="#0022ff" />,
      },
      {
        id: 2,
        text: "Sem taxas surpresa de uso",
        icon: <Activity size={34} color="#0022ff" />,
      },
      {
        id: 3,
        text: "Sem taxas ocultas",
        icon: <CircleDollarSign size={34} color="#0022ff" />,
      },
      {
        id: 4,
        text: "Adicione membros a qualquer momento",
        icon: <UserPlus size={34} color="#0022ff" />,
      },
      {
        id: 5,
        text: "Taxa única de configuração",
        icon: <Wrench size={34} color="#0022ff" />,
      },
      {
        id: 6,
        text: "Feito para o setor imobiliário",
        icon: <Building2 size={34} color="#0022ff" />,
      },
    ],
  };

  const featureSections = {
    en: [
      {
        icon: <Bot size={38} color="#0022ff" />,
        title: "AI AGENT",
        desc: "Your 24/7 AI Assistant",
        items: [
          "Handles conversations 24/7",
          "Instant WhatsApp replies",
          "Qualifies leads automatically",
          "Books appointments",
          "Nurtures cold & warm leads",
          "Automatic follow-ups",
        ],
      },
      {
        icon: <MessageSquare size={38} color="#0022ff" />,
        title: "WHATSAPP INBOX",
        desc: "All conversations in one place",
        items: [
          "WhatsApp (primary channel)",
          "Instagram DMs",
          "Unified inbox",
          "Cross-channel sync",
          "Real-time notifications",
          "Full conversation history per lead",
        ],
      },
      {
        icon: <GitFork size={38} color="#0022ff" />,
        title: "LEADS & PIPELINE",
        desc: "From new lead to closed deal",
        items: [
          "Capture & score leads",
          "Organize & qualify leads",
          "Smart pipeline updates",
          "Deal stages",
          "Task & activity tracking",
          "Funnel tracking (lead → deal → close)",
        ],
      },
      {
        icon: <Home size={38} color="#0022ff" />,
        title: "PROPERTIES",
        desc: "Manage listings & performance",
        items: [
          "Add & manage properties",
          "Property details & media",
          "Buyer-property matching",
          "Listing performance",
          "Property activity timeline",
          "AI-generated property descriptions",
        ],
      },
      {
        icon: <Users size={44} color="#0022ff" />,
        title: "TEAM AIOS",
        desc: "Everything your team needs in one workspace",
        items: [
          "Team workspace dashboard",
          "Shared calendar",
          "Team chat",
          "Files & documents",
          "Notes & knowledge base",
          "Team collaboration",
        ],
      },
      {
        icon: <ShieldAlert size={38} color="#0022ff" />,
        title: "TEAM MANAGEMENT",
        desc: "Empower your team to perform",
        items: [
          "Permissions & roles",
          "AI team insights",
          "Performance reporting",
          "Real-time collaboration",
          "Team analytics",
          "Activity tracking",
        ],
      },
      {
        icon: <Zap size={38} color="#0022ff" />,
        title: "FOLLOW-UP AUTOMATION",
        desc: "Nurture leads. Stay top of mind. Close more deals.",
        items: [
          "Automatic lead follow-ups",
          "Cold lead nurturing",
          "Warm lead reminders",
          "Appointment reminders",
          "Re-engagement campaigns",
          "Never miss a lead again",
        ],
      },
      {
        icon: <BarChart3 size={38} color="#0022ff" />,
        title: "ANALYTICS",
        desc: "Track what matters. Grow faster.",
        items: [
          "Lead & deal performance",
          "Conversion analytics",
          "Ad spend, CPA & ROI",
          "Revenue reports",
          "Real-time dashboards",
          "AI business insights",
        ],
      },
    ],
  };

  const powerItems = {
    en: [
      {
        icon: <Target size={34} color="#b25ced" />,
        title: "Capture more leads",
        text: "AI finds, engages, and qualifies the right leads automatically.",
      },
      {
        icon: <Zap size={34} color="#b25ced" />,
        title: "Convert more deals",
        text: "Smart follow-ups, insights, and automation close more deals for you.",
      },
      {
        icon: <TrendingUp size={34} color="#b25ced" />,
        title: "Operate with clarity",
        text: "Real-time dashboards and analytics so you always know what’s working.",
      },
      {
        icon: <Crosshair size={34} color="#b25ced" />,
        title: "Scale effortlessly",
        text: "AI handles the heavy lifting so you can focus on growing your business.",
      },
    ],
  };

  const currentHorizontalFeatures =
    horizontalGridFeatures[lang] || horizontalGridFeatures.en;
  const currentFeatures = featureSections.en;
  const currentPowerItems = powerItems.en;

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
        <section className="hero-section">
          <h1>{tr.hero.title}</h1>
          <p className="hero-subtitle">{tr.hero.desc}</p>
        </section>

        <div className="pricing-box-container">
          <div className="pricing-box-inner">
            <div className="clear-pricing-badge">
              <ShieldCheck className="shield-icon" size={44} color="#0022ff" />
              <div className="badge-text-wrap">
                <h4>
                  {tr.badge.title} <br />
                  <span>{tr.badge.title1}</span>
                </h4>
                <p>{tr.badge.desc}</p>
              </div>
            </div>

            <div className="pricing-features-grid">
              {currentHorizontalFeatures.map((feat) => (
                <div key={feat.id} className="p-feat-item">
                  <div className="p-feat-icon">{feat.icon}</div>
                  <span className="p-feat-text">{feat.text}</span>
                </div>
              ))}
            </div>

            <div className="pricing-box-right">
              <div>
                <span className="start-today-text">
                  {tr.sidebar.getStarted}
                </span>
                <strong className="big-price">$67</strong>
                <p className="setup-fee-label">{tr.sidebar.setupFee}</p>
              </div>
              <div>
                <a href="/trial" className="start-free-trial-btn">
                  {tr.sidebar.btn}
                </a>
                <div className="add-team-anytime-sub">
                  <UserPlus size={14} color="#4a5568" />
                  <span>{tr.sidebar.addTeam}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="features-detailed-grid">
          {currentFeatures.map((section, idx) => (
            <div key={idx} className="detailed-feature-card">
              <div className="card-header-block">
                <div className="card-icon-img">{section.icon}</div>
                <div className="card-heading-wrap">
                  <h3>{section.title}</h3>
                  <p className="card-sub-desc">{section.desc}</p>
                </div>
              </div>
              <ul className="card-feature-list">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <span className="blue-check">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bottom-dark-section">
          <div className="dark-section-inner">
            <div className="dark-left-column">
              <p className="dark-tagline">{tr.bottom.tagline}</p>
              <h2>
                {tr.bottom.title1}
                <br />
                <span className="purple-gradient-text">{tr.bottom.title2}</span>
              </h2>
            </div>

            <div className="dark-features-grid">
              {currentPowerItems.map((item, idx) => (
                <div key={idx} className="dark-power-item">
                  <div className="dark-power-icon-circle">{item.icon}</div>
                  <div className="dark-power-content">
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}

              <div className="dark-power-item final-branding-box">
                <div className="dark-power-icon-circle">
                  <Gem size={34} color="#b25ced" />
                </div>
                <div className="branding-text-lines">
                  <p>{tr.bottom.finalLine1}</p>
                  <p>{tr.bottom.finalLine2}</p>
                  <p>{tr.bottom.finalLine3}</p>
                  <h3>{tr.bottom.finalTitle}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-section">
        <div className="footer-inner-wrap">
          <div className="footer-main-grid">
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
