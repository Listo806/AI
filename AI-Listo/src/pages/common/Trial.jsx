import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldAlert,
  ChevronRight,
  Sparkle,
  Users,
  TrendingUp,
  Clock,
  ShieldCheck,
  Quote,
} from "lucide-react";
import "./Common.css";
import trial from "../../assets/cortexa/trial-right.png";
import trialogo from "../../assets/cortexa/trial-logo.png";
import headlogoM from "../../assets/cortexa/headlogotran.png";
import trialbottomM from "../../assets/cortexa/mobile/trial-bt.png";

const t = {
  en: {
    title: "Turn More Leads Into Revenue — ",
    title1: "On Autopilot. ",
    desc: "CORTEXA AI Revenue OS is the all-in-one system built for real estatep professionals who want more leads, more appointments, and more closings.",
    desc1: "One system. Every tool. Unlimited potential",
    f1: "Capture high-qualify leads and never miss an opportunity",
    f2: "AI follows up instantly via text, WhatsApp, and more",
    f3: "Smart pipelines and automation move deals forward",
    f4: "Real-time insights and reporting to grow your bussiness",
    placeholders: {
      name: "Full Name",
      email: "Work Email",
      phone: "Phone Number (Required)",
      password: "Password",
    },
    btnNormal: "Continue to Secure Checkout",
    btnLoading: "Creating Account...",
    footerNote:
      "You will be redirected to secure checkout to activate your account with a one-time setup fee.",

    heroTitlePre: "The",
    heroTitleAi: "AI Revenue OS",
    heroTitlePost: "Built for Real Estate Professionals Who Want",
    heroTitleMore: "More.",

    quoteText: `"CORTEXA AI Revenue OS completely transformed our business. The AI handles the follow-ups, our pipeline stays full and our closings are up. It's like having an entire team working 24/7."`,
    quoteAuthor: "The Happy Client",
    quoteSub: "Real Estate Team",

    statUsersVal: "",
    statUsersLbl: "Active Users",
    statDealsVal: "",
    statDealsLbl: "More Deals Closed",
    statTimeVal: "24/7",
    statTimeLbl: "AI Working For You Nonstop",

    trustedText: "Trusted by real estate professionals everywhere",

    badge1Title: "High Performer",
    badge1Sub: "WINTER 2026",
    badge2Title: "Best Results",
    badge2Sub: "FALL 2025",
    badge3Title: "Easiest To Use",
    badge3Sub: "SUMMER 2025",
    badge4Title: "Momentum Leader",
    badge4Sub: "WINTER 2026",
  },
  es: {
    title: "Convierte más leads en ingresos — ",
    title1: "En piloto automático.",
    desc: "CORTEXA AI Revenue OS es el sistema todo en uno diseñado para profesionales inmobiliarios que desean más leads, más citas y más cierres.",
    desc1: "Un sistema. Todas las herramientas. Potencial ilimitado.",
    f1: "Captura leads de alta calidad y nunca pierdas una oportunidad",
    f2: "La IA realiza seguimientos instantáneos por SMS, WhatsApp y más",
    f3: "Los pipelines inteligentes y la automatización impulsan los negocios hacia adelante",
    f4: "Información y reportes en tiempo real para hacer crecer tu negocio",
    placeholders: {
      name: "Nombre Completo",
      email: "Correo Electrónico de Trabajo",
      phone: "Número de Teléfono (Obligatorio)",
      password: "Contraseña",
    },
    btnNormal: "Continuar al Pago Seguro",
    btnLoading: "Creando Cuenta...",
    footerNote:
      "Será redirigido al pago seguro para activar su cuenta con una tarifa de configuración de pago único.",

    heroTitlePre: "El",
    heroTitleAi: "AI Revenue OS",
    heroTitlePost: "Creado para Profesionales Inmobiliarios que Quieren",
    heroTitleMore: "Más.",

    quoteText: `"CORTEXA AI Revenue OS transformó por completo nuestro negocio. La IA se encarga de los seguimientos, nuestro pipeline se mantiene lleno y nuestros cierres han aumentado. Es como tener un equipo entero trabajando 24/7."`,
    quoteAuthor: "El Cliente Satisfecho",
    quoteSub: "Equipo Inmobiliario",

    statUsersVal: "",
    statUsersLbl: "Usuarios Activos",
    statDealsVal: "",
    statDealsLbl: "Más Tratos Cerrados",
    statTimeVal: "24/7",
    statTimeLbl: "IA Trabajando para Ti Sin Parar",

    trustedText:
      "Con la confianza de profesionales inmobiliarios en todas partes",

    badge1Title: "Alto Rendimiento",
    badge1Sub: "INVIERNO 2026",
    badge2Title: "Mejores Resultados",
    badge2Sub: "OTOÑO 2025",
    badge3Title: "Más Fácil de Usar",
    badge3Sub: "VERANO 2025",
    badge4Title: "Líder de Impulso",
    badge4Sub: "INVIERNO 2026",
  },
  pt: {
    title: "Transforme mais leads em receita — ",
    title1: "No piloto automático.",
    desc: "O CORTEXA AI Revenue OS é o sistema completo desenvolvido para profissionais do mercado imobiliário que desejam mais leads, mais agendamentos e mais fechamentos.",
    desc1: "Um sistema. Todas as ferramentas. Potencial ilimitado.",
    f1: "Capture leads de alta qualidade e nunca perca uma oportunidade",
    f2: "A IA faz o acompanhamento instantaneamente por SMS, WhatsApp e muito mais",
    f3: "Pipelines inteligentes e automações impulsionam os negócios adiante",
    f4: "Insights e relatórios em tempo real para expandir seu negócio",
    placeholders: {
      name: "Nome Completo",
      email: "E-mail de Trabalho",
      phone: "Número de Telefone (Obrigatório)",
      password: "Senha",
    },
    btnNormal: "Continuar para o Pagamento Seguro",
    btnLoading: "Criando Conta...",
    footerNote:
      "Você será redirecionado para o pagamento seguro para ativar sua conta com uma taxa de configuração de pagamento único.",

    heroTitlePre: "O",
    heroTitleAi: "AI Revenue OS",
    heroTitlePost: "Feito para Profissionais Imobiliários que Querem",
    heroTitleMore: "Mais.",

    quoteText: `"O CORTEXA AI Revenue OS transformou completamente o nosso negócio. A IA cuida dos acompanhamentos, nosso pipeline permanece cheio e nossos fechamentos aumentaram. É como ter uma equipe inteira trabalhando 24/7."`,
    quoteAuthor: "Cliente Satisfeito",
    quoteSub: "Equipe Imobiliária",

    statUsersVal: "",
    statUsersLbl: "Usuários Ativos",
    statDealsVal: "3X",
    statDealsLbl: "Mais Negócios Fechados",
    statTimeVal: "24/7",
    statTimeLbl: "IA Trabalhando para Você Sem Parar",

    trustedText: "Confiado por profissionais imobiliários em todos os lugares",

    badge1Title: "Alto Desempenho",
    badge1Sub: "INVERNO 2026",
    badge2Title: "Melhores Resultados",
    badge2Sub: "OUTONO 2025",
    badge3Title: "Mais Fácil de Usar",
    badge3Sub: "VERÃO 2025",
    badge4Title: "Líder de Impulso",
    badge4Sub: "INVERNO 2026",
  },
};

