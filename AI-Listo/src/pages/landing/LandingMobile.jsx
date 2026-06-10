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

        <button className="m-menu-btn" onClick={() => setMenuOpen(true)}>
          <Menu size={28} />
        </button>
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
        <div className="m-language">
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>

          <button
            className={lang === "es" ? "active" : ""}
            onClick={() => setLang("es")}
          >
            ES
          </button>

          <button
            className={lang === "pt" ? "active" : ""}
            onClick={() => setLang("pt")}
          >
            PT
          </button>
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

          {tr.heroTitle2}
          <br />

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
    </div>
  );
}
