import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Play, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { HashLink } from "react-router-hash-link";
import "./LandingMobile.css";

import headlogoImg from "../../assets/cortexa/headlogotran.png";
import landingDashImg from "../../assets/cortexa/mobile/m_dash1.png";
export default function LandingMobile() {
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const t = {
    en: {
      badge: "AI-POWERED CRM & AUTOMATIONS",
      heroTitle1: "Get Instant Leads.",
      heroTitle2: "Close More Deals.",
      heroTitle3: "24/7 with AI.",
      heroDesc:
        "All-in-one AI platform that captures more leads, follows up instantly, closes more deals, and grows revenue on autopilot.",
      login: "Log in",
      trial: "Start Free Trial",
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
      trusted: "Trusted by 10,000+ real estate agents worldwide.",
      
      benefitsSubtitle: "WHAT CORTEXA DOES FOR YOU",
      benefitsTitle1: "Everything You Need.",
      benefitsTitle2: "All in One Place.",   
      followUpTitle: "Automated Follow-Ups",
      followUpDesc: "Never miss a lead again. AI follows up instantly until the deal is closed.",     
      setterTitle: "AI Appointment Setter",
      setterDesc: "Qualifies leads, books appointments, and moves opportunities forward.",      
      pipelineTitle: "Pipeline Management",
      pipelineDesc: "See your entire pipeline at a glance and never lose track of a deal.",     
      analyticsTitle: "Real-Time Analytics",
      analyticsDesc: "Track performance in real time and make data-driven decisions.",     
      whatsappTitle: "WhatsApp Integration",
      whatsappDesc: "Chat with leads where they are and close faster.",

      platformSubtitle: "A REAL ESTATE PLATFORM",
      platformTitle: "BUILT FOR REAL ESTATE",
      platformDesc: "CORTEXA brings your leads, conversations, listings, appointments, and deals together in one smart system — powered by AI.",      
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
    },

    es: {
      badge: "CRM Y AUTOMATIZACIÓN CON IA",
      heroTitle1: "Obtén Más Leads.",
      heroTitle2: "Cierra Más Ventas.",
      heroTitle3: "24/7 con IA.",
      heroDesc:
        "Plataforma todo en uno que captura más leads, responde al instante y aumenta tus ingresos automáticamente.",
      login: "Iniciar sesión",
      trial: "Prueba Gratis",
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
      trusted: "Más de 10.000 profesionales confían en nosotros",
      benefitsSubtitle: "LO QUE CORTEXA HACE POR TI",
      benefitsTitle1: "Todo lo que necesitas.",
      benefitsTitle2: "En un solo lugar.",    
      followUpTitle: "Seguimientos Automatizados",
      followUpDesc: "No pierdas ningún lead. La IA hace seguimiento al instante hasta cerrar el trato.",     
      setterTitle: "Agendador de Citas con IA",
      setterDesc: "Califica leads, agenda citas y avanza las oportunidades.",     
      pipelineTitle: "Gestión de Pipeline",
      pipelineDesc: "Mira todo tu pipeline de un vistazo y nunca pierdas el rastro de un trato.",      
      analyticsTitle: "Analítica en Tiempo Real",
      analyticsDesc: "Realiza un seguimiento del rendimiento en tiempo real y toma decisiones basadas en datos.",     
      whatsappTitle: "Integración con WhatsApp",
      whatsappDesc: "Chatea con tus leads donde ellos estén y cierra ventas más rápido.",

      platformSubtitle: "UNA PLATAFORMA INMOBILIARIA",
      platformTitle: "HECHA PARA BIENES RAÍCES",
      platformDesc: "CORTEXA reúne tus leads, conversaciones, propiedades, citas y tratos en un solo sistema inteligente, impulsado por IA.",   
      captureTitle: "Captura de Leads",
      captureDesc: "Desde anuncios, sitios web, portales y más",  
      engageTitle: "IA Interactúa al Instante",
      engageDesc: "Responde, califica y nutre las 24 horas, los 7 días de la semana",  
      syncTitle: "Sincronización de Datos",
      syncDesc: "Todo organizado en un solo lugar",  
      pipelineMoveTitle: "El Pipeline Avanza",
      pipelineMoveDesc: "La IA y tu equipo cierran más tratos",   
      closedDealsTitle: "Más Tratos Cerrados",
      closedDealsDesc: "Crecimiento predecible en piloto automático",
    },

    pt: {
      badge: "CRM E AUTOMAÇÕES COM IA",
      heroTitle1: "Mais Leads.",
      heroTitle2: "Mais Negócios.",
      heroTitle3: "24/7 com IA.",
      heroDesc:
        "Plataforma completa que captura leads, responde instantaneamente e aumenta sua receita no piloto automático.",
      login: "Entrar",
      trial: "Teste Grátis",
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
      trusted: "Mais de 10.000 profissionais utilizam nossa plataforma",
      benefitsSubtitle: "O QUE A CORTEXA FAZ POR VOCÊ",
      benefitsTitle1: "Tudo o que você precisa.",
      benefitsTitle2: "Em um só lugar.",     
      followUpTitle: "Acompanhamentos Automatizados",
      followUpDesc: "Nunca perca um lead. A IA acompanha instantaneamente até o negócio ser fechado.",     
      setterTitle: "Agendador de Reuniões com IA",
      setterDesc: "Qualifica leads, agenda reuniões e faz os negócios avançarem.",     
      pipelineTitle: "Gestão de Pipeline",
      pipelineDesc: "Visualize todo o seu pipeline em um relance e nunca perca um negócio de vista.",     
      analyticsTitle: "Analytics em Tempo Real",
      analyticsDesc: "Acompanhe o desempenho em tempo real e tome decisões baseadas em dados.",     
      whatsappTitle: "Integração com WhatsApp",
      whatsappDesc: "Converse com os leads onde eles estão e feche negócios mais rápido.",

      platformSubtitle: "UMA PLATAFORMA IMOBILIÁRIA",
      platformTitle: "CONSTRUÍDA PARA O SETOR IMOBILIÁRIO",
      platformDesc: "A CORTEXA reúne seus leads, conversas, imóveis, reuniões e negócios em um único sistema inteligente — alimentado por IA.",
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
    },
  };

  const tr = t[lang];
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
        <img src={headlogoImg} alt="CORTEXA" className="m-logo" />
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
              {lang.toUpperCase()}
            </button>

            {langOpen && (
              <div className="m-lang-dropdown">
                <button
                  onClick={() => {
                    setLang("en");
                    setLangOpen(false);
                  }}
                >
                  English
                </button>

                <button
                  onClick={() => {
                    setLang("es");
                    setLangOpen(false);
                  }}
                >
                  Español
                </button>

                <button
                  onClick={() => {
                    setLang("pt");
                    setLangOpen(false);
                  }}
                >
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

            return (
              <HashLink className="nav-menu" key={i} smooth to={`/#${ids[i]}`}>
                {n}
              </HashLink>
            );
          })}

          <a href="/pricing">{tr.pricing}</a>
        </div>

        <div className="m-drawer-actions">
          {isAuthenticated() ? (
            <Link to="/dashboard/home" className="m-login-btn">
              Dashboard
            </Link>
          ) : (
            <Link to="/sign-in" className="m-login-btn">
              {tr.login}
            </Link>
          )}
          <a href="/trial" className="m-trial-btn">
            {tr.trial}
          </a>
        </div>
      </div>

      {/* OVERLAY */}

      {menuOpen && (
        <div className="m-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* HERO */}

      <section className="m-hero">
        <div className="m-badge">{tr.badge}</div>
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
            {tr.trial}
            <ArrowRight size={18} />
          </a>
          <button className="m-secondary-btn">
            <Play size={18} />
            {tr.watchDemo}
          </button>
        </div>

        <div className="m-trust">
          <div className="m-avatars">
            {avatars.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`User avatar ${index + 1}`}
                className="badge-avatar"
              />
            ))}
          </div>

          <div className="m-trust-text">
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
            <br />
            {tr.trusted}
          </div>
        </div>
        {/* dashboard image */}
        <div className="m-dashboard">
          <img src={landingDashImg} alt="" />
        </div>
      </section>

      {/* STATS */}

      <section className="m-stats">
        <div className="m-stat-card">
          <h3>+312%</h3>
          <span>ROI</span>
        </div>

        <div className="m-stat-card">
          <h3>$2.4M+</h3>
          <span>Revenue</span>
        </div>

        <div className="m-stat-card">
          <h3>10K+</h3>
          <span>Agents</span>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="m-benefits">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-benefit-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-benefit-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-benefit-icon">
                <path d="M3 3v18h18" />
                <path d="m7 15 5-5 4 4 5-5" />
              </svg>
            </div>
            <h3>{tr.pipelineTitle}</h3>
            <p>{tr.pipelineDesc}</p>
          </div>

          <div className="m-benefit-card">
            <div className="m-benefit-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-benefit-icon">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="m-whatsapp-icon">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.256 5.261 0 11.725 0c3.132.001 6.077 1.22 8.29 3.433 2.213 2.212 3.43 5.158 3.43 8.29 0 6.465-5.256 11.722-11.714 11.722-2.006-.001-3.974-.515-5.727-1.497L0 24zm6.106-4.66c1.651.98 3.278 1.497 4.904 1.499 5.378 0 9.754-4.374 9.758-9.75.002-2.605-1.01-5.053-2.85-6.895C16.082 2.35 13.64 1.336 11.73 1.336c-5.385 0-9.762 4.376-9.766 9.751-.001 1.706.461 3.376 1.339 4.898L2.308 21.72l6.009-1.577h-.154z"/>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-platform-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-platform-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-platform-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-platform-icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="m-platform-icon">
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
        </div>
      </section>
    </div>
  );
}
