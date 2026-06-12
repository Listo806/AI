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
} from "lucide-react";
import "./Common.css";
import trial from "../../assets/cortexa/trial-right.png";
import trialogo from "../../assets/cortexa/trial-logo.png";
import headlogoM from "../../assets/cortexa/headlogotran.png";

const t = {
  en: {
    title: "Start Getting AI-Powered Leads — 24/7",
    desc: "CORTEXA is an AI-powered CRM built for real estate agents and teams. Capture, qualify, and close leads automatically — without manual follow-up.",
    f1: "Capture and qualify leads automatically — no missed opportunities",
    f2: "AI follows up instantly via text, WhatsApp, and more",
    f3: "Smart pipelines track every deal in real time",
    f4: "Access your full dashboard immediately after activation",
    placeholders: {
      name: "Full Name",
      email: "Work Email",
      phone: "Phone Number (Required)",
      password: "Password"
    },
    btnNormal: "Continue to Secure Checkout",
    btnLoading: "Creating Account...",
    footerNote: "You will be redirected to secure checkout to activate your account with a one-time setup fee."
  },
  es: {
    title: "Comience a Obtener Leads con IA — 24/7",
    desc: "CORTEXA es un CRM potenciado por IA diseñado para agentes y equipos inmobiliarios. Capture, califique y cierre leads automáticamente, sin seguimiento manual.",
    f1: "Capture y califique leads automáticamente — sin oportunidades perdidas",
    f2: "La IA realiza el seguimiento instantáneo por mensaje, WhatsApp y más",
    f3: "Pipelines inteligentes rastrean cada trato en tiempo real",
    f4: "Acceda a su panel completo inmediatamente después de la activación",
    placeholders: {
      name: "Nombre Completo",
      email: "Correo Electrónico de Trabajo",
      phone: "Número de Teléfono (Obligatorio)",
      password: "Contraseña"
    },
    btnNormal: "Continuar al Pago Seguro",
    btnLoading: "Creando Cuenta...",
    footerNote: "Será redirigido al pago seguro para activar su cuenta con una tarifa de configuración de pago único."
  },
  pt: {
    title: "Comece a Receber Leads com IA — 24/7",
    desc: "CORTEXA é um CRM alimentado por IA desenvolvido para corretores e equipes imobiliárias. Capture, qualifique e feche leads automaticamente — sem acompanhamento manual.",
    f1: "Capture e qualifique leads automaticamente — sem oportunidades perdidas",
    f2: "A IA faz o acompanhamento instantâneo via SMS, WhatsApp e muito mais",
    f3: "Pipelines inteligentes rastreiam cada negociação em tempo real",
    f4: "Acesse seu painel completo imediatamente após a ativação",
    placeholders: {
      name: "Nome Completo",
      email: "E-mail de Trabalho",
      phone: "Número de Telefone (Obrigatório)",
      password: "Senha"
    },
    btnNormal: "Continuar para o Pagamento Seguro",
    btnLoading: "Criando Conta...",
    footerNote: "Você será redirecionado para o pagamento seguro para ativar sua conta com uma taxa de configuração de pagamento único."
  }
};

export default function StartTrial() {
  const [lang, setLang] = useState("en"); 
  const [langOpen, setLangOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
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
              
              <div className="m-header-right">
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
                      <button
                        type="button"
                        onClick={() => {
                          setLang("en");
                          setLangOpen(false);
                        }}
                      >
                        English
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLang("es");
                          setLangOpen(false);
                        }}
                      >
                        Español
                      </button>

                      <button
                        type="button"
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
              </div>
            </header>
          ) : (
            <div className="trial-header">
              <div className="trial-logo-area">
                <div className="trial-logo-box">
                  <span className="trial-logo-inner-c">
                    <img src={trialogo} alt="CORTEXA" />
                  </span>
                </div>
                <span className="trial-logo-text">CORTEXA</span>
                <span className="trial-logo-divider">|</span>
                <span className="trial-logo-badge">AI OS</span>
              </div>
            </div>
          )}

          <h1 className="trial-title">{tr.title}</h1>
          <p className="trial-desc">{tr.desc}</p>

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
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
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
        {!isMobile && (  
          <div className="trial-right-column">
            <img src={trial} alt="Trial" />
          </div>
        )}
      </div>
    </div>
  );
}