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
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import "./Trial.css";

const t = {
  en: {
    title: "CREATE YOUR ACCOUNT",
    subtitle: "Get started with your free trial.",
    mobileTitle: "Create Your Account",
    mobileSubtitle: "Get Started with Your Free Trial.",
    mobileContinueBtn: "Continue to Choose Your Plan",
    mobileSecurity: "Secure checkout powered by Paddle",
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
    mobileTitle: "Crea Tu Cuenta",
    mobileSubtitle: "Comienza con Tu Prueba Gratuita.",
    mobileContinueBtn: "Continuar para Elegir Tu Plan",
    mobileSecurity: "Pago seguro procesado por Paddle",
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
    mobileTitle: "Crie Sua Conta",
    mobileSubtitle: "Comece com Seu Teste Grátis.",
    mobileContinueBtn: "Continuar para Escolher Seu Plano",
    mobileSecurity: "Pagamento seguro processado pela Paddle",
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

  const searchParams = new URLSearchParams(window.location.search);

  const pendingPlanIntent = String(
    localStorage.getItem("pendingPlanIntent") || "",
  )
    .trim()
    .toLowerCase();

  const pendingBillingCycle = String(
    localStorage.getItem("pendingBillingCycle") || "",
  )
    .trim()
    .toLowerCase();

  const validPendingPlan = ["free", "solo", "business", "scale"].includes(
    pendingPlanIntent,
  )
    ? pendingPlanIntent
    : null;

  const cameFromPricing = searchParams.get("from") === "pricing";

  const isFreeAccessFlow =
    searchParams.get("flow") === "free-access" ||
    searchParams.get("plan") === "free";
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

      const registrationPlan = isFreeAccessFlow
        ? "free"
        : cameFromPricing
          ? validPendingPlan
          : null;

      const registrationBilling =
        registrationPlan && registrationPlan !== "free"
          ? ["monthly", "annual"].includes(pendingBillingCycle)
            ? pendingBillingCycle
            : "monthly"
          : null;

      /*
       * QUAN TRỌNG:
       * Không cho phép customer-facing signup tạo user plan = NULL.
       */
      if (!registrationPlan) {
        navigate("/pricing", {
          replace: true,
        });

        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,

        plan: registrationPlan,
        billingCycle: registrationBilling,

        source: isFreeAccessFlow ? "free_access" : "pricing_signup",

        language: lang,

        landingPage: attribution.landingPage || null,

        registrationPage: window.location.pathname + window.location.search,

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

      if (data.accessToken) {
        apiClient.setTokens(data.accessToken, data.refreshToken);

        if (data.user) {
          localStorage.setItem("listo_user", JSON.stringify(data.user));
          setUser(data.user);
        }
      }

      if (isFreeAccessFlow) {
        if (!data.accessToken) {
          throw new Error(
            "Account was created but automatic login failed. Please log in and try again.",
          );
        }

        const freeResult = await apiClient.request("/trial/select-plan", {
          method: "POST",
          body: JSON.stringify({
            plan: "free",
            billingCycle: null,
          }),
        });

        if (!freeResult?.success) {
          throw new Error(
            freeResult?.message || "Unable to activate the Free plan.",
          );
        }

        const authenticatedUser = freeResult?.user || data.user;

        if (authenticatedUser) {
          localStorage.setItem("listo_user", JSON.stringify(authenticatedUser));
          setUser(authenticatedUser);
        }

        localStorage.setItem("trialPlan", "free");
        localStorage.setItem("signupFlowStage", "free_active");
        localStorage.setItem("signupSource", "free_access");
        localStorage.removeItem("pendingPlanIntent");
        localStorage.removeItem("pendingBillingCycle");

        trackEvent("sign_up_completed", {
          source: "free_access",
          plan: "free",
        });
        trackSignupConversion();

        navigate("/dashboard/ai-cortexa-setup", {
          replace: true,
        });
        return;
      }

      if (cameFromPricing && validPendingPlan) {
        localStorage.setItem("trialPlan", validPendingPlan);

        localStorage.setItem("signupFlowStage", "plan_selected");

        localStorage.setItem("signupSource", "pricing_signup");

        localStorage.removeItem("pendingPlanIntent");

        localStorage.removeItem("pendingBillingCycle");

        trackEvent("sign_up_completed", {
          source: "pricing_signup",
          plan: validPendingPlan,
        });

        trackSignupConversion();

        if (validPendingPlan === "free") {
          navigate("/dashboard/ai-cortexa-setup", {
            replace: true,
          });

          return;
        }

        navigate(
          `/checkout?plan=${encodeURIComponent(
            validPendingPlan,
          )}&billing=${encodeURIComponent(
            registrationBilling || "monthly",
          )}&source=trial`,
          {
            replace: true,
          },
        );

        return;
      }

      navigate("/pricing", {
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
    <main className="cxs-page">
      {/* Card is a <div>, not a <section>: a global `section { padding:0!important }`
          rule elsewhere in the app would otherwise zero out the card padding. */}
      <div className="cxs-card">
        <div className="cxs-brand">
          <img src={headlogoImg} alt="Cortexa" />
        </div>

        <header className="cxs-header">
          {isFreeAccessFlow && (
            <span className="cxs-eyebrow">
              <Sparkles strokeWidth={2.4} aria-hidden="true" />
              Free Forever Plan
            </span>
          )}
          <h1>{tr.mobileTitle}</h1>
          <p>
            {isFreeAccessFlow ? (
              <>
                Set up your <b>Free Forever</b> account. No card, no commitment.
              </>
            ) : (
              tr.subtitle
            )}
          </p>
        </header>

        <form className="cxs-form" onSubmit={handleSubmit}>
          <div className="cxs-fields">
            <label className="cxs-field">
              <User className="cxs-field-icon" strokeWidth={2} aria-hidden="true" />
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

            <label className="cxs-field">
              <Mail className="cxs-field-icon" strokeWidth={2} aria-hidden="true" />
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

            <label className="cxs-field">
              <Phone className="cxs-field-icon" strokeWidth={2} aria-hidden="true" />
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

            <label className="cxs-field">
              <LockKeyhole className="cxs-field-icon" strokeWidth={2} aria-hidden="true" />
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
                className="cxs-eye"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </label>
          </div>

          <button type="submit" className="cxs-submit" disabled={loading}>
            {loading ? (
              <strong>{tr.loadingBtn}</strong>
            ) : (
              <>
                <strong>
                  {isFreeAccessFlow ? "Create My Free Account" : tr.continueBtn}
                </strong>
                <ArrowRight className="cxs-submit-arrow" strokeWidth={2.2} aria-hidden="true" />
              </>
            )}
          </button>

          {isFreeAccessFlow && (
            <div className="cxs-trust">
              <span>
                <CheckCircle2 strokeWidth={2.4} aria-hidden="true" />
                No credit card
              </span>
              <span>
                <CheckCircle2 strokeWidth={2.4} aria-hidden="true" />
                Free forever
              </span>
              <span>
                <CheckCircle2 strokeWidth={2.4} aria-hidden="true" />
                Cancel anytime
              </span>
            </div>
          )}

          <div className="cxs-security">
            <ShieldCheck strokeWidth={2} aria-hidden="true" />
            <p>
              {isFreeAccessFlow
                ? "Your information is safe and never shared."
                : tr.security}
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
