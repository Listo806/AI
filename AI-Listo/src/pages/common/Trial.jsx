import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  trackEvent,
  trackSignupConversion,
  getAttribution,
} from "../../utils/track";
import { getSetupOffer } from "../../utils/offer";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { currentSiteLanguage } from "../../i18n/currentLanguage";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import "./Common.css";

const t = {
  en: {
    title: "CREATE YOUR ACCOUNT",
    subtitle: "Get started with your free trial.",
    placeholders: {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number (Required)",
      password: "Password",
    },
    continueBtn: "CONTINUE TO CHOOSE YOUR FREE PLAN",
    loadingBtn: "CREATING ACCOUNT...",
    security: "Your information is safe and never shared.",
    errors: {
      server: "Server error. Please try again.",
      generic: "Unable to create your account.",
    },
  },

  es: {
    title: "CREA TU CUENTA",
    subtitle: "Comienza con tu prueba gratuita.",
    placeholders: {
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Número de teléfono (Obligatorio)",
      password: "Contraseña",
    },
    continueBtn: "CONTINUAR PARA ELEGIR TU PLAN GRATIS",
    loadingBtn: "CREANDO CUENTA...",
    security: "Tu información está segura y nunca se comparte.",
    errors: {
      server: "Error del servidor. Inténtalo de nuevo.",
      generic: "No se pudo crear tu cuenta.",
    },
  },

  pt: {
    title: "CRIE SUA CONTA",
    subtitle: "Comece com seu teste gratuito.",
    placeholders: {
      name: "Nome completo",
      email: "Endereço de e-mail",
      phone: "Número de telefone (Obrigatório)",
      password: "Senha",
    },
    continueBtn: "CONTINUAR PARA ESCOLHER SEU PLANO GRÁTIS",
    loadingBtn: "CRIANDO CONTA...",
    security: "Suas informações estão seguras e nunca são compartilhadas.",
    errors: {
      server: "Erro no servidor. Tente novamente.",
      generic: "Não foi possível criar sua conta.",
    },
  },
};


export default function StartTrial() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  // Capture the actual site language the visitor is registering in (URL version
  // first), not just a possibly-stale localStorage value.
  const [lang] = useState(() => currentSiteLanguage());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const tr = t[lang] || t.en;

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    trackEvent("sign_up_started", {
      source: "create_account",
    });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const attribution = getAttribution();

      // New required signup flow:
      // CTA -> Create Account -> Pricing -> Plan Review / Checkout.
      //
      // Do NOT assign a paid/free tier here. The latest backend already supports
      // an account being registered with no selected plan.
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,

        plan: null,
        billingCycle: null,
        source: "create_account",

        language: lang,
        landingPage: attribution.landingPage || null,
        utm: attribution.utm || {},
        gclid: attribution.gclid || null,
        offer: getSetupOffer() === "exit7" ? "exit7" : "standard",
      };

      const response = await fetch(
        "https://backend.cortexaaicrm.com/api/trial/start-trial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || tr.errors.generic);
      }

      // Carry account information forward without asking the customer again.
      localStorage.setItem("trialUserId", data.userId);
      localStorage.setItem("email", form.email);
      localStorage.setItem("name", form.name);
      localStorage.setItem("phone", form.phone);

      // Password must never be persisted in localStorage.
      localStorage.removeItem("password");

      // There is deliberately no plan yet.
      localStorage.removeItem("trialPlan");
      localStorage.setItem("signupFlowStage", "choose_plan");
      localStorage.setItem("signupSource", "create_account");

      if (data.accessToken) {
        apiClient.setTokens(data.accessToken, data.refreshToken);

        if (data.user) {
          localStorage.setItem("listo_user", JSON.stringify(data.user));
          setUser(data.user);
        }
      }

      trackEvent("sign_up_completed", {
        source: "create_account",
      });
      trackSignupConversion();

      // Always go to pricing after account creation.
      navigate("/pricing?from=signup", {
        replace: true,
      });
    } catch (error) {
      console.error("CREATE ACCOUNT ERROR:", error);
      alert(error?.message || tr.errors.server);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="trial-v3-page">
      <section className="trial-v3-card">
        <header className="trial-v3-header">
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>
        </header>

        <form className="trial-v3-form" onSubmit={handleSubmit}>
          <div className="trial-v3-fields">
            <label className="trial-v3-field">
              <User
                className="trial-v3-field-icon"
                size={28}
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="text"
                name="name"
                placeholder={tr.placeholders.name}
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
              />
            </label>

            <label className="trial-v3-field">
              <Mail
                className="trial-v3-field-icon"
                size={28}
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="email"
                name="email"
                placeholder={tr.placeholders.email}
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="trial-v3-field">
              <Phone
                className="trial-v3-field-icon"
                size={28}
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="tel"
                name="phone"
                placeholder={tr.placeholders.phone}
                autoComplete="tel"
                required
                value={form.phone}
                onChange={handleChange}
              />
            </label>

            <label className="trial-v3-field">
              <LockKeyhole
                className="trial-v3-field-icon"
                size={28}
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={tr.placeholders.password}
                autoComplete="new-password"
                minLength={6}
                required
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="trial-v3-password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={27} />
                ) : (
                  <Eye size={27} />
                )}
              </button>
            </label>
          </div>

          <button
            type="submit"
            className="trial-v3-submit"
            disabled={loading}
          >
            <span className="trial-v3-submit-main">
              <LockKeyhole size={27} strokeWidth={2} />
              <strong>
                {loading ? tr.loadingBtn : tr.continueBtn}
              </strong>
            </span>

            <ArrowRight
              className="trial-v3-submit-arrow"
              size={34}
              strokeWidth={2}
            />
          </button>

          <div className="trial-v3-security">
            <ShieldCheck size={30} strokeWidth={2} />
            <p>{tr.security}</p>
          </div>
        </form>
      </section>
    </main>
  );
}