export default function StartTrial() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "owner",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        "https://backend.cortexaaicrm.com/api/trial/start-trial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("trialUserId", data.userId);
        localStorage.setItem("email", form.email);
        localStorage.setItem("name", form.name);
        localStorage.setItem("password", form.password);
        navigate("/checkout");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("SUBMIT ERROR:", error.message);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("cortexa_lang", newLang);
    setLangOpen(false);
  };
  const tr = t[lang];
  const Icon = isMobile ? Sparkle : Check;
  return (
    <div className={isMobile ? "trial-page mobile" : "trial-page"}>
      <div className="trial-container">
        <div className="trial-left-column">
          {isMobile ? (
            <header className="m-header">
              <div className="m-logo-block">
                <a href="/">
                  <img src={headlogoM} alt="Cortexa" className="cx-logo-img" />
                </a>
              </div>

              {/*<div className="m-header-right">
                <div className="m-lang-wrapper">
                  <button
                    type="button"
                    className="m-lang-btn"
                    onClick={() => setLangOpen(!langOpen)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}
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
              </div>*/}
            </header>
          ) : (
            <div className="trial-header">
              <div className="trial-logo-area">
                <div className="trial-logo-box">
                  <span className="trial-logo-inner-c">
                    <img
                      src={trialogo}
                      alt="CORTEXA"
                      className="trial-logo-img"
                    />
                  </span>
                </div>
              </div>
            </div>
          )}

          <h1 className="trial-title">
            {tr.title}
            <span className="cx-pricing-title-blue">{tr.title1}</span>
          </h1>
          <p className="trial-desc">
            {tr.desc}
            <span className="cx-pricing-title-blue">{tr.desc1}</span>
          </p>

          <ul className="trial-features">
            <li>
              <span className="trial-check-icon">
                <Icon size={13} strokeWidth={3} />
              </span>
              {tr.f1}
            </li>
            <li>
              <span className="trial-check-icon">
                <Icon size={13} strokeWidth={3} />
              </span>
              {tr.f2}
            </li>
            <li>
              <span className="trial-check-icon">
                <Icon size={13} strokeWidth={3} />
              </span>
              {tr.f3}
            </li>
            <li>
              <span className="trial-check-icon">
                <Icon size={13} strokeWidth={3} />
              </span>
              {tr.f4}
            </li>
          </ul>

          <div className="trial-card">
            <form onSubmit={handleSubmit}>
              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder={tr.placeholders.name}
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder={tr.placeholders.email}
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  placeholder={tr.placeholders.phone}
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="trial-input-group">
                <span className="trial-input-icon">
                  <LockKeyhole size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={tr.placeholders.password}
                  required
                  minLength="6"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="trial-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                className="trial-submit-btn"
                disabled={loading}
              >
                <span className="trial-btn-lock">
                  <LockKeyhole size={16} />
                </span>
                {loading ? tr.btnLoading : tr.btnNormal}
                <span className="trial-btn-arrow">
                  <ChevronRight size={18} />
                </span>
              </button>

              <div className="trial-footer-text">
                <span className="trial-shield-icon">
                  <ShieldAlert size={20} />
                </span>
                <p>{tr.footerNote}</p>
              </div>
            </form>
          </div>
        </div>
        {isMobile ? (
          <div className="trial-right">
            <div className="cx-mobile-overview-container">
              <h2 className="cx-mob-hero-heading">
                {tr.heroTitlePre}{" "}
                <span className="cx-purple-text">{tr.heroTitleAi}</span>{" "}
                {tr.heroTitlePost}{" "}
                <span className="cx-purple-text">{tr.heroTitleMore}</span>
              </h2>

              <div className="cx-mob-testimonial-card">
                <div className="cx-mob-quote-header">
                  <Quote
                    className="cx-mob-quote-icon"
                    size={24}
                    fill="currentColor"
                  />
                  <div className="cx-mob-avatar-placeholder">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>

                <p className="cx-mob-quote-body">{tr.quoteText}</p>

                <div className="cx-mob-author-wrapper">
                  <div className="cx-mob-team-photo">
                    <div className="cx-mini-avatar avatar-1">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="User avatar"
                        className="badge-avatar"
                      />
                    </div>
                  </div>
                  <div className="cx-mob-author-info">
                    <h4 className="cx-mob-author-name">{tr.quoteAuthor}</h4>
                    <p className="cx-mob-author-sub">{tr.quoteSub}</p>
                    <div className="cx-mob-verified-badge">
                    </div>
                  </div>
                </div>
              </div>

              <div className="cx-mob-stats-card middle">
                <div className="cx-mob-stat-row">
                  <div className="cx-mob-stat-icon-box">
                    <Users size={42} />
                  </div>
                  <div className="cx-mob-stat-texts">
                    <h3 className="cx-mob-stat-number">{tr.statUsersVal}</h3>
                    <p className="cx-mob-stat-desc">{tr.statUsersLbl}</p>
                  </div>
                </div>

                <div className="cx-mob-stat-row">
                  <div className="cx-mob-stat-icon-box">
                    <TrendingUp size={42} />
                  </div>
                  <div className="cx-mob-stat-texts">
                    <h3 className="cx-mob-stat-number">{tr.statDealsVal}</h3>
                    <p className="cx-mob-stat-desc">{tr.statDealsLbl}</p>
                  </div>
                </div>

                <div className="cx-mob-stat-row">
                  <div className="cx-mob-stat-icon-box">
                    <Clock size={42} />
                  </div>
                  <div className="cx-mob-stat-texts">
                    <h3 className="cx-mob-stat-number">{tr.statTimeVal}</h3>
                    <p className="cx-mob-stat-desc">{tr.statTimeLbl}</p>
                  </div>
                </div>
              </div>

              <div className="cx-mob-trusted-section">
                <div className="cx-mob-divider-text">
                  <span>{tr.trustedText}</span>
                </div>

                <div className="cx-mob-badges-grid">
                  <img
                    src={trialbottomM}
                    alt="Cortexa"
                    className="trialbt-img"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="trial-right-column">
            <img src={trial} alt="Trial" />
          </div>
        )}
      </div>
    </div>
  );
}
